/* enhance.js - Luliy Blog v9 Enhanced
   Modules:
   00  Welcome splash
   01  localStorage init
   02  Progress bar
   03  Dynamic title
   04  Uptime counter
   05  Dark-mode ripple
   06  Static background (particles removed)
   07  Web Audio SFX
   08  Click sparks
   09  Hero cluster (avatar + name + clock)
   10  Hero banner (homepage scroll-fold)
   11  Tag page search toolbar
   12  Image lightbox
   13  Floating toolbar + unified sink (4 themes)
   14  Home card rebuild
   15  macOS code block strip (with proper wrapper)
   16  Sakura petals
   17  ArticleTOC scroll-spy + back-to-top + TOC panel
   18  Mobile nav hamburger + dropdown (enhanced)
   19  Search overlay
   20  Homepage bottom gallery banner
   21  Post page init
   22  Index page init
   23  Main entry
*/
(function (root) {
  'use strict';

  /* ---- Utilities ------------------------------------------ */
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isIndexPage() {
    return location.pathname === '/' ||
      location.pathname === '/index.html' ||
      location.pathname === '';
  }
  function isArchivePage() {
    return location.pathname.includes('archive');
  }
  function fetchPosts() {
    function norm(data) {
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        var colorDict = data.labelColorDict || {};
        return Object.keys(data)
          .filter(function (k) { return k !== 'labelColorDict'; })
          .map(function (k) {
            var p = data[k] || {};
            if (typeof p === 'string') p = { postTitle: p };
            var rawLabels = p.labels || p.tags || [];
            var labels = rawLabels.map(function (lbl) {
              return {
                name: lbl,
                color: (colorDict[lbl] || '0969da').replace(/^#/, '')
              };
            });
            return {
              title: p.postTitle || p.title || p.name || k,
              link:  p.postUrl  || p.link  || p.url  || ('post/' + k + '.html'),
              created: p.createdDate || p.created || p.date || '',
              labels: labels,
              pinned: rawLabels.indexOf('pinned') >= 0
            };
          });
      }
      return [];
    }
    var tryUrls = [location.origin + '/postList.json', '/postList.json'];
    function tryNext(urls) {
      if (!urls.length) return Promise.resolve([]);
      return fetch(urls[0], { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .catch(function () { return tryNext(urls.slice(1)); });
    }
    return tryNext(tryUrls).then(norm);
  }

  /* ---- 00  Welcome splash ---------------------------------- */
  function initWelcomeSplash() {
    if (sessionStorage.getItem('luliy-welcomed') === '1') return;

    var splash = document.createElement('div');
    splash.id = 'luliy-welcome';

    var inner = document.createElement('div');
    inner.id = 'luliy-welcome-inner';

    var title = document.createElement('div');
    title.id = 'luliy-welcome-title';
    title.textContent = '\u6b22\u8fce\u6765\u5230 Luliy \u7684\u4e16\u754c';

    var sub = document.createElement('div');
    sub.id = 'luliy-welcome-sub';
    sub.textContent = '\u6211\u5c06\u65e0\u9650\u8fdb\u6b65\uff01';

    var btn = document.createElement('button');
    btn.id = 'luliy-welcome-btn';
    btn.textContent = '\u70b9\u51fb\u8fdb\u5165';

    var hint = document.createElement('div');
    hint.id = 'luliy-welcome-hint';
    hint.textContent = '\u25bc  ENTER';

    inner.appendChild(title);
    inner.appendChild(sub);
    inner.appendChild(btn);
    splash.appendChild(inner);
    splash.appendChild(hint);
    document.body.appendChild(splash);
    document.body.style.overflow = 'hidden';

    function enter() {
      sessionStorage.setItem('luliy-welcomed', '1');
      splash.classList.add('is-leaving');
      document.body.style.overflow = '';
      setTimeout(function () { if (splash.parentNode) splash.remove(); }, 950);
    }

    btn.addEventListener('click', function (e) { e.stopPropagation(); enter(); });

    var kHandler = function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        document.removeEventListener('keydown', kHandler);
        enter();
      }
    };
    document.addEventListener('keydown', kHandler);
  }

  /* ---- 01  localStorage init ------------------------------ */
  function initLocalStorage() {
    var defs = {
      'luliy-sfx':    '1',
      'luliy-sakura': '1',
      'luliy-sink':   'default'
    };
    Object.keys(defs).forEach(function (k) {
      if (localStorage.getItem(k) === null) localStorage.setItem(k, defs[k]);
    });
  }

  /* ---- 02  Progress bar ----------------------------------- */
  function initProgressBar() {
    var bar = document.createElement('div');
    bar.id = 'luliy-progress-bar';
    document.body.appendChild(bar);
    window.addEventListener('scroll', function () {
      var st = window.scrollY || document.documentElement.scrollTop;
      var dh = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = (dh > 0 ? Math.round(st / dh * 100) : 0) + '%';
    }, { passive: true });
  }

  /* ---- 03  Dynamic title ---------------------------------- */
  function initDynamicTitle() {
    var ori = document.title, t;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearTimeout(t);
        document.title = '\uD83D\uDC40 \u522b\u8d70\u554a\uff0c\u6211\u8fd8\u5728\u8fdb\u6b65\uff01';
      } else {
        document.title = '\u2728 \u6b22\u8fce\u56de\u6765\uff01 ' + ori;
        t = setTimeout(function () { document.title = ori; }, 2000);
      }
    });
  }

  /* ---- 04  Uptime counter --------------------------------- */
  function initUptime() {
    var el = document.getElementById('luliy-uptime');
    if (!el) {
      el = document.createElement('div');
      el.id = 'luliy-uptime';
      document.body.appendChild(el);
    }
    var start = new Date('2026/05/30 00:00:00').getTime();
    function upd() {
      var d = Date.now() - start;
      if (d < 0) {
        el.innerHTML = '\uD83D\uDE80 \u535A\u5BA2\u5373\u5C06\u4E0A\u7EBF\uFF0C\u656C\u8BF7\u671F\u5F85...';
        return;
      }
      el.innerHTML = '\uD83C\uDF31 \u672C\u7AD9\u5DF2\u966A\u4F34\u4F60\u65E0\u9650\u8FDB\u6B65\uFF1A' +
        Math.floor(d / 86400000) + '\u5929 ' +
        Math.floor((d % 86400000) / 3600000) + '\u5C0F\u65F6 ' +
        Math.floor((d % 3600000) / 60000) + '\u5206 ' +
        '<span style="color:#ff4444;font-weight:bold">' +
        Math.floor((d % 60000) / 1000) + '</span>\u79D2';
    }
    upd(); setInterval(upd, 1000);
  }

  /* ---- 05  Dark-mode theme ripple ------------------------- */
  function initThemeRipple() {
    function ripple() {
      playSfx('theme');
      var old = document.getElementById('luliy-theme-ripple');
      if (old) old.remove();
      var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      var maxR = Math.sqrt(cx * cx + cy * cy) * 2.2;
      var rip = document.createElement('div');
      rip.id = 'luliy-theme-ripple';
      rip.style.width = rip.style.height = maxR + 'px';
      rip.style.left = (cx - maxR / 2) + 'px';
      rip.style.top = (cy - maxR / 2) + 'px';
      rip.style.background = 'radial-gradient(circle, rgba(240,180,41,0.25), transparent)';
      document.body.appendChild(rip);
      rip.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
        duration: 600, easing: 'cubic-bezier(.4,0,.2,1)'
      }).onfinish = function () { rip.remove(); };
    }
    var themeBtn = document.querySelector('[title*="Theme"]') || document.querySelector('[aria-label*="theme"]');
    if (themeBtn) themeBtn.addEventListener('click', ripple);
  }

  /* ---- 06  Static background (particles removed) --------- */
  /* (handled by CSS) */

  /* ---- 07  Web Audio SFX ---------------------------------- */
  function playSfx(type) {
    if (localStorage.getItem('luliy-sfx') !== '1') return;
    try {
      var freq = { click: 800, theme: 600, hover: 400 }[type] || 600;
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }
  function initSfxEvents() {
    document.addEventListener('click', function (e) {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) playSfx('click');
    }, { passive: true });
  }

  /* ---- 08  Click sparks ----------------------------------- */
  function initClickSparks() {
    document.addEventListener('click', function (e) {
      if (e.target.closest('[role="button"], button, a, input, select')) return;
      var sp = document.createElement('span');
      sp.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;' +
        'pointer-events:none;font-size:16px;z-index:99999;color:#f0b429';
      sp.innerHTML = '\u2728';
      document.body.appendChild(sp);
      sp.animate([
        { transform: 'translateY(0) scale(1)', opacity: 1 },
        { transform: 'translateY(-40px) scale(0.6)', opacity: 0 }
      ], { duration: 600, easing: 'cubic-bezier(.4,0,.2,1)' })
        .onfinish = function () { sp.remove(); };
    }, { passive: true });
  }

  /* ---- 09  Hero cluster (avatar + name + clock) --------- */
  function initHeroCluster() {
    if (!isIndexPage()) return;
    var html = document.querySelector('html');
    var titleElem = document.querySelector('.Header-link img, .Header-link [title], .Header-link a');
    if (!titleElem) return;

    var avatarUrl = titleElem.src || titleElem.parentElement?.querySelector('img')?.src || '';
    var heroName = html?.getAttribute('data-color-mode') === 'dark' ? 'Luliy' : 'Luliy';

    var cluster = document.createElement('div');
    cluster.id = 'luliy-hero-cluster';

    if (avatarUrl) {
      var img = document.createElement('img');
      img.id = 'luliy-hero-avatar';
      img.src = avatarUrl;
      img.alt = heroName;
      cluster.appendChild(img);
    }

    var name = document.createElement('h1');
    name.id = 'luliy-hero-name';
    name.textContent = heroName;
    cluster.appendChild(name);

    var bio = document.createElement('p');
    bio.id = 'luliy-hero-bio';
    bio.textContent = '\u6211\u5C06\u65E0\u9650\u8FDB\u6B65';
    cluster.appendChild(bio);

    var clock = document.createElement('div');
    clock.id = 'luliy-hero-clock';
    var updateClock = function () {
      var now = new Date();
      clock.textContent = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    };
    updateClock();
    setInterval(updateClock, 1000);
    cluster.appendChild(clock);

    var heroMain = document.querySelector('#content, .main, .container');
    if (heroMain) heroMain.insertBefore(cluster, heroMain.firstChild);
  }

  /* ---- 10  Hero banner (homepage scroll-fold) ----------- */
  function initHeroBanner() {
    var banner = document.createElement('div');
    banner.id = 'luliy-hero-banner';
    var text = document.createElement('div');
    text.id = 'luliy-hero-banner-text';
    text.textContent = '\ud83d\ude4b \u4f60\u597d\uff0c\u4e00\u8d77\u65e0\u9650\u8fdb\u6b65\u5427';
    banner.appendChild(text);

    var main = document.querySelector('#content, .main, .container');
    if (main) {
      var cluster = main.querySelector('#luliy-hero-cluster');
      if (cluster) main.insertBefore(banner, cluster.nextSibling);
      else main.insertBefore(banner, main.firstChild);
    }
  }

  /* ---- 11  Tag page search toolbar --------------------- */
  function initTagEnhance() {
    var tags = document.querySelectorAll('[class*="topic"], .topic-tag, .tag');
    tags.forEach(function (tag) {
      tag.style.transition = 'all 0.2s';
      tag.addEventListener('mouseenter', function () {
        this.style.transform = 'scale(1.1)';
      });
      tag.addEventListener('mouseleave', function () {
        this.style.transform = 'scale(1)';
      });
    });
  }

  /* ---- 12  Image lightbox -------------------------------- */
  function initLightbox() {
    var box = document.createElement('div');
    box.id = 'luliy-lightbox';

    var close = document.createElement('div');
    close.id = 'luliy-lightbox-close';
    close.innerHTML = '&times;';
    box.appendChild(close);

    document.body.appendChild(box);

    var imgs = document.querySelectorAll('#postBody img:not([src*="avatar"])');
    imgs.forEach(function (img) {
      img.style.cursor = 'pointer';
      img.addEventListener('click', function () {
        var imgCopy = document.createElement('img');
        imgCopy.src = this.src;
        box.innerHTML = '';
        close.innerHTML = '&times;';
        box.appendChild(imgCopy);
        box.appendChild(close);
        box.classList.add('is-open');
      });
    });

    var closeFunc = function () { box.classList.remove('is-open'); };
    close.addEventListener('click', closeFunc);
    box.addEventListener('click', function (e) {
      if (e.target === box) closeFunc();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeFunc();
    });
  }

  /* ---- 13  Floating toolbar + unified sink (4 themes) --- */
  function initToolbar() {
    var toolbar = document.createElement('div');
    toolbar.id = 'luliy-toolbar';

    var audioBtn = document.createElement('button');
    audioBtn.className = 'luliy-tb-btn';
    audioBtn.setAttribute('data-label', 'Audio SFX');
    audioBtn.innerHTML = '\ud83d\udd0a';
    audioBtn.addEventListener('click', function () {
      var sink = document.getElementById('luliy-audio-sink');
      sink.classList.toggle('is-open');
      document.getElementById('luliy-theme-sink').classList.remove('is-open');
      document.getElementById('luliy-sakura-sink').classList.remove('is-open');
    });
    toolbar.appendChild(audioBtn);

    var audioSink = document.createElement('div');
    audioSink.id = 'luliy-audio-sink';
    var audioOpts = [
      { label: '\u4f1a\u58f0', val: '1' },
      { label: '\u9759\u97f3', val: '0' }
    ];
    audioOpts.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'luliy-sink-item';
      btn.textContent = opt.label;
      if (localStorage.getItem('luliy-sfx') === opt.val) btn.classList.add('is-active');
      btn.addEventListener('click', function () {
        localStorage.setItem('luliy-sfx', opt.val);
        audioSink.querySelectorAll('button').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
      });
      audioSink.appendChild(btn);
    });
    toolbar.appendChild(audioSink);

    var themeBtn = document.createElement('button');
    themeBtn.className = 'luliy-tb-btn';
    themeBtn.setAttribute('data-label', 'Theme');
    themeBtn.innerHTML = '\ud83c\udf1f';
    themeBtn.addEventListener('click', function () {
      var sink = document.getElementById('luliy-theme-sink');
      sink.classList.toggle('is-open');
      document.getElementById('luliy-audio-sink').classList.remove('is-open');
      document.getElementById('luliy-sakura-sink').classList.remove('is-open');
    });
    toolbar.appendChild(themeBtn);

    var themeSink = document.createElement('div');
    themeSink.id = 'luliy-theme-sink';
    var themes = [
      { label: '\u9ed8\u8ba4', val: 'default' },
      { label: '\u6a31\u82b1', val: 'sakura' },
      { label: '\u4f60\u7684\u540d\u5b57', val: 'your-name' },
      { label: '\u661f\u7a7a', val: 'space' }
    ];
    themes.forEach(function (theme) {
      var btn = document.createElement('button');
      btn.className = 'luliy-sink-item';
      btn.textContent = theme.label;
      if (localStorage.getItem('luliy-sink') === theme.val) btn.classList.add('is-active');
      btn.addEventListener('click', function () {
        localStorage.setItem('luliy-sink', theme.val);
        location.reload();
      });
      themeSink.appendChild(btn);
    });
    toolbar.appendChild(themeSink);

    var sakuraBtn = document.createElement('button');
    sakuraBtn.className = 'luliy-tb-btn';
    sakuraBtn.setAttribute('data-label', 'Cherry Blossom');
    sakuraBtn.innerHTML = '\ud83c\udf38';
    sakuraBtn.addEventListener('click', function () {
      var sink = document.getElementById('luliy-sakura-sink');
      sink.classList.toggle('is-open');
      document.getElementById('luliy-audio-sink').classList.remove('is-open');
      document.getElementById('luliy-theme-sink').classList.remove('is-open');
    });
    toolbar.appendChild(sakuraBtn);

    var sakuraSink = document.createElement('div');
    sakuraSink.id = 'luliy-sakura-sink';
    var sakuraOpts = [
      { label: '\u542b\u82b1\u66f2', val: '1' },
      { label: '\u65e0\u82b1\u66f2', val: '0' }
    ];
    sakuraOpts.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'luliy-sink-item';
      btn.textContent = opt.label;
      if (localStorage.getItem('luliy-sakura') === opt.val) btn.classList.add('is-active');
      btn.addEventListener('click', function () {
        localStorage.setItem('luliy-sakura', opt.val);
        sakuraSink.querySelectorAll('button').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        location.reload();
      });
      sakuraSink.appendChild(btn);
    });
    toolbar.appendChild(sakuraSink);

    document.body.appendChild(toolbar);
  }

  /* ---- 14  Home card rebuild ----------------------------- */
  function initCards() {
    var postList = document.querySelector('.post-list, .postList, [class*="post-item"]');
    if (!postList) return;

    var items = postList.querySelectorAll('.post-item, [class*="post-item"]');
    if (!items.length) return;

    var grid = document.createElement('div');
    grid.className = 'luliy-card-grid';

    items.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'luliy-card';

      var titleElem = item.querySelector('h2, h3, .post-title, [class*="title"]');
      var linkElem = item.querySelector('a');
      var dateElem = item.querySelector('time, .post-date, [class*="date"]');

      var titleText = titleElem?.textContent || 'Untitled';
      var link = linkElem?.href || '#';
      var dateText = dateElem?.textContent || '';

      var cardTitle = document.createElement('div');
      cardTitle.className = 'luliy-card-title';
      cardTitle.textContent = titleText;

      var cardDesc = document.createElement('p');
      cardDesc.className = 'luliy-card-desc';
      cardDesc.textContent = (item.textContent || '').substring(titleText.length, titleText.length + 100);

      var cardDate = document.createElement('div');
      cardDate.className = 'luliy-card-date';
      cardDate.textContent = dateText;

      card.appendChild(cardTitle);
      card.appendChild(cardDesc);
      card.appendChild(cardDate);

      card.style.cursor = 'pointer';
      card.addEventListener('click', function () { location.href = link; });

      grid.appendChild(card);
    });

    if (postList.parentNode) {
      var pinned = [];
      items.forEach(function (item) {
        if (item.classList.contains('pinned') || item.textContent.includes('pinned')) {
          pinned.push(item);
        }
      });

      if (pinned.length > 0) {
        var pinnedBox = document.createElement('div');
        pinnedBox.className = 'luliy-pinned-box';
        var label = document.createElement('div');
        label.className = 'luliy-pinned-label';
        label.textContent = '\ud83d\udcc4 \u7b59\u7ae0\u6587\u7ae0';
        pinnedBox.appendChild(label);
        var pinnedItems = document.createElement('div');
        pinnedItems.className = 'luliy-pinned-items';
        pinned.forEach(function (item) {
          var pItem = document.createElement('div');
          pItem.className = 'luliy-pinned-item';
          pItem.innerHTML = item.innerHTML;
          pinnedItems.appendChild(pItem);
        });
        pinnedBox.appendChild(pinnedItems);
        postList.parentNode.insertBefore(pinnedBox, postList);
      }

      postList.parentNode.replaceChild(grid, postList);
    }
  }

  /* ---- 15  macOS code block strip (with proper wrapper) - */
  function initCodeBlocks(container) {
    var blocks = (container || document).querySelectorAll('pre');
    blocks.forEach(function (pre) {
      if (pre._luliyMacInit) return;
      pre._luliyMacInit = true;

      var code = pre.querySelector('code');
      var lang = code?.className?.match(/language-(\w+)/)?.[1] || '';
      var titlebar = document.createElement('div');
      titlebar.className = 'luliy-mac-titlebar';

      var dots = ['red', 'yellow', 'green'];
      dots.forEach(function (color) {
        var dot = document.createElement('div');
        dot.className = 'luliy-mac-dot ' + color;
        titlebar.appendChild(dot);
      });

      var langSpan = document.createElement('span');
      langSpan.className = 'luliy-mac-lang';
      langSpan.textContent = lang || 'code';
      titlebar.appendChild(langSpan);

      pre.insertBefore(titlebar, pre.firstChild);
    });
  }

  /* ---- 16  Sakura petals -------------------------------  */
  function initSakura() {
    var canvas = document.getElementById('luliy-sakura-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'luliy-sakura-canvas';
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      document.body.appendChild(canvas);
    }

    var ctx = canvas.getContext('2d');
    var particles = [];

    function Petal() {
      this.x = Math.random() * canvas.width;
      this.y = -10;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = Math.random() * 2 + 1;
      this.size = Math.random() * 3 + 2;
      this.rot = Math.random() * Math.PI;
      this.rotVel = (Math.random() - 0.5) * 0.1;
      this.life = 1;
    }

    Petal.prototype.update = function () {
      this.x += this.vx;
      this.y += this.vy;
      this.rot += this.rotVel;
      if (this.y > canvas.height) this.life = 0;
    };

    Petal.prototype.draw = function (ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.fillStyle = 'rgba(255,182,193,' + this.life * 0.6 + ')';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size, this.size / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.02) particles.push(new Petal());

      for (var i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].life <= 0) particles.splice(i, 1);
      }

      requestAnimationFrame(animate);
    }

    window.addEventListener('resize', function () {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    animate();
  }

  /* ---- 17  ArticleTOC scroll-spy + back-to-top + TOC panel */
  function initArticleTocSpy() {
    var pbody = document.getElementById('postBody');
    if (!pbody) return;

    var headings = pbody.querySelectorAll('h1, h2, h3');
    if (!headings.length) return;

    // Create back-to-top button
    if (!document.getElementById('luliy-back-top')) {
      var backTop = document.createElement('button');
      backTop.id = 'luliy-back-top';
      backTop.innerHTML = '\u2191';
      backTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
      document.body.appendChild(backTop);
    }

    // Create TOC panel
    if (!document.getElementById('luliy-toc-panel')) {
      var tocPanel = document.createElement('div');
      tocPanel.id = 'luliy-toc-panel';

      var tocTitle = document.createElement('div');
      tocTitle.id = 'luliy-toc-title';
      tocTitle.textContent = '\u4e00\u81f3\u4e8e\u6b23\u8d4f';
      tocPanel.appendChild(tocTitle);

      var tocList = document.createElement('ul');
      tocList.id = 'luliy-toc-list';

      headings.forEach(function (h, idx) {
        if (!h.id) h.id = 'heading-' + idx;

        var level = parseInt(h.tagName[1]);
        var li = document.createElement('li');
        li.style.marginLeft = (level - 1) * 12 + 'px';

        var a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent;
        a.dataset.headingId = h.id;

        a.addEventListener('click', function (e) {
          e.preventDefault();
          h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        li.appendChild(a);
        tocList.appendChild(li);
      });

      tocPanel.appendChild(tocList);

      // Add back-to-top to TOC panel
      var backBtn = document.createElement('button');
      backBtn.id = 'luliy-toc-back';
      backBtn.innerHTML = '\u2191 \u8fd4\u56de\u9876\u90e8';
      backBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
      tocPanel.appendChild(backBtn);

      document.body.appendChild(tocPanel);
    }

    // Scroll spy
    var updateSpyOnScroll = function () {
      var tocLinks = document.querySelectorAll('#luliy-toc-list a');
      var backTop = document.getElementById('luliy-back-top');
      var tocPanel = document.getElementById('luliy-toc-panel');
      var st = window.scrollY || document.documentElement.scrollTop;

      if (st > 200) {
        if (backTop) backTop.classList.add('is-visible');
        if (tocPanel) tocPanel.classList.add('is-visible');
      } else {
        if (backTop) backTop.classList.remove('is-visible');
        if (tocPanel) tocPanel.classList.remove('is-visible');
      }

      var activeHeading = null;
      headings.forEach(function (h) {
        var rect = h.getBoundingClientRect();
        if (rect.top <= 100) activeHeading = h;
      });

      tocLinks.forEach(function (link) {
        link.classList.remove('is-active');
        if (activeHeading && link.dataset.headingId === activeHeading.id) {
          link.classList.add('is-active');
        }
      });
    };

    window.addEventListener('scroll', updateSpyOnScroll, { passive: true });
    updateSpyOnScroll();

    // Mark post page for navbar transparency
    document.body.classList.add('luliy-post-page');
  }

  /* ---- 18  Mobile nav hamburger + dropdown (enhanced) --- */
  function initMobileNav() {
    var header = document.querySelector('.Header');
    if (!header) return;

    var hamBtn = document.createElement('button');
    hamBtn.id = 'luliy-nav-ham';
    hamBtn.style.cssText = 'display:none;flex:none;width:40px;height:40px;' +
      'background:transparent;border:none;cursor:pointer;color:inherit;font-size:20px';
    hamBtn.innerHTML = '\u2630';

    var dropdown = document.createElement('div');
    dropdown.id = 'luliy-nav-dropdown';
    dropdown.style.cssText = 'display:none;position:fixed;top:64px;left:0;right:0;z-index:9998;' +
      'background:rgba(255,255,255,0.95);backdrop-filter:blur(12px);border-bottom:1px solid rgba(130,80,223,0.15);' +
      'padding:12px;flex-direction:column;gap:4px';

    var navLinks = header.querySelectorAll('.Header-item:not(:first-child)');
    navLinks.forEach(function (link) {
      var btn = document.createElement('button');
      btn.style.cssText = 'display:flex;align-items:center;justify-content:flex-start;gap:12px;' +
        'width:100%;padding:12px 16px;background:transparent;border:none;cursor:pointer;' +
        'font-size:14px;color:#1e1032;border-radius:8px;transition:all 0.2s';
      btn.innerHTML = link.innerHTML;
      btn.addEventListener('mouseover', function () { this.style.background = 'rgba(130,80,223,0.08)'; });
      btn.addEventListener('mouseout', function () { this.style.background = 'transparent'; });
      btn.addEventListener('click', function () {
        var target = link.querySelector('a');
        if (target) location.href = target.href;
        dropdown.style.display = 'none';
        hamBtn.innerHTML = '\u2630';
      });
      dropdown.appendChild(btn);
    });

    header.appendChild(hamBtn);
    document.body.appendChild(dropdown);

    hamBtn.addEventListener('click', function () {
      var isOpen = dropdown.style.display === 'flex';
      dropdown.style.display = isOpen ? 'none' : 'flex';
      hamBtn.innerHTML = isOpen ? '\u2630' : '\u00d7';
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('#luliy-nav-ham') && !e.target.closest('#luliy-nav-dropdown')) {
        dropdown.style.display = 'none';
        hamBtn.innerHTML = '\u2630';
      }
    });
  }

  /* ---- 19  Search overlay -------------------------------- */
  function initSearchOverlay() {
    var overlay = document.createElement('div');
    overlay.id = 'luliy-search-overlay';

    var box = document.createElement('div');
    box.id = 'luliy-search-box';

    var input = document.createElement('input');
    input.id = 'luliy-search-input';
    input.type = 'text';
    input.placeholder = '\u641c\u7d22\u6587\u7ae0...';
    box.appendChild(input);

    var results = document.createElement('div');
    results.id = 'luliy-search-results';
    box.appendChild(results);

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    var searchBtn = document.querySelector('[title*="Search"], [aria-label*="search"]');
    if (searchBtn) {
      searchBtn.addEventListener('click', function () {
        overlay.classList.add('is-open');
        input.focus();
      });
    }

    var closeSearch = function () { overlay.classList.remove('is-open'); };
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSearch(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSearch();
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        overlay.classList.toggle('is-open');
        if (overlay.classList.contains('is-open')) input.focus();
      }
    });

    input.addEventListener('input', function () {
      var q = input.value.toLowerCase();
      if (!q) { results.innerHTML = ''; return; }

      fetchPosts().then(function (posts) {
        var matches = posts.filter(function (p) {
          return p.title.toLowerCase().includes(q);
        }).slice(0, 8);

        results.innerHTML = '';
        if (matches.length === 0) {
          results.innerHTML = '<p style="color:#888;font-size:13px;padding:12px">\u6ca1\u6709\u627e\u5230\u7b26\u5408\u7684\u6587\u7ae0</p>';
          return;
        }

        matches.forEach(function (post) {
          var item = document.createElement('a');
          item.className = 'luliy-search-item';
          item.href = buildPostLink(post.link);
          item.innerHTML = '<span class="luliy-search-title">' + esc(post.title) + '</span>' +
            '<span class="luliy-search-date">' + (post.created || '') + '</span>';
          results.appendChild(item);
        });
      }).catch(function () {});
    });
  }

  /* ---- 20  Homepage bottom gallery banner -------------- */
  function initHomeGallery() {
    if (!isIndexPage()) return;
    var gal = document.createElement('div');
    gal.id = 'luliy-home-gallery';
    var img = document.createElement('img');
    img.src = 'https://raw.githubusercontent.com/luliy6/img/refs/heads/main/banner.jpg';
    img.alt = 'Gallery Banner';
    gal.appendChild(img);

    var overlay = document.createElement('div');
    overlay.id = 'luliy-home-gallery-overlay';
    var text = document.createElement('div');
    text.id = 'luliy-home-gallery-text';
    text.innerHTML = '\ud83c\udf1f \u63a5\u4e0b\u6765\u7684\u65e5\u5b50';
    overlay.appendChild(text);
    gal.appendChild(overlay);

    var main = document.querySelector('#content, .main, .container');
    if (main) main.appendChild(gal);
  }

  /* ---- 21  Post page init ------------------------------ */
  root._luliyInitPost = function () {
    var pbody = document.getElementById('postBody');
    if (!pbody) return;

    /* Reading time estimate */
    if (!document.getElementById('luliy-readmeta')) {
      var wc = pbody.innerText.length;
      var rt = document.createElement('p');
      rt.id = 'luliy-readmeta';
      rt.innerHTML =
        '\u9884\u8ba1\u9605\u8bfb\uff1a\u7ea6 <strong>' + Math.max(1, Math.round(wc / 300)) +
        '</strong> \u5206\u949f &nbsp;|&nbsp; \u5171 <strong>' + wc + '</strong> \u5b57';
      rt.style.cssText = 'color:#888;font-size:13px;margin-bottom:1.5rem';
      pbody.insertBefore(rt, pbody.firstChild);
    }

    /* Heading click → copy anchor link */
    pbody.querySelectorAll('h1,h2,h3').forEach(function (h) {
      if (h._luliyCopy) return;
      h._luliyCopy = true; h.style.cursor = 'pointer';
      h.title = '\u70b9\u51fb\u590d\u5236\u94fe\u63a5';
      h.addEventListener('click', function () {
        var url = location.href.split('#')[0] + '#' + h.id;
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        var tip = document.createElement('span');
        tip.textContent = ' \u2713';
        tip.style.cssText = 'font-size:12px;color:#1f883d;font-weight:normal';
        h.appendChild(tip);
        setTimeout(function () { tip.remove(); }, 2000);
      });
    });

    /* macOS code blocks */
    initCodeBlocks(pbody);
    setTimeout(function () { initCodeBlocks(pbody); }, 800);
    setTimeout(function () { initCodeBlocks(pbody); }, 2200);

    /* TOC scroll-spy */
    initArticleTocSpy();
    setTimeout(function () { initArticleTocSpy(); }, 600);
    setTimeout(function () { initArticleTocSpy(); }, 2000);

    /* Navbar transparency on scroll */
    var scrollHandler = function () {
      var st = window.scrollY || document.documentElement.scrollTop;
      if (st > 0) {
        document.body.classList.add('is-scrolling-article');
      } else {
        document.body.classList.remove('is-scrolling-article');
      }
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    /* Prev / Next navigation */
    fetchPosts().then(function (posts) {
      var navPosts = posts.filter(function (p) { return !p.pinned; });
      var curPath = location.pathname;
      var curNorm = curPath.replace(/^\//, '').replace(/\.html?$/, '').replace(/\/$/, '');

      var idx = -1;
      navPosts.forEach(function (p, i) {
        if (!p.link) return;
        function normLink(s) {
          return s.replace(/^\//, '').replace(/\.html?$/, '').replace(/\/$/, '').replace(/^post\//, '');
        }
        var lnkSlug = normLink(p.link);
        var curSlug = normLink(curNorm);
        if (lnkSlug === curSlug || lnkSlug === curNorm ||
          p.link === curNorm || curPath === '/' + p.link ||
          curPath === p.link || curPath.endsWith('/' + lnkSlug)) {
          idx = i;
        }
      });

      if (idx < 0) return;
      var prevPost = navPosts[idx + 1] || null;
      var nextPost = navPosts[idx - 1] || null;
      if (!prevPost && !nextPost) return;

      var nav = document.createElement('div');
      nav.className = 'luliy-prevnext';

      function mkNavLink(post, labelText, align) {
        if (!post) { var e = document.createElement('div'); e.style.flex = '1'; return e; }
        var a = document.createElement('a');
        a.href = buildPostLink(post.link);
        a.style.textAlign = align;
        a.innerHTML =
          '<span class="pn-label">' + esc(labelText) + '</span>' +
          '<span class="pn-title">' + esc(post.title) + '</span>';
        return a;
      }

      nav.appendChild(mkNavLink(prevPost, '\u2B05 \u4e0a\u4e00\u7bc7', 'left'));
      nav.appendChild(mkNavLink(nextPost, '\u4e0b\u4e00\u7bc7 \u27A1', 'right'));
      pbody.appendChild(nav);
    }).catch(function () {});

    /* Support / appreciation panel */
    var sp = document.createElement('div');
    sp.style.cssText = 'margin-top:50px;text-align:center';
    var spb = document.createElement('button');
    spb.innerHTML = '\u2728 \u548c\u4f5c\u8005\u65e0\u9650\u8fdb\u6b65';
    spb.style.cssText =
      'padding:12px 28px;border-radius:30px;border:none;' +
      'background:linear-gradient(90deg,#f0b429,#ff6b9d);' +
      'color:#fff;font-weight:bold;font-size:15px;cursor:pointer;' +
      'box-shadow:0 4px 15px rgba(240,180,41,0.3);transition:transform 0.3s';
    var qr = document.createElement('div');
    qr.innerHTML =
      '<p style="font-size:13px;color:#888;margin:10px 0">\u65e0\u9650\u8fdb\u6b65\uff0c\u8fdb\u6b65\u6709\u4f60\uff01</p>' +
      '<img src="https://raw.githubusercontent.com/luliy6/img/refs/heads/main/me.jpg" ' +
      'alt="\u8d5b\u8d4f\u7801" style="width:180px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1)">';
    qr.style.cssText = 'height:0;overflow:hidden;transition:height 0.4s ease,opacity 0.4s ease;opacity:0';
    spb.addEventListener('mouseover', function () { spb.style.transform = 'translateY(-2px)'; });
    spb.addEventListener('mouseout',  function () { spb.style.transform = ''; });
    spb.addEventListener('click', function () {
      var o = !qr.style.height || qr.style.height === '0px';
      qr.style.height = o ? '260px' : '0px';
      qr.style.opacity = o ? '1' : '0';
    });
    sp.appendChild(spb); sp.appendChild(qr);
    pbody.appendChild(sp);
  };

  /* ---- 22  Index page init -------------------------------- */
  root._luliyInitIndex = function () {
    initCards();
    initHeroBanner();
    initHomeGallery();

    if (isArchivePage()) {
      var pb = document.getElementById('postBody');
      if (pb) {
        pb.innerHTML = '<p style="color:#888;font-size:14px">\u6b63\u5728\u52a0\u8f7d\u5f52\u6863...</p>';
        fetchPosts().then(function (posts) {
          var byY = {};
          posts.forEach(function (p) {
            var y = (p.created || '\u672a\u77e5').slice(0, 4);
            if (!byY[y]) byY[y] = [];
            byY[y].push(p);
          });
          var years = Object.keys(byY).sort(function (a, b) { return b - a; });
          var html =
            '<h1 style="border-bottom:2px solid rgba(240,180,41,0.4);padding-bottom:10px;margin-bottom:30px">' +
            '\uD83D\uDCC5 \u6587\u7ae0\u5f52\u6863</h1>';
          years.forEach(function (y) {
            html += '<div class="tl-year">' + y + ' \u5e74</div><ul class="tl-list">';
            byY[y].forEach(function (p) {
              var md = (p.created || '').slice(5, 10).replace('-', '/');
              html +=
                '<li class="tl-item">' +
                '<a href="' + esc(buildPostLink(p.link)) + '">' + esc(p.title) + '</a>' +
                '<span class="tl-date">' + md + '</span>' +
                '</li>';
            });
            html += '</ul>';
          });
          pb.innerHTML = html;
        }).catch(function () {
          pb.innerHTML = '<p style="color:#e74c3c">\u5f52\u6863\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u5237\u65b0\u91cd\u8bd5\u3002</p>';
        });
      }
    }
  };

  /* ---- 23  Main entry ------------------------------------- */
  initLocalStorage();

  /* Restore theme immediately to prevent FOUC */
  (function () {
    var savedId = localStorage.getItem('luliy-sink') || 'default';
    var themePalettes = {
      'default':   { theme: 'default',   c: ['#8250df', '#0969da', '#ff6b9d', '#f0b429'] },
      'sakura':    { theme: 'sakura',     c: ['#e05c8a', '#f9a8c9', '#c94070', '#ffb7c5'] },
      'your-name': { theme: 'your-name',  c: ['#1a59a4', '#4a9de0', '#f4a738', '#60b8ff'] },
      'space':     { theme: 'space',      c: ['#00e5ff', '#4a9de0', '#7b2fbe', '#0d2149'] }
    };
    var def = themePalettes[savedId] || themePalettes['default'];
    function applyFouc() {
      if (!document.body) return;
      document.body.setAttribute('data-luliy-theme', def.theme);
      document.documentElement.style.setProperty('--card-c1', def.c[0]);
      document.documentElement.style.setProperty('--card-c2', def.c[1]);
      document.documentElement.style.setProperty('--card-c3', def.c[2]);
      document.documentElement.style.setProperty('--card-c4', def.c[3]);
    }
    if (document.body) applyFouc();
    else document.addEventListener('DOMContentLoaded', applyFouc);
  })();

  /* Welcome splash (before DOM ready, append after body exists) */
  if (document.body) initWelcomeSplash();
  else document.addEventListener('DOMContentLoaded', initWelcomeSplash);

  /* Sakura petals */
  if (localStorage.getItem('luliy-sakura') !== '0') {
    if (document.body) initSakura();
    else document.addEventListener('DOMContentLoaded', initSakura);
  }

  ready(function () {
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
    initMobileNav();
    initSearchOverlay();

    var isPost    = !!document.getElementById('postBody');
    var hasList   = !!document.querySelector('.SideNav,.post-item,.postList,.post-list');

    if (isPost) root._luliyInitPost();
    if (isIndexPage() || isArchivePage() || (!isPost && hasList)) root._luliyInitIndex();
  });

  /* Global helper function */
  function buildPostLink(link) {
    if (!link) return '#';
    if (link.startsWith('http')) return link;
    if (link.startsWith('/')) return location.origin + link;
    return location.origin + '/' + link;
  }

})(window);
