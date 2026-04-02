import { describe, it, expect } from 'vitest';
import { SOFT_WARNING_RULES } from '../softWarnings';
import { RuleEngine } from '../ruleSchema';
import type { VexoNode } from '@vexo/types';
import { ComponentCategory, SystemStatus } from '@vexo/types';

function makeNode(
  id: string,
  category: ComponentCategory,
  componentId = id,
  currentRPS = 0,
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
      metrics: { latencyP50: 0, latencyP99: 0, saturation: 0, currentRPS },
    },
  };
}

const engine = new RuleEngine(SOFT_WARNING_RULES);

describe('Soft Warning Rules', () => {
  it('sw-01: warns on App Server → App Server direct', () => {
    const result = engine.evaluate(
      makeNode('svc1', ComponentCategory.Compute, 'generic_app_server'),
      makeNode('svc2', ComponentCategory.Compute, 'generic_microservice'),
    );
    expect(result.warned).toBe(true);
    expect(result.ruleId).toBe('sw-01');
  });

  it('sw-02: warns on API Gateway → Database', () => {
    const result = engine.evaluate(
      makeNode('gw', ComponentCategory.Networking, 'generic_api_gateway'),
      makeNode('db', ComponentCategory.Database, 'generic_postgresql'),
    );
    expect(result.warned).toBe(true);
    expect(result.ruleId).toBe('sw-02');
  });

  it('sw-03: warns on WebSocket → SQL DB', () => {
    const result = engine.evaluate(
      makeNode('ws', ComponentCategory.Compute, 'generic_websocket_server'),
      makeNode('db', ComponentCategory.Database, 'generic_postgresql'),
    );
    expect(result.warned).toBe(true);
    expect(result.ruleId).toBe('sw-03');
  });

  it('sw-04: warns on Kubernetes → PostgreSQL direct', () => {
    const result = engine.evaluate(
      makeNode('k8s', ComponentCategory.Compute, 'generic_kubernetes'),
      makeNode('db', ComponentCategory.Database, 'generic_postgresql'),
    );
    expect(result.warned).toBe(true);
    expect(result.ruleId).toBe('sw-04');
  });

  it('sw-06: warns when DB is receiving >10K RPS', () => {
    const result = engine.evaluate(
      makeNode('app', ComponentCategory.Compute, 'generic_app_server'),
      makeNode('db', ComponentCategory.Database, 'generic_postgresql', 15000),
    );
    expect(result.warned).toBe(true);
    expect(result.ruleId).toBe('sw-06');
  });

  it('allows valid App Server → Load Balancer', () => {
    const result = engine.evaluate(
      makeNode('app', ComponentCategory.Compute, 'generic_app_server'),
      makeNode('lb', ComponentCategory.Networking, 'generic_load_balancer_l4'),
    );
    expect(result.blocked).toBe(false);
    expect(result.warned).toBe(false);
  });
});
