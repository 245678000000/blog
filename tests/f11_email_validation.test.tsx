import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { EMAIL_PATTERN, isValidEmail } from "@/lib/validation";
import { Newsletter } from "@/components/Newsletter";
import Contact from "@/pages/Contact";
import { toast } from "sonner";

// Mock wouter
vi.mock("wouter", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
}));

// Mock SEO
vi.mock("@/components/SEO", () => ({
  SEO: ({ title }: { title: string }) => (
    <div data-testid="seo-title">{title}</div>
  ),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// jsdom 对 window.location.href = 'mailto:...' 只会打印「Not implemented: navigation」
// 警告但不会抛错，因此无需 mock location，用 toast.success 判定是否进入提交流程即可。

describe("F11: 邮箱格式校验（validation.ts 单元 + Contact/Newsletter 集成）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // 校验函数本身
  // ==========================================
  it.each([
    ["abc", "无 @ 符号"],
    ["a@", "缺域名"],
    ["@b.com", "缺本地部分"],
    ["a@b", "缺顶级域点"],
    ["a@.com", "域名以点开头"],
    ["a b@c.com", "本地部分含空格"],
    ["", "空串"],
    ["   ", "纯空白"],
  ])("isValidEmail 应拒绝「%s」(%s)", input => {
    expect(isValidEmail(input)).toBe(false);
    expect(EMAIL_PATTERN.test(input.trim())).toBe(false);
  });

  it.each([
    ["a@b.com", "最简形态"],
    ["user.name+tag@example.co.uk", "含点、加号、多级域名"],
    ["XINGPENG278@aliyun.com", "大写"],
    ["  a@b.com  ", "首尾空格应被 trim"],
  ])("isValidEmail 应通过「%s」(%s)", input => {
    expect(isValidEmail(input)).toBe(true);
  });

  // ==========================================
  // Contact 表单集成
  // ==========================================
  it("Contact: 邮箱非法时提交应显示行内错误且不进入提交流程", async () => {
    render(<Contact />);

    fireEvent.change(screen.getByLabelText(/姓名 \*/), {
      target: { value: "张三" },
    });
    fireEvent.change(screen.getByLabelText(/邮箱 \*/), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(screen.getByLabelText(/留言 \*/), {
      target: { value: "留言内容" },
    });

    const submitBtn = screen.getByRole("button", { name: /发送消息/i });
    await act(async () => {
      fireEvent.submit(submitBtn.closest("form") || submitBtn);
    });

    // 行内错误提示出现
    expect(screen.getByText("请输入有效的邮箱地址")).toBeInTheDocument();
    // 邮箱输入框标记 aria-invalid
    const emailInput = screen.getByLabelText(/邮箱 \*/);
    expect(emailInput).toHaveAttribute("aria-invalid", "true");
    // 不应进入提交成功流程
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("Contact: 修正邮箱后行内错误应即时消失", async () => {
    render(<Contact />);

    fireEvent.change(screen.getByLabelText(/姓名 \*/), {
      target: { value: "张三" },
    });
    fireEvent.change(screen.getByLabelText(/邮箱 \*/), {
      target: { value: "bad" },
    });
    fireEvent.change(screen.getByLabelText(/留言 \*/), {
      target: { value: "留言" },
    });

    const submitBtn = screen.getByRole("button", { name: /发送消息/i });
    await act(async () => {
      fireEvent.submit(submitBtn.closest("form") || submitBtn);
    });
    expect(screen.getByText("请输入有效的邮箱地址")).toBeInTheDocument();

    // 用户修正邮箱
    fireEvent.change(screen.getByLabelText(/邮箱 \*/), {
      target: { value: "good@example.com" },
    });

    // 错误即时消失
    expect(screen.queryByText("请输入有效的邮箱地址")).not.toBeInTheDocument();
  });

  it("Contact: 合法邮箱提交应进入提交流程", async () => {
    render(<Contact />);

    fireEvent.change(screen.getByLabelText(/姓名 \*/), {
      target: { value: "张三" },
    });
    fireEvent.change(screen.getByLabelText(/邮箱 \*/), {
      target: { value: "zhangsan@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/留言 \*/), {
      target: { value: "正常留言" },
    });

    const submitBtn = screen.getByRole("button", { name: /发送消息/i });
    await act(async () => {
      fireEvent.submit(submitBtn.closest("form") || submitBtn);
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  // ==========================================
  // Newsletter 表单集成
  // ==========================================
  it("Newsletter: 邮箱非法时应提示且不进入提交流程", async () => {
    render(<Newsletter />);

    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
      target: { value: "a@" },
    });

    const submitBtn = screen.getByRole("button", { name: /订阅/i });
    await act(async () => {
      fireEvent.submit(submitBtn.closest("form") || submitBtn);
    });

    expect(toast.error).toHaveBeenCalledWith("请输入有效的邮箱地址");
    // 未配置 VITE_NEWSLETTER_ENDPOINT 时合法邮箱会走 mailto 并 toast.success，非法邮箱不应触发
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("Newsletter: 合法邮箱（无 endpoint）应进入提交流程", async () => {
    render(<Newsletter />);

    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
      target: { value: "sub@example.com" },
    });

    const submitBtn = screen.getByRole("button", { name: /订阅/i });
    await act(async () => {
      fireEvent.submit(submitBtn.closest("form") || submitBtn);
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
