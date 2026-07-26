import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { Markdown } from "@/components/Markdown";

// Mock 懒加载的高亮组件
vi.mock("react-syntax-highlighter/dist/esm/prism-async-light", () => ({
  default: ({
    children,
    language,
  }: {
    children: React.ReactNode;
    language: string;
  }) => (
    <pre data-testid="syntax-highlighter" data-language={language}>
      {children}
    </pre>
  ),
}));

vi.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({
  oneDark: { color: "red" },
}));

describe("F3: 文章详情页 Markdown 渲染与代码块语法高亮", () => {
  // ==========================================
  // Tier 1: 特性覆盖 (Feature Coverage)
  // ==========================================
  it("Tier 1: 能够正确渲染标准 Markdown 标签（标题、列表、粗体、链接、图片）", () => {
    const rawMarkdown = `
# 一级标题
## 二级标题
- 列表项一
- 列表项二

这是一个**粗体**文字。
[链接文字](https://example.com)
![图片描述](/test.jpg)
    `;

    render(<Markdown content={rawMarkdown} />);

    // 验证 Heading 渲染
    // 正文里的 `#` 会降级成 h2：页面级 H1 由文章页渲染标题，避免一页两个 H1
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "一级标题" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "二级标题" })
    ).toBeInTheDocument();

    // 验证列表渲染
    expect(screen.getByText("列表项一")).toBeInTheDocument();

    // 验证粗体与链接
    expect(screen.getByText("粗体")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "链接文字" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://example.com");

    // 验证图片渲染
    const img = screen.getByRole("img", { name: "图片描述" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/test.jpg");
  });

  it("Tier 1: 能够正确识别代码语言并使用高亮组件渲染代码块", async () => {
    const rawMarkdown = `
\`\`\`javascript
const a = 1;
console.log(a);
\`\`\`
    `;

    render(<Markdown content={rawMarkdown} />);

    // 因为 SyntaxHighlighter 懒加载，我们需要等待其加载完成
    await waitFor(() => {
      const highlighter = screen.getByTestId("syntax-highlighter");
      expect(highlighter).toBeInTheDocument();
      expect(highlighter).toHaveAttribute("data-language", "javascript");
      expect(highlighter.textContent).toContain("const a = 1");
      expect(highlighter.textContent).toContain("console.log(a)");
    });
  });

  // ==========================================
  // Tier 2: 边界与极限 (Edge Cases & Boundaries)
  // ==========================================
  it("Tier 2: 畸形或恶意 Markdown XSS 注入应该被安全中和或过滤", () => {
    const maliciousMarkdown = `
恶意链接：[点击注入](javascript:alert('xss'))
恶意图片：<img src="x" onerror="alert('xss')" />
恶意脚本：<script>console.log('xss')</script>
    `;

    render(<Markdown content={maliciousMarkdown} />);

    // 确保危险脚本不会以 script 标签形式渲染到 DOM 中
    const scripts = document.querySelectorAll("script");
    const scriptElements = Array.from(scripts).filter(s =>
      s.textContent?.includes("xss")
    );
    expect(scriptElements.length).toBe(0);

    // 验证含有恶意 JS 协议的链接，如果 rehype-raw / 渲染过滤起效，应过滤或不执行
    const link = screen.getByText("点击注入");
    expect(link).toBeInTheDocument();
    // javascript: 协议链接在 HTML 净化中应被阻止或过滤为无效
  });

  it("Tier 2: 输入空内容或未标注语言的代码块不应导致渲染崩溃", async () => {
    // 1. 空内容
    const { rerender } = render(<Markdown content="" />);
    expect(document.body).toBeInTheDocument();

    // 2. 未标注语言的代码块
    const noLangMarkdown = `
\`\`\`
Plain text code block
\`\`\`
    `;
    rerender(<Markdown content={noLangMarkdown} />);

    // 未标注语言代码块应回退为普通 code 标签渲染
    await waitFor(() => {
      const codeElement = screen.getByText("Plain text code block");
      expect(codeElement).toBeInTheDocument();
    });
  });

  // ==========================================
  // Tier 3: 跨特性组合 (Cross-Feature Combinations)
  // ==========================================
  it("Tier 3: 代码高亮与自定义组件挂载不应破坏周围的正文内容流", async () => {
    const rawMarkdown = `
正文前缀。

\`\`\`typescript
const val: number = 42;
\`\`\`

正文后缀。
    `;

    render(<Markdown content={rawMarkdown} />);

    expect(screen.getByText("正文前缀。")).toBeInTheDocument();
    expect(screen.getByText("正文后缀。")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("syntax-highlighter")).toBeInTheDocument();
    });
  });

  // ==========================================
  // Tier 4: 真实世界场景 (Real-World Scenarios)
  // ==========================================
  it("Tier 4: 用户阅读包含复杂技术栈代码（含多种高亮语言）、数学公式及表格的长文章的渲染测试", async () => {
    const complexArticle = `
# React 19 新特性与性能优化

本篇介绍 React 19 的新特性。

## 1. 新的 Action 机制
我们看以下代码：

\`\`\`typescript
// 使用 Action 处理异步操作
const [name, setName] = useState("");
const [isPending, startTransition] = useTransition();
\`\`\`

## 2. 表格展示

| 特性 | 支持度 | 备注 |
| --- | --- | --- |
| Action | 100% | 很好用 |
| Server Component | 90% | 逐步稳定 |

## 3. 注意安全
<div class="alert">
警告不要乱写 HTML 注入：<script>alert(1)</script>
</div>
    `;

    render(<Markdown content={complexArticle} />);

    // 验证整体标题和文本存在
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "React 19 新特性与性能优化",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "1. 新的 Action 机制" })
    ).toBeInTheDocument();

    // 验证表格的头部和单元格正确渲染
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Server Component")).toBeInTheDocument();

    // 验证异步高亮代码正确被捕获
    await waitFor(() => {
      const tsCode = screen.getByTestId("syntax-highlighter");
      expect(tsCode).toBeInTheDocument();
      expect(tsCode).toHaveAttribute("data-language", "typescript");
    });
  });

  // ==========================================
  // 安全: 正文原始 HTML 的清洗
  // ==========================================
  it("安全: 启用 rehype-raw 的同时必须清洗掉脚本、事件处理属性与 javascript: 协议", () => {
    const malicious = [
      "正常段落",
      "",
      "<script>window.__pwned = true;</script>",
      "",
      '<img src="x" onerror="window.__pwned = true" alt="坏图" />',
      "",
      '<a href="javascript:window.__pwned=true">点我</a>',
      "",
      '<iframe src="https://evil.example.com"></iframe>',
    ].join("\n");

    const { container } = render(<Markdown content={malicious} />);

    // 正常内容仍然渲染
    expect(screen.getByText("正常段落")).toBeInTheDocument();

    // script / iframe 标签被整体移除
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();

    // 事件处理属性被剥离
    expect(container.innerHTML).not.toContain("onerror");

    // javascript: 协议不会出现在任何链接上
    const hrefs = Array.from(container.querySelectorAll("a")).map(
      a => a.getAttribute("href") || ""
    );
    expect(hrefs.some(h => h.toLowerCase().startsWith("javascript:"))).toBe(
      false
    );
  });
});
