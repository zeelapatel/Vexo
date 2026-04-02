'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getScenarioById } from '@vexo/cbr';
import type { InterviewScenario } from '@vexo/types';
import { useAttemptStore, type Attempt } from '@/store/attemptStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useDesignStore } from '@/store/designStore';
import { saveDesignState } from '@/store/persistence';

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#4ade80',
  intermediate: '#facc15',
  advanced: '#f97316',
  expert: '#c084fc',
};

const COMPANY_LABELS: Record<string, string> = {
  netflix: 'Netflix',
  uber: 'Uber',
  stripe: 'Stripe',
  google: 'Google',
  meta: 'Meta',
};

function generateId() {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [scenario, setScenario] = useState<InterviewScenario | null>(null);
  const [notFound, setNotFound] = useState(false);

  const initialize = useAttemptStore((s) => s.initialize);
  const getAttempts = useAttemptStore((s) => s.getAttempts);
  const getBestScore = useAttemptStore((s) => s.getBestScore);
  const getBestGrade = useAttemptStore((s) => s.getBestGrade);
  const hasCompleted = useAttemptStore((s) => s.hasCompleted);
  const createDesign = useDesignStore((s) => s.createDesign);
  const setActiveDesign = useCanvasStore((s) => s.setActiveDesign);

  useEffect(() => {
    initialize();
    const s = getScenarioById(id);
    if (s) {
      setScenario(s);
    } else {
      setNotFound(true);
    }
  }, [id, initialize]);

  function handleStart() {
    if (!scenario) return;
    const newDesignId = createDesign();
    setActiveDesign(newDesignId, scenario.starterCanvas.nodes, scenario.starterCanvas.edges);
    // Persist immediately so initializeFromStorage picks it up after navigation
    saveDesignState(newDesignId, {
      nodes: scenario.starterCanvas.nodes,
      edges: scenario.starterCanvas.edges,
      viewport: { x: 0, y: 0, zoom: 1 },
    });

    const attempt: Attempt = {
      id: generateId(),
      scenarioId: scenario.id,
      canvasState: { nodes: scenario.starterCanvas.nodes, edges: scenario.starterCanvas.edges },
      score: null,
      startedAt: Date.now(),
      completedAt: null,
      duration: null,
      hintsUsed: 0,
    };

    try {
      localStorage.setItem('vexo_active_attempt', JSON.stringify(attempt));
    } catch {
      // ignore
    }

    router.push('/canvas');
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#050507', color: '#E8E6E3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 16 }}>Challenge not found.</p>
          <Link href="/challenges" style={{ color: '#C4F042' }}>Back to challenges</Link>
        </div>
      </div>
    );
  }

  if (!scenario) return null;

  const diffColor = DIFFICULTY_COLORS[scenario.difficulty] ?? '#E8E6E3';
  const pastAttempts = getAttempts(scenario.id);
  const completed = hasCompleted(scenario.id);
  const bestScore = getBestScore(scenario.id);
  const bestGrade = getBestGrade(scenario.id);

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#111115',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 16,
  };

  const h3Style: React.CSSProperties = {
    margin: '0 0 10px',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: 'rgba(232,230,227,0.4)',
  };

  const listStyle: React.CSSProperties = {
    margin: 0,
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    fontSize: 13,
    lineHeight: 1.5,
    color: '#E8E6E3',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050507', color: '#E8E6E3', fontFamily: 'var(--font-space-grotesk)' }}>
      {/* Nav */}
      <div style={{ height: 44, borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#111115', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <Link href="/" style={{ color: '#C4F042', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>Vexo</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>/</span>
        <Link href="/challenges" style={{ fontSize: 13, color: 'rgba(232,230,227,0.5)', textDecoration: 'none' }}>Challenges</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 13, color: 'rgba(232,230,227,0.6)' }}>{scenario.title}</span>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', color: diffColor, backgroundColor: `${diffColor}18`, border: `1px solid ${diffColor}30`, borderRadius: 4, padding: '2px 6px' }}>
              {scenario.difficulty}
            </span>
            {scenario.company && (
              <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(232,230,227,0.5)', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '2px 6px' }}>
                {COMPANY_LABELS[scenario.company] ?? scenario.company}
              </span>
            )}
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(232,230,227,0.3)' }}>
              {scenario.timeLimit} min
            </span>
            {bestGrade && (
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#C4F042', marginLeft: 'auto' }}>
                Best: {bestGrade} ({bestScore}/100)
              </span>
            )}
          </div>
          <h1 style={{ margin: '0 0 10px', fontSize: 28, fontWeight: 700 }}>{scenario.title}</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(232,230,227,0.6)', lineHeight: 1.6 }}>{scenario.description}</p>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#C4F042', color: '#050507', fontWeight: 700, fontSize: 14, padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 28, transition: 'opacity 0.1s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          ▶ Start Challenge
        </button>

        {/* Requirements */}
        <div style={sectionStyle}>
          <h3 style={h3Style}>Functional Requirements</h3>
          <ol style={listStyle}>
            {scenario.requirements.map((r, i) => <li key={i}>{r}</li>)}
          </ol>
        </div>

        {/* NFRs */}
        <div style={sectionStyle}>
          <h3 style={h3Style}>Non-Functional Requirements</h3>
          <ul style={listStyle}>
            {scenario.nonFunctionalRequirements.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>

        {/* Constraints */}
        {scenario.constraints.length > 0 && (
          <div style={sectionStyle}>
            <h3 style={h3Style}>Constraints</h3>
            <ul style={listStyle}>
              {scenario.constraints.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}

        {/* Reference solution — only after first completion */}
        {completed && (
          <div style={{ ...sectionStyle, border: '1px solid rgba(196,240,66,0.2)', backgroundColor: 'rgba(196,240,66,0.04)' }}>
            <h3 style={{ ...h3Style, color: '#C4F042' }}>Reference Solution (Unlocked)</h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(232,230,227,0.5)', lineHeight: 1.5 }}>
              {"You've completed this challenge. View the reference solution to compare your approach."}
            </p>
            <Link
              href={`/challenges/${scenario.id}/reference`}
              style={{ fontSize: 13, color: '#C4F042', textDecoration: 'none', fontWeight: 600 }}
            >
              View Reference Solution →
            </Link>
          </div>
        )}

        {/* Past attempts */}
        {pastAttempts.length > 0 && (
          <div style={sectionStyle}>
            <h3 style={h3Style}>Attempt History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pastAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(232,230,227,0.5)' }}
                >
                  <span>{new Date(attempt.startedAt).toLocaleDateString()}</span>
                  {attempt.score ? (
                    <>
                      <span style={{ color: '#C4F042' }}>{attempt.score.grade}</span>
                      <span>{attempt.score.totalScore}/100</span>
                    </>
                  ) : (
                    <span style={{ color: 'rgba(232,230,227,0.3)' }}>incomplete</span>
                  )}
                  {attempt.duration && <span>{Math.round(attempt.duration / 60)}m</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
