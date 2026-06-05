/* ============================================================
   enhance.js — Luliy Blog v5 ULTIMATE
   ──────────────────────────────────────────────────────────
   ①  localStorage 初始化
   ②  顶部进度条 & 回顶按钮
   ③  动态标题
   ④  运行时间
   ⑤  暗色波纹
   ⑥  粒子背景 Canvas
   ⑦  音效 (Web Audio)
   ⑧  点击粒子火花
   ⑨  头像时钟 + 链接到 /about
   ⑩  标签页增强
   ⑪  图片灯箱
   ⑫  浮动工具栏（主页 / GitHub / 主题 / 音效 / 皮肤）
   ⑬  favorites 前端加密（SHA-256）
   ⑭  首页卡片重构
   ⑮  macOS 代码块三按钮
   ⑯  樱花飘落效果
   ⑰  背景图片上传
   ⑱  前后文章导航
   ⑲  文章页初始化 (_luliyInitPost)
   ⑳  首页初始化   (_luliyInitIndex)
   ㉑  主入口
   ============================================================ */
(function (root) {
  'use strict';

  /* ─── 工具函数 ──────────────────────────────────────────── */
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
            labels:p.labels||p.tags||[],
            desc:p.desc||p.description||''
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

  /* ─── ① localStorage 初始化 ─────────────────────────────── */
  function initLocalStorage() {
    var defs={
      'luliy-sfx':'1',
      'luliy-particles':'1',
      'luliy-theme':'default',
      'luliy-skin':'default',
      'luliy-bg-url':''
    };
    Object.keys(defs).forEach(function(k){
      if(localStorage.getItem(k)===null)localStorage.setItem(k,defs[k]);
    });
  }

  /* ─── ② 顶部进度条 & 回顶按钮 ───────────────────────────── */
  function initProgressBar() {
    var bar=document.createElement('div');
    bar.id='luliy-progress-bar';
    document.body.appendChild(bar);

    var btn=document.createElement('button');
    btn.id='luliy-back-top';
    btn.innerHTML='↑';
    btn.title='回到顶部';
    btn.style.display='none';
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

  /* ─── ③ 动态标题 ────────────────────────────────────────── */
  function initDynamicTitle() {
    var ori=document.title,t;
    document.addEventListener('visibilitychange',function(){
      if(document.hidden){
        clearTimeout(t);
        document.title='👀 别走呀，我还在进步！';
      }
      else{
        document.title='✨ 欢迎回来！ '+ori;
        t=setTimeout(function(){document.title=ori;},2000);
      }
    });
  }

  /* ─── ④ 运行时间 ────────────────────────────────────────── */
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
      el.innerHTML='🌳 本站已陪伴你无限进步：'+Math.floor(d/86400000)+'天 '+
        Math.floor((d%86400000)/3600000)+'小时 '+Math.floor((d%3600000)/60000)+'分 '+
        '<span style="color:#ff4444;font-weight:bold;font-family:monospace">'+Math.floor((d%60000)/1000)+'</span>秒';
    }

    upd();
    setInterval(upd,1000);
  }

  /* ─── ⑤ 暗色模式波纹 ────────────────────────────────────── */
  function initThemeRipple() {
    function ripple(){
      playSfx('theme');
      var old=document.getElementById('luliy-theme-ripple');
      if(old)old.remove();

      var cx=window.innerWidth/2,cy=window.innerHeight/2;
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
      if(b&&(b.innerHTML.includes('Moon')||b.innerHTML.includes('Sun')||(b.title&&/dark|light|theme|主题/i.test(b.title))))ripple();
    });

    setTimeout(function(){
      document.querySelectorAll('.title-right .circle').forEach(function(el){
        if(el._luliyRipple)return;
        el._luliyRipple=true;
        el.addEventListener('click',ripple);
      });
    },800);
  }

  /* ─── ⑥ 粒子背景 Canvas ────────────────────────────────── */
  function initParticles() {
    if(document.getElementById('luliy-particle-canvas'))return;

    var canvas=document.createElement('canvas');
    canvas.id='luliy-particle-canvas';
    document.body.insertBefore(canvas,document.body.firstChild);

    var ctx=canvas.getContext('2d'),W,H;

    function resize(){
      W=canvas.width=window.innerWidth;
      H=canvas.height=window.innerHeight;
    }

    resize();
    window.addEventListener('resize',resize,{passive:true});

    var mouse={x:-9999,y:-9999,active:false};

    document.addEventListener('mousemove',function(e){
      mouse.x=e.clientX;
      mouse.y=e.clientY;
      mouse.active=true;
    },{passive:true});

    document.addEventListener('mouseleave',function(){
      mouse.active=false;
    });

    var pts=[];
    for(var i=0;i<80;i++){
      pts.push({
        x:Math.random()*window.innerWidth,
        y:Math.random()*window.innerHeight,
        vx:(Math.random()-0.5)*0.6,
        vy:(Math.random()-0.5)*0.6,
        r:Math.random()*2.2+0.8,
        hue:Math.floor(Math.random()*60)+240
      });
    }

    function tick(){
      ctx.clearRect(0,0,W,H);
      var dark=document.documentElement.getAttribute('data-color-mode')==='dark';
      var alpha=dark?0.7:0.45;

      pts.forEach(function(p){
        if(mouse.active){
          var dx=mouse.x-p.x,dy=mouse.y-p.y,d=Math.sqrt(dx*dx+dy*dy);
          if(d<220&&d>60){
            var f=0.018*(1-d/220);
            p.vx+=dx/d*f;
            p.vy+=dy/d*f;
          }
          else if(d<=60){
            p.vx-=dx/d*0.04;
            p.vy-=dy/d*0.04;
          }
        }

        p.vx*=0.98;
        p.vy*=0.98;

        var spd=Math.sqrt(p.vx*p.vx+p.vy*p.vy);
        if(spd>3){
          p.vx=p.vx/spd*3;
          p.vy=p.vy/spd*3;
        }

        p.x+=p.vx;
        p.y+=p.vy;

        if(p.x<0){p.x=0;p.vx*=-1;}
        if(p.x>W){p.x=W;p.vx*=-1;}
        if(p.y<0){p.y=0;p.vy*=-1;}
        if(p.y>H){p.y=H;p.vy*=-1;}

        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle='hsla('+p.hue+',80%,65%,'+alpha+')';
        ctx.fill();
      });

      for(var a=0;a<pts.length;a++){
        for(var b=a+1;b<pts.length;b++){
          var pa=pts[a],pb=pts[b];
          var ddx=pa.x-pb.x,ddy=pa.y-pb.y;
          var dd=Math.sqrt(ddx*ddx+ddy*ddy);

          if(dd<140){
            ctx.beginPath();
            ctx.moveTo(pa.x,pa.y);
            ctx.lineTo(pb.x,pb.y);
            ctx.strokeStyle='hsla(260,70%,65%,'+(1-dd/140)*(dark?0.3:0.18)+')';
            ctx.lineWidth=0.8;
            ctx.stroke();
          }
        }
      }

      if(mouse.active){
        var g=ctx.createRadialGradient(mouse.x,mouse.y,0,mouse.x,mouse.y,80);
        g.addColorStop(0,'rgba(130,80,223,0.22)');
        g.addColorStop(1,'rgba(130,80,223,0)');
        ctx.beginPath();
        ctx.arc(mouse.x,mouse.y,80,0,Math.PI*2);
        ctx.fillStyle=g;
        ctx.fill();
      }

      requestAnimationFrame(tick);
    }

    tick();
  }

  /* ─── ⑦ Web Audio 音效 ──────────────────────────────────── */
  var _ctx=null;

  function getACtx(){
    if(!_ctx){
      try{
        _ctx=new(root.AudioContext||root.webkitAudioContext)();
      }catch(e){}
    }
    return _ctx;
  }

  function playSfx(type){
    if(localStorage.getItem('luliy-sfx')==='0')return;
    var ctx=getACtx();
    if(!ctx)return;

    try{
      if(type==='click'){
        var o=ctx.createOscillator(),g=ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type='square';
        o.frequency.setValueAtTime(900,ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(400,ctx.currentTime+0.05);
        g.gain.setValueAtTime(0.04,ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.06);
        o.start();
        o.stop(ctx.currentTime+0.06);
      }
      else if(type==='sci'){
        var o2=ctx.createOscillator(),g2=ctx.createGain();
        o2.connect(g2);
        g2.connect(ctx.destination);
        o2.type='sine';
        o2.frequency.setValueAtTime(440,ctx.currentTime);
        o2.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+0.12);
        o2.frequency.exponentialRampToValueAtTime(660,ctx.currentTime+0.22);
        g2.gain.setValueAtTime(0.06,ctx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.25);
        o2.start();
        o2.stop(ctx.currentTime+0.25);
      }
      else if(type==='theme'){
        [0,0.08,0.16].forEach(function(delay,idx){
          var ot=ctx.createOscillator(),gt=ctx.createGain();
          ot.connect(gt);
          gt.connect(ctx.destination);
          ot.type='sine';
          ot.frequency.setValueAtTime([523,659,784][idx],ctx.currentTime+delay);
          gt.gain.setValueAtTime(0.05,ctx.currentTime+delay);
          gt.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+delay+0.18);
          ot.start(ctx.currentTime+delay);
          ot.stop(ctx.currentTime+delay+0.18);
        });
      }
    }catch(e){}
  }

  root._luliySfx=playSfx;

  function initSfxEvents(){
    document.addEventListener('click',function(e){
      var t=e.target;
      if(t.tagName==='BUTTON'||t.tagName==='A'||t.classList.contains('Label')||t.closest('button')||t.closest('a'))playSfx('click');
    },true);
  }

  /* ─── ⑧ 点击粒子火花 ────────────────────────────────────── */
  function initClickSparks(){
    var colors=['#ff6b9d','#ffcd3c','#6bceff','#a78bfa','#34d399'];

    document.addEventListener('click',function(e){
      for(var i=0;i<12;i++){
        (function(){
          var s=document.createElement('div');
          var angle=Math.random()*360;
          var dist=Math.random()*50+16;
          s.style.cssText='position:fixed;left:'+e.clientX+'px;top:'+e.clientY+'px;width:7px;height:7px;border-radius:50%;pointer-events:none;z-index:99999;background:'+colors[Math.floor(Math.random()*colors.length)]+';transform:translate(-50%,-50%);transition:transform 0.6s ease,opacity 0.6s ease;';
          document.body.appendChild(s);

          requestAnimationFrame(function(){
            s.style.transform='translate(calc(-50% + '+(Math.cos(angle*Math.PI/180)*dist)+'px),calc(-50% + '+(Math.sin(angle*Math.PI/180)*dist)+'px))';
            s.style.opacity='0';
          });

          setTimeout(function(){s.remove();},700);
        })();
      }
    });
  }

  /* ─── ⑨ 头像时钟 & 链接到 /about ───────────────────────── */
  function initAvatarClock(){
    function tryIns(){
      var av=document.querySelector('.avatar,img.avatar,.blogTitle img');
      if(!av)return false;

      if(document.getElementById('luliy-avatar-clock'))return true;

      if(!av.closest('a.luliy-avatar-link')){
        var wrap=document.createElement('a');
        wrap.className='luliy-avatar-link';
        wrap.href='/about';
        wrap.title='关于我';
        av.parentNode.insertBefore(wrap,av);
        wrap.appendChild(av);
      }

      var anchor=av.closest('a.luliy-avatar-link')||av;
      var clk=document.createElement('div');
      clk.id='luliy-avatar-clock';
      anchor.parentNode.insertBefore(clk,anchor.nextSibling);

      function upd(){
        var n=new Date();
        clk.textContent=String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0')+':'+String(n.getSeconds()).padStart(2,'0');
      }

      upd();
      setInterval(upd,1000);
      return true;
    }

    if(!tryIns()){
      var tries=0;
      var iv=setInterval(function(){
        if(tryIns()||++tries>20)clearInterval(iv);
      },300);
    }
  }

  /* ─── ⑩ 标签页增强 ──────────────────────────────────────── */
  function initTagEnhance(){
    if(!/tag\.html?$|\\/tag\\/?$/i.test(location.pathname))return;

    var tries=0;

    function wire(){
      var tl=document.getElementById('taglabel');
      if(!tl){
        if(tries++<30)setTimeout(wire,200);
        return;
      }

      if(document.getElementById('tag-enhance-toolbar'))return;

      var tb=document.createElement('div');
      tb.id='tag-enhance-toolbar';
      tb.className='tag-enhance-toolbar';
      tb.innerHTML='<input class="tag-enhance-input" type="search" placeholder="筛选标签..." autocomplete="off"><span class="tag-enhance-count">正在统计...</span>';
      tl.parentNode.insertBefore(tb,tl);

      var inp=tb.querySelector('.tag-enhance-input');
      var cnt=tb.querySelector('.tag-enhance-count');

      function apply(){
        var q=inp.value.trim().toLowerCase();
        var vis=0;
        var all=Array.from(tl.querySelectorAll('.Label'));
        all.forEach(function(l){
          var ok=!q||l.textContent.trim().toLowerCase().includes(q);
          l.style.display=ok?'inline-flex':'none';
          if(ok)vis++;
        });
        cnt.textContent=vis+' / '+all.length+' 个标签';
      }

      inp.addEventListener('input',apply);
      new MutationObserver(apply).observe(tl,{childList:true,subtree:true});
      setTimeout(apply,100);
    }

    wire();
  }

  /* ─── ⑪ 图片灯箱 ────────────────────────────────────────── */
  function initLightbox(){
    if(document.getElementById('luliy-lightbox'))return;

    var lb=document.createElement('div');
    lb.id='luliy-lightbox';
    lb.innerHTML='<button id="luliy-lightbox-close" aria-label="关闭">✕</button><img alt="">';
    document.body.appendChild(lb);

    var lbImg=lb.querySelector('img');
    var lbClose=lb.querySelector('#luliy-lightbox-close');

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

    lb.addEventListener('click',function(e){
      if(e.target===lb||e.target===lbClose)close();
    });

    lbClose.addEventListener('click',close);

    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&lb.classList.contains('is-open'))close();
    });

    document.addEventListener('click',function(e){
      var img=e.target.closest('#postBody img');
      if(!img)return;
      e.preventDefault();
      open(img.src,img.alt);
    });

    root._luliyLightboxOpen=open;
  }

  /* ─── ⑫ 浮动工具栏 ──────────────────────────────────────── */
  var THEMES=[
    {id:'default',     label:'默认金调',  dot:'#f0b429'},
    {id:'classic-blue',label:'经典蓝调',  dot:'#60a5fa'},
    {id:'eco-green',   label:'生态绿意',  dot:'#34d399'},
    {id:'sunset',      label:'日落余晖',  dot:'#fb923c'},
    {id:'mono',        label:'极简黑白',  dot:'#e5e5e5'},
    {id:'cyberpunk',   label:'赛博霓虹',  dot:'#c084fc'}
  ];

  var SKINS=[
    {id:'default',   label:'默认',     bg:'transparent', border:'#8250df'},
    {id:'parchment', label:'羊皮纸',   bg:'#fdf6e3',     border:'#b5651d'},
    {id:'ink',       label:'水墨',     bg:'#1a1a1a',     border:'#888'},
    {id:'ocean',     label:'深海蓝',   bg:'#0d1b2a',     border:'#60a5fa'}
  ];

  function applyTheme(id){
    document.body.setAttribute('data-luliy-theme',id);
    localStorage.setItem('luliy-theme',id);
    document.querySelectorAll('.luliy-theme-opt').forEach(function(b){
      b.classList.toggle('is-active',b.getAttribute('data-theme')===id);
    });
  }

  function applySkin(id){
    if(id==='default')document.body.removeAttribute('data-skin');
    else document.body.setAttribute('data-skin',id);
    localStorage.setItem('luliy-skin',id);
    document.querySelectorAll('.luliy-skin-opt').forEach(function(b){
      b.classList.toggle('is-active',b.getAttribute('data-skin')===id);
    });
  }

  function initToolbar(){
    if(document.getElementById('luliy-toolbar'))return;

    var bar=document.createElement('div');
    bar.id='luliy-toolbar';

    /* 主页按钮 */
    var btnHome=document.createElement('a');
    btnHome.className='luliy-tb-btn';
    btnHome.href='/';
    btnHome.setAttribute('data-tip','主页');
    btnHome.innerHTML='🏠';

    /* GitHub 按钮 */
    var btnGH=document.createElement('a');
    btnGH.className='luliy-tb-btn';
    btnGH.href='https://github.com/luliy6';
    btnGH.target='_blank';
    btnGH.setAttribute('data-tip','GitHub');
    btnGH.innerHTML='<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.67 7.67 0 0 1 8 4.58c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>';

    /* 音效开关按钮 */
    var btnSfx=document.createElement('button');
    btnSfx.className='luliy-tb-btn';
    btnSfx.type='button';
    var sfxOn=localStorage.getItem('luliy-sfx')!=='0';
    btnSfx.innerHTML=sfxOn?'🔊':'🔇';
    btnSfx.setAttribute('data-tip',sfxOn?'关闭音效':'开启音效');
    if(!sfxOn)btnSfx.classList.add('sfx-off');

    btnSfx.addEventListener('click',function(){
      var on=localStorage.getItem('luliy-sfx')!=='0';
      localStorage.setItem('luliy-sfx',on?'0':'1');
      btnSfx.innerHTML=on?'🔇':'🔊';
      btnSfx.setAttribute('data-tip',on?'开启音效':'关闭音效');
      btnSfx.classList.toggle('sfx-off',on);
    });

    /* 文章主题按钮 + 下拉菜单 */
    var themeWrap=document.createElement('div');
    themeWrap.style.cssText='position:relative;';
    var btnTheme=document.createElement('button');
    btnTheme.className='luliy-tb-btn';
    btnTheme.type='button';
    btnTheme.setAttribute('data-tip','文章主题');
    btnTheme.innerHTML='🎨';

    var themeMenu=document.createElement('div');
    themeMenu.id='luliy-theme-menu';

    THEMES.forEach(function(t){
      var b=document.createElement('button');
      b.className='luliy-theme-opt';
      b.type='button';
      b.setAttribute('data-theme',t.id);
      b.innerHTML='<span class="luliy-theme-dot" style="background:'+t.dot+'"></span>'+t.label;
      b.addEventListener('click',function(){
        applyTheme(t.id);
        themeMenu.classList.remove('is-open');
        playSfx('click');
      });
      themeMenu.appendChild(b);
    });

    btnTheme.addEventListener('click',function(e){
      e.stopPropagation();
      themeMenu.classList.toggle('is-open');
      skinMenu.classList.remove('is-open');
    });

    themeWrap.appendChild(themeMenu);
    themeWrap.appendChild(btnTheme);

    /* 阅读皮肤按钮 + 下拉菜单 */
    var skinWrap=document.createElement('div');
    skinWrap.style.cssText='position:relative;';
    var btnSkin=document.createElement('button');
    btnSkin.className='luliy-tb-btn';
    btnSkin.type='button';
    btnSkin.setAttribute('data-tip','阅读皮肤');
    btnSkin.innerHTML='🌈';

    var skinMenu=document.createElement('div');
    skinMenu.id='luliy-skin-menu';

    SKINS.forEach(function(s){
      var b=document.createElement('button');
      b.className='luliy-skin-opt';
      b.type='button';
      b.setAttribute('data-skin',s.id);
      b.innerHTML='<span class="luliy-skin-swatch" style="background:'+s.bg+';border-color:'+s.border+'"></span>'+s.label;
      b.addEventListener('click',function(){
        applySkin(s.id);
        skinMenu.classList.remove('is-open');
        playSfx('click');
      });
      skinMenu.appendChild(b);
    });

    btnSkin.addEventListener('click',function(e){
      e.stopPropagation();
      skinMenu.classList.toggle('is-open');
      themeMenu.classList.remove('is-open');
    });

    skinWrap.appendChild(skinMenu);
    skinWrap.appendChild(btnSkin);

    /* 点击外部关闭所有菜单 */
    document.addEventListener('click',function(){
      themeMenu.classList.remove('is-open');
      skinMenu.classList.remove('is-open');
    });

    bar.appendChild(btnHome);
    bar.appendChild(btnGH);
    bar.appendChild(btnSfx);
    bar.appendChild(themeWrap);
    bar.appendChild(skinWrap);
    document.body.appendChild(bar);

    /* 恢复保存的主题和皮肤 */
    applyTheme(localStorage.getItem('luliy-theme')||'default');
    applySkin(localStorage.getItem('luliy-skin')||'default');
  }

  /* ─── ⑬ SHA-256 加密（favorites 密码：121383） ──────────── */
  function sha256(str){
    function rotR(x,n){return(x>>>n)|(x<<(32-n));}

    var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];

    var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];

    var bytes=[];
    for(var i=0;i<str.length;i++){
      var c=str.charCodeAt(i);
      if(c<128){
        bytes.push(c);
      }else if(c<2048){
        bytes.push(0xC0|(c>>6));
        bytes.push(0x80|(c&63));
      }else{
        bytes.push(0xE0|(c>>12));
        bytes.push(0x80|((c>>6)&63));
        bytes.push(0x80|(c&63));
      }
    }

    var bitLen=bytes.length*8;
    bytes.push(0x80);

    while((bytes.length%64)!==56)bytes.push(0);

    bytes.push(0,0,0,0);
    for(var j=24;j>=0;j-=8)bytes.push((bitLen>>j)&0xff);

    for(var i=0;i<bytes.length;i+=64){
      var W=[];
      for(var t=0;t<16;t++)W[t]=(bytes[i+t*4]<<24)|(bytes[i+t*4+1]<<16)|(bytes[i+t*4+2]<<8)|bytes[i+t*4+3];
      for(var t=16;t<64;t++){
        var s0=(rotR(W[t-15],7))^(rotR(W[t-15],18))^(W[t-15]>>>3);
        var s1=(rotR(W[t-2],17))^(rotR(W[t-2],19))^(W[t-2]>>>10);
        W[t]=(W[t-16]+s0+W[t-7]+s1)|0;
      }

      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];

      for(var t=0;t<64;t++){
        var S1=(rotR(e,6))^(rotR(e,11))^(rotR(e,25));
        var ch=(e&f)^((~e)&g);
        var temp1=(h+S1+ch+K[t]+W[t])|0;
        var S0=(rotR(a,2))^(rotR(a,13))^(rotR(a,22));
        var maj=(a&b)^(a&c)^(b&c);
        var temp2=(S0+maj)|0;
        h=g;
        g=f;
        f=e;
        e=(d+temp1)|0;
        d=c;
        c=b;
        b=a;
        a=(temp1+temp2)|0;
      }

      H[0]=(H[0]+a)|0;
      H[1]=(H[1]+b)|0;
      H[2]=(H[2]+c)|0;
      H[3]=(H[3]+d)|0;
      H[4]=(H[4]+e)|0;
      H[5]=(H[5]+f)|0;
      H[6]=(H[6]+g)|0;
      H[7]=(H[7]+h)|0;
    }

    var hash='';
    for(var i=0;i<8;i++){
      for(var j=28;j>=0;j-=4){
        hash+=(((H[i]>>j)&0xf).toString(16));
      }
    }
    return hash;
  }

  function initFavoritesEncryption(){
    var favLink=document.querySelector('a[href*="favorites"]');
    if(!favLink)return;

    favLink.addEventListener('click',function(e){
      e.preventDefault();

      var mask=document.createElement('div');
      mask.className='luliy-favorites-mask';

      var dialog=document.createElement('div');
      dialog.className='luliy-favorites-dialog';
      dialog.innerHTML='<h2>🔐 输入密码</h2><input type="password" id="luliy-fav-pwd" placeholder="请输入密码"><button id="luliy-fav-submit">确认</button>';

      mask.appendChild(dialog);
      document.body.appendChild(mask);

      var pwd=dialog.querySelector('#luliy-fav-pwd');
      var submit=dialog.querySelector('#luliy-fav-submit');

      function check(){
        var input=pwd.value.trim();
        var hash=sha256(input);
        var correctHash=sha256('121383');

        if(hash===correctHash){
          mask.remove();
          window.location.href=favLink.href;
        }else{
          pwd.value='';
          pwd.placeholder='❌ 密码错误，请重试';
          pwd.style.borderColor='#ff4444';
          setTimeout(function(){
            pwd.placeholder='请输入密码';
            pwd.style.borderColor='#8250df';
          },2000);
        }
      }

      submit.addEventListener('click',check);
      pwd.addEventListener('keypress',function(e){
        if(e.key==='Enter')check();
      });

      pwd.focus();
    });
  }

  /* ─── ⑭ 首页卡片重构 ────────────────────────────────────── */
  function initCardGrid(){
    var nav=document.querySelector('.SideNav');
    if(!nav)return;

    nav.classList.add('luliy-card-grid');

    var items=nav.querySelectorAll('.SideNav-item');
    items.forEach(function(item){
      item.classList.add('luliy-card');
    });
  }

  /* ─── ⑮ macOS 代码块三按钮 ────────────────────────────── */
  function initMacButtons(){
    var pres=document.querySelectorAll('#postBody pre');

    pres.forEach(function(pre){
      if(pre.querySelector('.mac-btn'))return;

      var btnRed=document.createElement('button');
      btnRed.className='mac-btn mac-btn-red';
      btnRed.setAttribute('data-tip','关闭');
      btnRed.addEventListener('click',function(){
        pre.remove();
        playSfx('click');
      });

      var btnYellow=document.createElement('button');
      btnYellow.className='mac-btn mac-btn-yellow';
      btnYellow.setAttribute('data-tip','最小化');
      btnYellow.addEventListener('click',function(){
        pre.classList.toggle('is-folded');
        btnYellow.classList.toggle('is-folded');
        playSfx('click');
      });

      var btnGreen=document.createElement('button');
      btnGreen.className='mac-btn mac-btn-green';
      btnGreen.setAttribute('data-tip','全屏');
      btnGreen.addEventListener('click',function(){
        pre.classList.toggle('code-fullscreen');
        btnGreen.classList.toggle('is-done');
        playSfx('click');
      });

      pre.appendChild(btnRed);
      pre.appendChild(btnYellow);
      pre.appendChild(btnGreen);
    });
  }

  /* ─── ⑯ 樱花飘落效果 ────────────────────────────────────── */
  function initSakura(){
    var canvas=document.createElement('canvas');
    canvas.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
    document.body.appendChild(canvas);

    var ctx=canvas.getContext('2d');
    var W=canvas.width=window.innerWidth;
    var H=canvas.height=window.innerHeight;

    window.addEventListener('resize',function(){
      W=canvas.width=window.innerWidth;
      H=canvas.height=window.innerHeight;
    });

    var petals=[];
    for(var i=0;i<50;i++){
      petals.push({
        x:Math.random()*W,
        y:Math.random()*H-H,
        vx:(Math.random()-0.5)*2,
        vy:Math.random()*2+1,
        r:Math.random()*3+2,
        rot:Math.random()*Math.PI*2,
        rotSpeed:(Math.random()-0.5)*0.1,
        opacity:Math.random()*0.5+0.3
      });
    }

    function tick(){
      ctx.clearRect(0,0,W,H);

      petals.forEach(function(p){
        p.x+=p.vx;
        p.y+=p.vy;
        p.rot+=p.rotSpeed;

        if(p.y>H){
          p.y=-10;
          p.x=Math.random()*W;
        }

        ctx.save();
        ctx.translate(p.x,p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha=p.opacity;
        ctx.fillStyle='#ffb7d9';
        ctx.beginPath();
        ctx.ellipse(0,0,p.r,p.r*0.6,0,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
      });

      requestAnimationFrame(tick);
    }

    tick();
  }

  /* ─── ⑰ 背景图片上传 ────────────────────────────────────── */
  function initBgUpload(){
    var btn=document.createElement('button');
    btn.id='luliy-bg-upload';
    btn.innerHTML='🖼️';
    btn.title='上传背景';
    document.body.appendChild(btn);

    var input=document.createElement('input');
    input.id='luliy-bg-input';
    input.type='file';
    input.accept='image/*';
    document.body.appendChild(input);

    btn.addEventListener('click',function(){
      input.click();
    });

    input.addEventListener('change',function(){
      if(input.files.length>0){
        var reader=new FileReader();
        reader.onload=function(e){
          var url=e.target.result;
          document.body.style.backgroundImage='url('+url+')';
          document.body.style.backgroundSize='cover';
          document.body.style.backgroundAttachment='fixed';
          localStorage.setItem('luliy-bg-url',url);
          playSfx('click');
        };
        reader.readAsDataURL(input.files[0]);
      }
    });

    var savedBg=localStorage.getItem('luliy-bg-url');
    if(savedBg){
      document.body.style.backgroundImage='url('+savedBg+')';
      document.body.style.backgroundSize='cover';
      document.body.style.backgroundAttachment='fixed';
    }
  }

  /* ─── ⑱ 前后文章导航 ────────────────────────────────────── */
  function initPostNav(){
    var postBody=document.getElementById('postBody');
    if(!postBody)return;

    fetchPosts().then(function(posts){
      var currentUrl=window.location.pathname;
      var currentIdx=-1;

      for(var i=0;i<posts.length;i++){
        if(posts[i].link.includes(currentUrl.split('/').pop())){
          currentIdx=i;
          break;
        }
      }

      if(currentIdx<0)return;

      var nav=document.createElement('div');
      nav.className='luliy-post-nav';

      if(currentIdx>0){
        var prev=posts[currentIdx-1];
        var prevLink=document.createElement('a');
        prevLink.className='luliy-post-nav-item prev';
        prevLink.href=prev.link;
        prevLink.innerHTML='<div class="luliy-post-nav-label">← 上一篇</div><div class="luliy-post-nav-title">'+esc(prev.title)+'</div>';
        nav.appendChild(prevLink);
      }

      if(currentIdx<posts.length-1){
        var next=posts[currentIdx+1];
        var nextLink=document.createElement('a');
        nextLink.className='luliy-post-nav-item next';
        nextLink.href=next.link;
        nextLink.innerHTML='<div class="luliy-post-nav-label">下一篇 →</div><div class="luliy-post-nav-title">'+esc(next.title)+'</div>';
        nav.appendChild(nextLink);
      }

      if(nav.children.length>0){
        postBody.appendChild(nav);
      }
    });
  }

  /* ─── ⑲ 文章页初始化 ────────────────────────────────────── */
  function _luliyInitPost(){
    initMacButtons();
    initPostNav();
  }

  /* ─── ⑳ 首页初始化 ──────────────────────────────────────── */
  function _luliyInitIndex(){
    initCardGrid();
  }

  /* ─── ㉑ 主入口 ──────────────────────────────────────────── */
  ready(function(){
    initLocalStorage();
    initProgressBar();
    initDynamicTitle();
    initUptime();
    initThemeRipple();
    initParticles();
    initSfxEvents();
    initClickSparks();
    initAvatarClock();
    initTagEnhance();
    initLightbox();
    initToolbar();
    initFavoritesEncryption();
    initSakura();
    initBgUpload();

    var isPost=!!document.getElementById('postBody');
    if(isPost){
      _luliyInitPost();
    }else{
      _luliyInitIndex();
    }
  });

  root._luliyReady=true;
})(window);
