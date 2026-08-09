import { render, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";

// sonner 只有在真的有 toast 时才渲染带主题属性的容器，
// 空 Toaster 只有一个 <section> 壳子。
async function renderWithToast(theme: "light" | "dark") {
  localStorage.setItem("theme", theme);
  const { container } = render(
    <ThemeProvider>
      <Toaster />
    </ThemeProvider>
  );

  await act(async () => {
    toast("你好");
  });

  const toaster = await waitFor(() => {
    const el = container.querySelector("[data-sonner-toaster]");
    if (!el) throw new Error("toaster 尚未渲染");
    return el;
  });

  return toaster;
}

describe("F14: Toast 主题跟随站点主题", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  // shadcn 的默认 sonner 实现从 next-themes 取主题，但本项目用的是自己的
  // ThemeContext，没有挂 next-themes 的 Provider——那样 theme 恒为 undefined、
  // 回退成 "system"，toast 会跟随操作系统而不是站点的主题开关
  //（系统亮色 + 站点切深色时，toast 是亮的）。
  it("站点为深色时 toaster 应为 dark", async () => {
    const toaster = await renderWithToast("dark");
    expect(toaster.getAttribute("data-sonner-theme")).toBe("dark");
  });

  it("站点为亮色时 toaster 应为 light", async () => {
    const toaster = await renderWithToast("light");
    expect(toaster.getAttribute("data-sonner-theme")).toBe("light");
  });

  it("绝不应是 system —— 那意味着又接回了 next-themes", async () => {
    const toaster = await renderWithToast("dark");
    expect(toaster.getAttribute("data-sonner-theme")).not.toBe("system");
  });
});
