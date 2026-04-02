import { useCallback } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import {
  AntiPatternScanner,
  ANTI_PATTERNS_1,
  ANTI_PATTERNS_2,
  buildGraph,
} from '@vexo/engine';
import type { GraphMutation } from '@vexo/engine';
import type { VexoNode, VexoEdge } from '@vexo/types';

const scanner = new AntiPatternScanner([...ANTI_PATTERNS_1, ...ANTI_PATTERNS_2]);

export function useAutoFix() {
  const { addNode, addEdge, removeNode, removeEdge, updateNodeData } = useCanvasStore();

  const applyMutation = useCallback(
    (mutation: GraphMutation) => {
      // Remove nodes (also removes their edges via store)
      mutation.removeNodes?.forEach((id) => removeNode(id));
      // Remove edges
      mutation.removeEdges?.forEach((id) => removeEdge(id));
      // Add nodes
      mutation.addNodes?.forEach((node) => addNode(node as VexoNode));
      // Add edges
      mutation.addEdges?.forEach((edge) => addEdge(edge as VexoEdge));
      // Modify nodes
      mutation.modifyNodes?.forEach(({ id, data }) => updateNodeData(id, data));
    },
    [addNode, addEdge, removeNode, removeEdge, updateNodeData],
  );

  const runAutoFix = useCallback(
    (patternId: string) => {
      const pattern = scanner.getPattern(patternId);
      if (!pattern?.autoFix) return;
      const graph = buildGraph(
        useCanvasStore.getState().nodes,
        useCanvasStore.getState().edges,
      );
      const mutation = pattern.autoFix(graph);
      applyMutation(mutation);
    },
    [applyMutation],
  );

  return { runAutoFix, applyMutation };
}
