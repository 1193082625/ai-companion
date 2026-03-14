import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../../types';

describe('MessageBubble', () => {
  const userMessage: Message = {
    id: '1',
    role: 'user',
    content: 'Hello, AI!',
    timestamp: Date.now(),
  };

  const aiMessage: Message = {
    id: '2',
    role: 'assistant',
    content: 'Hello, human!',
    timestamp: Date.now(),
    provider: 'openai',
  };

  it('should render user message correctly', () => {
    render(<MessageBubble message={userMessage} />);

    const content = screen.getByText('Hello, AI!');
    expect(content).toBeInTheDocument();
  });

  it('should render AI message with provider', () => {
    render(<MessageBubble message={aiMessage} />);

    const content = screen.getByText('Hello, human!');
    expect(content).toBeInTheDocument();

    const provider = screen.getByText('openai');
    expect(provider).toBeInTheDocument();
  });

  it('should render markdown content', () => {
    const markdownMessage: Message = {
      id: '3',
      role: 'assistant',
      content: '# Hello\n\nThis is **bold**',
      timestamp: Date.now(),
    };

    render(<MessageBubble message={markdownMessage} />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Hello');
  });
});
