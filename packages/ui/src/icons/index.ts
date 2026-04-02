import type { ComponentType } from 'react';
import type { IconProps } from './types';
import * as BrandIcons from './brands';
import * as CustomIcons from './custom';

export * from './types';
export * from './brands';
export * from './custom';

type IconComponent = ComponentType<IconProps>;

const iconMap: Record<string, IconComponent> = {
  // Brand icons
  redis: BrandIcons.RedisIcon,
  generic_redis: BrandIcons.RedisIcon,
  postgresql: BrandIcons.PostgreSQLIcon,
  generic_postgresql: BrandIcons.PostgreSQLIcon,
  kafka: BrandIcons.KafkaIcon,
  generic_kafka: BrandIcons.KafkaIcon,
  elasticsearch: BrandIcons.ElasticsearchIcon,
  generic_elasticsearch: BrandIcons.ElasticsearchIcon,
  mongodb: BrandIcons.MongoDBIcon,
  generic_mongodb: BrandIcons.MongoDBIcon,
  mysql: BrandIcons.MySQLIcon,
  generic_mysql: BrandIcons.MySQLIcon,
  nginx: BrandIcons.NginxIcon,
  generic_nginx: BrandIcons.NginxIcon,
  rabbitmq: BrandIcons.RabbitMQIcon,
  generic_rabbitmq: BrandIcons.RabbitMQIcon,
  graphql: BrandIcons.GraphQLIcon,
  generic_graphql: BrandIcons.GraphQLIcon,
  grpc: BrandIcons.GRPCIcon,
  generic_grpc: BrandIcons.GRPCIcon,
  docker: BrandIcons.DockerIcon,
  generic_docker: BrandIcons.DockerIcon,
  kubernetes: BrandIcons.KubernetesIcon,
  generic_kubernetes: BrandIcons.KubernetesIcon,
  prometheus: BrandIcons.PrometheusIcon,
  generic_prometheus: BrandIcons.PrometheusIcon,
  grafana: BrandIcons.GrafanaIcon,
  generic_grafana: BrandIcons.GrafanaIcon,
  terraform: BrandIcons.TerraformIcon,
  generic_terraform: BrandIcons.TerraformIcon,
  // Custom icons
  generic_web_server: CustomIcons.WebServerIcon,
  web_server: CustomIcons.WebServerIcon,
  generic_app_server: CustomIcons.AppServerIcon,
  app_server: CustomIcons.AppServerIcon,
  generic_microservice: CustomIcons.MicroserviceIcon,
  microservice: CustomIcons.MicroserviceIcon,
  generic_serverless: CustomIcons.ServerlessFunctionIcon,
  serverless_function: CustomIcons.ServerlessFunctionIcon,
  generic_vm: CustomIcons.VMInstanceIcon,
  vm_instance: CustomIcons.VMInstanceIcon,
  generic_load_balancer_l4: CustomIcons.LoadBalancerL4Icon,
  load_balancer_l4: CustomIcons.LoadBalancerL4Icon,
  generic_load_balancer_l7: CustomIcons.LoadBalancerL7Icon,
  load_balancer_l7: CustomIcons.LoadBalancerL7Icon,
  generic_api_gateway: CustomIcons.APIGatewayIcon,
  api_gateway: CustomIcons.APIGatewayIcon,
  generic_cdn: CustomIcons.CDNIcon,
  cdn: CustomIcons.CDNIcon,
  generic_dns: CustomIcons.DNSIcon,
  dns: CustomIcons.DNSIcon,
  generic_message_queue: CustomIcons.MessageQueueIcon,
  message_queue: CustomIcons.MessageQueueIcon,
  generic_event_bus: CustomIcons.EventBusIcon,
  event_bus: CustomIcons.EventBusIcon,
  generic_cache: CustomIcons.CacheIcon,
  cache: CustomIcons.CacheIcon,
  generic_object_storage: CustomIcons.ObjectStorageIcon,
  object_storage: CustomIcons.ObjectStorageIcon,
  generic_block_storage: CustomIcons.BlockStorageIcon,
  block_storage: CustomIcons.BlockStorageIcon,
  generic_data_warehouse: CustomIcons.DataWarehouseIcon,
  data_warehouse: CustomIcons.DataWarehouseIcon,
  generic_auth_server: CustomIcons.AuthServerIcon,
  auth_server: CustomIcons.AuthServerIcon,
  generic_rate_limiter: CustomIcons.RateLimiterIcon,
  rate_limiter: CustomIcons.RateLimiterIcon,
  generic_ddos_protection: CustomIcons.DDoSProtectionIcon,
  ddos_protection: CustomIcons.DDoSProtectionIcon,
  generic_metrics_collector: CustomIcons.MetricsCollectorIcon,
  metrics_collector: CustomIcons.MetricsCollectorIcon,
  generic_log_aggregator: CustomIcons.LogAggregatorIcon,
  log_aggregator: CustomIcons.LogAggregatorIcon,
  generic_distributed_tracing: CustomIcons.DistributedTracingIcon,
  distributed_tracing: CustomIcons.DistributedTracingIcon,
  generic_ml_model_server: CustomIcons.MLModelServerIcon,
  ml_model_server: CustomIcons.MLModelServerIcon,
  generic_vector_database: CustomIcons.VectorDatabaseIcon,
  vector_database: CustomIcons.VectorDatabaseIcon,
  generic_web_browser: CustomIcons.WebBrowserIcon,
  web_browser: CustomIcons.WebBrowserIcon,
  generic_mobile_client: CustomIcons.MobileClientIcon,
  mobile_client: CustomIcons.MobileClientIcon,
  generic_iot_device: CustomIcons.IoTDeviceIcon,
  iot_device: CustomIcons.IoTDeviceIcon,
};

// Category fallback icons
const categoryFallbacks: Record<string, IconComponent> = {
  Compute: CustomIcons.AppServerIcon,
  Database: CustomIcons.DataWarehouseIcon,
  Storage: CustomIcons.BlockStorageIcon,
  Networking: CustomIcons.WebServerIcon,
  Messaging: CustomIcons.MessageQueueIcon,
  Security: CustomIcons.AuthServerIcon,
  Observability: CustomIcons.MetricsCollectorIcon,
  AIML: CustomIcons.MLModelServerIcon,
  ClientEdge: CustomIcons.WebBrowserIcon,
};

export function getComponentIcon(componentId: string, category?: string): IconComponent {
  const key = componentId.toLowerCase();
  if (iconMap[key]) return iconMap[key];
  if (category && categoryFallbacks[category]) return categoryFallbacks[category];
  return CustomIcons.WebServerIcon;
}
