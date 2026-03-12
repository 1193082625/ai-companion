import type { Message, AIProvider, AIConfig } from '../../types';

export abstract class BaseAIProvider {
  abstract readonly provider: AIProvider;
  abstract baseUrl: string;
  abstract defaultModel: string;

  abstract chat(messages: Message[], config: AIConfig): Promise<string>;

  abstract chatStream(
    messages: Message[],
    config: AIConfig,
    onChunk: (chunk: string) => void
  ): Promise<string>;

  protected abstract formatRequest(messages: Message[], config: AIConfig): unknown;
  protected abstract parseResponse(response: unknown): string;

  // 辅助方法：转换消息格式
  protected convertMessages(messages: Message[]): Array<{ role: string; content: string }> {
    return messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : msg.role,
      content: msg.content,
    }));
  }
}
