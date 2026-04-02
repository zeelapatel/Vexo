import type { CBREntry } from '@vexo/types';

const REQUIRED_FIELDS: (keyof CBREntry)[] = [
  'id',
  'display_name',
  'category',
  'capacity',
  'saturation_curve',
  'throttle_behaviour',
  'limits',
  'failure_modes',
  'source_citations',
  'last_validated',
  'iconType',
  'iconId',
  'properties',
];

export function validateCBREntry(entry: Partial<CBREntry>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (entry[field] === undefined || entry[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (entry.capacity) {
    const { max_rps, latency_p50_ms, latency_p99_ms } = entry.capacity;
    if (typeof max_rps !== 'number' || max_rps <= 0)
      errors.push('capacity.max_rps must be a positive number');
    if (typeof latency_p50_ms !== 'number' || latency_p50_ms <= 0)
      errors.push('capacity.latency_p50_ms must be a positive number');
    if (typeof latency_p99_ms !== 'number' || latency_p99_ms <= 0)
      errors.push('capacity.latency_p99_ms must be a positive number');
  }

  if (entry.saturation_curve) {
    if (
      !Array.isArray(entry.saturation_curve.coefficients) ||
      entry.saturation_curve.coefficients.length === 0
    ) {
      errors.push('saturation_curve.coefficients must be a non-empty array');
    }
  }

  if (entry.failure_modes && Array.isArray(entry.failure_modes)) {
    if (entry.failure_modes.length < 1) {
      errors.push('failure_modes must have at least 1 entry');
    }
  }

  if (entry.properties && Array.isArray(entry.properties)) {
    if (entry.properties.length < 1) {
      errors.push('properties must have at least 1 entry');
    }
  }

  return { valid: errors.length === 0, errors };
}
