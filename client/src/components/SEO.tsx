import { useEffect } from "react";
import {
  SITE_NAME,
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  DEFAULT_SITE_URL,
} from "@shared/site";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
  // 为 true 时写入 <meta name="robots" content="noindex">，用于软 404 等不希望被收录的页面。
  // 必须纳入下方的清理机制：从 noindex 页跳到正常页时若不移除，正常页会被移出索引。
  noindex?: boolean;
  // 同一份内容挂在多个路径下时，用它把 canonical 钉到权威地址。
  // 默认取当前 pathname（自我 canonical）。
  // 例：Home 同时响应 / 和 /writings，两边都自我 canonical 就是一对重复内容，
  // 所以 Home 固定传 "/"。
  canonicalPath?: string;
}

const siteName = SITE_NAME;
const defaultDescription = SITE_DESCRIPTION;
// 使用 Vite 环境变量 (需要 VITE_ 前缀)
const siteUrl = import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL;
// scripts/generate-og.js 构建期产出的品牌卡片（1200x630 PNG），
// 比拿 hero 背景图当分享图更合适。注意它只存在于构建产物里，
// 开发服务器下这个路径是 404——只影响 meta 标签，不影响页面渲染。
const defaultImage = `${siteUrl}/og/default.png`;

export function SEO({
  title,
  description = defaultDescription,
  image = defaultImage,
  type = "website",
  publishedTime,
  modifiedTime,
  author = SITE_AUTHOR,
  keywords = [],
  noindex = false,
  canonicalPath,
}: SEOProps) {
  const fullTitle = title ? `${title} - ${siteName}` : siteName;
  const imageUrl = image.startsWith("http") ? image : `${siteUrl}${image}`;
  // 调用方几乎都传数组字面量，直接放进依赖数组会让 effect 每次渲染都重跑。
  // 折叠成字符串后依赖才是稳定的。
  const keywordsKey = keywords.join(", ");

  useEffect(() => {
    // 设置页面标题
    document.title = fullTitle;

    // 更新或创建 meta 标签
    const setMeta = (name: string, content: string) => {
      let element = document.querySelector(
        `meta[name="${name}"]`
      ) as HTMLMetaElement;
      if (!element) {
        element = document.createElement("meta");
        element.name = name;
        document.head.appendChild(element);
      }
      element.content = content;
    };

    const setProperty = (property: string, content: string) => {
      let element = document.querySelector(
        `meta[property="${property}"]`
      ) as HTMLMetaElement;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("property", property);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // 保证同一个 rel 全页只剩一个：多个 canonical 会让搜索引擎无法确定权威地址
    const setLink = (rel: string, href: string) => {
      const existing = document.querySelectorAll(`link[rel="${rel}"]`);
      existing.forEach((el, i) => {
        if (i > 0) el.remove();
      });
      let element = existing[0] as HTMLLinkElement | undefined;
      if (!element) {
        element = document.createElement("link");
        element.rel = rel;
        document.head.appendChild(element);
      }
      element.href = href;
    };

    // SPA 里 head 是跨路由复用的：只写不删，上一页的标签会一直留着。
    // 从文章页跳回首页后，article:* 和 keywords 会残留在首页上。
    // querySelectorAll 而不是 querySelector：历史上可能已经插入了重复标签。
    const removeMetaByName = (name: string) => {
      document
        .querySelectorAll(`meta[name="${name}"]`)
        .forEach(el => el.remove());
    };

    const removeMetaByProperty = (property: string) => {
      document
        .querySelectorAll(`meta[property="${property}"]`)
        .forEach(el => el.remove());
    };

    // 基础 meta 标签
    setMeta("description", description);
    if (keywordsKey) {
      setMeta("keywords", keywordsKey);
    } else {
      removeMetaByName("keywords");
    }
    setMeta("author", author);

    // robots: noindex 仅用于软 404 等不希望被收录的页面。
    // 从 noindex 页跳到正常页时必须移除，否则正常页会被移出索引。
    if (noindex) {
      setMeta("robots", "noindex");
    } else {
      removeMetaByName("robots");
    }

    // Open Graph / Facebook
    // canonical/og:url 固定不带查询串与 hash：?tag=xxx 之类只是前端筛选状态，
    // 带上会让同一篇内容产生多个可索引地址。
    // 注意：标签筛选页（/archive?tag=xxx）有意不单独收录——canonical 统一指向 /archive，
    // 既不进 sitemap 也不会产生独立可索引地址，避免薄内容页稀释权重。
    const currentUrl = `${siteUrl}${canonicalPath ?? window.location.pathname}`;
    setProperty("og:type", type);
    setProperty("og:url", currentUrl);
    setProperty("og:title", fullTitle);
    setProperty("og:description", description);
    setProperty("og:image", imageUrl);
    setProperty("og:site_name", siteName);

    // article:* 只属于文章页，切到普通页面必须清掉
    const isArticle = type === "article";
    if (isArticle && publishedTime) {
      setProperty("article:published_time", publishedTime);
    } else {
      removeMetaByProperty("article:published_time");
    }
    if (isArticle && modifiedTime) {
      setProperty("article:modified_time", modifiedTime);
    } else {
      removeMetaByProperty("article:modified_time");
    }
    if (isArticle && author) {
      setProperty("article:author", author);
    } else {
      removeMetaByProperty("article:author");
    }

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", imageUrl);

    // Canonical URL
    setLink("canonical", currentUrl);

    // JSON-LD 结构化数据
    const jsonLdId = "structured-data";
    let jsonLdElement = document.getElementById(jsonLdId) as HTMLScriptElement;
    if (!jsonLdElement) {
      jsonLdElement = document.createElement("script");
      jsonLdElement.id = jsonLdId;
      jsonLdElement.type = "application/ld+json";
      document.head.appendChild(jsonLdElement);
    }

    // 这块结构化数据在预渲染产物里已经有一份了（shared/page-meta.js，同一个
    // id="structured-data" 节点）。React 挂载后会覆盖它，所以两边的字段必须一致，
    // 否则爬虫在执行 JS 前后会读到两份不一样的数据。
    // - Article 用 headline 而不是 name，且不带「 - 站名」后缀：schema.org 的
    //   headline 指文章标题本身
    // - 非文章页首页是 WebSite，内页是 WebPage
    const schemaTitle = title || siteName;
    const structuredData: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": isArticle
        ? "Article"
        : new URL(currentUrl).pathname === "/"
          ? "WebSite"
          : "WebPage",
      ...(isArticle ? { headline: schemaTitle } : { name: schemaTitle }),
      description: description,
      url: currentUrl,
      image: imageUrl,
      author: {
        "@type": "Person",
        name: author,
      },
    };

    if (type === "article" && publishedTime) {
      structuredData.datePublished = publishedTime;
    }
    if (type === "article" && modifiedTime) {
      structuredData.dateModified = modifiedTime;
    }

    jsonLdElement.textContent = JSON.stringify(structuredData);
  }, [
    fullTitle,
    title,
    description,
    imageUrl,
    type,
    publishedTime,
    modifiedTime,
    author,
    keywordsKey,
    noindex,
    canonicalPath,
  ]);

  return null; // 这个组件不渲染任何内容
}
