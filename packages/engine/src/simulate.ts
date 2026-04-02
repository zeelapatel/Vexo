import type { VexoNode, VexoEdge, CBREntry } from '@vexo/types';
import { SystemStatus } from '@vexo/types';
import type { SimulationResponse, NodeSimResult } from './protocol';
import { buildGraph } from './graphBuilder';
import { propagateLoad } from './loadPropagator';
import { calculateSaturation } from './saturationCalculator';
import { detectBottlenecks } from './bottleneckDetector';

export function simulate(
  nodes: VexoNode[],
  edges: VexoEdge[],
  entryQPS: number,
  cbrRegistry: Map<string, CBREntry>,
): SimulationResponse {
  const startTime = Date.now();
  const warnings: string[] = [];

  if (nodes.length === 0) {
    return { type: 'result', nodeResults: {}, bottleneckPath: [], totalLatency: 0, warnings: [] };
  }

  const graph = buildGraph(nodes, edges);

  if (graph.cycleDetected) {
    warnings.push(`Cycle detected involving: ${graph.cycleNodeIds.join(', ')}`);
  }

  const loadResults = propagateLoad(graph, entryQPS, cbrRegistry);

  const nodeResults: Record<string, NodeSimResult> = {};
  for (const [nodeId, loadResult] of loadResults) {
    const node = graph.nodeMap.get(nodeId)!;
    const cbrEntry = cbrRegistry.get(node.data.componentId);
    if (cbrEntry) {
      nodeResults[nodeId] = calculateSaturation(loadResult.incomingLoad, cbrEntry);
    } else {
      nodeResults[nodeId] = {
        saturation: 0,
        latencyP50: 0,
        latencyP99: 0,
        status: SystemStatus.Idle,
        currentRPS: Math.round(loadResult.incomingLoad),
      };
    }
  }

  const simResultMap = new Map(Object.entries(nodeResults));
  const bottleneck = detectBottlenecks(graph, simResultMap, entryQPS);

  let totalLatency = 0;
  for (const nodeId of bottleneck.bottleneckPath) {
    totalLatency += nodeResults[nodeId]?.latencyP99 ?? 0;
  }

  if (
    bottleneck.primaryBottleneck &&
    (nodeResults[bottleneck.primaryBottleneck]?.saturation ?? 0) > 0.9
  ) {
    const label =
      graph.nodeMap.get(bottleneck.primaryBottleneck)?.data.label ??
      bottleneck.primaryBottleneck;
    warnings.push(
      `Bottleneck: ${label} at ${Math.round((nodeResults[bottleneck.primaryBottleneck]?.saturation ?? 0) * 100)}% saturation`,
    );
  }

  const elapsed = Date.now() - startTime;
  if (elapsed > 100) {
    warnings.push(`Simulation took ${elapsed}ms`);
  }

  return {
    type: 'result',
    nodeResults,
    bottleneckPath: bottleneck.bottleneckPath,
    totalLatency,
    warnings,
  };
}
