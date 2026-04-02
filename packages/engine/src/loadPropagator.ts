import type { VexoEdge } from '@vexo/types';
import { ConnectionType } from '@vexo/types';
import type { CBREntry } from '@vexo/types';
import type { SimulationGraph } from './graphBuilder';
import { getTransferFunction } from './connectionTypes';

export interface NodeLoadResult {
  incomingLoad: number;
  outgoingLoad: number;
  cumulativeLatency: number;
  /** per-edge latency additions, keyed by edgeId */
  edgeLatencies: Map<string, number>;
}

export function propagateLoad(
  graph: SimulationGraph,
  entryQPS: number,
  cbrRegistry: Map<string, CBREntry>,
): Map<string, NodeLoadResult> {
  const results = new Map<string, NodeLoadResult>();

  // Initialize all nodes with zero load
  for (const nodeId of graph.sortedOrder) {
    results.set(nodeId, {
      incomingLoad: 0,
      outgoingLoad: 0,
      cumulativeLatency: 0,
      edgeLatencies: new Map(),
    });
  }

  // Source nodes start with entryQPS
  for (const sourceId of graph.sourceNodes) {
    const r = results.get(sourceId)!;
    r.incomingLoad = entryQPS;
  }

  // Process nodes in topological order
  for (const nodeId of graph.sortedOrder) {
    const nodeResult = results.get(nodeId)!;
    const node = graph.nodeMap.get(nodeId)!;
    const sourceCBR = cbrRegistry.get(node.data.componentId);
    const outEdges = graph.adjacencyList.get(nodeId) ?? [];

    // Set outgoing = incoming (the node itself receives the load)
    nodeResult.outgoingLoad = nodeResult.incomingLoad;

    if (outEdges.length === 0) continue;

    // Fan-out: distribute evenly among outgoing edges
    const loadPerEdge = nodeResult.incomingLoad / outEdges.length;

    for (const targetId of outEdges) {
      // Find the edge(s) connecting nodeId → targetId using the pre-built index (O(fan-out))
      const connectingEdges = (graph.sourceEdges.get(nodeId) ?? []).filter(
        (e) => e.target === targetId,
      );

      const edge = connectingEdges[0]; // take first if multiple
      const connectionType =
        (edge?.data?.connectionType as ConnectionType) ?? ConnectionType.SYNC_HTTP;
      const targetNode = graph.nodeMap.get(targetId)!;
      const targetCBR = cbrRegistry.get(targetNode.data.componentId);

      const transferFn = getTransferFunction(connectionType);
      const { propagatedLoad, addedLatency } = transferFn({
        upstreamLoad: loadPerEdge,
        sourceCBR,
        targetCBR,
        config: {},
      });

      // Accumulate incoming load at target
      const targetResult = results.get(targetId)!;
      targetResult.incomingLoad += propagatedLoad;
      targetResult.cumulativeLatency = Math.max(
        targetResult.cumulativeLatency,
        nodeResult.cumulativeLatency + addedLatency,
      );

      if (edge) {
        nodeResult.edgeLatencies.set(edge.id, addedLatency);
      }
    }
  }

  return results;
}
