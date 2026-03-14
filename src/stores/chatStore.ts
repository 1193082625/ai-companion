import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatSession, Message, WorkMode } from '../types';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  streamingContent: string; // 兼容旧版本，用于当前活动会话的流式输出

  // Actions
  createSession: (type: WorkMode, title?: string) => ChatSession;
  deleteSession: (id: string) => void;
  selectSession: (id: string) => void;
  updateSessionTitle: (id: string, title: string) => void;
  addMessage: (sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateLastMessage: (sessionId: string, content: string) => void;
  setLoading: (loading: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  clearStreamingContent: () => void;
  getCurrentSession: () => ChatSession | null;
  // 新增：会话级别的流式内容操作
  appendSessionStreamingContent: (sessionId: string, chunk: string) => void;
  clearSessionStreamingContent: (sessionId: string) => void;
  // 上下文管理
  compactSessionMessages: (sessionId: string) => void;
  clearSessionMessages: (sessionId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      isLoading: false,
      streamingContent: '',

      createSession: (type, title) => {
        const session: ChatSession = {
          id: crypto.randomUUID(),
          title: title || '新对话',
          type,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          sessions: [session, ...state.sessions],
          currentSessionId: session.id,
        }));
        return session;
      },

      deleteSession: (id) => {
        set((state) => {
          const remainingSessions = state.sessions.filter((s) => s.id !== id);
          const newCurrentId =
            state.currentSessionId === id
              ? remainingSessions[0]?.id || null
              : state.currentSessionId;
          return {
            sessions: remainingSessions,
            currentSessionId: newCurrentId,
          };
        });
      },

      selectSession: (id) => {
        set({ currentSessionId: id, streamingContent: '' });
      },

      updateSessionTitle: (id, title) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title, updatedAt: Date.now() } : s
          ),
        }));
      },

      addMessage: (sessionId, message) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: [
                    ...s.messages,
                    {
                      ...message,
                      id: crypto.randomUUID(),
                      timestamp: Date.now(),
                    },
                  ],
                  updatedAt: Date.now(),
                }
              : s
          ),
        }));
      },

      updateLastMessage: (sessionId, content) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId || s.messages.length === 0) return s;
            const messages = [...s.messages];
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content,
            };
            return { ...s, messages, updatedAt: Date.now() };
          }),
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setStreamingContent: (content) => set({ streamingContent: content }),

      appendStreamingContent: (chunk) =>
        set((state) => ({ streamingContent: state.streamingContent + chunk })),

      clearStreamingContent: () => set({ streamingContent: '' }),

      // 会话级别的流式内容操作
      appendSessionStreamingContent: (sessionId, chunk) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, streamingContent: (s.streamingContent || '') + chunk }
              : s
          ),
        }));
      },

      clearSessionStreamingContent: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, streamingContent: '' }
              : s
          ),
        }));
      },

      getCurrentSession: () => {
        const state = get();
        return (
          state.sessions.find((s) => s.id === state.currentSessionId) || null
        );
      },

      // 压缩会话消息，保留系统消息和用户关键需求
      compactSessionMessages: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;

            // 保留系统消息和最近的用户消息
            const systemMessages = s.messages.filter((m) => m.role === 'system');
            const userMessages = s.messages.filter((m) => m.role === 'user');
            const assistantMessages = s.messages.filter((m) => m.role === 'assistant');

            // 保留最近 2 轮对话
            const recentUserMessages = userMessages.slice(-4);
            const recentAssistantMessages = assistantMessages.slice(-4);

            // 合并并按时间排序
            const compactedMessages: Message[] = [
              ...systemMessages,
              ...recentUserMessages,
              ...recentAssistantMessages,
            ].sort((a, b) => a.timestamp - b.timestamp);

            return { ...s, messages: compactedMessages };
          }),
        }));
      },

      // 清空会话消息
      clearSessionMessages: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, messages: [] } : s
          ),
        }));
      },
    }),
    {
      name: 'ai-companion-chat',
      // 排除 streamingContent 的持久化，这是临时状态
      partialize: (state) => ({
        sessions: state.sessions.map((s) => ({
          ...s,
          streamingContent: undefined,
        })),
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);
