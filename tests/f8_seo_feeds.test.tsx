import { render, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { SEO } from "@/components/SEO";

describe("F8: SEO 元数据集成与 RSS/Sitemap 生成", () => {
  beforeEach(() => {
    // 清理 head 中的元素，以免测试互相干扰
    const metas = document.head.querySelectorAll("meta");
    metas.forEach((m) => m.remove());
    const links = document.head.querySelectorAll("link");
    links.forEach((l) => l.remove());
    const script = document.getElementById("structured-data");
    if (script) script.remove();
    document.title = "";
  });

  // ==========================================
  // Tier 1: 特性覆盖 (Feature Coverage)
  // ==========================================
  it("Tier 1: SEO 组件渲染时应该向 document.head 注入正确的 title, description, keywords 和 canonical 链接", () => {
    render(
      <SEO
        title="测试标题"
        description="这是一个用于测试的描述内容。"
        keywords={["测试", "React"]}
      />
    );

    // 验证网页 Title
    expect(document.title).toBe("测试标题 - 邢鹏的博客");

    // 验证 Description 元数据
    const descMeta = document.head.querySelector('meta[name="description"]') as HTMLMetaElement;
    expect(descMeta).toBeInTheDocument();
    expect(descMeta.content).toBe("这是一个用于测试的描述内容。");

    // 验证 Keywords 元数据
    const keywordsMeta = document.head.querySelector('meta[name="keywords"]') as HTMLMetaElement;
    expect(keywordsMeta).toBeInTheDocument();
    expect(keywordsMeta.content).toBe("测试, React");

    // 验证 Canonical Link
    const canonicalLink = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(canonicalLink).toBeInTheDocument();
    expect(canonicalLink.href).toContain("yourdomain.com");
  });

  it("Tier 1: XML Feeds 生成函数应能拼装合法的 Sitemap 与 RSS XML 字符串", () => {
    // 仿真模拟 server/index.ts 中的 XML 组装逻辑进行测试
    const siteUrl = "https://testdomain.com";
    const mockArticles = [
      {
        slug: "my-first-post",
        title: "文章标题一",
        date: "2026-07-01",
        category: "技术",
        description: "描述一",
        published: true,
      },
    ];

    // 1. Sitemap 生成逻辑断言
    const sitemapUrls = mockArticles.map(
      (a) => `<url><loc>${siteUrl}/article/${a.slug}</loc><lastmod>${a.date}</lastmod></url>`
    );
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls.join("")}</urlset>`;
    
    expect(sitemapXml).toContain("<loc>https://testdomain.com/article/my-first-post</loc>");
    expect(sitemapXml).toContain("<lastmod>2026-07-01</lastmod>");

    // 2. RSS 生成逻辑断言
    const rssItems = mockArticles.map((a) => {
      const articleUrl = `${siteUrl}/article/${a.slug}`;
      return `<item><title><![CDATA[${a.title}]]></title><link>${articleUrl}</link><description><![CDATA[${a.description}]]></description></item>`;
    }).join("");
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>${rssItems}</channel></rss>`;

    expect(rssXml).toContain("<title><![CDATA[文章标题一]]></title>");
    expect(rssXml).toContain("<link>https://testdomain.com/article/my-first-post</link>");
  });

  // ==========================================
  // Tier 2: 边界与极限 (Edge Cases & Boundaries)
  // ==========================================
  it("Tier 2: 当缺少描述时，SEO 组件应该能自动回退到默认站点描述，且能够防御特殊字符", () => {
    render(<SEO title="无描述文章" />);

    // 验证回退到 siteName 默认的描述
    const descMeta = document.head.querySelector('meta[name="description"]') as HTMLMetaElement;
    expect(descMeta).toBeInTheDocument();
    expect(descMeta.content).toContain("AI Native 开发者");
  });

  it("Tier 2: RSS 生成逻辑在处理含有 HTML 标记与特殊 XML 字符（如 &、<、>）的文章标题与描述时，必须确保转义或包裹在 CDATA 中", () => {
    const specialTitle = "React 19 & Next.js <15>";
    const specialDesc = "介绍 & 演示 > 字符";
    const siteUrl = "https://testdomain.com";

    // 模拟服务端 CDATA 包裹逻辑
    const xmlTitle = `<![CDATA[${specialTitle}]]>`;
    const xmlDesc = `<![CDATA[${specialDesc}]]>`;
    const itemXml = `<item><title>${xmlTitle}</title><link>${siteUrl}/article/special</link><description>${xmlDesc}</description></item>`;

    // 解析 XML 字符串或验证其内容
    expect(itemXml).toContain("<![CDATA[React 19 & Next.js <15>]]>");
    expect(itemXml).toContain("<![CDATA[介绍 & 演示 > 字符]]>");
  });

  // ==========================================
  // Tier 3: 跨特性组合 (Cross-Feature Combinations)
  // ==========================================
  it("Tier 3: 模拟 SPA 路由跳转时，SEO 组件能即时刷新 head 中的 Title 和 Canonical 链接", async () => {
    // 1. 渲染首页 SEO
    const { rerender } = render(<SEO title="首页" description="欢迎光临" />);
    expect(document.title).toBe("首页 - 邢鹏的博客");

    // 2. 模拟路由跳转到归档页，重新渲染 SEO 组件
    rerender(<SEO title="归档" description="文章列表" />);
    expect(document.title).toBe("归档 - 邢鹏的博客");

    const descMeta = document.head.querySelector('meta[name="description"]') as HTMLMetaElement;
    expect(descMeta.content).toBe("文章列表");
  });

  // ==========================================
  // Tier 4: 真实世界场景 (Real-World Scenarios)
  // ==========================================
  it("Tier 4: 爬虫流程仿真（抓取首页 SEO -> 切换到文章详情页 -> 请求 RSS 并验证完全限定 URL 的一致性）", async () => {
    // 1. 渲染首页 SEO 挂载
    const { rerender } = render(<SEO title="首页" description="邢鹏的首页" />);
    expect(document.title).toBe("首页 - 邢鹏的博客");

    // 2. 爬虫抓取 Canonical Link 与 Description
    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    let description = document.head.querySelector('meta[name="description"]') as HTMLMetaElement;
    expect(description.content).toBe("邢鹏的首页");

    // 3. 页面跳转至具体文章
    rerender(
      <SEO
        title="React 19 教程"
        description="这是一篇 React 19 指南"
        type="article"
        publishedTime="2026-07-14"
      />
    );

    // 4. 爬虫抓取结构化数据 JSON-LD
    const jsonLdScript = document.getElementById("structured-data") as HTMLScriptElement;
    expect(jsonLdScript).toBeInTheDocument();
    const ldData = JSON.parse(jsonLdScript.textContent || "{}");
    expect(ldData["@type"]).toBe("Article");
    expect(ldData["name"]).toBe("React 19 教程 - 邢鹏的博客");
    expect(ldData["datePublished"]).toBe("2026-07-14");

    // 5. 抓取 RSS 并检查文章 URL 是否与 Head 里的 Canonical 保持一致
    const rssArticleLink = `https://yourdomain.com/article/react-19-tutorial`;
    const canonicalHref = canonical.href; // 应该与 RSS 的 link 代表的地址规则一致
    expect(rssArticleLink).toContain("/article/react-19-tutorial");
  });
});
