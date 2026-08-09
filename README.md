# 邢鹏的个人博客

法学硕士 | AI Native 开发者 | Prompt 工程师

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm ci

# 启动开发服务器（会先同步 articles/ 下的文章）
npm run dev

# 访问 http://localhost:3000
```

### 构建生产版本

```bash
npm run build
npm run preview
```

构建会依次执行：同步文章 → Vite 打包 → **压缩图片** → 生成 RSS/Sitemap →
生成 OG 图 → 预渲染静态 HTML → **校验 CSP 哈希**。
产物在 `dist/public/`，为纯静态站点，无需 Node 服务器。

后两步是护栏，会让构建失败而不是放行：单张图片压完仍超 400KB、
或 `index.html` 的内联脚本与 `vercel.json` 里的 sha256 对不上。

### 本地质量检查

```bash
npm run format:check && npm run lint && npm run check && npm test
```

## ✍️ 写文章

> **文章的唯一源目录是根目录下的 `articles/`。**
> `client/public/articles/` 是 `npm run sync` 生成的产物目录，
> 脚本会删除其中在 `articles/` 里找不到对应源文件的 `.md`——
> 直接往产物目录里写文章会在下次同步时被清掉。

### 方法 1: 使用脚本（推荐）

```bash
./scripts/new-post.sh "文章标题" "分类"
```

脚本会在 `articles/` 下按标题生成 slug 并创建带 frontmatter 的模板（默认 `published: false`）。

### 方法 2: 手动创建

1. 在 `articles/` 创建 `.md` 文件，文件名即 slug
2. 按下方示例补齐 frontmatter
3. 运行 `npm run sync`，自动同步正文并重建 `articles.json`

`readTime` 留空时会按中英文混排自动估算，不必手写。

### 文章格式示例

```markdown
---
title: "文章标题"
date: "2026-01-13"
category: "技术"
description: "简短描述"
image: "/images/article-1.jpg"
published: true
tags: ["标签1", "标签2"]
---

## 第一节

支持完整的 Markdown 语法（GFM 表格、代码高亮、图片点击放大）。

正文里请从 `##` 开始分节：页面的 H1 已经是 frontmatter 里的 `title`，
正文再写 `#` 会被自动降级为 `##`，以保证一页只有一个 H1。
```

## 🌐 部署到 Vercel

### 第一步: 推送到 GitHub

```bash
git init
git add .
git commit -m "初始化博客"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

### 第二步: 连接 Vercel

1. 访问 [vercel.com](https://vercel.com) 用 GitHub 登录
2. 点击 "New Project" → 导入仓库
3. 配置环境变量:
   - `VITE_SITE_URL`: 你的网站地址

### 第三步: 自动部署

每次 `git push` 后，Vercel 会自动重新部署！

## ⚙️ 可选配置

### 评论系统 (Giscus)

1. 访问 [giscus.app](https://giscus.app) 获取配置
2. 添加环境变量:

```env
VITE_GISCUS_REPO=username/repo
VITE_GISCUS_REPO_ID=R_xxxxx
VITE_GISCUS_CATEGORY=General
VITE_GISCUS_CATEGORY_ID=DIC_xxxxx
```

不配的话会回落到 `Comments.tsx` 里本站自己的仓库配置。
（这四个变量一度只存在于文档里——代码把配置写死了、根本没读它们，现已修正。）

### 网站统计 (Umami/Plausible/Google Analytics)

```env
# 选择一种
VITE_ANALYTICS_PROVIDER=umami

# Umami
VITE_UMAMI_WEBSITE_ID=xxxxx

# 或 Plausible
VITE_PLAUSIBLE_DOMAIN=your-domain.com

# 或 Google Analytics
VITE_GA_ID=G-XXXXXXX
```

> ⚠️ **启用任何一项都要同步改 CSP**，见下节。默认的 `connect-src 'self'` /
> `script-src` 白名单里没有这些统计服务的域名，不改 CSP 的话脚本会被浏览器直接拦掉。

### 内容安全策略 (CSP)

CSP 写在 `vercel.json` 的 `headers` 里（JSON 不支持注释，所以说明放这）。
当前白名单只覆盖站点实际用到的第三方：

| 指令          | 允许的外部来源                 | 为什么                        |
| ------------- | ------------------------------ | ----------------------------- |
| `script-src`  | `https://giscus.app`           | 评论组件的 client.js          |
| `frame-src`   | `https://giscus.app`           | 评论以 iframe 形式嵌入        |
| `style-src`   | `https://fonts.googleapis.com` | Google Fonts 样式表           |
| `font-src`    | `https://fonts.gstatic.com`    | 字体文件本体                  |
| `img-src`     | `https:`（任意 HTTPS）         | 文章 frontmatter 可能用外链图 |
| `connect-src` | 仅 `'self'`                    | 目前没有任何跨域请求          |

#### script-src 用 sha256，不用 `'unsafe-inline'`

`index.html` 里只剩**一段**内联脚本（主题初始化 + 字体异步加载 + Service Worker
注册，合并在一起就是为了只维护一个哈希）。`script-src` 里写死它的 sha256，
不开 `'unsafe-inline'`。

这套东西**失败起来是静默的**：哈希对不上，浏览器直接拦掉那段脚本，页面照常渲染，
只是主题闪烁回来了、SW 不再注册——而且本地永远发现不了，dev 服务器不发 CSP。
所以配了两道护栏，**改那段脚本时不必靠记性**：

| 护栏                    | 时机     | 校验对象                             |
| ----------------------- | -------- | ------------------------------------ |
| `scripts/check-csp.js`  | 构建最后 | `dist/public/index.html`（真实产物） |
| `tests/f17_csp.test.ts` | 单测     | `client/index.html`（改完立刻红）    |

两者共用同一份计算逻辑，也会反向检查 CSP 里有没有对不上任何脚本的旧哈希。
改脚本后取新哈希：

```bash
node -e 'const c=require("crypto"),h=require("fs").readFileSync("client/index.html","utf-8");const m=h.match(/<script>([\s\S]*?)<\/script>/);console.log("sha256-"+c.createHash("sha256").update(m[1],"utf-8").digest("base64"))'
```

两个已知约束：

- **不要在标签上写内联事件属性**（`onload="..."` 之类）。属性形式的内联不受
  hash 覆盖，要放行得开 `'unsafe-hashes'`，等于又开了个口子。字体 `<link>`
  原本就挂着 `onload`，现在改成在那段脚本里 `createElement` + `media="print"`
- **`style-src` 仍然需要 `'unsafe-inline'`**。React 的 `style={{}}` 渲染成
  style 属性（如 Home.tsx 里的 `animationDelay`），同样不受 hash 覆盖。
  想去掉得先把这类写法全搬进 CSS

`application/ld+json` 不需要哈希——浏览器不执行数据块，严格 `script-src` 不会拦它
（已实测：零违规，元素完好）。

**改这些的时候要一起改 CSP：**

| 改动                            | 需要加的指令                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| 启用 Umami                      | `script-src` + `connect-src` 加统计服务域名                                             |
| 启用 Plausible                  | 同上                                                                                    |
| 启用 Google Analytics           | `script-src` 加 `www.googletagmanager.com`；`connect-src` 加 `www.google-analytics.com` |
| 配置 `VITE_NEWSLETTER_ENDPOINT` | `connect-src` 加该 endpoint 的域名                                                      |

**CSP 属于「只看配置文件推不出结果」的那一类**——部署后必须打开站点看
DevTools Console 有没有 `Refused to load` 报错，评论区、字体、统计都要实际点一遍。

想在本地重现线上表现，用 `vercel.json` 的响应头起一个静态服务再访问 `dist/public`
（dev 服务器不发任何安全头，本地怎么点都测不出 CSP 问题）。

### 缓存策略

`vercel.json` 按资源是否带内容哈希分档。**只有文件名会随内容变的资源才可以
`immutable`**，否则换一张图老访客要等到缓存过期才看得到。

| 路径                       | Cache-Control                                 | 为什么                                    |
| -------------------------- | --------------------------------------------- | ----------------------------------------- |
| `/assets/*`                | `max-age=31536000, immutable`                 | Vite 产物带内容哈希，文件名变了内容才变   |
| `/images/*`、`/og/*`       | `max-age=3600, stale-while-revalidate=604800` | 路径固定、内容会原地更新                  |
| `/articles/*`              | `max-age=300, stale-while-revalidate=86400`   | 改文章要尽快生效，但不必每次导航都回源    |
| `/sw.js`                   | `max-age=0, must-revalidate`                  | 缓存住了就再也推不动新的 Service Worker   |
| `/rss.xml`、`/sitemap.xml` | `max-age=3600`                                | —                                         |
| HTML                       | 不设，沿用平台默认的 `must-revalidate`        | 加一条 `/(.*)` 会把预渲染的文章页一起盖掉 |

### HSTS

`max-age=63072000; includeSubDomains`，**有意不加 `preload`**：提交 HSTS preload
列表要求 apex 域名也归自己控制并发同样的头，本站是 `ggff.net` 下的子域，
提交不会被受理，写上去只是自欺。

## 📁 项目结构

```
├── articles/               # ★ 文章源文件（唯一手写入口）
├── client/
│   ├── public/
│   │   ├── articles/       # 由 npm run sync 生成，勿手改
│   │   │   ├── articles.json  # 文章元数据索引
│   │   │   └── *.md           # 文章正文副本
│   │   ├── images/         # 图片资源
│   │   └── sw.js           # Service Worker（PWA 离线缓存）
│   └── src/
│       ├── components/     # React 组件（ui/ 为 shadcn 基础组件）
│       ├── pages/          # 页面组件
│       ├── hooks/          # 自定义 hooks
│       └── contexts/       # 状态管理
├── shared/                 # 前端与构建脚本共用的配置和工具
│   ├── site.js             # 站点名/作者/域名/XML 转义（唯一来源）
│   ├── read-time.js        # 阅读时长估算（唯一来源）
│   ├── code-languages.js   # 代码高亮语言白名单（唯一来源）
│   ├── pages.js            # 非文章页面清单（唯一来源，预渲染 + sitemap 共用）
│   ├── page-meta.js        # 预渲染的 <head> 拼装（og/canonical/JSON-LD）
│   └── articles.ts         # 文章数据访问层
├── scripts/                # 构建脚本：同步/图片压缩/RSS/OG 图/预渲染/CSP 校验
├── tests/                  # Vitest 单元测试
└── e2e/                    # Playwright 端到端测试
```

## 📝 功能特性

- ✅ 响应式设计，移动端友好
- ✅ 深色/浅色主题切换
- ✅ Markdown 文章支持
- ✅ 代码高亮
- ✅ 文章搜索
- ✅ 标签和分类
- ✅ 归档页面
- ✅ 阅读进度条
- ✅ 目录导航（桌面/移动端）
- ✅ 上一篇/下一篇导航
- ✅ 社交分享
- ✅ RSS 订阅
- ✅ SEO 优化
- ✅ Giscus 评论系统
- ✅ 网站统计支持

## 📄 License

MIT
