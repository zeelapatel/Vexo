import type { VexoNode, VexoEdge, InterviewScenario, CBREntry } from '@vexo/types';
import { ComponentCategory } from '@vexo/types';
import type { CategoryScore } from './types';
import { simulateFailure } from '../failureSimulator';

/**
 * Evaluates whether the design is resilient to common failures.
 * Runs failure injection scenarios and checks for SPOFs and HA patterns.
 */
export function evaluateAvailability(
  nodes: VexoNode[],
  edges: VexoEdge[],
  scenario: InterviewScenario,
  cbrRegistry: Map<string, CBREntry>,
): CategoryScore {
  const weight = scenario.rubric.categories.find((c) => c.key === 'availability')?.weight ?? 0.2;

  if (nodes.length === 0) {
    return buildCategory(weight, 0, 'Empty canvas — no HA analysis possible.', [], ['Add components to evaluate availability.']);
  }

  let score = 50;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // ── Pattern checks (static analysis) ────────────────────────────────────

  const computeNodes = nodes.filter((n) => n.data.category === ComponentCategory.Compute);
  const dbNodes = nodes.filter((n) => n.data.category === ComponentCategory.Database);
  const lbNodes = nodes.filter((n) =>
    n.data.componentId.includes('load_balancer') || n.data.componentId.includes('api_gateway'),
  );
  const queueNodes = nodes.filter((n) => n.data.category === ComponentCategory.Messaging);
  const cacheNodes = nodes.filter((n) =>
    n.data.componentId.includes('redis') || n.data.componentId.includes('cache'),
  );

  // Multiple compute instances
  if (computeNodes.length >= 2) {
    score += 10;
    strengths.push('Multiple compute instances reduce SPOF risk.');
  } else if (computeNodes.length === 1) {
    weaknesses.push('Single compute instance is a SPOF — add a replica behind a load balancer.');
    score -= 5;
  }

  // Load balancer present
  if (lbNodes.length > 0) {
    score += 10;
    strengths.push('Load balancer enables instance-level failover.');
  }

  // Database redundancy
  const hasDbReplica = edges.some((e) => e.data?.connectionType === 'DB_REPLICATION');
  if (hasDbReplica) {
    score += 15;
    strengths.push('Database replication edge detected — failover is possible.');
  } else if (dbNodes.length === 1) {
    weaknesses.push('Single database with no replication is a SPOF. Add a replica.');
    score -= 10;
  }

  // Cache redundancy (failure injection)
  if (cacheNodes.length > 0) {
    const hasCacheReplica = nodes.filter((n) => n.data.componentId.includes('redis')).length >= 2;
    if (hasCacheReplica) {
      score += 5;
      strengths.push('Multiple cache nodes provide redundancy.');
    }
  }

  // Queue DLQ presence (heuristic: multiple queue nodes suggests DLQ)
  if (queueNodes.length >= 2) {
    score += 5;
    strengths.push('Multiple message queues suggest DLQ pattern for failed message handling.');
  } else if (queueNodes.length === 1) {
    weaknesses.push('Single queue without a DLQ means failed messages may be lost permanently.');
  }

  // ── Failure simulation ────────────────────────────────────────────────────

  const entryQPS = 1000; // Use a modest QPS for failure tests

  try {
    const dbFailure = simulateFailure(nodes, edges, 'kill_primary_db', entryQPS, cbrRegistry);
    const afterDbSaturation = getMaxSaturation(dbFailure.after.nodeResults);
    if (afterDbSaturation > 0.95) {
      score -= 15;
      weaknesses.push('When the primary database fails, the remaining system hits critical saturation — no graceful degradation.');
    } else if (dbFailure.after.bottleneckPath.length === 0 && nodes.filter(n => n.data.category === ComponentCategory.Database).length > 0) {
      score -= 10;
      weaknesses.push('Database failure disconnects the graph entirely — the system has no path forward.');
    } else {
      score += 5;
      strengths.push('System continues to function after primary database failure.');
    }
  } catch {
    // ignore simulation errors in failure test
  }

  try {
    const cacheFailure = simulateFailure(nodes, edges, 'kill_cache', entryQPS, cbrRegistry);
    const afterCacheSaturation = getMaxSaturation(cacheFailure.after.nodeResults);
    if (afterCacheSaturation > 0.95) {
      score -= 10;
      weaknesses.push('Cache failure causes critical overload on backend services — missing cache fallback strategy.');
    } else {
      strengths.push('System degrades gracefully on cache failure.');
    }
  } catch {
    // ignore
  }

  const finalScore = Math.max(0, Math.min(100, score));

  return buildCategory(
    weight,
    finalScore,
    finalScore >= 70 ? 'Design demonstrates good HA patterns.' : 'Design has SPOF risks — add redundancy.',
    strengths,
    weaknesses,
  );
}

function getMaxSaturation(nodeResults: Record<string, { saturation: number }>): number {
  return Math.max(0, ...Object.values(nodeResults).map((r) => r.saturation));
}

function buildCategory(
  weight: number,
  score: number,
  feedback: string,
  strengths: string[],
  weaknesses: string[],
): CategoryScore {
  return {
    key: 'availability',
    name: 'High Availability',
    score,
    weight,
    weightedScore: Math.round(score * weight),
    feedback,
    criteriaResults: [{
      id: 'spof',
      description: 'No single points of failure on critical path',
      score,
      maxPoints: 100,
      feedback: [...strengths, ...weaknesses].join(' '),
    }],
  };
}
