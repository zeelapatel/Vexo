import type { VexoNode, VexoEdge } from '@vexo/types';

export interface SimulationGraph {
  adjacencyList: Map<string, string[]>;
  reverseAdjacency: Map<string, string[]>;
  inDegree: Map<string, number>;
  nodeMap: Map<string, VexoNode>;
  edgeMap: Map<string, VexoEdge>;
  /** Pre-built index: source node id → edges originating from that node */
  sourceEdges: Map<string, VexoEdge[]>;
  /** Nodes in topological order (Kahn's algorithm) */
  sortedOrder: string[];
  /** Nodes with no incoming edges */
  sourceNodes: string[];
  cycleDetected: boolean;
  cycleNodeIds: string[];
}

export function buildGraph(nodes: VexoNode[], edges: VexoEdge[]): SimulationGraph {
  const nodeMap = new Map<string, VexoNode>(nodes.map((n) => [n.id, n]));
  const edgeMap = new Map<string, VexoEdge>(edges.map((e) => [e.id, e]));
  const adjacencyList = new Map<string, string[]>();
  const reverseAdjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize all nodes
  for (const node of nodes) {
    adjacencyList.set(node.id, []);
    reverseAdjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  // Build adjacency lists and source-edge index in one pass
  const sourceEdges = new Map<string, VexoEdge[]>();
  for (const edge of edges) {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) continue;
    adjacencyList.get(edge.source)!.push(edge.target);
    reverseAdjacency.get(edge.target)!.push(edge.source);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    const list = sourceEdges.get(edge.source) ?? [];
    list.push(edge);
    sourceEdges.set(edge.source, list);
  }

  // Source nodes = inDegree 0
  const sourceNodes = nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id);

  // Kahn's algorithm for topological sort
  const queue: string[] = [...sourceNodes];
  const sortedOrder: string[] = [];
  const tempInDegree = new Map(inDegree);

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    sortedOrder.push(nodeId);
    for (const neighbor of adjacencyList.get(nodeId) ?? []) {
      const newDeg = (tempInDegree.get(neighbor) ?? 0) - 1;
      tempInDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  const cycleDetected = sortedOrder.length < nodes.length;
  const sortedSet = new Set(sortedOrder);
  const cycleNodeIds = cycleDetected
    ? nodes.filter((n) => !sortedSet.has(n.id)).map((n) => n.id)
    : [];

  return {
    adjacencyList,
    reverseAdjacency,
    inDegree,
    nodeMap,
    edgeMap,
    sourceEdges,
    sortedOrder,
    sourceNodes,
    cycleDetected,
    cycleNodeIds,
  };
}
