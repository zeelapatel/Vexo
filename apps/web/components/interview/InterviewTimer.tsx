'use client';

import { useState, useEffect, useRef } from 'react';
import { useInterviewStore } from '@/store/interviewStore';

function formatTime(seconds: number): string {
  const totalSec = Math.max(0, Math.floor(seconds));
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface InterviewTimerProps {
  onTimeUp: () => void;
}

export function InterviewTimer({ onTimeUp }: InterviewTimerProps) {
  const timeLimitSeconds = useInterviewStore((s) => s.timeLimitSeconds);
  const getRemainingSeconds = useInterviewStore((s) => s.getRemainingSeconds);
  const isPaused = useInterviewStore((s) => s.isPaused);
  const pausesUsed = useInterviewStore((s) => s.pausesUsed);
  const pause = useInterviewStore((s) => s.pause);
  const resume = useInterviewStore((s) => s.resume);

  const [remaining, setRemaining] = useState(() => getRemainingSeconds());
  const timeUpFired = useRef(false);

  useEffect(() => {
    const tick = () => setRemaining(getRemainingSeconds());
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [getRemainingSeconds]);

  useEffect(() => {
    if (remaining <= 0 && !timeUpFired.current) {
      timeUpFired.current = true;
      onTimeUp();
    }
  }, [remaining, onTimeUp]);

  const pct = timeLimitSeconds > 0 ? remaining / timeLimitSeconds : 0;
  let color = '#C4F042';
  let pulse = false;
  if (pct <= 0.1) { color = '#ef4444'; pulse = true; }
  else if (pct <= 0.25) { color = '#f59e0b'; }

  const canPause = !isPaused && pausesUsed < 2 && remaining > 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {isPaused && (
        <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
          PAUSED
        </span>
      )}
      <span
        onClick={isPaused ? resume : (canPause ? pause : undefined)}
        title={isPaused ? 'Click to resume' : canPause ? `Pause (${2 - pausesUsed} remaining)` : undefined}
        style={{
          fontSize: 14,
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color,
          cursor: (isPaused || canPause) ? 'pointer' : 'default',
          animation: pulse ? 'vexo-pulse 1s ease-in-out infinite' : undefined,
          userSelect: 'none',
        }}
      >
        {remaining <= 0 ? "TIME'S UP" : formatTime(remaining)}
      </span>

      <style>{`
        @keyframes vexo-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
