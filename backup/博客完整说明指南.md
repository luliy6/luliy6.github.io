<html>
<body>
<!--StartFragment--><html><head></head><body><h1>ΔιάΝους 博客完整说明指南</h1>
<blockquote>
<p>这份文档是你这个博客的「使用手册 + 功能清单 + 维护说明」，存档备查用。
基于 Gmeek 框架 + 自定义 <code>enhance.js</code> / <code>enhance.css</code>，赛博朋克主题。</p>
</blockquote>
<hr>
<h2>目录</h2>
<ul>
<li><a href="https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E4%B8%805-%E5%88%86%E9%92%9F%E5%BF%AB%E9%80%9F%E6%90%AD%E5%BB%BA-gmeek-%E5%8D%9A%E5%AE%A2">一、5 分钟快速搭建 Gmeek 博客</a></li>
<li><a href="https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E4%BA%8Ccss-%E5%92%8C-js-%E5%9C%A8-gmeek-%E9%87%8C%E6%80%8E%E4%B9%88%E9%85%8D%E7%BD%AE">二、CSS 和 JS 在 Gmeek 里怎么配置</a></li>
<li><a href="https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E4%B8%89%E5%8A%9F%E8%83%BD%E6%80%BB%E7%9B%AE%E5%BD%95">三、功能总目录（已实现 / 未实现）</a></li>
<li><a href="https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E5%9B%9B%E5%8A%9F%E8%83%BD%E8%AF%A6%E8%A7%A3%E6%8C%89%E5%BA%8F%E5%8F%B7">四、功能详解（按序号）</a></li>
<li><a href="https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E4%BA%94archives-%E5%BD%92%E6%A1%A3%E9%A1%B5-%E6%80%8E%E4%B9%88%E7%94%A8">五、Archives 归档页 怎么用</a></li>
<li><a href="https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E5%85%ADchronicle-%E7%BC%96%E5%B9%B4%E5%8F%B2%E9%A1%B5-%E6%80%8E%E4%B9%88%E7%94%A8">六、Chronicle 编年史页 怎么用</a></li>
<li><a href="https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E4%B8%83%E9%99%A4%E4%BA%86%E5%A4%8D%E5%88%B6%E7%B2%98%E8%B4%B4%E4%BB%A3%E7%A0%81%E4%BD%A0%E8%BF%98%E9%9C%80%E8%A6%81%E9%85%8D%E7%BD%AE%E4%BB%80%E4%B9%88">七、除了复制粘贴代码，你还需要配置什么</a></li>
<li><a href="https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E5%85%AB%E7%BB%99%E6%96%B0%E6%89%8B%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B%E5%86%99%E5%8D%9A%E5%AE%A2">八、给新手：从零开始写博客</a></li>
</ul>
<hr>
<h2>一、5 分钟快速搭建 Gmeek 博客</h2>
<p>Gmeek 是一个「用 GitHub Issues 写博客」的框架，文章就是 Issue，发布靠 GitHub Actions 自动生成静态页。</p>
<p><strong>步骤：</strong></p>
<ol>
<li><strong>Fork 或新建仓库</strong>：仓库名建议用 <code>你的用户名.github.io</code>（这样可以用根域名）。</li>
<li><strong>启用 GitHub Pages</strong>：仓库 Settings → Pages → Source 选 <code>GitHub Actions</code>。</li>
<li><strong>放入 Gmeek 配置</strong>：仓库根目录要有 <code>config.json</code>（站点配置）和 <code>.github/workflows/</code> 里的工作流文件。</li>
<li><strong>写文章 = 发 Issue</strong>：在仓库 Issues 里新建 Issue，标题是文章标题，正文是 Markdown 内容，打上你想要的分类标签。</li>
<li><strong>触发生成</strong>：Gmeek 的 GitHub Action 会自动把 Issue 转成网页。</li>
<li><strong>访问</strong>：<code>https://你的用户名.github.io</code> 就能看到。</li>
</ol>
<blockquote>
<p>核心概念：<strong>一篇文章 = 一个 Issue</strong>，<strong>一个标签 = 一个分类</strong>。你不用碰 HTML，写 Markdown 就行。</p>
</blockquote>
<hr>
<h2>二、CSS 和 JS 在 Gmeek 里怎么配置</h2>
<p>Gmeek 的 <code>config.json</code> 里有几个字段专门用来注入自定义样式和脚本：</p>

字段 | 作用 | 在哪个页面生效
-- | -- | --
allHead | 注入到所有页面 <head> 的内容（引入 CSS/JS 文件、字体、第三方库） | 全部页面
style | 全站 CSS（直接写样式代码） | 全部页面
script | 全站 JS（直接写脚本代码） | 全部页面
indexStyle | 仅首页 CSS | 仅首页
indexScript | 仅首页 JS | 仅首页
head | 注入到 <head> 最前面（适合放要尽早执行的脚本，比如防闪烁） | 全部页面


<h3>6. 静态资源</h3>
<p>卡片背景图、海报图、音乐文件等，建议放仓库 <code>static/</code> 目录，用这种链接引用：</p>
<pre><code>https://raw.githubusercontent.com/你的用户名/仓库名/refs/heads/main/static/文件路径
</code></pre>
<h3>7. 域名（可选）</h3>
<p>如果用自定义域名（如 luliy.me）：</p>
<ul>
<li>仓库根目录放 <code>CNAME</code> 文件，内容是你的域名</li>
<li>域名 DNS 配置 GitHub Pages 的 A 记录 + CNAME 记录</li>
<li>如果用 Cloudflare，必须设为「仅 DNS（灰云）」，不能开代理</li>
</ul>
<hr>
<h2>八、给新手：从零开始写博客</h2>
<p>如果你是第一次用 Gmeek，按这个顺序来：</p>
<p><strong>第 1 步：发布第一篇文章</strong>
进仓库 Issues → New issue → 标题写文章名 → 正文写 Markdown 内容 → 给它打一个分类标签（比如 <code>日志</code>）→ 提交。等 GitHub Action 跑完，文章就上线了。</p>
<p><strong>第 2 步：让文章出现在首页卡片</strong>
首页六张卡片对应六个标签（学习/日志/随笔/指南/藏书/AI）。你的文章打哪个标签，点对应卡片就能看到它。</p>
<p><strong>第 3 步：用归档页找所有文章</strong>
点副标题或导航进归档页，所有文章按时间排好了，不用自己整理。</p>
<p><strong>第 4 步：记录生活（Chronicle）</strong>
想记录今年去了哪、看了什么书电影，就编辑 <code>chronicle-data</code> 那个 Issue。这是手动填的，格式是 JSON（参考第六章）。</p>
<p><strong>第 5 步：建个人书架（Book）</strong>
读完一本书写篇文章，打 <code>Library</code> + 分类标签（如 <code>小说</code>），书架页就自动多一本书，点击书脊跳到你的文章。</p>
<p><strong>常见疑问：</strong></p>
<ul>
<li><em>改了 Issue 页面没变？</em> → 多数是浏览器缓存，强制刷新（Ctrl+Shift+R）。</li>
<li><em>Chronicle 改了不用重新生成站点</em>，刷新即可；普通文章和归档需要 Gmeek 重新生成。</li>
<li><em>Markdown 不会写？</em> → 标题用 <code>#</code>，加粗用 <code>**字**</code>，链接用 <code>[文字](网址)</code>，图片用 <code>![](图片网址)</code>，其余搜「Markdown 语法」即可。</li>
</ul>
<hr>
<p><em>文档结束。这份说明随博客功能更新可能需要同步修订。</em></p></body></html><!--EndFragment-->
</body>
</html># ΔιάΝους 博客完整说明指南

> 这份文档是你这个博客的「使用手册 + 功能清单 + 维护说明」，存档备查用。
> 基于 Gmeek 框架 + 自定义 `enhance.js` / `enhance.css`，赛博朋克主题。

---

## 目录

- [[一、5 分钟快速搭建 Gmeek 博客](https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E4%B8%805-%E5%88%86%E9%92%9F%E5%BF%AB%E9%80%9F%E6%90%AD%E5%BB%BA-gmeek-%E5%8D%9A%E5%AE%A2)](#一5-分钟快速搭建-gmeek-博客)
- [[二、CSS 和 JS 在 Gmeek 里怎么配置](https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E4%BA%8Ccss-%E5%92%8C-js-%E5%9C%A8-gmeek-%E9%87%8C%E6%80%8E%E4%B9%88%E9%85%8D%E7%BD%AE)](#二css-和-js-在-gmeek-里怎么配置)
- [[三、功能总目录（已实现 / 未实现）](https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E4%B8%89%E5%8A%9F%E8%83%BD%E6%80%BB%E7%9B%AE%E5%BD%95)](#三功能总目录)
- [[四、功能详解（按序号）](https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E5%9B%9B%E5%8A%9F%E8%83%BD%E8%AF%A6%E8%A7%A3%E6%8C%89%E5%BA%8F%E5%8F%B7)](#四功能详解按序号)
- [[五、Archives 归档页 怎么用](https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E4%BA%94archives-%E5%BD%92%E6%A1%A3%E9%A1%B5-%E6%80%8E%E4%B9%88%E7%94%A8)](#五archives-归档页-怎么用)
- [[六、Chronicle 编年史页 怎么用](https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E5%85%ADchronicle-%E7%BC%96%E5%B9%B4%E5%8F%B2%E9%A1%B5-%E6%80%8E%E4%B9%88%E7%94%A8)](#六chronicle-编年史页-怎么用)
- [[七、除了复制粘贴代码，你还需要配置什么](https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E4%B8%83%E9%99%A4%E4%BA%86%E5%A4%8D%E5%88%B6%E7%B2%98%E8%B4%B4%E4%BB%A3%E7%A0%81%E4%BD%A0%E8%BF%98%E9%9C%80%E8%A6%81%E9%85%8D%E7%BD%AE%E4%BB%80%E4%B9%88)](#七除了复制粘贴代码你还需要配置什么)
- [[八、给新手：从零开始写博客](https://claude.ai/chat/f2994855-08ec-47a6-8c44-0e81f63ef802#%E5%85%AB%E7%BB%99%E6%96%B0%E6%89%8B%E4%BB%8E%E9%9B%B6%E5%BC%80%E5%A7%8B%E5%86%99%E5%8D%9A%E5%AE%A2)](#八给新手从零开始写博客)

---

## 一、5 分钟快速搭建 Gmeek 博客

Gmeek 是一个「用 GitHub Issues 写博客」的框架，文章就是 Issue，发布靠 GitHub Actions 自动生成静态页。

**步骤：**

1. **Fork 或新建仓库**：仓库名建议用 `你的用户名.github.io`（这样可以用根域名）。
2. **启用 GitHub Pages**：仓库 Settings → Pages → Source 选 `GitHub Actions`。
3. **放入 Gmeek 配置**：仓库根目录要有 `config.json`（站点配置）和 `.github/workflows/` 里的工作流文件。
4. **写文章 = 发 Issue**：在仓库 Issues 里新建 Issue，标题是文章标题，正文是 Markdown 内容，打上你想要的分类标签。
5. **触发生成**：Gmeek 的 GitHub Action 会自动把 Issue 转成网页。
6. **访问**：`https://你的用户名.github.io` 就能看到。

> 核心概念：**一篇文章 = 一个 Issue**，**一个标签 = 一个分类**。你不用碰 HTML，写 Markdown 就行。

---

## 二、CSS 和 JS 在 Gmeek 里怎么配置

Gmeek 的 `config.json` 里有几个字段专门用来注入自定义样式和脚本：

| 字段 | 作用 | 在哪个页面生效 |
|------|------|----------------|
| `allHead` | 注入到所有页面 `<head>` 的内容（引入 CSS/JS 文件、字体、第三方库） | 全部页面 |
| `style` | 全站 CSS（直接写样式代码） | 全部页面 |
| `script` | 全站 JS（直接写脚本代码） | 全部页面 |
| `indexStyle` | 仅首页 CSS | 仅首页 |
| `indexScript` | 仅首页 JS | 仅首页 |
| `head` | 注入到 `<head>` 最前面（适合放要尽早执行的脚本，比如防闪烁） | 全部页面 |

### 本博客的做法（推荐）

把大量的自定义代码**单独存成文件**，而不是全塞进 `config.json`（否则 JSON 会变得巨大、难维护）：

1. 在仓库 `docs/` 目录放两个文件：`enhance.css` 和 `enhance.js`
2. 在 `config.json` 的 `allHead` 末尾用 `<link>` 和 `<script>` 引入它们：

```html
<link rel='stylesheet' href='/enhance.css'>
<script defer src='/enhance.js'></script>
```

这样以后改样式/功能，只动 `enhance.css` / `enhance.js` 两个文件，`config.json` 基本不用动。

> 本博客的 `allHead` 里还引入了：KaTeX（数学公式）、Prism（代码高亮）、Mermaid（流程图）、Chart.js（图表）、APlayer（音乐播放器）、Live2D（看板娘）等第三方库。

### head 字段的防闪烁脚本

`head` 字段里放了一段**很早执行**的脚本，作用是在页面刚加载、CSS 还没生效时就确定深色/浅色模式，避免「先白屏一下再变暗」的闪烁。这类需要抢在渲染前执行的代码就放 `head`。

---

## 三、功能总目录

### ✅ 已实现的功能

| 序号 | 英文名 | 中文名 |
|------|--------|--------|
| 00 | Loading Splash | 加载动画（两种随机：流光 / 光线扫描） |
| 01 | localStorage Init | 本地设置初始化 |
| 02 | Progress Bar | 阅读进度条 |
| 03 | Dynamic Title | 动态标题（切走标签页时变化） |
| 04 | Uptime Counter | 建站运行时长计时 |
| 05 | Dark-mode Ripple | 深浅模式切换涟漪动画 |
| 06 | Cyber Particles | 赛博粒子背景（经典 / 城市天际线两种风格） |
| 07 | Web Audio SFX | 交互音效 |
| 08 | Click Sparks | 点击火花 / 鼠标拖尾 |
| 09 | Navbar | 顶部导航（头像 + 站名 + 时钟 + 图标） |
| 10 | Brand + Thinker Icon | 站名发光标题 + 沉思者图标（跳 Issues） |
| 11 | Subtitle Links | 副标题三词链接（→ Chronicle / Book / Favorites） |
| 12 | Image Lightbox | 图片灯箱（点击放大） |
| 13 | Floating Toolbar | 浮动设置面板（主题 / 阅读偏好 / 音乐 / 特效开关） |
| 13a | 7 Themes | 七套主题（赛博朋克 / 默认 / 樱花 / 你的名字 / 太空 / 日落 / 单色） |
| 13b | Liquid Glass | 液态玻璃（模糊 / 透明度 / 色调可调） |
| 14 | Home Category Cards | 首页六张分类卡片（宽高可调 + 悬停霓虹光晕） |
| 15 | macOS Code Block | 代码块美化（三个圆点 + 行号） |
| 16 | Sakura | 樱花花瓣飘落 |
| 17 | Reading Progress Ring | 阅读进度环 + 返回顶部 |
| 18 | Nav Drawer | 抽屉式侧边导航（汉堡菜单） |
| 19 | Favorites Lock | 收藏页密码锁 |
| 21 | Post Page | 文章页（系列导航 + 滚动记忆 + 站内搜索） |
| 23 | Tag Cloud | 标签云页 |
| 24 | In-page Search | 文章内搜索浮层 |
| 25 | Mouse Trail | 鼠标拖尾 + 萤火虫 |
| 26 | View Transitions | 跨页淡入淡出过渡 |
| A | Archives | 归档页（Weekly / Other 双标签 + 分页） |
| C | Chronicle | 编年史页（年份 + 出游 / 书影游 / 海报墙） |
| B | Bookshelf | 书架页（自动读 Library 文章，五大类） |
| M | APlayer | 可拖动音乐播放器（增删曲 / 随机 / 快捷键） |

### ⬜ 尚未实现 / 已移除的功能

| 名称 | 说明 |
|------|------|
| Hero Banner | 旧的首页大横幅，已移除（改用六张分类卡片） |
| Background Image | 背景图功能已移除（全站改用纯色 + 粒子） |
| Mouse Glow Halo | 鼠标光晕，已删除（保留拖尾和点击爆炸） |
| Reading Summary | Chronicle/Book 暂不显示文章摘要（postList.json 无摘要字段） |
| Gallery Banner | 首页底部画廊横幅，已停用 |

---

## 四、功能详解（按序号）

> 以下按代码里的区块序号介绍核心功能，方便你日后定位修改。

**00 加载动画 Loading Splash**
打开网站时居中显示「ΔιάΝους」。两种动画随机出现：① 流光（霓虹色缠绕流动）；② 光线扫描（白光从左扫到右，扫到的字母才亮，结尾十字星闪烁）。约 1.5 秒后淡出。

**01 本地设置初始化 localStorage Init**
所有用户偏好（主题、特效开关、音乐位置等）存在浏览器 localStorage 里，键名都以 `luliy-` 开头。手机端默认关闭粒子和樱花（纯净阅读）。

**02–04 进度条 / 动态标题 / 运行时长**
顶部阅读进度条；切走标签页时标题变化提醒；页脚显示建站至今的运行天数。

**05 深浅模式涟漪 Dark-mode Ripple**
切换深浅模式时，从点击位置扩散一圈涟漪动画。

**06 赛博粒子 Cyber Particles**
全屏粒子背景，两种风格：① 经典（粒子向站名汇聚）；② 城市（多层 3D 赛博朋克建筑天际线 + 物理引力粒子）。在设置面板可切换、可关闭。那些紫色的星星就是这个系统。

**07–08 音效 / 点击火花**
交互音效（Web Audio 合成）；点击迸发火花、鼠标拖尾粒子。

**09–11 导航 / 站名 / 副标题**
顶部：头像、站名、时钟、图标按钮。站名「ΔιάΝους」有恒星核心发光效果，右边是 Q 版沉思者图标（点击进 GitHub Issues）。副标题三个希腊词分别链接到 Chronicle / Book / Favorites。

**12 图片灯箱 Image Lightbox**
文章里的图片点击可放大查看。

**13 浮动设置面板 Floating Toolbar**
核心控制台。可切换：七套主题、液态玻璃参数（模糊/透明度/色调）、文章面板透明度、卡片宽高、粒子开关与风格、樱花开关、减弱动效、卡片视图。有「恢复默认值」按钮。这些设置也镜像在抽屉里。

**14 首页分类卡片 Home Category Cards**
首页六张卡片：学习 / 日志 / 随笔 / 指南 / 藏书 / AI，对应 GitHub 标签。卡片宽高可在设置里调，悬停时上浮 + 粉色霓虹光晕 + 图片放大锐化。

**15–17 代码块 / 樱花 / 阅读进度环**
代码块仿 macOS 窗口（三个圆点 + 行号）；樱花花瓣飘落；文章页右下角阅读进度环 + 返回顶部。

**18 抽屉导航 Nav Drawer**
左上角汉堡菜单展开侧边抽屉，含快捷链接、主题切换、设置。抽屉背景跟随当前主题变色。

**19 收藏页密码锁 Favorites Lock**
收藏页用前端密码遮挡（注意：仅是遮挡，源码里仍可见，别放真正机密）。

**21–26 文章页 / 标签云 / 搜索 / 拖尾 / 过渡**
文章页支持系列导航、滚动位置记忆、站内搜索；标签云页；文章内搜索浮层；鼠标拖尾萤火虫；跨页淡入淡出。

**A / C / B / M：见下方专章和书架说明。**

---

## 五、Archives 归档页 怎么用

**它是什么**：把你所有文章按时间归档展示的页面，URL 是 `/archive.html`。

**页面长什么样**：
- 右上角有「Weekly | Other」两个标签
- 文章按年份分组，每行左边日期、右边标题
- 每页 10 篇，超过自动分页（< Page 1 of N >）
- 会记住你上次看的是哪个标签

**两个标签怎么分**：
- **Weekly**：文章标签里有 `Weekly` / `周记` / `周报` / `二十四节气` 任意一个
- **Other**：其余正常文章（系统页如 about/book 等会被自动排除）

**怎么维护**：完全自动。你正常发文章（带标签），归档页就自动更新，不用手动列清单。

**怎么创建这个页面**：
1. `config.json` 的 `singlePage` 里要有 `archive`
2. 建一个 Issue：标题随意、标签 `archive`、正文写一句占位即可

---

## 六、Chronicle 编年史页 怎么用

**它是什么**：记录你的年度生活轨迹的页面，URL 是 `/chronicle.html`。分三个板块：出游、书影游、海报墙。

**页面长什么样**：
- 右上角切换年份（2026 / 2025...）
- 下面切换板块：出游 / 书影游 / 海报墙
- 出游：月份 | 城市 | 活动（同月份自动合并）
- 书影游：月份 | 读书 | 观影 | 演出 | 游戏
- 海报墙：网格图片，点击全屏看大图，可左右切换
- 会记住你上次选的年份和板块

**数据从哪来**：和归档页不同，编年史内容**不是从文章自动生成**的，而是来自一个专门的 GitHub Issue（标签 `chronicle-data`）。你编辑那个 Issue 的内容，刷新页面就更新（不用重新生成站点）。

**怎么用（三个 Issue）**：

| Issue | 标题 | 标签 | 正文 |
|-------|------|------|------|
| 页面 | Chronicle | `chronicle` | 一段固定的占位骨架（含备用数据） |
| 数据 | 随意 | `chronicle-data` | 你的实际内容（JSON 格式，夹在两行注释中间） |

数据 Issue 正文格式：
```
<!-- chronicle:data:start -->
{ ...你的 JSON 数据... }
<!-- chronicle:data:end -->
```

**JSON 结构要点**：
- `years`：年份数组，如 `["2026","2025"]`，第一个默认显示
- `categories`：三个板块，`key` 必须是 `travel`/`media`/`posters`（不能改），`label` 是显示名（可改）
- `data`：每年每个板块的具体内容

**最容易出错的地方**：JSON 里必须用英文双引号，不能有多余逗号，年份要写成字符串。改完建议先到 jsonlint.com 验证一下再贴。

---

## 七、除了复制粘贴代码，你还需要配置什么

除了把 `enhance.js` / `enhance.css` 放进 `docs/`，你还需要在 **config.json** 里确认/配置这些（全中文说明）：

### 1. 必填的基础信息
| 字段 | 填什么 |
|------|--------|
| `title` / `displayTitle` | 站点名称（你的是 ΔιάΝους） |
| `subTitle` | 副标题文字 |
| `avatarUrl` | 头像图片链接 |
| `homeUrl` | 你的网站域名（如 https://luliy.me） |
| `email` | 联系邮箱 |
| `startSite` | 建站日期（用于运行时长计时） |

### 2. singlePage（单页列表）
要让 Archives / Chronicle / Book 这些特殊页面生效，它们的名字必须列在这里：
```json
"singlePage": ["about","gallery","book","favorites","archive","stock","link","chronicle"]
```

### 3. allHead（引入文件和库）
确认末尾有引入你的两个文件：
```html
<link rel='stylesheet' href='/enhance.css'>
<script defer src='/enhance.js'></script>
```

### 4. 要建的 Issues（页面和数据）
| 用途 | 标签 |
|------|------|
| 归档页 | `archive` |
| 编年史页 | `chronicle` |
| 编年史数据 | `chronicle-data` |
| 书架页 | `book` |
| 关于页 | `about` |
| 收藏页 | `favorites` |

### 5. 文章要打的标签（决定文章去哪）
| 标签 | 文章会出现在 |
|------|--------------|
| `学习` / `日志` / `随笔` / `指南` / `藏书` / `AI` | 首页对应分类卡片 |
| `Library` + `小说`/`成长`/`投资`/`现实` | 书架对应分类 |
| `Library` + `在读` | 书架的「在读」书堆 |
| `Weekly` / `周记` / `周报` | 归档页的 Weekly 标签 |

### 6. 静态资源
卡片背景图、海报图、音乐文件等，建议放仓库 `static/` 目录，用这种链接引用：
```
https://raw.githubusercontent.com/你的用户名/仓库名/refs/heads/main/static/文件路径
```

### 7. 域名（可选）
如果用自定义域名（如 luliy.me）：
- 仓库根目录放 `CNAME` 文件，内容是你的域名
- 域名 DNS 配置 GitHub Pages 的 A 记录 + CNAME 记录
- 如果用 Cloudflare，必须设为「仅 DNS（灰云）」，不能开代理

---

## 八、给新手：从零开始写博客

如果你是第一次用 Gmeek，按这个顺序来：

**第 1 步：发布第一篇文章**
进仓库 Issues → New issue → 标题写文章名 → 正文写 Markdown 内容 → 给它打一个分类标签（比如 `日志`）→ 提交。等 GitHub Action 跑完，文章就上线了。

**第 2 步：让文章出现在首页卡片**
首页六张卡片对应六个标签（学习/日志/随笔/指南/藏书/AI）。你的文章打哪个标签，点对应卡片就能看到它。

**第 3 步：用归档页找所有文章**
点副标题或导航进归档页，所有文章按时间排好了，不用自己整理。

**第 4 步：记录生活（Chronicle）**
想记录今年去了哪、看了什么书电影，就编辑 `chronicle-data` 那个 Issue。这是手动填的，格式是 JSON（参考第六章）。

**第 5 步：建个人书架（Book）**
读完一本书写篇文章，打 `Library` + 分类标签（如 `小说`），书架页就自动多一本书，点击书脊跳到你的文章。

**常见疑问：**
- *改了 Issue 页面没变？* → 多数是浏览器缓存，强制刷新（Ctrl+Shift+R）。
- *Chronicle 改了不用重新生成站点*，刷新即可；普通文章和归档需要 Gmeek 重新生成。
- *Markdown 不会写？* → 标题用 `#`，加粗用 `**字**`，链接用 `[文字](网址)`，图片用 `![](图片网址)`，其余搜「Markdown 语法」即可。

---

*文档结束。这份说明随博客功能更新可能需要同步修订。*