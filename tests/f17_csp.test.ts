import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  checkCsp,
  collectInlineScriptHashes,
  getCspDirective,
  extractCsp,
} from "../scripts/check-csp.js";

/**
 * F17: CSP 与内联脚本哈希的一致性
 *
 * script-src 不带 'unsafe-inline'，靠写死 index.html 里内联脚本的 sha256。
 * 这套东西失败起来是静默的：哈希对不上，浏览器直接拦掉那段脚本，页面照常渲染，
 * 只是主题闪烁回来了、Service Worker 不再注册——而且本地永远发现不了，
 * dev 服务器不发 CSP。
 *
 * 构建期 scripts/check-csp.js 会校验 dist 产物；这里校验源文件，改完立刻红。
 */

const ROOT = path.join(__dirname, "..");
const indexHtml = fs.readFileSync(
  path.join(ROOT, "client/index.html"),
  "utf-8"
);
const vercelConfig = JSON.parse(
  fs.readFileSync(path.join(ROOT, "vercel.json"), "utf-8")
);
const csp = extractCsp(vercelConfig)!;

describe("F17: CSP 内联脚本哈希", () => {
  it("Tier 1: client/index.html 的内联脚本哈希必须都在 script-src 里", () => {
    expect(checkCsp(indexHtml, vercelConfig, "client/index.html")).toEqual([]);
  });

  it("Tier 1: script-src 不得含 'unsafe-inline'（有它哈希白名单就形同虚设）", () => {
    expect(getCspDirective(csp, "script-src")).not.toContain("'unsafe-inline'");
  });

  it("Tier 1: style-src 仍然需要 'unsafe-inline'", () => {
    // React 的 style={{}} 渲染成 style 属性，属性形式的内联不受 hash 覆盖，
    // 想去掉得先把 Home.tsx 里 animationDelay 那类写法全搬进 CSS
    expect(getCspDirective(csp, "style-src")).toContain("'unsafe-inline'");
  });

  it("Tier 1: index.html 的标签上不应再有内联事件属性（hash 覆盖不到）", () => {
    // 曾经字体 <link> 上挂着 onload="..."，那种写法要开 'unsafe-hashes' 才行。
    // 先把 <script> 内容剥掉：注释里提到 onload= 不算数
    const markup = indexHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/g, "");
    expect(markup).not.toMatch(/\son[a-z]+\s*=\s*["']/i);
  });

  it("Tier 2: 内联脚本改动一个空格就应该被抓出来", () => {
    const tampered = indexHtml.replace(
      "document.documentElement.classList.add(t);",
      "document.documentElement.classList.add(t); "
    );
    expect(tampered).not.toBe(indexHtml); // 确认替换真的发生了
    const errors = checkCsp(tampered, vercelConfig, "client/index.html");
    expect(errors.join("\n")).toContain("不在 CSP 的 script-src 中");
  });

  it("Tier 2: CSP 里留着对不上任何脚本的旧哈希也应该被抓出来", () => {
    const stale = {
      headers: [
        {
          headers: [
            {
              key: "Content-Security-Policy",
              // 追加到 script-src 里，而不是整串末尾——末尾是 worker-src
              value: csp.replace(
                "script-src 'self'",
                "script-src 'self' 'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='"
              ),
            },
          ],
        },
      ],
    };
    const errors = checkCsp(indexHtml, stale, "client/index.html");
    expect(errors.join("\n")).toContain("对不上任何内联脚本的哈希");
  });

  it("Tier 2: 带 src 的外链脚本与 ld+json 不需要哈希", () => {
    // ld+json 是数据块，浏览器不执行，严格 script-src 不会拦它（已实测）
    const html = `
      <script src="/assets/a.js"></script>
      <script type="application/ld+json">{"a":1}</script>
      <script>var x = 1;</script>
    `;
    expect(collectInlineScriptHashes(html)).toHaveLength(1);
  });

  it("Tier 3: 安全头齐全", () => {
    const globalRule = vercelConfig.headers.find(
      (r: { source: string }) => r.source === "/(.*)"
    );
    const keys = globalRule.headers.map((h: { key: string }) => h.key);
    expect(keys).toContain("Strict-Transport-Security");
    expect(keys).toContain("Content-Security-Policy");
    expect(keys).toContain("X-Content-Type-Options");
    expect(keys).toContain("Referrer-Policy");

    const hsts = globalRule.headers.find(
      (h: { key: string }) => h.key === "Strict-Transport-Security"
    ).value;
    expect(hsts).toMatch(/max-age=\d{7,}/); // 至少几个月
    // 有意不加 preload：提交 preload 列表要求 apex 域名也归自己控制，
    // 本站是 ggff.net 下的子域，写上去不会被受理
    expect(hsts).not.toContain("preload");
  });
});

describe("F17b: Cache-Control 分档", () => {
  function cacheControlFor(source: string) {
    const rule = vercelConfig.headers.find(
      (r: { source: string }) => r.source === source
    );
    return rule?.headers.find((h: { key: string }) => h.key === "Cache-Control")
      ?.value;
  }

  it("带内容哈希的构建产物才可以 immutable 永久缓存", () => {
    expect(cacheControlFor("/assets/(.*)")).toBe(
      "public, max-age=31536000, immutable"
    );
  });

  it("路径不带哈希的资源不能 immutable，否则换图后老访客永远看不到新的", () => {
    for (const source of ["/(images|og)/(.*)", "/articles/(.*)"]) {
      const value = cacheControlFor(source);
      expect(value).toBeDefined();
      expect(value).not.toContain("immutable");
      expect(value).toContain("stale-while-revalidate");
    }
  });

  it("sw.js 绝对不能长缓存，否则推不动新的 Service Worker", () => {
    expect(cacheControlFor("/sw.js")).toContain("max-age=0");
  });

  it("HTML 不设 Cache-Control，沿用平台默认的 must-revalidate", () => {
    // 加一条 /(.*) 的 Cache-Control 会把所有页面一起盖掉，包括预渲染的文章页
    const globalRule = vercelConfig.headers.find(
      (r: { source: string }) => r.source === "/(.*)"
    );
    const keys = globalRule.headers.map((h: { key: string }) => h.key);
    expect(keys).not.toContain("Cache-Control");
  });
});
