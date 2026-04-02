import type { ComponentCategory } from './enums';

export interface SaturationCurve {
  /** Polynomial coefficients [a0, a1, a2, ...] where f(load_pct) = a0 + a1*x + a2*x^2 + ...
   *  x is load as decimal (0.0–1.0), output is latency multiplier */
  coefficients: number[];
  description: string;
}

export interface FailureMode {
  name: string;
  trigger_condition: string;
  impact: string;
  recovery_time_ms: number;
}

export interface ColdStartConfig {
  base_latency_ms: number;
  runtime_overrides?: Record<string, number>;
  vpc_penalty_ms?: number;
}

export interface AZConfig {
  min_az: number;
  max_az: number;
  cross_az_latency_ms: number;
}

export interface CostModel {
  unit: string;
  base_cost_usd: number;
  scale_factor: number;
}

export type ComponentPropertyType = 'number' | 'string' | 'boolean' | 'select';

export interface ComponentProperty {
  key: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: ComponentPropertyType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: any;
  min?: number;
  max?: number;
  options?: string[];
  unit?: string;
  description: string;
}

export interface CapacityConfig {
  max_rps: number;
  latency_p50_ms: number;
  latency_p99_ms: number;
}

export interface CBREntry {
  id: string;
  display_name: string;
  category: ComponentCategory;
  generic_equivalent: string | null;
  capacity: CapacityConfig;
  saturation_curve: SaturationCurve;
  cold_start: ColdStartConfig | null;
  throttle_behaviour: 'queue' | 'reject_429' | 'shed';
  limits: Record<string, number | string>;
  az_config: AZConfig | null;
  failure_modes: FailureMode[];
  cost_model: CostModel | null;
  source_citations: string[];
  last_validated: string;
  iconType: 'brand' | 'custom';
  iconId: string;
  properties: ComponentProperty[];
}
