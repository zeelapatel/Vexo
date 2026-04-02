'use client';

import { Undo2, Redo2, Play } from 'lucide-react';

export function Toolbar() {
  return (
    <header
      className="flex h-[44px] w-full flex-shrink-0 items-center gap-1 px-3"
      style={{
        backgroundColor: '#111115',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <button
        className="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-white/5"
        title="Undo"
      >
        <Undo2 size={15} color="rgba(232,230,227,0.5)" />
      </button>
      <button
        className="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-white/5"
        title="Redo"
      >
        <Redo2 size={15} color="rgba(232,230,227,0.5)" />
      </button>

      <div
        className="mx-2 h-4 w-px"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
      />

      <button
        className="flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-semibold transition-colors hover:opacity-90"
        style={{ backgroundColor: '#C4F042', color: '#050507' }}
        title="Run simulation"
      >
        <Play size={12} fill="#050507" />
        Simulate
      </button>
    </header>
  );
}
