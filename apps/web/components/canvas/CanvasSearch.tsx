'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { getComponentIcon } from '@vexo/ui';
import { useComponentSearch } from '@/hooks/useComponentSearch';
import { useCanvasStore } from '@/store/canvasStore';
import type { SidebarComponent } from '@/data/sidebarCategories';
import type { VexoNode } from '@vexo/types';
import { ComponentCategory, SystemStatus } from '@vexo/types';

const categoryColors: Record<string, string> = {
  Compute: '#4A9EFF',
  Database: '#A855F7',
  Storage: 'rgba(232,230,227,0.5)',
  Networking: '#C4F042',
  Messaging: '#F5A623',
  Security: '#FF4444',
  Observability: '#4A9EFF',
  AIML: '#A855F7',
  ClientEdge: 'rgba(232,230,227,0.5)',
};

export function CanvasSearch() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchResults = useComponentSearch(query);
  const { screenToFlowPosition } = useReactFlow();
  const addNode = useCanvasStore((s) => s.addNode);

  // Ctrl+F focuses the search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Click-outside closes the dropdown
  useEffect(() => {
    if (!focused && !query) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setQuery('');
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [focused, query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('');
      inputRef.current?.blur();
    }
  }, []);

  // Place selected component at the center of the canvas viewport
  const handleSelect = useCallback(
    (component: SidebarComponent) => {
      const canvasEl = document.querySelector('.react-flow__renderer') as HTMLElement | null;
      let screenX = window.innerWidth / 2;
      let screenY = window.innerHeight / 2;
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        screenX = rect.left + rect.width / 2;
        screenY = rect.top + rect.height / 2;
      }
      const position = screenToFlowPosition({ x: screenX, y: screenY });

      const newNode: VexoNode = {
        id: crypto.randomUUID(),
        type: 'vexo',
        position,
        data: {
          componentId: component.id,
          label: component.label,
          category: component.category as ComponentCategory,
          cloudVariant: null,
          iconType: component.iconType,
          iconSrc: component.id,
          status: SystemStatus.Idle,
          metrics: { latencyP50: 0, latencyP99: 0, saturation: 0, currentRPS: 0 },
        },
      };

      addNode(newNode);
      setQuery('');
      inputRef.current?.blur();
    },
    [screenToFlowPosition, addNode],
  );

  const isOpen = focused && searchResults !== null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        width: focused ? 420 : 320,
        transition: 'width 0.2s ease',
      }}
    >
      {/* Search pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 32,
          padding: '0 12px',
          borderRadius: 8,
          border: focused
            ? '1px solid rgba(196,240,66,0.4)'
            : '1px solid rgba(255,255,255,0.07)',
          backgroundColor: 'rgba(11,11,14,0.88)',
          backdropFilter: 'blur(12px)',
          boxShadow: focused
            ? '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(196,240,66,0.1)'
            : '0 4px 16px rgba(0,0,0,0.4)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <Search
          size={13}
          color={focused ? 'rgba(196,240,66,0.7)' : 'rgba(232,230,227,0.3)'}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Search components…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: '#F5F3F0',
            fontFamily: 'inherit',
          }}
        />
        {query && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(232,230,227,0.35)',
              fontSize: 16,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            maxHeight: 360,
            overflowY: 'auto',
            backgroundColor: '#111115',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 100,
          }}
        >
          {searchResults.length === 0 ? (
            <div
              style={{
                padding: '20px 16px',
                textAlign: 'center',
                fontSize: 12,
                color: 'rgba(232,230,227,0.3)',
              }}
            >
              No components match &ldquo;{query}&rdquo;
            </div>
          ) : (
            searchResults.map((component, i) => (
              <ResultRow key={`${component.id}-${i}`} component={component} onSelect={handleSelect} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({
  component,
  onSelect,
}: {
  component: SidebarComponent;
  onSelect: (c: SidebarComponent) => void;
}) {
  const Icon = getComponentIcon(component.id, component.category);
  const color = categoryColors[component.category] ?? 'rgba(232,230,227,0.5)';

  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault(); // fires before onBlur so dropdown stays open
        onSelect(component);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 12px',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      <div style={{ color, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <Icon size={16} />
      </div>
      <span
        style={{
          flex: 1,
          fontSize: 13,
          color: '#E8E6E3',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {component.label}
      </span>
      <span
        style={{
          fontSize: 10,
          fontFamily: 'var(--font-mono, monospace)',
          color: 'rgba(232,230,227,0.3)',
          flexShrink: 0,
        }}
      >
        {component.category}
      </span>
    </div>
  );
}
