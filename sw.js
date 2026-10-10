// ═══════════════════════════════════════════════════════════════
// PlayHub service worker (conservative)
//
// Strategy: NETWORK-FIRST for same-origin requests, falling back to the
// cache only when the network fails. Online visitors therefore always get
// fresh files (no stale content); the cache is purely an offline fallback.
//
// - Only same-origin GET requests are handled; cross-origin requests
//   (ad networks, Google Fonts, YouTube, etc.) are never intercepted or
//   cached.
// - Bump CACHE_VERSION on each release so old caches are deleted on activate.
// - Offline behaviour is NOT guaranteed/tested (see reports/PLAYHUB_PHASE5_PWA_REPORT.md).
// - To disable: unregister the worker / delete the "playhub-" caches.
// ═══════════════════════════════════════════════════════════════

var CACHE_VERSION = "playhub-v1";

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) {
              return k.indexOf("playhub-") === 0 && k !== CACHE_VERSION;
            })
            .map(function (k) {
              return caches.delete(k);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin (ads/fonts/embeds)

  event.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (cache) {
            cache.put(req, copy).catch(function () {});
          });
        }
        return res;
      })
      .catch(function () {
        return caches.match(req);
      })
  );
});
