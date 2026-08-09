# 待改进事项清单

> 本文档面向接手的 AI/开发者。每项都标注了**证据位置**、**期望行为**和**验收方式**。
> 请逐项处理，不要打包成一个大提交。
>
> **2026-08-09 已完成第 1–10 项、第 12–13 项及一批新发现的问题**，详见文末「已完成」。
> 本文档现在只保留未决项和警告。
>
> **仓库路径已变更为 `~/code/blog`**（原 `~/Desktop/blog`，在 iCloud 同步目录下）。

---

## 0. 动手前必读：项目约束

违反这些会导致 CI 失败或数据丢失。

| 约束         | 说明                                                                                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 包管理器     | **npm**（仓库有 `package-lock.json`，CI 跑 `npm ci`）。不要引入 pnpm/yarn                                                                                                                 |
| 文章唯一来源 | 根目录 `articles/*.md`。**绝对不要**直接编辑 `client/public/articles/`——`npm run sync` 会覆盖并删除该目录下源目录不存在的文件                                                             |
| 文件名规范   | 文章文件名即 slug，必须匹配 `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`。`scripts/validate-article.js` 会在构建期强制校验                                                                              |
| 域名         | 不要硬编码。前端用 `import.meta.env.VITE_SITE_URL`，脚本用 `shared/site.js` 的 `resolveSiteUrl()`                                                                                         |
| 站点常量     | 站名/作者/描述统一在 `shared/site.js`，不要在组件里重复字面量                                                                                                                             |
| 代码高亮语言 | 白名单在 `shared/code-languages.js`，是唯一来源。新增语言必须**同时**改 `Markdown.tsx` 的 `languageLoaders` 和这份清单，否则构建失败（或更糟：线上静默无高亮）                            |
| robots.txt   | 由 `scripts/generate-feeds.js` 构建期生成（Sitemap 指令需要绝对 URL）。**不要**在 `client/public/` 下再放一份静态的                                                                       |
| 安全头       | 不要删除 `vercel.json` 里的 `headers` 配置。改动第三方依赖时要同步改 CSP，见 README「内容安全策略」一节                                                                                   |
| 路由         | `vercel.json` 的 `cleanUrls: true` 与 rewrite `destination: "/"` 是配套的。**改任意一个都要在部署后实测** `/writings`、`/article/<不存在的slug>` 是否仍返回 SPA（详见第 11 项的历史教训） |

**提交前必须全绿**（CI 就是这六步，顺序一致）：

```bash
npm run format:check && npm run lint && npm run check && npm test && npm run build && npm run test:e2e
```

当前基线：**184 个单测 + 14 个 e2e 全过，lint 0 error / 9 warning，构建产物 25 个 JS 分片**。
六步跑完约 15 秒。不要让基线倒退。

---

## P1 — 需要在真实环境验证的改动

### A. CSP 上线后必须实测一次 ⚠️

`vercel.json` 新增了 `Content-Security-Policy`。白名单只覆盖当前用到的第三方
（giscus、Google Fonts），详见 README「内容安全策略」一节。

**CSP 属于「只看配置文件推不出结果」的那一类。** 部署后必须：

1. 打开站点，DevTools Console 不应出现 `Refused to load` / `Refused to execute`
2. 文章页滚到底，**评论区（giscus iframe）要能正常加载**
3. 字体要生效（标题是 Noto Serif SC，不是系统衬线回退）
4. 手动分享一次，确认 OG 图能抓到

若之后启用统计（Umami/Plausible/GA）或配置 `VITE_NEWSLETTER_ENDPOINT`，
**必须同步往 CSP 里加域名**，否则脚本会被浏览器直接拦掉。对照表在 README 里。

### B. OG 图改成 PNG 后，实际分享要抓一次

`scripts/generate-og.js` 现在用 sharp 输出 1200×630 PNG，`prerender.js` 的扩展名
已同步。构建产物已确认是合法 PNG，但**社交平台的抓取行为只能实测**：
用 [opengraph.xyz](https://www.opengraph.xyz/) 或直接发微信/Twitter 试一次。

首页默认图现在指向 `/og/default.png`（此前生成了但没有任何地方引用）。
注意它只存在于**构建产物**里，`npm run dev` 下这个路径是 404——
只影响 meta 标签，不影响页面渲染。

---

## P2 — 未完成的改进

### D. 正文图片的 CLS 仍未解决

`client/src/components/Markdown.tsx` 的正文 `<img>` **有意不设** `aspect-ratio`。

上一轮曾加过 `style={{ aspectRatio: "16 / 9" }}`，但那是错的：`<img>` 默认
`object-fit: fill`，强行套一个固定比例会把所有非 16:9 的插图**拉变形**。
已回退。

目前 `articles/*.md` 里一张图都没有，所以这个问题不紧迫。真要解决，需要拿到
每张图的实际宽高，例如约定 `![alt](/images/x.png "w=800 h=600")` 再在
Markdown 组件里解析 title，而不是统一假设一个比例。

**第一篇带插图的文章上线前应该先做这个。**

### E. Google Fonts 仍是第三方依赖

`client/index.html` 现在用 `preload` + `onload` 异步加载字体，不再阻塞首屏
（此前 preload 的 URL 与实际引用的 URL 不一致，preload 永远命中不了，等于白下载一次）。

但字体本体仍托管在 `fonts.gstatic.com`，大陆网络下经常超时——异步化只保证了
**首屏不被拖死**，字体本身该加载不出来还是加载不出来。

彻底解决要自托管。注意 CJK 字体不能直接搬运：Noto Serif SC 全量有十几 MB，
必须先做子集化（`fonttools` / `cn-font-split`）。**这是个独立任务，别顺手做。**

---

## 环境与配置：踩过的坑（不是待办，是警告）

### 11. ⚠️ 路由配置的历史教训

`vercel.json` 当前配置：

```json
"cleanUrls": true,
"rewrites": [{ "source": "/((?!api|articles|images|assets|og|rss\\.xml|...).*)", "destination": "/" }]
```

这两行是配套的，**曾经踩过坑**：

- 没有 `cleanUrls` 时，`/article/xxx` 匹配不到预渲染的 `article/xxx.html`，会落到 SPA 外壳，**整个预渲染（含 OG 标签）对爬虫不可见**
- 开了 `cleanUrls` 但 rewrite 目标写 `/index.html` 时，该目标不再可解析，**SPA 回退整条失效**，`/writings` 等真实路由直接 404

**任何改动这两处的人，部署后必须实测这张表**：

| 路径                             | 期望                                        |
| -------------------------------- | ------------------------------------------- |
| `/article/advent-of-claude-2025` | 200，title 为文章标题（不是「邢鹏的博客」） |
| `/writings`                      | 200，SPA 外壳                               |
| `/article/does-not-exist`        | 200，SPA 外壳（前端渲染 NotFound）          |
| `/og/nope.png`                   | 404，且**不是** HTML                        |
| `/robots.txt`                    | 200，纯文本，且 `Sitemap:` 是真实域名       |

`curl -s <url> | grep '<title>'` 即可验证。**只看配置文件推不出结果。**

### 13. 仓库曾位于 iCloud 同步目录下 ✅ 已解决（2026-08-09）

**现状**：仓库已从 `~/Desktop/blog` 迁至 **`~/code/blog`**，脱离 iCloud 同步。
**不要再把它放回 `~/Desktop` 或 `~/Documents`**——那两个目录默认参与 iCloud 同步。

迁移前后对比（同一台机器、同一份代码）：

| 操作           | iCloud 目录下                                          | `~/code/blog`                    |
| -------------- | ------------------------------------------------------ | -------------------------------- |
| `npm ci`       | 数分钟，时常卡住                                       | **7 秒**                         |
| `npm run lint` | **15 分钟**                                            | 数秒                             |
| `npm test`     | **永久卡死**（0% CPU，worker 全阻塞在 I/O，只能 kill） | **2.4 秒**（549% CPU，真正并行） |
| CI 六步全跑    | 无法完成                                               | **约 15 秒**                     |

迁移过程中还暴露了一点：直接 `mv ~/Desktop/blog ~/code/blog` 会 **`Operation timed out`**。
因为 `~/Desktop` 归 iCloud fileprovider 管，跨出去不是同卷改名而是真实拷贝，
654MB / 十万个小文件扛不住。正确顺序是**先删 `node_modules` 与 `dist`**（降到 68MB）再移动。

**曾造成过三次真实故障**（保留作为不要搬回去的理由）：

1. `node_modules` 内文件进入不一致状态，`lru-cache` 的 CJS 入口 require 后返回空对象，**整个测试套件无法收集**（9 个 error，0 个测试）——重装 `node_modules` 才恢复
2. iCloud 在 `.git/refs/heads/` 下生成了 `main 2`、以及 `.git/index 2`，含空格的 ref 名导致 **`git push` 直接失败**（`bad object refs/heads/main 2`）
3. **2026-08-09**：`npm test` 与 `npm run lint` 双双卡死——进程存活、CPU 0%、十余分钟零输出，vitest 的 9 个 worker 全部阻塞在 I/O。同时 `dist/public/assets/` 下出现了 `index-Dj4Aw-tf 2.js` 冲突副本。当时用 `--no-file-parallelism` 绕过，迁移后不再需要

此外还批量生成过 11 个 `* 2.*` 冲突副本，其中两个进了 `articles/`，导致 `articles.json` 从 11 条变 13 条、多出带空格的 slug。**这一类现在有 `validate-article.js` 兜底，但 `node_modules` 与 `.git` 不在校验范围内。**

---

## 已完成（2026-08-09）

| #   | 事项                       | 落点                                                                                                                              |
| --- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 主题闪烁 FOUC              | `client/index.html` 头部阻塞式内联脚本，优先级与 `ThemeContext` 一致                                                              |
| 2   | 邮箱格式校验               | `client/src/lib/validation.ts`，Contact 行内报错 + Newsletter 共用                                                                |
| 3   | OG 图转 PNG                | `generate-og.js` 用 sharp 渲染；`prerender.js` 扩展名同步                                                                         |
| 4   | sitemap lastmod            | frontmatter 可选 `updated` 字段，回落到 `date`                                                                                    |
| 5   | RSS 全文                   | `content:encoded` + `xmlns:content`；站内链接经 `absolutizeLinks` 绝对化                                                          |
| 6   | 标签页收录                 | 决策为**不单独收录**，`SEO.tsx` 已注释说明这是有意为之                                                                            |
| 7   | 404 noindex                | `SEO` 新增 `noindex`，已纳入标签清理机制；Article/NotFound 都传                                                                   |
| 8   | 图片尺寸 / CLS             | 固定尺寸图（头像、hero、卡片）已加 `width`/`height`；正文图见 D 项                                                                |
| 9   | 收窄 prism 语言            | `PrismLight` + 白名单，**332 → 25 个 JS 分片**；构建期护栏防静默降级                                                              |
| 10  | reduced-motion             | `index.css` 全局兜底，duration 用 0.01ms 保证动画仍到达终态                                                                       |
| 12  | 实习经历地点不匹配         | 该条目已从时间线移除，改为蔚来法务实习                                                                                            |
| —   | robots.txt 的 Sitemap 声明 | 此前是注释掉的占位域名；改为构建期生成，域名从 `VITE_SITE_URL` 取                                                                 |
| —   | 移动端禁止缩放             | 移除 viewport 的 `maximum-scale=1`（WCAG 1.4.4）                                                                                  |
| —   | 字体 preload 失效          | preload URL 与实际引用不一致，已统一并改为异步加载                                                                                |
| —   | Service Worker 图片缓存    | `/images/` 不带内容哈希，cache-first 改为 stale-while-revalidate                                                                  |
| —   | 缺少 CSP                   | `vercel.json` 新增，说明见 README                                                                                                 |
| —   | 主题固化                   | `ThemeContext` 不再在挂载时无条件写 localStorage，只在用户显式切换时写                                                            |
| —   | 搜索对键盘用户不可用       | cmdk 的回车只调 `onSelect`、不合成 click，此前靠 `<Link>` 冒泡跳转的写法让回车只关弹窗。跳转移入 `onSelect`，回归测试 `tests/f13` |
| —   | 搜索不覆盖标签             | `searchableText()` 统一自有过滤与 `CommandItem` 的 `value`，否则新增字段会被 cmdk 二次过滤丢掉                                    |
| —   | Cmd+K 可能弹两个对话框     | `SearchButton` 在 Layout 里有两处，各自带弹窗与监听。弹窗与快捷键收归 Layout 独家持有                                             |
| —   | Toast 主题跟随系统而非站点 | `ui/sonner.tsx` 原从 `next-themes` 取主题（本项目无该 Provider，恒回退 `system`），改用自有 `ThemeContext`；顺带移除该依赖        |
| —   | giscus 配置写死            | README 记的 `VITE_GISCUS_*` 此前无人读取，现改为环境变量优先、原配置兜底                                                          |
