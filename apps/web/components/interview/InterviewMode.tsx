'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, Lightbulb, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { INTERVIEW_PROMPTS, type InterviewPrompt } from '@/data/interviewPrompts';
import { useCanvasStore } from '@/store/canvasStore';
import { useDesignStore } from '@/store/designStore';

interface InterviewModeProps {
  open: boolean;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function InterviewMode({ open, onClose }: InterviewModeProps) {
  const [selected, setSelected] = useState<InterviewPrompt | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const { setActiveDesign } = useCanvasStore();
  const { createDesign } = useDesignStore();

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const startPrompt = useCallback((prompt: InterviewPrompt) => {
    const newId = createDesign();
    setActiveDesign(newId, prompt.starterNodes, prompt.starterEdges);
    setSelected(prompt);
    setHintsRevealed(0);
    setElapsed(0);
    setRunning(true);
    onClose();
  }, [createDesign, setActiveDesign, onClose]);

  const endInterview = useCallback(() => {
    setRunning(false);
    setSelected(null);
  }, []);

  const revealHint = useCallback(() => {
    if (!selected || hintsRevealed >= selected.hints.length) return;
    setHintsRevealed((h) => h + 1);
  }, [selected, hintsRevealed]);

  return (
    <>
      {/* Timer bar — always visible when interview is running */}
      {running && selected && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
          backgroundColor: 'rgba(5,5,7,0.95)', borderBottom: '1px solid rgba(196,240,66,0.2)',
          padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Clock size={13} color="#C4F042" />
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#C4F042' }}>
            {formatTime(elapsed)}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(232,230,227,0.5)', flex: 1 }}>
            {selected.title}
          </span>
          <button
            onClick={revealHint}
            disabled={hintsRevealed >= selected.hints.length}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '3px 10px', cursor: hintsRevealed >= selected.hints.length ? 'not-allowed' : 'pointer', fontSize: 11, color: 'rgba(232,230,227,0.5)' }}
          >
            <Lightbulb size={11} /> Hint ({hintsRevealed}/{selected.hints.length})
          </button>
          {hintsRevealed > 0 && (
            <div style={{ fontSize: 11, color: '#F5A623', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selected.hints[hintsRevealed - 1]}
            </div>
          )}
          <button onClick={endInterview} style={{ background: 'transparent', border: '1px solid rgba(255,68,68,0.3)', borderRadius: 5, padding: '3px 10px', cursor: 'pointer', fontSize: 11, color: '#FF4444' }}>
            End Interview
          </button>
        </div>
      )}

      {/* Prompt selector modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 400 }} onClick={onClose} />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 720, maxHeight: '80vh', backgroundColor: '#111115', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, zIndex: 401, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#E8E6E3' }}>System Design Interview</span>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(232,230,227,0.4)' }}><X size={16} /></button>
              </div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {INTERVIEW_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => startPrompt(prompt)}
                    style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.1s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,240,66,0.3)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#E8E6E3', marginBottom: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {prompt.title} <ChevronRight size={13} color="rgba(232,230,227,0.3)" />
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(232,230,227,0.5)', lineHeight: 1.5 }}>{prompt.description}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {prompt.constraints.slice(0, 2).map((c, i) => (
                        <span key={i} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(196,240,66,0.6)', backgroundColor: 'rgba(196,240,66,0.06)', padding: '2px 6px', borderRadius: 4 }}>{c}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
