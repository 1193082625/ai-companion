import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, AIProvider, AIConfig } from '../types';
import { DEFAULT_SETTINGS } from '../types';

interface SettingsState {
  settings: AppSettings;

  // Actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateProviderConfig: (provider: AIProvider, config: Partial<AIConfig>) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setDefaultProvider: (provider: AIProvider) => void;
  setDefaultModel: (model: string) => void;
  setOllamaEndpoint: (endpoint: string) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      updateProviderConfig: (provider, config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            providers: {
              ...state.settings.providers,
              [provider]: {
                ...state.settings.providers[provider],
                ...config,
              },
            },
          },
        })),

      setTheme: (theme) =>
        set((state) => ({
          settings: { ...state.settings, theme },
        })),

      setDefaultProvider: (provider) =>
        set((state) => ({
          settings: {
            ...state.settings,
            defaultProvider: provider,
            defaultModel: state.settings.providers[provider].model || '',
          },
        })),

      setDefaultModel: (model) =>
        set((state) => ({
          settings: { ...state.settings, defaultModel: model },
        })),

      setOllamaEndpoint: (endpoint) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ollamaEndpoint: endpoint,
            providers: {
              ...state.settings.providers,
              ollama: {
                ...state.settings.providers.ollama,
                baseUrl: endpoint,
              },
            },
          },
        })),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'ai-companion-settings',
    }
  )
);
