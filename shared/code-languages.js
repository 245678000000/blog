// 代码高亮语言白名单的唯一来源。
//
// 背景：Markdown.tsx 早前用 prism-async-light，会把 Prism 的 200+ 语言全部拆成
// 按需分片，构建产物里有 332 个 JS 文件。改成 PrismLight + 显式 registerLanguage 后
// 只打包下面这几种，但代价是——文章里出现未注册的语言时，Prism 不会报错，
// 只会**静默**渲染成无高亮的纯文本。
//
// 所以这份清单同时被两处引用：
//   1. client/src/components/Markdown.tsx —— 真正 registerLanguage 的地方
//   2. scripts/validate-article.js       —— 构建期扫描正文围栏，发现未注册语言就中断构建
// 两者是否一致由 tests/f12_code_languages.test.ts 兜底。
//
// 新增语言时：先在 Markdown.tsx 的 languageLoaders 里加 import，再把名字加到这里。

export const SUPPORTED_CODE_LANGUAGES = [
  "bash",
  "java",
  "json",
  "markdown",
  "nginx",
  "toml",
  "typescript",
  "yaml",
];

// 这些语言本来就不需要高亮，渲染成纯文本是预期行为，不算「静默降级」。
export const PLAIN_CODE_LANGUAGES = ["text", "plaintext", "txt"];

/**
 * 扫描 Markdown 正文里所有代码围栏的语言标注。
 *
 * 按 CommonMark 处理嵌套：围栏用 3 个以上的 ` 或 ~ 开启，
 * 只有「同种字符、长度不小于开启围栏、且不带 info string」的行才算闭合。
 * 这样讲 Markdown 的文章里那种 ````markdown 包着 ``` 的写法不会被误判。
 *
 * @param {string} content Markdown 正文（不含 frontmatter）
 * @returns {Set<string>} 出现过的语言标注（小写，不含无标注的围栏）
 */
export function extractCodeFenceLanguages(content) {
  const languages = new Set();
  let openFence = null;

  for (const rawLine of content.split("\n")) {
    const match = /^\s{0,3}(`{3,}|~{3,})(.*)$/.exec(rawLine.trimEnd());
    if (!match) continue;

    const [, fence, info] = match;
    const char = fence[0];
    const length = fence.length;

    if (openFence) {
      const isClosing =
        char === openFence.char &&
        length >= openFence.length &&
        info.trim() === "";
      if (isClosing) openFence = null;
      continue;
    }

    openFence = { char, length };
    const language = info.trim().split(/\s+/)[0].toLowerCase();
    if (language) languages.add(language);
  }

  return languages;
}
