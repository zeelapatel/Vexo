'use client';

import { useCallback } from 'react';
import type { VexoNode as VexoNodeType } from '@vexo/types';
import type { CBREntry, ComponentProperty } from '@vexo/types';
import { useCanvasStore } from '@/store/canvasStore';

interface PropertiesTabProps {
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

export function PropertiesTab({ node, cbrEntry }: PropertiesTabProps) {
  const updateProperty = useCallback(
    (key: string, value: unknown) => {
      useCanvasStore.getState().updateNodeData(node.id, { [key]: value });
    },
    [node.id],
  );

  if (!cbrEntry) {
    return (
      <div
        style={{ fontSize: 12, color: 'rgba(232,230,227,0.35)', textAlign: 'center', paddingTop: 24 }}
      >
        No property schema for this component.
      </div>
    );
  }

  return (
    <div>
      <SectionLabel>Configuration</SectionLabel>
      {cbrEntry.properties.map((prop) => (
        <PropertyField
          key={prop.key}
          property={prop}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          value={(node.data as any)[prop.key] ?? prop.default}
          onChange={(v) => updateProperty(prop.key, v)}
        />
      ))}
    </div>
  );
}

function PropertyField({
  property,
  value,
  onChange,
}: {
  property: ComponentProperty;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#16161B',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 6,
    padding: '5px 8px',
    fontSize: 12,
    fontFamily: property.type === 'number' ? 'var(--font-mono, monospace)' : 'inherit',
    color: '#E8E6E3',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <label style={{ fontSize: 12, color: 'rgba(232,230,227,0.6)' }}>{property.label}</label>
        {property.unit && (
          <span
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'rgba(232,230,227,0.3)',
            }}
          >
            {property.unit}
          </span>
        )}
      </div>
      {property.type === 'boolean' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            style={{ width: 14, height: 14, cursor: 'pointer' }}
          />
          <span style={{ fontSize: 11, color: 'rgba(232,230,227,0.4)' }}>
            {Boolean(value) ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      ) : property.type === 'select' ? (
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          {property.options?.map((opt) => (
            <option key={opt} value={opt} style={{ backgroundColor: '#16161B' }}>
              {opt}
            </option>
          ))}
        </select>
      ) : property.type === 'number' ? (
        <input
          type="number"
          value={Number(value)}
          min={property.min}
          max={property.max}
          onChange={(e) => onChange(Number(e.target.value))}
          style={inputStyle}
        />
      ) : (
        <input
          type="text"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      )}
    </div>
  );
}
