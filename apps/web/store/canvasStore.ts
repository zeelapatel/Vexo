import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import { applyNodeChanges, applyEdgeChanges, addEdge as rfAddEdge } from '@xyflow/react';
import type { NodeChange, EdgeChange, Connection } from '@xyflow/react';
import type { VexoNode, VexoEdge } from '@vexo/types';
import { ConnectionType } from '@vexo/types';
import type { Viewport } from './types';

interface CanvasState {
  nodes: VexoNode[];
  edges: VexoEdge[];
  selectedNodeId: string | null;
  activeDesignId: string;
  viewport: Viewport;
  isDirty: boolean;
  lastSavedAt: number | null;
}

interface CanvasActions {
  addNode: (node: VexoNode) => void;
  removeNode: (id: string) => void;
  updateNodeData: (id: string, data: Partial<VexoNode['data']>) => void;
  addEdge: (edge: VexoEdge) => void;
  removeEdge: (id: string) => void;
  updateEdgeData: (id: string, data: Partial<VexoEdge['data'] & Record<string, unknown>>) => void;
  setSelectedNode: (id: string | null) => void;
  setViewport: (viewport: Viewport) => void;
  onNodesChange: (changes: NodeChange<VexoNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<VexoEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  markSaved: () => void;
  setActiveDesign: (
    id: string,
    nodes: VexoNode[],
    edges: VexoEdge[],
    viewport?: Viewport,
  ) => void;
}

export type CanvasStore = CanvasState & CanvasActions;

export const useCanvasStore = create<CanvasStore>()(
  temporal(
    immer((set) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      activeDesignId: 'default',
      viewport: { x: 0, y: 0, zoom: 1 },
      isDirty: false,
      lastSavedAt: null,

      addNode: (node) =>
        set((state) => {
          state.nodes.push(node);
          state.isDirty = true;
        }),

      removeNode: (id) =>
        set((state) => {
          state.nodes = state.nodes.filter((n) => n.id !== id);
          state.edges = state.edges.filter((e) => e.source !== id && e.target !== id);
          if (state.selectedNodeId === id) state.selectedNodeId = null;
          state.isDirty = true;
        }),

      updateNodeData: (id, data) =>
        set((state) => {
          const node = state.nodes.find((n) => n.id === id);
          if (node) {
            Object.assign(node.data, data);
            state.isDirty = true;
          }
        }),

      addEdge: (edge) =>
        set((state) => {
          state.edges.push(edge);
          state.isDirty = true;
        }),

      removeEdge: (id) =>
        set((state) => {
          state.edges = state.edges.filter((e) => e.id !== id);
          state.isDirty = true;
        }),

      updateEdgeData: (id, data) =>
        set((state) => {
          const edge = state.edges.find((e) => e.id === id);
          if (edge) {
            edge.data = { ...edge.data, ...data } as VexoEdge['data'];
            state.isDirty = true;
          }
        }),

      setSelectedNode: (id) =>
        set((state) => {
          state.selectedNodeId = id;
        }),

      setViewport: (viewport) =>
        set((state) => {
          state.viewport = viewport;
          state.isDirty = true;
        }),

      onNodesChange: (changes) =>
        set((state) => {
          state.nodes = applyNodeChanges(changes, state.nodes) as VexoNode[];
          const hasSignificantChange = changes.some(
            (c) => c.type === 'add' || c.type === 'remove' || c.type === 'position',
          );
          if (hasSignificantChange) state.isDirty = true;
        }),

      onEdgesChange: (changes) =>
        set((state) => {
          state.edges = applyEdgeChanges(changes, state.edges) as VexoEdge[];
          const hasSignificantChange = changes.some(
            (c) => c.type === 'add' || c.type === 'remove',
          );
          if (hasSignificantChange) state.isDirty = true;
        }),

      onConnect: (connection) =>
        set((state) => {
          state.edges = rfAddEdge(
            {
              ...connection,
              id: crypto.randomUUID(),
              type: 'vexo',
              data: { connectionType: ConnectionType.SYNC_HTTP, validationStatus: 'valid' },
            },
            state.edges,
          ) as VexoEdge[];
          state.isDirty = true;
        }),

      markSaved: () =>
        set((state) => {
          state.isDirty = false;
          state.lastSavedAt = Date.now();
        }),

      setActiveDesign: (id, nodes, edges, viewport) =>
        set((state) => {
          state.activeDesignId = id;
          state.nodes = nodes;
          state.edges = edges;
          if (viewport) state.viewport = viewport;
          state.selectedNodeId = null;
          state.isDirty = false;
        }),
    })),
    {
      limit: 50,
      // Only track nodes and edges in undo history (not selection, viewport, dirty)
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
    },
  ),
);

// Selector helpers
export const selectNodes = (s: CanvasStore) => s.nodes;
export const selectEdges = (s: CanvasStore) => s.edges;
export const selectSelectedNodeId = (s: CanvasStore) => s.selectedNodeId;
export const selectSelectedNode = (s: CanvasStore) =>
  s.selectedNodeId ? s.nodes.find((n) => n.id === s.selectedNodeId) ?? null : null;
