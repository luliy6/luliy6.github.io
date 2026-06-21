```
Gmeek-html<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --wall:#3B4A45;
    --wall-deep:#2E3A36;
    --wood-dark:#5C3A21;
    --wood-mid:#7A4B27;
    --wood-light:#9A6A3C;
    --brass:#C9A24B;
    --brass-dark:#8A6B2E;
    --parchment:#EFE6D2;
    --cream:#F2EAD3;
    --ink:#2A2420;
    --muted:#C9C2AC;
  }

  *{ box-sizing:border-box; }
  html,body{ margin:0; padding:0; }
  body{
    background: radial-gradient(circle at 50% 0%, var(--wall) 0%, var(--wall-deep) 75%);
    font-family:'Inter',sans-serif;
    color:var(--cream);
    min-height:100vh;
  }

  .page{ max-width:1080px; margin:0 auto; padding:48px 24px 72px; }

  /* ---------- 头部 ---------- */
  .site-header{ text-align:center; margin-bottom:44px; }
  .site-header h1{
    font-family:'Noto Serif SC',serif;
    font-weight:900;
    font-size:clamp(28px, 5vw, 44px);
    margin:0 0 10px;
    color:var(--cream);
    letter-spacing:2px;
  }
  .subtitle{
    margin:0;
    font-size:14px;
    color:var(--muted);
    letter-spacing:.5px;
  }

  /* ---------- 书柜外框 ---------- */
  .bookcase{
    background:linear-gradient(180deg, var(--wood-mid), var(--wood-dark));
    border:14px solid var(--wood-dark);
    border-radius:6px;
    padding:30px 18px 18px;
    display:flex;
    flex-direction:column;
    gap:34px;
    box-shadow:
      0 30px 60px rgba(0,0,0,.45),
      inset 0 0 0 3px rgba(0,0,0,.25);
  }

  /* ---------- 每层书架 ---------- */
  .shelf{ position:relative; }

  .shelf-plaque{
    display:inline-flex;
    align-items:baseline;
    gap:6px;
    background:var(--brass);
    color:var(--ink);
    font-family:'Noto Serif SC',serif;
    font-weight:700;
    font-size:13px;
    padding:4px 12px 5px;
    border-radius:3px 3px 0 0;
    margin-left:14px;
    box-shadow:0 -1px 0 rgba(255,255,255,.3) inset, 0 2px 3px rgba(0,0,0,.3);
    position:relative;
    z-index:2;
  }
  .shelf-plaque .count{
    font-family:'Inter',sans-serif;
    font-weight:500;
    font-size:11px;
    color:var(--brass-dark);
  }

  .shelf-row{
    display:flex;
    flex-wrap:wrap;
    align-items:flex-end;
    gap:7px;
    padding:0 16px 12px;
    min-height:40px;
  }

  .shelf-board{
    height:16px;
    margin:0 6px;
    border-radius:2px;
    background:linear-gradient(180deg, var(--wood-light) 0%, var(--wood-mid) 45%, var(--wood-dark) 100%);
    box-shadow:0 6px 10px rgba(0,0,0,.35), 0 -1px 0 rgba(255,255,255,.15) inset;
    position:relative;
  }
  .shelf-board::before,
  .shelf-board::after{
    content:"";
    position:absolute;
    top:-10px;
    width:6px;
    height:18px;
    background:var(--brass-dark);
    border-radius:1px 1px 0 0;
    box-shadow:0 0 0 1px rgba(0,0,0,.3);
  }
  .shelf-board::before{ left:2px; }
  .shelf-board::after{ right:2px; }

  /* ---------- 书脊 ---------- */
  .spine{
    display:flex;
    align-items:center;
    justify-content:center;
    text-decoration:none;
    color:var(--cream);
    border-radius:3px 3px 1px 1px;
    box-shadow:
      inset -3px 0 6px rgba(0,0,0,.25),
      inset 2px 0 0 rgba(255,255,255,.12),
      0 3px 6px rgba(0,0,0,.35);
    cursor:pointer;
    transform:rotate(var(--tilt,0deg));
    transition:transform .18s ease, box-shadow .18s ease;
    position:relative;
    padding:10px 0;
  }
  .spine:hover,
  .spine:focus-visible{
    transform:translateY(-12px) rotate(0deg);
    box-shadow:
      inset -3px 0 6px rgba(0,0,0,.25),
      inset 2px 0 0 rgba(255,255,255,.12),
      0 14px 18px rgba(0,0,0,.45);
  }
  .spine:focus-visible{
    outline:2px solid var(--brass);
    outline-offset:3px;
  }

  .spine-title{
    writing-mode:vertical-rl;
    text-orientation:mixed;
    font-family:'Noto Serif SC',serif;
    font-weight:700;
    font-size:15px;
    letter-spacing:1px;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    max-height:100%;
    text-shadow:0 1px 1px rgba(0,0,0,.3);
  }

  /* 悬浮提示卡 */
  .tip{
    position:absolute;
    bottom:100%;
    left:50%;
    transform:translate(-50%, 6px);
    width:180px;
    background:var(--parchment);
    color:var(--ink);
    border-radius:6px;
    padding:10px 12px;
    font-family:'Inter',sans-serif;
    writing-mode:horizontal-tb;
    text-orientation:initial;
    opacity:0;
    pointer-events:none;
    transition:opacity .15s ease, transform .15s ease;
    box-shadow:0 8px 18px rgba(0,0,0,.4);
    z-index:5;
    margin-bottom:6px;
  }
  .spine:hover .tip,
  .spine:focus-visible .tip{
    opacity:1;
    transform:translate(-50%, 0);
  }
  .tip strong{
    display:block;
    font-size:13px;
    margin-bottom:2px;
  }
  .tip span.author{
    display:block;
    font-size:11px;
    color:#6b6354;
    margin-bottom:4px;
  }
  .tip span.note{
    display:block;
    font-size:11px;
    line-height:1.5;
    color:#4a4438;
  }

  /* ---------- “在读” 平放书堆（签名细节） ---------- */
  .reading-zone{
    margin-left:auto;
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:6px;
    padding-bottom:4px;
  }
  .reading-label{
    font-size:10px;
    letter-spacing:1px;
    color:var(--brass);
    font-family:'Inter',sans-serif;
    font-weight:600;
  }
  .reading-stack{
    position:relative;
    width:78px;
    height:46px;
  }
  .flat-book{
    position:absolute;
    left:0;
    width:78px;
    height:16px;
    border-radius:2px;
    text-decoration:none;
    display:flex;
    align-items:center;
    padding-left:8px;
    font-family:'Noto Serif SC',serif;
    font-size:9px;
    color:var(--cream);
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    box-shadow:0 3px 5px rgba(0,0,0,.3), inset 0 0 0 1px rgba(255,255,255,.1);
    transition:transform .15s ease;
  }
  .flat-book:hover,
  .flat-book:focus-visible{ transform:translateX(3px); }
  .flat-book::after{
    content:"";
    position:absolute;
    right:0; top:0; bottom:0;
    width:5px;
    background:rgba(255,255,255,.35);
  }
  .flat-book.is-top{
    transform:rotate(-5deg) translateY(0);
    z-index:3;
  }
  .flat-book.is-top::before{
    content:"";
    position:absolute;
    top:-6px; left:14px;
    width:6px; height:10px;
    background:#B5752A;
  }

  /* ---------- 空状态 ---------- */
  .empty-shelf{
    color:var(--muted);
    font-size:13px;
    padding:14px 16px;
  }

  /* ---------- 页脚 ---------- */
  .site-footer{
    text-align:center;
    margin-top:36px;
    font-size:12px;
    color:var(--muted);
    letter-spacing:1px;
  }

  @media (prefers-reduced-motion: reduce){
    .spine, .flat-book, .tip{ transition:none; }
  }

  @media (max-width:560px){
    .bookcase{ padding:24px 10px 12px; gap:26px; border-width:10px; }
    .shelf-row{ padding:0 8px 10px; gap:5px; }
    .spine-title{ font-size:13px; }
  }
</style>
<div class="page">
  <header class="site-header">
    <h1>我的书架</h1>
    <p class="subtitle" id="subtitle">点击书脊，前往对应的文章</p>
  </header>

  <main class="bookcase" id="bookcase"></main>

  <footer class="site-footer">书架 · 私人收藏</footer>
</div>

<script>
/* ============================================================
   📚 在下面的 books 数组里编辑你的书目，改完保存即可生效。

   每本书是一个对象，字段说明：
   - title    书名（必填）
   - author   作者（必填，悬停提示里显示）
   - href     点击后跳转的文章链接（必填，写完整 URL 或站内相对路径都可以）
   - category 分类名，同一分类的书会排在同一层书架上（必填）
   - note     一句话简介，鼠标悬停 / 键盘聚焦时显示（选填）
   - color    书脊颜色，十六进制色值，不填会自动从配色盘里挑一个（选填）
   - reading  设为 true，这本书会被放进右侧"在读"的平放书堆里，
              最多显示 3 本，多出的会被忽略（选填）

   书架的出现顺序 = 这些书在数组里第一次出现该分类的顺序，
   想调整书架顺序，把对应分类的书挪到数组前面即可。
   书名建议不超过 10 个字，太长会被省略号截断。
   ============================================================ */

const books = [
  { title:"活着", author:"余华", href:"#", category:"文学", note:"一个人和命运的对话，平静地写尽了苦难。", reading:true },
  { title:"百年孤独", author:"加西亚·马尔克斯", href:"#", category:"文学", note:"布恩迪亚家族七代人的魔幻轮回。" },
  { title:"围城", author:"钱钟书", href:"#", category:"文学", note:"婚姻和人生都是一座围城。" },
  { title:"红楼梦", author:"曹雪芹", href:"#", category:"文学", note:"半部红楼，半部人间。" },
  { title:"一九八四", author:"乔治·奥威尔", href:"#", category:"文学", note:"关于真理、权力与记忆的寓言。", reading:true },

  { title:"代码整洁之道", author:"罗伯特·C·马丁", href:"#", category:"技术", note:"写给程序员的职业修养指南。" },
  { title:"人月神话", author:"弗雷德里克·布鲁克斯", href:"#", category:"技术", note:"软件工程里最常被引用的常识。" },
  { title:"重构", author:"马丁·福勒", href:"#", category:"技术", note:"不改变行为，让代码变得更好。" },
  { title:"图解HTTP", author:"上野宣", href:"#", category:"技术", note:"用图把协议讲清楚的入门书。" },

  { title:"人类简史", author:"尤瓦尔·赫拉利", href:"#", category:"历史", note:"从动物到上帝的一段长跑。" },
  { title:"万历十五年", author:"黄仁宇", href:"#", category:"历史", note:"一个平淡年份里的大历史。" },
  { title:"全球通史", author:"斯塔夫里阿诺斯", href:"#", category:"历史", note:"以世界而非国家为单位看历史。" },
];

/* ============================================================
   下面是渲染逻辑，一般不需要修改。
   ============================================================ */

const PALETTE = ["#7A2E2E","#3F5B43","#2C3E55","#B5752A","#A5472F","#5C4A6B","#46433A","#274E49"];

function hashCode(str){
  let h = 0;
  for(let i=0;i<str.length;i++){ h = (h<<5) - h + str.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

function spineStyle(book){
  const h = hashCode(book.title);
  const width  = 42 + (h % 22);          // 42–64px
  const height = 156 + (h % 34);         // 156–190px
  const tilt   = (h % 7) - 3;            // -3..3deg
  const color  = book.color || PALETTE[h % PALETTE.length];
  return { width, height, tilt, color };
}

function buildTip(book){
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.innerHTML = `
    <strong>${escapeHtml(book.title)}</strong>
    <span class="author">${escapeHtml(book.author)}</span>
    ${book.note ? `<span class="note">${escapeHtml(book.note)}</span>` : ""}
  `;
  return tip;
}

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function buildSpine(book){
  const { width, height, tilt, color } = spineStyle(book);
  const a = document.createElement("a");
  a.className = "spine";
  a.href = book.href || "#";
  a.style.setProperty("--tilt", tilt + "deg");
  a.style.width = width + "px";
  a.style.height = height + "px";
  a.style.background = `linear-gradient(90deg, ${color}, ${shade(color,-10)})`;
  a.setAttribute("aria-label", `${book.title} · ${book.author}`);

  const title = document.createElement("span");
  title.className = "spine-title";
  title.textContent = book.title;
  a.appendChild(title);
  a.appendChild(buildTip(book));
  return a;
}

function shade(hex, percent){
  const num = parseInt(hex.replace("#",""),16);
  let r = (num>>16) + Math.round(2.55*percent);
  let g = ((num>>8)&0x00FF) + Math.round(2.55*percent);
  let b = (num&0x0000FF) + Math.round(2.55*percent);
  r = Math.max(0,Math.min(255,r));
  g = Math.max(0,Math.min(255,g));
  b = Math.max(0,Math.min(255,b));
  return `rgb(${r},${g},${b})`;
}

function buildReadingZone(readingBooks){
  const zone = document.createElement("div");
  zone.className = "reading-zone";

  const label = document.createElement("span");
  label.className = "reading-label";
  label.textContent = "在读";
  zone.appendChild(label);

  const stack = document.createElement("div");
  stack.className = "reading-stack";

  readingBooks.slice(0,3).forEach((book, i)=>{
    const a = document.createElement("a");
    a.className = "flat-book" + (i === 0 ? " is-top" : "");
    a.href = book.href || "#";
    a.style.bottom = (i * 12) + "px";
    a.style.zIndex = String(10 - i);
    const color = book.color || PALETTE[hashCode(book.title) % PALETTE.length];
    a.style.background = color;
    a.textContent = book.title;
    a.setAttribute("aria-label", `（在读）${book.title} · ${book.author}`);
    stack.appendChild(a);
  });

  zone.appendChild(stack);
  return zone;
}

function render(){
  const bookcase = document.getElementById("bookcase");
  bookcase.innerHTML = "";

  if(!books.length){
    const empty = document.createElement("p");
    empty.className = "empty-shelf";
    empty.textContent = "书架空空如也，去 books 数组里添加你的第一本书吧。";
    bookcase.appendChild(empty);
    return;
  }

  // 按分类分组，保持第一次出现的顺序
  const order = [];
  const groups = {};
  books.forEach(b=>{
    if(!groups[b.category]){ groups[b.category] = []; order.push(b.category); }
    groups[b.category].push(b);
  });

  const firstReadingCategory = (books.find(b=>b.reading) || {}).category;

  order.forEach(category=>{
    const shelf = document.createElement("section");
    shelf.className = "shelf";

    const plaque = document.createElement("div");
    plaque.className = "shelf-plaque";
    plaque.innerHTML = `${escapeHtml(category)} <span class="count">${groups[category].length} 本</span>`;
    shelf.appendChild(plaque);

    const row = document.createElement("div");
    row.className = "shelf-row";
    groups[category].forEach(book=> row.appendChild(buildSpine(book)));

    if(category === firstReadingCategory){
      const readingBooks = books.filter(b=>b.reading);
      row.appendChild(buildReadingZone(readingBooks));
    }

    shelf.appendChild(row);

    const board = document.createElement("div");
    board.className = "shelf-board";
    shelf.appendChild(board);

    bookcase.appendChild(shelf);
  });

  document.getElementById("subtitle").textContent =
    `共 ${books.length} 本 · 点击书脊，前往对应的文章`;
}

render();
</script>
```