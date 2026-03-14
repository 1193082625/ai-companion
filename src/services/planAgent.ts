import type { Message, ChatSession } from '../types';
import { aiService } from './aiService';

/**
 * Plan Agent 阶段类型
 */
export type PlanPhase = 'collecting' | 'clarifying' | 'confirming' | 'generating';

/**
 * Plan Agent 状态
 */
export interface PlanState {
  phase: PlanPhase;
  requirements: string[];
  clarifiedRequirements: string;
  confirmedPlan?: string;
}

/**
 * Plan Agent - 用于处理项目模式的需求澄清流程
 *
 * 流程：
 * 1. collecting: 收集用户需求描述
 * 2. clarifying: 通过提问澄清需求（不输出代码）
 * 3. confirming: 展示规划初稿，请求用户确认
 * 4. generating: 用户确认后生成最终规划文档
 */
export class PlanAgent {
  private state: PlanState;
  private session: ChatSession;
  private onStateChange: (state: PlanState) => void;
  private onMessage: (role: 'user' | 'assistant', content: string) => void;

  constructor(
    session: ChatSession,
    onStateChange: (state: PlanState) => void,
    onMessage: (role: 'user' | 'assistant', content: string) => void
  ) {
    this.session = session;
    this.onStateChange = onStateChange;
    this.onMessage = onMessage;
    this.state = {
      phase: 'collecting',
      requirements: [],
      clarifiedRequirements: '',
    };
  }

  /**
   * 处理用户输入
   */
  async processInput(input: string): Promise<void> {
    this.onMessage('user', input);

    switch (this.state.phase) {
      case 'collecting':
        await this.handleCollecting(input);
        break;
      case 'clarifying':
        await this.handleClarifying(input);
        break;
      case 'confirming':
        await this.handleConfirming(input);
        break;
      case 'generating':
        await this.handleGenerating(input);
        break;
    }
  }

  /**
   * 收集需求阶段
   */
  private async handleCollecting(input: string): Promise<void> {
    this.state.requirements.push(input);

    const prompt = `用户提出了一个项目需求："${input}"

请分析这个需求，判断信息是否足够清晰完整：

需要澄清的问题：
1. 项目的核心目标是什么？
2. 主要功能有哪些？
3. 目标用户是谁？
4. 有没有技术栈偏好？
5. 预算和时间要求？

如果信息足够清晰，请回复"信息足够，我可以开始规划。"
如果需要澄清，请列出需要澄清的问题（最多3个），用列表格式。
`;

    const response = await this.getAIResponse(prompt);

    if (response.includes('信息足够')) {
      this.setPhase('confirming');
      this.onMessage('assistant', response + '\n\n我将为你制定项目规划...');
      await this.generateInitialPlan();
    } else {
      this.setPhase('clarifying');
      this.onMessage('assistant', response + '\n\n请回答以上问题，帮助我更好地理解你的需求。');
    }
  }

  /**
   * 澄清需求阶段
   */
  private async handleClarifying(input: string): Promise<void> {
    this.state.clarifiedRequirements += input + '\n';

    const prompt = `用户回答了澄清问题：
${input}

原始需求：
${this.state.requirements.join('\n')}

澄清后的需求：
${this.state.clarifiedRequirements}

请判断：
1. 信息是否足够清晰？
2. 还需要继续澄清吗？

如果足够，请回复"信息足够，我可以开始规划。"
如果还需要澄清，请列出下一个需要澄清的问题（最多2个）。
`;

    const response = await this.getAIResponse(prompt);

    if (response.includes('信息足够')) {
      this.setPhase('confirming');
      this.onMessage('assistant', response + '\n\n我将为你制定项目规划...');
      await this.generateInitialPlan();
    } else {
      this.onMessage('assistant', response + '\n\n请继续回答这个问题。');
    }
  }

  /**
   * 确认规划阶段
   */
  private async handleConfirming(input: string): Promise<void> {
    const confirmKeywords = ['确认', '同意', '可以', '好', 'yes', 'ok', '没问题'];
    const declineKeywords = ['修改', '不要', '改变', 'no', '重新'];

    const lowerInput = input.toLowerCase();

    if (confirmKeywords.some((k) => lowerInput.includes(k))) {
      this.setPhase('generating');
      await this.generateFinalPlan();
    } else if (declineKeywords.some((k) => lowerInput.includes(k))) {
      const prompt = `用户对规划有修改意见："${input}"

请根据用户的意见修改规划，并重新展示。
`;

      const response = await this.getAIResponse(prompt);
      this.state.confirmedPlan = response;
      this.onMessage('assistant', response + '\n\n请确认是否同意这个规划。');
    } else {
      this.onMessage('assistant', '请回复"确认"同意规划，或提出修改意见。');
    }
  }

  /**
   * 生成最终规划阶段
   */
  private async handleGenerating(input: string): Promise<void> {
    const confirmKeywords = ['确认', '同意', '可以', '好', 'yes', 'ok', '没问题'];

    if (confirmKeywords.some((k) => input.toLowerCase().includes(k))) {
      this.onMessage('assistant', '规划已确认！你的项目规划已生成。\n\n如需开始执行，请告诉我。');
    } else {
      this.onMessage('assistant', '规划已确认！如需修改或有其他需求，请告诉我。');
    }
  }

  /**
   * 生成初始规划
   */
  private async generateInitialPlan(): Promise<void> {
    const prompt = `你是一个项目管理专家和架构师。

请根据以下需求，制定一个项目规划：

需求：
${this.state.requirements.join('\n')}
${this.state.clarifiedRequirements}

请提供以下内容：
1. 项目概述（一句话）
2. 核心功能列表
3. 技术选型建议
4. 实施阶段划分
5. 每个阶段的主要任务

使用 Markdown 格式，任务列表使用检查框 [ ]
`;

    const response = await this.getAIResponse(prompt);
    this.state.confirmedPlan = response;
    this.onMessage('assistant', response + '\n\n请确认是否同意这个规划，回复"确认"或提出修改意见。');
  }

  /**
   * 生成最终规划
   */
  private async generateFinalPlan(): Promise<void> {
    const prompt = `请将以下项目规划整理成最终版本：

${this.state.confirmedPlan}

请提供：
1. 完整的项目规划文档
2. 每个阶段的具体任务清单
3. 建议的时间估算

使用 Markdown 格式。
`;

    const response = await this.getAIResponse(prompt);
    this.state.confirmedPlan = response;
    this.onMessage('assistant', response);
  }

  /**
   * 获取 AI 响应
   */
  private async getAIResponse(prompt: string): Promise<string> {
    // 这里需要集成 AI 服务，实际实现时需要传递正确的配置
    // 暂时返回空字符串，实际使用时需要完善
    console.log('PlanAgent prompt:', prompt);
    return '';
  }

  /**
   * 设置阶段
   */
  private setPhase(phase: PlanPhase): void {
    this.state.phase = phase;
    this.onStateChange(this.state);
  }

  /**
   * 获取当前状态
   */
  getState(): PlanState {
    return { ...this.state };
  }
}

/**
 * 创建 Plan Agent 工厂函数
 */
export const createPlanAgent = (
  session: ChatSession,
  onStateChange: (state: PlanState) => void,
  onMessage: (role: 'user' | 'assistant', content: string) => void
): PlanAgent => {
  return new PlanAgent(session, onStateChange, onMessage);
};
