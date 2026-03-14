import type { Message, AIProvider, AIConfig } from '../types';
import { BaseAIProvider, MiniMaxProvider, OpenAIProvider, OllamaProvider } from './providers';

type StreamCallback = (chunk: string) => void;

class AIService {
  private providers: Map<AIProvider, BaseAIProvider>;

  constructor() {
    this.providers = new Map<AIProvider, BaseAIProvider>([
      ['minimax', new MiniMaxProvider()] as [AIProvider, BaseAIProvider],
      ['openai', new OpenAIProvider()] as [AIProvider, BaseAIProvider],
      ['ollama', new OllamaProvider()] as [AIProvider, BaseAIProvider],
      // 其他提供商可以后续添加
    ]);
  }

  // 注册新的提供商
  registerProvider(provider: BaseAIProvider): void {
    this.providers.set(provider.provider, provider);
  }

  // 获取提供商
  getProvider(provider: AIProvider): BaseAIProvider | undefined {
    return this.providers.get(provider);
  }

  // 聊天（非流式）
  async chat(messages: Message[], config: AIConfig): Promise<string> {
    const provider = this.providers.get(config.provider);
    if (!provider) {
      throw new Error(`Unknown provider: ${config.provider}`);
    }

    // 从环境变量获取 fallback 配置
    const configWithEnv: AIConfig = {
      ...config,
      apiKey: config.apiKey || this.getEnvApiKey(config.provider),
      baseUrl: config.baseUrl || this.getEnvBaseUrl(config.provider),
      model: config.model || this.getEnvModel(config.provider),
    };

    // 添加系统提示词
    const messagesWithSystem = this.addSystemPrompt(messages, config.provider);

    return provider.chat(messagesWithSystem, configWithEnv);
  }

  // 聊天（流式）
  async chatStream(
    messages: Message[],
    config: AIConfig,
    onStream: StreamCallback
  ): Promise<string> {
    const provider = this.providers.get(config.provider);
    if (!provider) {
      throw new Error(`Unknown provider: ${config.provider}`);
    }

    // 从环境变量获取 fallback 配置
    const configWithEnv: AIConfig = {
      ...config,
      apiKey: config.apiKey || this.getEnvApiKey(config.provider),
      baseUrl: config.baseUrl || this.getEnvBaseUrl(config.provider),
      model: config.model || this.getEnvModel(config.provider),
    };

    // 添加系统提示词
    const messagesWithSystem = this.addSystemPrompt(messages, config.provider);

    return provider.chatStream(messagesWithSystem, configWithEnv, onStream);
  }

  // 获取环境变量中的 API Key
  private getEnvApiKey(provider: AIProvider): string {
    const envKeys: Record<string, string> = {
      minimax: import.meta.env.VITE_MINIMAX_API_KEY || '',
      openai: import.meta.env.VITE_OPENAI_API_KEY || '',
      openrouter: import.meta.env.VITE_OPENROUTER_API_KEY || '',
    };
    return envKeys[provider] || '';
  }

  // 获取环境变量中的 Base URL
  private getEnvBaseUrl(provider: AIProvider): string {
    const envUrls: Record<string, string> = {
      minimax: import.meta.env.VITE_MINIMAX_BASE_URL || '',
      openai: import.meta.env.VITE_OPENAI_BASE_URL || '',
      openrouter: import.meta.env.VITE_OPENROUTER_BASE_URL || '',
    };
    return envUrls[provider] || '';
  }

  // 获取环境变量中的 Model
  private getEnvModel(provider: AIProvider): string {
    const envModels: Record<string, string> = {
      minimax: import.meta.env.VITE_MINIMAX_MODEL || '',
      openai: import.meta.env.VITE_OPENAI_MODEL || '',
      openrouter: import.meta.env.VITE_OPENROUTER_MODEL || '',
    };
    return envModels[provider] || '';
  }

  // 根据提供商添加系统提示词
  private addSystemPrompt(messages: Message[], provider: AIProvider): Message[] {
    const systemPrompts: Record<AIProvider, string> = {
      minimax: '你是一个有帮助的AI助手。请用中文回复用户。',
      openai: 'You are a helpful AI assistant.',
      anthropic: 'You are a helpful AI assistant.',
      zhipu: '你是一个有帮助的AI助手。请用中文回复用户。',
      ollama: 'You are a helpful AI assistant.',
      openrouter: 'You are a helpful AI assistant.',
    };

    const systemPrompt = systemPrompts[provider];

    // 检查是否已有系统消息
    const hasSystemMessage = messages.some((m) => m.role === 'system');
    if (hasSystemMessage) {
      return messages;
    }

    if (systemPrompt) {
      return [
        {
          id: 'system',
          role: 'system',
          content: systemPrompt,
          timestamp: Date.now(),
        },
        ...messages,
      ];
    }

    return messages;
  }

  // 检查 Ollama 连接状态
  async checkOllamaConnection(endpoint?: string): Promise<boolean> {
    const ollama = this.providers.get('ollama') as OllamaProvider;
    if (!ollama) return false;
    return ollama.checkConnection(endpoint);
  }

  // 获取 Ollama 可用模型
  async listOllamaModels(endpoint?: string): Promise<string[]> {
    const ollama = this.providers.get('ollama') as OllamaProvider;
    if (!ollama) return [];
    return ollama.listModels(endpoint);
  }
}

export const aiService = new AIService();
