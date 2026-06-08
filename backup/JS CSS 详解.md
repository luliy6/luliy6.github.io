# 📘 Luliy Blog v8 完整技术说明书

## 一、架构总览

```
Luliy Blog v8
├── 📁 js/
│   └── main.js          # 24个模块，按序加载
├── 📁 css/
│   └── enhance.css      # 27个区域，主题驱动
├── 📄 config.json       # 博客核心配置
├── 📄 theme.json        # 主题预设（4主题）
└── 📄 manifest.json     # PWA 配置
```

**设计哲学**：模块化加载 → 主题变量驱动 → 渐进增强

---

## 二、JS 模块详解

### `Module 00` — Welcome Splash 欢迎闪屏
```javascript
// 功能：页面首次加载时的品牌展示动画
// 触发：sessionStorage 控制，同会话只显示一次
```
| 属性 | 说明 |
|------|------|
| 触发条件 | `sessionStorage.getItem('visited') !== 'true'` |
| 动画序列 | fadeIn → 品牌文字 → progress填充 → fadeOut |
| 阻断性 | **阻塞后续模块加载**，动画完成后才执行 01-23 |

**修改方式**：
```javascript
// 修改动画时长（默认 2500ms）
const SPLASH_DURATION = 3000;  // 延长到3秒

// 修改显示频率：每次刷新都显示
// 删除或注释掉 sessionStorage 相关代码

// 自定义品牌文字
const BRAND_TEXT = "Your Name";  // 替换 "Luliy"
```

---

### `Module 01` — localStorage Init 本地存储初始化
```javascript
// 功能：建立持久化配置层，所有用户偏好保存于此
// 数据结构：{ theme, fontSize, reducedMotion, soundEnabled, ... }
```
| 存储键 | 用途 | 默认值 |
|--------|------|--------|
| `luliy_theme` | 当前主题ID | `"sakura"` |
| `luliy_font` | 字体缩放级别 | `"md"` |
| `luliy_motion` | 减少动画偏好 | `false` |
| `luliy_sound` | 音效开关 | `true` |
| `luliy_visited` | 访问标记（splash用）| — |

**修改方式**：
```javascript
// 新增自定义配置项
localStorage.setItem('luliy_customGrid', '3');  // 新增：网格列数

// 读取时
const gridCols = localStorage.getItem('luliy_customGrid') || '2';
```

---

### `Module 02` — Progress Bar 进度条
```javascript
// 功能：顶部阅读进度指示器 + 页面加载进度
// 双模式：loading（资源加载）| reading（滚动深度）
```
| 模式 | 触发条件 | 颜色来源 |
|------|----------|----------|
| Loading | `document.readyState !== 'complete'` | `--accent` |
| Reading | 滚动事件 | 当前主题主色 |

**修改方式**：
```javascript
// 改为底部显示
const progressBar = document.createElement('div');
progressBar.style.top = 'auto';
progressBar.style.bottom = '0';  // 底部进度条

// 添加缓冲动画效果
progressBar.style.transition = 'width 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
```

---

### `Module 03` — Dynamic Title 动态标题
```javascript
// 功能：标签页失焦时显示自定义消息，吸引用户回流
```
| 状态 | 标题变化 |
|------|----------|
| 页面可见 | 原始标题 `"文章标题 | Luliy Blog"` |
| 页面隐藏 | `"(◍•ᴗ•◍) 快回来~" + 原始标题` |

**修改方式**：
```javascript
// 自定义失焦消息数组（随机轮换）
const AWAY_MESSAGES = [
    "✨ 发现好文不看完吗？",
    "🌸 樱花飘落中，等你回来",
    "📚 知识正在冷却...",
    "🎵 音乐暂停了"
];

// 根据页面类型定制
const isPostPage = location.pathname.includes('/post/');
const message = isPostPage ? "📖 读一半呢，别走~" : AWAY_MESSAGES[random];
```

---

### `Module 04` — Uptime Counter 运行时间计数器
```javascript
// 功能：显示博客自创建以来的运行时长
// 格式：X年X月X日 X时X分X秒 | 或精简版
```
| 显示位置 | 默认 | 可选 |
|----------|------|------|
| Footer | 完整格式 | 精简图标版 |
| 英雄区 | 无 | 徽章式 |

**修改方式**：
```javascript
// 修改起始时间（博客创建日期）
const BIRTH_DATE = new Date('2020-03-15T00:00:00+08:00');  // 你的建站日

// 改为显示"本站已陪伴你"（访客视角）
const visitorFirstVisit = localStorage.getItem('first_visit');
const displayTime = visitorFirstVisit 
    ? timeSince(new Date(visitorFirstVisit))  // 个人视角
    : timeSince(BIRTH_DATE);                  // 站点视角
```

---

### `Module 05` — Dark-mode Ripple 深色模式涟漪
```javascript
// 功能：主题切换时的视觉过渡效果
// 原理：点击位置创建 radial-gradient 扩散动画
```
| 参数 | 说明 |
|------|------|
| 动画时长 | 600ms |
| 缓动函数 | `cubic-bezier(0.4, 0, 0.2, 1)` |
| 覆盖范围 | 全视口 |

**修改方式**：
```javascript
// 改为从中心扩散（而非点击位置）
const centerX = window.innerWidth / 2;
const centerY = window.innerHeight / 2;

// 添加声音反馈（配合 Module 07）
ripple.addEventListener('animationstart', () => {
    playSound('whoosh', 0.3);
});
```

---

### `Module 06` — Static Background 静态背景
```javascript
// 功能：主题相关的背景图/渐变（v8移除粒子性能开销）
// 替代方案：CSS 渐变 + 可选的轻量 SVG 纹理
```
| 主题 | 背景类型 |
|------|----------|
| `sakura` | 粉色渐变 + 花瓣纹理 SVG |
| `ocean` | 深蓝渐变 + 波浪 SVG |
| `forest` | 绿色渐变 + 叶脉纹理 |
| `stardust` | 深色渐变 + 星点 CSS |

**修改方式**：
```css
/* 添加自定义纹理 */
[data-theme="custom"] {
    --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --bg-texture: url("data:image/svg+xml,%3Csvg width='60' height='60'..."); /* 内联 SVG */
}
```

---

### `Module 07` — Web Audio SFX 音效系统
```javascript
// 功能：全站交互音效，基于 Web Audio API（非 HTML5 Audio）
// 特点：零依赖、低延迟、可合成多种音色
```
| 音效ID | 触发场景 | 音色类型 |
|--------|----------|----------|
| `click` | 按钮点击 | 短促正弦波 |
| `hover` | 卡片悬停 | 轻柔八度 |
| `switch` | 主题切换 | 滑音效果 |
| `success` | 操作成功 | 和弦上升 |
| `pop` | 菜单展开 | 气泡破裂 |
| `type` | 打字机（可选）| 机械键盘 |

**修改方式**：
```javascript
// 添加新音效：页面滚动到特定区域的反馈
function playScrollZoneSound(zoneName) {
    const frequencies = {
        'hero': 523.25,      // C5
        'content': 659.25,   // E5
        'footer': 783.99     // G5
    };
    playTone(frequencies[zoneName], 'sine', 0.15, 0.1);
}

// 全局静音检测（系统偏好）
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    audioContext.suspend();  // 尊重用户系统设置
}
```

---

### `Module 08` — Click Sparks 点击火花
```javascript
// 功能：鼠标点击位置生成粒子爆发效果
// 与 Module 16 樱花的区别：火花是瞬时爆发，樱花是持续环境
```
| 参数 | 默认值 | 说明 |
|------|--------|------|
| 粒子数 | 8-12 | 随机 |
| 颜色 | 当前主题 accent | 动态继承 |
| 生命周期 | 600ms | CSS 动画 |
| 物理 | 无重力 | 纯扩散 |

**修改方式**：
```javascript
// 添加重力效果（抛物线）
spark.style.setProperty('--gravity', `${Math.random() * 50 + 20}px`);

// CSS 配合
@keyframes spark-fall {
    0% { transform: translate(0, 0) scale(1); }
    100% { transform: translate(var(--tx), calc(var(--ty) + var(--gravity))) scale(0); }
}

// 右键特殊效果（爱心形状）
document.addEventListener('contextmenu', (e) => {
    createHeartBurst(e.clientX, e.clientY);
    e.preventDefault();
});
```

---

### `Module 09` — Hero Cluster 英雄区集群
```javascript
// 功能：首页顶部核心信息展示区
// 组成：头像(avatar) + 站点名(name) + 实时时钟(clock)
```
```
布局结构：
┌─────────────────────────┐
│    ┌─────┐              │
│    │ 😊  │  Luliy       │
│    │avatar│  全栈开发者   │
│    └─────┘  ──── 14:32  │
│         [动态时钟]        │
└─────────────────────────┘
```

**修改方式**：
```javascript
// 时钟改为多时区显示
const clocks = [
    { zone: 'Asia/Shanghai', label: '北京' },
    { zone: 'America/New_York', label: '纽约' },
    { zone: 'Europe/London', label: '伦敦' }
];

// 头像添加状态指示（在线/忙碌/离线）
const statusIndicator = document.createElement('div');
statusIndicator.className = `status ${getCurrentStatus()}`; 
// CSS: .status.online { border-color: #00c853; }
```

---

### `Module 10` — Hero Banner 首页滚动折叠横幅
```javascript
// 功能：滚动时英雄区的视差+折叠效果
// 技术：scroll-driven animation (CSS) + JS fallback
```
| 滚动位置 | 效果 |
|----------|------|
| 0-100px | 正常显示，轻微视差 |
| 100-300px | 高度压缩，元素淡出 |
| >300px | 完全折叠为迷你导航栏 |

**修改方式**：
```javascript
// 改为横向滚动触发（适用于横向布局网站）
const scrollProgress = container.scrollLeft / (container.scrollWidth - container.clientWidth);

// 添加毛玻璃强度随滚动变化
const blurAmount = Math.min(scrollY / 10, 20);
hero.style.backdropFilter = `blur(${blurAmount}px)`;
```

---

### `Module 11` — Tag Page Search Toolbar 标签页搜索工具栏
```javascript
// 功能：标签聚合页面的高级筛选
// 特性：实时搜索、多标签交集筛选、排序切换
```
| 功能 | 交互 |
|------|------|
| 搜索框 | 输入即时过滤，debounce 150ms |
| 标签云 | 点击添加/移除筛选条件 |
| 排序 | 时间/热度/字母 |
| 视图 | 网格/列表切换 |

**修改方式**：
```javascript
// 添加正则搜索支持
const isRegex = searchTerm.startsWith('/');
const pattern = isRegex ? new RegExp(searchTerm.slice(1, -1), 'i') : null;

// 添加搜索历史
const searchHistory = JSON.parse(localStorage.getItem('search_history') || '[]');
// 显示最近5条，点击快速填充

// 高级筛选：日期范围
const dateRange = {
    from: new Date('2024-01-01'),
    to: new Date()
};
```

---

### `Module 12` — Image Lightbox 图片灯箱
```javascript
// 功能：文章内图片点击放大查看
// 特性：手势支持、键盘导航、EXIF 信息展示
```
| 操作 | 功能 |
|------|------|
| 单击 | 打开灯箱 |
| 滚轮 | 缩放 |
| 拖拽 | 平移（放大后）|
| ←/→ | 切换同组图片 |
| ESC | 关闭 |

**修改方式**：
```javascript
// 添加图片对比模式（before/after）
lightbox.enableCompare = (img1, img2) => {
    return new CompareSlider(img1, img2);
};

// 添加下载原图按钮
const downloadBtn = document.createElement('a');
downloadBtn.href = originalUrl;
downloadBtn.download = filename;
// 需要后端支持原图访问

// 添加图片 OCR（调用 Tesseract.js）
const ocrBtn = document.createElement('button');
ocrBtn.onclick = async () => {
    const result = await Tesseract.recognize(imgElement);
    showTextOverlay(result.data.text);
};
```

---

### `Module 13` — Floating Toolbar + Unified Sink 浮动工具栏
```javascript
// 功能：全局可访问的快捷操作中心
// 4主题：每个主题有独立的工具栏配色和图标风格
```
```
工具栏组成：
┌────────────────────────────────┐
│ [🎨主题] [🔤字体] [🔊声音] [⚙️] │  ← 常驻
│         ▼ 展开更多              │
│ [📑目录] [🔖收藏] [💬评论] [↑] │
└────────────────────────────────┘
         ↓
    Unified Sink（统一收纳区）
    所有展开面板在此层叠管理
```

**修改方式**：
```javascript
// 添加自定义快捷工具
const customTools = [
    {
        id: 'translate',
        icon: '🌐',
        action: () => toggleTranslateOverlay(),
        shortcut: 'KeyT'
    },
    {
        id: 'reader',
        icon: '📖',
        action: () => enterReaderMode(),
        shortcut: 'KeyR'
    }
];

// 工具栏位置记忆
const savedPosition = localStorage.getItem('toolbar_pos');
toolbar.style.left = savedPosition?.x || 'auto';
toolbar.style.right = '20px';  // 默认右侧
```

---

### `Module 14` — Home Card Rebuild 首页卡片重构
```javascript
// 功能：文章列表的卡片式展示，v8 全新设计
// 特性：悬停3D倾斜、图片懒加载、阅读时间估算
```
| 卡片元素 | 说明 |
|----------|------|
| 封面图 | aspect-ratio 16/10，懒加载 + 模糊占位 |
| 分类标签 | 左上角绝对定位 |
| 标题 | 2行截断，悬停展开 |
| 摘要 | 3行截断 |
| 元信息 | 日期 · 阅读时间 · 点赞数 |
| 悬停效果 | 3D tilt + 阴影扩散 + 图片缩放 |

**修改方式**：
```javascript
// 添加阅读进度环（SVG）
const progressRing = `
<svg class="progress-ring" viewBox="0 0 36 36">
    <path d="M18 2.0845..." 
          stroke-dasharray="${readPercent}, 100"/>
</svg>`;

//  masonry 瀑布流布局
const masonry = new Masonry(grid, {
    itemSelector: '.card',
    columnWidth: '.card-sizer',
    gutter: 24
});

// 无限滚动替代分页
const observer = new IntersectionObserver((entries) => {
    entries[0].isIntersecting && loadMorePosts();
});
observer.observe(sentinel);
```

---

### `Module 15` — macOS Code Block Strip macOS 风格代码块
```javascript
// 功能：仿 macOS Terminal 的代码展示
// 组成：三色圆点 + 标题栏 + 行号 + 语法高亮 + 复制按钮
```
```
┌─────────────────────────────┐  ← wrapper="code-window"
│ ● ● ●  filename.js          │  ← title bar (可选)
├─────────────────────────────┤
│ 1  │ const hello = 'world'; │  ← line numbers + code
│ 2  │ console.log(hello);    │
│ 3  │                        │
└─────────────────────────────┘
      [📋]  ← 悬浮复制按钮
```

**修改方式**：
```javascript
// 添加语言图标
const langIcons = {
    'javascript': '<svg>...</svg>',
    'python': '<svg>...</svg>',
    'rust': '<svg>...</svg>'
};

// 添加代码执行（WebContainer 或 Pyodide）
const runButton = document.createElement('button');
runButton.onclick = async () => {
    const result = await webcontainer.run(codeBlock.textContent);
    showOutput(result);
};

// 添加 diff 高亮
const diffColors = {
    '+': 'var(--diff-add)',
    '-': 'var(--diff-del)',
    '@': 'var(--diff-meta)'
};
```

---

### `Module 16` — Sakura Petals 樱花花瓣
```javascript
// 功能：全屏 Canvas 花瓣飘落动画（v8 性能优化版）
// 与 v7 区别：使用 OffscreenCanvas + requestAnimationFrame 节流
```
| 参数 | 说明 |
|------|------|
| 最大花瓣数 | 50（移动端 25）|
| 物理模拟 | 风力 + 重力 + 旋转 |
| 颜色 | 主题关联（sakura=粉，ocean=蓝泡，forest=绿叶，stardust=星尘）|

**修改方式**：
```javascript
// 根据季节自动切换
const month = new Date().getMonth();
const seasonalEffects = {
    2: 'sakura',    // 3月春
    5: 'rain',      // 6月梅雨
    8: 'maple',     // 9月秋
    11: 'snow'      // 12月冬
};
setEffect(seasonalEffects[month] || 'none');

// 鼠标交互：花瓣避让
canvas.addEventListener('mousemove', (e) => {
    petals.forEach(petal => {
        const dx = petal.x - e.clientX;
        const dy = petal.y - e.clientY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
            petal.vx += dx * 0.01;
            petal.vy += dy * 0.01;
        }
    });
});
```

---

### `Module 17` — ArticleTOC Scroll-Spy + Back-to-Top 文章目录
```javascript
// 功能：文章页右侧/左侧浮动目录 + 滚动监听高亮
// 双组件：TOC 导航 + 返回顶部按钮（智能显隐）
```
| TOC 特性 | 说明 |
|----------|------|
| 生成源 | H2-H4 标题层级 |
| 滚动监听 | IntersectionObserver，rootMargin 优化 |
| 点击滚动 | smooth scroll，URL hash 更新 |
| 折叠展开 | 层级折叠，当前章节自动展开 |

| Back-to-Top | 说明 |
|-------------|------|
| 显示阈值 | 滚动超过 500px |
| 进度环 | SVG 圆周表示阅读进度 |
| 点击行为 | 平滑回顶 + 可选确认 |

**修改方式**：
```javascript
// TOC 添加阅读时间估算
const readingTime = Math.ceil(textLength / 400); // 400字/分钟
tocHeader.innerHTML = `目录 · 约 ${readingTime} 分钟`;

// Back-to-Top 添加章节快速跳转
const quickJumps = document.createElement('div');
quickJumps.innerHTML = `
    <button data-target="prev">↑ 上一章</button>
    <button data-target="next">↓ 下一章</button>
`;

// 滚动方向感知：向下滚动隐藏 TOC，向上显示
let lastScrollY = 0;
window.addEventListener('scroll', () => {
    const direction = window.scrollY > lastScrollY ? 'down' : 'up';
    toc.classList.toggle('hidden', direction === 'down' && scrollY > 1000);
    lastScrollY = window.scrollY;
});
```

---

### `Module 18` — Mobile Nav Hamburger + Dropdown 移动端导航
```javascript
// 功能：小屏设备的响应式导航
// 特性：手势滑动打开、焦点陷阱、ARIA 无障碍
```
| 断点 | 行为 |
|------|------|
| > 1024px | 水平导航栏，无汉堡 |
| 768-1024px | 简化导航，可选汉堡 |
| < 768px | 全屏抽屉导航 |

**修改方式**：
```javascript
// 添加底部 Tab Bar（移动端 App 风格）
const tabBar = document.createElement('nav');
tabBar.className = 'mobile-tab-bar';
tabBar.innerHTML = `
    <a href="/" ${isActive('/')}>🏠 首页</a>
    <a href="/tags" ${isActive('/tags')}>🏷️ 标签</a>
    <a href="/search" class="center-btn">🔍</a>
    <a href="/archive" ${isActive('/archive')}>📚 归档</a>
    <a href="/about" ${isActive('/about')}>👤 我</a>
`;

// 手势：边缘右滑打开
let touchStartX = 0;
document.addEventListener('touchstart', e => touchStartX = e.touches[0].clientX);
document.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientX - touchStartX > 100 && touchStartX < 30) {
        openDrawer();
    }
});
```

---

### `Module 19` — Search Overlay 搜索遮罩层
```javascript
// 功能：全站内容搜索，覆盖式 UI
// 特性：快捷键唤起、本地索引、搜索结果高亮
```
| 快捷键 | 功能 |
|--------|------|
| `Cmd/Ctrl + K` | 打开搜索 |
| `ESC` | 关闭 |
| `↑/↓` | 结果导航 |
| `Enter` | 打开选中 |
| `Tab` | 切换搜索范围 |

**修改方式**：
```javascript
// 接入 Algolia 或 Meilisearch 实现全文搜索
const searchClient = algoliasearch('APP_ID', 'API_KEY');
const index = searchClient.initIndex('posts');

// 添加搜索建议（自动补全）
const suggestions = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);

// 搜索结果预览（上下文片段）
const highlightResult = hit._highlightResult;
const snippet = highlightResult.content.value.substring(0, 200) + '...';
```

---

### `Module 20` — Homepage Bottom Gallery Banner 首页底部画廊横幅
```javascript
// 功能：首页底部的图片展示墙，可链接到图集/相册
// 布局：横向滚动或瀑布流
```
| 模式 | 说明 |
|------|------|
| `scroll` | 横向拖拽滚动，无限循环 |
| `masonry` | 瀑布流，点击放大 |
| `carousel` | 自动轮播，指示器导航 |

**修改方式**：
```javascript
// 接入 Instagram/Flickr API 实时同步
const feed = await fetch(`https://graph.instagram.com/me/media?fields=...`);

// 添加点赞交互
galleryItem.addEventListener('dblclick', (e) => {
    createHeartAnimation(e.clientX, e.clientY);
    incrementLike(photoId);
});

// 懒加载 + 模糊渐进
const img = new Image();
img.src = thumbnailUrl;  // 先加载模糊小图
img.onload = () => {
    fullResImg.src = fullUrl;  // 再加载高清图
    fullResImg.classList.add('loaded');
};
```

---

### `Module 21` — Post Page Init 文章页初始化
```javascript
// 功能：文章页的模块组合调用
// 执行顺序：语法高亮 → 图片处理 → TOC生成 → 相关文章 → 评论加载
```

**修改方式**：
```javascript
// 添加阅读进度保存（跨设备同步）
const readingProgress = {
    url: location.href,
    scrollPercent: 0,
    timestamp: Date.now()
};
syncToServer(readingProgress);  // 或 localStorage

// 返回时恢复位置
window.addEventListener('load', () => {
    const saved = await getProgress(location.href);
    if (saved && saved.scrollPercent < 0.95) {
        window.scrollTo(0, saved.scrollPercent * document.body.scrollHeight);
        showResumePrompt(saved);
    }
});
```

---

### `Module 22` — Index Page Init 首页初始化
```javascript
// 功能：首页的模块组合调用
// 执行顺序：英雄区 → 卡片网格 → 分页/无限滚动 → 底部画廊
```

---

### `Module 23` — Main Entry 主入口
```javascript
// 功能：路由分发 + 模块调度器
// 根据页面类型（home/post/tag/archive）加载对应初始化模块
```

```javascript
// 路由映射表
const ROUTES = {
    '/': ['00', '01', '02', '03', '04', '06', '09', '10', '13', '14', '20', '23'],
    '/post/*': ['00', '01', '02', '03', '04', '06', '07', '08', '12', '15', '16', '17', '21', '23'],
    '/tag/*': ['00', '01', '02', '03', '04', '06', '11', '13', '23'],
    '/search': ['00', '01', '02', '03', '19', '23']
};
```

---

## 三、CSS 区域详解

### `Section 00` — Font Imports 字体导入
```css
/* 当前加载 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=JetBrains+Mono&display=swap');

/* 建议添加 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap'); /* 无衬线正文 */
```

---

### `Section 01` — CSS Variables + Reset 变量与重置
```css
:root {
    /* 核心变量 */
    --font-serif: 'Noto Serif SC', serif;
    --font-sans: 'Noto Sans SC', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    
    /* 动态主题变量（由 JS 切换） */
    --bg-primary: #faf7f5;
    --bg-secondary: #f0ebe7;
    --text-primary: #2c2420;
    --text-secondary: #6b5e55;
    --accent: #e8919c;        /* 主题色 */
    --accent-hover: #d67a85;  /* 悬停态 */
    --glass-bg: rgba(255,255,255,0.7);
    --glass-border: rgba(255,255,255,0.3);
    
    /* 间距系统 */
    --space-xs: 0.25rem;   /* 4px */
    --space-sm: 0.5rem;    /* 8px */
    --space-md: 1rem;      /* 16px */
    --space-lg: 1.5rem;    /* 24px */
    --space-xl: 2rem;      /* 32px */
    --space-2xl: 3rem;     /* 48px */
    
    /* 圆角系统 */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-full: 9999px;
    
    /* 阴影系统 */
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
    --shadow-glow: 0 0 20px var(--accent-alpha);
}
```

---

### `Section 02` — Welcome Splash Overlay 欢迎闪屏样式

| 类名 | 用途 |
|------|------|
| `.splash-overlay` | 全屏固定层 |
| `.splash-brand` | 品牌文字容器 |
| `.splash-progress` | 底部进度条轨道 |
| `.splash-progress-bar` | 进度填充动画 |

---

### `Section 03` — Background Image 背景图

```css
/* 主题背景映射 */
[data-theme="sakura"] {
    --bg-image: url('/assets/bg-sakura.jpg');
    --bg-overlay: linear-gradient(180deg, rgba(250,247,245,0.9) 0%, rgba(250,247,245,0.6) 100%);
}

[data-theme="ocean"] {
    --bg-image: url('/assets/bg-ocean.jpg');
    --bg-overlay: linear-gradient(180deg, rgba(240,248,255,0.9) 0%, rgba(240,248,255,0.6) 100%);
}
```

---

### `Section 04` — Typography 排版

| 模式 | 字体 | 适用场景 |
|------|------|----------|
| Day | `Noto Serif SC` | 正文阅读，传统优雅 |
| Night | `Noto Sans SC` | 暗色下更清晰 |
| 代码 | `JetBrains Mono` | 等宽，连字支持 |

---

### `Section 05` — Navbar 导航栏

**Liquid Glass 效果**：
```css
.navbar {
    background: var(--glass-bg);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid var(--glass-border);
}
```

---

### `Section 06-07` — Hero 区域

见 Module 09-10 说明。

---

### `Section 08` — Progress Bar 进度条

```css
.progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent), var(--accent-hover));
    z-index: 9999;
    transition: width 0.1s linear;
}
```

---

### `Section 09` — Cards 卡片网格

```css
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
    gap: var(--space-lg);
}

/* 3D 悬停效果 */
.card {
    transform-style: preserve-3d;
    transition: transform 0.3s ease;
}
.card:hover {
    transform: translateY(-4px) rotateX(2deg) rotateY(-2deg);
}
```

---

### `Section 10` — Date Badge 日期徽章

```css
.date-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background: var(--accent-alpha);
    color: var(--accent);
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
}
```

---

### `Section 11` — Pinned Section 置顶区

```css
.pinned-section {
    position: relative;
    padding-left: var(--space-md);
    border-left: 3px solid var(--accent);
}

.pinned-badge::before {
    content: '📌';
    margin-right: var(--space-xs);
}
```

---

### `Section 12` — Article Reading Panels 文章阅读面板（4主题）

| 主题 | 氛围 | 背景 | 文字 |
|------|------|------|------|
| `sakura` | 樱花纸质 | 暖白微粉 | 深褐 |
| `ocean` | 深海阅读 | 深蓝灰 | 浅青白 |
| `forest` | 森林晨读 | 浅绿米 | 深绿褐 |
| `stardust` | 星空夜读 | 近黑 | 星白 |

---

### `Section 13` — Code Blocks 代码块

见 Module 15。

---

### `Section 14` — Tables 表格

```css
/* 响应式表格：小屏横向滚动 */
.table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

/* 斑马纹 */
.table-row:nth-child(even) {
    background: var(--bg-secondary);
}
```

---

### `Section 15` — Article Theme CSS Variables 文章主题变量

```css
[data-article-theme="sakura"] {
    --article-bg: #fdfbf7;
    --article-text: #3d322b;
    --article-heading: #8b4513;
    --article-link: #c45c6a;
    --article-link-hover: #a03040;
    --article-quote-border: #e8919c;
    --article-code-bg: #f5f0eb;
}

[data-article-theme="ocean"] {
    --article-bg: #0f172a;
    --article-text: #e2e8f0;
    --article-heading: #7dd3fc;
    --article-link: #38bdf8;
    --article-link-hover: #0ea5e9;
    --article-quote-border: #0ea5e9;
    --article-code-bg: #1e293b;
}
/* ... forest, stardust 同理 */
```

---

### `Section 16` — TOC Scroll-Spy 目录滚动监听

```css
.toc-link {
    display: block;
    padding: var(--space-xs) var(--space-sm);
    border-left: 2px solid transparent;
    color: var(--text-secondary);
    transition: all 0.2s;
}

.toc-link.active {
    border-left-color: var(--accent);
    color: var(--accent);
    background: var(--accent-alpha);
    font-weight: 500;
}

/* 层级缩进 */
.toc-link[data-level="3"] { padding-left: var(--space-lg); }
.toc-link[data-level="4"] { padding-left: var(--space-xl); }
```

---

### `Section 17` — Floating Toolbar + Sink Menu

```css
.floating-toolbar {
    position: fixed;
    right: var(--space-lg);
    bottom: var(--space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    z-index: 100;
}

/* 展开动画 */
.sink-panel {
    transform-origin: bottom right;
    animation: sink-expand 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes sink-expand {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
```

---

我来为您生成 **Luliy Blog v8 完整技术说明书**，涵盖所有模块、CSS 区域、JSON 配置及扩展建议。

---

# 📘 Luliy Blog v8 完整技术说明书

## 目录
1. [架构总览](#一架构总览)
2. [JS 模块详解 (00-23)](#二js-模块详解)
3. [CSS 区域详解 (00-26)](#三css-区域详解)
4. [JSON 配置文件](#四json-配置文件)
5. [主题系统深度解析](#五主题系统深度解析)
6. [修改指南与最佳实践](#六修改指南)
7. [扩展功能建议](#七扩展功能建议)

---

## 一、架构总览

```
Luliy Blog v8
├── 📁 js/
│   └── main.js          # 24个模块，按序加载
├── 📁 css/
│   └── enhance.css      # 27个区域，主题驱动
├── 📄 config.json       # 博客核心配置
├── 📄 theme.json        # 主题预设（4主题）
└── 📄 manifest.json     # PWA 配置
```

**设计哲学**：模块化加载 → 主题变量驱动 → 渐进增强

---

## 二、JS 模块详解

### `Module 00` — Welcome Splash 欢迎闪屏
```javascript
// 功能：页面首次加载时的品牌展示动画
// 触发：sessionStorage 控制，同会话只显示一次
```
| 属性 | 说明 |
|------|------|
| 触发条件 | `sessionStorage.getItem('visited') !== 'true'` |
| 动画序列 | fadeIn → 品牌文字 → progress填充 → fadeOut |
| 阻断性 | **阻塞后续模块加载**，动画完成后才执行 01-23 |

**修改方式**：
```javascript
// 修改动画时长（默认 2500ms）
const SPLASH_DURATION = 3000;  // 延长到3秒

// 修改显示频率：每次刷新都显示
// 删除或注释掉 sessionStorage 相关代码

// 自定义品牌文字
const BRAND_TEXT = "Your Name";  // 替换 "Luliy"
```

---

### `Module 01` — localStorage Init 本地存储初始化
```javascript
// 功能：建立持久化配置层，所有用户偏好保存于此
// 数据结构：{ theme, fontSize, reducedMotion, soundEnabled, ... }
```
| 存储键 | 用途 | 默认值 |
|--------|------|--------|
| `luliy_theme` | 当前主题ID | `"sakura"` |
| `luliy_font` | 字体缩放级别 | `"md"` |
| `luliy_motion` | 减少动画偏好 | `false` |
| `luliy_sound` | 音效开关 | `true` |
| `luliy_visited` | 访问标记（splash用）| — |

**修改方式**：
```javascript
// 新增自定义配置项
localStorage.setItem('luliy_customGrid', '3');  // 新增：网格列数

// 读取时
const gridCols = localStorage.getItem('luliy_customGrid') || '2';
```

---

### `Module 02` — Progress Bar 进度条
```javascript
// 功能：顶部阅读进度指示器 + 页面加载进度
// 双模式：loading（资源加载）| reading（滚动深度）
```
| 模式 | 触发条件 | 颜色来源 |
|------|----------|----------|
| Loading | `document.readyState !== 'complete'` | `--accent` |
| Reading | 滚动事件 | 当前主题主色 |

**修改方式**：
```javascript
// 改为底部显示
const progressBar = document.createElement('div');
progressBar.style.top = 'auto';
progressBar.style.bottom = '0';  // 底部进度条

// 添加缓冲动画效果
progressBar.style.transition = 'width 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
```

---

### `Module 03` — Dynamic Title 动态标题
```javascript
// 功能：标签页失焦时显示自定义消息，吸引用户回流
```
| 状态 | 标题变化 |
|------|----------|
| 页面可见 | 原始标题 `"文章标题 | Luliy Blog"` |
| 页面隐藏 | `"(◍•ᴗ•◍) 快回来~" + 原始标题` |

**修改方式**：
```javascript
// 自定义失焦消息数组（随机轮换）
const AWAY_MESSAGES = [
    "✨ 发现好文不看完吗？",
    "🌸 樱花飘落中，等你回来",
    "📚 知识正在冷却...",
    "🎵 音乐暂停了"
];

// 根据页面类型定制
const isPostPage = location.pathname.includes('/post/');
const message = isPostPage ? "📖 读一半呢，别走~" : AWAY_MESSAGES[random];
```

---

### `Module 04` — Uptime Counter 运行时间计数器
```javascript
// 功能：显示博客自创建以来的运行时长
// 格式：X年X月X日 X时X分X秒 | 或精简版
```
| 显示位置 | 默认 | 可选 |
|----------|------|------|
| Footer | 完整格式 | 精简图标版 |
| 英雄区 | 无 | 徽章式 |

**修改方式**：
```javascript
// 修改起始时间（博客创建日期）
const BIRTH_DATE = new Date('2020-03-15T00:00:00+08:00');  // 你的建站日

// 改为显示"本站已陪伴你"（访客视角）
const visitorFirstVisit = localStorage.getItem('first_visit');
const displayTime = visitorFirstVisit 
    ? timeSince(new Date(visitorFirstVisit))  // 个人视角
    : timeSince(BIRTH_DATE);                  // 站点视角
```

---

### `Module 05` — Dark-mode Ripple 深色模式涟漪
```javascript
// 功能：主题切换时的视觉过渡效果
// 原理：点击位置创建 radial-gradient 扩散动画
```
| 参数 | 说明 |
|------|------|
| 动画时长 | 600ms |
| 缓动函数 | `cubic-bezier(0.4, 0, 0.2, 1)` |
| 覆盖范围 | 全视口 |

**修改方式**：
```javascript
// 改为从中心扩散（而非点击位置）
const centerX = window.innerWidth / 2;
const centerY = window.innerHeight / 2;

// 添加声音反馈（配合 Module 07）
ripple.addEventListener('animationstart', () => {
    playSound('whoosh', 0.3);
});
```

---

### `Module 06` — Static Background 静态背景
```javascript
// 功能：主题相关的背景图/渐变（v8移除粒子性能开销）
// 替代方案：CSS 渐变 + 可选的轻量 SVG 纹理
```
| 主题 | 背景类型 |
|------|----------|
| `sakura` | 粉色渐变 + 花瓣纹理 SVG |
| `ocean` | 深蓝渐变 + 波浪 SVG |
| `forest` | 绿色渐变 + 叶脉纹理 |
| `stardust` | 深色渐变 + 星点 CSS |

**修改方式**：
```css
/* 添加自定义纹理 */
[data-theme="custom"] {
    --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --bg-texture: url("data:image/svg+xml,%3Csvg width='60' height='60'..."); /* 内联 SVG */
}
```

---

### `Module 07` — Web Audio SFX 音效系统
```javascript
// 功能：全站交互音效，基于 Web Audio API（非 HTML5 Audio）
// 特点：零依赖、低延迟、可合成多种音色
```
| 音效ID | 触发场景 | 音色类型 |
|--------|----------|----------|
| `click` | 按钮点击 | 短促正弦波 |
| `hover` | 卡片悬停 | 轻柔八度 |
| `switch` | 主题切换 | 滑音效果 |
| `success` | 操作成功 | 和弦上升 |
| `pop` | 菜单展开 | 气泡破裂 |
| `type` | 打字机（可选）| 机械键盘 |

**修改方式**：
```javascript
// 添加新音效：页面滚动到特定区域的反馈
function playScrollZoneSound(zoneName) {
    const frequencies = {
        'hero': 523.25,      // C5
        'content': 659.25,   // E5
        'footer': 783.99     // G5
    };
    playTone(frequencies[zoneName], 'sine', 0.15, 0.1);
}

// 全局静音检测（系统偏好）
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    audioContext.suspend();  // 尊重用户系统设置
}
```

---

### `Module 08` — Click Sparks 点击火花
```javascript
// 功能：鼠标点击位置生成粒子爆发效果
// 与 Module 16 樱花的区别：火花是瞬时爆发，樱花是持续环境
```
| 参数 | 默认值 | 说明 |
|------|--------|------|
| 粒子数 | 8-12 | 随机 |
| 颜色 | 当前主题 accent | 动态继承 |
| 生命周期 | 600ms | CSS 动画 |
| 物理 | 无重力 | 纯扩散 |

**修改方式**：
```javascript
// 添加重力效果（抛物线）
spark.style.setProperty('--gravity', `${Math.random() * 50 + 20}px`);

// CSS 配合
@keyframes spark-fall {
    0% { transform: translate(0, 0) scale(1); }
    100% { transform: translate(var(--tx), calc(var(--ty) + var(--gravity))) scale(0); }
}

// 右键特殊效果（爱心形状）
document.addEventListener('contextmenu', (e) => {
    createHeartBurst(e.clientX, e.clientY);
    e.preventDefault();
});
```

---

### `Module 09` — Hero Cluster 英雄区集群
```javascript
// 功能：首页顶部核心信息展示区
// 组成：头像(avatar) + 站点名(name) + 实时时钟(clock)
```
```
布局结构：
┌─────────────────────────┐
│    ┌─────┐              │
│    │ 😊  │  Luliy       │
│    │avatar│  全栈开发者   │
│    └─────┘  ──── 14:32  │
│         [动态时钟]        │
└─────────────────────────┘
```

**修改方式**：
```javascript
// 时钟改为多时区显示
const clocks = [
    { zone: 'Asia/Shanghai', label: '北京' },
    { zone: 'America/New_York', label: '纽约' },
    { zone: 'Europe/London', label: '伦敦' }
];

// 头像添加状态指示（在线/忙碌/离线）
const statusIndicator = document.createElement('div');
statusIndicator.className = `status ${getCurrentStatus()}`; 
// CSS: .status.online { border-color: #00c853; }
```

---

### `Module 10` — Hero Banner 首页滚动折叠横幅
```javascript
// 功能：滚动时英雄区的视差+折叠效果
// 技术：scroll-driven animation (CSS) + JS fallback
```
| 滚动位置 | 效果 |
|----------|------|
| 0-100px | 正常显示，轻微视差 |
| 100-300px | 高度压缩，元素淡出 |
| >300px | 完全折叠为迷你导航栏 |

**修改方式**：
```javascript
// 改为横向滚动触发（适用于横向布局网站）
const scrollProgress = container.scrollLeft / (container.scrollWidth - container.clientWidth);

// 添加毛玻璃强度随滚动变化
const blurAmount = Math.min(scrollY / 10, 20);
hero.style.backdropFilter = `blur(${blurAmount}px)`;
```

---

### `Module 11` — Tag Page Search Toolbar 标签页搜索工具栏
```javascript
// 功能：标签聚合页面的高级筛选
// 特性：实时搜索、多标签交集筛选、排序切换
```
| 功能 | 交互 |
|------|------|
| 搜索框 | 输入即时过滤，debounce 150ms |
| 标签云 | 点击添加/移除筛选条件 |
| 排序 | 时间/热度/字母 |
| 视图 | 网格/列表切换 |

**修改方式**：
```javascript
// 添加正则搜索支持
const isRegex = searchTerm.startsWith('/');
const pattern = isRegex ? new RegExp(searchTerm.slice(1, -1), 'i') : null;

// 添加搜索历史
const searchHistory = JSON.parse(localStorage.getItem('search_history') || '[]');
// 显示最近5条，点击快速填充

// 高级筛选：日期范围
const dateRange = {
    from: new Date('2024-01-01'),
    to: new Date()
};
```

---

### `Module 12` — Image Lightbox 图片灯箱
```javascript
// 功能：文章内图片点击放大查看
// 特性：手势支持、键盘导航、EXIF 信息展示
```
| 操作 | 功能 |
|------|------|
| 单击 | 打开灯箱 |
| 滚轮 | 缩放 |
| 拖拽 | 平移（放大后）|
| ←/→ | 切换同组图片 |
| ESC | 关闭 |

**修改方式**：
```javascript
// 添加图片对比模式（before/after）
lightbox.enableCompare = (img1, img2) => {
    return new CompareSlider(img1, img2);
};

// 添加下载原图按钮
const downloadBtn = document.createElement('a');
downloadBtn.href = originalUrl;
downloadBtn.download = filename;
// 需要后端支持原图访问

// 添加图片 OCR（调用 Tesseract.js）
const ocrBtn = document.createElement('button');
ocrBtn.onclick = async () => {
    const result = await Tesseract.recognize(imgElement);
    showTextOverlay(result.data.text);
};
```

---

### `Module 13` — Floating Toolbar + Unified Sink 浮动工具栏
```javascript
// 功能：全局可访问的快捷操作中心
// 4主题：每个主题有独立的工具栏配色和图标风格
```
```
工具栏组成：
┌────────────────────────────────┐
│ [🎨主题] [🔤字体] [🔊声音] [⚙️] │  ← 常驻
│         ▼ 展开更多              │
│ [📑目录] [🔖收藏] [💬评论] [↑] │
└────────────────────────────────┘
         ↓
    Unified Sink（统一收纳区）
    所有展开面板在此层叠管理
```

**修改方式**：
```javascript
// 添加自定义快捷工具
const customTools = [
    {
        id: 'translate',
        icon: '🌐',
        action: () => toggleTranslateOverlay(),
        shortcut: 'KeyT'
    },
    {
        id: 'reader',
        icon: '📖',
        action: () => enterReaderMode(),
        shortcut: 'KeyR'
    }
];

// 工具栏位置记忆
const savedPosition = localStorage.getItem('toolbar_pos');
toolbar.style.left = savedPosition?.x || 'auto';
toolbar.style.right = '20px';  // 默认右侧
```

---

### `Module 14` — Home Card Rebuild 首页卡片重构
```javascript
// 功能：文章列表的卡片式展示，v8 全新设计
// 特性：悬停3D倾斜、图片懒加载、阅读时间估算
```
| 卡片元素 | 说明 |
|----------|------|
| 封面图 | aspect-ratio 16/10，懒加载 + 模糊占位 |
| 分类标签 | 左上角绝对定位 |
| 标题 | 2行截断，悬停展开 |
| 摘要 | 3行截断 |
| 元信息 | 日期 · 阅读时间 · 点赞数 |
| 悬停效果 | 3D tilt + 阴影扩散 + 图片缩放 |

**修改方式**：
```javascript
// 添加阅读进度环（SVG）
const progressRing = `
<svg class="progress-ring" viewBox="0 0 36 36">
    <path d="M18 2.0845..." 
          stroke-dasharray="${readPercent}, 100"/>
</svg>`;

//  masonry 瀑布流布局
const masonry = new Masonry(grid, {
    itemSelector: '.card',
    columnWidth: '.card-sizer',
    gutter: 24
});

// 无限滚动替代分页
const observer = new IntersectionObserver((entries) => {
    entries[0].isIntersecting && loadMorePosts();
});
observer.observe(sentinel);
```

---

### `Module 15` — macOS Code Block Strip macOS 风格代码块
```javascript
// 功能：仿 macOS Terminal 的代码展示
// 组成：三色圆点 + 标题栏 + 行号 + 语法高亮 + 复制按钮
```
```
┌─────────────────────────────┐  ← wrapper="code-window"
│ ● ● ●  filename.js          │  ← title bar (可选)
├─────────────────────────────┤
│ 1  │ const hello = 'world'; │  ← line numbers + code
│ 2  │ console.log(hello);    │
│ 3  │                        │
└─────────────────────────────┘
      [📋]  ← 悬浮复制按钮
```

**修改方式**：
```javascript
// 添加语言图标
const langIcons = {
    'javascript': '<svg>...</svg>',
    'python': '<svg>...</svg>',
    'rust': '<svg>...</svg>'
};

// 添加代码执行（WebContainer 或 Pyodide）
const runButton = document.createElement('button');
runButton.onclick = async () => {
    const result = await webcontainer.run(codeBlock.textContent);
    showOutput(result);
};

// 添加 diff 高亮
const diffColors = {
    '+': 'var(--diff-add)',
    '-': 'var(--diff-del)',
    '@': 'var(--diff-meta)'
};
```

---

### `Module 16` — Sakura Petals 樱花花瓣
```javascript
// 功能：全屏 Canvas 花瓣飘落动画（v8 性能优化版）
// 与 v7 区别：使用 OffscreenCanvas + requestAnimationFrame 节流
```
| 参数 | 说明 |
|------|------|
| 最大花瓣数 | 50（移动端 25）|
| 物理模拟 | 风力 + 重力 + 旋转 |
| 颜色 | 主题关联（sakura=粉，ocean=蓝泡，forest=绿叶，stardust=星尘）|

**修改方式**：
```javascript
// 根据季节自动切换
const month = new Date().getMonth();
const seasonalEffects = {
    2: 'sakura',    // 3月春
    5: 'rain',      // 6月梅雨
    8: 'maple',     // 9月秋
    11: 'snow'      // 12月冬
};
setEffect(seasonalEffects[month] || 'none');

// 鼠标交互：花瓣避让
canvas.addEventListener('mousemove', (e) => {
    petals.forEach(petal => {
        const dx = petal.x - e.clientX;
        const dy = petal.y - e.clientY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
            petal.vx += dx * 0.01;
            petal.vy += dy * 0.01;
        }
    });
});
```

---

### `Module 17` — ArticleTOC Scroll-Spy + Back-to-Top 文章目录
```javascript
// 功能：文章页右侧/左侧浮动目录 + 滚动监听高亮
// 双组件：TOC 导航 + 返回顶部按钮（智能显隐）
```
| TOC 特性 | 说明 |
|----------|------|
| 生成源 | H2-H4 标题层级 |
| 滚动监听 | IntersectionObserver，rootMargin 优化 |
| 点击滚动 | smooth scroll，URL hash 更新 |
| 折叠展开 | 层级折叠，当前章节自动展开 |

| Back-to-Top | 说明 |
|-------------|------|
| 显示阈值 | 滚动超过 500px |
| 进度环 | SVG 圆周表示阅读进度 |
| 点击行为 | 平滑回顶 + 可选确认 |

**修改方式**：
```javascript
// TOC 添加阅读时间估算
const readingTime = Math.ceil(textLength / 400); // 400字/分钟
tocHeader.innerHTML = `目录 · 约 ${readingTime} 分钟`;

// Back-to-Top 添加章节快速跳转
const quickJumps = document.createElement('div');
quickJumps.innerHTML = `
    <button data-target="prev">↑ 上一章</button>
    <button data-target="next">↓ 下一章</button>
`;

// 滚动方向感知：向下滚动隐藏 TOC，向上显示
let lastScrollY = 0;
window.addEventListener('scroll', () => {
    const direction = window.scrollY > lastScrollY ? 'down' : 'up';
    toc.classList.toggle('hidden', direction === 'down' && scrollY > 1000);
    lastScrollY = window.scrollY;
});
```

---

### `Module 18` — Mobile Nav Hamburger + Dropdown 移动端导航
```javascript
// 功能：小屏设备的响应式导航
// 特性：手势滑动打开、焦点陷阱、ARIA 无障碍
```
| 断点 | 行为 |
|------|------|
| > 1024px | 水平导航栏，无汉堡 |
| 768-1024px | 简化导航，可选汉堡 |
| < 768px | 全屏抽屉导航 |

**修改方式**：
```javascript
// 添加底部 Tab Bar（移动端 App 风格）
const tabBar = document.createElement('nav');
tabBar.className = 'mobile-tab-bar';
tabBar.innerHTML = `
    <a href="/" ${isActive('/')}>🏠 首页</a>
    <a href="/tags" ${isActive('/tags')}>🏷️ 标签</a>
    <a href="/search" class="center-btn">🔍</a>
    <a href="/archive" ${isActive('/archive')}>📚 归档</a>
    <a href="/about" ${isActive('/about')}>👤 我</a>
`;

// 手势：边缘右滑打开
let touchStartX = 0;
document.addEventListener('touchstart', e => touchStartX = e.touches[0].clientX);
document.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientX - touchStartX > 100 && touchStartX < 30) {
        openDrawer();
    }
});
```

---

### `Module 19` — Search Overlay 搜索遮罩层
```javascript
// 功能：全站内容搜索，覆盖式 UI
// 特性：快捷键唤起、本地索引、搜索结果高亮
```
| 快捷键 | 功能 |
|--------|------|
| `Cmd/Ctrl + K` | 打开搜索 |
| `ESC` | 关闭 |
| `↑/↓` | 结果导航 |
| `Enter` | 打开选中 |
| `Tab` | 切换搜索范围 |

**修改方式**：
```javascript
// 接入 Algolia 或 Meilisearch 实现全文搜索
const searchClient = algoliasearch('APP_ID', 'API_KEY');
const index = searchClient.initIndex('posts');

// 添加搜索建议（自动补全）
const suggestions = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);

// 搜索结果预览（上下文片段）
const highlightResult = hit._highlightResult;
const snippet = highlightResult.content.value.substring(0, 200) + '...';
```

---

### `Module 20` — Homepage Bottom Gallery Banner 首页底部画廊横幅
```javascript
// 功能：首页底部的图片展示墙，可链接到图集/相册
// 布局：横向滚动或瀑布流
```
| 模式 | 说明 |
|------|------|
| `scroll` | 横向拖拽滚动，无限循环 |
| `masonry` | 瀑布流，点击放大 |
| `carousel` | 自动轮播，指示器导航 |

**修改方式**：
```javascript
// 接入 Instagram/Flickr API 实时同步
const feed = await fetch(`https://graph.instagram.com/me/media?fields=...`);

// 添加点赞交互
galleryItem.addEventListener('dblclick', (e) => {
    createHeartAnimation(e.clientX, e.clientY);
    incrementLike(photoId);
});

// 懒加载 + 模糊渐进
const img = new Image();
img.src = thumbnailUrl;  // 先加载模糊小图
img.onload = () => {
    fullResImg.src = fullUrl;  // 再加载高清图
    fullResImg.classList.add('loaded');
};
```

---

### `Module 21` — Post Page Init 文章页初始化
```javascript
// 功能：文章页的模块组合调用
// 执行顺序：语法高亮 → 图片处理 → TOC生成 → 相关文章 → 评论加载
```

**修改方式**：
```javascript
// 添加阅读进度保存（跨设备同步）
const readingProgress = {
    url: location.href,
    scrollPercent: 0,
    timestamp: Date.now()
};
syncToServer(readingProgress);  // 或 localStorage

// 返回时恢复位置
window.addEventListener('load', () => {
    const saved = await getProgress(location.href);
    if (saved && saved.scrollPercent < 0.95) {
        window.scrollTo(0, saved.scrollPercent * document.body.scrollHeight);
        showResumePrompt(saved);
    }
});
```

---

### `Module 22` — Index Page Init 首页初始化
```javascript
// 功能：首页的模块组合调用
// 执行顺序：英雄区 → 卡片网格 → 分页/无限滚动 → 底部画廊
```

---

### `Module 23` — Main Entry 主入口
```javascript
// 功能：路由分发 + 模块调度器
// 根据页面类型（home/post/tag/archive）加载对应初始化模块
```

```javascript
// 路由映射表
const ROUTES = {
    '/': ['00', '01', '02', '03', '04', '06', '09', '10', '13', '14', '20', '23'],
    '/post/*': ['00', '01', '02', '03', '04', '06', '07', '08', '12', '15', '16', '17', '21', '23'],
    '/tag/*': ['00', '01', '02', '03', '04', '06', '11', '13', '23'],
    '/search': ['00', '01', '02', '03', '19', '23']
};
```

---

## 三、CSS 区域详解

### `Section 00` — Font Imports 字体导入
```css
/* 当前加载 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=JetBrains+Mono&display=swap');

/* 建议添加 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap'); /* 无衬线正文 */
```

---

### `Section 01` — CSS Variables + Reset 变量与重置
```css
:root {
    /* 核心变量 */
    --font-serif: 'Noto Serif SC', serif;
    --font-sans: 'Noto Sans SC', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    
    /* 动态主题变量（由 JS 切换） */
    --bg-primary: #faf7f5;
    --bg-secondary: #f0ebe7;
    --text-primary: #2c2420;
    --text-secondary: #6b5e55;
    --accent: #e8919c;        /* 主题色 */
    --accent-hover: #d67a85;  /* 悬停态 */
    --glass-bg: rgba(255,255,255,0.7);
    --glass-border: rgba(255,255,255,0.3);
    
    /* 间距系统 */
    --space-xs: 0.25rem;   /* 4px */
    --space-sm: 0.5rem;    /* 8px */
    --space-md: 1rem;      /* 16px */
    --space-lg: 1.5rem;    /* 24px */
    --space-xl: 2rem;      /* 32px */
    --space-2xl: 3rem;     /* 48px */
    
    /* 圆角系统 */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-full: 9999px;
    
    /* 阴影系统 */
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
    --shadow-glow: 0 0 20px var(--accent-alpha);
}
```

---

### `Section 02` — Welcome Splash Overlay 欢迎闪屏样式

| 类名 | 用途 |
|------|------|
| `.splash-overlay` | 全屏固定层 |
| `.splash-brand` | 品牌文字容器 |
| `.splash-progress` | 底部进度条轨道 |
| `.splash-progress-bar` | 进度填充动画 |

---

### `Section 03` — Background Image 背景图

```css
/* 主题背景映射 */
[data-theme="sakura"] {
    --bg-image: url('/assets/bg-sakura.jpg');
    --bg-overlay: linear-gradient(180deg, rgba(250,247,245,0.9) 0%, rgba(250,247,245,0.6) 100%);
}

[data-theme="ocean"] {
    --bg-image: url('/assets/bg-ocean.jpg');
    --bg-overlay: linear-gradient(180deg, rgba(240,248,255,0.9) 0%, rgba(240,248,255,0.6) 100%);
}
```

---

### `Section 04` — Typography 排版

| 模式 | 字体 | 适用场景 |
|------|------|----------|
| Day | `Noto Serif SC` | 正文阅读，传统优雅 |
| Night | `Noto Sans SC` | 暗色下更清晰 |
| 代码 | `JetBrains Mono` | 等宽，连字支持 |

---

### `Section 05` — Navbar 导航栏

**Liquid Glass 效果**：
```css
.navbar {
    background: var(--glass-bg);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid var(--glass-border);
}
```

---

### `Section 06-07` — Hero 区域

见 Module 09-10 说明。

---

### `Section 08` — Progress Bar 进度条

```css
.progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent), var(--accent-hover));
    z-index: 9999;
    transition: width 0.1s linear;
}
```

---

### `Section 09` — Cards 卡片网格

```css
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
    gap: var(--space-lg);
}

/* 3D 悬停效果 */
.card {
    transform-style: preserve-3d;
    transition: transform 0.3s ease;
}
.card:hover {
    transform: translateY(-4px) rotateX(2deg) rotateY(-2deg);
}
```

---

### `Section 10` — Date Badge 日期徽章

```css
.date-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background: var(--accent-alpha);
    color: var(--accent);
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
}
```

---

### `Section 11` — Pinned Section 置顶区

```css
.pinned-section {
    position: relative;
    padding-left: var(--space-md);
    border-left: 3px solid var(--accent);
}

.pinned-badge::before {
    content: '📌';
    margin-right: var(--space-xs);
}
```

---

### `Section 12` — Article Reading Panels 文章阅读面板（4主题）

| 主题 | 氛围 | 背景 | 文字 |
|------|------|------|------|
| `sakura` | 樱花纸质 | 暖白微粉 | 深褐 |
| `ocean` | 深海阅读 | 深蓝灰 | 浅青白 |
| `forest` | 森林晨读 | 浅绿米 | 深绿褐 |
| `stardust` | 星空夜读 | 近黑 | 星白 |

---

### `Section 13` — Code Blocks 代码块

见 Module 15。

---

### `Section 14` — Tables 表格

```css
/* 响应式表格：小屏横向滚动 */
.table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

/* 斑马纹 */
.table-row:nth-child(even) {
    background: var(--bg-secondary);
}
```

---

### `Section 15` — Article Theme CSS Variables 文章主题变量

```css
[data-article-theme="sakura"] {
    --article-bg: #fdfbf7;
    --article-text: #3d322b;
    --article-heading: #8b4513;
    --article-link: #c45c6a;
    --article-link-hover: #a03040;
    --article-quote-border: #e8919c;
    --article-code-bg: #f5f0eb;
}

[data-article-theme="ocean"] {
    --article-bg: #0f172a;
    --article-text: #e2e8f0;
    --article-heading: #7dd3fc;
    --article-link: #38bdf8;
    --article-link-hover: #0ea5e9;
    --article-quote-border: #0ea5e9;
    --article-code-bg: #1e293b;
}
/* ... forest, stardust 同理 */
```

---

### `Section 16` — TOC Scroll-Spy 目录滚动监听

```css
.toc-link {
    display: block;
    padding: var(--space-xs) var(--space-sm);
    border-left: 2px solid transparent;
    color: var(--text-secondary);
    transition: all 0.2s;
}

.toc-link.active {
    border-left-color: var(--accent);
    color: var(--accent);
    background: var(--accent-alpha);
    font-weight: 500;
}

/* 层级缩进 */
.toc-link[data-level="3"] { padding-left: var(--space-lg); }
.toc-link[data-level="4"] { padding-left: var(--space-xl); }
```

---

### `Section 17` — Floating Toolbar + Sink Menu

```css
.floating-toolbar {
    position: fixed;
    right: var(--space-lg);
    bottom: var(--space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    z-index: 100;
}

/* 展开动画 */
.sink-panel {
    transform-origin: bottom right;
    animation: sink-expand 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes sink-expand {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
```

---

### `Section 18` — Prev/Next Navigation 前后文导航

```css
.post-nav {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-lg);
    margin-top: var(--space-2xl);
    padding-top: var(--space-xl);
    border-top: 1px solid var(--border-color);
}

.post-nav-prev { text-align: left; }
.post-nav-next { text-align: right; }

.post-nav-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 

我继续完成 Luliy Blog v8 的技术说明书，从 Section 18 继续，并补充完整的 JSON 配置说明和扩展功能建议。

---

## 三、CSS 区域详解（续）

### `Section 18` — Prev/Next Navigation 前后文导航（续）

```css
.post-nav-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    margin-bottom: var(--space-xs);
}

.post-nav-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* 悬停效果 */
.post-nav-link:hover .post-nav-title {
    color: var(--accent);
}

.post-nav-link:hover .post-nav-arrow {
    transform: translateX(var(--space-xs));
}
.post-nav-prev:hover .post-nav-arrow {
    transform: translateX(calc(var(--space-xs) * -1));
}
```

**修改方式**：
```css
/* 添加文章封面缩略图 */
.post-nav-thumb {
    width: 80px;
    height: 60px;
    border-radius: var(--radius-md);
    object-fit: cover;
    opacity: 0.8;
    transition: opacity 0.2s;
}
.post-nav-link:hover .post-nav-thumb {
    opacity: 1;
}

/* 改为垂直堆叠（移动端） */
@media (max-width: 640px) {
    .post-nav {
        grid-template-columns: 1fr;
    }
    .post-nav-next {
        text-align: left;
        border-top: 1px solid var(--border-color);
        padding-top: var(--space-lg);
    }
}
```

---

### `Section 19` — Lightbox 灯箱样式

```css
.lightbox-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.92);
    backdrop-filter: blur(10px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
}

.lightbox-overlay.active {
    opacity: 1;
}

.lightbox-image {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
    transform: scale(0.9);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.lightbox-overlay.active .lightbox-image {
    transform: scale(1);
}

/* 图片信息栏 */
.lightbox-meta {
    position: absolute;
    bottom: var(--space-lg);
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.875rem;
}

/* 导航箭头 */
.lightbox-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
}
.lightbox-nav:hover {
    background: rgba(255, 255, 255, 0.2);
}
.lightbox-prev { left: var(--space-lg); }
.lightbox-next { right: var(--space-lg); }

/* 关闭按钮 */
.lightbox-close {
    position: absolute;
    top: var(--space-lg);
    right: var(--space-lg);
    width: 40px;
    height: 40px;
    color: white;
    opacity: 0.7;
    transition: opacity 0.2s;
}
.lightbox-close:hover {
    opacity: 1;
}
```

**修改方式**：
```css
/* 添加缩放指示器 */
.lightbox-zoom-hint {
    position: absolute;
    bottom: calc(var(--space-lg) + 40px);
    left: 50%;
    transform: translateX(-50%);
    padding: var(--space-xs) var(--space-sm);
    background: rgba(0,0,0,0.5);
    color: white;
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    pointer-events: none;
}

/* 图片对比模式样式 */
.lightbox-compare {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    background: white;
}
.lightbox-compare img {
    max-width: 45vw;
}

/* 缩略图导航条 */
.lightbox-thumbs {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--space-md);
    display: flex;
    gap: var(--space-sm);
    justify-content: center;
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
    overflow-x: auto;
}
.lightbox-thumb {
    width: 60px;
    height: 45px;
    border-radius: var(--radius-sm);
    opacity: 0.5;
    cursor: pointer;
    transition: opacity 0.2s;
}
.lightbox-thumb.active,
.lightbox-thumb:hover {
    opacity: 1;
}
```

---

### `Section 20` — Back-to-Top 返回顶部

```css
.back-to-top {
    position: fixed;
    right: var(--space-lg);
    bottom: calc(var(--space-xl) + 60px); /* 在工具栏上方 */
    width: 44px;
    height: 44px;
    border-radius: var(--radius-full);
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    border: 1px solid var(--glass-border);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transform: translateY(20px) scale(0.9);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 99;
}

.back-to-top.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
}

/* 进度环 SVG */
.back-to-top svg {
    position: absolute;
    inset: 0;
    transform: rotate(-90deg);
}
.back-to-top circle {
    fill: none;
    stroke-width: 2;
}
.back-to-top .progress-track {
    stroke: var(--bg-secondary);
}
.back-to-top .progress-fill {
    stroke: var(--accent);
    stroke-dasharray: 126; /* 2 * PI * 20 */
    stroke-dashoffset: 126;
    transition: stroke-dashoffset 0.1s;
}
```

**修改方式**：
```css
/* 添加百分比显示 */
.back-to-top::after {
    content: attr(data-percent);
    position: absolute;
    font-size: 0.625rem;
    font-weight: 600;
    color: var(--accent);
}

/* 改为长条形（底部固定） */
.back-to-top-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--accent);
    transform-origin: left;
    transform: scaleX(var(--scroll-progress));
}

/* 点击时的火箭动画 */
.back-to-top.launching {
    animation: rocket-launch 0.6s ease-out forwards;
}
@keyframes rocket-launch {
    0% { transform: translateY(0); }
    50% { transform: translateY(-20px) scale(1.2); }
    100% { transform: translateY(0) scale(1); }
}
```

---

### `Section 21` — Sakura Canvas / Theme Ripple 樱花画布与主题涟漪

```css
/* 樱花画布容器 */
.sakura-container {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1; /* 在内容下方 */
}

/* 主题切换涟漪 */
.theme-ripple {
    position: fixed;
    border-radius: 50%;
    background: var(--ripple-color);
    pointer-events: none;
    z-index: 9998;
    animation: ripple-expand 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes ripple-expand {
    from {
        width: 0;
        height: 0;
        opacity: 0.5;
    }
    to {
        width: var(--ripple-size);
        height: var(--ripple-size);
        opacity: 0;
    }
}

/* 各主题涟漪色 */
[data-theme="sakura"] { --ripple-color: #f8c3cd; }
[data-theme="ocean"] { --ripple-color: #7dd3fc; }
[data-theme="forest"] { --ripple-color: #86efac; }
[data-theme="stardust"] { --ripple-color: #c4b5fd; }
```

**修改方式**：
```css
/* 添加鼠标轨迹拖尾 */
.cursor-trail {
    position: fixed;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    pointer-events: none;
    opacity: 0.6;
    animation: trail-fade 1s forwards;
}
@keyframes trail-fade {
    to {
        opacity: 0;
        transform: scale(0);
    }
}

/* 节日特效层 */
.festival-overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 2;
}
/* 春节：红色粒子 */
/* 圣诞：雪花 */
/* 万圣节：蝙蝠剪影 */
```

---

### `Section 22` — Uptime 运行时间

```css
.uptime-display {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 0.875rem;
    color: var(--text-secondary);
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
}

.uptime-display::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* 不同状态 */
.uptime-display.warning::before {
    background: #f59e0b;
}
.uptime-display.error::before {
    background: #ef4444;
    animation: none;
}
```

**修改方式**：
```css
/* 添加详细展开 */
.uptime-detail {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-xs) var(--space-md);
    font-size: 0.75rem;
}
.uptime-detail dt {
    color: var(--text-secondary);
}
.uptime-detail dd {
    color: var(--text-primary);
    font-family: var(--font-mono);
}

/* 服务器状态网格 */
.server-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--space-md);
}
.server-card {
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    background: var(--bg-secondary);
}
.server-card .metric {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--accent);
}
```

---

### `Section 23` — Timeline / Archive 时间线/归档

```css
.timeline {
    position: relative;
    padding-left: var(--space-xl);
}

.timeline::before {
    content: '';
    position: absolute;
    left: 7px; /* 圆点中心对齐 */
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(
        to bottom,
        var(--accent),
        var(--accent-alpha)
    );
}

.timeline-item {
    position: relative;
    padding-bottom: var(--space-xl);
}

.timeline-dot {
    position: absolute;
    left: calc(var(--space-xl) * -1 + 3px);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--bg-primary);
    border: 2px solid var(--accent);
    transition: all 0.2s;
}

.timeline-item:hover .timeline-dot {
    background: var(--accent);
    transform: scale(1.2);
}

.timeline-date {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: var(--space-xs);
}

.timeline-content {
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    background: var(--bg-secondary);
    transition: all 0.2s;
}

.timeline-item:hover .timeline-content {
    background: var(--bg-primary);
    box-shadow: var(--shadow-md);
}

/* 年份标记 */
.timeline-year {
    position: sticky;
    top: var(--space-lg);
    z-index: 10;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--accent);
    background: var(--bg-primary);
    padding: var(--space-sm) 0;
    margin-left: calc(var(--space-xl) * -1);
}
```

**修改方式**：
```css
/* 添加文章类型图标 */
.timeline-type {
    position: absolute;
    right: var(--space-md);
    top: var(--space-md);
    width: 24px;
    height: 24px;
    opacity: 0.5;
}
.timeline-type-article::before { content: '📝'; }
.timeline-type-photo::before { content: '📷'; }
.timeline-type-video::before { content: '🎬'; }

/* 热力图式归档（GitHub 风格） */
.archive-heatmap {
    display: grid;
    grid-template-columns: repeat(53, 1fr); /* 53周 */
    gap: 3px;
}
.heatmap-cell {
    aspect-ratio: 1;
    border-radius: 2px;
    background: var(--bg-secondary);
}
.heatmap-cell[data-level="1"] { background: var(--accent-alpha); }
.heatmap-cell[data-level="2"] { background: var(--accent-light); }
.heatmap-cell[data-level="3"] { background: var(--accent); }
.heatmap-cell[data-level="4"] { background: var(--accent-dark); }
```

---

### `Section 24` — Homepage Bottom Gallery Banner 首页底部画廊横幅

```css
.gallery-banner {
    position: relative;
    padding: var(--space-2xl) 0;
    overflow: hidden;
}

.gallery-track {
    display: flex;
    gap: var(--space-md);
    animation: gallery-scroll 30s linear infinite;
}

.gallery-track:hover {
    animation-play-state: paused;
}

@keyframes gallery-scroll {
    from { transform: translateX(0); }
    to { transform: translateX(calc(-50% - var(--space-md) / 2)); }
    /* 复制一份实现无缝循环 */
}

.gallery-item {
    flex-shrink: 0;
    width: 280px;
    height: 200px;
    border-radius: var(--radius-lg);
    overflow: hidden;
    position: relative;
}

.gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s;
}

.gallery-item:hover img {
    transform: scale(1.05);
}

.gallery-item-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(transparent 50%, rgba(0,0,0,0.7));
    opacity: 0;
    transition: opacity 0.3s;
    display: flex;
    align-items: flex-end;
    padding: var(--space-md);
    color: white;
}

.gallery-item:hover .gallery-item-overlay {
    opacity: 1;
}
```

**修改方式**：
```css
/* 改为瀑布流 */
.gallery-masonry {
    columns: 3;
    column-gap: var(--space-md);
}
.gallery-masonry .gallery-item {
    break-inside: avoid;
    margin-bottom: var(--space-md);
    height: auto;
}

/* 添加 lightbox 快捷入口 */
.gallery-item::after {
    content: '🔍';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    width: 40px;
    height: 40px;
    background: rgba(255,255,255,0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.gallery-item:hover::after {
    transform: translate(-50%, -50%) scale(1);
}

/* 全屏沉浸式画廊 */
.gallery-immersive {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: black;
    display: grid;
    place-items: center;
}
.gallery-immersive img {
    max-width: 100vw;
    max-height: 100vh;
}
```

---

### `Section 25` — Search Overlay 搜索遮罩层

```css
.search-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    z-index: 200;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s;
}

.search-overlay.active {
    opacity: 1;
    visibility: visible;
}

.search-container {
    width: min(640px, 90vw);
    background: var(--bg-primary);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg), 0 25px 50px -12px rgba(0,0,0,0.25);
    overflow: hidden;
    transform: translateY(-20px) scale(0.95);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.search-overlay.active .search-container {
    transform: translateY(0) scale(1);
}

.search-input-wrapper {
    display: flex;
    align-items: center;
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--border-color);
}

.search-input {
    flex: 1;
    border: none;
    background: none;
    font-size: 1.125rem;
    color: var(--text-primary);
    outline: none;
}

.search-input::placeholder {
    color: var(--text-secondary);
}

.search-shortcut-hint {
    padding: var(--space-xs) var(--space-sm);
    background: var(--bg-secondary);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    color: var(--text-secondary);
    font-family: var(--font-mono);
}

.search-results {
    max-height: 60vh;
    overflow-y: auto;
}

.search-result-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    cursor: pointer;
    transition: background 0.15s;
}

.search-result-item:hover,
.search-result-item.selected {
    background: var(--bg-secondary);
}

.search-result-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background: var(--accent-alpha);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.search-result-content {
    flex: 1;
    min-width: 0;
}

.search-result-title {
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: var(--space-xs);
}

.search-result-excerpt {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.search-result-meta {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    margin-top: var(--space-xs);
}

/* 高亮标记 */
.search-highlight {
    background: var(--accent-alpha);
    color: var(--accent);
    border-radius: 2px;
    padding: 0 2px;
}
```

**修改方式**：
```css
/* 添加分类筛选标签 */
.search-filters {
    display: flex;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-lg);
    border-bottom: 1px solid var(--border-color);
    overflow-x: auto;
}

.search-filter {
    padding: var(--space-xs) var(--space-md);
    border-radius: var(--radius-full);
    font-size: 0.875rem;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s;
}

.search-filter.active {
    background: var(--accent);
    color: white;
}

/* 空状态 */
.search-empty {
    text-align: center;
    padding: var(--space-2xl);
}
.search-empty-icon {
    font-size: 3rem;
    margin-bottom: var(--space-md);
}

/* 搜索历史 */
.search-history {
    padding: var(--space-sm) var(--space-lg);
}
.search-history-tag {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background: var(--bg-secondary);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    margin: var(--space-xs);
    cursor: pointer;
}
.search-history-tag:hover {
    background: var(--accent-alpha);
}
```

---

### `Section 26` — Responsive (Mobile) 响应式设计

```css
/* 断点系统 */
:root {
    --bp-sm: 640px;
    --bp-md: 768px;
    --bp-lg: 1024px;
    --bp-xl: 1280px;
    --bp-2xl: 1536px;
}

/* 移动端优先，逐步增强 */

/* 小屏基础 */
.container {
    width: 100%;
    padding: 0 var(--space-md);
}

/* 中屏 */
@media (min-width: 768px) {
    .container {
        max-width: 720px;
        margin: 0 auto;
    }
    .card-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* 大屏 */
@media (min-width: 1024px) {
    .container {
        max-width: 960px;
    }
    .card-grid {
        grid-template-columns: repeat(3, 1fr);
    }
    .layout-with-sidebar {
        display: grid;
        grid-template-columns: 1fr 280px;
        gap: var(--space-xl);
    }
}

/* 超大屏 */
@media (min-width: 1280px) {
    .container {
        max-width: 1200px;
    }
}

/* 横屏优化 */
@media (max-height: 500px) and (orientation: landscape) {
    .hero-banner {
        min-height: auto;
        padding: var(--space-xl) 0;
    }
}

/* 深色模式偏好（系统级） */
@media (prefers-color-scheme: dark) {
    :root:not([data-theme="sakura"]):not([data-theme="ocean"]):not([data-theme="forest"]) {
        /* 默认深色 fallback */
    }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
    .sakura-container,
    .cursor-trail {
        display: none !important;
    }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
    :root {
        --text-primary: #000;
        --text-secondary: #333;
        --accent: #0066cc;
    }
}

/* 打印样式 */
@media print {
    .navbar,
    .floating-toolbar,
    .back-to-top,
    .sakura-container,
    .comments {
        display: none !important;
    }
    .article-content {
        font-size: 12pt;
        line-height: 1.6;
    }
    a {
        text-decoration: underline;
        color: #000;
    }
    a::after {
        content: " (" attr(href) ")";
        font-size: 0.8em;
        color: #666;
    }
}
```

**修改方式**：
```css
/* 添加容器查询（现代浏览器） */
@container (min-width: 400px) {
    .card {
        display: grid;
        grid-template-columns: 120px 1fr;
    }
    .card-image {
        height: 100%;
    }
}

/* 折叠屏适配 */
@media (horizontal-viewport-segments: 2) {
    .layout-with-sidebar {
        grid-template-columns: env(viewport-segment-width 0 0) 1fr;
    }
}

/* 鼠标/触控检测 */
@media (hover: hover) and (pointer: fine) {
    /* 桌面端：悬停效果 */
    .card:hover {
        transform: translateY(-4px);
    }
}
@media (hover: none) and (pointer: coarse) {
    /* 移动端：点击反馈 */
    .card:active {
        transform: scale(0.98);
    }
    /* 增大点击区域 */
    .button {
        min-height: 44px;
        min-width: 44px;
    }
}
```