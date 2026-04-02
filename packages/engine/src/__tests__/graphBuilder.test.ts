import { describe, it, expect } from 'vitest';
import { buildGraph } from '../graphBuilder';
import type { VexoNode, VexoEdge } from '@vexo/types';
import { ComponentCategory, SystemStatus } from '@vexo/types';

function makeNode(id: string): VexoNode {
  return {
    id,
    type: 'vexo',
    position: { x: 0, y: 0 },
    data: {
      componentId: id,
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

function makeEdge(source: string, target: string): VexoEdge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    data: { connectionType: 'SYNC_HTTP' as never, validationStatus: 'valid' },
  };
}

describe('buildGraph', () => {
  it('handles empty graph', () => {
    const g = buildGraph([], []);
    expect(g.sortedOrder).toHaveLength(0);
    expect(g.cycleDetected).toBe(false);
    expect(g.sourceNodes).toHaveLength(0);
  });

  it('handles single node', () => {
    const g = buildGraph([makeNode('A')], []);
    expect(g.sortedOrder).toEqual(['A']);
    expect(g.sourceNodes).toEqual(['A']);
    expect(g.cycleDetected).toBe(false);
  });

  it('topologically sorts a linear chain A→B→C', () => {
    const nodes = ['A', 'B', 'C'].map(makeNode);
    const edges = [makeEdge('A', 'B'), makeEdge('B', 'C')];
    const g = buildGraph(nodes, edges);
    expect(g.sortedOrder).toEqual(['A', 'B', 'C']);
    expect(g.sourceNodes).toEqual(['A']);
    expect(g.cycleDetected).toBe(false);
  });

  it('handles fan-out A→B, A→C', () => {
    const nodes = ['A', 'B', 'C'].map(makeNode);
    const edges = [makeEdge('A', 'B'), makeEdge('A', 'C')];
    const g = buildGraph(nodes, edges);
    expect(g.sortedOrder[0]).toBe('A');
    expect(g.sortedOrder).toContain('B');
    expect(g.sortedOrder).toContain('C');
    expect(g.sourceNodes).toEqual(['A']);
  });

  it('handles fan-in B→A, C→A', () => {
    const nodes = ['A', 'B', 'C'].map(makeNode);
    const edges = [makeEdge('B', 'A'), makeEdge('C', 'A')];
    const g = buildGraph(nodes, edges);
    expect(g.sortedOrder[2]).toBe('A');
    expect(g.sourceNodes).toContain('B');
    expect(g.sourceNodes).toContain('C');
  });

  it('detects a cycle A→B→C→A', () => {
    const nodes = ['A', 'B', 'C'].map(makeNode);
    const edges = [makeEdge('A', 'B'), makeEdge('B', 'C'), makeEdge('C', 'A')];
    const g = buildGraph(nodes, edges);
    expect(g.cycleDetected).toBe(true);
    expect(g.cycleNodeIds).toContain('A');
    expect(g.cycleNodeIds).toContain('B');
    expect(g.cycleNodeIds).toContain('C');
  });

  it('identifies source nodes in a complex graph', () => {
    const nodes = ['A', 'B', 'C', 'D'].map(makeNode);
    const edges = [makeEdge('A', 'C'), makeEdge('B', 'C'), makeEdge('C', 'D')];
    const g = buildGraph(nodes, edges);
    expect(g.sourceNodes).toContain('A');
    expect(g.sourceNodes).toContain('B');
    expect(g.sourceNodes).not.toContain('C');
    expect(g.sourceNodes).not.toContain('D');
  });
});
