import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { saveDesignState } from '@/store/persistence';

const DEBOUNCE_MS = 1500;

export function useAutoSave() {
  const isDirty = useCanvasStore((s) => s.isDirty);
  const markSaved = useCanvasStore((s) => s.markSaved);
  const activeDesignId = useCanvasStore((s) => s.activeDesignId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const { nodes, edges, viewport } = useCanvasStore.getState();
      const saved = saveDesignState(activeDesignId, { nodes, edges, viewport });
      if (saved) markSaved();
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, activeDesignId, markSaved]);
}
