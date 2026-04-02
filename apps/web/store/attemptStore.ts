'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { VexoNode, VexoEdge } from '@vexo/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AttemptCanvasState {
  nodes: VexoNode[];
  edges: VexoEdge[];
}

export interface CategoryScore {
  key: string;
  name: string;
  score: number;
  weight: number;
  weightedScore: number;
  feedback: string;
}

export interface ScoreResult {
  totalScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  categories: CategoryScore[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  hintPenalty: number;
}

export interface Attempt {
  id: string;
  scenarioId: string;
  canvasState: AttemptCanvasState;
  score: ScoreResult | null;
  startedAt: number;
  completedAt: number | null;
  /** Duration in seconds */
  duration: number | null;
  hintsUsed: number;
}

// ── Persistence ───────────────────────────────────────────────────────────────

const ATTEMPTS_KEY = 'vexo_attempts';
const ACTIVE_ATTEMPT_KEY = 'vexo_active_attempt';
const MAX_ATTEMPTS_PER_SCENARIO = 5;

function loadAttempts(): Record<string, Attempt[]> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(ATTEMPTS_KEY) : null;
    return raw ? (JSON.parse(raw) as Record<string, Attempt[]>) : {};
  } catch {
    return {};
  }
}

function persistAttempts(attempts: Record<string, Attempt[]>) {
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch (e) {
    console.warn('[Vexo] Failed to persist attempts:', e);
  }
}

export function saveActiveAttempt(attempt: Attempt) {
  try {
    localStorage.setItem(ACTIVE_ATTEMPT_KEY, JSON.stringify(attempt));
  } catch {
    // ignore storage errors
  }
}

export function loadActiveAttempt(): Attempt | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_ATTEMPT_KEY) : null;
    return raw ? (JSON.parse(raw) as Attempt) : null;
  } catch {
    return null;
  }
}

export function clearActiveAttempt() {
  try {
    localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
  } catch {
    // ignore
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export interface AttemptStoreState {
  /** All completed attempts, keyed by scenarioId */
  attempts: Record<string, Attempt[]>;
}

export interface AttemptStoreActions {
  /** Add a completed attempt. Prunes to MAX_ATTEMPTS_PER_SCENARIO. */
  addAttempt: (attempt: Attempt) => void;
  /** Get all attempts for a scenario, newest first */
  getAttempts: (scenarioId: string) => Attempt[];
  /** Get the best (highest) score for a scenario */
  getBestScore: (scenarioId: string) => number | null;
  /** Get the best grade for a scenario */
  getBestGrade: (scenarioId: string) => ScoreResult['grade'] | null;
  /** True if the user has completed this scenario at least once */
  hasCompleted: (scenarioId: string) => boolean;
  /** Total challenges completed (at least one attempt with a score) */
  getTotalCompleted: () => number;
  /** Average score across all completed scenarios */
  getAverageScore: () => number | null;
  /** Get per-category average scores (for radar chart) */
  getCategoryAverages: () => Record<string, number>;
  /** Load from localStorage on app mount */
  initialize: () => void;
}

export const useAttemptStore = create<AttemptStoreState & AttemptStoreActions>()(
  immer((set, get) => ({
    attempts: {},

    initialize() {
      set((state) => {
        state.attempts = loadAttempts();
      });
    },

    addAttempt(attempt) {
      set((state) => {
        const existing = state.attempts[attempt.scenarioId] ?? [];
        const updated = [attempt, ...existing].slice(0, MAX_ATTEMPTS_PER_SCENARIO);
        state.attempts[attempt.scenarioId] = updated;
      });
      persistAttempts(get().attempts);
    },

    getAttempts(scenarioId) {
      return get().attempts[scenarioId] ?? [];
    },

    getBestScore(scenarioId) {
      const attempts = get().attempts[scenarioId] ?? [];
      const scores = attempts.map((a) => a.score?.totalScore).filter((s): s is number => s != null);
      return scores.length > 0 ? Math.max(...scores) : null;
    },

    getBestGrade(scenarioId) {
      const attempts = get().attempts[scenarioId] ?? [];
      const grades: ScoreResult['grade'][] = ['S', 'A', 'B', 'C', 'D', 'F'];
      const bestIdx = attempts.reduce((best, a) => {
        if (!a.score) return best;
        const idx = grades.indexOf(a.score.grade);
        return idx < best ? idx : best;
      }, grades.length - 1);
      if (bestIdx === grades.length - 1 && !attempts.some((a) => a.score)) return null;
      return grades[bestIdx] ?? null;
    },

    hasCompleted(scenarioId) {
      return (get().attempts[scenarioId] ?? []).some((a) => a.score !== null);
    },

    getTotalCompleted() {
      return Object.values(get().attempts).filter((list) => list.some((a) => a.score !== null)).length;
    },

    getAverageScore() {
      const allScores = Object.values(get().attempts)
        .flat()
        .map((a) => a.score?.totalScore)
        .filter((s): s is number => s != null);
      if (allScores.length === 0) return null;
      return Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    },

    getCategoryAverages() {
      const all = Object.values(get().attempts)
        .flat()
        .filter((a) => a.score !== null)
        .map((a) => a.score!.categories);

      if (all.length === 0) return {};

      const sums: Record<string, number> = {};
      const counts: Record<string, number> = {};
      for (const cats of all) {
        for (const cat of cats) {
          sums[cat.key] = (sums[cat.key] ?? 0) + cat.score;
          counts[cat.key] = (counts[cat.key] ?? 0) + 1;
        }
      }
      return Object.fromEntries(
        Object.entries(sums).map(([k, v]) => [k, Math.round(v / (counts[k] ?? 1))]),
      );
    },
  })),
);
