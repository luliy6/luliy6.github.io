/* Check nav links — any link whose text contains "Favourite/Favorites" */
    if (!found) {
      document.querySelectorAll('#header a, .title-right a, nav a').forEach(function(a) {
        if (/favou?ri/i.test(a.textContent)) found = true;
      });
    }
    return found;
  }
  function initLock() {
    /* Global lock: runs on every page (post and index) */
    if (sessionStorage.getItem(LOCK_KEY) === '1') return;
    function check(n) {
      if (isFavoritesPost()) { showLock(); return; }
      if (n > 0) setTimeout(function(){ check(n-1); }, 300);
    }
    check(8);
  }
  function showLock() {
    if (document.getElementById('luliy-lock-overlay')) return;
    var pbody = document.getElementById('postBody');
    var ov = document.createElement('div'); ov.id = 'luliy-lock-overlay';
    ov.innerHTML = '<div class="luliy-lock-box"><span class="luliy-lock-icon">\uD83D\uDD10</span><div class="luliy-lock-title">\u52a0\u5bc6\u5185\u5bb9</div><div class="luliy-lock-hint">\u672c\u6587\u4e3a\u79c1\u5bc6\u6536\u85cf\uff0c\u8bf7\u8f93\u5165\u8bbf\u95ee\u5bc6\u7801</div><input class="luliy-lock-input" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022" maxlength="20" autocomplete="off"><button class="luliy-lock-btn">\u89e3 \u9501</button><div class="luliy-lock-err"></div></div>';
    document.body.appendChild(ov);
    if (pbody) { pbody.style.filter = 'blur(18px)'; pbody.style.userSelect = 'none'; pbody.style.pointerEvents = 'none'; }
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

  /* ---- 14  Home card rebuild — Hex grid layout ------------ */
  function initCards() {
    /* Do not run on the tag page — it uses .SideNav for label listing */
    if (/tag\.html?$|\/tag\/?$/i.test(location.pathname)) return;
    var nav = document.querySelector('nav.SideNav, ul.SideNav, .SideNav');
    if (!nav || nav.getAttribute('data-luliy-cards')) return;
    nav.setAttribute('data-luliy-cards', '1');

    /* Build a single rounded-rect card element */
    function buildCard(post, isPinned, colourIdx) {
      var li = document.createElement('li');
      li.className = 'luliy-card';
      li.setAttribute('data-ci', String((colourIdx || 0) % 4));
      if (isPinned) li.setAttribute('data-pinned', '1');

      var a = document.createElement('a');
      a.href = (function() {
        var lnk = post.link || '#';
        if (lnk !== '#') {
          lnk = lnk.replace(/^\//, '');
          lnk = lnk.replace(/^post\/post\//, 'post/');
          if (!/^post\//.test(lnk) && !/^https?:\/\//.test(lnk)) lnk = 'post/' + lnk;
          lnk = '/' + lnk;
        }
        return lnk;
      })();
      a.className = 'luliy-card-inner';

      /* Date — top center, small gray */
      var dateEl = document.createElement('div');
      dateEl.className = 'luliy-card-date';
      dateEl.textContent = post.created ? post.created.slice(0, 10) : '';

      /* Title — center bold, core visual */
      var titleEl = document.createElement('div');
      titleEl.className = 'luliy-card-title';
      titleEl.textContent = post.title || '\u65e0\u9898';

      /* Tags — bottom rounded-pill row */
      var tagsEl = document.createElement('div');
      tagsEl.className = 'luliy-card-tags';
      var labels = Array.isArray(post.labels) ? post.labels : [];
      labels.forEach(function(lbl) {
        var info = (typeof lbl === 'object') ? lbl : {name: lbl, color: '0969da'};
        if ((info.name || lbl) === 'pinned') return;
        var pill = document.createElement('a');
        pill.className = 'luliy-card-pill';
        pill.href = '/tag.html#' + encodeURIComponent(info.name || lbl);
        pill.textContent = info.name || lbl;
        pill.style.background = '#' + (info.color || '0969da').replace('#','');
        tagsEl.appendChild(pill);
      });

      a.appendChild(dateEl);
      a.appendChild(titleEl);
      a.appendChild(tagsEl);
      li.appendChild(a);
      return li;
    }

    fetchPosts().then(function(posts) {
      if (!posts || !posts.length) { fallbackDomCards(nav); return; }

      /* Separate pinned and regular */
      var pinnedPosts  = posts.filter(function(p){ return p.pinned; });
      var regularPosts = posts.filter(function(p){ return !p.pinned; });

      /* Pagination (only regular posts paginate) */
      var pageMatch = location.search.match(/[?&]page=([0-9]+)/);
      var pageNum = pageMatch ? parseInt(pageMatch[1]) : 1;
      var perPage = 12;
      var isIndex = location.pathname === '/' || location.pathname === '/index.html' || location.pathname === '';

      var displayPosts = regularPosts;
      if (isIndex) {
        var start = (pageNum - 1) * perPage;
        displayPosts = regularPosts.slice(start, start + perPage);
      }

      /* Insert pinned section above the card grid (only page 1) */
      if (pinnedPosts.length > 0 && isIndex && pageNum === 1) {
        var existing = document.getElementById('luliy-pinned-section');
        if (existing) existing.remove();

        var ps = document.createElement('div');
        ps.id = 'luliy-pinned-section';

        var pg = document.createElement('ul');
        pg.className = 'luliy-card-grid luliy-pinned-grid';
        pinnedPosts.forEach(function(post, i){ pg.appendChild(buildCard(post, true, i)); });
        ps.appendChild(pg);

        /* Insert before the nav (card grid) */
        nav.parentNode.insertBefore(ps, nav);
      }

      /* Rebuild main card grid — hex layout */
      nav.innerHTML = '';
      nav.className = 'luliy-card-grid';
      displayPosts.forEach(function(post, i){ nav.appendChild(buildCard(post, false, i)); });

    }).catch(function(){ fallbackDomCards(nav); });

    /* Fallback: use existing DOM items as simple hex wrappers */
    function fallbackDomCards(container) {
      container.className = 'luliy-card-grid';
      container.querySelectorAll('li.SideNav-item, .SideNav-item').forEach(function(li, i) {
        li.className = 'luliy-hex-wrap';
        var existingA = li.querySelector('a');
        if (!existingA) return;
        var rawText = (existingA.innerText || existingA.textContent || '').trim();
        var href = existingA.href;
        li.innerHTML = '';
        var hex = document.createElement('a'); hex.className = 'luliy-hex'; hex.href = href;
        hex.setAttribute('data-ci', String(i % 4));
        var d = document.createElement('span'); d.className = 'luliy-hex-date';
        var t = document.createElement('span'); t.className = 'luliy-hex-title'; t.textContent = rawText || '\u65e0\u9898';
        var tg = document.createElement('div'); tg.className = 'luliy-hex-tags';
        hex.appendChild(d); hex.appendChild(t); hex.appendChild(tg);
        li.appendChild(hex);
      });
    }
  }

  /* ---- 15  macOS code block buttons ---------------------- */
  function initCodeBlocks(pbody) {
    applyCodeBlocks(pbody);
    if (pbody._luliyCodeObs) return;
    pbody._luliyCodeObs = true;
    try {
      var obs = new MutationObserver(function(){ applyCodeBlocks(pbody); });
      obs.observe(pbody, {childList: true, subtree: true});
    } catch(e) {}
  }
  function applyCodeBlocks(pbody) {
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
      /* YELLOW = Collapse */
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