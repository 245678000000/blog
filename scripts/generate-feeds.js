/**
 * 构建时生成 RSS 和 Sitemap 静态文件
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const siteUrl = process.env.VITE_SITE_URL || 'https://blog-seven-gules.vercel.app';

// 读取文章数据
const articlesPath = path.join(__dirname, '../client/public/articles/articles.json');
const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));

// 只获取已发布的文章
const publishedArticles = articlesData.filter(article => article.published !== false);

// 生成 RSS Feed
function generateRSS() {
  const rssItems = publishedArticles
    .map(article => {
      const articleUrl = `${siteUrl}/article/${article.slug}`;
      const tags = article.tags ? article.tags.map(tag => `<category>${tag}</category>`).join('\n      ') : '';
      return `    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${articleUrl}</link>
      <guid>${articleUrl}</guid>
      <description><![CDATA[${article.description}]]></description>
      <category>${article.category}</category>
      ${tags}
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
    </item>`;
    })
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>邢鹏的博客</title>
    <link>${siteUrl}/</link>
    <description>法学硕士 | AI Native 开发者 | Prompt 工程师</description>
    <language>zh-CN</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rssItems}
  </channel>
</rss>`;

  return rss;
}

// 生成 Sitemap
function generateSitemap() {
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/archive', priority: '0.8', changefreq: 'weekly' },
    { url: '/about', priority: '0.7', changefreq: 'monthly' },
    { url: '/contact', priority: '0.6', changefreq: 'monthly' },
  ];

  const staticUrls = staticPages.map(page => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');

  const articleUrls = publishedArticles.map(article => `  <url>
    <loc>${siteUrl}/article/${article.slug}</loc>
    <lastmod>${article.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${articleUrls}
</urlset>`;

  return sitemap;
}

// 确保输出目录存在
const outputDir = path.join(__dirname, '../dist/public');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 写入文件
fs.writeFileSync(path.join(outputDir, 'rss.xml'), generateRSS());
fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), generateSitemap());

console.log('✅ Generated rss.xml and sitemap.xml');
