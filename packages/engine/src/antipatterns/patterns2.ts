import { ComponentCategory } from '@vexo/types';
import type { AntiPattern } from './schema';

export const ANTI_PATTERNS_2: AntiPattern[] = [
  {
    id: 'ap-11',
    name: 'Fan-out Without Queue',
    description:
      'A service has >10 outgoing synchronous HTTP connections creating brittle coupling.',
    severity: 'warning',
    suggestedFix:
      'Replace fan-out with an event bus or message queue for async decoupling.',
    autoFixAvailable: false,
    triggerCondition: (graph) => {
      for (const [nodeId, neighbors] of graph.adjacencyList) {
        if (neighbors.length > 10) {
          const node = graph.nodeMap.get(nodeId);
          if (!node) continue;
          let syncCount = 0;
          for (const neighborId of neighbors) {
            for (const [, edge] of graph.edgeMap) {
              if (edge.source === nodeId && edge.target === neighborId) {
                const ct = String(edge.data?.connectionType ?? '');
                if (ct.includes('SYNC')) syncCount++;
              }
            }
          }
          if (syncCount > 10) {
            return {
              patternId: 'ap-11',
              affectedNodes: [nodeId],
              affectedEdges: [],
              explanation: `${node.data.label} has ${syncCount} synchronous outgoing connections.`,
            };
          }
        }
      }
      return null;
    },
  },
  {
    id: 'ap-12',
    name: 'No Health Check on Load Balancer',
    description: 'A load balancer has no health check connections to its target services.',
    severity: 'warning',
    suggestedFix: 'Add HEALTH_CHECK edges from the load balancer to each backend service.',
    autoFixAvailable: false,
    triggerCondition: (graph) => {
      for (const [nodeId, node] of graph.nodeMap) {
        if (!node.data.componentId.includes('load_balancer')) continue;
        const outEdges = graph.adjacencyList.get(nodeId) ?? [];
        const hasHealthCheck = outEdges.some((neighborId) => {
          for (const [, edge] of graph.edgeMap) {
            if (edge.source === nodeId && edge.target === neighborId) {
              return String(edge.data?.connectionType ?? '') === 'HEALTH_CHECK';
            }
          }
          return false;
        });
        if (!hasHealthCheck && outEdges.length > 0) {
          return {
            patternId: 'ap-12',
            affectedNodes: [nodeId],
            affectedEdges: [],
            explanation: `${node.data.label} has no health check connections to backend services.`,
          };
        }
      }
      return null;
    },
  },
  {
    id: 'ap-13',
    name: 'No Rate Limiter on API',
    description: 'An API Gateway or public-facing service has no rate limiter.',
    severity: 'warning',
    suggestedFix: 'Add a Rate Limiter between the client and the API Gateway.',
    autoFixAvailable: false,
    triggerCondition: (graph) => {
      for (const [nodeId, node] of graph.nodeMap) {
        if (!node.data.componentId.includes('api_gateway')) continue;
        const upstream = graph.reverseAdjacency.get(nodeId) ?? [];
        const hasRateLimiter = upstream.some((srcId) =>
          graph.nodeMap.get(srcId)?.data.componentId.includes('rate_limiter'),
        );
        if (!hasRateLimiter) {
          return {
            patternId: 'ap-13',
            affectedNodes: [nodeId],
            affectedEdges: [],
            explanation: `${node.data.label} has no upstream rate limiter.`,
          };
        }
      }
      return null;
    },
  },
  {
    id: 'ap-14',
    name: 'Stateful Serverless Function',
    description: 'A serverless function stores state in memory between invocations.',
    severity: 'warning',
    suggestedFix:
      'Move state to an external store (Redis, DynamoDB, S3) and keep functions stateless.',
    autoFixAvailable: false,
    triggerCondition: (graph) => {
      for (const [nodeId, node] of graph.nodeMap) {
        if (!node.data.componentId.includes('serverless')) continue;
        if ((node.data as Record<string, unknown>)['stateful']) {
          return {
            patternId: 'ap-14',
            affectedNodes: [nodeId],
            affectedEdges: [],
            explanation: `${node.data.label} is configured as stateful — this violates FaaS principles.`,
          };
        }
      }
      return null;
    },
  },
  {
    id: 'ap-15',
    name: 'No CDN for Static Assets',
    description:
      'A web client connects directly to an app server without a CDN for static content.',
    severity: 'warning',
    suggestedFix:
      'Add a CDN between the web client and the app server for static asset caching.',
    autoFixAvailable: false,
    triggerCondition: (graph) => {
      for (const [, edge] of graph.edgeMap) {
        const source = graph.nodeMap.get(edge.source);
        const target = graph.nodeMap.get(edge.target);
        if (
          source?.data.componentId.includes('web_browser') &&
          target?.data.category === ComponentCategory.Compute
        ) {
          const hasCDN = graph.reverseAdjacency.get(edge.target)?.some((srcId) =>
            graph.nodeMap.get(srcId)?.data.componentId.includes('cdn'),
          );
          if (!hasCDN) {
            return {
              patternId: 'ap-15',
              affectedNodes: [edge.source, edge.target],
              affectedEdges: [edge.id],
              explanation: `${source.data.label} hits ${target.data.label} directly — no CDN for static assets.`,
            };
          }
        }
      }
      return null;
    },
  },
  {
    id: 'ap-16',
    name: 'N+1 Query Pattern',
    description:
      'Multiple services each make individual database queries instead of batching.',
    severity: 'warning',
    suggestedFix:
      'Batch queries with DataLoader, or use a caching layer to consolidate reads.',
    autoFixAvailable: false,
    triggerCondition: (graph) => {
      const dbNodes = [...graph.nodeMap.values()].filter(
        (n) => n.data.category === ComponentCategory.Database,
      );
      for (const db of dbNodes) {
        const incomingCount = graph.reverseAdjacency.get(db.id)?.length ?? 0;
        if (incomingCount >= 5) {
          return {
            patternId: 'ap-16',
            affectedNodes: [db.id],
            affectedEdges: [],
            explanation: `${db.data.label} receives direct queries from ${incomingCount} services — likely N+1 pattern.`,
          };
        }
      }
      return null;
    },
  },
  {
    id: 'ap-17',
    name: 'Direct DB Access in Lambda Loop',
    description: 'A serverless function makes direct database calls, likely in a loop.',
    severity: 'critical',
    suggestedFix:
      'Use batch operations or a connection pooler. Avoid DB calls inside loops.',
    autoFixAvailable: false,
    triggerCondition: (graph) => {
      for (const [, edge] of graph.edgeMap) {
        const source = graph.nodeMap.get(edge.source);
        const target = graph.nodeMap.get(edge.target);
        if (
          source?.data.componentId.includes('serverless') &&
          target?.data.category === ComponentCategory.Database
        ) {
          if (source.data.metrics.currentRPS > 100) {
            return {
              patternId: 'ap-17',
              affectedNodes: [edge.source, edge.target],
              affectedEdges: [edge.id],
              explanation: `${source.data.label} makes direct DB calls at ${source.data.metrics.currentRPS} RPS — likely a loop.`,
            };
          }
        }
      }
      return null;
    },
  },
  {
    id: 'ap-18',
    name: 'No Circuit Breaker on Service Dependency',
    description:
      'Services call downstream dependencies without circuit breaker protection.',
    severity: 'warning',
    suggestedFix:
      'Add circuit breaker (Hystrix, Resilience4j, or built-in) to prevent cascading failures.',
    autoFixAvailable: false,
    triggerCondition: (graph) => {
      for (const [, edge] of graph.edgeMap) {
        const source = graph.nodeMap.get(edge.source);
        const target = graph.nodeMap.get(edge.target);
        if (
          source?.data.category === ComponentCategory.Compute &&
          target?.data.category === ComponentCategory.Compute
        ) {
          if (!(source.data as Record<string, unknown>)['circuit_breaker']) {
            return {
              patternId: 'ap-18',
              affectedNodes: [edge.source],
              affectedEdges: [edge.id],
              explanation: `${source.data.label} calls ${target.data.label} without a circuit breaker.`,
            };
          }
        }
      }
      return null;
    },
  },
  {
    id: 'ap-19',
    name: 'Cross-AZ Without Awareness',
    description:
      'Services communicate across availability zones without AZ-aware routing.',
    severity: 'warning',
    suggestedFix: 'Configure zone-aware load balancing to prefer same-AZ traffic.',
    autoFixAvailable: false,
    triggerCondition: (graph) => {
      // Simplified: flag if graph has >2 nodes without AZ config in CBR
      const nodesWithoutAZ = [...graph.nodeMap.values()].filter(
        (n) =>
          n.data.category === ComponentCategory.Compute &&
          !(n.data as Record<string, unknown>)['az_aware'],
      );
      if (nodesWithoutAZ.length >= 3) {
        return {
          patternId: 'ap-19',
          affectedNodes: nodesWithoutAZ.slice(0, 3).map((n) => n.id),
          affectedEdges: [],
          explanation: `${nodesWithoutAZ.length} compute nodes have no AZ-aware routing configured.`,
        };
      }
      return null;
    },
  },
  {
    id: 'ap-20',
    name: 'Write Amplification',
    description:
      'A single write operation fans out to many downstream databases or stores.',
    severity: 'warning',
    suggestedFix:
      'Use event sourcing or a CDC (Change Data Capture) pattern instead of synchronous fan-out writes.',
    autoFixAvailable: false,
    triggerCondition: (graph) => {
      for (const [nodeId, neighbors] of graph.adjacencyList) {
        const dbNeighbors = neighbors.filter(
          (nId) => graph.nodeMap.get(nId)?.data.category === ComponentCategory.Database,
        );
        if (dbNeighbors.length >= 3) {
          const node = graph.nodeMap.get(nodeId);
          return {
            patternId: 'ap-20',
            affectedNodes: [nodeId, ...dbNeighbors],
            affectedEdges: [],
            explanation: `${node?.data.label ?? nodeId} writes to ${dbNeighbors.length} databases synchronously — write amplification.`,
          };
        }
      }
      return null;
    },
  },
];
