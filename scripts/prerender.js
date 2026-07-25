/**
 * 构建时预渲染：为每篇文章生成带完整 meta 标签的静态 HTML
 * 搜索引擎爬虫可直接读取文章内容，无需执行 JavaScript
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const siteUrl = process.env.VITE_SITE_URL || 'https://www.tthhhh.ggff.net';
const siteName = '邢鹏的博客';

// 读取文章数据
const articlesPath = path.join(__dirname, '../client/public/articles/articles.json');
const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));
const publishedArticles = articlesData.filter(a => a.published !== false);

// 读取 index.html 模板
const distDir = path.join(__dirname, '../dist/public');
const templatePath = path.join(distDir, 'index.html');
const template = fs.readFileSync(templatePath, 'utf-8');

// 简单 Markdown 转纯文本（取摘要）
function markdownToText(md) {
  return md
    .replace(/^---[\s\S]*?---\s*/m, '') // 移除 frontmatter
    .replace(/[#*_`~\[\]()>!|-]/g, '')   // 移除 Markdown 标记
    .replace(/\n+/g, ' ')                // 合并换行
    .trim();
}

// 生成文章的预渲染 HTML
function generateArticleHtml(article) {
  const articleUrl = `${siteUrl}/article/${article.slug}`;
  const ogImage = `${siteUrl}/og/${article.slug}.png`;
  const description = article.description || '';

  // 尝试读取文章内容生成摘要
  let excerpt = description;
  const mdPath = path.join(__dirname, `../client/public/articles/${article.slug}.md`);
  if (fs.existsSync(mdPath)) {
    const content = fs.readFileSync(mdPath, 'utf-8');
    const text = markdownToText(content);
    excerpt = text.slice(0, 200) + (text.length > 200 ? '...' : '');
  }

  const metaTags = `
    <title>${article.title} - ${siteName}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${articleUrl}" />
    <meta property="og:title" content="${article.title} - ${siteName}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="article:published_time" content="${article.date}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${article.title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />
    <link rel="canonical" href="${articleUrl}" />
    <script type="application/ld+json">
    ${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "description": description,
      "datePublished": article.date,
      "author": { "@type": "Person", "name": "邢鹏" },
      "url": articleUrl,
      "image": ogImage
    })}
    </script>`;

  // 替换模板中的 title 和 meta 标签
  let html = template
    .replace(/<title>.*?<\/title>/, `<title>${article.title} - ${siteName}</title>`)
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${description}" />`
    );

  // 在 </head> 前注入 OG 标签和结构化数据
  html = html.replace('</head>', `${metaTags}\n  </head>`);

  // 在 <div id="root"> 中注入文章摘要（供爬虫读取）
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"><article style="display:none"><h1>${article.title}</h1><p>${excerpt}</p></article></div>`
  );

  return html;
}

// 为每篇文章生成静态 HTML
const articleDir = path.join(distDir, 'article');
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
  { slug: 'archive', title: '文章归档', desc: `共 ${publishedArticles.length} 篇文章` },
  { slug: 'about', title: '关于我', desc: '邢鹏 - 法学硕士 | AI Native 开发者' },
  { slug: 'contact', title: '联系我', desc: '有问题或想法？随时联系我！' },
];

for (const page of staticPages) {
  let html = template
    .replace(/<title>.*?<\/title>/, `<title>${page.title} - ${siteName}</title>`)
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${page.desc}" />`
    );
  fs.writeFileSync(path.join(distDir, `${page.slug}.html`), html);
  count++;
}

console.log(`✅ Pre-rendered ${count} static HTML pages`);
