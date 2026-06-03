/* ============================================================
   enhance.js — Luliy Blog · 全站增强脚本
   包含：原 allHead 内联 JS（搜索+标签）、原 script 内联 JS、
         原 indexScript 逻辑，以及所有新增功能
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     工具函数
     ============================================================ */
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function normalizePosts(data) {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      return Object.keys(data)
        .filter(function (k) { return k !== 'labelColorDict'; })
        .map(function (k) {
          var p = data[k] || {};
          if (typeof p === 'string') p = { title: p };
          return {
            title: p.title || p.name || k,
            link: p.link || p.url || ('post/' + k + '.html'),
            created: p.created || p.date || p.updated || '',
            labels: p.labels || p.tags || [],
            desc: p.desc || p.description || p.abstract || p.summary || ''
          };
        });
    }
    return [];
  }

  function fetchPosts() {
    return fetch('/postList.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('root miss'); return r.json(); })
      .catch(function () {
        return fetch('postList.json', { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : []; });
      })
      .then(normalizePosts);
  }

  function textOfPost(p) {
    return [p.title, p.desc, p.created, (p.labels || []).join(' ')].join(' ').toLowerCase();
  }

  /* ============================================================
     ① 站内搜索
     ============================================================ */
  function initSearch() {
    if (document.getElementById('site-search-panel')) return;

    var trigger = document.createElement('button');
    trigger.id = 'site-search-trigger';
    trigger.className = 'site-search-trigger';
    trigger.type = 'button';
    trigger.title = '搜索文章';
    trigger.setAttribute('aria-label', '搜索文章');
    trigger.textContent = '⌕';

    var panel = document.createElement('div');
    panel.id = 'site-search-panel';
    panel.className = 'site-search-panel';
    panel.innerHTML =
      '<div class="site-search-box" role="dialog" aria-modal="true" aria-label="站内搜索">' +
        '<div class="site-search-head">' +
          '<input class="site-search-input" type="search" placeholder="搜索标题、标签、日期..." autocomplete="off">' +
          '<button class="site-search-close" type="button" aria-label="关闭">×</button>' +
        '</div>' +
        '<div class="site-search-meta">输入 / 可快速打开搜索，Esc 关闭。</div>' +
        '<div class="site-search-results"><div class="site-search-empty">正在准备文章索引...</div></div>' +
      '</div>';

    document.body.appendChild(trigger);
    document.body.appendChild(panel);

    var input   = panel.querySelector('.site-search-input');
    var results = panel.querySelector('.site-search-results');
    var meta    = panel.querySelector('.site-search-meta');
    var posts   = [];
    var loaded  = false;

    function esc(s) {
      return String(s).replace(/[&<>]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
      });
    }

    function render() {
      var q = input.value.trim().toLowerCase();
      var list = q ? posts.filter(function (p) { return textOfPost(p).includes(q); }) : posts.slice(0, 10);
      meta.textContent = (q ? '匹配到 ' + list.length + ' 篇文章' : '显示最近 ' + list.length + ' 篇文章') + '，共 ' + posts.length + ' 篇。';
      if (!loaded) { results.innerHTML = '<div class="site-search-empty">正在准备文章索引...</div>'; return; }
      if (!list.length) { results.innerHTML = '<div class="site-search-empty">没有找到匹配内容</div>'; return; }
      results.innerHTML = list.slice(0, 30).map(function (p) {
        var labels = (p.labels || []).slice(0, 6).map(function (t) {
          return '<span class="site-search-tag">' + esc(t) + '</span>';
        }).join('');
        return '<a class="site-search-item" href="' + (p.link || '#') + '">' +
          '<span class="site-search-title">' + esc(p.title || 'Untitled') + '</span>' +
          '<span class="site-search-desc">' + esc(p.desc || p.created || '') + '</span>' +
          (labels ? '<span class="site-search-tags">' + labels + '</span>' : '') +
          '</a>';
      }).join('');
    }

    function openSearch() {
      panel.classList.add('is-open');
      if (!loaded) {
        fetchPosts()
          .then(function (list) {
            posts = list.sort(function (a, b) {
              return String(b.created || '').localeCompare(String(a.created || ''));
            });
            loaded = true;
            render();
          })
          .catch(function () { loaded = true; posts = []; render(); });
      }
      setTimeout(function () { input.focus(); input.select(); }, 30);
    }

    function closeSearch() { panel.classList.remove('is-open'); }

    trigger.addEventListener('click', openSearch);
    panel.querySelector('.site-search-close').addEventListener('click', closeSearch);
    panel.addEventListener('click', function (e) { if (e.target === panel) closeSearch(); });
    input.addEventListener('input', render);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) closeSearch();
      if (e.key === '/' && !panel.classList.contains('is-open') &&
          !/input|textarea|select/i.test((e.target || {}).tagName || '')) {
        e.preventDefault();
        openSearch();
      }
    });

    var headerSearch = document.getElementById('buttonSearch');
    if (headerSearch) {
      headerSearch.addEventListener('click', function (e) { e.preventDefault(); openSearch(); });
    }
  }

  /* ============================================================
     ② 标签页增强
     ============================================================ */
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
        '<span class="tag-enhance-count">正在统计标签</span>';
      taglabel.parentNode.insertBefore(toolbar, taglabel);
      var inp   = toolbar.querySelector('.tag-enhance-input');
      var count = toolbar.querySelector('.tag-enhance-count');
      function labels() { return Array.from(taglabel.querySelectorAll('.Label')); }
      function apply() {
        var q = inp.value.trim().toLowerCase();
        var visible = 0;
        var all = labels();
        all.forEach(function (label) {
          var text = label.textContent.replace(/\s+/g, ' ').trim();
          var ok = !q || text.toLowerCase().includes(q);
          label.style.display = ok ? 'inline-flex' : 'none';
          label.style.alignItems = 'center';
          label.style.gap = '6px';
          if (ok) visible++;
        });
        count.textContent = visible + ' / ' + all.length + ' 个标签';
      }
      inp.addEventListener('input', apply);
      new MutationObserver(apply).observe(taglabel, { childList: true, subtree: true });
      setTimeout(apply, 100);
    }
    wire();
  }

  /* ============================================================
     ③ 顶部进度条 + 回顶部按钮（原 script 逻辑）
     ============================================================ */
  function initProgressBar() {
    var bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0%;background:#0969da;z-index:9999;transition:width 0.1s';
    document.body.appendChild(bar);

    var progWrap = document.createElement('div');
    progWrap.style.cssText = 'position:fixed;bottom:24px;right:24px;width:52px;cursor:pointer;z-index:999;display:none;transition:transform 0.3s;text-align:center';
    progWrap.onmouseover = function () { this.style.transform = 'scale(1.1)'; };
    progWrap.onmouseout  = function () { this.style.transform = 'scale(1)'; };
    progWrap.innerHTML =
      '<svg viewBox="0 0 44 44" style="width:44px;height:44px;transform:rotate(-90deg);border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.2);display:block;margin:0 auto">' +
        '<circle cx="22" cy="22" r="20" fill="#fff" stroke="#e8e8e8" stroke-width="4"></circle>' +
        '<circle id="prog-circ" cx="22" cy="22" r="20" fill="transparent" stroke="#0969da" stroke-width="4" stroke-dasharray="125.6" stroke-dashoffset="125.6" stroke-linecap="round" style="transition:stroke-dashoffset 0.1s"></circle>' +
      '</svg>' +
      '<span style="position:absolute;top:11px;left:50%;transform:translateX(-50%);color:#0969da;font-size:12px;font-weight:bold;font-family:monospace">↑</span>' +
      '<span id="prog-pct" style="display:block;font-size:11px;color:#8250df;font-weight:bold;margin-top:3px;font-family:monospace">0%</span>';
    document.body.appendChild(progWrap);
    progWrap.onclick = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };

    window.addEventListener('scroll', function () {
      var st  = window.scrollY || document.documentElement.scrollTop;
      var dh  = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var pct = dh > 0 ? Math.round(st / dh * 100) : 0;
      bar.style.width = pct + '%';
      if (st > 300) {
        progWrap.style.display = 'block';
        var circ = document.getElementById('prog-circ');
        if (circ) circ.style.strokeDashoffset = 125.6 - (125.6 * pct / 100);
        var pctEl = document.getElementById('prog-pct');
        if (pctEl) pctEl.textContent = pct + '%';
      } else {
        progWrap.style.display = 'none';
      }
    });
  }

  /* ============================================================
     ④ 代码块增强：macOS 圆点 + 复制 + 折叠 + 全屏（单击或双击）
        macOS 圆点已由纯 CSS 实现，JS 负责按钮交互
     ============================================================ */
  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallback(text, done); });
    } else {
      fallback(text, done);
    }
  }

  function fallback(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
    done();
  }

  function initCodeBlocks() {
    document.querySelectorAll('#postBody pre').forEach(function (pre) {
      if (pre.querySelector('.code-toolbar-btn')) return;
      var code = pre.querySelector('code');
      if (!code) return;
      pre.style.position = 'relative';

      /* 复制按钮 */
      var btnCopy = document.createElement('button');
      btnCopy.type = 'button';
      btnCopy.className = 'code-toolbar-btn btn-copy';
      btnCopy.textContent = '复制';
      btnCopy.title = '复制代码';
      btnCopy.addEventListener('click', function (e) {
        e.stopPropagation();
        playSfx('click');
        copyText(code.innerText || code.textContent || '', function () {
          btnCopy.textContent = '已复制 ✓';
          btnCopy.classList.add('is-done');
          setTimeout(function () {
            btnCopy.textContent = '复制';
            btnCopy.classList.remove('is-done');
          }, 1500);
        });
      });

      /* 折叠按钮 */
      var btnFold = document.createElement('button');
      btnFold.type = 'button';
      btnFold.className = 'code-toolbar-btn btn-fold';
      btnFold.textContent = '折叠';
      btnFold.title = '折叠/展开代码';
      btnFold.addEventListener('click', function (e) {
        e.stopPropagation();
        playSfx('click');
        if (pre.classList.contains('is-folded')) {
          pre.classList.remove('is-folded');
          btnFold.textContent = '折叠';
          btnFold.classList.remove('folded');
        } else {
          pre.classList.add('is-folded');
          btnFold.textContent = '展开';
          btnFold.classList.add('folded');
        }
      });

      /* 全屏按钮（🔍 放大镜） */
      var btnExpand = document.createElement('button');
      btnExpand.type = 'button';
      btnExpand.className = 'code-toolbar-btn btn-expand';
      btnExpand.textContent = '⛶';
      btnExpand.title = '全屏沉浸阅读（也可双击代码块）';
      function toggleFullscreen() {
        playSfx('sci');
        if (pre.classList.contains('code-fullscreen')) {
          pre.classList.remove('code-fullscreen');
          btnExpand.textContent = '⛶';
          btnExpand.title = '全屏沉浸阅读';
        } else {
          pre.classList.add('code-fullscreen');
          btnExpand.textContent = '✕';
          btnExpand.title = '退出全屏';
        }
      }
      btnExpand.addEventListener('click', function (e) { e.stopPropagation(); toggleFullscreen(); });

      /* 双击代码块也可全屏 */
      pre.addEventListener('dblclick', function (e) {
        if (e.target === btnCopy || e.target === btnFold || e.target === btnExpand) return;
        toggleFullscreen();
      });

      /* ESC 退出全屏 */
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && pre.classList.contains('code-fullscreen')) {
          pre.classList.remove('code-fullscreen');
          btnExpand.textContent = '⛶';
        }
      });

      pre.appendChild(btnCopy);
      pre.appendChild(btnFold);
      pre.appendChild(btnExpand);
    });
  }

  /* ============================================================
     ⑤ Web Audio API — 音效系统
     ============================================================ */
  var _audioCtx = null;
  function getAudioCtx() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    return _audioCtx;
  }

  function playSfx(type) {
    var ctx = getAudioCtx();
    if (!ctx) return;
    /* 使用 localStorage 存储音效开关 */
    var sfxOn = localStorage.getItem('luliy-sfx') !== '0';
    if (!sfxOn) return;

    try {
      if (type === 'click') {
        /* 机械键帽声 */
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.06);
      } else if (type === 'sci') {
        /* 科幻反馈音 */
        var osc2 = ctx.createOscillator();
        var gain2 = ctx.createGain();
        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        osc2.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.22);
        gain2.gain.setValueAtTime(0.06, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.25);
      } else if (type === 'type') {
        /* 输入框打字声（非常轻） */
        var buf = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
        var ch  = buf.getChannelData(0);
        for (var i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * 0.012;
        var src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start();
      } else if (type === 'theme') {
        /* 主题切换音 */
        [0, 0.08, 0.16].forEach(function (delay, idx) {
          var o = ctx.createOscillator();
          var g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = 'sine';
          var freq = [523, 659, 784][idx];
          o.frequency.setValueAtTime(freq, ctx.currentTime + delay);
          g.gain.setValueAtTime(0.05, ctx.currentTime + delay);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.18);
          o.start(ctx.currentTime + delay);
          o.stop(ctx.currentTime + delay + 0.18);
        });
      }
    } catch (e) {}
  }

  function initSfxToggle() {
    /* 确保有初始值 */
    if (localStorage.getItem('luliy-sfx') === null) {
      localStorage.setItem('luliy-sfx', '1');
    }
    /* 给所有按钮绑定 click 音效 */
    document.addEventListener('click', function (e) {
      var t = e.target;
      var isBtn = t.tagName === 'BUTTON' || t.tagName === 'A' ||
                  t.classList.contains('Label') || t.closest('button') || t.closest('a');
      if (isBtn) playSfx('click');
    }, true);

    /* 输入框打字音效 */
    document.addEventListener('keydown', function (e) {
      if (/input|textarea/i.test((e.target || {}).tagName || '')) {
        playSfx('type');
      }
    }, true);

    /* 悬浮音效开关徽标 */
    var badge = document.createElement('div');
    badge.id = 'luliy-sfx-badge';
    badge.textContent = '🔊 音效已开启';
    document.body.appendChild(badge);

    function showBadge(msg) {
      badge.textContent = msg;
      badge.classList.add('show');
      clearTimeout(badge._t);
      badge._t = setTimeout(function () { badge.classList.remove('show'); }, 1600);
    }

    /* 长按 ✨ 按钮（如存在）3 秒可切换音效 — 由 fxBtn 挂载后绑定 */
    window._luliyShowBadge = showBadge;
  }

  /* ============================================================
     ⑥ 黑洞量子粒子背景（Canvas + 物理引擎）
     ============================================================ */
  function initParticles() {
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
    window.addEventListener('resize', resize);

    var PARTICLE_COUNT = 80;
    var CONNECT_DIST   = 140;
    var ATTRACT_DIST   = 220;
    var ATTRACT_FORCE  = 0.018;
    var REPEL_DIST     = 60;

    var mouse = { x: -9999, y: -9999, active: false };

    document.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    });
    document.addEventListener('mouseleave', function () { mouse.active = false; });

    var particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x:  Math.random() * window.innerWidth,
        y:  Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r:  Math.random() * 2.2 + 0.8,
        hue: Math.floor(Math.random() * 60) + 240  /* 蓝紫色段 */
      });
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);

      /* 判断暗色模式 */
      var dark = document.documentElement.getAttribute('data-color-mode') === 'dark';
      var baseAlpha = dark ? 0.7 : 0.45;

      particles.forEach(function (p) {
        /* 黑洞引力 */
        if (mouse.active) {
          var dx = mouse.x - p.x;
          var dy = mouse.y - p.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < ATTRACT_DIST && dist > REPEL_DIST) {
            var force = ATTRACT_FORCE * (1 - dist / ATTRACT_DIST);
            p.vx += dx / dist * force;
            p.vy += dy / dist * force;
          } else if (dist <= REPEL_DIST) {
            /* 太近时轻微排斥，防止堆叠 */
            p.vx -= dx / dist * 0.04;
            p.vy -= dy / dist * 0.04;
          }
        }

        /* 速度阻尼 */
        p.vx *= 0.98;
        p.vy *= 0.98;
        /* 最大速度限制 */
        var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 3) { p.vx = p.vx / speed * 3; p.vy = p.vy / speed * 3; }

        p.x += p.vx;
        p.y += p.vy;

        /* 边界回弹 */
        if (p.x < 0)  { p.x = 0;  p.vx *= -1; }
        if (p.x > W)  { p.x = W;  p.vx *= -1; }
        if (p.y < 0)  { p.y = 0;  p.vy *= -1; }
        if (p.y > H)  { p.y = H;  p.vy *= -1; }

        /* 绘制粒子 */
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + p.hue + ',80%,65%,' + baseAlpha + ')';
        ctx.fill();
      });

      /* 连线 */
      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var pa = particles[a], pb = particles[b];
          var ddx = pa.x - pb.x, ddy = pa.y - pb.y;
          var d2 = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d2 < CONNECT_DIST) {
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            var alpha = (1 - d2 / CONNECT_DIST) * (dark ? 0.3 : 0.18);
            ctx.strokeStyle = 'hsla(260,70%,65%,' + alpha + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      /* 鼠标光晕 */
      if (mouse.active) {
        var grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 80);
        grad.addColorStop(0, 'rgba(130,80,223,0.22)');
        grad.addColorStop(1, 'rgba(130,80,223,0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ============================================================
     ⑦ 暗色模式切换波纹动画
     ============================================================ */
  function initThemeRipple() {
    /* 监听 Gmeek 的主题切换按钮 */
    function hookThemeBtn() {
      var btn = document.querySelector('.circle[id*="theme"], button[onclick*="theme"], #themeButton, [data-toggle-theme]');
      if (!btn && document.querySelector('.title-right')) {
        /* Gmeek 的圆形按钮集合 */
        var circles = document.querySelectorAll('.title-right .circle');
        circles.forEach(function (el) { tryHook(el); });
      }
      if (btn) tryHook(btn);
    }

    function tryHook(btn) {
      if (btn._luliyHooked) return;
      btn._luliyHooked = true;
      btn.addEventListener('click', function () {
        playSfx('theme');
        triggerRipple();
      });
    }

    function triggerRipple() {
      var old = document.getElementById('luliy-theme-ripple');
      if (old) old.remove();

      var cx = window.innerWidth  / 2;
      var cy = window.innerHeight / 2;
      var maxR = Math.sqrt(cx * cx + cy * cy) * 2.2;

      var ripple = document.createElement('div');
      ripple.id = 'luliy-theme-ripple';
      var isDark = document.documentElement.getAttribute('data-color-mode') === 'dark';
      var color  = isDark ? 'rgba(10,20,40,0.96)' : 'rgba(255,255,255,0.96)';

      ripple.style.cssText =
        'position:fixed;top:' + cy + 'px;left:' + cx + 'px;' +
        'width:0;height:0;margin:0;border-radius:50%;' +
        'background:' + color + ';' +
        'pointer-events:none;z-index:99998;' +
        'transform:translate(-50%,-50%) scale(0);' +
        'transition:transform 0.65s cubic-bezier(.4,0,.2,1),opacity 0.65s ease;';

      document.body.appendChild(ripple);

      /* 强制重排再触发动画 */
      ripple.getBoundingClientRect();
      var diameter = maxR * 2;
      ripple.style.width  = diameter + 'px';
      ripple.style.height = diameter + 'px';
      ripple.style.transform = 'translate(-50%,-50%) scale(1)';
      ripple.style.opacity = '0';

      setTimeout(function () { ripple.remove(); }, 700);
    }

    /* Gmeek 的按钮可能在 DOMContentLoaded 后才渲染 */
    setTimeout(hookThemeBtn, 600);
    document.addEventListener('click', function (e) {
      /* 若点击了任何含 moon/sun 图标的按钮 */
      var t = e.target.closest('button');
      if (t && (t.innerHTML.includes('Moon') || t.innerHTML.includes('Sun') ||
                t.title && /dark|light|theme|主题/i.test(t.title))) {
        playSfx('theme');
        triggerRipple();
      }
    });
  }

  /* ============================================================
     ⑧ 文章页功能（原 script 逻辑：代码语言标签、外链、图片、
        阅读时间、标题复制、赞赏面板、上下篇导航、TOC 高亮）
     ============================================================ */
  function initPostFeatures() {
    var pbody = document.getElementById('postBody');

    /* 代码语言标签 + 全屏按钮（已整合进 initCodeBlocks，此处跳过） */

    /* 外链新标签页 */
    document.querySelectorAll('a[href^="http"]').forEach(function (a) {
      if (!a.href.includes('luliy6.github.io')) a.target = '_blank';
    });

    /* 图片懒加载 */
    if (pbody) {
      pbody.querySelectorAll('img').forEach(function (img) { img.loading = 'lazy'; });
    }

    if (!pbody) return;

    /* 阅读时间 + 字数 */
    var wc   = pbody.innerText.length;
    var mins = Math.max(1, Math.round(wc / 300));
    var rtag = document.createElement('p');
    rtag.innerHTML = '预计阅读：约 ' + mins + ' 分钟 &nbsp;|&nbsp; 共 ' + wc + ' 字';
    rtag.style.cssText = 'color:#888;font-size:13px;margin-bottom:1.5rem';
    pbody.insertBefore(rtag, pbody.firstChild);

    /* 标题点击复制链接 */
    pbody.querySelectorAll('h1,h2,h3').forEach(function (h) {
      h.style.cursor = 'pointer';
      h.title = '点击复制链接';
      h.onclick = function () {
        var url = location.href.split('#')[0] + '#' + h.id;
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        var tip = document.createElement('span');
        tip.textContent = ' 已复制!';
        tip.style.cssText = 'font-size:12px;color:#1f883d;font-weight:normal';
        h.appendChild(tip);
        setTimeout(function () { tip.remove(); }, 2000);
      };
    });

    /* 赞赏面板 */
    var spBox = document.createElement('div');
    spBox.style.cssText = 'margin-top:50px;text-align:center';
    var spBtn = document.createElement('button');
    spBtn.innerHTML = '✨ 和作者无限进步';
    spBtn.style.cssText = 'padding:12px 28px;border-radius:30px;border:none;background:linear-gradient(90deg,#f0b429,#ff6b9d);color:#fff;font-weight:bold;font-size:15px;cursor:pointer;box-shadow:0 4px 15px rgba(240,180,41,0.3);transition:transform 0.3s';
    var qrP = document.createElement('div');
    qrP.innerHTML = '<p style="font-size:13px;color:#888;margin:10px 0">无限进步，进步有你！</p>' +
      '<img src="https://raw.githubusercontent.com/luliy6/img/refs/heads/main/me.jpg" alt="赞赏码" style="width:180px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1)">';
    qrP.style.cssText = 'height:0;overflow:hidden;transition:height 0.4s ease,opacity 0.4s ease;opacity:0';
    spBtn.onmouseover = function () { spBtn.style.transform = 'translateY(-2px)'; };
    spBtn.onmouseout  = function () { spBtn.style.transform = 'none'; };
    spBtn.onclick = function () {
      if (qrP.style.height === '0px' || !qrP.style.height) {
        qrP.style.height = '260px'; qrP.style.opacity = '1';
      } else {
        qrP.style.height = '0px'; qrP.style.opacity = '0';
      }
    };
    spBox.appendChild(spBtn);
    spBox.appendChild(qrP);

    /* 上一篇/下一篇 */
    fetch('/postList.json')
      .then(function (r) { return r.json(); })
      .then(function (posts) {
        var cur = location.pathname.replace(/\/$/, '');
        var idx = posts.findIndex(function (p) {
          return p.link && p.link.replace(/\/$/, '') === cur;
        });
        if (idx < 0) return;
        var nav  = document.createElement('div');
        nav.style.cssText = 'display:flex;justify-content:space-between;gap:16px;margin-top:40px;padding-top:20px;border-top:2px dashed rgba(9,105,218,0.2)';
        var prev = idx + 1 < posts.length ? posts[idx + 1] : null;
        var next = idx - 1 >= 0          ? posts[idx - 1] : null;
        function makeNavBtn(post, label, align) {
          if (!post) return document.createElement('div');
          var a = document.createElement('a');
          a.href = post.link;
          a.style.cssText = 'flex:1;padding:14px 18px;border-radius:12px;background:rgba(9,105,218,0.05);border:1px solid rgba(9,105,218,0.15);text-decoration:none;transition:all 0.25s;text-align:' + align;
          a.innerHTML = '<span style="display:block;font-size:11px;color:#888;margin-bottom:4px">' + label + '</span>' +
            '<span style="color:#0969da;font-weight:bold;font-size:14px">' + post.title + '</span>';
          a.onmouseover = function () { a.style.background = 'rgba(9,105,218,0.12)'; a.style.transform = 'translateY(-2px)'; };
          a.onmouseout  = function () { a.style.background = 'rgba(9,105,218,0.05)'; a.style.transform = ''; };
          return a;
        }
        nav.appendChild(makeNavBtn(prev, '⬅ 上一篇', 'left'));
        nav.appendChild(makeNavBtn(next, '下一篇 ➡', 'right'));
        pbody.appendChild(nav);
      })
      .catch(function () {});

    pbody.appendChild(spBox);

    /* TOC 高亮 */
    var tocTimer = null;
    var heads = Array.from(pbody.querySelectorAll('h2,h3'));
    if (heads.length) {
      window.addEventListener('scroll', function () {
        if (tocTimer) clearTimeout(tocTimer);
        tocTimer = setTimeout(function () {
          var scrollY = window.scrollY || document.documentElement.scrollTop;
          var cur = null;
          heads.forEach(function (h) { if (scrollY >= h.offsetTop - 120) cur = h; });
          var tocLinks = document.querySelectorAll('.toc a,.markdown-toc a,[class*="toc"] a');
          var isDark = document.documentElement.getAttribute('data-color-mode') === 'dark';
          tocLinks.forEach(function (a) {
            var href    = a.getAttribute('href');
            var matched = cur && href && href === '#' + cur.id;
            a.style.color      = matched ? '#ff9a3c' : (isDark ? '#ccc' : '');
            a.style.fontWeight = matched ? 'bold'    : '';
            a.style.transition = 'color 0.2s';
          });
        }, 50);
      });
    }

    /* TOC 点击平滑滚动（解决中文编码） */
    document.addEventListener('click', function (e) {
      var tocLink = e.target.closest('.toc a,.markdown-toc a,#markdown-toc a,[class*="toc"] a');
      if (tocLink) {
        var href = tocLink.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          try {
            var targetId = decodeURIComponent(href.substring(1));
            var targetEl = document.getElementById(targetId);
            if (targetEl) {
              window.scrollTo({ top: targetEl.offsetTop - 90, behavior: 'smooth' });
              history.pushState(null, null, href);
            }
          } catch (err) { console.warn('TOC scroll error:', err); }
        }
      }
    });
  }

  /* ============================================================
     ⑨ 动态网页标题（原 script）
     ============================================================ */
  function initDynamicTitle() {
    var oriT = document.title;
    var tTime;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        document.title = '👀 别走呀，我还在进步！';
        clearTimeout(tTime);
      } else {
        document.title = '✨ 欢迎回来！ ' + oriT;
        tTime = setTimeout(function () { document.title = oriT; }, 2000);
      }
    });
  }

  /* ============================================================
     ⑩ 运行时间计数器（原 script）
     ============================================================ */
  function initUptime() {
    var upE = document.createElement('div');
    upE.style.cssText = 'text-align:center;font-size:13px;color:#888;padding:10px 0;margin-top:20px';
    document.body.appendChild(upE);
    var stDate = new Date('2026/05/30 00:00:00').getTime();
    function updateUptime() {
      var n = Date.now();
      var d = n - stDate;
      if (d < 0) { upE.innerHTML = '🚀 博客即将上线，敬请期待...'; return; }
      var days = Math.floor(d / 86400000);
      var hh   = Math.floor((d % 86400000) / 3600000);
      var mm   = Math.floor((d % 3600000) / 60000);
      var ss   = Math.floor((d % 60000) / 1000);
      upE.innerHTML = '🌱 本站已陪伴你无限进步：' + days + '天 ' + hh + '小时 ' + mm + '分 ' +
        '<span style="color:#ff4444;font-weight:bold;font-family:monospace">' + ss + '</span>秒';
    }
    updateUptime();
    setInterval(updateUptime, 1000);
  }

  /* ============================================================
     ⑪ 首页功能（原 indexScript）
     ============================================================ */
  function initIndexFeatures() {
    /* 只在首页执行（无 postBody，或有 post-list） */
    var m = document.querySelector('.container-lg');

    /* 公告栏 */
    if (m) {
      var a = document.createElement('div');
      a.className = 'announce-bar';
      a.innerHTML = '📢 欢迎来到 Luliy 的博客！—— 记录点滴，我将无限进步！';
      m.insertBefore(a, m.firstChild);
    }

    /* Hero 区 */
    var hero = document.createElement('div');
    hero.id = 'site-hero';
    hero.innerHTML =
      '<div style="text-align:center;padding:56px 20px 40px;background:linear-gradient(135deg,#0d1b2a 0%,#1a2a4a 40%,#8250df 100%);border-radius:18px;margin-bottom:32px;position:relative;overflow:hidden">' +
        '<div style="position:absolute;inset:0;background:url(\'data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\') repeat;opacity:0.6"></div>' +
        '<h1 style="font-size:3rem;font-weight:900;color:#fff;margin:0 0 12px;letter-spacing:2px;position:relative;text-shadow:0 4px 20px rgba(0,0,0,0.4)">✦ Luliy ✦</h1>' +
        '<p style="font-size:1.1rem;color:rgba(255,255,255,0.8);margin:0 0 28px;position:relative;letter-spacing:1px">我将无限进步 · 记录点滴 · 持续成长</p>' +
        '<a href="#post-list" style="display:inline-block;padding:12px 32px;background:linear-gradient(90deg,#f0b429,#ff6b9d);color:#fff;font-weight:bold;border-radius:30px;text-decoration:none;font-size:15px;position:relative;box-shadow:0 4px 20px rgba(240,180,41,0.4);transition:transform 0.2s" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'\'">🚀 开始阅读</a>' +
      '</div>';
    if (m) m.insertBefore(hero, m.children[1] || m.firstChild);

    /* 时钟 */
    var heroClock = document.createElement('div');
    heroClock.id = 'hero-clock';
    heroClock.style.cssText = 'font-size:26px;color:#ff4444;font-weight:bold;font-family:monospace;margin-bottom:18px;letter-spacing:4px;text-shadow:0 2px 8px rgba(255,68,68,0.4)';
    function updateClock() {
      var now = new Date();
      var h  = String(now.getHours()).padStart(2, '0');
      var mi = String(now.getMinutes()).padStart(2, '0');
      heroClock.textContent = h + ':' + mi;
    }
    updateClock();
    setInterval(updateClock, 1000);
    var heroInner = document.querySelector('#site-hero div');
    if (heroInner) { var h1el = heroInner.querySelector('h1'); if (h1el) heroInner.insertBefore(heroClock, h1el); }

    /* 一言 */
    var hBox = document.createElement('div');
    hBox.className = 'hitokoto-bar';
    hBox.textContent = '正在加载今日一言...';
    if (m) m.insertBefore(hBox, document.getElementById('site-hero').nextSibling);
    fetch('https://v1.hitokoto.cn/?c=b&c=d&c=h&c=i&c=k&encode=json')
      .then(function (r) { return r.json(); })
      .then(function (d) { hBox.textContent = d.hitokoto + (d.from ? '  ——《' + d.from + '》' : ''); })
      .catch(function () { hBox.textContent = '每一天都是新的进步 🌱'; });

    /* 头像点击 */
    var av = document.querySelector('.avatar');
    if (av) { av.style.cursor = 'pointer'; av.onclick = function () { window.location.href = '/about.html'; }; }

    /* 文章列表：动画 + 日期图标 + 封面缩略图 */
    var postList = document.querySelector('.post-list') || document.querySelector('.postList');
    if (postList) postList.id = 'post-list';
    var gradients = [
      'linear-gradient(135deg,#8250df,#f0b429)', 'linear-gradient(135deg,#0969da,#34d399)',
      'linear-gradient(135deg,#ff6b9d,#ffcd3c)', 'linear-gradient(135deg,#6bceff,#8250df)',
      'linear-gradient(135deg,#34d399,#0969da)', 'linear-gradient(135deg,#f0b429,#ff6b9d)'
    ];
    var items = document.querySelectorAll('.post-item');
    items.forEach(function (el, i) {
      el.style.animationDelay = (i * 0.07) + 's';
      var d2 = el.querySelector('span.color-fg-muted');
      if (d2 && !d2.innerHTML.includes('📅')) d2.innerHTML = '📅 ' + d2.innerHTML;
      var inner = document.createElement('div');
      inner.className = 'post-item-body';
      while (el.firstChild) inner.appendChild(el.firstChild);
      var titleLink = inner.querySelector('a[href]');
      var thumb = document.createElement('div');
      thumb.className = 'post-item-thumb-placeholder';
      thumb.style.cssText = 'width:100%;height:160px;border-radius:10px 10px 0 0;display:block;background:' +
        gradients[i % gradients.length] + ';position:relative;overflow:hidden';
      var thumbEmoji = document.createElement('span');
      thumbEmoji.textContent = ['✨','🚀','📖','💡','🌱','🎯','🔥','💎'][i % 8];
      thumbEmoji.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:48px;opacity:0.5';
      thumb.appendChild(thumbEmoji);
      el.appendChild(thumb);
      el.appendChild(inner);
      if (titleLink) {
        (function (link, thumbEl) {
          fetch(link.href)
            .then(function (r) { return r.text(); })
            .then(function (html) {
              var doc = new DOMParser().parseFromString(html, 'text/html');
              var img = doc.querySelector('#postBody img');
              if (img && img.src) {
                var realImg = document.createElement('img');
                realImg.src = img.src;
                realImg.className = 'post-item-thumb';
                realImg.style.cssText = 'width:100%;height:160px;object-fit:cover;border-radius:10px 10px 0 0;display:block';
                realImg.onload = function () { thumbEl.replaceWith(realImg); };
              }
            })
            .catch(function () {});
        })(titleLink, thumb);
      }
    });

    /* 副标题打字机 */
    var el2 = document.querySelector('.blogTitle p') || document.querySelector('p.f4');
    if (el2) {
      var txt = el2.textContent;
      el2.textContent = '';
      var idx = 0;
      (function type() { if (idx < txt.length) { el2.textContent += txt[idx++]; setTimeout(type, 60); } })();
    }

    /* 樱花飘落 */
    var canvas2 = document.createElement('canvas');
    canvas2.id = 'petals-canvas';
    canvas2.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9998;display:none';
    document.body.appendChild(canvas2);
    var ctx2 = canvas2.getContext('2d');
    canvas2.width  = window.innerWidth;
    canvas2.height = window.innerHeight;
    window.addEventListener('resize', function () { canvas2.width = window.innerWidth; canvas2.height = window.innerHeight; });
    var petals = [];
    for (var p = 0; p < 38; p++) {
      petals.push({
        x: Math.random() * canvas2.width, y: Math.random() * canvas2.height,
        r: Math.random() * 7 + 4, speed: Math.random() * 1.2 + 0.4,
        drift: Math.random() * 0.8 - 0.4, opacity: Math.random() * 0.5 + 0.3,
        color: Math.random() > 0.5 ? '#ffb7c5' : '#fff'
      });
    }
    var petalRunning = false;
    var petalRAF = null;
    function drawPetal(pt) {
      ctx2.save(); ctx2.globalAlpha = pt.opacity;
      ctx2.beginPath(); ctx2.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx2.fillStyle = pt.color; ctx2.fill(); ctx2.restore();
    }
    function animatePetals() {
      if (!petalRunning) return;
      ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
      petals.forEach(function (pt) {
        drawPetal(pt); pt.y += pt.speed; pt.x += pt.drift;
        if (pt.y > canvas2.height + 10) { pt.y = -10; pt.x = Math.random() * canvas2.width; }
      });
      petalRAF = requestAnimationFrame(animatePetals);
    }

    /* 特效开关按钮 */
    var fxBtn = document.createElement('button');
    fxBtn.textContent = '✨';
    fxBtn.title = '开/关樱花特效 | 长按3秒切换音效';
    fxBtn.style.cssText = 'position:fixed;bottom:24px;left:16px;padding:0;border:none;background:none;font-size:24px;cursor:pointer;z-index:9999;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));transition:transform 0.2s,filter 0.2s';
    fxBtn.onmouseover = function () { fxBtn.style.transform = 'scale(1.3)'; };
    fxBtn.onmouseout  = function () { fxBtn.style.transform = 'scale(1)'; };
    document.body.appendChild(fxBtn);

    fxBtn.onclick = function () {
      if (petalRunning) {
        petalRunning = false;
        if (petalRAF) cancelAnimationFrame(petalRAF);
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
        canvas2.style.display = 'none';
        fxBtn.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3)) grayscale(1)';
      } else {
        canvas2.style.display = '';
        petalRunning = true;
        animatePetals();
        fxBtn.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';
      }
    };

    /* 长按 3 秒切换音效（利用 localStorage） */
    var pressTimer = null;
    fxBtn.addEventListener('mousedown', function () {
      pressTimer = setTimeout(function () {
        var cur = localStorage.getItem('luliy-sfx') !== '0';
        localStorage.setItem('luliy-sfx', cur ? '0' : '1');
        if (window._luliyShowBadge) window._luliyShowBadge(cur ? '🔇 音效已关闭' : '🔊 音效已开启');
      }, 3000);
    });
    fxBtn.addEventListener('mouseup',   function () { clearTimeout(pressTimer); });
    fxBtn.addEventListener('mouseleave',function () { clearTimeout(pressTimer); });

    /* 点击粒子 */
    document.addEventListener('click', function (e) {
      for (var b = 0; b < 18; b++) {
        (function () {
          var spark  = document.createElement('div');
          var angle  = Math.random() * 360;
          var dist   = Math.random() * 60 + 20;
          var colors = ['#ff6b9d','#ffcd3c','#6bceff','#a78bfa','#34d399'];
          spark.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;width:7px;height:7px;border-radius:50%;background:' + colors[Math.floor(Math.random() * colors.length)] + ';pointer-events:none;z-index:9999;transition:transform 0.6s ease,opacity 0.6s ease;transform:translate(-50%,-50%)';
          document.body.appendChild(spark);
          setTimeout(function () {
            spark.style.transform = 'translate(calc(-50% + ' + (Math.cos(angle * Math.PI / 180) * dist) + 'px),calc(-50% + ' + (Math.sin(angle * Math.PI / 180) * dist) + 'px))';
            spark.style.opacity = '0';
          }, 0);
          setTimeout(function () { spark.remove(); }, 700);
        })();
      }
    });

    /* 彩带纸屑（仅首次加载） */
    var confettiDone = false;
    if (!sessionStorage.getItem('luliy-confetti-done')) {
      sessionStorage.setItem('luliy-confetti-done', '1');
      var confettiCanvas = document.createElement('canvas');
      confettiCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10000';
      confettiCanvas.width  = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
      document.body.appendChild(confettiCanvas);
      var cctx = confettiCanvas.getContext('2d');
      var confettiColors = ['#ff6b9d','#ffcd3c','#6bceff','#a78bfa','#34d399','#ff9a3c','#f06'];
      var confettiArr = [];
      for (var ci = 0; ci < 120; ci++) {
        confettiArr.push({
          x: Math.random() * confettiCanvas.width,
          y: -20 - Math.random() * confettiCanvas.height * 0.5,
          w: Math.random() * 12 + 4, h: Math.random() * 6 + 3,
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          speed: Math.random() * 4 + 2, drift: Math.random() * 3 - 1.5,
          rot: Math.random() * 360, rotSpeed: Math.random() * 6 - 3, opacity: 1
        });
      }
      function drawConfetti() {
        if (confettiDone) { cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); confettiCanvas.remove(); return; }
        cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        var allOut = true;
        confettiArr.forEach(function (c) {
          if (c.y < confettiCanvas.height + 20) allOut = false;
          cctx.save(); cctx.globalAlpha = Math.max(0, c.opacity);
          cctx.translate(c.x, c.y); cctx.rotate(c.rot * Math.PI / 180);
          cctx.fillStyle = c.color; cctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
          cctx.restore();
          c.y += c.speed; c.x += c.drift; c.rot += c.rotSpeed;
          if (c.y > confettiCanvas.height * 0.7) c.opacity -= 0.02;
        });
        if (allOut) confettiDone = true;
        requestAnimationFrame(drawConfetti);
      }
      drawConfetti();
    }

    /* 归档页时间轴 */
    if (location.pathname.includes('archive')) {
      var pb2 = document.getElementById('postBody');
      if (pb2) {
        pb2.innerHTML = '<p style="color:#888;font-size:14px">正在加载归档...</p>';
        fetch('/postList.json')
          .then(function (r) { return r.json(); })
          .then(function (posts) {
            var byYear = {};
            posts.forEach(function (pp) {
              var y = pp.created ? pp.created.slice(0, 4) : (pp.date ? pp.date.slice(0, 4) : '未知');
              if (!byYear[y]) byYear[y] = [];
              byYear[y].push(pp);
            });
            var years = Object.keys(byYear).sort(function (a, b) { return b - a; });
            var html = '<h1 style="color:#0969da;border-bottom:2px solid #0969da;padding-bottom:10px;margin-bottom:30px">📅 文章归档</h1>';
            years.forEach(function (y) {
              html += '<div class="tl-year">' + y + ' 年</div><ul class="tl-list">';
              byYear[y].forEach(function (pp) {
                var dateStr = pp.created || pp.date || '';
                var md = dateStr.slice(5, 10).replace('-', '/');
                html += '<li class="tl-item"><a href="' + pp.link + '">' + pp.title + '</a><span class="tl-date">' + md + '</span></li>';
              });
              html += '</ul>';
            });
            pb2.innerHTML = html;
          })
          .catch(function () { pb2.innerHTML = '<p style="color:#e74c3c">归档加载失败，请刷新重试</p>'; });
      }
    }
  }

  /* ============================================================
     ⑫ localStorage 管理器（集中初始化所有持久化数据）
     ============================================================ */
  function initLocalStorage() {
    /* 默认值表 */
    var defaults = {
      'luliy-sfx':       '1',   /* 音效开关：'1'=开 '0'=关 */
      'luliy-particles': '1',   /* 粒子背景：'1'=开 '0'=关 */
      'luliy-petals-on': '0'    /* 樱花初始状态（每次刷新默认关） */
    };
    Object.keys(defaults).forEach(function (k) {
      if (localStorage.getItem(k) === null) {
        localStorage.setItem(k, defaults[k]);
      }
    });
  }

  /* ============================================================
     主入口
     ============================================================ */
  /* 粒子背景可在 DOM 解析前就插入 canvas，视觉更流畅 */
  initLocalStorage();
  if (localStorage.getItem('luliy-particles') !== '0') {
    if (document.body) {
      initParticles();
    } else {
      document.addEventListener('DOMContentLoaded', initParticles);
    }
  }

  ready(function () {
    initSearch();
    initTagEnhance();
    initProgressBar();
    initDynamicTitle();
    initUptime();
    initSfxToggle();
    initThemeRipple();

    /* 文章页才初始化代码块和文章功能 */
    if (document.getElementById('postBody')) {
      initCodeBlocks();
      initPostFeatures();
    }

    /* 首页功能（有 .post-item 的页面） */
    if (document.querySelector('.post-item') || location.pathname === '/' ||
        location.pathname.endsWith('index.html') || location.pathname.includes('archive')) {
      initIndexFeatures();
    }
  });

})();
