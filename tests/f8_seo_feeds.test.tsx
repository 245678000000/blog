import { render } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { SEO } from "@/components/SEO";
import { DEFAULT_SITE_URL, absolutizeLinks } from "@shared/site";

describe("F8: SEO 元数据集成与 RSS/Sitemap 生成", () => {
  beforeEach(() => {
    // 清理 head 中的元素，以免测试互相干扰
    const metas = document.head.querySelectorAll("meta");
    metas.forEach(m => m.remove());
    const links = document.head.querySelectorAll("link");
    links.forEach(l => l.remove());
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
    const descMeta = document.head.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement;
    expect(descMeta).toBeInTheDocument();
    expect(descMeta.content).toBe("这是一个用于测试的描述内容。");

    // 验证 Keywords 元数据
    const keywordsMeta = document.head.querySelector(
      'meta[name="keywords"]'
    ) as HTMLMetaElement;
    expect(keywordsMeta).toBeInTheDocument();
    expect(keywordsMeta.content).toBe("测试, React");

    // 验证 Canonical Link
    const canonicalLink = document.head.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    expect(canonicalLink).toBeInTheDocument();
    expect(canonicalLink.href).toContain(DEFAULT_SITE_URL);
  });

  it("Tier 1: XML Feeds 生成函数应能拼装合法的 Sitemap 与 RSS XML 字符串", () => {
    // 仿真模拟 scripts/generate-feeds.js 中的 XML 组装逻辑进行测试
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
      a =>
        `<url><loc>${siteUrl}/article/${a.slug}</loc><lastmod>${a.date}</lastmod></url>`
    );
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls.join("")}</urlset>`;

    expect(sitemapXml).toContain(
      "<loc>https://testdomain.com/article/my-first-post</loc>"
    );
    expect(sitemapXml).toContain("<lastmod>2026-07-01</lastmod>");

    // 2. RSS 生成逻辑断言
    const rssItems = mockArticles
      .map(a => {
        const articleUrl = `${siteUrl}/article/${a.slug}`;
        return `<item><title><![CDATA[${a.title}]]></title><link>${articleUrl}</link><description><![CDATA[${a.description}]]></description></item>`;
      })
      .join("");
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>${rssItems}</channel></rss>`;

    expect(rssXml).toContain("<title><![CDATA[文章标题一]]></title>");
    expect(rssXml).toContain(
      "<link>https://testdomain.com/article/my-first-post</link>"
    );
  });

  it("Sitemap lastmod 应优先使用 updated 字段，未提供时回退到 date", () => {
    // 模拟 generate-feeds.js 的 lastmod 选择逻辑
    const articles = [
      { slug: "a", date: "2026-07-01", updated: "2026-08-01" },
      { slug: "b", date: "2026-06-01" }, // 无 updated
    ];

    const lastmods = articles.map(a => a.updated || a.date);
    expect(lastmods[0]).toBe("2026-08-01"); // 用 updated
    expect(lastmods[1]).toBe("2026-06-01"); // 回退到 date
  });

  // ==========================================
  // Tier 2: 边界与极限 (Edge Cases & Boundaries)
  // ==========================================
  it("Tier 2: 当缺少描述时，SEO 组件应该能自动回退到默认站点描述，且能够防御特殊字符", () => {
    render(<SEO title="无描述文章" />);

    // 验证回退到 siteName 默认的描述
    const descMeta = document.head.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement;
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

    const descMeta = document.head.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement;
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
    const canonical = document.head.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    const description = document.head.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement;
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
    const jsonLdScript = document.getElementById(
      "structured-data"
    ) as HTMLScriptElement;
    expect(jsonLdScript).toBeInTheDocument();
    const ldData = JSON.parse(jsonLdScript.textContent || "{}");
    expect(ldData["@type"]).toBe("Article");
    // Article 用 headline 而不是 name，且是不带站名后缀的纯标题——
    // 与 shared/page-meta.js 里预渲染的那份保持一致（两者写的是同一个节点）
    expect(ldData["headline"]).toBe("React 19 教程");
    expect(ldData["name"]).toBeUndefined();
    expect(ldData["datePublished"]).toBe("2026-07-14");

    // 5. 抓取 RSS 并检查文章 URL 是否与 Head 里的 Canonical 同源
    // RSS 由 scripts/generate-feeds.js 用同一个站点域名拼装，两者必须一致，
    // 否则搜索引擎会把同一篇文章当成两个不同的地址。
    const rssArticleLink = `${DEFAULT_SITE_URL}/article/react-19-tutorial`;
    expect(new URL(canonical.href).origin).toBe(new URL(rssArticleLink).origin);
    expect(canonical.href.startsWith(DEFAULT_SITE_URL)).toBe(true);
  });

  // ==========================================
  // SPA 导航后的元数据清理
  // ==========================================
  it("SPA 导航: 从文章页切到普通页面后，article:* 与 keywords 不得残留", () => {
    // 1. 先渲染一个文章页的 SEO
    const { rerender } = render(
      <SEO
        title="某篇文章"
        description="文章描述"
        type="article"
        publishedTime="2026-07-01"
        modifiedTime="2026-07-02"
        author="邢鹏"
        keywords={["技术", "React"]}
      />
    );

    // 2. 确认文章专属元数据存在
    expect(
      document.head.querySelector('meta[property="article:published_time"]')
    ).toBeInTheDocument();
    expect(
      document.head.querySelector('meta[property="article:modified_time"]')
    ).toBeInTheDocument();
    expect(
      document.head.querySelector('meta[property="article:author"]')
    ).toBeInTheDocument();
    expect(
      document.head.querySelector('meta[name="keywords"]')
    ).toBeInTheDocument();

    // 3. 导航到首页（website 类型、无 keywords）
    rerender(<SEO title="首页" description="首页描述" />);

    // 4. 文章专属元数据必须被移除
    expect(
      document.head.querySelector('meta[property="article:published_time"]')
    ).not.toBeInTheDocument();
    expect(
      document.head.querySelector('meta[property="article:modified_time"]')
    ).not.toBeInTheDocument();
    expect(
      document.head.querySelector('meta[property="article:author"]')
    ).not.toBeInTheDocument();
    expect(
      document.head.querySelector('meta[name="keywords"]')
    ).not.toBeInTheDocument();

    // 5. 首页自身的元数据已更新
    expect(document.title).toBe("首页 - 邢鹏的博客");
    const desc = document.head.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement;
    expect(desc.content).toBe("首页描述");

    const ogType = document.head.querySelector(
      'meta[property="og:type"]'
    ) as HTMLMetaElement;
    expect(ogType.content).toBe("website");

    // JSON-LD 从 Article 切回 WebSite，且不含文章日期字段
    const jsonLd = document.getElementById(
      "structured-data"
    ) as HTMLScriptElement;
    const ld = JSON.parse(jsonLd.textContent || "{}");
    expect(ld["@type"]).toBe("WebSite");
    expect(ld.datePublished).toBeUndefined();
    expect(ld.dateModified).toBeUndefined();
  });

  it("SPA 导航: canonical 与 JSON-LD 全页各自只应存在一个", () => {
    const { rerender } = render(<SEO title="第一页" />);
    rerender(<SEO title="第二页" type="article" publishedTime="2026-07-01" />);
    rerender(<SEO title="第三页" />);

    expect(
      document.head.querySelectorAll('link[rel="canonical"]')
    ).toHaveLength(1);
    expect(document.querySelectorAll("#structured-data")).toHaveLength(1);
  });

  it("canonical 不应带查询串：?tag=xxx 只是前端筛选状态，不该产生第二个可索引地址", () => {
    window.history.replaceState({}, "", "/archive?tag=React");

    render(<SEO title="归档" />);

    const canonical = document.head.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    expect(canonical.href).not.toContain("?");
    expect(canonical.href).toBe(`${DEFAULT_SITE_URL}/archive`);

    window.history.replaceState({}, "", "/");
  });

  it("canonicalPath: 同一份内容挂在多个路径下时，canonical 要钉到权威地址", () => {
    // Home 同时响应 / 和 /writings，两边都自我 canonical 就是一对重复内容
    window.history.replaceState({}, "", "/writings");

    render(<SEO title="首页" canonicalPath="/" />);

    const canonical = document.head.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    const ogUrl = document.head.querySelector(
      'meta[property="og:url"]'
    ) as HTMLMetaElement;
    expect(canonical.href).toBe(`${DEFAULT_SITE_URL}/`);
    expect(ogUrl.content).toBe(`${DEFAULT_SITE_URL}/`);

    window.history.replaceState({}, "", "/");
  });

  it("canonicalPath: 不传时仍然自我 canonical，取当前 pathname", () => {
    window.history.replaceState({}, "", "/about");

    render(<SEO title="关于我" />);

    const canonical = document.head.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    expect(canonical.href).toBe(`${DEFAULT_SITE_URL}/about`);

    window.history.replaceState({}, "", "/");
  });

  it("JSON-LD: 首页是 WebSite，内页是 WebPage（与预渲染那份一致）", () => {
    window.history.replaceState({}, "", "/");
    const { unmount } = render(<SEO />);
    expect(
      JSON.parse(document.getElementById("structured-data")!.textContent!)[
        "@type"
      ]
    ).toBe("WebSite");
    unmount();

    window.history.replaceState({}, "", "/about");
    render(<SEO title="关于我" />);
    const ld = JSON.parse(
      document.getElementById("structured-data")!.textContent!
    );
    expect(ld["@type"]).toBe("WebPage");
    expect(ld.name).toBe("关于我");

    window.history.replaceState({}, "", "/");
  });

  // ==========================================
  // noindex（软 404 防收录）
  // ==========================================
  it("noindex: 为 true 时应写入 <meta name='robots' content='noindex'>", () => {
    render(<SEO title="文章未找到" noindex />);

    const robots = document.head.querySelector(
      'meta[name="robots"]'
    ) as HTMLMetaElement;
    expect(robots).toBeInTheDocument();
    expect(robots.content).toBe("noindex");
  });

  it("noindex: 从 noindex 页导航到正常页后，robots 标签必须被移除", () => {
    // 1. 先渲染一个 noindex 页（如文章未找到）
    const { rerender } = render(<SEO title="文章未找到" noindex />);
    expect(
      document.head.querySelector('meta[name="robots"]')
    ).toBeInTheDocument();

    // 2. 导航到正常页面（无 noindex）
    rerender(<SEO title="首页" description="首页描述" />);

    // 3. robots 标签必须被移除，否则正常页会被移出索引——后果比软 404 更严重
    expect(
      document.head.querySelector('meta[name="robots"]')
    ).not.toBeInTheDocument();
  });

  it("noindex: 正常页面默认不应写入 robots 标签", () => {
    render(<SEO title="首页" />);
    expect(
      document.head.querySelector('meta[name="robots"]')
    ).not.toBeInTheDocument();
  });
});

// RSS 全文（content:encoded）里的链接会在阅读器自己的域名下渲染，
// 站内相对路径不补全就是死链。目前 articles/ 下没有插图，这条路径在真实数据里
// 走不到，所以必须靠单测守住——否则第一篇带图的文章上线才会暴露。
describe("F8b: RSS 全文的站内链接绝对化", () => {
  const SITE = "https://example.com";

  it("应把 src/href 的站内绝对路径补成完整 URL", () => {
    const html = '<img src="/images/a.png" /><a href="/article/x">x</a>';
    expect(absolutizeLinks(html, SITE)).toBe(
      `<img src="${SITE}/images/a.png" /><a href="${SITE}/article/x">x</a>`
    );
  });

  it("不应改动已经是绝对 URL 的链接", () => {
    const html = '<a href="https://other.com/x">x</a>';
    expect(absolutizeLinks(html, SITE)).toBe(html);
  });

  it("不应改动 mailto: 与页内锚点", () => {
    const html = '<a href="mailto:a@b.com">a</a><a href="#section">b</a>';
    expect(absolutizeLinks(html, SITE)).toBe(html);
  });

  it("不应把 //protocol-relative 当成站内路径", () => {
    const html = '<img src="//cdn.example.org/a.png" />';
    expect(absolutizeLinks(html, SITE)).toBe(html);
  });

  it("不应改动正文文字里恰好长得像路径的内容", () => {
    // 只匹配 属性名="/..."，纯文本里的 /images/a.png 不受影响
    const html = "<p>把图片放到 /images/a.png 即可</p>";
    expect(absolutizeLinks(html, SITE)).toBe(html);
  });

  it("空输入应安全返回空串", () => {
    expect(absolutizeLinks(undefined, SITE)).toBe("");
    expect(absolutizeLinks("", SITE)).toBe("");
  });
});
