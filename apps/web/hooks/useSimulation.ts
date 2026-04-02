import { useCallback } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useSimulationStore } from '@/store/simulationStore';
import { simulate } from '@vexo/engine';
import { getAllComponents } from '@vexo/cbr';
import type { CBREntry } from '@vexo/types';

// Build registry once at module load
const cbrRegistry = new Map<string, CBREntry>(getAllComponents().map((c) => [c.id, c]));

export function useSimulation() {
  const { setRunning, setEntryQPS, applyResults } = useSimulationStore();

  const runSimulation = useCallback(
    (entryQPS: number) => {
      const { nodes, edges } = useCanvasStore.getState();
      if (nodes.length === 0) return;
      setRunning(true);
      setEntryQPS(entryQPS);

      // Run synchronously but yield to allow UI to show "Running..." state first
      setTimeout(() => {
        try {
          const response = simulate(nodes, edges, entryQPS, cbrRegistry);
          applyResults({
            nodeResults: response.nodeResults,
            bottleneckPath: response.bottleneckPath,
            totalLatency: response.totalLatency,
            warnings: response.warnings,
          });
        } catch (err) {
          console.error('Simulation error:', err);
          applyResults({ nodeResults: {}, bottleneckPath: [], totalLatency: 0, warnings: [String(err)] });
        }
      }, 0);
    },
    [setRunning, setEntryQPS, applyResults],
  );

  const isRunning = useSimulationStore((s) => s.isRunning);
  const nodeResults = useSimulationStore((s) => s.nodeResults);
  const warnings = useSimulationStore((s) => s.warnings);
  return { runSimulation, isRunning, nodeResults, warnings };
}
