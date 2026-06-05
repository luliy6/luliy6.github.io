/* ============================================================
   enhance.js — Luliy Blog v4 完整版
   ============================================================ */
(function (root) {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  /* ① localStorage 初始化 */
  function initLocalStorage() {
    var defs = { 'luliy-sfx': '1', 'luliy-particles': '1', 'luliy-theme': 'default' };
    Object.keys(defs).forEach(function (k) {
      if (localStorage.getItem(k) === null) localStorage.setItem(k, defs[k]);
    });
  }

  /* ② 頂部進度條 & 回頂按鈕 */
  function initProgressBar() {
    var bar = document.createElement('div');
    bar.id = 'luliy-progress-bar';
    document.body.appendChild(bar);

    var btn = document.createElement('button');
    btn.id = 'luliy-back-top';
    btn.innerHTML = '↑'; btn.title = '回到頂部'; btn.style.display = 'none';
    document.body.appendChild(btn);
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

    window.addEventListener('scroll', function () {
      var st = window.scrollY || document.documentElement.scrollTop;
      var dh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = (dh > 0 ? Math.round(st / dh * 100) : 0) + '%';
      btn.style.display = st > 300 ? 'flex' : 'none';
    }, { passive: true });
  }

  /* ③ 動態標題 */
  function initDynamicTitle() {
    var ori = document.title, t;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { clearTimeout(t); document.title = '👀 別走呀，我還在進步！'; }
      else { document.title = '✨ 歡迎回來！ ' + ori; t = setTimeout(function () { document.title = ori; }, 2000); }
    });
  }

  /* ④ 運行時間 */
  function initUptime() {
    var el = document.createElement('div');
    el.style.cssText = 'text-align:center;font-size:13px;color:#888;padding:10px 0;margin-top:20px';
    document.body.appendChild(el);
    var start = new Date('2026/05/30 00:00:00').getTime();
    function update() {
      var d = Date.now() - start;
      if (d < 0) { el.innerHTML = '🚀 博客即將上線，敬請期待...'; return; }
      var days = Math.floor(d / 86400000);
      var hh   = Math.floor((d % 86400000) / 3600000);
      var mm   = Math.floor((d % 3600000)  / 60000);
      var ss   = Math.floor((d % 60000)    / 1000);
      el.innerHTML = '🌱 本站已陪伴你無限進步：' + days + '天 ' + hh + '小時 ' + mm + '分 ' +
        '<span style="color:#ff4444;font-weight:bold;font-family:monospace">' + ss + '</span>秒';
    }
    update(); setInterval(update, 1000);
  }

  /* ⑤ 暗色模式波紋 */
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
        'position:fixed;top:' + cy + 'px;left:' + cx + 'px;width:0;height:0;border-radius:50%;' +
        'background:' + (isDark ? 'rgba(10,20,40,0.96)' : 'rgba(255,255,255,0.96)') + ';' +
        'pointer-events:none;z-index:99998;transform:translate(-50%,-50%) scale(0);' +
        'transition:transform 0.65s cubic-bezier(.4,0,.2,1),opacity 0.65s ease;';
      document.body.appendChild(el);
      el.getBoundingClientRect();
      el.style.width = el.style.height = (maxR * 2) + 'px';
      el.style.transform = 'translate(-50%,-50%) scale(1)';
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 700);
    }
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (btn && (btn.innerHTML.includes('Moon') || btn.innerHTML.includes('Sun') ||
          (btn.title && /dark|light|theme|主題/i.test(btn.title)))) ripple();
    });
  }

  /* ⑥ 粒子背景 Canvas */
  function initParticles() {
    if (document.getElementById('luliy-particle-canvas')) return;
    var canvas = document.createElement('canvas');
    canvas.id = 'luliy-particle-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext('2d'), W, H;
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize, { passive: true });
    var mouse = { x: -9999, y: -9999, active: false };
    document.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }, { passive: true });
    var pts = [];
    for (var i = 0; i < 80; i++) pts.push({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 2.2 + 0.8, hue: Math.floor(Math.random() * 60) + 240
    });
    function tick() {
      ctx.clearRect(0, 0, W, H);
      var dark = document.documentElement.getAttribute('data-color-mode') === 'dark';
      var alpha = dark ? 0.7 : 0.45;
      pts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + p.hue + ',80%,65%,' + alpha + ')'; ctx.fill();
      });
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ⑦ Web Audio 音效 */
  var _audioCtx = null;
  function getAudioCtx() {
    if (!_audioCtx) try { _audioCtx = new (root.AudioContext||root.webkitAudioContext)(); } catch(e){}
    return _audioCtx;
  }
  function playSfx(type) {
    if (localStorage.getItem('luliy-sfx') === '0') return;
    var ctx = getAudioCtx(); if (!ctx) return;
    try {
      var o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination);
      if (type === 'click') {
        o.type = 'square'; o.frequency.setValueAtTime(900, ctx.currentTime);
        g.gain.setValueAtTime(0.04, ctx.currentTime); o.start(); o.stop(ctx.currentTime + 0.06);
      } else if (type === 'theme') {
        o.type = 'sine'; o.frequency.setValueAtTime(523, ctx.currentTime);
        g.gain.setValueAtTime(0.05, ctx.currentTime); o.start(); o.stop(ctx.currentTime + 0.15);
      }
    } catch(e){}
  }

  function initSfxEvents() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t.tagName==='BUTTON'||t.tagName==='A'||t.closest('button')||t.closest('a')) playSfx('click');
    }, true);
  }

  /* ⑧ 點擊粒子火花 */
  function initClickSparks() {
    var colors = ['#ff6b9d', '#ffcd3c', '#6bceff', '#a78bfa', '#34d399'];
    document.addEventListener('click', function (e) {
      for (var i = 0; i < 10; i++) {
        (function () {
          var s = document.createElement('div');
          var angle = Math.random() * 360, dist = Math.random() * 50 + 10;
          s.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:99999;background:' + colors[Math.floor(Math.random() * colors.length)] + ';transform:translate(-50%,-50%);transition:transform 0.5s ease,opacity 0.5s ease;';
          document.body.appendChild(s);
          requestAnimationFrame(function () {
            s.style.transform = 'translate(calc(-50% + ' + (Math.cos(angle * Math.PI / 180) * dist) + 'px),calc(-50% + ' + (Math.sin(angle * Math.PI / 180) * dist) + 'px))';
            s.style.opacity = '0';
          });
          setTimeout(function () { s.remove(); }, 600);
        })();
      }
    });
  }

  /* ⑨ 頭像時鐘 & 連結到 /about */
  function initAvatarClock() {
    var avatar = document.querySelector('.avatar, img.avatar, .blogTitle img');
    if (!avatar) return;
    var clockEl = document.createElement('div');
    clockEl.id = 'luliy-avatar-clock';
    avatar.parentNode.appendChild(clockEl);
    setInterval(function () {
      var now = new Date();
      clockEl.innerHTML = now.toTimeString().split(' ')[0];
    }, 1000);
  }

  /* ⑩ 圖片燈箱 */
  function initLightbox() {
    var lb = document.createElement('div');
    lb.className = 'luliy-lightbox';
    var lbImg = document.createElement('img');
    lb.appendChild(lbImg);
    document.body.appendChild(lb);
    document.addEventListener('click', function (e) {
      if (e.target.tagName === 'IMG' && !e.target.classList.contains('avatar')) {
        lbImg.src = e.target.src;
        lb.classList.add('is-active');
      }
    });
    lb.addEventListener('click', function () { lb.classList.remove('is-active'); });
  }

  /* ⑪ macOS 代碼塊控制 */
  function initMacBlocks() {
    document.querySelectorAll('#postBody pre').forEach(function (pre) {
      if (pre.querySelector('.mac-btn')) return;
      var r = document.createElement('button'); r.className = 'mac-btn mac-btn-red'; r.setAttribute('data-tip', '關閉');
      var y = document.createElement('button'); y.className = 'mac-btn mac-btn-yellow'; y.setAttribute('data-tip', '折疊');
      var g = document.createElement('button'); g.className = 'mac-btn mac-btn-green'; g.setAttribute('data-tip', '全螢幕');
      pre.appendChild(r); pre.appendChild(y); pre.appendChild(g);

      y.addEventListener('click', function () { pre.classList.toggle('is-folded'); });
      g.addEventListener('click', function () { pre.classList.toggle('code-fullscreen'); });
    });
  }

  /* ⑫ 前端加密功能 (密碼：121383) */
  function initLock() {
    var isFav = document.title.includes('favorites') || location.pathname.includes('favorites');
    if (!isFav) return;
    var mask = document.createElement('div');
    mask.className = 'luliy-lock-mask';
    mask.innerHTML = '<div class="luliy-lock-box"><h3>🔒 此專屬進步內容已加密</h3><input type="password" class="luliy-lock-input" placeholder="請輸入進步密碼"><button class="luliy-lock-btn">驗證密碼</button></div>';
    document.body.appendChild(mask);
    mask.querySelector('.luliy-lock-btn').addEventListener('click', function () {
      var input = mask.querySelector('.luliy-lock-input').value;
      if (input === '121383') { mask.remove(); }
      else { alert('密碼錯誤，請重新輸入！'); }
    });
  }

  /* ⑬ 主題切換器 */
  function initThemeSwitcher() {
    var toolbar = document.createElement('div');
    toolbar.className = 'luliy-toolbar';
    var themes = ['default', 'sakura', 'ocean', 'forest', 'cyber'];
    themes.forEach(function (t) {
      var btn = document.createElement('button');
      btn.innerHTML = t.toUpperCase();
      btn.className = 'Label';
      btn.style.margin = '2px';
      btn.addEventListener('click', function () {
        document.body.setAttribute('data-luliy-theme', t);
        localStorage.setItem('luliy-theme', t);
      });
      toolbar.appendChild(btn);
    });
    var footer = document.querySelector('.footer');
    if (footer) footer.parentNode.insertBefore(toolbar, footer);
  }

  /* 主初始化 */
  initLocalStorage();
  ready(function () {
    initProgressBar();
    initDynamicTitle();
    initUptime();
    initThemeRipple();
    initParticles();
    initSfxEvents();
    initClickSparks();
    initAvatarClock();
    initLightbox();
    initMacBlocks();
    initLock();
    initThemeSwitcher();
  });

})(window);
