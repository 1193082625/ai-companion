import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../stores/appStore';

describe('appStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.setState({
      currentView: 'chat',
      workMode: 'chat',
      sidebarCollapsed: false,
    });
  });

  it('should have initial state', () => {
    const { currentView, workMode, sidebarCollapsed } = useAppStore.getState();
    expect(currentView).toBe('chat');
    expect(workMode).toBe('chat');
    expect(sidebarCollapsed).toBe(false);
  });

  it('should set current view', () => {
    const { setCurrentView } = useAppStore.getState();
    setCurrentView('settings');
    expect(useAppStore.getState().currentView).toBe('settings');
  });

  it('should set work mode', () => {
    const { setWorkMode } = useAppStore.getState();
    setWorkMode('code');
    expect(useAppStore.getState().workMode).toBe('code');
  });

  it('should toggle sidebar', () => {
    const { toggleSidebar } = useAppStore.getState();
    expect(useAppStore.getState().sidebarCollapsed).toBe(false);
    toggleSidebar();
    expect(useAppStore.getState().sidebarCollapsed).toBe(true);
    toggleSidebar();
    expect(useAppStore.getState().sidebarCollapsed).toBe(false);
  });
});
