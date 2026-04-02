export type Grade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface CriterionResult {
  id: string;
  description: string;
  score: number;
  maxPoints: number;
  feedback: string;
}

export interface CategoryScore {
  key: string;
  name: string;
  /** Raw score 0–100 */
  score: number;
  weight: number;
  /** score × weight */
  weightedScore: number;
  feedback: string;
  criteriaResults: CriterionResult[];
}

export interface ScoreResult {
  totalScore: number;
  grade: Grade;
  categories: CategoryScore[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  /** Points deducted for hints used (5 per hint, max 25) */
  hintPenalty: number;
}

export function scoreToGrade(score: number): Grade {
  if (score >= 95) return 'S';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}
