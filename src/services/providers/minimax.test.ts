import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Message, AIConfig } from '../../types';
import { MiniMaxProvider } from './minimax';

describe('MiniMaxProvider', () => {
  let provider: MiniMaxProvider;

  beforeEach(() => {
    provider = new MiniMaxProvider();
  });

  describe('provider configuration', () => {
    it('should have correct provider type', () => {
      expect(provider.provider).toBe('minimax');
    });

    it('should have default baseUrl', () => {
      expect(provider.baseUrl).toBe('https://api.minimaxi.com/v1');
    });

    it('should have default model', () => {
      expect(provider.defaultModel).toBe('MiniMax-M2.5');
    });
  });

  describe('formatRequest', () => {
    it('should format request with default model', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'minimax',
        apiKey: 'test-key',
      };

      const request = provider.formatRequest(messages, config);

      expect(request.model).toBe('MiniMax-M2.5');
      expect(request.messages).toHaveLength(1);
      expect(request.messages[0].role).toBe('user');
      expect(request.messages[0].content).toBe('Hello');
    });

    it('should use custom model from config', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'minimax',
        apiKey: 'test-key',
        model: 'abab6.5s-chat',
      };

      const request = provider.formatRequest(messages, config);

      expect(request.model).toBe('abab6.5s-chat');
    });

    it('should include default temperature and max_tokens', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'minimax',
        apiKey: 'test-key',
      };

      const request = provider.formatRequest(messages, config);

      expect(request.temperature).toBe(0.7);
      expect(request.max_tokens).toBe(4096);
    });

    it('should use custom temperature and maxTokens', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'minimax',
        apiKey: 'test-key',
        temperature: 0.9,
        maxTokens: 8192,
      };

      const request = provider.formatRequest(messages, config);

      expect(request.temperature).toBe(0.9);
      expect(request.max_tokens).toBe(8192);
    });

    it('should treat null temperature as undefined and use default', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'minimax',
        apiKey: 'test-key',
        temperature: null as any,
      };

      const request = provider.formatRequest(messages, config);

      // null ?? 0.7 returns 0.7 (nullish coalescing treats null as undefined)
      expect(request.temperature).toBe(0.7);
    });
  });

  describe('parseResponse', () => {
    it('should extract content from response', () => {
      const response = {
        id: 'chat-123',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello, how can I help you?',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      const result = provider.parseResponse(response);
      expect(result).toBe('Hello, how can I help you?');
    });

    it('should return empty string if no content', () => {
      const response = {
        id: 'chat-123',
        choices: [],
      };

      const result = provider.parseResponse(response);
      expect(result).toBe('');
    });

    it('should handle missing message gracefully', () => {
      const response = {
        id: 'chat-123',
        choices: [{ index: 0, message: {}, finish_reason: 'stop' }],
      };

      const result = provider.parseResponse(response);
      expect(result).toBe('');
    });
  });

  describe('chat', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should make successful API call', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'minimax',
        apiKey: 'test-api-key',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'chat-123',
            choices: [
              {
                index: 0,
                message: { role: 'assistant', content: 'Hi there!' },
                finish_reason: 'stop',
              },
            ],
          }),
      });

      const result = await provider.chat(messages, config);

      expect(result).toBe('Hi there!');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.minimaxi.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'test-api-key',
          }),
        })
      );
    });

    it('should use custom baseUrl', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'minimax',
        apiKey: 'test-api-key',
        baseUrl: 'https://custom.minimax.com/v1',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Hi!' }, finish_reason: 'stop' }],
          }),
      });

      await provider.chat(messages, config);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://custom.minimax.com/v1/chat/completions',
        expect.any(Object)
      );
    });

    it('should throw error on API failure', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'minimax',
        apiKey: 'test-key',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      await expect(provider.chat(messages, config)).rejects.toThrow(
        'MiniMax API Error: 401 - Unauthorized'
      );
    });
  });

  describe('chatStream', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should handle streaming response', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'minimax',
        apiKey: 'test-key',
      };

      const onChunk = vi.fn();

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}\n' +
                'data: {"choices":[{"delta":{"content":" World"},"finish_reason":null}]}\n' +
                'data: [DONE]\n'
            )
          );
          controller.close();
        },
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const result = await provider.chatStream(messages, config, onChunk);

      expect(result).toBe('Hello World');
      expect(onChunk).toHaveBeenCalledTimes(2);
      expect(onChunk).toHaveBeenCalledWith('Hello');
      expect(onChunk).toHaveBeenCalledWith(' World');
    });

    it('should handle empty chunks gracefully', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'minimax',
        apiKey: 'test-key',
      };

      const onChunk = vi.fn();

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"choices":[{"delta":{}}]}\n' + 'data: [DONE]\n'
            )
          );
          controller.close();
        },
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const result = await provider.chatStream(messages, config, onChunk);

      expect(result).toBe('');
      expect(onChunk).not.toHaveBeenCalled();
    });

    it('should throw error on API failure', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'minimax',
        apiKey: 'test-key',
      };

      const onChunk = vi.fn();

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await expect(provider.chatStream(messages, config, onChunk)).rejects.toThrow(
        'MiniMax API Error: 500 - Internal Server Error'
      );
    });
  });
});
