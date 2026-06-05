/* ============================================================
   enhance.js
   Modern Minimal Gmeek Enhancements

   Important:
   - All previous custom TOC features have been removed.
   - TOC is now handled by:
     https://blog.meekdai.com/Gmeek/plugins/articletoc.js

   Features:
   1. Safe DOM ready helper
   2. Remove old notice board
   3. Frosted header scroll state
   4. Homepage article card enhancement
   5. Article reading info
   6. External links and lazy images
   7. Copy heading link
   8. Reading progress bar
   9. Back to top button
   10. Lightweight dark-mode observer compatibility
   ============================================================ */

(function () {
  "use strict";

  /* ------------------------------
     1. Helpers
  ------------------------------ */

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait);
    };
  }

  function throttle(fn, wait) {
    var ticking = false;
    var lastArgs;
    return function () {
      lastArgs = arguments;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          fn.apply(null, lastArgs);
          ticking = false;
        });
      }
    };
  }

  function isPostPage() {
    return !!$("#postBody") || !!$(".markdown-body");
  }

  function isHomePage() {
    var path = location.pathname.replace(/\/+$/, "");
    return path === "" || path === "/" || /index\.html?$/i.test(path);
  }

  function getPostBody() {
    return $("#postBody") || $(".markdown-body");
  }

  /* ------------------------------
     2. Remove Old Notice Board
  ------------------------------ */

  function removeNoticeBoard() {
    var selectors = [
      ".luliy-announce",
      ".announce-bar",
      "#gmeek-notice",
      ".gmeek-notice",
      ".notice-board"
    ];

    selectors.forEach(function (selector) {
      $$(selector).forEach(function (el) {
        el.remove();
      });
    });

    /**
     * Previous scripts may inject notice asynchronously.
     * Keep a short observer, then disconnect for performance.
     */
    var observer = new MutationObserver(function () {
      selectors.forEach(function (selector) {
        $$(selector).forEach(function (el) {
          el.remove();
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(function () {
      observer.disconnect();
    }, 6000);
  }

  /* ------------------------------
     3. Frosted Header Scroll State
  ------------------------------ */

  function initHeaderState() {
    var update = throttle(function () {
      if (window.scrollY > 8) {
        document.documentElement.classList.add("gmeek-header-scrolled");
      } else {
        document.documentElement.classList.remove("gmeek-header-scrolled");
      }
    }, 80);

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ------------------------------
     4. Homepage Article Card Enhancement
  ------------------------------ */

  function enhanceHomeCards() {
    if (!isHomePage()) return;

    var cardSelectors = [
      ".post-item",
      ".postItem",
      ".issue-item",
      ".Box-row"
    ];

    var cards = [];

    cardSelectors.forEach(function (selector) {
      $$(selector).forEach(function (el) {
        if (cards.indexOf(el) === -1) cards.push(el);
      });
    });

    cards.forEach(function (card) {
      if (card.classList.contains("gmeek-modern-card")) return;

      card.classList.add("gmeek-modern-card");

      var titleLink =
        card.querySelector("a.Link--primary") ||
        card.querySelector("a.h4") ||
        card.querySelector("h1 a, h2 a, h3 a") ||
        card.querySelector("a");

      if (titleLink && !titleLink.classList.contains("gmeek-modern-card-title")) {
        titleLink.classList.add("gmeek-modern-card-title");
      }

      if (!card.querySelector(".gmeek-modern-card-meta")) {
        var meta = document.createElement("div");
        meta.className = "gmeek-modern-card-meta";

        var timeText = "";
        var timeEl =
          card.querySelector("relative-time") ||
          card.querySelector("time");

        if (timeEl) {
          timeText = timeEl.textContent.trim() || timeEl.getAttribute("datetime") || "";
        }

        var labels = card.querySelectorAll(".Label").length;

        var readText = "";
        var rawText = card.textContent || "";
        var words = rawText.replace(/\s+/g, "").length;
        if (words > 0) {
          readText = Math.max(1, Math.ceil(words / 500)) + " min";
        }

        if (timeText) {
          var timeSpan = document.createElement("span");
          timeSpan.textContent = "🗓️ " + timeText;
          meta.appendChild(timeSpan);
        }

        if (labels) {
          var labelSpan = document.createElement("span");
          labelSpan.textContent = "🏷️ " + labels + " tags";
          meta.appendChild(labelSpan);
        }

        if (readText) {
          var readSpan = document.createElement("span");
          readSpan.textContent = "⏱️ " + readText;
          meta.appendChild(readSpan);
        }

        if (meta.children.length) {
          card.appendChild(meta);
        }
      }
    });
  }

  function observeHomeCards() {
    if (!isHomePage()) return;

    enhanceHomeCards();

    var target =
      $(".post-list") ||
      $(".postList") ||
      $("#gmeek-post-list") ||
      $(".gmeek-post-list") ||
      $(".application-main") ||
      document.body;

    var apply = debounce(enhanceHomeCards, 120);

    var observer = new MutationObserver(apply);
    observer.observe(target, {
      childList: true,
      subtree: true
    });

    setTimeout(function () {
      observer.disconnect();
    }, 10000);
  }

  /* ------------------------------
     5. Article Reading Info
  ------------------------------ */

  function initReadingInfo() {
    var body = getPostBody();
    if (!body) return;
    if ($("#gmeek-reading-info")) return;

    var text = body.innerText || "";
    var cnChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    var enWords = (text.replace(/[\u4e00-\u9fa5]/g, " ").match(/\b[\w'-]+\b/g) || []).length;
    var totalWords = cnChars + enWords;

    if (!totalWords) return;

    var minutes = Math.max(1, Math.ceil(totalWords / 450));

    var info = document.createElement("div");
    info.id = "gmeek-reading-info";
    info.innerHTML =
      "<span>📝 " + totalWords + " words</span>" +
      "<span>⏱️ " + minutes + " min read</span>";

    var firstHeading = body.querySelector("h1");
    if (firstHeading && firstHeading.parentNode) {
      firstHeading.insertAdjacentElement("afterend", info);
    } else {
      body.insertBefore(info, body.firstChild);
    }
  }

  /* ------------------------------
     6. External Links and Lazy Images
  ------------------------------ */

  function enhanceLinksAndImages() {
    var body = getPostBody() || document;

    $$("a[href]", body).forEach(function (a) {
      try {
        var url = new URL(a.getAttribute("href"), location.href);
        if (url.origin !== location.origin) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
      } catch (e) {
        /* ignore invalid href */
      }
    });

    $$("img", body).forEach(function (img) {
      if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
      if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
    });
  }

  /* ------------------------------
     7. Copy Heading Link
  ------------------------------ */

  function initHeadingCopyLink() {
    var body = getPostBody();
    if (!body) return;

    var headings = $$("h1, h2, h3, h4, h5, h6", body);

    headings.forEach(function (heading) {
      if (heading.dataset.gmeekCopyReady === "1") return;
      heading.dataset.gmeekCopyReady = "1";

      heading.style.cursor = "pointer";
      heading.title = "Click to copy heading link";

      heading.addEventListener("click", function () {
        if (!heading.id) return;

        var url =
          location.origin +
          location.pathname +
          location.search +
          "#" +
          encodeURIComponent(heading.id);

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            showToast("Heading link copied");
          });
        } else {
          fallbackCopy(url);
          showToast("Heading link copied");
        }
      });
    });
  }

  function fallbackCopy(text) {
    var input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "readonly");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();

    try {
      document.execCommand("copy");
    } catch (e) {
      /* ignore */
    }

    input.remove();
  }

  function showToast(message) {
    var old = $("#gmeek-toast");
    if (old) old.remove();

    var toast = document.createElement("div");
    toast.id = "gmeek-toast";
    toast.textContent = message;
    toast.style.cssText = [
      "position:fixed",
      "left:50%",
      "bottom:34px",
      "z-index:3000",
      "transform:translateX(-50%) translateY(10px)",
      "padding:10px 14px",
      "border-radius:999px",
      "font-size:14px",
      "color:#fff",
      "background:rgba(15,23,42,.88)",
      "box-shadow:0 12px 32px rgba(0,0,0,.2)",
      "backdrop-filter:blur(16px)",
      "-webkit-backdrop-filter:blur(16px)",
      "opacity:0",
      "transition:opacity .2s ease, transform .2s ease",
      "pointer-events:none"
    ].join(";");

    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });

    setTimeout(function () {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(10px)";
      setTimeout(function () {
        toast.remove();
      }, 220);
    }, 1600);
  }

  /* ------------------------------
     8. Reading Progress Bar
  ------------------------------ */

  function initProgressBar() {
    if ($("#gmeek-progress")) return;

    var bar = document.createElement("div");
    bar.id = "gmeek-progress";
    document.body.appendChild(bar);

    var update = throttle(function () {
      var doc = document.documentElement;
      var scrollTop = window.scrollY || doc.scrollTop;
      var max = Math.max(1, doc.scrollHeight - window.innerHeight);
      var percent = Math.min(100, Math.max(0, scrollTop / max * 100));
      bar.style.width = percent + "%";
    }, 60);

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
  }

  /* ------------------------------
     9. Back To Top
  ------------------------------ */

  function initBackTop() {
    if ($("#gmeek-backtop")) return;

    var btn = document.createElement("button");
    btn.id = "gmeek-backtop";
    btn.type = "button";
    btn.setAttribute("aria-label", "Back to top");
    btn.textContent = "↑";

    document.body.appendChild(btn);

    btn.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });

    var update = throttle(function () {
      if (window.scrollY > 420) {
        btn.classList.add("is-visible");
      } else {
        btn.classList.remove("is-visible");
      }
    }, 100);

    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ------------------------------
     10. Dark Mode Compatibility
  ------------------------------ */

  function initThemeObserver() {
    /**
     * Gmeek/GitHub pages may switch data-color-mode dynamically.
     * This observer only updates meta theme-color and does not
     * implement any custom theme switcher.
     */
    var metaLight = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
    var metaDark = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');

    function updateThemeColor() {
      var mode = document.documentElement.getAttribute("data-color-mode") ||
        document.body.getAttribute("data-color-mode") ||
        "";

      var isDark = mode === "dark";

      var meta = document.querySelector('meta[name="theme-color"]:not([media])');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
      }

      meta.content = isDark ? "#020617" : "#ffffff";

      if (metaLight) metaLight.content = "#ffffff";
      if (metaDark) metaDark.content = "#020617";
    }

    updateThemeColor();

    var observer = new MutationObserver(updateThemeColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-color-mode", "class"]
    });

    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["data-color-mode", "class"]
      });
    }
  }

  /* ------------------------------
     11. Main
  ------------------------------ */

  ready(function () {
    removeNoticeBoard();
    initHeaderState();
    observeHomeCards();
    enhanceLinksAndImages();
    initProgressBar();
    initBackTop();
    initThemeObserver();

    if (isPostPage()) {
      initReadingInfo();
      initHeadingCopyLink();
    }
  });
})();
