import { test, expect } from "@playwright/test";

test.describe("导航与搜索", () => {
  test("归档页筛选功能", async ({ page }) => {
    await page.goto("/archive");
    await expect(page.locator("h1")).toContainText("文章归档");
    // 点击分类筛选
    const categoryBtn = page.locator('button:has-text("指南")');
    if (await categoryBtn.isVisible()) {
      await categoryBtn.click();
      await expect(page).toHaveURL(/category/);
    }
  });

  test("搜索对话框打开", async ({ page }) => {
    await page.goto("/");
    // 使用键盘快捷键打开搜索
    await page.keyboard.press("Meta+k");
    await expect(
      page.locator('input[placeholder="搜索文章..."]')
    ).toBeVisible();
  });

  test("404 页面", async ({ page }) => {
    await page.goto("/nonexistent-page-xyz");
    await expect(page.locator("text=页面未找到")).toBeVisible();
  });

  test("/writings 与 / 同内容，canonical 必须钉在 /", async ({ page }) => {
    await page.goto("/writings");
    await expect(page.locator("h1")).toContainText("用 Code 和 AI");

    // 两个地址都自我 canonical 就是一对重复内容
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /\/$/);
    await expect(canonical).not.toHaveAttribute("href", /\/writings$/);
  });

  test("旧的文章短地址应跳到 /article/<slug>", async ({ page }) => {
    await page.goto("/advent-of-claude-2025");
    await expect(page).toHaveURL(/\/article\/advent-of-claude-2025$/);
    await expect(page.locator("h1")).toContainText("Claude");
  });
});
