/* ============================================================
   enhance.js — Luliy Blog · 全站通用增强脚本
   加载位置：allHead（每页 <head>）
   负责：搜索、标签页、进度条、粒子背景、音效、
         主题波纹、动态标题、运行时间、
         文章页代码块功能（由 script 字段二次调用触发）
   ============================================================ */
(function () {
  'use strict';

  /* ── 工具 ── */
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
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
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .catch(function () {
        return fetch('postList.json', { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : []; });
      })
      .then(normalizePosts);
  }

  function textOfPost(p) {
    return [p.title, p.desc, p.created, (p.labels || []).join(' ')].join(' ').toLowerCase();
  }

  /* ── ① localStorage 初始化 ── */
  function initLocalStorage() {
    var defaults = { 'luliy-sfx': '1', 'luliy-particles': '1' };
    Object.keys(defaults).forEach(function (k) {
      if (localStorage.getItem(k) === null) localStorage.setItem(k, defaults[k]);
    });
  }

  /* ── ② 站内搜索 ── */
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
    var input = panel.querySelector('.site-search-input');
    var results = panel.querySelector('.site-search-results');
    var meta = panel.querySelector('.site-search-meta');
    var posts = [], loaded = false;
    function esc(s) {
      return String(s).replace(/[&<>]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
      });
    }
    function render() {
      var q = input.value.trim().toLowerCase();
      var list = q ? posts.filter(function (p) { return textOfPost(p).includes(q); }) : posts.slice(0, 10);
      meta.textContent = (q ? '匹配到 ' + list.length + ' 篇' : '显示最近 ' + list.length + ' 篇') + '，共 ' + posts.length + ' 篇。';
      if (!loaded) { results.innerHTML = '<div class="site-search-empty">正在准备文章索引...</div>'; return; }
      if (!list.length) { results.innerHTML = '<div class="site-search-empty">没有找到匹配内容</div>'; return; }
      results.innerHTML = list.slice(0, 30).map(function (p) {
        var labels = (p.labels || []).slice(0, 6).map(function (t) {
          return '<span class="site-search-tag">' + esc(t) + '</span>';
        }).join('');
        return '<a class="site-search-item" href="' + (p.link || '#') + '">' +
          '<span class="site-search-title">' + esc(p.title || 'Untitled') + '</span>' +
          '<span class="site-search-desc">' + esc(p.desc || p.created || '') + '</span>' +
          (labels ? '<span class="site-search-tags">' + labels + '</span>' : '') + '</a>';
      }).join('');
    }
    function openSearch() {
      panel.classList.add('is-open');
      if (!loaded) {
        fetchPosts().then(function (list) {
          posts = list.sort(function (a, b) { return String(b.created || '').localeCompare(String(a.created || '')); });
          loaded = true; render();
        }).catch(function () { loaded = true; posts = []; render(); });
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
        e.preventDefault(); openSearch();
      }
    });
    var headerSearch = document.getElementById('buttonSearch');
    if (headerSearch) headerSearch.addEventListener('click', function (e) { e.preventDefault(); openSearch(); });
  }

  /* ── ③ 标签页增强 ── */
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
      toolbar.innerHTML = '<input class="tag-enhance-input" type="search" placeholder="筛选标签..." autocomplete="off"><span class="tag-enhance-count">正在统计标签</span>';
      taglabel.parentNode.insertBefore(toolbar, taglabel);
      var inp = toolbar.querySelector('.tag-enhance-input');
      var count = toolbar.querySelector('.tag-enhance-count');
      function labels() { return Array.from(taglabel.querySelectorAll('.Label')); }
      function apply() {
        var q = inp.value.trim().toLowerCase(), visible = 0, all = labels();
        all.forEach(function (label) {
          var ok = !q || label.textContent.replace(/\s+/g, ' ').trim().toLowerCase().includes(q);
          label.style.display = ok ? 'inline-flex' : 'none';
          label.style.alignItems = 'center'; label.style.gap = '6px';
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

  /* ── ④ 顶部进度条 + 回顶部按钮 ── */
  function initProgressBar() {
    var bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0%;background:#0969da;z-index:9999;transition:width 0.1s';
    document.body.appendChild(bar);
    var progWrap = document.createElement('div');
    progWrap.style.cssText = 'position:fixed;bottom:24px;right:24px;width:52px;cursor:pointer;z-index:999;display:none;transition:transform 0.3s;text-align:center';
    progWrap.onmouseover = function () { this.style.transform = 'scale(1.1)'; };
    progWrap.onmouseout = function () { this.style.transform = 'scale(1)'; };
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
      var st = window.scrollY || document.documentElement.scrollTop;
      var dh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var pct = dh > 0 ? Math.round(st / dh * 100) : 0;
      bar.style.width = pct + '%';
      if (st > 300) {
        progWrap.style.display = 'block';
        var circ = document.getElementById('prog-circ');
        if (circ) circ.style.strokeDashoffset = 125.6 - (125.6 * pct / 100);
        var pctEl = document.getElementById('prog-pct');
        if (pctEl) pctEl.textContent = pct + '%';
      } else { progWrap.style.display = 'none'; }
    });
  }

  /* ── ⑤ Web Audio 音效 ── */
  var _audioCtx = null;
  function getAudioCtx() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    return _audioCtx;
  }
  function playSfx(type) {
    var ctx = getAudioCtx();
    if (!ctx || localStorage.getItem('luliy-sfx') === '0') return;
    try {
      if (type === 'click') {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'square';
        o.frequency.setValueAtTime(900, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
        g.gain.setValueAtTime(0.04, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.06);
      } else if (type === 'sci') {
        var o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination); o2.type = 'sine';
        o2.frequency.setValueAtTime(440, ctx.currentTime);
        o2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        o2.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.22);
        g2.gain.setValueAtTime(0.06, ctx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        o2.start(ctx.currentTime); o2.stop(ctx.currentTime + 0.25);
      } else if (type === 'type') {
        var buf = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
        var ch = buf.getChannelData(0);
        for (var i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * 0.012;
        var src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start();
      } else if (type === 'theme') {
        [0, 0.08, 0.16].forEach(function (delay, idx) {
          var ot = ctx.createOscillator(), gt = ctx.createGain();
          ot.connect(gt); gt.connect(ctx.destination); ot.type = 'sine';
          ot.frequency.setValueAtTime([523, 659, 784][idx], ctx.currentTime + delay);
          gt.gain.setValueAtTime(0.05, ctx.currentTime + delay);
          gt.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.18);
          ot.start(ctx.currentTime + delay); ot.stop(ctx.currentTime + delay + 0.18);
        });
      }
    } catch (e) {}
  }
  window._luliySfx = playSfx; /* 暴露给 indexScript / script 字段调用 */

  function initSfxEvents() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t.tagName === 'BUTTON' || t.tagName === 'A' ||
          t.classList.contains('Label') || t.closest('button') || t.closest('a')) {
        playSfx('click');
      }
    }, true);
    document.addEventListener('keydown', function (e) {
      if (/input|textarea/i.test((e.target || {}).tagName || '')) playSfx('type');
    }, true);
    /* 音效状态徽标 */
    var badge = document.createElement('div');
    badge.id = 'luliy-sfx-badge';
    badge.style.cssText = 'position:fixed;bottom:68px;left:16px;font-size:11px;color:#8250df;background:rgba(130,80,223,.12);border:1px solid rgba(130,80,223,.2);border-radius:999px;padding:2px 8px;z-index:9999;pointer-events:none;opacity:0;transition:opacity .4s';
    document.body.appendChild(badge);
    window._luliyShowBadge = function (msg) {
      badge.textContent = msg; badge.style.opacity = '1';
      clearTimeout(badge._t);
      badge._t = setTimeout(function () { badge.style.opacity = '0'; }, 1600);
    };
  }

  /* ── ⑥ 黑洞粒子背景 ── */
  function initParticles() {
    var canvas = document.createElement('canvas');
    canvas.id = 'luliy-particle-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:0;opacity:0.55';
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext('2d');
    var W, H;
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);
    var mouse = { x: -9999, y: -9999, active: false };
    document.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
    document.addEventListener('mouseleave', function () { mouse.active = false; });
    var particles = [];
    for (var i = 0; i < 80; i++) {
      particles.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 2.2 + 0.8, hue: Math.floor(Math.random() * 60) + 240 });
    }
    function tick() {
      ctx.clearRect(0, 0, W, H);
      var dark = document.documentElement.getAttribute('data-color-mode') === 'dark';
      var baseAlpha = dark ? 0.7 : 0.45;
      particles.forEach(function (p) {
        if (mouse.active) {
          var dx = mouse.x - p.x, dy = mouse.y - p.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 220 && dist > 60) {
            var force = 0.018 * (1 - dist / 220);
            p.vx += dx / dist * force; p.vy += dy / dist * force;
          } else if (dist <= 60) { p.vx -= dx / dist * 0.04; p.vy -= dy / dist * 0.04; }
        }
        p.vx *= 0.98; p.vy *= 0.98;
        var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 3) { p.vx = p.vx / speed * 3; p.vy = p.vy / speed * 3; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) { p.x = 0; p.vx *= -1; } if (p.x > W) { p.x = W; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; } if (p.y > H) { p.y = H; p.vy *= -1; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + p.hue + ',80%,65%,' + baseAlpha + ')'; ctx.fill();
      });
      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var pa = particles[a], pb = particles[b];
          var ddx = pa.x - pb.x, ddy = pa.y - pb.y;
          var d2 = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d2 < 140) {
            ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
            ctx.strokeStyle = 'hsla(260,70%,65%,' + (1 - d2 / 140) * (dark ? 0.3 : 0.18) + ')';
            ctx.lineWidth = 0.8; ctx.stroke();
          }
        }
      }
      if (mouse.active) {
        var grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 80);
        grad.addColorStop(0, 'rgba(130,80,223,0.22)'); grad.addColorStop(1, 'rgba(130,80,223,0)');
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ── ⑦ 暗色模式波纹 ── */
  function initThemeRipple() {
    function triggerRipple() {
      playSfx('theme');
      var old = document.getElementById('luliy-theme-ripple');
      if (old) old.remove();
      var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      var maxR = Math.sqrt(cx * cx + cy * cy) * 2.2;
      var isDark = document.documentElement.getAttribute('data-color-mode') === 'dark';
      var ripple = document.createElement('div');
      ripple.id = 'luliy-theme-ripple';
      ripple.style.cssText = 'position:fixed;top:' + cy + 'px;left:' + cx + 'px;' +
        'width:0;height:0;border-radius:50%;background:' + (isDark ? 'rgba(10,20,40,0.96)' : 'rgba(255,255,255,0.96)') + ';' +
        'pointer-events:none;z-index:99998;transform:translate(-50%,-50%) scale(0);' +
        'transition:transform 0.65s cubic-bezier(.4,0,.2,1),opacity 0.65s ease;';
      document.body.appendChild(ripple);
      ripple.getBoundingClientRect();
      ripple.style.width = ripple.style.height = (maxR * 2) + 'px';
      ripple.style.transform = 'translate(-50%,-50%) scale(1)';
      ripple.style.opacity = '0';
      setTimeout(function () { ripple.remove(); }, 700);
    }
    document.addEventListener('click', function (e) {
      var t = e.target.closest('button');
      if (t && (t.innerHTML.includes('Moon') || t.innerHTML.includes('Sun') ||
          (t.title && /dark|light|theme|主题/i.test(t.title)))) {
        triggerRipple();
      }
    });
    setTimeout(function () {
      document.querySelectorAll('.title-right .circle').forEach(function (el) {
        if (el._luliyHooked) return;
        el._luliyHooked = true;
        el.addEventListener('click', triggerRipple);
      });
    }, 800);
  }

  /* ── ⑧ 动态标题 ── */
  function initDynamicTitle() {
    var oriT = document.title, tTime;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { document.title = '👀 别走呀，我还在进步！'; clearTimeout(tTime); }
      else { document.title = '✨ 欢迎回来！ ' + oriT; tTime = setTimeout(function () { document.title = oriT; }, 2000); }
    });
  }

  /* ── ⑨ 运行时间 ── */
  function initUptime() {
    var upE = document.createElement('div');
    upE.style.cssText = 'text-align:center;font-size:13px;color:#888;padding:10px 0;margin-top:20px';
    document.body.appendChild(upE);
    var stDate = new Date('2026/05/30 00:00:00').getTime();
    function update() {
      var d = Date.now() - stDate;
      if (d < 0) { upE.innerHTML = '🚀 博客即将上线，敬请期待...'; return; }
      var days = Math.floor(d / 86400000);
      var hh = Math.floor((d % 86400000) / 3600000);
      var mm = Math.floor((d % 3600000) / 60000);
      var ss = Math.floor((d % 60000) / 1000);
      upE.innerHTML = '🌱 本站已陪伴你无限进步：' + days + '天 ' + hh + '小时 ' + mm + '分 <span style="color:#ff4444;font-weight:bold;font-family:monospace">' + ss + '</span>秒';
    }
    update(); setInterval(update, 1000);
  }

  /* ── ⑩ 文章页功能（由 script 字段调用 window._luliyInitPost） ── */
  window._luliyInitPost = function () {
    var pbody = document.getElementById('postBody');

    /* 外链新标签 */
    document.querySelectorAll('a[href^="http"]').forEach(function (a) {
      if (!a.href.includes('luliy6.github.io')) a.target = '_blank';
    });

    /* 图片懒加载 */
    if (pbody) pbody.querySelectorAll('img').forEach(function (img) { img.loading = 'lazy'; });

    if (!pbody) return;

    /* 阅读时间字数 */
    var wc = pbody.innerText.length;
    var rtag = document.createElement('p');
    rtag.innerHTML = '预计阅读：约 ' + Math.max(1, Math.round(wc / 300)) + ' 分钟 &nbsp;|&nbsp; 共 ' + wc + ' 字';
    rtag.style.cssText = 'color:#888;font-size:13px;margin-bottom:1.5rem';
    pbody.insertBefore(rtag, pbody.firstChild);

    /* 标题点击复制 */
    pbody.querySelectorAll('h1,h2,h3').forEach(function (h) {
      h.style.cursor = 'pointer'; h.title = '点击复制链接';
      h.onclick = function () {
        var url = location.href.split('#')[0] + '#' + h.id;
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        var tip = document.createElement('span');
        tip.textContent = ' 已复制!';
        tip.style.cssText = 'font-size:12px;color:#1f883d;font-weight:normal';
        h.appendChild(tip); setTimeout(function () { tip.remove(); }, 2000);
      };
    });

    /* 代码块：macOS圆点（CSS已处理）+ 复制 + 折叠 + 全屏 */
    pbody.querySelectorAll('pre').forEach(function (pre) {
      if (pre.querySelector('.code-toolbar-btn')) return;
      var code = pre.querySelector('code'); if (!code) return;
      pre.style.position = 'relative';

      function makeBtn(label, cls, title) {
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'code-toolbar-btn ' + cls;
        btn.textContent = label; btn.title = title; return btn;
      }

      /* 复制 */
      var btnCopy = makeBtn('复制', 'btn-copy', '复制代码');
      btnCopy.addEventListener('click', function (e) {
        e.stopPropagation(); playSfx('click');
        var text = code.innerText || code.textContent || '';
        function done() { btnCopy.textContent = '已复制 ✓'; btnCopy.classList.add('is-done'); setTimeout(function () { btnCopy.textContent = '复制'; btnCopy.classList.remove('is-done'); }, 1500); }
        if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(done).catch(done); }
        else {
          var ta = document.createElement('textarea'); ta.value = text;
          ta.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(ta);
          ta.select(); try { document.execCommand('copy'); } catch (err) {} ta.remove(); done();
        }
      });

      /* 折叠 */
      var btnFold = makeBtn('折叠', 'btn-fold', '折叠/展开代码');
      btnFold.addEventListener('click', function (e) {
        e.stopPropagation(); playSfx('click');
        var folded = pre.classList.toggle('is-folded');
        btnFold.textContent = folded ? '展开' : '折叠';
        btnFold.classList.toggle('folded', folded);
      });

      /* 全屏 */
      var btnExpand = makeBtn('⛶', 'btn-expand', '全屏沉浸阅读（也可双击）');
      function toggleFullscreen() {
        playSfx('sci');
        var full = pre.classList.toggle('code-fullscreen');
        btnExpand.textContent = full ? '✕' : '⛶';
        btnExpand.title = full ? '退出全屏' : '全屏沉浸阅读';
      }
      btnExpand.addEventListener('click', function (e) { e.stopPropagation(); toggleFullscreen(); });
      pre.addEventListener('dblclick', function (e) {
        if (e.target === btnCopy || e.target === btnFold || e.target === btnExpand) return;
        toggleFullscreen();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && pre.classList.contains('code-fullscreen')) {
          pre.classList.remove('code-fullscreen'); btnExpand.textContent = '⛶';
        }
      });

      pre.appendChild(btnCopy); pre.appendChild(btnFold); pre.appendChild(btnExpand);
    });

    /* 赞赏面板 */
    var spBox = document.createElement('div');
    spBox.style.cssText = 'margin-top:50px;text-align:center';
    var spBtn = document.createElement('button');
    spBtn.innerHTML = '✨ 和作者无限进步';
    spBtn.style.cssText = 'padding:12px 28px;border-radius:30px;border:none;background:linear-gradient(90deg,#f0b429,#ff6b9d);color:#fff;font-weight:bold;font-size:15px;cursor:pointer;box-shadow:0 4px 15px rgba(240,180,41,0.3);transition:transform 0.3s';
    var qrP = document.createElement('div');
    qrP.innerHTML = '<p style="font-size:13px;color:#888;margin:10px 0">无限进步，进步有你！</p><img src="https://raw.githubusercontent.com/luliy6/img/refs/heads/main/me.jpg" alt="赞赏码" style="width:180px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1)">';
    qrP.style.cssText = 'height:0;overflow:hidden;transition:height 0.4s ease,opacity 0.4s ease;opacity:0';
    spBtn.onmouseover = function () { spBtn.style.transform = 'translateY(-2px)'; };
    spBtn.onmouseout = function () { spBtn.style.transform = 'none'; };
    spBtn.onclick = function () {
      var open = qrP.style.height === '0px' || !qrP.style.height;
      qrP.style.height = open ? '260px' : '0px'; qrP.style.opacity = open ? '1' : '0';
    };
    spBox.appendChild(spBtn); spBox.appendChild(qrP);

    /* 上一篇/下一篇 */
    fetch('/postList.json').then(function (r) { return r.json(); }).then(function (posts) {
      var cur = location.pathname.replace(/\/$/, '');
      var idx = posts.findIndex(function (p) { return p.link && p.link.replace(/\/$/, '') === cur; });
      if (idx < 0) return;
      var nav = document.createElement('div');
      nav.style.cssText = 'display:flex;justify-content:space-between;gap:16px;margin-top:40px;padding-top:20px;border-top:2px dashed rgba(9,105,218,0.2)';
      function makeNavBtn(post, label, align) {
        if (!post) return document.createElement('div');
        var a = document.createElement('a');
        a.href = post.link;
        a.style.cssText = 'flex:1;padding:14px 18px;border-radius:12px;background:rgba(9,105,218,0.05);border:1px solid rgba(9,105,218,0.15);text-decoration:none;transition:all 0.25s;text-align:' + align;
        a.innerHTML = '<span style="display:block;font-size:11px;color:#888;margin-bottom:4px">' + label + '</span><span style="color:#0969da;font-weight:bold;font-size:14px">' + post.title + '</span>';
        a.onmouseover = function () { a.style.background = 'rgba(9,105,218,0.12)'; a.style.transform = 'translateY(-2px)'; };
        a.onmouseout = function () { a.style.background = 'rgba(9,105,218,0.05)'; a.style.transform = ''; };
        return a;
      }
      nav.appendChild(makeNavBtn(posts[idx + 1] || null, '⬅ 上一篇', 'left'));
      nav.appendChild(makeNavBtn(posts[idx - 1] || null, '下一篇 ➡', 'right'));
      pbody.appendChild(nav);
    }).catch(function () {});
    pbody.appendChild(spBox);

    /* TOC 高亮 */
    var tocTimer = null;
    var heads = Array.from(pbody.querySelectorAll('h2,h3'));
    if (heads.length) {
      window.addEventListener('scroll', function () {
        if (tocTimer) clearTimeout(tocTimer);
        tocTimer = setTimeout(function () {
          var scrollY = window.scrollY || document.documentElement.scrollTop, cur = null;
          heads.forEach(function (h) { if (scrollY >= h.offsetTop - 120) cur = h; });
          var isDark = document.documentElement.getAttribute('data-color-mode') === 'dark';
          document.querySelectorAll('.toc a,.markdown-toc a,[class*="toc"] a').forEach(function (a) {
            var matched = cur && a.getAttribute('href') === '#' + cur.id;
            a.style.color = matched ? '#ff9a3c' : (isDark ? '#ccc' : '');
            a.style.fontWeight = matched ? 'bold' : '';
          });
        }, 50);
      });
    }

    /* TOC 平滑滚动 */
    document.addEventListener('click', function (e) {
      var tocLink = e.target.closest('.toc a,.markdown-toc a,#markdown-toc a');
      if (tocLink) {
        var href = tocLink.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          try {
            var el = document.getElementById(decodeURIComponent(href.substring(1)));
            if (el) { window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' }); history.pushState(null, null, href); }
          } catch (err) {}
        }
      }
    });
  };


  /* ── ⑪ 首页功能 ── */
  window._luliyInitIndex = function () {
    /* 防止重复执行 */
    if (document.getElementById('site-hero')) return;

    /* 寻找合适的容器 - 优先用 .container-lg，没有就用 body */
    var container = document.querySelector('.container-lg') || document.body;
    
    /* 查找要插入 Hero 的位置：标题后、列表前 */
    var insertPoint = container.querySelector('.announceBar, .blogTitle, .post-list, .postList, [role="main"]');
    
    /* 如果是 body，查找第一个主要内容区域 */
    if (container === document.body) {
      insertPoint = document.querySelector('main, [role="main"], .container, .container-lg');
    }

    /* 创建并插入公告栏 */
    if (!document.querySelector('.announce-bar')) {
      var announceBar = document.createElement('div');
      announceBar.className = 'announce-bar';
      announceBar.innerHTML = '📢 欢迎来到 Luliy 的博客！—— 记录点滴，我将无限进步！';
      announceBar.style.cssText = 'background:#0969da;color:#fff;text-align:center;padding:12px;border-radius:10px;margin-bottom:25px;font-size:15px;box-shadow:0 4px 15px rgba(0,0,0,0.1);font-weight:bold;letter-spacing:1px;margin:0 0 20px 0;';
      
      if (insertPoint) {
        insertPoint.parentNode.insertBefore(announceBar, insertPoint);
      } else {
        container.insertBefore(announceBar, container.firstChild);
      }
    }

    /* 创建 Hero 区 */
    var hero = document.createElement('div');
    hero.id = 'site-hero';
    hero.style.cssText = 'text-align:center;padding:56px 20px 40px;background:linear-gradient(135deg,#0d1b2a 0%,#1a2a4a 40%,#8250df 100%);border-radius:18px;margin-bottom:32px;position:relative;overflow:hidden;color:#fff;';
    hero.innerHTML =
      '<h1 style="font-size:3rem;font-weight:900;color:#fff;margin:0 0 12px;letter-spacing:2px;position:relative;text-shadow:0 4px 20px rgba(0,0,0,0.4)">✦ Luliy ✦</h1>' +
      '<p style="font-size:1.1rem;color:rgba(255,255,255,0.8);margin:0 0 28px;position:relative;letter-spacing:1px">我将无限进步 · 记录点滴 · 持续成长</p>' +
      '<a href="#post-list" style="display:inline-block;padding:12px 32px;background:linear-gradient(90deg,#f0b429,#ff6b9d);color:#fff;font-weight:bold;border-radius:30px;text-decoration:none;font-size:15px;position:relative;box-shadow:0 4px 20px rgba(240,180,41,0.4);transition:transform 0.2s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">🚀 开始阅读</a>';

    /* 插入 Hero 区 */
    var announceBar = document.querySelector('.announce-bar');
    var heroInsertPoint = announceBar ? announceBar.nextSibling : (insertPoint || container.firstChild);
    if (container === document.body) {
      document.body.insertBefore(hero, heroInsertPoint);
    } else {
      container.insertBefore(hero, heroInsertPoint);
    }

    /* 时钟 */
    var heroClock = document.createElement('div');
    heroClock.id = 'hero-clock';
    heroClock.style.cssText = 'font-size:26px;color:#ff4444;font-weight:bold;font-family:monospace;margin-bottom:18px;letter-spacing:4px;text-shadow:0 2px 8px rgba(255,68,68,0.4);position:relative;z-index:2;';
    function updateClock() {
      var now = new Date();
      heroClock.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    }
    updateClock();
    setInterval(updateClock, 1000);
    hero.insertBefore(heroClock, hero.firstChild);

    /* 一言 */
    var hitokotoBar = document.createElement('div');
    hitokotoBar.className = 'hitokoto-bar';
    hitokotoBar.textContent = '正在加载今日一言...';
    hitokotoBar.style.cssText = 'background:linear-gradient(135deg,rgba(130,80,223,0.08),rgba(240,180,41,0.08));border:1px solid rgba(130,80,223,0.2);border-radius:12px;padding:16px 22px;margin:0 0 24px 0;text-align:center;font-size:15px;color:#555;font-style:italic;letter-spacing:0.5px;position:relative;';
    hero.parentNode.insertBefore(hitokotoBar, hero.nextSibling);
    
    fetch('https://v1.hitokoto.cn/?c=b&c=d&c=h&c=i&c=k&encode=json')
      .then(function (r) { return r.json(); })
      .then(function (d) { hitokotoBar.textContent = d.hitokoto + (d.from ? '  ——《' + d.from + '》' : ''); })
      .catch(function () { hitokotoBar.textContent = '每一天都是新的进步 🌱'; });
  };
    var pressTimer = null;
    fxBtn.addEventListener('mousedown', function () {
      pressTimer = setTimeout(function () {
        var cur = localStorage.getItem('luliy-sfx') !== '0';
        localStorage.setItem('luliy-sfx', cur ? '0' : '1');
        if (window._luliyShowBadge) window._luliyShowBadge(cur ? '🔇 音效已关闭' : '🔊 音效已开启');
      }, 3000);
    });
    fxBtn.addEventListener('mouseup', function () { clearTimeout(pressTimer); });
    fxBtn.addEventListener('mouseleave', function () { clearTimeout(pressTimer); });

    /* 点击粒子 */
    document.addEventListener('click', function (e) {
      for (var b = 0; b < 18; b++) {
        (function () {
          var spark = document.createElement('div');
          var angle = Math.random() * 360, dist = Math.random() * 60 + 20;
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

    /* 彩带纸屑（仅首次） */
    if (!sessionStorage.getItem('luliy-confetti-done')) {
      sessionStorage.setItem('luliy-confetti-done', '1');
      var cc = document.createElement('canvas');
      cc.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10000';
      cc.width = window.innerWidth; cc.height = window.innerHeight;
      document.body.appendChild(cc);
      var cctx = cc.getContext('2d');
      var ccolors = ['#ff6b9d','#ffcd3c','#6bceff','#a78bfa','#34d399','#ff9a3c','#f06'];
      var carr = [];
      for (var ci = 0; ci < 120; ci++) {
        carr.push({ x: Math.random() * cc.width, y: -20 - Math.random() * cc.height * 0.5,
          w: Math.random() * 12 + 4, h: Math.random() * 6 + 3,
          color: ccolors[Math.floor(Math.random() * ccolors.length)],
          speed: Math.random() * 4 + 2, drift: Math.random() * 3 - 1.5,
          rot: Math.random() * 360, rotSpeed: Math.random() * 6 - 3, opacity: 1 });
      }
      var cdone = false;
      function drawC() {
        if (cdone) { cctx.clearRect(0, 0, cc.width, cc.height); cc.remove(); return; }
        cctx.clearRect(0, 0, cc.width, cc.height);
        var allOut = true;
        carr.forEach(function (c) {
          if (c.y < cc.height + 20) allOut = false;
          cctx.save(); cctx.globalAlpha = Math.max(0, c.opacity);
          cctx.translate(c.x, c.y); cctx.rotate(c.rot * Math.PI / 180);
          cctx.fillStyle = c.color; cctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h); cctx.restore();
          c.y += c.speed; c.x += c.drift; c.rot += c.rotSpeed;
          if (c.y > cc.height * 0.7) c.opacity -= 0.02;
        });
        if (allOut) cdone = true;
        requestAnimationFrame(drawC);
      }
      drawC();
    }

    /* 归档时间轴 */
    if (location.pathname.includes('archive')) {
      var pb2 = document.getElementById('postBody');
      if (pb2) {
        pb2.innerHTML = '<p style="color:#888;font-size:14px">正在加载归档...</p>';
        fetch('/postList.json').then(function (r) { return r.json(); }).then(function (posts) {
          var byYear = {};
          posts.forEach(function (pp) {
            var y = (pp.created || pp.date || '未知').slice(0, 4);
            if (!byYear[y]) byYear[y] = [];
            byYear[y].push(pp);
          });
          var years = Object.keys(byYear).sort(function (a, b) { return b - a; });
          var html = '<h1 style="color:#0969da;border-bottom:2px solid #0969da;padding-bottom:10px;margin-bottom:30px">📅 文章归档</h1>';
          years.forEach(function (y) {
            html += '<div class="tl-year">' + y + ' 年</div><ul class="tl-list">';
            byYear[y].forEach(function (pp) {
              var md = (pp.created || pp.date || '').slice(5, 10).replace('-', '/');
              html += '<li class="tl-item"><a href="' + pp.link + '">' + pp.title + '</a><span class="tl-date">' + md + '</span></li>';
            });
            html += '</ul>';
          });
          pb2.innerHTML = html;
        }).catch(function () { pb2.innerHTML = '<p style="color:#e74c3c">归档加载失败，请刷新重试</p>'; });
      }
    }
  };

  /* ── 主入口 ── */
  initLocalStorage();
  if (localStorage.getItem('luliy-particles') !== '0') {
    if (document.body) initParticles();
    else document.addEventListener('DOMContentLoaded', initParticles);
  }
  ready(function () {
    initSearch();
    initTagEnhance();
    initProgressBar();
    initDynamicTitle();
    initUptime();
    initSfxEvents();
    initThemeRipple();

    /* 自动判断页面类型并执行对应初始化 */
    var path = location.pathname;
    var isIndex = path === '/' || path === '/index.html' || path === '';
    var isPost  = !!document.getElementById('postBody');
    var isArchive = path.includes('archive');

    if (isPost) {
      /* 文章页 */
      window._luliyInitPost && window._luliyInitPost();
    }

    if (isIndex || isArchive || (!isPost && document.querySelector('.post-item, .postList, .post-list'))) {
      /* 首页 / 归档页 / 任何含文章列表的页面 */
      window._luliyInitIndex && window._luliyInitIndex();
    }
  });

})();
