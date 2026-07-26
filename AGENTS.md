# AGENTS.md - AI Agent 项目指南

## 项目概述

邢鹏的个人技术博客。React SPA + Vite 构建，Tailwind CSS 样式，Markdown 文章管理，部署在 Vercel。

域名：https://www.tthhhh.ggff.net

## 目录结构

```
blog/
├── articles/              # [源目录] 文章 Markdown 文件（唯一真实来源）
│   ├── *.md              # 带 frontmatter 的文章
│   └── articles.json     # 由 sync 脚本自动生成，勿手动编辑
├── client/
│   ├── public/
│   │   ├── articles/     # [构建产物] 由 sync 脚本从 articles/ 同步而来
│   │   ├── images/       # 图片和 SVG 封面
│   │   ├── manifest.json # PWA manifest
│   │   └── sw.js         # Service Worker
│   ├── src/
│   │   ├── components/   # React 组件（含 ui/ shadcn 组件）
│   │   ├── pages/        # 页面组件（Home, Article, Archive, About, Contact）
│   │   ├── hooks/        # 自定义 hooks（useInView, useMobile 等）
│   │   ├── contexts/     # ThemeContext（深色/浅色主题）
│   │   └── lib/          # 工具函数
│   └── index.html        # 入口 HTML（含 SEO meta、字体、SW 注册）
├── shared/
│   └── articles.ts       # 文章类型定义和数据获取函数
├── scripts/
│   ├── sync-articles.js  # 从 articles/ 同步到 client/public/articles/
│   ├── generate-feeds.js # 生成 rss.xml + sitemap.xml
│   ├── generate-og.js    # 生成 OG 社交分享图片（SVG）
│   └── prerender.js      # 构建时预渲染静态 HTML（SEO）
├── e2e/                  # Playwright E2E 测试
├── tests/                # Vitest 单元测试
├── .github/workflows/    # CI/CD（GitHub Actions）
└── vercel.json           # Vercel 部署配置（rewrites + 安全头）
```

## 核心工作流：发布新文章

1. 在 `articles/` 目录创建 `.md` 文件（文件名即 slug，用英文小写+连字符）
2. 添加 frontmatter（见下方格式）
3. 运行 `npm run build`（自动 sync + 构建 + 生成 feeds/OG/预渲染）
4. `git add -A && git commit && git push`
5. Vercel 自动部署

**重要**：永远不要直接修改 `client/public/articles/`，它会被 sync 脚本覆盖。

## 文章 Frontmatter 格式

```yaml
---
title: "文章标题"
date: "2026-07-26"
category: "指南"
readTime: "12 分钟"
description: "简短描述，用于 SEO 和卡片展示"
image: "/images/article-xxx.svg"
published: true
tags: ["标签1", "标签2"]
---
```

## 构建命令

| 命令               | 作用                                             |
| ------------------ | ------------------------------------------------ |
| `npm run dev`      | 启动开发服务器（端口 3000，自动 sync）           |
| `npm run build`    | 完整构建（sync + vite + feeds + OG + prerender） |
| `npm run check`    | TypeScript 类型检查                              |
| `npm run test`     | Vitest 单元测试                                  |
| `npm run test:e2e` | Playwright E2E 测试                              |
| `npm run format`   | Prettier 格式化                                  |

## 技术栈

- **框架**: React 19 + Vite 7
- **样式**: Tailwind CSS 4 + shadcn/ui
- **路由**: wouter（轻量 SPA 路由）
- **语言**: TypeScript (strict)
- **文章**: Markdown + gray-matter 解析
- **部署**: Vercel（SPA rewrites + 安全头）
- **PWA**: Service Worker（Cache-first 策略）
- **测试**: Vitest + Playwright
- **CI**: GitHub Actions

## 关键约定

- **Slug 命名**：英文小写 + 连字符（如 `my-2025-review`），不用中文
- **Sync 机制**：`articles/` 是唯一真实来源，`sync-articles.js` 会覆盖 `client/public/articles/` 并重新生成 `articles.json`
- **主题色**：深色模式用金色 primary，浅色模式用深绿 primary（定义在 `index.css`）
- **标题 ID**：Markdown 标题自动生成 slug ID（兼容中文），用于目录锚点跳转
- **环境变量**：`VITE_SITE_URL`（站点域名）、`VITE_NEWSLETTER_ENDPOINT`（可选）

## 部署

- 平台：Vercel
- 构建命令：`npm run build`
- 输出目录：`dist/public`
- 环境变量：`VITE_SITE_URL=https://www.tthhhh.ggff.net`
