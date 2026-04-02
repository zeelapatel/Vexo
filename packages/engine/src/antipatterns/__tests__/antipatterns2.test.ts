import { describe, it, expect } from 'vitest';
import { ANTI_PATTERNS_2 } from '../patterns2';
import { AntiPatternScanner } from '../schema';
import { buildGraph } from '../../graphBuilder';
import type { VexoNode, VexoEdge } from '@vexo/types';
import { ComponentCategory, SystemStatus } from '@vexo/types';

function makeNode(
  id: string,
  category: ComponentCategory,
  componentId = id,
  extra: Record<string, unknown> = {},
): VexoNode {
  return {
    id,
    type: 'vexo',
    position: { x: 0, y: 0 },
    data: {
      componentId,
      label: id,
      category,
      cloudVariant: null,
      iconType: 'custom',
      iconSrc: id,
      status: SystemStatus.Idle,
      metrics: { latencyP50: 0, latencyP99: 0, saturation: 0, currentRPS: 0 },
      ...extra,
    },
  };
}

function makeEdge(source: string, target: string, connectionType = 'SYNC_HTTP'): VexoEdge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    data: { connectionType: connectionType as never, validationStatus: 'valid' },
  };
}

const scanner = new AntiPatternScanner(ANTI_PATTERNS_2);
const emptyRegistry = new Map();

describe('Anti-Patterns 11-20', () => {
  it('ap-12: detects load balancer with no health check', () => {
    const nodes = [
      makeNode('lb', ComponentCategory.Networking, 'generic_load_balancer_l7'),
      makeNode('app', ComponentCategory.Compute, 'generic_app_server'),
    ];
    const edges = [makeEdge('lb', 'app', 'SYNC_HTTP')];
    const graph = buildGraph(nodes, edges);
    const matches = scanner.scan(graph, emptyRegistry);
    expect(matches.some((m) => m.patternId === 'ap-12')).toBe(true);
  });

  it('ap-13: detects API gateway without rate limiter', () => {
    const nodes = [
      makeNode('browser', ComponentCategory.ClientEdge, 'generic_web_browser'),
      makeNode('gw', ComponentCategory.Networking, 'generic_api_gateway'),
    ];
    const edges = [makeEdge('browser', 'gw')];
    const graph = buildGraph(nodes, edges);
    const matches = scanner.scan(graph, emptyRegistry);
    expect(matches.some((m) => m.patternId === 'ap-13')).toBe(true);
  });

  it('ap-20: detects write amplification to 3 DBs', () => {
    const nodes = [
      makeNode('app', ComponentCategory.Compute, 'generic_app_server'),
      makeNode('db1', ComponentCategory.Database, 'generic_postgresql'),
      makeNode('db2', ComponentCategory.Database, 'generic_mysql'),
      makeNode('db3', ComponentCategory.Database, 'generic_mongodb'),
    ];
    const edges = [
      makeEdge('app', 'db1', 'DB_WRITE'),
      makeEdge('app', 'db2', 'DB_WRITE'),
      makeEdge('app', 'db3', 'DB_WRITE'),
    ];
    const graph = buildGraph(nodes, edges);
    const matches = scanner.scan(graph, emptyRegistry);
    expect(matches.some((m) => m.patternId === 'ap-20')).toBe(true);
  });
});
