import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  validateArticle,
  findDuplicateSlugs,
  VALID_SLUG_PATTERN,
} from "../scripts/validate-article.js";

const PUBLIC_DIR = path.join(__dirname, "../client/public");

function makeArgs(overrides: Record<string, unknown> = {}) {
  const { data = {}, ...rest } = overrides as any;
  return {
    file: "my-post.md",
    slug: "my-post",
    data: {
      title: "标题",
      date: "2026-07-01",
      category: "技术",
      description: "描述",
      ...data,
    },
    content: "正文内容",
    publicDir: PUBLIC_DIR,
    ...rest,
  };
}

describe("F10: 文章内容校验（构建期护栏）", () => {
  it("合规文章应无任何错误", () => {
    expect(validateArticle(makeArgs())).toEqual([]);
  });

  // ==========================================
  // slug 规范
  // ==========================================
  it("带空格的文件名（iCloud/Dropbox 冲突副本）必须报错", () => {
    const errors = validateArticle(
      makeArgs({ file: "my-post 2.md", slug: "my-post 2" })
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("非法文章 slug");
  });

  it.each([
    ["My-Post", "大写字母"],
    ["中文标题", "中文"],
    ["my_post", "下划线"],
    ["my--post", "连续连字符"],
    ["-my-post", "首连字符"],
    ["my-post-", "尾连字符"],
  ])("非法 slug「%s」（%s）必须报错", slug => {
    expect(VALID_SLUG_PATTERN.test(slug)).toBe(false);
    expect(validateArticle(makeArgs({ slug })).join()).toContain(
      "非法文章 slug"
    );
  });

  it.each(["my-post", "post2", "a-b-c-1"])("合法 slug「%s」应通过", slug => {
    expect(VALID_SLUG_PATTERN.test(slug)).toBe(true);
  });

  // ==========================================
  // frontmatter 完整性
  // ==========================================
  it.each(["title", "date", "category", "description"])(
    "缺少必填字段 %s 必须报错",
    field => {
      const errors = validateArticle(
        makeArgs({ data: { [field]: undefined } })
      );
      expect(errors.join()).toContain(`缺少必填 frontmatter 字段：${field}`);
    }
  );

  it("必填字段为空白字符串同样视为缺失", () => {
    expect(
      validateArticle(makeArgs({ data: { title: "   " } })).join()
    ).toContain("缺少必填 frontmatter 字段：title");
  });

  it("非法日期必须报错", () => {
    expect(
      validateArticle(makeArgs({ data: { date: "2026-13-45" } })).join()
    ).toContain("不是合法日期");
  });

  it("updated 字段为合法日期时应通过，非法日期必须报错", () => {
    // 合法 updated
    expect(
      validateArticle(makeArgs({ data: { updated: "2026-08-01" } }))
    ).toEqual([]);
    // 非法 updated
    expect(
      validateArticle(makeArgs({ data: { updated: "not-a-date" } })).join()
    ).toContain("updated 不是合法日期");
  });

  it("updated 字段未提供时应通过（可选字段）", () => {
    expect(validateArticle(makeArgs({ data: { updated: undefined } }))).toEqual(
      []
    );
  });

  it("tags 不是字符串数组必须报错", () => {
    expect(
      validateArticle(makeArgs({ data: { tags: "不是数组" } })).join()
    ).toContain("tags 必须是非空字符串数组");
    expect(
      validateArticle(makeArgs({ data: { tags: ["ok", ""] } })).join()
    ).toContain("tags 必须是非空字符串数组");
  });

  it("tags 为合法数组或未提供都应通过", () => {
    expect(validateArticle(makeArgs({ data: { tags: ["React"] } }))).toEqual(
      []
    );
    expect(validateArticle(makeArgs({ data: { tags: undefined } }))).toEqual(
      []
    );
  });

  it("image 指向不存在的站内文件必须报错，外链则放行", () => {
    expect(
      validateArticle(makeArgs({ data: { image: "/images/nope.jpg" } })).join()
    ).toContain("image 指向的文件不存在");
    expect(
      validateArticle(
        makeArgs({ data: { image: "https://example.com/a.jpg" } })
      )
    ).toEqual([]);
  });

  it("已发布文章正文为空必须报错，草稿则允许", () => {
    expect(validateArticle(makeArgs({ content: "  \n " })).join()).toContain(
      "已发布文章的正文不能为空"
    );
    expect(
      validateArticle(makeArgs({ content: "  ", data: { published: false } }))
    ).toEqual([]);
  });

  it("重复 slug 必须报错", () => {
    const errors = findDuplicateSlugs([
      { file: "a.md", slug: "same" },
      { file: "b.md", slug: "same" },
      { file: "c.md", slug: "other" },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("重复的 slug");
  });
});

describe("F10: 实际产物 articles.json 应始终合规", () => {
  const articles = JSON.parse(
    fs.readFileSync(path.join(PUBLIC_DIR, "articles", "articles.json"), "utf-8")
  ) as Array<Record<string, any>>;

  it("每条记录的 slug 都符合规范（不含空格、不含「 2」副本）", () => {
    const bad = articles.filter(a => !VALID_SLUG_PATTERN.test(a.slug));
    expect(bad.map(a => a.slug)).toEqual([]);
  });

  it("slug 唯一", () => {
    const slugs = articles.map(a => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("每条记录都有标题、合法日期与分类", () => {
    for (const a of articles) {
      expect(a.title?.trim()).toBeTruthy();
      expect(a.category?.trim()).toBeTruthy();
      expect(Number.isNaN(new Date(a.date).getTime())).toBe(false);
    }
  });

  it("每篇文章的正文副本都存在", () => {
    for (const a of articles) {
      const md = path.join(PUBLIC_DIR, "articles", `${a.slug}.md`);
      expect(fs.existsSync(md)).toBe(true);
    }
  });

  it("产物目录里不存在带空格或「 2」的文章文件", () => {
    const files = fs.readdirSync(path.join(PUBLIC_DIR, "articles"));
    const bad = files.filter(f => f.endsWith(".md") && /\s/.test(f));
    expect(bad).toEqual([]);
  });
});
