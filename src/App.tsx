import React, { useState, useEffect } from 'react';
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAppStore } from './stores/appStore';
import { useSettingsStore } from './stores/settingsStore';

const App: React.FC = () => {
  const { currentView, setCurrentView } = useAppStore();
  const { settings } = useSettingsStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // 监听主题变化并应用到 DOM
  useEffect(() => {
    const applyTheme = () => {
      const theme = settings.theme;
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

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
