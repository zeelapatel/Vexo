'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAttemptStore, type Attempt } from '@/store/attemptStore';
import { Scorecard } from '@/components/scoring/Scorecard';

export default function ResultsPage() {
  const { id: scenarioId, attemptId } = useParams<{ id: string; attemptId: string }>();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [notFound, setNotFound] = useState(false);

  const initialize = useAttemptStore((s) => s.initialize);
  const getAttempts = useAttemptStore((s) => s.getAttempts);

  useEffect(() => {
    initialize();
    const attempts = getAttempts(scenarioId);
    const found = attempts.find((a) => a.id === attemptId);
    if (found) {
      setAttempt(found);
    } else {
      setNotFound(true);
    }
  }, [scenarioId, attemptId, initialize, getAttempts]);

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#050507', color: '#E8E6E3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p>Attempt not found.</p>
          <Link href="/challenges" style={{ color: '#C4F042' }}>Back to challenges</Link>
        </div>
      </div>
    );
  }

  if (!attempt) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050507', color: '#E8E6E3', fontFamily: 'var(--font-space-grotesk)' }}>
      {/* Nav */}
      <div style={{ height: 44, borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#111115', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <Link href="/" style={{ color: '#C4F042', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>Vexo</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>/</span>
        <Link href="/challenges" style={{ fontSize: 13, color: 'rgba(232,230,227,0.5)', textDecoration: 'none' }}>Challenges</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>/</span>
        <Link href={`/challenges/${scenarioId}`} style={{ fontSize: 13, color: 'rgba(232,230,227,0.5)', textDecoration: 'none' }}>
          {scenarioId}
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 13, color: 'rgba(232,230,227,0.6)' }}>Results</span>
      </div>

      <div style={{ padding: '40px 24px' }}>
        {attempt.score ? (
          <Scorecard
            result={attempt.score}
            scenarioId={scenarioId}
            _attemptId={attemptId}
            durationSeconds={attempt.duration}
            hintsUsed={attempt.hintsUsed}
          />
        ) : (
          <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ color: 'rgba(232,230,227,0.5)', fontSize: 14 }}>
              This attempt was not scored (abandoned or incomplete).
            </p>
            <Link
              href={`/challenges/${scenarioId}`}
              style={{ color: '#C4F042', fontSize: 14, textDecoration: 'none' }}
            >
              Try again →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
