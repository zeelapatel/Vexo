'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  type NodeMouseHandler,
  type OnConnect,
} from '@xyflow/react';
import { useExport } from '@/hooks/useExport';
import '@xyflow/react/dist/style.css';
import type { VexoNode as VexoNodeType, VexoEdge as VexoEdgeType } from '@vexo/types';
import { ComponentCategory, SystemStatus, ConnectionType } from '@vexo/types';
import {
  inferConnectionType,
  RuleEngine,
  HARD_BLOCK_RULES,
  SOFT_WARNING_RULES,
  CONTEXT_RULES,
} from '@vexo/engine';
import { AlertTriangle } from 'lucide-react';
import { VexoNode } from './VexoNode';
import { VexoEdge } from './VexoEdge';
import { BlockedConnectionFeedback } from './BlockedConnectionFeedback';
import { CanvasSearch } from './CanvasSearch';
import type { SidebarComponent } from '@/data/sidebarCategories';
import { PropertyPanel } from '@/components/panels/PropertyPanel';
import { useCanvasStore, selectSelectedNode } from '@/store/canvasStore';
import { useIssuesStore } from '@/store/issuesStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useUndoRedo } from '@/hooks/useUndoRedo';

// Module-level ref so AppShell (outside ReactFlowProvider) can trigger PNG export
export const exportPNGRef: { current: (() => Promise<void>) | null } = { current: null };

// Module-level validation engine (combined rules)
const validationEngine = new RuleEngine([
  ...HARD_BLOCK_RULES,
  ...SOFT_WARNING_RULES,
  ...CONTEXT_RULES,
]);

const nodeTypes = { vexo: VexoNode };
const edgeTypes = { vexo: VexoEdge };

function formatSavedTime(ts: number | null): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 5000) return 'saved just now';
  if (diff < 60000) return `saved ${Math.floor(diff / 1000)}s ago`;
  return `saved ${Math.floor(diff / 60000)}m ago`;
}

function CanvasInner({ onOpenIssues }: { onOpenIssues?: () => void }) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const addNode = useCanvasStore((s) => s.addNode);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const removeEdge = useCanvasStore((s) => s.removeEdge);
  const setSelectedNode = useCanvasStore((s) => s.setSelectedNode);
  const selectedNode = useCanvasStore(selectSelectedNode);
  const lastSavedAt = useCanvasStore((s) => s.lastSavedAt);
  const isDirty = useCanvasStore((s) => s.isDirty);

  const [showMinimap, setShowMinimap] = useState(true);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [blockedNodeId, setBlockedNodeId] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView, setViewport } = useReactFlow();
  const addIssue = useIssuesStore((s) => s.setIssues);
  const focusedIssueId = useIssuesStore((s) => s.focusedIssueId);
  const setFocusedIssue = useIssuesStore((s) => s.setFocusedIssue);
  const allIssues = useIssuesStore((s) => s.issues);

  const { exportToPNG } = useExport({
    fitViewFn: () => fitView({ padding: 0.12, duration: 0 }),
    setViewportFn: (x, y, zoom) => setViewport({ x, y, zoom }),
  });

  // Expose exportToPNG to AppShell via the module-level ref
  useEffect(() => {
    exportPNGRef.current = exportToPNG;
    return () => { exportPNGRef.current = null; };
  }, [exportToPNG]);
  const existingIssues = useIssuesStore((s) => s.issues);
  const issueCount = existingIssues.filter((i) => !i.dismissed).length;

  useAutoSave();
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  // Pan + zoom to affected nodes when an issue is focused
  useEffect(() => {
    if (!focusedIssueId) return;
    const issue = allIssues.find((i) => i.id === focusedIssueId);
    if (!issue?.affectedNodeIds?.length) return;
    const timer = setTimeout(() => {
      fitView({
        nodes: issue.affectedNodeIds!.map((nid) => ({ id: nid })),
        padding: 0.4,
        duration: 600,
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [focusedIssueId, allIssues, fitView]);

  // Smart connect: validate then infer connection type from source/target component categories
  const handleConnect = useCallback<OnConnect>(
    (connection) => {
      const currentNodes = useCanvasStore.getState().nodes;
      const sourceNode = currentNodes.find((n) => n.id === connection.source);
      const targetNode = currentNodes.find((n) => n.id === connection.target);

      if (sourceNode && targetNode) {
        const validation = validationEngine.evaluate(sourceNode, targetNode);
        if (validation.blocked) {
          setBlockedReason(validation.reason ?? 'Connection not allowed.');
          setBlockedNodeId(connection.source);
          return;
        }
        const inferredType = inferConnectionType({
          sourceCategory: sourceNode.data.category,
          sourceComponentId: sourceNode.data.componentId,
          targetCategory: targetNode.data.category,
          targetComponentId: targetNode.data.componentId,
        });
        const validationStatus = validation.warned ? 'warned' : 'valid';

        if (validation.warned && validation.warningMessage) {
          // Add as connection warning to issues store (preserve existing)
          const currentIssues = useIssuesStore.getState().issues;
          const warningId = `cw-${connection.source}-${connection.target}`;
          const alreadyExists = currentIssues.some((i) => i.id === warningId);
          if (!alreadyExists) {
            addIssue([
              ...currentIssues.map(({ dismissed: _d, ...rest }) => rest),
              {
                id: warningId,
                type: 'connection_warning' as const,
                severity: 'warning' as const,
                title: validation.ruleId ?? 'Connection Warning',
                body: validation.warningMessage,
                suggestedFix: validation.suggestedFix,
                affectedNodeIds: [connection.source ?? '', connection.target ?? ''],
              },
            ]);
          }
        }

        useCanvasStore.getState().addEdge({
          id: crypto.randomUUID(),
          source: connection.source ?? '',
          target: connection.target ?? '',
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          type: 'vexo',
          data: { connectionType: inferredType, validationStatus },
        } as VexoEdgeType);
      } else {
        const inferredType = ConnectionType.SYNC_HTTP;
        useCanvasStore.getState().addEdge({
          id: crypto.randomUUID(),
          source: connection.source ?? '',
          target: connection.target ?? '',
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          type: 'vexo',
          data: { connectionType: inferredType, validationStatus: 'valid' },
        } as VexoEdgeType);
      }
    },
    [addIssue],
  );

  const onNodeClick = useCallback<NodeMouseHandler<VexoNodeType>>(
    (_e, node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setFocusedIssue(null);
  }, [setSelectedNode, setFocusedIssue]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData('application/vexo-component');
      if (!raw) return;
      let component: SidebarComponent;
      try {
        component = JSON.parse(raw) as SidebarComponent;
      } catch {
        return;
      }
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newNode: VexoNodeType = {
        id: crypto.randomUUID(),
        type: 'vexo',
        position,
        data: {
          componentId: component.id,
          label: component.label,
          category: component.category as ComponentCategory,
          cloudVariant: null,
          iconType: component.iconType,
          iconSrc: component.id,
          status: SystemStatus.Idle,
          metrics: { latencyP50: 0, latencyP99: 0, saturation: 0, currentRPS: 0 },
        },
      };
      addNode(newNode);
    },
    [screenToFlowPosition, addNode],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodeIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id));
        selectedNodeIds.forEach((id) => removeNode(id));
        edges.filter((ed) => ed.selected).forEach((ed) => removeEdge(ed.id));
      }
    },
    [nodes, edges, removeNode, removeEdge],
  );

  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  return (
    <div
      ref={reactFlowWrapper}
      style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {/* Toolbar */}
      <div
        style={{
          height: 44,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '0 12px',
          backgroundColor: '#111115',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <ToolbarButton title="Zoom In" onClick={() => zoomIn()}>
          +
        </ToolbarButton>
        <ToolbarButton title="Zoom Out" onClick={() => zoomOut()}>
          −
        </ToolbarButton>
        <ToolbarButton title="Fit View" onClick={() => fitView({ padding: 0.1 })}>
          ⊡
        </ToolbarButton>
        <ToolbarSep />
        <ToolbarButton
          title="Toggle Minimap"
          onClick={() => setShowMinimap((v) => !v)}
          active={showMinimap}
        >
          ⊞
        </ToolbarButton>
        <ToolbarSep />
        <ToolbarButton title="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo}>
          ↩
        </ToolbarButton>
        <ToolbarButton title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}>
          ↪
        </ToolbarButton>
        <div style={{ flex: 1 }} />
        {lastSavedAt && (
          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: isDirty ? 'rgba(245,166,35,0.5)' : 'rgba(232,230,227,0.25)',
              marginRight: 8,
            }}
          >
            {isDirty ? 'unsaved' : formatSavedTime(lastSavedAt)}
          </span>
        )}
        <span
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'rgba(232,230,227,0.35)',
          }}
        >
          {nodeCount} node{nodeCount !== 1 ? 's' : ''}
        </span>
        <ToolbarSep />
        <span
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'rgba(232,230,227,0.35)',
          }}
        >
          {edgeCount} edge{edgeCount !== 1 ? 's' : ''}
        </span>
        {issueCount > 0 && (
          <>
            <ToolbarSep />
            <button
              onClick={onOpenIssues}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                backgroundColor: 'rgba(245,166,35,0.1)',
                border: '1px solid rgba(245,166,35,0.25)',
                borderRadius: 5,
                cursor: onOpenIssues ? 'pointer' : 'default',
                transition: 'background 0.1s',
              }}
              title={`${issueCount} issue${issueCount !== 1 ? 's' : ''} — click to view`}
              onMouseEnter={(e) => {
                if (onOpenIssues)
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(245,166,35,0.18)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(245,166,35,0.1)';
              }}
            >
              <AlertTriangle size={11} color="#F5A623" />
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: '#F5A623',
                }}
              >
                {issueCount} issue{issueCount !== 1 ? 's' : ''}
              </span>
            </button>
          </>
        )}
      </div>

      {/* React Flow */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Link
          href="/"
          title="Back to home"
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 20,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 32,
            padding: '0 14px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.07)',
            backgroundColor: 'rgba(11,11,14,0.88)',
            textDecoration: 'none',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,240,66,0.35)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(196,240,66,0.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
          }}
        >
          {/* Accent dot */}
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: '#C4F042',
            flexShrink: 0,
            boxShadow: '0 0 6px rgba(196,240,66,0.6)',
          }} />
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#F5F3F0',
          }}>
            Vexo
          </span>
        </Link>

        {/* Search bar — top-center */}
        <CanvasSearch />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          colorMode="dark"
          multiSelectionKeyCode="Shift"
          deleteKeyCode={null}
          style={{ backgroundColor: '#0C0C0F' }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(255,255,255,0.025)"
          />
          {showMinimap && (
            <MiniMap
              nodeColor="#C4F042"
              maskColor="rgba(5,5,7,0.8)"
              style={{
                backgroundColor: '#0C0C0F',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            />
          )}
        </ReactFlow>
        <PropertyPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        <BlockedConnectionFeedback
          nodeId={blockedNodeId}
          reason={blockedReason}
          onDone={() => {
            setBlockedReason(null);
            setBlockedNodeId(null);
          }}
        />
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  title,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? 'rgba(196,240,66,0.08)' : 'transparent',
        border: `1px solid ${active ? 'rgba(196,240,66,0.3)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 5,
        color: disabled ? 'rgba(232,230,227,0.2)' : active ? '#C4F042' : 'rgba(232,230,227,0.6)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13,
        lineHeight: 1,
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.backgroundColor = active
            ? 'rgba(196,240,66,0.08)'
            : 'transparent';
          (e.currentTarget as HTMLElement).style.borderColor = active
            ? 'rgba(196,240,66,0.3)'
            : 'rgba(255,255,255,0.05)';
        }
      }}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return (
    <div
      style={{
        width: 1,
        height: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        margin: '0 2px',
      }}
    />
  );
}

export function Canvas({ onOpenIssues }: { onOpenIssues?: () => void } = {}) {
  return (
    <ReactFlowProvider>
      <CanvasInner onOpenIssues={onOpenIssues} />
    </ReactFlowProvider>
  );
}
