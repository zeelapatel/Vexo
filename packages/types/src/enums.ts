export enum ComponentCategory {
  Compute = 'Compute',
  Database = 'Database',
  Storage = 'Storage',
  Networking = 'Networking',
  Messaging = 'Messaging',
  Security = 'Security',
  Observability = 'Observability',
  AIML = 'AIML',
  ClientEdge = 'ClientEdge',
}

export enum ConnectionType {
  SYNC_HTTP = 'SYNC_HTTP',
  SYNC_GRPC = 'SYNC_GRPC',
  ASYNC_QUEUE = 'ASYNC_QUEUE',
  ASYNC_STREAM = 'ASYNC_STREAM',
  DB_READ = 'DB_READ',
  DB_WRITE = 'DB_WRITE',
  DB_REPLICATION = 'DB_REPLICATION',
  CACHE_READ = 'CACHE_READ',
  CACHE_WRITE = 'CACHE_WRITE',
  CDN_ORIGIN = 'CDN_ORIGIN',
  DNS_RESOLUTION = 'DNS_RESOLUTION',
  AUTH_CHECK = 'AUTH_CHECK',
  HEALTH_CHECK = 'HEALTH_CHECK',
}

export enum SystemStatus {
  Healthy = 'Healthy',
  Warning = 'Warning',
  Critical = 'Critical',
  Idle = 'Idle',
}
