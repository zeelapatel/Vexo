'use client';

import type { Difficulty, ScenarioCategory, Company } from '@vexo/types';

export interface FilterState {
  difficulties: Difficulty[];
  category: ScenarioCategory | 'all';
  company: Exclude<Company, null> | 'all';
  query: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];
const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: '#4ade80',
  intermediate: '#facc15',
  advanced: '#f97316',
  expert: '#c084fc',
};

const CATEGORIES: { value: ScenarioCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'databases', label: 'Databases' },
  { value: 'caching', label: 'Caching' },
  { value: 'messaging', label: 'Messaging' },
  { value: 'real-time', label: 'Real-time' },
  { value: 'storage', label: 'Storage' },
  { value: 'search', label: 'Search' },
  { value: 'social', label: 'Social' },
  { value: 'e-commerce', label: 'E-commerce' },
  { value: 'streaming', label: 'Streaming' },
  { value: 'infrastructure', label: 'Infrastructure' },
];

const COMPANIES: { value: Exclude<Company, null> | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'netflix', label: 'Netflix' },
  { value: 'uber', label: 'Uber' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'google', label: 'Google' },
  { value: 'meta', label: 'Meta' },
];

export function FilterBar({ filters, onChange, totalCount, filteredCount }: FilterBarProps) {
  function toggleDifficulty(d: Difficulty) {
    const current = filters.difficulties;
    const next = current.includes(d) ? current.filter((x) => x !== d) : [...current, d];
    onChange({ ...filters, difficulties: next.length === 0 ? DIFFICULTIES : next });
  }

  const selectStyle: React.CSSProperties = {
    backgroundColor: '#111115',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    color: '#E8E6E3',
    fontSize: 12,
    padding: '5px 10px',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '14px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 20,
      }}
    >
      {/* Search + counts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="text"
          placeholder="Search challenges…"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          style={{
            flex: 1,
            backgroundColor: '#111115',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            color: '#E8E6E3',
            fontSize: 13,
            padding: '6px 12px',
            outline: 'none',
            maxWidth: 360,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'rgba(232,230,227,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          {filteredCount} / {totalCount}
        </span>
      </div>

      {/* Difficulty pills + category + company */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {DIFFICULTIES.map((d) => {
          const active = filters.difficulties.includes(d);
          const color = DIFFICULTY_COLORS[d];
          return (
            <button
              key={d}
              onClick={() => toggleDifficulty(d)}
              style={{
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'capitalize',
                borderRadius: 20,
                padding: '4px 12px',
                cursor: 'pointer',
                border: `1px solid ${active ? color + '50' : 'rgba(255,255,255,0.08)'}`,
                backgroundColor: active ? `${color}18` : 'transparent',
                color: active ? color : 'rgba(232,230,227,0.4)',
                transition: 'all 0.1s',
              }}
            >
              {d}
            </button>
          );
        })}

        <div style={{ width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.07)', margin: '0 4px' }} />

        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value as FilterState['category'] })}
          style={selectStyle}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={filters.company}
          onChange={(e) => onChange({ ...filters, company: e.target.value as FilterState['company'] })}
          style={selectStyle}
        >
          {COMPANIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
