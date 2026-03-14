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
});
