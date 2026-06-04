/* ============================================================
   enhance.js — Luliy Blog v4
   新增：
     · TOC 桌面悬浮侧边栏 / 移动折叠（统一模块）
     · 五主题切换系统（持久化到 localStorage）
     · favorites 标签文章前端加密（密码 121383，SHA-256）
   ============================================================ */
(function (root) {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     工具
  ───────────────────────────────────────────────────────── */
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
      .catch(function () {
        return fetch('postList.json').then(function (r) { return r.ok ? r.json() : []; });
      })
      .then(normalize);
  }

  /* ─────────────────────────────────────────────────────────
     ① localStorage 初始化
  ───────────────────────────────────────────────────────── */
  function initLocalStorage() {
    var defs = { 'luliy-sfx': '1', 'luliy-particles': '1', 'luliy-theme': 'default' };
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
    btn.innerHTML = '↑'; btn.title = '回到顶部'; btn.style.display = 'none';
    document.body.appendChild(btn);
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

    window.addEventListener('scroll', function () {
      var st = window.scrollY || document.documentElement.scrollTop;
      var dh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = (dh > 0 ? Math.round(st / dh * 100) : 0) + '%';
      btn.style.display = st > 300 ? 'flex' : 'none';
    }, { passive: true });
  }

  /* ─────────────────────────────────────────────────────────
     ③ 动态标题
  ───────────────────────────────────────────────────────── */
  function initDynamicTitle() {
    var ori = document.title, t;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { clearTimeout(t); document.title = '👀 别走呀，我还在进步！'; }
      else { document.title = '✨ 欢迎回来！ ' + ori; t = setTimeout(function () { document.title = ori; }, 2000); }
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
    update(); setInterval(update, 1000);
  }

  /* ─────────────────────────────────────────────────────────
     ⑤ 暗色模式波纹
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
          (btn.title && /dark|light|theme|主题/i.test(btn.title)))) ripple();
    });
    setTimeout(function () {
      document.querySelectorAll('.title-right .circle').forEach(function (el) {
        if (el._luliyRipple) return;
        el._luliyRipple = true; el.addEventListener('click', ripple);
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
    var ctx = canvas.getContext('2d'), W, H;
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize, { passive: true });
    var mouse = { x: -9999, y: -9999, active: false };
    document.addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }, { passive: true });
    document.addEventListener('mouseleave', function () { mouse.active = false; });
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
        if (mouse.active) {
          var dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.sqrt(dx*dx+dy*dy);
          if (d < 220 && d > 60) { var f = 0.018*(1-d/220); p.vx+=dx/d*f; p.vy+=dy/d*f; }
          else if (d <= 60) { p.vx-=dx/d*0.04; p.vy-=dy/d*0.04; }
        }
        p.vx *= 0.98; p.vy *= 0.98;
        var spd = Math.sqrt(p.vx*p.vx+p.vy*p.vy);
        if (spd > 3) { p.vx=p.vx/spd*3; p.vy=p.vy/spd*3; }
        p.x+=p.vx; p.y+=p.vy;
        if (p.x<0){p.x=0;p.vx*=-1;} if (p.x>W){p.x=W;p.vx*=-1;}
        if (p.y<0){p.y=0;p.vy*=-1;} if (p.y>H){p.y=H;p.vy*=-1;}
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle='hsla('+p.hue+',80%,65%,'+alpha+')'; ctx.fill();
      });
      for (var a=0;a<pts.length;a++) for (var b=a+1;b<pts.length;b++) {
        var pa=pts[a],pb=pts[b],ddx=pa.x-pb.x,ddy=pa.y-pb.y,dd=Math.sqrt(ddx*ddx+ddy*ddy);
        if (dd<140) {
          ctx.beginPath(); ctx.moveTo(pa.x,pa.y); ctx.lineTo(pb.x,pb.y);
          ctx.strokeStyle='hsla(260,70%,65%,'+(1-dd/140)*(dark?0.3:0.18)+')';
          ctx.lineWidth=0.8; ctx.stroke();
        }
      }
      if (mouse.active) {
        var g=ctx.createRadialGradient(mouse.x,mouse.y,0,mouse.x,mouse.y,80);
        g.addColorStop(0,'rgba(130,80,223,0.22)'); g.addColorStop(1,'rgba(130,80,223,0)');
        ctx.beginPath(); ctx.arc(mouse.x,mouse.y,80,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
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
    if (!_audioCtx) try { _audioCtx = new (root.AudioContext||root.webkitAudioContext)(); } catch(e){}
    return _audioCtx;
  }
  function playSfx(type) {
    if (localStorage.getItem('luliy-sfx') === '0') return;
    var ctx = getAudioCtx(); if (!ctx) return;
    try {
      if (type === 'click') {
        var o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g); g.connect(ctx.destination);
        o.type='square'; o.frequency.setValueAtTime(900,ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(400,ctx.currentTime+0.05);
        g.gain.setValueAtTime(0.04,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.06);
        o.start(); o.stop(ctx.currentTime+0.06);
      } else if (type==='sci') {
        var o2=ctx.createOscillator(),g2=ctx.createGain(); o2.connect(g2); g2.connect(ctx.destination);
        o2.type='sine'; o2.frequency.setValueAtTime(440,ctx.currentTime);
        o2.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+0.12);
        o2.frequency.exponentialRampToValueAtTime(660,ctx.currentTime+0.22);
        g2.gain.setValueAtTime(0.06,ctx.currentTime); g2.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.25);
        o2.start(); o2.stop(ctx.currentTime+0.25);
      } else if (type==='theme') {
        [0,0.08,0.16].forEach(function(delay,idx){
          var ot=ctx.createOscillator(),gt=ctx.createGain(); ot.connect(gt); gt.connect(ctx.destination);
          ot.type='sine'; ot.frequency.setValueAtTime([523,659,784][idx],ctx.currentTime+delay);
          gt.gain.setValueAtTime(0.05,ctx.currentTime+delay);
          gt.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+delay+0.18);
          ot.start(ctx.currentTime+delay); ot.stop(ctx.currentTime+delay+0.18);
        });
      }
    } catch(e){}
  }
  root._luliySfx = playSfx;
  function initSfxEvents() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t.tagName==='BUTTON'||t.tagName==='A'||t.classList.contains('Label')||t.closest('button')||t.closest('a')) playSfx('click');
    }, true);
  }

  /* ─────────────────────────────────────────────────────────
     ⑧ 点击粒子火花
  ───────────────────────────────────────────────────────── */
  function initClickSparks() {
    var colors=['#ff6b9d','#ffcd3c','#6bceff','#a78bfa','#34d399'];
    document.addEventListener('click', function (e) {
      for (var i=0;i<14;i++) (function(){
        var s=document.createElement('div');
        var angle=Math.random()*360, dist=Math.random()*55+18;
        s.style.cssText='position:fixed;left:'+e.clientX+'px;top:'+e.clientY+'px;width:7px;height:7px;border-radius:50%;pointer-events:none;z-index:99999;background:'+colors[Math.floor(Math.random()*colors.length)]+';transform:translate(-50%,-50%);transition:transform 0.6s ease,opacity 0.6s ease;';
        document.body.appendChild(s);
        requestAnimationFrame(function(){
          s.style.transform='translate(calc(-50% + '+(Math.cos(angle*Math.PI/180)*dist)+'px),calc(-50% + '+(Math.sin(angle*Math.PI/180)*dist)+'px))';
          s.style.opacity='0';
        });
        setTimeout(function(){s.remove();},700);
      })();
    });
  }

  /* ─────────────────────────────────────────────────────────
     ⑨ 头像时钟 & 链接到 /about
  ───────────────────────────────────────────────────────── */
  function initAvatarClock() {
    function tryInsert() {
      var avatar = document.querySelector('.avatar, img.avatar, .blogTitle img');
      if (!avatar) return false;
      if (document.getElementById('luliy-avatar-clock')) return true;
      if (!avatar.closest('a.luliy-avatar-link')) {
        var wrap = document.createElement('a');
        wrap.className='luliy-avatar-link'; wrap.href='/about'; wrap.title='关于我';
        avatar.parentNode.insertBefore(wrap, avatar); wrap.appendChild(avatar);
      }
      var anchor = avatar.closest('a.luliy-avatar-link') || avatar;
      var clock = document.createElement('div'); clock.id='luliy-avatar-clock';
      anchor.parentNode.insertBefore(clock, anchor.nextSibling);
      function updateClock() {
        var now=new Date();
        clock.textContent=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')+':'+String(now.getSeconds()).padStart(2,'0');
      }
      updateClock(); setInterval(updateClock,1000); return true;
    }
    if (!tryInsert()) { var tries=0, iv=setInterval(function(){if(tryInsert()||++tries>20)clearInterval(iv);},300); }
  }

  /* ─────────────────────────────────────────────────────────
     ⑩ 标签页增强
  ───────────────────────────────────────────────────────── */
  function initTagEnhance() {
    if (!/tag\.html?$|\/tag\/?$/i.test(location.pathname)) return;
    var tries=0;
    function wire() {
      var taglabel=document.getElementById('taglabel');
      if (!taglabel) { if (tries++<30) setTimeout(wire,200); return; }
      document.body.classList.add('gmeek-tag-enhanced');
      if (document.getElementById('tag-enhance-toolbar')) return;
      var toolbar=document.createElement('div'); toolbar.id='tag-enhance-toolbar'; toolbar.className='tag-enhance-toolbar';
      toolbar.innerHTML='<input class="tag-enhance-input" type="search" placeholder="筛选标签..." autocomplete="off"><span class="tag-enhance-count">正在统计...</span>';
      taglabel.parentNode.insertBefore(toolbar,taglabel);
      var inp=toolbar.querySelector('.tag-enhance-input'), cnt=toolbar.querySelector('.tag-enhance-count');
      function apply(){
        var q=inp.value.trim().toLowerCase(), vis=0;
        var all=Array.from(taglabel.querySelectorAll('.Label'));
        all.forEach(function(l){var ok=!q||l.textContent.trim().toLowerCase().includes(q);l.style.display=ok?'inline-flex':'none';if(ok)vis++;});
        cnt.textContent=vis+' / '+all.length+' 个标签';
      }
      inp.addEventListener('input',apply);
      new MutationObserver(apply).observe(taglabel,{childList:true,subtree:true});
      setTimeout(apply,100);
    }
    wire();
  }

  /* ─────────────────────────────────────────────────────────
     ⑪ 图片灯箱
  ───────────────────────────────────────────────────────── */
  function initLightbox() {
    if (document.getElementById('luliy-lightbox')) return;
    var lb=document.createElement('div'); lb.id='luliy-lightbox';
    lb.innerHTML='<button id="luliy-lightbox-close" aria-label="关闭">✕</button><img alt="">';
    document.body.appendChild(lb);
    var lbImg=lb.querySelector('img'), lbClose=lb.querySelector('#luliy-lightbox-close');
    function open(src,alt){lbImg.src=src;lbImg.alt=alt||'';lb.classList.add('is-open');document.body.style.overflow='hidden';}
    function close(){lb.classList.remove('is-open');document.body.style.overflow='';setTimeout(function(){lbImg.src='';},300);}
    lb.addEventListener('click',function(e){if(e.target===lb||e.target===lbClose)close();});
    lbClose.addEventListener('click',close);
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&lb.classList.contains('is-open'))close();});
    document.addEventListener('click',function(e){var img=e.target.closest('#postBody img');if(!img)return;e.preventDefault();open(img.src,img.alt);});
    root._luliyLightboxOpen=open;
  }

  /* ─────────────────────────────────────────────────────────
     ⑫ 主题切换系统
  ───────────────────────────────────────────────────────── */
  var THEMES = [
    { id: 'default',      label: '默认金调',   dot: '#f0b429' },
    { id: 'classic-blue', label: '经典蓝调',   dot: '#60a5fa' },
    { id: 'eco-green',    label: '生态绿意',   dot: '#34d399' },
    { id: 'sunset',       label: '日落余晖',   dot: '#fb923c' },
    { id: 'mono',         label: '极简黑白',   dot: '#e5e5e5' },
    { id: 'cyberpunk',    label: '赛博霓虹',   dot: '#c084fc' }
  ];

  function applyTheme(id) {
    document.body.setAttribute('data-luliy-theme', id);
    localStorage.setItem('luliy-theme', id);
    /* 同步菜单激活状态 */
    document.querySelectorAll('.luliy-theme-option').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-theme') === id);
    });
  }

  function initThemeSwitcher() {
    /* 仅在文章页注入 */
    if (!document.getElementById('postBody')) return;
    if (document.getElementById('luliy-theme-switcher')) return;

    var wrap = document.createElement('div');
    wrap.id = 'luliy-theme-switcher';

    var menu = document.createElement('div');
    menu.id = 'luliy-theme-menu';

    THEMES.forEach(function (t) {
      var btn = document.createElement('button');
      btn.className = 'luliy-theme-option';
      btn.setAttribute('data-theme', t.id);
      btn.innerHTML =
        '<span class="luliy-theme-dot" style="background:' + t.dot + '"></span>' + t.label;
      btn.addEventListener('click', function () {
        applyTheme(t.id);
        menu.classList.remove('is-open');
        playSfx('click');
      });
      menu.appendChild(btn);
    });

    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'luliy-theme-switcher-btn';
    toggleBtn.title = '切换文章主题';
    toggleBtn.innerHTML = '🎨';
    toggleBtn.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });

    /* 点击外部关闭菜单 */
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) menu.classList.remove('is-open');
    });

    wrap.appendChild(menu);
    wrap.appendChild(toggleBtn);
    document.body.appendChild(wrap);

    /* 应用已保存的主题 */
    applyTheme(localStorage.getItem('luliy-theme') || 'default');
  }

  /* ─────────────────────────────────────────────────────────
     ⑬ favorites 文章前端加密
     ─────────────────────────────────────────────────────────
     检测页面 <body> 上 Gmeek 注入的 data-labels 属性或
     页面标签列表中是否包含 "favorites"；
     若包含，用 SHA-256(输入) 与硬编码哈希比较，
     匹配才解锁，否则遮盖全文。
     密码：121383
  ───────────────────────────────────────────────────────── */
  /* SHA-256 纯 JS 实现（无需第三方库） */
  function sha256(str) {
    function rotR(x, n) { return (x >>> n) | (x << (32 - n)); }
    var K = [
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 128) { bytes.push(c); }
      else if (c < 2048) { bytes.push(0xC0|(c>>6)); bytes.push(0x80|(c&63)); }
      else { bytes.push(0xE0|(c>>12)); bytes.push(0x80|((c>>6)&63)); bytes.push(0x80|(c&63)); }
    }
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) bytes.push(0);
    bytes.push(0,0,0,0);
    for (var j = 24; j >= 0; j -= 8) bytes.push((bitLen >> j) & 0xff);
    for (var i = 0; i < bytes.length; i += 64) {
      var W = [];
      for (var t = 0; t < 16; t++) W[t]=(bytes[i+t*4]<<24)|(bytes[i+t*4+1]<<16)|(bytes[i+t*4+2]<<8)|bytes[i+t*4+3];
      for (var t = 16; t < 64; t++) {
        var s0=(rotR(W[t-15],7))^(rotR(W[t-15],18))^(W[t-15]>>>3);
        var s1=(rotR(W[t-2],17))^(rotR(W[t-2],19))^(W[t-2]>>>10);
        W[t]=(W[t-16]+s0+W[t-7]+s1)|0;
      }
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for (var t = 0; t < 64; t++) {
        var S1=(rotR(e,6))^(rotR(e,11))^(rotR(e,25));
        var ch=(e&f)^(~e&g);
        var tmp1=(h+S1+ch+K[t]+W[t])|0;
        var S0=(rotR(a,2))^(rotR(a,13))^(rotR(a,22));
        var maj=(a&b)^(a&c)^(b&c);
        var tmp2=(S0+maj)|0;
        h=g;g=f;f=e;e=(d+tmp1)|0;d=c;c=b;b=a;a=(tmp1+tmp2)|0;
      }
      H[0]=(H[0]+a)|0;H[1]=(H[1]+b)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;
      H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g)|0;H[7]=(H[7]+h)|0;
    }
    var hex='';
    for (var i=0;i<8;i++) hex+=('00000000'+((H[i]>>>0).toString(16))).slice(-8);
    return hex;
  }

  /* 密码 121383 的 SHA-256 哈希（预计算，避免明文泄露） */
  var LOCK_HASH = sha256('121383');
  /* 会话解锁缓存键 */
  var LOCK_SESSION_KEY = 'luliy-unlocked-favorites';

  function isFavoritesPost() {
    /* 方法1：Gmeek 在 postBody 或其父元素注入 data-labels / class */
    var labelsAttr =
      document.body.getAttribute('data-labels') ||
      (document.getElementById('postBody') && document.getElementById('postBody').getAttribute('data-labels')) ||
      '';
    if (/favorites/i.test(labelsAttr)) return true;

    /* 方法2：页面 DOM 内 .Label 文字含 "favorites" */
    var found = false;
    document.querySelectorAll('.Label, a.Label').forEach(function (el) {
      if (/favorites/i.test(el.textContent)) found = true;
    });
    return found;
  }

  function initLock() {
    /* 只在文章页运行 */
    if (!document.getElementById('postBody')) return;
    /* 检查是否 favorites 文章 */
    if (!isFavoritesPost()) return;
    /* 本次会话已解锁 */
    if (sessionStorage.getItem(LOCK_SESSION_KEY) === '1') return;

    var pbody = document.getElementById('postBody');

    /* 创建遮罩 */
    var overlay = document.createElement('div');
    overlay.id = 'luliy-lock-overlay';
    overlay.innerHTML =
      '<div class="luliy-lock-box">' +
        '<span class="luliy-lock-icon">🔐</span>' +
        '<div class="luliy-lock-title">加密内容</div>' +
        '<div class="luliy-lock-hint">本文为私密收藏，请输入访问密码</div>' +
        '<input class="luliy-lock-input" type="password" placeholder="••••••" maxlength="20" autocomplete="off">' +
        '<button class="luliy-lock-btn">解 锁</button>' +
        '<div class="luliy-lock-err"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    /* 隐藏正文（防止选中源码泄露内容） */
    pbody.style.filter = 'blur(18px)';
    pbody.style.userSelect = 'none';
    pbody.style.pointerEvents = 'none';

    var input   = overlay.querySelector('.luliy-lock-input');
    var lockBtn = overlay.querySelector('.luliy-lock-btn');
    var errMsg  = overlay.querySelector('.luliy-lock-err');

    function tryUnlock() {
      var val = input.value;
      if (!val) { errMsg.textContent = '请输入密码'; return; }
      if (sha256(val) === LOCK_HASH) {
        /* 解锁成功 */
        sessionStorage.setItem(LOCK_SESSION_KEY, '1');
        pbody.style.filter = '';
        pbody.style.userSelect = '';
        pbody.style.pointerEvents = '';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.4s ease';
        setTimeout(function () { overlay.remove(); }, 400);
      } else {
        errMsg.textContent = '密码错误，请重试';
        input.classList.add('is-wrong');
        setTimeout(function () { input.classList.remove('is-wrong'); }, 600);
        input.value = '';
        input.focus();
      }
    }

    lockBtn.addEventListener('click', tryUnlock);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryUnlock(); });
    /* 自动聚焦 */
    setTimeout(function () { input.focus(); }, 100);
  }

  /* ─────────────────────────────────────────────────────────
     ⑭ 文章页初始化
  ───────────────────────────────────────────────────────── */
  root._luliyInitPost = function () {
    if (root._luliyPostInited) return;
    root._luliyPostInited = true;

    var pbody = document.getElementById('postBody');

    /* a 外链新标签 & 图片懒加载 */
    document.querySelectorAll('a[href^="http"]').forEach(function (a) {
      if (!a.href.includes('luliy6.github.io')) a.target = '_blank';
    });
    if (pbody) pbody.querySelectorAll('img').forEach(function (img) { img.loading = 'lazy'; });
    if (!pbody) return;

    /* b 阅读时长 & 字数（仅一次） */
    var wc;
    if (!document.getElementById('luliy-readmeta')) {
      wc = pbody.innerText.length;
      var rtag = document.createElement('p');
      rtag.id = 'luliy-readmeta';
      rtag.innerHTML = '预计阅读：约 <strong>' + Math.max(1, Math.round(wc / 300)) + '</strong> 分钟 &nbsp;|&nbsp; 共 <strong>' + wc + '</strong> 字';
      rtag.style.cssText = 'color:#888;font-size:13px;margin-bottom:1.5rem';
      pbody.insertBefore(rtag, pbody.firstChild);
    }
    wc = wc || pbody.innerText.length;

    /* c 标题点击复制链接 */
    pbody.querySelectorAll('h1,h2,h3').forEach(function (h) {
      if (h._luliyCopyHooked) return;
      h._luliyCopyHooked = true;
      h.style.cursor = 'pointer'; h.title = '点击复制链接';
      h.addEventListener('click', function () {
        var url = location.href.split('#')[0] + '#' + h.id;
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        var tip = document.createElement('span');
        tip.textContent = ' ✓'; tip.style.cssText = 'font-size:12px;color:#1f883d;font-weight:normal';
        h.appendChild(tip); setTimeout(function () { tip.remove(); }, 2000);
      });
    });

    /* d macOS 代码块控制栏 */
    pbody.querySelectorAll('pre').forEach(function (pre) {
      if (pre.querySelector('.mac-btn')) return;
      var code = pre.querySelector('code'); if (!code) return;
      function makeBtn(cls, tip) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'mac-btn ' + cls;
        b.setAttribute('data-tip', tip); b.setAttribute('aria-label', tip); return b;
      }
      var btnRed    = makeBtn('mac-btn-red',    '复制代码');
      var btnYellow = makeBtn('mac-btn-yellow', '折叠代码');
      var btnGreen  = makeBtn('mac-btn-green',  '全屏阅读');

      /* 红 → 复制 */
      btnRed.addEventListener('click', function (e) {
        e.stopPropagation(); playSfx('click');
        var text = code.innerText || code.textContent || '';
        function done() {
          btnRed.setAttribute('data-tip', '已复制 ✓'); btnRed.classList.add('is-done');
          setTimeout(function () { btnRed.setAttribute('data-tip','复制代码'); btnRed.classList.remove('is-done'); }, 1500);
        }
        if (navigator.clipboard && location.protocol === 'https:') navigator.clipboard.writeText(text).then(done).catch(done);
        else { var ta=document.createElement('textarea'); ta.value=text; ta.style.cssText='position:fixed;left:-9999px'; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(_){} ta.remove(); done(); }
      });
      /* 黄 → 折叠 */
      btnYellow.addEventListener('click', function (e) {
        e.stopPropagation(); playSfx('click');
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
      btnGreen.addEventListener('click', function (e) { e.stopPropagation(); toggleFullscreen(); });
      pre.addEventListener('dblclick', function (e) {
        if (e.target===btnRed||e.target===btnYellow||e.target===btnGreen) return;
        toggleFullscreen();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key==='Escape' && pre.classList.contains('code-fullscreen')) {
          pre.classList.remove('code-fullscreen'); btnGreen.setAttribute('data-tip','全屏阅读');
        }
      });
      pre.appendChild(btnRed); pre.appendChild(btnYellow); pre.appendChild(btnGreen);
    });

    /* e TOC — 内嵌折叠面板 + 桌面悬浮侧边栏 */
    var tocEls = Array.from(document.querySelectorAll('.toc, .markdown-toc, #markdown-toc'))
      .filter(function (el) { return !el.closest('.luliy-toc-wrap') && !el.closest('.luliy-toc-sidebar'); });

    if (tocEls.length) {
      var mainToc = tocEls[0];

      /* ── 内嵌折叠面板（所有尺寸均有） ── */
      var wrap = document.createElement('div');
      wrap.className = 'luliy-toc-wrap';
      var toggle = document.createElement('button');
      toggle.className = 'luliy-toc-toggle';
      toggle.innerHTML = '📋 文章目录 <span class="luliy-toc-arrow">▼</span>';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', function () {
        var open = wrap.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      mainToc.parentNode.insertBefore(wrap, mainToc);
      wrap.appendChild(toggle);
      wrap.appendChild(mainToc);
      var readmeta = document.getElementById('luliy-readmeta');
      if (readmeta && readmeta.parentNode === pbody) pbody.insertBefore(wrap, readmeta.nextSibling);
      else pbody.insertBefore(wrap, pbody.firstChild);

      /* ── 桌面悬浮侧边栏（克隆 TOC 链接，> 1100px 时显示） ── */
      var sidebar = document.createElement('div');
      sidebar.className = 'luliy-toc-sidebar';

      var sideHeader = document.createElement('div');
      sideHeader.className = 'luliy-toc-sidebar-header';
      sideHeader.innerHTML = '📋 目录';
      sidebar.appendChild(sideHeader);

      /* 克隆目录链接（不克隆整个 toc 节点，避免 id 重复） */
      var tocClone = document.createElement('div');
      tocClone.className = 'toc-clone';
      var links = Array.from(mainToc.querySelectorAll('a'));
      links.forEach(function (a) {
        var cloneA = document.createElement('a');
        cloneA.href = a.href;
        cloneA.textContent = a.textContent;
        cloneA.className = a.className;
        /* 同步活跃状态 */
        cloneA.setAttribute('data-toc-href', a.getAttribute('href'));
        tocClone.appendChild(cloneA);
        /* 换行 */
        tocClone.appendChild(document.createElement('br'));
      });
      sidebar.appendChild(tocClone);
      document.body.appendChild(sidebar);

      /* 标记 body，CSS 据此切换布局 */
      document.body.classList.add('has-sidebar-toc');

      /* f TOC 高亮（同时更新内嵌 + 侧边栏） */
      var heads = Array.from(pbody.querySelectorAll('h2,h3'));
      if (heads.length) {
        var tocTimer = null;
        window.addEventListener('scroll', function () {
          if (tocTimer) clearTimeout(tocTimer);
          tocTimer = setTimeout(function () {
            var scrollY = window.scrollY || document.documentElement.scrollTop;
            var active = null;
            heads.forEach(function (h) { if (scrollY >= h.offsetTop - 130) active = h; });
            /* 更新内嵌 TOC */
            mainToc.querySelectorAll('a').forEach(function (a) {
              var matched = active && a.getAttribute('href') === '#' + active.id;
              a.classList.toggle('luliy-toc-active', !!matched);
            });
            /* 更新侧边栏克隆 */
            tocClone.querySelectorAll('a').forEach(function (a) {
              var href = a.getAttribute('data-toc-href');
              var matched = active && href === '#' + active.id;
              a.classList.toggle('luliy-toc-active', !!matched);
            });
          }, 50);
        }, { passive: true });
      }

      /* TOC 平滑滚动（内嵌 + 侧边栏共用） */
      function handleTocClick(e) {
        var link = e.target.closest('.luliy-toc-wrap a, .luliy-toc-sidebar a');
        if (!link) return;
        var href = link.getAttribute('href') || link.getAttribute('data-toc-href');
        if (!href || !href.startsWith('#')) return;
        e.preventDefault();
        try {
          var target = document.getElementById(decodeURIComponent(href.slice(1)));
          if (target) { window.scrollTo({ top: target.offsetTop - 90, behavior: 'smooth' }); history.pushState(null, null, href); }
        } catch (_) {}
      }
      document.addEventListener('click', handleTocClick);
    }

    /* g 赞赏面板 */
    var spBox = document.createElement('div'); spBox.style.cssText = 'margin-top:50px;text-align:center';
    var spBtn = document.createElement('button');
    spBtn.innerHTML = '✨ 和作者无限进步';
    spBtn.style.cssText = 'padding:12px 28px;border-radius:30px;border:none;background:linear-gradient(90deg,#f0b429,#ff6b9d);color:#fff;font-weight:bold;font-size:15px;cursor:pointer;box-shadow:0 4px 15px rgba(240,180,41,0.3);transition:transform 0.3s';
    var qrPanel = document.createElement('div');
    qrPanel.innerHTML = '<p style="font-size:13px;color:#888;margin:10px 0">无限进步，进步有你！</p><img src="https://raw.githubusercontent.com/luliy6/img/refs/heads/main/me.jpg" alt="赞赏码" style="width:180px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1)">';
    qrPanel.style.cssText = 'height:0;overflow:hidden;transition:height 0.4s ease,opacity 0.4s ease;opacity:0';
    spBtn.addEventListener('mouseover', function () { spBtn.style.transform = 'translateY(-2px)'; });
    spBtn.addEventListener('mouseout',  function () { spBtn.style.transform = ''; });
    spBtn.addEventListener('click', function () {
      var open = !qrPanel.style.height || qrPanel.style.height === '0px';
      qrPanel.style.height = open ? '260px' : '0px'; qrPanel.style.opacity = open ? '1' : '0';
    });
    spBox.appendChild(spBtn); spBox.appendChild(qrPanel);

    /* h 上一篇 / 下一篇 */
    fetchPosts().then(function (posts) {
      var cur = location.pathname.replace(/\/$/, '');
      var idx = -1;
      posts.forEach(function (p, i) { if (p.link && p.link.replace(/\/$/, '') === cur) idx = i; });
      if (idx < 0) return;
      var nav = document.createElement('div');
      nav.style.cssText = 'display:flex;justify-content:space-between;gap:16px;margin-top:40px;padding-top:20px;border-top:2px dashed rgba(9,105,218,0.2)';
      function makeNavBtn(post, label, align) {
        if (!post) return document.createElement('div');
        var a = document.createElement('a'); a.href = post.link;
        a.style.cssText = 'flex:1;padding:14px 18px;border-radius:12px;background:rgba(9,105,218,0.05);border:1px solid rgba(9,105,218,0.15);text-decoration:none;transition:all 0.25s;text-align:'+align;
        a.innerHTML = '<span style="display:block;font-size:11px;color:#888;margin-bottom:4px">'+label+'</span><span style="color:#0969da;font-weight:bold;font-size:14px">'+esc(post.title)+'</span>';
        a.addEventListener('mouseover', function(){a.style.background='rgba(9,105,218,0.12)';a.style.transform='translateY(-2px)';});
        a.addEventListener('mouseout',  function(){a.style.background='rgba(9,105,218,0.05)';a.style.transform='';});
        return a;
      }
      nav.appendChild(makeNavBtn(posts[idx+1]||null,'⬅ 上一篇','left'));
      nav.appendChild(makeNavBtn(posts[idx-1]||null,'下一篇 ➡','right'));
      pbody.appendChild(nav);
    }).catch(function(){});

    pbody.appendChild(spBox);
  }; /* end _luliyInitPost */

  /* ─────────────────────────────────────────────────────────
     ⑮ 首页初始化
  ───────────────────────────────────────────────────────── */
  root._luliyInitIndex = function () {
    if (!document.querySelector('.luliy-announce')) {
      var bar = document.createElement('p');
      bar.className = 'luliy-announce';
      bar.style.cssText = 'text-align:center;font-size:14px;color:#888;margin:8px 0 20px;letter-spacing:0.5px;';
      bar.textContent = '记录点滴 · 无限进步 🌱';
      var container = document.querySelector('.container-lg') || document.body;
      var first = container.querySelector('.post-list, .postList, [role="main"]') || container.firstChild;
      container.insertBefore(bar, first);
    }
    if (location.pathname.includes('archive')) {
      var pb = document.getElementById('postBody');
      if (pb) {
        pb.innerHTML = '<p style="color:#888;font-size:14px">正在加载归档...</p>';
        fetchPosts().then(function (posts) {
          var byYear = {};
          posts.forEach(function (p) { var y=(p.created||'未知').slice(0,4); if(!byYear[y])byYear[y]=[]; byYear[y].push(p); });
          var years = Object.keys(byYear).sort(function(a,b){return b-a;});
          var html = '<h1 style="border-bottom:2px solid rgba(240,180,41,0.4);padding-bottom:10px;margin-bottom:30px">📅 文章归档</h1>';
          years.forEach(function(y){
            html+='<div class="tl-year">'+y+' 年</div><ul class="tl-list">';
            byYear[y].forEach(function(p){var md=(p.created||'').slice(5,10).replace('-','/');html+='<li class="tl-item"><a href="'+esc(p.link)+'">'+esc(p.title)+'</a><span class="tl-date">'+md+'</span></li>';});
            html+='</ul>';
          });
          pb.innerHTML=html;
        }).catch(function(){ pb.innerHTML='<p style="color:#e74c3c">归档加载失败，请刷新重试。</p>'; });
      }
    }
  };

  /* ─────────────────────────────────────────────────────────
     ⑯ 主入口
  ───────────────────────────────────────────────────────── */
  initLocalStorage();

  /* 恢复已保存的主题（立即应用，避免 FOUC） */
  var savedTheme = localStorage.getItem('luliy-theme') || 'default';
  document.body.setAttribute('data-luliy-theme', savedTheme);

  if (localStorage.getItem('luliy-particles') !== '0') {
    if (document.body) initParticles();
    else document.addEventListener('DOMContentLoaded', initParticles);
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
    initThemeSwitcher();
    initLock();

    var path      = location.pathname;
    var isPost    = !!document.getElementById('postBody');
    var isIndex   = path === '/' || path === '/index.html' || path === '';
    var isArchive = path.includes('archive');
    var hasList   = !!document.querySelector('.post-item, .postList, .post-list');

    if (isPost) root._luliyInitPost();
    if (isIndex || isArchive || (!isPost && hasList)) root._luliyInitIndex();
  });

})(window);
