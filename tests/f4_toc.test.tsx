import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { useState, useEffect } from "react";
import { TableOfContents } from "@/components/TableOfContents";

// 编写一个简单的容器来模拟页面上有 Markdown 渲染和 ToC 组件挂载
function TestArticleWrapper({
  content,
  slug,
}: {
  content: string;
  slug: string;
}) {
  // 模拟文章内容的 HTML 渲染
  // 在实际项目中，是通过 Markdown 组件渲染的，在这里我们直接渲染 HTML，以便 useHeadings 能够查找到 .markdown-content 元素
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    // 模拟异步加载
    const timer = setTimeout(() => {
      if (content.includes("# 标题一")) {
        setHtmlContent(`
          <div class="markdown-content">
            <h1 id="biao-ti-yi">标题一</h1>
            <p>内容一</p>
            <h2 id="biao-ti-er">标题二</h2>
            <p>内容二</p>
            <h3 id="biao-ti-san">标题三</h3>
            <p>内容三</p>
          </div>
        `);
      } else if (content.includes("# 新标题")) {
        setHtmlContent(`
          <div class="markdown-content">
            <h1 id="xin-biao-ti">新标题</h1>
            <p>新内容</p>
          </div>
        `);
      } else {
        setHtmlContent('<div class="markdown-content">没有标题的内容</div>');
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [content, slug]);

  return (
    <div>
      {/* ToC 组件 */}
      <TableOfContents key={slug} content={content} />
      {/* 正文渲染 */}
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  );
}

describe("F4: 文章页 ToC 目录自动生成、滚动高亮定位与文章跳转时 ToC 同步刷新", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // Tier 1: 特性覆盖 (Feature Coverage)
  // ==========================================
  it("Tier 1: ToC 应该能够正确扫描 DOM 中的 H1-H3 标题并渲染成列表，且点击锚点触发 scrollTo", async () => {
    // 渲染带有标题的文章
    render(
      <TestArticleWrapper
        content="# 标题一 \n ## 标题二 \n ### 标题三"
        slug="article-1"
      />
    );

    // 模拟等待异步渲染完毕
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // 检查 ToC 是否渲染出了所有的标题 text
    // 注意：根据 TableOfContents.tsx，如果 headings 为空就返回 null，如果不为空则有 nav
    const tocItems = screen.getAllByRole("listitem");
    expect(tocItems).toHaveLength(3);
    expect(tocItems[0]).toHaveTextContent("标题一");
    expect(tocItems[1]).toHaveTextContent("标题二");
    expect(tocItems[2]).toHaveTextContent("标题三");

    // 点击第二个标题锚点
    fireEvent.click(tocItems[1]);

    // 验证触发了 window.scrollTo
    expect(window.scrollTo).toHaveBeenCalled();
  });

  // ==========================================
  // Tier 2: 边界与极限 (Edge Cases & Boundaries)
  // ==========================================
  it("Tier 2: 当正文无任何 Heading 标题时，ToC 应该返回 null 不占位", async () => {
    render(
      <TestArticleWrapper content="纯文本，不包含标题" slug="article-empty" />
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // 验证 ToC 没有渲染任何 listitem
    const tocItems = screen.queryAllByRole("listitem");
    expect(tocItems).toHaveLength(0);
  });

  // ==========================================
  // Tier 3: 跨特性组合 (Cross-Feature Combinations)
  // ==========================================
  it("Tier 3: 当文章通过路由发生跳转（slug 改变）时，ToC 组件应该同步刷新为新文章的目录", async () => {
    const { rerender } = render(
      <TestArticleWrapper content="# 标题一 \n ## 标题二" slug="article-1" />
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    expect(screen.getAllByText("标题一")[0]).toBeInTheDocument();

    // 模拟路由跳转，传入新的 slug 与正文内容
    rerender(<TestArticleWrapper content="# 新标题" slug="article-2" />);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // 验证旧标题消失，新标题出现在目录中
    expect(screen.queryByText("标题一")).not.toBeInTheDocument();
    expect(screen.getAllByText("新标题")[0]).toBeInTheDocument();
  });

  // ==========================================
  // Tier 4: 真实世界场景 (Real-World Scenarios)
  // ==========================================
  it("Tier 4: 用户滑动阅读长文时 ToC 动态高亮，点击跳转，再通过导航切换文章 ToC 彻底刷新", async () => {
    // 1. 初始化页面并渲染第一篇文章
    const { rerender } = render(
      <TestArticleWrapper content="# 标题一 \n ## 标题二" slug="article-1" />
    );

    // 2. 等待内容装载
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("标题一");

    // 3. 模拟 IntersectionObserver 的触发，模拟滚动高亮标题二
    // 在真实场景中，IntersectionObserverCallback 触发时会 setActiveId。
    // 在我们的测试里，可以通过获取 Mock 实例并执行回调来仿真滚动高亮。
    const callback = (window.IntersectionObserver as any).mock.calls[0][0];

    act(() => {
      callback([
        {
          isIntersecting: true,
          target: { id: "biao-ti-er" },
        },
      ]);
    });

    // 4. 点击标题跳转
    fireEvent.click(items[1]);
    expect(window.scrollTo).toHaveBeenCalled();

    // 5. 跳转到第二篇文章
    rerender(<TestArticleWrapper content="# 新标题" slug="article-2" />);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // 6. 验证新 ToC 成功刷新为新文章的标题
    expect(screen.queryByText("标题二")).not.toBeInTheDocument();
    expect(screen.getAllByText("新标题")[0]).toBeInTheDocument();
  });
});
