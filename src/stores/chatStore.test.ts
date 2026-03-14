import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../stores/chatStore';

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      sessions: [],
      currentSessionId: null,
      isLoading: false,
      streamingContent: '',
    });
  });

  it('should have initial state', () => {
    const { sessions, currentSessionId, isLoading, streamingContent } = useChatStore.getState();
    expect(sessions).toEqual([]);
    expect(currentSessionId).toBeNull();
    expect(isLoading).toBe(false);
    expect(streamingContent).toBe('');
  });

  it('should create a new session', () => {
    const { createSession } = useChatStore.getState();
    const session = createSession('chat', 'Test Session');

    expect(session).toBeDefined();
    expect(session.id).toBeDefined();
    expect(session.title).toBe('Test Session');
    expect(session.type).toBe('chat');
    expect(session.messages).toEqual([]);

    const { sessions: allSessions, currentSessionId } = useChatStore.getState();
    expect(allSessions).toHaveLength(1);
    expect(currentSessionId).toBe(session.id);
  });

  it('should delete a session', () => {
    const { createSession, deleteSession } = useChatStore.getState();
    const session1 = createSession('chat', 'Session 1');
    createSession('code', 'Session 2');

    deleteSession(session1.id);

    const { sessions } = useChatStore.getState();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].title).toBe('Session 2');
  });

  it('should add message to session', () => {
    const { createSession, addMessage } = useChatStore.getState();
    const session = createSession('chat');

    addMessage(session.id, {
      role: 'user',
      content: 'Hello',
    });

    const { sessions } = useChatStore.getState();
    expect(sessions[0].messages).toHaveLength(1);
    expect(sessions[0].messages[0].role).toBe('user');
    expect(sessions[0].messages[0].content).toBe('Hello');
  });

  it('should update loading state', () => {
    const { setLoading } = useChatStore.getState();

    setLoading(true);
    expect(useChatStore.getState().isLoading).toBe(true);

    setLoading(false);
    expect(useChatStore.getState().isLoading).toBe(false);
  });

  it('should handle streaming content', () => {
    const { setStreamingContent, appendStreamingContent, clearStreamingContent } = useChatStore.getState();

    setStreamingContent('Hello');
    expect(useChatStore.getState().streamingContent).toBe('Hello');

    appendStreamingContent(' World');
    expect(useChatStore.getState().streamingContent).toBe('Hello World');

    clearStreamingContent();
    expect(useChatStore.getState().streamingContent).toBe('');
  });
});
