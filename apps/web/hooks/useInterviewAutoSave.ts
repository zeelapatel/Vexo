'use client';

import { useEffect, useRef } from 'react';
import { useInterviewStore } from '@/store/interviewStore';
import { useCanvasStore } from '@/store/canvasStore';
import { saveActiveAttempt, loadActiveAttempt } from '@/store/attemptStore';

const AUTO_SAVE_INTERVAL_MS = 30_000;

/**
 * Auto-saves the active interview attempt every 30s.
 * Reads from interviewStore + canvasStore and writes to localStorage.
 */
export function useInterviewAutoSave() {
  const isActive = useInterviewStore((s) => s.isActive);
  const attemptId = useInterviewStore((s) => s.attemptId);
  const scenarioId = useInterviewStore((s) => s.scenarioId);
  const startedAt = useInterviewStore((s) => s.startedAt);
  const hintsRevealed = useInterviewStore((s) => s.hintsRevealed);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const save = () => {
      if (!attemptId || !scenarioId || !startedAt) return;
      const { nodes, edges } = useCanvasStore.getState();
      const existing = loadActiveAttempt();
      saveActiveAttempt({
        ...(existing ?? {}),
        id: attemptId,
        scenarioId,
        canvasState: { nodes, edges },
        score: null,
        startedAt,
        completedAt: null,
        duration: null,
        hintsUsed: hintsRevealed,
      });
    };

    // Save immediately when interview starts
    save();
    timerRef.current = setInterval(save, AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, attemptId, scenarioId, startedAt, hintsRevealed]);
}
