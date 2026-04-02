'use client';

import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AlertTriangle, Trash2, Copy } from 'lucide-react';
import type { VexoNode as VexoNodeType } from '@vexo/types';
import { SystemStatus } from '@vexo/types';
import { NodeIcon } from './NodeIcon';
import { useSimulationStore } from '@/store/simulationStore';
import { useIssuesStore } from '@/store/issuesStore';
import { useCanvasStore } from '@/store/canvasStore';

const statusColors: Record<SystemStatus, string> = {
  [SystemStatus.Healthy]: '#C4F042',
  [SystemStatus.Warning]: '#F5A623',
  [SystemStatus.Critical]: '#FF4444',
  [SystemStatus.Idle]: 'rgba(232,230,227,0.3)',
};

const statusBorders: Record<SystemStatus, string> = {
  [SystemStatus.Healthy]: 'rgba(255,255,255,0.08)',
  [SystemStatus.Warning]: 'rgba(245,166,35,0.4)',
  [SystemStatus.Critical]: 'rgba(255,68,68,0.4)',
  [SystemStatus.Idle]: 'rgba(255,255,255,0.05)',
};

const statusShadows: Record<SystemStatus, string> = {
  [SystemStatus.Healthy]: 'none',
  [SystemStatus.Warning]: '0 0 20px rgba(245,166,35,0.3)',
  [SystemStatus.Critical]: '0 0 20px rgba(255,68,68,0.3)',
  [SystemStatus.Idle]: 'none',
};

export const VexoNode = memo(function VexoNode({ data, selected, id }: NodeProps<VexoNodeType>) {
  const { label, componentId, category, cloudVariant, status: nodeStatus, metrics: nodeMetrics } =
    data;

  // Live simulation results
  const simResult = useSimulationStore((s) => s.nodeResults[id]);
  const bottleneckPath = useSimulationStore((s) => s.bottleneckPath);
  const isBottleneck =
    bottleneckPath.includes(id) && bottleneckPath[bottleneckPath.length - 1] === id;

  // Issue highlight
  const focusedIssue = useIssuesStore((s) =>
    s.focusedIssueId ? s.issues.find((i) => i.id === s.focusedIssueId) ?? null : null,
  );
  const isIssueHighlighted = focusedIssue?.affectedNodeIds?.includes(id) ?? false;
  const issueHighlightSeverity = isIssueHighlighted ? focusedIssue!.severity : null;
  const issueColor =
    issueHighlightSeverity === 'critical' ? 'rgba(255,68,68,0.85)' : 'rgba(245,166,35,0.85)';

  // Node actions
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    useCanvasStore.getState().removeNode(id);
  }, [id]);

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const currentNodes = useCanvasStore.getState().nodes;
    const original = currentNodes.find((n) => n.id === id);
    if (!original) return;
    useCanvasStore.getState().addNode({
      ...original,
      id: crypto.randomUUID(),
      position: { x: original.position.x + 40, y: original.position.y + 40 },
      selected: false,
    });
  }, [id]);

  // Edge validation badges — check if any connected edge has a problem
  const hasBlockedEdge = useCanvasStore(
    (s) => s.edges.some((e) => (e.source === id || e.target === id) && e.data?.validationStatus === 'blocked'),
  );
  const hasWarnedEdge = useCanvasStore(
    (s) => s.edges.some((e) => (e.source === id || e.target === id) && e.data?.validationStatus === 'warned'),
  );
  const edgeBadgeSeverity = hasBlockedEdge ? 'blocked' : hasWarnedEdge ? 'warned' : null;

  const status = simResult?.status ?? nodeStatus;
  const metrics = simResult
    ? {
        latencyP50: simResult.latencyP50,
        latencyP99: simResult.latencyP99,
        saturation: simResult.saturation,
        currentRPS: simResult.currentRPS,
      }
    : nodeMetrics;

  const borderColor = selected
    ? '#C4F042'
    : isBottleneck
      ? '#FF4444'
      : isIssueHighlighted
        ? issueColor
        : statusBorders[status];

  const boxShadow = isIssueHighlighted
    ? selected
      ? `0 0 0 1px #C4F042, 0 0 0 2.5px ${issueColor}` // two-ring: green inner + issue outer
      : `0 0 0 2px ${issueColor}`
    : selected
      ? '0 0 0 1px #C4F042, 0 0 24px rgba(196,240,66,0.08)'
      : isBottleneck
        ? '0 0 0 2px #FF4444, 0 0 24px rgba(255,68,68,0.4)'
        : statusShadows[status];

  // Issue pulse takes priority; no animation when selected (static two-ring is enough)
  const animation = !selected && isIssueHighlighted
    ? issueHighlightSeverity === 'critical'
      ? 'issuePulseCritical 1.5s ease-in-out infinite'
      : 'issuePulseWarning 1.5s ease-in-out infinite'
    : !selected && isBottleneck
      ? 'bottleneckPulse 2s infinite'
      : undefined;

  return (
    <div
      style={{
        backgroundColor: '#111115',
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: '12px 14px',
        minWidth: 160,
        maxWidth: 220,
        boxShadow,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        position: 'relative',
        animation,
      }}
    >
      <style>{`
        @keyframes bottleneckPulse {
          0%, 100% { box-shadow: 0 0 0 2px #FF4444, 0 0 24px rgba(255,68,68,0.4); }
          50% { box-shadow: 0 0 0 2px #FF4444, 0 0 40px rgba(255,68,68,0.7); }
        }
        @keyframes issuePulseWarning {
          0%, 100% { box-shadow: 0 0 0 2px rgba(245,166,35,0.85), 0 0 14px rgba(245,166,35,0.25); }
          50% { box-shadow: 0 0 0 2px rgba(245,166,35,0.85), 0 0 28px rgba(245,166,35,0.55); }
        }
        @keyframes issuePulseCritical {
          0%, 100% { box-shadow: 0 0 0 2px rgba(255,68,68,0.85), 0 0 14px rgba(255,68,68,0.25); }
          50% { box-shadow: 0 0 0 2px rgba(255,68,68,0.85), 0 0 28px rgba(255,68,68,0.55); }
        }
      `}</style>

      {/* Floating action bar — appears above node when selected */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 4,
            backgroundColor: '#1C1C22',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '4px 5px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            zIndex: 20,
            whiteSpace: 'nowrap',
          }}
          className="nodrag nopan"
        >
          <button
            onClick={handleDuplicate}
            title="Duplicate"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'transparent',
              border: 'none',
              borderRadius: 5,
              padding: '5px 7px',
              cursor: 'pointer',
              color: 'rgba(232,230,227,0.6)',
              fontSize: 11,
              fontFamily: 'var(--font-sans, inherit)',
              transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLElement).style.color = '#E8E6E3';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'rgba(232,230,227,0.6)';
            }}
          >
            <Copy size={13} />
          </button>
          <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.07)', margin: '2px 0' }} />
          <button
            onClick={handleDelete}
            title="Delete"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'transparent',
              border: 'none',
              borderRadius: 5,
              padding: '4px 8px',
              cursor: 'pointer',
              color: 'rgba(255,68,68,0.7)',
              fontSize: 11,
              fontFamily: 'var(--font-sans, inherit)',
              transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,68,68,0.08)';
              (e.currentTarget as HTMLElement).style.color = '#FF4444';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,68,68,0.7)';
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* Edge validation badge — top-right corner */}
      {edgeBadgeSeverity && (
        <div
          title={edgeBadgeSeverity === 'blocked' ? 'Blocked connection' : 'Connection warning'}
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            zIndex: 10,
            backgroundColor: '#111115',
            borderRadius: '50%',
            padding: 2,
            lineHeight: 0,
          }}
        >
          <AlertTriangle
            size={13}
            color={edgeBadgeSeverity === 'blocked' ? '#FF4444' : '#F5A623'}
          />
        </div>
      )}

      {/* Target handle — left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#16161B',
          border: '1.5px solid rgba(232,230,227,0.35)',
          left: -4,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />

      {/* Top row: icon + label + cloud badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: metrics ? 8 : 0 }}>
        <NodeIcon componentId={componentId} category={category} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#E8E6E3',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
            }}
          >
            {label}
          </div>
          {cloudVariant && (
            <div
              style={{
                fontSize: 9,
                fontFamily: 'var(--font-mono, monospace)',
                color: 'rgba(232,230,227,0.35)',
                backgroundColor: '#16161B',
                padding: '1px 5px',
                borderRadius: 4,
                display: 'inline-block',
                marginTop: 2,
              }}
            >
              {cloudVariant}
            </div>
          )}
        </div>
      </div>

      {/* Metrics row */}
      {metrics && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <MetricDot
            value={
              metrics.currentRPS > 0
                ? metrics.currentRPS >= 1000
                  ? `${Math.round(metrics.currentRPS / 1000)}K`
                  : String(metrics.currentRPS)
                : '—'
            }
            color={statusColors[status]}
            label="rps"
          />
          <MetricDot
            value={metrics.latencyP50 > 0 ? `${metrics.latencyP50}ms` : '—'}
            color={statusColors[status]}
            label="p50"
          />
          <MetricDot
            value={metrics.saturation > 0 ? `${Math.round(metrics.saturation * 100)}%` : '—'}
            color={
              metrics.saturation > 0.8
                ? '#FF4444'
                : metrics.saturation > 0.6
                  ? '#F5A623'
                  : statusColors[status]
            }
            label="sat"
          />
        </div>
      )}

      {/* Source handle — right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#16161B',
          border: '1.5px solid rgba(232,230,227,0.35)',
          right: -4,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />
    </div>
  );
});

function MetricDot({
  value,
  color,
  label: _label,
}: {
  value: string;
  color: string;
  label: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 10,
          fontFamily: 'var(--font-mono, monospace)',
          color: 'rgba(232,230,227,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
}
