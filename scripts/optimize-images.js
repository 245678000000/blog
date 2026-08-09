/**
 * 构建期图片优化。
 *
 * 为什么需要这一步：`client/public/images/` 里放的是原图（手机/截图直出，
 * 单张 5–7MB、宽度 2700–4200px），vite 只会把 public/ 原样拷进 dist，
 * 于是首页首屏要拉 6MB 背景图 + 7.2MB 头像。这里在 vite build 之后
 * 就地重编码 dist 里的副本：源文件保持不动，改动只影响产物。
 *
 * 只压不改名：文件名和引用方式完全不变，组件侧零改动。
 * （WebP/AVIF 需要 <picture> 兜底，且 dev 下没有产物会 404，属于独立任务。）
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, "../dist/public/images");

// 默认上限：正文/卡片里最大的展示宽度是文章页的 max-w-3xl（768px），
// 2× DPR 下 1600 已经绰绰有余。
const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_JPEG_QUALITY = 78;

// 按实际展示尺寸收紧的例外。key 是文件名。
const OVERRIDES = {
  // 全屏背景图，且叠了 opacity-40 + 渐变遮罩，画质余量可以给得很低
  "hero-bg.jpg": { maxWidth: 1920, quality: 62 },
  // 只出现在直径 320px（Home）和 160px（About）的圆形头像里。
  // 源图是 16:9，object-cover 会裁掉两侧，所以按高度而不是宽度倒推：
  // 需要 height ≥ 640，对应 width ≥ 1145，取 1280。
  "xingpeng-avatar.jpg": { maxWidth: 1280, quality: 80 },
};

// 单张产物体积上限。超了就让构建失败——图片是这个站点最容易悄悄劣化的一项，
// 加一篇带 8MB 配图的文章不该能一路走到线上。
const MAX_OUTPUT_BYTES = 400 * 1024;

function formatSize(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${Math.round(bytes / 1024)}KB`;
}

async function optimize(file) {
  const filePath = path.join(IMAGES_DIR, file);
  const before = fs.statSync(filePath).size;
  const { maxWidth = DEFAULT_MAX_WIDTH, quality = DEFAULT_JPEG_QUALITY } =
    OVERRIDES[file] || {};

  const input = sharp(filePath);
  const { width, height } = await input.metadata();

  // 只缩不放：本来就比上限小的图不要被拉大
  const pipeline = input.resize({
    width: Math.min(width, maxWidth),
    withoutEnlargement: true,
  });

  const ext = path.extname(file).toLowerCase();
  const encoded =
    ext === ".png"
      ? // PNG 只对插画/截图这类色块图有效：palette 量化后能降一个量级。
        // 照片存成 PNG 是压不动的（`2025-cover.png` 1024×1024 量化完仍有 490KB，
        // 同一张转 JPEG 只要 132KB）——那种情况应该在源头改存 .jpg 并同步改
        // frontmatter 的 image 字段，而不是在这里硬调参数。
        await pipeline
          .png({ compressionLevel: 9, palette: true, colours: 128, effort: 10 })
          .toBuffer()
      : await pipeline
          .jpeg({ quality, mozjpeg: true, progressive: true })
          .toBuffer();

  // 极少数情况下重编码反而更大（源图本来就压得很狠），那就别动它
  if (encoded.length >= before) {
    return { file, before, after: before, width, height, skipped: true };
  }

  fs.writeFileSync(filePath, encoded);
  const after = await sharp(encoded).metadata();
  return {
    file,
    before,
    after: encoded.length,
    width: after.width,
    height: after.height,
  };
}

if (!fs.existsSync(IMAGES_DIR)) {
  console.log("⏭️  dist/public/images 不存在，跳过图片优化");
  process.exit(0);
}

const files = fs
  .readdirSync(IMAGES_DIR)
  .filter(f => /\.(jpe?g|png)$/i.test(f))
  .sort();

const results = await Promise.all(files.map(optimize));

let totalBefore = 0;
let totalAfter = 0;
const oversized = [];

for (const r of results) {
  totalBefore += r.before;
  totalAfter += r.after;
  const note = r.skipped ? "（已足够小，跳过）" : `→ ${r.width}×${r.height}`;
  console.log(
    `   ${r.file.padEnd(28)} ${formatSize(r.before).padStart(6)} → ${formatSize(
      r.after
    ).padStart(6)}  ${note}`
  );
  if (r.after > MAX_OUTPUT_BYTES) {
    oversized.push(`${r.file}（${formatSize(r.after)}）`);
  }
}

console.log(
  `✅ Optimized ${results.length} images: ${formatSize(totalBefore)} → ${formatSize(totalAfter)}`
);

if (oversized.length > 0) {
  throw new Error(
    `以下图片压缩后仍超过 ${formatSize(MAX_OUTPUT_BYTES)}：\n` +
      oversized.map(s => `  - ${s}`).join("\n") +
      `\n\n请先把源图裁到合理尺寸，或在 scripts/optimize-images.js 的 OVERRIDES 里` +
      `为它单独设置 maxWidth/quality。`
  );
}
