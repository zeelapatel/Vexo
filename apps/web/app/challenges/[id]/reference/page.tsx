'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getScenarioById } from '@vexo/cbr';
import type { InterviewScenario } from '@vexo/types';
import { useAttemptStore } from '@/store/attemptStore';
import { SolutionOverlay } from '@/components/comparison/SolutionOverlay';
import { ExplanationWalkthrough } from '@/components/comparison/ExplanationWalkthrough';
import { generateImprovements } from '@/lib/scoring/improvements';
import type { Improvement } from '@/lib/scoring/improvements';

type ViewMode = 'mine' | 'reference' | 'overlay';

export default function ReferencePage() {
  const { id: scenarioId } = useParams<{ id: string }>();
  const [scenario, setScenario] = useState<InterviewScenario | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overlay');
  const [improvements, setImprovements] = useState<Improvement[]>([]);

  const initialize = useAttemptStore((s) => s.initialize);
  const getAttempts = useAttemptStore((s) => s.getAttempts);

  useEffect(() => {
    initialize();
    const s = getScenarioById(scenarioId);
    setScenario(s ?? null);

    if (s) {
      const attempts = getAttempts(scenarioId);
      const best = attempts.find((a) => a.score !== null);
      if (best?.score) {
        const imps = generateImprovements(best.canvasState.nodes, s.referenceSolution.nodes, best.score, s);
        setImprovements(imps);
      }
    }
  }, [scenarioId, initialize, getAttempts]);

  if (!scenario) return null;

  const latestAttempt = getAttempts(scenarioId).find((a) => a.score !== null);

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#111115',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 16,
  };

  const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#4ade80' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050507', color: '#E8E6E3', fontFamily: 'var(--font-space-grotesk)' }}>
      {/* Nav */}
      <div style={{ height: 44, borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#111115', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <Link href="/" style={{ color: '#C4F042', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>Vexo</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>/</span>
        <Link href="/challenges" style={{ fontSize: 13, color: 'rgba(232,230,227,0.5)', textDecoration: 'none' }}>Challenges</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>/</span>
        <Link href={`/challenges/${scenarioId}`} style={{ fontSize: 13, color: 'rgba(232,230,227,0.5)', textDecoration: 'none' }}>{scenario.title}</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 13, color: 'rgba(232,230,227,0.6)' }}>Reference Solution</span>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>{scenario.title}</h1>
        <p style={{ margin: '0 0 28px', fontSize: 13, color: 'rgba(232,230,227,0.4)' }}>Reference solution — study the architecture, then try again.</p>

        {/* Comparison overlay */}
        {latestAttempt && (
          <div style={sectionStyle}>
            <h3 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(232,230,227,0.4)' }}>
              Design Comparison
            </h3>
            <SolutionOverlay
              userNodes={latestAttempt.canvasState.nodes}
              referenceNodes={scenario.referenceSolution.nodes}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
        )}

        {/* Explanation walkthrough */}
        <div style={sectionStyle}>
          <h3 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(232,230,227,0.4)' }}>
            Solution Walkthrough
          </h3>
          <ExplanationWalkthrough explanation={scenario.referenceSolution.explanation} />
        </div>

        {/* Improvement suggestions */}
        {improvements.length > 0 && (
          <div style={sectionStyle}>
            <h3 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(232,230,227,0.4)' }}>
              Improvement Suggestions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {improvements.map((imp, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${PRIORITY_COLORS[imp.priority]}25`,
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: PRIORITY_COLORS[imp.priority],
                      backgroundColor: `${PRIORITY_COLORS[imp.priority]}15`,
                      border: `1px solid ${PRIORITY_COLORS[imp.priority]}30`,
                      borderRadius: 4,
                      padding: '2px 6px',
                    }}>
                      {imp.priority}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#E8E6E3' }}>{imp.title}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(232,230,227,0.6)', lineHeight: 1.5 }}>{imp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Try again */}
        <div style={{ display: 'flex', gap: 12, paddingBottom: 40 }}>
          <Link
            href={`/challenges/${scenarioId}`}
            style={{
              padding: '10px 24px',
              backgroundColor: '#C4F042',
              color: '#050507',
              fontWeight: 700,
              fontSize: 13,
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            Try Again
          </Link>
          <Link
            href="/challenges"
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: 'rgba(232,230,227,0.5)',
              fontSize: 13,
              borderRadius: 8,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Back to Challenges
          </Link>
        </div>
      </div>
    </div>
  );
}
