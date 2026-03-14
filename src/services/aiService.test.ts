import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Message, AIProvider, AIConfig } from '../types';
import { BaseAIProvider } from './providers/base';
import { OllamaProvider } from './providers/ollama';

// Mock import.meta.env
vi.stubGlobal('import.meta', {
  env: {
    VITE_MINIMAX_API_KEY: 'test-minimax-key',
    VITE_OPENAI_API_KEY: 'test-openai-key',
    VITE_MINIMAX_BASE_URL: 'https://api.minimax.chat',
    VITE_OPENAI_BASE_URL: 'https://api.openai.com',
    VITE_MINIMAX_MODEL: 'abab6.5s-chat',
    VITE_OPENAI_MODEL: 'gpt-4o',
  },
});

// Import after mocking
const { aiService } = await import('./aiService');

// Mock provider class for testing chat functionality
class MockProvider extends BaseAIProvider {
  readonly provider: AIProvider = 'mock';
  baseUrl = 'https://api.test.com';
  defaultModel = 'test-model';
  mockChat: (messages: Message[]) => Promise<string>;
  mockChatStream: (messages: Message[], onChunk: (chunk: string) => void) => Promise<string>;

  constructor() {
    super();
    this.mockChat = async (messages: Message[]) =>
      `Mock response for ${messages.length} messages`;
    this.mockChatStream = async (_messages: Message[], onChunk: (chunk: string) => void) => {
      onChunk('Mock ');
      onChunk('stream ');
      onChunk('response');
      return 'Mock stream response';
    };
  }

  async chat(messages: Message[], config: AIConfig): Promise<string> {
    return this.mockChat(messages);
  }

  async chatStream(
    messages: Message[],
    config: AIConfig,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    return this.mockChatStream(messages, onChunk);
  }

  protected formatRequest(messages: Message[], config: AIConfig): unknown {
    return { messages, config };
  }

  protected parseResponse(response: unknown): string {
    return String(response);
  }
}

describe('AIService', () => {
  describe('constructor', () => {
    it('should initialize with default providers', () => {
      expect(aiService.getProvider('minimax')).toBeDefined();
      expect(aiService.getProvider('openai')).toBeDefined();
      expect(aiService.getProvider('ollama')).toBeDefined();
    });

    it('should not have unregistered providers', () => {
      expect(aiService.getProvider('anthropic')).toBeUndefined();
      expect(aiService.getProvider('zhipu')).toBeUndefined();
    });
  });

  describe('registerProvider', () => {
    it('should register a new provider', () => {
      const mockProvider = new MockProvider();
      const testKey = `test-${Date.now()}` as AIProvider;
      Object.defineProperty(mockProvider, 'provider', { value: testKey });
      aiService.registerProvider(mockProvider);

      expect(aiService.getProvider(testKey)).toBe(mockProvider);
    });

    it('should overwrite existing provider', () => {
      const originalProvider = aiService.getProvider('minimax');
      const newProvider = new MockProvider();
      Object.defineProperty(newProvider, 'provider', { value: 'minimax' });

      aiService.registerProvider(newProvider);

      expect(aiService.getProvider('minimax')).not.toBe(originalProvider);
    });
  });

  describe('getProvider', () => {
    it('should return provider when exists', () => {
      const provider = aiService.getProvider('openai');
      expect(provider).toBeDefined();
      expect(provider?.provider).toBe('openai');
    });

    it('should return undefined for unknown provider', () => {
      const provider = aiService.getProvider('anthropic' as AIProvider);
      expect(provider).toBeUndefined();
    });
  });

  describe('chat', () => {
    it('should throw error for unknown provider', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'unknown' as AIProvider,
        apiKey: 'test-key',
      };

      await expect(aiService.chat(messages, config)).rejects.toThrow(
        'Unknown provider: unknown'
      );
    });

    it('should call provider chat and return response', async () => {
      const mockProvider = new MockProvider();
      const testKey = `test-chat-${Date.now()}` as AIProvider;
      Object.defineProperty(mockProvider, 'provider', { value: testKey });
      aiService.registerProvider(mockProvider);

      // Override to not add system prompt for this provider
      mockProvider.mockChat = async (messages: Message[]) =>
        `Mock response for ${messages.length} messages`;

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: testKey,
        apiKey: 'test-key',
      };

      const response = await aiService.chat(messages, config);
      // Verify chat was called with messages (at least 1 user message)
      expect(response).toContain('Mock response');
    });

    it('should pass config to provider', async () => {
      const mockProvider = new MockProvider();
      const testKey = `test-config-${Date.now()}` as AIProvider;
      Object.defineProperty(mockProvider, 'provider', { value: testKey });

      const originalChat = mockProvider.chat.bind(mockProvider);
      mockProvider.chat = async (messages: Message[], config: AIConfig) => {
        // Verify config has the expected values
        expect(config.apiKey).toBe('my-api-key');
        expect(config.model).toBe('gpt-4');
        return 'success';
      };

      aiService.registerProvider(mockProvider);

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: testKey,
        apiKey: 'my-api-key',
        model: 'gpt-4',
      };

      const response = await aiService.chat(messages, config);
      expect(response).toBe('success');
    });
  });

  describe('chatStream', () => {
    it('should throw error for unknown provider', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'unknown' as AIProvider,
        apiKey: 'test-key',
      };
      const onStream = vi.fn();

      await expect(
        aiService.chatStream(messages, config, onStream)
      ).rejects.toThrow('Unknown provider: unknown');
    });

    it('should call provider chatStream and return response', async () => {
      const mockProvider = new MockProvider();
      const testKey = `test-stream-${Date.now()}` as AIProvider;
      Object.defineProperty(mockProvider, 'provider', { value: testKey });
      aiService.registerProvider(mockProvider);

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: testKey,
        apiKey: 'test-key',
      };
      const onStream = vi.fn();

      const response = await aiService.chatStream(messages, config, onStream);

      expect(response).toBe('Mock stream response');
      expect(onStream).toHaveBeenCalledTimes(3);
      expect(onStream).toHaveBeenCalledWith('Mock ');
      expect(onStream).toHaveBeenCalledWith('stream ');
      expect(onStream).toHaveBeenCalledWith('response');
    });

    it('should filter out <think> content from stream', async () => {
      const mockProvider = new MockProvider();
      const testKey = `test-think-${Date.now()}` as AIProvider;
      Object.defineProperty(mockProvider, 'provider', { value: testKey });

      // Mock provider with think content
      mockProvider.mockChatStream = async (_messages: Message[], onChunk: (chunk: string) => void) => {
        onChunk('<think>');
        onChunk('正在思考...');
        onChunk('</think>');
        onChunk('你好！很高兴见到你。');
        return '你好！很高兴见到你。';
      };

      aiService.registerProvider(mockProvider);

      const messages: Message[] = [
        { id: '1', role: 'user', content: '你好', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: testKey,
        apiKey: 'test-key',
      };
      const onStream = vi.fn();

      const response = await aiService.chatStream(messages, config, onStream);

      // Should only receive filtered content (only the last chunk after think block)
      expect(onStream).toHaveBeenCalledTimes(1);
      expect(onStream).toHaveBeenCalledWith('你好！很高兴见到你。');
      expect(response).toBe('你好！很高兴见到你。');
    });

    it('should filter out think content when it spans multiple chunks', async () => {
      const mockProvider = new MockProvider();
      const testKey = `test-think-multi-${Date.now()}` as AIProvider;
      Object.defineProperty(mockProvider, 'provider', { value: testKey });

      // Mock provider with think content split across chunks
      mockProvider.mockChatStream = async (_messages: Message[], onChunk: (chunk: string) => void) => {
        onChunk('<think>这');
        onChunk('是思');
        onChunk('考内容');
        onChunk('</think>');
        onChunk('正');
        onChunk('文内容');
        return '正文内容';
      };

      aiService.registerProvider(mockProvider);

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: testKey,
        apiKey: 'test-key',
      };
      const onStream = vi.fn();

      await aiService.chatStream(messages, config, onStream);

      // Should only receive content outside think tags
      expect(onStream).toHaveBeenCalledTimes(2);
      expect(onStream).toHaveBeenCalledWith('正');
      expect(onStream).toHaveBeenCalledWith('文内容');
    });
  });

  describe('checkOllamaConnection', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should call ollama provider checkConnection', async () => {
      const ollamaProvider = aiService.getProvider('ollama') as OllamaProvider;
      expect(ollamaProvider).toBeDefined();

      // Mock the fetch globally to avoid real API calls
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [] }),
      });

      const result = await aiService.checkOllamaConnection('http://localhost:11434');
      expect(result).toBe(true);
    });

    it('should return false when fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await aiService.checkOllamaConnection('http://localhost:11434');
      expect(result).toBe(false);
    });
  });

  describe('listOllamaModels', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return list of models from ollama', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          models: [
            { name: 'llama2' },
            { name: 'codellama' },
            { name: 'mistral' },
          ],
        }),
      });

      const models = await aiService.listOllamaModels('http://localhost:11434');
      expect(models).toEqual(['llama2', 'codellama', 'mistral']);
    });

    it('should return empty array when fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const models = await aiService.listOllamaModels('http://localhost:11434');
      expect(models).toEqual([]);
    });

    it('should return empty array when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      const models = await aiService.listOllamaModels('http://localhost:11434');
      expect(models).toEqual([]);
    });
  });
});

// Test the exported singleton
describe('aiService singleton', () => {
  it('should be defined', () => {
    expect(aiService).toBeDefined();
  });

  it('should have default providers', () => {
    expect(aiService.getProvider('minimax')).toBeDefined();
    expect(aiService.getProvider('openai')).toBeDefined();
    expect(aiService.getProvider('ollama')).toBeDefined();
  });
});
