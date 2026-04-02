'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { InterviewScenario } from '@vexo/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InterviewStoreState {
  isActive: boolean;
  isPaused: boolean;
  pausesUsed: number;
  pauseStartedAt: number | null;
  pauseTimeUsedMs: number;

  attemptId: string | null;
  scenarioId: string | null;
  scenario: InterviewScenario | null;
  startedAt: number | null;
  /** Time limit in seconds */
  timeLimitSeconds: number;

  hintsRevealed: number;
  requirementsChecked: Set<number>;
}

interface InterviewStoreActions {
  startInterview: (attemptId: string, scenario: InterviewScenario) => void;
  endInterview: () => void;
  pause: () => void;
  resume: () => void;
  revealNextHint: () => void;
  toggleRequirement: (index: number) => void;
  /** Returns remaining seconds (accounting for pauses) */
  getRemainingSeconds: () => number;
}

const MAX_PAUSES = 2;
const PAUSE_DURATION_MS = 2 * 60 * 1000; // 2 minutes per pause

// ── Store ─────────────────────────────────────────────────────────────────────

export const useInterviewStore = create<InterviewStoreState & InterviewStoreActions>()(
  immer((set, get) => ({
    isActive: false,
    isPaused: false,
    pausesUsed: 0,
    pauseStartedAt: null,
    pauseTimeUsedMs: 0,
    attemptId: null,
    scenarioId: null,
    scenario: null,
    startedAt: null,
    timeLimitSeconds: 0,
    hintsRevealed: 0,
    requirementsChecked: new Set(),

    startInterview(attemptId, scenario) {
      set((state) => {
        state.isActive = true;
        state.isPaused = false;
        state.pausesUsed = 0;
        state.pauseStartedAt = null;
        state.pauseTimeUsedMs = 0;
        state.attemptId = attemptId;
        state.scenarioId = scenario.id;
        state.scenario = scenario;
        state.startedAt = Date.now();
        state.timeLimitSeconds = scenario.timeLimit * 60;
        state.hintsRevealed = 0;
        state.requirementsChecked = new Set();
      });
    },

    endInterview() {
      set((state) => {
        state.isActive = false;
        state.isPaused = false;
        state.scenario = null;
        state.attemptId = null;
        state.scenarioId = null;
        state.startedAt = null;
        state.hintsRevealed = 0;
        state.requirementsChecked = new Set();
      });
    },

    pause() {
      const { isPaused, pausesUsed } = get();
      if (isPaused || pausesUsed >= MAX_PAUSES) return;
      set((state) => {
        state.isPaused = true;
        state.pauseStartedAt = Date.now();
        state.pausesUsed += 1;
      });
    },

    resume() {
      const { isPaused, pauseStartedAt, pauseTimeUsedMs } = get();
      if (!isPaused || pauseStartedAt === null) return;
      const additional = Math.min(Date.now() - pauseStartedAt, PAUSE_DURATION_MS);
      set((state) => {
        state.isPaused = false;
        state.pauseStartedAt = null;
        state.pauseTimeUsedMs = pauseTimeUsedMs + additional;
      });
    },

    revealNextHint() {
      const { scenario, hintsRevealed } = get();
      if (!scenario) return;
      if (hintsRevealed >= scenario.hints.length) return;
      set((state) => { state.hintsRevealed += 1; });
    },

    toggleRequirement(index) {
      set((state) => {
        if (state.requirementsChecked.has(index)) {
          state.requirementsChecked.delete(index);
        } else {
          state.requirementsChecked.add(index);
        }
      });
    },

    getRemainingSeconds() {
      const { startedAt, timeLimitSeconds, pauseTimeUsedMs, isPaused, pauseStartedAt } = get();
      if (!startedAt) return 0;

      const now = Date.now();
      // If currently paused, don't advance the clock
      const effectivePauseMs = isPaused && pauseStartedAt
        ? pauseTimeUsedMs + Math.min(now - pauseStartedAt, PAUSE_DURATION_MS)
        : pauseTimeUsedMs;

      const elapsed = (now - startedAt - effectivePauseMs) / 1000;
      return Math.max(0, timeLimitSeconds - elapsed);
    },
  })),
);
