import type { VexoNode, VexoEdge, InterviewScenario } from '@vexo/types';
import type { CategoryScore } from './types';

const DIFFICULTY_COMPONENT_RANGES: Record<string, { min: number; max: number }> = {
  beginner: { min: 3, max: 12 },
  intermediate: { min: 5, max: 18 },
  advanced: { min: 8, max: 28 },
  expert: { min: 10, max: 32 },
};

/**
 * Evaluates trade-off awareness — appropriate complexity, pattern consistency, cost awareness.
 */
export function evaluateTradeoffs(
  nodes: VexoNode[],
  edges: VexoEdge[],
  scenario: InterviewScenario,
): CategoryScore {
  const weight = scenario.rubric.categories.find((c) => c.key === 'tradeoffs')?.weight ?? 0.15;

  if (nodes.length === 0) {
    return buildCategory(weight, 0, 'Empty canvas.', [], ['Add components to demonstrate trade-off awareness.']);
  }

  let score = 60;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  const range = DIFFICULTY_COMPONENT_RANGES[scenario.difficulty] ?? { min: 3, max: 20 };
  const nodeCount = nodes.length;

  // ── Complexity check ───────────────────────────────────────────────────────

  if (nodeCount < range.min) {
    const deficit = range.min - nodeCount;
    score -= deficit * 5;
    weaknesses.push(
      `Under-engineered: only ${nodeCount} components for a ${scenario.difficulty} challenge. Expected at least ${range.min}.`,
    );
  } else if (nodeCount > range.max) {
    const excess = nodeCount - range.max;
    score -= Math.min(excess * 3, 20);
    weaknesses.push(
      `Over-engineered: ${nodeCount} components for a ${scenario.difficulty} challenge. Aim for under ${range.max} components — simpler is more maintainable.`,
    );
  } else {
    score += 10;
    strengths.push(`Complexity is appropriate for a ${scenario.difficulty} challenge (${nodeCount} components).`);
  }

  // ── Pattern consistency ────────────────────────────────────────────────────

  const syncEdges = edges.filter((e) => ['SYNC_HTTP', 'SYNC_GRPC'].includes(e.data?.connectionType ?? '')).length;
  const asyncEdges = edges.filter((e) => ['ASYNC_QUEUE', 'ASYNC_STREAM'].includes(e.data?.connectionType ?? '')).length;
  const totalEdges = edges.length;

  if (totalEdges === 0) {
    weaknesses.push('No connections between components — a disconnected design cannot function.');
    score -= 20;
  } else {
    // Mixed sync/async is fine — but a heavy async design with no queues is inconsistent
    if (asyncEdges > 0 && asyncEdges < totalEdges * 0.1 && totalEdges > 5) {
      weaknesses.push('Inconsistent async usage: a few async connections mixed into an otherwise synchronous design. Be intentional about where async adds value.');
      score -= 5;
    }
    if (syncEdges > 0 && asyncEdges > 0) {
      strengths.push('Intentional mix of synchronous and asynchronous communication patterns.');
    }
  }

  // ── Edges-to-nodes ratio (connectivity) ──────────────────────────────────

  const connectivity = totalEdges / Math.max(nodeCount, 1);
  if (connectivity < 0.5 && nodeCount > 3) {
    weaknesses.push('Many components appear disconnected. Ensure all components are connected to the request flow.');
    score -= 10;
  } else if (connectivity >= 1.0) {
    strengths.push('Well-connected architecture — components are meaningfully linked.');
    score += 5;
  }

  // ── Clear separation of concerns ─────────────────────────────────────────

  const categories = new Set(nodes.map((n) => n.data.category));
  if (categories.size >= 3) {
    strengths.push('Good separation of concerns across component categories.');
    score += 5;
  }

  const finalScore = Math.max(0, Math.min(100, score));

  return buildCategory(
    weight,
    finalScore,
    finalScore >= 70 ? 'Good trade-off awareness and appropriate complexity.' : 'Review complexity and pattern consistency.',
    strengths,
    weaknesses,
  );
}

function buildCategory(
  weight: number,
  score: number,
  feedback: string,
  strengths: string[],
  weaknesses: string[],
): CategoryScore {
  return {
    key: 'tradeoffs',
    name: 'Trade-off Awareness',
    score,
    weight,
    weightedScore: Math.round(score * weight),
    feedback,
    criteriaResults: [{
      id: 'complexity',
      description: 'Design complexity is appropriate for the problem scope',
      score,
      maxPoints: 100,
      feedback: [...strengths, ...weaknesses].join(' '),
    }],
  };
}
