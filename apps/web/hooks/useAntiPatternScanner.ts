import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useIssuesStore } from '@/store/issuesStore';
import { AntiPatternScanner, ANTI_PATTERNS_1, ANTI_PATTERNS_2, buildGraph } from '@vexo/engine';
import { getAllComponents } from '@vexo/cbr';
import type { CBREntry } from '@vexo/types';

const cbrRegistry = new Map<string, CBREntry>(getAllComponents().map((c) => [c.id, c]));
const scanner = new AntiPatternScanner([...ANTI_PATTERNS_1, ...ANTI_PATTERNS_2]);

export function useAntiPatternScanner() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const setIssues = useIssuesStore((s) => s.setIssues);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (nodes.length === 0) {
        setIssues([]);
        return;
      }
      const graph = buildGraph(nodes, edges);
      const matches = scanner.scan(graph, cbrRegistry);
      setIssues(
        matches.map((m) => {
          const pattern = scanner.getPattern(m.patternId);
          return {
            id: m.patternId,
            type: 'antipattern' as const,
            severity: pattern?.severity ?? 'warning',
            title: pattern?.name ?? m.patternId,
            body: m.explanation,
            suggestedFix: pattern?.suggestedFix,
            affectedNodeIds: m.affectedNodes,
            affectedEdgeIds: m.affectedEdges,
            autoFixAvailable: pattern?.autoFixAvailable ?? false,
            autoFixPatternId: m.patternId,
          };
        }),
      );
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nodes, edges, setIssues]);
}
