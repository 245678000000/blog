# CLAUDE.md

个人技术博客（React + Vite + Tailwind），文章用 Markdown 管理，部署在 Vercel。

## 常用命令

```bash
npm run dev          # 开发服务器 (localhost:3000)
npm run build        # 完整构建 (sync + vite + feeds + OG + prerender)
npm run check        # TypeScript 类型检查
npm run test         # Vitest 单元测试
npm run test:e2e     # Playwright E2E 测试
```

## 文章发布 SOP

1. 在 `articles/` 目录创建 `.md` 文件（文件名 = slug，英文小写+连字符）
2. 写 frontmatter（title, date, category, readTime, description, image, published, tags）
3. 运行 `npm run build` 验证
4. git commit + push，Vercel 自动部署

**绝对不要**直接编辑 `client/public/articles/`——sync 脚本会覆盖它。

## 代码风格

- TypeScript strict 模式
- 样式用 Tailwind 类名，不写自定义 CSS（除非 index.css 中的全局样式）
- 组件用 PascalCase 文件名（如 `ShareButtons.tsx`）
- 页面组件放 `client/src/pages/`，通用组件放 `client/src/components/`
- UI 基础组件用 shadcn/ui（在 `components/ui/` 下）
- 路径别名：`@/` → `client/src/`，`@shared/` → `shared/`

## 禁止事项

- 不要修改 `scripts/sync-articles.js` 的同步逻辑
- 不要硬编码域名，用 `import.meta.env.VITE_SITE_URL`
- 不要直接改 `client/public/articles/articles.json`（由 sync 生成）
- 不要用中文做文章 slug
- 不要删除 `vercel.json` 中的安全头配置

## 测试

- 单元测试：`tests/` 目录，Vitest + Testing Library
- E2E 测试：`e2e/` 目录，Playwright（需先 `npx playwright install`）
- 新增页面/组件时考虑添加对应测试

## 项目结构要点

- `articles/` = 文章唯一真实来源
- `shared/articles.ts` = 文章类型 + 数据获取函数（getRelatedArticles 等）
- `client/src/components/Markdown.tsx` = Markdown 渲染（含标题 ID 生成、代码高亮、图片 Lightbox）
- `client/src/hooks/useInView.ts` = 滚动动画 hook（callback ref 模式）
- `client/src/contexts/ThemeContext.tsx` = 主题管理（跟随系统偏好）
