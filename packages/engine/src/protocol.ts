import type { VexoNode, VexoEdge, SystemStatus } from '@vexo/types';

export interface NodeSimResult {
  saturation: number;
  latencyP50: number;
  latencyP99: number;
  status: SystemStatus;
  currentRPS: number;
}

export interface SimulationRequest {
  type: 'simulate';
  nodes: VexoNode[];
  edges: VexoEdge[];
  entryQPS: number;
}

export interface SimulationResponse {
  type: 'result';
  nodeResults: Record<string, NodeSimResult>;
  bottleneckPath: string[];
  totalLatency: number;
  warnings: string[];
}

export interface SimulationErrorResponse {
  type: 'error';
  message: string;
}

export type WorkerMessage = SimulationRequest;
export type WorkerResponse = SimulationResponse | SimulationErrorResponse;
