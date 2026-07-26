import { test, expect } from "@playwright/test";

test.describe("首页", () => {
  test("加载并显示 Hero 标题", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("用 Code 和 AI");
  });

  test("导航链接正常工作", async ({ page }) => {
    await page.goto("/");
    await page.click('nav a[href="/archive"]');
    await expect(page).toHaveURL("/archive");
    await expect(page.locator("h1")).toContainText("文章归档");
  });

  test("主题切换", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    // 默认应该有 dark 或 light class
    await page.click('[data-testid="theme-toggle"]');
    await expect(html).toHaveClass(/light|dark/);
  });

  test("精选文章区域可见", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=精选文章")).toBeVisible();
  });
});
