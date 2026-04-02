'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ScoreResult } from '@/store/attemptStore';

interface ScorecardProps {
  result: ScoreResult;
  scenarioId: string;
  _attemptId: string;
  durationSeconds: number | null;
  hintsUsed: number;
}

const GRADE_COLORS: Record<string, string> = {
  S: '#C4F042',
  A: '#4ade80',
  B: '#facc15',
  C: '#f97316',
  D: '#ef4444',
  F: 'rgba(232,230,227,0.35)',
};

function AnimatedNumber({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return <>{value}</>;
}

function CategoryBar({ category, animDelay }: { category: ScoreResult['categories'][0]; animDelay: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(category.score), animDelay);
    return () => clearTimeout(timer);
  }, [category.score, animDelay]);

  const barColor = category.score >= 70 ? '#4ade80' : category.score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(232,230,227,0.7)' }}>{category.name}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'rgba(232,230,227,0.3)', fontFamily: 'var(--font-mono)' }}>
            weight {Math.round(category.weight * 100)}%
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: barColor }}>
            {category.score}/100
          </span>
        </div>
      </div>
      <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${width}%`,
            backgroundColor: barColor,
            borderRadius: 3,
            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
    </div>
  );
}

export function Scorecard({ result, scenarioId, durationSeconds, hintsUsed }: ScorecardProps) {
  const gradeColor = GRADE_COLORS[result.grade] ?? '#E8E6E3';
  const minutes = durationSeconds ? Math.floor(durationSeconds / 60) : null;
  const seconds = durationSeconds ? durationSeconds % 60 : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680, margin: '0 auto' }}>
      {/* Grade header */}
      <div
        style={{
          backgroundColor: '#111115',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 32,
        }}
      >
        {/* Grade letter */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: gradeColor,
              lineHeight: 1,
              textShadow: `0 0 40px ${gradeColor}40`,
            }}
          >
            {result.grade}
          </div>
        </div>

        {/* Score + meta */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#E8E6E3', lineHeight: 1 }}>
            <AnimatedNumber target={result.totalScore} />/100
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            {minutes !== null && (
              <span style={{ fontSize: 12, color: 'rgba(232,230,227,0.4)', fontFamily: 'var(--font-mono)' }}>
                {minutes}m {seconds}s
              </span>
            )}
            {result.hintPenalty > 0 && (
              <span style={{ fontSize: 12, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                −{result.hintPenalty} hint penalty ({hintsUsed} hint{hintsUsed !== 1 ? 's' : ''} used)
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <Link
            href={`/challenges/${scenarioId}`}
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '8px 18px',
              backgroundColor: '#C4F042',
              color: '#050507',
              fontWeight: 700,
              fontSize: 13,
              borderRadius: 7,
              textDecoration: 'none',
            }}
          >
            Try Again
          </Link>
          <Link
            href={`/challenges/${scenarioId}/reference`}
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '8px 18px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: 'rgba(232,230,227,0.7)',
              fontSize: 13,
              borderRadius: 7,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Reference Solution
          </Link>
        </div>
      </div>

      {/* Category bars */}
      <div
        style={{
          backgroundColor: '#111115',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <h3 style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(232,230,227,0.4)' }}>
          Category Breakdown
        </h3>
        {result.categories.map((cat, i) => (
          <CategoryBar key={cat.key} category={cat} animDelay={300 + i * 100} />
        ))}
      </div>

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(74,222,128,0.04)',
            border: '1px solid rgba(74,222,128,0.15)',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <h3 style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4ade80' }}>
            Strengths
          </h3>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {result.strengths.map((s, i) => (
              <li key={i} style={{ fontSize: 13, color: 'rgba(232,230,227,0.75)', lineHeight: 1.5 }}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {result.weaknesses.length > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(245,158,11,0.04)',
            border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <h3 style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f59e0b' }}>
            Areas for Improvement
          </h3>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {result.weaknesses.map((w, i) => (
              <li key={i} style={{ fontSize: 13, color: 'rgba(232,230,227,0.75)', lineHeight: 1.5 }}>{w}</li>
            ))}
          </ul>
          {result.suggestions.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(245,158,11,0.1)' }}>
              {result.suggestions.map((s, i) => (
                <p key={i} style={{ margin: '4px 0', fontSize: 12, color: 'rgba(232,230,227,0.5)', lineHeight: 1.5 }}>
                  → {s}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Back link */}
      <Link
        href="/challenges"
        style={{ fontSize: 12, color: 'rgba(232,230,227,0.35)', textDecoration: 'none', textAlign: 'center', paddingBottom: 32 }}
      >
        ← Back to challenges
      </Link>
    </div>
  );
}
