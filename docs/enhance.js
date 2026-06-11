/* enhance.js - Luliy Blog v9
   Modules:
   00  Welcome splash (animation sequence)
   01  localStorage init
   02  Progress bar
   03  Dynamic title
   04  Uptime counter
   05  Dark-mode ripple
   06  Static background (particles removed)
   07  Web Audio SFX
   08  Click sparks
   09  Hero cluster (avatar + name + clock) + homepage nav button
   10  Hero banner (homepage scroll-fold)
   11  Tag page search toolbar
   12  Image lightbox
   13  Floating toolbar + unified sink (6 themes) + reading prefs
   14  Home card rebuild (year grouping + relative dates + multi-level pin)
   15  macOS code block strip (+ line numbers)
   16  Sakura petals + shooting stars
   17  ArticleTOC scroll-spy + back-to-top
   18  Mobile nav hamburger + dropdown
   19  Favorites page front-end lock
   20  Homepage bottom gallery banner (grid + custom images)
   21  Post page init
   22  Index page init
   23  Music player (floating, custom playlist)
   24  Main entry
*/
(function (root) {
  'use strict';

  /* ════════════════════════════════════════════════════════
     SITE OPTIONS — edit these to customise
  ════════════════════════════════════════════════════════ */
  var LULIY_OPTS = {
    /* Homepage bottom gallery: 1 image = banner, 2+ = grid.
       Users can append their own via the ✎ button (saved in localStorage). */
    galleryImages: [
      'https://raw.githubusercontent.com/luliy6/luliy6.github.io/refs/heads/main/static/img/9.jpg'
    ],
    galleryText: '\u6211\u5c06\u65e0\u9650\u8fdb\u6b65',          /* 我将无限进步 */

    /* Welcome splash animation sequence — lines fade in one by one */
    welcomeSequence: [
      '\u6b22\u8fce\u6765\u5230 Luliy \u7684\u4e16\u754c',          /* 欢迎来到 Luliy 的世界 */
      '\u6211\u5c06\u65e0\u9650\u8fdb\u6b65\uff01',                 /* 我将无限进步！ */
      '\u613f\u4f60\u5728\u8fd9\u91cc\u6709\u6240\u6536\u83b7 \u2727' /* 愿你在这里有所收获 ✧ */
    ],

    /* Music playlist — replace src with your own hosted mp3 links.
       The first track is a placeholder demo; swap in a real space-
       themed soundtrack URL of your own. */
    musicTracks: [
      { name: '\u661f\u9645\u6f2b\u6e38\u00b7\u793a\u4f8b\u66f2\u76ee', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' }
    ],

    /* Favorites page lock — SHA-256 of the password (121383).
       NOTE: this is a front-end gate (deterrent), not true encryption:
       the page source is still publicly readable. */
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
  function initWelcomeSplash() {
    if (sessionStorage.getItem('luliy-welcomed') === '1') return;

    var splash = document.createElement('div');
    splash.id = 'luliy-welcome';

    var inner = document.createElement('div');
    inner.id = 'luliy-welcome-inner';

    var seq = LULIY_OPTS.welcomeSequence || [];
    var title = document.createElement('div');
    title.id = 'luliy-welcome-title';
    title.className = 'luliy-welcome-seq';
    title.textContent = seq[0] || '\u6b22\u8fce';
    title.style.animationDelay = '0.2s';
    inner.appendChild(title);

    /* Subsequent lines fade in one after another */
    for (var i = 1; i < seq.length; i++) {
      var line = document.createElement('div');
      line.className = 'luliy-welcome-seq' + (i === 1 ? '' : ' luliy-welcome-extra');
      if (i === 1) line.id = 'luliy-welcome-sub';
      line.textContent = seq[i];
      line.style.animationDelay = (0.2 + i * 0.55) + 's';
      inner.appendChild(line);
    }

    var btn = document.createElement('button');
    btn.id = 'luliy-welcome-btn';
    btn.className = 'luliy-welcome-seq';
    btn.style.animationDelay = (0.2 + seq.length * 0.55) + 's';
    btn.textContent = '\u70b9\u51fb\u8fdb\u5165';
    inner.appendChild(btn);

    var hint = document.createElement('div');
    hint.id = 'luliy-welcome-hint';
    hint.textContent = '\u25bc  ENTER';

    splash.appendChild(inner);
    splash.appendChild(hint);
    document.body.appendChild(splash);
    document.body.style.overflow = 'hidden';

    function enter() {
      sessionStorage.setItem('luliy-welcomed', '1');
      splash.classList.add('is-leaving');
      document.body.style.overflow = '';
      setTimeout(function () { if (splash.parentNode) splash.remove(); }, 950);
    }

    btn.addEventListener('click', function (e) { e.stopPropagation(); enter(); });

    var kHandler = function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        document.removeEventListener('keydown', kHandler);
        enter();
      }
    };
    document.addEventListener('keydown', kHandler);
  }

  /* ---- 01  localStorage init ------------------------------ */
  function initLocalStorage() {
    var defs = {
      'luliy-sfx':      '1',
      'luliy-sakura':   '1',
      'luliy-sink':     'default',
      'luliy-bg':       '',
      'luliy-fontsize': '18',
      'luliy-sans':     '0',
      'luliy-music':    ''
    };
    Object.keys(defs).forEach(function (k) {
      if (localStorage.getItem(k) === null) localStorage.setItem(k, defs[k]);
    });
  }

  /* ---- 02  Progress bar ----------------------------------- */
  function initProgressBar() {
    var bar = document.createElement('div');
    bar.id = 'luliy-progress-bar';
    document.body.appendChild(bar);
    window.addEventListener('scroll', function () {
      var st = window.scrollY || document.documentElement.scrollTop;
      var dh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = (dh > 0 ? Math.round(st / dh * 100) : 0) + '%';
    }, { passive: true });
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

  /* ---- 05  Dark-mode theme ripple ------------------------- */
  function initThemeRipple() {
    function ripple() {
      playSfx('theme');
      var old = document.getElementById('luliy-theme-ripple');
      if (old) old.remove();
      var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      var maxR = Math.sqrt(cx * cx + cy * cy) * 2.2;
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
    document.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b && (b.innerHTML.includes('Moon') || b.innerHTML.includes('Sun') ||
        (b.title && /dark|light|theme|\u4e3b\u9898/i.test(b.title)))) ripple();
    });
    setTimeout(function () {
      document.querySelectorAll('.title-right .circle').forEach(function (el) {
        if (el._luliyRipple) return;
        el._luliyRipple = true;
        el.addEventListener('click', ripple);
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

  /* ---- 09  Hero cluster (avatar + name + clock in header) - */
  function initHeroCluster() {
    function tryBuild() {
      var header = document.getElementById('header'); if (!header) return false;
      if (document.getElementById('luliy-hero-cluster')) return true;
      var av = header.querySelector('img.avatar, img[src*="avatar"]');
      if (!av) return false;

      var cluster = document.createElement('a');
      cluster.id = 'luliy-hero-cluster';
      cluster.href = '/about';
      cluster.title = '\u5173\u4e8e\u6211';

      var avClone = av.cloneNode(true);
      avClone.style.cssText = '';
      cluster.appendChild(avClone);

      var info = document.createElement('div');
      info.id = 'luliy-hero-info';

      var nameEl = document.createElement('div');
      nameEl.id = 'luliy-hero-name';
      nameEl.textContent = 'Luliy';
      info.appendChild(nameEl);

      var clk = document.createElement('div');
      clk.id = 'luliy-avatar-clock';
      info.appendChild(clk);

      cluster.appendChild(info);
      header.insertBefore(cluster, header.firstChild);

      /* Hide original avatar in header */
      if (av.parentElement && av.parentElement !== header) av.parentElement.style.display = 'none';
      else av.style.display = 'none';
      header.querySelectorAll('.blogTitle, .postTitle').forEach(function (el) {
        el.style.display = 'none';
      });

      function updClock() {
        var n = new Date();
        clk.textContent =
          String(n.getHours()).padStart(2, '0') + ':' +
          String(n.getMinutes()).padStart(2, '0') + ':' +
          String(n.getSeconds()).padStart(2, '0');
      }
      updClock(); setInterval(updClock, 1000);
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
    window.addEventListener('scroll', function () {
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

  /* ---- Reading preferences (font size + sans-serif) -------- */
  function applyReadingPrefs() {
    var pbody = document.getElementById('postBody');
    if (!pbody) return;
    var px = parseInt(localStorage.getItem('luliy-fontsize') || '18', 10) || 18;
    px = Math.min(24, Math.max(14, px));
    pbody.style.setProperty('font-size', px + 'px', 'important');
    document.body.classList.toggle('luliy-sans', localStorage.getItem('luliy-sans') === '1');
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
    var header = document.getElementById('header');
    if (!header) return;
    window.addEventListener('scroll', function () {
      var st = window.scrollY || window.pageYOffset || 0;
      header.classList.toggle('header-scrolled', st > 100);
    }, { passive: true });
  }

  function initToolbar() {
    if (document.getElementById('luliy-toolbar')) return;
    var bar = document.createElement('div');
    bar.id = 'luliy-toolbar';

    /* ── Shared Audio engine (lives in toolbar closure) ────── */
    var _audio = new Audio();
    _audio.preload = 'none';
    _audio.volume = 0.55;
    var _trackIdx = 0;
    var _musicPlaying = false;

    function _getTracks() {
      var list = (LULIY_OPTS.musicTracks || []).slice();
      try {
        var custom = JSON.parse(localStorage.getItem('luliy-music') || '[]');
        if (Array.isArray(custom)) list = list.concat(custom);
      } catch (e) {}
      return list.filter(function (t) { return t && t.src; });
    }

    function _loadTrack(i) {
      var tracks = _getTracks();
      if (!tracks.length) return null;
      _trackIdx = ((i % tracks.length) + tracks.length) % tracks.length;
      _audio.src = tracks[_trackIdx].src;
      return tracks[_trackIdx];
    }

    function _playAudio() {
      if (!_audio.src) _loadTrack(0);
      return _audio.play();
    }
    function _pauseAudio() { _audio.pause(); }

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
      previewDay.querySelector('.preview-dot').style.background = pal.day[1];
      previewNight.style.background  = pal.night[0];
      previewNight.style.color       = pal.night[2];
      previewNight.style.borderColor = pal.night[1] + '44';
      previewNight.querySelector('.preview-dot').style.background = pal.night[1];
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

      /* Sans-serif toggle */
      var sansOn  = localStorage.getItem('luliy-sans') === '1';
      var sansRow = mkRow('\u270d', '\u9ed1\u4f53\u6a21\u5f0f', sansOn ? '\u5f00\u542f' : '\u5173\u95ed'); /* ✍ 黑体模式 */
      sansRow.addEventListener('click', function (e) {
        e.stopPropagation();
        var on = localStorage.getItem('luliy-sans') === '1';
        localStorage.setItem('luliy-sans', on ? '0' : '1');
        sansRow._bdg.textContent = !on ? '\u5f00\u542f' : '\u5173\u95ed';
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
      if (t) _playAudio().then(function () { mPlayBtn.textContent = '\u23f8'; refreshPlaylist(); }).catch(function(){});
    });

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

      /* Multi-level pin badge: 📌 / 📌2 / 📌3 ... */
      if (isPinned && post.pinLevel) {
        var pin = document.createElement('span');
        pin.className = 'luliy-card-pinbadge';
        pin.textContent = '\uD83D\uDCCC' + (post.pinLevel > 1 ? post.pinLevel : '');
        pin.title = '\u7f6e\u9876\u7ea7\u522b ' + post.pinLevel;
        li.appendChild(pin);
      }

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

      var displayPosts = regularPosts;
      if (onIndex) {
        var start = (pageNum - 1) * perPage;
        displayPosts = regularPosts.slice(start, start + perPage);
      }

      /* Pinned section — fixed area, always above the regular grid */
      if (pinnedPosts.length > 0 && onIndex && pageNum === 1) {
        var existing = document.getElementById('luliy-pinned-section');
        if (existing) existing.remove();
        var ps = document.createElement('div');
        ps.id = 'luliy-pinned-section';
        var psTitle = document.createElement('div');
        psTitle.className = 'luliy-pinned-title';
        psTitle.textContent = '\uD83D\uDCCC \u7f6e\u9876\u63a8\u8350';   /* 📌 置顶推荐 */
        ps.appendChild(psTitle);
        var pg = document.createElement('ul');
        pg.className = 'luliy-card-grid luliy-pinned-grid';
        pinnedPosts.forEach(function (post, i) { pg.appendChild(buildCard(post, true, i)); });
        ps.appendChild(pg);
        nav.parentNode.insertBefore(ps, nav);
      }

      nav.innerHTML = '';
      nav.className = 'luliy-card-grid';

      /* Card grouping — insert a year divider whenever the year changes */
      var lastYear = null;
      displayPosts.forEach(function (post, i) {
        var y = (post.created || '').slice(0, 4);
        if (y && y !== lastYear) {
          lastYear = y;
          var divider = document.createElement('li');
          divider.className = 'luliy-card-yeardiv';
          divider.innerHTML = '<span>' + esc(y) + '</span>';
          nav.appendChild(divider);
        }
        nav.appendChild(buildCard(post, false, i));
      });

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
      window.addEventListener('scroll', function () {
        btn.classList.toggle('is-visible', (window.scrollY || 0) > 300);
      }, { passive: true });
    }

    function trySetup() {
      var toc = document.querySelector('#TOC, .articletoc, .toc, .ArticleTOC, #articleTOC, #postBody > nav, [id*="articleTOC"], [class*="ArticleTOC"]');
      if (!toc) return false;
      if (toc._luliySpy) return true;

      /* ── Extract TOC from inside #postBody → append to body ──
         articletoc.js inserts the TOC inline inside #postBody.
         We move it to document.body so position:fixed works correctly
         and it renders OUTSIDE the article glass card.             */
      if (pbody && pbody.contains(toc)) {
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
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
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
        var sansOn2 = localStorage.getItem('luliy-sans') === '1';
        var sansItem = document.createElement('button');
        sansItem.className = 'luliy-nav-item luliy-drop-toggle';
        sansItem.type = 'button';
        sansItem.textContent = '\u270d \u9ed1\u4f53\u00b7' + (sansOn2 ? '\u5f00\u542f' : '\u5173\u95ed');
        sansItem.addEventListener('click', function () {
          var on = localStorage.getItem('luliy-sans') === '1';
          localStorage.setItem('luliy-sans', on ? '0' : '1');
          sansItem.textContent = '\u270d \u9ed1\u4f53\u00b7' + (!on ? '\u5f00\u542f' : '\u5173\u95ed');
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
      pbody.classList.remove('luliy-locked');
      gate.classList.add('is-leaving');
      playSfx('sci');
      setTimeout(function () { gate.remove(); }, 500);
    }

    function attempt() {
      var v = (input.value || '').trim();
      if (!v) return;
      sha256Hex(v).then(function (hex) {
        if (hex === LULIY_OPTS.favoritesHash) unlock();
        else {
          err.textContent = '\u5bc6\u7801\u9519\u8bef\uff0c\u8bf7\u91cd\u8bd5';   /* 密码错误，请重试 */
          input.value = '';
          gate.querySelector('#luliy-fav-gate-card').classList.remove('shake');
          void gate.offsetWidth;
          gate.querySelector('#luliy-fav-gate-card').classList.add('shake');
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
    }).catch(function () {});

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

    if (isArchivePage()) {
      var pb = document.getElementById('postBody');
      if (pb) {
        pb.innerHTML = '<p style="color:#888;font-size:14px">\u6b63\u5728\u52a0\u8f7d\u5f52\u6863...</p>';
        fetchPosts().then(function (posts) {
          var byY = {};
          posts.forEach(function (p) {
            var y = (p.created || '\u672a\u77e5').slice(0, 4);
            if (!byY[y]) byY[y] = [];
            byY[y].push(p);
          });
          var years = Object.keys(byY).sort(function (a, b) { return b - a; });
          var html =
            '<h1 style="border-bottom:2px solid rgba(240,180,41,0.4);padding-bottom:10px;margin-bottom:30px">' +
            '\uD83D\uDCC5 \u6587\u7ae0\u5f52\u6863</h1>';
          years.forEach(function (y) {
            html += '<div class="tl-year">' + y + ' \u5e74</div><ul class="tl-list">';
            byY[y].forEach(function (p) {
              var md = (p.created || '').slice(5, 10).replace('-', '/');
              html +=
                '<li class="tl-item">' +
                '<a href="' + esc(buildPostLink(p.link)) + '">' + esc(p.title) + '</a>' +
                '<span class="tl-date">' + md + '</span>' +
                '</li>';
            });
            html += '</ul>';
          });
          pb.innerHTML = html;
        }).catch(function () {
          pb.innerHTML = '<p style="color:#e74c3c">\u5f52\u6863\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u5237\u65b0\u91cd\u8bd5\u3002</p>';
        });
      }
    }
  };

  /* ---- 24  Main entry ------------------------------------- */
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
  if (document.body) initWelcomeSplash();
  else document.addEventListener('DOMContentLoaded', initWelcomeSplash);

  /* Sakura petals */
  if (localStorage.getItem('luliy-sakura') !== '0') {
    if (document.body) initSakura();
    else document.addEventListener('DOMContentLoaded', initSakura);
  }

  ready(function () {
    initProgressBar();
    initDynamicTitle();
    initUptime();
    initSfxEvents();
    initClickSparks();
    initThemeRipple();
    initTagEnhance();
    initHeroCluster();
    initLightbox();
    initToolbar();
    initNavTransparency();
    initMobileNav();
    initFavoritesLock();   /* safety net — also called in post init */

    var isPost    = !!document.getElementById('postBody');
    var hasList   = !!document.querySelector('.SideNav,.post-item,.postList,.post-list');

    if (isPost) root._luliyInitPost();
    if (isIndexPage() || isArchivePage() || (!isPost && hasList)) root._luliyInitIndex();
  });

})(window);
