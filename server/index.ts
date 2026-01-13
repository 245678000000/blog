import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 文章类型定义
interface Article {
  slug: string;
  title: string;
  date: string;
  category: string;
  readTime: string;
  description: string;
  image: string;
  published: boolean;
}

// 从 articles.json 加载文章数据
function loadArticlesData(staticPath: string): Article[] {
  try {
    const articlesJsonPath = path.join(staticPath, "articles", "articles.json");
    const data = readFileSync(articlesJsonPath, "utf-8");
    return JSON.parse(data) as Article[];
  } catch (error) {
    console.error("Failed to load articles.json:", error);
    return [];
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  const siteUrl = process.env.SITE_URL || "https://yourdomain.com";

  // Sitemap endpoint
  app.get("/sitemap.xml", async (_req, res) => {
    const articlesData = loadArticlesData(staticPath);
    const publishedArticles = articlesData.filter((a) => a.published);

    const urls = [
      // 首页
      `  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
      // 文章页
      ...publishedArticles.map((article) => `  <url>
    <loc>${siteUrl}/article/${article.slug}</loc>
    <lastmod>${article.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`),
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(sitemap);
  });

  // RSS Feed endpoint
  app.get("/rss.xml", async (_req, res) => {
    const articlesData = loadArticlesData(staticPath);
    const rssItems = articlesData
      .filter((a) => a.published)
      .map((article) => {
        const articleUrl = `${siteUrl}/article/${article.slug}`;
        return `    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${articleUrl}</link>
      <guid>${articleUrl}</guid>
      <description><![CDATA[${article.description}]]></description>
      <category>${article.category}</category>
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
    </item>`;
      })
      .join("\n");

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

    res.set("Content-Type", "application/rss+xml");
    res.send(rss);
  });

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
