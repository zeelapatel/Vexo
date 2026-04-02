import type { SimulationGraph } from './graphBuilder';
import type { NodeSimResult } from './protocol';

export interface BottleneckResult {
  primaryBottleneck: string | null;
  bottleneckPath: string[];
  secondaryBottlenecks: string[];
  /** QPS at which the primary bottleneck hits 100% saturation */
  maxThroughput: number;
}

function tracePath(graph: SimulationGraph, from: string[], to: string): string[] {
  // BFS to find path from any source to target
  const visited = new Set<string>(from);
  const queue: Array<{ id: string; path: string[] }> = from.map((id) => ({ id, path: [id] }));

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    if (id === to) return path;
    for (const neighbor of graph.adjacencyList.get(id) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, path: [...path, neighbor] });
      }
    }
  }
  return [to]; // fallback
}

export function detectBottlenecks(
  graph: SimulationGraph,
  nodeResults: Map<string, NodeSimResult>,
  currentEntryQPS: number,
): BottleneckResult {
  if (nodeResults.size === 0) {
    return {
      primaryBottleneck: null,
      bottleneckPath: [],
      secondaryBottlenecks: [],
      maxThroughput: Infinity,
    };
  }

  let primaryBottleneck: string | null = null;
  let highestSaturation = 0;
  const secondaryBottlenecks: string[] = [];

  for (const [nodeId, result] of nodeResults) {
    if (result.saturation > highestSaturation) {
      highestSaturation = result.saturation;
      primaryBottleneck = nodeId;
    }
  }

  // Secondary: >0.8 saturation, not primary
  for (const [nodeId, result] of nodeResults) {
    if (nodeId !== primaryBottleneck && result.saturation >= 0.8) {
      secondaryBottlenecks.push(nodeId);
    }
  }

  // Bottleneck path: from source nodes to primary bottleneck
  const bottleneckPath =
    primaryBottleneck && graph.sourceNodes.length > 0
      ? tracePath(graph, graph.sourceNodes, primaryBottleneck)
      : [];

  // Max throughput: extrapolate from current saturation
  // maxThroughput = currentQPS / saturation (if saturation > 0)
  const maxThroughput =
    primaryBottleneck && highestSaturation > 0
      ? Math.round(currentEntryQPS / highestSaturation)
      : Infinity;

  return { primaryBottleneck, bottleneckPath, secondaryBottlenecks, maxThroughput };
}
