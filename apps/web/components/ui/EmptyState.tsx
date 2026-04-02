'use client';

import { MousePointerClick } from 'lucide-react';

interface EmptyStateProps {
  onStartInterview?: () => void;
  onImport?: () => void;
}

export function CanvasEmptyState({ onStartInterview, onImport }: EmptyStateProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
      <div style={{ pointerEvents: 'none', textAlign: 'center', maxWidth: 320 }}>
        <MousePointerClick size={32} color="rgba(232,230,227,0.15)" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: 16, fontWeight: 500, color: 'rgba(232,230,227,0.4)', marginBottom: 8 }}>
          Drag components to start building
        </h3>
        <p style={{ fontSize: 13, color: 'rgba(232,230,227,0.25)', lineHeight: 1.5, marginBottom: 20 }}>
          Pick any component from the sidebar on the left and drop it onto the canvas.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', pointerEvents: 'all' }}>
          {onStartInterview && (
            <button
              onClick={onStartInterview}
              style={{ fontSize: 12, backgroundColor: 'rgba(196,240,66,0.08)', border: '1px solid rgba(196,240,66,0.2)', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', color: '#C4F042' }}
            >
              Start from Template
            </button>
          )}
          {onImport && (
            <button
              onClick={onImport}
              style={{ fontSize: 12, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', color: 'rgba(232,230,227,0.5)' }}
            >
              Import Design
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
