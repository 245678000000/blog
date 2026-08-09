import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * F15: articles.json 的请求缓存
 *
 * 缓存的是 Promise 而不是结果。只缓存结果的话，两个调用方在第一次请求返回之前
 * 同时进来，缓存都还是空的，于是各发一次网络请求——文章页的
 * `Promise.all([getAdjacentArticles, getRelatedArticles])` 正是这个场景。
 */

const ARTICLES = [
  {
    slug: "a",
    title: "A",
    date: "2026-01-01",
    category: "技术",
    readTime: "1 分钟",
    description: "",
    image: "",
    published: true,
  },
  {
    slug: "b",
    title: "B",
    date: "2026-01-02",
    category: "技术",
    readTime: "1 分钟",
    description: "",
    image: "",
    published: false,
  },
];

// 每条用例都要一份干净的模块状态：缓存在模块作用域里
async function freshModule() {
  vi.resetModules();
  return import("@shared/articles");
}

describe("F15: articles.json 请求缓存", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Tier 1: 并发调用只发一次请求", async () => {
    // 请求悬在这里，模拟「第一次还没返回，第二个调用方就进来了」
    let resolveFetch: (value: unknown) => void = () => {};
    fetchMock.mockReturnValue(
      new Promise(resolve => {
        resolveFetch = resolve;
      })
    );

    const { getPublishedArticles, getAllTags } = await freshModule();

    const pending = Promise.all([getPublishedArticles(), getAllTags()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch({ ok: true, json: async () => ARTICLES });
    await pending;

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("Tier 1: 后续调用命中缓存，不再回源", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ARTICLES });

    const { getPublishedArticles } = await freshModule();

    // published: false 的那篇要被过滤掉
    expect(await getPublishedArticles()).toHaveLength(1);
    expect(await getPublishedArticles()).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("Tier 2: 请求失败不进缓存，下一次要能重试", async () => {
    // 一次网络抖动不该让整站的文章列表永久为空
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { getPublishedArticles } = await freshModule();

    expect(await getPublishedArticles()).toEqual([]);

    fetchMock.mockResolvedValue({ ok: true, json: async () => ARTICLES });
    expect(await getPublishedArticles()).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("Tier 2: HTTP 非 2xx 同样不进缓存", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { getPublishedArticles } = await freshModule();

    expect(await getPublishedArticles()).toEqual([]);

    fetchMock.mockResolvedValue({ ok: true, json: async () => ARTICLES });
    expect(await getPublishedArticles()).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
