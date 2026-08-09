import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { SearchDialog } from "@/components/SearchDialog";

// jsdom 没有实现 scrollIntoView，cmdk 选中项时会调用它
Element.prototype.scrollIntoView = vi.fn();

const { setLocation } = vi.hoisted(() => ({ setLocation: vi.fn() }));

vi.mock("wouter", () => ({
  useLocation: () => ["/", setLocation],
}));

vi.mock("@shared/articles", () => ({
  getPublishedArticles: () =>
    Promise.resolve([
      {
        slug: "hello-world",
        title: "Hello World",
        description: "第一篇文章",
        category: "技术",
        date: "2026-01-01",
        readTime: "1 分钟",
        image: "",
        published: true,
        tags: ["Vitest", "护栏"],
      },
      {
        slug: "second-post",
        title: "第二篇",
        description: "另一篇",
        category: "随笔",
        date: "2026-01-02",
        readTime: "2 分钟",
        image: "",
        published: true,
        tags: ["生活"],
      },
    ]),
}));

async function renderOpen() {
  const onOpenChange = vi.fn();
  render(<SearchDialog open onOpenChange={onOpenChange} />);
  await waitFor(() => expect(screen.getByText("Hello World")).toBeTruthy());
  return { onOpenChange };
}

describe("F13: 搜索弹窗", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // 键盘可达性——这条是回归测试，曾经是真实缺陷
  // ==========================================
  it("键盘选中结果按回车应跳转到文章", async () => {
    // 曾经的实现把 CommandItem 包在 <Link> 里，靠点击冒泡跳转。
    // cmdk 的回车只调 onSelect、不会合成 click，导致纯键盘用户
    // 按回车只关掉弹窗、停在原地——搜索对键盘用户完全不可用。
    const { onOpenChange } = await renderOpen();
    const input = screen.getByPlaceholderText("搜索文章...");

    // 先筛到只剩一篇文章：search 为空时列表第一组是「分类」，
    // 直接按方向键会选中分类项，测不到文章的跳转
    fireEvent.change(input, { target: { value: "Hello" } });
    await waitFor(() => expect(screen.queryByText("第二篇")).toBeNull());

    fireEvent.keyDown(input, { key: "Enter" });

    expect(setLocation).toHaveBeenCalledTimes(1);
    expect(setLocation).toHaveBeenCalledWith("/article/hello-world");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("方向键切换后回车应跳转到被选中的那一篇", async () => {
    await renderOpen();
    const input = screen.getByPlaceholderText("搜索文章...");

    fireEvent.change(input, { target: { value: "篇" } });
    await waitFor(() => expect(screen.getByText("第二篇")).toBeTruthy());

    // 两篇都命中（"第一篇文章" 与 "第二篇"），下移一格选中第二条
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(setLocation).toHaveBeenCalledTimes(1);
    expect(setLocation).toHaveBeenCalledWith("/article/second-post");
  });

  it("回车选中分类项时应改为填入搜索词，而不是跳转", async () => {
    await renderOpen();
    const input = screen.getByPlaceholderText("搜索文章...");

    // search 为空时第一组是分类，首项默认选中
    fireEvent.keyDown(input, { key: "Enter" });

    expect(setLocation).not.toHaveBeenCalled();
    await waitFor(() => expect((input as HTMLInputElement).value).toBe("技术"));
  });

  it("鼠标点击结果应跳转，且只跳一次", async () => {
    await renderOpen();

    fireEvent.click(screen.getByText("Hello World"));

    // 只跳一次：既不能不跳，也不能因为 onSelect 与 <a> 同时生效而跳两次
    expect(setLocation).toHaveBeenCalledTimes(1);
    expect(setLocation).toHaveBeenCalledWith("/article/hello-world");
  });

  // ==========================================
  // 搜索范围
  // ==========================================
  it("应能按标题搜索", async () => {
    await renderOpen();
    fireEvent.change(screen.getByPlaceholderText("搜索文章..."), {
      target: { value: "Hello" },
    });

    await waitFor(() => {
      expect(screen.getByText("Hello World")).toBeTruthy();
      expect(screen.queryByText("第二篇")).toBeNull();
    });
  });

  it("应能按标签搜索（标签不在可见文本里，需要 CommandItem 的 value 一并覆盖）", async () => {
    await renderOpen();
    fireEvent.change(screen.getByPlaceholderText("搜索文章..."), {
      target: { value: "护栏" },
    });

    // 只在自己的过滤里加标签、不同步 CommandItem 的 value，
    // 结果会被 cmdk 的二次过滤悄悄丢掉
    await waitFor(() => {
      expect(screen.getByText("Hello World")).toBeTruthy();
      expect(screen.queryByText("第二篇")).toBeNull();
    });
  });

  it("应能按分类搜索", async () => {
    await renderOpen();
    fireEvent.change(screen.getByPlaceholderText("搜索文章..."), {
      target: { value: "随笔" },
    });

    await waitFor(() => {
      expect(screen.getByText("第二篇")).toBeTruthy();
      expect(screen.queryByText("Hello World")).toBeNull();
    });
  });

  it("无匹配时应显示空状态", async () => {
    await renderOpen();
    fireEvent.change(screen.getByPlaceholderText("搜索文章..."), {
      target: { value: "不存在的关键词zzz" },
    });

    await waitFor(() => {
      expect(screen.getByText("没有找到结果")).toBeTruthy();
    });
  });
});
