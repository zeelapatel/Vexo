import { Edge } from '@xyflow/react';
import { ConnectionType } from './enums';

export interface VexoEdgeData extends Record<string, unknown> {
  connectionType: ConnectionType;
  validationStatus: 'valid' | 'warned' | 'blocked';
  warningMessage?: string;
}

export type VexoEdge = Edge<VexoEdgeData>;
