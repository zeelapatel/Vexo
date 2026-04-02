import { ConnectionType, ComponentCategory } from '@vexo/types';

interface InferenceInput {
  sourceCategory: ComponentCategory;
  sourceComponentId: string;
  targetCategory: ComponentCategory;
  targetComponentId: string;
}

export function inferConnectionType({
  sourceCategory,
  sourceComponentId,
  targetCategory,
  targetComponentId,
}: InferenceInput): ConnectionType {
  // Auth target → always AUTH_CHECK
  if (targetCategory === ComponentCategory.Security) return ConnectionType.AUTH_CHECK;

  // Messaging → ASYNC_QUEUE or ASYNC_STREAM
  if (targetCategory === ComponentCategory.Messaging) {
    if (
      targetComponentId.includes('kafka') ||
      targetComponentId.includes('stream') ||
      targetComponentId.includes('pulsar')
    ) {
      return ConnectionType.ASYNC_STREAM;
    }
    return ConnectionType.ASYNC_QUEUE;
  }

  // From messaging → downstream consumer
  if (sourceCategory === ComponentCategory.Messaging) return ConnectionType.ASYNC_QUEUE;

  // Cache targets
  if (
    targetComponentId.includes('cache') ||
    targetComponentId.includes('redis')
  ) {
    return ConnectionType.CACHE_READ;
  }

  // Database targets
  if (targetCategory === ComponentCategory.Database) {
    if (
      targetComponentId.includes('replication') ||
      targetComponentId.includes('replica')
    ) {
      return ConnectionType.DB_REPLICATION;
    }
    return ConnectionType.DB_READ;
  }

  // CDN → origin
  if (sourceComponentId.includes('cdn')) return ConnectionType.CDN_ORIGIN;

  // DNS
  if (targetComponentId.includes('dns')) return ConnectionType.DNS_RESOLUTION;

  // Health checks
  if (
    targetComponentId.includes('health') ||
    targetComponentId.includes('monitor')
  ) {
    return ConnectionType.HEALTH_CHECK;
  }

  // gRPC server targets
  if (targetComponentId.includes('grpc')) return ConnectionType.SYNC_GRPC;

  // Default: HTTP
  return ConnectionType.SYNC_HTTP;
}

export const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  [ConnectionType.SYNC_HTTP]: 'HTTP',
  [ConnectionType.SYNC_GRPC]: 'gRPC',
  [ConnectionType.ASYNC_QUEUE]: 'QUEUE',
  [ConnectionType.ASYNC_STREAM]: 'STREAM',
  [ConnectionType.DB_READ]: 'DB_R',
  [ConnectionType.DB_WRITE]: 'DB_W',
  [ConnectionType.DB_REPLICATION]: 'DB_REP',
  [ConnectionType.CACHE_READ]: 'CACHE',
  [ConnectionType.CACHE_WRITE]: 'C_W',
  [ConnectionType.CDN_ORIGIN]: 'CDN',
  [ConnectionType.DNS_RESOLUTION]: 'DNS',
  [ConnectionType.AUTH_CHECK]: 'AUTH',
  [ConnectionType.HEALTH_CHECK]: 'HEALTH',
};
