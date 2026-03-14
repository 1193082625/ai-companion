import React, { useCallback } from 'react';
import { ChatWindow } from '../components/Chat/ChatWindow';
import { MainLayout } from '../components/Layout/MainLayout';
import { useChatStore } from '../stores/chatStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useAppStore } from '../stores/appStore';
import { aiService } from '../services/aiService';
import type { WorkMode } from '../types';

interface ChatPageProps {
  onOpenSettings: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ onOpenSettings }) => {
  const {
    sessions,
    currentSessionId,
    isLoading,
    streamingContent,
    createSession,
    deleteSession,
    selectSession,
    addMessage,
    setLoading,
    appendStreamingContent,
    clearStreamingContent,
    getCurrentSession,
  } = useChatStore();

  const { settings } = useSettingsStore();
  const { setWorkMode } = useAppStore();

  const currentSession = getCurrentSession();

  // 创建新会话
  const handleNewSession = useCallback(
    (type: WorkMode) => {
      createSession(type);
      setWorkMode(type);
    },
    [createSession, setWorkMode]
  );

  // 发送消息
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!currentSession) {
        // 创建新会话
        const session = createSession('chat');
        sendMessage(session.id, content);
      } else {
        sendMessage(currentSession.id, content);
      }
    },
    [currentSession, createSession]
  );

  const sendMessage = async (sessionId: string, content: string) => {
    // 添加用户消息
    addMessage(sessionId, { role: 'user', content });
    setLoading(true);
    clearStreamingContent();

    const session = sessions.find((s) => s.id === sessionId);
    const config = settings.providers[session?.provider || settings.defaultProvider];

    try {
      // 流式调用 AI
      const fullResponse = await aiService.chatStream(
        session?.messages || [],
        {
          ...config,
          provider: session?.provider || settings.defaultProvider,
          model: session?.model || settings.defaultModel,
        },
        (chunk) => {
          appendStreamingContent(chunk);
        }
      );

      // 保存完整响应
      addMessage(sessionId, { role: 'assistant', content: fullResponse });
      clearStreamingContent();
      setLoading(false);
    } catch (error) {
      console.error('AI Error:', error);
      addMessage(sessionId, {
        role: 'assistant',
        content: `抱歉，发生了错误：${error instanceof Error ? error.message : '未知错误'}`,
      });
      clearStreamingContent();
      setLoading(false);
    }
  };

  return (
    <MainLayout
      sessions={sessions}
      currentSessionId={currentSessionId}
      onSelectSession={selectSession}
      onDeleteSession={deleteSession}
      onNewSession={handleNewSession}
      onOpenSettings={onOpenSettings}
    >
      <ChatWindow
        messages={currentSession?.messages || []}
        streamingContent={streamingContent}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
      />
    </MainLayout>
  );
};
