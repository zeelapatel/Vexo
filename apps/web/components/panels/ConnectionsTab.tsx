'use client';

import type { VexoNode as VexoNodeType, VexoEdge as VexoEdgeType } from '@vexo/types';
import { useNodes } from '@xyflow/react';

interface ConnectionsTabProps {
  node: VexoNodeType;
  edges: VexoEdgeType[];
}

const connectionTypeColors: Record<string, string> = {
  SYNC_HTTP: '#4A9EFF',
  SYNC_GRPC: '#A855F7',
  ASYNC_QUEUE: '#F5A623',
  ASYNC_STREAM: '#F5A623',
  DB_READ: '#C4F042',
  DB_WRITE: '#FF4444',
  DB_REPLICATION: '#C4F042',
  CACHE_READ: '#C4F042',
  CACHE_WRITE: '#F5A623',
  CDN_ORIGIN: '#4A9EFF',
  DNS_RESOLUTION: '#4A9EFF',
  AUTH_CHECK: '#FF4444',
  HEALTH_CHECK: 'rgba(232,230,227,0.4)',
};

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

export function ConnectionsTab({ node, edges }: ConnectionsTabProps) {
  const allNodes = useNodes<VexoNodeType>();
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  const inbound = edges.filter((e) => e.target === node.id);
  const outbound = edges.filter((e) => e.source === node.id);

  if (edges.length === 0) {
    return (
      <div
        style={{ fontSize: 12, color: 'rgba(232,230,227,0.35)', textAlign: 'center', paddingTop: 24 }}
      >
        No connections yet.
      </div>
    );
  }

  return (
    <div>
      {inbound.length > 0 && (
        <>
          <SectionLabel>Inbound ({inbound.length})</SectionLabel>
          {inbound.map((e) => {
            const source = nodeMap.get(e.source);
            const connType = e.data?.connectionType ?? 'SYNC_HTTP';
            return (
              <EdgeRow
                key={e.id}
                label={source?.data.label ?? e.source}
                connType={String(connType)}
                direction="in"
              />
            );
          })}
        </>
      )}
      {outbound.length > 0 && (
        <>
          <SectionLabel>Outbound ({outbound.length})</SectionLabel>
          {outbound.map((e) => {
            const target = nodeMap.get(e.target);
            const connType = e.data?.connectionType ?? 'SYNC_HTTP';
            return (
              <EdgeRow
                key={e.id}
                label={target?.data.label ?? e.target}
                connType={String(connType)}
                direction="out"
              />
            );
          })}
        </>
      )}
    </div>
  );
}

function EdgeRow({
  label,
  connType,
  direction,
}: {
  label: string;
  connType: string;
  direction: 'in' | 'out';
}) {
  const color = connectionTypeColors[connType] ?? 'rgba(232,230,227,0.4)';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
        padding: '6px 8px',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 6,
      }}
    >
      <span style={{ fontSize: 10, color: 'rgba(232,230,227,0.35)' }}>
        {direction === 'in' ? '←' : '→'}
      </span>
      <span
        style={{
          flex: 1,
          fontSize: 12,
          color: '#E8E6E3',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono, monospace)',
          color,
          backgroundColor: `${color}18`,
          padding: '2px 5px',
          borderRadius: 4,
        }}
      >
        {connType}
      </span>
    </div>
  );
}
