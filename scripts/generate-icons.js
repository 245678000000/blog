/**
 * 构建期从 favicon.svg 生成 PWA 图标。
 *
 * manifest 此前只声明了一个 SVG 图标。Android 的安装横幅要求至少有一张
 * 192×192 和一张 512×512 的位图，光有 SVG 是装不上的；iOS 则完全不看 manifest，
 * 只认 <link rel="apple-touch-icon">。
 *
 * 产物写进 dist/public/icons/，源文件只有 favicon.svg 一份——
 * 改 logo 只改那一个文件，不用手工导出一堆尺寸。
 * 代价是 `npm run dev` 下这些路径是 404，只影响本地装 PWA。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE = path.join(__dirname, "../client/public/favicon.svg");
const OUT_DIR = path.join(__dirname, "../dist/public/icons");

// density 给高一点，librsvg 才会以足够精度栅格化再缩放，否则 512 会糊
const svg = () => sharp(SOURCE, { density: 600 });

// 满幅无圆角的变体，maskable 与 apple-touch-icon 都用它。
// 两者的形状都由系统决定（前者裁成圆形/水滴/方形，后者 iOS 加自己的圆角），
// 图本身再带一层圆角就是「卡片套卡片」，而透明角在 iOS 上会被填成黑色。
// 这里把 favicon.svg 的 rx 去掉当满幅背景用，渐变和配色都保留。
// 底部那条装饰线的两端落在中心 46% 处、略超出 40% 的安全区半径，
// 圆形遮罩下可能被磨掉一点——装饰线而已，可以接受；XP 主体在 37% 以内，安全。
function maskableSvg() {
  const source = fs.readFileSync(SOURCE, "utf-8").replace(/\s+rx="6"/, "");
  if (source.includes('rx="6"')) {
    throw new Error(
      "favicon.svg 的背景圆角属性没能去掉——改过 favicon.svg 的话请同步改这里的匹配，" +
        "否则 maskable 图标会带上自己的圆角，被系统再裁一次就露边。"
    );
  }
  return sharp(Buffer.from(source), { density: 600 });
}

async function renderPlain(size, file) {
  await svg().resize(size, size).png({ compressionLevel: 9 }).toFile(file);
  return file;
}

async function renderMaskable(size, file) {
  await maskableSvg()
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(file);
  return file;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const written = await Promise.all([
  renderPlain(192, path.join(OUT_DIR, "icon-192.png")),
  renderPlain(512, path.join(OUT_DIR, "icon-512.png")),
  renderMaskable(512, path.join(OUT_DIR, "icon-maskable-512.png")),
  renderMaskable(180, path.join(OUT_DIR, "apple-touch-icon.png")),
]);

for (const file of written) {
  const { size } = fs.statSync(file);
  console.log(
    `   ${path.basename(file).padEnd(24)} ${Math.round(size / 1024)}KB`
  );
}

console.log(`✅ Generated ${written.length} PWA icons from favicon.svg`);
