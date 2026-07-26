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
}

const siteName = SITE_NAME;
const defaultDescription = SITE_DESCRIPTION;
// 使用 Vite 环境变量 (需要 VITE_ 前缀)
const siteUrl = import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL;
const defaultImage = `${siteUrl}/images/hero-bg.jpg`;

export function SEO({
  title,
  description = defaultDescription,
  image = defaultImage,
  type = "website",
  publishedTime,
  modifiedTime,
  author = SITE_AUTHOR,
  keywords = [],
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

    // Open Graph / Facebook
    // canonical/og:url 固定不带查询串与 hash：?tag=xxx 之类只是前端筛选状态，
    // 带上会让同一篇内容产生多个可索引地址。
    const currentUrl = `${siteUrl}${window.location.pathname}`;
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

    const structuredData: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": type === "article" ? "Article" : "WebSite",
      name: fullTitle,
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
    description,
    imageUrl,
    type,
    publishedTime,
    modifiedTime,
    author,
    keywordsKey,
  ]);

  return null; // 这个组件不渲染任何内容
}
