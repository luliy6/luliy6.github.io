/* enhance.js — Luliy Blog v8
   Modules:
   01  localStorage init
   02  Progress bar
   03  Dynamic title
   04  Uptime counter
   05  Dark-mode ripple
   06  Static background (no-op)
   07  Web Audio SFX
   08  Click sparks
   09  Hero cluster + hero banner
   10  Tag page search toolbar
   11  Image lightbox
   12  Floating toolbar (4 themes, no lock)
   13  Home card rebuild
   14  macOS code blocks (fixed mac-strip wrapper)
   15  Sakura petals
   16  ArticleTOC scroll-spy + back-to-top
   17  Welcome screen (NEW)
   18  Post page init
   19  Index page init
   20  Main entry
*/
(function (root) {
  'use strict';

  /* ---- Utilities ----------------------------------------- */
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
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
            var labels = rawLabels.map(function (lbl) {
              return {
                name: lbl,
                color: (colorDict[lbl] || '0969da').replace(/^#/, '')
              };
            });
            return {
              title:   p.postTitle || p.title || p.name || k,
              link:    p.postUrl || p.link || p.url || ('post/' + k + '.html'),
              created: p.createdDate || p.created || p.date || '',
              labels:  labels,
              pinned:  rawLabels.indexOf('pinned') >= 0
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

  /* ---- 01  localStorage init ----------------------------- */
  function initLocalStorage() {
    var defs = {
      'luliy-sfx':    '1',
      'luliy-sakura': '1',
      'luliy-sink':   'default'
    };
    Object.keys(defs).forEach(function (k) {
      if (localStorage.getItem(k) === null) localStorage.setItem(k, defs[k]);
    });
  }

  /* ---- 02  Progress bar ---------------------------------- */
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

  /* ---- 03  Dynamic title --------------------------------- */
  function initDynamicTitle() {
    var ori = document.title, t;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearTimeout(t);
        document.title = '\uD83D\uDC40 别走啊，我还在进步！';
      } else {
        document.title = '✨ 欢迎回来！ ' + ori;
        t = setTimeout(function () { document.title = ori; }, 2000);
      }
    });
  }

  /* ---- 04  Uptime counter -------------------------------- */
  function initUptime() {
    var el = document.createElement('div');
    el.id = 'luliy-uptime';
    document.body.appendChild(el);
    var start = new Date('2026/05/30 00:00:00').getTime();
    function upd() {
      var d = Date.now() - start;
      if (d < 0) { el.innerHTML = '🚀 博客即将上线，敬请期待...'; return; }
      el.innerHTML = '🌱 本站已陪伴你无限进步：' +
        Math.floor(d / 86400000) + '天 ' +
        Math.floor((d % 86400000) / 3600000) + '小时 ' +
        Math.floor((d % 3600000) / 60000) + '分 ' +
        '<span style="color:#ff4444;font-weight:bold;font-family:monospace">' +
        Math.floor((d % 60000) / 1000) + '</span>秒';
    }
    upd(); setInterval(upd, 1000);
  }

  /* ---- 05  Dark-mode ripple ------------------------------ */
  function initThemeRipple() {
    function ripple() {
      playSfx('theme');
      var old = document.getElementById('luliy-theme-ripple'); if (old) old.remove();
      var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      var maxR = Math.sqrt(cx * cx + cy * cy) * 2.2;
      var isDark = document.documentElement.getAttribute('data-color-mode') === 'dark';
      var el = document.createElement('div'); el.id = 'luliy-theme-ripple';
      el.style.cssText = 'position:fixed;top:' + cy + 'px;left:' + cx +
        'px;width:0;height:0;border-radius:50%;background:' +
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
          (b.title && /dark|light|theme|主题/i.test(b.title)))) ripple();
    });
    setTimeout(function () {
      document.querySelectorAll('.title-right .circle').forEach(function (el) {
        if (el._luliyRipple) return;
        el._luliyRipple = true;
        el.addEventListener('click', ripple);
      });
    }, 800);
  }

  /* ---- 06  Static background (particles removed) --------- */
  function initParticles() { /* static background set in CSS */ }

  /* ---- 07  Web Audio SFX --------------------------------- */
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

  /* ---- 08  Click sparks ---------------------------------- */
  function initClickSparks() {
    var colors = ['#ff6b9d', '#ffcd3c', '#6bceff', '#a78bfa', '#34d399'];
    document.addEventListener('click', function (e) {
      for (var i = 0; i < 12; i++) (function () {
        var s = document.createElement('div');
        var angle = Math.random() * 360, dist = Math.random() * 50 + 16;
        s.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY +
          'px;width:7px;height:7px;border-radius:50%;pointer-events:none;z-index:99999;background:' +
          colors[Math.floor(Math.random() * colors.length)] +
          ';transform:translate(-50%,-50%);transition:transform 0.6s ease,opacity 0.6s ease;';
        document.body.appendChild(s);
        requestAnimationFrame(function () {
          s.style.transform = 'translate(calc(-50% + ' +
            (Math.cos(angle * Math.PI / 180) * dist) + 'px),calc(-50% + ' +
            (Math.sin(angle * Math.PI / 180) * dist) + 'px))';
          s.style.opacity = '0';
        });
        setTimeout(function () { s.remove(); }, 700);
      })();
    });
  }

  /* ---- 09  Hero cluster + hero banner -------------------- */
  function initHeroCluster() {
    function tryBuild() {
      var header = document.getElementById('header'); if (!header) return false;
      if (document.getElementById('luliy-hero-cluster')) return true;
      var av = header.querySelector('img.avatar, img[src*="avatar"]');
      if (!av) return false;

      var cluster = document.createElement('a');
      cluster.id = 'luliy-hero-cluster';
      cluster.href = '/about';
      cluster.title = '关于我';

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
      var iv = setInterval(function () { if (tryBuild() || ++tries > 30) clearInterval(iv); }, 200);
    }
  }

  function initHeroBanner() {
    if (document.getElementById('luliy-hero-banner')) return;
    var content = document.getElementById('content') || document.querySelector('.main');
    if (!content) return;

    var banner = document.createElement('div');
    banner.id = 'luliy-hero-banner';

    var isIndex = location.pathname === '/' ||
      location.pathname === '/index.html' ||
      location.pathname === '';

    if (isIndex) {
      banner.innerHTML =
        '<span>Remember, this is your world.</span>' +
        '<span style="font-size:0.8em;opacity:0.7;letter-spacing:0.08em;font-weight:500">' +
        '我将无限进步</span>';
    } else {
      banner.textContent = 'Remember, this is your world.';
    }

    content.parentNode.insertBefore(banner, content);

    /* Scroll-fold */
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

  /* ---- 10  Tag page search toolbar ----------------------- */
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
        '<input style="padding:6px 14px;border:1px solid rgba(130,80,223,0.3);' +
        'border-radius:20px;outline:none;font-size:13px;width:220px;background:rgba(255,255,255,0.8);" ' +
        'type="search" placeholder="🔍 筛选标签..." autocomplete="off">' +
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
        cnt.textContent = vis + ' / ' + all.length + ' 个标签';
      }
      inp.addEventListener('input', apply);
      new MutationObserver(apply).observe(tl, { childList: true, subtree: true });
      setTimeout(apply, 100);
    }
    wire();
  }

  /* ---- 11  Image lightbox -------------------------------- */
  function initLightbox() {
    if (document.getElementById('luliy-lightbox')) return;
    var lb = document.createElement('div');
    lb.id = 'luliy-lightbox';
    lb.innerHTML = '<button id="luliy-lightbox-close" aria-label="关闭">✕</button><img alt="">';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img');
    var lbClose = lb.querySelector('#luliy-lightbox-close');
    function open(src, alt) {
      lbImg.src = src; lbImg.alt = alt || '';
      lb.classList.add('is-open'); document.body.style.overflow = 'hidden';
    }
    function close() {
      lb.classList.remove('is-open'); document.body.style.overflow = '';
      setTimeout(function () { lbImg.src = ''; }, 300);
    }
    lbClose.addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('click', function (e) {
      var img = e.target;
      if (img.tagName === 'IMG' && img.closest('#postBody') &&
          img.style.cursor === 'zoom-in') {
        e.preventDefault(); open(img.src, img.alt);
      }
    });
  }

  /* ---- 12  Floating toolbar — 4 themes ------------------- */
  /* Theme / sink definitions */
  var SINKS = [
    {
      id: 'default',
      label: '默认',
      desc: '通透 · 无背景框',
      dot: 'linear-gradient(135deg,#8250df,#0969da)',
      theme: 'default',
      c: ['#8250df', '#0969da', '#ff6b9d', '#f0b429']
    },
    {
      id: 'sakura',
      label: '樱花少女粉',
      desc: '粉嫩 · 少女心',
      dot: 'linear-gradient(135deg,#e05c8a,#f9a8c9)',
      theme: 'sakura-pink',
      c: ['#e05c8a', '#f9a8c9', '#c94070', '#ffb7c5']
    },
    {
      id: 'yourname',
      label: '你的名字·天空蓝',
      desc: '黄昏 · 星辰',
      dot: 'linear-gradient(135deg,#ff7043,#1a237e)',
      theme: 'yourname-blue',
      c: ['#ff7043', '#1a237e', '#4fc3f7', '#ff9800']
    },
    {
      id: 'aerospace',
      label: '航天暗夜蓝',
      desc: '深空 · 极光',
      dot: 'linear-gradient(135deg,#0a3d62,#1e90ff)',
      theme: 'aerospace-dark',
      c: ['#1e90ff', '#0a3d62', '#60a5fa', '#93c5fd']
    }
  ];

  function applySink(id) {
    var def = null;
    for (var i = 0; i < SINKS.length; i++) { if (SINKS[i].id === id) { def = SINKS[i]; break; } }
    if (!def) def = SINKS[0];

    localStorage.setItem('luliy-sink', def.id);

    /* Apply theme attribute to body */
    document.body.setAttribute('data-luliy-theme', def.theme);
    /* Remove skin attributes */
    document.body.removeAttribute('data-skin');

    /* Update CSS card colour variables */
    document.documentElement.style.setProperty('--card-c1', def.c[0]);
    document.documentElement.style.setProperty('--card-c2', def.c[1]);
    document.documentElement.style.setProperty('--card-c3', def.c[2]);
    document.documentElement.style.setProperty('--card-c4', def.c[3]);

    /* Highlight active button */
    document.querySelectorAll('.luliy-sink-opt').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-sink') === def.id);
    });
  }

  function initToolbar() {
    if (document.getElementById('luliy-toolbar')) return;
    var bar = document.createElement('div');
    bar.id = 'luliy-toolbar';

    /* SFX toggle */
    var btnSfx = document.createElement('button');
    btnSfx.className = 'luliy-tb-btn';
    btnSfx.type = 'button';
    var sfxOn = localStorage.getItem('luliy-sfx') !== '0';
    btnSfx.innerHTML = sfxOn ? '🔇' : '🔊';
    btnSfx.setAttribute('data-tip', sfxOn ? '关闭音效' : '开启音效');
    if (!sfxOn) btnSfx.classList.add('sfx-off');
    btnSfx.addEventListener('click', function () {
      var on = localStorage.getItem('luliy-sfx') !== '0';
      localStorage.setItem('luliy-sfx', on ? '0' : '1');
      btnSfx.innerHTML = on ? '🔊' : '🔇';
      btnSfx.setAttribute('data-tip', on ? '开启音效' : '关闭音效');
      btnSfx.classList.toggle('sfx-off', on);
    });

    /* Sink / theme button (✨) */
    var sinkWrap = document.createElement('div');
    sinkWrap.style.cssText = 'position:relative;';
    var btnSink = document.createElement('button');
    btnSink.className = 'luliy-tb-btn';
    btnSink.type = 'button';
    btnSink.setAttribute('data-tip', '风格主题');
    btnSink.innerHTML = '✨';

    var sinkMenu = document.createElement('div');
    sinkMenu.id = 'luliy-sink-menu';
    SINKS.forEach(function (s) {
      var b = document.createElement('button');
      b.className = 'luliy-sink-opt';
      b.type = 'button';
      b.setAttribute('data-sink', s.id);
      b.innerHTML =
        '<span class="luliy-sink-dot" style="background:' + s.dot + '"></span>' +
        '<span class="luliy-sink-info">' +
          '<span class="luliy-sink-name">' + s.label + '</span>' +
          '<span class="luliy-sink-desc">' + s.desc + '</span>' +
        '</span>';
      b.addEventListener('click', function () {
        applySink(s.id);
        sinkMenu.classList.remove('is-open');
        playSfx('click');
      });
      sinkMenu.appendChild(b);
    });
    btnSink.addEventListener('click', function (e) {
      e.stopPropagation();
      sinkMenu.classList.toggle('is-open');
    });
    sinkMenu.addEventListener('click', function (e) { e.stopPropagation(); });
    sinkWrap.appendChild(sinkMenu);
    sinkWrap.appendChild(btnSink);

    /* Sakura toggle */
    var btnSakura = document.createElement('button');
    btnSakura.className = 'luliy-tb-btn';
    btnSakura.type = 'button';
    var sakuraOn = localStorage.getItem('luliy-sakura') !== '0';
    btnSakura.innerHTML = '🌸';
    btnSakura.setAttribute('data-tip', sakuraOn ? '关闭花瓣' : '开启花瓣');
    if (!sakuraOn) btnSakura.classList.add('sakura-off');
    btnSakura.addEventListener('click', function () {
      var on = localStorage.getItem('luliy-sakura') !== '0';
      localStorage.setItem('luliy-sakura', on ? '0' : '1');
      btnSakura.innerHTML = '🌸';
      btnSakura.setAttribute('data-tip', on ? '开启花瓣' : '关闭花瓣');
      btnSakura.classList.toggle('sakura-off', on);
      if (on) { var c = document.getElementById('luliy-sakura-canvas'); if (c) c.remove(); }
      else initSakura();
      playSfx('click');
    });

    document.addEventListener('click', function () { sinkMenu.classList.remove('is-open'); });

    bar.appendChild(btnSfx);
    bar.appendChild(sinkWrap);
    bar.appendChild(btnSakura);
    document.body.appendChild(bar);

    applySink(localStorage.getItem('luliy-sink') || 'default');
  }

  /* ---- 13  Home card rebuild ----------------------------- */
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

      var a = document.createElement('a');
      a.href = (function () {
        var lnk = post.link || '#';
        if (lnk !== '#') {
          lnk = lnk.replace(/^\//, '');
          lnk = lnk.replace(/^post\/post\//, 'post/');
          if (!/^post\//.test(lnk) && !/^https?:\/\//.test(lnk)) lnk = 'post/' + lnk;
          lnk = '/' + lnk;
        }
        return lnk;
      })();
      a.className = 'luliy-card-inner';

      var dateEl = document.createElement('div');
      dateEl.className = 'luliy-card-date';
      dateEl.textContent = post.created ? post.created.slice(0, 10) : '';

      var titleEl = document.createElement('div');
      titleEl.className = 'luliy-card-title';
      titleEl.textContent = post.title || '无题';

      var tagsEl = document.createElement('div');
      tagsEl.className = 'luliy-card-tags';
      var labels = Array.isArray(post.labels) ? post.labels : [];
      labels.forEach(function (lbl) {
        var info = (typeof lbl === 'object') ? lbl : { name: lbl, color: '0969da' };
        if ((info.name || lbl) === 'pinned') return;
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

      var pageMatch = location.search.match(/[?&]page=([0-9]+)/);
      var pageNum = pageMatch ? parseInt(pageMatch[1]) : 1;
      var perPage = 12;
      var isIdx = location.pathname === '/' ||
        location.pathname === '/index.html' ||
        location.pathname === '';

      var displayPosts = regularPosts;
      if (isIdx) {
        var start = (pageNum - 1) * perPage;
        displayPosts = regularPosts.slice(start, start + perPage);
      }

      /* Pinned section (page 1 only) */
      if (pinnedPosts.length > 0 && isIdx && pageNum === 1) {
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

      nav.innerHTML = '';
      nav.className = 'luliy-card-grid';
      displayPosts.forEach(function (post, i) { nav.appendChild(buildCard(post, false, i)); });

    }).catch(function () { fallbackDomCards(nav); });

    function fallbackDomCards(container) {
      container.className = 'luliy-card-grid';
      container.querySelectorAll('li.SideNav-item, .SideNav-item').forEach(function (li, i) {
        li.className = 'luliy-card';
        var existingA = li.querySelector('a'); if (!existingA) return;
        var rawText = (existingA.innerText || existingA.textContent || '').trim();
        var href = existingA.href;
        li.innerHTML = '';
        var a = document.createElement('a');
        a.className = 'luliy-card-inner'; a.href = href;
        var d = document.createElement('div'); d.className = 'luliy-card-date';
        var t = document.createElement('div'); t.className = 'luliy-card-title'; t.textContent = rawText || '无题';
        var tg = document.createElement('div'); tg.className = 'luliy-card-tags';
        a.appendChild(d); a.appendChild(t); a.appendChild(tg);
        li.appendChild(a);
      });
    }
  }

  /* ---- 14  macOS code blocks (fixed: uses mac-strip wrapper) */
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
      /* Check for already-initialized strip */
      if (pre.querySelector('.mac-strip')) return;
      var code = pre.querySelector('code'); if (!code) return;

      function makeBtn(cls, tip) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'mac-btn ' + cls;
        b.setAttribute('data-tip', tip);
        b.setAttribute('aria-label', tip);
        return b;
      }

      /* RED = Copy */
      var bR = makeBtn('mac-btn-red', '复制代码');
      bR.addEventListener('click', function (e) {
        e.stopPropagation(); playSfx('click');
        var txt = code.innerText || code.textContent || '';
        function done() {
          bR.setAttribute('data-tip', '已复制 ✓');
          bR.classList.add('is-copied');
          setTimeout(function () {
            bR.setAttribute('data-tip', '复制代码');
            bR.classList.remove('is-copied');
          }, 1500);
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
      var bY = makeBtn('mac-btn-yellow', '折叠代码');
      bY.addEventListener('click', function (e) {
        e.stopPropagation(); playSfx('click');
        var folded = pre.classList.toggle('is-folded');
        bY.setAttribute('data-tip', folded ? '展开代码' : '折叠代码');
      });

      /* GREEN = Fullscreen */
      var bG = makeBtn('mac-btn-green', '全屏阅读');
      function toggleFS() {
        playSfx('sci');
        var fs = pre.classList.toggle('code-fullscreen');
        bG.setAttribute('data-tip', fs ? '退出全屏' : '全屏阅读');
      }
      bG.addEventListener('click', function (e) { e.stopPropagation(); toggleFS(); });
      pre.addEventListener('dblclick', function (e) {
        if (e.target === bR || e.target === bY || e.target === bG) return;
        toggleFS();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && pre.classList.contains('code-fullscreen')) {
          pre.classList.remove('code-fullscreen');
          bG.setAttribute('data-tip', '全屏阅读');
        }
      });

      /* Build mac-strip */
      var strip = document.createElement('div');
      strip.className = 'mac-strip';
      strip.appendChild(bR);
      strip.appendChild(bY);
      strip.appendChild(bG);

      /* Language badge */
      var langMatch = (code.className || '').match(/language-([^\s]+)/);
      if (langMatch) {
        var langEl = document.createElement('span');
        langEl.className = 'mac-lang';
        langEl.textContent = langMatch[1];
        strip.appendChild(langEl);
      }

      pre.insertBefore(strip, pre.firstChild);
    });
  }

  /* ---- 15  Sakura petals --------------------------------- */
  function initSakura() {
    if (localStorage.getItem('luliy-sakura') === '0') return;
    if (document.getElementById('luliy-sakura-canvas')) return;
    var canvas = document.createElement('canvas');
    canvas.id = 'luliy-sakura-canvas';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d'), W, H;
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize, { passive: true });
    var COLORS = ['#ffb7c5', '#ffc0cb', '#ff9eb5', '#ffd0d8', '#ffaec0', '#f9c4d2', '#fce4ec', '#f8bbd0'];
    function mkPetal(randomY) {
      var size = Math.random() * 10 + 8;
      return {
        x: Math.random() * W, y: randomY ? Math.random() * H : -size, size: size,
        opacity: Math.random() * 0.55 + 0.25,
        speedX: Math.random() * 1.2 - 0.6, speedY: Math.random() * 0.7 + 0.35,
        rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.038,
        swing: Math.random() * 1.6 + 0.4, swingAngle: Math.random() * Math.PI * 2,
        swingSpeed: 0.008 + Math.random() * 0.018,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
    }
    var petals = [];
    for (var i = 0; i < 45; i++) petals.push(mkPetal(true));
    function drawPetal(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = p.opacity;
      var s = p.size;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.5);
      ctx.bezierCurveTo(s * 0.55, -s * 0.55, s * 0.55, s * 0.55, 0, s * 0.5);
      ctx.bezierCurveTo(-s * 0.55, s * 0.55, -s * 0.55, -s * 0.55, 0, -s * 0.5);
      ctx.fillStyle = p.color; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -s * 0.4); ctx.lineTo(0, s * 0.4);
      ctx.strokeStyle = 'rgba(255,150,170,0.25)'; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.restore();
    }
    var running = true;
    function tick() {
      if (!document.getElementById('luliy-sakura-canvas')) { running = false; return; }
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < petals.length; i++) {
        var p = petals[i];
        p.swingAngle += p.swingSpeed;
        p.x += p.speedX + Math.sin(p.swingAngle) * p.swing;
        p.y += p.speedY; p.rot += p.rotSpeed;
        if (p.y > H + p.size * 2 || p.x < -p.size * 4 || p.x > W + p.size * 4)
          petals[i] = mkPetal(false);
        drawPetal(p);
      }
      if (running) requestAnimationFrame(tick);
    }
    tick();
  }

  /* ---- 16  ArticleTOC scroll-spy + back-to-top ----------- */
  function initArticleTocSpy() {
    if (!document.getElementById('postBody')) return;
    var pbody = document.getElementById('postBody');

    function trySetup() {
      var toc = document.querySelector('#TOC, .articletoc, .toc, #postBody > nav');
      if (!toc) return false;
      if (toc._luliySpy) return true;
      toc._luliySpy = true;

      /* Inject header row */
      if (!toc.querySelector('.luliy-toc-injected-hdr')) {
        var hdr = document.createElement('div');
        hdr.className = 'luliy-toc-injected-hdr';

        var lbl = document.createElement('span');
        lbl.className = 'luliy-toc-injected-label';
        lbl.textContent = '目录';

        var totop = document.createElement('button');
        totop.type = 'button';
        totop.className = 'luliy-toc-injected-totop';
        totop.textContent = '↑ 回顶';
        totop.addEventListener('click', function () {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          playSfx('click');
        });

        hdr.appendChild(lbl);
        hdr.appendChild(totop);
        toc.insertBefore(hdr, toc.firstChild);
      }

      /* Assign ids to headings */
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
              links[j].classList.add('active', 'luliy-toc-active');
              break;
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
      var iv = setInterval(function () { if (trySetup() || ++n > 20) clearInterval(iv); }, 400);
    }
  }

  /* ---- 17  Welcome screen -------------------------------- */
  function initWelcomeScreen() {
    /* Only on homepage, once per session */
    if (sessionStorage.getItem('luliy-welcomed') === '1') return;

    var ov = document.createElement('div');
    ov.id = 'luliy-welcome';
    ov.innerHTML =
      '<div class="luliy-welcome-inner">' +
        '<div class="luliy-welcome-title">欢迎来到 Luliy 的世界</div>' +
        '<div class="luliy-welcome-sub">我将无限进步</div>' +
        '<button class="luliy-welcome-btn">点击进入主页</button>' +
      '</div>';
    document.body.appendChild(ov);

    /* Fade in */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { ov.classList.add('is-visible'); });
    });

    ov.querySelector('.luliy-welcome-btn').addEventListener('click', function () {
      sessionStorage.setItem('luliy-welcomed', '1');
      ov.classList.remove('is-visible');
      ov.classList.add('is-leaving');
      setTimeout(function () {
        ov.remove();
        /* If not on homepage, navigate there */
        if (location.pathname !== '/' &&
            location.pathname !== '/index.html' &&
            location.pathname !== '') {
          location.href = '/';
        }
      }, 700);
      playSfx('theme');
    });
  }

  /* ---- 18  Post page init -------------------------------- */
  root._luliyInitPost = function () {
    if (root._luliyPostInited) return;
    root._luliyPostInited = true;
    var pbody = document.getElementById('postBody');

    /* External links → new tab */
    document.querySelectorAll('a[href^="http"]').forEach(function (a) {
      if (!a.href.includes('luliy6.github.io') && !a.href.includes('luliy.me'))
        a.target = '_blank';
    });

    if (pbody) pbody.querySelectorAll('img').forEach(function (img) { img.loading = 'lazy'; });
    if (!pbody) return;

    /* Reading time */
    if (!document.getElementById('luliy-readmeta')) {
      var wc = pbody.innerText.length;
      var rt = document.createElement('p');
      rt.id = 'luliy-readmeta';
      rt.innerHTML = '预计阅读：约 <strong>' + Math.max(1, Math.round(wc / 300)) +
        '</strong> 分钟 &nbsp;|&nbsp; 共 <strong>' + wc + '</strong> 字';
      rt.style.cssText = 'color:#888;font-size:13px;margin-bottom:1.5rem';
      pbody.insertBefore(rt, pbody.firstChild);
    }

    /* Heading copy-link */
    pbody.querySelectorAll('h1,h2,h3').forEach(function (h) {
      if (h._luliyCopy) return;
      h._luliyCopy = true; h.style.cursor = 'pointer'; h.title = '点击复制链接';
      h.addEventListener('click', function () {
        var url = location.href.split('#')[0] + '#' + h.id;
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        var tip = document.createElement('span');
        tip.textContent = ' ✓'; tip.style.cssText = 'font-size:12px;color:#1f883d;font-weight:normal';
        h.appendChild(tip); setTimeout(function () { tip.remove(); }, 2000);
      });
    });

    /* macOS code blocks — try multiple times for Prism */
    initCodeBlocks(pbody);
    setTimeout(function () { initCodeBlocks(pbody); }, 800);
    setTimeout(function () { initCodeBlocks(pbody); }, 2200);

    /* TOC scroll-spy */
    initArticleTocSpy();
    setTimeout(function () { initArticleTocSpy(); }, 600);
    setTimeout(function () { initArticleTocSpy(); }, 2200);

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
        if (lnkSlug === curSlug || lnkSlug === curNorm || p.link === curNorm ||
            curPath === '/' + p.link || curPath === p.link ||
            curPath.endsWith('/' + lnkSlug)) {
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
        var lnk = post.link || '#';
        if (lnk !== '#') {
          lnk = lnk.replace(/^\//, '');
          lnk = lnk.replace(/^post\/post\//, 'post/');
          if (!/^post\//.test(lnk) && !/^https?:\/\//.test(lnk)) lnk = 'post/' + lnk;
          lnk = '/' + lnk;
        }
        a.href = lnk; a.style.textAlign = align;
        a.innerHTML =
          '<span class="pn-label">' + esc(labelText) + '</span>' +
          '<span class="pn-title">' + esc(post.title) + '</span>';
        return a;
      }
      nav.appendChild(mkNavLink(prevPost, '⬅ 上一篇', 'left'));
      nav.appendChild(mkNavLink(nextPost, '下一篇 ➡', 'right'));
      pbody.appendChild(nav);
    }).catch(function () {});

    /* Appreciation panel */
    var sp = document.createElement('div');
    sp.style.cssText = 'margin-top:50px;text-align:center';
    var spb = document.createElement('button');
    spb.innerHTML = '✨ 和作者无限进步';
    spb.style.cssText = 'padding:12px 28px;border-radius:30px;border:none;' +
      'background:linear-gradient(90deg,#f0b429,#ff6b9d);color:#fff;' +
      'font-weight:bold;font-size:15px;cursor:pointer;' +
      'box-shadow:0 4px 15px rgba(240,180,41,0.3);transition:transform 0.3s';
    var qr = document.createElement('div');
    qr.innerHTML =
      '<p style="font-size:13px;color:#888;margin:10px 0">无限进步，进步有你！</p>' +
      '<img src="https://raw.githubusercontent.com/luliy6/img/refs/heads/main/me.jpg" ' +
      'alt="赏码" style="width:180px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1)">';
    qr.style.cssText = 'height:0;overflow:hidden;transition:height 0.4s ease,opacity 0.4s ease;opacity:0';
    spb.addEventListener('mouseover', function () { spb.style.transform = 'translateY(-2px)'; });
    spb.addEventListener('mouseout', function ()  { spb.style.transform = ''; });
    spb.addEventListener('click', function () {
      var o = !qr.style.height || qr.style.height === '0px';
      qr.style.height = o ? '260px' : '0px'; qr.style.opacity = o ? '1' : '0';
    });
    sp.appendChild(spb); sp.appendChild(qr); pbody.appendChild(sp);
  };

  /* ---- 19  Index page init ------------------------------- */
  root._luliyInitIndex = function () {
    initCards();
    initHeroBanner();

    if (location.pathname.includes('archive')) {
      var pb = document.getElementById('postBody');
      if (pb) {
        pb.innerHTML = '<p style="color:#888;font-size:14px">正在加载归档...</p>';
        fetchPosts().then(function (posts) {
          var byY = {};
          posts.forEach(function (p) {
            var y = (p.created || '未知').slice(0, 4);
            if (!byY[y]) byY[y] = [];
            byY[y].push(p);
          });
          var years = Object.keys(byY).sort(function (a, b) { return b - a; });
          var html = '<h1 style="border-bottom:2px solid rgba(240,180,41,0.4);padding-bottom:10px;margin-bottom:30px">📅 文章归档</h1>';
          years.forEach(function (y) {
            html += '<div class="tl-year">' + y + ' 年</div><ul class="tl-list">';
            byY[y].forEach(function (p) {
              var md = (p.created || '').slice(5, 10).replace('-', '/');
              html += '<li class="tl-item"><a href="' + esc(p.link) + '">' +
                esc(p.title) + '</a><span class="tl-date">' + md + '</span></li>';
            });
            html += '</ul>';
          });
          pb.innerHTML = html;
        }).catch(function () {
          pb.innerHTML = '<p style="color:#e74c3c">归档加载失败，请刷新重试。</p>';
        });
      }
    }
  };

  /* ---- 20  Main entry ------------------------------------ */
  initLocalStorage();

  /* FOUC prevention — restore theme immediately */
  (function () {
    var sinkDefs = {
      'default':   { theme: 'default',        c: ['#8250df', '#0969da', '#ff6b9d', '#f0b429'] },
      'sakura':    { theme: 'sakura-pink',     c: ['#e05c8a', '#f9a8c9', '#c94070', '#ffb7c5'] },
      'yourname':  { theme: 'yourname-blue',   c: ['#ff7043', '#1a237e', '#4fc3f7', '#ff9800'] },
      'aerospace': { theme: 'aerospace-dark',  c: ['#1e90ff', '#0a3d62', '#60a5fa', '#93c5fd'] }
    };
    var savedId = localStorage.getItem('luliy-sink') || 'default';
    var def = sinkDefs[savedId] || sinkDefs['default'];
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

  /* Sakura — start early */
  if (localStorage.getItem('luliy-sakura') !== '0') {
    if (document.body) initSakura();
    else document.addEventListener('DOMContentLoaded', initSakura);
  }

  ready(function () {
    var isIndex = location.pathname === '/' ||
      location.pathname === '/index.html' ||
      location.pathname === '';
    var isArchive = location.pathname.includes('archive');
    var isPost    = !!document.getElementById('postBody');
    var hasList   = !!document.querySelector('.SideNav,.post-item,.postList,.post-list');

    /* Mark index page on body for CSS targeting */
    if (isIndex) document.body.classList.add('is-index');

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

    /* Welcome screen — only on homepage, once per session */
    if (isIndex) initWelcomeScreen();

    if (isPost) root._luliyInitPost();
    if (isIndex || isArchive || (!isPost && hasList)) root._luliyInitIndex();
  });

})(window);