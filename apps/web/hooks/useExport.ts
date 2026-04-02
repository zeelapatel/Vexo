import { useCallback } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useDesignStore } from '@/store/designStore';

interface ExportOptions {
  /** Call this before capture so React Flow fits all nodes into view */
  fitViewFn?: () => void;
  /** Call this after capture to restore the original viewport */
  setViewportFn?: (x: number, y: number, zoom: number) => void;
}

export function useExport({ fitViewFn, setViewportFn }: ExportOptions = {}) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const viewport = useCanvasStore((s) => s.viewport);
  const activeDesignId = useCanvasStore((s) => s.activeDesignId);
  const { designs } = useDesignStore();

  const getDesignName = useCallback(() => {
    const design = designs.get(activeDesignId);
    return design?.name ?? 'vexo-design';
  }, [designs, activeDesignId]);

  const exportToPNG = useCallback(async () => {
    const { toPng } = await import('html-to-image');

    // The wrapper that contains the full React Flow scene
    const wrapper = document.querySelector('.react-flow') as HTMLElement;
    const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!wrapper || !viewportEl) return;

    // Save current transform so we can restore it
    const savedTransform = viewportEl.style.transform;
    const savedVp = { ...viewport };

    try {
      // Fit all nodes into view (instant, no animation)
      if (fitViewFn) {
        fitViewFn();
        // Wait two frames for React Flow to apply the new transform to the DOM
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }

      const dataUrl = await toPng(wrapper, {
        backgroundColor: '#050507',
        pixelRatio: 2,
        // Exclude minimap, controls, and attribution from the export
        filter: (node) => {
          const el = node as HTMLElement;
          return (
            !el.classList?.contains('react-flow__minimap') &&
            !el.classList?.contains('react-flow__controls') &&
            !el.classList?.contains('react-flow__attribution')
          );
        },
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${getDesignName()}.png`;
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      // Restore original viewport
      if (setViewportFn) {
        setViewportFn(savedVp.x, savedVp.y, savedVp.zoom);
      }
    }
  }, [fitViewFn, setViewportFn, viewport, getDesignName]);

  const exportToJSON = useCallback(() => {
    const data = {
      version: 1,
      designName: getDesignName(),
      exportedAt: new Date().toISOString(),
      canvas: { nodes, edges, viewport },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getDesignName()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, viewport, getDesignName]);

  return { exportToPNG, exportToJSON };
}
