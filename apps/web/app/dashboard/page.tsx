'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAttemptStore } from '@/store/attemptStore';
import { getNextRecommendations, type Recommendation } from '@/lib/recommendations';
import { checkStreakOnLoad, type StreakData } from '@/lib/streaks';
import { getEarnedAchievements, type Achievement } from '@/lib/achievements';

export default function DashboardPage() {
  const initialize = useAttemptStore((s) => s.initialize);
  const getTotalCompleted = useAttemptStore((s) => s.getTotalCompleted);
  const getAverageScore = useAttemptStore((s) => s.getAverageScore);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loaded, setLoaded] = useState(false);

  const store = useAttemptStore();

  useEffect(() => {
    initialize();
    const streakData = checkStreakOnLoad();
    setStreak(streakData);
    const earned = getEarnedAchievements();
    setAchievements(earned);
    const recs = getNextRecommendations(store);
    setRecommendations(recs);
    setLoaded(true);
  }, [initialize, store]);

  if (!loaded) return null;

  const totalCompleted = getTotalCompleted();
  const avgScore = getAverageScore();
  const categoryAverages = store.getCategoryAverages();

  const statStyle: React.CSSProperties = {
    backgroundColor: '#111115',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  const statLabel: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'rgba(232,230,227,0.35)',
  };

  const statValue: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 800,
    fontFamily: 'var(--font-mono)',
    color: '#E8E6E3',
    lineHeight: 1,
  };

  const CATEGORY_LABELS: Record<string, string> = {
    completeness: 'Completeness',
    scalability: 'Scalability',
    availability: 'Availability',
    data_model: 'Data Model',
    tradeoffs: 'Trade-offs',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050507', color: '#E8E6E3', fontFamily: 'var(--font-space-grotesk)' }}>
      {/* Nav */}
      <div style={{ height: 44, borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#111115', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <Link href="/" style={{ color: '#C4F042', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>Vexo</Link>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 13, color: 'rgba(232,230,227,0.6)' }}>Dashboard</span>
        <div style={{ flex: 1 }} />
        <Link href="/challenges" style={{ fontSize: 12, color: '#C4F042', textDecoration: 'none', fontWeight: 600 }}>
          Browse Challenges →
        </Link>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ margin: '0 0 28px', fontSize: 26, fontWeight: 700 }}>Your Progress</h1>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div style={statStyle}>
            <span style={statLabel}>Challenges Done</span>
            <span style={statValue}>{totalCompleted}</span>
          </div>
          <div style={statStyle}>
            <span style={statLabel}>Average Score</span>
            <span style={{ ...statValue, color: avgScore ? (avgScore >= 70 ? '#4ade80' : avgScore >= 50 ? '#f59e0b' : '#ef4444') : '#E8E6E3' }}>
              {avgScore ?? '—'}
            </span>
          </div>
          <div style={statStyle}>
            <span style={statLabel}>🔥 Streak</span>
            <span style={{ ...statValue, color: streak?.currentStreak ? '#C4F042' : 'rgba(232,230,227,0.3)' }}>
              {streak?.currentStreak ?? 0}
              <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(232,230,227,0.35)', marginLeft: 4 }}>days</span>
            </span>
          </div>
          <div style={statStyle}>
            <span style={statLabel}>Longest Streak</span>
            <span style={statValue}>{streak?.longestStreak ?? 0}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Category radar (text-based) */}
          {Object.keys(categoryAverages).length > 0 && (
            <div style={{ backgroundColor: '#111115', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 20px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(232,230,227,0.4)' }}>
                Category Averages
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(categoryAverages).map(([key, avg]) => {
                  const barColor = avg >= 70 ? '#4ade80' : avg >= 40 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: 'rgba(232,230,227,0.6)' }}>
                        <span>{CATEGORY_LABELS[key] ?? key}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: barColor }}>{avg}</span>
                      </div>
                      <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${avg}%`, backgroundColor: barColor, borderRadius: 2, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Achievements */}
          <div style={{ backgroundColor: '#111115', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 20px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(232,230,227,0.4)' }}>
              Achievements ({achievements.length})
            </h3>
            {achievements.length === 0 ? (
              <p style={{ fontSize: 12, color: 'rgba(232,230,227,0.3)', margin: 0 }}>
                Complete your first challenge to earn achievements.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {achievements.slice(0, 5).map((a) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{a.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#E8E6E3' }}>{a.name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(232,230,227,0.4)' }}>{a.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div style={{ backgroundColor: '#111115', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '16px 20px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(232,230,227,0.4)' }}>
              Recommended Next
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recommendations.map((rec) => (
                <Link
                  key={rec.scenario.id}
                  href={`/challenges/${rec.scenario.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    textDecoration: 'none',
                    color: '#E8E6E3',
                    transition: 'border-color 0.1s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{rec.scenario.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(232,230,227,0.4)', marginTop: 2 }}>{rec.reason}</div>
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(232,230,227,0.3)', fontFamily: 'var(--font-mono)' }}>
                    {rec.scenario.timeLimit}m →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {totalCompleted === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 16, color: 'rgba(232,230,227,0.5)', marginBottom: 20 }}>
              {"You haven't completed any challenges yet."}
            </p>
            <Link
              href="/challenges"
              style={{
                padding: '12px 28px',
                backgroundColor: '#C4F042',
                color: '#050507',
                fontWeight: 700,
                fontSize: 14,
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              Start Practising
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
