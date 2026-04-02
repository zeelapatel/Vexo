import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { saveDesignState } from '@/store/persistence';

const SAVE_INTERVAL_MS = 5000;

export function useAutoSave() {
  const isDirty = useCanvasStore((s) => s.isDirty);
  const markSaved = useCanvasStore((s) => s.markSaved);
  const activeDesignId = useCanvasStore((s) => s.activeDesignId);

  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDirtyRef.current) return;
      const saved = saveDesignState(activeDesignId, {
        nodes: useCanvasStore.getState().nodes,
        edges: useCanvasStore.getState().edges,
        viewport: useCanvasStore.getState().viewport,
      });
      if (saved) {
        markSaved();
      }
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [activeDesignId, markSaved]);
}
