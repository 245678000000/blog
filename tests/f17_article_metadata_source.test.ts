import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const INDEX_ARTICLE = {
  slug: "yaml-edge-case",
  title: "articles.json 里的标题",
  date: "2026-08-09",
  updated: "2026-08-10",
  category: "规范化分类",
  readTime: "7 分钟",
  description: "由构建期 gray-matter 解析后的描述",
  image: "/images/canonical.png",
  published: true,
  tags: ["React", "YAML: 边界"],
};

async function freshModule() {
  vi.resetModules();
  return import("@shared/articles");
}

describe("F17: 文章元数据唯一来源", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn((input: string | URL | Request) => {
      const url = String(input);

      if (url === "/articles/articles.json") {
        return Promise.resolve({
          ok: true,
          json: async () => [INDEX_ARTICLE],
        });
      }

      if (url === "/articles/yaml-edge-case.md") {
        return Promise.resolve({
          ok: true,
          text: async () =>
            [
              "---",
              'title: "Markdown 里的冲突标题"',
              "description: >-",
              "  旧的手写解析器无法正确处理这种 YAML",
              "tags:",
              "  - 会被旧解析器丢失",
              "published: false",
              "---",
              "## 正文标题",
              "",
              "只应返回这段正文。",
            ].join("\n"),
        });
      }

      return Promise.resolve({ ok: false });
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Tier 1: 文章页与列表页必须共用 articles.json 的元数据", async () => {
    const { getArticleContent } = await freshModule();

    const article = await getArticleContent("yaml-edge-case");

    expect(article).toEqual({
      ...INDEX_ARTICLE,
      content: "## 正文标题\n\n只应返回这段正文。",
    });
    expect(fetchMock).toHaveBeenCalledWith("/articles/articles.json");
    expect(fetchMock).toHaveBeenCalledWith("/articles/yaml-edge-case.md");
  });

  it("Tier 1: articles.json 未收录的文章不能被 Markdown 里的字段绕过", async () => {
    fetchMock.mockImplementation((input: string | URL | Request) => {
      const url = String(input);
      if (url === "/articles/articles.json") {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.resolve({
        ok: true,
        text: async () => "---\npublished: true\n---\n不应被直接访问",
      });
    });

    const { getArticleContent } = await freshModule();

    await expect(getArticleContent("yaml-edge-case")).resolves.toBeNull();
  });
});
