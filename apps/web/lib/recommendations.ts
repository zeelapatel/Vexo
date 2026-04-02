import type { InterviewScenario, Difficulty } from '@vexo/types';
import { getAllScenarios } from '@vexo/cbr';
import type { AttemptStoreState, AttemptStoreActions } from '@/store/attemptStore';

const DIFFICULTY_ORDER: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export interface Recommendation {
  scenario: InterviewScenario;
  reason: string;
}

type AttemptStoreAccessor = Pick<AttemptStoreState & AttemptStoreActions, 'getCategoryAverages' | 'hasCompleted' | 'getBestScore'>;

/**
 * Returns up to 3 recommended scenarios based on the user's weakest rubric
 * category from their completed attempts.
 * Falls back to popular beginner scenarios for users with no history.
 */
export function getNextRecommendations(store: AttemptStoreAccessor): Recommendation[] {
  const averages = store.getCategoryAverages();
  const all = getAllScenarios();

  // Cold start — no history
  if (Object.keys(averages).length === 0) {
    return all
      .filter((s) => s.difficulty === 'beginner')
      .slice(0, 3)
      .map((s) => ({ scenario: s, reason: 'Great starting point for system design fundamentals.' }));
  }

  // Find weakest rubric category
  const weakestKey = Object.entries(averages).sort((a, b) => a[1] - b[1])[0]?.[0] ?? 'scalability';
  const weakestScore = averages[weakestKey] ?? 100;

  const categoryLabels: Record<string, string> = {
    completeness: 'completeness',
    scalability: 'scalability',
    availability: 'high availability',
    data_model: 'data model design',
    tradeoffs: 'trade-off awareness',
  };
  const label = categoryLabels[weakestKey] ?? weakestKey;

  // Find scenarios that heavily test the weak category — use category heuristics
  const CATEGORY_RUBRIC_MAP: Record<string, string[]> = {
    scalability: ['streaming', 'e-commerce', 'social'],
    availability: ['infrastructure', 'databases'],
    data_model: ['databases', 'caching', 'search'],
    completeness: ['messaging', 'real-time'],
    tradeoffs: ['infrastructure', 'social', 'e-commerce'],
  };
  const targetCategories = CATEGORY_RUBRIC_MAP[weakestKey] ?? [];

  // Get user's current highest difficulty with a B or better
  const completedScores = all
    .filter((s) => store.hasCompleted(s.id))
    .map((s) => ({ s, score: store.getBestScore(s.id) ?? 0 }))
    .filter((x) => x.score >= 70);

  const highestDifficulty: Difficulty = completedScores.reduce(
    (best, { s }) => {
      const idx = DIFFICULTY_ORDER.indexOf(s.difficulty);
      return idx > DIFFICULTY_ORDER.indexOf(best) ? s.difficulty : best;
    },
    'beginner' as Difficulty,
  );

  // Target one difficulty level above current
  const targetDiffIdx = Math.min(
    DIFFICULTY_ORDER.indexOf(highestDifficulty) + 1,
    DIFFICULTY_ORDER.length - 1,
  );
  const targetDiff = DIFFICULTY_ORDER[targetDiffIdx];

  // Filter: not completed, matches weak category, at or near target difficulty
  const candidates = all.filter(
    (s) =>
      !store.hasCompleted(s.id) &&
      (targetCategories.includes(s.category) || s.difficulty === targetDiff),
  );

  // Sort: prefer target difficulty, then by category match
  candidates.sort((a, b) => {
    const aMatch = targetCategories.includes(a.category) ? 0 : 1;
    const bMatch = targetCategories.includes(b.category) ? 0 : 1;
    const aDiff = Math.abs(DIFFICULTY_ORDER.indexOf(a.difficulty) - targetDiffIdx);
    const bDiff = Math.abs(DIFFICULTY_ORDER.indexOf(b.difficulty) - targetDiffIdx);
    return aMatch + aDiff - (bMatch + bDiff);
  });

  const top3 = candidates.slice(0, 3);
  if (top3.length === 0) {
    // Fallback to any uncompleted scenario
    return all
      .filter((s) => !store.hasCompleted(s.id))
      .slice(0, 3)
      .map((s) => ({ scenario: s, reason: 'Keep practising to improve your overall score.' }));
  }

  const reasonSuffix =
    weakestScore < 50
      ? `Your ${label} scores average ${weakestScore}% — this challenge will help significantly.`
      : `Your ${label} scores average ${weakestScore}% — good area to strengthen.`;

  return top3.map((s) => ({ scenario: s, reason: reasonSuffix }));
}
