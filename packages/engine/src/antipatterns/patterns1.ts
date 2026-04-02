import { ComponentCategory, SystemStatus, ConnectionType } from '@vexo/types';
import type { AntiPattern } from './schema';

export const ANTI_PATTERNS_1: AntiPattern[] = [
  {
    id: 'ap-01',
    name: 'Client Direct to Database',
    description: 'A browser or mobile client connects directly to a database without an API layer.',
    severity: 'critical',
    suggestedFix: 'Insert an App Server or API Gateway between the client and database.',
    autoFixAvailable: true,
    triggerCondition: (graph) => {
      for (const [edgeId, edge] of graph.edgeMap) {
        const source = graph.nodeMap.get(edge.source);
        const target = graph.nodeMap.get(edge.target);
        if (
          source?.data.category === ComponentCategory.ClientEdge &&
          target?.data.category === ComponentCategory.Database
        ) {
          return {
            patternId: 'ap-01',
            affectedNodes: [edge.source, edge.target],
            affectedEdges: [edgeId],
            explanation: `${source.data.label} connects directly to ${target.data.label} without an API layer.`,
          };
        }
      }
      return null;
    },
    autoFix: (graph) => {
      // Find the offending edge
      for (const [, edge] of graph.edgeMap) {
        const source = graph.nodeMap.get(edge.source);
        const target = graph.nodeMap.get(edge.target);
        if (
          source?.data.category === ComponentCategory.ClientEdge &&
          target?.data.category === ComponentCategory.Database
        ) {
          const midX = (source.position.x + target.position.x) / 2;
          const midY = (source.position.y + target.position.y) / 2;
          const gatewayId = `autofix-api-gateway-${Date.now()}`;
          return {
            addNodes: [
              {
                id: gatewayId,
                type: 'vexo',
                position: { x: midX, y: midY - 40 },
                data: {
                  componentId: 'generic_api_gateway',
                  label: 'API Gateway',
                  category: ComponentCategory.Networking,
                  cloudVariant: null,
                  iconType: 'custom',
                  iconSrc: 'generic_api_gateway',
                  status: SystemStatus.Idle,
                  metrics: { latencyP50: 0, latencyP99: 0, saturation: 0, currentRPS: 0 },
                },
              },
            ],
            removeEdges: [edge.id],
            addEdges: [
              {
                id: `${edge.source}-${gatewayId}`,
                source: edge.source,
                target: gatewayId,
                type: 'vexo',
                data: { connectionType: 'SYNC_HTTP' as never, validationStatus: 'valid' },
              },
              {
                id: `${gatewayId}-${edge.target}`,
                source: gatewayId,
                target: edge.target,
                type: 'vexo',
                data: { connectionType: 'DB_READ' as never, validationStatus: 'valid' },
              },
            ],
          };
        }
      }
      return {};
    },
  },
  {
    id: 'ap-02',
    name: 'Single Point of Failure Database',
    description: 'A database node has no replicas and is handling high traffic.',
    severity: 'critical',
    suggestedFix: 'Add at least one read replica and enable Multi-AZ deployment.',
    autoFixAvailable: true,
    triggerCondition: (graph, cbrRegistry) => {
      for (const [nodeId, node] of graph.nodeMap) {
        if (node.data.category !== ComponentCategory.Database) continue;
        const cbr = cbrRegistry.get(node.data.componentId);
        if (!cbr) continue;
        const incomingCount = graph.reverseAdjacency.get(nodeId)?.length ?? 0;
        if (incomingCount >= 2 && node.data.metrics.currentRPS > 5000) {
          return {
            patternId: 'ap-02',
            affectedNodes: [nodeId],
            affectedEdges: [],
            explanation: `${node.data.label} is a single instance receiving ${node.data.metrics.currentRPS} RPS with no replicas.`,
          };
        }
      }
      return null;
    },
  },
  {
    id: 'ap-03',
    name: 'Unbounded Connection Pool',
    description:
      'Database connections are not pooled, risking max_connections exhaustion under load.',
    severity: 'warning',
    suggestedFix:
      'Add a connection pooler (PgBouncer for PostgreSQL, ProxySQL for MySQL) between app servers and the database.',
    autoFixAvailable: false,
    triggerCondition: (graph, cbrRegistry) => {
      for (const [, edge] of graph.edgeMap) {
        const source = graph.nodeMap.get(edge.source);
        const target = graph.nodeMap.get(edge.target);
        if (!source || !target) continue;
        if (
          source.data.category === ComponentCategory.Compute &&
          target.data.category === ComponentCategory.Database
        ) {
          const cbr = cbrRegistry.get(target.data.componentId);
          const maxConn = cbr?.limits['max_connections'];
          const incomingServices = graph.reverseAdjacency.get(edge.target)?.length ?? 0;
          if (typeof maxConn === 'number' && incomingServices * 50 > maxConn) {
            return {
              patternId: 'ap-03',
              affectedNodes: [edge.source, edge.target],
              affectedEdges: [edge.id],
              explanation: `${incomingServices} services × 50 connections may exceed ${target.data.label}'s max_connections limit of ${maxConn}.`,
            };
          }
        }
      }
      return null;
    },
  },
  {
    id: 'ap-04',
    name: 'Cache Stampede Risk',
    description: 'Multiple services hit the same cache with no thundering herd protection.',
    severity: 'warning',
    suggestedFix:
      'Implement cache warming, probabilistic early expiration (PER), or a cache lock pattern.',
    autoFixAvailable: false,
    triggerCondition: (graph) => {
      for (const [nodeId, node] of graph.nodeMap) {
        if (
          !node.data.componentId.includes('cache') &&
          !node.data.componentId.includes('redis')
        )
          continue;
        const incomingCount = graph.reverseAdjacency.get(nodeId)?.length ?? 0;
        if (incomingCount >= 3) {
          return {
            patternId: 'ap-04',
            affectedNodes: [nodeId],
            affectedEdges: [],
            explanation: `${node.data.label} is shared by ${incomingCount} services — a cache miss event will cause a stampede.`,
          };
        }
      }
      return null;
    },
  },
  {
    id: 'ap-05',
    name: 'Thundering Herd',
    description: 'All instances of a service will retry simultaneously after a failure.',
    severity: 'warning',
    suggestedFix: 'Implement exponential backoff with jitter for all retry logic.',
    autoFixAvailable: false,
    triggerCondition: (graph) => {
      // Detect: multiple compute nodes all pointing to the same single target
      const targetIncoming = new Map<string, number>();
      for (const [, edge] of graph.edgeMap) {
        targetIncoming.set(edge.target, (targetIncoming.get(edge.target) ?? 0) + 1);
      }
      for (const [nodeId, count] of targetIncoming) {
        const node = graph.nodeMap.get(nodeId);
        if (!node) continue;
        if (
          count >= 5 &&
          (node.data.category === ComponentCategory.Database ||
            node.data.category === ComponentCategory.Storage)
        ) {
          return {
            patternId: 'ap-05',
            affectedNodes: [nodeId],
            affectedEdges: [],
            explanation: `${node.data.label} receives connections from ${count} services — a restart will cause a thundering herd.`,
          };
        }
      }
      return null;
    },
  },
  {
    id: 'ap-06',
    name: 'Synchronous Chain Too Deep',
    description: 'A synchronous call chain is more than 3 levels deep.',
    severity: 'warning',
    suggestedFix:
      'Break long sync chains with async messaging or collapse intermediate services.',
    autoFixAvailable: false,
    triggerCondition: (graph) => {
      for (const sourceId of graph.sourceNodes) {
        const queue: Array<{ id: string; depth: number; path: string[] }> = [
          { id: sourceId, depth: 0, path: [sourceId] },
        ];
        while (queue.length > 0) {
          const { id, depth, path } = queue.shift()!;
          if (depth > 3) {
            return {
              patternId: 'ap-06',
              affectedNodes: path,
              affectedEdges: [],
              explanation: `Synchronous call chain is ${depth} levels deep: ${path.join(' → ')}.`,
            };
          }
          for (const neighborId of graph.adjacencyList.get(id) ?? []) {
            // Find connecting edge
            let isSyncEdge = false;
            for (const [, edge] of graph.edgeMap) {
              if (edge.source === id && edge.target === neighborId) {
                const ct = edge.data?.connectionType;
                isSyncEdge =
                  ct === ConnectionType.SYNC_HTTP || ct === ConnectionType.SYNC_GRPC;
                break;
              }
            }
            if (isSyncEdge && !path.includes(neighborId)) {
              queue.push({ id: neighborId, depth: depth + 1, path: [...path, neighborId] });
            }
          }
        }
      }
      return null;
    },
  },
  {
    id: 'ap-07',
    name: 'Queue Without Dead Letter Queue',
    description: 'A message queue has no DLQ configured for failed messages.',
    severity: 'warning',
    suggestedFix: 'Add a Dead Letter Queue connected to the message queue.',
    autoFixAvailable: true,
    triggerCondition: (graph) => {
      for (const [nodeId, node] of graph.nodeMap) {
        if (
          node.data.category !== ComponentCategory.Messaging ||
          node.data.componentId.includes('dlq')
        )
          continue;
        // Check if there's a DLQ connected to this queue
        const hasDLQ = [
          ...(graph.adjacencyList.get(nodeId) ?? []),
          ...(graph.reverseAdjacency.get(nodeId) ?? []),
        ].some((neighborId) =>
          graph.nodeMap.get(neighborId)?.data.componentId.includes('dlq'),
        );
        if (!hasDLQ) {
          return {
            patternId: 'ap-07',
            affectedNodes: [nodeId],
            affectedEdges: [],
            explanation: `${node.data.label} has no Dead Letter Queue for failed message handling.`,
          };
        }
      }
      return null;
    },
    autoFix: (graph) => {
      for (const [nodeId, node] of graph.nodeMap) {
        if (
          node.data.category === ComponentCategory.Messaging &&
          !node.data.componentId.includes('dlq')
        ) {
          const hasDLQ = [
            ...(graph.adjacencyList.get(nodeId) ?? []),
            ...(graph.reverseAdjacency.get(nodeId) ?? []),
          ].some((neighborId) =>
            graph.nodeMap.get(neighborId)?.data.componentId.includes('dlq'),
          );
          if (!hasDLQ) {
            const dlqId = `autofix-dlq-${Date.now()}`;
            return {
              addNodes: [
                {
                  id: dlqId,
                  type: 'vexo',
                  position: { x: node.position.x + 200, y: node.position.y + 100 },
                  data: {
                    componentId: 'generic_dlq',
                    label: 'Dead Letter Queue',
                    category: ComponentCategory.Messaging,
                    cloudVariant: null,
                    iconType: 'custom',
                    iconSrc: 'generic_dlq',
                    status: SystemStatus.Idle,
                    metrics: { latencyP50: 0, latencyP99: 0, saturation: 0, currentRPS: 0 },
                  },
                },
              ],
              addEdges: [
                {
                  id: `${nodeId}-${dlqId}`,
                  source: nodeId,
                  target: dlqId,
                  type: 'vexo',
                  data: { connectionType: 'ASYNC_QUEUE' as never, validationStatus: 'valid' },
                },
              ],
            };
          }
        }
      }
      return {};
    },
  },
  {
    id: 'ap-08',
    name: 'Lambda Without VPC for RDS',
    description:
      'A serverless function connects to an RDS instance without VPC configuration.',
    severity: 'critical',
    suggestedFix:
      'Enable VPC on the Lambda function and ensure it shares a VPC with RDS.',
    autoFixAvailable: false,
    triggerCondition: (graph) => {
      for (const [, edge] of graph.edgeMap) {
        const source = graph.nodeMap.get(edge.source);
        const target = graph.nodeMap.get(edge.target);
        if (
          source?.data.componentId.includes('serverless') &&
          target?.data.category === ComponentCategory.Database &&
          !(source.data as Record<string, unknown>)['vpc_enabled']
        ) {
          return {
            patternId: 'ap-08',
            affectedNodes: [edge.source, edge.target],
            affectedEdges: [edge.id],
            explanation: `${source.data.label} connects to ${target.data.label} but VPC is not enabled — this will time out.`,
          };
        }
      }
      return null;
    },
  },
  {
    id: 'ap-09',
    name: 'SQS FIFO at Scale',
    description:
      'SQS FIFO queues are limited to 3,000 messages/second. This may be insufficient at scale.',
    severity: 'warning',
    suggestedFix:
      'Use SQS Standard for high throughput, or shard FIFO queues by message group ID.',
    autoFixAvailable: false,
    triggerCondition: (graph) => {
      for (const [nodeId, node] of graph.nodeMap) {
        if (
          !node.data.componentId.includes('kafka') &&
          !node.data.componentId.includes('queue')
        )
          continue;
        if (
          (node.data as Record<string, unknown>)['fifo_mode'] &&
          node.data.metrics.currentRPS > 3000
        ) {
          return {
            patternId: 'ap-09',
            affectedNodes: [nodeId],
            affectedEdges: [],
            explanation: `${node.data.label} in FIFO mode is receiving ${node.data.metrics.currentRPS} RPS, exceeding the 3K limit.`,
          };
        }
      }
      return null;
    },
  },
  {
    id: 'ap-10',
    name: 'Hot Partition',
    description:
      'A database or queue has uneven partition key distribution causing hotspots.',
    severity: 'warning',
    suggestedFix:
      'Add a random suffix or use a composite partition key to distribute load.',
    autoFixAvailable: false,
    triggerCondition: (graph, cbrRegistry) => {
      for (const [nodeId, node] of graph.nodeMap) {
        if (
          node.data.category !== ComponentCategory.Database &&
          node.data.category !== ComponentCategory.Messaging
        )
          continue;
        const cbr = cbrRegistry.get(node.data.componentId);
        if (!cbr) continue;
        // Hot partition if saturation >70% and only a subset of keys are accessed (heuristic)
        if (node.data.metrics.saturation > 0.7) {
          const incomingCount = graph.reverseAdjacency.get(nodeId)?.length ?? 0;
          if (incomingCount === 1) {
            return {
              patternId: 'ap-10',
              affectedNodes: [nodeId],
              affectedEdges: [],
              explanation: `${node.data.label} at ${Math.round(node.data.metrics.saturation * 100)}% saturation from a single source — likely a hot partition.`,
            };
          }
        }
      }
      return null;
    },
  },
];
