import type { VexoNode, VexoEdge, VexoNodeData } from '@vexo/types';
import type { CBREntry } from '@vexo/types';
import type { SimulationGraph } from '../graphBuilder';

export type { VexoNodeData };

export interface AntiPatternMatch {
  patternId: string;
  affectedNodes: string[];
  affectedEdges: string[];
  explanation: string;
}

export interface GraphMutation {
  addNodes?: VexoNode[];
  removeNodes?: string[];
  addEdges?: VexoEdge[];
  removeEdges?: string[];
  modifyNodes?: Array<{ id: string; data: Partial<VexoNode['data']> }>;
}

export interface AntiPattern {
  id: string;
  name: string;
  description: string;
  severity: 'warning' | 'critical';
  suggestedFix: string;
  autoFixAvailable: boolean;
  triggerCondition: (
    graph: SimulationGraph,
    cbrRegistry: Map<string, CBREntry>,
  ) => AntiPatternMatch | null;
  autoFix?: (graph: SimulationGraph) => GraphMutation;
}

export class AntiPatternScanner {
  private patterns: AntiPattern[];

  constructor(patterns: AntiPattern[]) {
    this.patterns = patterns;
  }

  scan(graph: SimulationGraph, cbrRegistry: Map<string, CBREntry>): AntiPatternMatch[] {
    const matches: AntiPatternMatch[] = [];
    for (const pattern of this.patterns) {
      const match = pattern.triggerCondition(graph, cbrRegistry);
      if (match) matches.push(match);
    }
    return matches;
  }

  getPattern(id: string): AntiPattern | undefined {
    return this.patterns.find((p) => p.id === id);
  }

  addPattern(pattern: AntiPattern): void {
    this.patterns.push(pattern);
  }
}
