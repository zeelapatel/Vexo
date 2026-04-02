'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import { useSimulationStore } from '@/store/simulationStore';
import { useCanvasStore } from '@/store/canvasStore';
import { getComponentIcon } from '@vexo/ui';

function formatLatency(ms: number): string {
  if (ms === 0) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function formatThroughput(qps: number): string {
  if (qps === Infinity || qps === 0) return '∞';
  if (qps >= 1_000_000) return `${(qps / 1_000_000).toFixed(1)}M`;
  if (qps >= 1_000) return `${Math.round(qps / 1000)}K`;
  return String(qps);
}

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  context?: string;
  color?: string;
}

function MetricCard({ label, value, unit, context, color }: MetricCardProps) {
  return (
    <div
      style={{
        backgroundColor: '#0C0C0F',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontFamily: 'var(--font-mono, monospace)',
          color: 'rgba(232,230,227,0.35)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: color ?? '#E8E6E3' }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: 'rgba(232,230,227,0.4)' }}>{unit}</span>}
      </div>
      {context && (
        <div style={{ fontSize: 11, color: 'rgba(232,230,227,0.4)', marginTop: 4 }}>{context}</div>
      )}
    </div>
  );
}

export function SimulationResultsPanel() {
  const [expanded, setExpanded] = useState(false);
  const { nodeResults, bottleneckPath, totalLatency, warnings, isRunning } = useSimulationStore();
  const nodes = useCanvasStore((s) => s.nodes);
  const entryQPS = useSimulationStore((s) => s.entryQPS);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const hasResults = Object.keys(nodeResults).length > 0;

  const primaryBottleneckId = bottleneckPath[bottleneckPath.length - 1];
  const primaryBottleneckNode = primaryBottleneckId ? nodeMap.get(primaryBottleneckId) : null;
  const primarySaturation = primaryBottleneckId
    ? (nodeResults[primaryBottleneckId]?.saturation ?? 0)
    : 0;

  const maxThroughput = primarySaturation > 0 ? Math.round(entryQPS / primarySaturation) : 0;

  // Estimate error rate from critical nodes
  const criticalCount = Object.values(nodeResults).filter((r) => r.status === 'Critical').length;
  const totalNodes = Object.keys(nodeResults).length;
  const errorRatePct = totalNodes > 0 ? Math.round((criticalCount / totalNodes) * 100) : 0;

  if (!hasResults && !isRunning) return null;

  return (
    <div
      style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: '#0A0A0D',
        flexShrink: 0,
      }}
    >
      {/* Toggle handle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '6px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(232,230,227,0.5)',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono, monospace)',
            color: 'rgba(232,230,227,0.4)',
          }}
        >
          {isRunning
            ? 'Simulating...'
            : `Simulation Results ${hasResults ? `(${Object.keys(nodeResults).length} nodes)` : ''}`}
        </span>
        {expanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>

      {expanded && hasResults && (
        <div style={{ padding: '8px 14px 14px', maxHeight: 320, overflowY: 'auto' }}>
          {/* 4 metric cards */}
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}
          >
            <MetricCard
              label="End-to-End Latency"
              value={formatLatency(totalLatency)}
              context="p99 along critical path"
              color={totalLatency > 1000 ? '#FF4444' : totalLatency > 500 ? '#F5A623' : '#C4F042'}
            />
            <MetricCard
              label="Max Throughput"
              value={formatThroughput(maxThroughput)}
              unit="qps"
              context="before bottleneck saturates"
              color="#C4F042"
            />
            <MetricCard
              label="Bottleneck"
              value={primaryBottleneckNode?.data.label ?? '—'}
              context={
                primarySaturation > 0
                  ? `${Math.round(primarySaturation * 100)}% saturated`
                  : undefined
              }
              color={
                primarySaturation > 0.9
                  ? '#FF4444'
                  : primarySaturation > 0.7
                    ? '#F5A623'
                    : 'rgba(232,230,227,0.6)'
              }
            />
            <MetricCard
              label="Error Rate"
              value={`${errorRatePct}%`}
              context={`${criticalCount} critical node${criticalCount !== 1 ? 's' : ''}`}
              color={errorRatePct > 20 ? '#FF4444' : errorRatePct > 5 ? '#F5A623' : '#C4F042'}
            />
          </div>

          {/* Bottleneck path */}
          {bottleneckPath.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'rgba(232,230,227,0.35)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                Critical Path
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {bottleneckPath.map((nodeId, i) => {
                  const node = nodeMap.get(nodeId);
                  if (!node) return null;
                  const Icon = getComponentIcon(
                    node.data.componentId,
                    node.data.category as string,
                  );
                  const isLast = i === bottleneckPath.length - 1;
                  return (
                    <div key={nodeId} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: isLast
                            ? 'rgba(255,68,68,0.1)'
                            : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isLast ? 'rgba(255,68,68,0.3)' : 'rgba(255,255,255,0.05)'}`,
                          borderRadius: 6,
                          padding: '3px 8px',
                        }}
                      >
                        <Icon size={12} />
                        <span style={{ fontSize: 11, color: '#E8E6E3' }}>{node.data.label}</span>
                      </div>
                      {!isLast && (
                        <span style={{ color: 'rgba(232,230,227,0.3)', fontSize: 12 }}>→</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'rgba(232,230,227,0.35)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                Warnings
              </div>
              {warnings.map((w, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                    padding: '5px 8px',
                    backgroundColor: 'rgba(245,166,35,0.06)',
                    border: '1px solid rgba(245,166,35,0.15)',
                    borderRadius: 6,
                    marginBottom: 4,
                  }}
                >
                  <AlertTriangle size={11} color="#F5A623" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 11, color: '#F5A623' }}>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
