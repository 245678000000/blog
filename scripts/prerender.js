/**
 * 构建时预渲染：为每篇文章生成带完整 meta 标签的静态 HTML
 * 搜索引擎爬虫可直接读取文章内容，无需执行 JavaScript
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  SITE_NAME,
  SITE_AUTHOR,
  resolveSiteUrl,
  escapeXml,
} from "../shared/site.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const siteUrl = resolveSiteUrl();
const siteName = SITE_NAME;

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
// 抓取器对重复的 og 属性取第一个，所以注入文章专属标签前必须先把默认的删掉，
// 否则每篇文章的分享卡片都会退回站点默认图。
function stripDefaultSocialMeta(html) {
  return html.replace(
    /^[ \t]*<meta\s+(?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>\n?/gm,
    ""
  );
}

// og:image / twitter:image 必须是绝对 URL，抓取器不会按当前页面解析相对路径。
// 模板里写的是 /images/hero-bg.jpg，这里补上域名。
function absolutizeSocialImages(html) {
  return html.replace(
    /(<meta\s+(?:property="og:image"|name="twitter:image")\s+content=")(\/[^"]*)"/g,
    (_m, prefix, relativePath) => `${prefix}${siteUrl}${relativePath}"`
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

// 生成文章的预渲染 HTML
function generateArticleHtml(article) {
  const articleUrl = `${siteUrl}/article/${article.slug}`;
  // generate-og.js 产出的是 .svg，扩展名必须与之一致，否则 OG 图全部 404
  const ogImage = `${siteUrl}/og/${article.slug}.svg`;
  const description = article.description || "";
  const fullTitle = `${article.title} - ${siteName}`;

  // 尝试读取文章内容生成摘要
  let excerpt = description;
  const mdPath = path.join(
    __dirname,
    `../client/public/articles/${article.slug}.md`
  );
  if (fs.existsSync(mdPath)) {
    const content = fs.readFileSync(mdPath, "utf-8");
    const text = markdownToText(content);
    excerpt = text.slice(0, 200) + (text.length > 200 ? "..." : "");
  }

  // 标题/描述是自由文本，注入 HTML 属性前必须转义，否则引号会截断属性
  const metaTags = `
    <title>${escapeXml(fullTitle)}</title>
    <meta name="description" content="${escapeXml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeXml(articleUrl)}" />
    <meta property="og:title" content="${escapeXml(fullTitle)}" />
    <meta property="og:description" content="${escapeXml(description)}" />
    <meta property="og:image" content="${escapeXml(ogImage)}" />
    <meta property="article:published_time" content="${escapeXml(article.date)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeXml(article.title)}" />
    <meta name="twitter:description" content="${escapeXml(description)}" />
    <meta name="twitter:image" content="${escapeXml(ogImage)}" />
    <link rel="canonical" href="${escapeXml(articleUrl)}" />
    <script type="application/ld+json">
    ${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: description,
      datePublished: article.date,
      author: { "@type": "Person", name: SITE_AUTHOR },
      url: articleUrl,
      image: ogImage,
    }).replace(/</g, "\\u003c")}
    </script>`;

  // 替换模板中的 title 和 meta 标签
  let html = stripDefaultSocialMeta(template)
    .replace(/<title>.*?<\/title>/, `<title>${escapeXml(fullTitle)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${escapeXml(description)}" />`
    );

  // 在 </head> 前注入 OG 标签和结构化数据
  html = html.replace("</head>", `${metaTags}\n  </head>`);

  // 在 <div id="root"> 中注入文章摘要（供爬虫读取）
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"><article style="display:none"><h1>${escapeXml(article.title)}</h1><p>${escapeXml(excerpt)}</p></article></div>`
  );

  return html;
}

// 为每篇文章生成静态 HTML
const articleDir = path.join(distDir, "article");
if (!fs.existsSync(articleDir)) {
  fs.mkdirSync(articleDir, { recursive: true });
}

let count = 0;
for (const article of publishedArticles) {
  const html = generateArticleHtml(article);
  const outputPath = path.join(articleDir, `${article.slug}.html`);
  fs.writeFileSync(outputPath, html);
  count++;
}

// 为静态页面也生成预渲染版本
const staticPages = [
  {
    slug: "archive",
    title: "文章归档",
    desc: `共 ${publishedArticles.length} 篇文章`,
  },
  {
    slug: "about",
    title: "关于我",
    desc: `${SITE_AUTHOR} - 法学硕士 | AI Native 开发者`,
  },
  { slug: "contact", title: "联系我", desc: "有问题或想法？随时联系我！" },
];

for (const page of staticPages) {
  let html = absolutizeSocialImages(template)
    .replace(
      /<title>.*?<\/title>/,
      `<title>${escapeXml(`${page.title} - ${siteName}`)}</title>`
    )
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${escapeXml(page.desc)}" />`
    );
  fs.writeFileSync(path.join(distDir, `${page.slug}.html`), html);
  count++;
}

// 首页同样需要绝对 og:image
fs.writeFileSync(templatePath, absolutizeSocialImages(template));

console.log(`✅ Pre-rendered ${count} static HTML pages`);
