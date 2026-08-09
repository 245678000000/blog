import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import ArticlePage from "@/pages/Article";
import * as articlesModule from "@shared/articles";

// 当前路由 slug，由每个用例控制
let currentSlug = "post-a";

// data-wouter 是个标记：只有走 wouter <Link> 的链接才会带上它。
// 站内跳转如果退回裸 <a>，浏览器会整页重载，SPA 路由、已加载的 chunk
// 和 articles.json 缓存全部作废——这个标记就是用来把那种回退挡在测试里。
vi.mock("wouter", () => ({
  useParams: () => ({ slug: currentSlug }),
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} data-wouter="1" {...props}>
      {children}
    </a>
  ),
}));

// 这些子组件依赖浏览器 API / 第三方脚本，与本文件要验证的加载竞态无关
vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/components/Comments", () => ({ Comments: () => null }));
vi.mock("@/components/Newsletter", () => ({ Newsletter: () => null }));
vi.mock("@/components/ShareButtons", () => ({ ShareButtons: () => null }));
vi.mock("@/components/ReadingProgress", () => ({
  ReadingProgress: () => null,
}));
vi.mock("@/components/TableOfContents", () => ({
  TableOfContents: () => null,
  MobileTableOfContents: () => null,
  BackToTop: () => null,
}));
vi.mock("@/components/Markdown", () => ({
  Markdown: ({ content }: { content: string }) => <div>{content}</div>,
}));

vi.mock("@shared/articles", () => ({
  getArticleContent: vi.fn(),
  getAdjacentArticles: vi.fn(),
  getRelatedArticles: vi.fn(),
}));

function makeArticle(slug: string, title: string, delayMs: number) {
  return new Promise(resolve =>
    setTimeout(
      () =>
        resolve({
          slug,
          title,
          date: "2026-07-01",
          category: "技术",
          readTime: "5 分钟",
          description: `${title} 的描述`,
          image: "",
          published: true,
          tags: [],
          content: `${title} 的正文`,
        }),
      delayMs
    )
  );
}

describe("F9: 文章页加载竞态与状态清理", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSlug = "post-a";
    (articlesModule.getAdjacentArticles as any).mockResolvedValue({
      prev: null,
      next: null,
    });
    (articlesModule.getRelatedArticles as any).mockResolvedValue([]);
  });

  it("Tier 1: 快速切换文章时，先发出但后返回的旧请求不得覆盖新文章", async () => {
    // A 慢（150ms），B 快（10ms）。先请求 A，立刻切到 B。
    // 若没有 cancelled 守卫，A 的响应会在 B 之后落地，页面就会显示 A。
    (articlesModule.getArticleContent as any).mockImplementation(
      (slug: string) =>
        slug === "post-a"
          ? makeArticle("post-a", "文章 A", 150)
          : makeArticle("post-b", "文章 B", 10)
    );

    const { rerender } = render(<ArticlePage />);

    // 在 A 尚未返回时切换到 B
    currentSlug = "post-b";
    rerender(<ArticlePage />);

    // B 先落地
    await waitFor(() => {
      expect(screen.getByText("文章 B")).toBeInTheDocument();
    });

    // 再等足够长的时间，让慢的 A 也返回
    await new Promise(r => setTimeout(r, 250));

    // 关键断言：页面仍然是 B，没有被迟到的 A 覆盖
    expect(screen.getByText("文章 B")).toBeInTheDocument();
    expect(screen.queryByText("文章 A")).not.toBeInTheDocument();
  });

  it("Tier 2: 切换 slug 时应清空上一篇内容，加载期间不残留旧正文", async () => {
    (articlesModule.getArticleContent as any).mockImplementation(
      (slug: string) =>
        slug === "post-a"
          ? makeArticle("post-a", "文章 A", 10)
          : makeArticle("post-b", "文章 B", 120)
    );

    const { rerender } = render(<ArticlePage />);
    await waitFor(() => {
      expect(screen.getByText("文章 A")).toBeInTheDocument();
    });

    // 切到加载较慢的 B
    currentSlug = "post-b";
    rerender(<ArticlePage />);

    // B 还没返回时，A 的正文必须已经消失（否则 URL 是 B、内容是 A）
    expect(screen.queryByText("文章 A")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("文章 B")).toBeInTheDocument();
    });
  });

  it("Tier 2: 未发布或不存在的文章应展示未找到，而不是空白页", async () => {
    (articlesModule.getArticleContent as any).mockResolvedValue(null);

    render(<ArticlePage />);

    await waitFor(() => {
      expect(screen.getByText("文章未找到")).toBeInTheDocument();
    });
  });

  it("Tier 1: 标签必须是 wouter 的客户端链接，不能退回裸 <a> 整页刷新", async () => {
    (articlesModule.getArticleContent as any).mockResolvedValue({
      slug: "post-a",
      title: "文章 A",
      date: "2026-07-01",
      category: "技术",
      readTime: "5 分钟",
      description: "描述",
      image: "",
      published: true,
      tags: ["React", "AI 工具"],
      content: "正文",
    });

    render(<ArticlePage />);

    const tag = await screen.findByText("#React");
    expect(tag).toHaveAttribute("href", "/archive?tag=React");
    expect(tag).toHaveAttribute("data-wouter", "1");

    // 标签里的空格等字符要转义，否则拼出来的是非法 URL
    expect(screen.getByText("#AI 工具")).toHaveAttribute(
      "href",
      "/archive?tag=AI%20%E5%B7%A5%E5%85%B7"
    );
  });

  it("Tier 3: 正文与 articles.json 应并行请求，而不是串成瀑布", async () => {
    // 正文卡住不返回：如果是串行写法，另外两个请求要等它，一次都不会发出
    (articlesModule.getArticleContent as any).mockReturnValue(
      new Promise(() => {})
    );

    render(<ArticlePage />);

    await waitFor(() => {
      expect(articlesModule.getAdjacentArticles).toHaveBeenCalledWith("post-a");
    });
    expect(articlesModule.getRelatedArticles).toHaveBeenCalledWith("post-a", 3);
  });
});
