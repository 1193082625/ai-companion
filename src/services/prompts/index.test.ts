import { describe, it, expect } from 'vitest';
import { WORK_MODE_PROMPTS, WORK_MODE_DEFAULTS } from '../prompts';

describe('Work Mode Prompts', () => {
  it('should have prompts for all work modes', () => {
    const modes = ['chat', 'code', 'project', 'content'] as const;

    modes.forEach((mode) => {
      expect(WORK_MODE_PROMPTS[mode]).toBeDefined();
      expect(typeof WORK_MODE_PROMPTS[mode]).toBe('string');
      expect(WORK_MODE_PROMPTS[mode].length).toBeGreaterThan(0);
    });
  });

  it('should have different prompts for each mode', () => {
    // Each mode should have unique prompt content
    expect(WORK_MODE_PROMPTS.chat).not.toBe(WORK_MODE_PROMPTS.code);
    expect(WORK_MODE_PROMPTS.code).not.toBe(WORK_MODE_PROMPTS.project);
    expect(WORK_MODE_PROMPTS.project).not.toBe(WORK_MODE_PROMPTS.content);
    expect(WORK_MODE_PROMPTS.content).not.toBe(WORK_MODE_PROMPTS.chat);
  });

  it('should contain relevant keywords for each mode', () => {
    // Chat mode should focus on helpfulness
    expect(WORK_MODE_PROMPTS.chat).toContain('帮助');

    // Code mode should focus on programming
    expect(WORK_MODE_PROMPTS.code).toContain('代码');

    // Project mode should focus on planning
    expect(WORK_MODE_PROMPTS.project).toContain('项目');

    // Content mode should focus on creation
    expect(WORK_MODE_PROMPTS.content).toContain('内容');
  });
});

describe('Work Mode Config', () => {
  it('should have config for all work modes', () => {
    const modes = ['chat', 'code', 'project', 'content'] as const;

    modes.forEach((mode) => {
      expect(WORK_MODE_DEFAULTS[mode]).toBeDefined();
      expect(WORK_MODE_DEFAULTS[mode].temperature).toBeDefined();
      expect(WORK_MODE_DEFAULTS[mode].maxTokens).toBeDefined();
    });
  });

  it('should have different temperatures for each mode', () => {
    // Code mode should have lower temperature for precision
    expect(WORK_MODE_DEFAULTS.code.temperature).toBeLessThan(WORK_MODE_DEFAULTS.chat.temperature);

    // Content mode should have higher temperature for creativity
    expect(WORK_MODE_DEFAULTS.content.temperature).toBeGreaterThan(WORK_MODE_DEFAULTS.chat.temperature);
  });

  it('should have appropriate maxTokens for each mode', () => {
    // Code mode should have higher maxTokens for longer outputs
    expect(WORK_MODE_DEFAULTS.code.maxTokens).toBeGreaterThanOrEqual(WORK_MODE_DEFAULTS.chat.maxTokens);
  });

  it('should have valid temperature range', () => {
    const modes = ['chat', 'code', 'project', 'content'] as const;

    modes.forEach((mode) => {
      expect(WORK_MODE_DEFAULTS[mode].temperature).toBeGreaterThanOrEqual(0);
      expect(WORK_MODE_DEFAULTS[mode].temperature).toBeLessThanOrEqual(1);
    });
  });
});
