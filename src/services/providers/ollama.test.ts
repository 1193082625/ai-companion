import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Message, AIConfig } from '../../types';
import { OllamaProvider } from './ollama';

describe('OllamaProvider', () => {
  let provider: OllamaProvider;

  beforeEach(() => {
    provider = new OllamaProvider();
  });

  describe('provider configuration', () => {
    it('should have correct provider type', () => {
      expect(provider.provider).toBe('ollama');
    });

    it('should have default baseUrl', () => {
      expect(provider.baseUrl).toBe('http://localhost:11434');
    });

    it('should have default model', () => {
      expect(provider.defaultModel).toBe('llama2');
    });
  });

  describe('formatRequest', () => {
    it('should format request with default model', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'ollama',
        apiKey: 'test-key',
      };

      const request = provider.formatRequest(messages, config);

      expect(request.model).toBe('llama2');
      expect(request.messages).toHaveLength(1);
      expect(request.messages[0].role).toBe('user');
      expect(request.messages[0].content).toBe('Hello');
    });

    it('should use custom model from config', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'ollama',
        apiKey: 'test-key',
        model: 'codellama',
      };

      const request = provider.formatRequest(messages, config);

      expect(request.model).toBe('codellama');
    });

    it('should include temperature and maxTokens', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'ollama',
        apiKey: 'test-key',
        temperature: 0.5,
        maxTokens: 100,
      };

      const request = provider.formatRequest(messages, config);

      expect(request.options?.temperature).toBe(0.5);
      expect(request.options?.num_predict).toBe(100);
    });
  });

  describe('parseResponse', () => {
    it('should extract content from response', () => {
      const response = {
        message: {
          role: 'assistant',
          content: 'Hello, how can I help?',
        },
        done: true,
      };

      const result = provider.parseResponse(response);
      expect(result).toBe('Hello, how can I help?');
    });

    it('should return empty string if no content', () => {
      const response = {
        message: {},
        done: true,
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
        provider: 'ollama',
        apiKey: 'test-key',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            message: { role: 'assistant', content: 'Hi there!' },
            done: true,
          }),
      });

      const result = await provider.chat(messages, config);
      expect(result).toBe('Hi there!');
    });

    it('should throw error on API failure', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'ollama',
        apiKey: 'test-key',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await expect(provider.chat(messages, config)).rejects.toThrow(
        'Ollama API Error: 500 - Internal Server Error'
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
        provider: 'ollama',
        apiKey: 'test-key',
      };

      const onChunk = vi.fn();

      // Create a mock ReadableStream
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              '{"message":{"content":"Hello"},"done":false}\n{"message":{"content":" World"},"done":false}\n'
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
  });

  describe('checkConnection', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return true when connection successful', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
      });

      const result = await provider.checkConnection();
      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      const result = await provider.checkConnection();
      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await provider.checkConnection();
      expect(result).toBe(false);
    });

    it('should use custom baseUrl', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
      });

      await provider.checkConnection('http://192.168.1.100:11434');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://192.168.1.100:11434/api/tags',
        expect.any(Object)
      );
    });
  });

  describe('listModels', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return list of model names', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            models: [
              { name: 'llama2' },
              { name: 'codellama' },
              { name: 'mistral' },
            ],
          }),
      });

      const models = await provider.listModels();
      expect(models).toEqual(['llama2', 'codellama', 'mistral']);
    });

    it('should return empty array on fetch failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const models = await provider.listModels();
      expect(models).toEqual([]);
    });

    it('should return empty array when response not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      const models = await provider.listModels();
      expect(models).toEqual([]);
    });
  });
});
