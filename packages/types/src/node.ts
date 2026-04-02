import { Node } from '@xyflow/react';
import { ComponentCategory, SystemStatus } from './enums';

export interface VexoNodeData extends Record<string, unknown> {
  componentId: string;
  label: string;
  category: ComponentCategory;
  cloudVariant: string | null;
  iconType: 'brand' | 'custom';
  iconSrc: string;
  status: SystemStatus;
  metrics: {
    latencyP50: number;
    latencyP99: number;
    saturation: number;
    currentRPS: number;
  };
}

export type VexoNode = Node<VexoNodeData>;
