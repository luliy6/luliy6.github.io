/* ============================================================
   enhance.js — Luliy Blog · 全站通用增强脚本 v2
   模块：
     ① localStorage 初始化
     ② 顶部进度条 & 回顶按钮
     ③ 动态标题（切换标签页）
     ④ 运行时间
     ⑤ 暗色模式切换波纹
     ⑥ 粒子背景 Canvas
     ⑦ 音效 (Web Audio)
     ⑧ 点击粒子火花
     ⑨ 头像下方时钟
     ⑩ 标签页增强
     ⑪ 图片灯箱 (Lightbox)
     ⑫ 文章页初始化 (_luliyInitPost)
         ⑫-a  macOS 代码块控制栏
         ⑫-b  TOC 高亮 & 平滑滚动 & 移动端折叠
         ⑫-c  阅读时长 & 字数
         ⑫-d  标题复制链接
         ⑫-e  外链新标签 & 图片懒加载
         ⑫-f  赞赏面板
         ⑫-g  上一篇 / 下一篇
         ⑫-h  3D 虚拟控制台
     ⑬ 首页初始化 (_luliyInitIndex)
     ⑭ 主入口
   ============================================================ */
(function (root) {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     工具函数
  ───────────────────────────────────────────────────────── */
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fetchPosts() {
    function normalize(data) {
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        return Object.keys(data)
          .filter(function (k) { return k !== 'labelColorDict'; })
          .map(function (k) {
            var p = data[k] || {};
            if (typeof p === 'string') p = { title: p };
            return {
              title:   p.title   || p.name  || k,
              link:    p.link    || p.url   || ('post/' + k + '.html'),
              created: p.created || p.date  || p.updated || '',
              labels:  p.labels  || p.tags  || [],
              desc:    p.desc    || p.description || ''
            };
          });
      }
      return [];
    }
    return fetch('/postList.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .catch(function () { return fetch('postList.json').then(function (r) { return r.ok ? r.json() : []; }); })
      .then(normalize);
  }

  /* ─────────────────────────────────────────────────────────
     ① localStorage 初始化
  ───────────────────────────────────────────────────────── */
  function initLocalStorage() {
    var defs = { 'luliy-sfx': '1', 'luliy-particles': '1' };
    Object.keys(defs).forEach(function (k) {
      if (localStorage.getItem(k) === null) localStorage.setItem(k, defs[k]);
    });
  }

  /* ─────────────────────────────────────────────────────────
     ② 顶部进度条 & 回顶按钮
  ───────────────────────────────────────────────────────── */
  function initProgressBar() {
    var bar = document.createElement('div');
    bar.id = 'luliy-progress-bar';
    document.body.appendChild(bar);

    var btn = document.createElement('button');
    btn.id = 'luliy-back-top';
    btn.innerHTML = '↑';
    btn.title = '回到顶部';
    btn.style.display = 'none';
    document.body.appendChild(btn);
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', function () {
      var st = window.scrollY || document.documentElement.scrollTop;
      var dh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var pct = dh > 0 ? Math.round(st / dh * 100) : 0;
      bar.style.width = pct + '%';
      btn.style.display = st > 300 ? 'flex' : 'none';
    }, { passive: true });
  }

  /* ─────────────────────────────────────────────────────────
     ③ 动态标题
  ───────────────────────────────────────────────────────── */
  function initDynamicTitle() {
    var ori = document.title, t;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearTimeout(t);
        document.title = '👀 别走呀，我还在进步！';
      } else {
        document.title = '✨ 欢迎回来！ ' + ori;
        t = setTimeout(function () { document.title = ori; }, 2000);
      }
    });
  }

  /* ─────────────────────────────────────────────────────────
     ④ 运行时间
  ───────────────────────────────────────────────────────── */
  function initUptime() {
    var el = document.createElement('div');
    el.style.cssText = 'text-align:center;font-size:13px;color:#888;padding:10px 0;margin-top:20px';
    document.body.appendChild(el);
    var start = new Date('2026/05/30 00:00:00').getTime();
    function update() {
      var d = Date.now() - start;
      if (d < 0) { el.innerHTML = '🚀 博客即将上线，敬请期待...'; return; }
      var days = Math.floor(d / 86400000);
      var hh   = Math.floor((d % 86400000) / 3600000);
      var mm   = Math.floor((d % 3600000)  / 60000);
      var ss   = Math.floor((d % 60000)    / 1000);
      el.innerHTML = '🌱 本站已陪伴你无限进步：' + days + '天 ' + hh + '小时 ' + mm + '分 ' +
        '<span style="color:#ff4444;font-weight:bold;font-family:monospace">' + ss + '</span>秒';
    }
    update();
    setInterval(update, 1000);
  }

  /* ─────────────────────────────────────────────────────────
     ⑤ 暗色模式切换波纹
  ───────────────────────────────────────────────────────── */
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
        'position:fixed;top:' + cy + 'px;left:' + cx + 'px;' +
        'width:0;height:0;border-radius:50%;' +
        'background:' + (isDark ? 'rgba(10,20,40,0.96)' : 'rgba(255,255,255,0.96)') + ';' +
        'pointer-events:none;z-index:99998;' +
        'transform:translate(-50%,-50%) scale(0);' +
        'transition:transform 0.65s cubic-bezier(.4,0,.2,1),opacity 0.65s ease;';
      document.body.appendChild(el);
      el.getBoundingClientRect(); // reflow
      el.style.width  = (maxR * 2) + 'px';
      el.style.height = (maxR * 2) + 'px';
      el.style.transform = 'translate(-50%,-50%) scale(1)';
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 700);
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (btn && (
        btn.innerHTML.includes('Moon') ||
        btn.innerHTML.includes('Sun')  ||
        (btn.title && /dark|light|theme|主题/i.test(btn.title))
      )) { ripple(); }
    });

    setTimeout(function () {
      document.querySelectorAll('.title-right .circle').forEach(function (el) {
        if (el._luliyRipple) return;
        el._luliyRipple = true;
        el.addEventListener('click', ripple);
      });
    }, 800);
  }

  /* ─────────────────────────────────────────────────────────
     ⑥ 粒子背景 Canvas
  ───────────────────────────────────────────────────────── */
  function initParticles() {
    if (document.getElementById('luliy-particle-canvas')) return;
    var canvas = document.createElement('canvas');
    canvas.id = 'luliy-particle-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext('2d');
    var W, H;
    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    var mouse = { x: -9999, y: -9999, active: false };
    document.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    }, { passive: true });
    document.addEventListener('mouseleave', function () { mouse.active = false; });

    var pts = [];
    for (var i = 0; i < 80; i++) {
      pts.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r:  Math.random() * 2.2 + 0.8,
        hue: Math.floor(Math.random() * 60) + 240
      });
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      var dark = document.documentElement.getAttribute('data-color-mode') === 'dark';
      var alpha = dark ? 0.7 : 0.45;

      pts.forEach(function (p) {
        if (mouse.active) {
          var dx = mouse.x - p.x, dy = mouse.y - p.y;
          var d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 220 && d > 60) {
            var f = 0.018 * (1 - d / 220);
            p.vx += dx / d * f; p.vy += dy / d * f;
          } else if (d <= 60) {
            p.vx -= dx / d * 0.04; p.vy -= dy / d * 0.04;
          }
        }
        p.vx *= 0.98; p.vy *= 0.98;
        var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 3) { p.vx = p.vx / spd * 3; p.vy = p.vy / spd * 3; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > W) { p.x = W; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > H) { p.y = H; p.vy *= -1; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + p.hue + ',80%,65%,' + alpha + ')';
        ctx.fill();
      });

      for (var a = 0; a < pts.length; a++) {
        for (var b = a + 1; b < pts.length; b++) {
          var pa = pts[a], pb = pts[b];
          var ddx = pa.x - pb.x, ddy = pa.y - pb.y;
          var dd  = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < 140) {
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.strokeStyle = 'hsla(260,70%,65%,' + (1 - dd / 140) * (dark ? 0.3 : 0.18) + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      if (mouse.active) {
        var g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 80);
        g.addColorStop(0, 'rgba(130,80,223,0.22)');
        g.addColorStop(1, 'rgba(130,80,223,0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ─────────────────────────────────────────────────────────
     ⑦ Web Audio 音效
  ───────────────────────────────────────────────────────── */
  var _audioCtx = null;
  function getAudioCtx() {
    if (!_audioCtx) {
      try { _audioCtx = new (root.AudioContext || root.webkitAudioContext)(); } catch (e) {}
    }
    return _audioCtx;
  }

  function playSfx(type) {
    if (localStorage.getItem('luliy-sfx') === '0') return;
    var ctx = getAudioCtx();
    if (!ctx) return;
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
      if (t.tagName === 'BUTTON' || t.tagName === 'A' ||
          t.classList.contains('Label') || t.closest('button') || t.closest('a')) {
        playSfx('click');
      }
    }, true);
  }

  /* ─────────────────────────────────────────────────────────
     ⑧ 点击粒子火花
  ───────────────────────────────────────────────────────── */
  function initClickSparks() {
    var colors = ['#ff6b9d','#ffcd3c','#6bceff','#a78bfa','#34d399'];
    document.addEventListener('click', function (e) {
      for (var i = 0; i < 14; i++) {
        (function () {
          var s = document.createElement('div');
          var angle = Math.random() * 360, dist = Math.random() * 55 + 18;
          s.style.cssText =
            'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;' +
            'width:7px;height:7px;border-radius:50%;pointer-events:none;z-index:99999;' +
            'background:' + colors[Math.floor(Math.random() * colors.length)] + ';' +
            'transform:translate(-50%,-50%);transition:transform 0.6s ease,opacity 0.6s ease;';
          document.body.appendChild(s);
          requestAnimationFrame(function () {
            s.style.transform =
              'translate(calc(-50% + ' + (Math.cos(angle * Math.PI / 180) * dist) + 'px),' +
              'calc(-50% + '           + (Math.sin(angle * Math.PI / 180) * dist) + 'px))';
            s.style.opacity = '0';
          });
          setTimeout(function () { s.remove(); }, 700);
        })();
      }
    });
  }

  /* ─────────────────────────────────────────────────────────
     ⑨ 头像下方系统时钟
  ───────────────────────────────────────────────────────── */
  function initAvatarClock() {
    function tryInsert() {
      /* Gmeek 头像通常在 .blogTitle 内或 Header 区 */
      var avatar = document.querySelector('.avatar, img.avatar, .blogTitle img');
      if (!avatar) return false;
      if (document.getElementById('luliy-avatar-clock')) return true;
      var clock = document.createElement('div');
      clock.id = 'luliy-avatar-clock';
      avatar.parentNode.insertBefore(clock, avatar.nextSibling);
      function updateClock() {
        var now = new Date();
        var hh  = String(now.getHours()).padStart(2, '0');
        var mm  = String(now.getMinutes()).padStart(2, '0');
        var ss  = String(now.getSeconds()).padStart(2, '0');
        clock.textContent = hh + ':' + mm + ':' + ss;
      }
      updateClock();
      setInterval(updateClock, 1000);
      return true;
    }
    if (!tryInsert()) {
      var tries = 0, iv = setInterval(function () {
        if (tryInsert() || ++tries > 20) clearInterval(iv);
      }, 300);
    }
  }

  /* ─────────────────────────────────────────────────────────
     ⑩ 标签页增强
  ───────────────────────────────────────────────────────── */
  function initTagEnhance() {
    if (!/tag\.html?$|\/tag\/?$/i.test(location.pathname)) return;
    var tries = 0;
    function wire() {
      var taglabel = document.getElementById('taglabel');
      if (!taglabel) { if (tries++ < 30) setTimeout(wire, 200); return; }
      document.body.classList.add('gmeek-tag-enhanced');
      if (document.getElementById('tag-enhance-toolbar')) return;

      var toolbar = document.createElement('div');
      toolbar.id = 'tag-enhance-toolbar';
      toolbar.className = 'tag-enhance-toolbar';
      toolbar.innerHTML =
        '<input class="tag-enhance-input" type="search" placeholder="筛选标签..." autocomplete="off">' +
        '<span class="tag-enhance-count">正在统计...</span>';
      taglabel.parentNode.insertBefore(toolbar, taglabel);

      var inp   = toolbar.querySelector('.tag-enhance-input');
      var count = toolbar.querySelector('.tag-enhance-count');
      function apply() {
        var q = inp.value.trim().toLowerCase(), vis = 0;
        var all = Array.from(taglabel.querySelectorAll('.Label'));
        all.forEach(function (l) {
          var ok = !q || l.textContent.trim().toLowerCase().includes(q);
          l.style.display = ok ? 'inline-flex' : 'none';
          if (ok) vis++;
        });
        count.textContent = vis + ' / ' + all.length + ' 个标签';
      }
      inp.addEventListener('input', apply);
      new MutationObserver(apply).observe(taglabel, { childList: true, subtree: true });
      setTimeout(apply, 100);
    }
    wire();
  }

  /* ─────────────────────────────────────────────────────────
     ⑪ 图片灯箱 (Lightbox)
  ───────────────────────────────────────────────────────── */
  function initLightbox() {
    if (document.getElementById('luliy-lightbox')) return;

    var lb = document.createElement('div');
    lb.id = 'luliy-lightbox';
    lb.innerHTML = '<button id="luliy-lightbox-close" aria-label="关闭">✕</button><img alt="">';
    document.body.appendChild(lb);

    var lbImg   = lb.querySelector('img');
    var lbClose = lb.querySelector('#luliy-lightbox-close');

    function open(src, alt) {
      lbImg.src = src;
      lbImg.alt = alt || '';
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lb.classList.remove('is-open');
      document.body.style.overflow = '';
      setTimeout(function () { lbImg.src = ''; }, 300);
    }

    /* Clicking the overlay (not the image) closes it */
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target === lbClose) close();
    });
    lbClose.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.classList.contains('is-open')) close();
    });

    /* Delegate: any postBody img click → lightbox */
    document.addEventListener('click', function (e) {
      var img = e.target.closest('#postBody img');
      if (!img) return;
      e.preventDefault();
      open(img.src, img.alt);
    });

    root._luliyLightboxOpen = open;
  }

  /* ─────────────────────────────────────────────────────────
     ⑫ 文章页初始化
  ───────────────────────────────────────────────────────── */
  root._luliyInitPost = function () {
    var pbody = document.getElementById('postBody');

    /* ─ ⑫-e 外链新标签 & 图片懒加载 ─ */
    document.querySelectorAll('a[href^="http"]').forEach(function (a) {
      if (!a.href.includes('luliy6.github.io')) a.target = '_blank';
    });
    if (pbody) pbody.querySelectorAll('img').forEach(function (img) { img.loading = 'lazy'; });
    if (!pbody) return;

    /* ─ ⑫-c 阅读时长 & 字数 ─ */
    var wc   = pbody.innerText.length;
    var rtag = document.createElement('p');
    rtag.innerHTML = '预计阅读：约 <strong>' + Math.max(1, Math.round(wc / 300)) + '</strong> 分钟 &nbsp;|&nbsp; 共 <strong>' + wc + '</strong> 字';
    rtag.style.cssText = 'color:#888;font-size:13px;margin-bottom:1.5rem';
    pbody.insertBefore(rtag, pbody.firstChild);

    /* ─ ⑫-d 标题点击复制链接 ─ */
    pbody.querySelectorAll('h1,h2,h3').forEach(function (h) {
      h.style.cursor = 'pointer';
      h.title = '点击复制链接';
      h.addEventListener('click', function () {
        var url = location.href.split('#')[0] + '#' + h.id;
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        var tip = document.createElement('span');
        tip.textContent = ' ✓';
        tip.style.cssText = 'font-size:12px;color:#1f883d;font-weight:normal';
        h.appendChild(tip);
        setTimeout(function () { tip.remove(); }, 2000);
      });
    });

    /* ─ ⑫-a macOS 代码块控制栏 ─ */
    pbody.querySelectorAll('pre').forEach(function (pre) {
      if (pre.querySelector('.mac-btn')) return; // 已初始化
      var code = pre.querySelector('code');
      if (!code) return;

      /* 三个小按钮：红=复制, 黄=折叠, 绿=全屏 */
      function makeBtn(cls, tipText) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'mac-btn ' + cls;
        b.setAttribute('data-tip', tipText);
        b.setAttribute('aria-label', tipText);
        return b;
      }

      var btnRed    = makeBtn('mac-btn-red',    '复制代码');
      var btnYellow = makeBtn('mac-btn-yellow', '折叠代码');
      var btnGreen  = makeBtn('mac-btn-green',  '全屏阅读');

      /* 红 → 复制 */
      btnRed.addEventListener('click', function (e) {
        e.stopPropagation();
        playSfx('click');
        var text = code.innerText || code.textContent || '';
        function done() {
          btnRed.setAttribute('data-tip', '已复制 ✓');
          btnRed.classList.add('is-done');
          setTimeout(function () {
            btnRed.setAttribute('data-tip', '复制代码');
            btnRed.classList.remove('is-done');
          }, 1500);
        }
        if (navigator.clipboard && location.protocol === 'https:') {
          navigator.clipboard.writeText(text).then(done).catch(done);
        } else {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.cssText = 'position:fixed;left:-9999px';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); } catch (_) {}
          ta.remove();
          done();
        }
      });

      /* 黄 → 折叠 / 展开 */
      btnYellow.addEventListener('click', function (e) {
        e.stopPropagation();
        playSfx('click');
        var folded = pre.classList.toggle('is-folded');
        btnYellow.classList.toggle('is-folded', folded);
        btnYellow.setAttribute('data-tip', folded ? '展开代码' : '折叠代码');
      });

      /* 绿 → 全屏 */
      function toggleFullscreen() {
        playSfx('sci');
        var full = pre.classList.toggle('code-fullscreen');
        btnGreen.setAttribute('data-tip', full ? '退出全屏' : '全屏阅读');
      }
      btnGreen.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleFullscreen();
      });
      pre.addEventListener('dblclick', function (e) {
        if (e.target === btnRed || e.target === btnYellow || e.target === btnGreen) return;
        toggleFullscreen();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && pre.classList.contains('code-fullscreen')) {
          pre.classList.remove('code-fullscreen');
          btnGreen.setAttribute('data-tip', '全屏阅读');
        }
      });

      pre.appendChild(btnRed);
      pre.appendChild(btnYellow);
      pre.appendChild(btnGreen);
    });

    /* ─ ⑫-b TOC 高亮 & 平滑滚动 & 移动端折叠开关 ─ */
    var tocEls = Array.from(document.querySelectorAll('.toc, .markdown-toc, #markdown-toc'));
    var heads  = Array.from(pbody.querySelectorAll('h2,h3'));

    /* 移动端折叠开关 */
    tocEls.forEach(function (toc) {
      var toggle = document.createElement('button');
      toggle.className = 'luliy-toc-toggle';
      toggle.textContent = '📋 目录';
      toc.parentNode.insertBefore(toggle, toc);
      toggle.addEventListener('click', function () {
        var open = toc.classList.toggle('is-toc-open');
        toggle.textContent = open ? '📋 收起目录' : '📋 目录';
      });
    });

    /* TOC 高亮 */
    if (heads.length && tocEls.length) {
      var tocTimer = null;
      window.addEventListener('scroll', function () {
        if (tocTimer) clearTimeout(tocTimer);
        tocTimer = setTimeout(function () {
          var scrollY = window.scrollY || document.documentElement.scrollTop;
          var active  = null;
          heads.forEach(function (h) {
            if (scrollY >= h.offsetTop - 130) active = h;
          });
          tocEls.forEach(function (toc) {
            toc.querySelectorAll('a').forEach(function (a) {
              var matched = active && a.getAttribute('href') === '#' + active.id;
              a.classList.toggle('luliy-toc-active', !!matched);
            });
          });
        }, 50);
      }, { passive: true });
    }

    /* TOC 平滑滚动 */
    document.addEventListener('click', function (e) {
      var link = e.target.closest('.toc a, .markdown-toc a, #markdown-toc a');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      try {
        var target = document.getElementById(decodeURIComponent(href.slice(1)));
        if (target) {
          window.scrollTo({ top: target.offsetTop - 90, behavior: 'smooth' });
          history.pushState(null, null, href);
        }
      } catch (_) {}
    });

    /* ─ ⑫-f 赞赏面板 ─ */
    var spBox = document.createElement('div');
    spBox.style.cssText = 'margin-top:50px;text-align:center';
    var spBtn = document.createElement('button');
    spBtn.innerHTML = '✨ 和作者无限进步';
    spBtn.style.cssText =
      'padding:12px 28px;border-radius:30px;border:none;' +
      'background:linear-gradient(90deg,#f0b429,#ff6b9d);' +
      'color:#fff;font-weight:bold;font-size:15px;cursor:pointer;' +
      'box-shadow:0 4px 15px rgba(240,180,41,0.3);transition:transform 0.3s';
    var qrPanel = document.createElement('div');
    qrPanel.innerHTML =
      '<p style="font-size:13px;color:#888;margin:10px 0">无限进步，进步有你！</p>' +
      '<img src="https://raw.githubusercontent.com/luliy6/img/refs/heads/main/me.jpg" ' +
      'alt="赞赏码" style="width:180px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1)">';
    qrPanel.style.cssText = 'height:0;overflow:hidden;transition:height 0.4s ease,opacity 0.4s ease;opacity:0';
    spBtn.addEventListener('mouseover', function () { spBtn.style.transform = 'translateY(-2px)'; });
    spBtn.addEventListener('mouseout',  function () { spBtn.style.transform = ''; });
    spBtn.addEventListener('click', function () {
      var open = !qrPanel.style.height || qrPanel.style.height === '0px';
      qrPanel.style.height  = open ? '260px' : '0px';
      qrPanel.style.opacity = open ? '1' : '0';
    });
    spBox.appendChild(spBtn);
    spBox.appendChild(qrPanel);

    /* ─ ⑫-g 上一篇 / 下一篇 ─ */
    fetchPosts().then(function (posts) {
      var cur = location.pathname.replace(/\/$/, '');
      var idx = -1;
      posts.forEach(function (p, i) {
        if (p.link && p.link.replace(/\/$/, '') === cur) idx = i;
      });
      if (idx < 0) return;

      var nav = document.createElement('div');
      nav.style.cssText =
        'display:flex;justify-content:space-between;gap:16px;' +
        'margin-top:40px;padding-top:20px;' +
        'border-top:2px dashed rgba(9,105,218,0.2)';

      function makeNavBtn(post, label, align) {
        if (!post) return document.createElement('div');
        var a = document.createElement('a');
        a.href = post.link;
        a.style.cssText =
          'flex:1;padding:14px 18px;border-radius:12px;' +
          'background:rgba(9,105,218,0.05);border:1px solid rgba(9,105,218,0.15);' +
          'text-decoration:none;transition:all 0.25s;text-align:' + align;
        a.innerHTML =
          '<span style="display:block;font-size:11px;color:#888;margin-bottom:4px">' + label + '</span>' +
          '<span style="color:#0969da;font-weight:bold;font-size:14px">' + esc(post.title) + '</span>';
        a.addEventListener('mouseover', function () {
          a.style.background  = 'rgba(9,105,218,0.12)';
          a.style.transform   = 'translateY(-2px)';
        });
        a.addEventListener('mouseout', function () {
          a.style.background  = 'rgba(9,105,218,0.05)';
          a.style.transform   = '';
        });
        return a;
      }
      nav.appendChild(makeNavBtn(posts[idx + 1] || null, '⬅ 上一篇', 'left'));
      nav.appendChild(makeNavBtn(posts[idx - 1] || null, '下一篇 ➡', 'right'));
      pbody.appendChild(nav);
    }).catch(function () {});

    /* ─ ⑫-h 3D 虚拟控制台 ─ */
    (function buildConsole() {
      var con = document.createElement('div');
      con.id = 'luliy-console';
      con.innerHTML =
        '<div class="con-titlebar">' +
          '<span class="con-dot con-dot-r"></span>' +
          '<span class="con-dot con-dot-y"></span>' +
          '<span class="con-dot con-dot-g"></span>' +
          '<span class="con-title">luliy@blog ~ dashboard</span>' +
        '</div>' +
        '<div class="con-body" id="luliy-con-body"></div>' +
        '<div class="con-input-row">' +
          '<span>luliy@blog:~$</span>' +
          '<input class="con-input" id="luliy-con-input" type="text" ' +
            'placeholder="输入命令... (help)" autocomplete="off" spellcheck="false">' +
        '</div>';

      /* Insert just before the sponsor box (pbody's last big element) */
      pbody.appendChild(con);
      pbody.appendChild(spBox);

      var body  = document.getElementById('luliy-con-body');
      var input = document.getElementById('luliy-con-input');

      var bootLines = [
        { cls: 'con-info',  text: '[ OK ] Luliy Dashboard v2.0 启动中...' },
        { cls: 'con-info',  text: '[ OK ] 加载博客配置文件...' },
        { cls: 'con-info',  text: '[ OK ] 连接至粒子场...' },
        { cls: 'con-dim',   text: '       正在统计文章数量...' },
        { cls: 'con-warn',  text: '[WARN] 检测到来访者：你' },
        { cls: 'con-info',  text: '[ OK ] 一切就绪。无限进步！' },
        { cls: 'con-dim',   text: '       输入 help 查看可用命令。' }
      ];

      var lineDelay = 0;
      bootLines.forEach(function (l) {
        lineDelay += 260;
        setTimeout(function () { addLine(l.cls, l.text); }, lineDelay);
      });

      function addLine(cls, html) {
        var span = document.createElement('span');
        span.className = 'con-line';
        span.innerHTML = '<span class="con-prompt">›</span> <span class="' + cls + '">' + html + '</span>';
        body.appendChild(span);
        body.scrollTop = body.scrollHeight;
      }

      /* Commands */
      var commands = {
        help: function () {
          addLine('con-info', '可用命令：help / time / words / clear / sfx / about / party');
        },
        time: function () {
          var n = new Date();
          addLine('con-info', '当前时间：' + n.toLocaleString('zh-CN'));
        },
        words: function () {
          addLine('con-info', '本文约 ' + wc + ' 字，预计阅读 ' + Math.max(1, Math.round(wc / 300)) + ' 分钟。');
        },
        clear: function () {
          body.innerHTML = '';
        },
        sfx: function () {
          var cur = localStorage.getItem('luliy-sfx') !== '0';
          localStorage.setItem('luliy-sfx', cur ? '0' : '1');
          addLine('con-warn', '音效已' + (cur ? '关闭 🔇' : '开启 🔊'));
        },
        about: function () {
          addLine('con-info',  'Luliy Blog — 记录点滴，我将无限进步！');
          addLine('con-dim',   'Powered by Gmeek + GitHub Issues');
          addLine('con-accent','作者：Luliy | luliy6@qq.com');
        },
        party: function () {
          var emojis = ['🎉','🎊','✨','🚀','🌟','💫','🎈'];
          for (var i = 0; i < 5; i++) {
            (function (ii) {
              setTimeout(function () {
                addLine('con-info', emojis.map(function () {
                  return emojis[Math.floor(Math.random() * emojis.length)];
                }).join(' '));
              }, ii * 120);
            })(i);
          }
        }
      };

      input.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var cmd = input.value.trim().toLowerCase();
        input.value = '';
        if (!cmd) return;
        addLine('con-dim', '$ ' + cmd);
        if (commands[cmd]) {
          commands[cmd]();
        } else {
          addLine('con-err', 'bash: ' + cmd + ': command not found');
          addLine('con-dim', '输入 help 查看可用命令。');
        }
      });

      /* 3-D tilt on mouse move */
      con.addEventListener('mousemove', function (e) {
        var rect  = con.getBoundingClientRect();
        var rx    = ((e.clientY - rect.top)  / rect.height - 0.5) * -6;
        var ry    = ((e.clientX - rect.left) / rect.width  - 0.5) *  6;
        con.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      });
      con.addEventListener('mouseleave', function () {
        con.style.transform = '';
      });
    })();
  }; /* end _luliyInitPost */

  /* ─────────────────────────────────────────────────────────
     ⑬ 首页初始化
  ───────────────────────────────────────────────────────── */
  root._luliyInitIndex = function () {
    /* 公告栏 */
    if (!document.querySelector('.announce-bar')) {
      var bar = document.createElement('div');
      bar.className = 'announce-bar';
      bar.innerHTML = '📢 欢迎来到 Luliy 的博客！—— 记录点滴，我将无限进步！';
      var container = document.querySelector('.container-lg') || document.body;
      var first = container.querySelector('.post-list, .postList, [role="main"]') || container.firstChild;
      container.insertBefore(bar, first);
    }

    /* 归档时间轴 */
    if (location.pathname.includes('archive')) {
      var pb = document.getElementById('postBody');
      if (pb) {
        pb.innerHTML = '<p style="color:#888;font-size:14px">正在加载归档...</p>';
        fetchPosts().then(function (posts) {
          var byYear = {};
          posts.forEach(function (p) {
            var y = (p.created || '未知').slice(0, 4);
            if (!byYear[y]) byYear[y] = [];
            byYear[y].push(p);
          });
          var years = Object.keys(byYear).sort(function (a, b) { return b - a; });
          var html = '<h1 style="border-bottom:2px solid rgba(240,180,41,0.4);padding-bottom:10px;margin-bottom:30px">📅 文章归档</h1>';
          years.forEach(function (y) {
            html += '<div class="tl-year">' + y + ' 年</div><ul class="tl-list">';
            byYear[y].forEach(function (p) {
              var md = (p.created || '').slice(5, 10).replace('-', '/');
              html += '<li class="tl-item"><a href="' + esc(p.link) + '">' + esc(p.title) + '</a>' +
                      '<span class="tl-date">' + md + '</span></li>';
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

  /* ─────────────────────────────────────────────────────────
     ⑭ 主入口
  ───────────────────────────────────────────────────────── */
  initLocalStorage();

  /* 粒子背景（尽早启动） */
  if (localStorage.getItem('luliy-particles') !== '0') {
    if (document.body) { initParticles(); }
    else { document.addEventListener('DOMContentLoaded', initParticles); }
  }

  ready(function () {
    initProgressBar();
    initDynamicTitle();
    initUptime();
    initSfxEvents();
    initClickSparks();
    initThemeRipple();
    initTagEnhance();
    initAvatarClock();
    initLightbox();

    var path     = location.pathname;
    var isPost   = !!document.getElementById('postBody');
    var isIndex  = path === '/' || path === '/index.html' || path === '';
    var isArchive = path.includes('archive');
    var hasList  = !!document.querySelector('.post-item, .postList, .post-list');

    if (isPost) {
      root._luliyInitPost && root._luliyInitPost();
    }
    if (isIndex || isArchive || (!isPost && hasList)) {
      root._luliyInitIndex && root._luliyInitIndex();
    }
  });

})(window);
