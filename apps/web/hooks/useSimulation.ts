'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useSimulationStore } from '@/store/simulationStore';

export function useSimulation() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL('../../../packages/engine/src/worker.ts', import.meta.url),
    );
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === 'result') {
        useSimulationStore.getState().applyResults({
          nodeResults: msg.nodeResults,
          bottleneckPath: msg.bottleneckPath,
          totalLatency: msg.totalLatency,
          warnings: msg.warnings,
        });
      } else if (msg.type === 'error') {
        useSimulationStore.getState().applyResults({
          nodeResults: {},
          bottleneckPath: [],
          totalLatency: 0,
          warnings: [msg.message],
        });
      }
    };

    worker.onerror = (err) => {
      console.error('[Vexo] Worker error:', err);
      useSimulationStore.getState().setRunning(false);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const runSimulation = useCallback((entryQPS: number) => {
    const { nodes, edges } = useCanvasStore.getState();
    if (nodes.length === 0) return;
    useSimulationStore.getState().setRunning(true);
    useSimulationStore.getState().setEntryQPS(entryQPS);
    workerRef.current?.postMessage({ type: 'simulate', nodes, edges, entryQPS });
  }, []);

  const isRunning = useSimulationStore((s) => s.isRunning);
  const nodeResults = useSimulationStore((s) => s.nodeResults);
  const warnings = useSimulationStore((s) => s.warnings);

  return { runSimulation, isRunning, nodeResults, warnings };
}
