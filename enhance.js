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
   16  Sakura petals + shooting stars
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

    /* Music playlist — global playback, resumes across page loads. */
    musicTracks: [
      { name: 'dark', src: 'https://raw.githubusercontent.com/luliy6/luliy6.github.io/refs/heads/main/static/doc/dark.mp3' }
    ],

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
      'luliy-music':     '',
      'luliy-cardview':  'grid',   /* grid | list */
      'luliy-trail':     '0',      /* mouse trail off by default */
      'luliy-firefly':   '0',      /* fireflies off by default */
      'luliy-focus':     '0',      /* focus reading mode */
      'luliy-reduce':    '0'       /* reduce motion override */
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
      dot:   '#ff7e5f',
      theme: 'sunset',
      cardPalette: ['#ff7e5f', '#feb47b', '#e0566e', '#6a3093'],
      desc:  '\u6a58\u7ea2\u665a\u971e\uff0c\u6e29\u67d4\u9ec4\u660f'  /* 橘红晚霞，温柔黄昏 */
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

    /* ── Shared Audio engine with cross-page resume ─────────
       Gmeek is a multi-page site, so each navigation destroys the
       Audio object. We persist {track, position, playing} to
       localStorage and resume on the next page (subject to the
       browser autoplay policy — first play needs a user gesture). */
    var _audio = new Audio();
    _audio.preload = 'metadata';
    _audio.volume = 0.55;
    var _trackIdx = 0;
    var _musicPlaying = false;
    var MUSIC_STATE = 'luliy-music-state';

    function _getTracks() {
      var list = (LULIY_OPTS.musicTracks || []).slice();
      try {
        var custom = JSON.parse(localStorage.getItem('luliy-music') || '[]');
        if (Array.isArray(custom)) list = list.concat(custom);
      } catch (e) {}
      return list.filter(function (t) { return t && t.src; });
    }

    function _saveState() {
      try {
        localStorage.setItem(MUSIC_STATE, JSON.stringify({
          idx: _trackIdx,
          pos: _audio.currentTime || 0,
          playing: _musicPlaying,
          t: Date.now()
        }));
      } catch (e) {}
    }

    function _loadTrack(i, resumePos) {
      var tracks = _getTracks();
      if (!tracks.length) return null;
      _trackIdx = ((i % tracks.length) + tracks.length) % tracks.length;
      _audio.src = tracks[_trackIdx].src;
      if (resumePos) {
        _audio.addEventListener('loadedmetadata', function onMeta() {
          _audio.removeEventListener('loadedmetadata', onMeta);
          try { if (resumePos < _audio.duration) _audio.currentTime = resumePos; } catch (e) {}
        });
      }
      return tracks[_trackIdx];
    }

    function _playAudio() {
      if (!_audio.src) _loadTrack(0);
      return _audio.play();
    }
    function _pauseAudio() { _audio.pause(); }

    /* Persist position periodically + on page unload */
    _audio.addEventListener('timeupdate', function () {
      if (_musicPlaying) {
        /* throttle: save roughly every 3s */
        var now = Date.now();
        if (!_audio._lastSave || now - _audio._lastSave > 3000) {
          _audio._lastSave = now; _saveState();
        }
      }
    });
    window.addEventListener('pagehide', _saveState);
    window.addEventListener('beforeunload', _saveState);

    /* ── Pill trigger button ──────────────────────────────── */
    var ctrlBtn = document.createElement('button');
    ctrlBtn.id = 'luliy-ctrl-btn';
    ctrlBtn.type = 'button';
    function refreshBtnLabel() {
      var sfx    = localStorage.getItem('luliy-sfx')    !== '0';
      var sakura = localStorage.getItem('luliy-sakura') !== '0';
      ctrlBtn.textContent = (sfx ? '\uD83D\uDD0A' : '\uD83D\uDD07') + ' \u2728 ' + (sakura ? '\uD83C\uDF38' : '\u00D7') + (_musicPlaying ? ' \uD83C\uDFB5' : '');
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
      'sunset':    { day: ['rgba(255,243,234,0.92)', '#e0566e', '#6b2230'],  night: ['rgba(40,14,26,0.90)',  '#feb47b', '#ffd9c0'] },
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
      if (on) { var c = document.getElementById('luliy-sakura-canvas'); if (c) c.remove(); }
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
    }

    /* ── 🎵 Music player section ─────────────────────────── */
    panel.appendChild(mkSep());
    panel.appendChild(mkSec('\uD83C\uDFB5 \u97f3\u4e50'));   /* 🎵 音乐 */

    /* Now-playing display */
    var musicNameEl = document.createElement('div');
    musicNameEl.id = 'luliy-music-name';
    musicNameEl.className = 'luliy-music-name';
    musicNameEl.textContent = '--';
    panel.appendChild(musicNameEl);

    /* Transport controls */
    var musicCtrls = document.createElement('div');
    musicCtrls.className = 'luliy-music-ctrls';
    function mkMusicBtn(label, title) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'luliy-music-btn'; b.textContent = label; b.title = title || label;
      return b;
    }
    var mPlayBtn = mkMusicBtn('\u25b6', '\u64ad\u653e');   /* ▶ */
    var mPrevBtn = mkMusicBtn('\u23ee', '\u4e0a\u4e00\u9996');   /* ⏮ */
    var mNextBtn = mkMusicBtn('\u23ed', '\u4e0b\u4e00\u9996');   /* ⏭ */
    var mAddBtn  = mkMusicBtn('\uff0b', '\u6dfb\u52a0\u97f3\u4e50');   /* ＋ */
    musicCtrls.appendChild(mPrevBtn);
    musicCtrls.appendChild(mPlayBtn);
    musicCtrls.appendChild(mNextBtn);
    musicCtrls.appendChild(mAddBtn);
    panel.appendChild(musicCtrls);

    /* Playlist */
    var playlistEl = document.createElement('div');
    playlistEl.className = 'luliy-playlist';
    panel.appendChild(playlistEl);

    function refreshPlaylist() {
      var tracks = _getTracks();
      playlistEl.innerHTML = '';
      if (!tracks.length) {
        musicNameEl.textContent = '\u6682\u65e0\u66f2\u76ee\uff0c\u70b9 \uff0b \u6dfb\u52a0';   /* 暂无曲目，点 ＋ 添加 */
        return;
      }
      tracks.forEach(function (t, i) {
        var item = document.createElement('button');
        item.type = 'button';
        item.className = 'luliy-playlist-item' + (i === _trackIdx ? ' is-playing' : '');
        item.title = t.src;
        var icon = document.createElement('span');
        icon.className = 'luliy-playlist-icon';
        icon.textContent = i === _trackIdx && _musicPlaying ? '\u25b6' : '\u266a';   /* ▶ / ♪ */
        var name = document.createElement('span');
        name.className = 'luliy-playlist-name';
        name.textContent = t.name || ('\u66f2\u76ee ' + (i + 1));
        item.appendChild(icon); item.appendChild(name);
        item.addEventListener('click', function (e) {
          e.stopPropagation();
          _loadTrack(i);
          _playAudio().then(function () {
            _musicPlaying = true;
            mPlayBtn.textContent = '\u23f8';
            refreshPlaylist();
            musicNameEl.textContent = tracks[i].name || ('\u66f2\u76ee ' + (i + 1));
          }).catch(function () {});
        });
        playlistEl.appendChild(item);
      });
      if (_trackIdx < tracks.length) {
        musicNameEl.textContent = tracks[_trackIdx].name || ('\u66f2\u76ee ' + (_trackIdx + 1));
      }
    }
    refreshPlaylist();

    mPlayBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (_musicPlaying) {
        _pauseAudio(); _musicPlaying = false;
        mPlayBtn.textContent = '\u25b6';
        refreshBtnLabel();
      } else {
        _playAudio().then(function () {
          _musicPlaying = true; mPlayBtn.textContent = '\u23f8';
          refreshBtnLabel(); refreshPlaylist();
        }).catch(function () {});
      }
      playSfx('click');
    });
    mPrevBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var t = _loadTrack(_trackIdx - 1);
      if (t && _musicPlaying) {
        _playAudio().then(function () { mPlayBtn.textContent = '\u23f8'; refreshPlaylist(); }).catch(function(){});
      } else { refreshPlaylist(); }
      playSfx('click');
    });
    mNextBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var t = _loadTrack(_trackIdx + 1);
      if (t && _musicPlaying) {
        _playAudio().then(function () { mPlayBtn.textContent = '\u23f8'; refreshPlaylist(); }).catch(function(){});
      } else { refreshPlaylist(); }
      playSfx('click');
    });
    _audio.addEventListener('ended', function () {
      var t = _loadTrack(_trackIdx + 1);
      if (t) _playAudio().then(function () { mPlayBtn.textContent = '\u23f8'; refreshPlaylist(); _saveState(); }).catch(function(){});
    });
    /* Keep play button + state in sync if audio pauses/plays externally */
    _audio.addEventListener('pause', function () { _musicPlaying = false; mPlayBtn.textContent = '\u25b6'; refreshBtnLabel(); _saveState(); });
    _audio.addEventListener('play',  function () { _musicPlaying = true;  mPlayBtn.textContent = '\u23f8'; refreshBtnLabel(); });

    /* Restore playback from the previous page (global resume) */
    (function restoreMusic() {
      var st = null;
      try { st = JSON.parse(localStorage.getItem(MUSIC_STATE) || 'null'); } catch (e) {}
      if (!st || typeof st.idx !== 'number') return;
      var tracks = _getTracks();
      if (!tracks.length) return;
      _loadTrack(st.idx, st.pos || 0);
      refreshPlaylist();
      musicNameEl.textContent = (tracks[_trackIdx] && tracks[_trackIdx].name) || ('\u66f2\u76ee ' + (_trackIdx + 1));
      if (st.playing) {
        _playAudio().then(function () {
          _musicPlaying = true; mPlayBtn.textContent = '\u23f8'; refreshBtnLabel(); refreshPlaylist();
        }).catch(function () {
          var resumeOnce = function () {
            _playAudio().then(function () {
              _musicPlaying = true; mPlayBtn.textContent = '\u23f8'; refreshBtnLabel(); refreshPlaylist();
            }).catch(function () {});
          };
          document.addEventListener('click', resumeOnce, { once: true });
          document.addEventListener('keydown', resumeOnce, { once: true });
        });
      }
    })();

    mAddBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var url = window.prompt('\u7c98\u8d34\u97f3\u4e50\u76f4\u94fe\uff08mp3\uff09\uff0c\u6216\u8f93\u5165 reset \u6e05\u7a7a\uff1a', '');
      if (url === null) return;
      url = url.trim();
      var custom = [];
      try { custom = JSON.parse(localStorage.getItem('luliy-music') || '[]'); } catch (_) {}
      if (!Array.isArray(custom)) custom = [];
      if (url.toLowerCase() === 'reset') {
        custom = [];
      } else if (url) {
        var nm = window.prompt('\u66f2\u76ee\u540d\u79f0\uff1a', '\u6211\u7684\u97f3\u4e50') || '\u6211\u7684\u97f3\u4e50';
        custom.push({ name: nm, src: url });
      }
      localStorage.setItem('luliy-music', JSON.stringify(custom));
      refreshPlaylist();
      playSfx('click');
    });

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

  /* ---- 16  Sakura petals + shooting stars (seasonal) ------ */
  /* Season config — auto-detected from current month */
  var SEASON_CONFIG = (function () {
    var m = new Date().getMonth(); // 0–11
    if (m >= 2 && m <= 4) return {
      name: 'spring',
      colors: ['#ffb7c5', '#ffc0cb', '#ff9eb5', '#ffd0d8', '#ffaec0', '#f9c4d2', '#fce4ec', '#f8bbd0'],
      count: 16, speedY: [0.35, 0.80], sizeRange: [8, 18],
      wind: 0.55, opacity: [0.25, 0.80]
    };
    if (m >= 5 && m <= 7) return {
      name: 'summer',
      colors: ['#a8edbc', '#7de3a0', '#56d98a', '#34c770', '#b2f0c8', '#90e8b0', '#c8f5d8', '#6ad990'],
      count: 16, speedY: [0.28, 0.55], sizeRange: [6, 14],
      wind: 0.20, opacity: [0.20, 0.55]
    };
    if (m >= 8 && m <= 10) return {
      name: 'autumn',
      colors: ['#ff9966', '#ff6644', '#ff8833', '#ffaa44', '#cc5522', '#ff7744', '#ffcc66', '#dd6633'],
      count: 16, speedY: [0.45, 0.95], sizeRange: [9, 20],
      wind: 0.80, opacity: [0.28, 0.72]
    };
    return {
      name: 'winter',
      colors: ['#e8f4fd', '#d0eaf8', '#ffffff', '#c8e4f4', '#ddf0ff', '#eef8ff', '#f0f8ff', '#d8ecf8'],
      count: 16, speedY: [0.18, 0.40], sizeRange: [5, 12],
      wind: 0.12, opacity: [0.20, 0.50]
    };
  })();

  function initSakura() {
    if (localStorage.getItem('luliy-sakura') === '0') return;
    if (document.getElementById('luliy-sakura-canvas')) return;
    var canvas = document.createElement('canvas');
    canvas.id = 'luliy-sakura-canvas';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d'), W, H;
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize, { passive: true });
    var S = SEASON_CONFIG;
    var COLORS = S.colors;
    var WIND = S.wind;           /* horizontal drift */
    var COUNT = S.count;         /* 16 petals */
    function mkPetal(randomY) {
      var sMin = S.sizeRange[0], sMax = S.sizeRange[1];
      var size = Math.random() * (sMax - sMin) + sMin;
      var vMin = S.speedY[0], vMax = S.speedY[1];
      var oMin = S.opacity[0], oMax = S.opacity[1];
      return {
        x: Math.random() * W, y: randomY ? Math.random() * H : -size,
        size: size, opacity: Math.random() * (oMax - oMin) + oMin,
        speedX: (Math.random() * 0.8 - 0.4) + WIND * 0.5,
        speedY: Math.random() * (vMax - vMin) + vMin,
        rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.038,
        swing: Math.random() * 1.6 + 0.4, swingAngle: Math.random() * Math.PI * 2,
        swingSpeed: 0.008 + Math.random() * 0.018,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        windPhase: Math.random() * Math.PI * 2  /* individual wind phase */
      };
    }
    var petals = [];
    for (var i = 0; i < COUNT; i++) petals.push(mkPetal(true));

    /* ── Shooting stars — occasional meteors across the sky ──
       More frequent on the space theme; subtle elsewhere. */
    var meteors = [];
    var nextMeteorAt = Date.now() + 2500;
    function meteorInterval() {
      var isSpace = document.body && document.body.getAttribute('data-luliy-theme') === 'space';
      return isSpace ? (2000 + Math.random() * 4000) : (6000 + Math.random() * 9000);
    }
    function mkMeteor() {
      var fromLeft = Math.random() < 0.5;
      return {
        x: fromLeft ? Math.random() * W * 0.4 : W * 0.4 + Math.random() * W * 0.6,
        y: Math.random() * H * 0.35,
        vx: (fromLeft ? 1 : -1) * (7 + Math.random() * 6),
        vy: 4 + Math.random() * 3,
        len: 90 + Math.random() * 110,
        life: 1,
        decay: 0.012 + Math.random() * 0.012
      };
    }
    function drawMeteor(m) {
      var dx = m.vx, dy = m.vy;
      var mag = Math.sqrt(dx * dx + dy * dy) || 1;
      var tx = m.x - dx / mag * m.len, ty = m.y - dy / mag * m.len;
      var grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
      var isDark = document.documentElement.getAttribute('data-color-mode') === 'dark' ||
        (document.body && document.body.getAttribute('data-luliy-theme') === 'space');
      var head = isDark ? '255,255,255' : '255,250,230';
      grad.addColorStop(0, 'rgba(' + head + ',' + (0.95 * m.life) + ')');
      grad.addColorStop(0.3, 'rgba(180,210,255,' + (0.45 * m.life) + ')');
      grad.addColorStop(1, 'rgba(180,210,255,0)');
      ctx.save();
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.globalAlpha = m.life;
      ctx.fillStyle = 'rgba(' + head + ',0.95)';
      ctx.beginPath();
      ctx.arc(m.x, m.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    var running = true;
    function tick() {
      if (!document.getElementById('luliy-sakura-canvas')) { running = false; return; }
      ctx.clearRect(0, 0, W, H);
      for (var j = 0; j < petals.length; j++) {
        var p = petals[j];
        p.swingAngle += p.swingSpeed;
        if (p.windPhase !== undefined) p.windPhase += 0.005;
        var windGust = p.windPhase !== undefined ? Math.sin(p.windPhase) * WIND * 0.4 : 0;
        p.x += p.speedX + Math.sin(p.swingAngle) * p.swing + windGust;
        p.y += p.speedY; p.rot += p.rotSpeed;
        if (p.y > H + p.size * 2 || p.x < -p.size * 4 || p.x > W + p.size * 4) petals[j] = mkPetal(false);
        drawPetal(p);
      }
      /* Spawn + advance meteors */
      if (Date.now() >= nextMeteorAt) {
        meteors.push(mkMeteor());
        nextMeteorAt = Date.now() + meteorInterval();
      }
      for (var k = meteors.length - 1; k >= 0; k--) {
        var m = meteors[k];
        m.x += m.vx; m.y += m.vy; m.life -= m.decay;
        if (m.life <= 0 || m.y > H + 50 || m.x < -200 || m.x > W + 200) { meteors.splice(k, 1); continue; }
        drawMeteor(m);
      }
      if (running) requestAnimationFrame(tick);
    }

    function drawPetal(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = p.opacity;
      var s = p.size;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.5);
      ctx.bezierCurveTo(s * 0.55, -s * 0.55, s * 0.55, s * 0.55, 0, s * 0.5);
      ctx.bezierCurveTo(-s * 0.55, s * 0.55, -s * 0.55, -s * 0.55, 0, -s * 0.5);
      ctx.fillStyle = p.color; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -s * 0.4); ctx.lineTo(0, s * 0.4);
      ctx.strokeStyle = 'rgba(255,150,170,0.25)'; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.restore();
    }

    tick();
  }

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
        if (on) { var c = document.getElementById('luliy-sakura-canvas'); if (c) c.remove(); }
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
      'sunset':    { theme: 'sunset',     c: ['#ff7e5f', '#feb47b', '#e0566e', '#6a3093'] },
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
