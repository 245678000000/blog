# 邢鹏的个人博客

法学硕士 | AI Native 开发者 | Prompt 工程师

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问 http://localhost:3000
```

### 构建生产版本

```bash
pnpm build
pnpm start
```

## ✍️ 写文章

### 方法 1: 手动创建

1. 在 `client/public/articles/` 创建 `.md` 文件
2. 添加 frontmatter 头部信息
3. 更新 `client/public/articles/articles.json`

### 方法 2: 使用脚本

```bash
chmod +x scripts/new-post.sh
./scripts/new-post.sh "文章标题" "分类"
```

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

# 正文内容

支持完整的 Markdown 语法...
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
├── client/
│   ├── public/
│   │   ├── articles/       # 文章 Markdown 文件
│   │   │   ├── articles.json  # 文章元数据
│   │   │   └── *.md           # 文章内容
│   │   └── images/         # 图片资源
│   └── src/
│       ├── components/     # React 组件
│       ├── pages/          # 页面组件
│       └── contexts/       # 状态管理
├── server/                 # Express 服务器
├── shared/                 # 共享类型和工具
└── scripts/                # 辅助脚本
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
