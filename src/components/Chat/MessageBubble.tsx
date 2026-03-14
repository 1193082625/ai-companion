import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex w-full animate-fade-in ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-br from-accent to-accent-hover text-white'
            : 'bg-bg-card border border-border'
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2 text-xs text-text-muted">
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-accent text-[10px] font-bold">AI</span>
            </div>
            <span>{message.provider || 'AI'}</span>
          </div>
        )}

        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="relative group">
                    <button
                      onClick={handleCopy}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-bg-tertiary text-text-secondary text-xs px-2 py-1 rounded hover:bg-accent hover:text-white"
                    >
                      {copied ? '已复制' : '复制'}
                    </button>
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code
                    className="bg-bg-tertiary text-accent-light px-1.5 py-0.5 rounded text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              p: ({ children }) => (
                <p className="text-text-primary leading-relaxed mb-2 last:mb-0">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 text-text-primary">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1 text-text-primary">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="text-text-primary">{children}</li>,
              table: ({ children }) => (
                <div className="overflow-x-auto my-3">
                  <table className="min-w-full border border-border rounded-lg overflow-hidden">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-bg-tertiary border-b border-border">
                  {children}
                </thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-border">
                  {children}
                </tbody>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-bg-tertiary/50 transition-colors">
                  {children}
                </tr>
              ),
              th: ({ children }) => (
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-3 text-sm text-text-primary">
                  {children}
                </td>
              ),
              h1: ({ children }) => (
                <h1 className="text-xl font-bold text-text-primary mt-4 mb-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold text-text-primary mt-3 mb-2">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-medium text-text-primary mt-2 mb-1">
                  {children}
                </h3>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-accent hover:text-accent-light underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-accent pl-3 italic text-text-secondary">
                  {children}
                </blockquote>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {!isUser && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-text-primary"
            title="复制"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
