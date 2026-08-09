import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { buildHeadMeta, absolutizeUrl } from "@shared/page-meta";
import {
  STATIC_PAGES,
  HOME_PAGE,
  NON_INDEXED_ALIASES,
} from "../shared/pages.js";

/**
 * F16: 预渲染页面的 <head> 注入
 *
 * 这里守的是「静态页和文章页共用同一条路径」。此前两条路径分开写，
 * 文章页拼了完整的 og:* / canonical，静态页只换了 title 和 description，
 * 于是分享 /about 出来的卡片是首页。
 */

const BASE = {
  siteUrl: "https://example.com",
  siteName: "邢鹏的博客",
  siteAuthor: "邢鹏",
};

function attr(html: string, selector: RegExp) {
  return html.match(selector)?.[1];
}

function jsonLd(html: string) {
  const raw = html.match(
    /<script id="structured-data" type="application\/ld\+json">(.*?)<\/script>/s
  )?.[1];
  return JSON.parse(raw!.replace(/\\u003c/g, "<"));
}

describe("F16: buildHeadMeta", () => {
  describe("静态页", () => {
    const html = buildHeadMeta({
      ...BASE,
      path: "/about",
      fullTitle: "关于我 - 邢鹏的博客",
      schemaTitle: "关于我",
      description: "邢鹏 - 法学硕士",
      image: "/og/default.png",
    });

    it("Tier 1: 静态页也要有自己的 canonical 与 og:url，而不是站点默认值", () => {
      expect(attr(html, /<link rel="canonical" href="([^"]*)"/)).toBe(
        "https://example.com/about"
      );
      expect(attr(html, /<meta property="og:url" content="([^"]*)"/)).toBe(
        "https://example.com/about"
      );
    });

    it("Tier 1: og:title / twitter:title 必须是页面标题，不能退回站名", () => {
      expect(attr(html, /<meta property="og:title" content="([^"]*)"/)).toBe(
        "关于我 - 邢鹏的博客"
      );
      // twitter:title 此前用的是不带站名的标题，和 og:title 对不上
      expect(attr(html, /<meta name="twitter:title" content="([^"]*)"/)).toBe(
        "关于我 - 邢鹏的博客"
      );
    });

    it("Tier 1: og:site_name 要补回来（stripDefaultSocialMeta 会把模板里那份删掉）", () => {
      expect(
        attr(html, /<meta property="og:site_name" content="([^"]*)"/)
      ).toBe("邢鹏的博客");
    });

    it("Tier 1: 图片必须绝对化，抓取器不会按当前页解析相对路径", () => {
      expect(attr(html, /<meta property="og:image" content="([^"]*)"/)).toBe(
        "https://example.com/og/default.png"
      );
    });

    it("Tier 1: 非文章页不应带 article:* 标签", () => {
      expect(html).not.toContain("article:published_time");
      expect(html).not.toContain("article:author");
      expect(attr(html, /<meta property="og:type" content="([^"]*)"/)).toBe(
        "website"
      );
    });

    it("Tier 1: 内页的结构化数据是 WebPage，用 name", () => {
      expect(jsonLd(html)).toMatchObject({
        "@type": "WebPage",
        name: "关于我",
        url: "https://example.com/about",
      });
    });
  });

  describe("文章页", () => {
    const html = buildHeadMeta({
      ...BASE,
      path: "/article/hello",
      fullTitle: "你好 - 邢鹏的博客",
      schemaTitle: "你好",
      description: "描述",
      image: "/og/hello.png",
      type: "article",
      publishedTime: "2026-01-01",
    });

    it("Tier 1: 应输出 article:* 与 og:type=article", () => {
      expect(attr(html, /<meta property="og:type" content="([^"]*)"/)).toBe(
        "article"
      );
      expect(
        attr(html, /<meta property="article:published_time" content="([^"]*)"/)
      ).toBe("2026-01-01");
      expect(
        attr(html, /<meta property="article:author" content="([^"]*)"/)
      ).toBe("邢鹏");
    });

    it("Tier 1: 结构化数据用 headline，且不带站名后缀", () => {
      const ld = jsonLd(html);
      expect(ld["@type"]).toBe("Article");
      // schema.org 的 headline 指文章标题本身，带上「 - 站名」既不准确
      // 又白占 Google 建议的 110 字上限
      expect(ld.headline).toBe("你好");
      expect(ld.name).toBeUndefined();
      expect(ld.datePublished).toBe("2026-01-01");
    });

    it("Tier 1: 结构化数据必须带 id，客户端才会复用同一个节点而不是再插一份", () => {
      expect(html).toContain('<script id="structured-data"');
    });
  });

  describe("首页", () => {
    it("Tier 1: 首页的结构化数据是 WebSite", () => {
      const html = buildHeadMeta({
        ...BASE,
        path: "/",
        fullTitle: "邢鹏的博客",
        description: "描述",
        image: "/og/default.png",
      });
      expect(jsonLd(html)["@type"]).toBe("WebSite");
      expect(attr(html, /<link rel="canonical" href="([^"]*)"/)).toBe(
        "https://example.com/"
      );
    });
  });

  describe("Tier 2: 转义与边界", () => {
    it("标题里的引号和尖括号必须转义，否则会截断属性", () => {
      const html = buildHeadMeta({
        ...BASE,
        path: "/article/x",
        fullTitle: `他说 "<script>" & 别的`,
        description: "a & b",
        image: "/og/x.png",
        type: "article",
      });
      expect(html).toContain("&quot;&lt;script&gt;&quot; &amp; ");
      // 属性没有被提前闭合：og:title 的值应该能完整取回
      expect(attr(html, /<meta property="og:title" content="([^"]*)"/)).toBe(
        "他说 &quot;&lt;script&gt;&quot; &amp; 别的"
      );
    });

    it("JSON-LD 里的 < 要转义成 \\u003c，防止提前闭合 script", () => {
      const html = buildHeadMeta({
        ...BASE,
        path: "/article/x",
        fullTitle: "t",
        description: "</script><img onerror=alert(1)>",
        image: "/og/x.png",
        type: "article",
      });
      const raw = html.match(
        /<script id="structured-data"[^>]*>(.*?)<\/script>/s
      )![1];
      expect(raw).not.toContain("</script>");
      expect(raw).toContain("\\u003c/script");
    });

    it("schemaTitle 省略时回落到 fullTitle", () => {
      const html = buildHeadMeta({
        ...BASE,
        path: "/x",
        fullTitle: "只有一个标题",
        description: "d",
        image: "/og/default.png",
      });
      expect(jsonLd(html).name).toBe("只有一个标题");
    });

    it("article 缺 publishedTime 时不应输出空的 article:published_time", () => {
      const html = buildHeadMeta({
        ...BASE,
        path: "/article/x",
        fullTitle: "t",
        description: "d",
        image: "/og/x.png",
        type: "article",
      });
      expect(html).not.toContain("article:published_time");
      expect(jsonLd(html).datePublished).toBeUndefined();
    });
  });

  // prerender.js 与 generate-feeds.js 已经共用 shared/pages.js，两者不会再漂移。
  // 剩下会漂的是 App.tsx 的路由：清单里加了页面但忘了加路由，sitemap 会向
  // 搜索引擎宣告一个只会渲染 NotFound 的地址。
  describe("Tier 3: 页面清单与路由的一致性", () => {
    const appSource = fs.readFileSync(
      path.join(__dirname, "../client/src/App.tsx"),
      "utf-8"
    );

    it("每个静态页都要有对应的 App.tsx 路由", () => {
      for (const page of STATIC_PAGES) {
        expect(appSource).toContain(`path={"/${page.slug}"}`);
      }
      expect(appSource).toContain(`path={"${HOME_PAGE.path}"}`);
    });

    it("有意不收录的别名路由要存在，但不能出现在静态页清单里", () => {
      const slugs = STATIC_PAGES.map(p => `/${p.slug}`);
      for (const alias of NON_INDEXED_ALIASES) {
        expect(appSource).toContain(`path={"${alias}"}`);
        expect(slugs).not.toContain(alias);
      }
    });

    it("description 是函数，且拿得到文章数", () => {
      const archive = STATIC_PAGES.find(p => p.slug === "archive")!;
      expect(archive.description({ articleCount: 42 })).toContain("42");
    });
  });

  describe("absolutizeUrl", () => {
    it("站内路径补域名，完整 URL 原样返回", () => {
      expect(absolutizeUrl("/og/a.png", "https://example.com")).toBe(
        "https://example.com/og/a.png"
      );
      expect(absolutizeUrl("https://cdn.io/a.png", "https://example.com")).toBe(
        "https://cdn.io/a.png"
      );
      expect(absolutizeUrl("http://cdn.io/a.png", "https://example.com")).toBe(
        "http://cdn.io/a.png"
      );
    });
  });
});
