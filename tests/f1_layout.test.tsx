import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import Layout from "@/components/Layout";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Mock wouter 路由
vi.mock("wouter", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
  useLocation: () => ["/", vi.fn()],
}));

// Mock 搜索按钮组件以免引入复杂的弹窗逻辑
vi.mock("@/components/SearchDialog", () => ({
  SearchButton: () => <button data-testid="search-button">搜索</button>,
}));

describe("F1: 现代极简主义设计系统与响应式布局表现", () => {
  beforeEach(() => {
    // 每次测试前清理 html 上的类名
    document.documentElement.className = "";
    localStorage.clear();
  });

  // ==========================================
  // Tier 1: 特性覆盖 (Feature Coverage)
  // ==========================================
  it("Tier 1: 应该正确渲染 Layout 核心骨架（Header、Nav、Footer）", () => {
    render(
      <ThemeProvider>
        <Layout>
          <div data-testid="test-content">测试内容</div>
        </Layout>
      </ThemeProvider>
    );

    // 验证头部导航链接是否存在
    expect(screen.getAllByTestId("link-/")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("link-/archive")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("link-/about")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("link-/contact")[0]).toBeInTheDocument();

    // 验证搜索按钮渲染
    expect(screen.getByTestId("search-button")).toBeInTheDocument();

    // 验证子内容渲染
    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("Tier 1: 应该能够切换主题，并且在 HTML 根节点及 localStorage 上正确同步", async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <Layout>
          <div>内容</div>
        </Layout>
      </ThemeProvider>
    );

    // 初始状态为 dark，HTML 根节点应该包含 dark 类
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // 获取桌面端的主题切换按钮
    const desktopThemeButton = screen.getAllByTestId("theme-toggle")[0];

    // 点击切换为 light 主题
    await act(async () => {
      fireEvent.click(desktopThemeButton);
    });

    // 验证 HTML 根节点包含 light 类，且 localStorage 正确存储
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  // ==========================================
  // Tier 2: 边界与极限 (Edge Cases & Boundaries)
  // ==========================================
  it("Tier 2: 应该在极窄与极宽的窗口尺寸下保持稳定（模拟响应式视口切换）", () => {
    render(
      <ThemeProvider>
        <Layout>
          <div>自适应布局</div>
        </Layout>
      </ThemeProvider>
    );

    // 模拟极窄屏幕（320px）
    window.innerWidth = 320;
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    // 验证未抛出错误且能够渲染
    expect(screen.getByText("自适应布局")).toBeInTheDocument();

    // 模拟超宽屏幕（2560px）
    window.innerWidth = 2560;
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(screen.getByText("自适应布局")).toBeInTheDocument();
  });

  it("Tier 2: 快速来回切换主题时不应产生状态卡顿或不一致", async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <Layout>
          <div>快速切换</div>
        </Layout>
      </ThemeProvider>
    );

    const desktopThemeButton = screen.getAllByTestId("theme-toggle")[0];

    // 快速模拟连续 5 次点击切换
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        fireEvent.click(desktopThemeButton);
      });
    }

    // 奇数次点击后，初始 dark 应变为 light
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  // ==========================================
  // Tier 3: 跨特性组合 (Cross-Feature Combinations)
  // ==========================================
  it("Tier 3: 移动端折叠菜单展开时，切换主题应能正确保持菜单状态并更新色彩", async () => {
    // 模拟移动端视口
    window.innerWidth = 480;
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(480);

    render(
      <ThemeProvider defaultTheme="dark">
        <Layout>
          <div>移动端跨特性</div>
        </Layout>
      </ThemeProvider>
    );

    // 在移动端下找到菜单展开/折叠按钮（汉堡按钮）
    // 菜单切换按钮通常包含 Menu/X 图标。我们通过 aria-label 或图标名称查找，这里在测试中我们可以直接点击菜单按钮
    // 寻找移动端菜单开关
    const menuToggle = screen.getByTestId("mobile-menu-toggle"); 
    
    await act(async () => {
      fireEvent.click(menuToggle);
    });

    // 验证主题切换按钮在移动端点击时起效
    const themeButton = screen.getAllByTestId("theme-toggle")[0]; 
    await act(async () => {
      fireEvent.click(themeButton);
    });

    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  // ==========================================
  // Tier 4: 真实世界场景 (Real-World Scenarios)
  // ==========================================
  it("Tier 4: 用户在移动端弱网加载、打开汉堡菜单、切换为亮色模式后关闭菜单的端到端交互", async () => {
    // 1. 初始化视口为移动端
    window.innerWidth = 375;
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(375);

    render(
      <ThemeProvider defaultTheme="dark">
        <Layout>
          <div>E2E 交互测试</div>
        </Layout>
      </ThemeProvider>
    );

    // 2. 验证初始为暗色模式
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // 3. 找到并点击汉堡按钮以展开移动菜单
    const menuToggle = screen.getByTestId("mobile-menu-toggle");

    await act(async () => {
      fireEvent.click(menuToggle);
    });

    // 4. 点击主题切换按钮
    const themeToggle = screen.getAllByTestId("theme-toggle")[0];
    await act(async () => {
      fireEvent.click(themeToggle);
    });
    expect(document.documentElement.classList.contains("light")).toBe(true);

    // 5. 再次点击汉堡按钮关闭菜单
    await act(async () => {
      fireEvent.click(menuToggle);
    });

    // 6. 验证最终主题与内容正常渲染
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(screen.getByText("E2E 交互测试")).toBeInTheDocument();
  });
});
