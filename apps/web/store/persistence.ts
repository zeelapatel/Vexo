import type { VexoNode, VexoEdge } from '@vexo/types';
import type { Viewport } from './types';

export interface PersistedDesignState {
  nodes: VexoNode[];
  edges: VexoEdge[];
  viewport: Viewport;
}

const PREFIX = 'vexo_design_';

export function saveDesignState(designId: string, state: PersistedDesignState): boolean {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(`${PREFIX}${designId}`, serialized);
    return true;
  } catch (e) {
    console.warn('[Vexo] Failed to save design state:', e);
    return false;
  }
}

export function loadDesignState(designId: string): PersistedDesignState | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${designId}`);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedDesignState;
  } catch (e) {
    console.warn('[Vexo] Failed to load design state:', e);
    return null;
  }
}

export function deleteDesignState(designId: string): void {
  try {
    localStorage.removeItem(`${PREFIX}${designId}`);
  } catch {
    // ignore
  }
}

export function estimateStorageUsage(): number {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key) ?? '';
      total += key.length + val.length;
    }
    return total * 2; // UTF-16 chars = 2 bytes each
  } catch {
    return 0;
  }
}
