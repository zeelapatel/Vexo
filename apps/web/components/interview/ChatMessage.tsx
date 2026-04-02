'use client';

import type { ConversationMessage } from '@/lib/interviewer/systemPrompt';

interface ChatMessageProps {
  message: ConversationMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '8px 12px',
          borderRadius: isUser ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
          backgroundColor: isUser ? '#1C1C22' : '#141418',
          border: isUser
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(196,240,66,0.15)',
          borderLeft: isUser ? undefined : '2px solid rgba(196,240,66,0.5)',
        }}
      >
        {/* Label */}
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em',
            color: isUser ? 'rgba(232,230,227,0.25)' : 'rgba(196,240,66,0.5)',
            marginBottom: 4,
          }}
        >
          {isUser ? 'You' : 'AI Interviewer'}
        </div>

        {/* Content */}
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.5,
            color: 'rgba(232,230,227,0.85)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word' as const,
          }}
        >
          {message.content || (
            <span style={{ color: 'rgba(232,230,227,0.3)' }}>…</span>
          )}
        </div>
      </div>
    </div>
  );
}
