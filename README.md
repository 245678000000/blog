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

构建会依次执行：同步文章 → Vite 打包 → 生成 RSS/Sitemap → 生成 OG 图 → 预渲染静态 HTML。
产物在 `dist/public/`，为纯静态站点，无需 Node 服务器。

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
│   └── articles.ts         # 文章数据访问层
├── scripts/                # 构建脚本：同步/RSS/OG 图/预渲染
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
