import { ComponentCategory } from '@vexo/types';
import type { ValidationRule } from './ruleSchema';

export const SOFT_WARNING_RULES: ValidationRule[] = [
  {
    id: 'sw-01',
    name: 'Service-to-Service Without Load Balancer',
    layer: 2,
    sourceCategories: [ComponentCategory.Compute],
    targetCategories: [ComponentCategory.Compute],
    sourceTypes: ['app_server', 'microservice'],
    targetTypes: ['app_server', 'microservice'],
    message:
      'Direct service-to-service connection without a load balancer creates a SPOF and prevents horizontal scaling.',
    suggestedFix: 'Add a Load Balancer L4 or service mesh between these services.',
  },
  {
    id: 'sw-02',
    name: 'API Gateway Bypassing Application Layer',
    layer: 2,
    sourceCategories: [ComponentCategory.Networking],
    targetCategories: [ComponentCategory.Database],
    sourceTypes: ['api_gateway'],
    message:
      'API Gateway connecting directly to a database bypasses the application logic layer.',
    suggestedFix:
      'Route through an App Server or Microservice between the API Gateway and the database.',
  },
  {
    id: 'sw-03',
    name: 'WebSocket Direct to SQL Database',
    layer: 2,
    sourceCategories: [ComponentCategory.Compute],
    targetCategories: [ComponentCategory.Database],
    sourceTypes: ['websocket'],
    targetTypes: ['postgresql', 'mysql', 'mariadb'],
    message:
      'WebSocket servers writing directly to SQL databases can overwhelm the connection pool under high concurrency.',
    suggestedFix:
      'Buffer writes through a message queue or use a connection pooler like PgBouncer.',
  },
  {
    id: 'sw-04',
    name: 'Kubernetes Pod to External Database Without Pooler',
    layer: 2,
    sourceCategories: [ComponentCategory.Compute],
    targetCategories: [ComponentCategory.Database],
    sourceTypes: ['kubernetes'],
    targetTypes: ['postgresql', 'mysql'],
    message:
      'Kubernetes pods connecting directly to PostgreSQL/MySQL can exhaust max_connections rapidly when pods scale.',
    suggestedFix:
      'Add PgBouncer (PostgreSQL) or ProxySQL (MySQL) as a connection pooler.',
  },
  {
    id: 'sw-05',
    name: 'Cache Without TTL to Database',
    layer: 2,
    sourceCategories: [ComponentCategory.Storage],
    targetCategories: [ComponentCategory.Database],
    sourceTypes: ['cache', 'redis'],
    message:
      'Cache connecting to a database without TTL configuration risks stale data and cache stampedes.',
    suggestedFix:
      'Configure a TTL on cached keys and implement cache-aside or write-through strategy.',
  },
  {
    id: 'sw-06',
    name: 'Single Database Above 10K RPS',
    layer: 2,
    sourceCategories: [ComponentCategory.Compute],
    targetCategories: [ComponentCategory.Database],
    condition: (_source, target) => {
      return target.data.metrics.currentRPS > 10000;
    },
    message: 'A single database instance receiving >10K RPS is at risk of saturation.',
    suggestedFix: 'Add read replicas, implement caching, or consider sharding.',
  },
  {
    id: 'sw-07',
    name: 'Synchronous Chain Too Deep',
    layer: 2,
    // Applied at graph-level, not per-connection — skipped via condition that never fires
    sourceCategories: [],
    targetCategories: [],
    condition: () => false,
    message:
      'Synchronous call chain is more than 3 levels deep, increasing tail latency and failure blast radius.',
    suggestedFix: 'Break the chain with async messaging, or collapse intermediate services.',
  },
];
