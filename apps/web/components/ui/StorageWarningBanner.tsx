'use client';

import { X } from 'lucide-react';
import { useStorageWarning } from '@/hooks/useStorageWarning';

export function StorageWarningBanner() {
  const { showWarning, dismiss } = useStorageWarning();
  if (!showWarning) return null;

  return (
    <div
      style={{
        padding: '6px 12px',
        backgroundColor: 'rgba(245,166,35,0.1)',
        border: '1px solid rgba(245,166,35,0.2)',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '8px 8px 0',
      }}
    >
      <span style={{ flex: 1, fontSize: 11, color: '#F5A623', lineHeight: 1.4 }}>
        Storage nearly full. Export your designs to avoid data loss.
      </span>
      <button
        onClick={dismiss}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(245,166,35,0.6)',
          padding: 2,
          flexShrink: 0,
        }}
      >
        <X size={11} />
      </button>
    </div>
  );
}
