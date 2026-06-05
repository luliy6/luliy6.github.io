/* ============================================================
   enhance.js — Luliy Blog v6.0
   ──────────────────────────────────────────────────────────
   功能清单：
    ①  localStorage 初始化
    ②  顶部进度条 & 圆形回顶按钮（右下角）
    ③  动态标题
    ④  运行时间
    ⑤  暗色波纹
    ⑥  粒子背景 Canvas（80颗粒子，色相 240-300）
        ├─ 鼠标悬停时粒子向鼠标吸引（距离 < 220px）
        ├─ 鼠标靠近时粒子向外排斥（距离 ≤ 60px）
        ├─ 粒子边界反弹
        ├─ 粒子之间相距 < 140px 时绘制连接线
        ├─ 鼠标位置绘制径向渐变光晕
        └─ 暗色模式时透明度更高（0.7 vs 0.45）
    ⑦  音效
    ⑧  点击粒子火花
    ⑨  头像时钟 & 链接到 About
    ⑩  标签页增强（筛选）
    ⑪  图片灯箱
    ⑫  favorites 前端加密（SHA-256）
    ⑬  首页卡片重构
    ⑭  macOS 代码块三按钮
    ⑮  文章上一篇/下一篇
    ⑯  TOC 滚动高亮
    ⑰  文章页初始化
    ⑱  首页初始化
   ============================================================ */

(function (root) {
  'use strict';

  /* 辅助函数 */
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
        return Object.keys(data).filter(function(k){return k!=='labelColorDict';}).map(function(k){
          var p=data[k]||{};
          if(typeof p==='string') p={title:p};
          return {
            title:p.title||p.name||k,
            link:p.link||p.url||('post/'+k+'.html'),
            created:p.created||p.date||p.updated||'',
            labels:p.labels||p.tags||[]
          };
        });
      }
      return [];
    }
    return fetch('/postList.json',{cache:'no-store'})
      .then(function(r){if(!r.ok)throw 0;return r.json();})
      .catch(function(){return fetch('postList.json').then(function(r){return r.ok?r.json():[];});})
      .then(norm);
  }

  /* ①  localStorage 初始化 */
  function initLocalStorage() {
    var defs={
      'luliy-sfx':'1',
      'luliy-particles':'1',
      'luliy-theme':'default',
      'luliy-skin':'default'
    };
    Object.keys(defs).forEach(function(k){
      if(localStorage.getItem(k)===null) localStorage.setItem(k,defs[k]);
    });
  }

  /* ②  顶部进度条 & 圆形回顶按钮 */
  function initProgressBar() {
    if(document.getElementById('luliy-progress-bar')) return;
    var bar=document.createElement('div');
    bar.id='luliy-progress-bar';
    document.body.appendChild(bar);

    var btn=document.createElement('button');
    btn.id='luliy-back-top';
    btn.innerHTML='↑';
    btn.title='回到顶部';
    document.body.appendChild(btn);

    btn.addEventListener('click',function(){
      window.scrollTo({top:0,behavior:'smooth'});
    });

    window.addEventListener('scroll',function(){
      var st=window.scrollY||document.documentElement.scrollTop;
      var dh=document.documentElement.scrollHeight-document.documentElement.clientHeight;
      bar.style.width=(dh>0?Math.round(st/dh*100):0)+'%';
      btn.style.display=st>300?'flex':'none';
    },{passive:true});
  }

  /* ③  动态标题 */
  function initDynamicTitle() {
    var ori=document.title, t;
    document.addEventListener('visibilitychange',function(){
      if(document.hidden){
        clearTimeout(t);
        document.title='👀 别走呀，我还在进步！';
      } else {
        document.title='✨ 欢迎回来！ '+ori;
        t=setTimeout(function(){document.title=ori;},2000);
      }
    });
  }

  /* ④  运行时间 */
  function initUptime() {
    var el=document.createElement('div');
    el.style.cssText='text-align:center;font-size:13px;color:#888;padding:10px 0;margin-top:20px';
    document.body.appendChild(el);
    var start=new Date('2026/05/30 00:00:00').getTime();
    function upd(){
      var d=Date.now()-start;
      if(d<0){
        el.innerHTML='🚀 博客即将上线，敬请期待...';
        return;
      }
      el.innerHTML='🌱 本站已陪伴你无限进步：'+
        Math.floor(d/86400000)+'天 '+
        Math.floor((d%86400000)/3600000)+'小时 '+
        Math.floor((d%3600000)/60000)+'分 '+
        '<span style="color:#ff4444;font-weight:bold;font-family:monospace">'+
        Math.floor((d%60000)/1000)+'</span>秒';
    }
    upd();
    setInterval(upd,1000);
  }

  /* ⑤  暗色波纹 */
  function initThemeRipple() {
    function playSfx(type){
      if(localStorage.getItem('luliy-sfx')==='0') return;
      var ctx=null;
      try{ ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){}
      if(!ctx) return;
      try{
        if(type==='theme'){
          [0,0.08,0.16].forEach(function(delay,idx){
            var o=ctx.createOscillator(), g=ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type='sine';
            o.frequency.setValueAtTime([523,659,784][idx],ctx.currentTime+delay);
            g.gain.setValueAtTime(0.05,ctx.currentTime+delay);
            g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+delay+0.18);
            o.start(ctx.currentTime+delay);
            o.stop(ctx.currentTime+delay+0.18);
          });
        }
      }catch(e){}
    }

    function ripple(){
      playSfx('theme');
      var old=document.getElementById('luliy-theme-ripple');
      if(old) old.remove();
      var cx=window.innerWidth/2, cy=window.innerHeight/2;
      var maxR=Math.sqrt(cx*cx+cy*cy)*2.2;
      var isDark=document.documentElement.getAttribute('data-color-mode')==='dark';
      var el=document.createElement('div');
      el.id='luliy-theme-ripple';
      el.style.cssText='position:fixed;top:'+cy+'px;left:'+cx+'px;width:0;height:0;border-radius:50%;background:'+(isDark?'rgba(10,20,40,0.96)':'rgba(255,255,255,0.96)')+';pointer-events:none;z-index:99998;transform:translate(-50%,-50%) scale(0);transition:transform 0.65s cubic-bezier(.4,0,.2,1),opacity 0.65s ease;';
      document.body.appendChild(el);
      el.getBoundingClientRect();
      el.style.width=el.style.height=(maxR*2)+'px';
      el.style.transform='translate(-50%,-50%) scale(1)';
      el.style.opacity='0';
      setTimeout(function(){el.remove();},700);
    }

    document.addEventListener('click',function(e){
      var b=e.target.closest('button');
      if(b && (b.innerHTML.includes('Moon')||b.innerHTML.includes('Sun')||(b.title&&/dark|light|theme|主题/i.test(b.title)))) ripple();
    });
  }

  /* ⑥  粒子背景（80颗粒子，色相240-300，鼠标吸引/排斥 + 连线 + 光晕）*/
  function initParticles() {
    if(document.getElementById('luliy-particle-canvas')) return;
    var canvas=document.createElement('canvas');
    canvas.id='luliy-particle-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx=canvas.getContext('2d'), W, H;

    function resize() {
      W=canvas.width=window.innerWidth;
      H=canvas.height=window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, {passive:true});

    var mouse={x:-9999, y:-9999, active:false};
    document.addEventListener('mousemove', function(e){
      mouse.x=e.clientX;
      mouse.y=e.clientY;
      mouse.active=true;
    }, {passive:true});
    document.addEventListener('mouseleave', function(){ mouse.active=false; });

    // 80颗粒子，色相范围 240-300（紫蓝色系）
    var pts=[];
    for(var i=0;i<80;i++) {
      pts.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 2.2 + 0.8,
        hue: Math.floor(Math.random() * 60) + 240
      });
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      var dark = document.documentElement.getAttribute('data-color-mode') === 'dark';
      var alpha = dark ? 0.7 : 0.45;

      // 更新粒子位置 + 鼠标交互（吸引/排斥）
      pts.forEach(function(p) {
        if(mouse.active) {
          var dx = mouse.x - p.x;
          var dy = mouse.y - p.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if(d < 220 && d > 60) {
            // 鼠标悬停时粒子向鼠标吸引（距离 < 220px）
            var f = 0.018 * (1 - d/220);
            p.vx += dx / d * f;
            p.vy += dy / d * f;
          } else if(d <= 60) {
            // 鼠标靠近时粒子向外排斥（距离 ≤ 60px）
            p.vx -= dx / d * 0.04;
            p.vy -= dy / d * 0.04;
          }
        }
        p.vx *= 0.98;
        p.vy *= 0.98;
        var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if(spd > 3) {
          p.vx = p.vx / spd * 3;
          p.vy = p.vy / spd * 3;
        }
        p.x += p.vx;
        p.y += p.vy;

        // 粒子边界反弹
        if(p.x < 0) { p.x = 0; p.vx *= -1; }
        if(p.x > W) { p.x = W; p.vx *= -1; }
        if(p.y < 0) { p.y = 0; p.vy *= -1; }
        if(p.y > H) { p.y = H; p.vy *= -1; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsla(' + p.hue + ',80%,65%,' + alpha + ')';
        ctx.fill();
      });

      // 粒子之间相距 < 140px 时绘制连接线
      for(var a=0;a<pts.length;a++) {
        for(var b=a+1;b<pts.length;b++) {
          var pa=pts[a], pb=pts[b];
          var ddx=pa.x-pb.x, ddy=pa.y-pb.y;
          var dd=Math.sqrt(ddx*ddx+ddy*ddy);
          if(dd < 140) {
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.strokeStyle = 'hsla(260,70%,65%,' + (1-dd/140)*(dark?0.3:0.18) + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 鼠标位置绘制径向渐变光晕
      if(mouse.active) {
        var grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 80);
        grad.addColorStop(0, 'rgba(130,80,223,0.22)');
        grad.addColorStop(1, 'rgba(130,80,223,0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI*2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      requestAnimationFrame(tick);
    }

    tick();
  }

  /* ⑦  音效（简版，供点击火花等使用）*/
  var _sfxCtx=null;
  function getACtx(){ if(!_sfxCtx) try{ _sfxCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} return _sfxCtx; }
  function playSfxClick(){
    if(localStorage.getItem('luliy-sfx')==='0') return;
    var ctx=getACtx();
    if(!ctx) return;
    try{
      var o=ctx.createOscillator(), g=ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type='square';
      o.frequency.setValueAtTime(900,ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(400,ctx.currentTime+0.05);
      g.gain.setValueAtTime(0.04,ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.06);
      o.start(); o.stop(ctx.currentTime+0.06);
    }catch(e){}
  }
  function playSfxSci(){
    if(localStorage.getItem('luliy-sfx')==='0') return;
    var ctx=getACtx();
    if(!ctx) return;
    try{
      var o=ctx.createOscillator(), g=ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type='sine';
      o.frequency.setValueAtTime(440,ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+0.12);
      o.frequency.exponentialRampToValueAtTime(660,ctx.currentTime+0.22);
      g.gain.setValueAtTime(0.06,ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.25);
      o.start(); o.stop(ctx.currentTime+0.25);
    }catch(e){}
  }

  /* ⑧  点击粒子火花 */
  function initClickSparks(){
    var colors=['#ff6b9d','#ffcd3c','#6bceff','#a78bfa','#34d399'];
    document.addEventListener('click',function(e){
      for(var i=0;i<12;i++) (function(){
        var s=document.createElement('div');
        var angle=Math.random()*360, dist=Math.random()*50+16;
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

  /* ⑨  头像时钟 & 链接到 About */
  function initAvatarClock(){
    function tryIns(){
      var av=document.querySelector('.avatar, img.avatar, .blogTitle img');
      if(!av) return false;
      if(document.getElementById('luliy-avatar-clock')) return true;
      if(!av.closest('a.luliy-avatar-link')){
        var wrap=document.createElement('a');
        wrap.className='luliy-avatar-link';
        wrap.href='/about';
        wrap.title='关于我';
        av.parentNode.insertBefore(wrap, av);
        wrap.appendChild(av);
      }
      var anchor=av.closest('a.luliy-avatar-link')||av;
      var clk=document.createElement('div');
      clk.id='luliy-avatar-clock';
      anchor.parentNode.insertBefore(clk, anchor.nextSibling);
      function upd(){
        var n=new Date();
        clk.textContent=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0')+':'+String(n.getSeconds()).padStart(2,'0');
      }
      upd();
      setInterval(upd,1000);
      return true;
    }
    if(!tryIns()){
      var tries=0, iv=setInterval(function(){ if(tryIns()||++tries>20) clearInterval(iv); },300);
    }
  }

  /* ⑩  标签页增强 */
  function initTagEnhance(){
    if(!/tag\.html?$|\/tag\/?$/i.test(location.pathname)) return;
    var tries=0;
    function wire(){
      var tl=document.getElementById('taglabel');
      if(!tl){
        if(tries++<30) setTimeout(wire,200);
        return;
      }
      if(document.getElementById('tag-enhance-toolbar')) return;
      var tb=document.createElement('div');
      tb.id='tag-enhance-toolbar';
      tb.className='tag-enhance-toolbar';
      tb.innerHTML='<input class="tag-enhance-input" type="search" placeholder="筛选标签..." autocomplete="off"><span class="tag-enhance-count">正在统计...</span>';
      tl.parentNode.insertBefore(tb, tl);
      var inp=tb.querySelector('.tag-enhance-input'), cnt=tb.querySelector('.tag-enhance-count');
      function apply(){
        var q=inp.value.trim().toLowerCase(), vis=0;
        var all=Array.from(tl.querySelectorAll('.Label'));
        all.forEach(function(l){
          var ok=!q || l.textContent.trim().toLowerCase().includes(q);
          l.style.display=ok?'inline-flex':'none';
          if(ok) vis++;
        });
        cnt.textContent=vis+' / '+all.length+' 个标签';
      }
      inp.addEventListener('input', apply);
      new MutationObserver(apply).observe(tl, {childList:true, subtree:true});
      setTimeout(apply,100);
    }
    wire();
  }

  /* ⑪  图片灯箱 */
  function initLightbox(){
    if(document.getElementById('luliy-lightbox')) return;
    var lb=document.createElement('div');
    lb.id='luliy-lightbox';
    lb.innerHTML='<button id="luliy-lightbox-close" aria-label="关闭">✕</button><img alt="">';
    document.body.appendChild(lb);
    var lbImg=lb.querySelector('img'), lbClose=lb.querySelector('#luliy-lightbox-close');
    function open(src,alt){
      lbImg.src=src;
      lbImg.alt=alt||'';
      lb.classList.add('is-open');
      document.body.style.overflow='hidden';
    }
    function close(){
      lb.classList.remove('is-open');
      document.body.style.overflow='';
      setTimeout(function(){lbImg.src='';},300);
    }
    lb.addEventListener('click',function(e){ if(e.target===lb||e.target===lbClose) close(); });
    lbClose.addEventListener('click',close);
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&lb.classList.contains('is-open')) close(); });
    document.addEventListener('click',function(e){
      var img=e.target.closest('#postBody img');
      if(!img) return;
      e.preventDefault();
      open(img.src, img.alt);
    });
  }

  /* ⑫  favorites 前端加密（SHA-256）密码：121383 */
  function sha256(str){
    function rotR(x,n){ return (x>>>n)|(x<<(32-n)); }
    var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var bytes=[];
    for(var i=0;i<str.length;i++){
      var c=str.charCodeAt(i);
      if(c<128){ bytes.push(c); }
      else if(c<2048){ bytes.push(0xC0|(c>>6)); bytes.push(0x80|(c&63)); }
      else{ bytes.push(0xE0|(c>>12)); bytes.push(0x80|((c>>6)&63)); bytes.push(0x80|(c&63)); }
    }
    var bitLen=bytes.length*8;
    bytes.push(0x80);
    while((bytes.length%64)!==56) bytes.push(0);
    bytes.push(0,0,0,0);
    for(var j=24;j>=0;j-=8) bytes.push((bitLen>>j)&0xff);
    for(var i=0;i<bytes.length;i+=64){
      var W=[];
      for(var t=0;t<16;t++) W[t]=(bytes[i+t*4]<<24)|(bytes[i+t*4+1]<<16)|(bytes[i+t*4+2]<<8)|bytes[i+t*4+3];
      for(var t=16;t<64;t++){
        var s0=(rotR(W[t-15],7))^(rotR(W[t-15],18))^(W[t-15]>>>3);
        var s1=(rotR(W[t-2],17))^(rotR(W[t-2],19))^(W[t-2]>>>10);
        W[t]=(W[t-16]+s0+W[t-7]+s1)|0;
      }
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for(var t=0;t<64;t++){
        var S1=(rotR(e,6))^(rotR(e,11))^(rotR(e,25));
        var ch=(e&f)^(~e&g);
        var tmp1=(h+S1+ch+K[t]+W[t])|0;
        var S0=(rotR(a,2))^(rotR(a,13))^(rotR(a,22));
        var maj=(a&b)^(a&c)^(b&c);
        var tmp2=(S0+maj)|0;
        h=g; g=f; f=e; e=(d+tmp1)|0; d=c; c=b; b=a; a=(tmp1+tmp2)|0;
      }
      H[0]=(H[0]+a)|0; H[1]=(H[1]+b)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0;
      H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
    }
    var hex='';
    for(var i=0;i<8;i++) hex+=('00000000'+((H[i]>>>0).toString(16))).slice(-8);
    return hex;
  }
  var LOCK_HASH=sha256('121383');
  var LOCK_KEY='luliy-unlocked-favorites';

  function isFavoritesPost(){
    var attr=(document.body.getAttribute('data-labels')||'')+
      ((document.getElementById('postBody')&&document.getElementById('postBody').getAttribute('data-labels'))||'');
    if(/favorites/i.test(attr)) return true;
    var found=false;
    document.querySelectorAll('.Label,a.Label').forEach(function(el){ if(/favorites/i.test(el.textContent)) found=true; });
    if(!found) /favorites/i.test(document.title+location.href) && (found=true);
    return found;
  }

  function initLock(){
    if(!document.getElementById('postBody')) return;
    function check(attempts){
      if(isFavoritesPost()){ showLock(); return; }
      if(attempts>0) setTimeout(function(){ check(attempts-1); },300);
    }
    if(sessionStorage.getItem(LOCK_KEY)==='1') return;
    check(6);
  }

  function showLock(){
    if(document.getElementById('luliy-lock-overlay')) return;
    var pbody=document.getElementById('postBody');
    var ov=document.createElement('div');
    ov.id='luliy-lock-overlay';
    ov.innerHTML='<div class="luliy-lock-box"><span class="luliy-lock-icon">🔐</span><div class="luliy-lock-title">加密内容</div><div class="luliy-lock-hint">本文为私密收藏，请输入访问密码</div><input class="luliy-lock-input" type="password" placeholder="••••••" maxlength="20" autocomplete="off"><button class="luliy-lock-btn">解 锁</button><div class="luliy-lock-err"></div></div>';
    document.body.appendChild(ov);
    pbody.style.filter='blur(18px)';
    pbody.style.userSelect='none';
    pbody.style.pointerEvents='none';
    var inp=ov.querySelector('.luliy-lock-input'), btn2=ov.querySelector('.luliy-lock-btn'), err=ov.querySelector('.luliy-lock-err');
    function tryUnlock(){
      if(!inp.value){ err.textContent='请输入密码'; return; }
      if(sha256(inp.value)===LOCK_HASH){
        sessionStorage.setItem(LOCK_KEY,'1');
        pbody.style.filter='';
        pbody.style.userSelect='';
        pbody.style.pointerEvents='';
        ov.style.opacity='0';
        ov.style.transition='opacity 0.4s ease';
        setTimeout(function(){ ov.remove(); },400);
      }else{
        err.textContent='密码错误，请重试';
        inp.classList.add('is-wrong');
        setTimeout(function(){ inp.classList.remove('is-wrong'); },600);
        inp.value='';
        inp.focus();
      }
    }
    btn2.addEventListener('click', tryUnlock);
    inp.addEventListener('keydown',function(e){ if(e.key==='Enter') tryUnlock(); });
    setTimeout(function(){ inp.focus(); },120);
  }

  /* ⑬  首页卡片重构 */
  function initCards(){
    var nav=document.querySelector('nav.SideNav, ul.SideNav, .SideNav');
    if(!nav||nav.getAttribute('data-luliy-cards')) return;
    nav.setAttribute('data-luliy-cards','1');
    nav.classList.add('luliy-card-grid');
    nav.querySelectorAll('li.SideNav-item, .SideNav-item').forEach(function(li){
      li.classList.add('luliy-card');
    });
  }

  /* ⑭  macOS 代码块三按钮 */
  function initCodeBlocks(pbody){
    pbody.querySelectorAll('pre').forEach(function(pre){
      if(pre.querySelector('.mac-btn')) return;
      var code=pre.querySelector('code');
      if(!code) return;
      function makeBtn(cls,tip){
        var b=document.createElement('button');
        b.type='button';
        b.className='mac-btn '+cls;
        b.setAttribute('data-tip',tip);
        return b;
      }
      var bR=makeBtn('mac-btn-red','复制代码');
      var bY=makeBtn('mac-btn-yellow','折叠代码');
      var bG=makeBtn('mac-btn-green','全屏阅读');
      bR.addEventListener('click',function(e){
        e.stopPropagation();
        playSfxClick();
        var txt=code.innerText||code.textContent||'';
        if(navigator.clipboard){
          navigator.clipboard.writeText(txt);
        }else{
          var ta=document.createElement('textarea');
          ta.value=txt;
          ta.style.cssText='position:fixed;left:-9999px';
          document.body.appendChild(ta);
          ta.select();
          try{ document.execCommand('copy'); }catch(_){}
          ta.remove();
        }
        bR.setAttribute('data-tip','已复制 ✓');
        bR.classList.add('is-done');
        setTimeout(function(){
          bR.setAttribute('data-tip','复制代码');
          bR.classList.remove('is-done');
        },1500);
      });
      bY.addEventListener('click',function(e){
        e.stopPropagation();
        playSfxClick();
        var f=pre.classList.toggle('is-folded');
        bY.classList.toggle('is-folded',f);
        bY.setAttribute('data-tip',f?'展开代码':'折叠代码');
      });
      function toggleFS(){
        playSfxSci();
        var f=pre.classList.toggle('code-fullscreen');
        bG.setAttribute('data-tip',f?'退出全屏':'全屏阅读');
      }
      bG.addEventListener('click',function(e){ e.stopPropagation(); toggleFS(); });
      pre.addEventListener('dblclick',function(e){ if(e.target===bR||e.target===bY||e.target===bG) return; toggleFS(); });
      document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&pre.classList.contains('code-fullscreen')){ pre.classList.remove('code-fullscreen'); bG.setAttribute('data-tip','全屏阅读'); } });
      pre.appendChild(bR);
      pre.appendChild(bY);
      pre.appendChild(bG);
    });
  }

  /* ⑮  文章上一篇/下一篇 */
  function initPrevNext(pbody, posts, currentLink){
    var idx=-1;
    for(var i=0;i<posts.length;i++){
      var link=posts[i].link.replace(/\/$/,'');
      if(link===currentLink){ idx=i; break; }
    }
    if(idx<0) return;
    var nav=document.createElement('div');
    nav.style.cssText='display:flex;justify-content:space-between;gap:16px;margin-top:40px;padding-top:20px;border-top:2px dashed rgba(9,105,218,0.2)';
    function mkNav(post, label, align){
      if(!post) return document.createElement('div');
      var a=document.createElement('a');
      a.href=post.link;
      a.style.cssText='flex:1;padding:14px 18px;border-radius:12px;background:rgba(9,105,218,0.05);border:1px solid rgba(9,105,218,0.15);text-decoration:none;transition:all 0.25s;text-align:'+align;
      a.innerHTML='<span style="display:block;font-size:11px;color:#888;margin-bottom:4px">'+label+'</span><span style="color:#0969da;font-weight:bold;font-size:14px">'+esc(post.title)+'</span>';
      a.addEventListener('mouseover',function(){ a.style.background='rgba(9,105,218,0.12)'; a.style.transform='translateY(-2px)'; });
      a.addEventListener('mouseout',function(){ a.style.background='rgba(9,105,218,0.05)'; a.style.transform=''; });
      return a;
    }
    nav.appendChild(mkNav(posts[idx+1]||null,'⬅ 上一篇','left'));
    nav.appendChild(mkNav(posts[idx-1]||null,'下一篇 ➡','right'));
    pbody.appendChild(nav);
  }

  /* ⑯  TOC 滚动高亮 */
  function initTOCScroll(){
    var toc=document.querySelector('.article-toc, .toc, #markdown-toc');
    if(!toc) return;
    var headings=Array.from(document.querySelectorAll('#postBody h1, #postBody h2, #postBody h3'));
    if(headings.length===0) return;
    var links=toc.querySelectorAll('a');
    if(links.length===0) return;
    function setActive(){
      var scrollTop=window.scrollY+80;
      var activeIndex=-1;
      for(var i=0;i<headings.length;i++){
        var h=headings[i];
        if(!h.id) h.id='heading-'+i;
        if(h.offsetTop<=scrollTop) activeIndex=i;
        else break;
      }
      links.forEach(function(link,idx){
        link.classList.remove('active');
        if(idx===activeIndex || (activeIndex===-1 && idx===0)){
          link.classList.add('active');
        }
      });
    }
    window.addEventListener('scroll',setActive);
    setActive();
  }

  /* ⑰  文章页初始化 */
  root._luliyInitPost = function(){
    if(root._luliyPostInited) return;
    root._luliyPostInited=true;
    var pbody=document.getElementById('postBody');
    if(!pbody) return;

    document.querySelectorAll('a[href^="http"]').forEach(function(a){
      if(!a.href.includes('luliy6.github.io')) a.target='_blank';
    });
    pbody.querySelectorAll('img').forEach(function(img){ img.loading='lazy'; });

    if(!document.getElementById('luliy-readmeta')){
      var wc=pbody.innerText.length;
      var rt=document.createElement('p');
      rt.id='luliy-readmeta';
      rt.innerHTML='预计阅读：约 <strong>'+Math.max(1,Math.round(wc/300))+'</strong> 分钟 &nbsp;|&nbsp; 共 <strong>'+wc+'</strong> 字';
      rt.style.cssText='color:#888;font-size:13px;margin-bottom:1.5rem';
      pbody.insertBefore(rt, pbody.firstChild);
    }

    pbody.querySelectorAll('h1,h2,h3').forEach(function(h){
      if(h._luliyCopy) return;
      h._luliyCopy=true;
      h.style.cursor='pointer';
      h.title='点击复制链接';
      h.addEventListener('click',function(){
        var url=location.href.split('#')[0]+'#'+h.id;
        if(navigator.clipboard) navigator.clipboard.writeText(url);
        var tip=document.createElement('span');
        tip.textContent=' ✓';
        tip.style.cssText='font-size:12px;color:#1f883d;font-weight:normal';
        h.appendChild(tip);
        setTimeout(function(){ tip.remove(); },2000);
      });
    });

    initCodeBlocks(pbody);

    fetchPosts().then(function(posts){
      var cur=location.pathname.replace(/\/$/,'');
      initPrevNext(pbody, posts, cur);
    }).catch(function(){});

    setTimeout(initTOCScroll,300);
  };

  /* ⑱  首页初始化 */
  root._luliyInitIndex = function(){
    initCards();
    if(location.pathname.includes('archive')){
      var pb=document.getElementById('postBody');
      if(pb){
        pb.innerHTML='<p style="color:#888;font-size:14px">正在加载归档...</p>';
        fetchPosts().then(function(posts){
          var byY={};
          posts.forEach(function(p){
            var y=(p.created||'未知').slice(0,4);
            if(!byY[y]) byY[y]=[];
            byY[y].push(p);
          });
          var years=Object.keys(byY).sort(function(a,b){ return b-a; });
          var html='<h1 style="border-bottom:2px solid rgba(240,180,41,0.4);padding-bottom:10px;margin-bottom:30px">📅 文章归档</h1>';
          years.forEach(function(y){
            html+='<div class="tl-year">'+y+' 年</div><ul class="tl-list">';
            byY[y].forEach(function(p){
              var md=(p.created||'').slice(5,10).replace('-','/');
              html+='<li class="tl-item"><a href="'+esc(p.link)+'">'+esc(p.title)+'</a><span class="tl-date">'+md+'</span></li>';
            });
            html+='</ul>';
          });
          pb.innerHTML=html;
        }).catch(function(){
          pb.innerHTML='<p style="color:#e74c3c">归档加载失败，请刷新重试。</p>';
        });
      }
    }
  };

  /* ⑲  主入口 */
  initLocalStorage();

  if(localStorage.getItem('luliy-particles')!=='0'){
    if(document.body) initParticles();
    else document.addEventListener('DOMContentLoaded', initParticles);
  }

  ready(function(){
    initProgressBar();
    initDynamicTitle();
    initUptime();
    initThemeRipple();
    initClickSparks();
    initTagEnhance();
    initAvatarClock();
    initLightbox();
    initLock();

    var path=location.pathname;
    var isPost=!!document.getElementById('postBody');
    var isIndex=path==='/'||path==='/index.html'||path==='';
    var isArchive=path.includes('archive');
    var hasList=!!document.querySelector('.SideNav,.post-item,.postList,.post-list');

    if(isPost) root._luliyInitPost();
    if(isIndex||isArchive||(!isPost&&hasList)) root._luliyInitIndex();
  });

})(window);
