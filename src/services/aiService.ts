import type { Message, AIProvider, AIConfig, ChatSession, WorkMode } from '../types';
import { WORK_MODE_PROMPTS, WORK_MODE_DEFAULTS } from './prompts';
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
  async chat(
    messages: Message[],
    config: AIConfig,
    session?: ChatSession
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

    // 应用工作模式参数
    const effectiveConfig = this.getEffectiveConfig(session, configWithEnv);

    // 添加系统提示词（根据工作模式）
    const workMode = session?.type;
    const messagesWithSystem = this.addSystemPrompt(messages, config.provider, workMode);

    return provider.chat(messagesWithSystem, effectiveConfig);
  }

  // 聊天（流式）
  async chatStream(
    messages: Message[],
    config: AIConfig,
    onStream: StreamCallback,
    session?: ChatSession
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

    // 应用工作模式参数
    const effectiveConfig = this.getEffectiveConfig(session, configWithEnv);

    // 添加系统提示词（根据工作模式）
    const workMode = session?.type;
    const messagesWithSystem = this.addSystemPrompt(messages, config.provider, workMode);

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
      effectiveConfig,
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

  // 根据提供商和工作模式添加系统提示词
  private addSystemPrompt(
    messages: Message[],
    provider: AIProvider,
    workMode?: WorkMode
  ): Message[] {
    // 根据工作模式添加提示词
    const modePrompt = workMode ? WORK_MODE_PROMPTS[workMode] : '';

    // AI 提供商基础提示词
    const providerPrompt: Record<AIProvider, string> = {
      minimax: '请用中文回复用户。',
      openai: 'Please respond in the same language as the user.',
      anthropic: 'Please respond in the same language as the user.',
      zhipu: '请用中文回复用户。',
      ollama: 'Please respond in the same language as the user.',
      openrouter: 'Please respond in the same language as the user.',
    };

    const providerBase = providerPrompt[provider] || '';
    const systemPrompt = [modePrompt, providerBase].filter(Boolean).join('\n\n');

    // 检查是否已有系统消息
    const hasSystemMessage = messages.some((m) => m.role === 'system');
    if (hasSystemMessage) {
      // 更新现有系统消息
      return messages.map((m) =>
        m.role === 'system' ? { ...m, content: systemPrompt } : m
      );
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

  // 根据会话类型获取有效的配置参数
  private getEffectiveConfig(
    session: ChatSession | undefined,
    baseConfig: AIConfig
  ): AIConfig {
    if (!session) return baseConfig;

    const modeConfig = WORK_MODE_DEFAULTS[session.type];
    return {
      ...baseConfig,
      temperature: baseConfig.temperature ?? modeConfig.temperature,
      maxTokens: baseConfig.maxTokens ?? modeConfig.maxTokens,
    };
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
