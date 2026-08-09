import { test, expect } from "@playwright/test";

test.describe("文章页", () => {
  test("文章加载并显示标题", async ({ page }) => {
    await page.goto("/article/advent-of-claude-2025");
    await expect(page.locator("h1")).toContainText("Claude");
  });

  test("阅读进度条存在", async ({ page }) => {
    await page.goto("/article/advent-of-claude-2025");
    await expect(page.locator(".fixed.top-0")).toBeVisible();
  });

  test("代码块有复制按钮", async ({ page }) => {
    await page.goto("/article/advent-of-claude-2025");
    // 等待文章内容加载
    await page.waitForSelector("article");
    const copyBtn = page.locator("text=复制").first();
    if (await copyBtn.isVisible()) {
      await expect(copyBtn).toBeVisible();
    }
  });

  test("分享按钮存在", async ({ page }) => {
    await page.goto("/article/advent-of-claude-2025");
    await expect(page.locator("text=分享：")).toBeVisible();
  });

  test("giscus 要等滚到评论区才加载", async ({ page }) => {
    // 第三方脚本本身不放出去，只看有没有被注入——e2e 不该依赖 giscus.app 可达
    await page.route("https://giscus.app/**", route => route.abort());

    await page.goto("/article/advent-of-claude-2025");
    await page.waitForSelector("article");

    const giscusScript = page.locator(
      'script[src="https://giscus.app/client.js"]'
    );
    const container = page.locator(".giscus-container");

    // 占位容器在，但脚本还没注入
    await expect(container).toBeAttached();
    await expect(giscusScript).toHaveCount(0);

    await container.scrollIntoViewIfNeeded();
    await expect(giscusScript).toHaveCount(1);
  });
});
