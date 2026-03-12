import { create } from 'zustand';
import type { WorkMode } from '../types';

type ViewType = 'chat' | 'settings';

interface AppState {
  currentView: ViewType;
  workMode: WorkMode;
  sidebarCollapsed: boolean;

  // Actions
  setCurrentView: (view: ViewType) => void;
  setWorkMode: (mode: WorkMode) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  currentView: 'chat',
  workMode: 'chat',
  sidebarCollapsed: false,

  setCurrentView: (view) => set({ currentView: view }),

  setWorkMode: (mode) => set({ workMode: mode }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
