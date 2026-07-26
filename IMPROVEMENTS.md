# 待改进事项清单

> 本文档面向接手的 AI/开发者。每项都标注了**证据位置**、**期望行为**和**验收方式**。
> 请逐项处理，不要打包成一个大提交。

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
| 安全头       | 不要删除 `vercel.json` 里的 `headers` 配置                                                                                                                                                |
| 路由         | `vercel.json` 的 `cleanUrls: true` 与 rewrite `destination: "/"` 是配套的。**改任意一个都要在部署后实测** `/writings`、`/article/<不存在的slug>` 是否仍返回 SPA（详见第 11 项的历史教训） |

**提交前必须全绿**（CI 就是这六步，顺序一致）：

```bash
npm run format:check && npm run lint && npm run check && npm test && npm run build && npm run test:e2e
```

当前基线：**84 个单测 + 11 个 e2e 全过，lint 0 error / 11 warning**。不要让基线倒退。

---

## P0 — 用户可见的缺陷

### 1. 深色模式用户每次加载都会闪一下白屏（FOUC）

**证据**

- `client/src/index.css:49` — `:root` 定义的是**亮色**配色
- `client/src/index.css:97` — 深色配色在 `.dark` 类下
- `client/src/contexts/ThemeContext.tsx:36-41` — 主题 class 在 `useEffect` 里才加到 `<html>`，即**首次绘制之后**
- `client/src/App.tsx` — `<ThemeProvider defaultTheme="dark">`
- `dist/public/index.html` — 产物里 `<html lang="zh-CN">` 上没有任何主题 class

**问题**：站点默认深色，但 CSS 默认亮色，class 又要等 React 挂载后才加。结果是**每个深色模式用户在每次硬加载时都会先看到亮色页面再闪成深色**。预渲染上线后首屏更快，这个白闪反而更明显。

**期望**：首次绘制时 `<html>` 上就带正确的主题 class，无闪烁。

**建议做法**：在 `client/index.html` 的 `<head>` 里、**样式表引入之前**插入一段内联脚本（必须是阻塞式，不能 defer）：

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem("theme");
      if (t !== "light" && t !== "dark") {
        t = window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
      }
      document.documentElement.classList.add(t);
    } catch (e) {
      document.documentElement.classList.add("dark");
    }
  })();
</script>
```

同时 `ThemeContext` 的初始化逻辑要与这段脚本**保持同一套优先级**（localStorage → 系统偏好 → dark），否则两者会打架。

**注意**：`scripts/prerender.js` 会以 `dist/public/index.html` 为模板生成所有静态页，这段脚本会自动带过去，无需额外改动——但要跑一次 `npm run build` 确认产物里确实有。

**验收**

1. 浏览器 devtools 把网络限速到 Slow 3G，硬刷新首页与任意文章页，**不应看到亮色闪烁**
2. 在浏览器里 `localStorage.setItem('theme','light')` 后刷新，应直接是亮色，同样无闪烁
3. `npm test` 仍全过（`tests/f1_layout.test.tsx` 有主题相关用例）

---

### 2. 表单邮箱只判断非空/含 @，无效地址可提交

**证据**

- `client/src/pages/Contact.tsx:134` — `<form ... noValidate>`，浏览器原生校验被关闭
- `client/src/pages/Contact.tsx:75` — 只有 `!formData.email` 的非空判断
- `client/src/components/Newsletter.tsx:16` — 只有 `email.includes("@")`

**问题**：`abc`、`a@`、`@b` 都能通过。Contact 表单会据此拼一个 mailto 打开邮件客户端，地址是错的。

**期望**：提交前校验邮箱格式，不合法时给出行内错误提示（不只是 toast）。

**建议做法**：两处共用一个校验函数。项目**没有**装 zod（早前作为未使用依赖移除了），如果要用需重新安装；不想加依赖就用正则：

```ts
// 建议放 client/src/lib/validation.ts
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

**验收**：新增单测覆盖 `abc` / `a@` / `@b.com` / `a@b` 被拒、`a@b.com` 通过；Contact 与 Newsletter 两处都要覆盖。

---

## P1 — SEO 与正确性

### 3. OG 分享图是 SVG，主流社交平台不识别

**证据**

- `scripts/generate-og.js:76` — 输出 `${slug}.svg`
- `scripts/prerender.js` — `og:image` 指向 `/og/${slug}.svg`

**问题**：文件路径是通的（早前修过一次扩展名不匹配导致的 404），但 **Twitter/X、Facebook、微信、Telegram 均不支持 SVG 作为 og:image**，实际分享时会退化成无图或站点默认图。

**期望**：输出 PNG（1200×630）。

**建议做法**：引入 `sharp` 或 `@resvg/resvg-js`，在 `generate-og.js` 里把现有 SVG 渲染成 PNG。**这是本清单里唯一需要新增运行时/构建依赖的项**，请确认可接受再做。改完记得同步 `prerender.js` 里的扩展名。

**验收**

1. `npm run build` 后 `dist/public/og/` 下是 `.png`
2. 预渲染 HTML 里的 `og:image` 扩展名与之一致，且文件存在
3. 部署后用 [opengraph.xyz](https://www.opengraph.xyz/) 或微信/Twitter 实际抓一次，能看到图

---

### 4. sitemap 的 lastmod 用的是发布日期，不是修改时间

**证据**：`scripts/generate-feeds.js` 中 `<lastmod>${article.date}</lastmod>`

**问题**：文章更新后 `lastmod` 不变，搜索引擎不知道该重新抓取。

**期望**：`lastmod` 反映内容实际最后修改时间。

**建议做法**：优先读 frontmatter 的 `updated` 字段（需在 `validate-article.js` 里允许该可选字段），没有就回落到源文件的 mtime（`fs.statSync(sourcePath).mtime`）。注意 mtime 在 CI 上是 checkout 时间，不可靠——**推荐用 frontmatter 显式字段**。

**验收**：给某篇文章加 `updated: "2026-08-01"`，构建后 sitemap 中该条 `lastmod` 为该日期，其余不变。

---

### 5. RSS 只有摘要，没有正文

**证据**：`dist/public/rss.xml` 中 `content:encoded` 出现 0 次

**问题**：RSS 阅读器里只能看到一句描述，读者必须跳转，订阅价值低。

**期望**：加 `<content:encoded><![CDATA[...]]></content:encoded>`，内容为文章正文（Markdown 转 HTML）。

**建议做法**：`generate-feeds.js` 里读 `client/public/articles/${slug}.md`，剥掉 frontmatter，用 `marked` 或 `remark` 转 HTML。记得在 `<rss>` 上加 `xmlns:content="http://purl.org/rss/1.0/modules/content/"` 命名空间。

**验收**：`python3 -c "import xml.dom.minidom;xml.dom.minidom.parse('dist/public/rss.xml')"` 仍能解析；随便找个 RSS 阅读器订阅能看到全文。

---

### 6. sitemap 缺少标签页，且标签页当前不可被独立索引

**证据**

- `dist/public/sitemap.xml` 共 15 条，只有 4 个静态页 + 11 篇文章
- `client/src/components/SEO.tsx:113` — canonical 固定去掉查询串

**问题**：归档页用 `?tag=React` 做筛选，但 canonical 统一指向 `/archive`，所以标签页既不在 sitemap 里、也不会被单独收录。

**这是一个待决策项，不是明确的 bug**：

- 若**不希望**标签页被收录（避免薄内容页）→ 当前行为正确，**什么都不用做**，只需在 `SEO.tsx:113` 补一行注释说明这是有意为之
- 若**希望**被收录 → 需要改成路径路由 `/tag/:name`（而不是查询串），补预渲染、补 sitemap、canonical 指向该路径

**请先与作者确认取向再动手。**

---

### 7. 未找到的文章没有 noindex

**证据**：`client/src/components/SEO.tsx` 中无任何 `robots` meta

**问题**：`/article/<不存在的slug>` 返回 HTTP 200 + SPA 外壳（这是刻意设计，见第 11 项），前端渲染「文章未找到」。搜索引擎可能把这类软 404 页面收录。

**期望**：`SEO` 组件支持 `noindex?: boolean`，为 true 时写入 `<meta name="robots" content="noindex">`；`Article.tsx` 的 notFound 分支和 `NotFound.tsx` 都传 true。

**注意**：`SEO.tsx` 现在有一套「切换页面时清理上一页残留标签」的机制（`removeMetaByName` / `removeMetaByProperty`）。新增的 robots 标签**必须一并纳入清理**，否则从 404 页跳到正常页会残留 noindex——那会导致正常页面被移出索引，后果比现在严重。

**验收**：新增导航测试——先渲染 `noindex`，再渲染普通页面，断言 `meta[name="robots"]` 已被移除。测试写法可参考 `tests/f8_seo_feeds.test.tsx` 里现有的「SPA 导航」用例。

---

## P2 — 性能与体验

### 8. 图片未声明尺寸，造成布局偏移（CLS）

**证据**：8 处 `<img>` 无 `width`/`height`

| 文件                                 | 数量 |
| ------------------------------------ | ---- |
| `client/src/pages/Home.tsx`          | 4    |
| `client/src/components/Markdown.tsx` | 2    |
| `client/src/pages/About.tsx`         | 1    |
| `client/src/pages/Article.tsx`       | 1    |

**期望**：给固定尺寸的图（头像、hero）加显式 `width`/`height`；正文图片用 `aspect-ratio` CSS 占位。

**验收**：Lighthouse 的 CLS 指标改善，目标 < 0.1。

---

### 9. 构建产物有 332 个 JS 分片

**证据**：`ls dist/public/assets/*.js | wc -l` → 332

**问题**：绝大多数是 `react-syntax-highlighter` 的按需语言包。虽然懒加载不影响首屏，但产物文件数量过多，部署与缓存管理都变重。

**期望**：只注册文章里实际用到的语言。

**建议做法**：`client/src/components/Markdown.tsx` 目前用 `prism-async-light` 自动按需加载。改为显式 `registerLanguage` 白名单——先统计现有文章用到的语言：

````bash
grep -ohE '^```[a-z]+' articles/*.md | sort | uniq -c | sort -rn
````

**验收**：分片数显著下降；随便打开几篇含代码的文章，高亮仍正常（`tests/f3_markdown.test.tsx` 有高亮用例，必须仍过）。

---

### 10. 未适配 prefers-reduced-motion

**证据**：`client/src/index.css` 中 `prefers-reduced-motion` 出现 0 次

**问题**：站点动画较多（`animate-pulse` 光环、`animate-line` 标题逐行入场、滚动淡入、hover 缩放）。对前庭功能敏感的用户，系统里开了「减少动态效果」也无效。

**期望**：在 `client/src/index.css` 末尾加全局兜底：

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**注意**：`useInView` 的滚动淡入是靠 `opacity-0 → opacity-100` 实现的。如果动画被禁用，要确认内容**最终仍然可见**，不能停在 `opacity-0`。

**验收**：macOS 系统设置勾选「减弱动态效果」后访问，页面无动画且**所有内容可见**。

---

## P3 — 内容与维护

### 11. ⚠️ 路由配置的历史教训（不是待办，是警告）

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
| `/og/nope.svg`                   | 404，且**不是** HTML                        |

`curl -s <url> | grep '<title>'` 即可验证。**只看配置文件推不出结果。**

---

### 12. 实习经历的地点与机构名不匹配（需作者确认）

**证据**：`client/src/pages/About.tsx:149` — `"绥化正达律师事务所 · 上海"`

绥化在黑龙江，标注却是上海。三种可能：该所在上海有办公室（保持现状）／实习地点在绥化（改成「· 绥化」）／机构全名另有前缀。**必须问作者，不要自行猜测修改。**

---

### 13. 仓库位于 iCloud 同步目录下

**证据**：仓库路径为 `~/Desktop/blog`，macOS 桌面默认参与 iCloud 同步。

**已造成过两次真实故障**：

1. `node_modules` 内文件进入不一致状态，`lru-cache` 的 CJS 入口 require 后返回空对象，**整个测试套件无法收集**（9 个 error，0 个测试）——重装 `node_modules` 才恢复
2. iCloud 在 `.git/refs/heads/` 下生成了 `main 2`、以及 `.git/index 2`，含空格的 ref 名导致 **`git push` 直接失败**（`bad object refs/heads/main 2`）

此外还批量生成过 11 个 `* 2.*` 冲突副本，其中两个进了 `articles/`，导致 `articles.json` 从 11 条变 13 条、多出带空格的 slug。**这一类现在有 `validate-article.js` 兜底，但 `node_modules` 与 `.git` 不在校验范围内。**

**建议**：`mv ~/Desktop/blog ~/code/blog`（需作者操作）。这是根治办法，属于环境问题而非代码问题。

---

## 优先级汇总

| #   | 事项            | 优先级 | 是否需新增依赖  | 是否需作者决策 |
| --- | --------------- | ------ | --------------- | -------------- |
| 1   | 主题闪烁 FOUC   | P0     | 否              | 否             |
| 2   | 邮箱格式校验    | P0     | 可选（zod）     | 否             |
| 3   | OG 图转 PNG     | P1     | **是**（sharp） | 是             |
| 4   | sitemap lastmod | P1     | 否              | 否             |
| 5   | RSS 全文        | P1     | 是（marked）    | 否             |
| 6   | 标签页收录      | P1     | 否              | **是（取向）** |
| 7   | 404 noindex     | P1     | 否              | 否             |
| 8   | 图片尺寸 / CLS  | P2     | 否              | 否             |
| 9   | 收窄 prism 语言 | P2     | 否              | 否             |
| 10  | reduced-motion  | P2     | 否              | 否             |
| 11  | 路由改动警告    | —      | —               | —              |
| 12  | 实习地点        | P3     | 否              | **是**         |
| 13  | 移出 iCloud     | P3     | 否              | **是**         |

**建议顺序**：1 → 2 → 7 → 10 → 8 → 4 → 5 → 9 → 3（3 涉及新依赖，放最后）。
6、12、13 先问作者。
