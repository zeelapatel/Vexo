'use client';

import { memo, useState, useCallback } from 'react';
import { getBezierPath, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';
import type { VexoEdge as VexoEdgeType } from '@vexo/types';
import { CONNECTION_TYPE_LABELS } from '@vexo/engine';
import { ConnectionType } from '@vexo/types';
import { useIssuesStore, selectFocusedIssue } from '@/store/issuesStore';
import { useCanvasStore } from '@/store/canvasStore';

const edgeStyles: Record<string, { stroke: string; strokeDasharray?: string } | undefined> = {
  valid: { stroke: 'rgba(196,240,66,0.3)' },
  warned: { stroke: 'rgba(245,166,35,0.4)', strokeDasharray: '6 4' },
  blocked: { stroke: 'rgba(255,92,92,0.4)', strokeDasharray: '4 3' },
};

const ALL_CONNECTION_TYPES = Object.values(ConnectionType);

export const VexoEdge = memo(function VexoEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<VexoEdgeType>) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const updateEdgeData = useCanvasStore((s) => s.updateEdgeData);

  const handleTypeChange = useCallback(
    (newType: ConnectionType) => {
      updateEdgeData(id, { connectionType: newType });
      setDropdownOpen(false);
    },
    [id, updateEdgeData],
  );
  const markerId = `arrow-${id}`;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Issue highlight
  const focusedIssue = useIssuesStore(selectFocusedIssue);
  const isIssueHighlighted = focusedIssue?.affectedEdgeIds?.includes(id) ?? false;
  const issueHighlightColor =
    focusedIssue?.severity === 'critical' ? 'rgba(255,68,68,0.9)' : 'rgba(245,166,35,0.9)';

  const validationStatus = data?.validationStatus ?? 'valid';
  const style =
    edgeStyles[validationStatus] ?? edgeStyles['valid'] ?? { stroke: 'rgba(196,240,66,0.3)' };

  const strokeColor = selected
    ? '#C4F042'
    : isIssueHighlighted
      ? issueHighlightColor
      : style.stroke;

  const connectionType = data?.connectionType as ConnectionType | undefined;
  const typeLabel = connectionType ? (CONNECTION_TYPE_LABELS[connectionType] ?? null) : null;

  const labelColor = selected
    ? '#C4F042'
    : isIssueHighlighted
      ? issueHighlightColor
      : 'rgba(232,230,227,0.45)';

  const labelBorder = selected
    ? 'rgba(196,240,66,0.3)'
    : isIssueHighlighted
      ? (focusedIssue?.severity === 'critical'
          ? 'rgba(255,68,68,0.4)'
          : 'rgba(245,166,35,0.4)')
      : 'rgba(255,255,255,0.06)';

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L6,3 Z" fill={strokeColor} />
        </marker>
      </defs>
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={selected || isIssueHighlighted ? 2 : 1.5}
        strokeDasharray={style.strokeDasharray}
        markerEnd={`url(#${markerId})`}
        style={{ transition: 'stroke 0.15s' }}
      />
      {typeLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              zIndex: dropdownOpen ? 50 : 1,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {/* Clickable type badge */}
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              title="Change connection type"
              style={{
                display: 'block',
                fontSize: 9,
                fontFamily: 'var(--font-mono, monospace)',
                color: labelColor,
                backgroundColor: '#0C0C0F',
                border: `1px solid ${labelBorder}`,
                borderRadius: 3,
                padding: '1px 4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                lineHeight: 1.4,
              }}
            >
              {typeLabel}
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                  onClick={() => setDropdownOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#1C1C22',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: 4,
                    zIndex: 50,
                    minWidth: 130,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  }}
                >
                  {ALL_CONNECTION_TYPES.map((ct) => {
                    const isActive = ct === connectionType;
                    return (
                      <button
                        key={ct}
                        onClick={() => handleTypeChange(ct)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '5px 8px',
                          fontSize: 10,
                          fontFamily: 'var(--font-mono, monospace)',
                          color: isActive ? '#C4F042' : 'rgba(232,230,227,0.7)',
                          backgroundColor: isActive ? 'rgba(196,240,66,0.08)' : 'transparent',
                          border: 'none',
                          borderRadius: 5,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive)
                            (e.currentTarget as HTMLElement).style.backgroundColor =
                              'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive)
                            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        {CONNECTION_TYPE_LABELS[ct]}
                        <span style={{ marginLeft: 4, opacity: 0.4 }}>{ct}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
