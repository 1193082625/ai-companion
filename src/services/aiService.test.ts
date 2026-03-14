import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Message, AIProvider, AIConfig } from '../types';
import { BaseAIProvider } from './providers/base';

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
  readonly provider: AIProvider = 'ollama';
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

  async chat(messages: Message[], _config: AIConfig): Promise<string> {
    return this.mockChat(messages);
  }

  async chatStream(
    messages: Message[],
    _config: AIConfig,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    return this.mockChatStream(messages, onChunk);
  }

  protected formatRequest(messages: Message[], _config: AIConfig): unknown {
    return { messages };
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
    });

    it('should return undefined for unknown provider', () => {
      const provider = aiService.getProvider('unknown-provider' as AIProvider);
      expect(provider).toBeUndefined();
    });
  });

  describe('chat', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should send messages and return response', async () => {
      const mockProvider = new MockProvider();
      const testKey = `test-chat-${Date.now()}` as AIProvider;
      Object.defineProperty(mockProvider, 'provider', { value: testKey });
      mockProvider.mockChat = async () => 'Test response';

      aiService.registerProvider(mockProvider);

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: testKey,
        apiKey: 'test-key',
        model: 'test-model',
      };

      const response = await aiService.chat(messages, config);
      expect(response).toBe('Test response');
    });

    it('should throw error for unknown provider', async () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: 'unknown' as AIProvider,
        apiKey: 'test-key',
        model: 'test-model',
      };

      await expect(aiService.chat(messages, config)).rejects.toThrow('Unknown provider');
    });

    it('should add system prompt to messages', async () => {
      const mockProvider = new MockProvider();
      const testKey = 'ollama';
      Object.defineProperty(mockProvider, 'provider', { value: testKey });
      let capturedMessages: Message[] = [];

      mockProvider.mockChat = async (messages) => {
        capturedMessages = messages;
        return 'Response';
      };

      aiService.registerProvider(mockProvider);

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      ];
      const config: AIConfig = {
        provider: testKey,
        apiKey: 'test-key',
        model: 'test-model',
      };

      await aiService.chat(messages, config);

      // Should have added system message at the beginning
      expect(capturedMessages.length).toBe(2);
      expect(capturedMessages[0].role).toBe('system');
    });
  });

  describe('chatStream', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should stream response', async () => {
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
        model: 'test-model',
      };
      const onStream = vi.fn();

      const response = await aiService.chatStream(messages, config, onStream);

      expect(onStream).toHaveBeenCalledTimes(3);
      expect(onStream).toHaveBeenCalledWith('Mock ');
      expect(onStream).toHaveBeenCalledWith('stream ');
      expect(onStream).toHaveBeenCalledWith('response');
      expect(response).toBe('Mock stream response');
    });

    it('should filter out think content from stream', async () => {
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
        model: 'test-model',
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
        onChunk('</think>\n');
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
        model: 'test-model',
      };
      const onStream = vi.fn();

      await aiService.chatStream(messages, config, onStream);

      // Should only receive content outside think tags
      expect(onStream).toHaveBeenCalledTimes(2);
      expect(onStream).toHaveBeenCalledWith('正');
      expect(onStream).toHaveBeenCalledWith('文内容');
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
