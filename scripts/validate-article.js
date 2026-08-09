import fs from "fs";
import path from "path";
import {
  SUPPORTED_CODE_LANGUAGES,
  PLAIN_CODE_LANGUAGES,
  extractCodeFenceLanguages,
} from "../shared/code-languages.js";

// 文件名即 slug，也就是线上 URL 的一段。只允许小写字母、数字和单个连字符。
// iCloud/Dropbox 冲突副本（`xxx 2.md`）、中文文件名、大写都会被这条挡下来。
export const VALID_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const REQUIRED_FIELDS = ["title", "date", "category", "description"];

/**
 * 校验单篇文章，返回错误信息数组（为空表示通过）。
 *
 * @param {object} params
 * @param {string} params.file      源文件名，如 my-post.md
 * @param {string} params.slug      从文件名推导出的 slug
 * @param {object} params.data      frontmatter
 * @param {string} params.content   正文（不含 frontmatter）
 * @param {string} params.publicDir client/public，用于校验 image 是否真的存在
 * @returns {string[]}
 */
export function validateArticle({ file, slug, data, content, publicDir }) {
  const errors = [];

  if (!VALID_SLUG_PATTERN.test(slug)) {
    errors.push(
      `非法文章 slug：「${slug}」。文件名只能使用英文小写、数字和连字符（例如 my-first-post.md）。`
    );
  }

  for (const field of REQUIRED_FIELDS) {
    const value = data[field];
    if (value === undefined || value === null || String(value).trim() === "") {
      errors.push(`缺少必填 frontmatter 字段：${field}`);
    }
  }

  if (data.date !== undefined && data.date !== null) {
    const parsed = new Date(data.date);
    if (Number.isNaN(parsed.getTime())) {
      errors.push(`date 不是合法日期：${JSON.stringify(data.date)}`);
    }
  }

  // updated 是可选字段，用于 sitemap lastmod。不填则回退到 date。
  if (data.updated !== undefined && data.updated !== null) {
    const parsedUpdated = new Date(data.updated);
    if (Number.isNaN(parsedUpdated.getTime())) {
      errors.push(`updated 不是合法日期：${JSON.stringify(data.updated)}`);
    }
  }

  if (data.tags !== undefined) {
    if (
      !Array.isArray(data.tags) ||
      data.tags.some(t => typeof t !== "string" || t.trim() === "")
    ) {
      errors.push(
        `tags 必须是非空字符串数组，当前为：${JSON.stringify(data.tags)}`
      );
    }
  }

  // 只校验站内绝对路径的图片；外链图片交给运行时
  if (typeof data.image === "string" && data.image.startsWith("/")) {
    const imagePath = path.join(publicDir, data.image);
    if (!fs.existsSync(imagePath)) {
      errors.push(`image 指向的文件不存在：${data.image}`);
    }
  }

  // 已发布的文章必须有实际内容，避免误发空壳
  const isPublished = data.published !== false;
  if (isPublished && content.trim() === "") {
    errors.push("已发布文章的正文不能为空");
  }

  // 代码围栏的语言必须已在 Markdown.tsx 注册。
  // Prism 遇到未注册语言不会报错，只会静默渲染成无高亮纯文本——
  // 没有这道校验的话，作者要等文章上线后自己肉眼发现。
  const allowedLanguages = new Set([
    ...SUPPORTED_CODE_LANGUAGES,
    ...PLAIN_CODE_LANGUAGES,
  ]);
  for (const language of extractCodeFenceLanguages(content)) {
    if (!allowedLanguages.has(language)) {
      errors.push(
        `代码块语言「${language}」未注册，高亮会静默失效。` +
          `请在 client/src/components/Markdown.tsx 的 languageLoaders 中加上它，` +
          `并同步 shared/code-languages.js 的 SUPPORTED_CODE_LANGUAGES；` +
          `若本就不需要高亮，改用 ${PLAIN_CODE_LANGUAGES.join(" / ")} 之一。`
      );
    }
  }

  return errors.map(msg => `  [${file}] ${msg}`);
}

/**
 * 跨文件校验：slug 不能重复。
 * 目前文件名唯一即 slug 唯一，但保留这层检查，
 * 以防将来改成从 frontmatter 读取 slug。
 */
export function findDuplicateSlugs(entries) {
  const seen = new Map();
  const errors = [];
  for (const { file, slug } of entries) {
    if (seen.has(slug)) {
      errors.push(`  重复的 slug「${slug}」：${seen.get(slug)} 与 ${file}`);
    } else {
      seen.set(slug, file);
    }
  }
  return errors;
}
