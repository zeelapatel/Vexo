import { describe, it, expect } from 'vitest';
import { HARD_BLOCK_RULES } from '../hardBlocks';
import { RuleEngine } from '../ruleSchema';
import type { VexoNode } from '@vexo/types';
import { ComponentCategory, SystemStatus } from '@vexo/types';

function makeNode(id: string, category: ComponentCategory, componentId = id): VexoNode {
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
    },
  };
}

const engine = new RuleEngine(HARD_BLOCK_RULES);

describe('Hard Block Rules', () => {
  it('hb-01: blocks Client → Database', () => {
    const result = engine.evaluate(
      makeNode('browser', ComponentCategory.ClientEdge, 'generic_web_browser'),
      makeNode('db', ComponentCategory.Database, 'generic_postgresql'),
    );
    expect(result.blocked).toBe(true);
    expect(result.ruleId).toBe('hb-01');
  });

  it('hb-02: blocks CDN → Database', () => {
    const result = engine.evaluate(
      makeNode('cdn', ComponentCategory.Networking, 'generic_cdn'),
      makeNode('db', ComponentCategory.Database, 'generic_postgresql'),
    );
    expect(result.blocked).toBe(true);
    expect(result.ruleId).toBe('hb-02');
  });

  it('hb-03: blocks DNS → Message Queue', () => {
    const result = engine.evaluate(
      makeNode('dns', ComponentCategory.Networking, 'generic_dns'),
      makeNode('queue', ComponentCategory.Messaging, 'generic_message_queue'),
    );
    expect(result.blocked).toBe(true);
    expect(result.ruleId).toBe('hb-03');
  });

  it('hb-04: blocks Object Storage → Load Balancer', () => {
    const result = engine.evaluate(
      makeNode('s3', ComponentCategory.Storage, 'generic_object_storage'),
      makeNode('lb', ComponentCategory.Networking, 'generic_load_balancer_l7'),
    );
    expect(result.blocked).toBe(true);
    expect(result.ruleId).toBe('hb-04');
  });

  it('hb-05: blocks L7 LB → L7 LB', () => {
    const result = engine.evaluate(
      makeNode('lb1', ComponentCategory.Networking, 'generic_load_balancer_l7'),
      makeNode('lb2', ComponentCategory.Networking, 'generic_load_balancer_l7'),
    );
    expect(result.blocked).toBe(true);
    expect(result.ruleId).toBe('hb-05');
  });

  it('hb-06: blocks Metrics Collector → App Server', () => {
    const result = engine.evaluate(
      makeNode('prom', ComponentCategory.Observability, 'generic_prometheus'),
      makeNode('app', ComponentCategory.Compute, 'generic_app_server'),
    );
    expect(result.blocked).toBe(true);
    expect(result.ruleId).toBe('hb-06');
  });

  it('hb-07: blocks DLQ → External Client', () => {
    const result = engine.evaluate(
      makeNode('dlq', ComponentCategory.Messaging, 'generic_dlq'),
      makeNode('browser', ComponentCategory.ClientEdge, 'generic_web_browser'),
    );
    expect(result.blocked).toBe(true);
    expect(result.ruleId).toBe('hb-07');
  });

  it('allows valid connections (App Server → Database)', () => {
    const result = engine.evaluate(
      makeNode('app', ComponentCategory.Compute, 'generic_app_server'),
      makeNode('db', ComponentCategory.Database, 'generic_postgresql'),
    );
    expect(result.blocked).toBe(false);
  });
});
