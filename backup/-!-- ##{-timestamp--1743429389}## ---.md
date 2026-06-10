<!-- ##{"timestamp":1743429389}## -->

# 0. 简介
> [Gmeek](https://github.com/Meekdai/Gmeek) 一个博客框架，超轻量级个人博客模板，完全基于Github Pages 、 Github Issues 和 Github Actions，可以称作All in Github。不需要本地部署，从搭建到写作，只需要18秒，2步搭建好博客，第3步就是写作。

曾经用过免费的 Blogger（总感觉随时会被砍），购买服务器的 WordPress（前几个月忘记续费 g 了），研究期间一直看到有人提 GitHub Pages 方式，随便搜了下感觉传统项目的 Hugo Hexo 之类那样需要很麻烦地额外装软件+每次写文都折腾一番，也有人重装系统后忘记怎么重新部署环境懒得再折腾了的，本来就是为了不用顾虑服务器省事的感觉这样反而更复杂了

然后前段时间在 V2EX 看到作者 Meedkai 大佬发的博客程序 Gmeek 可以随时直接通过 GitHub Issues 来操作，还算比较直观+方便

就是默认主题看着有点难受，花了点时间参考了几个前辈改了下主题和小插件，晚点也把用法发出来

---------------------------------------------------------------------------
# 1. 创建前准备（非必要）
## 1.1 Fork 克隆仓库 Gmeek 和 Gmeek-template
防止删库跑路，因为这个博客每次进行修改都会需要返回到 https://github.com/Meekdai/Gmeek.git 来做一次 Action
要是哪天出现任何不可抗因素出现删库，整个博客直接就废了，也没法额外再创建新的博客了

来到 https://github.com/Meekdai/Gmeek
右上角 Fork - Create a fork
Owner: `当前账号` / Repository name: `Gmeek`（默认即可）
Description (optional): `Gmeek is a Blog All in Github`（默认即可）
Copy the main branch only：`取消打勾`（非必要）
Create fork

来到 https://github.com/Meekdai/Gmeek-template
右上角 Fork - Create a fork
Owner: `当前账号` / Repository name: `Gmeek-template`（默认即可）
Description (optional): `Gmeek template repository`（默认即可）
Copy the main branch only：`取消打勾`（非必要）
Create fork

## 1.2 Gmeek 和 Gmeek-template 分别是什么
Gmeek 是博客真正本体，创建完成后的修改都需要通过访问这里的内容来部署
Gmeek-template 用来方便创建博客的模板，创建完就不需要了，除非之后搞废了或想创建多个的时候才用得上

---------------------------------------------------------------------------
# 2. 创建博客
## 2.1 通过模板创建
### 常规创建法
来到 https://github.com/Meekdai/Gmeek-template
或自己 Fork 的 https://github.com/用户名/Gmeek-template
点击 README 内的“通过模板创建仓库”创建，或右上角 Use this template - Create a new repository

### Forked 状态手动创建
Repositories - New
Repository template: `用户名/Gmeek-template`

## 2.2 设置仓库名
Create a new repository
Include all branches：`打勾`（非必要）
Owner: 用户名 / Repository name: `用户名.github.io`

这里新手有个很容易误解的坑
仓库名可以为任意名，但是只有使用 `当前用户名.github.io` 才能实现 `https://当前用户名.github.io` 的域名
若 Repository name 直接用别的词，或者是别的域名
比如 `blog` 或 `不是用户名.github.io` 或 `abc.com` ，都会被强行变成后缀导致
最终域名变成 `https://当前用户名.github.io/blog`
或 `https://当前用户名.github.io/不是用户名.github.io`
或 `https://当前用户名.github.io/abc.com`

Description (optional): `随便填或不填`

Public`（必选，否则没法正常创建）`

Create repository

## 2.3 小技巧
熟悉、测试过程，可先创个备用版来实现，比如 `用户名.github.io` 作为主用，`用户名.github.io/test` 作为测试用
并且作为测试用的 `用户名.github.io/test` 不建议绑定域名，因为类似 Cloudflare 小云朵等功能会导致更新延迟经常需要等一段时间才能刷新网页看到改的效果

---------------------------------------------------------------------------
# 3. 初始化
## Settings - Pages
Build and deployment
Source
Deploy from a branch 改为 GitHub Actions

## Issues - New issue
Add a title: `About`
Labels - 输入 `about` - Create new label: "about" - Enter
文章内容：`随便`
Create

## Actions - All workflows
观察刚才创建的黄色的 About 等变成绿色即可

## Code - README
观察内容变成当前仓库链接 Blog Title  https://用户名.github.io 表示创建成功

---------------------------------------------------------------------------
# 4. 自定义

## 4.1 修改仓库指向为之前 Fork 的位置（非必要）
方便修改源码或防止删库

仓库名/.github/workflows/Gmeek.yml - 右上角 Edit this file

`git clone https://github.com/Meekdai/Gmeek.git /opt/Gmeek;`
改为
`git clone https://github.com/用户名/Gmeek.git /opt/Gmeek;`

Commit changes...

Actions - build Gmeek - Run workflow - Run workflow

观察 build Gmeek 能否顺利运行
完成后浏览器按 F12 - 网络 - 停用缓存，然后输入当前域名 `https://用户名.github.io` 检查是否能正常访问，强烈建议之后每次都这样检查


## 4.2 指定自定义域名
- 修改博客正式访问域名（非必要）
官方教程：[Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)


以 Cloudflare 为例，其它大同小异
情况1和情况2的 DNS 记录本身并不冲突，可同时存在，实现 `abc.com` 和 `blog.abc.com` 分别指向两个不同仓库内的 GihHub Pages 博客

### 情况1. 二级域名直接做 GitHub Pages 博客地址，如 `abc.com` 这种
域名 - DNS - Add record 添加记录
| Type: A | Name: @ | IPv4 address: 185.199.108.153 | Proxy status: Proxied | TTL: Auto |
| :-------: | :---------: | :--------------------------------: | :----------------------: | :---------: |
| Type: A | Name: @ | IPv4 address: 185.199.109.153 | Proxy status: Proxied | TTL: Auto |
| Type: A | Name: @ | IPv4 address: 185.199.110.153 | Proxy status: Proxied | TTL: Auto |
| Type: A | Name: @ | IPv4 address: 185.199.111.153 | Proxy status: Proxied | TTL: Auto |

GitHub 仓库
Settings - Pages - Custom domain: `abc.com`（不需要带 http:// 或 https:// 前缀）
Save

### 情况2. 三级域名做 GitHub Pages 博客地址，如 `www.abc.com` 或 `blog.abc.com`（以此为例）
域名 - DNS - Add record 添加记录
`| Type: CNAME | Name: blog | Target: 用户名.github.io | Proxy status: Proxied | TTL: Auto |`
或先添加情况1的 DNS记录，然后直接
`| Type: CNAME | Name: blog | Target: @ | Proxy status: Proxied | TTL: Auto |`

GitHub 仓库
Settings - Pages - Custom domain: `blog.abc.com`（不需要带 http:// 或 https:// 前缀）
Save

等待黄色的 DNS Check in Progress 变成绿色 DNS check successful 即可（不等变黄也没所谓，以浏览器能打开为准）

### 检查
完成后打开域名访问一次看是否正常

- 修改仓库主页右上角 About 链接（非必要）
Code - About - 齿轮图标
Website: `https://域名/`
Save changes


## 4.3 其它
- 上传 static 目录
Code - Add file - Upload files
将准备好的 static 目录拖进去
Commit changes

上传自定义文件必须都以 /static 作为初始目录，否则 Gmeek 博客程序没法识别
根据作者建议，插件目录最好为 /static/assets/内，404页面为 /static/404.html，其它实测没所谓
如
插件 `/static/assets/插件.js`
404页面 `/static/404.html`
背景图 `/static/bg/背景图.jpg`
头像 `/static/logo/avatar.jpg`

假设目录内容分别有下面两样
404页面：/static/404.html
插件：/static/assets/插件.js
若未指定域名，之后引用的文件链接分别需要去掉为 /static 后成为
`https://用户名.github.io/404.html`
`https://用户名.github.io/assets/插件.js`
若指定了自定义域名，如 `abc.com`，那就是
`https://abc.com/assets/404.html`
`https://abc.com/assets/AriticleTocTopBot.js`

- 修改 config.json
Code - config.json - Edit this file - 按需修改 - Commit changes

Actions - build Gmeek - Run workflow - Run workflow

完成后打开域名访问一次看是否正常

---------------------------------------------------------------------------
# 5. 创建、上传文章
- 创建博客自带功能允许第二个独立页面 Link 的 Issue，Label = link（非必要）
需搭配 config.json 文件内添加 `"singlePage":["link","about"],` 参数解锁

- 创建/上传其余 Issues 文章，创建或删除多余 labels

---------------------------------------------------------------------------
# 6. 安装评论插件 utterances
## 安装

### 偷懒办法
直接点这个 [install the app](https://github.com/apps/utterances)
然后跳到 → [# utterances 安装操作](#utterances-安装操作)

### 正常办法
打开随便一篇文章，首篇的 `About` 也行，点击文章底部的`评论 / comments`按钮

点击弹出窗口右下角绿色的 `Sign in with GitHub` 按钮

按提示登录 GitHub 账号

登录后回到文章底部，再此点击文章底部的`评论 / comments`按钮，评论框内随便输入点东西

点击弹出评论框右下角绿色的 `comment` 按钮

此时会在评论框顶部弹出红色报错，类似下面这个：
> [!CAUTION]
> Error: utterances is not installed on 用户名/用户名.github.io. If you own this repo, [install the app](https://github.com/apps/utterances). Read more about this change in [the PR](https://github.com/utterance/utterances/pull/25).

按提示点击 [install the app](https://github.com/apps/utterances)

### utterances 安装操作
弹出页面中点击绿色按钮 `Install` - 选择当前用户名

安装到指定的创建了 Gmeek 博客程序的仓库内
for these repositories: 默认的 `All repositories` 改为 `Only select repositories`
Select repositories: `用户名/用户名.github.io`（假设是这个）（可多选）

Install

按提示用 passkey 或 GitHub Mobile 或 authenticator app 或 password 来验证操作

完成后弹出这个[页面](https://utteranc.es/?installation_id=63741926&setup_action=install)表示安装成功

再回到博客文章底部随便评论点东西测试

能评论就 ok

## 后续调整
之后想管理，增删可以到 GitHub 页面右上角 - 头像 - Settings
左侧栏目 Integrations - Applications
中间栏目 utterances - Configure
这里重新修改安装的库，或底部 Uninstall 删除 utterances 程序

---------------------------------------------------------------------------
# 7. 细节
- 创建过程最好严格按照指示步骤进行，其它额外操作比如删掉多余 label，创建其它 issues 等在创建完再搞，最少要到完成[3. 初始化](#3.-初始化)为止，避免可能出现的 bug
- 删除过 labels 后需要 Action 一次才能正常新建 Issues
- 重建博客原仓库删掉后，之前通过这个仓库 issues 上传的图片也会 404，所以重建博客后之前备份的文章文档内的图片链接需要重新上传更新
这个方式让我误解为通过 Issues 直接上传的图片同样会占用仓库的空间总容量，不过查了下相关说明似乎并不是
- GitHub Issues 每创建一篇都会有一个从 #1 开始的独立的编号，删除后这个编号就会永久丢失，除非整个博客删掉重建，所以如果想让文章编号连续，可以通过修改这篇 Issue 替换掉就内容，而不是删掉，不过修改的话 Issue 底部也会有改名记录之类就是了
- 假设 About 和 Link 分别是前两篇文章，且 config.json 从默认的 `"urlMode":"pinyin",` 改成了博客 URL 为更简洁的 `"urlMode":"issue",` 状态后，访问博客 `abc.com/post/1.html` 和 `abc.com/post/2.html` 都是 404，变成了 `abc.com/post/about.html` 和 `abc.com/post/link.html` 之后的文章都是从  `abc.com/post/3.html` 开始算





_Originally posted by @planenalp in https://github.com/planenalp/IKB-dev/issues/17_