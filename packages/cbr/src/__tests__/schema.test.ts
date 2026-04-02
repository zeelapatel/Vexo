import { describe, it, expect } from 'vitest';
import { validateCBREntry } from '../schema';
import { ComponentCategory } from '@vexo/types';

const validEntry = {
  id: 'generic_web_server',
  display_name: 'Web Server',
  category: ComponentCategory.Compute,
  generic_equivalent: null,
  capacity: { max_rps: 10000, latency_p50_ms: 5, latency_p99_ms: 25 },
  saturation_curve: { coefficients: [1, 0.5, 2], description: 'Quadratic growth' },
  cold_start: null,
  throttle_behaviour: 'shed' as const,
  limits: {},
  az_config: null,
  failure_modes: [
    {
      name: 'OOM',
      trigger_condition: 'memory > 95%',
      impact: 'crash',
      recovery_time_ms: 5000,
    },
  ],
  cost_model: null,
  source_citations: [],
  last_validated: '2026-01-01',
  iconType: 'custom' as const,
  iconId: 'web_server',
  properties: [
    {
      key: 'replicas',
      label: 'Replicas',
      type: 'number' as const,
      default: 2,
      min: 1,
      max: 100,
      description: 'Number of replicas',
    },
  ],
};

describe('validateCBREntry', () => {
  it('passes a valid entry', () => {
    const result = validateCBREntry(validEntry);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects entry missing id', () => {
    const { id: _, ...entry } = validEntry;
    const result = validateCBREntry(entry);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('id'))).toBe(true);
  });

  it('rejects entry missing display_name', () => {
    const { display_name: _, ...entry } = validEntry;
    const result = validateCBREntry(entry);
    expect(result.valid).toBe(false);
  });

  it('rejects entry with invalid capacity max_rps', () => {
    const result = validateCBREntry({
      ...validEntry,
      capacity: { max_rps: -1, latency_p50_ms: 5, latency_p99_ms: 25 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('max_rps'))).toBe(true);
  });

  it('rejects entry with empty saturation coefficients', () => {
    const result = validateCBREntry({
      ...validEntry,
      saturation_curve: { coefficients: [], description: '' },
    });
    expect(result.valid).toBe(false);
  });

  it('rejects entry with no failure modes', () => {
    const result = validateCBREntry({ ...validEntry, failure_modes: [] });
    expect(result.valid).toBe(false);
  });
});
