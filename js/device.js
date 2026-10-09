// ═══════════════════════════════════════════════════════════════
// Device detection — sets classes on <html> so CSS can adapt the
// layout/controls to phones, tablets and desktops (touch or mouse).
// Loaded in <head> so the classes exist before first paint.
//
//   html.device-mobile | device-tablet | device-desktop
//   html.is-touch | no-touch        (touch input available?)
//   html.pointer-coarse             (primary pointer is coarse)
//   html.is-landscape | is-portrait
//   --vw / --vh                     (live viewport size in px)
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var html = document.documentElement;
  var ua = navigator.userAgent || "";
  var maxTouch = navigator.maxTouchPoints || 0;
  var hasTouch = "ontouchstart" in window || maxTouch > 0;
  var coarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  var uaMobile = /Mobi|Android|iPhone|iPod|Windows Phone|IEMobile|BlackBerry/i.test(ua);
  var uaTablet = /iPad|Tablet|PlayBook|Silk|Kindle|(Android(?!.*Mobile))/i.test(ua);

  function classify() {
    var w = window.innerWidth || html.clientWidth;
    var h = window.innerHeight || html.clientHeight;

    var device = uaTablet || (hasTouch && w >= 768 && !uaMobile)
      ? "tablet"
      : uaMobile || w < 768
        ? "mobile"
        : "desktop";

    html.classList.remove("device-mobile", "device-tablet", "device-desktop");
    html.classList.add("device-" + device);
    html.classList.toggle("is-touch", hasTouch);
    html.classList.toggle("no-touch", !hasTouch);
    html.classList.toggle("pointer-coarse", coarse);
    html.classList.toggle("is-landscape", w > h);
    html.classList.toggle("is-portrait", w <= h);
    html.setAttribute("data-device", device);

    html.style.setProperty("--vw", w + "px");
    html.style.setProperty("--vh", h + "px");
  }

  classify();

  var raf = 0;
  function onResize() {
    if (raf) window.cancelAnimationFrame(raf);
    raf = window.requestAnimationFrame(classify);
  }

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });
})();
