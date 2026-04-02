'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/store/interviewStore';
import { useAttemptStore, clearActiveAttempt } from '@/store/attemptStore';
import { useCanvasStore } from '@/store/canvasStore';
import { trackInterviewSubmitted } from '@/lib/interviewAnalytics';

export function useSubmitInterview() {
  const [isScoring, setIsScoring] = useState(false);
  const router = useRouter();

  const attemptId = useInterviewStore((s) => s.attemptId);
  const scenarioId = useInterviewStore((s) => s.scenarioId);
  const scenario = useInterviewStore((s) => s.scenario);
  const startedAt = useInterviewStore((s) => s.startedAt);
  const hintsRevealed = useInterviewStore((s) => s.hintsRevealed);
  const endInterview = useInterviewStore((s) => s.endInterview);
  const addAttempt = useAttemptStore((s) => s.addAttempt);

  const submit = useCallback(async () => {
    if (!attemptId || !scenarioId || !scenario || !startedAt || isScoring) return;

    setIsScoring(true);

    const { nodes, edges } = useCanvasStore.getState();
    const completedAt = Date.now();
    const duration = Math.round((completedAt - startedAt) / 1000);

    trackInterviewSubmitted(scenarioId, duration, hintsRevealed, nodes.length, edges.length);

    // Show "Scoring..." for at least 2 seconds for UX feedback
    const [scoreResult] = await Promise.all([
      // Lazy-import the scorer to keep the initial bundle small
      import('@vexo/engine')
        .then((m) => {
          if (typeof m.scoreSubmission !== 'function') return null;
          return m.scoreSubmission({ nodes, edges }, scenario, hintsRevealed) as unknown;
        })
        .catch(() => null),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);

    const attempt = {
      id: attemptId,
      scenarioId,
      canvasState: { nodes, edges },
      score: scoreResult as never,
      startedAt,
      completedAt,
      duration,
      hintsUsed: hintsRevealed,
    };

    addAttempt(attempt);
    clearActiveAttempt();
    endInterview();
    setIsScoring(false);

    router.push(`/challenges/${scenarioId}/results/${attemptId}`);
  }, [attemptId, scenarioId, scenario, startedAt, hintsRevealed, isScoring, addAttempt, endInterview, router]);

  return { submit, isScoring };
}
