import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ShareButtons } from "@/components/ShareButtons";
import { Comments } from "@/components/Comments";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { toast } from "sonner";

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock window.open
const mockOpen = vi.fn();
window.open = mockOpen;

describe("F5: 文章页组件（阅读进度条、社交分享与 Giscus 评论区占位）", () => {
  const mockWriteText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.clipboard
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockWriteText.mockResolvedValue(undefined),
      },
      configurable: true,
      writable: true,
    });

    // 清理 DOM
    document.documentElement.className = "";
  });

  // ==========================================
  // Tier 1: 特性覆盖 (Feature Coverage)
  // ==========================================
  it("Tier 1: 滚动页面时，ReadingProgress 阅读进度条应根据 scroll 位置动态调整宽度", () => {
    const { container } = render(<ReadingProgress />);
    const progressBar = container.querySelector(".bg-primary");
    expect(progressBar).toBeInTheDocument();

    // 初始状态下进度应为 0%
    expect(progressBar).toHaveStyle({ width: "0%" });

    // 模拟滚动位置
    // 设置页面可滚动高度
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 1200,
      configurable: true,
    });
    window.innerHeight = 200; // 视口高度
    window.scrollY = 500; // 滚动了 500px，最大滚动高度 = 1200 - 200 = 1000px，进度应为 50%

    // 触发 scroll 事件
    fireEvent.scroll(window);

    expect(progressBar).toHaveStyle({ width: "50%" });
  });

  it("Tier 1: ShareButtons 应该渲染复制链接与第三方平台分享按钮", () => {
    render(<ShareButtons title="测试文章" description="测试描述" />);

    // 检查按钮的存在性（复制链接、Twitter、微博）
    expect(screen.getByTitle("复制链接")).toBeInTheDocument();
    expect(screen.getByTitle("分享到 Twitter/X")).toBeInTheDocument();
    expect(screen.getByTitle("分享到微博")).toBeInTheDocument();
  });

  it("Tier 1: Comments 应该将 Giscus 脚本标签动态注入到 DOM 占位容器中", () => {
    render(
      <ThemeProvider>
        <Comments />
      </ThemeProvider>
    );

    const script = document.querySelector('script[src="https://giscus.app/client.js"]');
    expect(script).toBeInTheDocument();
    expect(script).toHaveAttribute("data-repo", "245678000000/blog");
  });

  // ==========================================
  // Tier 2: 边界与极限 (Edge Cases & Boundaries)
  // ==========================================
  it("Tier 2: 进度条在极限值下（如滚动超限或无滚动空间）必须能处理并在 0%-100% 范围内截断", () => {
    const { container } = render(<ReadingProgress />);
    const progressBar = container.querySelector(".bg-primary");

    // 1. 无滚动空间 (docHeight <= 0)
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 200,
      configurable: true,
    });
    window.innerHeight = 200;
    window.scrollY = 0;
    fireEvent.scroll(window);
    expect(progressBar).toHaveStyle({ width: "0%" });

    // 2. 滚动超限 (scrollY 很大)
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 1000,
      configurable: true,
    });
    window.innerHeight = 200;
    window.scrollY = 1500; // 远超最大滚动 800px
    fireEvent.scroll(window);
    expect(progressBar).toHaveStyle({ width: "100%" });
  });

  it("Tier 2: 剪贴板复制失败时，应该调用 toast.error 展示友好报错", async () => {
    mockWriteText.mockRejectedValueOnce(new Error("Clipboard error"));
    render(<ShareButtons title="测试文章" description="测试描述" />);

    const copyBtn = screen.getByTitle("复制链接");
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("复制失败，请手动复制");
    });
  });

  // ==========================================
  // Tier 3: 跨特性组合 (Cross-Feature Combinations)
  // ==========================================
  it("Tier 3: 主题切换为 light/dark 时，Comments 应动态更新 Giscus script 中的 theme 属性并在已渲染 iframe 时使用 postMessage 同步主题", async () => {
    const { rerender } = render(
      <ThemeProvider defaultTheme="dark">
        <Comments />
      </ThemeProvider>
    );

    let script = document.querySelector('script[src="https://giscus.app/client.js"]');
    expect(script).toHaveAttribute("data-theme", "dark_dimmed");

    // 模拟存在 Giscus 的 iframe
    const mockIframe = document.createElement("iframe");
    mockIframe.className = "giscus-frame";
    const postMessageSpy = vi.fn();
    Object.defineProperty(mockIframe, "contentWindow", {
      value: { postMessage: postMessageSpy },
      configurable: true,
    });
    document.body.appendChild(mockIframe);

    // 重新渲染，触发主题改变
    localStorage.setItem("theme", "light");
    rerender(
      <ThemeProvider defaultTheme="light" key="light-theme">
        <Comments />
      </ThemeProvider>
    );

    // iframe 的 postMessage 应被触发传递 light 主题
    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        giscus: {
          setConfig: {
            theme: "light",
          },
        },
      }),
      "https://giscus.app"
    );

    // 清理 iframe
    mockIframe.remove();
  });

  // ==========================================
  // Tier 4: 真实世界场景 (Real-World Scenarios)
  // ==========================================
  it("Tier 4: 用户滑动长文到最底部，复制文章链接，点击分享至 Twitter 并看到评论区加载的端到端仿真", async () => {
    // 1. 渲染组件
    render(
      <ThemeProvider defaultTheme="dark">
        <ReadingProgress />
        <ShareButtons title="我的文章" description="这是一篇很棒的文章" />
        <Comments />
      </ThemeProvider>
    );

    // 2. 模拟向下滚动到页面底部
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 1500,
      configurable: true,
    });
    window.innerHeight = 500;
    window.scrollY = 1000; // 滚动到底部 (1500-500)
    fireEvent.scroll(window);

    // 3. 点击复制链接按钮
    const copyBtn = screen.getByTitle("复制链接");
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(toast.success).toHaveBeenCalledWith("链接已复制到剪贴板");

    // 4. 点击 Twitter 分享
    const twitterBtn = screen.getByTitle("分享到 Twitter/X");
    fireEvent.click(twitterBtn);
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining("https://twitter.com/intent/tweet"),
      "_blank",
      "noopener,noreferrer"
    );

    // 5. 验证评论区 script 依旧在 DOM 中
    const giscusScript = document.querySelector('script[src="https://giscus.app/client.js"]');
    expect(giscusScript).toBeInTheDocument();
  });
});
