# Luliy Blog 增强系统完全指南
> `enhance.js v10` + `enhance.css v9` — 功能说明 · DIY 方法 · 运行原理

## 1. 系统总览

整个增强系统由两个文件构成，以**模块化方式**挂载在一个 IIFE（立即执行函数）里，避免污染全局命名空间：

```
enhance.js   →  行为层（DOM 构建 / 事件 / 动画 / 数据读取）
enhance.css  →  样式层（主题变量 / 布局 / 过渡动画）
```

**启动流程：**

```
页面加载开始
  ↓
① initLocalStorage()        — 补全缺失的 localStorage 默认值
② FOUC 防闪烁块             — 立即读取保存的主题/背景，写入 body
③ initSakura()              — 若已开启，尽早启动 canvas（避免延迟）
  ↓ DOMContentLoaded
④ ready() 回调              — 初始化所有模块
⑤ 页面类型判断              — isPost → initPost()  /  isIndex → initIndex()
```

所有滚动监听统一经过 **`onScrollRAF`** 调度器，合并到单个 `requestAnimationFrame` 帧里执行，避免多个模块各自注册 scroll 事件造成卡顿。

---

## 2. 快速 DIY：核心配置项 `LULIY_OPTS`

`enhance.js` 顶部的 `LULIY_OPTS` 对象是**唯一需要修改**的主配置区。

```js
var LULIY_OPTS = {
  // ① 首页底部画廊：只放 1 张 = 全幅 Banner；放 2 张以上 = 网格
  galleryImages: ['https://你的图片链接.jpg'],
  galleryText: '我将无限进步',         // 画廊上的文字

  // ② 首页全屏 Hero
  heroImage: 'https://你的背景图.webp', // 背景大图
  heroTitle: 'Luliy',                  // 大标题
  heroSubtitle: '我将无限进步',         // 副标题
  heroHint: '下滑进入 ↓',              // 向下提示文字

  // ③ 音乐播放列表（跨页面持续播放）
  musicTracks: [
    { name: '曲目名称', src: 'https://你的mp3链接.mp3' }
    // 可添加多首
  ],

  // ④ 收藏夹密码（SHA-256 哈希值，明文密码不出现在代码里）
  favoritesHash: 'SHA256哈希值',
  favoritesPathMatch: /favorites/i,    // 匹配收藏夹页面 URL

  homeUrl: '/'
};
```

**如何生成 SHA-256 密码哈希？**
在浏览器控制台运行：
```js
crypto.subtle.digest('SHA-256', new TextEncoder().encode('你的密码'))
  .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
```

---

## 3. 持久化开关：localStorage 键值表

这些键值由访客操作自动写入，也可以在控制台手动设置来调试：

| 键名 | 默认值 | 含义 |
|------|--------|------|
| `luliy-sfx` | `'1'` | 音效开关（`'0'` = 关闭） |
| `luliy-sakura` | `'1'` | 樱花/四季粒子开关 |
| `luliy-sink` | `'default'` | 当前主题名称 |
| `luliy-bg` | `''` | 自定义背景图 URL（空 = 默认背景） |
| `luliy-fontsize` | `'18'` | 文章字号（px），范围 14–24 |
| `luliy-sans` | `'0'` | 字体：`'0'`=默认楷体 / `'1'`=黑体 / `'2'`=苍耳今楷 |
| `luliy-music` | `''` | 用户自添加的曲目（JSON 数组） |
| `luliy-cardview` | `'grid'` | 首页卡片视图：`grid` / `list` / `timeline` |
| `luliy-trail` | `'0'` | 鼠标拖尾开关 |
| `luliy-firefly` | `'0'` | 萤火虫开关 |
| `luliy-focus` | `'0'` | 专注阅读模式 |
| `luliy-reduce` | `'0'` | 强制减少动效（覆盖系统设置） |

---

## 4. 模块逐一说明

---

### M00 首页 Hero 全屏封面

**功能：** 访客打开首页时，先看到占满屏幕的大图封面，滚动后进入内容区。导航栏在 Hero 范围内完全隐藏，滚出后淡入显示。

**运行原理：**
1. `isIndexPage()` 检测当前是首页
2. 用 JS 动态创建 `<section id="luliy-hero">` 并插入 `body` 最前面
3. CSS 将其设置为 `height: 100vh; position: relative`
4. 通过 `onScrollRAF` 监听滚动，实现：
   - 内容文字：`translateY + opacity` 视差淡出
   - 导航栏：滚动量 < 85vh 时 `opacity:0; pointer-events:none`

**DIY 方法：**
- 修改 `LULIY_OPTS.heroImage/heroTitle/heroSubtitle/heroHint`
- CSS 中 `#luliy-hero` 调整 `background-position` 控制焦点
- 修改视差系数：`p * 60`（位移量）和 `p * 1.4`（淡出速度）

---

### M01 localStorage 初始化

**功能：** 首次访问时为所有持久化选项写入默认值，防止后续读取返回 `null`。

**运行原理：** 遍历默认值字典，用 `localStorage.getItem(k) === null` 判断是否已设置，未设置则写入默认值。**只在缺失时写入，不覆盖已有值。**

---

### M02 阅读进度条

**功能：** 页面顶部一条细线，随页面滚动从 0% 增长到 100%。

**运行原理：**
```
滚动百分比 = scrollY / (scrollHeight - clientHeight) × 100%
```
进度条宽度通过 `bar.style.width` 实时更新。颜色跟随当前主题的 `--accent` CSS 变量。

**DIY 方法：** CSS 中 `#luliy-progress-bar` 修改高度、颜色、渐变。

---

### M03 动态标题

**功能：** 切换到其他标签页时，标题变为「👀 别走啊，我还在进步！」；切回来时显示「✨ 欢迎回来！」，2 秒后恢复原标题。

**运行原理：** 监听 `document.visibilitychange` 事件，修改 `document.title`。

**DIY 方法：** 修改代码中两处 Unicode 字符串：
- 离开时：`'\uD83D\uDC40 \u522b\u8d70\u554a...'`
- 回来时：`'\u2728 \u6b22\u8fce\u56de\u6765\uff01'`

---

### M04 建站运行时计时器

**功能：** 页面底部显示「🌱 本站已陪伴你无限进步：X天 X小时 X分 X秒」，秒数实时跳动。

**运行原理：**
- 读取硬编码的建站时间 `new Date('2026/05/30 00:00:00')`
- `setInterval` 每秒计算差值并更新 DOM

**DIY 方法：** 修改建站日期：
```js
var start = new Date('2026/05/30 00:00:00').getTime();
// 改为你的建站日期
```
修改显示文字中的 Unicode 字符串。

---

### M05 暗色模式切换涟漪

**功能：** 点击日/夜切换按钮时，从点击位置向四周扩散一个圆形涟漪遮罩，完成模式切换的视觉过渡。

**运行原理：**
1. 监听点击事件，识别含 `Moon/Sun` SVG 或相关 title 的按钮
2. 计算点击坐标到最远角落的距离作为最终半径
3. 动态创建一个 `position:fixed` 的圆形 div，用 CSS `transform: scale(0→1)` + `opacity: 1→0` 完成扩散动画
4. 700ms 后自动移除

**全局暴露：** `window._luliyThemeRipple(x, y)` — 可从任何地方调用触发涟漪。

---

### M07 Web Audio 音效

**功能：** 点击、切换主题、科技感操作时播放轻微提示音。完全由浏览器 Web Audio API 合成，无需加载音频文件。

**三种音效：**
| 类型 | 触发场景 | 波形 |
|------|----------|------|
| `click` | 普通点击 | 方波，900Hz→400Hz，60ms |
| `sci` | 科技操作（全屏等） | 正弦波，440→880→660Hz，250ms |
| `theme` | 主题切换 | 三音和弦（C-E-G），依次延迟 |

**DIY 方法：** 修改 `playSfx` 函数内的频率值和时长。关闭音效：`localStorage.setItem('luliy-sfx','0')`。

---

### M08 点击粒子火花

**功能：** 每次点击屏幕，从点击位置爆出 6 个彩色小圆点向四周飞散后淡出。

**运行原理：**
- 监听 `document.click`
- 每个粒子是一个 `position:fixed` 的 7×7px 圆形 div
- 用 CSS `transform: translate + rotate` + `transition` 完成飞散动画
- 颜色从主题调色板随机选取（`--card-c1` 到 `--card-c4`）
- 700ms 后自动移除

---

### M09 导航栏重建（头像 + 时钟）

**功能：** 将 Gmeek 默认导航栏重构为：左上时钟 — 左图标区 — 中央头像+博客名 — 右图标区 的布局。

**运行原理：**
1. 隐藏原有 header 子元素
2. 创建 `#luliy-nav-rebuilt` shell，包含四个区域
3. 从原 `.title-right` 中提取导航链接，按数量对半分到左右图标区
4. 日/夜切换按钮通过代理点击原始按钮保持 Gmeek 功能
5. 时钟每秒更新 `HH:MM:SS`

**DIY 方法：**
- 头像图片：修改 `avatarImg.src` 中的 URL
- 博客名：修改 `blogName.textContent = 'Luliy'`
- 头像链接目标：修改 `avatarLink.href = '/about'`

---

### M10 Hero 卷轴分隔条

**功能：** 首页内容区顶部的一条可折叠横幅条，随滚动向上收起。

**运行原理：** 监听滚动，用 `translateY` 和 `opacity` 实现向上折叠效果，折叠距离基于自身高度动态计算。

---

### M11 标签页搜索栏

**功能：** 在 `/tag.html` 页面顶部插入搜索框，实时筛选显示的标签，并显示「匹配数/总数」。

**运行原理：**
- 检测 URL 路径是否匹配 `/tag\.html/`
- 等待 `#taglabel` 元素出现（Gmeek 异步渲染）
- 监听 `input` 事件，遍历所有 `.Label` 元素，用 `style.display` 控制显隐
- 用 `MutationObserver` 监听标签列表变化，保持筛选实时有效

---

### M12 图片灯箱

**功能：** 点击文章中的图片，在全屏遮罩中放大显示，点击背景或按 Esc 关闭。

**运行原理：**
- 监听 `#postBody` 内 `img` 的点击事件
- 打开时：向灯箱 `<img>` 写入 src，添加 `.is-open` 类（CSS 控制显示），锁定 body 滚动
- 关闭时：移除类，300ms 后清除 src（等待淡出动画）

**全局暴露：** `window._luliyLightboxOpen(src, alt)` — 可手动触发打开灯箱。

---

### M13 悬浮工具栏 + 统一控制面板

**功能：** 右侧悬浮的控制按钮，点击展开面板，包含：

| 区域 | 内容 |
|------|------|
| 主题预览 | Day/Night 卡片，点击切换明暗模式 |
| 六个主题 | 默认/樱花少女/你的名字/太空旅行/日落黄昏/极简黑白 |
| 效果开关 | 樱花效果、背景图更换 |
| 阅读设置 | 字号调节（A- / A+）、字体切换（仅文章页） |
| 音乐播放器 | 播放/暂停/上下首/添加曲目/播放列表 |
| 更多功能 | 鼠标拖尾、萤火虫、专注模式（文章页）、减少动效 |

**运行原理（主题系统）：**
1. `SINKS` 数组定义 6 个主题的 id、调色板、描述
2. `applySink(id)` 执行：设置 `body[data-luliy-theme]`，并更新 4 个 CSS 变量 `--card-c1/c2/c3/c4`
3. CSS 中 `[data-luliy-theme="sakura"]` 等选择器覆盖对应样式

**运行原理（音乐播放器）：**
- 使用 `<audio>` 元素，跨页面通过 `localStorage` 持久化 `{trackIndex, position, isPlaying}`
- 页面卸载时保存播放位置，下一页加载时恢复（受浏览器自动播放策略限制）
- 用户可通过「＋」按钮输入 URL 添加曲目，存储在 `luliy-music` 键

**DIY 方法（添加主题）：**
在 `SINKS` 数组末尾添加新对象：
```js
{
  id: 'ocean',
  label: '深海蓝',
  dot: '#006994',
  theme: 'ocean',
  cardPalette: ['#006994', '#0099cc', '#00ccff', '#80e5ff'],
  desc: '深邃海洋，静谧蓝调'
}
```
然后在 CSS 中添加对应的 `[data-luliy-theme="ocean"]` 样式块。

---

### M14 首页卡片重建（三视图 + 骨架屏）

**功能：**
- 从 `/postList.json` 读取文章数据并重建卡片
- 支持三种视图切换：**网格**（多列卡片）、**列表**（单列紧凑）、**时间轴**（居中竖线）
- 按年份自动插入年份分隔线
- 置顶文章标注 📌，多级置顶（`pinned`/`pinned-2`/`pinned-3`）
- 加载期间显示**骨架屏**占位，避免布局跳动

**运行原理：**
1. 调用 `fetchPosts()` 获取 postList.json，解析为统一格式的文章对象数组
2. 排序：先按 pinLevel 降序，再按日期降序
3. 遍历数组，检测年份变化插入 `.luliy-card-yeardiv`
4. `applyCardView()` 在 `.luliy-card-grid` 上切换 `luliy-card-list` / `luliy-card-timeline` 类

**置顶标签命名规则：**
- `pinned` = 一级置顶（最高）
- `pinned-2` = 二级置顶
- `pinned-3` = 三级置顶（数字越大优先级越低）

---

### M15 macOS 风格代码块

**功能：** 为每个 `<pre><code>` 块添加 macOS 风格的三色按钮装饰条，并显示语言标签和行号。

| 按钮颜色 | 功能 |
|----------|------|
| 🔴 红色 | 复制代码（HTTPS 下用 Clipboard API，否则降级 execCommand） |
| 🟡 黄色 | 折叠/展开代码块 |
| 🟢 绿色 | 全屏阅读（双击代码块也可触发） |

**运行原理：**
- 遍历 `#postBody` 内所有 `<pre>` 元素，跳过已处理的（检查 `.mac-strip` 是否存在）
- 行号：统计 `\n` 数量，用 `<span class="luliy-lineno">` 生成行号列，CSS `pre-wrap` 保持对齐
- 全局只注册一个 Escape 键监听（`_codeEscBound` 防重复）
- `MutationObserver` 监听 postBody 变化，动态代码块也能被处理

---

### M16 樱花飘落 + 流星（四季自适应）

**功能：** 全屏 Canvas 上持续飘落的粒子，颜色和行为根据当前月份自动变化：

| 季节 | 月份 | 粒子颜色 | 特点 |
|------|------|----------|------|
| 春 | 3–5月 | 粉色系 | 轻柔，微风漂移 |
| 夏 | 6–8月 | 绿色系 | 缓慢，近乎垂直 |
| 秋 | 9–11月 | 橙红系 | 较快，风大 |
| 冬 | 12–2月 | 白蓝系 | 飘轻，稀疏 |

**流星：** 随机在顶部生成，对角线快速滑落后淡出（仅夜晚模式触发）

**运行原理：**
- 使用 `requestAnimationFrame` 循环，每帧 `clearRect` 后重绘所有粒子
- 每个粒子有 `x, y, vx, vy, size, opacity, rotation, rotSpeed` 属性
- 超出屏幕边界时随机重置到顶部
- Canvas `pointer-events:none` 不影响页面交互

**DIY 方法：** 修改 `SEASON_CONFIG` 中各季节的 `count`（数量）、`speedY`（下落速度范围）、`wind`（横漂强度）、`opacity`（透明度范围）。

---

### M17 文章 TOC 滚动高亮 + 阅读进度环

**功能：**
- TOC（目录）随滚动自动高亮当前所在章节
- 顶部进度条 + 右下角返回顶部按钮（内含 SVG 圆形进度环）
- TOC 顶部注入「目录」标签和「↑ 回顶」按钮

**运行原理：**
1. **TOC 迁移**：将 `articletoc.js` 插入到 `#postBody` 内的 TOC 元素移动到 `document.body` 直属，避免被 `backdrop-filter` 或 `transform` 的父元素创建新层叠上下文，确保 `position:fixed` 正确工作
2. **ID 生成**：对没有 id 的标题自动生成 slug（中文保留，英文小写，空格转连字符）
3. **滚动高亮**：`getBoundingClientRect().top <= 110` 判断标题是否已滚过视口，取最后一个符合条件的作为当前章节
4. **进度环**：SVG `stroke-dashoffset` 随滚动百分比变化

---

### M18 移动端汉堡菜单 + 滑动翻页

**功能：**
- 移动端顶部右侧三横线汉堡按钮，点击展开导航下拉菜单
- 下拉菜单包含：音效开关、主题选择、粒子开关、导航链接
- 文章页支持**左右滑动**切换上一篇/下一篇

**运行原理（汉堡菜单）：**
- 从 `.title-right` 提取原始导航链接，重新填充到下拉容器
- 点击菜单外区域关闭

**运行原理（滑动翻页）：**
- 监听 `touchstart` 记录起始坐标
- `touchend` 时计算 `dx/dy`，要求 `|dx| > 120px` 且水平方向占主导（比例 > 3:1）
- 匹配 `.luliy-prevnext` 中对应方向的链接，添加滑动动画类后跳转

---

### M19 收藏夹密码门

**功能：** 访问 `/favorites` 路径时显示密码输入框，通过验证后逐步揭示内容（渐进式模糊→清晰）。

**运行原理：**
1. URL 匹配 `LULIY_OPTS.favoritesPathMatch`（默认 `/favorites/i`）
2. 显示密码输入框覆盖层
3. 用户输入后，将密码进行 SHA-256 哈希，与 `LULIY_OPTS.favoritesHash` 比对
4. 验证通过：结果存入 `sessionStorage`（当次会话有效）
5. 页面内容先完全模糊，验证后逐渐清晰（CSS `filter:blur` 过渡）

**更改密码：** 重新生成新密码的 SHA-256 哈希值，替换 `favoritesHash`。

---

### M20 首页底部图片展示区

**功能：** 首页文章列表下方的图片展示区。放 1 张图片 = 全幅 Banner；放 2 张以上 = 响应式网格。

**DIY 方法：** 修改 `LULIY_OPTS.galleryImages` 数组和 `galleryText`。

---

### M21 文章页初始化（系列导航 + 滚动记忆）

这个模块在 `isPost = true` 时触发，包含三个子功能：

**系列导航（M21b）：**
- 读取 postList.json，找到当前文章共享标签数最多的同标签文章组（≥2篇）
- 在文章顶部插入「📚 系列：标签名 (当前/总数)」面板，列出系列全部文章

**滚动记忆（M21c）：**
- 离开文章时将滚动百分比保存到 `sessionStorage`
- 重新访问时，若上次读到 5%–95% 位置，底部弹出「上次读到 XX%，继续阅读 ↓」提示
- 点击提示自动滚到对应位置，6 秒后自动消失

**外链悬停预览（M16b）：**
- 悬停文章内的外部链接时，在鼠标旁显示小卡片，包含：网站 favicon + 域名 + 路径

---

### M22 归档页（时间轴 + 日历）

**功能：** `/archive` 页面提供两种视图：

| 视图 | 样式 |
|------|------|
| 时间轴 | 居中竖线，左右交替排列文章节点 |
| 日历 | 按月份排列的日历格，发文日期有高亮 |

顶部 Tab 切换，选择持久化到 `localStorage`。

**运行原理：**
- 调用 `fetchPosts()` 获取所有文章
- 时间轴：按年/月分组，DOM 构建为 `luliy-timeline-item` 节点
- 日历：生成指定年月的完整日历格，有文章的日期渲染为可点击节点

---

### M23 标签云页面

**功能：** 在 `/tag.html` 顶部生成标签云，标签字号根据文章数量动态缩放（13px–35px），颜色来自 postList.json 的 `labelColorDict`。

**运行原理：**
- 统计各标签在所有文章中的出现频次
- 线性插值映射到字号范围：`13 + ratio * 22`
- 点击标签跳转到 `/tag.html#标签名` 触发 Gmeek 原生筛选

---

### M24 文章内搜索浮层

**功能：** 文章页按 `Ctrl/Cmd+F`（或右下角🔍按钮）弹出搜索栏，实时高亮匹配文字，`↑↓` 按钮逐个跳转，`Esc` 关闭。

**运行原理：**
1. **劫持** 浏览器原生 `Ctrl+F`（`preventDefault`）
2. `TreeWalker` 遍历 `#postBody` 中的文本节点（自动跳过 code/pre/script/katex 等）
3. 找到匹配项后，用 `<mark class="luliy-search-hit">` 包裹
4. 当前聚焦项额外添加 `.is-current` 类（CSS 高亮色不同）
5. 关闭时通过 `parentNode.replaceChild` 还原文本节点，`normalize()` 合并相邻文本节点

---

### M25 鼠标拖尾 + 萤火虫

**鼠标拖尾：**
- 每 60ms 在鼠标位置创建一个 emoji 元素（🌸/✧/☀/☁/✨，随主题变化）
- CSS `animation` 使其旋转淡出，1.1 秒后移除
- 触摸设备和减少动效模式下自动禁用

**萤火虫：**
- 暗色模式 或 太空主题 下，`luliy-firefly=1` 时激活
- Canvas 上 N 个（最多 26 个）发光粒子自由漂浮
- 在鼠标 220px 范围内受到温和吸引力
- 使用径向渐变绘制发光效果，亮度随 sin 函数脉动

**减少动效安全网：**
- 系统设置 `prefers-reduced-motion: reduce` 或手动设置 `luliy-reduce=1` 时，自动停止拖尾和萤火虫，并为整个 body 添加 `.luliy-reduce-motion` 类（CSS 中该类选择器关闭所有过渡）

---

### M26 页面切换淡入淡出

**功能：** 博客内部页面之间跳转时，使用浏览器原生 **View Transitions API** 实现平滑淡入淡出，而非硬跳转。

**运行原理：**
1. 拦截所有同源内部链接的点击事件
2. 排除：新标签、下载链接、纯 hash 跳转、`Ctrl/Cmd/Shift+点击`
3. 调用 `document.startViewTransition(() => { location.href = dest })`
4. 安全降级：不支持的浏览器直接执行 `location.href`；1 秒超时保底跳转

---

## 5. CSS 主题系统

`enhance.css` 通过 CSS 变量 + `[data-luliy-theme]` 属性选择器实现 6 套主题：

```css
/* 每个主题定义自己的颜色组 */
[data-luliy-theme="sakura"] {
  --accent: #e05c8a;
  --accent-light: #f9a8c9;
  --card-border: rgba(224, 92, 138, 0.18);
  /* ... */
}
```

同时 JS 更新 4 个卡片渐变变量：
```css
--card-c1 / --card-c2 / --card-c3 / --card-c4
```

卡片渐变写法：
```css
.luliy-card:nth-child(4n+1) { background: linear-gradient(135deg, var(--card-c1), var(--card-c2)); }
```

---

## 6. 性能设计说明

| 技术 | 作用 |
|------|------|
| `onScrollRAF` 调度器 | 所有滚动回调合并到单个 rAF 帧 |
| FOUC 防闪块 | DOMContentLoaded 前恢复主题/背景，避免闪白 |
| `MutationObserver` | 监听 DOM 变化而非轮询 |
| `_codeEscBound` 标志 | 防止多个代码块重复注册全局 Escape 监听 |
| Canvas `pointer-events:none` | 樱花/萤火虫 Canvas 不阻止用户点击 |
| 骨架屏 | 数据加载期间先渲染占位 UI，再替换 |
| `sessionStorage` vs `localStorage` | 滚动位置用 session（标签页级别）；偏好设置用 local（长期） |

---

## 7. 常见 DIY 场景速查

**① 换博客头像**
```js
// enhance.js → initHeroCluster() 函数内
avatarImg.src = 'https://你的头像URL.jpg';
```

**② 修改建站时间**
```js
// enhance.js → initUptime() 函数内
var start = new Date('2024/01/01 00:00:00').getTime();
```

**③ 添加新音乐曲目**
```js
// LULIY_OPTS.musicTracks 数组
{ name: '你的曲目名', src: 'https://你的mp3.mp3' }
```

**④ 默认关闭樱花效果**
```js
// enhance.js → initLocalStorage() 的 defs 对象
'luliy-sakura': '0'   // 改为 '0'
```

**⑤ 增加主题**
在 `SINKS` 数组末尾添加对象 + CSS 中添加 `[data-luliy-theme="新主题名"]` 样式块。

**⑥ 修改首页卡片默认视图**
```js
// defs 对象
'luliy-cardview': 'list'   // 'grid' | 'list' | 'timeline'
```

**⑦ 默认开启鼠标拖尾**
```js
// defs 对象
'luliy-trail': '1'
```

**⑧ 调整字号范围**
```js
// applyReadingPrefs() 和 setFs() 函数内
px = Math.min(28, Math.max(12, px));  // 改为 12–28px 范围
```

---

*本指南基于 enhance.js v10 + enhance.css v9 编写，如代码有更新部分细节可能变化。*