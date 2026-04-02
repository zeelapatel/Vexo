'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface BlockedConnectionFeedbackProps {
  nodeId: string | null;
  reason: string | null;
  onDone: () => void;
}

export function BlockedConnectionFeedback({
  nodeId: _nodeId,
  reason,
  onDone,
}: BlockedConnectionFeedbackProps) {
  useEffect(() => {
    if (!reason) return;
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [reason, onDone]);

  return (
    <AnimatePresence>
      {reason && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          style={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(255,68,68,0.12)',
            border: '1px solid rgba(255,68,68,0.4)',
            borderRadius: 8,
            padding: '8px 14px',
            maxWidth: 400,
            zIndex: 500,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: '#FF4444',
              fontWeight: 500,
              marginBottom: 2,
            }}
          >
            Connection Blocked
          </div>
          <div style={{ fontSize: 11, color: 'rgba(232,230,227,0.7)' }}>{reason}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
