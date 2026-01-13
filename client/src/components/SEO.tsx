import { useEffect } from "react";

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

const siteName = "邢鹏的博客";
const defaultDescription = "法学硕士 | AI Native 开发者 | Prompt 工程师。用 Code 和 AI 工具解决真实世界问题，擅长将 Idea 快速转化为 Demo。";
// 使用 Vite 环境变量 (需要 VITE_ 前缀)
const siteUrl = import.meta.env.VITE_SITE_URL || "https://yourdomain.com";
const defaultImage = `${siteUrl}/images/hero-bg.jpg`;

export function SEO({
  title,
  description = defaultDescription,
  image = defaultImage,
  type = "website",
  publishedTime,
  modifiedTime,
  author = "邢鹏",
  keywords = [],
}: SEOProps) {
  const fullTitle = title ? `${title} - ${siteName}` : siteName;
  const imageUrl = image.startsWith("http") ? image : `${siteUrl}${image}`;

  useEffect(() => {
    // 设置页面标题
    document.title = fullTitle;

    // 更新或创建 meta 标签
    const setMeta = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement("meta");
        element.name = name;
        document.head.appendChild(element);
      }
      element.content = content;
    };

    const setProperty = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("property", property);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    const setLink = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!element) {
        element = document.createElement("link");
        element.rel = rel;
        document.head.appendChild(element);
      }
      element.href = href;
    };

    // 基础 meta 标签
    setMeta("description", description);
    if (keywords.length > 0) {
      setMeta("keywords", keywords.join(", "));
    }
    setMeta("author", author);

    // Open Graph / Facebook
    const currentUrl = `${siteUrl}${window.location.pathname}`;
    setProperty("og:type", type);
    setProperty("og:url", currentUrl);
    setProperty("og:title", fullTitle);
    setProperty("og:description", description);
    setProperty("og:image", imageUrl);
    setProperty("og:site_name", siteName);
    if (type === "article" && publishedTime) {
      setProperty("article:published_time", publishedTime);
    }
    if (type === "article" && modifiedTime) {
      setProperty("article:modified_time", modifiedTime);
    }
    if (type === "article" && author) {
      setProperty("article:author", author);
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
  }, [fullTitle, description, imageUrl, type, publishedTime, modifiedTime, author, keywords]);

  return null; // 这个组件不渲染任何内容
}
