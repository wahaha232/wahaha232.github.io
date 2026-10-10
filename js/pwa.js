// Registers the PlayHub service worker (see /sw.js). Registration failure is
// ignored so it never affects normal browsing. Loaded on every page.
(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", function () {
    try {
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    } catch (e) {
      /* ignore */
    }
  });
})();
