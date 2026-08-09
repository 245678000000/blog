/**
 * 构建时生成 RSS 和 Sitemap 静态文件
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";
import matter from "gray-matter";
import {
  SITE_NAME,
  SITE_DESCRIPTION_SHORT,
  resolveSiteUrl,
  escapeXml,
  absolutizeLinks,
} from "../shared/site.js";
import { HOME_PAGE, STATIC_PAGES } from "../shared/pages.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const siteUrl = resolveSiteUrl();

// 读取文章数据
const articlesPath = path.join(
  __dirname,
  "../client/public/articles/articles.json"
);
const articlesData = JSON.parse(fs.readFileSync(articlesPath, "utf-8"));

// 只获取已发布的文章
const publishedArticles = articlesData.filter(
  article => article.published !== false
);

// 配置 marked：启用 GFM、换行转 <br>，与前端 react-markdown 行为接近
marked.setOptions({
  gfm: true,
  breaks: false,
});

// 读取文章正文并转为 HTML，用于 RSS content:encoded。
// 读源文件（已同步到 client/public/articles/），剥掉 frontmatter 后用 marked 渲染。
function getArticleHtml(slug) {
  const mdPath = path.join(__dirname, `../client/public/articles/${slug}.md`);
  if (!fs.existsSync(mdPath)) return "";
  try {
    const { content } = matter(fs.readFileSync(mdPath, "utf-8"));
    return absolutizeLinks(marked.parse(content), siteUrl);
  } catch {
    return "";
  }
}

// 生成 RSS Feed
function generateRSS() {
  const rssItems = publishedArticles
    .map(article => {
      const articleUrl = `${siteUrl}/article/${article.slug}`;
      const tags = article.tags
        ? article.tags
            .map(tag => `<category>${escapeXml(tag)}</category>`)
            .join("\n      ")
        : "";
      // 全文正文（Markdown → HTML），让 RSS 阅读器无需跳转即可阅读
      const contentHtml = getArticleHtml(article.slug);
      const contentEncoded = contentHtml
        ? `<content:encoded><![CDATA[${contentHtml}]]></content:encoded>`
        : "";
      return `    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${escapeXml(articleUrl)}</link>
      <guid>${escapeXml(articleUrl)}</guid>
      <description><![CDATA[${article.description}]]></description>
      ${contentEncoded}
      <category>${escapeXml(article.category)}</category>
      ${tags}
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${siteUrl}/</link>
    <description>${escapeXml(SITE_DESCRIPTION_SHORT)}</description>
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
  // 清单来自 shared/pages.js，和 prerender.js 生成静态 HTML 用的是同一份。
  // 分开各写一份的时候，加页面漏改一处就是「能访问但不进 sitemap」。
  const staticPages = [
    { url: HOME_PAGE.path, ...HOME_PAGE },
    ...STATIC_PAGES.map(page => ({
      url: `/${page.slug}`,
      priority: page.priority,
      changefreq: page.changefreq,
    })),
  ];

  const staticUrls = staticPages
    .map(
      page => `  <url>
    <loc>${siteUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join("\n");

  const articleUrls = publishedArticles
    .map(
      article => `  <url>
    <loc>${escapeXml(`${siteUrl}/article/${article.slug}`)}</loc>
    <lastmod>${article.updated || article.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${articleUrls}
</urlset>`;

  return sitemap;
}

// 生成 robots.txt
// 放在这里而不是 client/public/ 下当静态文件：Sitemap 指令必须写绝对 URL，
// 而域名只有构建期才知道（resolveSiteUrl）。硬编码在静态文件里换域名就会失效。
function generateRobots() {
  return `# 本文件由 scripts/generate-feeds.js 构建期生成，不要手工编辑。
# 域名来自 VITE_SITE_URL，改域名无需改这里。

User-agent: *
Allow: /

# API 端点没有可索引内容
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`;
}

// 确保输出目录存在
const outputDir = path.join(__dirname, "../dist/public");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 写入文件
fs.writeFileSync(path.join(outputDir, "rss.xml"), generateRSS());
fs.writeFileSync(path.join(outputDir, "sitemap.xml"), generateSitemap());
fs.writeFileSync(path.join(outputDir, "robots.txt"), generateRobots());

console.log("✅ Generated rss.xml, sitemap.xml and robots.txt");
