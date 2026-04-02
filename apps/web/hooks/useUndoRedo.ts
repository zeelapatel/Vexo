import { useEffect } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useStore } from 'zustand';

export function useUndoRedo() {
  const temporalStore = (
    useCanvasStore as unknown as { temporal: Parameters<typeof useStore>[0] }
  ).temporal;
  const { undo, redo, pastStates, futureStates } = useStore(temporalStore) as {
    undo: () => void;
    redo: () => void;
    pastStates: unknown[];
    futureStates: unknown[];
  };

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return { undo, redo, canUndo, canRedo };
}
