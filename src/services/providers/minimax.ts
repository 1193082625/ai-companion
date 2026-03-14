import type { Message, AIConfig, AIProvider } from '../../types';
import { BaseAIProvider } from './base';

interface MiniMaxMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MiniMaxRequest {
  model: string;
  messages: MiniMaxMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface MiniMaxResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class MiniMaxProvider extends BaseAIProvider {
  readonly provider: AIProvider = 'minimax';
  baseUrl = 'https://api.minimaxi.com/v1';
  defaultModel = 'MiniMax-M2.5';

  protected formatRequest(messages: Message[], config: AIConfig): MiniMaxRequest {
    return {
      model: config.model || this.defaultModel,
      messages: this.convertMessages(messages) as MiniMaxMessage[],
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 4096,
    };
  }

  protected parseResponse(response: unknown): string {
    const data = response as MiniMaxResponse;
    return data.choices[0]?.message?.content || '';
  }

  async chat(messages: Message[], config: AIConfig): Promise<string> {
    const request = this.formatRequest(messages, config);

    const response = await fetch(`${config.baseUrl || this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MiniMax API Error: ${response.status} - ${error}`);
    }

    const data: MiniMaxResponse = await response.json();
    return this.parseResponse(data);
  }

  async chatStream(
    messages: Message[],
    config: AIConfig,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const request = this.formatRequest(messages, config);
    (request as MiniMaxRequest).stream = true;

    const response = await fetch(`${config.baseUrl || this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MiniMax API Error: ${response.status} - ${error}`);
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
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }
}
