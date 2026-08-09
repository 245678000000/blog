/**
 * 构建时预渲染：为每个页面生成带完整 meta 标签的静态 HTML
 * 搜索引擎爬虫可直接读取，无需执行 JavaScript
 *
 * 文章页和静态页走同一条路径（buildHeadMeta）。此前是两套：文章页拼了完整的
 * og:* / twitter:* / canonical，静态页只替换了 title 和 description，
 * og:title 仍是模板里的站点默认值——分享 /about 出来的卡片是首页。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  SITE_NAME,
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  resolveSiteUrl,
  escapeXml,
} from "../shared/site.js";
import { buildHeadMeta } from "../shared/page-meta.js";
import { STATIC_PAGES } from "../shared/pages.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const siteUrl = resolveSiteUrl();
const siteName = SITE_NAME;

// 站点默认分享图，由 generate-og.js 产出
const DEFAULT_OG_IMAGE = "/og/default.png";

// 读取文章数据
const articlesPath = path.join(
  __dirname,
  "../client/public/articles/articles.json"
);
const articlesData = JSON.parse(fs.readFileSync(articlesPath, "utf-8"));
const publishedArticles = articlesData.filter(a => a.published !== false);

// 读取 index.html 模板
const distDir = path.join(__dirname, "../dist/public");
const templatePath = path.join(distDir, "index.html");
const template = fs.readFileSync(templatePath, "utf-8");

// index.html 里带有一套站点默认的 og:* / twitter:* 标签。
// 抓取器对重复的 og 属性取第一个，所以注入页面专属标签前必须先把默认的删掉，
// 否则每个页面的分享卡片都会退回站点默认值。
function stripDefaultSocialMeta(html) {
  return html.replace(
    /^[ \t]*<meta\s+(?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>\n?/gm,
    ""
  );
}

// 简单 Markdown 转纯文本（取摘要）
function markdownToText(md) {
  return md
    .replace(/^---[\s\S]*?---\s*/m, "") // 移除 frontmatter
    .replace(/[#*_`~[\]()>!|-]/g, "") // 移除 Markdown 标记
    .replace(/\n+/g, " ") // 合并换行
    .trim();
}

/**
 * 把一个页面渲染成完整 HTML。
 * @param {object} page  见 buildHeadMeta 的参数，另加可选的 bodyPreview
 */
function renderPage({ bodyPreview, ...page }) {
  const meta = buildHeadMeta({
    siteUrl,
    siteName,
    siteAuthor: SITE_AUTHOR,
    ...page,
  });

  let html = stripDefaultSocialMeta(template)
    .replace(
      /<title>.*?<\/title>/,
      `<title>${escapeXml(page.fullTitle)}</title>`
    )
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${escapeXml(page.description)}" />`
    );

  html = html.replace("</head>", `${meta}\n  </head>`);

  if (bodyPreview) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${bodyPreview}</div>`
    );
  }

  return html;
}

// 文章正文摘要，供爬虫在 JS 执行前读到
function articlePreview(article) {
  let excerpt = article.description || "";
  const mdPath = path.join(
    __dirname,
    `../client/public/articles/${article.slug}.md`
  );
  if (fs.existsSync(mdPath)) {
    const text = markdownToText(fs.readFileSync(mdPath, "utf-8"));
    excerpt = text.slice(0, 200) + (text.length > 200 ? "..." : "");
  }
  return `<article style="display:none"><h1>${escapeXml(article.title)}</h1><p>${escapeXml(excerpt)}</p></article>`;
}

let count = 0;

// ---- 文章页 ----
const articleDir = path.join(distDir, "article");
if (!fs.existsSync(articleDir)) {
  fs.mkdirSync(articleDir, { recursive: true });
}

for (const article of publishedArticles) {
  const html = renderPage({
    path: `/article/${article.slug}`,
    fullTitle: `${article.title} - ${siteName}`,
    schemaTitle: article.title,
    description: article.description || "",
    // generate-og.js 产出的是 .png（SVG 不被主流社交平台支持），扩展名必须与之一致
    image: `/og/${article.slug}.png`,
    type: "article",
    publishedTime: article.date,
    bodyPreview: articlePreview(article),
  });
  fs.writeFileSync(path.join(articleDir, `${article.slug}.html`), html);
  count++;
}

// ---- 静态页 ----
// 清单来自 shared/pages.js，和 generate-feeds.js 的 sitemap 同源。
// NON_INDEXED_ALIASES 里的路径有意不在其中，说明见那边的注释。
for (const page of STATIC_PAGES) {
  const html = renderPage({
    path: `/${page.slug}`,
    fullTitle: `${page.title} - ${siteName}`,
    schemaTitle: page.title,
    description: page.description({ articleCount: publishedArticles.length }),
    image: DEFAULT_OG_IMAGE,
  });
  fs.writeFileSync(path.join(distDir, `${page.slug}.html`), html);
  count++;
}

// ---- 首页 ----
// 覆盖 index.html 本身：它既是首页，也是所有 SPA 回退路由拿到的外壳。
fs.writeFileSync(
  templatePath,
  renderPage({
    path: "/",
    fullTitle: siteName,
    description: SITE_DESCRIPTION,
    image: DEFAULT_OG_IMAGE,
  })
);
count++;

console.log(`✅ Pre-rendered ${count} static HTML pages`);
