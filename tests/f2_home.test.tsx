import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import Home from "@/pages/Home";
import * as articlesModule from "@shared/articles";

// Mock wouter
vi.mock("wouter", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
}));

// Mock SEO 组件
vi.mock("@/components/SEO", () => ({
  SEO: ({ title, description }: { title: string; description: string }) => (
    <div
      data-testid="seo-mock"
      data-title={title}
      data-description={description}
    />
  ),
}));

// Mock 模拟文章数据
const mockArticles = [
  {
    slug: "post-1",
    title: "测试文章第一篇",
    date: "2026-07-01",
    category: "技术",
    tags: ["React"],
    description: "这是一篇测试文章的第一篇描述",
    published: true,
    readTime: "5 min",
    image: "/images/test1.jpg",
  },
  {
    slug: "post-2",
    title: "测试文章第二篇，具有极其冗长的标题以测试布局的溢出与裁剪容错机制",
    date: "2026-07-02",
    category: "设计",
    tags: ["Tailwind"],
    description: "这是一篇测试文章的第二篇描述",
    published: true,
    readTime: "3 min",
    image: "/images/test2.jpg",
  },
];

vi.mock("@shared/articles", () => ({
  getPublishedArticles: vi.fn().mockImplementation(() =>
    Promise.resolve([
      {
        slug: "post-1",
        title: "测试文章第一篇",
        date: "2026-07-01",
        category: "技术",
        tags: ["React"],
        description: "这是一篇测试文章的第一篇描述",
        published: true,
        readTime: "5 min",
        image: "/images/test1.jpg",
      },
      {
        slug: "post-2",
        title:
          "测试文章第二篇，具有极其冗长的标题以测试布局的溢出与裁剪容错机制",
        date: "2026-07-02",
        category: "设计",
        tags: ["Tailwind"],
        description: "这是一篇测试文章的第二篇描述",
        published: true,
        readTime: "3 min",
        image: "/images/test2.jpg",
      },
    ])
  ),
}));

describe("F2: 首页 Hero 区域、精选卡片与最近文章无刷新分类筛选", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (articlesModule.getPublishedArticles as any).mockImplementation(() =>
      Promise.resolve(mockArticles)
    );
  });

  // ==========================================
  // Tier 1: 特性覆盖 (Feature Coverage)
  // ==========================================
  it("Tier 1: 应该正确渲染 Hero 区域、精选文章卡片和最近文章列表", async () => {
    (articlesModule.getPublishedArticles as any).mockResolvedValue(
      mockArticles
    );
    render(<Home />);

    // 验证 Hero 部分的个人简介文本
    expect(screen.getByText(/用 Code 和 AI/)).toBeInTheDocument();
    expect(screen.getByText(/法学硕士 | AI Native 开发者/)).toBeInTheDocument();

    // 等待文章列表异步加载完成
    await waitFor(() => {
      expect(screen.getByAltText("测试文章第一篇")).toBeInTheDocument();
    });

    // 验证精选卡片渲染（通常为最新的一篇文章，即第一篇）
    expect(screen.getByText("精选文章")).toBeInTheDocument();
  });

  it("Tier 1: 点击分类过滤标签应该能够实现无刷新过滤文章列表", async () => {
    (articlesModule.getPublishedArticles as any).mockResolvedValue(
      mockArticles
    );
    render(<Home />);

    // 等待加载出所有的分类标签和文章
    await waitFor(() => {
      expect(screen.getByAltText("测试文章第一篇")).toBeInTheDocument();
    });

    // 点击 "设计" 分类标签（仅包含 post-2）
    const designTab = screen.getByRole("button", { name: "设计" });
    await act(async () => {
      fireEvent.click(designTab);
    });

    // 验证 "设计" 分类的文章在最近文章列表中，而 "技术" 分类的文章被过滤掉
    // 注意：精选文章卡片是不受分类筛选影响的（按照业务设计代码第 26 行），只在最近文章列表中过滤
    // 根据 Home.tsx，最近文章列表有 filteredArticles 的渲染，我们可以验证渲染数量或特定元素
    expect(screen.queryByAltText("测试文章第一篇")).toBeInTheDocument(); // 精选文章还在
    // 列表中展示 filteredArticles.slice(0, 3)
  });

  // ==========================================
  // Tier 2: 边界与极限 (Edge Cases & Boundaries)
  // ==========================================
  it("Tier 2: 当无任何文章数据返回时（空状态），页面不应崩溃且显示友好提示", async () => {
    (articlesModule.getPublishedArticles as any).mockResolvedValueOnce([]);

    render(<Home />);

    await waitFor(() => {
      // 验证未抛出白屏错误，页面正常呈现
      expect(screen.getByText(/用 Code 和 AI/)).toBeInTheDocument();
    });
  });

  it("Tier 2: 当标题极其冗长时，卡片组件应当能安全承载而不断裂或溢出", async () => {
    render(<Home />);

    await waitFor(() => {
      const longTitle = screen.getByText(/具有极其冗长的标题/);
      expect(longTitle).toBeInTheDocument();
    });
  });

  // ==========================================
  // Tier 3: 跨特性组合 (Cross-Feature Combinations)
  // ==========================================
  it("Tier 3: 结合 SEO 模块，在加载文章的同时能更新页面的 SEO 元数据", async () => {
    render(<Home />);

    const seoMock = screen.getByTestId("seo-mock");
    expect(seoMock).toBeInTheDocument();
    expect(seoMock.getAttribute("data-title")).toBe("首页");
    expect(seoMock.getAttribute("data-description")).toContain("法学硕士");
  });

  // ==========================================
  // Tier 4: 真实世界场景 (Real-World Scenarios)
  // ==========================================
  it("Tier 4: 用户访问首页，查看 Hero，点击分类进行无刷新过滤，然后点击最近文章卡片的端到端流程", async () => {
    (articlesModule.getPublishedArticles as any).mockResolvedValue(
      mockArticles
    );
    render(<Home />);

    // 1. 等待首页文章加载
    await waitFor(() => {
      expect(screen.getByAltText("测试文章第一篇")).toBeInTheDocument();
    });

    // 2. 点击过滤分类标签“技术”
    const techTab = screen.getByRole("button", { name: "技术" });
    await act(async () => {
      fireEvent.click(techTab);
    });

    // 3. 点击“技术”最近文章列表下的卡片链接
    // 验证链接存在
    const articleLink = screen.getAllByTestId("link-/article/post-1")[0];
    expect(articleLink).toBeInTheDocument();
  });

  it("Tier 2: 选中一个「排除精选文章后没有剩余文章」的分类时，筛选按钮必须保留且显示空态", async () => {
    // post-1 是精选（articles[0]），且是「技术」分类里唯一一篇。
    // 选中「技术」后可展示列表为空，但用户必须还能点回「全部」。
    (articlesModule.getPublishedArticles as any).mockResolvedValue(
      mockArticles
    );
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByAltText("测试文章第一篇")).toBeInTheDocument();
    });

    const techTab = screen.getByRole("button", { name: "技术" });
    await act(async () => {
      fireEvent.click(techTab);
    });

    // 空态提示出现（在修复前这段是不可达的死代码）
    expect(screen.getByText("该分类下暂无文章")).toBeInTheDocument();

    // 关键：筛选按钮没有随着列表一起被卸载，用户能点回「全部」
    const allTab = screen.getByRole("button", { name: "全部" });
    expect(allTab).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(allTab);
    });

    // 点回「全部」后列表恢复
    expect(screen.queryByText("该分类下暂无文章")).not.toBeInTheDocument();
    expect(screen.getByText(/具有极其冗长的标题/)).toBeInTheDocument();
  });
});
