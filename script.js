/* =========================================================
   Personal website — theme + language + UI behaviour
   - Injects shared header/footer from components/ folder
   - Dark / Light mode toggle (remembered)
   - Language: English (default) ⇄ Myanmar
   ========================================================= */

(function () {
  "use strict";

  var THEME_KEY = "site-theme";
  var LANG_KEY = "site-lang";
  var lang = localStorage.getItem(LANG_KEY) || "en";

  /* Current page name: home / services / apps / download / performance / about / contact */
  var file = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
  if (file === "") file = "home";

  var titles = {
    home:        { en: "KXK",                           my: "KXK" },
    services:    { en: "Services — KXK",                my: "ဝန်ဆောင်မှုများ — KXK" },
    apps:        { en: "Apps — KXK",                    my: "အက်ပ်များ — KXK" },
    download:    { en: "Download — KXK",                my: "ဒေါင်းလုဒ် — KXK" },
    performance: { en: "Performance — KXK",             my: "စွမ်းဆောင်ရည် — KXK" },
    about:       { en: "About — KXK",                   my: "အကြောင်း — KXK" },
    contact:     { en: "Contact — KXK",                 my: "ဆက်သွယ်ရန် — KXK" }
  };
  var pageTitle = titles[file] || titles.index;

  var SUN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  var MOON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  /* ---------- Theme ---------- */
  function getInitialTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  }

  var theme = getInitialTheme();

  function applyTheme(t) {
    theme = t;
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    /* Button shows the mode it will switch to */
    var btn = document.getElementById("themeToggle");
    if (btn) {
      btn.innerHTML = t === "dark" ? SUN_SVG : MOON_SVG;
      btn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
  }

  function toggleTheme() {
    applyTheme(theme === "dark" ? "light" : "dark");
  }

  /* ---------- Language ---------- */
  function applyLang(l) {
    var els = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < els.length; i++) {
      var text = els[i].getAttribute(l === "en" ? "data-en" : "data-mm");
      if (text !== null) {
        els[i].textContent = text;
      }
    }

    document.documentElement.lang = l;
    document.title = pageTitle[l];

    var toggle = document.getElementById("langToggle");
    if (toggle) {
      toggle.textContent = l === "en" ? "မြန်" : "EN";
    }
  }

  function toggleLang() {
    lang = lang === "en" ? "my" : "en";
    localStorage.setItem(LANG_KEY, lang);
    applyLang(lang);
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    var menuBtn = document.getElementById("menuBtn");
    var navLinks = document.getElementById("navLinks");
    if (!menuBtn || !navLinks) return;

    menuBtn.addEventListener("click", function () {
      navLinks.classList.toggle("open");
    });

    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        navLinks.classList.remove("open");
      }
    });
  }

  /* Highlight the current page in the nav */
  function setActiveNav() {
    var links = document.querySelectorAll(".nav-links a[data-page]");
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute("data-page") === file) {
        links[i].classList.add("active");
      }
    }
  }

  /* Scroll reveal */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || items.length === 0) {
      for (var i = 0; i < items.length; i++) items[i].classList.add("visible");
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* Footer year */
  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* Load shared header/footer, then start everything */
  function injectComponents(done) {
    var headerEl = document.getElementById("siteHeader");
    var footerEl = document.getElementById("siteFooter");

    var total = 0;
    var finished = 0;

    function check() {
      if (++finished === total) done();
    }

    function loadInto(el, url) {
      total++;
      fetch(url)
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.text();
        })
        .then(function (html) { el.innerHTML = html; })
        .catch(function () {
          el.innerHTML = '<p class="preview-note">Preview ကြည့်ဖို့ local server လိုပါတယ် — README.md ကို ကြည့်ပါ။</p>';
        })
        .then(check);
    }

    if (headerEl) loadInto(headerEl, "components/header.html");
    if (footerEl) loadInto(footerEl, "components/footer.html");
    if (total === 0) done();
  }

  /* Boot */
  injectComponents(function () {
    applyTheme(theme);

    var themeBtn = document.getElementById("themeToggle");
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

    var toggle = document.getElementById("langToggle");
    if (toggle) toggle.addEventListener("click", toggleLang);

    applyLang(lang);
    setActiveNav();
    initMenu();
    initReveal();
    initYear();
  });
})();
