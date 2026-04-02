'use client';

import type { VexoNode } from '@vexo/types';

type ViewMode = 'mine' | 'reference' | 'overlay';

interface SolutionOverlayProps {
  userNodes: VexoNode[];
  referenceNodes: VexoNode[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function SolutionOverlay({ userNodes, referenceNodes, viewMode, onViewModeChange }: SolutionOverlayProps) {
  const userIds = new Set(userNodes.map((n) => n.data.componentId));
  const refIds = new Set(referenceNodes.map((n) => n.data.componentId));

  const matched = [...refIds].filter((id) => userIds.has(id));
  const missingInUser = [...refIds].filter((id) => !userIds.has(id));
  const extraInUser = [...userIds].filter((id) => !refIds.has(id));

  const VIEW_MODES: { value: ViewMode; label: string }[] = [
    { value: 'mine', label: 'My Design' },
    { value: 'reference', label: 'Reference' },
    { value: 'overlay', label: 'Overlay' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toggle */}
      <div style={{ display: 'flex', gap: 6 }}>
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onViewModeChange(mode.value)}
            style={{
              padding: '5px 14px',
              borderRadius: 6,
              border: `1px solid ${viewMode === mode.value ? 'rgba(196,240,66,0.4)' : 'rgba(255,255,255,0.08)'}`,
              backgroundColor: viewMode === mode.value ? 'rgba(196,240,66,0.08)' : 'transparent',
              color: viewMode === mode.value ? '#C4F042' : 'rgba(232,230,227,0.5)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.1s',
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: '10px 16px',
          backgroundColor: '#111115',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span style={{ color: '#4ade80' }}>✓ {matched.length} matched</span>
        <span style={{ color: '#ef4444' }}>✗ {missingInUser.length} missing</span>
        <span style={{ color: '#f59e0b' }}>+ {extraInUser.length} extra</span>
        <span style={{ color: 'rgba(232,230,227,0.3)' }}>
          {matched.length}/{refIds.size} reference components
        </span>
      </div>

      {/* Component lists for overlay view */}
      {viewMode === 'overlay' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Missing */}
          {missingInUser.length > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(239,68,68,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Missing from your design
              </div>
              {missingInUser.map((id) => {
                const refNode = referenceNodes.find((n) => n.data.componentId === id);
                return (
                  <div key={id} style={{ fontSize: 12, color: 'rgba(232,230,227,0.7)', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {refNode?.data.label ?? id}
                    <span style={{ color: 'rgba(232,230,227,0.3)', marginLeft: 8, fontSize: 10 }}>
                      ({refNode?.data.category ?? 'unknown'})
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Extra */}
          {extraInUser.length > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(245,158,11,0.04)',
                border: '1px solid rgba(245,158,11,0.15)',
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(245,158,11,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Extra components (not in reference)
              </div>
              {extraInUser.map((id) => {
                const userNode = userNodes.find((n) => n.data.componentId === id);
                return (
                  <div key={id} style={{ fontSize: 12, color: 'rgba(232,230,227,0.7)', padding: '3px 0' }}>
                    {userNode?.data.label ?? id}
                  </div>
                );
              })}
            </div>
          )}

          {/* Matched */}
          {matched.length > 0 && (
            <div
              style={{
                backgroundColor: 'rgba(74,222,128,0.04)',
                border: '1px solid rgba(74,222,128,0.15)',
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(74,222,128,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Matched components
              </div>
              {matched.map((id) => {
                const refNode = referenceNodes.find((n) => n.data.componentId === id);
                return (
                  <div key={id} style={{ fontSize: 12, color: 'rgba(232,230,227,0.7)', padding: '3px 0' }}>
                    ✓ {refNode?.data.label ?? id}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
