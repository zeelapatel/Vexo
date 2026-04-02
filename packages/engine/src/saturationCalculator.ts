import { SystemStatus } from '@vexo/types';
import type { CBREntry } from '@vexo/types';
import type { NodeSimResult } from './protocol';

function evaluatePolynomial(coefficients: number[], x: number): number {
  // f(x) = c0 + c1*x + c2*x^2 + ...
  return coefficients.reduce((acc, c, i) => acc + c * Math.pow(x, i), 0);
}

function determineStatus(saturation: number): SystemStatus {
  if (saturation >= 0.95) return SystemStatus.Critical;
  if (saturation >= 0.8) return SystemStatus.Warning;
  return SystemStatus.Healthy;
}

export function calculateSaturation(
  currentLoad: number,
  cbrEntry: CBREntry,
): NodeSimResult {
  const { capacity, saturation_curve } = cbrEntry;
  const saturation = Math.min(currentLoad / capacity.max_rps, 2.0); // cap at 200% for display
  const displaySaturation = currentLoad / capacity.max_rps; // uncapped for status

  const latencyMultiplier = Math.max(
    1,
    evaluatePolynomial(saturation_curve.coefficients, Math.min(saturation, 1.0)),
  );

  const latencyP50 = Math.round(capacity.latency_p50_ms * latencyMultiplier);
  const latencyP99 = Math.round(capacity.latency_p99_ms * latencyMultiplier);

  let status = determineStatus(displaySaturation);

  // Over-capacity: force critical
  if (currentLoad > capacity.max_rps) {
    status = SystemStatus.Critical;
  }

  return {
    saturation: Math.min(displaySaturation, 2.0),
    latencyP50,
    latencyP99,
    status,
    currentRPS: Math.round(currentLoad),
  };
}
