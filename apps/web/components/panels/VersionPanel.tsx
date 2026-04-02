'use client';

import { useState, useCallback } from 'react';
import { Eye, RotateCcw, Clock, Save, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useVersionStore } from '@/store/versionStore';
import { useCanvasStore } from '@/store/canvasStore';

interface VersionPanelProps {
  open: boolean;
  onClose: () => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function VersionPanel({ open, onClose }: VersionPanelProps) {
  const versions = useVersionStore((s) => s.versions);
  const previewVersionId = useVersionStore((s) => s.previewVersionId);
  const setPreviewVersion = useVersionStore((s) => s.setPreviewVersion);
  const revertToVersion = useVersionStore((s) => s.revertToVersion);
  const saveVersion = useVersionStore((s) => s.saveVersion);
  const designId = useVersionStore((s) => s.designId);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const viewport = useCanvasStore((s) => s.viewport);
  const setActiveDesign = useCanvasStore((s) => s.setActiveDesign);
  const activeDesignId = useCanvasStore((s) => s.activeDesignId);
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const handleSaveVersion = useCallback(() => {
    saveVersion(saveName.trim() || 'Manual save', true, activeDesignId, nodes, edges, viewport);
    setSaveName('');
    setShowSaveInput(false);
  }, [saveName, activeDesignId, nodes, edges, viewport, saveVersion]);

  const handleRevert = useCallback((versionId: string) => {
    const target = revertToVersion(versionId, nodes, edges, viewport);
    if (target) {
      setActiveDesign(activeDesignId, target.canvas_state.nodes, target.canvas_state.edges, target.canvas_state.viewport);
      setPreviewVersion(null);
    }
  }, [revertToVersion, nodes, edges, viewport, activeDesignId, setActiveDesign, setPreviewVersion]);

  // Suppress unused variable warning — designId is from store but used contextually
  void designId;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={onClose} />
          <motion.div
            initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 300, backgroundColor: '#111115', border: '1px solid rgba(255,255,255,0.08)', zIndex: 201, display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
              <Clock size={13} color="rgba(232,230,227,0.5)" style={{ marginRight: 8 }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#E8E6E3' }}>Version History</span>
              <button
                onClick={() => setShowSaveInput((v) => !v)}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, cursor: 'pointer', color: 'rgba(232,230,227,0.6)', padding: '3px 8px', fontSize: 11, marginRight: 8 }}
              >
                <Save size={11} style={{ display: 'inline', marginRight: 4 }} />Save
              </button>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(232,230,227,0.4)' }}>
                <X size={14} />
              </button>
            </div>

            {showSaveInput && (
              <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 6 }}>
                <input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveVersion(); if (e.key === 'Escape') setShowSaveInput(false); }}
                  placeholder="Version name (optional)"
                  autoFocus
                  style={{ flex: 1, backgroundColor: '#16161B', border: '1px solid rgba(196,240,66,0.3)', borderRadius: 6, padding: '5px 8px', fontSize: 12, color: '#E8E6E3', outline: 'none' }}
                />
                <button onClick={handleSaveVersion} style={{ backgroundColor: '#C4F042', border: 'none', borderRadius: 5, padding: '5px 10px', fontSize: 11, fontWeight: 500, color: '#050507', cursor: 'pointer' }}>
                  Save
                </button>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {versions.length === 0 ? (
                <div style={{ padding: '48px 16px', textAlign: 'center', fontSize: 12, color: 'rgba(232,230,227,0.3)' }}>
                  No saved versions yet.<br />Press Ctrl+S to save.
                </div>
              ) : (
                versions.map((version) => (
                  <div
                    key={version.version_id}
                    style={{ padding: '8px 14px', borderLeft: `2px solid ${previewVersionId === version.version_id ? '#C4F042' : 'transparent'}`, backgroundColor: previewVersionId === version.version_id ? 'rgba(196,240,66,0.04)' : 'transparent', transition: 'background 0.1s' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: '#E8E6E3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{version.name}</div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(232,230,227,0.35)', marginTop: 2 }}>
                          {formatTime(version.created_at)}
                          <span style={{ marginLeft: 6, padding: '1px 5px', borderRadius: 4, backgroundColor: version.is_manual ? 'rgba(196,240,66,0.1)' : 'rgba(255,255,255,0.05)', color: version.is_manual ? '#C4F042' : 'rgba(232,230,227,0.4)', fontSize: 9 }}>
                            {version.is_manual ? 'manual' : 'auto'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setPreviewVersion(previewVersionId === version.version_id ? null : version.version_id)}
                        title="Preview"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(232,230,227,0.4)', padding: 3 }}
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => handleRevert(version.version_id)}
                        title="Revert to this version"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(232,230,227,0.4)', padding: 3 }}
                      >
                        <RotateCcw size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
