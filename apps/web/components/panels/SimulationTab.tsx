'use client';

import type { VexoNode as VexoNodeType } from '@vexo/types';
import type { CBREntry } from '@vexo/types';
import { SystemStatus } from '@vexo/types';

interface SimulationTabProps {
  node: VexoNodeType;
  cbrEntry: CBREntry | undefined;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontFamily: 'var(--font-mono, monospace)',
        color: 'rgba(232,230,227,0.35)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: 8,
        marginTop: 16,
      }}
    >
      {children}
    </div>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 12, color: 'rgba(232,230,227,0.5)' }}>{label}</span>
      <span
        style={{ fontSize: 12, fontFamily: 'var(--font-mono, monospace)', color: color ?? '#E8E6E3' }}
      >
        {value}
      </span>
    </div>
  );
}

const statusColor: Record<SystemStatus, string> = {
  [SystemStatus.Healthy]: '#C4F042',
  [SystemStatus.Warning]: '#F5A623',
  [SystemStatus.Critical]: '#FF4444',
  [SystemStatus.Idle]: 'rgba(232,230,227,0.3)',
};

export function SimulationTab({ node, cbrEntry }: SimulationTabProps) {
  const { metrics, status } = node.data;
  const satPct = Math.round(metrics.saturation * 100);
  const satColor = satPct > 80 ? '#FF4444' : satPct > 60 ? '#F5A623' : '#C4F042';

  return (
    <div>
      <SectionLabel>Live Metrics</SectionLabel>
      <MetricRow label="Status" value={status} color={statusColor[status]} />
      <MetricRow
        label="Current RPS"
        value={`${metrics.currentRPS.toLocaleString()}`}
        color="rgba(232,230,227,0.8)"
      />
      <MetricRow
        label="Latency p50"
        value={`${metrics.latencyP50}ms`}
        color={statusColor[status]}
      />
      <MetricRow
        label="Latency p99"
        value={`${metrics.latencyP99}ms`}
        color={statusColor[status]}
      />
      <MetricRow label="Saturation" value={`${satPct}%`} color={satColor} />

      {cbrEntry && (
        <>
          <SectionLabel>Capacity Envelope</SectionLabel>
          <MetricRow
            label="Max RPS"
            value={`${cbrEntry.capacity.max_rps.toLocaleString()}`}
            color="rgba(232,230,227,0.6)"
          />
          <MetricRow
            label="Baseline p50"
            value={`${cbrEntry.capacity.latency_p50_ms}ms`}
            color="rgba(232,230,227,0.6)"
          />
          <MetricRow
            label="Baseline p99"
            value={`${cbrEntry.capacity.latency_p99_ms}ms`}
            color="rgba(232,230,227,0.6)"
          />
          <MetricRow
            label="Throttle Mode"
            value={cbrEntry.throttle_behaviour}
            color="rgba(232,230,227,0.6)"
          />

          {cbrEntry.failure_modes.length > 0 && (
            <>
              <SectionLabel>Failure Modes</SectionLabel>
              {cbrEntry.failure_modes.map((fm) => (
                <div
                  key={fm.name}
                  style={{
                    marginBottom: 8,
                    padding: '8px 10px',
                    backgroundColor: 'rgba(255,68,68,0.06)',
                    borderRadius: 6,
                    border: '1px solid rgba(255,68,68,0.1)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#FF4444', marginBottom: 3 }}>
                    {fm.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(232,230,227,0.45)', lineHeight: 1.4 }}>
                    {fm.impact}
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
