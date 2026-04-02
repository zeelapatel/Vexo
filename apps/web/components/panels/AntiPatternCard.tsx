'use client';

import { Zap, X } from 'lucide-react';
import type { Issue } from '@/store/issuesStore';

interface AntiPatternCardProps {
  issue: Issue;
  onDismiss: () => void;
  onAutoFix?: () => void;
}

export function AntiPatternCard({ issue, onDismiss, onAutoFix }: AntiPatternCardProps) {
  return (
    <div
      style={{
        backgroundColor: '#111115',
        border: '1px solid rgba(245,166,35,0.15)',
        borderRadius: 8,
        padding: '10px 12px',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: 'rgba(245,166,35,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Zap size={10} color="#F5A623" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#F5A623', marginBottom: 3 }}>
            {issue.title}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(232,230,227,0.6)',
              lineHeight: 1.5,
              marginBottom: issue.suggestedFix ? 5 : 0,
            }}
          >
            {issue.body}
          </div>
          {issue.suggestedFix && (
            <div style={{ fontSize: 11, color: '#C4F042', lineHeight: 1.4 }}>
              → {issue.suggestedFix}
            </div>
          )}
          {issue.autoFixAvailable && onAutoFix && (
            <button
              onClick={onAutoFix}
              style={{
                marginTop: 8,
                fontSize: 11,
                fontFamily: 'var(--font-mono, monospace)',
                color: '#C4F042',
                backgroundColor: 'rgba(196,240,66,0.1)',
                border: 'none',
                borderRadius: 4,
                padding: '4px 10px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'rgba(196,240,66,0.2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'rgba(196,240,66,0.1)';
              }}
            >
              Auto-fix
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(232,230,227,0.3)',
            padding: 2,
          }}
        >
          <X size={11} />
        </button>
      </div>
    </div>
  );
}
