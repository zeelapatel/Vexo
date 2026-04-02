import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { NodeSimResult } from '@vexo/engine';

interface SimulationState {
  isRunning: boolean;
  entryQPS: number;
  nodeResults: Record<string, NodeSimResult>;
  bottleneckPath: string[];
  totalLatency: number;
  warnings: string[];
}

interface SimulationActions {
  setRunning: (running: boolean) => void;
  setEntryQPS: (qps: number) => void;
  applyResults: (results: Omit<SimulationState, 'isRunning' | 'entryQPS'>) => void;
  reset: () => void;
}

export type SimulationStore = SimulationState & SimulationActions;

// Returns true only for the terminal bottleneck node. Stable boolean avoids
// re-rendering the full bottleneck path array into every node.
export const selectIsBottleneck = (nodeId: string) => (s: SimulationStore) =>
  s.bottleneckPath.length > 0 &&
  s.bottleneckPath[s.bottleneckPath.length - 1] === nodeId &&
  s.bottleneckPath.includes(nodeId);

export const useSimulationStore = create<SimulationStore>()(
  immer((set) => ({
    isRunning: false,
    entryQPS: 0,
    nodeResults: {},
    bottleneckPath: [],
    totalLatency: 0,
    warnings: [],

    setRunning: (running) =>
      set((s) => {
        s.isRunning = running;
      }),
    setEntryQPS: (qps) =>
      set((s) => {
        s.entryQPS = qps;
      }),
    applyResults: (results) =>
      set((s) => {
        s.nodeResults = results.nodeResults;
        s.bottleneckPath = results.bottleneckPath;
        s.totalLatency = results.totalLatency;
        s.warnings = results.warnings;
        s.isRunning = false;
      }),
    reset: () =>
      set((s) => {
        s.isRunning = false;
        s.nodeResults = {};
        s.bottleneckPath = [];
        s.totalLatency = 0;
        s.warnings = [];
      }),
  })),
);
