// 阅读时间估算的唯一来源。
// 同时被前端（shared/articles.ts）和构建脚本（scripts/sync-articles.js）引用。

const CHINESE_CHARS_PER_MINUTE = 300;
const ENGLISH_WORDS_PER_MINUTE = 200;
const CJK_RANGE = /[一-龥]/g;

/**
 * 按中英文混排估算阅读时间。
 * @param {string} content 文章正文（不含 frontmatter）
 * @returns {string} 形如 "5 分钟"
 */
export function calculateReadTime(content) {
  // 统计中文字符
  const chineseChars = (content.match(CJK_RANGE) || []).length;
  // 统计英文单词（移除中文后按空格分割）
  const englishText = content.replace(CJK_RANGE, " ");
  const words = englishText.split(/\s+/).filter(w => w.length > 0).length;

  const minutes = Math.ceil(
    chineseChars / CHINESE_CHARS_PER_MINUTE + words / ENGLISH_WORDS_PER_MINUTE
  );

  // 至少 1 分钟
  return `${Math.max(1, minutes)} 分钟`;
}
