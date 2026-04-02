'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useInterviewConversation } from '@/hooks/useInterviewConversation';
import { ChatMessage } from './ChatMessage';
import type { PersonalityId } from '@/lib/interviewer/personalities';

interface AIChatPanelProps {
  personality?: PersonalityId;
  onStarted?: () => void;
}

export function AIChatPanel({ personality = 'friendly', onStarted }: AIChatPanelProps) {
  const { messages, isLoading, sendMessage, sendOpeningMessage } = useInterviewConversation(personality);
  const [input, setInput] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Start the interview conversation on mount
  useEffect(() => {
    if (!started) {
      setStarted(true);
      sendOpeningMessage();
      onStarted?.();
    }
  }, [started, sendOpeningMessage, onStarted]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text);
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (collapsed) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 52,
          right: 0,
          width: 36,
          height: 80,
          backgroundColor: '#111115',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRight: 'none',
          borderRadius: '8px 0 0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 200,
          writingMode: 'vertical-rl' as const,
        }}
        onClick={() => setCollapsed(false)}
        title="Open AI Interviewer"
      >
        <span style={{ fontSize: 10, color: '#C4F042', letterSpacing: '0.05em' }}>AI</span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 52,
        right: 0,
        bottom: 0,
        width: 320,
        backgroundColor: '#0E0E12',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 200,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: isLoading ? '#f59e0b' : '#C4F042',
            animation: isLoading ? 'vexo-pulse 1s ease-in-out infinite' : undefined,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(232,230,227,0.7)', flex: 1 }}>
          AI Interviewer
        </span>
        <button
          onClick={() => setCollapsed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(232,230,227,0.3)',
            cursor: 'pointer',
            fontSize: 14,
            padding: '0 4px',
          }}
          title="Collapse"
        >
          ›
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 12px 8px',
        }}
      >
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {isLoading && messages.length > 0 && messages.at(-1)?.role === 'user' && (
          <div style={{ display: 'flex', gap: 4, padding: '8px 12px', justifyContent: 'flex-start' }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(196,240,66,0.4)',
                  animation: `vexo-pulse 1s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div
        style={{
          padding: '8px 12px 12px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-grow
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Reply to interviewer… (Enter to send)"
            disabled={isLoading}
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              overflow: 'hidden',
              backgroundColor: '#16161B',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 7,
              color: '#E8E6E3',
              fontSize: 12,
              padding: '7px 10px',
              outline: 'none',
              lineHeight: 1.4,
              fontFamily: 'inherit',
              minHeight: 34,
              maxHeight: 96,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: 7,
              backgroundColor: input.trim() && !isLoading ? '#C4F042' : 'rgba(255,255,255,0.05)',
              color: input.trim() && !isLoading ? '#050507' : 'rgba(232,230,227,0.3)',
              border: 'none',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.1s',
            }}
          >
            ↑
          </button>
        </div>
      </div>

      <style>{`
        @keyframes vexo-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
