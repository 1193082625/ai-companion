import { test, expect } from '@playwright/test';

test.describe('AI Companion App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load chat page after initialization', async ({ page }) => {
    // Wait for page to load
    await expect(page.locator('html')).toBeVisible({ timeout: 10000 });
  });

  test('should show app title', async ({ page }) => {
    // Check for app heading
    await expect(page.getByRole('heading', { name: 'AI 伙伴' })).toBeVisible({ timeout: 10000 });
  });

  test('should show work mode buttons in sidebar', async ({ page }) => {
    // Check for work mode buttons (code, project, content)
    await expect(page.getByRole('button', { name: /代码/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /项目/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /创作/ })).toBeVisible({ timeout: 10000 });
  });

  test('should show new chat button', async ({ page }) => {
    // Check for new chat button
    await expect(page.getByRole('button', { name: /新建对话/ })).toBeVisible({ timeout: 10000 });
  });
});
