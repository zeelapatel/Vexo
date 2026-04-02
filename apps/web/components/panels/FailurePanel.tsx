'use client';

import { useState, useCallback } from 'react';
import { X, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FAILURE_SCENARIOS,
  simulateFailure,
  type FailureScenarioId,
  type FailureSimulationResult,
} from '@vexo/engine';
import { useCanvasStore } from '@/store/canvasStore';
import { useSimulationStore } from '@/store/simulationStore';
import { getAllComponents } from '@vexo/cbr';
import type { CBREntry } from '@vexo/types';

const cbrRegistry = new Map<string, CBREntry>(getAllComponents().map((c) => [c.id, c]));

interface FailurePanelProps {
  open: boolean;
  onClose: () => void;
}

function formatLatency(ms: number): string {
  if (ms === 0) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

export function FailurePanel({ open, onClose }: FailurePanelProps) {
  const [result, setResult] = useState<FailureSimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const entryQPS = useSimulationStore((s) => s.entryQPS) || 1000;

  const runScenario = useCallback(
    (scenarioId: FailureScenarioId) => {
      if (nodes.length === 0) return;
      setRunning(true);
      setResult(null);
      // Yield to allow UI to update before heavy computation
      setTimeout(() => {
        try {
          const r = simulateFailure(nodes, edges, scenarioId, entryQPS, cbrRegistry);
          setResult(r);
        } catch (err) {
          console.error('Failure simulation error:', err);
        } finally {
          setRunning(false);
        }
      }, 10);
    },
    [nodes, edges, entryQPS],
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 200,
            }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: 380,
              backgroundColor: '#111115',
              border: '1px solid rgba(255,255,255,0.08)',
              zIndex: 201,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                flexShrink: 0,
              }}
            >
              <Zap size={14} color="#FF4444" style={{ marginRight: 8 }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#E8E6E3' }}>
                Failure Simulation
              </span>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(232,230,227,0.4)',
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Scenarios */}
            <div style={{ padding: '12px 14px' }}>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'rgba(232,230,227,0.35)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                Select Scenario
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {FAILURE_SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => runScenario(s.id)}
                    disabled={running || nodes.length === 0}
                    style={{
                      padding: '10px 10px',
                      backgroundColor:
                        result?.scenario.id === s.id
                          ? 'rgba(255,68,68,0.08)'
                          : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${result?.scenario.id === s.id ? 'rgba(255,68,68,0.3)' : 'rgba(255,255,255,0.05)'}`,
                      borderRadius: 8,
                      cursor: running || nodes.length === 0 ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#E8E6E3' }}>{s.name}</div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'rgba(232,230,227,0.35)',
                        marginTop: 2,
                        lineHeight: 1.3,
                      }}
                    >
                      {s.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            {result && (
              <div style={{ padding: '0 14px 14px' }}>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-mono, monospace)',
                    color: 'rgba(232,230,227,0.35)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 10,
                  }}
                >
                  Impact Analysis
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'rgba(196,240,66,0.04)',
                      border: '1px solid rgba(196,240,66,0.1)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 10, color: 'rgba(232,230,227,0.35)', marginBottom: 4 }}>
                      BEFORE
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#C4F042' }}>
                      {formatLatency(result.before.totalLatency)}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(232,230,227,0.4)' }}>p99 latency</div>
                  </div>
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255,68,68,0.04)',
                      border: '1px solid rgba(255,68,68,0.1)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 10, color: 'rgba(232,230,227,0.35)', marginBottom: 4 }}>
                      AFTER
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#FF4444' }}>
                      {formatLatency(result.after.totalLatency)}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(232,230,227,0.4)' }}>p99 latency</div>
                  </div>
                </div>
                <div
                  style={{
                    padding: '8px 10px',
                    backgroundColor: 'rgba(255,68,68,0.06)',
                    border: '1px solid rgba(255,68,68,0.1)',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontSize: 11, color: '#FF4444', marginBottom: 2 }}>
                    {result.affectedNodeIds.length} component
                    {result.affectedNodeIds.length !== 1 ? 's' : ''} removed
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(232,230,227,0.5)' }}>
                    {result.degradedNodes.length} node
                    {result.degradedNodes.length !== 1 ? 's' : ''} degraded by failure
                  </div>
                </div>
              </div>
            )}

            {nodes.length === 0 && (
              <div
                style={{
                  padding: '24px 14px',
                  textAlign: 'center',
                  fontSize: 12,
                  color: 'rgba(232,230,227,0.35)',
                }}
              >
                Add nodes to the canvas first.
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
