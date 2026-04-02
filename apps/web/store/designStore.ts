import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DesignMeta } from './types';
import { saveDesignState, loadDesignState } from './persistence';
import { useCanvasStore } from './canvasStore';

enableMapSet();

const DESIGNS_KEY = 'vexo_designs';

function loadDesigns(): Map<string, DesignMeta> {
  try {
    const raw = localStorage.getItem(DESIGNS_KEY);
    if (!raw) return new Map();
    const arr = JSON.parse(raw) as DesignMeta[];
    return new Map(arr.map((d) => [d.id, d]));
  } catch {
    return new Map();
  }
}

function persistDesigns(designs: Map<string, DesignMeta>) {
  try {
    localStorage.setItem(DESIGNS_KEY, JSON.stringify(Array.from(designs.values())));
  } catch (e) {
    console.warn('[Vexo] Failed to persist designs:', e);
  }
}

function createDefaultDesign(): DesignMeta {
  return {
    id: 'default',
    name: 'Untitled Design',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    thumbnail: null,
    deletedAt: null,
  };
}

interface DesignStoreState {
  designs: Map<string, DesignMeta>;
  activeDesignId: string;
}

interface DesignStoreActions {
  createDesign: () => string;
  deleteDesign: (id: string) => void;
  restoreDesign: (id: string) => void;
  renameDesign: (id: string, name: string) => void;
  duplicateDesign: (id: string) => string;
  switchDesign: (id: string) => void;
  getActiveDesigns: () => DesignMeta[];
  getDeletedDesigns: () => DesignMeta[];
  initializeFromStorage: () => void;
}

export type DesignStore = DesignStoreState & DesignStoreActions;

export const useDesignStore = create<DesignStore>()(
  immer((set, get) => ({
    designs: new Map([['default', createDefaultDesign()]]),
    activeDesignId: 'default',

    createDesign: () => {
      const id = crypto.randomUUID();
      const existingCount = get().getActiveDesigns().length;
      const design: DesignMeta = {
        id,
        name: `Untitled Design ${existingCount + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thumbnail: null,
        deletedAt: null,
      };
      set((state) => {
        state.designs.set(id, design);
      });
      persistDesigns(get().designs);
      get().switchDesign(id);
      return id;
    },

    deleteDesign: (id) => {
      const active = get().getActiveDesigns();
      if (active.length <= 1) return; // can't delete last
      set((state) => {
        const design = state.designs.get(id);
        if (design) {
          design.deletedAt = new Date().toISOString();
        }
      });
      persistDesigns(get().designs);
      // If deleting active, switch to first available
      if (get().activeDesignId === id) {
        const first = get().getActiveDesigns()[0];
        if (first) get().switchDesign(first.id);
      }
    },

    restoreDesign: (id) => {
      set((state) => {
        const design = state.designs.get(id);
        if (design) design.deletedAt = null;
      });
      persistDesigns(get().designs);
    },

    renameDesign: (id, name) => {
      set((state) => {
        const design = state.designs.get(id);
        if (design) {
          design.name = name;
          design.updatedAt = new Date().toISOString();
        }
      });
      persistDesigns(get().designs);
    },

    duplicateDesign: (id) => {
      const source = get().designs.get(id);
      if (!source) return id;
      const newId = crypto.randomUUID();
      const sourceState = loadDesignState(id);
      const newDesign: DesignMeta = {
        ...source,
        id: newId,
        name: `${source.name} (copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };
      set((state) => {
        state.designs.set(newId, newDesign);
      });
      if (sourceState) saveDesignState(newId, sourceState);
      persistDesigns(get().designs);
      get().switchDesign(newId);
      return newId;
    },

    switchDesign: (id) => {
      const canvas = useCanvasStore.getState();
      // Save current
      saveDesignState(canvas.activeDesignId, {
        nodes: canvas.nodes,
        edges: canvas.edges,
        viewport: canvas.viewport,
      });
      // Load target
      const saved = loadDesignState(id);
      canvas.setActiveDesign(id, saved?.nodes ?? [], saved?.edges ?? [], saved?.viewport);
      // Reset undo stack
      useCanvasStore.temporal.getState().clear();
      set((state) => {
        state.activeDesignId = id;
      });
      // Update updatedAt
      set((state) => {
        const design = state.designs.get(id);
        if (design) design.updatedAt = new Date().toISOString();
      });
      persistDesigns(get().designs);
    },

    getActiveDesigns: () =>
      Array.from(get().designs.values()).filter((d) => !d.deletedAt),

    getDeletedDesigns: () =>
      Array.from(get().designs.values()).filter((d) => !!d.deletedAt),

    initializeFromStorage: () => {
      const loaded = loadDesigns();
      if (loaded.size > 0) {
        set((state) => {
          state.designs = loaded;
        });
        // Load the first non-deleted design
        const first = Array.from(loaded.values()).find((d) => !d.deletedAt);
        if (first) {
          const saved = loadDesignState(first.id);
          useCanvasStore.getState().setActiveDesign(
            first.id,
            saved?.nodes ?? [],
            saved?.edges ?? [],
            saved?.viewport,
          );
          set((state) => {
            state.activeDesignId = first.id;
          });
        }
      } else {
        // Create default design
        persistDesigns(get().designs);
      }
    },
  })),
);
