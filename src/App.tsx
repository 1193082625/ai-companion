import React, { useState } from 'react';
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAppStore } from './stores/appStore';

const App: React.FC = () => {
  const { currentView, setCurrentView } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化检查
  React.useEffect(() => {
    // 可以在这里添加初始化逻辑
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-2xl">AI</span>
          </div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentView === 'chat' && (
        <ChatPage onOpenSettings={() => setCurrentView('settings')} />
      )}
      {currentView === 'settings' && <SettingsPage onBack={() => setCurrentView('chat')} />}
    </>
  );
};

export default App;
