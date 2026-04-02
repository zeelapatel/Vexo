import { useEffect, useCallback } from 'react';
import { useVersionStore } from '@/store/versionStore';
import { useCanvasStore } from '@/store/canvasStore';

const AUTO_SAVE_INTERVAL = 10 * 60 * 1000; // 10 minutes

export function useVersionHistory() {
  const { saveVersion, loadVersions } = useVersionStore();
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const viewport = useCanvasStore((s) => s.viewport);
  const activeDesignId = useCanvasStore((s) => s.activeDesignId);

  // Load versions when design changes
  useEffect(() => {
    loadVersions(activeDesignId);
  }, [activeDesignId, loadVersions]);

  // Auto-save every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentNodes = useCanvasStore.getState().nodes;
      if (currentNodes.length === 0) return;
      saveVersion('Auto-save', false, useCanvasStore.getState().activeDesignId, currentNodes, useCanvasStore.getState().edges, useCanvasStore.getState().viewport);
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [saveVersion]);

  const saveManualVersion = useCallback((name = '') => {
    saveVersion(name || 'Manual save', true, activeDesignId, nodes, edges, viewport);
  }, [saveVersion, activeDesignId, nodes, edges, viewport]);

  return { saveManualVersion };
}
