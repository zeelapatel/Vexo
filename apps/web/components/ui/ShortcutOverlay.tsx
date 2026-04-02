'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['Ctrl', 'Z'], description: 'Undo' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
  { keys: ['Ctrl', 'S'], description: 'Save version' },
  { keys: ['Ctrl', 'N'], description: 'New design' },
  { keys: ['Ctrl', 'F'], description: 'Search components' },
  { keys: ['Del'], description: 'Delete selected node/edge' },
  { keys: ['Esc'], description: 'Deselect / close panel' },
  { keys: ['?'], description: 'Show this overlay' },
  { keys: ['Shift', '+drag'], description: 'Multi-select' },
];

interface ShortcutOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutOverlay({ open, onClose }: ShortcutOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 600 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 420, backgroundColor: '#111115', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, zIndex: 601, padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#E8E6E3' }}>Keyboard Shortcuts</span>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(232,230,227,0.4)' }}><X size={14} /></button>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {SHORTCUTS.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'rgba(232,230,227,0.6)' }}>{s.description}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {s.keys.map((k) => (
                      <span key={k} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#C4F042', backgroundColor: 'rgba(196,240,66,0.08)', border: '1px solid rgba(196,240,66,0.2)', borderRadius: 5, padding: '2px 7px' }}>{k}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
