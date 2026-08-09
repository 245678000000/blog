import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  SUPPORTED_CODE_LANGUAGES,
  PLAIN_CODE_LANGUAGES,
  extractCodeFenceLanguages,
} from "@shared/code-languages.js";
import { validateArticle } from "../scripts/validate-article.js";
import { REGISTERED_LANGUAGES } from "@/components/Markdown";

const PUBLIC_DIR = path.join(__dirname, "../client/public");
const ARTICLES_DIR = path.join(__dirname, "../articles");

function makeArgs(content: string) {
  return {
    file: "my-post.md",
    slug: "my-post",
    data: {
      title: "标题",
      date: "2026-07-01",
      category: "技术",
      description: "描述",
    },
    content,
    publicDir: PUBLIC_DIR,
  };
}

describe("F12: 代码高亮语言白名单", () => {
  // ==========================================
  // 防漂移：两份清单必须一致
  // ==========================================
  it("Markdown.tsx 实际注册的语言应与 SUPPORTED_CODE_LANGUAGES 完全一致", () => {
    // 不一致的后果不对称：
    // 清单里多、Markdown.tsx 里少 → 校验放行，线上静默无高亮（危险）
    // 清单里少、Markdown.tsx 里多 → 校验误报，构建失败（吵但安全）
    expect(REGISTERED_LANGUAGES).toEqual([...SUPPORTED_CODE_LANGUAGES].sort());
  });

  // ==========================================
  // 围栏语言提取
  // ==========================================
  it("应提取出带语言标注的围栏，忽略无标注的围栏", () => {
    const md = ["```bash", "ls", "```", "", "```", "纯文本", "```"].join("\n");
    expect([...extractCodeFenceLanguages(md)]).toEqual(["bash"]);
  });

  it("应把语言标注归一化为小写", () => {
    expect([...extractCodeFenceLanguages("```JSON\n{}\n```")]).toEqual([
      "json",
    ]);
  });

  it("嵌套围栏：外层 ```` 包裹的内层 ``` 不应被当成新围栏", () => {
    // 讲 Markdown 的文章里这种写法很常见，误判会导致内层语言被漏检或外层被误检
    const md = [
      "````markdown",
      "```python",
      "print(1)",
      "```",
      "````",
      "",
      "```bash",
      "ls",
      "```",
    ].join("\n");
    const found = extractCodeFenceLanguages(md);
    expect([...found].sort()).toEqual(["bash", "markdown"]);
    expect(found.has("python")).toBe(false);
  });

  it("~~~ 围栏与 ``` 围栏不互相闭合", () => {
    const md = ["~~~yaml", "a: 1", "~~~", "```json", "{}", "```"].join("\n");
    expect([...extractCodeFenceLanguages(md)].sort()).toEqual(["json", "yaml"]);
  });

  // ==========================================
  // 构建期护栏
  // ==========================================
  it("未注册的语言应导致校验失败", () => {
    const errors = validateArticle(makeArgs("```python\nprint(1)\n```"));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("python");
    expect(errors[0]).toContain("未注册");
  });

  it("已注册的语言应通过", () => {
    for (const language of SUPPORTED_CODE_LANGUAGES) {
      const errors = validateArticle(makeArgs(`\`\`\`${language}\nx\n\`\`\``));
      expect(errors, `${language} 不应报错`).toEqual([]);
    }
  });

  it("显式的纯文本语言应通过（无高亮是预期行为）", () => {
    for (const language of PLAIN_CODE_LANGUAGES) {
      const errors = validateArticle(makeArgs(`\`\`\`${language}\nx\n\`\`\``));
      expect(errors, `${language} 不应报错`).toEqual([]);
    }
  });

  // ==========================================
  // 现有文章必须全部通过——白名单本就是从它们推导出来的
  // ==========================================
  it("articles/ 下所有文章用到的语言都应在白名单内", () => {
    const allowed = new Set([
      ...SUPPORTED_CODE_LANGUAGES,
      ...PLAIN_CODE_LANGUAGES,
    ]);
    const offenders: string[] = [];

    for (const file of fs.readdirSync(ARTICLES_DIR)) {
      if (!file.endsWith(".md")) continue;
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), "utf-8");
      // 粗略剥掉 frontmatter：只需要正文里的围栏
      const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "");
      for (const language of extractCodeFenceLanguages(body)) {
        if (!allowed.has(language)) offenders.push(`${file}: ${language}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
