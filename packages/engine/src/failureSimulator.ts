import type { VexoNode, VexoEdge, CBREntry } from '@vexo/types';
import { ComponentCategory } from '@vexo/types';
import type { SimulationResponse } from './protocol';
import { simulate } from './simulate';

export type FailureScenarioId =
  | 'kill_primary_db'
  | 'kill_cache'
  | 'az_failure'
  | 'network_partition'
  | 'dns_failure'
  | 'auth_outage'
  | 'queue_failure'
  | 'lb_failure';

export interface FailureScenario {
  id: FailureScenarioId;
  name: string;
  description: string;
  icon: string;
}

export const FAILURE_SCENARIOS: FailureScenario[] = [
  {
    id: 'kill_primary_db',
    name: 'Kill Primary Database',
    description: 'Remove all database nodes and observe cascading failures',
    icon: '💀',
  },
  {
    id: 'kill_cache',
    name: 'Cache Layer Failure',
    description: 'Remove all cache nodes — all traffic hits origin',
    icon: '🔥',
  },
  {
    id: 'az_failure',
    name: 'Availability Zone Failure',
    description: 'Simulate loss of 1 AZ (remove ~33% of nodes)',
    icon: '⚡',
  },
  {
    id: 'network_partition',
    name: 'Network Partition',
    description: 'Disconnect downstream half of the graph',
    icon: '✂️',
  },
  {
    id: 'dns_failure',
    name: 'DNS Failure',
    description: 'Remove DNS resolver nodes',
    icon: '🌐',
  },
  {
    id: 'auth_outage',
    name: 'Auth Service Outage',
    description: 'Remove all auth/security nodes',
    icon: '🔒',
  },
  {
    id: 'queue_failure',
    name: 'Message Queue Failure',
    description: 'Remove all messaging/queue nodes',
    icon: '📨',
  },
  {
    id: 'lb_failure',
    name: 'Load Balancer Failure',
    description: 'Remove all load balancer nodes',
    icon: '⚖️',
  },
];

function getAffectedNodeIds(
  scenario: FailureScenarioId,
  nodes: VexoNode[],
  _edges: VexoEdge[],
): string[] {
  switch (scenario) {
    case 'kill_primary_db':
      return nodes
        .filter((n) => n.data.category === ComponentCategory.Database)
        .map((n) => n.id);
    case 'kill_cache':
      return nodes
        .filter(
          (n) =>
            n.data.componentId.includes('cache') || n.data.componentId.includes('redis'),
        )
        .map((n) => n.id);
    case 'az_failure': {
      // Remove every 3rd node (simulate 1 of 3 AZs failing)
      return nodes.filter((_, i) => i % 3 === 0).map((n) => n.id);
    }
    case 'network_partition': {
      const half = Math.floor(nodes.length / 2);
      return nodes.slice(half).map((n) => n.id);
    }
    case 'dns_failure':
      return nodes
        .filter((n) => n.data.componentId.includes('dns'))
        .map((n) => n.id);
    case 'auth_outage':
      return nodes
        .filter((n) => n.data.category === ComponentCategory.Security)
        .map((n) => n.id);
    case 'queue_failure':
      return nodes
        .filter((n) => n.data.category === ComponentCategory.Messaging)
        .map((n) => n.id);
    case 'lb_failure':
      return nodes
        .filter((n) => n.data.componentId.includes('load_balancer'))
        .map((n) => n.id);
    default:
      return [];
  }
}

export interface FailureSimulationResult {
  scenario: FailureScenario;
  affectedNodeIds: string[];
  before: SimulationResponse;
  after: SimulationResponse;
  degradedNodes: string[];
  newBottleneck: string | null;
}

export function simulateFailure(
  nodes: VexoNode[],
  edges: VexoEdge[],
  scenarioId: FailureScenarioId,
  entryQPS: number,
  cbrRegistry: Map<string, CBREntry>,
): FailureSimulationResult {
  const scenario = FAILURE_SCENARIOS.find((s) => s.id === scenarioId)!;
  const affectedNodeIds = getAffectedNodeIds(scenarioId, nodes, edges);
  const affectedSet = new Set(affectedNodeIds);

  // Before: normal simulation
  const before = simulate(nodes, edges, entryQPS, cbrRegistry);

  // After: remove affected nodes and their edges
  const remainingNodes = nodes.filter((n) => !affectedSet.has(n.id));
  const remainingEdges = edges.filter(
    (e) => !affectedSet.has(e.source) && !affectedSet.has(e.target),
  );
  const after = simulate(remainingNodes, remainingEdges, entryQPS, cbrRegistry);

  // Degraded nodes: nodes whose saturation increased by >10%
  const degradedNodes: string[] = [];
  for (const [nodeId, afterResult] of Object.entries(after.nodeResults)) {
    const beforeResult = before.nodeResults[nodeId];
    if (!beforeResult) continue;
    if (afterResult.saturation - beforeResult.saturation > 0.1) {
      degradedNodes.push(nodeId);
    }
  }

  const newBottleneck = after.bottleneckPath[after.bottleneckPath.length - 1] ?? null;

  return { scenario, affectedNodeIds, before, after, degradedNodes, newBottleneck };
}
