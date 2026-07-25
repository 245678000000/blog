/**
 * 构建时为每篇文章生成 OG Image (SVG 格式, 1200x630)
 * SVG 被大多数社交平台支持为 OG 图片
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取文章数据
const articlesPath = path.join(__dirname, '../client/public/articles/articles.json');
const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));
const publishedArticles = articlesData.filter(a => a.published !== false);

// 输出目录
const outputDir = path.join(__dirname, '../dist/public/og');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 文字转义
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 自动换行（按字符数截断）
function wrapText(text, maxChars) {
  const lines = [];
  let current = '';
  for (const char of text) {
    current += char;
    if (current.length >= maxChars) {
      lines.push(current);
      current = '';
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3); // 最多 3 行
}

// 生成 SVG OG 图片
function generateOgSvg(article) {
  const titleLines = wrapText(article.title, 20);
  const titleSvg = titleLines
    .map((line, i) => `<text x="80" y="${280 + i * 64}" font-family="serif" font-size="52" font-weight="bold" fill="#f0ece2">${escapeXml(line)}</text>`)
    .join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景 -->
  <rect width="1200" height="630" fill="#1a2420"/>
  <!-- 装饰线 -->
  <rect x="80" y="200" width="60" height="4" fill="#c9a84c"/>
  <!-- 分类标签 -->
  <text x="80" y="180" font-family="monospace" font-size="20" fill="#c9a84c" letter-spacing="2">${escapeXml(article.category.toUpperCase())}</text>
  <!-- 标题 -->
  ${titleSvg}
  <!-- 底部信息 -->
  <text x="80" y="560" font-family="sans-serif" font-size="24" fill="#8a9a8e">邢鹏 · ${article.date}</text>
  <text x="1120" y="560" font-family="serif" font-size="24" fill="#8a9a8e" text-anchor="end">xingpeng.blog</text>
  <!-- 底部装饰 -->
  <rect x="0" y="620" width="1200" height="10" fill="#c9a84c" opacity="0.6"/>
</svg>`;
}

// 为每篇文章生成 OG 图片
let count = 0;
for (const article of publishedArticles) {
  const svg = generateOgSvg(article);
  fs.writeFileSync(path.join(outputDir, `${article.slug}.svg`), svg);
  count++;
}

// 生成首页默认 OG 图片
const defaultSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#1a2420"/>
  <rect x="80" y="260" width="60" height="4" fill="#c9a84c"/>
  <text x="80" y="240" font-family="monospace" font-size="20" fill="#c9a84c" letter-spacing="2">XING PENG</text>
  <text x="80" y="330" font-family="serif" font-size="56" font-weight="bold" fill="#f0ece2">邢鹏的博客</text>
  <text x="80" y="400" font-family="sans-serif" font-size="28" fill="#8a9a8e">用 Code 和 AI 解决问题，拒绝空谈。</text>
  <rect x="0" y="620" width="1200" height="10" fill="#c9a84c" opacity="0.6"/>
</svg>`;
fs.writeFileSync(path.join(outputDir, 'default.svg'), defaultSvg);
count++;

console.log(`✅ Generated ${count} OG images (SVG)`);
