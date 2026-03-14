import type { Message, AIProvider, AIConfig } from '../types';
import { BaseAIProvider, MiniMaxProvider, OpenAIProvider, OllamaProvider } from './providers';

type StreamCallback = (chunk: string) => void;

/**
 * 用于过滤流式输出中 <think> 标签内容的类
 * 支持跨 chunk 的思考内容过滤
 */
class ThinkContentFilter {
  private buffer = '';
  private inThinkBlock = false;

  /**
   * 处理一个 chunk，返回过滤后的内容
   */
  process(chunk: string): string {
    this.buffer += chunk;
    let result = '';

    while (this.buffer.length > 0) {
      if (this.inThinkBlock) {
        // 查找结束标签
        const endIndex = this.buffer.toLowerCase().indexOf('</think>');
        if (endIndex !== -1) {
          // 跳过思考块内容
          this.buffer = this.buffer.slice(endIndex + 9);
          this.inThinkBlock = false;
        } else {
          // 整个 buffer 都在思考块内
          this.buffer = '';
          break;
        }
      } else {
        // 查找开始标签
        const startIndex = this.buffer.toLowerCase().indexOf('<think>');
        if (startIndex !== -1) {
          // 添加开始标签之前的内容
          result += this.buffer.slice(0, startIndex);
          this.buffer = this.buffer.slice(startIndex + 9);
          this.inThinkBlock = true;
        } else {
          // 没有开始标签，添加整个 buffer
          result += this.buffer;
          this.buffer = '';
          break;
        }
      }
    }

    return result;
  }

  /**
   * 处理完成后的清理，返回剩余内容
   */
  flush(): string {
    const remaining = this.buffer;
    this.buffer = '';
    this.inThinkBlock = false;
    return remaining;
  }
}

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

    // 创建过滤器实例，用于过滤 <think> 标签内容
    const thinkFilter = new ThinkContentFilter();
    let filteredFullContent = '';

    // 包装回调函数，过滤掉 <think> 标签内容
    const filteredStreamCallback: StreamCallback = (chunk) => {
      const filteredChunk = thinkFilter.process(chunk);
      if (filteredChunk) {
        filteredFullContent += filteredChunk;
        onStream(filteredChunk);
      }
    };

    const fullContent = await provider.chatStream(
      messagesWithSystem,
      configWithEnv,
      filteredStreamCallback
    );

    // 处理完成后清理，添加剩余内容
    const remainingContent = thinkFilter.flush();
    if (remainingContent) {
      filteredFullContent += remainingContent;
      onStream(remainingContent);
    }

    return filteredFullContent;
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
