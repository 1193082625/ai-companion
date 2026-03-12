import React from 'react';
import type { ChatSession, WorkMode } from '../types';

interface SessionListProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewSession: (type: WorkMode) => void;
}

const WorkModeIcon: React.FC<{ type: WorkMode }> = ({ type }) => {
  const icons = {
    chat: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    code: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    project: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    content: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  };
  return icons[type];
};

const WorkModeLabel: React.FC<{ type: WorkMode }> = ({ type }) => {
  const labels = {
    chat: '对话',
    code: '代码',
    project: '项目',
    content: '创作',
  };
  return labels[type];
};

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewSession,
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* 新建对话按钮 */}
      <div className="p-3">
        <button
          onClick={() => onNewSession('chat')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-br from-accent to-accent-hover text-white rounded-xl hover:opacity-90 transition-all font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建对话
        </button>
      </div>

      {/* 工作模式快捷选择 */}
      <div className="px-3 pb-3 grid grid-cols-2 gap-2">
        {(['code', 'project', 'content'] as WorkMode[]).map((type) => (
          <button
            key={type}
            onClick={() => onNewSession(type)}
            className="flex items-center justify-center gap-1.5 px-2 py-2 bg-bg-tertiary hover:bg-bg-card text-text-secondary hover:text-text-primary rounded-lg transition-all text-xs"
          >
            <WorkModeIcon type={type} />
            <WorkModeLabel type={type} />
          </button>
        ))}
      </div>

      {/* 分隔线 */}
      <div className="mx-3 border-t border-border" />

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.length === 0 ? (
          <div className="text-center text-text-muted text-sm py-8">
            暂无对话记录
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                currentSessionId === session.id
                  ? 'bg-bg-card border border-accent/50'
                  : 'hover:bg-bg-tertiary border border-transparent'
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className={`flex-shrink-0 ${
                currentSessionId === session.id ? 'text-accent' : 'text-text-muted'
              }`}>
                <WorkModeIcon type={session.type} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-primary truncate font-medium">
                  {session.title}
                </div>
                <div className="text-xs text-text-muted">
                  {new Date(session.updatedAt).toLocaleDateString('zh-CN')}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-red-400 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
