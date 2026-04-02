import { useCallback, useState } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useDesignStore } from '@/store/designStore';
import type { VexoNode, VexoEdge } from '@vexo/types';
import type { Viewport } from '@/store/types';

interface ImportError {
  message: string;
}

export function useImport() {
  const [importError, setImportError] = useState<string | null>(null);
  const setActiveDesign = useCanvasStore((s) => s.setActiveDesign);
  const createDesign = useDesignStore((s) => s.createDesign);
  const renameDesign = useDesignStore((s) => s.renameDesign);

  const importFromJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const raw = ev.target?.result as string;
          const data = JSON.parse(raw) as { version?: number; designName?: string; canvas?: { nodes: VexoNode[]; edges: VexoEdge[]; viewport?: Viewport } };
          if (!data.canvas?.nodes || !Array.isArray(data.canvas.nodes)) {
            throw new Error('Invalid file: missing nodes array');
          }
          if (!Array.isArray(data.canvas.edges)) {
            throw new Error('Invalid file: missing edges array');
          }
          const newId = createDesign();
          if (data.designName) renameDesign(newId, `${data.designName} (imported)`);
          setActiveDesign(newId, data.canvas.nodes, data.canvas.edges, data.canvas.viewport);
          setImportError(null);
        } catch (err) {
          setImportError((err as ImportError).message ?? 'Failed to import file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [createDesign, renameDesign, setActiveDesign]);

  return { importFromJSON, importError };
}
