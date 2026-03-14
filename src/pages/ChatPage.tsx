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
    createSession,
    deleteSession,
    selectSession,
    updateSessionTitle,
    addMessage,
    setLoading,
    appendSessionStreamingContent,
    clearSessionStreamingContent,
    getCurrentSession,
    compactSessionMessages,
    clearSessionMessages,
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
      // 检查是否是命令
      if (content.startsWith('/')) {
        const command = content.trim().toLowerCase();
        const sessionId = currentSession?.id;

        if (command === '/compact') {
          // 压缩上下文
          if (sessionId) {
            compactSessionMessages(sessionId);
          }
          return;
        } else if (command === '/clear') {
          // 清空上下文
          if (sessionId) {
            clearSessionMessages(sessionId);
          }
          return;
        }
        // 其他命令不处理，直接发送
      }

      if (!currentSession) {
        // 创建新会话
        const session = createSession('chat');
        sendMessage(session.id, content);
      } else {
        sendMessage(currentSession.id, content);
      }
    },
    [currentSession, createSession, compactSessionMessages, clearSessionMessages]
  );

  const sendMessage = async (sessionId: string, content: string) => {
    // 添加用户消息
    addMessage(sessionId, { role: 'user', content });
    setLoading(true);
    clearSessionStreamingContent(sessionId);

    // 使用 getCurrentSession 获取最新的 session，确保获取到完整的 messages
    const session = getCurrentSession();
    const config = settings.providers[session?.provider || settings.defaultProvider];

    try {
      // 流式调用 AI，传递 session 以应用工作模式配置
      const fullResponse = await aiService.chatStream(
        session?.messages || [],
        {
          ...config,
          provider: session?.provider || settings.defaultProvider,
          model: session?.model || settings.defaultModel,
        },
        (chunk) => {
          // 使用会话级别的流式内容，避免切换会话时内容错乱
          appendSessionStreamingContent(sessionId, chunk);
        },
        session ?? undefined // 传递 session 以应用工作模式系统提示词和参数
      );

      // 保存完整响应
      addMessage(sessionId, { role: 'assistant', content: fullResponse });
      clearSessionStreamingContent(sessionId);
      setLoading(false);
    } catch (error) {
      console.error('AI Error:', error);
      addMessage(sessionId, {
        role: 'assistant',
        content: `抱歉，发生了错误：${error instanceof Error ? error.message : '未知错误'}`,
      });
      clearSessionStreamingContent(sessionId);
      setLoading(false);
    }
  };

  return (
    <MainLayout
      sessions={sessions}
      currentSessionId={currentSessionId}
      onSelectSession={selectSession}
      onDeleteSession={deleteSession}
      onRenameSession={updateSessionTitle}
      onNewSession={handleNewSession}
      onOpenSettings={onOpenSettings}
    >
      <ChatWindow
        messages={currentSession?.messages || []}
        streamingContent={currentSession?.streamingContent || ''}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
      />
    </MainLayout>
  );
};
