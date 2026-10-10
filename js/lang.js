// Remembers the visitor's language choice (EN/ES/FR) in localStorage and
// marks it on the language switch. Intentionally does NOT auto-redirect,
// to avoid interfering with search-engine crawling.
(function () {
  "use strict";

  var KEY = "playhub-lang";
  var KNOWN = ["en", "es", "fr"];

  function pageLang() {
    return (document.documentElement.lang || "en").slice(0, 2);
  }

  function linkLang(a) {
    var l = a.getAttribute("hreflang") || a.getAttribute("lang");
    if (!l && a.hasAttribute("aria-current")) l = pageLang();
    return l || "";
  }

  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a.site-nav__link--lang") : null;
    if (!a) return;
    var l = linkLang(a);
    if (KNOWN.indexOf(l) !== -1) {
      try {
        window.localStorage.setItem(KEY, l);
      } catch (err) {
        /* storage unavailable */
      }
    }
  });

  try {
    var pref = window.localStorage.getItem(KEY);
    if (pref && KNOWN.indexOf(pref) !== -1) {
      var links = document.querySelectorAll("a.site-nav__link--lang");
      for (var i = 0; i < links.length; i++) {
        if (linkLang(links[i]) === pref) links[i].setAttribute("data-preferred", "");
      }
    }
  } catch (e2) {
    /* ignore */
  }
})();
