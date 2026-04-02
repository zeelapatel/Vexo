'use client';

import { useState, useCallback, useRef } from 'react';
import { Play, Download, Upload, Clock } from 'lucide-react';
import { useSimulationStore } from '@/store/simulationStore';

function formatQPS(qps: number): string {
  if (qps >= 1_000_000) return `${(qps / 1_000_000).toFixed(1)}M`;
  if (qps >= 1_000) return `${Math.round(qps / 1_000)}K`;
  return String(qps);
}

function logToLinear(log: number, min: number, max: number): number {
  const minLog = Math.log10(min);
  const maxLog = Math.log10(max);
  return Math.round(Math.pow(10, minLog + (log / 1000) * (maxLog - minLog)));
}

function linearToLog(value: number, min: number, max: number): number {
  const minLog = Math.log10(min);
  const maxLog = Math.log10(max);
  return Math.round(((Math.log10(value) - minLog) / (maxLog - minLog)) * 1000);
}

const MIN_QPS = 100;
const MAX_QPS = 500_000;

interface SimulationBarProps {
  onRunSimulation?: (qps: number) => void;
  onExportPNG?: () => void;
  onExportJSON?: () => void;
  onVersionHistory?: () => void;
}

export function SimulationBar({ onRunSimulation, onExportPNG, onExportJSON, onVersionHistory }: SimulationBarProps) {
  const isRunning = useSimulationStore((s) => s.isRunning);
  const storedQPS = useSimulationStore((s) => s.entryQPS) || MIN_QPS;
  const [sliderValue, setSliderValue] = useState(() => linearToLog(storedQPS, MIN_QPS, MAX_QPS));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQPS = logToLinear(sliderValue, MIN_QPS, MAX_QPS);
  const fillPct = (sliderValue / 1000) * 100;

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setSliderValue(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const qps = logToLinear(val, MIN_QPS, MAX_QPS);
        onRunSimulation?.(qps);
      }, 50);
    },
    [onRunSimulation],
  );

  const handleSimulate = useCallback(() => {
    onRunSimulation?.(currentQPS);
  }, [currentQPS, onRunSimulation]);

  return (
    <footer
      style={{
        height: 44,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 14px',
        backgroundColor: '#111115',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono, monospace)',
          color: 'rgba(232,230,227,0.4)',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        Entry QPS
      </span>

      {/* Slider */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Track background */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Fill */}
          <div
            style={{
              height: '100%',
              width: `${fillPct}%`,
              background: 'linear-gradient(90deg, #C4F042, #F5A623)',
              borderRadius: 2,
              transition: 'width 0.05s',
            }}
          />
        </div>
        {/* Range input */}
        <input
          type="range"
          min={0}
          max={1000}
          value={sliderValue}
          onChange={handleSliderChange}
          style={{
            position: 'relative',
            width: '100%',
            height: 20,
            appearance: 'none',
            background: 'transparent',
            cursor: 'pointer',
            zIndex: 1,
          }}
        />
      </div>

      {/* Value */}
      <span
        style={{
          fontSize: 13,
          fontFamily: 'var(--font-mono, monospace)',
          fontWeight: 500,
          color: '#F5A623',
          minWidth: 60,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {formatQPS(currentQPS)}
      </span>

      {/* Simulate button */}
      <button
        onClick={handleSimulate}
        disabled={isRunning}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          height: 28,
          padding: '0 12px',
          backgroundColor: isRunning ? 'rgba(196,240,66,0.3)' : '#C4F042',
          border: 'none',
          borderRadius: 5,
          cursor: isRunning ? 'wait' : 'pointer',
          fontSize: 11,
          fontFamily: 'var(--font-mono, monospace)',
          fontWeight: 500,
          color: '#050507',
          flexShrink: 0,
          transition: 'background 0.1s',
        }}
      >
        <Play size={10} fill="#050507" />
        {isRunning ? 'Running...' : 'Simulate'}
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />

      {/* Version history */}
      {onVersionHistory && (
        <button
          onClick={onVersionHistory}
          title="Version history"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 5, cursor: 'pointer', flexShrink: 0 }}
        >
          <Clock size={12} color="rgba(232,230,227,0.5)" />
        </button>
      )}

      {/* Export PNG */}
      {onExportPNG && (
        <button
          onClick={onExportPNG}
          title="Export as PNG"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 5, cursor: 'pointer', flexShrink: 0 }}
        >
          <Download size={12} color="rgba(232,230,227,0.5)" />
        </button>
      )}

      {/* Import JSON */}
      {onExportJSON && (
        <button
          onClick={onExportJSON}
          title="Export as JSON"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 5, cursor: 'pointer', flexShrink: 0 }}
        >
          <Upload size={12} color="rgba(232,230,227,0.5)" />
        </button>
      )}
    </footer>
  );
}
