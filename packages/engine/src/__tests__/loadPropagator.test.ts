import { describe, it, expect } from 'vitest';
import { propagateLoad } from '../loadPropagator';
import { buildGraph } from '../graphBuilder';
import type { VexoNode, VexoEdge, CBREntry } from '@vexo/types';
import { ComponentCategory, SystemStatus, ConnectionType } from '@vexo/types';

function makeNode(id: string, componentId = id): VexoNode {
  return {
    id,
    type: 'vexo',
    position: { x: 0, y: 0 },
    data: {
      componentId,
      label: id,
      category: ComponentCategory.Compute,
      cloudVariant: null,
      iconType: 'custom',
      iconSrc: id,
      status: SystemStatus.Idle,
      metrics: { latencyP50: 0, latencyP99: 0, saturation: 0, currentRPS: 0 },
    },
  };
}

function makeEdge(
  source: string,
  target: string,
  type: ConnectionType = ConnectionType.SYNC_HTTP,
): VexoEdge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    data: { connectionType: type, validationStatus: 'valid' },
  };
}

function makeCBR(id: string, maxRps = 100000): CBREntry {
  return {
    id,
    display_name: id,
    category: ComponentCategory.Compute,
    generic_equivalent: null,
    capacity: { max_rps: maxRps, latency_p50_ms: 5, latency_p99_ms: 25 },
    saturation_curve: { coefficients: [1, 0.2, 1.8], description: '' },
    cold_start: null,
    throttle_behaviour: 'shed',
    limits: {},
    az_config: null,
    failure_modes: [],
    cost_model: null,
    source_citations: [],
    last_validated: '2026-01-01',
    iconType: 'custom',
    iconId: id,
    properties: [],
  } as CBREntry;
}

describe('propagateLoad', () => {
  it('single source node receives entryQPS', () => {
    const nodes = [makeNode('A')];
    const graph = buildGraph(nodes, []);
    const registry = new Map([['A', makeCBR('A')]]);
    const results = propagateLoad(graph, 10000, registry);
    expect(results.get('A')?.incomingLoad).toBe(10000);
  });

  it('propagates through a linear chain A→B→C', () => {
    const nodes = ['A', 'B', 'C'].map(makeNode);
    const edges = [makeEdge('A', 'B'), makeEdge('B', 'C')];
    const graph = buildGraph(nodes, edges);
    const registry = new Map(['A', 'B', 'C'].map((id) => [id, makeCBR(id)]));
    const results = propagateLoad(graph, 10000, registry);
    expect(results.get('A')?.incomingLoad).toBe(10000);
    expect(results.get('B')?.incomingLoad).toBeGreaterThan(0);
    expect(results.get('C')?.incomingLoad).toBeGreaterThan(0);
  });

  it('fan-out splits load evenly to 3 nodes', () => {
    const nodes = ['A', 'B', 'C', 'D'].map(makeNode);
    const edges = [makeEdge('A', 'B'), makeEdge('A', 'C'), makeEdge('A', 'D')];
    const graph = buildGraph(nodes, edges);
    const registry = new Map(['A', 'B', 'C', 'D'].map((id) => [id, makeCBR(id)]));
    const results = propagateLoad(graph, 9000, registry);
    expect(results.get('B')?.incomingLoad).toBeCloseTo(3000, 0);
    expect(results.get('C')?.incomingLoad).toBeCloseTo(3000, 0);
    expect(results.get('D')?.incomingLoad).toBeCloseTo(3000, 0);
  });

  it('cache edge (90% hit rate) reduces origin load', () => {
    const cacheNode = makeNode('cache', 'generic_redis');
    const originNode = makeNode('origin', 'generic_web_server');
    const edge = makeEdge('cache', 'origin', ConnectionType.CACHE_READ);
    const graph = buildGraph([cacheNode, originNode], [edge]);
    // CACHE_READ with default 90% hit rate → only 10% reaches origin
    const registry = new Map([
      ['generic_redis', makeCBR('generic_redis', 100000)],
      ['generic_web_server', makeCBR('generic_web_server', 100000)],
    ]);
    const results = propagateLoad(graph, 10000, registry);
    const originLoad = results.get('origin')?.incomingLoad ?? 0;
    // Should be ~10% of 10000 = 1000 (allow ±20% tolerance)
    expect(originLoad).toBeLessThan(2000);
    expect(originLoad).toBeGreaterThan(500);
  });
});
