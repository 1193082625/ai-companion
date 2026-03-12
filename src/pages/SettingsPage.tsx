import React, { useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { PROVIDERS, type AIProvider } from '../types';
import { aiService } from '../services/aiService';

interface SettingsPageProps {
  onBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { settings, updateProviderConfig, setDefaultProvider, setTheme, setOllamaEndpoint } =
    useSettingsStore();

  const [activeTab, setActiveTab] = useState<'providers' | 'general'>('providers');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('minimax');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    [key: string]: 'success' | 'error' | null;
  }>({});

  const currentProviderConfig = settings.providers[selectedProvider];

  const handleApiKeyChange = (value: string) => {
    updateProviderConfig(selectedProvider, { apiKey: value });
  };

  const handleModelChange = (value: string) => {
    updateProviderConfig(selectedProvider, { model: value });
  };

  const handleBaseUrlChange = (value: string) => {
    updateProviderConfig(selectedProvider, { baseUrl: value });
  };

  const handleTemperatureChange = (value: number) => {
    updateProviderConfig(selectedProvider, { temperature: value });
  };

  const handleMaxTokensChange = (value: number) => {
    updateProviderConfig(selectedProvider, { maxTokens: value });
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus((prev) => ({ ...prev, [selectedProvider]: null }));

    try {
      if (selectedProvider === 'ollama') {
        const isConnected = await aiService.checkOllamaConnection(
          settings.ollamaEndpoint
        );
        setConnectionStatus((prev) => ({
          ...prev,
          [selectedProvider]: isConnected ? 'success' : 'error',
        }));
      } else {
        // 其他提供商简单测试
        setConnectionStatus((prev) => ({
          ...prev,
          [selectedProvider]: 'success',
        }));
      }
    } catch {
      setConnectionStatus((prev) => ({
        ...prev,
        [selectedProvider]: 'error',
      }));
    } finally {
      setTestingConnection(false);
    }
  };

  const providerInfo = PROVIDERS.find((p) => p.id === selectedProvider);

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* 左侧边栏 */}
      <div className="w-64 bg-bg-secondary border-r border-border flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">返回</span>
          </button>
        </div>

        <div className="p-3 space-y-1">
          <button
            onClick={() => setActiveTab('providers')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === 'providers'
                ? 'bg-bg-card text-text-primary'
                : 'text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
            AI 提供商
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              activeTab === 'general'
                ? 'bg-bg-card text-text-primary'
                : 'text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            通用设置
          </button>
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          {activeTab === 'providers' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-text-primary mb-1">
                  AI 提供商设置
                </h2>
                <p className="text-text-secondary text-sm">
                  配置不同的 AI 服务提供商
                </p>
              </div>

              {/* 提供商选择 */}
              <div className="flex flex-wrap gap-2">
                {PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.id)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedProvider === provider.id
                        ? 'bg-accent text-white'
                        : 'bg-bg-tertiary text-text-secondary hover:bg-bg-card'
                    }`}
                  >
                    {provider.name}
                  </button>
                ))}
              </div>

              {/* 当前提供商配置 */}
              <div className="bg-bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-text-primary">
                      {providerInfo?.name}
                    </h3>
                    <p className="text-sm text-text-muted">
                      默认模型: {providerInfo?.defaultModel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {connectionStatus[selectedProvider] && (
                      <span
                        className={`text-sm ${
                          connectionStatus[selectedProvider] === 'success'
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        {connectionStatus[selectedProvider] === 'success'
                          ? '✓ 连接成功'
                          : '✗ 连接失败'}
                      </span>
                    )}
                    <button
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      className="px-3 py-1.5 bg-bg-tertiary hover:bg-accent/20 text-text-secondary hover:text-accent rounded-lg transition-all text-sm"
                    >
                      {testingConnection ? '测试中...' : '测试连接'}
                    </button>
                  </div>
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    API Key {providerInfo?.needsApiKey ? '*' : ''}
                  </label>
                  <input
                    type="password"
                    value={currentProviderConfig.apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder={
                      providerInfo?.needsApiKey
                        ? '请输入 API Key'
                        : '本地部署，无需 API Key'
                    }
                    disabled={!providerInfo?.needsApiKey}
                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent disabled:opacity-50"
                  />
                </div>

                {/* Base URL */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    API 地址
                  </label>
                  <input
                    type="text"
                    value={currentProviderConfig.baseUrl || ''}
                    onChange={(e) => handleBaseUrlChange(e.target.value)}
                    placeholder={providerInfo?.baseUrl}
                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    模型
                  </label>
                  <input
                    type="text"
                    value={currentProviderConfig.model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    placeholder={providerInfo?.defaultModel}
                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Temperature: {currentProviderConfig.temperature || 0.7}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={currentProviderConfig.temperature || 0.7}
                    onChange={(e) => handleTemperatureChange(parseFloat(e.target.value))}
                    className="w-full accent-accent"
                  />
                </div>

                {/* Max Tokens */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Max Tokens: {currentProviderConfig.maxTokens || 4096}
                  </label>
                  <input
                    type="range"
                    min="256"
                    max="8192"
                    step="256"
                    value={currentProviderConfig.maxTokens || 4096}
                    onChange={(e) => handleMaxTokensChange(parseInt(e.target.value))}
                    className="w-full accent-accent"
                  />
                </div>

                {/* 设为默认 */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-text-secondary">设为默认提供商</span>
                  <button
                    onClick={() => setDefaultProvider(selectedProvider)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      settings.defaultProvider === selectedProvider
                        ? 'bg-accent text-white'
                        : 'bg-bg-tertiary text-text-secondary hover:bg-accent/20'
                    }`}
                  >
                    {settings.defaultProvider === selectedProvider ? '✓ 已设为默认' : '设为默认'}
                  </button>
                </div>
              </div>

              {/* Ollama 专用设置 */}
              {selectedProvider === 'ollama' && (
                <div className="bg-bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="font-medium text-text-primary">Ollama 本地设置</h3>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Ollama 服务地址
                    </label>
                    <input
                      type="text"
                      value={settings.ollamaEndpoint || ''}
                      onChange={(e) => setOllamaEndpoint(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-text-primary mb-1">
                  通用设置
                </h2>
                <p className="text-text-secondary text-sm">
                  应用的基本设置
                </p>
              </div>

              {/* 主题设置 */}
              <div className="bg-bg-card border border-border rounded-xl p-6">
                <h3 className="font-medium text-text-primary mb-4">外观</h3>
                <div className="flex gap-3">
                  {(['dark', 'light', 'system'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setTheme(theme)}
                      className={`flex-1 px-4 py-3 rounded-lg transition-all ${
                        settings.theme === theme
                          ? 'bg-accent text-white'
                          : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                      }`}
                    >
                      {theme === 'dark' && '深色'}
                      {theme === 'light' && '浅色'}
                      {theme === 'system' && '跟随系统'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 关于 */}
              <div className="bg-bg-card border border-border rounded-xl p-6">
                <h3 className="font-medium text-text-primary mb-4">关于</h3>
                <div className="space-y-2 text-text-secondary">
                  <p>AI 伙伴 v1.0.0</p>
                  <p className="text-sm">
                    面向个人开发者的综合 AI 助手桌面应用
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
