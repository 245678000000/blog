// 预渲染页面的 <head> 注入片段。
//
// 抽成纯函数有两个原因：一是 scripts/prerender.js 此前只给文章页拼了完整的
// og:* / canonical，静态页只换了 title 和 description，分享出去的卡片全是首页；
// 两条代码路径分开写就是这么漂移的。二是它不碰 fs，可以直接单测（tests/f16）。

import { escapeXml } from "./site.js";

// og:image / twitter:image 必须是绝对 URL：抓取器在自己的域名下解析这些值，
// 不会按当前页面补全相对路径。
export function absolutizeUrl(pathOrUrl, siteUrl) {
  const value = String(pathOrUrl ?? "");
  return /^https?:\/\//.test(value) ? value : `${siteUrl}${value}`;
}

/**
 * @param {object} page
 * @param {string} page.siteUrl        站点域名，不带结尾斜杠
 * @param {string} page.siteName
 * @param {string} page.siteAuthor
 * @param {string} page.path           站内路径，必须以 / 开头（canonical 与 og:url 的来源）
 * @param {string} page.fullTitle      <title> 的完整内容（调用方自行决定要不要带站名后缀）
 * @param {string} [page.schemaTitle]  结构化数据里的标题，默认取 fullTitle。
 *                                     文章要传不带站名后缀的纯标题：schema.org 的
 *                                     headline 指的是文章标题本身，带上「 - 站名」
 *                                     既不准确又白占 Google 建议的 110 字上限。
 * @param {string} page.description
 * @param {string} page.image          站内绝对路径或完整 URL
 * @param {"website"|"article"} [page.type]
 * @param {string} [page.publishedTime] 仅 article
 * @returns {string} 注入 </head> 之前的 HTML
 */
export function buildHeadMeta({
  siteUrl,
  siteName,
  siteAuthor,
  path,
  fullTitle,
  schemaTitle = fullTitle,
  description,
  image,
  type = "website",
  publishedTime,
}) {
  const url = `${siteUrl}${path}`;
  const imageUrl = absolutizeUrl(image, siteUrl);
  const isArticle = type === "article";

  // 首页是站点本身，内页是站点下的一个页面——schema.org 上是两个类型
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isArticle ? "Article" : path === "/" ? "WebSite" : "WebPage",
    ...(isArticle ? { headline: schemaTitle } : { name: schemaTitle }),
    description,
    url,
    image: imageUrl,
    author: { "@type": "Person", name: siteAuthor },
    ...(isArticle && publishedTime ? { datePublished: publishedTime } : {}),
  };

  const tags = [
    `<meta property="og:type" content="${escapeXml(type)}" />`,
    `<meta property="og:url" content="${escapeXml(url)}" />`,
    `<meta property="og:title" content="${escapeXml(fullTitle)}" />`,
    `<meta property="og:description" content="${escapeXml(description)}" />`,
    `<meta property="og:image" content="${escapeXml(imageUrl)}" />`,
    // stripDefaultSocialMeta 会把模板里的 og:site_name 一起删掉，这里必须补回来
    `<meta property="og:site_name" content="${escapeXml(siteName)}" />`,
    ...(isArticle && publishedTime
      ? [
          `<meta property="article:published_time" content="${escapeXml(publishedTime)}" />`,
          `<meta property="article:author" content="${escapeXml(siteAuthor)}" />`,
        ]
      : []),
    `<meta name="twitter:card" content="summary_large_image" />`,
    // twitter:title 此前用的是不带站名的标题，和 og:title 对不上，统一成 fullTitle
    `<meta name="twitter:title" content="${escapeXml(fullTitle)}" />`,
    `<meta name="twitter:description" content="${escapeXml(description)}" />`,
    `<meta name="twitter:image" content="${escapeXml(imageUrl)}" />`,
    `<link rel="canonical" href="${escapeXml(url)}" />`,
    // id 必须和 SEO.tsx 里那份对上：客户端是按 id 查找后复用同一个节点的，
    // 不带 id 的话 React 挂载后会再插一份，同一页出现两块互相打架的结构化数据
    `<script id="structured-data" type="application/ld+json">${JSON.stringify(
      jsonLd
    ).replace(/</g, "\\u003c")}</script>`,
  ];

  return tags.map(tag => `    ${tag}`).join("\n");
}
