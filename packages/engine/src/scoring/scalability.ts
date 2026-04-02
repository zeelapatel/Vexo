import type { VexoNode, VexoEdge, InterviewScenario, CBREntry } from '@vexo/types';
import { ComponentCategory } from '@vexo/types';
import type { CategoryScore } from './types';
import { simulate } from '../simulate';

/**
 * Evaluates whether the design can handle the NFR scale targets.
 * Runs the simulation engine at the target QPS and checks for bottlenecks.
 */
export function evaluateScalability(
  nodes: VexoNode[],
  edges: VexoEdge[],
  scenario: InterviewScenario,
  cbrRegistry: Map<string, CBREntry>,
): CategoryScore {
  const weight = scenario.rubric.categories.find((c) => c.key === 'scalability')?.weight ?? 0.25;

  if (nodes.length === 0) {
    return buildCategory(weight, 0, 'Empty canvas — no components to simulate against NFR targets.', [], [
      'Add components to start designing for scale.',
    ]);
  }

  const targetQPS = extractTargetQPS(scenario.nonFunctionalRequirements);
  const hasLoadBalancer = nodes.some((n) => n.data.category === ComponentCategory.Networking &&
    (n.data.componentId.includes('load_balancer') || n.data.componentId.includes('api_gateway')));
  const hasCache = nodes.some((n) => n.data.componentId.includes('redis') || n.data.componentId.includes('cache'));
  const hasQueue = nodes.some((n) => n.data.category === ComponentCategory.Messaging);
  const hasCDN = nodes.some((n) => n.data.componentId.includes('cdn'));
  const replicaCandidates = nodes.filter((n) =>
    [ComponentCategory.Compute, ComponentCategory.Database].includes(n.data.category),
  );
  const hasMultipleReplicas = replicaCandidates.length >= 2;

  let score = 50; // baseline
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  // Pattern bonuses
  if (hasLoadBalancer) { score += 10; strengths.push('Load balancer distributes traffic across instances.'); }
  if (hasCache) { score += 15; strengths.push('Caching layer reduces database load.'); }
  if (hasQueue) { score += 10; strengths.push('Async queue decouples write-heavy paths.'); }
  if (hasCDN) { score += 5; strengths.push('CDN offloads static content at the edge.'); }
  if (hasMultipleReplicas) { score += 10; strengths.push('Multiple compute/database instances support horizontal scale.'); }

  // Run simulation if we have a QPS target
  if (targetQPS > 0) {
    try {
      const result = simulate(nodes, edges, targetQPS, cbrRegistry);
      const bottleneckId = result.bottleneckPath[result.bottleneckPath.length - 1];
      const bottleneckSaturation = bottleneckId
        ? (result.nodeResults[bottleneckId]?.saturation ?? 0)
        : 0;

      if (bottleneckSaturation > 0.95) {
        score -= 20;
        const bottleneckNode = nodes.find((n) => n.id === bottleneckId);
        weaknesses.push(
          `At ${formatQPS(targetQPS)}, ${bottleneckNode?.data.label ?? bottleneckId ?? 'bottleneck'} reaches ${Math.round(bottleneckSaturation * 100)}% saturation — critical bottleneck.`,
        );
        suggestions.push(
          `Consider adding replicas, caching, or async decoupling before ${bottleneckNode?.data.label ?? 'the bottleneck'}.`,
        );
      } else if (bottleneckSaturation > 0.8) {
        score -= 10;
        weaknesses.push(`At ${formatQPS(targetQPS)}, the system is near capacity. Consider adding headroom.`);
      } else if (bottleneckSaturation < 0.6) {
        score += 5;
        strengths.push(`Design handles ${formatQPS(targetQPS)} with comfortable headroom.`);
      }
    } catch {
      // Simulation failed (e.g., disconnected graph) — apply penalty
      score -= 15;
      weaknesses.push('Graph is disconnected or has no valid entry point — simulation could not run.');
    }
  } else {
    suggestions.push('NFR targets did not include a parseable QPS number — scoring based on architecture patterns only.');
  }

  const finalScore = Math.max(0, Math.min(100, score));

  return buildCategory(weight, finalScore, '', strengths, weaknesses.concat(suggestions));
}

/** Extracts the largest QPS-equivalent number from NFR strings. */
function extractTargetQPS(nfrs: string[]): number {
  let best = 0;
  const patterns = [
    /(\d[\d,]*)\s*req(?:uest)?s?\s*\/?\s*s(?:ec(?:ond)?)?/i,
    /(\d[\d,]*)\s*rps/i,
    /(\d[\d,]*)\s*(?:concurrent|active)\s*(?:user|connection)/i,
    /(\d[\d,]*)\s*(?:K|M)\s*(?:req|rps|qps)/i,
  ];
  for (const nfr of nfrs) {
    for (const pattern of patterns) {
      const match = nfr.match(pattern);
      if (match?.[1]) {
        const raw = match[1].replace(/,/g, '');
        let value = parseInt(raw, 10);
        if (/\bK\b/i.test(nfr)) value *= 1000;
        if (/\bM\b/i.test(nfr)) value *= 1_000_000;
        if (value > best) best = value;
      }
    }
    // Also detect "100K" style
    const kMatch = nfr.match(/(\d+)K\s*(?:req|rps|qps|concurrent)/i);
    if (kMatch?.[1] && parseInt(kMatch[1]) * 1000 > best) best = parseInt(kMatch[1]) * 1000;
    const mMatch = nfr.match(/(\d+)M\s*(?:req|rps|qps|concurrent|DAU)/i);
    if (mMatch?.[1] && parseInt(mMatch[1]) * 1_000_000 > best) best = parseInt(mMatch[1]) * 1_000_000;
  }
  // Cap at 1M for simulation sanity
  return Math.min(best, 1_000_000);
}

function formatQPS(qps: number): string {
  if (qps >= 1_000_000) return `${qps / 1_000_000}M req/s`;
  if (qps >= 1_000) return `${qps / 1_000}K req/s`;
  return `${qps} req/s`;
}

function buildCategory(
  weight: number,
  score: number,
  feedback: string,
  strengths: string[],
  suggestions: string[],
): CategoryScore {
  return {
    key: 'scalability',
    name: 'Scalability',
    score,
    weight,
    weightedScore: Math.round(score * weight),
    feedback: feedback || (score >= 70
      ? 'Design demonstrates good scalability patterns.'
      : 'Design may struggle at the target scale — review bottlenecks.'),
    criteriaResults: [{
      id: 'nfr_load',
      description: 'Handles NFR target load without critical bottlenecks',
      score,
      maxPoints: 100,
      feedback: [...strengths, ...suggestions].join(' '),
    }],
  };
}
