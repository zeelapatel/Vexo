import type { VexoNode, VexoEdge, InterviewScenario, CBREntry } from '@vexo/types';
import type { ScoreResult, Grade } from './types';
import { scoreToGrade } from './types';
import { evaluateCompleteness } from './completeness';
import { evaluateScalability } from './scalability';
import { evaluateAvailability } from './availability';
import { evaluateDataModel } from './dataModel';
import { evaluateTradeoffs } from './tradeoffs';

export interface ScoreInput {
  nodes: VexoNode[];
  edges: VexoEdge[];
}

/**
 * Score a submission against a scenario rubric.
 * Orchestrates all 5 evaluators and applies hint penalty.
 */
export function scoreSubmission(
  canvas: ScoreInput,
  scenario: InterviewScenario,
  hintsUsed: number = 0,
): ScoreResult {
  const { nodes, edges } = canvas;

  // Build CBR registry lazily — importing here avoids circular deps
  const cbrRegistry = buildCBRRegistry();

  const categories = [
    evaluateCompleteness(nodes, edges, scenario),
    evaluateScalability(nodes, edges, scenario, cbrRegistry),
    evaluateAvailability(nodes, edges, scenario, cbrRegistry),
    evaluateDataModel(nodes, edges, scenario),
    evaluateTradeoffs(nodes, edges, scenario),
  ];

  // Weighted sum
  const rawTotal = categories.reduce((sum, cat) => sum + cat.weightedScore, 0);

  // Hint penalty: -5 per hint, max -25
  const hintPenalty = Math.min(hintsUsed * 5, 25);
  const totalScore = Math.max(0, Math.round(rawTotal - hintPenalty));
  const grade: Grade = scoreToGrade(totalScore);

  // Aggregate strengths + weaknesses from all categories
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  for (const cat of categories) {
    for (const criterion of cat.criteriaResults) {
      // Parse feedback into strengths/weaknesses heuristically
      const sentences = criterion.feedback.split('. ').filter(Boolean);
      for (const sentence of sentences) {
        const lc = sentence.toLowerCase();
        if (lc.includes('good') || lc.includes('well') || lc.includes('correct') || lc.includes('appropriate') ||
            lc.includes('excellent') || lc.includes('detected') || lc.includes('enables') || lc.includes('demonstrates')) {
          strengths.push(sentence.trim());
        } else if (lc.includes('missing') || lc.includes('no ') || lc.includes('single') || lc.includes('overload') ||
                   lc.includes('bottleneck') || lc.includes('spof') || lc.includes('under-') || lc.includes('over-')) {
          weaknesses.push(sentence.trim());
        } else if (lc.includes('consider') || lc.includes('add') || lc.includes('ensure') || lc.includes('review')) {
          suggestions.push(sentence.trim());
        }
      }
    }
  }

  return {
    totalScore,
    grade,
    categories,
    strengths: dedup(strengths).slice(0, 5),
    weaknesses: dedup(weaknesses).slice(0, 5),
    suggestions: dedup(suggestions).slice(0, 3),
    hintPenalty,
  };
}

function dedup(arr: string[]): string[] {
  return [...new Set(arr)];
}

let _cbrRegistry: Map<string, CBREntry> | null = null;

function buildCBRRegistry(): Map<string, CBREntry> {
  if (_cbrRegistry) return _cbrRegistry;
  try {
    // Dynamic require to avoid circular dependency issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAllComponents } = require('@vexo/cbr');
    _cbrRegistry = new Map(
      (getAllComponents() as CBREntry[]).map((c) => [c.id, c]),
    );
  } catch {
    _cbrRegistry = new Map();
  }
  return _cbrRegistry!;
}
