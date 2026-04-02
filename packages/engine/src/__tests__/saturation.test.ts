import { describe, it, expect } from 'vitest';
import { calculateSaturation } from '../saturationCalculator';
import type { CBREntry } from '@vexo/types';
import { ComponentCategory, SystemStatus } from '@vexo/types';

const mockCBR: CBREntry = {
  id: 'test',
  display_name: 'Test',
  category: ComponentCategory.Compute,
  generic_equivalent: null,
  capacity: { max_rps: 10000, latency_p50_ms: 10, latency_p99_ms: 50 },
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
  iconId: 'test',
  properties: [],
} as CBREntry;

describe('calculateSaturation', () => {
  it('healthy at 50% load', () => {
    const result = calculateSaturation(5000, mockCBR);
    expect(result.status).toBe(SystemStatus.Healthy);
    expect(result.saturation).toBeCloseTo(0.5, 1);
    // Multiplier at x=0.5: 1 + 0.2*0.5 + 1.8*0.25 = 1 + 0.1 + 0.45 = 1.55
    expect(result.latencyP50).toBeGreaterThan(10);
  });

  it('warning at 85% load', () => {
    const result = calculateSaturation(8500, mockCBR);
    expect(result.status).toBe(SystemStatus.Warning);
    expect(result.saturation).toBeCloseTo(0.85, 1);
    expect(result.latencyP50).toBeGreaterThan(mockCBR.capacity.latency_p50_ms);
  });

  it('critical at 98% load', () => {
    const result = calculateSaturation(9800, mockCBR);
    expect(result.status).toBe(SystemStatus.Critical);
    expect(result.latencyP50).toBeGreaterThan(mockCBR.capacity.latency_p50_ms * 2);
  });

  it('critical when over capacity', () => {
    const result = calculateSaturation(15000, mockCBR);
    expect(result.status).toBe(SystemStatus.Critical);
    expect(result.saturation).toBeGreaterThan(1.0);
  });

  it('returns correct currentRPS', () => {
    const result = calculateSaturation(7777, mockCBR);
    expect(result.currentRPS).toBe(7777);
  });
});
