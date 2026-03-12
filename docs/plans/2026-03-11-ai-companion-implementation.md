# AI Companion 桌面应用实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 创建一个面向个人开发者的综合 AI 助手桌面应用，支持代码开发、项目规划和内容创作

**Architecture:** 使用 Tauri + React + TypeScript，采用策略模式实现多 AI 提供商支持（本地 Ollama + 云端 MiniMax/OpenAI/Anthropic/智谱）

**Tech Stack:** Tauri 2, React 19, TypeScript, Zustand, Tailwind CSS

---

## Task 1: 项目初始化

**Files:**
- Create: `ai-companion/package.json`
- Create: `ai-companion/vite.config.ts`
- Create: `ai-companion/tsconfig.json`
- Create: `ai-companion/index.html`
- Create: `ai-companion/src-tauri/Cargo.toml`
- Create: `ai-companion/src-tauri/tauri.conf.json`
- Create: `ai-companion/src-tauri/src/main.rs`

**Step 1: 创建项目目录和 package.json**

```bash
mkdir -p ai-companion/src/components ai-companion/src/pages ai-companion/src/services/providers ai-companion/src/stores ai-companion/src/types ai-companion/src/hooks ai-companion/src-tauri/src
```

**Step 2: 创建 package.json**

```json
{
  "name": "ai-companion",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "dev:tauri": "tauri dev"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tauri-apps/api": "^2.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0"
  }
}
```

**Step 3: 创建 Tauri 配置**

tauri.conf.json 需要包含：
- app 名称: AI Companion
- window 标题: AI 伙伴
- 窗口尺寸: 1200x800
- devtools: true (开发模式)

---

## Task 2: 类型定义

**Files:**
- Create: `ai-companion/src/types/index.ts`

**Step 1: 创建类型定义**

```typescript
export type AIProvider = 'openai' | 'anthropic' | 'minimax' | 'zhipu' | 'ollama' | 'openrouter';

export type MessageRole = 'user' | 'assistant' | 'system';

export type WorkMode = 'chat' | 'code' | 'project' | 'content';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  model?: string;
  provider?: AIProvider;
}

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

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultProvider: AIProvider;
  defaultModel: string;
  providers: Record<AIProvider, AIConfig>;
  ollamaEndpoint?: string;
}
```

---

## Task 3: AI 服务层

**Files:**
- Create: `ai-companion/src/services/providers/base.ts`
- Create: `ai-companion/src/services/providers/minimax.ts`
- Create: `ai-companion/src/services/providers/openai.ts`
- Create: `ai-companion/src/services/providers/ollama.ts`
- Create: `ai-companion/src/services/providers/index.ts`
- Create: `ai-companion/src/services/aiService.ts`

**Step 1: 创建 Provider 基类**

```typescript
import type { Message, AIProvider, AIConfig } from '../types';

export abstract class BaseAIProvider {
  abstract provider: AIProvider;
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
}
```

**Step 2: 实现 MiniMax Provider**

参考 multi-agent-teams-2 的实现，使用 https://api.minimaxi.com/v1

**Step 3: 实现 Ollama Provider**

使用 http://localhost:11434/api/chat

---

## Task 4: 状态管理

**Files:**
- Create: `ai-companion/src/stores/chatStore.ts`
- Create: `ai-companion/src/stores/settingsStore.ts`
- Create: `ai-companion/src/stores/appStore.ts`

**Step 1: 创建 chatStore**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatSession, Message, WorkMode } from '../types';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;

  createSession: (type: WorkMode) => ChatSession;
  deleteSession: (id: string) => void;
  selectSession: (id: string) => void;
  addMessage: (sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      isLoading: false,

      createSession: (type) => {
        const session: ChatSession = {
          id: crypto.randomUUID(),
          title: '新对话',
          type,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set(state => ({
          sessions: [session, ...state.sessions],
          currentSessionId: session.id,
        }));
        return session;
      },

      deleteSession: (id) => {
        set(state => ({
          sessions: state.sessions.filter(s => s.id !== id),
          currentSessionId: state.currentSessionId === id
            ? state.sessions[0]?.id || null
            : state.currentSessionId,
        }));
      },

      selectSession: (id) => set({ currentSessionId: id }),

      addMessage: (sessionId, message) => {
        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: [...s.messages, {
                    ...message,
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                  }],
                  updatedAt: Date.now(),
                }
              : s
          ),
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    { name: 'ai-companion-chat' }
  )
);
```

---

## Task 5: 基础 UI 组件

**Files:**
- Create: `ai-companion/src/components/Chat/ChatWindow.tsx`
- Create: `ai-companion/src/components/Chat/MessageBubble.tsx`
- Create: `ai-companion/src/components/Chat/InputArea.tsx`
- Create: `ai-companion/src/components/Layout/MainLayout.tsx`
- Create: `ai-companion/src/components/SessionList.tsx`

**Step 1: 创建 ChatWindow 组件**

包含消息列表和输入区域，支持流式输出显示

**Step 2: 创建 MessageBubble 组件**

支持 Markdown 渲染和代码高亮

---

## Task 6: 页面组件

**Files:**
- Create: `ai-companion/src/pages/ChatPage.tsx`
- Create: `ai-companion/src/pages/SettingsPage.tsx`

**Step 1: 创建 ChatPage**

主聊天页面，包含侧边栏和聊天窗口

**Step 2: 创建 SettingsPage**

AI 提供商配置页面

---

## Task 7: 应用入口

**Files:**
- Create: `ai-companion/src/App.tsx`
- Create: `ai-companion/src/main.tsx`

**Step 1: 创建 App.tsx**

路由和布局设置

---

## Task 8: 安装依赖并验证

**Step 1: 安装依赖**

```bash
cd ai-companion
npm install
```

**Step 2: 启动开发模式**

```bash
npm run dev:tauri
```

**Step 3: 验证功能**

1. 打开应用窗口
2. 测试基本 UI 渲染
3. 测试设置页面
4. 配置 MiniMax API Key
5. 测试对话功能
