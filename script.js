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
    posts:       { en: "Posts — KXK",                   my: "ပို့စ်များ — KXK" },
    services:    { en: "Services — KXK",                my: "ဝန်ဆောင်မှုများ — KXK" },
    apps:        { en: "Apps — KXK",                    my: "အက်ပ်များ — KXK" },
    download:    { en: "Download — KXK",                my: "ဒေါင်းလုဒ် — KXK" },
    performance: { en: "Performance — KXK",             my: "စွမ်းဆောင်ရည် — KXK" },
    about:       { en: "About — KXK",                   my: "အကြောင်း — KXK" },
    contact:     { en: "Contact — KXK",                 my: "ဆက်သွယ်ရန် — KXK" }
  };
  var pageTitle = titles[file] || { en: "KXK", my: "KXK" };

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
    initCarousel();
    initLightbox();
  });

  /* Play Store style screenshot carousel: swipe / drag / arrows */
  function initCarousel() {
    var tracks = document.querySelectorAll(".carousel-track");
    for (var i = 0; i < tracks.length; i++) {
      (function (track) {
        var prev = track.parentElement.querySelector(".carousel-btn.prev");
        var next = track.parentElement.querySelector(".carousel-btn.next");

        function scrollByAmount(dir) {
          track.scrollBy({ left: dir * Math.round(track.clientWidth * 0.8), behavior: "smooth" });
        }
        if (next) next.addEventListener("click", function () { scrollByAmount(1); });
        if (prev) prev.addEventListener("click", function () { scrollByAmount(-1); });

        var down = false, startX = 0, startScroll = 0, moved = 0;
        track.addEventListener("pointerdown", function (e) {
          if (e.pointerType !== "mouse") return;
          down = true; moved = 0;
          startX = e.clientX;
          startScroll = track.scrollLeft;
        });
        track.addEventListener("pointermove", function (e) {
          if (!down) return;
          var dx = e.clientX - startX;
          moved = Math.max(moved, Math.abs(dx));
          track.scrollLeft = startScroll - dx;
        });
        function up() { down = false; }
        track.addEventListener("pointerup", up);
        track.addEventListener("pointercancel", up);
        track.addEventListener("click", function (e) { if (moved > 6) e.preventDefault(); });
      })(tracks[i]);
    }
  }

  /* Lightbox: tap any screenshot to view it enlarged */
  function initLightbox() {
    var box = document.getElementById("lightbox");
    if (!box) return;

    var img = box.querySelector(".lightbox-img");
    var prevBtn = box.querySelector(".lightbox-btn.prev");
    var nextBtn = box.querySelector(".lightbox-btn.next");
    var closeBtn = box.querySelector(".lightbox-close");
    var group = [];
    var index = 0;

    function openAt(i) {
      if (group.length === 0) return;
      index = (i + group.length) % group.length;
      img.src = group[index].src;
      img.alt = group[index].alt || "Screenshot preview";
      box.classList.add("open");
      box.setAttribute("aria-hidden", "false");
    }

    function close() {
      box.classList.remove("open");
      box.setAttribute("aria-hidden", "true");
      img.src = "";
    }

    /* wire up every screenshot group (carousel + plain shots) */
    var containers = document.querySelectorAll(".carousel-track, .shots");
    for (var c = 0; c < containers.length; c++) {
      (function (container) {
        var imgs = container.querySelectorAll("img");
        for (var k = 0; k < imgs.length; k++) {
          (function (im) {
            im.style.cursor = "zoom-in";
            im.addEventListener("click", function (e) {
              e.preventDefault();
              group = [];
              for (var g = 0; g < imgs.length; g++) group.push(imgs[g]);
              for (var find = 0; find < group.length; find++) {
                if (group[find] === im) { openAt(find); break; }
              }
            });
          })(imgs[k]);
        }
      })(containers[c]);
    }

    /* service sub-headings open their sample screenshots (services page) */
    var sampleButtons = document.querySelectorAll(".service-sub[data-samples]");
    for (var s = 0; s < sampleButtons.length; s++) {
      (function (btn) {
        btn.addEventListener("click", function () {
          var container = document.querySelector(btn.getAttribute("data-samples"));
          if (!container) return;
          var imgs = container.querySelectorAll("img");
          group = [];
          for (var g = 0; g < imgs.length; g++) group.push(imgs[g]);
          openAt(0);
        });
      })(sampleButtons[s]);
    }

    if (prevBtn) prevBtn.addEventListener("click", function (e) { e.stopPropagation(); openAt(index - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function (e) { e.stopPropagation(); openAt(index + 1); });
    if (closeBtn) closeBtn.addEventListener("click", close);
    box.addEventListener("click", function (e) { if (e.target === box) close(); });

    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") openAt(index - 1);
      if (e.key === "ArrowRight") openAt(index + 1);
    });

    /* swipe on touch devices */
    var startX = null;
    box.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) openAt(index + 1); else openAt(index - 1);
      }
      startX = null;
    }, { passive: true });
  }
})();
