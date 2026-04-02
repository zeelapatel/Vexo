import { ConnectionType } from '@vexo/types';
import type { CBREntry } from '@vexo/types';

export interface TransferInput {
  upstreamLoad: number; // RPS
  sourceCBR: CBREntry | undefined;
  targetCBR: CBREntry | undefined;
  config?: Record<string, number | string | boolean>;
}

export interface TransferResult {
  propagatedLoad: number; // RPS to downstream
  addedLatency: number; // ms added by this connection
  queueDepth?: number; // for async connections
  edgeStatus: 'ok' | 'warn' | 'critical';
}

export type TransferFunction = (input: TransferInput) => TransferResult;

function clampStatus(saturation: number): TransferResult['edgeStatus'] {
  if (saturation > 0.9) return 'critical';
  if (saturation > 0.7) return 'warn';
  return 'ok';
}

const syncHttp: TransferFunction = ({ upstreamLoad, targetCBR }) => {
  const maxRps = targetCBR?.capacity.max_rps ?? Infinity;
  const saturation = upstreamLoad / maxRps;
  const baseLatency = targetCBR?.capacity.latency_p50_ms ?? 1;
  // Quadratic latency growth with saturation
  const addedLatency = baseLatency * (1 + saturation * saturation * 3);
  return { propagatedLoad: upstreamLoad, addedLatency, edgeStatus: clampStatus(saturation) };
};

const syncGrpc: TransferFunction = ({ upstreamLoad, targetCBR }) => {
  // gRPC is more efficient — lower per-request overhead
  const maxRps = targetCBR?.capacity.max_rps ?? Infinity;
  const saturation = upstreamLoad / maxRps;
  const baseLatency = (targetCBR?.capacity.latency_p50_ms ?? 1) * 0.6; // gRPC overhead ~40% less
  const addedLatency = baseLatency * (1 + saturation * saturation * 2);
  return { propagatedLoad: upstreamLoad, addedLatency, edgeStatus: clampStatus(saturation) };
};

const asyncQueue: TransferFunction = ({ upstreamLoad, targetCBR, config }) => {
  const consumerThroughput =
    (config?.['consumer_throughput'] as number | undefined) ??
    (targetCBR?.capacity.max_rps ?? 1000);
  const propagatedLoad = Math.min(upstreamLoad, consumerThroughput);
  const queueDepth = Math.max(0, upstreamLoad - consumerThroughput);
  // Queue wait = queue_depth / consumer_throughput seconds
  const addedLatency = queueDepth > 0 ? (queueDepth / consumerThroughput) * 1000 : 5; // ms
  const saturation = upstreamLoad / consumerThroughput;
  return { propagatedLoad, addedLatency, queueDepth, edgeStatus: clampStatus(saturation) };
};

const asyncStream: TransferFunction = ({ upstreamLoad, targetCBR, config }) => {
  const consumerThroughput =
    (config?.['consumer_throughput'] as number | undefined) ??
    (targetCBR?.capacity.max_rps ?? 5000);
  const propagatedLoad = Math.min(upstreamLoad, consumerThroughput);
  const lag = Math.max(0, upstreamLoad - consumerThroughput);
  const addedLatency = lag > 0 ? (lag / consumerThroughput) * 500 : 2;
  const saturation = upstreamLoad / consumerThroughput;
  return { propagatedLoad, addedLatency, queueDepth: lag, edgeStatus: clampStatus(saturation) };
};

const dbRead: TransferFunction = ({ upstreamLoad, targetCBR, config }) => {
  const readRatio = (config?.['read_ratio'] as number | undefined) ?? 0.8;
  const propagatedLoad = upstreamLoad * readRatio;
  const maxRps = targetCBR?.capacity.max_rps ?? 5000;
  const saturation = propagatedLoad / maxRps;
  const baseLatency = targetCBR?.capacity.latency_p50_ms ?? 5;
  const addedLatency = baseLatency * (1 + saturation * saturation * 4);
  return { propagatedLoad, addedLatency, edgeStatus: clampStatus(saturation) };
};

const dbWrite: TransferFunction = ({ upstreamLoad, targetCBR, config }) => {
  const writeRatio = (config?.['write_ratio'] as number | undefined) ?? 0.2;
  const propagatedLoad = upstreamLoad * writeRatio;
  const maxRps = (targetCBR?.capacity.max_rps ?? 5000) * 0.5; // writes ~2x cost of reads
  const saturation = propagatedLoad / maxRps;
  const baseLatency = (targetCBR?.capacity.latency_p50_ms ?? 5) * 2;
  const replicationFanout = (config?.['replication_factor'] as number | undefined) ?? 1;
  const addedLatency = baseLatency * replicationFanout * (1 + saturation * saturation * 5);
  return { propagatedLoad, addedLatency, edgeStatus: clampStatus(saturation) };
};

const dbReplication: TransferFunction = ({ upstreamLoad, targetCBR }) => {
  const replicationLatency = targetCBR?.capacity.latency_p50_ms ?? 5;
  // Replication is async, doesn't block — adds small overhead
  return {
    propagatedLoad: upstreamLoad * 0.1,
    addedLatency: replicationLatency * 0.5,
    edgeStatus: 'ok',
  };
};

const cacheRead: TransferFunction = ({ upstreamLoad, targetCBR, config }) => {
  const hitRate = (config?.['hit_rate'] as number | undefined) ?? 0.9;
  const originLoad = upstreamLoad * (1 - hitRate);
  const cacheLatency = targetCBR?.capacity.latency_p50_ms ?? 1;
  const addedLatency =
    cacheLatency * hitRate + cacheLatency * 50 * (1 - hitRate); // cache miss = origin round trip
  return {
    propagatedLoad: originLoad,
    addedLatency,
    edgeStatus:
      originLoad > (targetCBR?.capacity.max_rps ?? Infinity) * 0.9 ? 'critical' : 'ok',
  };
};

const cacheWrite: TransferFunction = ({ upstreamLoad, targetCBR }) => {
  const maxRps = targetCBR?.capacity.max_rps ?? 10000;
  const saturation = upstreamLoad / maxRps;
  const addedLatency = (targetCBR?.capacity.latency_p50_ms ?? 1) * (1 + saturation);
  return { propagatedLoad: upstreamLoad, addedLatency, edgeStatus: clampStatus(saturation) };
};

const cdnOrigin: TransferFunction = ({ upstreamLoad, config }) => {
  const cacheHitRate = (config?.['cache_hit_rate'] as number | undefined) ?? 0.85;
  const originLoad = upstreamLoad * (1 - cacheHitRate);
  return { propagatedLoad: originLoad, addedLatency: 1, edgeStatus: 'ok' };
};

const dnsResolution: TransferFunction = ({ upstreamLoad }) => {
  // DNS is cached; only a fraction of requests need actual resolution
  const actualLookups = upstreamLoad * 0.01;
  return { propagatedLoad: actualLookups, addedLatency: 2, edgeStatus: 'ok' };
};

const authCheck: TransferFunction = ({ upstreamLoad, targetCBR, config }) => {
  const tokenCacheHitRate = (config?.['token_cache_hit_rate'] as number | undefined) ?? 0.95;
  const authLatency = targetCBR?.capacity.latency_p50_ms ?? 5;
  const addedLatency =
    authLatency * tokenCacheHitRate + authLatency * 10 * (1 - tokenCacheHitRate);
  const verificationLoad = upstreamLoad * (1 - tokenCacheHitRate);
  return { propagatedLoad: verificationLoad, addedLatency, edgeStatus: 'ok' };
};

const healthCheck: TransferFunction = ({ config }) => {
  const probeIntervalS = (config?.['probe_interval_s'] as number | undefined) ?? 30;
  const probeRps = 1 / probeIntervalS;
  return { propagatedLoad: probeRps, addedLatency: 0, edgeStatus: 'ok' };
};

export const transferFunctions: Record<ConnectionType, TransferFunction> = {
  [ConnectionType.SYNC_HTTP]: syncHttp,
  [ConnectionType.SYNC_GRPC]: syncGrpc,
  [ConnectionType.ASYNC_QUEUE]: asyncQueue,
  [ConnectionType.ASYNC_STREAM]: asyncStream,
  [ConnectionType.DB_READ]: dbRead,
  [ConnectionType.DB_WRITE]: dbWrite,
  [ConnectionType.DB_REPLICATION]: dbReplication,
  [ConnectionType.CACHE_READ]: cacheRead,
  [ConnectionType.CACHE_WRITE]: cacheWrite,
  [ConnectionType.CDN_ORIGIN]: cdnOrigin,
  [ConnectionType.DNS_RESOLUTION]: dnsResolution,
  [ConnectionType.AUTH_CHECK]: authCheck,
  [ConnectionType.HEALTH_CHECK]: healthCheck,
};

export function getTransferFunction(type: ConnectionType): TransferFunction {
  return transferFunctions[type] ?? syncHttp;
}
