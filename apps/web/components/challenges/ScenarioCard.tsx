'use client';

import Link from 'next/link';
import type { InterviewScenario } from '@vexo/types';
import type { ScoreResult } from '@/store/attemptStore';

interface ScenarioCardProps {
  scenario: InterviewScenario;
  bestScore: number | null;
  bestGrade: ScoreResult['grade'] | null;
  hasCompleted: boolean;
}

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

const GRADE_COLORS: Record<string, string> = {
  S: '#C4F042',
  A: '#4ade80',
  B: '#facc15',
  C: '#f97316',
  D: '#ef4444',
  F: 'rgba(232,230,227,0.3)',
};

export function ScenarioCard({ scenario, bestScore, bestGrade, hasCompleted }: ScenarioCardProps) {
  const diffColor = DIFFICULTY_COLORS[scenario.difficulty] ?? '#E8E6E3';

  return (
    <Link
      href={`/challenges/${scenario.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '14px 16px',
        backgroundColor: '#111115',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        textDecoration: 'none',
        color: '#E8E6E3',
        transition: 'border-color 0.15s, background 0.15s',
        cursor: 'pointer',
        minHeight: 140,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)';
        (e.currentTarget as HTMLElement).style.backgroundColor = '#141418';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
        (e.currentTarget as HTMLElement).style.backgroundColor = '#111115';
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Difficulty badge */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: diffColor,
            backgroundColor: `${diffColor}18`,
            border: `1px solid ${diffColor}30`,
            borderRadius: 4,
            padding: '2px 6px',
          }}
        >
          {scenario.difficulty}
        </span>

        {/* Company tag */}
        {scenario.company && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: 'rgba(232,230,227,0.5)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4,
              padding: '2px 6px',
            }}
          >
            {COMPANY_LABELS[scenario.company] ?? scenario.company}
          </span>
        )}

        {/* Time limit */}
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'rgba(232,230,227,0.3)',
            marginLeft: 'auto',
          }}
        >
          {scenario.timeLimit}m
        </span>
      </div>

      {/* Title */}
      <p
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 500,
          color: '#E8E6E3',
          lineHeight: 1.4,
        }}
      >
        {scenario.title}
      </p>

      {/* Category */}
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: 'rgba(232,230,227,0.35)',
          textTransform: 'capitalize',
          flex: 1,
        }}
      >
        {scenario.category.replace(/-/g, ' ')}
      </p>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {hasCompleted && bestGrade ? (
          <>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: GRADE_COLORS[bestGrade] ?? '#E8E6E3',
              }}
            >
              {bestGrade}
            </span>
            <span
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'rgba(232,230,227,0.4)',
              }}
            >
              {bestScore}/100
            </span>
          </>
        ) : (
          <span style={{ fontSize: 11, color: 'rgba(232,230,227,0.25)' }}>Not started</span>
        )}
      </div>
    </Link>
  );
}
