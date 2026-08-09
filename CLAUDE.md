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
- 不要删除 `vercel.json` 中的安全头配置（含 CSP/HSTS，改第三方依赖时要同步改，见 README）
- 不要往 `script-src` 里加 `'unsafe-inline'`（它会让 sha256 白名单整个失效）
- 不要在 `index.html` 的标签上写内联事件属性（`onload=` 之类，hash 覆盖不到）
- 不要给路径不带内容哈希的资源加 `immutable`（换图后老访客永远看不到新的）
- 不要在 `client/public/` 下放 `robots.txt`（由 `generate-feeds.js` 构建期生成）
- 不要给正文 `<img>` 写死 `aspect-ratio`（默认 `object-fit: fill`，会把插图拉变形）

## 图片

`client/public/images/` 放**源图**，`scripts/optimize-images.js` 在 `vite build`
之后就地重编码 `dist/public/images/` 里的副本——源文件不动，改动只落在产物。
文件名不变，所以组件侧引用方式无需改。

- 单张产物超过 **400KB 构建直接失败**。要么把源图裁小，要么在脚本的 `OVERRIDES`
  里为它单独设 `maxWidth`/`quality`
- 照片不要存 PNG。PNG 分支只对色块图有效，照片量化后压不动
  （`2025-cover` 曾是 490KB PNG，转 JPEG 后 122KB）
- `npm run dev` 下走的是未经处理的源图，判断线上体积要看 `npm run build` 的输出

## 页面清单与 SEO 元数据

- `shared/pages.js` 是非文章页面的唯一来源，`prerender.js`（生成静态 HTML）
  与 `generate-feeds.js`（sitemap）都从这里读。加页面要**同时**在
  `App.tsx` 加路由，一致性由 `tests/f16` 断言
- `shared/page-meta.js` 负责拼 `<head>`：文章页和静态页共用同一条路径。
  不要再为某类页面单开一套拼装逻辑——此前就是分开写才导致静态页只有
  title/description、分享卡片全退回首页
- 预渲染的 JSON-LD 用 `id="structured-data"`，与 `SEO.tsx` 是**同一个节点**。
  改任何一边的字段都要同步改另一边，否则爬虫执行 JS 前后读到两份不同的数据
- 同一份内容挂多个路径时用 `SEO` 的 `canonicalPath` 钉住权威地址
  （`/writings` 与 `/` 就是这么处理的），不要让两个地址各自 canonical

## CSP 内联脚本哈希

`client/index.html` 里只有**一段**内联脚本（主题初始化 + 字体加载 + SW 注册），
`vercel.json` 的 `script-src` 写死它的 sha256，不开 `'unsafe-inline'`。

**改那段脚本必须同步更新哈希。** 漏改是静默失败：脚本被浏览器拦掉，页面照常渲染，
只是主题闪烁回来、SW 不再注册，而且 dev 服务器不发 CSP，本地永远发现不了。
`tests/f17` 和构建期的 `scripts/check-csp.js` 会拦下来，取新哈希的命令见 README。

## 代码块语言白名单

`shared/code-languages.js` 是唯一来源。Prism 只注册了这份清单里的语言，
遇到未注册的语言**不会报错**，只会静默渲染成无高亮纯文本。

新增语言要改两处：`Markdown.tsx` 的 `languageLoaders`（import 路径必须是字面量，
写成模板字符串会让 Vite 把整个语言目录都打进去）+ `SUPPORTED_CODE_LANGUAGES`。
漏改会被 `validate-article.js` 在构建期拦下，一致性由 `tests/f12` 断言。

## 测试

- 单元测试：`tests/` 目录，Vitest + Testing Library
- E2E 测试：`e2e/` 目录，Playwright（需先 `npx playwright install`）
- 新增页面/组件时考虑添加对应测试
- 仓库必须放在 iCloud 同步目录之外（现为 `~/code/blog`）。放回 `~/Desktop` 会让 `npm test` 与 `npm run lint` 卡死，详见 IMPROVEMENTS.md

## 项目结构要点

- `articles/` = 文章唯一真实来源
- `shared/articles.ts` = 文章类型 + 数据获取函数（getRelatedArticles 等）
- `client/src/components/Markdown.tsx` = Markdown 渲染（含标题 ID 生成、代码高亮、图片 Lightbox）
- `client/src/hooks/useInView.ts` = 滚动动画 hook（callback ref 模式）
- `client/src/contexts/ThemeContext.tsx` = 主题管理（跟随系统偏好）
