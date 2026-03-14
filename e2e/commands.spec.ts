import { test, expect } from '@playwright/test';

test.describe('Chat Commands', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
    // 等待页面加载完成
    await expect(page.locator('html')).toBeVisible({ timeout: 10000 });
    // 创建新会话 - 点击"新建对话"按钮
    await page.getByRole('button', { name: /新建对话/ }).click();
    // 等待输入框出现
    await expect(page.locator('textarea').first()).toBeVisible({ timeout: 5000 });
  });

  test('should recognize /compact command and clear input', async ({ page }) => {
    // 找到输入框
    const input = page.locator('textarea').first();

    // 输入 /compact 命令
    await input.fill('/compact');

    // 找到发送按钮 - 使用更精确的选择器
    const sendButton = page.locator('div.flex.items-stretch button').first();

    // 点击发送按钮
    await sendButton.click();

    // 等待一小段时间让状态更新
    await page.waitForTimeout(500);

    // 验证输入框被清空
    const inputValue = await input.inputValue();
    expect(inputValue).toBe('');
  });

  test('should recognize /clear command and clear input', async ({ page }) => {
    // 找到输入框
    const input = page.locator('textarea').first();

    // 输入 /clear 命令
    await input.fill('/clear');

    // 找到发送按钮 - 使用更精确的选择器
    const sendButton = page.locator('div.flex.items-stretch button').first();

    // 点击发送按钮
    await sendButton.click();

    // 等待一小段时间让状态更新
    await page.waitForTimeout(500);

    // 验证输入框被清空
    const inputValue = await input.inputValue();
    expect(inputValue).toBe('');
  });
});
