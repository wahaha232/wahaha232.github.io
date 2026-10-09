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

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(buildBanner);
})();
