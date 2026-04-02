import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { VexoNode, VexoEdge } from '@vexo/types';
import type { Viewport } from './types';

const MAX_VERSIONS = 20;
const VERSION_PREFIX = 'vexo_versions_';

export interface VersionSnapshot {
  version_id: string;
  name: string;
  created_at: string;
  is_manual: boolean;
  canvas_state: {
    nodes: VexoNode[];
    edges: VexoEdge[];
    viewport: Viewport;
  };
}

interface VersionStoreState {
  versions: VersionSnapshot[];
  previewVersionId: string | null;
  designId: string;
}

interface VersionStoreActions {
  loadVersions: (designId: string) => void;
  saveVersion: (name: string, isManual: boolean, designId: string, nodes: VexoNode[], edges: VexoEdge[], viewport: Viewport) => void;
  revertToVersion: (versionId: string, currentNodes: VexoNode[], currentEdges: VexoEdge[], currentViewport: Viewport) => VersionSnapshot | null;
  setPreviewVersion: (versionId: string | null) => void;
  getVersion: (versionId: string) => VersionSnapshot | undefined;
}

function persistVersions(designId: string, versions: VersionSnapshot[]) {
  try {
    localStorage.setItem(`${VERSION_PREFIX}${designId}`, JSON.stringify(versions));
  } catch (e) {
    console.warn('[Vexo] Failed to save versions:', e);
  }
}

function loadVersionsFromStorage(designId: string): VersionSnapshot[] {
  try {
    const raw = localStorage.getItem(`${VERSION_PREFIX}${designId}`);
    return raw ? (JSON.parse(raw) as VersionSnapshot[]) : [];
  } catch {
    return [];
  }
}

export const useVersionStore = create<VersionStoreState & VersionStoreActions>()(
  immer((set, get) => ({
    versions: [],
    previewVersionId: null,
    designId: '',

    loadVersions: (designId) => {
      const versions = loadVersionsFromStorage(designId);
      set((state) => {
        state.versions = versions;
        state.designId = designId;
      });
    },

    saveVersion: (name, isManual, designId, nodes, edges, viewport) => {
      set((state) => {
        const newVersion: VersionSnapshot = {
          version_id: crypto.randomUUID(),
          name: name || (isManual ? 'Manual save' : 'Auto-save'),
          created_at: new Date().toISOString(),
          is_manual: isManual,
          canvas_state: { nodes, edges, viewport },
        };

        state.versions.unshift(newVersion);

        // Prune: keep max 20, remove oldest auto-saves first if over limit
        if (state.versions.length > MAX_VERSIONS) {
          const autoIdx = state.versions.map((v, i) => ({ v, i }))
            .filter(({ v }) => !v.is_manual)
            .sort((a, b) => a.i - b.i);
          if (autoIdx.length > 0) {
            state.versions.splice(autoIdx[autoIdx.length - 1]!.i, 1);
          } else {
            state.versions.pop();
          }
        }

        persistVersions(designId, state.versions);
      });
    },

    revertToVersion: (versionId, currentNodes, currentEdges, currentViewport) => {
      const target = get().versions.find((v) => v.version_id === versionId);
      if (!target) return null;
      // Save safety snapshot before revert
      get().saveVersion('Before revert', true, get().designId, currentNodes, currentEdges, currentViewport);
      return target;
    },

    setPreviewVersion: (versionId) => {
      set((state) => { state.previewVersionId = versionId; });
    },

    getVersion: (versionId) => get().versions.find((v) => v.version_id === versionId),
  })),
);
