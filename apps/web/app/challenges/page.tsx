'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { InterviewScenario, Difficulty } from '@vexo/types';
import { getAllScenarios, searchScenarios } from '@vexo/cbr';
import { ScenarioCard } from '@/components/challenges/ScenarioCard';
import { FilterBar, type FilterState } from '@/components/challenges/FilterBar';
import { useAttemptStore } from '@/store/attemptStore';

const ALL_DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function ChallengesPage() {
  const [filters, setFilters] = useState<FilterState>({
    difficulties: ALL_DIFFICULTIES,
    category: 'all',
    company: 'all',
    query: '',
  });

  const initialize = useAttemptStore((s) => s.initialize);
  const getBestScore = useAttemptStore((s) => s.getBestScore);
  const getBestGrade = useAttemptStore((s) => s.getBestGrade);
  const hasCompleted = useAttemptStore((s) => s.hasCompleted);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const allScenarios = useMemo(() => getAllScenarios(), []);

  const filtered = useMemo(() => {
    let list: InterviewScenario[] = filters.query
      ? searchScenarios(filters.query)
      : allScenarios;

    if (filters.difficulties.length < ALL_DIFFICULTIES.length) {
      list = list.filter((s) => filters.difficulties.includes(s.difficulty));
    }
    if (filters.category !== 'all') {
      list = list.filter((s) => s.category === filters.category);
    }
    if (filters.company !== 'all') {
      list = list.filter((s) => s.company === filters.company);
    }
    return list;
  }, [allScenarios, filters]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#050507',
        color: '#E8E6E3',
        fontFamily: 'var(--font-space-grotesk)',
      }}
    >
      {/* Nav */}
      <div
        style={{
          height: 44,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: '#111115',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 16,
        }}
      >
        <Link href="/" style={{ color: '#C4F042', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
          Vexo
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 13, color: 'rgba(232,230,227,0.6)' }}>Challenges</span>
        <div style={{ flex: 1 }} />
        <Link
          href="/canvas"
          style={{
            fontSize: 12,
            color: 'rgba(232,230,227,0.5)',
            textDecoration: 'none',
            padding: '4px 10px',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
          }}
        >
          Open Canvas
        </Link>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Challenges</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'rgba(232,230,227,0.4)' }}>
            52 system design challenges from beginner to FAANG-level expert.
          </p>
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          totalCount={allScenarios.length}
          filteredCount={filtered.length}
        />

        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 0',
              color: 'rgba(232,230,227,0.3)',
              fontSize: 14,
            }}
          >
            No challenges match your filters.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {filtered.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                bestScore={getBestScore(scenario.id)}
                bestGrade={getBestGrade(scenario.id)}
                hasCompleted={hasCompleted(scenario.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
