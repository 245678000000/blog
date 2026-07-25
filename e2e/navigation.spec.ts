import { test, expect } from '@playwright/test';

test.describe('导航与搜索', () => {
  test('归档页筛选功能', async ({ page }) => {
    await page.goto('/archive');
    await expect(page.locator('h1')).toContainText('文章归档');
    // 点击分类筛选
    const categoryBtn = page.locator('button:has-text("指南")');
    if (await categoryBtn.isVisible()) {
      await categoryBtn.click();
      await expect(page).toHaveURL(/category/);
    }
  });

  test('搜索对话框打开', async ({ page }) => {
    await page.goto('/');
    // 使用键盘快捷键打开搜索
    await page.keyboard.press('Meta+k');
    await expect(page.locator('input[placeholder="搜索文章..."]')).toBeVisible();
  });

  test('404 页面', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    await expect(page.locator('text=页面未找到')).toBeVisible();
  });
});
