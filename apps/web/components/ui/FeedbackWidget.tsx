'use client';

import { useState, useCallback } from 'react';
import { MessageSquare, X, Send, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCanvasStore } from '@/store/canvasStore';

type FeedbackType = 'bug' | 'feature' | 'general';

const TYPE_LABELS: Record<FeedbackType, string> = { bug: '🐛 Bug Report', feature: '✨ Feature Request', general: '💬 General Feedback' };

interface FeedbackEntry {
  type: FeedbackType;
  message: string;
  email: string;
  nodeCount: number;
  userAgent: string;
  submittedAt: string;
}

function saveFeedback(entry: FeedbackEntry) {
  try {
    const existing = JSON.parse(localStorage.getItem('vexo_feedback') ?? '[]') as FeedbackEntry[];
    existing.push(entry);
    localStorage.setItem('vexo_feedback', JSON.stringify(existing));
  } catch {
    // ignore
  }
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const nodeCount = useCanvasStore((s) => s.nodes.length);

  const handleSubmit = useCallback(() => {
    if (!message.trim()) return;
    saveFeedback({ type, message: message.trim(), email: email.trim(), nodeCount, userAgent: navigator.userAgent, submittedAt: new Date().toISOString() });
    setSubmitted(true);
    setTimeout(() => { setOpen(false); setSubmitted(false); setMessage(''); setEmail(''); }, 2500);
  }, [type, message, email, nodeCount]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        style={{ position: 'fixed', bottom: 20, right: 20, width: 44, height: 44, borderRadius: '50%', backgroundColor: '#16161B', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
        title="Send feedback"
      >
        <MessageSquare size={18} color="rgba(232,230,227,0.6)" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 500 }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'fixed', bottom: 72, right: 20, width: 320, backgroundColor: '#111115', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, zIndex: 501, padding: 16 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#E8E6E3' }}>Send Feedback</span>
                <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(232,230,227,0.4)' }}><X size={14} /></button>
              </div>

              {submitted ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle size={28} color="#C4F042" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 13, color: '#E8E6E3', marginBottom: 4 }}>Thanks for your feedback!</div>
                  <div style={{ fontSize: 11, color: 'rgba(232,230,227,0.4)' }}>Discuss on GitHub Issues for community response.</div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    {(Object.keys(TYPE_LABELS) as FeedbackType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        style={{ flex: 1, padding: '5px 4px', fontSize: 10, borderRadius: 6, border: `1px solid ${type === t ? 'rgba(196,240,66,0.3)' : 'rgba(255,255,255,0.05)'}`, backgroundColor: type === t ? 'rgba(196,240,66,0.08)' : 'transparent', color: type === t ? '#C4F042' : 'rgba(232,230,227,0.4)', cursor: 'pointer' }}
                      >
                        {TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the issue or feature..."
                    rows={4}
                    style={{ width: '100%', backgroundColor: '#16161B', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#E8E6E3', resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional)"
                    style={{ width: '100%', marginTop: 8, backgroundColor: '#16161B', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#E8E6E3', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!message.trim()}
                    style={{ width: '100%', marginTop: 10, backgroundColor: message.trim() ? '#C4F042' : 'rgba(196,240,66,0.2)', border: 'none', borderRadius: 8, padding: '9px', fontSize: 12, fontWeight: 600, color: message.trim() ? '#050507' : 'rgba(196,240,66,0.4)', cursor: message.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Send size={12} />Submit
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
