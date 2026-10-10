// ═══════════════════════════════════════════════════════════════
// PlayHub — Cookie consent banner + gating for third-party ad networks
//
// This site does NOT use Google AdSense or Google Analytics.
// Advertising is delivered by third-party ad networks that are injected
// ONLY after the visitor accepts. Each network renders in its own iframe
// (srcdoc) so its document.write cannot overwrite the page, and each frame
// is auto-sized to its content so every ad is fully visible (no scrollbar).
//
// The visitor's choice is stored in localStorage (key: playhub-consent-v1).
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var KEY = "playhub-consent-v1";

  var stored = null;
  try {
    stored = window.localStorage.getItem(KEY);
  } catch (e) {
    stored = null;
  }

  function privacyHref() {
    // Pages live one level deep in /es, /fr, /games; the root-level
    // pages (index.html, board-games.html, …) are at depth 0.
    var parts = window.location.pathname.split("/").filter(Boolean);
    var last = parts.length ? parts[parts.length - 1] : "";
    var depth = last.indexOf(".") !== -1 ? parts.length - 1 : parts.length;
    return new Array(depth + 1).join("../") + "privacy.html";
  }

  function setChoice(state) {
    try {
      window.localStorage.setItem(KEY, state);
    } catch (e) {
      /* storage unavailable — still apply for this page view */
    }
    if (state === "granted") injectAdNetworks();
    var el = document.getElementById("cookie-consent");
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function buildBanner(force) {
    if (!force && (stored === "granted" || stored === "denied")) return;
    var existing = document.getElementById("cookie-consent");
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var banner = document.createElement("div");
    banner.id = "cookie-consent";
    banner.className = "cookie-consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.innerHTML =
      '<p class="cookie-consent__text">We use cookies and similar technologies for ' +
      "advertising and to understand basic site usage. See our " +
      '<a href="' + privacyHref() + '">Privacy Policy</a>.</p>' +
      '<div class="cookie-consent__actions">' +
      '<button type="button" class="cookie-consent__btn cookie-consent__btn--ghost" data-consent="denied">Decline</button>' +
      '<button type="button" class="cookie-consent__btn cookie-consent__btn--primary" data-consent="granted">Accept</button>' +
      "</div>";

    banner.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-consent]");
      if (!btn) return;
      setChoice(btn.getAttribute("data-consent"));
    });

    document.body.appendChild(banner);
  }

  // Third-party ad networks (loaded ONLY after the visitor accepts).
  var AD_NETWORKS = [
    '<script async="async" data-cfasync="false" src="https://pl26441868.profitableratecpmnetwork.com/7d9bb8a39fc580ee58de14d8a8e63eab/invoke.js"><\/script>' +
      '<div id="container-7d9bb8a39fc580ee58de14d8a8e63eab"></div>',
    '<script>atOptions = {"key":"9880b603e09cd45358e7c041df1e827e","format":"iframe","height":250,"width":300,"params":{}};<\/script>' +
      '<script src="https://www.highrevenueformat.com/9880b603e09cd45358e7c041df1e827e/invoke.js"><\/script>'
  ];

  function adDoc(inner) {
    return (
      '<!doctype html><html><head><meta charset="utf-8">' +
      "<style>html,body{margin:0;padding:0;background:transparent;text-align:center;overflow:hidden}</style>" +
      "</head><body>" +
      inner +
      "</body></html>"
    );
  }

  function sizeFrame(frame) {
    try {
      var doc = frame.contentDocument;
      if (!doc || !doc.body) return;
      var h = Math.max(
        doc.documentElement ? doc.documentElement.scrollHeight : 0,
        doc.body.scrollHeight
      );
      if (h > 0) frame.style.height = h + "px";
    } catch (e) {
      /* cross-document access not allowed — keep the default height */
    }
  }

  function injectAdNetworks() {
    if (!document.body) return;
    if (document.querySelector("[data-thirdparty-ads]")) return;

    var host =
      document.querySelector("[data-thirdparty-ads-host]") ||
      document.querySelector(".ad-slot--leaderboard") ||
      document.querySelector(".ad-slot");

    var wrap = document.createElement("div");
    wrap.className = "thirdparty-ads";
    wrap.setAttribute("data-thirdparty-ads", "");

    var frames = [];
    AD_NETWORKS.forEach(function (inner) {
      var frame = document.createElement("iframe");
      frame.className = "thirdparty-ads__frame";
      frame.setAttribute("title", "Advertisement");
      frame.setAttribute("loading", "lazy");
      frame.setAttribute("scrolling", "no");
      frame.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
      frame.srcdoc = adDoc(inner);
      frame.addEventListener("load", function () {
        sizeFrame(frame);
      });
      wrap.appendChild(frame);
      frames.push(frame);
    });

    if (host && host.parentNode && host !== document.body) {
      host.parentNode.insertBefore(wrap, host);
    } else {
      document.body.appendChild(wrap);
    }

    // Keep every frame sized to its content as the (async) ads load/grow.
    var ticks = 0;
    var timer = window.setInterval(function () {
      frames.forEach(sizeFrame);
      if (++ticks > 24) window.clearInterval(timer);
    }, 500);

    if (window.ResizeObserver) {
      frames.forEach(function (frame) {
        try {
          new window.ResizeObserver(function () {
            sizeFrame(frame);
          }).observe(frame.contentDocument.documentElement);
        } catch (e) {
          /* ignore */
        }
      });
    }
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  // Allow other UI (e.g. a "cookie settings" button) to re-open the banner.
  window.PlayHubConsent = {
    open: function () {
      buildBanner(true);
    }
  };

  ready(function () {
    if (stored === "granted") {
      injectAdNetworks();
    } else if (stored !== "denied") {
      buildBanner();
    }

    var buttons = document.querySelectorAll("[data-cookie-settings]");
    for (var i = 0; i < buttons.length; i++) {
      (function (btn) {
        btn.addEventListener("click", function (event) {
          event.preventDefault();
          buildBanner(true);
        });
      })(buttons[i]);
    }
  });
})();
