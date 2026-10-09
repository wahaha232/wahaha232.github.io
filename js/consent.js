// ═══════════════════════════════════════════════════════════════
// PlayHub — Cookie consent banner + Google Consent Mode v2
//
// Loaded synchronously BEFORE the AdSense loader so the default
// consent state is applied before any Google script runs.
//
//   - Default: all ad/analytics storage "denied".
//   - Accept / Decline buttons in a small banner store the choice
//     in localStorage and update Consent Mode accordingly.
//
// NOTE: for full EEA/UK compliance Google also recommends a Google-
// certified CMP configured in the AdSense account. This script only
// provides Consent Mode defaults + a lightweight notice.
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

  // Google Consent Mode v2 — denied until the visitor accepts.
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = window.gtag || gtag;

  var granted = stored === "granted";
  gtag("consent", "default", {
    ad_storage: granted ? "granted" : "denied",
    ad_user_data: granted ? "granted" : "denied",
    ad_personalization: granted ? "granted" : "denied",
    analytics_storage: granted ? "granted" : "denied",
    wait_for_update: 500
  });

  function update(state) {
    gtag("consent", "update", {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state
    });
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
    update(state);
    if (state === "granted") injectAdNetworks();
    var el = document.getElementById("cookie-consent");
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function buildBanner() {
    if (stored === "granted" || stored === "denied") return;
    if (document.getElementById("cookie-consent")) return;

    var banner = document.createElement("div");
    banner.id = "cookie-consent";
    banner.className = "cookie-consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.innerHTML =
      '<p class="cookie-consent__text">We use cookies for advertising ' +
      "(Google AdSense) and to understand site usage. See our " +
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

  // Third-party ad networks, loaded ONLY after the visitor accepts.
  // Each network renders in its own dedicated iframe (srcdoc) so its
  // document.write cannot overwrite the PlayHub page, and each frame is
  // auto-sized to its content so every ad is visible with no scrollbar.
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

  ready(function () {
    if (stored === "granted") {
      injectAdNetworks();
    } else if (stored !== "denied") {
      buildBanner();
    }
  });
})();
