/* ============================================================
   enhance.js — Luliy Blog v5 (Fixed)
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
   ⑫  浮动工具栏（主页 / GitHub / 主题 / 音效 / 皮肤 / 背景 / 花瓣）
   ⑬  favorites 前端加密（SHA-256）
   ⑭  首页卡片重构
   ⑮  macOS 代码块三按钮
   ⑯  樱花花瓣效果
   ⑰  文章页初始化 (_luliyInitPost)
   ⑱  首页初始化   (_luliyInitIndex)
   ⑲  主入口
   ============================================================ */
(function (root) {
  'use strict';

  /* ─── 工具 ──────────────────────────────────────────────── */
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
          var p=data[k]||{}; if(typeof p==='string') p={title:p};
          return {title:p.title||p.name||k,link:p.link||p.url||('post/'+k+'.html'),
            created:p.created||p.date||p.updated||'',labels:p.labels||p.tags||[],
            desc:p.desc||p.description||''};
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
      'luliy-sakura':'1',
      'luliy-theme':'default',
      'luliy-skin':'default'
    };
    Object.keys(defs).forEach(function(k){if(localStorage.getItem(k)===null)localStorage.setItem(k,defs[k]);});
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


  /* ─── ③ 动态标题 ────────────────────────────────────────── */
  function initDynamicTitle() {
    var ori=document.title,t;
    document.addEventListener('visibilitychange',function(){
      if(document.hidden){clearTimeout(t);document.title='👀 别走呀，我还在进步！';}
      else{document.title='✨ 欢迎回来！ '+ori;t=setTimeout(function(){document.title=ori;},2000);}
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
      if(d<0){el.innerHTML='🚀 博客即将上线，敬请期待...';return;}
      el.innerHTML='🌱 本站已陪伴你无限进步：'+Math.floor(d/86400000)+'天 '+
        Math.floor((d%86400000)/3600000)+'小时 '+Math.floor((d%3600000)/60000)+'分 '+
        '<span style="color:#ff4444;font-weight:bold;font-family:monospace">'+Math.floor((d%60000)/1000)+'</span>秒';
    }
    upd(); setInterval(upd,1000);
  }

  /* ─── ⑤ 暗色模式波纹 ────────────────────────────────────── */
  function initThemeRipple() {
    function ripple(){
      playSfx('theme');
      var old=document.getElementById('luliy-theme-ripple'); if(old)old.remove();
      var cx=window.innerWidth/2,cy=window.innerHeight/2,maxR=Math.sqrt(cx*cx+cy*cy)*2.2;
      var isDark=document.documentElement.getAttribute('data-color-mode')==='dark';
      var el=document.createElement('div'); el.id='luliy-theme-ripple';
      el.style.cssText='position:fixed;top:'+cy+'px;left:'+cx+'px;width:0;height:0;border-radius:50%;background:'+(isDark?'rgba(10,20,40,0.96)':'rgba(255,255,255,0.96)')+';pointer-events:none;z-index:99998;transition:all 0.7s ease-out';
      document.body.appendChild(el); el.getBoundingClientRect();
      el.style.width=el.style.height=(maxR*2)+'px';
      el.style.transform='translate(-50%,-50%) scale(1)'; el.style.opacity='0';
      setTimeout(function(){el.remove();},700);
    }
    document.addEventListener('click',function(e){
      var b=e.target.closest('button');
      if(b&&(b.innerHTML.includes('Moon')||b.innerHTML.includes('Sun')||(b.title&&/dark|light|theme|主题/i.test(b.title))))ripple();
    });
    setTimeout(function(){
      document.querySelectorAll('.title-right .circle').forEach(function(el){
        if(el._luliyRipple)return; el._luliyRipple=true; el.addEventListener('click',ripple);
      });
    },800);
  }

  /* ─── ⑥ 粒子背景 ───────────────────────────────────────── */
  function initParticles() {
    if(document.getElementById('luliy-particle-canvas'))return;
    var canvas=document.createElement('canvas'); canvas.id='luliy-particle-canvas';
    document.body.insertBefore(canvas,document.body.firstChild);
    var ctx=canvas.getContext('2d'),W,H;
    function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;}
    resize(); window.addEventListener('resize',resize,{passive:true});
    var mouse={x:-9999,y:-9999,active:false};
    document.addEventListener('mousemove',function(e){mouse.x=e.clientX;mouse.y=e.clientY;mouse.active=true;},{passive:true});
    document.addEventListener('mouseleave',function(){mouse.active=false;});
    var pts=[];
    for(var i=0;i<80;i++)pts.push({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,vx:(Math.random()-0.5)*0.6,vy:(Math.random()-0.5)*0.6,r:Math.random()*2.2+0.8,hue:Math.floor(Math.random()*360)});
    function tick(){
      ctx.clearRect(0,0,W,H);
      var dark=document.documentElement.getAttribute('data-color-mode')==='dark',alpha=dark?0.7:0.45;
      pts.forEach(function(p){
        if(mouse.active){var dx=mouse.x-p.x,dy=mouse.y-p.y,d=Math.sqrt(dx*dx+dy*dy);
          if(d<220&&d>60){var f=0.018*(1-d/220);p.vx+=dx/d*f;p.vy+=dy/d*f;}
          else if(d<=60){p.vx-=dx/d*0.04;p.vy-=dy/d*0.04;}}
        p.vx*=0.98;p.vy*=0.98;
        var spd=Math.sqrt(p.vx*p.vx+p.vy*p.vy);if(spd>3){p.vx=p.vx/spd*3;p.vy=p.vy/spd*3;}
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<0){p.x=0;p.vx*=-1;}if(p.x>W){p.x=W;p.vx*=-1;}
        if(p.y<0){p.y=0;p.vy*=-1;}if(p.y>H){p.y=H;p.vy*=-1;}
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle='hsla('+p.hue+',80%,65%,'+alpha+')';ctx.fill();
      });
      for(var a=0;a<pts.length;a++)for(var b=a+1;b<pts.length;b++){
        var pa=pts[a],pb=pts[b],ddx=pa.x-pb.x,ddy=pa.y-pb.y,dd=Math.sqrt(ddx*ddx+ddy*ddy);
        if(dd<140){ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);
          ctx.strokeStyle='hsla(260,70%,65%,'+(1-dd/140)*(dark?0.3:0.18)+')';ctx.lineWidth=0.8;ctx.stroke();}
      }
      if(mouse.active){var g=ctx.createRadialGradient(mouse.x,mouse.y,0,mouse.x,mouse.y,80);
        g.addColorStop(0,'rgba(130,80,223,0.22)');g.addColorStop(1,'rgba(130,80,223,0)');
        ctx.beginPath();ctx.arc(mouse.x,mouse.y,80,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();}
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ─── ⑦ Web Audio 音效 ──────────────────────────────────── */
  var _ctx=null;
  function getACtx(){if(!_ctx)try{_ctx=new(root.AudioContext||root.webkitAudioContext)();}catch(e){}return _ctx;}
  function playSfx(type){
    if(localStorage.getItem('luliy-sfx')==='0')return;
    var ctx=getACtx();if(!ctx)return;
    try{
      if(type==='click'){var o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='square';o.frequency.setValueAtTime(900,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(600,ctx.currentTime+0.1);g.gain.setValueAtTime(0.3,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.1);o.start(ctx.currentTime);o.stop(ctx.currentTime+0.1);}
      else if(type==='sci'){var o2=ctx.createOscillator(),g2=ctx.createGain();o2.connect(g2);g2.connect(ctx.destination);o2.type='sine';o2.frequency.setValueAtTime(440,ctx.currentTime);o2.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+0.2);g2.gain.setValueAtTime(0.2,ctx.currentTime);g2.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.2);o2.start(ctx.currentTime);o2.stop(ctx.currentTime+0.2);}
      else if(type==='theme'){[0,0.08,0.16].forEach(function(delay,idx){var ot=ctx.createOscillator(),gt=ctx.createGain();ot.connect(gt);gt.connect(ctx.destination);ot.type='sine';ot.frequency.setValueAtTime(600+idx*200,ctx.currentTime+delay);gt.gain.setValueAtTime(0.15,ctx.currentTime+delay);gt.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+delay+0.15);ot.start(ctx.currentTime+delay);ot.stop(ctx.currentTime+delay+0.15);});}
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
      for(var i=0;i<12;i++) (function(){
        var s=document.createElement('div');
        var angle=Math.random()*360, dist=Math.random()*50+16;
        s.style.cssText='position:fixed;left:'+e.clientX+'px;top:'+e.clientY+'px;width:7px;height:7px;border-radius:50%;pointer-events:none;z-index:99999;background:'+colors[Math.floor(Math.random()*colors.length)]+';box-shadow:0 0 6px '+colors[Math.floor(Math.random()*colors.length)];
        document.body.appendChild(s);
        requestAnimationFrame(function(){
          s.style.transform='translate(calc(-50% + '+(Math.cos(angle*Math.PI/180)*dist)+'px),calc(-50% + '+(Math.sin(angle*Math.PI/180)*dist)+'px))';
          s.style.opacity='0';
          s.style.transition='all 0.6s ease-out';
        });
        setTimeout(function(){s.remove();},700);
      })();
    });
  }

  /* ⑨  头像时钟 & 链接到 About */
  function initAvatarClock(){
    function tryIns(){
      var av=document.querySelector('.avatar, img.avatar, .blogTitle img, [class*="avatar"]');
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

  /* ─── ⑩ 标签页增强 ──────────────────────────────────────── */
  function initTagEnhance(){
    if(!/tag\.html?$|\/tag\/?$/i.test(location.pathname))return;
    var tries=0;
    function wire(){
      var tl=document.getElementById('taglabel');
      if(!tl){if(tries++<30)setTimeout(wire,200);return;}
      if(document.getElementById('tag-enhance-toolbar'))return;
      var tb=document.createElement('div');tb.id='tag-enhance-toolbar';tb.className='tag-enhance-toolbar';
      tb.innerHTML='<input class="tag-enhance-input" type="search" placeholder="筛选标签..." autocomplete="off"><span class="tag-enhance-count">正在统计...</span>';
      tl.parentNode.insertBefore(tb,tl);
      var inp=tb.querySelector('.tag-enhance-input'),cnt=tb.querySelector('.tag-enhance-count');
      function apply(){
        var q=inp.value.trim().toLowerCase(),vis=0;
        var all=Array.from(tl.querySelectorAll('.Label'));
        all.forEach(function(l){var ok=!q||l.textContent.trim().toLowerCase().includes(q);l.style.display=ok?'inline-flex':'none';if(ok)vis++;});
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
    var lb=document.createElement('div');lb.id='luliy-lightbox';
    lb.innerHTML='<button id="luliy-lightbox-close" aria-label="关闭">✕</button><img alt="">';
    document.body.appendChild(lb);
    var lbImg=lb.querySelector('img'),lbClose=lb.querySelector('#luliy-lightbox-close');
    function open(src,alt){lbImg.src=src;lbImg.alt=alt||'';lb.classList.add('is-open');document.body.style.overflow='hidden';}
    function close(){lb.classList.remove('is-open');document.body.style.overflow='';setTimeout(function(){lbImg.src='';},300);}
    lb.addEventListener('click',function(e){if(e.target===lb||e.target===lbClose)close();});
    lbClose.addEventListener('click',close);
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&lb.classList.contains('is-open'))close();});
    document.addEventListener('click',function(e){var img=e.target.closest('#postBody img');if(!img)return;e.preventDefault();open(img.src,img.alt);});
    root._luliyLightboxOpen=open;
  }

  /* ─── ⑫ 浮动工具栏 ──────────────────────────────────────
   *  按钮：主页 / GitHub / 文章主题 / 音效 / 皮肤 / 背景图片 / 花瓣
   *  全局注入（任何页面），右侧固定定位。
   * ──────────────────────────────────────────────────────── */
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
    document.querySelectorAll('.luliy-theme-opt').forEach(function(b){b.classList.toggle('is-active',b.getAttribute('data-theme')===id);});
  }
  function applySkin(id){
    if(id==='default')document.body.removeAttribute('data-skin');
    else document.body.setAttribute('data-skin',id);
    localStorage.setItem('luliy-skin',id);
    document.querySelectorAll('.luliy-skin-opt').forEach(function(b){b.classList.toggle('is-active',b.getAttribute('data-skin')===id);});
  }

  function initToolbar(){
    if(document.getElementById('luliy-toolbar'))return;
    var bar=document.createElement('div');bar.id='luliy-toolbar';

    /* 主页按钮 */
    var btnHome=document.createElement('a');btnHome.className='luliy-tb-btn';btnHome.href='/';btnHome.setAttribute('data-tip','主页');btnHome.innerHTML='🏠';

    /* GitHub 按钮 */
    var btnGH=document.createElement('a');btnGH.className='luliy-tb-btn';btnGH.href='https://github.com/luliy6';btnGH.target='_blank';btnGH.setAttribute('data-tip','GitHub');btnGH.innerHTML='<svg height="20" viewBox="0 0 16 16" width="20" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

    /* 音效开关按钮 */
    var btnSfx=document.createElement('button');btnSfx.className='luliy-tb-btn';btnSfx.type='button';
    var sfxOn=localStorage.getItem('luliy-sfx')!=='0';
    btnSfx.innerHTML=sfxOn?'🔊':'🔇';btnSfx.setAttribute('data-tip',sfxOn?'关闭音效':'开启音效');
    if(!sfxOn)btnSfx.classList.add('sfx-off');
    btnSfx.addEventListener('click',function(){
      var on=localStorage.getItem('luliy-sfx')!=='0';
      localStorage.setItem('luliy-sfx',on?'0':'1');
      btnSfx.innerHTML=on?'🔇':'🔊';btnSfx.setAttribute('data-tip',on?'开启音效':'关闭音效');
      btnSfx.classList.toggle('sfx-off',on);
    });

    /* 文章主题按钮 + 下拉菜单 */
    var themeWrap=document.createElement('div');themeWrap.style.cssText='position:relative;';
    var btnTheme=document.createElement('button');btnTheme.className='luliy-tb-btn';btnTheme.type='button';btnTheme.setAttribute('data-tip','文章主题');btnTheme.innerHTML='🎨';
    var themeMenu=document.createElement('div');themeMenu.id='luliy-theme-menu';
    THEMES.forEach(function(t){
      var b=document.createElement('button');b.className='luliy-theme-opt';b.type='button';b.setAttribute('data-theme',t.id);
      b.innerHTML='<span class="luliy-theme-dot" style="background:'+t.dot+'"></span>'+t.label;
      b.addEventListener('click',function(){applyTheme(t.id);themeMenu.classList.remove('is-open');playSfx('click');});
      themeMenu.appendChild(b);
    });
    btnTheme.addEventListener('click',function(e){e.stopPropagation();themeMenu.classList.toggle('is-open');skinMenu.classList.remove('is-open');bgMenu.classList.remove('is-open');});
    themeMenu.addEventListener('click',function(e){e.stopPropagation();});
    themeWrap.appendChild(themeMenu);themeWrap.appendChild(btnTheme);

    /* 阅读皮肤按钮 + 下拉菜单 */
    var skinWrap=document.createElement('div');skinWrap.style.cssText='position:relative;';
    var btnSkin=document.createElement('button');btnSkin.className='luliy-tb-btn';btnSkin.type='button';btnSkin.setAttribute('data-tip','阅读皮肤');btnSkin.innerHTML='🌈';
    var skinMenu=document.createElement('div');skinMenu.id='luliy-skin-menu';
    SKINS.forEach(function(s){
      var b=document.createElement('button');b.className='luliy-skin-opt';b.type='button';b.setAttribute('data-skin',s.id);
      b.innerHTML='<span class="luliy-skin-swatch" style="background:'+s.bg+';border-color:'+s.border+'"></span>'+s.label;
      b.addEventListener('click',function(){applySkin(s.id);skinMenu.classList.remove('is-open');playSfx('click');});
      skinMenu.appendChild(b);
    });
    btnSkin.addEventListener('click',function(e){e.stopPropagation();skinMenu.classList.toggle('is-open');themeMenu.classList.remove('is-open');bgMenu.classList.remove('is-open');});
    skinMenu.addEventListener('click',function(e){e.stopPropagation();});
    skinWrap.appendChild(skinMenu);skinWrap.appendChild(btnSkin);

    /* ── 背景图片按钮 + 面板 ─────────────────────────────── */
    var bgWrap=document.createElement('div');bgWrap.style.cssText='position:relative;';
    var btnBg=document.createElement('button');btnBg.className='luliy-tb-btn';btnBg.type='button';btnBg.setAttribute('data-tip','背景图片');btnBg.innerHTML='🖼';
    var bgMenu=document.createElement('div');bgMenu.id='luliy-bg-menu';
    bgMenu.innerHTML=
      '<div class="luliy-bg-label">背景图片链接</div>'+
      '<input class="luliy-bg-input" type="url" placeholder="https://..." autocomplete="off" />'+
      '<div class="luliy-bg-actions">'+
        '<button class="luliy-bg-apply" type="button">应 用</button>'+
        '<button class="luliy-bg-clear" type="button">清 除</button>'+
      '</div>';

    /* 恢复已保存的背景 URL 到输入框 */
    var _savedBgUrl=localStorage.getItem('luliy-bg');
    var bgInp=bgMenu.querySelector('.luliy-bg-input');
    if(_savedBgUrl)bgInp.value=_savedBgUrl;

    var bgApply=bgMenu.querySelector('.luliy-bg-apply');
    var bgClear=bgMenu.querySelector('.luliy-bg-clear');

    bgApply.addEventListener('click',function(){
      var url=bgInp.value.trim();
      if(url){
        document.body.style.backgroundImage='url('+url+')';
        document.body.style.backgroundSize='cover';
        document.body.style.backgroundAttachment='fixed';
        document.body.style.backgroundPosition='center';
        document.body.style.backgroundRepeat='no-repeat';
        localStorage.setItem('luliy-bg',url);
        bgMenu.classList.remove('is-open');
        playSfx('sci');
      }
    });
    bgClear.addEventListener('click',function(){
      document.body.style.backgroundImage='';
      document.body.style.backgroundSize='';
      document.body.style.backgroundAttachment='';
      document.body.style.backgroundPosition='';
      document.body.style.backgroundRepeat='';
      localStorage.removeItem('luliy-bg');
      bgInp.value='';
      bgMenu.classList.remove('is-open');
      playSfx('click');
    });
    /* 按回车也触发应用 */
    bgInp.addEventListener('keydown',function(e){if(e.key==='Enter')bgApply.click();});

    btnBg.addEventListener('click',function(e){e.stopPropagation();bgMenu.classList.toggle('is-open');themeMenu.classList.remove('is-open');skinMenu.classList.remove('is-open');});
    bgMenu.addEventListener('click',function(e){e.stopPropagation();});
    bgWrap.appendChild(bgMenu);bgWrap.appendChild(btnBg);

    /* ── 樱花花瓣开关按钮 ────────────────────────────────── */
    var btnSakura=document.createElement('button');btnSakura.className='luliy-tb-btn';btnSakura.type='button';
    var sakuraOn=localStorage.getItem('luliy-sakura')!=='0';
    btnSakura.innerHTML='🌸';btnSakura.setAttribute('data-tip',sakuraOn?'关闭花瓣':'开启花瓣');
    if(!sakuraOn)btnSakura.classList.add('sakura-off');
    btnSakura.addEventListener('click',function(){
      var on=localStorage.getItem('luliy-sakura')!=='0';
      localStorage.setItem('luliy-sakura',on?'0':'1');
      btnSakura.innerHTML='🌸';btnSakura.setAttribute('data-tip',on?'开启花瓣':'关闭花瓣');
      btnSakura.classList.toggle('sakura-off',on);
      if(on){var c=document.getElementById('luliy-sakura-canvas');if(c)c.remove();}
      else initSakura();
      playSfx('click');
    });

    /* 点击外部关闭所有弹出菜单 */
    document.addEventListener('click',function(){
      themeMenu.classList.remove('is-open');
      skinMenu.classList.remove('is-open');
      bgMenu.classList.remove('is-open');
    });

    bar.appendChild(btnHome);
    bar.appendChild(btnGH);
    bar.appendChild(btnSfx);
    bar.appendChild(themeWrap);
    bar.appendChild(skinWrap);
    bar.appendChild(bgWrap);
    bar.appendChild(btnSakura);
    document.body.appendChild(bar);

    /* 恢复保存的主题和皮肤 */
    applyTheme(localStorage.getItem('luliy-theme')||'default');
    applySkin(localStorage.getItem('luliy-skin')||'default');
  }

  /* ─── ⑬ favorites 前端加密（SHA-256） ──────────────────────
   * 密码：121383
   * ──────────────────────────────────────────────────────── */
  function sha256(str){
    function rotR(x,n){return(x>>>n)|(x<<(32-n));}
    var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b6918,0xca63f227,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var bytes=[];
    for(var i=0;i<str.length;i++){var c=str.charCodeAt(i);if(c<128){bytes.push(c);}else if(c<2048){bytes.push(0xC0|(c>>6));bytes.push(0x80|(c&63));}else{bytes.push(0xE0|(c>>12));bytes.push(0x80|((c>>6)&63));bytes.push(0x80|(c&63));}}
    var bitLen=bytes.length*8;bytes.push(0x80);
    while((bytes.length%64)!==56)bytes.push(0);
    bytes.push(0,0,0,0);
    for(var j=24;j>=0;j-=8)bytes.push((bitLen>>j)&0xff);
    for(var i=0;i<bytes.length;i+=64){
      var W=[];
      for(var t=0;t<16;t++)W[t]=(bytes[i+t*4]<<24)|(bytes[i+t*4+1]<<16)|(bytes[i+t*4+2]<<8)|bytes[i+t*4+3];
      for(var t=16;t<64;t++){var s0=(rotR(W[t-15],7))^(rotR(W[t-15],18))^(W[t-15]>>>3);var s1=(rotR(W[t-2],17))^(rotR(W[t-2],19))^(W[t-2]>>>10);W[t]=(W[t-16]+s0+W[t-7]+s1)|0;}
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for(var t=0;t<64;t++){var S1=(rotR(e,6))^(rotR(e,11))^(rotR(e,25));var ch=(e&f)^(~e&g);var tmp1=(h+S1+ch+K[t]+W[t])|0;var S0=(rotR(a,2))^(rotR(a,13))^(rotR(a,22));var maj=(a&b)^(a&c)^(b&c);var tmp2=(S0+maj)|0;h=g;g=f;f=e;e=(d+tmp1)|0;d=c;c=b;b=a;a=(tmp1+tmp2)|0;}
      H[0]=(H[0]+a)|0;H[1]=(H[1]+b)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g)|0;H[7]=(H[7]+h)|0;
    }
    var hex='';for(var i=0;i<8;i++)hex+=('00000000'+((H[i]>>>0).toString(16))).slice(-8);return hex;
  }
  var LOCK_HASH=sha256('121383');
  var LOCK_KEY='luliy-unlocked-favorites';

  function isFavoritesPost(){
    var attr=(document.body.getAttribute('data-labels')||'')+
      ((document.getElementById('postBody')&&document.getElementById('postBody').getAttribute('data-labels'))||'');
    if(/favorites/i.test(attr))return true;
    var found=false;
    document.querySelectorAll('.Label,a.Label').forEach(function(el){if(/favorites/i.test(el.textContent))found=true;});
    if(!found)/favorites/i.test(document.title+location.href)&&(found=true);
    return found;
  }

  function initLock(){
    if(!document.getElementById('postBody'))return;
    function check(attempts){
      if(isFavoritesPost()){showLock();return;}
      if(attempts>0)setTimeout(function(){check(attempts-1);},300);
    }
    if(sessionStorage.getItem(LOCK_KEY)==='1')return;
    check(6);
  }

  function showLock(){
    if(document.getElementById('luliy-lock-overlay'))return;
    var pbody=document.getElementById('postBody');
    var ov=document.createElement('div');ov.id='luliy-lock-overlay';
    ov.innerHTML='<div class="luliy-lock-box"><span class="luliy-lock-icon">🔐</span><div class="luliy-lock-title">加密内容</div><div class="luliy-lock-hint">本文为私密收藏，请输入密码解锁</div><input class="luliy-lock-input" type="password" placeholder="输入密码" autocomplete="off"><button class="luliy-lock-btn" type="button">解 锁</button><div class="luliy-lock-err"></div></div>';
    document.body.appendChild(ov);
    pbody.style.filter='blur(18px)';pbody.style.userSelect='none';pbody.style.pointerEvents='none';
    var inp=ov.querySelector('.luliy-lock-input'),btn2=ov.querySelector('.luliy-lock-btn'),err=ov.querySelector('.luliy-lock-err');
    function tryUnlock(){
      if(!inp.value){err.textContent='请输入密码';return;}
      if(sha256(inp.value)===LOCK_HASH){
        sessionStorage.setItem(LOCK_KEY,'1');
        pbody.style.filter='';pbody.style.userSelect='';pbody.style.pointerEvents='';
        ov.style.opacity='0';ov.style.transition='opacity 0.4s ease';
        setTimeout(function(){ov.remove();},400);
      }else{
        err.textContent='密码错误，请重试';inp.classList.add('is-wrong');
        setTimeout(function(){inp.classList.remove('is-wrong');},600);
        inp.value='';inp.focus();
      }
    }
    btn2.addEventListener('click',tryUnlock);
    inp.addEventListener('keydown',function(e){if(e.key==='Enter')tryUnlock();});
    setTimeout(function(){inp.focus();},120);
  }

  /* ─── ⑭ 首页卡片重构 ────────────────────────────────────── */
  function initCards(){
    var nav=document.querySelector('nav.SideNav, ul.SideNav, .SideNav');
    if(!nav||nav.getAttribute('data-luliy-cards'))return;
    nav.setAttribute('data-luliy-cards','1');
    nav.classList.add('luliy-card-grid');
    nav.querySelectorAll('li.SideNav-item, .SideNav-item').forEach(function(li){
      li.classList.add('luliy-card');
    });
  }

  /* ─── ⑮ macOS 代码块三按钮 ──────────────────────────────── */
  function initCodeBlocks(pbody){
    pbody.querySelectorAll('pre').forEach(function(pre){
      if(pre.querySelector('.mac-btn'))return;
      var code=pre.querySelector('code');if(!code)return;
      function makeBtn(cls,tip){
        var b=document.createElement('button');b.type='button';b.className='mac-btn '+cls;
        b.setAttribute('data-tip',tip);b.setAttribute('aria-label',tip);return b;
      }
      var bR=makeBtn('mac-btn-red','复制代码');
      var bY=makeBtn('mac-btn-yellow','折叠代码');
      var bG=makeBtn('mac-btn-green','全屏阅读');
      bR.addEventListener('click',function(e){
        e.stopPropagation();playSfx('click');
        var txt=code.innerText||code.textContent||'';
        function done(){bR.setAttribute('data-tip','已复制 ✓');bR.classList.add('is-done');setTimeout(function(){bR.setAttribute('data-tip','复制代码');bR.classList.remove('is-done');},1500);}
        if(navigator.clipboard&&location.protocol==='https:')navigator.clipboard.writeText(txt).then(done).catch(done);
        else{var ta=document.createElement('textarea');ta.value=txt;ta.style.cssText='position:fixed;left:-9999px';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(e){console.log('copy failed');}document.body.removeChild(ta);}
      });
      bY.addEventListener('click',function(e){
        e.stopPropagation();playSfx('click');
        var f=pre.classList.toggle('is-folded');bY.classList.toggle('is-folded',f);bY.setAttribute('data-tip',f?'展开代码':'折叠代码');
      });
      function toggleFS(){playSfx('sci');var f=pre.classList.toggle('code-fullscreen');bG.setAttribute('data-tip',f?'退出全屏':'全屏阅读');}
      bG.addEventListener('click',function(e){e.stopPropagation();toggleFS();});
      pre.addEventListener('dblclick',function(e){if(e.target===bR||e.target===bY||e.target===bG)return;toggleFS();});
      document.addEventListener('keydown',function(e){if(e.key==='Escape'&&pre.classList.contains('code-fullscreen')){pre.classList.remove('code-fullscreen');bG.setAttribute('data-tip','全屏阅读');}});
      pre.appendChild(bR);pre.appendChild(bY);pre.appendChild(bG);
    });
  }

  /* ─── ⑯ 樱花花瓣效果 ────────────────────────────────────── */
  function initSakura(){
    if(localStorage.getItem('luliy-sakura')==='0')return;
    if(document.getElementById('luliy-sakura-canvas'))return;
    var canvas=document.createElement('canvas');canvas.id='luliy-sakura-canvas';
    document.body.appendChild(canvas);
    var ctx=canvas.getContext('2d'),W,H;
    function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;}
    resize();window.addEventListener('resize',resize,{passive:true});

    var COLORS=['#ffb7c5','#ffc0cb','#ff9eb5','#ffd0d8','#ffaec0','#f9c4d2','#fce4ec','#f8bbd0'];

    function mkPetal(randomY){
      var size=Math.random()*10+8;
      return{
        x:Math.random()*W,
        y:randomY?Math.random()*H:-size,
        size:size,
        opacity:Math.random()*0.55+0.25,
        speedX:Math.random()*1.2-0.6,
        speedY:Math.random()*0.7+0.35,
        rot:Math.random()*Math.PI*2,
        rotSpeed:(Math.random()-0.5)*0.038,
        swing:Math.random()*1.6+0.4,
        swingAngle:Math.random()*Math.PI*2,
        swingSpeed:0.008+Math.random()*0.018,
        color:COLORS[Math.floor(Math.random()*COLORS.length)]
      };
    }

    var petals=[];
    for(var i=0;i<45;i++)petals.push(mkPetal(true));

    function drawPetal(p){
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha=p.opacity;
      /* 花瓣形：双贝塞尔曲线 */
      var s=p.size;
      ctx.beginPath();
      ctx.moveTo(0,-s*0.5);
      ctx.bezierCurveTo( s*0.55,-s*0.55,  s*0.55, s*0.55, 0, s*0.5);
      ctx.bezierCurveTo(-s*0.55, s*0.55, -s*0.55,-s*0.55, 0,-s*0.5);
      ctx.fillStyle=p.color;
      ctx.fill();
      /* 花瓣中线纹 */
      ctx.beginPath();ctx.moveTo(0,-s*0.4);ctx.lineTo(0,s*0.4);
      ctx.strokeStyle='rgba(255,150,170,0.25)';ctx.lineWidth=0.6;ctx.stroke();
      ctx.restore();
    }

    var running=true;
    function tick(){
      if(!document.getElementById('luliy-sakura-canvas')){running=false;return;}
      ctx.clearRect(0,0,W,H);
      for(var i=0;i<petals.length;i++){
        var p=petals[i];
        p.swingAngle+=p.swingSpeed;
        p.x+=p.speedX+Math.sin(p.swingAngle)*p.swing;
        p.y+=p.speedY;
        p.rot+=p.rotSpeed;
        if(p.y>H+p.size*2||p.x<-p.size*4||p.x>W+p.size*4){
          petals[i]=mkPetal(false);
        }
        drawPetal(p);
      }
      if(running)requestAnimationFrame(tick);
    }
    tick();
  }

  /* ─── ⑰ 文章页初始化 ────────────────────────────────────── */
  root._luliyInitPost=function(){
    if(root._luliyPostInited)return; root._luliyPostInited=true;
    var pbody=document.getElementById('postBody');
    document.querySelectorAll('a[href^="http"]').forEach(function(a){if(!a.href.includes('luliy6.github.io'))a.target='_blank';});
    if(pbody)pbody.querySelectorAll('img').forEach(function(img){img.loading='lazy';});
    if(!pbody)return;
    if(!document.getElementById('luliy-readmeta')){
      var wc=pbody.innerText.length;
      var rt=document.createElement('p');rt.id='luliy-readmeta';
      rt.innerHTML='预计阅读：约 <strong>'+Math.max(1,Math.round(wc/300))+'</strong> 分钟 &nbsp;|&nbsp; 共 <strong>'+wc+'</strong> 字';
      rt.style.cssText='color:#888;font-size:13px;margin-bottom:1.5rem';
      pbody.insertBefore(rt,pbody.firstChild);
    }
    pbody.querySelectorAll('h1,h2,h3').forEach(function(h){
      if(h._luliyCopy)return; h._luliyCopy=true; h.style.cursor='pointer'; h.title='点击复制链接';
      h.addEventListener('click',function(){
        var url=location.href.split('#')[0]+'#'+h.id;
        if(navigator.clipboard)navigator.clipboard.writeText(url);
        var tip=document.createElement('span');tip.textContent=' ✓';tip.style.cssText='font-size:12px;color:#1f883d;font-weight:normal';
        h.appendChild(tip);setTimeout(function(){tip.remove();},2000);
      });
    });
    initCodeBlocks(pbody);
    /* 上一篇 / 下一篇 */
    fetchPosts().then(function(posts){
      var cur=location.pathname.replace(/\/$/,''),idx=-1;
      posts.forEach(function(p,i){if(p.link&&p.link.replace(/\/$/,'')===cur)idx=i;});
      if(idx<0)return;
      var nav=document.createElement('div');
      nav.style.cssText='display:flex;justify-content:space-between;gap:16px;margin-top:40px;padding-top:20px;border-top:2px dashed rgba(9,105,218,0.2)';
      function mkNav(post,label,align){
        if(!post)return document.createElement('div');
        var a=document.createElement('a');a.href=post.link;
        a.style.cssText='flex:1;padding:14px 18px;border-radius:12px;background:rgba(9,105,218,0.05);border:1px solid rgba(9,105,218,0.15);text-decoration:none;transition:all 0.25s;text-align:'+align;
        a.innerHTML='<span style="display:block;font-size:11px;color:#888;margin-bottom:4px">'+label+'</span><span style="color:#0969da;font-weight:bold;font-size:14px">'+esc(post.title)+'</span>';
        a.addEventListener('mouseover',function(){a.style.background='rgba(9,105,218,0.12)';a.style.transform='translateY(-2px)';});
        a.addEventListener('mouseout',function(){a.style.background='rgba(9,105,218,0.05)';a.style.transform='';});
        return a;
      }
      nav.appendChild(mkNav(posts[idx+1]||null,'⬅ 上一篇','left'));
      nav.appendChild(mkNav(posts[idx-1]||null,'下一篇 ➡','right'));
      pbody.appendChild(nav);
    }).catch(function(){});
    /* 赞赏面板 */
    var sp=document.createElement('div');sp.style.cssText='margin-top:50px;text-align:center';
    var spb=document.createElement('button');spb.innerHTML='✨ 和作者无限进步';
    spb.style.cssText='padding:12px 28px;border-radius:30px;border:none;background:linear-gradient(90deg,#f0b429,#ff6b9d);color:#fff;font-weight:bold;font-size:15px;cursor:pointer;box-shadow:0 4px 15px rgba(240,180,41,0.3);transition:all 0.3s';
    var qr=document.createElement('div');
    qr.innerHTML='<p style="font-size:13px;color:#888;margin:10px 0">无限进步，进步有你！</p><img src="https://raw.githubusercontent.com/luliy6/img/refs/heads/main/me.jpg" alt="赞赏二维码" style="width:200px;height:200px;border-radius:8px">';
    qr.style.cssText='height:0;overflow:hidden;transition:height 0.4s ease,opacity 0.4s ease;opacity:0';
    spb.addEventListener('mouseover',function(){spb.style.transform='translateY(-2px)';});
    spb.addEventListener('mouseout',function(){spb.style.transform='';});
    spb.addEventListener('click',function(){var o=!qr.style.height||qr.style.height==='0px';qr.style.height=o?'260px':'0px';qr.style.opacity=o?'1':'0';});
    sp.appendChild(spb);sp.appendChild(qr);pbody.appendChild(sp);
  };

  /* ─── ⑱ 首页初始化 ──────────────────────────────────────── */
  root._luliyInitIndex=function(){
    initCards();
    if(location.pathname.includes('archive')){
      var pb=document.getElementById('postBody');
      if(pb){
        pb.innerHTML='<p style="color:#888;font-size:14px">正在加载归档...</p>';
        fetchPosts().then(function(posts){
          var byY={};
          posts.forEach(function(p){var y=(p.created||'未知').slice(0,4);if(!byY[y])byY[y]=[];byY[y].push(p);});
          var years=Object.keys(byY).sort(function(a,b){return b-a;});
          var html='<h1 style="border-bottom:2px solid rgba(240,180,41,0.4);padding-bottom:10px;margin-bottom:30px">📅 文章归档</h1>';
          years.forEach(function(y){
            html+='<div class="tl-year">'+y+' 年</div><ul class="tl-list">';
            byY[y].forEach(function(p){var md=(p.created||'').slice(5,10).replace(/-/g,'/');html+='<li class="tl-item"><a href="'+esc(p.link)+'">'+esc(p.title)+'</a><span class="tl-date">'+md+'</span></li>';});
            html+='</ul>';
          });
          pb.innerHTML=html;
        }).catch(function(){pb.innerHTML='<p style="color:#e74c3c">归档加载失败，请刷新重试。</p>';});
      }
    }
  };

  /* ─── ⑲ 主入口 ──────────────────────────────────────────── */
  initLocalStorage();

  /* 立即恢复主题 & 皮肤（防 FOUC） */
  var savedTheme=localStorage.getItem('luliy-theme')||'default';
  var savedSkin=localStorage.getItem('luliy-skin')||'default';
  document.body.setAttribute('data-luliy-theme',savedTheme);
  if(savedSkin!=='default')document.body.setAttribute('data-skin',savedSkin);

  /* 立即恢复背景图片（防 FOUC） */
  (function(){
    var bg=localStorage.getItem('luliy-bg');
    if(!bg)return;
    function applyBg(){
      document.body.style.backgroundImage='url('+bg+')';
      document.body.style.backgroundSize='cover';
      document.body.style.backgroundAttachment='fixed';
      document.body.style.backgroundPosition='center';
      document.body.style.backgroundRepeat='no-repeat';
    }
    if(document.body)applyBg();
    else document.addEventListener('DOMContentLoaded',applyBg);
  })();

  /* 粒子背景 */
  if(localStorage.getItem('luliy-particles')!=='0'){
    if(document.body)initParticles();
    else document.addEventListener('DOMContentLoaded',initParticles);
  }

  /* 樱花花瓣（DOMContentLoaded 后初始化） */
  if(localStorage.getItem('luliy-sakura')!=='0'){
    if(document.body)initSakura();
    else document.addEventListener('DOMContentLoaded',initSakura);
  }

  ready(function(){
    initProgressBar();
    initDynamicTitle();
    initUptime();
    initSfxEvents();
    initClickSparks();
    initThemeRipple();
    initTagEnhance();
    initAvatarClock();
    initLightbox();
    initToolbar();
    initLock();

    var path=location.pathname;
    var isPost=!!document.getElementById('postBody');
    var isIndex=path==='/'||path==='/index.html'||path==='';
    var isArchive=path.includes('archive');
    var hasList=!!document.querySelector('.SideNav,.post-item,.postList,.post-list');

    if(isPost)root._luliyInitPost();
    if(isIndex||isArchive||(!isPost&&hasList))root._luliyInitIndex();
  });

})(window);
