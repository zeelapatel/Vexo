'use client';

import { useState } from 'react';
import { useInterviewStore } from '@/store/interviewStore';

export function HintButton() {
  const scenario = useInterviewStore((s) => s.scenario);
  const hintsRevealed = useInterviewStore((s) => s.hintsRevealed);
  const revealNextHint = useInterviewStore((s) => s.revealNextHint);
  const [showPanel, setShowPanel] = useState(false);

  if (!scenario) return null;

  const totalHints = scenario.hints.length;
  const remaining = totalHints - hintsRevealed;
  const exhausted = remaining === 0;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowPanel((v) => !v)}
        disabled={exhausted}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          backgroundColor: exhausted ? 'transparent' : 'rgba(245,166,35,0.08)',
          border: `1px solid ${exhausted ? 'rgba(255,255,255,0.06)' : 'rgba(245,166,35,0.25)'}`,
          borderRadius: 6,
          color: exhausted ? 'rgba(232,230,227,0.25)' : '#f59e0b',
          fontSize: 11,
          cursor: exhausted ? 'not-allowed' : 'pointer',
          transition: 'all 0.1s',
        }}
      >
        💡 Hints ({remaining}/{totalHints})
      </button>

      {showPanel && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 320,
            backgroundColor: '#16161B',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: 16,
            zIndex: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>Hints</span>
            <button
              onClick={() => setShowPanel(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(232,230,227,0.4)', cursor: 'pointer', fontSize: 14 }}
            >×</button>
          </div>

          {/* Revealed hints */}
          {hintsRevealed > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {scenario.hints.slice(0, hintsRevealed).map((hint, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(245,166,35,0.06)',
                    border: '1px solid rgba(245,166,35,0.15)',
                    borderRadius: 6,
                    fontSize: 12,
                    color: 'rgba(232,230,227,0.8)',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ fontSize: 10, color: 'rgba(245,166,35,0.6)', display: 'block', marginBottom: 4 }}>
                    Hint {i + 1}
                  </span>
                  {hint}
                </div>
              ))}
            </div>
          )}

          {/* Reveal button */}
          {!exhausted && (
            <>
              <p style={{ fontSize: 11, color: 'rgba(232,230,227,0.4)', margin: '0 0 10px', lineHeight: 1.5 }}>
                Each hint costs <span style={{ color: '#f59e0b' }}>−5 points</span> from your final score.
              </p>
              <button
                onClick={() => { revealNextHint(); }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(245,166,35,0.12)',
                  border: '1px solid rgba(245,166,35,0.3)',
                  borderRadius: 6,
                  color: '#f59e0b',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(245,166,35,0.2)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(245,166,35,0.12)'; }}
              >
                Reveal Hint {hintsRevealed + 1} of {totalHints}
              </button>
            </>
          )}

          {exhausted && (
            <p style={{ fontSize: 12, color: 'rgba(232,230,227,0.4)', margin: 0, textAlign: 'center' }}>
              All hints revealed.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
