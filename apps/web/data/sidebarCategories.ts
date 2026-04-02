import { ComponentCategory } from '@vexo/types';

export interface SidebarComponent {
  id: string;
  label: string;
  iconType: 'brand' | 'custom';
  category: ComponentCategory;
  description?: string;
}

export interface SidebarCategory {
  id: string;
  label: string;
  category: ComponentCategory;
  components: SidebarComponent[];
}

export const SIDEBAR_CATEGORIES: SidebarCategory[] = [
  {
    id: 'compute',
    label: 'Compute',
    category: ComponentCategory.Compute,
    components: [
      {
        id: 'generic_web_server',
        label: 'Web Server',
        iconType: 'custom',
        category: ComponentCategory.Compute,
      },
      {
        id: 'generic_app_server',
        label: 'App Server',
        iconType: 'custom',
        category: ComponentCategory.Compute,
      },
      {
        id: 'generic_microservice',
        label: 'Microservice',
        iconType: 'custom',
        category: ComponentCategory.Compute,
      },
      {
        id: 'generic_serverless',
        label: 'Serverless Function',
        iconType: 'custom',
        category: ComponentCategory.Compute,
      },
      {
        id: 'generic_vm',
        label: 'VM Instance',
        iconType: 'custom',
        category: ComponentCategory.Compute,
      },
      {
        id: 'generic_nginx',
        label: 'Nginx',
        iconType: 'brand',
        category: ComponentCategory.Compute,
      },
      {
        id: 'generic_docker',
        label: 'Docker Container',
        iconType: 'brand',
        category: ComponentCategory.Compute,
      },
      {
        id: 'generic_kubernetes',
        label: 'Kubernetes',
        iconType: 'brand',
        category: ComponentCategory.Compute,
      },
    ],
  },
  {
    id: 'databases',
    label: 'Databases',
    category: ComponentCategory.Database,
    components: [
      {
        id: 'generic_postgresql',
        label: 'PostgreSQL',
        iconType: 'brand',
        category: ComponentCategory.Database,
      },
      {
        id: 'generic_mysql',
        label: 'MySQL',
        iconType: 'brand',
        category: ComponentCategory.Database,
      },
      {
        id: 'generic_mongodb',
        label: 'MongoDB',
        iconType: 'brand',
        category: ComponentCategory.Database,
      },
      {
        id: 'generic_redis',
        label: 'Redis',
        iconType: 'brand',
        category: ComponentCategory.Database,
      },
      {
        id: 'generic_elasticsearch',
        label: 'Elasticsearch',
        iconType: 'brand',
        category: ComponentCategory.Database,
      },
      {
        id: 'generic_data_warehouse',
        label: 'Data Warehouse',
        iconType: 'custom',
        category: ComponentCategory.Database,
      },
      {
        id: 'generic_vector_database',
        label: 'Vector Database',
        iconType: 'custom',
        category: ComponentCategory.Database,
      },
    ],
  },
  {
    id: 'storage',
    label: 'Storage',
    category: ComponentCategory.Storage,
    components: [
      {
        id: 'generic_object_storage',
        label: 'Object Storage',
        iconType: 'custom',
        category: ComponentCategory.Storage,
      },
      {
        id: 'generic_block_storage',
        label: 'Block Storage',
        iconType: 'custom',
        category: ComponentCategory.Storage,
      },
      {
        id: 'generic_cache',
        label: 'Cache',
        iconType: 'custom',
        category: ComponentCategory.Storage,
      },
    ],
  },
  {
    id: 'networking',
    label: 'Networking',
    category: ComponentCategory.Networking,
    components: [
      {
        id: 'generic_load_balancer_l4',
        label: 'Load Balancer L4',
        iconType: 'custom',
        category: ComponentCategory.Networking,
      },
      {
        id: 'generic_load_balancer_l7',
        label: 'Load Balancer L7',
        iconType: 'custom',
        category: ComponentCategory.Networking,
      },
      {
        id: 'generic_api_gateway',
        label: 'API Gateway',
        iconType: 'custom',
        category: ComponentCategory.Networking,
      },
      {
        id: 'generic_cdn',
        label: 'CDN',
        iconType: 'custom',
        category: ComponentCategory.Networking,
      },
      {
        id: 'generic_dns',
        label: 'DNS',
        iconType: 'custom',
        category: ComponentCategory.Networking,
      },
      {
        id: 'generic_graphql',
        label: 'GraphQL',
        iconType: 'brand',
        category: ComponentCategory.Networking,
      },
      {
        id: 'generic_grpc',
        label: 'gRPC',
        iconType: 'brand',
        category: ComponentCategory.Networking,
      },
    ],
  },
  {
    id: 'messaging',
    label: 'Messaging & Streaming',
    category: ComponentCategory.Messaging,
    components: [
      {
        id: 'generic_kafka',
        label: 'Apache Kafka',
        iconType: 'brand',
        category: ComponentCategory.Messaging,
      },
      {
        id: 'generic_rabbitmq',
        label: 'RabbitMQ',
        iconType: 'brand',
        category: ComponentCategory.Messaging,
      },
      {
        id: 'generic_message_queue',
        label: 'Message Queue',
        iconType: 'custom',
        category: ComponentCategory.Messaging,
      },
      {
        id: 'generic_event_bus',
        label: 'Event Bus',
        iconType: 'custom',
        category: ComponentCategory.Messaging,
      },
    ],
  },
  {
    id: 'security',
    label: 'Security & Identity',
    category: ComponentCategory.Security,
    components: [
      {
        id: 'generic_auth_server',
        label: 'Auth Server',
        iconType: 'custom',
        category: ComponentCategory.Security,
      },
      {
        id: 'generic_rate_limiter',
        label: 'Rate Limiter',
        iconType: 'custom',
        category: ComponentCategory.Security,
      },
      {
        id: 'generic_ddos_protection',
        label: 'DDoS Protection',
        iconType: 'custom',
        category: ComponentCategory.Security,
      },
    ],
  },
  {
    id: 'observability',
    label: 'Observability',
    category: ComponentCategory.Observability,
    components: [
      {
        id: 'generic_prometheus',
        label: 'Prometheus',
        iconType: 'brand',
        category: ComponentCategory.Observability,
      },
      {
        id: 'generic_grafana',
        label: 'Grafana',
        iconType: 'brand',
        category: ComponentCategory.Observability,
      },
      {
        id: 'generic_metrics_collector',
        label: 'Metrics Collector',
        iconType: 'custom',
        category: ComponentCategory.Observability,
      },
      {
        id: 'generic_log_aggregator',
        label: 'Log Aggregator',
        iconType: 'custom',
        category: ComponentCategory.Observability,
      },
      {
        id: 'generic_distributed_tracing',
        label: 'Distributed Tracing',
        iconType: 'custom',
        category: ComponentCategory.Observability,
      },
      {
        id: 'generic_elasticsearch',
        label: 'Elasticsearch',
        iconType: 'brand',
        category: ComponentCategory.Observability,
      },
    ],
  },
  {
    id: 'aiml',
    label: 'AI / ML',
    category: ComponentCategory.AIML,
    components: [
      {
        id: 'generic_ml_model_server',
        label: 'ML Model Server',
        iconType: 'custom',
        category: ComponentCategory.AIML,
      },
      {
        id: 'generic_vector_database',
        label: 'Vector Database',
        iconType: 'custom',
        category: ComponentCategory.AIML,
      },
    ],
  },
  {
    id: 'client_edge',
    label: 'Client & Edge',
    category: ComponentCategory.ClientEdge,
    components: [
      {
        id: 'generic_web_browser',
        label: 'Web Browser',
        iconType: 'custom',
        category: ComponentCategory.ClientEdge,
      },
      {
        id: 'generic_mobile_client',
        label: 'Mobile Client',
        iconType: 'custom',
        category: ComponentCategory.ClientEdge,
      },
      {
        id: 'generic_iot_device',
        label: 'IoT Device',
        iconType: 'custom',
        category: ComponentCategory.ClientEdge,
      },
      {
        id: 'generic_cdn',
        label: 'CDN Edge',
        iconType: 'custom',
        category: ComponentCategory.ClientEdge,
      },
    ],
  },
];
