'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { SimulationBar } from './SimulationBar';
import { Canvas, exportPNGRef } from '../canvas/Canvas';
import { SimulationResultsPanel } from '../panels/SimulationResultsPanel';
import { IssuesPanel } from '../panels/IssuesPanel';
import { VersionPanel } from '../panels/VersionPanel';
import { InterviewMode } from '../interview/InterviewMode';
import { FeedbackWidget } from '../ui/FeedbackWidget';
import { ShortcutOverlay } from '../ui/ShortcutOverlay';
import { CanvasEmptyState } from '../ui/EmptyState';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { useSimulation } from '@/hooks/useSimulation';
import { useDesignStore } from '@/store/designStore';
import { useAntiPatternScanner } from '@/hooks/useAntiPatternScanner';
import { useAutoFix } from '@/hooks/useAutoFix';
import { useVersionHistory } from '@/hooks/useVersionHistory';
import { useExport } from '@/hooks/useExport';
import { useImport } from '@/hooks/useImport';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useCanvasStore } from '@/store/canvasStore';
import { useIssuesStore } from '@/store/issuesStore';

export function AppShell() {
  const { runSimulation } = useSimulation();
  const initializeFromStorage = useDesignStore((s) => s.initializeFromStorage);
  const createDesign = useDesignStore((s) => s.createDesign);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [issuesPanelOpen, setIssuesPanelOpen] = useState(false);
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [shortcutOverlayOpen, setShortcutOverlayOpen] = useState(false);
  const { runAutoFix } = useAutoFix();
  const { saveManualVersion } = useVersionHistory();
  const { exportToJSON } = useExport();
  const exportToPNG = useCallback(() => exportPNGRef.current?.(), []);
  const { importFromJSON } = useImport();
  const nodes = useCanvasStore((s) => s.nodes);

  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);

  // Run anti-pattern scanner on canvas changes
  useAntiPatternScanner();

  const handleNewDesign = useCallback(() => {
    createDesign();
  }, [createDesign]);

  useKeyboardShortcuts([
    { key: 's', ctrl: true, description: 'Save version', handler: () => saveManualVersion() },
    { key: 'n', ctrl: true, description: 'New design', handler: handleNewDesign },
    { key: '?', description: 'Show keyboard shortcuts', handler: () => setShortcutOverlayOpen((v) => !v) },
    { key: 'Escape', description: 'Deselect / close panel', handler: () => {
      setVersionPanelOpen(false);
      setShortcutOverlayOpen(false);
      setInterviewOpen(false);
      useIssuesStore.getState().setFocusedIssue(null);
    }},
  ]);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#050507',
        position: 'relative',
      }}
    >
      {/* Sidebar with slide transition */}
      <div
        style={{
          width: sidebarOpen ? 220 : 0,
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 0.2s ease',
          position: 'relative',
        }}
      >
        <div style={{ width: 220, height: '100%' }}>
          <Sidebar />
        </div>
      </div>

      {/* Toggle button — sits on the boundary between sidebar and canvas */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        style={{
          position: 'absolute',
          left: sidebarOpen ? 212 : 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 50,
          width: 16,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#16161B',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: sidebarOpen ? '0 6px 6px 0' : '0 6px 6px 0',
          cursor: 'pointer',
          color: 'rgba(232,230,227,0.4)',
          fontSize: 10,
          transition: 'left 0.2s ease, color 0.1s, background 0.1s',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#1C1C22';
          (e.currentTarget as HTMLElement).style.color = '#E8E6E3';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#16161B';
          (e.currentTarget as HTMLElement).style.color = 'rgba(232,230,227,0.4)';
        }}
      >
        {sidebarOpen ? '‹' : '›'}
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <ErrorBoundary>
          <Canvas onOpenIssues={() => setIssuesPanelOpen(true)} />
          {nodes.length === 0 && (
            <CanvasEmptyState
              onStartInterview={() => setInterviewOpen(true)}
              onImport={importFromJSON}
            />
          )}
        </ErrorBoundary>
        <SimulationResultsPanel />
        <SimulationBar
          onRunSimulation={runSimulation}
          onExportPNG={exportToPNG}
          onExportJSON={exportToJSON}
          onVersionHistory={() => setVersionPanelOpen(true)}
        />
      </div>
      <IssuesPanel
        open={issuesPanelOpen}
        onClose={() => setIssuesPanelOpen(false)}
        onAutoFix={(patternId) => {
          runAutoFix(patternId);
          setIssuesPanelOpen(false);
        }}
      />
      <VersionPanel
        open={versionPanelOpen}
        onClose={() => setVersionPanelOpen(false)}
      />
      <InterviewMode
        open={interviewOpen}
        onClose={() => setInterviewOpen(false)}
      />
      <FeedbackWidget />
      <ShortcutOverlay
        open={shortcutOverlayOpen}
        onClose={() => setShortcutOverlayOpen(false)}
      />
    </div>
  );
}
