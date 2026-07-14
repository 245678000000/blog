import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import Archive from "@/pages/Archive";
import * as articlesModule from "@shared/articles";

// Mock wouter 路由相关的 search string
let mockSearchString = "";

vi.mock("wouter", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
  useSearch: () => mockSearchString,
  useLocation: () => [
    "/archive" + mockSearchString,
    vi.fn((loc: string) => {
      const queryIndex = loc.indexOf("?");
      mockSearchString = queryIndex !== -1 ? loc.substring(queryIndex) : "";
    }),
  ],
}));

// Mock SEO
vi.mock("@/components/SEO", () => ({
  SEO: ({ title }: { title: string }) => <div data-testid="seo-title">{title}</div>,
}));

const mockArticles = [
  {
    slug: "post-1",
    title: "第一篇 2026 的文章",
    date: "2026-07-01",
    category: "技术",
    tags: ["React"],
    published: true,
  },
  {
    slug: "post-2",
    title: "第二篇 2026 的文章",
    date: "2026-08-01",
    category: "技术",
    tags: ["React", "TypeScript"],
    published: true,
  },
  {
    slug: "post-3",
    title: "第三篇 2025 的文章",
    date: "2025-05-01",
    category: "设计",
    tags: ["Tailwind"],
    published: true,
  },
];

const mockTags = [
  { tag: "React", count: 2 },
  { tag: "TypeScript", count: 1 },
  { tag: "Tailwind", count: 1 },
];

const mockCategories = [
  { category: "技术", count: 2 },
  { category: "设计", count: 1 },
];

describe("F6: 归档页年/月轴线归档列表与标签/分类 URL 参数监听过滤", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchString = "";
    // Mock 浏览器 history.replaceState
    window.history.replaceState = vi.fn();
  });

  // ==========================================
  // Tier 1: 特性覆盖 (Feature Coverage)
  // ==========================================
  it("Tier 1: 应该正确按年-月轴线对文章进行分组，并根据 URL Query 参数进行初次过滤", async () => {
    // 模拟 URL 输入 ?tag=React
    mockSearchString = "?tag=React";

    vi.spyOn(articlesModule, "getPublishedArticles").mockResolvedValue(mockArticles as any);
    vi.spyOn(articlesModule, "getAllTags").mockResolvedValue(mockTags);
    vi.spyOn(articlesModule, "getAllCategories").mockResolvedValue(mockCategories);

    render(<Archive />);

    // 加载状态应先显示，随后等待数据装载完毕
    await waitFor(() => {
      expect(screen.queryByText("加载中...")).not.toBeInTheDocument();
    });

    // 应该显示 2 篇 React 相关的文章，2025 年的文章（第 3 篇，设计/Tailwind）应该被过滤
    expect(screen.getByText("第一篇 2026 的文章")).toBeInTheDocument();
    expect(screen.getByText("第二篇 2026 的文章")).toBeInTheDocument();
    expect(screen.queryByText("第三篇 2025 的文章")).not.toBeInTheDocument();

    // 应该渲染 2026 时间轴节点，但不应渲染 2025 时间轴节点
    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.queryByText("2025")).not.toBeInTheDocument();
  });

  // ==========================================
  // Tier 2: 边界与极限 (Edge Cases & Boundaries)
  // ==========================================
  it("Tier 2: 当传入不存在的标签时，不崩溃且友好地展示空提示", async () => {
    mockSearchString = "?tag=NonExist";

    vi.spyOn(articlesModule, "getPublishedArticles").mockResolvedValue(mockArticles as any);
    vi.spyOn(articlesModule, "getAllTags").mockResolvedValue(mockTags);
    vi.spyOn(articlesModule, "getAllCategories").mockResolvedValue(mockCategories);

    render(<Archive />);

    await waitFor(() => {
      expect(screen.queryByText("加载中...")).not.toBeInTheDocument();
    });

    // 验证有“没有找到文章”的空状态提示（根据项目实现，通常会提示共 0 篇文章或空提示）
    expect(screen.getByText("共 0 篇文章 (已筛选)")).toBeInTheDocument();
  });

  it("Tier 2: 如果文章发布时间含有畸形年份（如空或非法日期格式），应安全分入未知组或优雅跳过", async () => {
    const malformedArticles = [
      {
        slug: "post-malformed",
        title: "畸形日期文章",
        date: "invalid-date",
        category: "技术",
        tags: ["React"],
        published: true,
      },
    ];

    vi.spyOn(articlesModule, "getPublishedArticles").mockResolvedValue(malformedArticles as any);
    vi.spyOn(articlesModule, "getAllTags").mockResolvedValue([]);
    vi.spyOn(articlesModule, "getAllCategories").mockResolvedValue([]);

    render(<Archive />);

    await waitFor(() => {
      // 验证没有崩溃，并且以某种方式将 "invalid" 或 "invalid-date" 分组渲染
      expect(screen.getByText("畸形日期文章")).toBeInTheDocument();
    });
  });

  // ==========================================
  // Tier 3: 跨特性组合 (Cross-Feature Combinations)
  // ==========================================
  it("Tier 3: 用户点击标签 Badge 应当即时重滤列表并在无刷新下将新参数推送到 URL history 状态中", async () => {
    mockSearchString = "";

    vi.spyOn(articlesModule, "getPublishedArticles").mockResolvedValue(mockArticles as any);
    vi.spyOn(articlesModule, "getAllTags").mockResolvedValue(mockTags);
    vi.spyOn(articlesModule, "getAllCategories").mockResolvedValue(mockCategories);

    const { rerender } = render(<Archive />);

    await waitFor(() => {
      expect(screen.getByText("第一篇 2026 的文章")).toBeInTheDocument();
      expect(screen.getByText("第三篇 2025 的文章")).toBeInTheDocument();
    });

    // 找到 "Tailwind" 标签的 Badge 并点击
    const tagBadge = screen.getAllByText(/React/)[0];
    await act(async () => {
      fireEvent.click(tagBadge);
    });
    
    rerender(<Archive />);

    // 过滤列表应只剩 React 文章，2025 年的文章（Tailwind）被过滤
    expect(screen.queryByText("第三篇 2025 的文章")).not.toBeInTheDocument();
  });

  // ==========================================
  // Tier 4: 真实世界场景 (Real-World Scenarios)
  // ==========================================
  it("Tier 4: 用户打开归档页、点击分类标签进行过滤、然后点击清除过滤还原列表的完整流程仿真", async () => {
    vi.spyOn(articlesModule, "getPublishedArticles").mockResolvedValue(mockArticles as any);
    vi.spyOn(articlesModule, "getAllTags").mockResolvedValue(mockTags);
    vi.spyOn(articlesModule, "getAllCategories").mockResolvedValue(mockCategories);

    const { rerender } = render(<Archive />);

    // 1. 验证全部加载
    await waitFor(() => {
      expect(screen.getByText("共 3 篇文章")).toBeInTheDocument();
    });

    // 2. 点击“设计”分类 Badge 进行过滤
    const designBadge = screen.getAllByText("设计")[0];
    await act(async () => {
      fireEvent.click(designBadge);
    });
    
    rerender(<Archive />);

    // 3. 验证此时只有设计类文章渲染出来，且有 (已筛选) 标示
    expect(screen.getByText("共 1 篇文章 (已筛选)")).toBeInTheDocument();
    expect(screen.getByText("第三篇 2025 的文章")).toBeInTheDocument();
    expect(screen.queryByText("第一篇 2026 的文章")).not.toBeInTheDocument();

    // 4. 点击清除筛选按钮
    const clearBtn = screen.getByRole("button", { name: /清除全部/i });
    await act(async () => {
      fireEvent.click(clearBtn);
    });
    
    rerender(<Archive />);

    // 5. 验证归档列表恢复到初始全部加载状态，URL 重新清空
    expect(screen.getByText("共 3 篇文章")).toBeInTheDocument();
    expect(screen.getByText("第一篇 2026 的文章")).toBeInTheDocument();
    expect(screen.getByText("第三篇 2025 的文章")).toBeInTheDocument();
    expect(window.history.replaceState).toHaveBeenCalledWith({}, "", "/archive");
  });
});
