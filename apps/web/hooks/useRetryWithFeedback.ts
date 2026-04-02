'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAttemptStore } from '@/store/attemptStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useDesignStore } from '@/store/designStore';
import { getScenarioById } from '@vexo/cbr';

/**
 * Creates a new attempt pre-loaded with the previous attempt's canvas state.
 * Navigates to the canvas in interview mode.
 */
export function useRetryWithFeedback() {
  const router = useRouter();
  const createDesign = useDesignStore((s) => s.createDesign);
  const setActiveDesign = useCanvasStore((s) => s.setActiveDesign);
  const initialize = useAttemptStore((s) => s.initialize);
  const getAttempts = useAttemptStore((s) => s.getAttempts);

  const retry = useCallback((scenarioId: string) => {
    initialize();
    const scenario = getScenarioById(scenarioId);
    if (!scenario) return;

    const attempts = getAttempts(scenarioId);
    const previousAttempt = attempts[0]; // most recent

    // Use previous canvas state if available, otherwise starter canvas
    const startNodes = previousAttempt?.canvasState.nodes ?? scenario.starterCanvas.nodes;
    const startEdges = previousAttempt?.canvasState.edges ?? scenario.starterCanvas.edges;

    const newDesignId = createDesign();
    setActiveDesign(newDesignId, startNodes, startEdges);

    const newAttemptId = `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newAttempt = {
      id: newAttemptId,
      scenarioId,
      canvasState: { nodes: startNodes, edges: startEdges },
      score: null,
      startedAt: Date.now(),
      completedAt: null,
      duration: null,
      hintsUsed: 0,
    };

    try {
      localStorage.setItem('vexo_active_attempt', JSON.stringify(newAttempt));
    } catch { /* ignore */ }

    router.push('/canvas');
  }, [router, createDesign, setActiveDesign, initialize, getAttempts]);

  return { retry };
}
