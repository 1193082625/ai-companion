import type { Message, AIConfig, AIProvider } from '../../types';
import { BaseAIProvider } from './base';

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaResponse {
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export class OllamaProvider extends BaseAIProvider {
  readonly provider: AIProvider = 'ollama';
  baseUrl = 'http://localhost:11434';
  defaultModel = 'llama2';

  protected formatRequest(messages: Message[], config: AIConfig): OllamaRequest {
    return {
      model: config.model || this.defaultModel,
      messages: this.convertMessages(messages) as OllamaMessage[],
      stream: false,
      options: {
        temperature: config.temperature,
        num_predict: config.maxTokens,
      },
    };
  }

  protected parseResponse(response: unknown): string {
    const data = response as OllamaResponse;
    return data.message?.content || '';
  }

  async chat(messages: Message[], config: AIConfig): Promise<string> {
    const request = this.formatRequest(messages, config);

    const response = await fetch(`${config.baseUrl || this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API Error: ${response.status} - ${error}`);
    }

    const data: OllamaResponse = await response.json();
    return this.parseResponse(data);
  }

  async chatStream(
    messages: Message[],
    config: AIConfig,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const request = this.formatRequest(messages, config);
    request.stream = true;

    const response = await fetch(`${config.baseUrl || this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API Error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          try {
            const data = JSON.parse(line) as OllamaResponse;
            if (data.message?.content) {
              fullContent += data.message.content;
              onChunk(data.message.content);
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  // 检查 Ollama 服务是否可用
  async checkConnection(baseUrl?: string): Promise<boolean> {
    try {
      const response = await fetch(`${baseUrl || this.baseUrl}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // 获取可用模型列表
  async listModels(baseUrl?: string): Promise<string[]> {
    try {
      const response = await fetch(`${baseUrl || this.baseUrl}/api/tags`, {
        method: 'GET',
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch {
      return [];
    }
  }
}
