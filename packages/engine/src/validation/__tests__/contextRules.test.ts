import { describe, it, expect } from 'vitest';
import { CONTEXT_RULES } from '../contextRules';
import { RuleEngine } from '../ruleSchema';
import type { VexoNode } from '@vexo/types';
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

const engine = new RuleEngine(CONTEXT_RULES);

describe('Context Rules', () => {
  it('ctx-01: blocks Serverless → RDS when VPC disabled', () => {
    const result = engine.evaluate(
      makeNode('fn', ComponentCategory.Compute, 'generic_serverless', { vpc_enabled: false }),
      makeNode('db', ComponentCategory.Database, 'generic_postgresql'),
    );
    expect(result.blocked).toBe(true);
    expect(result.ruleId).toBe('ctx-01');
  });

  it('ctx-01: allows Serverless → RDS when VPC enabled', () => {
    const result = engine.evaluate(
      makeNode('fn', ComponentCategory.Compute, 'generic_serverless', { vpc_enabled: true }),
      makeNode('db', ComponentCategory.Database, 'generic_postgresql'),
    );
    expect(result.blocked).toBe(false);
  });

  it('ctx-03: blocks L7 LB → L7 LB', () => {
    const result = engine.evaluate(
      makeNode('lb1', ComponentCategory.Networking, 'generic_load_balancer_l7'),
      makeNode('lb2', ComponentCategory.Networking, 'generic_load_balancer_l7'),
    );
    expect(result.blocked).toBe(true);
  });

  it('ctx-04: warns CDN → App Server', () => {
    const result = engine.evaluate(
      makeNode('cdn', ComponentCategory.Networking, 'generic_cdn'),
      makeNode('app', ComponentCategory.Compute, 'generic_app_server'),
    );
    expect(result.warned).toBe(true);
    expect(result.ruleId).toBe('ctx-04');
  });
});
