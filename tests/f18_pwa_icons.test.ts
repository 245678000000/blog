import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * F18: PWA 图标
 *
 * manifest 里声明的每个图标都必须真的会被生成。这两者分处两个文件
 *（manifest.json 手写、图标由 scripts/generate-icons.js 产出），
 * 加一个尺寸时很容易只改一边——而后果是安装横幅不出现或者图标空白，
 * 只有在真机上装一次才发现。
 */

const ROOT = path.join(__dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "client/public/manifest.json"), "utf-8")
);
const iconScript = fs.readFileSync(
  path.join(ROOT, "scripts/generate-icons.js"),
  "utf-8"
);
const indexHtml = fs.readFileSync(
  path.join(ROOT, "client/index.html"),
  "utf-8"
);

describe("F18: PWA 图标", () => {
  it("Tier 1: manifest 里每个位图图标都要有生成它的代码", () => {
    const bitmaps = manifest.icons.filter(
      (i: { type: string }) => i.type === "image/png"
    );
    expect(bitmaps.length).toBeGreaterThan(0);

    for (const icon of bitmaps) {
      const file = path.basename(icon.src);
      expect(
        iconScript,
        `manifest 声明了 ${icon.src}，但 generate-icons.js 不会生成它`
      ).toContain(file);
    }
  });

  it("Tier 1: Android 安装横幅要求的 192 与 512 都在（只有 SVG 装不上）", () => {
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  it("Tier 1: 必须有一张 maskable，否则 Android 会给图标加一圈白底", () => {
    const maskable = manifest.icons.filter((i: { purpose: string }) =>
      i.purpose?.split(" ").includes("maskable")
    );
    expect(maskable).toHaveLength(1);
    expect(maskable[0].sizes).toBe("512x512");
  });

  it("Tier 1: iOS 不看 manifest，必须单独有 apple-touch-icon", () => {
    const match = indexHtml.match(
      /<link\s+rel="apple-touch-icon"\s+href="([^"]*)"/
    );
    expect(match, "index.html 缺少 apple-touch-icon").not.toBeNull();
    expect(iconScript).toContain(path.basename(match![1]));
  });

  it("Tier 2: 图标目录要在 vercel.json 的 rewrite 排除列表里", () => {
    // 不排除的话，缺失的图标会被 SPA 回退成 index.html，
    // 拿到一份 200 的 HTML 当 PNG 解析，排查起来比 404 难得多
    const vercel = fs.readFileSync(path.join(ROOT, "vercel.json"), "utf-8");
    const rewrite = JSON.parse(vercel).rewrites[0].source;
    expect(rewrite).toContain("icons");

    // 顺带验一下这条负向断言真的挡得住
    const re = new RegExp(`^${rewrite}$`);
    expect(re.test("/icons/icon-192.png")).toBe(false);
    expect(re.test("/about")).toBe(true);
  });
});
