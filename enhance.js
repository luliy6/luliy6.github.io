/* enhance.js - Luliy Blog v6
   Modules:
   01  localStorage init
   02  Progress bar
   03  Dynamic title
   04  Uptime counter
   05  Dark-mode ripple
   06  Particle background
   07  Web Audio SFX
   08  Click sparks
   09  Compact hero cluster (avatar left, name+clock right of avatar)
   10  Tag page search toolbar
   11  Image lightbox
   12  Floating toolbar (home / github / sfx / theme / skin / bg / sakura)
   13  Favorites lock (SHA-256)
   14  Home card rebuild (tags TOP, title BOTTOM)
   15  macOS code block buttons (red=copy, yellow=collapse, green=fullscreen)
   16  Sakura petals
   17  TOC panel (sticky, scroll-spy, back-to-top inside)
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
        return Object.keys(data).filter(function(k){return k !== 'labelColorDict';}).map(function(k){
          var p = data[k] || {}; if (typeof p === 'string') p = {title: p};
          return {
            title: p.title || p.name || k,
            link: p.link || p.url || ('post/' + k + '.html'),
            created: p.created || p.date || p.updated || '',
            labels: p.labels || p.tags || [],
            desc: p.desc || p.description || ''
          };
        });
      }
      return [];
    }
    return fetch('/postList.json', {cache: 'no-store'})
      .then(function(r){ if (!r.ok) throw 0; return r.json(); })
      .catch(function(){ return fetch('postList.json').then(function(r){ return r.ok ? r.json() : []; }); })
      .then(norm);
  }

  /* ---- 01  localStorage init ----------------------------- */
  function initLocalStorage() {
    var defs = {
      'luliy-sfx': '1',
      'luliy-particles': '1',
      'luliy-sakura': '1',
      'luliy-theme': 'default',
      'luliy-skin': 'default'
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
      if (document.hidden) { clearTimeout(t); document.title = '\u{1F440} \u522b\u8d70\u554a\uff0c\u6211\u8fd8\u5728\u8fdb\u6b65\uff01'; }
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
      if (d < 0) { el.innerHTML = '\u{1F680} \u535a\u5ba2\u5373\u5c06\u4e0a\u7ebf\uff0c\u656c\u8bf7\u671f\u5f85...'; return; }
      el.innerHTML = '\u{1F331} \u672c\u7ad9\u5df2\u966a\u4f34\u4f60\u65e0\u9650\u8fdb\u6b65\uff1a' +
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

  /* ---- 06  Particle background --------------------------- */
  function initParticles() {
    if (document.getElementById('luliy-particle-canvas')) return;
    var canvas = document.createElement('canvas'); canvas.id = 'luliy-particle-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext('2d'), W, H;
    function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize, {passive: true});
    var mouse = {x: -9999, y: -9999, active: false};
    document.addEventListener('mousemove', function(e){ mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }, {passive: true});
    document.addEventListener('mouseleave', function(){ mouse.active = false; });
    var pts = [];
    for (var i = 0; i < 80; i++) pts.push({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 2.2 + 0.8, hue: Math.floor(Math.random() * 60) + 240
    });
    function tick() {
      ctx.clearRect(0, 0, W, H);
      var dark = document.documentElement.getAttribute('data-color-mode') === 'dark', alpha = dark ? 0.7 : 0.45;
      pts.forEach(function(p) {
        if (mouse.active) {
          var dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.sqrt(dx*dx + dy*dy);
          if (d < 220 && d > 60) { var f = 0.018 * (1 - d/220); p.vx += dx/d*f; p.vy += dy/d*f; }
          else if (d <= 60) { p.vx -= dx/d*0.04; p.vy -= dy/d*0.04; }
        }
        p.vx *= 0.98; p.vy *= 0.98;
        var spd = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        if (spd > 3) { p.vx = p.vx/spd*3; p.vy = p.vy/spd*3; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) { p.x = 0; p.vx *= -1; } if (p.x > W) { p.x = W; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; } if (p.y > H) { p.y = H; p.vy *= -1; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = 'hsla(' + p.hue + ',80%,65%,' + alpha + ')'; ctx.fill();
      });
      for (var a = 0; a < pts.length; a++) for (var b = a+1; b < pts.length; b++) {
        var pa = pts[a], pb = pts[b], ddx = pa.x - pb.x, ddy = pa.y - pb.y, dd = Math.sqrt(ddx*ddx + ddy*ddy);
        if (dd < 140) {
          ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
          ctx.strokeStyle = 'hsla(260,70%,65%,' + (1 - dd/140) * (dark ? 0.3 : 0.18) + ')';
          ctx.lineWidth = 0.8; ctx.stroke();
        }
      }
      if (mouse.active) {
        var g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 80);
        g.addColorStop(0, 'rgba(130,80,223,0.22)'); g.addColorStop(1, 'rgba(130,80,223,0)');
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI*2); ctx.fillStyle = g; ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

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
  /* Moves avatar + name + clock into a single flex row in the navbar left side */
  function initHeroCluster() {
    function tryBuild() {
      var header = document.getElementById('header'); if (!header) return false;
      if (document.getElementById('luliy-hero-cluster')) return true;

      var av = header.querySelector('img.avatar, img[src*="avatar"]');
      if (!av) return false;

      /* Build cluster */
      var cluster = document.createElement('a');
      cluster.id = 'luliy-hero-cluster';
      cluster.href = '/about';
      cluster.title = '\u5173\u4e8e\u6211';

      /* Clone avatar into cluster */
      var avClone = av.cloneNode(true);
      avClone.style.cssText = '';
      cluster.appendChild(avClone);

      /* Info column: name + clock */
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

      /* Insert cluster as first child of header */
      header.insertBefore(cluster, header.firstChild);

      /* Hide original avatar and blogTitle */
      if (av.parentElement && av.parentElement !== header) av.parentElement.style.display = 'none';
      else av.style.display = 'none';
      header.querySelectorAll('.blogTitle, .postTitle').forEach(function(el){ el.style.display = 'none'; });

      /* Start clock */
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

  /* ---- Hero banner (separate title bar below navbar) ----- */
  function initHeroBanner() {
    if (document.getElementById('luliy-hero-banner')) return;
    var content = document.getElementById('content') || document.querySelector('.main');
    if (!content) return;
    var banner = document.createElement('div');
    banner.id = 'luliy-hero-banner';
    banner.textContent = 'Remember, this is your world.';
    content.parentNode.insertBefore(banner, content);
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
  var THEMES = [
    {id:'default',      label:'\u9ed8\u8ba4\u91d1\u8c03', dot:'#f0b429'},
    {id:'classic-blue', label:'\u7ecf\u5178\u84dd\u8c03', dot:'#60a5fa'},
    {id:'eco-green',    label:'\u751f\u6001\u7eff\u610f', dot:'#34d399'},
    {id:'sunset',       label:'\u65e5\u843d\u4f59\u6656', dot:'#fb923c'},
    {id:'mono',         label:'\u6781\u7b80\u9ed1\u767d', dot:'#e5e5e5'},
    {id:'cyberpunk',    label:'\u8d5b\u535a\u9704\u8679', dot:'#c084fc'}
  ];
  var SKINS = [
    {id:'default',   label:'\u9ed8\u8ba4',   bg:'transparent', border:'#8250df'},
    {id:'parchment', label:'\u7f8a\u76ae\u7eb8', bg:'#fdf6e3',  border:'#b5651d'},
    {id:'ink',       label:'\u6c34\u58a8',   bg:'#1a1a1a',     border:'#888'},
    {id:'ocean',     label:'\u6df1\u6d77\u84dd', bg:'#0d1b2a', border:'#60a5fa'}
  ];

  function applyTheme(id) {
    document.body.setAttribute('data-luliy-theme', id);
    localStorage.setItem('luliy-theme', id);
    document.querySelectorAll('.luliy-theme-opt').forEach(function(b){ b.classList.toggle('is-active', b.getAttribute('data-theme') === id); });
  }
  function applySkin(id) {
    if (id === 'default') document.body.removeAttribute('data-skin');
    else document.body.setAttribute('data-skin', id);
    localStorage.setItem('luliy-skin', id);
    document.querySelectorAll('.luliy-skin-opt').forEach(function(b){ b.classList.toggle('is-active', b.getAttribute('data-skin') === id); });
  }

  function initToolbar() {
    if (document.getElementById('luliy-toolbar')) return;
    var bar = document.createElement('div'); bar.id = 'luliy-toolbar';

    /* Home */
    var btnHome = document.createElement('a'); btnHome.className = 'luliy-tb-btn'; btnHome.href = '/'; btnHome.setAttribute('data-tip', '\u4e3b\u9875'); btnHome.innerHTML = '\u{1F3E0}';

    /* GitHub */
    var btnGH = document.createElement('a'); btnGH.className = 'luliy-tb-btn'; btnGH.href = 'https://github.com/luliy6'; btnGH.target = '_blank'; btnGH.setAttribute('data-tip', 'GitHub');
    btnGH.innerHTML = '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.67 7.67 0 0 1 8 4.58c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';

    /* SFX */
    var btnSfx = document.createElement('button'); btnSfx.className = 'luliy-tb-btn'; btnSfx.type = 'button';
    var sfxOn = localStorage.getItem('luliy-sfx') !== '0';
    btnSfx.innerHTML = sfxOn ? '\u{1F50A}' : '\u{1F507}'; btnSfx.setAttribute('data-tip', sfxOn ? '\u5173\u95ed\u97f3\u6548' : '\u5f00\u542f\u97f3\u6548');
    if (!sfxOn) btnSfx.classList.add('sfx-off');
    btnSfx.addEventListener('click', function() {
      var on = localStorage.getItem('luliy-sfx') !== '0';
      localStorage.setItem('luliy-sfx', on ? '0' : '1');
      btnSfx.innerHTML = on ? '\u{1F507}' : '\u{1F50A}'; btnSfx.setAttribute('data-tip', on ? '\u5f00\u542f\u97f3\u6548' : '\u5173\u95ed\u97f3\u6548');
      btnSfx.classList.toggle('sfx-off', on);
    });

    /* Article theme */
    var themeWrap = document.createElement('div'); themeWrap.style.cssText = 'position:relative;';
    var btnTheme = document.createElement('button'); btnTheme.className = 'luliy-tb-btn'; btnTheme.type = 'button'; btnTheme.setAttribute('data-tip', '\u6587\u7ae0\u4e3b\u9898'); btnTheme.innerHTML = '\u{1F3A8}';
    var themeMenu = document.createElement('div'); themeMenu.id = 'luliy-theme-menu';
    THEMES.forEach(function(t) {
      var b = document.createElement('button'); b.className = 'luliy-theme-opt'; b.type = 'button'; b.setAttribute('data-theme', t.id);
      b.innerHTML = '<span class="luliy-theme-dot" style="background:' + t.dot + '"></span>' + t.label;
      b.addEventListener('click', function(){ applyTheme(t.id); themeMenu.classList.remove('is-open'); playSfx('click'); });
      themeMenu.appendChild(b);
    });
    btnTheme.addEventListener('click', function(e){ e.stopPropagation(); themeMenu.classList.toggle('is-open'); skinMenu.classList.remove('is-open'); bgMenu.classList.remove('is-open'); });
    themeMenu.addEventListener('click', function(e){ e.stopPropagation(); });
    themeWrap.appendChild(themeMenu); themeWrap.appendChild(btnTheme);

    /* Reading skin */
    var skinWrap = document.createElement('div'); skinWrap.style.cssText = 'position:relative;';
    var btnSkin = document.createElement('button'); btnSkin.className = 'luliy-tb-btn'; btnSkin.type = 'button'; btnSkin.setAttribute('data-tip', '\u9605\u8bfb\u76ae\u80a4'); btnSkin.innerHTML = '\u{1F308}';
    var skinMenu = document.createElement('div'); skinMenu.id = 'luliy-skin-menu';
    SKINS.forEach(function(s) {
      var b = document.createElement('button'); b.className = 'luliy-skin-opt'; b.type = 'button'; b.setAttribute('data-skin', s.id);
      b.innerHTML = '<span class="luliy-skin-swatch" style="background:' + s.bg + ';border-color:' + s.border + '"></span>' + s.label;
      b.addEventListener('click', function(){ applySkin(s.id); skinMenu.classList.remove('is-open'); playSfx('click'); });
      skinMenu.appendChild(b);
    });
    btnSkin.addEventListener('click', function(e){ e.stopPropagation(); skinMenu.classList.toggle('is-open'); themeMenu.classList.remove('is-open'); bgMenu.classList.remove('is-open'); });
    skinMenu.addEventListener('click', function(e){ e.stopPropagation(); });
    skinWrap.appendChild(skinMenu); skinWrap.appendChild(btnSkin);

    /* Background image */
    var bgWrap = document.createElement('div'); bgWrap.style.cssText = 'position:relative;';
    var btnBg = document.createElement('button'); btnBg.className = 'luliy-tb-btn'; btnBg.type = 'button'; btnBg.setAttribute('data-tip', '\u80cc\u666f\u56fe\u7247'); btnBg.innerHTML = '\u{1F5BC}';
    var bgMenu = document.createElement('div'); bgMenu.id = 'luliy-bg-menu';
    bgMenu.innerHTML =
      '<div class="luliy-bg-label">\u80cc\u666f\u56fe\u7247\u94fe\u63a5</div>' +
      '<input class="luliy-bg-input" type="url" placeholder="https://..." autocomplete="off" />' +
      '<div class="luliy-bg-actions">' +
      '<button class="luliy-bg-apply" type="button">\u5e94 \u7528</button>' +
      '<button class="luliy-bg-clear" type="button">\u6e05 \u9664</button>' +
      '</div>';
    var bgInp = bgMenu.querySelector('.luliy-bg-input');
    var savedBg = localStorage.getItem('luliy-bg'); if (savedBg) bgInp.value = savedBg;
    var bgApply = bgMenu.querySelector('.luliy-bg-apply'), bgClear = bgMenu.querySelector('.luliy-bg-clear');
    bgApply.addEventListener('click', function() {
      var url = bgInp.value.trim();
      if (url) {
        document.body.style.backgroundImage = 'url(' + url + ')'; document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundAttachment = 'fixed'; document.body.style.backgroundPosition = 'center'; document.body.style.backgroundRepeat = 'no-repeat';
        localStorage.setItem('luliy-bg', url); bgMenu.classList.remove('is-open'); playSfx('sci');
      }
    });
    bgClear.addEventListener('click', function() {
      ['backgroundImage','backgroundSize','backgroundAttachment','backgroundPosition','backgroundRepeat'].forEach(function(p){ document.body.style[p] = ''; });
      localStorage.removeItem('luliy-bg'); bgInp.value = ''; bgMenu.classList.remove('is-open'); playSfx('click');
    });
    bgInp.addEventListener('keydown', function(e){ if (e.key === 'Enter') bgApply.click(); });
    btnBg.addEventListener('click', function(e){ e.stopPropagation(); bgMenu.classList.toggle('is-open'); themeMenu.classList.remove('is-open'); skinMenu.classList.remove('is-open'); });
    bgMenu.addEventListener('click', function(e){ e.stopPropagation(); });
    bgWrap.appendChild(bgMenu); bgWrap.appendChild(btnBg);

    /* Sakura toggle */
    var btnSakura = document.createElement('button'); btnSakura.className = 'luliy-tb-btn'; btnSakura.type = 'button';
    var sakuraOn = localStorage.getItem('luliy-sakura') !== '0';
    btnSakura.innerHTML = '\u{1F338}'; btnSakura.setAttribute('data-tip', sakuraOn ? '\u5173\u95ed\u82b1\u74e3' : '\u5f00\u542f\u82b1\u74e3');
    if (!sakuraOn) btnSakura.classList.add('sakura-off');
    btnSakura.addEventListener('click', function() {
      var on = localStorage.getItem('luliy-sakura') !== '0';
      localStorage.setItem('luliy-sakura', on ? '0' : '1');
      btnSakura.innerHTML = '\u{1F338}'; btnSakura.setAttribute('data-tip', on ? '\u5f00\u542f\u82b1\u74e3' : '\u5173\u95ed\u82b1\u74e3');
      btnSakura.classList.toggle('sakura-off', on);
      if (on) { var c = document.getElementById('luliy-sakura-canvas'); if (c) c.remove(); }
      else initSakura();
      playSfx('click');
    });

    /* Close all popups on outside click */
    document.addEventListener('click', function() {
      themeMenu.classList.remove('is-open'); skinMenu.classList.remove('is-open'); bgMenu.classList.remove('is-open');
    });

    bar.appendChild(btnHome); bar.appendChild(btnGH); bar.appendChild(btnSfx);
    bar.appendChild(themeWrap); bar.appendChild(skinWrap); bar.appendChild(bgWrap); bar.appendChild(btnSakura);
    document.body.appendChild(bar);

    applyTheme(localStorage.getItem('luliy-theme') || 'default');
    applySkin(localStorage.getItem('luliy-skin') || 'default');
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
    var attr = (document.body.getAttribute('data-labels') || '') +
      ((document.getElementById('postBody') && document.getElementById('postBody').getAttribute('data-labels')) || '');
    if (/favorites/i.test(attr)) return true;
    var found = false;
    document.querySelectorAll('.Label, a.Label').forEach(function(el){ if (/favorites/i.test(el.textContent)) found = true; });
    if (!found) found = /favorites/i.test(document.title + location.href);
    return found;
  }
  function initLock() {
    if (!document.getElementById('postBody')) return;
    if (sessionStorage.getItem(LOCK_KEY) === '1') return;
    function check(n){ if (isFavoritesPost()){ showLock(); return; } if (n > 0) setTimeout(function(){ check(n-1); }, 300); }
    check(6);
  }
  function showLock() {
    if (document.getElementById('luliy-lock-overlay')) return;
    var pbody = document.getElementById('postBody');
    var ov = document.createElement('div'); ov.id = 'luliy-lock-overlay';
    ov.innerHTML = '<div class="luliy-lock-box"><span class="luliy-lock-icon">\u{1F510}</span><div class="luliy-lock-title">\u52a0\u5bc6\u5185\u5bb9</div><div class="luliy-lock-hint">\u672c\u6587\u4e3a\u79c1\u5bc6\u6536\u85cf\uff0c\u8bf7\u8f93\u5165\u8bbf\u95ee\u5bc6\u7801</div><input class="luliy-lock-input" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022" maxlength="20" autocomplete="off"><button class="luliy-lock-btn">\u89e3 \u9501</button><div class="luliy-lock-err"></div></div>';
    document.body.appendChild(ov);
    pbody.style.filter = 'blur(18px)'; pbody.style.userSelect = 'none'; pbody.style.pointerEvents = 'none';
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

  /* ---- 14  Home card rebuild - tags TOP, title BOTTOM ----- */
  function initCards() {
    var nav = document.querySelector('nav.SideNav, ul.SideNav, .SideNav');
    if (!nav || nav.getAttribute('data-luliy-cards')) return;
    nav.setAttribute('data-luliy-cards', '1');
    nav.classList.add('luliy-card-grid');

    nav.querySelectorAll('li.SideNav-item, .SideNav-item').forEach(function(li) {
      li.classList.add('luliy-card');

      /* Find the existing anchor and its child elements */
      var existingA = li.querySelector('a');
      if (!existingA) return;

      /* Extract labels and date from DOM */
      var labels = Array.from(li.querySelectorAll('a.Label'));
      var dateEl = li.querySelector('.text-gray-light, time, [class*="date"], [class*="Date"]');
      var titleEl = li.querySelector('.text-bold, .SideNav-item-title, a > span:first-child');

      /* Get text content safely */
      var titleText = (titleEl ? titleEl.textContent : existingA.textContent).trim();
      /* Remove label text from title */
      labels.forEach(function(l){ titleText = titleText.replace(l.textContent, '').trim(); });
      var dateText = dateEl ? dateEl.textContent.trim() : '';
      /* Try extracting date from title if pattern matches */
      if (!dateText) {
        var dm = titleText.match(/(\d{4}-\d{2}-\d{2})/);
        if (dm) { dateText = dm[1]; titleText = titleText.replace(dm[0], '').trim(); }
      }

      var href = existingA.href;

      /* Rebuild inner HTML */
      li.innerHTML = '';
      var a = document.createElement('a');
      a.href = href;

      /* Tags row */
      var tagsRow = document.createElement('div');
      tagsRow.className = 'luliy-card-tags';
      labels.forEach(function(l){ tagsRow.appendChild(l.cloneNode(true)); });
      if (dateText) {
        var dateChip = document.createElement('span');
        dateChip.className = 'luliy-card-date';
        dateChip.textContent = dateText;
        tagsRow.appendChild(dateChip);
      }

      /* Title row */
      var titleDiv = document.createElement('div');
      titleDiv.className = 'luliy-card-title';
      titleDiv.textContent = titleText || '\u65e0\u9898';

      a.appendChild(tagsRow);
      a.appendChild(titleDiv);
      li.appendChild(a);
    });
  }

  /* ---- 15  macOS code block buttons ---------------------- */
  function initCodeBlocks(pbody) {
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

      /* YELLOW = Collapse/Expand */
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

  /* ---- 17  TOC panel with scroll-spy & back-to-top ------- */
  /* Replaces the back-to-top button; merged into a single TOC toggle */
  function initTocPanel() {
    if (!document.getElementById('postBody')) return;
    if (document.getElementById('luliy-toc-panel')) return;

    /* Collect headings */
    var pbody = document.getElementById('postBody');
    var headings = Array.from(pbody.querySelectorAll('h1,h2,h3')).filter(function(h){ return h.id; });
    if (headings.length < 2) return; /* not worth showing TOC */

    /* Build panel */
    var panel = document.createElement('div'); panel.id = 'luliy-toc-panel'; panel.classList.add('is-visible');

    /* Dropdown */
    var dropdown = document.createElement('div'); dropdown.id = 'luliy-toc-dropdown';

    /* Header row inside dropdown */
    var hdr = document.createElement('div'); hdr.id = 'luliy-toc-header';
    var lbl = document.createElement('span'); lbl.id = 'luliy-toc-label'; lbl.textContent = '\u76ee\u5f55';
    var totop = document.createElement('button'); totop.id = 'luliy-toc-totop'; totop.type = 'button'; totop.textContent = '\u2191 \u56de\u9876';
    totop.addEventListener('click', function(){ window.scrollTo({top:0,behavior:'smooth'}); playSfx('click'); });
    hdr.appendChild(lbl); hdr.appendChild(totop); dropdown.appendChild(hdr);

    /* Links list */
    var ul = document.createElement('ul'); ul.id = 'luliy-toc-list';
    headings.forEach(function(h) {
      var li = document.createElement('li'); li.setAttribute('data-level', h.tagName.slice(1));
      var a = document.createElement('a'); a.href = '#' + h.id; a.textContent = h.textContent.replace(/\s*\u2713\s*$/, '').trim();
      a.addEventListener('click', function(e){ e.preventDefault(); playSfx('click'); dropdown.classList.remove('is-open'); var target = document.getElementById(h.id); if (target) target.scrollIntoView({behavior:'smooth', block:'start'}); });
      li.appendChild(a); ul.appendChild(li);
    });
    dropdown.appendChild(ul);

    /* Toggle button */
    var tocBtn = document.createElement('button'); tocBtn.id = 'luliy-toc-btn'; tocBtn.type = 'button';
    tocBtn.innerHTML = '\u{1F4CB}';
    tocBtn.addEventListener('click', function(e){ e.stopPropagation(); dropdown.classList.toggle('is-open'); });
    document.addEventListener('click', function(){ dropdown.classList.remove('is-open'); });
    dropdown.addEventListener('click', function(e){ e.stopPropagation(); });

    panel.appendChild(dropdown);
    panel.appendChild(tocBtn);
    document.body.appendChild(panel);

    /* Position panel below toolbar (offset by toolbar height) */
    function positionPanel() {
      var toolbar = document.getElementById('luliy-toolbar');
      if (toolbar) {
        var tbBottom = toolbar.getBoundingClientRect().bottom;
        panel.style.top = (tbBottom + 8) + 'px';
      }
    }
    setTimeout(positionPanel, 500);
    window.addEventListener('resize', positionPanel, {passive: true});

    /* Scroll-spy: highlight the currently visible heading link */
    var links = Array.from(ul.querySelectorAll('a'));
    var lastActive = null;
    function onScroll() {
      var scrollY = window.scrollY || window.pageYOffset;
      var activeH = null;
      for (var i = 0; i < headings.length; i++) {
        var rect = headings[i].getBoundingClientRect();
        if (rect.top <= 100) activeH = headings[i];
        else break;
      }
      if (!activeH && headings.length) activeH = headings[0];
      if (activeH && activeH === lastActive) return;
      lastActive = activeH;
      links.forEach(function(a){ a.classList.remove('luliy-toc-active'); });
      if (activeH) {
        var matchLink = links.find(function(a){ return a.getAttribute('href') === '#' + activeH.id; });
        if (matchLink) {
          matchLink.classList.add('luliy-toc-active');
          /* Scroll link into view inside dropdown if it's open */
          if (dropdown.classList.contains('is-open')) {
            var linkRect = matchLink.getBoundingClientRect();
            var dropRect = dropdown.getBoundingClientRect();
            if (linkRect.top < dropRect.top || linkRect.bottom > dropRect.bottom) {
              matchLink.scrollIntoView({block:'nearest'});
            }
          }
        }
      }
    }
    window.addEventListener('scroll', onScroll, {passive: true});
    onScroll();
  }

  /* ---- 18  Post page init -------------------------------- */
  root._luliyInitPost = function() {
    if (root._luliyPostInited) return; root._luliyPostInited = true;
    var pbody = document.getElementById('postBody');
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

    initCodeBlocks(pbody);
    initTocPanel();

    /* Prev/Next nav */
    fetchPosts().then(function(posts) {
      var cur = location.pathname.replace(/\/$/, ''), idx = -1;
      posts.forEach(function(p, i){ if (p.link && p.link.replace(/\/$/, '') === cur) idx = i; });
      if (idx < 0) return;
      var nav = document.createElement('div');
      nav.style.cssText = 'display:flex;justify-content:space-between;gap:16px;margin-top:40px;padding-top:20px;border-top:2px dashed rgba(9,105,218,0.2)';
      function mkNav(post, label, align) {
        if (!post) return document.createElement('div');
        var a = document.createElement('a'); a.href = post.link;
        a.style.cssText = 'flex:1;padding:14px 18px;border-radius:12px;background:rgba(9,105,218,0.05);border:1px solid rgba(9,105,218,0.15);text-decoration:none;transition:all 0.25s;text-align:' + align;
        a.innerHTML = '<span style="display:block;font-size:11px;color:#888;margin-bottom:4px">' + label + '</span><span style="color:#0969da;font-weight:bold;font-size:14px">' + esc(post.title) + '</span>';
        a.addEventListener('mouseover', function(){ a.style.background = 'rgba(9,105,218,0.12)'; a.style.transform = 'translateY(-2px)'; });
        a.addEventListener('mouseout', function(){ a.style.background = 'rgba(9,105,218,0.05)'; a.style.transform = ''; });
        return a;
      }
      nav.appendChild(mkNav(posts[idx+1] || null, '\u2B05 \u4e0a\u4e00\u7bc7', 'left'));
      nav.appendChild(mkNav(posts[idx-1] || null, '\u4e0b\u4e00\u7bc7 \u27A1', 'right'));
      pbody.appendChild(nav);
    }).catch(function(){});

    /* Appreciation panel */
    var sp = document.createElement('div'); sp.style.cssText = 'margin-top:50px;text-align:center';
    var spb = document.createElement('button'); spb.innerHTML = '\u2728 \u548c\u4f5c\u8005\u65e0\u9650\u8fdb\u6b65';
    spb.style.cssText = 'padding:12px 28px;border-radius:30px;border:none;background:linear-gradient(90deg,#f0b429,#ff6b9d);color:#fff;font-weight:bold;font-size:15px;cursor:pointer;box-shadow:0 4px 15px rgba(240,180,41,0.3);transition:transform 0.3s';
    var qr = document.createElement('div');
    qr.innerHTML = '<p style="font-size:13px;color:#888;margin:10px 0">\u65e0\u9650\u8fdb\u6b65\uff0c\u8fdb\u6b65\u6709\u4f60\uff01</p><img src="https://raw.githubusercontent.com/luliy6/img/refs/heads/main/me.jpg" alt="\u8d5e\u8d4f\u7801" style="width:180px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1)">';
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
          var html = '<h1 style="border-bottom:2px solid rgba(240,180,41,0.4);padding-bottom:10px;margin-bottom:30px">\u{1F4C5} \u6587\u7ae0\u5f52\u6863</h1>';
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

  /* Restore theme & skin immediately (prevent FOUC) */
  var savedTheme = localStorage.getItem('luliy-theme') || 'default';
  var savedSkin  = localStorage.getItem('luliy-skin')  || 'default';
  function _restoreBodyAttrs() {
    if (!document.body) return;
    document.body.setAttribute('data-luliy-theme', savedTheme);
    if (savedSkin !== 'default') document.body.setAttribute('data-skin', savedSkin);
  }
  if (document.body) _restoreBodyAttrs();
  else document.addEventListener('DOMContentLoaded', _restoreBodyAttrs);

  /* Restore background image */
  (function() {
    var bg = localStorage.getItem('luliy-bg'); if (!bg) return;
    function applyBg() {
      document.body.style.backgroundImage = 'url(' + bg + ')';
      document.body.style.backgroundSize = 'cover'; document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundPosition = 'center'; document.body.style.backgroundRepeat = 'no-repeat';
    }
    if (document.body) applyBg();
    else document.addEventListener('DOMContentLoaded', applyBg);
  })();

  /* Particles */
  if (localStorage.getItem('luliy-particles') !== '0') {
    if (document.body) initParticles();
    else document.addEventListener('DOMContentLoaded', initParticles);
  }

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

    if (isPost)  root._luliyInitPost();
    if (isIndex || isArchive || (!isPost && hasList)) root._luliyInitIndex();
  });

})(window);
