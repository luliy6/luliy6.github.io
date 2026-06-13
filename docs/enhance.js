/* enhance.js - Luliy Blog v10
   Modules:
   00  Homepage Hero (first-visit full-screen, animation sequence)
   01  localStorage init
   02  Progress bar
   03  Dynamic title
   04  Uptime counter
   05  Dark-mode ripple (from click origin)
   06  Static background (particles removed)
   07  Web Audio SFX
   08  Click sparks
   09  Hero cluster (avatar + name + clock)
   10  Hero banner (homepage scroll-fold)
   11  Tag page search toolbar
   12  Image lightbox
   13  Floating toolbar + unified sink (6 themes) + reading prefs + music + extras
   14  Home card rebuild (grid/list toggle + year grouping + skeleton)
   15  macOS code block strip (+ line numbers)
   16  Sakura — heart petals (sakuraPlus, image-based)
   17  ArticleTOC scroll-spy + reading progress ring (back-to-top)
   18  Mobile nav hamburger + dropdown + swipe gestures
   19  Favorites page front-end lock (progressive reveal)
   20  Homepage bottom gallery banner (grid + custom images)
   21  Post page init (series nav + scroll memory + in-page search)
   22  Index page init (archive: timeline + calendar)
   23  Tag cloud page
   24  In-page article search overlay
   25  Mouse trail (theme cursor) + fireflies
   26  View Transitions (cross-page fade)
   27  Main entry
*/
(function (root) {
  'use strict';

  /* ════════════════════════════════════════════════════════
     SITE OPTIONS — edit these to customise
  ════════════════════════════════════════════════════════ */
  var LULIY_OPTS = {
    /* Homepage bottom gallery: 1 image = banner, 2+ = grid. */
    galleryImages: [
      'https://raw.githubusercontent.com/luliy6/luliy6.github.io/refs/heads/main/static/img/9.jpg'
    ],
    galleryText: '\u6211\u5c06\u65e0\u9650\u8fdb\u6b65',

    /* Homepage full-screen Hero (scroll down to enter). */
    heroImage: 'https://raw.githubusercontent.com/luliy6/luliy6.github.io/refs/heads/main/static/img/SunFragment17_8k.webp',
    heroTitle: 'Luliy',
    heroSubtitle: '\u6211\u5c06\u65e0\u9650\u8fdb\u6b65',
    heroHint: '\u4e0b\u6ed1\u8fdb\u5165 \u2193',

    /* APlayer mini player (top-left, all pages, autoplay, default folded) */
    aplayer: {
      name:   'dark',
      artist: 'Luliy',
      url:    'https://raw.githubusercontent.com/luliy6/luliy6.github.io/refs/heads/main/static/doc/dark.mp3',
      cover:  'https://raw.githubusercontent.com/luliy6/luliy6.github.io/refs/heads/main/static/img/1.png'
    },

    /* Favorites page lock — SHA-256 of the password (121383). */
    favoritesHash: 'c9c9ed97be82f3ed62e9d127e4df48397549f81ba53a07f5639b68987552ce21',
    favoritesPathMatch: /favorites/i,

    homeUrl: '/'
  };

  /* ---- Utilities ------------------------------------------ */
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isIndexPage() {
    return location.pathname === '/' ||
      location.pathname === '/index.html' ||
      location.pathname === '';
  }
  function isArchivePage() {
    return location.pathname.includes('archive');
  }
  function fetchPosts() {
    function norm(data) {
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        var colorDict = data.labelColorDict || {};
        return Object.keys(data)
          .filter(function (k) { return k !== 'labelColorDict'; })
          .map(function (k) {
            var p = data[k] || {};
            if (typeof p === 'string') p = { postTitle: p };
            var rawLabels = p.labels || p.tags || [];
            /* Multi-level pinning: 'pinned' = level 1; 'pinned-2', 'pinned-3'
               sort higher. Lower number = higher position. */
            var pinLevel = 0;
            rawLabels.forEach(function (lbl) {
              var m = /^pinned(?:-(\d+))?$/.exec(lbl);
              if (m) pinLevel = Math.max(pinLevel, m[1] ? parseInt(m[1], 10) : 1);
            });
            var labels = rawLabels.map(function (lbl) {
              return {
                name: lbl,
                color: (colorDict[lbl] || '0969da').replace(/^#/, '')
              };
            });
            return {
              title: p.postTitle || p.title || p.name || k,
              link:  p.postUrl  || p.link  || p.url  || ('post/' + k + '.html'),
              created: p.createdDate || p.created || p.date || '',
              labels: labels,
              pinned: pinLevel > 0,
              pinLevel: pinLevel
            };
          });
      }
      return [];
    }
    var tryUrls = [location.origin + '/postList.json', '/postList.json'];
    function tryNext(urls) {
      if (!urls.length) return Promise.resolve([]);
      return fetch(urls[0], { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .catch(function () { return tryNext(urls.slice(1)); });
    }
    return tryNext(tryUrls).then(norm);
  }

  /* Relative time: 今天 / 3天前 / 2个月前 / 1年前 */
  function relativeTime(dateStr) {
    if (!dateStr) return '';
    var t = new Date(String(dateStr).slice(0, 10).replace(/-/g, '/')).getTime();
    if (isNaN(t)) return '';
    var d = Date.now() - t;
    if (d < 0) return '';
    var days = Math.floor(d / 86400000);
    if (days === 0) return '\u4eca\u5929';
    if (days < 30) return days + '\u5929\u524d';
    if (days < 365) return Math.floor(days / 30) + '\u4e2a\u6708\u524d';
    return Math.floor(days / 365) + '\u5e74\u524d';
  }

  /* ---- 00  Welcome splash (animation sequence) ------------- */
  /* ---- 00  Homepage Hero (full-screen, scroll to enter) --- */
  /* ---- APlayer mini player (top-left, autoplay, folded) ---- */
  function initAPlayer() {
    if (document.getElementById('luliy-aplayer')) return;
    var cfg = LULIY_OPTS.aplayer;
    if (!cfg || !cfg.url) return;

    /* Inject APlayer CSS + JS from CDN once */
    function loadCss(href) {
      if (document.querySelector('link[href="' + href + '"]')) return;
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = href;
      document.head.appendChild(l);
    }
    loadCss('https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css');

    function boot() {
      if (!window.APlayer) return;
      var holder = document.createElement('div');
      holder.id = 'luliy-aplayer';
      document.body.appendChild(holder);
      try {
        var ap = new window.APlayer({
          container: holder,
          fixed: true,            /* fixed mini mode, folds to a corner ball */
          mini: false,
          autoplay: true,
          theme: '#e8a838',
          preload: 'auto',
          volume: 0.6,
          audio: [{
            name:   cfg.name || 'Music',
            artist: cfg.artist || '',
            url:    cfg.url,
            cover:  cfg.cover || ''
          }]
        });
        root._luliyAPlayer = ap;
        /* Start folded (collapsed to corner) */
        if (holder.classList) holder.classList.add('aplayer-fixed');
        var body = holder.querySelector('.aplayer-body');
        if (body) body.style.left = '-66px';   /* APlayer's folded position */
        /* Autoplay fallback: resume on first user gesture if blocked */
        var p = ap.play && ap.play();
        if (p && p.catch) {
          p.catch(function () {
            var once = function () { try { ap.play(); } catch (e) {} };
            document.addEventListener('click', once, { once: true });
            document.addEventListener('touchstart', once, { once: true, passive: true });
          });
        }
      } catch (e) {
        try { console.warn('[luliy] APlayer init failed', e); } catch (e2) {}
      }
    }

    if (window.APlayer) { boot(); return; }
    var existing = document.querySelector('script[src*="APlayer.min.js"]');
    if (existing) { existing.addEventListener('load', boot); return; }
    var sc = document.createElement('script');
    sc.src = 'https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js';
    sc.onload = boot;
    document.head.appendChild(sc);
  }

  function initHomeHero() {
    /* Only on the homepage / index, not on article or single pages */
    if (!isIndexPage()) return;
    if (document.getElementById('luliy-hero')) return;

    /* First visit of this session only — afterwards homepage shows directly */
    try {
      if (sessionStorage.getItem('luliy-hero-shown') === '1') return;
      sessionStorage.setItem('luliy-hero-shown', '1');
    } catch (e) {}

    var hero = document.createElement('section');
    hero.id = 'luliy-hero';
    hero.style.backgroundImage = "linear-gradient(to bottom, rgba(10,6,22,0.10), rgba(10,6,22,0.45)), url('" + LULIY_OPTS.heroImage + "')";

    var inner = document.createElement('div');
    inner.id = 'luliy-hero-inner';

    var title = document.createElement('h1');
    title.id = 'luliy-hero-title';
    title.textContent = LULIY_OPTS.heroTitle || 'Luliy';

    var sub = document.createElement('p');
    sub.id = 'luliy-hero-subtitle';
    sub.textContent = LULIY_OPTS.heroSubtitle || '';

    inner.appendChild(title);
    inner.appendChild(sub);

    var hint = document.createElement('div');
    hint.id = 'luliy-hero-hint';
    hint.textContent = LULIY_OPTS.heroHint || '\u2193';
    hint.setAttribute('role', 'button');
    hint.setAttribute('tabindex', '0');

    hero.appendChild(inner);
    hero.appendChild(hint);

    /* Insert hero as the very first thing in the page flow */
    if (document.body.firstChild) document.body.insertBefore(hero, document.body.firstChild);
    else document.body.appendChild(hero);

    /* Smooth-scroll to content when hint clicked / Enter pressed */
    function enterSite() {
      var target = document.getElementById('content') ||
                   document.querySelector('.SideNav') ||
                   document.getElementById('header');
      var y = target ? (target.getBoundingClientRect().top + window.scrollY - 60) : window.innerHeight;
      window.scrollTo({ top: Math.max(y, window.innerHeight * 0.92), behavior: 'smooth' });
    }
    hint.addEventListener('click', enterSite);
    hint.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterSite(); }
    });

    /* Parallax + fade as user scrolls + hide/show navbar */
    var _heroHeader = null, _heroHdrInit = false, _heroWasIn = null;
    onScrollRAF(function () {
      var st = window.scrollY || 0;
      var vh = window.innerHeight;

      /* ── Navbar: fully hidden while Hero fills the viewport ── */
      if (!_heroHeader) _heroHeader = document.getElementById('header');
      if (_heroHeader) {
        if (!_heroHdrInit) {            /* set transition exactly once */
          _heroHeader.style.transition = 'opacity 0.5s ease';
          _heroHdrInit = true;
        }
        var inHero = st < vh * 0.85;
        if (inHero !== _heroWasIn) {    /* write styles only on state change */
          _heroHeader.style.opacity = inHero ? '0' : '';
          _heroHeader.style.pointerEvents = inHero ? 'none' : '';
          _heroWasIn = inHero;
        }
      }

      if (st > vh) return;
      var p = Math.min(1, st / vh);
      inner.style.transform = 'translateY(' + (p * 60) + 'px)';
      inner.style.opacity = String(1 - p * 1.4);
      hint.style.opacity = String(1 - p * 2);
    });
  }

  /* ---- 01  localStorage init ------------------------------ */
  function initLocalStorage() {
    var defs = {
      'luliy-sfx':       '1',
      'luliy-sakura':    '1',
      'luliy-sink':      'default',
      'luliy-bg':        '',
      'luliy-fontsize':  '18',
      'luliy-sans':      '0',
      'luliy-cardview':  'grid',   /* grid | list */
      'luliy-trail':     '0',      /* mouse trail off by default */
      'luliy-firefly':   '0',      /* fireflies off by default */
      'luliy-focus':     '0',      /* focus reading mode */
      'luliy-reduce':    '0',      /* reduce motion override */
      'luliy-bgblur':    '0',      /* background blur px */
      'luliy-pbwidth':   '0'       /* postBody width delta px (0 = default) */
    };
    Object.keys(defs).forEach(function (k) {
      if (localStorage.getItem(k) === null) localStorage.setItem(k, defs[k]);
    });
  }

  /* ---- Shared rAF-throttled scroll listener ---------------
     Many features react to scroll; funnel them through one
     requestAnimationFrame tick instead of N raw handlers.       */
  var _scrollFns = [], _scrollRAF = false;
  function onScrollRAF(fn) {
    _scrollFns.push(fn);
    if (_scrollFns.length === 1) {
      window.addEventListener('scroll', function () {
        if (_scrollRAF) return;
        _scrollRAF = true;
        requestAnimationFrame(function () {
          _scrollRAF = false;
          for (var i = 0; i < _scrollFns.length; i++) {
            try { _scrollFns[i](); } catch (e) {}
          }
        });
      }, { passive: true });
    }
    fn();   /* run once immediately for initial state */
  }

  /* ---- 02  Progress bar ----------------------------------- */
  function initProgressBar() {
    var bar = document.createElement('div');
    bar.id = 'luliy-progress-bar';
    document.body.appendChild(bar);
    onScrollRAF(function () {
      var st = window.scrollY || document.documentElement.scrollTop;
      var dh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = (dh > 0 ? Math.round(st / dh * 100) : 0) + '%';
    });
  }

  /* ---- 03  Dynamic title ---------------------------------- */
  function initDynamicTitle() {
    var ori = document.title, t;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearTimeout(t);
        document.title = '\uD83D\uDC40 \u522b\u8d70\u554a\uff0c\u6211\u8fd8\u5728\u8fdb\u6b65\uff01';
      } else {
        document.title = '\u2728 \u6b22\u8fce\u56de\u6765\uff01 ' + ori;
        t = setTimeout(function () { document.title = ori; }, 2000);
      }
    });
  }

  /* ---- 04  Uptime counter --------------------------------- */
  function initUptime() {
    var el = document.getElementById('luliy-uptime');
    if (!el) {
      el = document.createElement('div');
      el.id = 'luliy-uptime';
      document.body.appendChild(el);
    }
    var start = new Date('2026/05/30 00:00:00').getTime();
    function upd() {
      var d = Date.now() - start;
      if (d < 0) {
        el.innerHTML = '\uD83D\uDE80 \u535a\u5ba2\u5373\u5c06\u4e0a\u7ebf\uff0c\u656c\u8bf7\u671f\u5f85...';
        return;
      }
      el.innerHTML = '\uD83C\uDF31 \u672c\u7ad9\u5df2\u966a\u4f34\u4f60\u65e0\u9650\u8fdb\u6b65\uff1a' +
        Math.floor(d / 86400000) + '\u5929 ' +
        Math.floor((d % 86400000) / 3600000) + '\u5c0f\u65f6 ' +
        Math.floor((d % 3600000) / 60000) + '\u5206 ' +
        '<span style="color:#ff4444;font-weight:bold">' +
        Math.floor((d % 60000) / 1000) + '</span>\u79d2';
    }
    upd(); setInterval(upd, 1000);
  }

  /* ---- 05  Dark-mode theme ripple (from click origin) ----- */
  function initThemeRipple() {
    function ripple(ox, oy) {
      playSfx('theme');
      var old = document.getElementById('luliy-theme-ripple');
      if (old) old.remove();
      /* Use click coordinates as the ripple center; fall back to screen center */
      var cx = (typeof ox === 'number') ? ox : window.innerWidth / 2;
      var cy = (typeof oy === 'number') ? oy : window.innerHeight / 2;
      /* Max radius = distance to the farthest corner */
      var dx = Math.max(cx, window.innerWidth - cx);
      var dy = Math.max(cy, window.innerHeight - cy);
      var maxR = Math.sqrt(dx * dx + dy * dy) * 1.05;
      var isDark = document.documentElement.getAttribute('data-color-mode') === 'dark';
      var el = document.createElement('div');
      el.id = 'luliy-theme-ripple';
      el.style.cssText =
        'position:fixed;top:' + cy + 'px;left:' + cx + 'px;width:0;height:0;' +
        'border-radius:50%;background:' +
        (isDark ? 'rgba(10,20,40,0.96)' : 'rgba(255,255,255,0.96)') +
        ';pointer-events:none;z-index:99998;transform:translate(-50%,-50%) scale(0);' +
        'transition:transform 0.65s cubic-bezier(.4,0,.2,1),opacity 0.65s ease;';
      document.body.appendChild(el);
      el.getBoundingClientRect();
      el.style.width = el.style.height = (maxR * 2) + 'px';
      el.style.transform = 'translate(-50%,-50%) scale(1)';
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 700);
    }
    root._luliyThemeRipple = ripple;
    document.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b && (b.innerHTML.includes('Moon') || b.innerHTML.includes('Sun') ||
        (b.title && /dark|light|theme|\u4e3b\u9898/i.test(b.title)))) ripple(e.clientX, e.clientY);
    });
    setTimeout(function () {
      document.querySelectorAll('.title-right .circle').forEach(function (el) {
        if (el._luliyRipple) return;
        el._luliyRipple = true;
        el.addEventListener('click', function (e) { ripple(e.clientX, e.clientY); });
      });
    }, 800);
  }

  /* ---- 06  Static background (particles removed) ---------- */
  function initParticles() { /* static bg set in CSS */ }

  /* ---- 07  Web Audio SFX ---------------------------------- */
  var _actx = null;
  function getACtx() {
    if (!_actx) try { _actx = new (root.AudioContext || root.webkitAudioContext)(); } catch (e) {}
    return _actx;
  }
  function playSfx(type) {
    if (localStorage.getItem('luliy-sfx') === '0') return;
    var ctx = getACtx(); if (!ctx) return;
    try {
      if (type === 'click') {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'square';
        o.frequency.setValueAtTime(900, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
        g.gain.setValueAtTime(0.04, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
        o.start(); o.stop(ctx.currentTime + 0.06);
      } else if (type === 'sci') {
        var o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.type = 'sine';
        o2.frequency.setValueAtTime(440, ctx.currentTime);
        o2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        o2.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.22);
        g2.gain.setValueAtTime(0.06, ctx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        o2.start(); o2.stop(ctx.currentTime + 0.25);
      } else if (type === 'theme') {
        [0, 0.08, 0.16].forEach(function (delay, idx) {
          var ot = ctx.createOscillator(), gt = ctx.createGain();
          ot.connect(gt); gt.connect(ctx.destination);
          ot.type = 'sine';
          ot.frequency.setValueAtTime([523, 659, 784][idx], ctx.currentTime + delay);
          gt.gain.setValueAtTime(0.05, ctx.currentTime + delay);
          gt.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.18);
          ot.start(ctx.currentTime + delay);
          ot.stop(ctx.currentTime + delay + 0.18);
        });
      }
    } catch (e) {}
  }
  root._luliySfx = playSfx;

  function initSfxEvents() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t.tagName === 'BUTTON' || t.tagName === 'A' || t.classList.contains('Label') ||
        t.closest('button') || t.closest('a')) playSfx('click');
    }, true);
  }

  /* ---- 08  Click sparks ----------------------------------- */
  function initClickSparks() {
    var colors = ['#ff6b9d', '#ffcd3c', '#6bceff', '#a78bfa', '#34d399'];
    document.addEventListener('click', function (e) {
      for (var i = 0; i < 12; i++) (function () {
        var s = document.createElement('div');
        var angle = Math.random() * 360, dist = Math.random() * 50 + 16;
        s.style.cssText =
          'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;' +
          'width:7px;height:7px;border-radius:50%;pointer-events:none;z-index:99999;' +
          'background:' + colors[Math.floor(Math.random() * colors.length)] +
          ';transform:translate(-50%,-50%);transition:transform 0.6s ease,opacity 0.6s ease;';
        document.body.appendChild(s);
        requestAnimationFrame(function () {
          s.style.transform =
            'translate(calc(-50% + ' + (Math.cos(angle * Math.PI / 180) * dist) + 'px),' +
            'calc(-50% + ' + (Math.sin(angle * Math.PI / 180) * dist) + 'px))';
          s.style.opacity = '0';
        });
        setTimeout(function () { s.remove(); }, 700);
      })();
    });
  }

  /* ---- 09  Navbar — rebuilt: avatar+name centred, time top-left, icons spread */
  function initHeroCluster() {
    function tryBuild() {
      var header = document.getElementById('header'); if (!header) return false;
      if (document.getElementById('luliy-nav-rebuilt')) return true;

      /* Mark header as rebuilt so CSS can target it */
      header.setAttribute('data-luliy-nav', '1');
      header.id = 'header'; /* keep Gmeek id */

      /* Hide every existing child except .title-right SVG nav links */
      Array.from(header.children).forEach(function (el) {
        var id = el.id || '';
        var cls = el.className || '';
        /* Keep our toolbar + existing title-right (we relocate its links) */
        if (id === 'luliy-toolbar' || id === 'luliy-nav-rebuilt' || id === 'luliy-nav-ham') return;
        el.style.display = 'none';
      });

      /* Outer rebuilt shell */
      var shell = document.createElement('div');
      shell.id = 'luliy-nav-rebuilt';

      /* ── Top-left: time ─────────────────────────────────── */
      var timeEl = document.createElement('div');
      timeEl.id = 'luliy-nav-time';
      function updTime() {
        var n = new Date();
        timeEl.textContent =
          String(n.getHours()).padStart(2,'0') + ':' +
          String(n.getMinutes()).padStart(2,'0') + ':' +
          String(n.getSeconds()).padStart(2,'0');
      }
      updTime(); setInterval(updTime, 1000);

      /* ── Centre: avatar + blog name ─────────────────────── */
      var centre = document.createElement('div');
      centre.id = 'luliy-nav-centre';

      var avatarLink = document.createElement('a');
      avatarLink.href = '/about'; avatarLink.id = 'luliy-nav-avatar-link';
      var avatarImg = document.createElement('img');
      avatarImg.src = 'https://raw.githubusercontent.com/luliy6/luliy6.github.io/refs/heads/main/static/img/Luliy.jpg';
      avatarImg.id = 'luliy-nav-avatar'; avatarImg.alt = 'Luliy';
      avatarLink.appendChild(avatarImg);

      var blogName = document.createElement('a');
      blogName.href = '/'; blogName.id = 'luliy-nav-blogname';
      blogName.textContent = 'Luliy';

      centre.appendChild(avatarLink);
      centre.appendChild(blogName);

      /* ── MOVE original nav elements from .title-right ──────
         Moving (not cloning) keeps every native Gmeek listener —
         the day/night circle toggles + swaps its icon exactly as
         stock Gmeek does. No re-trigger hacks, no duplicate IDs. */
      var tr = header.querySelector('.title-right, [class*="title-right"]');
      var iconsLeft  = document.createElement('div');
      var iconsRight = document.createElement('div');
      iconsLeft.id  = 'luliy-nav-icons-left';
      iconsRight.id = 'luliy-nav-icons-right';

      var links = tr ? Array.from(tr.querySelectorAll('a, button')) : [];
      /* About + RSS never appear as icons (about lives behind the avatar) */
      links = links.filter(function (a) {
        var href = a.getAttribute('href') || '';
        if (/rss\.xml$|atom\.xml$|\/rss$|\/feed/.test(href)) return false;
        if (/\/about(\.html)?$|^about(\.html)?$/.test(href)) return false;
        return true;
      });
      /* Stash metadata for the mobile dropdown (title-right empties out) */
      root._luliyNavLinks = links.map(function (a) {
        return {
          href: a.getAttribute('href') || '',
          absHref: a.href || '',
          label: a.getAttribute('title') || (a.textContent || '').trim()
        };
      });
      /* Split evenly: first half left, second half right */
      var half = Math.ceil(links.length / 2);
      links.forEach(function (a, i) {
        a.classList.add('luliy-nav-icon-link');
        if (i < half) iconsLeft.appendChild(a);   /* appendChild MOVES the node */
        else iconsRight.appendChild(a);
      });

      shell.appendChild(timeEl);
      shell.appendChild(iconsLeft);
      shell.appendChild(centre);
      shell.appendChild(iconsRight);

      header.insertBefore(shell, header.firstChild);
      return true;
    }

    if (!tryBuild()) {
      var tries = 0;
      var iv = setInterval(function () {
        if (tryBuild() || ++tries > 30) clearInterval(iv);
      }, 200);
    }
  }

  /* ---- 10  Hero banner (homepage, scroll-fold) ------------ */
  function initHeroBanner() {
    if (document.getElementById('luliy-hero-banner')) return;
    var content = document.getElementById('content') || document.querySelector('.main');
    if (!content) return;
    var banner = document.createElement('div');
    banner.id = 'luliy-hero-banner';
    banner.textContent = 'Remember, this is your world.';
    content.parentNode.insertBefore(banner, content);

    var bannerH = 0;
    function getBannerH() { bannerH = banner.offsetHeight || 56; }
    getBannerH();
    window.addEventListener('resize', getBannerH, { passive: true });
    onScrollRAF(function () {
      var st = window.scrollY || window.pageYOffset || 0;
      var progress = Math.min(1, st / (bannerH + 32));
      banner.style.transform = 'translateY(-' + (progress * (bannerH + 32)) + 'px)';
      banner.style.opacity = String(1 - progress);
    }, { passive: true });
  }

  /* ---- 11  Tag page search toolbar ----------------------- */
  function initTagEnhance() {
    if (!/tag\.html?$|\/tag\/?$/i.test(location.pathname)) return;
    var tries = 0;
    function wire() {
      var tl = document.getElementById('taglabel');
      if (!tl) { if (tries++ < 30) setTimeout(wire, 200); return; }
      if (document.getElementById('tag-enhance-toolbar')) return;
      var tb = document.createElement('div');
      tb.id = 'tag-enhance-toolbar';
      tb.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap';
      tb.innerHTML =
        '<input style="padding:6px 14px;border:1px solid rgba(130,80,223,0.3);border-radius:20px;' +
        'outline:none;font-size:13px;width:200px;" type="search" ' +
        'placeholder="\u7b5b\u9009\u6807\u7b7e..." autocomplete="off">' +
        '<span style="font-size:12px;color:#888"></span>';
      tl.parentNode.insertBefore(tb, tl);
      var inp = tb.querySelector('input'), cnt = tb.querySelector('span');
      function apply() {
        var q = inp.value.trim().toLowerCase(), vis = 0;
        var all = Array.from(tl.querySelectorAll('.Label'));
        all.forEach(function (l) {
          var ok = !q || l.textContent.trim().toLowerCase().includes(q);
          l.style.display = ok ? 'inline-flex' : 'none';
          if (ok) vis++;
        });
        cnt.textContent = vis + ' / ' + all.length + ' \u4e2a\u6807\u7b7e';
      }
      inp.addEventListener('input', apply);
      new MutationObserver(apply).observe(tl, { childList: true, subtree: true });
      setTimeout(apply, 100);
    }
    wire();
  }

  /* ---- 12  Image lightbox --------------------------------- */
  function initLightbox() {
    if (document.getElementById('luliy-lightbox')) return;
    var lb = document.createElement('div');
    lb.id = 'luliy-lightbox';
    lb.innerHTML = '<button id="luliy-lightbox-close" aria-label="\u5173\u95ed">\u2715</button><img alt="">';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img');
    var lbClose = lb.querySelector('#luliy-lightbox-close');
    function open(src, alt) {
      lbImg.src = src; lbImg.alt = alt || '';
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lb.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(function () { lbImg.src = ''; }, 300);
    }
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target === lbClose) close(); });
    lbClose.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.classList.contains('is-open')) close();
    });
    document.addEventListener('click', function (e) {
      var img = e.target.closest('#postBody img');
      if (!img) return;
      e.preventDefault();
      open(img.src, img.alt);
    });
    root._luliyLightboxOpen = open;
  }


  /* ---- Background picker helper -------------------------------- */
  function showBgPicker() {
    var cur = localStorage.getItem('luliy-bg') || '';
    var url = window.prompt(
      '\u8bf7\u7c98\u8d34\u80cc\u666f\u56fe\u7247\u94fe\u63a5\uff08\u7559\u7a7a\u5219\u6062\u590d\u9ed8\u8ba4\u80cc\u666f\uff09\uff1a',
      cur
    );
    if (url === null) return; // cancelled
    url = url.trim();
    if (url === '') {
      localStorage.removeItem('luliy-bg');
      document.body.style.setProperty(
        'background-image',
        'url("https://raw.githubusercontent.com/luliy6/luliy6.github.io/refs/heads/main/static/img/bg.png")',
        'important'
      );
    } else {
      localStorage.setItem('luliy-bg', url);
      document.body.style.setProperty('background-image', 'url("' + url + '")', 'important');
    }
    if (root._luliyApplyBgBlur) root._luliyApplyBgBlur();
    playSfx('click');
  }

  /* ---- Reading preferences (font size + font style) -------- */
  function applyReadingPrefs() {
    var pbody = document.getElementById('postBody');
    if (!pbody) return;
    var px = parseInt(localStorage.getItem('luliy-fontsize') || '18', 10) || 18;
    px = Math.min(24, Math.max(14, px));
    pbody.style.setProperty('font-size', px + 'px', 'important');
    /* Font mode: '0'=default(楷体), '1'=黑体, '2'=苍耳今楷 */
    var fm = localStorage.getItem('luliy-sans') || '0';
    document.body.classList.toggle('luliy-sans',   fm === '1');
    document.body.classList.toggle('luliy-canger', fm === '2');
  }
  root._luliyApplyReadingPrefs = applyReadingPrefs;

  /* ---- Background blur + reading-panel width (CSS variables) -- */
  function _currentBgUrl() {
    var custom = localStorage.getItem('luliy-bg');
    if (custom) return custom;
    return 'https://raw.githubusercontent.com/luliy6/luliy6.github.io/refs/heads/main/static/img/bg.png';
  }
  function applyBgBlur() {
    var px = parseInt(localStorage.getItem('luliy-bgblur') || '0', 10) || 0;
    px = Math.min(20, Math.max(0, px));
    document.documentElement.style.setProperty('--luliy-bg-blur', px + 'px');
    document.documentElement.style.setProperty('--luliy-bg-url', 'url("' + _currentBgUrl() + '")');
    document.body.classList.toggle('luliy-bg-blurred', px > 0);
  }
  function applyPbWidth() {
    var d = parseInt(localStorage.getItem('luliy-pbwidth') || '0', 10) || 0;
    d = Math.min(400, Math.max(0, d));   /* 0..400px extra width, each side */
    document.documentElement.style.setProperty('--luliy-pb-extra', d + 'px');
  }
  root._luliyApplyBgBlur = applyBgBlur;
  root._luliyApplyPbWidth = applyPbWidth;

  /* ---- 13  Floating toolbar + unified sink (6 themes) ----- */

  /* ── 6 Sinks / Themes ───────────────────────────────────── */
  var SINKS = [
    {
      id: 'default',
      label: '\u9ed8\u8ba4',
      dot:   '#8250df',
      theme: 'default',
      cardPalette: ['#8250df', '#0969da', '#ff6b9d', '#f0b429'],
      desc:  '\u7ecf\u5178\u7d2b\u8c03\uff0c\u5c40\u6f14\u6e05\u6b63'
    },
    {
      id: 'sakura',
      label: '\u6a31\u82b1\u5c11\u5973',
      dot:   '#f9a8c9',
      theme: 'sakura',
      cardPalette: ['#e05c8a', '#f9a8c9', '#c94070', '#ffb7c5'],
      desc:  '\u7c89\u5ae9\u6a31\u82b1\uff0c\u5c11\u5973\u5fc3\u601d'
    },
    {
      id: 'your-name',
      label: '\u4f60\u7684\u540d\u5b57',
      dot:   '#4a9de0',
      theme: 'your-name',
      cardPalette: ['#1a59a4', '#4a9de0', '#f4a738', '#60b8ff'],
      desc:  '\u5929\u7a7a\u84dd\u8c03\uff0c\u9ec4\u91d1\u5f67\u661f'
    },
    {
      id: 'space',
      label: '\u592a\u7a7a\u65c5\u884c',
      dot:   '#00e5ff',
      theme: 'space',
      cardPalette: ['#00e5ff', '#4a9de0', '#7b2fbe', '#0d2149'],
      desc:  '\u6df1\u591c\u661f\u6d77\uff0c\u5b87\u5b99\u65c5\u8005'
    },
    {
      id: 'sunset',
      label: '\u65e5\u843d\u9ec4\u660f',                 /* 日落黄昏 */
      dot:   '#e8a838',
      theme: 'sunset',
      cardPalette: ['#f0b429', '#ffd98a', '#e8821e', '#d9930d'],
      desc:  '\u91d1\u8272\u4f59\u6656\uff0c\u6696\u9ec4\u9ec4\u660f'  /* 金色余晖，暖黄黄昏 */
    },
    {
      id: 'mono',
      label: '\u6781\u7b80\u9ed1\u767d',                 /* 极简黑白 */
      dot:   '#222222',
      theme: 'mono',
      cardPalette: ['#222222', '#555555', '#888888', '#bbbbbb'],
      desc:  '\u53bb\u8272\u7559\u767d\uff0c\u4e13\u6ce8\u9605\u8bfb'  /* 去色留白，专注阅读 */
    }
  ];

  function applySink(id) {
    var s = null;
    SINKS.forEach(function (x) { if (x.id === id) s = x; });
    if (!s) s = SINKS[0];
    localStorage.setItem('luliy-sink', s.id);
    document.body.setAttribute('data-luliy-theme', s.theme || 'default');
    document.documentElement.style.setProperty('--card-c1', s.cardPalette[0]);
    document.documentElement.style.setProperty('--card-c2', s.cardPalette[1]);
    document.documentElement.style.setProperty('--card-c3', s.cardPalette[2]);
    document.documentElement.style.setProperty('--card-c4', s.cardPalette[3]);
    document.querySelectorAll('.luliy-sink-opt').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-sink') === s.id);
    });
  }

  /* ---- Nav transparency on scroll (article pages) --------- */
  function initNavTransparency() {
    /* Only apply scroll-fade on article pages — not on homepage/index
       where transparent nav makes links invisible over content.       */
    if (!document.getElementById('postBody')) return;
    var header = document.getElementById('header');
    if (!header) return;
    onScrollRAF(function () {
      var st = window.scrollY || window.pageYOffset || 0;
      header.classList.toggle('header-scrolled', st > 100);
    });
  }

  function initToolbar() {
    if (document.getElementById('luliy-toolbar')) return;
    var bar = document.createElement('div');
    bar.id = 'luliy-toolbar';

    /* ── Pill trigger button ──────────────────────────────── */
    var ctrlBtn = document.createElement('button');
    ctrlBtn.id = 'luliy-ctrl-btn';
    ctrlBtn.type = 'button';
    function refreshBtnLabel() {
      var sfx    = localStorage.getItem('luliy-sfx')    !== '0';
      var sakura = localStorage.getItem('luliy-sakura') !== '0';
      ctrlBtn.textContent = (sfx ? '\uD83D\uDD0A' : '\uD83D\uDD07') + ' \u2728 ' + (sakura ? '\uD83C\uDF38' : '\u00D7');
    }
    refreshBtnLabel();

    /* ── Dropdown panel ───────────────────────────────────── */
    var panel = document.createElement('div');
    panel.id = 'luliy-ctrl-panel';

    function mkSep() { var h = document.createElement('hr'); h.className = 'luliy-ctrl-sep'; return h; }
    function mkSec(t) { var d = document.createElement('div'); d.className = 'luliy-ctrl-sec'; d.textContent = t; return d; }
    function mkRow(emoji, label, badgeText) {
      var row  = document.createElement('button');
      row.type = 'button'; row.className = 'luliy-ctrl-row';
      var lbl  = document.createElement('span'); lbl.className = 'luliy-ctrl-lbl';
      var ico  = document.createElement('span'); ico.textContent = emoji;
      var txt  = document.createElement('span'); txt.textContent = label;
      lbl.appendChild(ico); lbl.appendChild(txt);
      var bdg  = document.createElement('span'); bdg.className = 'luliy-ctrl-badge'; bdg.textContent = badgeText;
      row.appendChild(lbl); row.appendChild(bdg);
      row._ico = ico; row._bdg = bdg;
      return row;
    }

    /* SFX */
    var sfxOn  = localStorage.getItem('luliy-sfx') !== '0';
    var sfxRow = mkRow(sfxOn ? '\uD83D\uDD0A' : '\uD83D\uDD07', '\u97f3\u6548', sfxOn ? '\u5f00\u542f' : '\u5173\u95ed');
    sfxRow.addEventListener('click', function (e) {
      e.stopPropagation();
      var on = localStorage.getItem('luliy-sfx') !== '0';
      localStorage.setItem('luliy-sfx', on ? '0' : '1');
      sfxRow._ico.textContent = !on ? '\uD83D\uDD0A' : '\uD83D\uDD07';
      sfxRow._bdg.textContent = !on ? '\u5f00\u542f' : '\u5173\u95ed';
      refreshBtnLabel();
    });
    panel.appendChild(sfxRow);
    panel.appendChild(mkSep());
    panel.appendChild(mkSec('\u98ce\u683c\u4e3b\u9898'));

    /* Theme rows */
    SINKS.forEach(function (s) {
      var row = mkRow('', s.label, '\u2713');
      row.setAttribute('data-sink', s.id);
      row.classList.add('luliy-sink-opt');
      /* Replace emoji span with color dot */
      var dot = document.createElement('span');
      dot.className = 'luliy-sink-dot'; dot.style.background = s.dot;
      row._ico.replaceWith(dot); row._dot = dot;
      row._bdg.style.opacity = '0';
      row.classList.add('luliy-ctrl-row'); /* shared row style */
      row.addEventListener('click', function (e) {
        e.stopPropagation();
        applySink(s.id);
        syncThemeRows();
        playSfx('click');
      });
      panel.appendChild(row);
    });

    /* Day / Night theme preview cards */
    var previewWrap = document.createElement('div');
    previewWrap.className = 'luliy-ctrl-theme-preview';

    var THEME_PALETTES = {
      'default':   { day: ['rgba(255,255,255,0.90)', '#8250df', '#1e1032'],  night: ['rgba(14,10,28,0.90)', '#cba6f7', '#cdd6f4'] },
      'sakura':    { day: ['rgba(255,238,245,0.92)', '#e05c8a', '#7a1040'],  night: ['rgba(42,10,28,0.88)',  '#f9a8c9', '#ffc5d0'] },
      'your-name': { day: ['rgba(230,244,255,0.92)', '#1a59a4', '#0d2b6b'],  night: ['rgba(4,14,52,0.90)',   '#93c5fd', '#c0e4ff'] },
      'space':     { day: ['rgba(2,8,36,0.88)',      '#00e5ff', '#c8e8ff'],  night: ['rgba(1,4,22,0.92)',    '#00e5ff', '#b8d8f0'] },
      'sunset':    { day: ['rgba(255,248,228,0.94)', '#d9930d', '#9a5a00'],  night: ['rgba(40,30,14,0.92)',  '#ffc14d', '#ffe2a8'] },
      'mono':      { day: ['rgba(255,255,255,0.94)', '#222222', '#111111'],  night: ['rgba(16,16,16,0.92)',  '#dddddd', '#e8e8e8'] }
    };

    function mkPreviewCard(label, bg, accent, textColor) {
      var card = document.createElement('div');
      card.className = 'luliy-ctrl-preview-card ' + label.toLowerCase();
      card.style.background = bg;
      card.style.color = textColor;
      card.style.borderColor = accent + '44';
      var dot = document.createElement('span');
      dot.className = 'preview-dot';
      dot.style.background = accent;
      var lbl = document.createElement('span');
      lbl.className = 'preview-label';
      lbl.textContent = label === 'day' ? '\u767d\u5929' : '\u591c\u665a';  /* 白天 / 夜晚 */
      card.appendChild(dot);
      card.appendChild(lbl);
      return card;
    }

    var previewDay   = mkPreviewCard('day',   'rgba(255,255,255,0.90)', '#8250df', '#1e1032');
    var previewNight = mkPreviewCard('night', 'rgba(14,10,28,0.90)',   '#cba6f7', '#cdd6f4');
    previewWrap.appendChild(previewDay);
    previewWrap.appendChild(previewNight);
    panel.appendChild(previewWrap);

    /* Make day/night cards interactive — click to switch colour mode */
    function setColorMode(mode) {
      var htmlEl = document.documentElement;
      /* Normalise current mode ('auto' resolves via media query) */
      var cur = htmlEl.getAttribute('data-color-mode') || 'light';
      if (cur === 'auto') {
        cur = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
          ? 'dark' : 'light';
      }
      if (cur === mode) { syncThemeRows(); return; }   /* already there */

      /* Prefer Gmeek's own toggle (keeps its storage in sync) … */
      var circle = document.querySelector('.circle');
      if (circle) circle.click();
      /* … then verify; fall back to manual attribute set */
      var after = htmlEl.getAttribute('data-color-mode') || '';
      if (after !== mode) {
        htmlEl.setAttribute('data-color-mode', mode);
        try { localStorage.setItem('meek_theme', mode); } catch (e) {}
      }
      /* Ripple from viewport centre */
      if (root._luliyThemeRipple) root._luliyThemeRipple(
        window.innerWidth / 2, window.innerHeight / 2);
      syncThemeRows();
    }
    previewDay.style.cursor = 'pointer';
    previewNight.style.cursor = 'pointer';
    previewDay.title = '\u5207\u6362\u767d\u5929\u6a21\u5f0f';   /* 切换白天模式 */
    previewNight.title = '\u5207\u6362\u591c\u665a\u6a21\u5f0f'; /* 切换夜晚模式 */
    previewDay.addEventListener('click', function(e) {
      e.stopPropagation(); setColorMode('light'); playSfx('theme');
    });
    previewNight.addEventListener('click', function(e) {
      e.stopPropagation(); setColorMode('dark'); playSfx('theme');
    });

    /* ── Active-state sync: highlight the card matching current mode ─ */
    function resolvedMode() {
      var m = document.documentElement.getAttribute('data-color-mode') || 'light';
      if (m === 'auto') {
        m = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
          ? 'dark' : 'light';
      }
      return m;
    }
    function syncModePreview() {
      var m = resolvedMode();
      previewDay.classList.toggle('is-active', m !== 'dark');
      previewNight.classList.toggle('is-active', m === 'dark');
    }
    syncModePreview();
    /* Follow external switches (Gmeek circle, OS auto) */
    try {
      new MutationObserver(syncModePreview).observe(document.documentElement, {
        attributes: true, attributeFilter: ['data-color-mode']
      });
    } catch (e) {}

    function syncThemeRows() {
      var cur = localStorage.getItem('luliy-sink') || 'default';
      panel.querySelectorAll('[data-sink]').forEach(function (r) {
        var active = r.getAttribute('data-sink') === cur;
        r.classList.toggle('is-active', active);
        if (r._bdg) r._bdg.style.opacity = active ? '1' : '0';
      });
      /* Update preview cards for active theme */
      var pal = THEME_PALETTES[cur] || THEME_PALETTES['default'];
      previewDay.style.background   = pal.day[0];
      previewDay.style.color        = pal.day[2];
      previewDay.style.borderColor  = pal.day[1] + '44';
      var dayDot = previewDay.querySelector('.preview-dot');
      if (dayDot) dayDot.style.background = pal.day[1];
      previewNight.style.background  = pal.night[0];
      previewNight.style.color       = pal.night[2];
      previewNight.style.borderColor = pal.night[1] + '44';
      var nightDot = previewNight.querySelector('.preview-dot');
      if (nightDot) nightDot.style.background = pal.night[1];
    }

    panel.appendChild(mkSep());

    /* Sakura */
    var sakuraOn  = localStorage.getItem('luliy-sakura') !== '0';
    var sakuraRow = mkRow('\uD83C\uDF38', '\u6a31\u82b1\u6548\u679c', sakuraOn ? '\u5f00\u542f' : '\u5173\u95ed');
    sakuraRow.addEventListener('click', function (e) {
      e.stopPropagation();
      var on = localStorage.getItem('luliy-sakura') !== '0';
      localStorage.setItem('luliy-sakura', on ? '0' : '1');
      sakuraRow._bdg.textContent = !on ? '\u5f00\u542f' : '\u5173\u95ed';
      refreshBtnLabel();
      if (on) stopSakura();
      else initSakura();
      playSfx('click');
    });
    panel.appendChild(sakuraRow);

    /* BG */
    panel.appendChild(mkSep());
    var bgRow = mkRow('\uD83D\uDDBC', '\u80cc\u666f\u56fe\u7247', '\u66F4\u6362');
    bgRow.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.classList.remove('is-open');
      ctrlBtn.classList.remove('is-open');
      setTimeout(showBgPicker, 80);
    });
    panel.appendChild(bgRow);

    /* Background blur slider:  −  Npx  +  */
    var blurRow = document.createElement('div');
    blurRow.className = 'luliy-ctrl-row';
    blurRow.style.cursor = 'default';
    var blurLbl = document.createElement('span');
    blurLbl.className = 'luliy-ctrl-lbl';
    blurLbl.textContent = '\uD83C\uDF2B\uFE0F \u80cc\u666f\u6a21\u7cca';   /* 🌫️ 背景模糊 */
    var blurCtrls = document.createElement('span');
    blurCtrls.style.cssText = 'display:flex;align-items:center;gap:6px';
    function mkBtn(txt) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = txt; b.className = 'luliy-fs-btn';
      return b;
    }
    var blurMinus = mkBtn('\u2212');   /* − */
    var blurVal = document.createElement('span');
    blurVal.className = 'luliy-ctrl-badge';
    var blurPlus = mkBtn('\uff0b');    /* ＋ */
    blurCtrls.appendChild(blurMinus); blurCtrls.appendChild(blurVal); blurCtrls.appendChild(blurPlus);
    blurRow.appendChild(blurLbl); blurRow.appendChild(blurCtrls);
    panel.appendChild(blurRow);
    function curBlur() { return parseInt(localStorage.getItem('luliy-bgblur') || '0', 10) || 0; }
    function setBlur(px) {
      px = Math.min(20, Math.max(0, px));
      localStorage.setItem('luliy-bgblur', String(px));
      if (root._luliyApplyBgBlur) root._luliyApplyBgBlur();
      blurVal.textContent = px + 'px';
    }
    blurVal.textContent = curBlur() + 'px';
    blurMinus.addEventListener('click', function (e) { e.stopPropagation(); setBlur(curBlur() - 2); playSfx('click'); });
    blurPlus.addEventListener('click',  function (e) { e.stopPropagation(); setBlur(curBlur() + 2); playSfx('click'); });

    /* ── Reading settings (article pages only) ───────────── */
    if (document.getElementById('postBody')) {
      panel.appendChild(mkSep());
      panel.appendChild(mkSec('\u9605\u8bfb\u8bbe\u7f6e'));   /* 阅读设置 */

      /* Font size row: A-  18px  A+ */
      var fsRow = document.createElement('div');
      fsRow.className = 'luliy-ctrl-row';
      fsRow.style.cursor = 'default';
      var fsLbl = document.createElement('span');
      fsLbl.className = 'luliy-ctrl-lbl';
      fsLbl.textContent = '\uD83D\uDD24 \u5b57\u53f7';        /* 🔤 字号 */
      var fsCtrls = document.createElement('span');
      fsCtrls.style.cssText = 'display:flex;align-items:center;gap:6px';
      function mkFsBtn(txt) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = txt;
        b.className = 'luliy-fs-btn';
        return b;
      }
      var fsMinus = mkFsBtn('A-');
      var fsVal = document.createElement('span');
      fsVal.className = 'luliy-ctrl-badge';
      var fsPlus = mkFsBtn('A+');
      fsCtrls.appendChild(fsMinus); fsCtrls.appendChild(fsVal); fsCtrls.appendChild(fsPlus);
      fsRow.appendChild(fsLbl); fsRow.appendChild(fsCtrls);
      panel.appendChild(fsRow);

      function curFs() { return parseInt(localStorage.getItem('luliy-fontsize') || '18', 10) || 18; }
      function setFs(px) {
        px = Math.min(24, Math.max(14, px));
        localStorage.setItem('luliy-fontsize', String(px));
        applyReadingPrefs();
        fsVal.textContent = px + 'px';
      }
      fsVal.textContent = curFs() + 'px';
      fsMinus.addEventListener('click', function (e) { e.stopPropagation(); setFs(curFs() - 1); playSfx('click'); });
      fsPlus.addEventListener('click',  function (e) { e.stopPropagation(); setFs(curFs() + 1); playSfx('click'); });

      /* Font style: cycle default → 黑体 → 苍耳今楷 */
      var _fontLabels = {'0':'\u9ed8\u8ba4','1':'\u9ed1\u4f53','2':'\u82cd\u8033\u6977'};
      var sansRow = mkRow('\u270d', '\u5b57\u4f53', _fontLabels[localStorage.getItem('luliy-sans')||'0']);
      sansRow.addEventListener('click', function (e) {
        e.stopPropagation();
        var cur = localStorage.getItem('luliy-sans') || '0';
        var next = cur === '0' ? '1' : cur === '1' ? '2' : '0';
        localStorage.setItem('luliy-sans', next);
        sansRow._bdg.textContent = _fontLabels[next];
        applyReadingPrefs();
        playSfx('click');
      });
      panel.appendChild(sansRow);

      /* Reading-panel width slider:  −  +Npx  +  (centred, extends both sides) */
      var pwRow = document.createElement('div');
      pwRow.className = 'luliy-ctrl-row';
      pwRow.style.cursor = 'default';
      var pwLbl = document.createElement('span');
      pwLbl.className = 'luliy-ctrl-lbl';
      pwLbl.textContent = '\u2194\uFE0F \u9605\u8bfb\u5bbd\u5ea6';   /* ↔️ 阅读宽度 */
      var pwCtrls = document.createElement('span');
      pwCtrls.style.cssText = 'display:flex;align-items:center;gap:6px';
      function mkPwBtn(txt) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = txt; b.className = 'luliy-fs-btn';
        return b;
      }
      var pwMinus = mkPwBtn('\u2212');
      var pwVal = document.createElement('span');
      pwVal.className = 'luliy-ctrl-badge';
      var pwPlus = mkPwBtn('\uff0b');
      pwCtrls.appendChild(pwMinus); pwCtrls.appendChild(pwVal); pwCtrls.appendChild(pwPlus);
      pwRow.appendChild(pwLbl); pwRow.appendChild(pwCtrls);
      panel.appendChild(pwRow);
      function curPw() { return parseInt(localStorage.getItem('luliy-pbwidth') || '0', 10) || 0; }
      function setPw(d) {
        d = Math.min(400, Math.max(0, d));
        localStorage.setItem('luliy-pbwidth', String(d));
        if (root._luliyApplyPbWidth) root._luliyApplyPbWidth();
        pwVal.textContent = '+' + d;
      }
      pwVal.textContent = '+' + curPw();
      pwMinus.addEventListener('click', function (e) { e.stopPropagation(); setPw(curPw() - 40); playSfx('click'); });
      pwPlus.addEventListener('click',  function (e) { e.stopPropagation(); setPw(curPw() + 40); playSfx('click'); });
    }

    /* ── ⚙ Extras: card view / cursor trail / fireflies / focus / reduce-motion ── */
    panel.appendChild(mkSep());
    panel.appendChild(mkSec('\u2728 \u4e2a\u6027\u5316'));   /* ✨ 个性化 */

    /* Card view (grid/list) — only meaningful on list pages */
    var _cvLabels = { grid: '\u7f51\u683c', list: '\u5217\u8868', timeline: '\u65f6\u95f4\u8f74' };
    var cardViewRow = mkRow('\uD83D\uDD33', '\u5361\u7247\u89c6\u56fe', _cvLabels[getCardView()]);
    cardViewRow.addEventListener('click', function (e) {
      e.stopPropagation();
      var order = ['grid', 'list', 'timeline'];
      var cur = order.indexOf(getCardView());
      var next = order[(cur + 1) % order.length];
      localStorage.setItem('luliy-cardview', next);
      cardViewRow._bdg.textContent = _cvLabels[next];
      if (root._luliyRerenderCards) root._luliyRerenderCards();
      else applyCardView();
      playSfx('click');
    });
    panel.appendChild(cardViewRow);

    /* Mouse trail toggle */
    var trailRow = mkRow('\u2728', '\u9f20\u6807\u62d6\u5c3e',
      localStorage.getItem('luliy-trail') === '1' ? '\u5f00\u542f' : '\u5173\u95ed');
    trailRow.addEventListener('click', function (e) {
      e.stopPropagation();
      var on = localStorage.getItem('luliy-trail') === '1';
      localStorage.setItem('luliy-trail', on ? '0' : '1');
      trailRow._bdg.textContent = !on ? '\u5f00\u542f' : '\u5173\u95ed';
      if (!on) initMouseTrail(); else stopMouseTrail();
      playSfx('click');
    });
    panel.appendChild(trailRow);

    /* Fireflies toggle (dark mode) */
    var fireflyRow = mkRow('\uD83E\uDD9F', '\u8424\u706b\u866b',
      localStorage.getItem('luliy-firefly') === '1' ? '\u5f00\u542f' : '\u5173\u95ed');
    fireflyRow.addEventListener('click', function (e) {
      e.stopPropagation();
      var on = localStorage.getItem('luliy-firefly') === '1';
      localStorage.setItem('luliy-firefly', on ? '0' : '1');
      fireflyRow._bdg.textContent = !on ? '\u5f00\u542f' : '\u5173\u95ed';
      if (!on) initFireflies(); else stopFireflies();
      playSfx('click');
    });
    panel.appendChild(fireflyRow);

    /* Reduce-motion override */
    var reduceRow = mkRow('\uD83C\uDF00', '\u51cf\u5f31\u52a8\u6548',
      localStorage.getItem('luliy-reduce') === '1' ? '\u5f00\u542f' : '\u5173\u95ed');
    reduceRow.addEventListener('click', function (e) {
      e.stopPropagation();
      var on = localStorage.getItem('luliy-reduce') === '1';
      localStorage.setItem('luliy-reduce', on ? '0' : '1');
      reduceRow._bdg.textContent = !on ? '\u5f00\u542f' : '\u5173\u95ed';
      applyReduceMotion();
      playSfx('click');
    });
    panel.appendChild(reduceRow);

    /* Focus reading mode (article pages only) */
    if (document.getElementById('postBody')) {
      var focusRow = mkRow('\uD83D\uDCD6', '\u4e13\u6ce8\u9605\u8bfb',
        document.body.classList.contains('luliy-focus-mode') ? '\u5f00\u542f' : '\u5173\u95ed');
      focusRow.addEventListener('click', function (e) {
        e.stopPropagation();
        var on = toggleFocusMode();
        focusRow._bdg.textContent = on ? '\u5f00\u542f' : '\u5173\u95ed';
      });
      focusRow._badge = focusRow._bdg;
      root._luliyFocusRow = focusRow;
      panel.appendChild(focusRow);
    }

    /* Toggle open / close */
    ctrlBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = panel.classList.toggle('is-open');
      ctrlBtn.classList.toggle('is-open', open);
      if (open) syncThemeRows();
    });
    document.addEventListener('click', function () {
      panel.classList.remove('is-open');
      ctrlBtn.classList.remove('is-open');
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });

    var ctrlWrap = document.createElement('div');
    ctrlWrap.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:flex-end';
    ctrlWrap.appendChild(ctrlBtn);
    ctrlWrap.appendChild(panel);
    bar.appendChild(ctrlWrap);
    document.body.appendChild(bar);
    applySink(localStorage.getItem('luliy-sink') || 'default');
  }

  /* ---- 14  Home card rebuild ------------------------------ */
  function buildPostLink(rawLink) {
    var lnk = rawLink || '#';
    if (lnk !== '#') {
      lnk = lnk.replace(/^\//, '');
      lnk = lnk.replace(/^post\/post\//, 'post/');
      if (!/^post\//.test(lnk) && !/^https?:\/\//.test(lnk)) lnk = 'post/' + lnk;
      lnk = '/' + lnk;
    }
    return lnk;
  }

  function initCards() {
    if (/tag\.html?$|\/tag\/?$/i.test(location.pathname)) return;
    var nav = document.querySelector('nav.SideNav, ul.SideNav, .SideNav');
    if (!nav || nav.getAttribute('data-luliy-cards')) return;
    nav.setAttribute('data-luliy-cards', '1');

    /* Show skeleton placeholders while postList.json loads */
    showCardSkeleton(nav);

    function buildCard(post, isPinned, colourIdx) {
      var li = document.createElement('li');
      li.className = 'luliy-card';
      li.setAttribute('data-ci', String((colourIdx || 0) % 4));
      if (isPinned) li.setAttribute('data-pinned', '1');

      /* Theme decoration layer (sakura petals / stars / etc.) */
      var deco = document.createElement('div');
      deco.className = 'luliy-card-deco';
      deco.setAttribute('aria-hidden', 'true');
      li.appendChild(deco);

      var a = document.createElement('a');
      a.href = buildPostLink(post.link);
      a.className = 'luliy-card-inner';

      var dateEl = document.createElement('div');
      dateEl.className = 'luliy-card-date';
      var absDate = post.created ? post.created.slice(0, 10) : '';
      var relDate = relativeTime(post.created);
      /* Relative time display, absolute date on hover */
      dateEl.textContent = relDate ? (relDate + ' \u00b7 ' + absDate) : absDate;
      dateEl.title = absDate;

      var titleEl = document.createElement('div');
      titleEl.className = 'luliy-card-title';
      titleEl.textContent = post.title || '\u65e0\u9898';

      var tagsEl = document.createElement('div');
      tagsEl.className = 'luliy-card-tags';
      var labels = Array.isArray(post.labels) ? post.labels : [];
      labels.forEach(function (lbl) {
        var info = (typeof lbl === 'object') ? lbl : { name: lbl, color: '0969da' };
        if (/^pinned(-\d+)?$/.test(info.name || lbl)) return;
        var pill = document.createElement('a');
        pill.className = 'luliy-card-pill';
        pill.href = '/tag.html#' + encodeURIComponent(info.name || lbl);
        pill.textContent = info.name || lbl;
        pill.style.background = '#' + (info.color || '0969da').replace('#', '');
        tagsEl.appendChild(pill);
      });

      a.appendChild(dateEl);
      a.appendChild(titleEl);
      a.appendChild(tagsEl);
      li.appendChild(a);
      return li;
    }

    fetchPosts().then(function (posts) {
      if (!posts || !posts.length) { fallbackDomCards(nav); return; }

      var pinnedPosts  = posts.filter(function (p) { return p.pinned; });
      var regularPosts = posts.filter(function (p) { return !p.pinned; });

      /* Multi-level pin sort: higher pinLevel first, then newest first */
      pinnedPosts.sort(function (a, b) {
        if ((b.pinLevel || 1) !== (a.pinLevel || 1)) return (b.pinLevel || 1) - (a.pinLevel || 1);
        return String(b.created).localeCompare(String(a.created));
      });

      var pageMatch = location.search.match(/[?&]page=([0-9]+)/);
      var pageNum = pageMatch ? parseInt(pageMatch[1]) : 1;
      var perPage = 12;
      var onIndex = isIndexPage();

      /* Pinned section — fixed area, always above the regular grid */
      if (pinnedPosts.length > 0 && onIndex && pageNum === 1) {
        var existing = document.getElementById('luliy-pinned-section');
        if (existing) existing.remove();
        var ps = document.createElement('div');
        ps.id = 'luliy-pinned-section';
        var pg = document.createElement('ul');
        pg.className = 'luliy-card-grid luliy-pinned-grid';
        pinnedPosts.forEach(function (post, i) { pg.appendChild(buildCard(post, true, i)); });
        ps.appendChild(pg);
        nav.parentNode.insertBefore(ps, nav);
      }

      /* Shared helpers for both render paths */
      var _tlObserver = null;          /* timeline IntersectionObserver */
      function appendWithYearDiv(container, post, i, state) {
        var y = (post.created || '').slice(0, 4);
        if (y && y !== state.lastYear) {
          state.lastYear = y;
          var divider = document.createElement('li');
          divider.className = 'luliy-card-yeardiv';
          divider.innerHTML = '<span>' + esc(y) + '</span>';
          container.appendChild(divider);
        }
        container.appendChild(buildCard(post, false, i));
      }
      function teardownTimeline() {
        if (_tlObserver) { try { _tlObserver.disconnect(); } catch (e) {} _tlObserver = null; }
        var sent = document.getElementById('luliy-tl-sentinel');
        if (sent) sent.remove();
        document.body.classList.remove('luliy-tl-infinite');
      }

      /* ── Paginated render (grid / list views) ──────────── */
      function renderPaged() {
        teardownTimeline();
        var displayPosts = regularPosts;
        if (onIndex) {
          var start = (pageNum - 1) * perPage;
          displayPosts = regularPosts.slice(start, start + perPage);
        }
        nav.innerHTML = '';
        nav.className = 'luliy-card-grid';
        var st = { lastYear: null };
        displayPosts.forEach(function (post, i) { appendWithYearDiv(nav, post, i, st); });
      }

      /* ── Timeline render: infinite scroll, no post limit ──── */
      function renderTimeline() {
        teardownTimeline();
        nav.innerHTML = '';
        nav.className = 'luliy-card-grid';
        document.body.classList.add('luliy-tl-infinite');   /* hides pagination */

        var BATCH = 15;
        var cursor = 0;
        var st = { lastYear: null };

        /* Sentinel sits AFTER the grid so the spine isn't stretched by it */
        var sentinel = document.createElement('div');
        sentinel.id = 'luliy-tl-sentinel';
        sentinel.textContent = '\u52a0\u8f7d\u4e2d\u2026';   /* 加载中… */
        nav.parentNode.insertBefore(sentinel, nav.nextSibling);

        function appendBatch() {
          var end = Math.min(cursor + BATCH, regularPosts.length);
          for (var i = cursor; i < end; i++) {
            appendWithYearDiv(nav, regularPosts[i], i, st);
          }
          cursor = end;
          if (cursor >= regularPosts.length) {
            sentinel.textContent =
              '\u2014 \u5168\u90e8 ' + regularPosts.length + ' \u7bc7\u5df2\u52a0\u8f7d \u2014'; /* — 全部 N 篇已加载 — */
            sentinel.classList.add('is-done');
            if (_tlObserver) { try { _tlObserver.disconnect(); } catch (e) {} _tlObserver = null; }
          }
        }

        appendBatch();   /* first screen */

        if (cursor < regularPosts.length) {
          if ('IntersectionObserver' in window) {
            _tlObserver = new IntersectionObserver(function (entries) {
              entries.forEach(function (en) {
                if (en.isIntersecting) appendBatch();
              });
            }, { rootMargin: '600px 0px' });   /* prefetch well before bottom */
            _tlObserver.observe(sentinel);
          } else {
            /* Fallback: rAF-throttled scroll proximity check */
            onScrollRAF(function () {
              if (!sentinel.isConnected) return;   /* view switched away */
              if (cursor >= regularPosts.length) return;
              var r = sentinel.getBoundingClientRect();
              if (r.top < window.innerHeight + 600) appendBatch();
            });
          }
        }
      }

      /* ── Route by current view + expose re-render for view switch ─ */
      function renderRegular() {
        if (getCardView() === 'timeline') renderTimeline();
        else renderPaged();
        applyCardView();
      }
      root._luliyRerenderCards = renderRegular;
      renderRegular();

    }).catch(function () { fallbackDomCards(nav); });

    function fallbackDomCards(container) {
      container.className = 'luliy-card-grid';
      container.querySelectorAll('li.SideNav-item, .SideNav-item').forEach(function (li, i) {
        li.className = 'luliy-card';
        var existingA = li.querySelector('a');
        if (!existingA) return;
        var rawText = (existingA.innerText || existingA.textContent || '').trim();
        var href = existingA.href;
        li.innerHTML = '';
        var inner = document.createElement('a');
        inner.className = 'luliy-card-inner';
        inner.href = href;
        var dateEl = document.createElement('div'); dateEl.className = 'luliy-card-date';
        var titleEl = document.createElement('div'); titleEl.className = 'luliy-card-title';
        titleEl.textContent = rawText || '\u65e0\u9898';
        inner.appendChild(dateEl); inner.appendChild(titleEl);
        li.appendChild(inner);
      });
    }
  }

  /* ---- 15  macOS code block strip (+ line numbers) --------- */
  /* One global Escape handler for all fullscreen code blocks
     (previously each <pre> registered its own document listener). */
  var _codeEscBound = false;
  function bindCodeEscape() {
    if (_codeEscBound) return;
    _codeEscBound = true;
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('pre.code-fullscreen').forEach(function (pre) {
        pre.classList.remove('code-fullscreen');
        var g = pre.querySelector('.mac-btn-green');
        if (g) g.setAttribute('data-tip', '\u5168\u5c4f\u9605\u8bfb');
      });
    });
  }

  function initCodeBlocks(pbody) {
    applyCodeBlocks(pbody);
    if (pbody._luliyCodeObs) return;
    pbody._luliyCodeObs = true;
    try {
      var obs = new MutationObserver(function () { applyCodeBlocks(pbody); });
      obs.observe(pbody, { childList: true, subtree: true });
    } catch (e) {}
  }

  function applyCodeBlocks(pbody) {
    pbody.querySelectorAll('pre').forEach(function (pre) {
      if (pre.querySelector('.mac-strip')) return; /* already decorated */
      var code = pre.querySelector('code'); if (!code) return;

      function makeBtn(cls, tip) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'mac-btn ' + cls;
        b.setAttribute('data-tip', tip); b.setAttribute('aria-label', tip);
        return b;
      }

      /* Create mac-strip wrapper */
      var strip = document.createElement('div');
      strip.className = 'mac-strip';

      /* RED = Copy */
      var bR = makeBtn('mac-btn-red', '\u590d\u5236\u4ee3\u7801');
      bR.addEventListener('click', function (e) {
        e.stopPropagation(); playSfx('click');
        var txt = code.innerText || code.textContent || '';
        function done() {
          bR.setAttribute('data-tip', '\u5df2\u590d\u5236 \u2713');
          setTimeout(function () { bR.setAttribute('data-tip', '\u590d\u5236\u4ee3\u7801'); }, 1500);
        }
        if (navigator.clipboard && location.protocol === 'https:') {
          navigator.clipboard.writeText(txt).then(done).catch(done);
        } else {
          var ta = document.createElement('textarea');
          ta.value = txt; ta.style.cssText = 'position:fixed;left:-9999px';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch (_) {}
          ta.remove(); done();
        }
      });

      /* YELLOW = Collapse */
      var bY = makeBtn('mac-btn-yellow', '\u6298\u53e0\u4ee3\u7801');
      bY.addEventListener('click', function (e) {
        e.stopPropagation(); playSfx('click');
        var folded = pre.classList.toggle('is-folded');
        bY.setAttribute('data-tip', folded ? '\u5c55\u5f00\u4ee3\u7801' : '\u6298\u53e0\u4ee3\u7801');
      });

      /* GREEN = Fullscreen */
      var bG = makeBtn('mac-btn-green', '\u5168\u5c4f\u9605\u8bfb');
      function toggleFS() {
        playSfx('sci');
        var fs = pre.classList.toggle('code-fullscreen');
        bG.setAttribute('data-tip', fs ? '\u9000\u51fa\u5168\u5c4f' : '\u5168\u5c4f\u9605\u8bfb');
      }
      bG.addEventListener('click', function (e) { e.stopPropagation(); toggleFS(); });
      pre.addEventListener('dblclick', function (e) {
        if (e.target === bR || e.target === bY || e.target === bG) return;
        toggleFS();
      });
      bindCodeEscape();

      /* ── Line numbers gutter (blocks with 2+ lines) ─────── */
      var rawTxt = (code.textContent || '').replace(/\n$/, '');
      var lineCount = rawTxt.split('\n').length;
      if (lineCount > 1 && !pre.querySelector('.luliy-lineno')) {
        var gutter = document.createElement('span');
        gutter.className = 'luliy-lineno';
        gutter.setAttribute('aria-hidden', 'true');
        /* Build the numbers string — must match code's actual line count */
        var nums = '';
        for (var ln = 1; ln <= lineCount; ln++) nums += ln + '\n';
        gutter.textContent = nums.replace(/\n$/, '');  /* trim trailing newline to match code */
        pre.insertBefore(gutter, code);
        pre.classList.add('has-lineno');
      }

      /* Language label */
      var langMatch = (code.className || '').match(/language-(\w+)/);
      if (langMatch) {
        var langEl = document.createElement('span');
        langEl.className = 'mac-lang';
        langEl.textContent = langMatch[1].toUpperCase();
        strip.appendChild(bR); strip.appendChild(bY); strip.appendChild(bG);
        strip.appendChild(langEl);
      } else {
        strip.appendChild(bR); strip.appendChild(bY); strip.appendChild(bG);
      }

      pre.insertBefore(strip, pre.firstChild);
    });
  }

  /* ---- 16  Sakura — heart petals (sakuraPlus, image-based) -- */
  /* Replaces the old seasonal canvas. Wired to the luliy-sakura key
     and to the toolbar toggle via initSakura()/stopSakura(). */
  var _sakuraImg = new Image();
  var _sakuraImgReady = false;
  _sakuraImg.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUgAAAEwCAYAAADVZeifAAAACXBIWXMAAACYAAAAmAGiyIKYAAAHG2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBSaWdodHM9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9yaWdodHMvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtcFJpZ2h0czpNYXJrZWQ9IkZhbHNlIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6NDFDMjQxQjYyNjIwNjgxMTgwODNEMjE2MDAzOTU1NDQiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDozNDVjOWViOC04NDc4LTFkNDctOGRjMi0yZDkyOGNhYTYxZWQiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6YjAzN2ZiMGItNTU5Mi0xYjRkLWJjZGQtOWU4NGExMDJiMGM2IiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDE4LTA1LTA5VDE0OjQ5OjM3KzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOC0wNS0wOVQxNDo1MToyNSswODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOC0wNS0wOVQxNDo1MToyNSswODowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjEyMjVlZWE3LTEyY2QtMTY0NC04ZDAzLWFjOTE2ZTAxZDQ1YyIgc3RSZWY6ZG9jdW1lbnRJRD0idXVpZDoxRDIwNUFGNjZCRDlFNTExOUM5REMwMzg2RjlEQjFGNyIvPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDphYmMzNjIzMy1hOWNkLWNiNDQtODViYi0zZTgyMjEwYmIxMjYiIHN0RXZ0OndoZW49IjIwMTgtMDUtMDlUMTQ6NTE6MjUrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YjAzN2ZiMGItNTU5Mi0xYjRkLWJjZGQtOWU4NGExMDJiMGM2IiBzdEV2dDp3aGVuPSIyMDE4LTA1LTA5VDE0OjUxOjI1KzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2Vx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";
  _sakuraImg.onload = function () { _sakuraImgReady = true; };

  var _sakuraNum = 21;            /* 21 petals — each one says "I love you" :) */
  var _sakuraRAF = null;
  var _sakuraCanvas = null;

  function _sakuraRandom(option) {
    var ret, random;
    switch (option) {
      case 'x': ret = Math.random() * window.innerWidth; break;
      case 'y': ret = Math.random() * window.innerHeight; break;
      case 's': ret = Math.random(); break;
      case 'r': ret = Math.random() * 6; break;
      case 'fnx':
        random = -0.5 + Math.random() * 1;
        ret = function (x) { return x + 0.5 * random - 1.7; };
        break;
      case 'fny':
        random = 1.5 + Math.random() * 0.7;
        ret = function (y) { return y + random; };
        break;
      case 'fnr':
        random = Math.random() * 0.03;
        ret = function (r) { return r + random; };
        break;
    }
    return ret;
  }

  function _SakuraPetal(x, y, sc, r, fn, idx) {
    this.x = x; this.y = y; this.s = sc; this.r = r; this.fn = fn; this.idx = idx;
  }
  _SakuraPetal.prototype.draw = function (ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.r);
    if (_sakuraImgReady) ctx.drawImage(_sakuraImg, 0, 0, 40 * this.s, 40 * this.s);
    ctx.restore();
  };
  _SakuraPetal.prototype.update = function () {
    this.x = this.fn.x(this.x);
    this.y = this.fn.y(this.y);
    this.r = this.fn.r(this.r);
    if (this.x > window.innerWidth || this.x < 0 ||
        this.y > window.innerHeight || this.y < 0) {
      this.r = _sakuraRandom('fnr');
      if (Math.random() > 0.4) {
        this.x = _sakuraRandom('x'); this.y = 0;
      } else {
        this.x = window.innerWidth; this.y = _sakuraRandom('y');
      }
      this.s = _sakuraRandom('s');
      this.r = _sakuraRandom('r');
    }
  };

  function initSakura() {
    if (localStorage.getItem('luliy-sakura') === '0') return;
    if (document.getElementById('luliy-sakura-canvas')) return;
    var canvas = document.createElement('canvas');
    canvas.id = 'luliy-sakura-canvas';
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.setAttribute('style', 'position:fixed;left:0;top:0;pointer-events:none;z-index:1;');
    document.body.appendChild(canvas);
    _sakuraCanvas = canvas;
    var ctx = canvas.getContext('2d');

    var list = [];
    for (var i = 0; i < _sakuraNum; i++) {
      list.push(new _SakuraPetal(
        _sakuraRandom('x'), _sakuraRandom('y'), _sakuraRandom('s'), _sakuraRandom('r'),
        { x: _sakuraRandom('fnx'), y: _sakuraRandom('fny'), r: _sakuraRandom('fnr') }, i));
    }

    function tick() {
      if (!document.getElementById('luliy-sakura-canvas')) { _sakuraRAF = null; return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < list.length; i++) { list[i].update(); list[i].draw(ctx); }
      _sakuraRAF = requestAnimationFrame(tick);
    }
    _sakuraRAF = requestAnimationFrame(tick);

    if (!initSakura._resizeBound) {
      window.addEventListener('resize', function () {
        var c = document.getElementById('luliy-sakura-canvas');
        if (c) { c.width = window.innerWidth; c.height = window.innerHeight; }
      }, { passive: true });
      initSakura._resizeBound = true;
    }
  }

  function stopSakura() {
    if (_sakuraRAF) { cancelAnimationFrame(_sakuraRAF); _sakuraRAF = null; }
    var c = document.getElementById('luliy-sakura-canvas');
    if (c && c.parentNode) c.parentNode.removeChild(c);
    _sakuraCanvas = null;
  }
  root._luliyStopSakura = stopSakura;

/* ---- 17  ArticleTOC scroll-spy + back-to-top ------------ */
  function initArticleTocSpy() {
    if (!document.getElementById('postBody')) return;
    var pbody = document.getElementById('postBody');

    /* Back-to-top button */
    if (!document.getElementById('luliy-back-top')) {
      var btn = document.createElement('button');
      btn.id = 'luliy-back-top';
      btn.innerHTML = '&#8679;';
      btn.setAttribute('aria-label', '\u56de\u5230\u9876\u90e8');
      btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        playSfx('click');
      });
      document.body.appendChild(btn);
      onScrollRAF(function () {
        btn.classList.toggle('is-visible', (window.scrollY || 0) > 300);
      });
    }

    function trySetup() {
      var toc = document.querySelector('#TOC, .articletoc, .toc, .ArticleTOC, #articleTOC, #postBody > nav, [id*="articleTOC"], [class*="ArticleTOC"]');
      if (!toc) return false;
      if (toc._luliySpy) return true;

      /* ── Extract TOC from inside #postBody → append to body ──
         articletoc.js inserts the TOC inline inside #postBody.
         We move it to document.body so position:fixed works correctly,
         it renders OUTSIDE the article glass card, AND its z-index is
         evaluated in the root stacking context (ancestors with
         backdrop-filter/transform would otherwise trap it below the
         toolbar panel).                                              */
      if (toc.parentElement !== document.body) {
        document.body.appendChild(toc);
      }

      toc._luliySpy = true;

      if (!toc.querySelector('.luliy-toc-injected-hdr')) {
        var hdr = document.createElement('div');
        hdr.className = 'luliy-toc-injected-hdr';
        var lbl = document.createElement('span');
        lbl.className = 'luliy-toc-injected-label';
        lbl.textContent = '\u76ee\u5f55';
        var totop = document.createElement('button');
        totop.type = 'button';
        totop.className = 'luliy-toc-injected-totop';
        totop.textContent = '\u2191 \u56de\u9876';
        totop.addEventListener('click', function () {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          playSfx('click');
        });
        hdr.appendChild(lbl); hdr.appendChild(totop);
        toc.insertBefore(hdr, toc.firstChild);
      }

      /* Auto-expand TOC panel on article load */
      setTimeout(function () {
        /* Case 1: inside a <details> element */
        var det = toc;
        while (det && det !== document.body) {
          if (det.tagName === 'DETAILS') { det.open = true; break; }
          det = det.parentElement;
        }
        /* Case 2: parent/container is hidden */
        var container = toc.parentElement;
        if (container) {
          var cs = window.getComputedStyle(container);
          if (cs.display === 'none') container.style.display = 'block';
          if (cs.visibility === 'hidden') container.style.visibility = 'visible';
        }
        /* Case 3: a sibling/ancestor toggle button with aria-expanded=false */
        var root = (toc.parentElement || document.body);
        root.querySelectorAll('button[aria-expanded="false"], button[aria-controls]').forEach(function (btn) {
          var ctrl = btn.getAttribute('aria-controls');
          if (ctrl) {
            var target = document.getElementById(ctrl);
            if (target && (target === toc || target.contains(toc) || toc.contains(target))) {
              btn.click();
            }
          }
        });
        /* Case 4: ensure the TOC wrapper itself is visible */
        toc.style.display = '';
        toc.style.visibility = '';
      }, 600);

      /* Assign IDs to headings */
      var allH = Array.from(pbody.querySelectorAll('h1,h2,h3,h4'));
      allH.forEach(function (h, i) {
        if (!h.id) {
          var slug = (h.textContent || '').trim()
            .toLowerCase()
            .replace(/[\s\u3000]+/g, '-')
            .replace(/[^\w\u4e00-\u9fff-]/g, '')
            .slice(0, 40) || ('h-' + i);
          var base = slug, n = 1;
          while (document.getElementById(slug)) slug = base + '-' + (n++);
          h.id = slug;
        }
      });

      var headings = allH.filter(function (h) { return h.id; });
      var links = Array.from(toc.querySelectorAll('a[href^="#"]'));
      if (!headings.length || !links.length) return true;

      /* ── Strip inline colour the articletoc plugin sets on links /
         their inner spans — otherwise it overrides the themed,
         dark-mode-readable colours from enhance.css.               */
      links.forEach(function (a) {
        a.style.removeProperty('color');
        a.style.removeProperty('background');
        a.style.removeProperty('background-color');
        a.querySelectorAll('*').forEach(function (el) {
          el.style.removeProperty('color');
          el.style.removeProperty('background');
          el.style.removeProperty('background-color');
        });
      });
      /* Also strip from any non-link list items / spans in the TOC */
      toc.querySelectorAll('li, span, summary, div').forEach(function (el) {
        if (el.classList.contains('luliy-toc-injected-hdr') ||
            el.classList.contains('luliy-toc-injected-label') ||
            el.classList.contains('luliy-toc-injected-totop')) return;
        var c = el.style && el.style.color;
        if (c) el.style.removeProperty('color');
      });

      var lastActiveId = null;
      function onScroll() {
        var activeH = null;
        for (var i = 0; i < headings.length; i++) {
          if (headings[i].getBoundingClientRect().top <= 110) activeH = headings[i];
          else break;
        }
        if (!activeH && headings.length) activeH = headings[0];
        var newId = activeH ? activeH.id : null;
        if (newId === lastActiveId) return;
        lastActiveId = newId;
        links.forEach(function (a) { a.classList.remove('active', 'luliy-toc-active'); });
        if (activeH) {
          for (var j = 0; j < links.length; j++) {
            if (links[j].getAttribute('href') === '#' + activeH.id) {
              links[j].classList.add('active', 'luliy-toc-active'); break;
            }
          }
        }
      }
      onScrollRAF(onScroll);
      return true;
    }

    if (!trySetup()) {
      var n = 0;
      var iv = setInterval(function () {
        if (trySetup() || ++n > 20) clearInterval(iv);
      }, 400);
    }
  }

  /* ---- 18  Mobile nav hamburger + dropdown ---------------- */
  function initMobileNav() {
    if (document.getElementById('luliy-nav-ham')) return;

    var ham = document.createElement('button');
    ham.id = 'luliy-nav-ham'; ham.type = 'button';
    ham.setAttribute('aria-label', '\u83dc\u5355');
    ham.innerHTML = '<span></span><span></span><span></span>';

    var drop = document.createElement('div');
    drop.id = 'luliy-nav-dropdown';

    /* Populate dropdown from .title-right, skipping "about" */
    function makeSep() {
      var hr = document.createElement('hr');
      hr.style.cssText = 'border:none;border-top:1px solid rgba(130,80,223,0.15);margin:4px 0;';
      return hr;
    }
    function makeDropLabel(text) {
      var d = document.createElement('div');
      d.className = 'luliy-drop-label';
      d.textContent = text;
      return d;
    }

    function populateDrop() {
      drop.innerHTML = '';

      /* -- Nav links: stashed by navbar rebuild (title-right is emptied) -- */
      try {
        var navMeta = (root._luliyNavLinks || []).filter(function (m) { return m.href || m.absHref; });
        if (navMeta.length) {
          navMeta.forEach(function (m) {
            var item = document.createElement('a');
            item.className = 'luliy-nav-item';
            item.href = m.absHref || m.href;
            var label = m.label;
            if (!label) {
              var p = (m.href || '').replace(/^\//, '').replace(/\.html$/, '');
              label = p || '\u94fe\u63a5';
            }
            item.textContent = label;
            drop.appendChild(item);
          });
          drop.appendChild(makeSep());
        }
      } catch (eNav) {}

      /* ── 🔊 SFX toggle ───────────────────────────────────── */
      var sfxOn = localStorage.getItem('luliy-sfx') !== '0';
      var sfxItem = document.createElement('button');
      sfxItem.className = 'luliy-nav-item luliy-drop-toggle';
      sfxItem.type = 'button';
      sfxItem.textContent = (sfxOn ? '\uD83D\uDD0A' : '\uD83D\uDD07') + ' \u97f3\u6548\u00b7' + (sfxOn ? '\u5f00\u542f' : '\u5173\u95ed');
      sfxItem.addEventListener('click', function () {
        var on = localStorage.getItem('luliy-sfx') !== '0';
        localStorage.setItem('luliy-sfx', on ? '0' : '1');
        sfxItem.textContent = (!on ? '\uD83D\uDD0A' : '\uD83D\uDD07') + ' \u97f3\u6548\u00b7' + (!on ? '\u5f00\u542f' : '\u5173\u95ed');
      });
      drop.appendChild(sfxItem);

      /* ── 🌸 Sakura toggle ────────────────────────────────── */
      var sakuraOn = localStorage.getItem('luliy-sakura') !== '0';
      var sakuraItem = document.createElement('button');
      sakuraItem.className = 'luliy-nav-item luliy-drop-toggle';
      sakuraItem.type = 'button';
      sakuraItem.textContent = '\uD83C\uDF38 \u6a31\u82b1\u00b7' + (sakuraOn ? '\u5f00\u542f' : '\u5173\u95ed');
      sakuraItem.addEventListener('click', function () {
        var on = localStorage.getItem('luliy-sakura') !== '0';
        localStorage.setItem('luliy-sakura', on ? '0' : '1');
        sakuraItem.textContent = '\uD83C\uDF38 \u6a31\u82b1\u00b7' + (!on ? '\u5f00\u542f' : '\u5173\u95ed');
        if (on) stopSakura();
        else initSakura();
        playSfx('click');
      });
      drop.appendChild(sakuraItem);

      /* ── 🖼 Background changer ───────────────────────────── */
      var bgItem = document.createElement('button');
      bgItem.id = 'luliy-bg-btn';
      bgItem.className = 'luliy-nav-item luliy-drop-toggle';
      bgItem.type = 'button';
      bgItem.textContent = '\uD83D\uDDBC \u80cc\u666f\u56fe\u7247\u00b7\u66F4\u6362';
      bgItem.addEventListener('click', function () {
        closeDrop();
        setTimeout(showBgPicker, 80);
      });
      drop.appendChild(bgItem);

      /* ── 📋 TOC (only on article pages) ─────────────────── */
      if (document.getElementById('postBody')) {
        var tocVisible = false;
        var tocItem = document.createElement('button');
        tocItem.className = 'luliy-nav-item luliy-drop-toggle';
        tocItem.type = 'button';
        tocItem.textContent = '\uD83D\uDCCB \u6587\u7ae0\u76ee\u5f55\u00b7\u663e\u793a';
        tocItem.addEventListener('click', function () {
          var toc = document.querySelector('#TOC, .articletoc, .toc, #articleTOC, [class*="ArticleTOC"]');
          if (!toc) return;
          tocVisible = !tocVisible;
          toc.classList.toggle('toc-visible', tocVisible);
          tocItem.textContent = '\uD83D\uDCCB \u6587\u7ae0\u76ee\u5f55\u00b7' + (tocVisible ? '\u9690\u85cf' : '\u663e\u793a');
          if (tocVisible) closeDrop();
        });
        drop.appendChild(tocItem);

        /* ── 🔤 Font size A- / A+ ──────────────────────────── */
        var fsItem = document.createElement('div');
        fsItem.className = 'luliy-nav-item luliy-drop-toggle';
        fsItem.style.cursor = 'default';
        var fsMinus = document.createElement('button');
        fsMinus.type = 'button'; fsMinus.className = 'luliy-fs-btn'; fsMinus.textContent = 'A-';
        var fsTxt = document.createElement('span');
        var fsPlus = document.createElement('button');
        fsPlus.type = 'button'; fsPlus.className = 'luliy-fs-btn'; fsPlus.textContent = 'A+';
        function mobCurFs() { return parseInt(localStorage.getItem('luliy-fontsize') || '18', 10) || 18; }
        function mobSetFs(px) {
          px = Math.min(24, Math.max(14, px));
          localStorage.setItem('luliy-fontsize', String(px));
          if (root._luliyApplyReadingPrefs) root._luliyApplyReadingPrefs();
          fsTxt.textContent = '\u5b57\u53f7 ' + px + 'px';
        }
        fsTxt.textContent = '\u5b57\u53f7 ' + mobCurFs() + 'px';
        fsMinus.addEventListener('click', function (e) { e.stopPropagation(); mobSetFs(mobCurFs() - 1); });
        fsPlus.addEventListener('click',  function (e) { e.stopPropagation(); mobSetFs(mobCurFs() + 1); });
        fsItem.appendChild(fsMinus); fsItem.appendChild(fsTxt); fsItem.appendChild(fsPlus);
        drop.appendChild(fsItem);

        /* ── ✍ Sans-serif toggle ──────────────────────────── */
        var _mobFontLabels = {'0':'\u9ed8\u8ba4','1':'\u9ed1\u4f53','2':'\u82cd\u8033\u6977'};
        var sansItem = document.createElement('button');
        sansItem.className = 'luliy-nav-item luliy-drop-toggle';
        sansItem.type = 'button';
        sansItem.textContent = '\u270d \u5b57\u4f53\u00b7' + _mobFontLabels[localStorage.getItem('luliy-sans') || '0'];
        sansItem.addEventListener('click', function () {
          var cur = localStorage.getItem('luliy-sans') || '0';
          var next = cur === '0' ? '1' : cur === '1' ? '2' : '0';
          localStorage.setItem('luliy-sans', next);
          sansItem.textContent = '\u270d \u5b57\u4f53\u00b7' + _mobFontLabels[next];
          if (root._luliyApplyReadingPrefs) root._luliyApplyReadingPrefs();
        });
        drop.appendChild(sansItem);
      }

      drop.appendChild(makeSep());

      /* ── ✨ Theme picker ──────────────────────────────────── */
      drop.appendChild(makeDropLabel('\u98ce\u683c\u4e3b\u9898'));
      var currentTheme = localStorage.getItem('luliy-sink') || 'default';
      SINKS.forEach(function (s) {
        var themeItem = document.createElement('button');
        themeItem.className = 'luliy-nav-item' + (currentTheme === s.id ? ' is-active' : '');
        themeItem.type = 'button';
        themeItem.innerHTML =
          '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' +
          s.dot + ';margin-right:8px;vertical-align:middle;flex-shrink:0"></span>' + s.label;
        themeItem.style.display = 'flex';
        themeItem.style.alignItems = 'center';
        themeItem.addEventListener('click', function () {
          applySink(s.id);
          /* Update active state inline */
          drop.querySelectorAll('.luliy-nav-item').forEach(function (el) {
            el.classList.remove('is-active');
          });
          themeItem.classList.add('is-active');
          playSfx('click');
          /* Don't close so user can see selection */
        });
        drop.appendChild(themeItem);
      });

      return true;
    }

    function openDrop() {
      populateDrop();
      drop.classList.add('is-open');
      ham.classList.add('is-open');
    }
    function closeDrop() {
      drop.classList.remove('is-open');
      ham.classList.remove('is-open');
    }

    ham.addEventListener('click', function (e) {
      e.stopPropagation();
      drop.classList.contains('is-open') ? closeDrop() : openDrop();
    });

    document.addEventListener('click', function (e) {
      if (!ham.contains(e.target) && !drop.contains(e.target)) closeDrop();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrop();
    });

    /* Insert ham into header, drop into body */
    function injectHam() {
      var header = document.getElementById('header');
      if (header && !document.getElementById('luliy-nav-ham')) {
        header.appendChild(ham);
        document.body.appendChild(drop);
        return true;
      }
      return false;
    }
    if (!injectHam()) {
      var tries = 0;
      var iv = setInterval(function () {
        if (injectHam() || ++tries > 20) clearInterval(iv);
      }, 200);
    }
  }

  /* ---- 20  Homepage bottom gallery banner ------------------
     · 1 image  → full-width banner
     · 2+ images → responsive grid
     · ✎ button → add custom image URLs (stored in localStorage)
     · click any image → lightbox zoom                          */
  function getGalleryImages() {
    var imgs = (LULIY_OPTS.galleryImages || []).slice();
    try {
      var custom = JSON.parse(localStorage.getItem('luliy-gallery') || '[]');
      if (Array.isArray(custom)) imgs = imgs.concat(custom);
    } catch (e) {}
    return imgs.filter(Boolean);
  }

  function initHomeGallery() {
    if (!isIndexPage()) return;
    /* Wait until card grid has been built */
    setTimeout(buildGallery, 800);
  }

  function buildGallery() {
    var old = document.getElementById('luliy-home-gallery');
    if (old) old.remove();
    var content = document.getElementById('content') || document.querySelector('.main');
    if (!content) return;

    var imgs = getGalleryImages();
    if (!imgs.length) return;

    var wrap = document.createElement('div');
    wrap.id = 'luliy-home-gallery';
    if (imgs.length > 1) wrap.classList.add('is-grid');

    imgs.forEach(function (src, i) {
      var cell = document.createElement('div');
      cell.className = 'luliy-gallery-cell';
      var img = document.createElement('img');
      img.src = src;
      img.alt = 'Gallery ' + (i + 1);
      img.loading = 'lazy';
      img.addEventListener('error', function () { cell.style.display = 'none'; });
      cell.appendChild(img);
      cell.style.cursor = 'zoom-in';
      cell.addEventListener('click', function () {
        if (root._luliyLightboxOpen) root._luliyLightboxOpen(src, '\u753b\u5eca');
      });
      wrap.appendChild(cell);
    });

    /* Overlay caption (single-image banner only) */
    if (imgs.length === 1) {
      var ov = document.createElement('div');
      ov.id = 'luliy-home-gallery-overlay';
      var txt = document.createElement('div');
      txt.id = 'luliy-home-gallery-text';
      txt.textContent = LULIY_OPTS.galleryText || '';
      ov.appendChild(txt);
      wrap.appendChild(ov);
    }

    /* ✎ Edit button: add / reset custom images */
    var edit = document.createElement('button');
    edit.id = 'luliy-gallery-edit';
    edit.type = 'button';
    edit.title = '\u6dfb\u52a0\u81ea\u5b9a\u4e49\u56fe\u7247';   /* 添加自定义图片 */
    edit.textContent = '\u270e';
    edit.addEventListener('click', function (e) {
      e.stopPropagation();
      var url = window.prompt(
        '\u7c98\u8d34\u56fe\u7247\u94fe\u63a5\u6dfb\u52a0\u5230\u753b\u5eca\uff08\u8f93\u5165 reset \u6e05\u7a7a\u81ea\u5b9a\u4e49\u56fe\u7247\uff09\uff1a', '');
      if (url === null) return;
      url = url.trim();
      var custom = [];
      try { custom = JSON.parse(localStorage.getItem('luliy-gallery') || '[]'); } catch (_) {}
      if (!Array.isArray(custom)) custom = [];
      if (url.toLowerCase() === 'reset') custom = [];
      else if (url) custom.push(url);
      localStorage.setItem('luliy-gallery', JSON.stringify(custom));
      buildGallery();
      playSfx('click');
    });
    wrap.appendChild(edit);

    content.appendChild(wrap);
  }

  /* ---- 19  Favorites page front-end lock --------------------
     Hides the favorites page behind a password prompt.
     NOTE: this is a deterrent only — page content still exists in
     the public HTML source. Do not store true secrets here.      */
  function initFavoritesLock() {
    if (!LULIY_OPTS.favoritesPathMatch.test(location.pathname)) return;
    if (sessionStorage.getItem('luliy-fav-unlocked') === '1') return;
    if (document.getElementById('luliy-fav-gate')) return;

    var pbody = document.getElementById('postBody');
    if (!pbody) return;

    pbody.classList.add('luliy-locked');

    var gate = document.createElement('div');
    gate.id = 'luliy-fav-gate';
    gate.innerHTML =
      '<div id="luliy-fav-gate-card">' +
      '<div id="luliy-fav-gate-icon">\uD83D\uDD12</div>' +
      '<div id="luliy-fav-gate-title">\u79c1\u5bc6\u6536\u85cf</div>' +          /* 私密收藏 */
      '<div id="luliy-fav-gate-sub">\u8bf7\u8f93\u5165\u5bc6\u7801\u67e5\u770b\u6b64\u9875\u9762</div>' + /* 请输入密码查看此页面 */
      '<input id="luliy-fav-gate-input" type="password" inputmode="numeric" ' +
      'placeholder="\u5bc6\u7801" autocomplete="off">' +
      '<button id="luliy-fav-gate-btn" type="button">\u89e3\u9501</button>' +     /* 解锁 */
      '<div id="luliy-fav-gate-err"></div>' +
      '</div>';
    document.body.appendChild(gate);

    var input = gate.querySelector('#luliy-fav-gate-input');
    var btn   = gate.querySelector('#luliy-fav-gate-btn');
    var err   = gate.querySelector('#luliy-fav-gate-err');

    function sha256Hex(str) {
      if (root.crypto && root.crypto.subtle) {
        return root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
          .then(function (buf) {
            return Array.prototype.map.call(new Uint8Array(buf), function (b) {
              return ('0' + b.toString(16)).slice(-2);
            }).join('');
          });
      }
      /* crypto.subtle requires https / localhost — GitHub Pages is https */
      return Promise.reject(new Error('no-subtle'));
    }

    function unlock() {
      sessionStorage.setItem('luliy-fav-unlocked', '1');
      playSfx('sci');
      /* Progressive reveal: blur dissolves + content slides up section by section */
      pbody.classList.remove('luliy-locked');
      pbody.classList.add('luliy-unlocking');
      var kids = Array.prototype.slice.call(pbody.children);
      /* First rAF: apply the hidden starting state */
      requestAnimationFrame(function () {
        kids.forEach(function (el, i) {
          el.style.opacity = '0';
          el.style.transform = 'translateY(24px)';
          el.style.transition = 'none';
        });
        /* Second rAF: browser has painted opacity:0, now enable transitions */
        requestAnimationFrame(function () {
          kids.forEach(function (el, i) {
            el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(.2,.7,.3,1)';
            el.style.transitionDelay = (i * 0.07) + 's';
            el.style.opacity = '';
            el.style.transform = '';
          });
        });
      });
      gate.classList.add('is-leaving');
      setTimeout(function () {
        gate.remove();
        pbody.classList.remove('luliy-unlocking');
        kids.forEach(function (el) {
          el.style.transition = ''; el.style.transitionDelay = '';
        });
      }, 900);
    }

    function attempt() {
      var v = (input.value || '').trim();
      if (!v) return;
      sha256Hex(v).then(function (hex) {
        if (hex === LULIY_OPTS.favoritesHash) unlock();
        else {
          err.textContent = '\u5bc6\u7801\u9519\u8bef\uff0c\u8bf7\u91cd\u8bd5';   /* 密码错误，请重试 */
          input.value = '';
          var gateCard = gate.querySelector('#luliy-fav-gate-card');
        if (gateCard) gateCard.classList.remove('shake');
          void gate.offsetWidth;
          if (gateCard) gateCard.classList.add('shake');
        }
      }).catch(function () {
        err.textContent = '\u5f53\u524d\u73af\u5883\u4e0d\u652f\u6301\u52a0\u5bc6\u9a8c\u8bc1';
      });
    }

    btn.addEventListener('click', attempt);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') attempt(); });
    setTimeout(function () { input.focus(); }, 300);
  }

  /* ---- Article progressive reveal (blur dissolve + slide up) --
     Runs once on load for every article body, section by section.
     Skipped on the favorites page (it has its own gated reveal). */
  function revealArticle() {
    if (prefersReduce && prefersReduce()) return;
    var pbody = document.getElementById('postBody');
    if (!pbody) return;
    if (LULIY_OPTS.favoritesPathMatch &&
        LULIY_OPTS.favoritesPathMatch.test(location.pathname)) return;
    if (pbody.classList.contains('luliy-revealed')) return;
    pbody.classList.add('luliy-revealed');

    var kids = Array.prototype.slice.call(pbody.children);
    if (!kids.length) return;
    requestAnimationFrame(function () {
      kids.forEach(function (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(22px)';
        el.style.filter = 'blur(6px)';
        el.style.transition = 'none';
      });
      requestAnimationFrame(function () {
        kids.forEach(function (el, i) {
          el.style.transition =
            'opacity 0.6s ease, transform 0.6s cubic-bezier(.2,.7,.3,1), filter 0.6s ease';
          el.style.transitionDelay = Math.min(i * 0.05, 1.2) + 's';
          el.style.opacity = '';
          el.style.transform = '';
          el.style.filter = '';
        });
      });
    });
    /* Cleanup inline styles after the animation completes */
    setTimeout(function () {
      kids.forEach(function (el) {
        el.style.transition = ''; el.style.transitionDelay = '';
        el.style.opacity = ''; el.style.transform = ''; el.style.filter = '';
      });
    }, 2200);
  }

  /* ---- 21  Post page init --------------------------------- */
  root._luliyInitPost = function () {
    if (root._luliyPostInited) return;
    root._luliyPostInited = true;

    /* Mark body for post-page margin CSS */
    document.body.classList.add('luliy-post-page');

    var pbody = document.getElementById('postBody');

    /* External links → new tab */
    document.querySelectorAll('a[href^="http"]').forEach(function (a) {
      if (!a.href.includes('luliy6.github.io') && !a.href.includes('luliy.me'))
        a.target = '_blank';
    });

    if (pbody) pbody.querySelectorAll('img').forEach(function (img) { img.loading = 'lazy'; });
    if (!pbody) return;

    /* Reading preferences (font size + sans-serif) */
    applyReadingPrefs();

    /* Favorites page front-end lock */
    initFavoritesLock();

    /* Global article progressive reveal */
    revealArticle();

    /* Reading time estimate */
    if (!document.getElementById('luliy-readmeta')) {
      var wc = pbody.innerText.length;
      var rt = document.createElement('p');
      rt.id = 'luliy-readmeta';
      rt.innerHTML =
        '\u9884\u8ba1\u9605\u8bfb\uff1a\u7ea6 <strong>' + Math.max(1, Math.round(wc / 300)) +
        '</strong> \u5206\u949f &nbsp;|&nbsp; \u5171 <strong>' + wc + '</strong> \u5b57';
      rt.style.cssText = 'color:#888;font-size:13px;margin-bottom:1.5rem';
      pbody.insertBefore(rt, pbody.firstChild);
    }

    /* Heading click → copy anchor link */
    pbody.querySelectorAll('h1,h2,h3').forEach(function (h) {
      if (h._luliyCopy) return;
      h._luliyCopy = true; h.style.cursor = 'pointer';
      h.title = '\u70b9\u51fb\u590d\u5236\u94fe\u63a5';
      h.addEventListener('click', function () {
        var url = location.href.split('#')[0] + '#' + h.id;
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        var tip = document.createElement('span');
        tip.textContent = ' \u2713';
        tip.style.cssText = 'font-size:12px;color:#1f883d;font-weight:normal';
        h.appendChild(tip);
        setTimeout(function () { tip.remove(); }, 2000);
      });
    });

    /* macOS code blocks */
    initCodeBlocks(pbody);
    setTimeout(function () { initCodeBlocks(pbody); }, 800);
    setTimeout(function () { initCodeBlocks(pbody); }, 2200);

    /* TOC scroll-spy */
    initArticleTocSpy();
    setTimeout(function () { initArticleTocSpy(); }, 600);
    setTimeout(function () { initArticleTocSpy(); }, 2000);

    /* Prev / Next navigation */
    fetchPosts().then(function (posts) {
      var navPosts = posts.filter(function (p) { return !p.pinned; });
      var curPath = location.pathname;
      var curNorm = curPath.replace(/^\//, '').replace(/\.html?$/, '').replace(/\/$/, '');

      var idx = -1;
      navPosts.forEach(function (p, i) {
        if (!p.link) return;
        function normLink(s) {
          return s.replace(/^\//, '').replace(/\.html?$/, '').replace(/\/$/, '').replace(/^post\//, '');
        }
        var lnkSlug = normLink(p.link);
        var curSlug = normLink(curNorm);
        if (lnkSlug === curSlug || lnkSlug === curNorm ||
          p.link === curNorm || curPath === '/' + p.link ||
          curPath === p.link || curPath.endsWith('/' + lnkSlug)) {
          idx = i;
        }
      });

      if (idx < 0) return;
      var prevPost = navPosts[idx + 1] || null;
      var nextPost = navPosts[idx - 1] || null;
      if (!prevPost && !nextPost) return;

      var nav = document.createElement('div');
      nav.className = 'luliy-prevnext';

      function mkNavLink(post, labelText, align) {
        if (!post) { var e = document.createElement('div'); e.style.flex = '1'; return e; }
        var a = document.createElement('a');
        a.href = buildPostLink(post.link);
        a.style.textAlign = align;
        a.innerHTML =
          '<span class="pn-label">' + esc(labelText) + '</span>' +
          '<span class="pn-title">' + esc(post.title) + '</span>';
        return a;
      }

      nav.appendChild(mkNavLink(prevPost, '\u2B05 \u4e0a\u4e00\u7bc7', 'left'));
      nav.appendChild(mkNavLink(nextPost, '\u4e0b\u4e00\u7bc7 \u27A1', 'right'));
      pbody.appendChild(nav);

      /* Series navigation (same-tag prev/next with progress) */
      initSeriesNav(pbody, posts, idx, navPosts);
    }).catch(function () {});

    /* In-page search (Ctrl/Cmd+F) */
    initInPageSearch();

    /* External link favicon hover preview */
    initLinkPreview();
    setTimeout(initLinkPreview, 1500);

    /* Scroll position memory */
    initScrollMemory();

    /* Reading progress ring on back-to-top button */
    setTimeout(initProgressRing, 100);

    /* Mobile swipe between posts */
    initSwipeNav();

    /* Support / appreciation panel */
    var sp = document.createElement('div');
    sp.style.cssText = 'margin-top:50px;text-align:center';
    var spb = document.createElement('button');
    spb.innerHTML = '\u2728 \u548c\u4f5c\u8005\u65e0\u9650\u8fdb\u6b65';
    spb.style.cssText =
      'padding:12px 28px;border-radius:30px;border:none;' +
      'background:linear-gradient(90deg,#f0b429,#ff6b9d);' +
      'color:#fff;font-weight:bold;font-size:15px;cursor:pointer;' +
      'box-shadow:0 4px 15px rgba(240,180,41,0.3);transition:transform 0.3s';
    var qr = document.createElement('div');
    qr.innerHTML =
      '<p style="font-size:13px;color:#888;margin:10px 0">\u65e0\u9650\u8fdb\u6b65\uff0c\u8fdb\u6b65\u6709\u4f60\uff01</p>' +
      '<img src="https://raw.githubusercontent.com/luliy6/img/refs/heads/main/me.jpg" ' +
      'alt="\u8d5b\u8d4f\u7801" style="width:180px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1)">';
    qr.style.cssText = 'height:0;overflow:hidden;transition:height 0.4s ease,opacity 0.4s ease;opacity:0';
    spb.addEventListener('mouseover', function () { spb.style.transform = 'translateY(-2px)'; });
    spb.addEventListener('mouseout',  function () { spb.style.transform = ''; });
    spb.addEventListener('click', function () {
      var o = !qr.style.height || qr.style.height === '0px';
      qr.style.height = o ? '260px' : '0px';
      qr.style.opacity = o ? '1' : '0';
    });
    sp.appendChild(spb); sp.appendChild(qr);
    pbody.appendChild(sp);
  };

  /* ---- 22  Index page init -------------------------------- */
  root._luliyInitIndex = function () {
    initCards();
    initHeroBanner();
    initHomeGallery();
    setTimeout(initCardViewToggle, 900);

    if (isArchivePage()) {
      var pb = document.getElementById('postBody');
      if (pb) {
        pb.innerHTML = '<p style="color:#888;font-size:14px">\u6b63\u5728\u52a0\u8f7d\u5f52\u6863...</p>';
        fetchPosts().then(function (posts) {
          renderArchive(pb, posts);
        }).catch(function () {
          pb.innerHTML = '<p style="color:#e74c3c">\u5f52\u6863\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u5237\u65b0\u91cd\u8bd5\u3002</p>';
        });
      }
    }
  };

  /* ---- 22b  Archive: timeline + calendar views ------------ */
  function renderArchive(pb, posts) {
    var view = localStorage.getItem('luliy-archive-view') || 'timeline';

    function renderTimeline() {
      var byY = {};
      posts.forEach(function (p) {
        var y = (p.created || '\u672a\u77e5').slice(0, 4);
        if (!byY[y]) byY[y] = [];
        byY[y].push(p);
      });
      var years = Object.keys(byY).sort(function (a, b) { return b - a; });
      var html = '';
      years.forEach(function (y) {
        html += '<div class="tl-year">' + esc(y) + ' \u5e74 <span class="tl-count">' + byY[y].length + ' \u7bc7</span></div><ul class="tl-list">';
        byY[y].sort(function (a, b) { return String(b.created).localeCompare(String(a.created)); });
        byY[y].forEach(function (p) {
          var md = (p.created || '').slice(5, 10).replace('-', '/');
          html +=
            '<li class="tl-item">' +
            '<span class="tl-dot"></span>' +
            '<a href="' + esc(buildPostLink(p.link)) + '">' + esc(p.title) + '</a>' +
            '<span class="tl-date">' + md + '</span>' +
            '</li>';
        });
        html += '</ul>';
      });
      return html;
    }

    function renderCalendar() {
      /* Map yyyy-mm-dd -> [posts] */
      var byDay = {};
      posts.forEach(function (p) {
        var d = (p.created || '').slice(0, 10);
        if (!d) return;
        (byDay[d] = byDay[d] || []).push(p);
      });
      /* Group available months */
      var months = {};
      Object.keys(byDay).forEach(function (d) { months[d.slice(0, 7)] = true; });
      var mList = Object.keys(months).sort(function (a, b) { return b.localeCompare(a); });

      var html = '';
      mList.forEach(function (ym) {
        var parts = ym.split('-'), Y = +parts[0], M = +parts[1];
        var first = new Date(Y, M - 1, 1);
        var startDow = first.getDay();   /* 0=Sun */
        var days = new Date(Y, M, 0).getDate();
        html += '<div class="cal-month"><div class="cal-mhead">' + Y + ' \u5e74 ' + M + ' \u6708</div>';
        html += '<div class="cal-grid"><span class="cal-dow">\u65e5</span><span class="cal-dow">\u4e00</span>' +
          '<span class="cal-dow">\u4e8c</span><span class="cal-dow">\u4e09</span><span class="cal-dow">\u56db</span>' +
          '<span class="cal-dow">\u4e94</span><span class="cal-dow">\u516d</span>';
        for (var b = 0; b < startDow; b++) html += '<span class="cal-cell cal-empty"></span>';
        for (var dd = 1; dd <= days; dd++) {
          var key = ym + '-' + (dd < 10 ? '0' + dd : dd);
          var dayPosts = byDay[key];
          if (dayPosts && dayPosts.length) {
            var link = buildPostLink(dayPosts[0].link);
            var titles = dayPosts.map(function (p) { return p.title; }).join(' / ');
            html += '<a class="cal-cell cal-has" href="' + esc(link) + '" title="' + esc(titles) + '">' +
              dd + '<span class="cal-badge">' + dayPosts.length + '</span></a>';
          } else {
            html += '<span class="cal-cell">' + dd + '</span>';
          }
        }
        html += '</div></div>';
      });
      return html || '<p style="color:#888">\u6682\u65e0\u65e5\u671f\u6570\u636e</p>';
    }

    function paint() {
      var html =
        '<div class="luliy-archive-head">' +
        '<h1>\uD83D\uDCC5 \u6587\u7ae0\u5f52\u6863</h1>' +
        '<div class="luliy-archive-tabs">' +
        '<button type="button" data-av="timeline" class="' + (view === 'timeline' ? 'is-active' : '') + '">\u65f6\u95f4\u8f74</button>' +
        '<button type="button" data-av="calendar" class="' + (view === 'calendar' ? 'is-active' : '') + '">\u65e5\u5386</button>' +
        '</div></div>' +
        '<div class="luliy-archive-body">' + (view === 'calendar' ? renderCalendar() : renderTimeline()) + '</div>';
      pb.innerHTML = html;
      pb.querySelectorAll('.luliy-archive-tabs button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          view = btn.getAttribute('data-av');
          localStorage.setItem('luliy-archive-view', view);
          paint();
          playSfx('click');
        });
      });
    }
    paint();
  }

  /* ════════════════════════════════════════════════════════
     NEW MODULES (v10)
  ════════════════════════════════════════════════════════ */

  /* ---- Focus reading mode (F key / double-click / exit btn) */
  function toggleFocusMode(force) {
    var on = (typeof force === 'boolean')
      ? force
      : !document.body.classList.contains('luliy-focus-mode');
    document.body.classList.toggle('luliy-focus-mode', on);
    /* Sync the settings-panel badge if present */
    if (root._luliyFocusRow && root._luliyFocusRow._badge) {
      root._luliyFocusRow._badge.textContent = on ? '\u5f00\u542f' : '\u5173\u95ed';
    }
    /* Show / hide the floating exit button */
    var exit = document.getElementById('luliy-focus-exit');
    if (on && !exit) {
      exit = document.createElement('button');
      exit.id = 'luliy-focus-exit';
      exit.type = 'button';
      exit.innerHTML = '\u2715 \u9000\u51fa\u4e13\u6ce8';   /* ✕ 退出专注 */
      exit.title = '\u9000\u51fa\u4e13\u6ce8\u6a21\u5f0f (F)';
      exit.addEventListener('click', function () { toggleFocusMode(false); });
      document.body.appendChild(exit);
    } else if (!on && exit) {
      exit.remove();
    }
    try { playSfx('click'); } catch (e) {}
    return on;
  }

  function initFocusMode() {
    if (!document.getElementById('postBody')) return;

    /* F key toggles focus mode (ignore when typing in a field) */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'f' && e.key !== 'F') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;   /* Ctrl+F = search */
      var t = e.target;
      var tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
      e.preventDefault();
      toggleFocusMode();
    });

    /* Double-click the article body toggles focus mode
       (ignore double-clicks on links / code / images / selections) */
    var pbody = document.getElementById('postBody');
    pbody.addEventListener('dblclick', function (e) {
      var t = e.target;
      if (t.closest('a, code, pre, img, button, table, .luliy-series, mark')) return;
      /* Don't toggle if the user is selecting text */
      var sel = window.getSelection && window.getSelection();
      if (sel && sel.toString().length > 0) return;
      toggleFocusMode();
    });
  }
  root._luliyToggleFocus = toggleFocusMode;

  /* ---- Card view (grid / list) ---------------------------- */
  var CARD_VIEWS = ['grid', 'list', 'timeline'];
  function getCardView() {
    var v = localStorage.getItem('luliy-cardview');
    return CARD_VIEWS.indexOf(v) >= 0 ? v : 'grid';
  }
  function applyCardView() {
    var view = getCardView();
    document.querySelectorAll('.luliy-card-grid').forEach(function (g) {
      /* Pinned strip always stays a grid — alt layouts make no sense there */
      if (g.classList.contains('luliy-pinned-grid')) {
        g.classList.remove('luliy-card-list', 'luliy-card-timeline');
        return;
      }
      g.classList.toggle('luliy-card-list', view === 'list');
      g.classList.toggle('luliy-card-timeline', view === 'timeline');
    });
    var tb = document.getElementById('luliy-cardview-toggle');
    if (tb) tb.setAttribute('data-view', view);
  }

  function initCardViewToggle() {
    if (!isIndexPage()) return;
    if (document.getElementById('luliy-cardview-toggle')) return;
    var content = document.getElementById('content') || document.querySelector('.main');
    if (!content) return;
    var nav = document.querySelector('.luliy-card-grid');
    if (!nav) return;

    var bar = document.createElement('div');
    bar.id = 'luliy-cardview-bar';
    var toggle = document.createElement('div');
    toggle.id = 'luliy-cardview-toggle';
    toggle.setAttribute('data-view', getCardView());
    toggle.innerHTML =
      '<button type="button" class="cv-grid" data-v="grid" title="\u7f51\u683c\u89c6\u56fe">\u2317</button>' +
      '<button type="button" class="cv-list" data-v="list" title="\u5217\u8868\u89c6\u56fe">\u2630</button>' +
      '<button type="button" class="cv-timeline" data-v="timeline" title="\u65f6\u95f4\u8f74\u89c6\u56fe">\u2261\u20D7</button>';
    toggle.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        localStorage.setItem('luliy-cardview', b.getAttribute('data-v'));
        if (root._luliyRerenderCards) root._luliyRerenderCards();
        else applyCardView();
        playSfx('click');
      });
    });
    bar.appendChild(toggle);
    nav.parentNode.insertBefore(bar, nav);
    applyCardView();
  }

  /* ---- Reduce motion ------------------------------------- */
  function prefersReduce() {
    if (localStorage.getItem('luliy-reduce') === '1') return true;
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  }
  function applyReduceMotion() {
    document.body.classList.toggle('luliy-reduce-motion', prefersReduce());
    if (prefersReduce()) { stopMouseTrail(); stopFireflies(); }
  }

  /* ---- 17b  Reading progress ring (merged into back-top) -- */
  function initProgressRing() {
    var btn = document.getElementById('luliy-back-top');
    if (!btn || btn._luliyRing) return;
    btn._luliyRing = true;
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'luliy-ring');
    svg.setAttribute('viewBox', '0 0 44 44');
    var bg = document.createElementNS(NS, 'circle');
    bg.setAttribute('class', 'luliy-ring-bg');
    bg.setAttribute('cx', '22'); bg.setAttribute('cy', '22'); bg.setAttribute('r', '20');
    var fg = document.createElementNS(NS, 'circle');
    fg.setAttribute('class', 'luliy-ring-fg');
    fg.setAttribute('cx', '22'); fg.setAttribute('cy', '22'); fg.setAttribute('r', '20');
    var circ = 2 * Math.PI * 20;
    fg.style.strokeDasharray = circ;
    fg.style.strokeDashoffset = circ;
    svg.appendChild(bg); svg.appendChild(fg);
    btn.insertBefore(svg, btn.firstChild);

    function update() {
      var st = window.scrollY || document.documentElement.scrollTop;
      var dh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var pct = dh > 0 ? Math.min(1, st / dh) : 0;
      fg.style.strokeDashoffset = circ * (1 - pct);
    }
    onScrollRAF(update);
  }

  /* ---- 21b  Series nav (same-tag prev/next) --------------- */
  function initSeriesNav(pbody, posts, curIdx, navPosts) {
    /* Find the dominant non-pinned tag of the current post, then
       collect the chronological series it belongs to.              */
    var cur = navPosts[curIdx];
    if (!cur || !cur.labels || !cur.labels.length) return;
    var curTags = cur.labels
      .map(function (l) { return (l.name || l).toString(); })
      .filter(function (n) { return !/^pinned(-\d+)?$/.test(n); });
    if (!curTags.length) return;

    /* Pick the tag that yields the largest series (>=2 posts) */
    var best = null, bestList = [];
    curTags.forEach(function (tag) {
      var list = navPosts.filter(function (p) {
        return (p.labels || []).some(function (l) { return (l.name || l) === tag; });
      }).sort(function (a, b) { return String(a.created).localeCompare(String(b.created)); });
      if (list.length >= 2 && list.length > bestList.length) { best = tag; bestList = list; }
    });
    if (!best || bestList.length < 2) return;

    var pos = -1;
    bestList.forEach(function (p, i) { if (p === cur) pos = i; });
    if (pos < 0) return;

    var box = document.createElement('div');
    box.className = 'luliy-series';
    var head = document.createElement('div');
    head.className = 'luliy-series-head';
    head.innerHTML = '\uD83D\uDCDA \u7cfb\u5217\uff1a<b>' + esc(best) + '</b> ' +
      '<span class="luliy-series-prog">' + (pos + 1) + ' / ' + bestList.length + '</span>';
    box.appendChild(head);

    /* Progress dots */
    var dots = document.createElement('div');
    dots.className = 'luliy-series-dots';
    bestList.forEach(function (p, i) {
      var d = document.createElement('a');
      d.className = 'luliy-series-dot' + (i === pos ? ' is-current' : '');
      d.href = buildPostLink(p.link);
      d.title = (i + 1) + '. ' + p.title;
      dots.appendChild(d);
    });
    box.appendChild(dots);

    /* Compact list of the series */
    var ul = document.createElement('ul');
    ul.className = 'luliy-series-list';
    bestList.forEach(function (p, i) {
      var li = document.createElement('li');
      li.className = (i === pos ? 'is-current' : '');
      if (i === pos) {
        li.innerHTML = '<span class="ls-num">' + (i + 1) + '</span><span class="ls-cur">' + esc(p.title) + '</span>';
      } else {
        li.innerHTML = '<span class="ls-num">' + (i + 1) + '</span>' +
          '<a href="' + esc(buildPostLink(p.link)) + '">' + esc(p.title) + '</a>';
      }
      ul.appendChild(li);
    });
    box.appendChild(ul);

    pbody.insertBefore(box, pbody.firstChild);
  }

  /* ---- 21c  Scroll position memory ------------------------ */
  function initScrollMemory() {
    var pbody = document.getElementById('postBody');
    if (!pbody) return;
    var key = 'luliy-scroll:' + location.pathname;

    /* Restore prompt */
    var saved = parseFloat(sessionStorage.getItem(key) || '0');
    if (saved > 0.05 && saved < 0.95) {
      var dh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var targetY = Math.round(saved * dh);
      var tip = document.createElement('div');
      tip.className = 'luliy-resume';
      tip.innerHTML = '\u4e0a\u6b21\u8bfb\u5230 ' + Math.round(saved * 100) + '%\uff0c<b>\u7ee7\u7eed\u9605\u8bfb \u2193</b>';
      document.body.appendChild(tip);
      requestAnimationFrame(function () { tip.classList.add('is-in'); });
      var hide = function () { tip.classList.remove('is-in'); setTimeout(function () { tip.remove(); }, 400); };
      tip.addEventListener('click', function () {
        window.scrollTo({ top: targetY, behavior: 'smooth' });
        hide();
      });
      setTimeout(hide, 6000);
    }

    /* Save throttled */
    var t = null;
    window.addEventListener('scroll', function () {
      if (t) return;
      t = setTimeout(function () {
        t = null;
        var st = window.scrollY || document.documentElement.scrollTop;
        var dh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (dh > 0) sessionStorage.setItem(key, String(st / dh));
      }, 500);
    }, { passive: true });
  }

  /* ---- 24  In-page article search overlay ----------------- */
  function initInPageSearch() {
    var pbody = document.getElementById('postBody');
    if (!pbody) return;
    if (document.getElementById('luliy-search-bar')) return;

    var bar = document.createElement('div');
    bar.id = 'luliy-search-bar';
    bar.innerHTML =
      '<i class="luliy-search-icon">\uD83D\uDD0D</i>' +
      '<input id="luliy-search-input" type="text" placeholder="\u641c\u7d22\u672c\u6587\u2026" autocomplete="off">' +
      '<span id="luliy-search-count">0/0</span>' +
      '<button id="luliy-search-prev" type="button" title="\u4e0a\u4e00\u4e2a">\u2191</button>' +
      '<button id="luliy-search-next" type="button" title="\u4e0b\u4e00\u4e2a">\u2193</button>' +
      '<button id="luliy-search-close" type="button" title="\u5173\u95ed">\u2715</button>';
    document.body.appendChild(bar);

    var input = bar.querySelector('#luliy-search-input');
    var countEl = bar.querySelector('#luliy-search-count');
    var marks = [], cur = -1;

    function clearMarks() {
      marks.forEach(function (m) {
        var p = m.parentNode;
        if (p) { p.replaceChild(document.createTextNode(m.textContent), m); p.normalize(); }
      });
      marks = []; cur = -1;
    }

    /* Walk text nodes, skip code/katex/script/style */
    function highlight(term) {
      clearMarks();
      if (!term) { countEl.textContent = '0/0'; return; }
      var lower = term.toLowerCase();
      /* Walk BOTH element and text nodes so FILTER_REJECT prunes whole subtrees. */
      var SKIP_TAGS = { CODE:1, PRE:1, SCRIPT:1, STYLE:1, NOSCRIPT:1, SVG:1, MATH:1 };
      var SKIP_CLASS = ['katex','mermaid','luliy-series','luliy-lineno',
                        'luliy-toc','toc','articletoc','TOC'];
      var walker = document.createTreeWalker(
        pbody,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
        {
          acceptNode: function (node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (SKIP_TAGS[node.tagName]) return NodeFilter.FILTER_REJECT;
              for (var ci = 0; ci < SKIP_CLASS.length; ci++) {
                if (node.classList && node.classList.contains(SKIP_CLASS[ci]))
                  return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_SKIP;  /* descend into allowed elements */
            }
            /* Text node */
            if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            return node.nodeValue.toLowerCase().indexOf(lower) >= 0
              ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        }
      );
      var nodes = [], n;
      while ((n = walker.nextNode())) nodes.push(n);
      nodes.forEach(function (node) {
        var text = node.nodeValue, idx = 0, lc = text.toLowerCase(), frag = document.createDocumentFragment(), last = 0;
        while ((idx = lc.indexOf(lower, last)) >= 0) {
          if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)));
          var mk = document.createElement('mark');
          mk.className = 'luliy-search-hit';
          mk.textContent = text.slice(idx, idx + term.length);
          frag.appendChild(mk); marks.push(mk);
          last = idx + term.length;
        }
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      });
      if (marks.length) { cur = 0; focusMark(); }
      updateCount();
    }
    function updateCount() { countEl.textContent = (marks.length ? (cur + 1) : 0) + '/' + marks.length; }
    function focusMark() {
      marks.forEach(function (m, i) { m.classList.toggle('is-current', i === cur); });
      if (marks[cur]) marks[cur].scrollIntoView({ behavior: 'smooth', block: 'center' });
      updateCount();
    }
    function step(dir) {
      if (!marks.length) return;
      cur = (cur + dir + marks.length) % marks.length;
      focusMark();
    }

    var deb = null;
    input.addEventListener('input', function () {
      clearTimeout(deb);
      deb = setTimeout(function () { highlight(input.value.trim()); }, 220);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
      if (e.key === 'Escape') closeSearch();
    });
    bar.querySelector('#luliy-search-next').addEventListener('click', function () { step(1); });
    bar.querySelector('#luliy-search-prev').addEventListener('click', function () { step(-1); });
    bar.querySelector('#luliy-search-close').addEventListener('click', closeSearch);

    function openSearch() {
      bar.classList.add('is-open');
      setTimeout(function () { input.focus(); input.select(); }, 50);
    }
    function closeSearch() {
      bar.classList.remove('is-open');
      clearMarks(); input.value = ''; countEl.textContent = '0/0';
    }
    root._luliyOpenSearch = openSearch;

    /* Ctrl/Cmd+F hijack (only on article pages) */
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        openSearch();
      }
    });

    /* Floating search trigger button */
    if (!document.getElementById('luliy-search-fab')) {
      var fab = document.createElement('button');
      fab.id = 'luliy-search-fab';
      fab.type = 'button';
      fab.title = '\u641c\u7d22\u672c\u6587 (Ctrl+F)';
      fab.textContent = '\uD83D\uDD0D';
      fab.addEventListener('click', openSearch);
      document.body.appendChild(fab);
      onScrollRAF(function () {
        fab.classList.toggle('is-visible', (window.scrollY || 0) > 300);
      });
    }
  }

  /* ---- 23  Tag cloud page --------------------------------- */
  function initTagCloud() {
    if (!/tag\.html?$|\/tag\/?$/i.test(location.pathname)) return;
    var pbody = document.getElementById('postBody') ||
      document.querySelector('.SideNav, .markdown-body, #content');
    var mount = document.getElementById('content') || document.body;

    fetchPosts().then(function (posts) {
      if (!posts || !posts.length) return;
      /* Count tag frequencies + collect year colors */
      var freq = {}, colors = {};
      posts.forEach(function (p) {
        (p.labels || []).forEach(function (l) {
          var name = (l.name || l).toString();
          if (/^pinned(-\d+)?$/.test(name)) return;
          freq[name] = (freq[name] || 0) + 1;
          if (!colors[name]) colors[name] = '#' + ((l.color || '0969da') + '').replace(/^#/, '');
        });
      });
      var tags = Object.keys(freq);
      if (!tags.length) return;
      var max = Math.max.apply(null, tags.map(function (t) { return freq[t]; }));
      var min = Math.min.apply(null, tags.map(function (t) { return freq[t]; }));

      var wrap = document.createElement('div');
      wrap.id = 'luliy-tagcloud';
      var title = document.createElement('h1');
      title.className = 'luliy-tagcloud-title';
      title.textContent = '\uD83C\uDFF7\uFE0F \u6807\u7b7e\u4e91';
      wrap.appendChild(title);

      var cloud = document.createElement('div');
      cloud.className = 'luliy-tagcloud-body';
      /* Sort by frequency desc for nicer layout */
      tags.sort(function (a, b) { return freq[b] - freq[a]; });
      tags.forEach(function (t) {
        var ratio = max === min ? 0.5 : (freq[t] - min) / (max - min);
        var size = 13 + ratio * 22;  /* 13px → 35px */
        var bubble = document.createElement('a');
        bubble.className = 'luliy-tag-bubble';
        bubble.href = '/tag.html#' + encodeURIComponent(t);
        bubble.style.fontSize = size.toFixed(1) + 'px';
        bubble.style.setProperty('--tag-c', colors[t]);
        bubble.innerHTML = esc(t) + '<sup>' + freq[t] + '</sup>';
        bubble.addEventListener('click', function (e) {
          /* Let the native Gmeek tag filter still work via hash */
          playSfx('click');
        });
        cloud.appendChild(bubble);
      });
      wrap.appendChild(cloud);

      /* Insert above the existing tag list */
      var sidenav = document.querySelector('.SideNav');
      if (sidenav && sidenav.parentNode) {
        sidenav.parentNode.insertBefore(wrap, sidenav);
      } else if (mount) {
        mount.insertBefore(wrap, mount.firstChild);
      }
    }).catch(function () {});
  }

  /* ---- 25a  Mouse trail (theme cursor) -------------------- */
  var _trailHandler = null, _trailNodes = [];
  function initMouseTrail() {
    if (_trailHandler) return;
    if ('ontouchstart' in window) return;     /* skip touch devices */
    if (prefersReduce()) return;
    var theme = document.body.getAttribute('data-luliy-theme') || 'default';
    var glyph = theme === 'sakura' ? '\uD83C\uDF38'
      : theme === 'space' ? '\u2727'
      : theme === 'sunset' ? '\u2600'
      : theme === 'your-name' ? '\u2601'
      : '\u2728';
    var lastT = 0;
    _trailHandler = function (e) {
      var now = Date.now();
      if (now - lastT < 60) return;
      lastT = now;
      var s = document.createElement('span');
      s.className = 'luliy-trail-dot';
      s.textContent = glyph;
      s.style.left = e.clientX + 'px';
      s.style.top = e.clientY + 'px';
      s.style.setProperty('--rot', (Math.random() * 360) + 'deg');
      document.body.appendChild(s);
      _trailNodes.push(s);
      setTimeout(function () { s.remove(); _trailNodes.shift(); }, 1100);
    };
    document.addEventListener('mousemove', _trailHandler, { passive: true });
  }
  function stopMouseTrail() {
    if (_trailHandler) document.removeEventListener('mousemove', _trailHandler);
    _trailHandler = null;
    _trailNodes.forEach(function (n) { n.remove(); }); _trailNodes = [];
  }

  /* ---- 25b  Fireflies (dark mode, mouse-attracted) -------- */
  var _ffRAF = null, _ffCanvas = null;
  function initFireflies() {
    if (_ffCanvas) return;
    if (prefersReduce()) return;
    var canvas = document.createElement('canvas');
    canvas.id = 'luliy-firefly-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2;';
    document.body.appendChild(canvas);
    _ffCanvas = canvas;
    var ctx = canvas.getContext('2d');
    var W, H;
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    var mouse = { x: -999, y: -999 };
    var mm = function (e) { mouse.x = e.clientX; mouse.y = e.clientY; };
    document.addEventListener('mousemove', mm, { passive: true });
    canvas._mm = mm;

    var N = Math.min(26, Math.round(window.innerWidth / 50));
    var flies = [];
    for (var i = 0; i < N; i++) {
      flies.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: 1.4 + Math.random() * 1.8,
        ph: Math.random() * Math.PI * 2,
        ps: 0.02 + Math.random() * 0.03
      });
    }
    function tick() {
      if (!document.getElementById('luliy-firefly-canvas')) { _ffRAF = null; return; }
      ctx.clearRect(0, 0, W, H);
      flies.forEach(function (f) {
        /* Gentle attraction toward mouse */
        var dx = mouse.x - f.x, dy = mouse.y - f.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 220 && dist > 1) {
          f.vx += (dx / dist) * 0.04;
          f.vy += (dy / dist) * 0.04;
        }
        f.vx += (Math.random() - 0.5) * 0.05;
        f.vy += (Math.random() - 0.5) * 0.05;
        f.vx *= 0.94; f.vy *= 0.94;
        f.x += f.vx; f.y += f.vy;
        if (f.x < 0) f.x = W; if (f.x > W) f.x = 0;
        if (f.y < 0) f.y = H; if (f.y > H) f.y = 0;
        f.ph += f.ps;
        var glow = 0.45 + Math.sin(f.ph) * 0.4;
        var grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 5);
        grad.addColorStop(0, 'rgba(190,255,150,' + glow + ')');
        grad.addColorStop(0.4, 'rgba(150,230,120,' + (glow * 0.4) + ')');
        grad.addColorStop(1, 'rgba(150,230,120,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(220,255,180,' + glow + ')';
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      });
      _ffRAF = requestAnimationFrame(tick);
    }
    tick();
  }
  function stopFireflies() {
    if (_ffCanvas) {
      if (_ffCanvas._mm) document.removeEventListener('mousemove', _ffCanvas._mm);
      _ffCanvas.remove(); _ffCanvas = null;
    }
    if (_ffRAF) { cancelAnimationFrame(_ffRAF); _ffRAF = null; }
  }
  /* Fireflies only make sense at night; re-evaluate on theme/mode change */
  function maybeFireflies() {
    var wantFf = localStorage.getItem('luliy-firefly') === '1';
    var isDark = document.documentElement.getAttribute('data-color-mode') === 'dark' ||
      document.body.getAttribute('data-luliy-theme') === 'space';
    if (wantFf && isDark && !prefersReduce()) initFireflies();
    else stopFireflies();
  }

  /* ---- 18b  Mobile swipe gestures (prev/next post) -------- */
  function initSwipeNav() {
    if (!document.getElementById('postBody')) return;
    if (!('ontouchstart' in window)) return;
    var x0 = null, y0 = null;
    document.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - x0, dy = t.clientY - y0;
      x0 = y0 = null;
      /* Require: large horizontal distance AND ratio > 3:1 horizontal vs vertical */
      if (Math.abs(dx) < 120 || Math.abs(dy) > Math.abs(dx) * 0.4) return;
      var sel = dx > 0 ? '.luliy-prevnext a:first-child' : '.luliy-prevnext a:last-child';
      var link = document.querySelector(sel);
      if (link && link.href) {
        document.body.classList.add(dx > 0 ? 'luliy-swipe-right' : 'luliy-swipe-left');
        setTimeout(function () { location.href = link.href; }, 180);
      }
    }, { passive: true });
  }

  /* ---- 26  View Transitions (cross-page fade) ------------- */
  function initViewTransitions() {
    if (!document.startViewTransition) return;
    if (prefersReduce()) return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.hasAttribute('download')) return;
      /* Skip pure hash / in-page anchor links entirely */
      if (href.charAt(0) === '#') return;
      var url;
      try { url = new URL(a.href, location.href); } catch (_) { return; }
      if (url.origin !== location.origin) return;
      /* Skip same-page navigation (hash jumps, TOC) */
      if (url.pathname === location.pathname) return;
      e.preventDefault();
      var dest = url.href;
      /* Use View Transition — location change happens inside the callback */
      try {
        var vt = document.startViewTransition(function () {
          location.href = dest;
          /* Return a never-resolving promise — the navigation itself ends the transition */
          return new Promise(function () {});
        });
        /* Safety timeout: if transition stalls > 1s, navigate anyway */
        setTimeout(function () { location.href = dest; }, 1000);
      } catch (err) {
        /* Fallback if startViewTransition throws */
        location.href = dest;
      }
    });
  }

  /* ---- 14b  Card skeleton placeholders -------------------- */
  function showCardSkeleton(nav) {
    if (!nav) return;
    nav.classList.add('luliy-card-grid');
    var html = '';
    for (var i = 0; i < 6; i++) {
      html += '<li class="luliy-card-skeleton"><div class="sk-line sk-date"></div>' +
        '<div class="sk-line sk-title"></div><div class="sk-line sk-title2"></div>' +
        '<div class="sk-tags"><span></span><span></span></div></li>';
    }
    nav.innerHTML = html;
  }

  /* ---- 16b  External link favicon hover preview ----------- */
  function initLinkPreview() {
    var pbody = document.getElementById('postBody');
    if (!pbody) return;
    var tip = null;
    function showTip(a, e) {
      var url;
      try { url = new URL(a.href); } catch (_) { return; }
      if (url.origin === location.origin) return;
      if (!tip) {
        tip = document.createElement('div');
        tip.className = 'luliy-linktip';
        document.body.appendChild(tip);
      }
      var host = url.hostname.replace(/^www\./, '');
      tip.innerHTML =
        '<img src="https://www.google.com/s2/favicons?domain=' + encodeURIComponent(host) + '&sz=32" alt="">' +
        '<div class="lt-meta"><div class="lt-host">' + esc(host) + '</div>' +
        '<div class="lt-path">' + esc((url.pathname + url.search).slice(0, 48) || '/') + '</div></div>';
      tip.classList.add('is-on');
      moveTip(e);
    }
    function moveTip(e) {
      if (!tip) return;
      var x = e.clientX + 14, y = e.clientY + 16;
      var w = 240;
      if (x + w > window.innerWidth) x = e.clientX - w - 14;
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
    }
    function hideTip() { if (tip) tip.classList.remove('is-on'); }

    pbody.querySelectorAll('a[href^="http"]').forEach(function (a) {
      if (a._luliyTip) return; a._luliyTip = true;
      a.addEventListener('mouseenter', function (e) { showTip(a, e); });
      a.addEventListener('mousemove', moveTip);
      a.addEventListener('mouseleave', hideTip);
    });
  }

  /* ---- 27  Main entry ------------------------------------- */
  initLocalStorage();

  /* Restore theme immediately to prevent FOUC */
  (function () {
    var savedId = localStorage.getItem('luliy-sink') || 'default';
    var themePalettes = {
      'default':   { theme: 'default',   c: ['#8250df', '#0969da', '#ff6b9d', '#f0b429'] },
      'sakura':    { theme: 'sakura',     c: ['#e05c8a', '#f9a8c9', '#c94070', '#ffb7c5'] },
      'your-name': { theme: 'your-name',  c: ['#1a59a4', '#4a9de0', '#f4a738', '#60b8ff'] },
      'space':     { theme: 'space',      c: ['#00e5ff', '#4a9de0', '#7b2fbe', '#0d2149'] },
      'sunset':    { theme: 'sunset',     c: ['#f0b429', '#ffd98a', '#e8821e', '#d9930d'] },
      'mono':      { theme: 'mono',       c: ['#222222', '#555555', '#888888', '#bbbbbb'] }
    };
    var def = themePalettes[savedId] || themePalettes['default'];
    function applyFouc() {
      if (!document.body) return;
      document.body.setAttribute('data-luliy-theme', def.theme);
      document.documentElement.style.setProperty('--card-c1', def.c[0]);
      document.documentElement.style.setProperty('--card-c2', def.c[1]);
      document.documentElement.style.setProperty('--card-c3', def.c[2]);
      document.documentElement.style.setProperty('--card-c4', def.c[3]);
    }
    if (document.body) applyFouc();
    else document.addEventListener('DOMContentLoaded', applyFouc);
  })();

  /* Restore saved background image immediately (prevent flash) */
  (function () {
    var savedBg = localStorage.getItem('luliy-bg');
    if (!savedBg) return;
    function applyBg() {
      if (!document.body) return;
      document.body.style.setProperty('background-image', 'url("' + savedBg + '")', 'important');
    }
    if (document.body) applyBg();
    else document.addEventListener('DOMContentLoaded', applyBg);
  })();

  /* Welcome splash (before DOM ready, append after body exists) */
  /* Homepage Hero is initialised inside ready() (needs DOM + helpers) */

  /* Sakura petals */
  if (localStorage.getItem('luliy-sakura') !== '0') {
    if (document.body) initSakura();
    else document.addEventListener('DOMContentLoaded', initSakura);
  }

  /* Crash isolation: one broken module must never take down the rest */
  function safe(fn, name) {
    try { fn(); }
    catch (e) {
      try { console.warn('[luliy] init failed:', name || fn.name, e); } catch (e2) {}
    }
  }

  ready(function () {
    safe(initHomeHero,        'homeHero');
    safe(initAPlayer,         'aplayer');
    safe(initProgressBar,     'progressBar');
    safe(initDynamicTitle,    'dynamicTitle');
    safe(initUptime,          'uptime');
    safe(initSfxEvents,       'sfx');
    safe(initClickSparks,     'sparks');
    safe(initThemeRipple,     'ripple');
    safe(initTagEnhance,      'tagEnhance');
    safe(initHeroCluster,     'navbar');
    safe(initLightbox,        'lightbox');
    safe(initToolbar,         'toolbar');
    safe(initNavTransparency, 'navTransparency');
    safe(initMobileNav,       'mobileNav');
    safe(initFavoritesLock,   'favLock');   /* safety net — also called in post init */

    /* v10 global features */
    safe(applyReduceMotion,   'reduceMotion');
    safe(applyBgBlur,         'bgBlur');
    safe(applyPbWidth,        'pbWidth');
    safe(initFocusMode,       'focusMode');
    safe(initViewTransitions, 'viewTransitions');
    safe(initTagCloud,        'tagCloud');
    if (localStorage.getItem('luliy-trail') === '1') safe(initMouseTrail, 'mouseTrail');
    safe(maybeFireflies,      'fireflies');

    /* Re-evaluate fireflies when color mode flips (Gmeek toggles data-color-mode) */
    (function () {
      var mo = new MutationObserver(maybeFireflies);
      try { mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode'] }); } catch (e) {}
      if (document.body) {
        var mo2 = new MutationObserver(maybeFireflies);
        try { mo2.observe(document.body, { attributes: true, attributeFilter: ['data-luliy-theme'] }); } catch (e) {}
      }
    })();

    var isPost    = !!document.getElementById('postBody');
    var hasList   = !!document.querySelector('.SideNav,.post-item,.postList,.post-list');

    if (isPost) root._luliyInitPost();
    if (isIndexPage() || isArchivePage() || (!isPost && hasList)) root._luliyInitIndex();

    /* ── Click-blocker watchdog ───────────────────────────────
       Safety net: neutralise any leftover full-viewport fixed
       overlay (high z-index, transparent / off-screen) that would
       silently intercept clicks on the navbar / TOC / buttons.    */
    initClickBlockerWatchdog();
  });

  function initClickBlockerWatchdog() {
    function sweep() {
      var vw = window.innerWidth, vh = window.innerHeight;
      var els = document.querySelectorAll('body > div, body > section, body > a');
      els.forEach(function (el) {
        /* Never touch our own interactive overlays or known UI */
        var id = el.id || '';
        if (/luliy-(toolbar|ctrl|search-bar|lightbox|fav-gate|nav-dropdown|back-top|search-fab|resume|linktip|music)/.test(id)) return;
        var cs = window.getComputedStyle(el);
        if (cs.position !== 'fixed') return;
        if (cs.pointerEvents === 'none') return;
        var r = el.getBoundingClientRect();
        /* Covers most of the viewport? */
        var coversX = r.left <= 4 && r.right >= vw - 4;
        var coversY = r.top <= 4 && r.bottom >= vh - 4;
        if (!coversX || !coversY) return;
        /* If it's effectively invisible (transparent / faded), it must
           not be eating clicks — force click-through. */
        var op = parseFloat(cs.opacity);
        var leaving = el.classList.contains('is-leaving');
        if (op < 0.05 || leaving || cs.visibility === 'hidden' || cs.display === 'none') {
          el.style.pointerEvents = 'none';
        }
      });
    }
    /* Run a few times after load to catch late-appearing overlays */
    sweep();
    setTimeout(sweep, 500);
    setTimeout(sweep, 1500);
    setTimeout(sweep, 3500);
    /* Also sweep whenever the user tries (and fails) to interact */
    document.addEventListener('pointerdown', function () { setTimeout(sweep, 0); }, { passive: true });
  }

})(window);
