import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

/**
 * F19: Search Console 所有权验证
 *
 * Vercel 的 cleanUrls 会把 *.html 规范化成无扩展名路径，而 Google 的
 * HTML 文件验证明确不跟随重定向。因此所有权必须由首页 <head> 中的
 * google-site-verification 元标记兜底。
 */

const ROOT = path.join(__dirname, "..");
const indexHtml = fs.readFileSync(
  path.join(ROOT, "client/index.html"),
  "utf-8"
);

describe("F19: Search Console 所有权验证", () => {
  it("Tier 1: 首页 head 中保留 Search Console 给出的精确验证标签", () => {
    const head = indexHtml.match(/<head>([\s\S]*?)<\/head>/i)?.[1];

    expect(head).toBeDefined();
    expect(head).toMatch(
      /<meta\s+name="google-site-verification"\s+content="BFQnYIg_hMOwJGQmDVc4N6TULSJ0DQC6gQtujRfsZgk"\s*\/?>/
    );
  });

  it("Tier 2: 验证标签不能落到 body（爬虫不会把它当所有权证明）", () => {
    const body = indexHtml.match(/<body>([\s\S]*?)<\/body>/i)?.[1] ?? "";

    expect(body).not.toContain("google-site-verification");
  });
});
