import type { VexoNode, InterviewScenario } from '@vexo/types';
import type { ScoreResult } from '@/store/attemptStore';

export type ImprovementPriority = 'high' | 'medium' | 'low';

export interface Improvement {
  priority: ImprovementPriority;
  title: string;
  description: string;
  componentsToAdd: string[];
}

/**
 * Generates up to 5 prioritised improvement suggestions by comparing
 * the user's canvas against the reference solution.
 */
export function generateImprovements(
  userNodes: VexoNode[],
  referenceNodes: VexoNode[],
  score: ScoreResult,
  _scenario: InterviewScenario,
): Improvement[] {
  const userIds = new Set(userNodes.map((n) => n.data.componentId));
  const refIds = new Set(referenceNodes.map((n) => n.data.componentId));

  const missingIds = [...refIds].filter((id) => !userIds.has(id));
  const missingNodes = referenceNodes.filter((n) => missingIds.includes(n.data.componentId));

  const improvements: Improvement[] = [];

  // Priority: critical infrastructure (LB, DB) = high
  for (const missing of missingNodes) {
    const id = missing.data.componentId;
    const label = missing.data.label;

    let priority: ImprovementPriority = 'low';
    let title = `Add ${label}`;
    let description = `The reference solution includes ${label}, which is missing from your design.`;

    if (id.includes('load_balancer') || id.includes('api_gateway')) {
      priority = 'high';
      title = `Add ${label} for traffic distribution`;
      description = `Without a load balancer, your design has a single point of failure and cannot scale horizontally.`;
    } else if (id.includes('postgresql') || id.includes('mongodb') || id.includes('mysql')) {
      priority = 'high';
      title = `Add persistent storage (${label})`;
      description = `Your design is missing a persistent data store. Data written to in-memory stores is lost on restart.`;
    } else if (id.includes('redis') || id.includes('cache')) {
      priority = 'medium';
      title = `Add a caching layer (${label})`;
      description = `The reference solution uses caching to reduce database load and improve read latency. Without it, all reads hit the primary DB.`;
    } else if (id.includes('kafka') || id.includes('message_queue') || id.includes('rabbitmq')) {
      priority = 'medium';
      title = `Add async messaging (${label})`;
      description = `Decoupling producers and consumers with a message queue improves resilience and allows independent scaling.`;
    } else if (id.includes('cdn')) {
      priority = 'low';
      title = 'Add CDN for edge caching';
      description = 'A CDN serves static content from the edge, reducing latency for global users and offloading origin traffic.';
    }

    improvements.push({ priority, title, description, componentsToAdd: [id] });
  }

  // Add a positive reinforcement if the score is not terrible
  if (score.totalScore >= 50) {
    const matchCount = [...refIds].filter((id) => userIds.has(id)).length;
    improvements.unshift({
      priority: 'low',
      title: '✓ Good foundation',
      description: `You correctly included ${matchCount} of the ${refIds.size} reference components. Focus on the missing pieces above.`,
      componentsToAdd: [],
    });
  }

  // Sort: high → medium → low, cap at 5
  improvements.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return improvements.slice(0, 5);
}
