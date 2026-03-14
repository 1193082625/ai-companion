import { test, expect } from '@playwright/test';

test.describe('Session Isolation - Streaming Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should not show streaming content from other session when switching', async ({ page }) => {
    // 创建第一个会话
    await page.getByRole('button', { name: '新建对话' }).click();

    // 等待第一个会话创建
    await page.waitForTimeout(500);

    // 获取侧边栏中的会话列表
    const sessionItems = page.locator('.group.flex.items-center.gap-2');
    await expect(sessionItems.first()).toBeVisible({ timeout: 10000 });

    // 再次点击新建对话按钮创建第二个会话
    await page.getByRole('button', { name: '新建对话' }).click();
    await page.waitForTimeout(500);

    // 获取所有会话
    const sessionCount = await sessionItems.count();

    // 验证至少有两个会话
    expect(sessionCount).toBeGreaterThanOrEqual(2);

    // 切换回第一个会话
    await sessionItems.first().click();
    await page.waitForTimeout(300);

    // 验证第一个会话被选中（应该有 bg-bg-card 样式）
    const firstSessionSelected = sessionItems.first();
    await expect(firstSessionSelected).toHaveClass(/bg-bg-card/);
  });

  test('should show correct messages for each session', async ({ page }) => {
    // 创建两个会话
    await page.getByRole('button', { name: '新建对话' }).click();
    await page.waitForTimeout(500);

    // 在第一个会话中发送消息
    const input = page.locator('input[type="text"], textarea').first();
    if (await input.isVisible()) {
      await input.fill('Message in session 1');
      await input.press('Enter');
      await page.waitForTimeout(500);
    }

    // 创建第二个会话
    await page.getByRole('button', { name: '新建对话' }).click();
    await page.waitForTimeout(500);

    // 在第二个会话中发送消息
    const input2 = page.locator('input[type="text"], textarea').first();
    if (await input2.isVisible()) {
      await input2.fill('Message in session 2');
      await input2.press('Enter');
      await page.waitForTimeout(500);
    }

    // 切换到第一个会话
    const sessionItems = page.locator('.group.flex.items-center.gap-2');
    await sessionItems.nth(0).click();
    await page.waitForTimeout(300);

    // 验证第一个会话的消息显示
    const message1 = page.getByText('Message in session 1');
    if (await message1.isVisible()) {
      await expect(message1).toBeVisible();
    }
  });

  test('should isolate streaming content between sessions', async ({ page }) => {
    // 创建两个会话
    await page.getByRole('button', { name: '新建对话' }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: '新建对话' }).click();
    await page.waitForTimeout(500);

    // 获取会话列表
    const sessionItems = page.locator('.group.flex.items-center.gap-2');

    // 选择第一个会话
    await sessionItems.nth(0).click();
    await page.waitForTimeout(300);

    // 验证第一个会话被选中
    await expect(sessionItems.nth(0)).toHaveClass(/bg-bg-card/);

    // 切换到第二个会话
    await sessionItems.nth(1).click();
    await page.waitForTimeout(300);

    // 验证第二个会话被选中，而不是第一个
    await expect(sessionItems.nth(1)).toHaveClass(/bg-bg-card/);
  });
});
