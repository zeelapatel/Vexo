import { ComponentCategory } from '@vexo/types';
import type { ValidationRule } from './ruleSchema';

export const CONTEXT_RULES: ValidationRule[] = [
  {
    id: 'ctx-01',
    name: 'Serverless to RDS Requires VPC',
    layer: 1,
    sourceCategories: [ComponentCategory.Compute],
    targetCategories: [ComponentCategory.Database],
    sourceTypes: ['serverless'],
    targetTypes: ['postgresql', 'mysql', 'rds'],
    condition: (source) => {
      // Block if VPC is not enabled on the serverless function
      return !(source.data as Record<string, unknown>)['vpc_enabled'];
    },
    message:
      'Serverless functions cannot connect to RDS without VPC configuration. This will time out in production.',
    suggestedFix: 'Enable VPC for the Serverless Function in the Properties panel.',
  },
  {
    id: 'ctx-02',
    name: 'Serverless to Cache Requires VPC + Connection Limit',
    layer: 2,
    sourceCategories: [ComponentCategory.Compute],
    targetCategories: [ComponentCategory.Storage],
    sourceTypes: ['serverless'],
    targetTypes: ['cache', 'redis', 'elasticache'],
    condition: (source) => {
      return !(source.data as Record<string, unknown>)['vpc_enabled'];
    },
    message:
      'Serverless → ElastiCache without VPC may work but is not recommended; enable VPC for reliable connectivity.',
    suggestedFix:
      'Enable VPC on the Serverless Function and configure connection reuse.',
  },
  {
    id: 'ctx-03',
    name: 'LB L7 to LB L7 is Blocked; L7 to L4 is OK',
    layer: 1,
    sourceCategories: [ComponentCategory.Networking],
    targetCategories: [ComponentCategory.Networking],
    sourceTypes: ['load_balancer_l7'],
    targetTypes: ['load_balancer_l7'],
    message: 'L7 Load Balancer to L7 Load Balancer creates redundant HTTP processing layers.',
    suggestedFix: 'Use L7 → L4 for multi-layer routing instead.',
  },
  {
    id: 'ctx-04',
    name: 'CDN to App Server Without Cache TTL',
    layer: 2,
    sourceCategories: [ComponentCategory.Networking],
    targetCategories: [ComponentCategory.Compute],
    sourceTypes: ['cdn'],
    message:
      'CDN to App Server connection without cache TTL configured means all requests hit origin — CDN provides no benefit.',
    suggestedFix: 'Configure a cache TTL on the CDN in the Properties panel.',
  },
  {
    id: 'ctx-05',
    name: 'Event Stream to SQL Database Needs Consumer',
    layer: 2,
    sourceCategories: [ComponentCategory.Messaging],
    targetCategories: [ComponentCategory.Database],
    sourceTypes: ['kafka', 'pulsar', 'stream'],
    targetTypes: ['postgresql', 'mysql'],
    message:
      'Event streams writing directly to SQL databases can overwhelm write capacity. A consumer service should mediate.',
    suggestedFix: 'Add a consumer microservice between the event stream and the database.',
  },
  {
    id: 'ctx-06',
    name: 'Observability Pull Pattern is Preferred',
    layer: 2,
    sourceCategories: [ComponentCategory.Compute],
    targetCategories: [ComponentCategory.Observability],
    sourceTypes: ['app_server', 'microservice'],
    targetTypes: ['prometheus', 'metrics_collector'],
    condition: () => true,
    message:
      'App services pushing metrics to Prometheus is non-standard. Prometheus is designed to pull (scrape) metrics.',
    suggestedFix:
      'Expose a /metrics endpoint on the App Server and configure Prometheus to scrape it.',
  },
  {
    id: 'ctx-07',
    name: 'Microservice Stateless Check for Session Cache',
    layer: 2,
    sourceCategories: [ComponentCategory.Compute],
    targetCategories: [ComponentCategory.Storage],
    sourceTypes: ['microservice'],
    targetTypes: ['redis', 'cache'],
    condition: (source) => {
      // Warn if microservice is storing session data in shared cache (anti-pattern for horizontal scaling)
      return !!(source.data as Record<string, unknown>)['stateful_sessions'];
    },
    message:
      'Stateful session data in a shared cache violates the stateless microservice principle.',
    suggestedFix: 'Use JWT tokens for stateless auth, or accept this trade-off consciously.',
  },
];
