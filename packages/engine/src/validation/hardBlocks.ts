import { ComponentCategory } from '@vexo/types';
import type { ValidationRule } from './ruleSchema';

export const HARD_BLOCK_RULES: ValidationRule[] = [
  {
    id: 'hb-01',
    name: 'Client Direct to Database',
    layer: 1,
    sourceCategories: [ComponentCategory.ClientEdge],
    targetCategories: [ComponentCategory.Database],
    message:
      'Clients must not connect directly to databases. Add an API layer (App Server or API Gateway) between them.',
    suggestedFix: 'Insert an App Server or API Gateway between the client and the database.',
  },
  {
    id: 'hb-02',
    name: 'CDN Direct to Database',
    layer: 1,
    sourceCategories: [ComponentCategory.Networking],
    targetCategories: [ComponentCategory.Database],
    sourceTypes: ['cdn'],
    message: 'CDN cannot connect directly to a database. CDNs serve cached static content only.',
    suggestedFix: 'Route through an App Server or API Gateway that queries the database.',
  },
  {
    id: 'hb-03',
    name: 'DNS to Message Queue',
    layer: 1,
    sourceCategories: [ComponentCategory.Networking],
    targetCategories: [ComponentCategory.Messaging],
    sourceTypes: ['dns'],
    message:
      'DNS resolvers cannot connect to message queues. DNS only resolves hostnames to IPs.',
    suggestedFix: 'Remove this connection. DNS is infrastructure, not a message producer.',
  },
  {
    id: 'hb-04',
    name: 'Object Storage to Load Balancer',
    layer: 1,
    sourceCategories: [ComponentCategory.Storage],
    targetCategories: [ComponentCategory.Networking],
    sourceTypes: ['object_storage'],
    targetTypes: ['load_balancer'],
    message: 'Object storage cannot initiate connections to a load balancer.',
    suggestedFix:
      'Reverse the direction: services pull from object storage, not the other way around.',
  },
  {
    id: 'hb-05',
    name: 'L7 Load Balancer to L7 Load Balancer',
    layer: 1,
    sourceCategories: [ComponentCategory.Networking],
    targetCategories: [ComponentCategory.Networking],
    sourceTypes: ['load_balancer_l7'],
    targetTypes: ['load_balancer_l7'],
    message:
      'Two L7 load balancers in series create unnecessary latency and routing complexity.',
    suggestedFix:
      'Use a single L7 load balancer, or chain L7 → L4 if multi-layer routing is needed.',
  },
  {
    id: 'hb-06',
    name: 'Metrics Collector to App Server (Reverse Flow)',
    layer: 1,
    sourceCategories: [ComponentCategory.Observability],
    targetCategories: [ComponentCategory.Compute],
    sourceTypes: ['metrics_collector', 'prometheus'],
    message:
      'Metrics collectors receive metrics from services; they should not push data to app servers.',
    suggestedFix:
      'Reverse the direction: App Server → Metrics Collector (push), or configure scraping (pull).',
  },
  {
    id: 'hb-07',
    name: 'Dead Letter Queue to External Client',
    layer: 1,
    sourceCategories: [ComponentCategory.Messaging],
    targetCategories: [ComponentCategory.ClientEdge],
    sourceTypes: ['dlq'],
    message: 'Dead Letter Queues must not send messages directly to external clients.',
    suggestedFix:
      'Add a DLQ processor service that reads from the DLQ and handles retries or alerting.',
  },
];
