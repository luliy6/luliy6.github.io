/* enhance.js - Luliy Blog v6
   Modules:
   01  localStorage init
   02  Progress bar
   03  Dynamic title
   04  Uptime counter
   05  Dark-mode ripple
   06  Static background image (particles removed)
   07  Web Audio SFX
   08  Click sparks
   09  Compact hero cluster
   10  Tag page search toolbar
   11  Image lightbox
   12  Floating toolbar (sfx / sink / sakura)  — bg removed, theme+skin merged
   13  Favorites lock (SHA-256)
   14  Home card rebuild - rounded-rect cards with gradient border
   15  macOS code block buttons
   16  Sakura petals
   17  ArticleTOC scroll-spy + back-to-top (replaces custom floating TOC)
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
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function fetchPosts() {
    function norm(data) {
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        var colorDict = data.labelColorDict || {};
        return Object.keys(data)
          .filter(function(k){ return k !== 'labelColorDict'; })
          .map(function(k){
            var p = data[k] || {};
            if (typeof p === 'string') p = {postTitle: p};
            var rawLabels = p.labels || p.tags || [];
            var labels = rawLabels.map(function(lbl) {
              return {
                name: lbl,
                color: (colorDict[lbl] || '0969da').replace(/^#/, '')
              };
            });
            return {
              title: p.postTitle || p.title || p.name || k,
              link: p.postUrl || p.link || p.url || ('post/' + k + '.html'),
              created: p.createdDate || p.created || p.date || '',
              labels: labels,
              pinned: rawLabels.indexOf('pinned') >= 0
            };
          });
      }
      return [];
    }
    var tryUrls = [
      location.origin + '/postList.json',
      '/postList.json'
    ];
    function tryNext(urls) {
      if (!urls.length) return Promise.resolve([]);
      return fetch(urls[0], {cache: 'no-store'})
        .then(function(r){ if (!r.ok) throw 0; return r.json(); })
        .catch(function(){ return tryNext(urls.slice(1)); });
    }
    return tryNext(tryUrls).then(norm);
  }

  /* ---- 01  localStorage init ----------------------------- */
  function initLocalStorage() {
    var defs = {
      'luliy-sfx': '1',
      'luliy-particles': '1',
      'luliy-sakura': '1',
      'luliy-sink': 'default'
    };
    Object.keys(defs).forEach(function(k){ if (localStorage.getItem(k) === null) localStorage.setItem(k, defs[k]); });
  }

  /* ---- 02  Progress bar ---------------------------------- */
  function initProgressBar() {
    var bar = document.createElement('div'); bar.id = 'luliy-progress-bar'; document.body.appendChild(bar);
    window.addEventListener('scroll', function() {
      var st = window.scrollY || document.documentElement.scrollTop;
      var dh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = (dh > 0 ? Math.round(st / dh * 100) : 0) + '%';
    }, {passive: true});
  }

  /* ---- 03  Dynamic title --------------------------------- */
  function initDynamicTitle() {
    var ori = document.title, t;
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) { clearTimeout(t); document.title = '\uD83D\uDC40 \u522b\u8d70\u554a\uff0c\u6211\u8fd8\u5728\u8fdb\u6b65\uff01'; }
      else { document.title = '\u2728 \u6b22\u8fce\u56de\u6765\uff01 ' + ori; t = setTimeout(function(){ document.title = ori; }, 2000); }
    });
  }

  /* ---- 04  Uptime counter -------------------------------- */
  function initUptime() {
    var el = document.createElement('div');
    el.style.cssText = 'text-align:center;font-size:13px;color:#888;padding:10px 0;margin-top:20px';
    document.body.appendChild(el);
    var start = new Date('2026/05/30 00:00:00').getTime();
    function upd() {
      var d = Date.now() - start;
      if (d < 0) { el.innerHTML = '\uD83D\uDE80 \u535a\u5ba2\u5373\u5c06\u4e0a\u7ebf\uff0c\u656c\u8bf7\u671f\u5f85...'; return; }
      el.innerHTML = '\uD83C\uDF31 \u672c\u7ad9\u5df2\u966a\u4f34\u4f60\u65e0\u9650\u8fdb\u6b65\uff1a' +
        Math.floor(d / 86400000) + '\u5929 ' +
        Math.floor((d % 86400000) / 3600000) + '\u5c0f\u65f6 ' +
        Math.floor((d % 3600000) / 60000) + '\u5206 ' +
        '<span style="color:#ff4444;font-weight:bold;font-family:monospace">' + Math.floor((d % 60000) / 1000) + '</span>\u79d2';
    }
    upd(); setInterval(upd, 1000);
  }

  /* ---- 05  Dark-mode ripple ------------------------------ */
  function initThemeRipple() {
    function ripple() {
      playSfx('theme');
      var old = document.getElementById('luliy-theme-ripple'); if (old) old.remove();
      var cx = window.innerWidth / 2, cy = window.innerHeight / 2,
          maxR = Math.sqrt(cx * cx + cy * cy) * 2.2;
      var isDark = document.documentElement.getAttribute('data-color-mode') === 'dark';
      var el = document.createElement('div'); el.id = 'luliy-theme-ripple';
      el.style.cssText = 'position:fixed;top:' + cy + 'px;left:' + cx + 'px;width:0;height:0;border-radius:50%;background:' +
        (isDark ? 'rgba(10,20,40,0.96)' : 'rgba(255,255,255,0.96)') +
        ';pointer-events:none;z-index:99998;transform:translate(-50%,-50%) scale(0);transition:transform 0.65s cubic-bezier(.4,0,.2,1),opacity 0.65s ease;';
      document.body.appendChild(el); el.getBoundingClientRect();
      el.style.width = el.style.height = (maxR * 2) + 'px';
      el.style.transform = 'translate(-50%,-50%) scale(1)'; el.style.opacity = '0';
      setTimeout(function(){ el.remove(); }, 700);
    }
    document.addEventListener('click', function(e) {
      var b = e.target.closest('button');
      if (b && (b.innerHTML.includes('Moon') || b.innerHTML.includes('Sun') ||
          (b.title && /dark|light|theme|\u4e3b\u9898/i.test(b.title)))) ripple();
    });
    setTimeout(function() {
      document.querySelectorAll('.title-right .circle').forEach(function(el) {
        if (el._luliyRipple) return; el._luliyRipple = true; el.addEventListener('click', ripple);
      });
    }, 800);
  }

  /* ---- 06  Static background image (particles removed) ------- */
  function initParticles() { /* removed — static bg set in CSS */ }

  /* ---- 07  Web Audio SFX --------------------------------- */
  var _actx = null;
  function getACtx(){ if (!_actx) try { _actx = new (root.AudioContext || root.webkitAudioContext)(); } catch(e){} return _actx; }
  function playSfx(type) {
    if (localStorage.getItem('luliy-sfx') === '0') return;
    var ctx = getACtx(); if (!ctx) return;
    try {
      if (type === 'click') {
        var o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination);
        o.type = 'square'; o.frequency.setValueAtTime(900, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
        g.gain.setValueAtTime(0.04, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
        o.start(); o.stop(ctx.currentTime + 0.06);
      } else if (type === 'sci') {
        var o2 = ctx.createOscillator(), g2 = ctx.createGain(); o2.connect(g2); g2.connect(ctx.destination);
        o2.type = 'sine'; o2.frequency.setValueAtTime(440, ctx.currentTime);
        o2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        o2.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.22);
        g2.gain.setValueAtTime(0.06, ctx.currentTime); g2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        o2.start(); o2.stop(ctx.currentTime + 0.25);
      } else if (type === 'theme') {
        [0, 0.08, 0.16].forEach(function(delay, idx) {
          var ot = ctx.createOscillator(), gt = ctx.createGain(); ot.connect(gt); gt.connect(ctx.destination);
          ot.type = 'sine'; ot.frequency.setValueAtTime([523, 659, 784][idx], ctx.currentTime + delay);
          gt.gain.setValueAtTime(0.05, ctx.currentTime + delay);
          gt.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.18);
          ot.start(ctx.currentTime + delay); ot.stop(ctx.currentTime + delay + 0.18);
        });
      }
    } catch(e){}
  }
  root._luliySfx = playSfx;
  function initSfxEvents() {
    document.addEventListener('click', function(e) {
      var t = e.target;
      if (t.tagName === 'BUTTON' || t.tagName === 'A' || t.classList.contains('Label') ||
          t.closest('button') || t.closest('a')) playSfx('click');
    }, true);
  }

  /* ---- 08  Click sparks ---------------------------------- */
  function initClickSparks() {
    var colors = ['#ff6b9d','#ffcd3c','#6bceff','#a78bfa','#34d399'];
    document.addEventListener('click', function(e) {
      for (var i = 0; i < 12; i++) (function() {
        var s = document.createElement('div');
        var angle = Math.random() * 360, dist = Math.random() * 50 + 16;
        s.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;width:7px;height:7px;border-radius:50%;pointer-events:none;z-index:99999;background:' +
          colors[Math.floor(Math.random() * colors.length)] + ';transform:translate(-50%,-50%);transition:transform 0.6s ease,opacity 0.6s ease;';
        document.body.appendChild(s);
        requestAnimationFrame(function() {
          s.style.transform = 'translate(calc(-50% + ' + (Math.cos(angle * Math.PI/180) * dist) + 'px),calc(-50% + ' + (Math.sin(angle * Math.PI/180) * dist) + 'px))';
          s.style.opacity = '0';
        });
        setTimeout(function(){ s.remove(); }, 700);
      })();
    });
  }

  /* ---- 09  Compact hero cluster -------------------------- */
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
      nameEl.textContent = document.title.split(' ')[0] || 'Luliy';
      info.appendChild(nameEl);
      var clk = document.createElement('div');
      clk.id = 'luliy-avatar-clock';
      info.appendChild(clk);
      cluster.appendChild(info);
      header.insertBefore(cluster, header.firstChild);
      if (av.parentElement && av.parentElement !== header) av.parentElement.style.display = 'none';
      else av.style.display = 'none';
      header.querySelectorAll('.blogTitle, .postTitle').forEach(function(el){ el.style.display = 'none'; });
      function updClock() {
        var n = new Date();
        clk.textContent = String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0') + ':' + String(n.getSeconds()).padStart(2,'0');
      }
      updClock(); setInterval(updClock, 1000);
      return true;
    }
    if (!tryBuild()) {
      var tries = 0, iv = setInterval(function(){ if (tryBuild() || ++tries > 30) clearInterval(iv); }, 200);
    }
  }

  /* ---- Hero banner (folds upward on scroll) ------------ */
  function initHeroBanner() {
    if (document.getElementById('luliy-hero-banner')) return;
    var content = document.getElementById('content') || document.querySelector('.main');
    if (!content) return;
    var banner = document.createElement('div');
    banner.id = 'luliy-hero-banner';
    banner.textContent = 'Remember, this is your world.';
    content.parentNode.insertBefore(banner, content);

    /* Scroll-fold: slides up and fades as page scrolls down */
    var bannerH = 0;
    function getBannerH() { bannerH = banner.offsetHeight || 56; }
    getBannerH();
    window.addEventListener('resize', getBannerH, {passive: true});
    window.addEventListener('scroll', function() {
      var st = window.scrollY || window.pageYOffset || 0;
      var progress = Math.min(1, st / (bannerH + 32));
      banner.style.transform = 'translateY(-' + (progress * (bannerH + 32)) + 'px)';
      banner.style.opacity = String(1 - progress);
    }, {passive: true});
  }

  /* ---- 10  Tag page search toolbar ----------------------- */
  function initTagEnhance() {
    if (!/tag\.html?$|\/tag\/?$/i.test(location.pathname)) return;
    var tries = 0;
    function wire() {
      var tl = document.getElementById('taglabel');
      if (!tl) { if (tries++ < 30) setTimeout(wire, 200); return; }
      if (document.getElementById('tag-enhance-toolbar')) return;
      var tb = document.createElement('div'); tb.id = 'tag-enhance-toolbar';
      tb.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap';
      tb.innerHTML = '<input style="padding:6px 12px;border:1px solid rgba(130,80,223,0.3);border-radius:20px;outline:none;font-size:13px;width:200px;" type="search" placeholder="\u7b5b\u9009\u6807\u7b7e..." autocomplete="off"><span style="font-size:12px;color:#888"></span>';
      tl.parentNode.insertBefore(tb, tl);
      var inp = tb.querySelector('input'), cnt = tb.querySelector('span');
      function apply() {
        var q = inp.value.trim().toLowerCase(), vis = 0;
        var all = Array.from(tl.querySelectorAll('.Label'));
        all.forEach(function(l){ var ok = !q || l.textContent.trim().toLowerCase().includes(q); l.style.display = ok ? 'inline-flex' : 'none'; if (ok) vis++; });
        cnt.textContent = vis + ' / ' + all.length + ' \u4e2a\u6807\u7b7e';
      }
      inp.addEventListener('input', apply);
      new MutationObserver(apply).observe(tl, {childList: true, subtree: true});
      setTimeout(apply, 100);
    }
    wire();
  }

  /* ---- 11  Image lightbox -------------------------------- */
  function initLightbox() {
    if (document.getElementById('luliy-lightbox')) return;
    var lb = document.createElement('div'); lb.id = 'luliy-lightbox';
    lb.innerHTML = '<button id="luliy-lightbox-close" aria-label="\u5173\u95ed">\u2715</button><img alt="">';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbClose = lb.querySelector('#luliy-lightbox-close');
    function open(src, alt){ lbImg.src = src; lbImg.alt = alt || ''; lb.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
    function close(){ lb.classList.remove('is-open'); document.body.style.overflow = ''; setTimeout(function(){ lbImg.src = ''; }, 300); }
    lb.addEventListener('click', function(e){ if (e.target === lb || e.target === lbClose) close(); });
    lbClose.addEventListener('click', close);
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && lb.classList.contains('is-open')) close(); });
    document.addEventListener('click', function(e){ var img = e.target.closest('#postBody img'); if (!img) return; e.preventDefault(); open(img.src, img.alt); });
    root._luliyLightboxOpen = open;
  }

  /* ---- 12  Floating toolbar ------------------------------ */
  /* ---- Unified SINK — one button replaces article-theme + reading-skin + bg */
  var SINKS = [
    {
      id: 'default', label: '\u9ed8\u8ba4', dot: '#8250df',
      skin: 'default', theme: 'default',
      cardPalette: ['#8250df','#0969da','#ff6b9d','#f0b429'],
      desc: '\u7ecf\u5178\u7d2b\u8c03\uff0c\u7b80\u6d01\u73b0\u4ee3'
    },
    {
      id: 'sakura', label: '\u6a31\u82b1\u5c11\u5973', dot: '#f9a8c9',
      skin: 'sakura', theme: 'sakura',
      cardPalette: ['#e05c8a','#f9a8c9','#c94070','#ffb7c5'],
      desc: '\u7c89\u5ae9\u6a31\u82b1\uff0c\u5c11\u5973\u5fc3\u601d'
    },
    {
      id: 'ocean', label: '\u6df1\u6d77\u84dd', dot: '#60a5fa',
      skin: 'ocean', theme: 'classic-blue',
      cardPalette: ['#60a5fa','#0ea5e9','#38bdf8','#0969da'],
      desc: '\u6df1\u6d77\u84dd\u8c03\uff0c\u79d1\u6280\u6b23\u7136'
    },
    {
      id: 'mono', label: '\u6c34\u58a8\u9ed1\u767d', dot: '#999',
      skin: 'ink', theme: 'mono',
      cardPalette: ['#555','#888','#aaa','#333'],
      desc: '\u6c34\u58a8\u6de1\u96c5\uff0c\u5f22\u6587\u8bba\u9053'
    },
    {
      id: 'sunset', label: '\u65e5\u843d\u9633\u5149', dot: '#fb923c',
      skin: 'default', theme: 'sunset',
      cardPalette: ['#fb923c','#f0b429','#ef4444','#fbbf24'],
      desc: '\u6696\u8272\u65e5\u843d\uff0c\u6e29\u66a8\u4e1c\u65b9'
    }
  ];

  function applySink(id) {
    var s = null;
    SINKS.forEach(function(x) { if (x.id === id) s = x; });
    if (!s) s = SINKS[0];
    localStorage.setItem('luliy-sink', s.id);
    /* skin */
    if (s.skin === 'default') document.body.removeAttribute('data-skin');
    else document.body.setAttribute('data-skin', s.skin);
    /* theme */
    document.body.setAttribute('data-luliy-theme', s.theme || 'default');
    /* card palette CSS vars */
    document.documentElement.style.setProperty('--card-c1', s.cardPalette[0]);
    document.documentElement.style.setProperty('--card-c2', s.cardPalette[1]);
    document.documentElement.style.setProperty('--card-c3', s.cardPalette[2]);
    document.documentElement.style.setProperty('--card-c4', s.cardPalette[3]);
    /* update menu active state */
    document.querySelectorAll('.luliy-sink-opt').forEach(function(b) {
      b.classList.toggle('is-active', b.getAttribute('data-sink') === s.id);
    });
  }
  /* Legacy shims */
  function applyTheme() {}
  function applySkin() {}

  function initToolbar() {
    if (document.getElementById('luliy-toolbar')) return;
    var bar = document.createElement('div'); bar.id = 'luliy-toolbar';

    /* SFX */
    var btnSfx = document.createElement('button'); btnSfx.className = 'luliy-tb-btn'; btnSfx.type = 'button';
    var sfxOn = localStorage.getItem('luliy-sfx') !== '0';
    btnSfx.innerHTML = sfxOn ? '\uD83D\uDD0A' : '\uD83D\uDD07';
    btnSfx.setAttribute('data-tip', sfxOn ? '\u5173\u95ed\u97f3\u6548' : '\u5f00\u542f\u97f3\u6548');
    if (!sfxOn) btnSfx.classList.add('sfx-off');
    btnSfx.addEventListener('click', function() {
      var on = localStorage.getItem('luliy-sfx') !== '0';
      localStorage.setItem('luliy-sfx', on ? '0' : '1');
      btnSfx.innerHTML = on ? '\uD83D\uDD07' : '\uD83D\uDD0A';
      btnSfx.setAttribute('data-tip', on ? '\u5f00\u542f\u97f3\u6548' : '\u5173\u95ed\u97f3\u6548');
      btnSfx.classList.toggle('sfx-off', on);
    });

    /* Unified Sink button (✨) */
    var sinkWrap = document.createElement('div'); sinkWrap.style.cssText = 'position:relative;';
    var btnSink = document.createElement('button'); btnSink.className = 'luliy-tb-btn'; btnSink.type = 'button';
    btnSink.setAttribute('data-tip', '\u98ce\u683c\u4e3b\u9898'); btnSink.innerHTML = '\u2728';
    var sinkMenu = document.createElement('div'); sinkMenu.id = 'luliy-sink-menu';
    SINKS.forEach(function(s) {
      var b = document.createElement('button'); b.className = 'luliy-sink-opt'; b.type = 'button';
      b.setAttribute('data-sink', s.id);
      b.innerHTML =
        '<span class="luliy-sink-dot" style="background:' + s.dot + '"></span>' +
        '<span class="luliy-sink-info">' +
          '<span class="luliy-sink-name">' + s.label + '</span>' +
          '<span class="luliy-sink-desc">' + s.desc + '</span>' +
        '</span>';
      b.addEventListener('click', function() { applySink(s.id); sinkMenu.classList.remove('is-open'); playSfx('click'); });
      sinkMenu.appendChild(b);
    });
    btnSink.addEventListener('click', function(e) { e.stopPropagation(); sinkMenu.classList.toggle('is-open'); });
    sinkMenu.addEventListener('click', function(e) { e.stopPropagation(); });
    sinkWrap.appendChild(sinkMenu); sinkWrap.appendChild(btnSink);

    /* Sakura toggle */
    var btnSakura = document.createElement('button'); btnSakura.className = 'luliy-tb-btn'; btnSakura.type = 'button';
    var sakuraOn = localStorage.getItem('luliy-sakura') !== '0';
    btnSakura.innerHTML = '\uD83C\uDF38';
    btnSakura.setAttribute('data-tip', sakuraOn ? '\u5173\u95ed\u82b1\u74e3' : '\u5f00\u542f\u82b1\u74e3');
    if (!sakuraOn) btnSakura.classList.add('sakura-off');
    btnSakura.addEventListener('click', function() {
      var on = localStorage.getItem('luliy-sakura') !== '0';
      localStorage.setItem('luliy-sakura', on ? '0' : '1');
      btnSakura.innerHTML = '\uD83C\uDF38';
      btnSakura.setAttribute('data-tip', on ? '\u5f00\u542f\u82b1\u74e3' : '\u5173\u95ed\u82b1\u74e3');
      btnSakura.classList.toggle('sakura-off', on);
      if (on) { var c = document.getElementById('luliy-sakura-canvas'); if (c) c.remove(); }
      else initSakura();
      playSfx('click');
    });

    document.addEventListener('click', function() { sinkMenu.classList.remove('is-open'); });

    bar.appendChild(btnSfx);
    bar.appendChild(sinkWrap);
    bar.appendChild(btnSakura);
    document.body.appendChild(bar);

    applySink(localStorage.getItem('luliy-sink') || 'default');
  }

  /* ---- 13  Favorites lock (SHA-256) ---------------------- */
  function sha256(str) {
    function rotR(x,n){ return (x>>>n)|(x<<(32-n)); }
    var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var bytes=[];
    for(var i=0;i<str.length;i++){var c=str.charCodeAt(i);if(c<128){bytes.push(c);}else if(c<2048){bytes.push(0xC0|(c>>6));bytes.push(0x80|(c&63));}else{bytes.push(0xE0|(c>>12));bytes.push(0x80|((c>>6)&63));bytes.push(0x80|(c&63));}}
    var bitLen=bytes.length*8;bytes.push(0x80);
    while((bytes.length%64)!==56)bytes.push(0);
    bytes.push(0,0,0,0);
    for(var j=24;j>=0;j-=8)bytes.push((bitLen>>j)&0xff);
    for(var bi=0;bi<bytes.length;bi+=64){
      var W=[];
      for(var t=0;t<16;t++)W[t]=(bytes[bi+t*4]<<24)|(bytes[bi+t*4+1]<<16)|(bytes[bi+t*4+2]<<8)|bytes[bi+t*4+3];
      for(var t2=16;t2<64;t2++){var s0=(rotR(W[t2-15],7))^(rotR(W[t2-15],18))^(W[t2-15]>>>3);var s1=(rotR(W[t2-2],17))^(rotR(W[t2-2],19))^(W[t2-2]>>>10);W[t2]=(W[t2-16]+s0+W[t2-7]+s1)|0;}
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],gg=H[6],h=H[7];
      for(var t3=0;t3<64;t3++){var S1=(rotR(e,6))^(rotR(e,11))^(rotR(e,25));var ch=(e&f)^(~e&gg);var tmp1=(h+S1+ch+K[t3]+W[t3])|0;var S0=(rotR(a,2))^(rotR(a,13))^(rotR(a,22));var maj=(a&b)^(a&c)^(b&c);var tmp2=(S0+maj)|0;h=gg;gg=f;f=e;e=(d+tmp1)|0;d=c;c=b;b=a;a=(tmp1+tmp2)|0;}
      H[0]=(H[0]+a)|0;H[1]=(H[1]+b)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+gg)|0;H[7]=(H[7]+h)|0;
    }
    var hex='';for(var hi=0;hi<8;hi++)hex+=('00000000'+((H[hi]>>>0).toString(16))).slice(-8);return hex;
  }
  var LOCK_HASH = sha256('121383');
  var LOCK_KEY  = 'luliy-unlocked-favorites';

  function isFavoritesPost() {
    /* Check body/post attributes */
    var attr = (document.body.getAttribute('data-labels') || '') +
      ((document.getElementById('postBody') && document.getElementById('postBody').getAttribute('data-labels')) || '');
    if (/favorites?/i.test(attr)) return true;
    /* Check labels on the page */
    var found = false;
    document.querySelectorAll('.Label, a.Label').forEach(function(el){ if (/favorites?/i.test(el.textContent)) found = true; });
    /* Check URL and title */
    if (!found) found = /favorites?/i.test(document.title + location.href);
    /* Check nav links — any link whose text contains "Favourite/Favorites" */
    if (!found) {
      document.querySelectorAll('#header a, .title-right a, nav a').forEach(function(a) {
        if (/favou?ri/i.test(a.textContent)) found = true;
      });
    }
    return found;
  }
  function initLock() {
    /* Global lock: runs on every page (post and index) */
    if (sessionStorage.getItem(LOCK_KEY) === '1') return;
    function check(n) {
      if (isFavoritesPost()) { showLock(); return; }
      if (n > 0) setTimeout(function(){ check(n-1); }, 300);
    }
    check(8);
  }
  function showLock() {
    if (document.getElementById('luliy-lock-overlay')) return;
    var pbody = document.getElementById('postBody');
    var ov = document.createElement('div'); ov.id = 'luliy-lock-overlay';
    ov.innerHTML = '<div class="luliy-lock-box"><span class="luliy-lock-icon">\uD83D\uDD10</span><div class="luliy-lock-title">\u52a0\u5bc6\u5185\u5bb9</div><div class="luliy-lock-hint">\u672c\u6587\u4e3a\u79c1\u5bc6\u6536\u85cf\uff0c\u8bf7\u8f93\u5165\u8bbf\u95ee\u5bc6\u7801</div><input class="luliy-lock-input" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022" maxlength="20" autocomplete="off"><button class="luliy-lock-btn">\u89e3 \u9501</button><div class="luliy-lock-err"></div></div>';
    document.body.appendChild(ov);
    if (pbody) { pbody.style.filter = 'blur(18px)'; pbody.style.userSelect = 'none'; pbody.style.pointerEvents = 'none'; }
    var inp = ov.querySelector('.luliy-lock-input'), btn2 = ov.querySelector('.luliy-lock-btn'), err = ov.querySelector('.luliy-lock-err');
    function tryUnlock() {
      if (!inp.value) { err.textContent = '\u8bf7\u8f93\u5165\u5bc6\u7801'; return; }
      if (sha256(inp.value) === LOCK_HASH) {
        sessionStorage.setItem(LOCK_KEY, '1');
        pbody.style.filter = ''; pbody.style.userSelect = ''; pbody.style.pointerEvents = '';
        ov.style.opacity = '0'; ov.style.transition = 'opacity 0.4s ease';
        setTimeout(function(){ ov.remove(); }, 400);
      } else {
        err.textContent = '\u5bc6\u7801\u9519\u8bef\uff0c\u8bf7\u91cd\u8bd5'; inp.classList.add('is-wrong');
        setTimeout(function(){ inp.classList.remove('is-wrong'); }, 600);
        inp.value = ''; inp.focus();
      }
    }
    btn2.addEventListener('click', tryUnlock);
    inp.addEventListener('keydown', function(e){ if (e.key === 'Enter') tryUnlock(); });
    setTimeout(function(){ inp.focus(); }, 120);
  }

  /* ---- 14  Home card rebuild — Hex grid layout ------------ */
  function initCards() {
    /* Do not run on the tag page — it uses .SideNav for label listing */
    if (/tag\.html?$|\/tag\/?$/i.test(location.pathname)) return;
    var nav = document.querySelector('nav.SideNav, ul.SideNav, .SideNav');
    if (!nav || nav.getAttribute('data-luliy-cards')) return;
    nav.setAttribute('data-luliy-cards', '1');

    /* Build a single rounded-rect card element */
    function buildCard(post, isPinned, colourIdx) {
      var li = document.createElement('li');
      li.className = 'luliy-card';
      li.setAttribute('data-ci', String((colourIdx || 0) % 4));
      if (isPinned) li.setAttribute('data-pinned', '1');

      var a = document.createElement('a');
      a.href = (function() {
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

      /* Date — top center, small gray */
      var dateEl = document.createElement('div');
      dateEl.className = 'luliy-card-date';
      dateEl.textContent = post.created ? post.created.slice(0, 10) : '';

      /* Title — center bold, core visual */
      var titleEl = document.createElement('div');
      titleEl.className = 'luliy-card-title';
      titleEl.textContent = post.title || '\u65e0\u9898';

      /* Tags — bottom rounded-pill row */
      var tagsEl = document.createElement('div');
      tagsEl.className = 'luliy-card-tags';
      var labels = Array.isArray(post.labels) ? post.labels : [];
      labels.forEach(function(lbl) {
        var info = (typeof lbl === 'object') ? lbl : {name: lbl, color: '0969da'};
        if ((info.name || lbl) === 'pinned') return;
        var pill = document.createElement('a');
        pill.className = 'luliy-card-pill';
        pill.href = '/tag.html#' + encodeURIComponent(info.name || lbl);
        pill.textContent = info.name || lbl;
        pill.style.background = '#' + (info.color || '0969da').replace('#','');
        tagsEl.appendChild(pill);
      });

      a.appendChild(dateEl);
      a.appendChild(titleEl);
      a.appendChild(tagsEl);
      li.appendChild(a);
      return li;
    }

    fetchPosts().then(function(posts) {
      if (!posts || !posts.length) { fallbackDomCards(nav); return; }

      /* Separate pinned and regular */
      var pinnedPosts  = posts.filter(function(p){ return p.pinned; });
      var regularPosts = posts.filter(function(p){ return !p.pinned; });

      /* Pagination (only regular posts paginate) */
      var pageMatch = location.search.match(/[?&]page=([0-9]+)/);
      var pageNum = pageMatch ? parseInt(pageMatch[1]) : 1;
      var perPage = 12;
      var isIndex = location.pathname === '/' || location.pathname === '/index.html' || location.pathname === '';

      var displayPosts = regularPosts;
      if (isIndex) {
        var start = (pageNum - 1) * perPage;
        displayPosts = regularPosts.slice(start, start + perPage);
      }

      /* Insert pinned section above the card grid (only page 1) */
      if (pinnedPosts.length > 0 && isIndex && pageNum === 1) {
        var existing = document.getElementById('luliy-pinned-section');
        if (existing) existing.remove();

        var ps = document.createElement('div');
        ps.id = 'luliy-pinned-section';

        var pg = document.createElement('ul');
        pg.className = 'luliy-card-grid luliy-pinned-grid';
        pinnedPosts.forEach(function(post, i){ pg.appendChild(buildCard(post, true, i)); });
        ps.appendChild(pg);

        /* Insert before the nav (card grid) */
        nav.parentNode.insertBefore(ps, nav);
      }

      /* Rebuild main card grid — hex layout */
      nav.innerHTML = '';
      nav.className = 'luliy-card-grid';
      displayPosts.forEach(function(post, i){ nav.appendChild(buildCard(post, false, i)); });

    }).catch(function(){ fallbackDomCards(nav); });

    /* Fallback: use existing DOM items as simple hex wrappers */
    function fallbackDomCards(container) {
      container.className = 'luliy-card-grid';
      container.querySelectorAll('li.SideNav-item, .SideNav-item').forEach(function(li, i) {
        li.className = 'luliy-hex-wrap';
        var existingA = li.querySelector('a');
        if (!existingA) return;
        var rawText = (existingA.innerText || existingA.textContent || '').trim();
        var href = existingA.href;
        li.innerHTML = '';
        var hex = document.createElement('a'); hex.className = 'luliy-hex'; hex.href = href;
        hex.setAttribute('data-ci', String(i % 4));
        var d = document.createElement('span'); d.className = 'luliy-hex-date';
        var t = document.createElement('span'); t.className = 'luliy-hex-title'; t.textContent = rawText || '\u65e0\u9898';
        var tg = document.createElement('div'); tg.className = 'luliy-hex-tags';
        hex.appendChild(d); hex.appendChild(t); hex.appendChild(tg);
        li.appendChild(hex);
      });
    }
  }

  /* ---- 15  macOS code block buttons ---------------------- */
  function initCodeBlocks(pbody) {
    applyCodeBlocks(pbody);
    if (pbody._luliyCodeObs) return;
    pbody._luliyCodeObs = true;
    try {
      var obs = new MutationObserver(function(){ applyCodeBlocks(pbody); });
      obs.observe(pbody, {childList: true, subtree: true});
    } catch(e) {}
  }
  function applyCodeBlocks(pbody) {
    pbody.querySelectorAll('pre').forEach(function(pre) {
      if (pre.querySelector('.mac-btn')) return;
      var code = pre.querySelector('code'); if (!code) return;
      function makeBtn(cls, tip) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'mac-btn ' + cls;
        b.setAttribute('data-tip', tip); b.setAttribute('aria-label', tip); return b;
      }
      /* RED = Copy */
      var bR = makeBtn('mac-btn-red', '\u590d\u5236\u4ee3\u7801');
      bR.addEventListener('click', function(e) {
        e.stopPropagation(); playSfx('click');
        var txt = code.innerText || code.textContent || '';
        function done() { bR.setAttribute('data-tip', '\u5df2\u590d\u5236 \u2713'); bR.classList.add('is-copied'); setTimeout(function(){ bR.setAttribute('data-tip', '\u590d\u5236\u4ee3\u7801'); bR.classList.remove('is-copied'); }, 1500); }
        if (navigator.clipboard && location.protocol === 'https:') navigator.clipboard.writeText(txt).then(done).catch(done);
        else { var ta = document.createElement('textarea'); ta.value = txt; ta.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch(_){} ta.remove(); done(); }
      });
      /* YELLOW = Collapse */
      var bY = makeBtn('mac-btn-yellow', '\u6298\u53e0\u4ee3\u7801');
      bY.addEventListener('click', function(e) {
        e.stopPropagation(); playSfx('click');
        var folded = pre.classList.toggle('is-folded');
        bY.classList.toggle('is-folded', folded);
        bY.setAttribute('data-tip', folded ? '\u5c55\u5f00\u4ee3\u7801' : '\u6298\u53e0\u4ee3\u7801');
      });
      /* GREEN = Fullscreen */
      var bG = makeBtn('mac-btn-green', '\u5168\u5c4f\u9605\u8bfb');
      function toggleFS() {
        playSfx('sci');
        var fs = pre.classList.toggle('code-fullscreen');
        bG.setAttribute('data-tip', fs ? '\u9000\u51fa\u5168\u5c4f' : '\u5168\u5c4f\u9605\u8bfb');
      }
      bG.addEventListener('click', function(e){ e.stopPropagation(); toggleFS(); });
      pre.addEventListener('dblclick', function(e){ if (e.target === bR || e.target === bY || e.target === bG) return; toggleFS(); });
      document.addEventListener('keydown', function(e){
        if (e.key === 'Escape' && pre.classList.contains('code-fullscreen')) { pre.classList.remove('code-fullscreen'); bG.setAttribute('data-tip', '\u5168\u5c4f\u9605\u8bfb'); }
      });
      pre.appendChild(bR); pre.appendChild(bY); pre.appendChild(bG);
    });
  }

  /* ---- 16  Sakura petals --------------------------------- */
  function initSakura() {
    if (localStorage.getItem('luliy-sakura') === '0') return;
    if (document.getElementById('luliy-sakura-canvas')) return;
    var canvas = document.createElement('canvas'); canvas.id = 'luliy-sakura-canvas';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d'), W, H;
    function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize, {passive: true});
    var COLORS = ['#ffb7c5','#ffc0cb','#ff9eb5','#ffd0d8','#ffaec0','#f9c4d2','#fce4ec','#f8bbd0'];
    function mkPetal(randomY) {
      var size = Math.random() * 10 + 8;
      return { x:Math.random()*W, y:randomY?Math.random()*H:-size, size:size,
        opacity:Math.random()*0.55+0.25, speedX:Math.random()*1.2-0.6, speedY:Math.random()*0.7+0.35,
        rot:Math.random()*Math.PI*2, rotSpeed:(Math.random()-0.5)*0.038,
        swing:Math.random()*1.6+0.4, swingAngle:Math.random()*Math.PI*2, swingSpeed:0.008+Math.random()*0.018,
        color:COLORS[Math.floor(Math.random()*COLORS.length)] };
    }
    var petals = []; for (var i = 0; i < 45; i++) petals.push(mkPetal(true));
    function drawPetal(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = p.opacity;
      var s = p.size;
      ctx.beginPath(); ctx.moveTo(0,-s*0.5);
      ctx.bezierCurveTo(s*0.55,-s*0.55, s*0.55,s*0.55, 0,s*0.5);
      ctx.bezierCurveTo(-s*0.55,s*0.55, -s*0.55,-s*0.55, 0,-s*0.5);
      ctx.fillStyle = p.color; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0,-s*0.4); ctx.lineTo(0,s*0.4);
      ctx.strokeStyle = 'rgba(255,150,170,0.25)'; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.restore();
    }
    var running = true;
    function tick() {
      if (!document.getElementById('luliy-sakura-canvas')) { running = false; return; }
      ctx.clearRect(0,0,W,H);
      for (var i = 0; i < petals.length; i++) {
        var p = petals[i];
        p.swingAngle += p.swingSpeed; p.x += p.speedX + Math.sin(p.swingAngle)*p.swing; p.y += p.speedY; p.rot += p.rotSpeed;
        if (p.y > H+p.size*2 || p.x < -p.size*4 || p.x > W+p.size*4) petals[i] = mkPetal(false);
        drawPetal(p);
      }
      if (running) requestAnimationFrame(tick);
    }
    tick();
  }

  /* ---- 17  ArticleTOC scroll-spy + back-to-top ----------- */
  /* Replaces the old custom floating TOC panel.
     Finds the ArticleTOC generated by articletoc.js plugin,
     injects a header row (label + back-to-top) and adds scroll-spy. */
  function initArticleTocSpy() {
    if (!document.getElementById('postBody')) return;
    var pbody = document.getElementById('postBody');

    function trySetup() {
      /* ArticleTOC can be #TOC, .articletoc, .toc, or any nav inside postBody */
      var toc = document.querySelector('#TOC, .articletoc, .toc, #postBody > nav');
      if (!toc) return false;
      if (toc._luliySpy) return true;
      toc._luliySpy = true;

      /* Inject header row if not already there */
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
        totop.addEventListener('click', function(){
          window.scrollTo({top: 0, behavior: 'smooth'});
          playSfx('click');
        });

        hdr.appendChild(lbl);
        hdr.appendChild(totop);
        toc.insertBefore(hdr, toc.firstChild);
      }

      /* Assign ids to headings that lack them */
      var allH = Array.from(pbody.querySelectorAll('h1,h2,h3,h4'));
      allH.forEach(function(h, i) {
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

      var headings = allH.filter(function(h){ return h.id; });
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

        links.forEach(function(a){ a.classList.remove('active', 'luliy-toc-active'); });
        if (activeH) {
          var matchLink = null;
          for (var j = 0; j < links.length; j++) {
            if (links[j].getAttribute('href') === '#' + activeH.id) { matchLink = links[j]; break; }
          }
          if (matchLink) matchLink.classList.add('active', 'luliy-toc-active');
        }
      }
      window.addEventListener('scroll', onScroll, {passive: true});
      onScroll();
      return true;
    }

    /* articletoc.js may run after us - retry a few times */
    if (!trySetup()) {
      var n = 0, iv = setInterval(function(){
        if (trySetup() || ++n > 20) clearInterval(iv);
      }, 400);
    }
  }

  /* ---- 18  Post page init -------------------------------- */
  root._luliyInitPost = function() {
    if (root._luliyPostInited) return; root._luliyPostInited = true;
    var pbody = document.getElementById('postBody');

    /* External links open in new tab */
    document.querySelectorAll('a[href^="http"]').forEach(function(a){
      if (!a.href.includes('luliy6.github.io') && !a.href.includes('luliy.indevs.in')) a.target = '_blank';
    });

    if (pbody) pbody.querySelectorAll('img').forEach(function(img){ img.loading = 'lazy'; });
    if (!pbody) return;

    /* Reading time */
    if (!document.getElementById('luliy-readmeta')) {
      var wc = pbody.innerText.length;
      var rt = document.createElement('p'); rt.id = 'luliy-readmeta';
      rt.innerHTML = '\u9884\u8ba1\u9605\u8bfb\uff1a\u7ea6 <strong>' + Math.max(1, Math.round(wc/300)) + '</strong> \u5206\u949f &nbsp;|&nbsp; \u5171 <strong>' + wc + '</strong> \u5b57';
      rt.style.cssText = 'color:#888;font-size:13px;margin-bottom:1.5rem';
      pbody.insertBefore(rt, pbody.firstChild);
    }

    /* Heading copy-link */
    pbody.querySelectorAll('h1,h2,h3').forEach(function(h) {
      if (h._luliyCopy) return; h._luliyCopy = true; h.style.cursor = 'pointer'; h.title = '\u70b9\u51fb\u590d\u5236\u94fe\u63a5';
      h.addEventListener('click', function() {
        var url = location.href.split('#')[0] + '#' + h.id;
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        var tip = document.createElement('span'); tip.textContent = ' \u2713'; tip.style.cssText = 'font-size:12px;color:#1f883d;font-weight:normal';
        h.appendChild(tip); setTimeout(function(){ tip.remove(); }, 2000);
      });
    });

    /* macOS code blocks */
    initCodeBlocks(pbody);
    setTimeout(function(){ initCodeBlocks(pbody); }, 800);
    setTimeout(function(){ initCodeBlocks(pbody); }, 2000);

    /* ArticleTOC scroll-spy - try now + retry after plugin settles */
    initArticleTocSpy();
    setTimeout(function(){ initArticleTocSpy(); }, 600);
    setTimeout(function(){ initArticleTocSpy(); }, 2000);

    /* ---- Prev / Next navigation -------------------------- */
    fetchPosts().then(function(posts) {
      /* Remove pinned posts from navigation sequence */
      var navPosts = posts.filter(function(p){ return !p.pinned; });

      /* Normalize current URL for flexible matching */
      var curPath = location.pathname;
      var curNorm = curPath.replace(/^\//, '').replace(/\.html?$/, '').replace(/\/$/, '');

      var idx = -1;
      navPosts.forEach(function(p, i) {
        if (!p.link) return;
        /* Normalize: strip leading slash, strip .html, strip trailing slash, strip leading 'post/' to get the slug */
        function normLink(s) {
          return s.replace(/^\//, '').replace(/\.html?$/, '').replace(/\/$/, '').replace(/^post\//, '');
        }
        var lnkSlug = normLink(p.link);
        var curSlug = normLink(curNorm);
        /* Match by slug OR by full path */
        if (lnkSlug === curSlug ||
            lnkSlug === curNorm ||
            p.link === curNorm ||
            curPath === '/' + p.link ||
            curPath === p.link ||
            curPath.endsWith('/' + lnkSlug)) {
          idx = i;
        }
      });

      if (idx < 0) return; /* current post not found in list */

      var prevPost = navPosts[idx + 1] || null; /* older */
      var nextPost = navPosts[idx - 1] || null; /* newer */

      if (!prevPost && !nextPost) return;

      var nav = document.createElement('div');
      nav.className = 'luliy-prevnext';

      function mkNavLink(post, labelText, align) {
        if (!post) {
          /* Empty placeholder to keep layout balanced */
          var empty = document.createElement('div');
          empty.style.flex = '1';
          return empty;
        }
        var a = document.createElement('a');
        /* Ensure link always starts with /post/ without doubling */
        var lnk = post.link || '#';
        if (lnk !== '#') {
          lnk = lnk.replace(/^\//, '');          /* strip leading slash */
          lnk = lnk.replace(/^post\/post\//, 'post/'); /* fix double post/ */
          if (!/^post\//.test(lnk) && !/^https?:\/\//.test(lnk)) lnk = 'post/' + lnk;
          lnk = '/' + lnk;
        }
        a.href = lnk;
        a.style.textAlign = align;
        a.innerHTML =
          '<span class="pn-label">' + esc(labelText) + '</span>' +
          '<span class="pn-title">' + esc(post.title) + '</span>';
        return a;
      }

      nav.appendChild(mkNavLink(prevPost, '\u2B05 \u4e0a\u4e00\u7bc7', 'left'));
      nav.appendChild(mkNavLink(nextPost, '\u4e0b\u4e00\u7bc7 \u27A1', 'right'));
      pbody.appendChild(nav);
    }).catch(function(){});

    /* Appreciation panel */
    var sp = document.createElement('div'); sp.style.cssText = 'margin-top:50px;text-align:center';
    var spb = document.createElement('button'); spb.innerHTML = '\u2728 \u548c\u4f5c\u8005\u65e0\u9650\u8fdb\u6b65';
    spb.style.cssText = 'padding:12px 28px;border-radius:30px;border:none;background:linear-gradient(90deg,#f0b429,#ff6b9d);color:#fff;font-weight:bold;font-size:15px;cursor:pointer;box-shadow:0 4px 15px rgba(240,180,41,0.3);transition:transform 0.3s';
    var qr = document.createElement('div');
    qr.innerHTML = '<p style="font-size:13px;color:#888;margin:10px 0">\u65e0\u9650\u8fdb\u6b65\uff0c\u8fdb\u6b65\u6709\u4f60\uff01</p><img src="https://raw.githubusercontent.com/luliy6/img/refs/heads/main/me.jpg" alt="\u8d5b\u8d4f\u7801" style="width:180px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1)">';
    qr.style.cssText = 'height:0;overflow:hidden;transition:height 0.4s ease,opacity 0.4s ease;opacity:0';
    spb.addEventListener('mouseover', function(){ spb.style.transform = 'translateY(-2px)'; });
    spb.addEventListener('mouseout', function(){ spb.style.transform = ''; });
    spb.addEventListener('click', function(){ var o = !qr.style.height || qr.style.height === '0px'; qr.style.height = o ? '260px' : '0px'; qr.style.opacity = o ? '1' : '0'; });
    sp.appendChild(spb); sp.appendChild(qr); pbody.appendChild(sp);
  };

  /* ---- 19  Index page init ------------------------------- */
  root._luliyInitIndex = function() {
    initCards();
    initHeroBanner();

    if (location.pathname.includes('archive')) {
      var pb = document.getElementById('postBody');
      if (pb) {
        pb.innerHTML = '<p style="color:#888;font-size:14px">\u6b63\u5728\u52a0\u8f7d\u5f52\u6863...</p>';
        fetchPosts().then(function(posts) {
          var byY = {};
          posts.forEach(function(p){ var y = (p.created||'\u672a\u77e5').slice(0,4); if (!byY[y]) byY[y]=[]; byY[y].push(p); });
          var years = Object.keys(byY).sort(function(a,b){ return b-a; });
          var html = '<h1 style="border-bottom:2px solid rgba(240,180,41,0.4);padding-bottom:10px;margin-bottom:30px">\uD83D\uDCC5 \u6587\u7ae0\u5f52\u6863</h1>';
          years.forEach(function(y) {
            html += '<div class="tl-year">' + y + ' \u5e74</div><ul class="tl-list">';
            byY[y].forEach(function(p){ var md = (p.created||'').slice(5,10).replace('-','/'); html += '<li class="tl-item"><a href="' + esc(p.link) + '">' + esc(p.title) + '</a><span class="tl-date">' + md + '</span></li>'; });
            html += '</ul>';
          });
          pb.innerHTML = html;
        }).catch(function(){ pb.innerHTML = '<p style="color:#e74c3c">\u5f52\u6863\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u5237\u65b0\u91cd\u8bd5\u3002</p>'; });
      }
    }
  };

  /* ---- 20  Main entry ------------------------------------ */
  initLocalStorage();

  /* Restore sink immediately (prevent FOUC) */
  (function() {
    var savedSinkId = localStorage.getItem('luliy-sink') || 'default';
    var sinkDefs = {
      'default': {skin:'default', theme:'default', c:['#8250df','#0969da','#ff6b9d','#f0b429']},
      'sakura':  {skin:'sakura',  theme:'sakura',  c:['#e05c8a','#f9a8c9','#c94070','#ffb7c5']},
      'ocean':   {skin:'ocean',   theme:'classic-blue', c:['#60a5fa','#0ea5e9','#38bdf8','#0969da']},
      'mono':    {skin:'ink',     theme:'mono',    c:['#555','#888','#aaa','#333']},
      'sunset':  {skin:'default', theme:'sunset',  c:['#fb923c','#f0b429','#ef4444','#fbbf24']}
    };
    var def = sinkDefs[savedSinkId] || sinkDefs['default'];
    function applyFouc() {
      if (!document.body) return;
      document.body.setAttribute('data-luliy-theme', def.theme);
      if (def.skin !== 'default') document.body.setAttribute('data-skin', def.skin);
      document.documentElement.style.setProperty('--card-c1', def.c[0]);
      document.documentElement.style.setProperty('--card-c2', def.c[1]);
      document.documentElement.style.setProperty('--card-c3', def.c[2]);
      document.documentElement.style.setProperty('--card-c4', def.c[3]);
    }
    if (document.body) applyFouc();
    else document.addEventListener('DOMContentLoaded', applyFouc);
  })();


  /* Particles removed — static background image used instead */

  /* Sakura */
  if (localStorage.getItem('luliy-sakura') !== '0') {
    if (document.body) initSakura();
    else document.addEventListener('DOMContentLoaded', initSakura);
  }

  ready(function() {
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
    initLock();

    var isPost    = !!document.getElementById('postBody');
    var isIndex   = location.pathname === '/' || location.pathname === '/index.html' || location.pathname === '';
    var isArchive = location.pathname.includes('archive');
    var hasList   = !!document.querySelector('.SideNav,.post-item,.postList,.post-list');

    if (isPost) root._luliyInitPost();
    if (isIndex || isArchive || (!isPost && hasList)) root._luliyInitIndex();
  });

})(window);
