> 本文档用中文详细解释 `config.json`、`enhance.css`、`enhance.js` 三个文件的每一处功能、可修改的参数，以及新手如何理解和动手改动。

---

## 📁 三个文件的整体分工

| 文件 | 负责什么 | 改动频率 |
|---|---|---|
| `config.json` | 博客的"控制面板"，所有基础设置在这里 | 最常改 |
| `enhance.css` | 博客的"外观设计师"，控制颜色、字体、布局 | 偶尔改 |
| `enhance.js` | 博客的"功能工程师"，控制所有交互动效 | 较少改 |

---

# 一、config.json 全字段详解

> **新手理解方式：** 把 `config.json` 想象成一张"博客身份证+设置表"，每个字段就是一个填空题。

---

## 1.1 基础信息字段

```json
"title": "Luliy"
```
**作用：** 浏览器标签页显示的名字，也是 SEO 标题。  
**怎么改：** 把 `"Luliy"` 换成你自己的名字即可。

---

```json
"subTitle": "我将无限进步!"
```
**作用：** 副标题（已被 CSS 隐藏不显示，但 SEO 仍会读取）。  
**怎么改：** 写你的 slogan，比如 `"热爱生活，记录每一天"`。

---

```json
"avatarUrl": "https://avatars.githubusercontent.com/u/177055996?..."
```
**作用：** 导航栏头像的图片地址。  
**怎么改：** 换成你自己的头像 URL，格式要是图片直链（.jpg / .png / .webp）。  
**推荐来源：** GitHub 头像链接、图床直链。

---

```json
"displayTitle": "Luliy"
```
**作用：** Gmeek 内部渲染用的显示名，与 `title` 保持一致即可。

---

```json
"homeUrl": "https://luliy.me"
```
**作用：** 博客首页地址，点击 Logo 时跳转的地址。  
**怎么改：** 换成你的域名，比如 `"https://你的名字.github.io"`。

---

```json
"email": "luliy6@qq.com"
```
**作用：** 对外显示的联系邮箱（当前 exlink 已清空，此项为备用）。

---

```json
"startSite": "05/30/2026"
```
**作用：** 博客建站日期，enhance.js 里的"运行天数"计时器从这一天开始算。  
**格式：** `月/日/年`，比如 `"01/01/2025"`。  
**⚠️ 重要：** 改错了会导致计时显示负数，请填你真实建站的日期。

---

```json
"onePageListNum": 12
```
**作用：** 首页每页显示几篇文章卡片。  
**可选值：** 6、8、10、12、15 均可，数字越大页面越长。

---

## 1.2 导航页面字段

```json
"singlePage": ["about", "gallery", "book", "favorites"]
```
**作用：** 这里列出的每一项，Gmeek 会在 GitHub Issues 里找同名标签的文章，生成对应的独立页面。  

| 页面名 | 访问方式 | 说明 |
|---|---|---|
| `about` | 点击头像到达，**不显示在导航栏** | enhance.js 的 hero cluster 把头像链接设为 `/about` |
| `gallery` | 导航栏显示 | 相册页 |
| `book` | 导航栏显示 | 书单/读书笔记页 |
| `favorites` | 导航栏显示 | 收藏夹页（已移除加密） |

**怎么新增：** 先在 GitHub Issues 里建一个打了对应标签的文章，再把标签名加入 `singlePage` 数组。  
**注意：** 标签名必须是英文小写，和 GitHub Issue 的 Label 完全一致。

---

## 1.3 图标与外链字段

```json
"iconList": { ... }
```
**作用：** 定义各种 SVG 图标的路径数据（`d` 属性）。这些图标是 16×16 的 GitHub 风格 SVG。  
**什么时候用：** 当 `exlink` 里有某个 key，Gmeek 就会从 `iconList` 里找同名的图标来渲染。  
**当前状态：** `exlink` 已清空为 `{}`，所以 `iconList` 里的图标目前不直接显示在导航栏，但保留备用。

```json
"exlink": {}
```
**作用：** 导航栏右侧的外链图标按钮（原本有 GitHub / 邮件 / RSS / Tags）。  
**当前：** 已清空为 `{}`，因为搜索按钮由 `enhance.js` 自动注入，避免重复。  
**如果要手动加回 GitHub 图标：**
```json
"exlink": {
  "github": "https://github.com/你的用户名"
}
```
这样导航栏就会出现 GitHub 图标链接。

---

## 1.4 主题与外观字段

```json
"themeMode": "manual"
```
**作用：** 主题切换模式。  
- `"manual"` = 用户手动切换日/夜模式（推荐）  
- `"auto"` = 跟随系统自动切换  
- `"dark"` / `"light"` = 强制固定模式

---

```json
"dayTheme": "light",
"nightTheme": "dark_colorblind"
```
**作用：** 指定日间和夜间使用的 Primer 基础主题。  
**可选值（Gmeek 支持）：** `light`、`dark`、`dark_dimmed`、`dark_colorblind`、`light_colorblind`  
**建议：** 夜间用 `dark_colorblind` 颜色对比度更高，对眼睛友好。

---

```json
"yearColorList": ["#bc4c00", "#0969da", "#1f883d", "#A333D0"]
```
**作用：** 首页贡献热力图（如果启用）的颜色列表，从浅到深对应不同活跃度。  
**怎么改：** 直接换成你喜欢的 4 个色值，格式是 `"#十六进制颜色"`.

---

```json
"commentLabelColor": "#006b75"
```
**作用：** 评论区 Label 标签的颜色（GitHub Issues 评论样式）。

---

## 1.5 功能开关字段

```json
"showPostSource": 1
```
**作用：** 是否显示文章底部的"查看源码"链接。`1` = 显示，`0` = 隐藏。

```json
"needComment": 1
```
**作用：** 是否开启评论功能（基于 GitHub Issues）。`1` = 开，`0` = 关。

```json
"rssSplit": "sentence"
```
**作用：** RSS 订阅内容的截断方式。`"sentence"` = 截取第一句，`"paragraph"` = 截取第一段。

```json
"urlMode": "pinyin"
```
**作用：** 文章 URL 的生成规则。`"pinyin"` = 标题转拼音，`"number"` = 用 Issue 编号。

---

## 1.6 头部注入字段（重要！）

```json
"primerCSS": "<link href='https://mirrors.sustech.edu.cn/.../primer.css' rel='stylesheet' />"
```
**作用：** 加载 GitHub Primer 基础样式库（按钮、布局、颜色变量等）。这是 Gmeek 的基础，**不要删除**。  
**镜像说明：** 当前使用南科大 CDN 镜像，国内访问速度快。

---

```json
"allHead": "..."
```
**作用：** 注入到每个页面 `<head>` 里的内容，是整个博客的"插件加载清单"。

**当前加载的内容逐一解释：**

| 加载项 | 作用 | 能否删除 |
|---|---|---|
| KaTeX CSS + JS | 渲染数学公式，如 `$E=mc^2$` | 不写数学可删 |
| articletoc.js | 生成文章目录（TOC） | 可删，删后无目录 |
| GmeekVercount.js | 文章访问量统计 | 可删 |
| Prism CSS + JS | 代码高亮（比 GitHub 默认好看） | 可删，但代码块会失色 |
| Mermaid.js | 渲染流程图 ```` ```mermaid ```` | 不用流程图可删 |
| Chart.js | 渲染图表 ```` ```chart ```` | 不用图表可删 |
| `theme-color` meta | 手机浏览器地址栏颜色 `#8250df` | 可改颜色 |
| `apple-touch-icon` | iPhone 添加到主屏的图标 | 可改 |
| 内联 `<script>` | 初始化 Prism/Mermaid/ServiceWorker | **不要删** |
| jQuery + jQuery UI | live2d 小人依赖库 | 删掉 live2d 时一起删 |
| live2d-widget | 页面左下角的 live2d 小人 | 不喜欢可删这行 |
| `/enhance.css` | **我们的样式文件** | **不要删** |
| `/enhance.js` | **我们的功能文件** | **不要删** |

**删除 live2d 小人的方法：** 删掉 `allHead` 里的这三行：
```
<script src='https://cdn.jsdelivr.net/npm/jquery@3.6.0/...'></script>
<script src='https://cdn.jsdelivr.net/npm/jquery-ui-dist@1.13.2/...'></script>
<script src='https://fastly.jsdelivr.net/gh/stevenjoezhang/live2d-widget@latest/autoload.js'></script>
```

---

```json
"script": "<script>function luliyWaitPost(){...}</script>"
```
**作用：** 文章页专用的"等待脚本"。它每隔 50ms 检测一次 `window._luliyInitPost` 是否已经加载好，加载好了就调用它。这是为了防止 enhance.js 还没加载完就被调用。**不要修改。**

```json
"indexScript": "<script>function luliyWaitIndex(){...}</script>"
```
**作用：** 同上，但用于首页，调用的是 `window._luliyInitIndex`。**不要修改。**

---

```json
"style": ""
```
**作用：** 注入到每个页面 `<style>` 里的 CSS。**已清空**，因为 enhance.css 已经处理了所有样式。如果以后要快速测试某个样式，可以在这里临时写，不用改 enhance.css。

```json
"indexStyle": ""
```
**作用：** 只注入到首页的额外 CSS。同样已清空。

---

# 二、enhance.css 全节详解

> **新手理解方式：** CSS 就像给博客"穿衣服"，每条规则都是说"这个元素要穿什么样的衣服"。  
> 格式永远是：`选择器 { 属性: 值; }`

---

## 2.1 第 00 节 — 字体导入 `@import`

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap');
@import url('https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css');
```

**作用：** 从网上下载两套字体：
- **Noto Sans SC**（= 思源黑体的 Google 版本）→ 用于标题
- **LXGW WenKai Screen**（霞鹜文楷屏幕版）→ 用于正文

**怎么换字体：**

| 想用的字体 | 替换方案 |
|---|---|
| 思源宋体 | `family=Noto+Serif+SC` |
| 更纱黑体 | 去 jsDelivr 搜 `sarasa-gothic-webfont` |
| 自定义字体 | 上传 woff2 到图床，用 `@font-face` 引入 |

**国内访问慢的解决方案：** 把 `fonts.googleapis.com` 换成 `fonts.loli.net`（国内镜像）。

---

## 2.2 第 01 节 — CSS 变量与重置

```css
:root {
  --card-c1: #8250df;
  --card-c2: #0969da;
  --card-c3: #e05c8a;
  --card-c4: #f0b429;
}
```

**作用：** 定义"全局色板"。首页文章卡片的顶部彩色边框，按 1→2→3→4 循环使用这 4 个颜色。

**怎么改：** 直接换色值。比如全部换成同色系渐变：
```css
:root {
  --card-c1: #f0b429;
  --card-c2: #ff8c00;
  --card-c3: #ff4500;
  --card-c4: #dc143c;
}
```

---

## 2.3 第 02 节 — 欢迎进入画面

```css
#luliy-welcome {
  background: url('...static/img/9.jpg') center / cover no-repeat;
}
```

**可以改的参数：**

| CSS 属性 | 当前值 | 含义 | 改成什么 |
|---|---|---|---|
| 背景图 URL | `9.jpg` | 欢迎画面背景 | 换成其他图片直链 |
| `transition` | `0.9s` | 消失动画时长 | 改成 `0.5s` 更快 |
| `transform: scale(1.055)` | 消失时放大比例 | 改小=更平滑 |

```css
#luliy-welcome-title {
  font-size: clamp(1.8rem, 5vw, 3.2rem);
  letter-spacing: 4px;
}
```

**`clamp(最小值, 响应式值, 最大值)`** = 字体大小会随屏幕宽度自动缩放，但不会小于 1.8rem，不会大于 3.2rem。  
**改字体大小：** 比如 `clamp(1.4rem, 4vw, 2.6rem)` 让标题稍微小一点。

```css
@keyframes welcomeFadeIn {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
**作用：** 欢迎页内容从下方 28px 处淡入。  
**改动画方向：** 改 `translateY(28px)` 为 `translateX(-30px)` = 从左侧滑入。

---

## 2.4 第 03 节 — 全站背景图

```css
body {
  background-image: url('...static/img/bg.png') !important;
  background-size: cover !important;
  background-attachment: fixed !important;
}
```

**可改参数：**

| 属性 | 当前值 | 效果 | 可选值 |
|---|---|---|---|
| `background-image` | bg.png | 背景图 | 换成任意图片 URL |
| `background-size` | `cover` | 铺满全屏 | `contain`=完整显示 |
| `background-attachment` | `fixed` | 滚动时背景固定不动（视差效果） | `scroll`=随页面滚动 |
| `background-position` | `center` | 居中 | `top`、`bottom`、`0 30%` |

**如果不想用背景图，改成纯色：**
```css
body { background-image: none !important; background-color: #f5f0ff !important; }
```

---

## 2.5 第 04 节 — 文字排版

```css
body {
  font-family: 'LXGW WenKai Screen', 'LXGW WenKai', 'Noto Serif SC', serif;
}
```
**字体书写顺序（优先级从高到低）：** 浏览器会先尝试第一个，找不到就用第二个，以此类推。最后的 `serif` 是系统兜底。

```css
#postBody { font-size: 18px; line-height: 1.9; }
```

**可改参数：**

| 属性 | 当前值 | 作用 |
|---|---|---|
| `font-size` | `18px` | 文章正文字号（14~20px 都合适） |
| `line-height` | `1.9` | 行间距（1.6~2.0，越大越宽松） |

**h2 的特殊样式解释：**
```css
#postBody h2 {
  border-left: var(--th-h2-bl);   /* 左边彩色竖条 */
  background: var(--th-h2-bg);    /* 淡色背景 */
  padding: 5px 12px;              /* 内边距 */
  border-radius: 0 8px 8px 0;    /* 右侧圆角 */
}
```
这就是为什么 h2 标题有"竖线+淡色背景"效果。

---

## 2.6 第 05 节 — 导航栏

```css
#header {
  backdrop-filter: blur(32px) saturate(2.4) brightness(1.08);
}
```

**毛玻璃效果三个参数：**

| 属性 | 当前值 | 作用 | 改大/改小效果 |
|---|---|---|---|
| `blur()` | `32px` | 模糊程度 | 改大=更朦胧 |
| `saturate()` | `2.4` | 饱和度 | 改大=颜色更鲜艳 |
| `brightness()` | `1.08` | 亮度 | 改大=更亮 |

```css
#header {
  min-height: 56px;
}
```
**导航栏高度：** 改成 `64px` 可以让导航栏更高。同时要在 JS 的 `initArticleTocSpy()` 里把 `110` 改成对应值，确保 TOC 高亮判断正确。

---

## 2.7 第 12 节 — 文章面板（4 个主题）

这是最核心的视觉部分。4 个主题的文章背景：

```css
/* 默认主题：无背景框 */
body[data-luliy-theme="default"] #postBody {
  background: transparent !important;
}

/* 樱花主题：粉色毛玻璃 */
body[data-luliy-theme="sakura"] #postBody {
  background: rgba(255,238,245,0.84) !important;
  backdrop-filter: blur(26px) saturate(1.6) !important;
  border: 1px solid rgba(249,168,201,0.50) !important;
}
```

**`rgba(r, g, b, 透明度)`：**
- r/g/b = 0~255 的红/绿/蓝分量
- 透明度 = 0（全透明）~ 1（不透明）
- `rgba(255,238,245,0.84)` = 粉白色，84% 不透明

**自定义主题背景的方法：** 比如要改樱花主题的背景色，更偏紫色：
```css
body[data-luliy-theme="sakura"] #postBody {
  background: rgba(250,235,255,0.82) !important;  /* 改这里 */
}
```

**`box-shadow` 阴影解释：**
```css
box-shadow: 0 6px 44px rgba(224,92,138,0.16)
/*          ↑ ↑   ↑      ↑
          X Y 模糊   颜色+透明度  */
```

---

## 2.8 第 13 节 — macOS 代码块

```css
.mac-strip {
  height: 36px;  /* 代码块顶部条的高度 */
  padding: 0 14px; gap: 7px;  /* 三个圆点按钮间距 */
}
.mac-btn {
  width: 13px; height: 13px;  /* 圆点大小 */
}
.mac-btn-red    { background: #ff5f57; }  /* 红色=复制 */
.mac-btn-yellow { background: #ffbd2e; }  /* 黄色=折叠 */
.mac-btn-green  { background: #28c840; }  /* 绿色=全屏 */
```

**改圆点大小：** 把 `13px` 改成 `11px` 或 `15px`。  
**改顶部条高度：** 修改 `height: 36px`，同时 `enhance.css` 里 `pre { padding-top: 44px }` 也要跟着改（要比条的高度大 8px 左右）。

---

## 2.9 第 15 节 — 4 个主题的颜色变量

```css
body[data-luliy-theme="sakura"] {
  --th-h1: #7a1040;       /* h1 文字颜色 */
  --th-h1-border: 2px solid rgba(224,92,138,0.35);  /* h1 下划线 */
  --th-h2: #c94070;       /* h2 文字颜色 */
  --th-h2-bl: 5px solid #f9a8c9;  /* h2 左边竖线颜色 */
  --th-h2-bg: rgba(249,168,201,0.12);  /* h2 背景色 */
  --th-strong: #e05c8a;   /* 加粗文字颜色 */
}
```

**修改主题颜色的步骤（以调整樱花主题为例）：**
1. 找到 `body[data-luliy-theme="sakura"]` 这段
2. 把 `--th-h2` 的颜色改成你想要的
3. 把 `--th-h2-bl` 的边框颜色改成对应色
4. 保存，重新部署即可看效果

---

## 2.10 第 16 节 — 目录 TOC 高亮

```css
#TOC a.luliy-toc-active {
  background: rgba(130,80,223,0.14) !important;  /* 高亮背景 */
  color: #8250df !important;                      /* 高亮文字颜色 */
  border-left: 3px solid #8250df;                /* 左边蓝线 */
  padding-left: 14px !important;                  /* 缩进 */
}
```

**改高亮背景透明度：** 把 `0.14` 改成 `0.25` = 更明显的高亮。  
**改高亮颜色：** 把 `#8250df` 换成任意颜色，比如 `#e05c8a`（粉色）。

---

## 2.11 第 17 节 — 浮动工具栏按钮

```css
.luliy-tb-btn {
  width: 42px; height: 42px;   /* 按钮大小 */
  border-radius: 50%;           /* 圆形 */
  bottom: 28px; right: 20px;   /* 位置：右下角 */
}
```

**改按钮大小：** 把 `42px` 改成 `48px` = 更大的按钮。  
**改位置：** 修改 `#luliy-toolbar` 的 `bottom` 和 `right` 值。

---

# 三、enhance.js 全模块详解

> **新手理解方式：** JavaScript 就像博客的"大脑"，每个 `function` 函数是一个"技能"，主程序在最后把所有技能都调用一遍。

---

## 3.1 模块 00 — 欢迎进入画面 `initWelcomeSplash()`

```js
if (sessionStorage.getItem('luliy-welcomed') === '1') return;
```
**作用：** 检查本次浏览会话里是否已经显示过欢迎画面。如果已经显示过，直接跳过（不重复弹出）。

> **sessionStorage vs localStorage 的区别：**  
> - `sessionStorage`：关闭标签页/浏览器就清空 → 每次打开新标签页都会看到欢迎画面  
> - `localStorage`：永久保存 → 只有第一次访问看到  
> 改成永久只显示一次：把 `sessionStorage` 全部替换为 `localStorage`

```js
var title = document.createElement('div');
title.id = 'luliy-welcome-title';
title.textContent = '欢迎来到 Luliy 的世界';
```
**改欢迎标题：** 把 `'欢迎来到 Luliy 的世界'` 换成你想显示的文字。（注意：代码里用了 Unicode 转义，实际效果就是中文字符）

```js
var btn = document.createElement('button');
btn.textContent = '点击进入';
```
**改按钮文字：** 把 `'点击进入'` 换成 `'开启旅程'` 或任意文字。

---

## 3.2 模块 01 — 本地存储初始化 `initLocalStorage()`

```js
var defs = {
  'luliy-sfx':    '1',   // 音效默认开启
  'luliy-sakura': '1',   // 花瓣默认开启
  'luliy-sink':   'default'  // 默认主题
};
```
**作用：** 首次访问时，在浏览器里保存用户的偏好设置默认值。  
**改默认主题：** 把 `'default'` 改成 `'sakura'`、`'your-name'` 或 `'space'`，用户首次访问就看到对应主题。  
**改默认关闭音效：** 把 `'luliy-sfx': '1'` 改成 `'luliy-sfx': '0'`。

---

## 3.3 模块 02 — 阅读进度条 `initProgressBar()`

```js
bar.style.width = (dh > 0 ? Math.round(st / dh * 100) : 0) + '%';
```
**原理：** `st`(已滚动距离) ÷ `dh`(总可滚动距离) × 100 = 百分比。  
**改进度条颜色：** 在 `enhance.css` 里找：
```css
#luliy-progress-bar {
  background: linear-gradient(90deg, #8250df, #ff6b9d, #f0b429);
}
```
改成你想要的渐变颜色。

---

## 3.4 模块 03 — 动态标签页标题 `initDynamicTitle()`

```js
document.title = '👀 别走啊，我还在进步！';  // 切换走时
document.title = '✨ 欢迎回来！ ' + ori;      // 切换回来时
```
**怎么改：** 直接修改这两行里的文字。emoji 也可以换。

---

## 3.5 模块 04 — 运行时间计数器 `initUptime()`

```js
var start = new Date('2026/05/30 00:00:00').getTime();
```
**⚠️ 重要：** 这里的日期必须和 `config.json` 里的 `startSite` 保持一致！  
**格式：** `'年/月/日 时:分:秒'`

```js
el.innerHTML = '🌱 本站已陪伴你无限进步：' +
  Math.floor(d / 86400000) + '天 ' + ...
```
**改显示文字：** 把 `'🌱 本站已陪伴你无限进步：'` 改成你想要的前缀文字。  
**数字解释：**
- `86400000` = 1天的毫秒数（60×60×24×1000）
- `3600000` = 1小时的毫秒数
- `60000` = 1分钟的毫秒数

---

## 3.6 模块 07 — 网页音效 `playSfx(type)`

```js
function playSfx(type) {
  if (localStorage.getItem('luliy-sfx') === '0') return;
  // type 可以是 'click'、'sci'、'theme'
}
```
音效全部通过 Web Audio API 合成，不依赖任何音频文件。

**三种音效说明：**

| type | 触发时机 | 声音特点 |
|---|---|---|
| `'click'` | 点击链接/按钮 | 短促的电子音 |
| `'sci'` | 代码块全屏 | 上升的科技感音效 |
| `'theme'` | 切换日夜模式 | 三音符和弦 |

**调整音量：** 找到 `g.gain.setValueAtTime(0.04, ...)` 里的 `0.04`，改大 = 更响（最大不超过 0.3，否则会破音）。  
**完全关闭音效功能（不留按钮）：** 把模块 07 里的所有代码替换成 `function playSfx() {}`，然后在模块 13（工具栏）删除 SFX 按钮部分。

---

## 3.7 模块 08 — 点击粒子特效 `initClickSparks()`

```js
var colors = ['#ff6b9d', '#ffcd3c', '#6bceff', '#a78bfa', '#34d399'];
```
**改粒子颜色：** 替换这个数组里的颜色，可以加减数量。

```js
for (var i = 0; i < 12; i++)   // 每次点击产生 12 个粒子
var dist = Math.random() * 50 + 16;  // 飞散距离 16~66px
```
**改粒子数量：** 把 `12` 改成 `6`（减少）或 `20`（增多，但可能卡顿）。  
**改飞散距离：** 把 `50 + 16` 改成 `80 + 20` = 粒子飞更远。

```js
s.style.width = s.style.height = '7px';  // 粒子大小
```
**改粒子大小：** 把 `7px` 改成 `5px`（更小）或 `10px`（更大）。

---

## 3.8 模块 09 — 头像英雄区 `initHeroCluster()`

```js
cluster.href = '/about';
cluster.title = '关于我';
```
**作用：** 把导航栏头像变成一个链接，点击跳转到 `/about` 页面。  
**改跳转页面：** 把 `'/about'` 换成你想要的任意路径。

```js
nameEl.textContent = 'Luliy';
```
**改显示名字：** 把 `'Luliy'` 改成你的名字。这个名字显示在头像右边。

---

## 3.9 模块 10 — 首页横幅 `initHeroBanner()`

```js
banner.textContent = 'Remember, this is your world.';
```
**改横幅文字：** 替换这里的文字，可以写你的 slogan、一句诗、或留空。  
**留空横幅：** `banner.textContent = '';`

---

## 3.10 模块 13 — 浮动工具栏 + 4 个主题 `SINKS` 数组

这是整个 JS 文件里**最常需要改动**的部分。

```js
var SINKS = [
  {
    id: 'default',           // 主题 ID（不要改）
    label: '默认',            // 主题菜单里显示的名字（可改）
    dot:   '#8250df',        // 菜单里的小圆点颜色（可改）
    theme: 'default',        // 对应 CSS 里的 data-luliy-theme（不要改）
    cardPalette: ['#8250df', '#0969da', '#ff6b9d', '#f0b429'],  // 4色卡片边框
    desc: '经典紫调，局演清正'  // 主题描述（可改）
  },
  ...
]
```

**修改主题名称和描述：** 直接改 `label` 和 `desc` 字段里的文字。

**修改卡片颜色：** `cardPalette` 数组的 4 个颜色分别对应第 1、2、3、4 篇卡片的顶部边框颜色，之后循环。

**添加第 5 个主题（高级操作）：**

1. 在 `SINKS` 数组里新增一项：
```js
{
  id: 'ocean',
  label: '深海蔚蓝',
  dot: '#0066cc',
  theme: 'ocean',
  cardPalette: ['#0066cc', '#0099ff', '#00ccff', '#006699'],
  desc: '深海宁静，波光粼粼'
}
```

2. 在 `enhance.css` 的第 15 节末尾添加：
```css
body[data-luliy-theme="ocean"] {
  --th-h1: #003366; --th-h1-border: 2px solid rgba(0,100,200,0.30);
  --th-h2: #0066cc; --th-h2-bl: 5px solid #00ccff; --th-h2-bg: rgba(0,100,200,0.08);
  --th-h3: #0080ff; --th-h4: #4da6ff; --th-strong: #00ccff;
}
body[data-luliy-theme="ocean"] #postBody {
  background: rgba(230,240,255,0.84) !important;
  border: 1px solid rgba(0,100,200,0.25) !important;
  border-top: 3px solid rgba(0,150,255,0.65) !important;
  border-radius: 20px !important;
  padding: 36px 40px !important;
}
```

---

## 3.11 模块 14 — 首页文章卡片重建 `initCards()`

```js
var perPage = 12;  // 每页文章数（和 config.json 的 onePageListNum 保持一致）
```

```js
var pinnedPosts  = posts.filter(function (p) { return p.pinned; });
```
**置顶文章的方法：** 在 GitHub Issues 里给文章打上 `pinned` 标签，该文章就会出现在首页顶部的特别区域。

```js
var dateEl = document.createElement('div');
dateEl.className = 'luliy-card-date';
dateEl.textContent = post.created ? post.created.slice(0, 10) : '';
```
**日期格式：** `.slice(0, 10)` 截取前 10 个字符，显示格式为 `2026-05-30`。  
**改成中文格式：**
```js
var d = post.created ? post.created.slice(0, 10) : '';
dateEl.textContent = d ? d.replace(/-/g, ' 年 ').replace(/-/, ' 月 ') + ' 日' : '';
```

---

## 3.12 模块 15 — macOS 代码块装饰 `applyCodeBlocks()`

三个按钮的功能分别绑定在 `bR`（红/复制）、`bY`（黄/折叠）、`bG`（绿/全屏）上。

**改复制成功提示文字：**
```js
bR.setAttribute('data-tip', '已复制 ✓');  // 把这里的文字改掉
```

**改折叠/展开提示：**
```js
bY.setAttribute('data-tip', folded ? '展开代码' : '折叠代码');
```

---

## 3.13 模块 16 — 樱花飘落特效 `initSakura()`

```js
for (var i = 0; i < 45; i++) petals.push(mkPetal(true));  // 45片花瓣
```
**改花瓣数量：** 把 `45` 改成 `20`（减少，性能更好）或 `80`（更密集）。  
**手机上减少花瓣数量（节省性能）：**
```js
var maxPetals = window.innerWidth < 768 ? 20 : 45;
for (var i = 0; i < maxPetals; i++) petals.push(mkPetal(true));
```

```js
var COLORS = ['#ffb7c5', '#ffc0cb', '#ff9eb5', '#ffd0d8', '#ffaec0', '#f9c4d2', '#fce4ec', '#f8bbd0'];
```
**改花瓣颜色：** 替换数组里的颜色。比如换成蓝色雪花主题：
```js
var COLORS = ['#b3d9ff', '#cce5ff', '#99ccff', '#ddeeff', '#66b3ff'];
```

```js
size: Math.random() * 10 + 8,  // 花瓣大小：8~18px
speedY: Math.random() * 0.7 + 0.35,  // 下落速度
```
**改花瓣大小：** `Math.random() * 10 + 8` → 最小 8px，最大 18px。  
**加快下落：** 把 `0.35` 改成 `0.6`（更快）。

---

## 3.14 模块 17 — TOC 目录滚动高亮 `initArticleTocSpy()`

```js
if (headings[i].getBoundingClientRect().top <= 110) activeH = headings[i];
```
**`110`：** 表示距离屏幕顶部 110px 以内的标题会被认为是"当前节"。  
**改触发距离：** 如果导航栏改高了，这里的数字也要相应增大。

---

## 3.15 模块 18 — 手机端汉堡菜单 `initMobileNav()`

```js
if (/\/about\/?$/i.test(a.href)) return;  // 跳过 about 链接
```
**作用：** 手机端下拉菜单不显示 "about" 页（因为通过头像点击进入）。  
**如果想把 about 显示在菜单里：** 删掉这一行即可。

---

## 3.16 模块 19 — 搜索弹窗 `initSearchOverlay()`

```js
var filtered = q
  ? postsCache.filter(function (p) {
    return (p.title || '').toLowerCase().includes(q) ||
      (p.labels || []).some(function (l) { return ((l.name || l) || '').toLowerCase().includes(q); });
  })
  : postsCache.slice(0, 12);  // 无关键词时显示最新 12 篇
```
**改默认显示数量：** 把 `12` 改成 `8` 或 `20`。  
**搜索逻辑：** 目前支持按标题和标签名搜索。如果想加入日期搜索，在 `filter` 里加一条：
```js
|| (p.created || '').includes(q)
```

---

## 3.17 模块 21 — 文章页初始化 `_luliyInitPost()`

```js
var wc = pbody.innerText.length;
var rt = Math.max(1, Math.round(wc / 300));  // 预计阅读时间
```
**`300`：** 表示假设每分钟阅读 300 个字符。中文阅读速度约 300~400 字/分钟，可按需调整。

```js
h.title = '点击复制链接';
```
**作用：** 文章里的 h1/h2/h3 标题，点击会复制当前锚点链接到剪贴板。

---

# 四、新手如何理解和改动代码

## 4.1 看懂 CSS 的技巧

CSS 规则的结构永远是：
```
选择器 {
  属性名: 属性值;
}
```

**选择器查找技巧：**
- `#名字` → ID 选择器，全页唯一
- `.类名` → class 选择器，可重复
- `body[data-luliy-theme="sakura"]` → 带特定属性的元素

**用浏览器调试 CSS：**
1. 打开博客 → 按 `F12` 打开开发者工具
2. 点击左上角的"选取元素"箭头
3. 点击页面上的任意元素
4. 右侧会显示它的所有 CSS，可以实时修改预览效果
5. 满意了再把改动同步回 `enhance.css`

---

## 4.2 看懂 JS 的技巧

**JS 函数的结构：**
```js
function 函数名(参数) {
  // 做什么事情
}
```

**`document.createElement('div')` 是什么意思：**  
在 HTML 里创建一个新的 `<div>` 元素，然后往里面填内容，再插入到页面上。这就是 JS 动态创建 DOM 元素的基本操作。

**`setTimeout(函数, 毫秒数)` 是什么意思：**  
等待指定毫秒数后执行某个函数。`setTimeout(fn, 800)` = 等 0.8 秒后再执行。

**`localStorage.getItem('key')` 是什么意思：**  
从浏览器本地存储里读取 key 对应的值。用于记住用户的主题、音效开关等偏好设置，刷新页面后不会丢失。

---

## 4.3 修改流程推荐

```
1. 在本地文本编辑器（推荐 VS Code）里修改文件
2. 先改一个小地方，保存
3. 提交到 GitHub，等 Actions 跑完（约 1~3 分钟）
4. 刷新博客查看效果（按 Ctrl+Shift+R 强制刷新，清除缓存）
5. 满意→继续改；不满意→撤销，再试
```

**推荐 VS Code 插件：**
- `Prettier` → 自动格式化 JSON/CSS/JS
- `CSS Peek` → 快速查看 CSS 定义
- `Live Server` → 本地预览（需要在本地有 HTML 文件）

---

# 五、你可能没想到的功能与扩展

以下是当前代码**已经内置**但你可能不知道的功能，以及**可以额外添加**的功能建议。

---

## 5.1 已内置但容易忽略的功能

### ✅ 文章标题点击复制锚点
在文章里点击任意 h1/h2/h3 标题，会自动把该标题的锚点 URL 复制到剪贴板，方便分享到具体段落。

### ✅ 代码块双击全屏
双击代码块（非按钮区域）即可全屏阅读，比点绿色按钮更方便。再次双击或按 `ESC` 退出。

### ✅ 文章预计阅读时间
每篇文章顶部自动显示"预计阅读 X 分钟 | 共 XXX 字"，基于文字数量估算。

### ✅ 赞赏面板（展开式）
每篇文章底部有"✨ 和作者无限进步"按钮，点击后展开二维码图片。  
**改二维码图片：** 在 `enhance.js` 的 `_luliyInitPost` 模块里找：
```js
'<img src="https://raw.githubusercontent.com/luliy6/img/refs/heads/main/me.jpg"'
```
把这个 URL 换成你自己的收款码/联系方式图片地址。

### ✅ 文章上下篇导航
文章底部自动显示"← 上一篇"和"下一篇 →"按钮，通过读取 `postList.json` 实现，无需任何配置。

### ✅ 点击图片放大
文章里的所有图片点击后会弹出全屏灯箱（Lightbox），按 `ESC` 关闭。

### ✅ 归档页自动生成
创建一个 GitHub Issue，打上 `archive` 标签，在 `singlePage` 加入 `"archive"`，访问该页面会自动按年份生成所有文章的时间轴列表。

### ✅ 置顶文章
给任意 GitHub Issue 同时打上 `pinned` 标签，该文章会出现在首页顶部的"置顶"区域，与普通卡片区分显示。

---

## 5.2 建议添加的额外功能

### 💡 建议 1：文章字数/阅读量展示卡
在首页卡片底部也显示文章字数（目前只在文章页内显示）。  
**实现方式：** 在 `buildCard()` 函数里，读取 `post` 对象的正文并计算长度，添加进卡片 DOM。

### 💡 建议 2：深色/浅色模式快捷键
按 `Alt+T` 快速切换日夜模式，不用移动鼠标找按钮。  
**实现方式（加到 enhance.js 末尾）：**
```js
document.addEventListener('keydown', function(e) {
  if (e.altKey && e.key === 't') {
    document.querySelector('.circle')?.click(); // 模拟点击 Primer 的主题按钮
  }
});
```

### 💡 建议 3：TOC 折叠按钮
让 ArticleTOC 目录面板可以手动折叠/展开，避免遮挡文章内容。  
**实现方式：** 在 `initArticleTocSpy()` 里，给注入的 header 里的按钮加一个折叠事件，toggle TOC 的 `max-height`。

### 💡 建议 4：文章分享按钮
在文章末尾添加"分享到微博/复制链接"按钮。  
**实现方式（加到 `_luliyInitPost` 的赞赏按钮之前）：**
```js
var shareBtn = document.createElement('button');
shareBtn.textContent = '🔗 复制文章链接';
shareBtn.style.cssText = 'padding:8px 20px;border-radius:20px;border:1px solid #8250df;background:transparent;color:#8250df;cursor:pointer;margin-bottom:16px';
shareBtn.addEventListener('click', function() {
  navigator.clipboard.writeText(location.href);
  shareBtn.textContent = '✓ 已复制！';
  setTimeout(function(){ shareBtn.textContent = '🔗 复制文章链接'; }, 2000);
});
pbody.insertBefore(shareBtn, sp);
```

### 💡 建议 5：首页文章搜索框（内联版）
除了现有的弹窗搜索，在首页卡片网格上方加一个常驻搜索框，实时过滤当前页的卡片。

### 💡 建议 6：自定义 404 页面提示
在 GitHub Pages 的 `404.html` 里加入友好的提示和返回首页链接，而不是系统默认的空白 404。

### 💡 建议 7：RSS 订阅提示条
在首页顶部（banner 下方）添加一个薄薄的提示条：  
"📡 订阅 RSS 获取最新更新 →"，链接到 `/rss.xml`。

### 💡 建议 8：浏览进度百分比数字
让进度条同时在某个角落显示数字百分比（比如"32%"），对长文章特别有用。

### 💡 建议 9：全站 Meta 优化
在 `allHead` 里加上以下标签，改善在微信/QQ/微博分享时的卡片显示效果：
```html
<meta property='og:title' content='Luliy の 博客'>
<meta property='og:description' content='我将无限进步！'>
<meta property='og:type' content='website'>
<meta name='twitter:card' content='summary_large_image'>
```

### 💡 建议 10：欢迎画面增加打字机动效
让欢迎标题的字逐字出现，而不是一次性淡入，更有仪式感。  
**实现方式：** 在 `initWelcomeSplash()` 里，把 `title.textContent` 改为用 `setInterval` 逐字追加字符。

---

## 5.3 性能优化建议

| 优化项 | 当前状态 | 改进方案 |
|---|---|---|
| 花瓣数量 | 45 片 | 手机端改为 20 片 |
| 字体加载 | 同步 @import | 改为 `<link rel="preload">` 预加载 |
| 图片加载 | `loading="lazy"` 已开启 | ✅ 已优化 |
| 背景图 | 每次都加载 | 可压缩 bg.png 到 200KB 以内 |
| live2d | 每页都加载 jQuery + live2d | 网速慢可删除此组件 |

---

# 六、快速改动速查表

| 我想改… | 在哪里改 | 改什么 |
|---|---|---|
| 欢迎画面背景图 | `enhance.css` 第 02 节 | `url('...9.jpg')` → 换 URL |
| 欢迎画面标题文字 | `enhance.js` 模块 00 | `title.textContent = '...'` |
| 欢迎画面只显示一次（永久） | `enhance.js` 模块 00 | `sessionStorage` 改 `localStorage` |
| 博客建站日期 | `config.json` + `enhance.js` | `startSite` 字段 + `new Date('...')` |
| 首页文章每页数量 | `config.json` + `enhance.js` | `onePageListNum` + `perPage = 12` |
| 全站主题默认选项 | `enhance.js` 模块 01 | `'luliy-sink': 'default'` → 换 ID |
| 主题颜色（如 h2 颜色） | `enhance.css` 第 15 节 | `--th-h2: #颜色` |
| 文章背景框颜色 | `enhance.css` 第 12 节 | `rgba(...)` 里的色值 |
| 卡片边框颜色循环 | `enhance.js` SINKS 数组 | `cardPalette: [...]` |
| 导航栏头像跳转页 | `enhance.js` 模块 09 | `cluster.href = '/about'` |
| 首页横幅文字 | `enhance.js` 模块 10 | `banner.textContent = '...'` |
| 花瓣颜色/数量 | `enhance.js` 模块 16 | `COLORS` 数组 + `45` |
| 赞赏码图片 | `enhance.js` 模块 21 | `img src="..."` URL |
| 代码块圆点大小 | `enhance.css` 第 13 节 | `.mac-btn { width: 13px }` |
| TOC 高亮颜色 | `enhance.css` 第 16 节 | `#8250df` → 换颜色 |
| 点击粒子颜色 | `enhance.js` 模块 08 | `colors` 数组 |
| 手机字体大小 | `enhance.css` 第 26 节 | `font-size: 16px` |
| 新增第 5 个主题 | `enhance.js` SINKS + `enhance.css` 第 15 节 | 按模板新增 |

---

> 📌 **最后的新手建议：** 每次只改一个地方，改完立刻部署看效果，确认没问题再改下一处。不要同时改很多地方，出问题了很难排查。  
> 遇到问题时，先打开浏览器 `F12` 控制台看有没有红色报错，90% 的问题能在这里找到原因。