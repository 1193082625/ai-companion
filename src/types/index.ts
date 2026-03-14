// AI 提供商类型
export type AIProvider = 'openai' | 'anthropic' | 'minimax' | 'zhipu' | 'ollama' | 'openrouter';

// 消息角色
export type MessageRole = 'user' | 'assistant' | 'system';

// 工作模式
export type WorkMode = 'chat' | 'code' | 'project' | 'content';

// 消息类型
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  model?: string;
  provider?: AIProvider;
  metadata?: {
    tokens?: number;
    finishReason?: string;
  };
}

// 会话类型
export interface ChatSession {
  id: string;
  title: string;
  type: WorkMode;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model?: string;
  provider?: AIProvider;
}

// AI 配置
export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

// 应用设置
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultProvider: AIProvider;
  defaultModel: string;
  providers: Record<AIProvider, AIConfig>;
  ollamaEndpoint?: string;
}

// 项目规划类型
export interface ProjectPlan {
  id: string;
  name: string;
  description: string;
  requirements: string;
  tasks: PlanTask[];
  createdAt: number;
}

export interface PlanTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

// 内容创作类型
export interface ContentDraft {
  id: string;
  type: 'writing' | 'translation' | 'summary' | 'copywriting';
  input: string;
  output: string;
  createdAt: number;
}

// AI 提供商信息
export interface ProviderInfo {
  id: AIProvider;
  name: string;
  nameEn: string;
  defaultModel: string;
  baseUrl: string;
  supportsStreaming: boolean;
  needsApiKey: boolean;
  icon?: string;
}

// 流式回调类型
export type StreamCallback = (chunk: string) => void;

// 默认提供商列表
export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'minimax',
    name: 'MiniMax',
    nameEn: 'MiniMax',
    defaultModel: 'MiniMax-M2.5',
    baseUrl: 'https://api.minimaxi.com/v1',
    supportsStreaming: true,
    needsApiKey: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    nameEn: 'OpenAI',
    defaultModel: 'gpt-4',
    baseUrl: 'https://api.openai.com/v1',
    supportsStreaming: true,
    needsApiKey: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    nameEn: 'Anthropic',
    defaultModel: 'claude-3-opus-20240229',
    baseUrl: 'https://api.anthropic.com/v1',
    supportsStreaming: true,
    needsApiKey: true,
  },
  {
    id: 'zhipu',
    name: '智谱',
    nameEn: 'Zhipu',
    defaultModel: 'glm-4',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    supportsStreaming: true,
    needsApiKey: true,
  },
  {
    id: 'ollama',
    name: 'Ollama',
    nameEn: 'Ollama',
    defaultModel: 'llama2',
    baseUrl: 'http://localhost:11434',
    supportsStreaming: true,
    needsApiKey: false,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    nameEn: 'OpenRouter',
    defaultModel: 'anthropic/claude-3-opus',
    baseUrl: 'https://openrouter.ai/api/v1',
    supportsStreaming: true,
    needsApiKey: true,
  },
];

// 默认应用设置
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultProvider: 'minimax',
  defaultModel: import.meta.env.VITE_MINIMAX_MODEL || 'MiniMax-M2.5',
  providers: {
    minimax: {
      provider: 'minimax',
      apiKey: import.meta.env.VITE_MINIMAX_API_KEY || '',
      baseUrl: import.meta.env.VITE_MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1',
      model: import.meta.env.VITE_MINIMAX_MODEL || 'MiniMax-M2.5',
      temperature: 0.7,
      maxTokens: 4096,
    },
    openai: {
      provider: 'openai',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4096,
    },
    anthropic: {
      provider: 'anthropic',
      apiKey: '',
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-opus-20240229',
      temperature: 0.7,
      maxTokens: 4096,
    },
    zhipu: {
      provider: 'zhipu',
      apiKey: '',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      model: 'glm-4',
      temperature: 0.7,
      maxTokens: 4096,
    },
    ollama: {
      provider: 'ollama',
      apiKey: '',
      baseUrl: 'http://localhost:11434',
      model: 'llama2',
      temperature: 0.7,
      maxTokens: 4096,
    },
    openrouter: {
      provider: 'openrouter',
      apiKey: '',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'anthropic/claude-3-opus',
      temperature: 0.7,
      maxTokens: 4096,
    },
  },
  ollamaEndpoint: 'http://localhost:11434',
};
