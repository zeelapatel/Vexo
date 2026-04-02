import { describe, it, expect } from 'vitest';
import { ANTI_PATTERNS_1 } from '../patterns1';
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

const scanner = new AntiPatternScanner(ANTI_PATTERNS_1);
const emptyRegistry = new Map();

describe('Anti-Patterns 1-10', () => {
  it('ap-01: detects Client → Database', () => {
    const nodes = [
      makeNode('browser', ComponentCategory.ClientEdge, 'generic_web_browser'),
      makeNode('db', ComponentCategory.Database, 'generic_postgresql'),
    ];
    const edges = [makeEdge('browser', 'db')];
    const graph = buildGraph(nodes, edges);
    const matches = scanner.scan(graph, emptyRegistry);
    expect(matches.some((m) => m.patternId === 'ap-01')).toBe(true);
  });

  it('ap-01: auto-fix returns gateway insertion', () => {
    const pattern = ANTI_PATTERNS_1.find((p) => p.id === 'ap-01')!;
    const nodes = [
      makeNode('browser', ComponentCategory.ClientEdge, 'generic_web_browser'),
      makeNode('db', ComponentCategory.Database, 'generic_postgresql'),
    ];
    const graph = buildGraph(nodes, [makeEdge('browser', 'db')]);
    const mutation = pattern.autoFix!(graph);
    expect(mutation.addNodes?.length).toBe(1);
    expect(mutation.removeEdges?.length).toBe(1);
    expect(mutation.addEdges?.length).toBe(2);
  });

  it('ap-07: detects queue without DLQ', () => {
    const nodes = [
      makeNode('app', ComponentCategory.Compute, 'generic_app_server'),
      makeNode('queue', ComponentCategory.Messaging, 'generic_message_queue'),
    ];
    const edges = [makeEdge('app', 'queue')];
    const graph = buildGraph(nodes, edges);
    const matches = scanner.scan(graph, emptyRegistry);
    expect(matches.some((m) => m.patternId === 'ap-07')).toBe(true);
  });

  it('ap-07: no match when DLQ is present', () => {
    const nodes = [
      makeNode('app', ComponentCategory.Compute, 'generic_app_server'),
      makeNode('queue', ComponentCategory.Messaging, 'generic_message_queue'),
      makeNode('dlq', ComponentCategory.Messaging, 'generic_dlq'),
    ];
    const edges = [makeEdge('app', 'queue'), makeEdge('queue', 'dlq')];
    const graph = buildGraph(nodes, edges);
    const matches = scanner.scan(graph, emptyRegistry);
    expect(matches.some((m) => m.patternId === 'ap-07')).toBe(false);
  });
});
