import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatSession, Message, WorkMode } from '../types';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  streamingContent: string;

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

      getCurrentSession: () => {
        const state = get();
        return (
          state.sessions.find((s) => s.id === state.currentSessionId) || null
        );
      },
    }),
    {
      name: 'ai-companion-chat',
    }
  )
);
