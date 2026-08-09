// 非文章页面的唯一来源。
//
// 这份清单此前抄在两处：scripts/prerender.js 决定给哪些页面生成静态 HTML，
// scripts/generate-feeds.js 决定 sitemap 收录哪些地址。两边各写一份，
// 加页面时漏改一处就是「能访问但不进 sitemap」或者反过来，而且不会报错。
//
// 加页面要同时改 client/src/App.tsx 的路由——那个改不了，漏了会直接 404，
// 属于跑一次就能发现的问题。

import { SITE_AUTHOR } from "./site.js";

/**
 * @typedef {object} StaticPage
 * @property {string} slug        不带前导斜杠
 * @property {string} title       页面标题，不带站名后缀
 * @property {(ctx: { articleCount: number }) => string} description
 * @property {string} priority    sitemap
 * @property {string} changefreq  sitemap
 */

/** @type {StaticPage[]} */
export const STATIC_PAGES = [
  {
    slug: "archive",
    title: "文章归档",
    description: ({ articleCount }) => `共 ${articleCount} 篇文章`,
    priority: "0.8",
    changefreq: "weekly",
  },
  {
    slug: "about",
    title: "关于我",
    description: () => `${SITE_AUTHOR} - 法学硕士 | AI Native 开发者`,
    priority: "0.7",
    changefreq: "monthly",
  },
  {
    slug: "contact",
    title: "联系我",
    description: () => "有问题或想法？随时联系我！",
    priority: "0.6",
    changefreq: "monthly",
  },
];

// 首页单列：它的产物是 index.html 本身（同时也是所有 SPA 回退路由拿到的外壳），
// 描述取站点默认描述，和上面几个不是一回事。
export const HOME_PAGE = {
  path: "/",
  priority: "1.0",
  changefreq: "weekly",
};

// 有意不进 sitemap、也不单独预渲染的路径。
// /writings 与 / 是同一份内容，canonical 由 Home 统一钉在 /
//（见 client/src/pages/Home.tsx）；/advent-of-claude-2025 是旧短地址，
// App.tsx 里跳转到 /article/<slug>。两者都还有外链，所以路由保留，
// 但都不该产生第二个可索引地址。
export const NON_INDEXED_ALIASES = ["/writings", "/advent-of-claude-2025"];
