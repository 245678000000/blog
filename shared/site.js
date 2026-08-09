// 站点级配置的唯一来源。
// 同时被前端（Vite，import.meta.env）和构建脚本（Node，process.env）引用，
// 所以这里只放与运行时无关的常量，域名由各自的调用方从环境变量解析。

export const SITE_NAME = "邢鹏的博客";
export const SITE_AUTHOR = "邢鹏";
export const SITE_DESCRIPTION =
  "法学硕士 | AI Native 开发者 | Prompt 工程师。用 Code 和 AI 工具解决真实世界问题，擅长将 Idea 快速转化为 Demo。";
export const SITE_DESCRIPTION_SHORT =
  "法学硕士 | AI Native 开发者 | Prompt 工程师";

// 未配置 VITE_SITE_URL 时的兜底域名
export const DEFAULT_SITE_URL = "https://www.tthhhh.ggff.net";

// Node 侧（构建脚本）解析站点域名
export function resolveSiteUrl(env = process.env) {
  return env.VITE_SITE_URL || DEFAULT_SITE_URL;
}

// 转义 XML/HTML 文本节点与属性值。
// 文章标题、分类、标签均为自由文本，未转义的 & 或 < 会让 RSS/Sitemap 变成非法 XML。
export function escapeXml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// 把 HTML 里的站内绝对路径补成完整 URL。
// RSS 阅读器在自己的域名下渲染 content:encoded，不会按本站解析 /images/xxx，
// 不处理的话全文里的图片和站内链接到了阅读器里就是死链。
// 只动以单个 / 开头的 src/href：http(s):、mailto:、#锚点、//protocol-relative 都保持原样。
export function absolutizeLinks(html, siteUrl) {
  return String(html ?? "").replace(
    /\s(src|href)="\/(?!\/)([^"]*)"/g,
    (_, attr, rest) => ` ${attr}="${siteUrl}/${rest}"`
  );
}
