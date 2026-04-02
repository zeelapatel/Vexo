'use client';

import { useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { getComponentIcon } from '@vexo/ui';
import { SIDEBAR_CATEGORIES, type SidebarComponent } from '@/data/sidebarCategories';
import { DesignSidebar } from './DesignSidebar';
import { StorageWarningBanner } from '@/components/ui/StorageWarningBanner';

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

function ComponentItem({
  component,
  onDragStart,
}: {
  component: SidebarComponent;
  onDragStart: (e: React.DragEvent, component: SidebarComponent) => void;
}) {
  const Icon = getComponentIcon(component.id, component.category);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, component)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        cursor: 'grab',
        userSelect: 'none',
        transition: 'background 0.1s',
        borderRadius: 6,
        color: 'rgba(232,230,227,0.5)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
        (e.currentTarget as HTMLElement).style.color = '#E8E6E3';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
        (e.currentTarget as HTMLElement).style.color = 'rgba(232,230,227,0.5)';
      }}
    >
      <div
        style={{
          color: categoryColors[component.category] ?? 'rgba(232,230,227,0.5)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Icon size={16} />
      </div>
      <span
        style={{
          fontSize: 13,
          color: 'inherit',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {component.label}
      </span>
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCategory = useCallback((id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, component: SidebarComponent) => {
    e.dataTransfer.setData('application/vexo-component', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0C0C0F',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Component list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 4px 12px', minHeight: 0 }}>
        {SIDEBAR_CATEGORIES.map((cat) => (
            <div key={cat.id} style={{ marginBottom: 2 }}>
              <button
                onClick={() => toggleCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '6px 8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(232,230,227,0.4)',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono, monospace)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  borderRadius: 4,
                }}
              >
                {cat.label}
                <ChevronDown
                  size={12}
                  style={{
                    transform: collapsed[cat.id] ? 'rotate(-90deg)' : 'none',
                    transition: 'transform 0.15s',
                  }}
                />
              </button>
              {!collapsed[cat.id] && (
                <div>
                  {cat.components.map((c) => (
                    <ComponentItem key={c.id} component={c} onDragStart={handleDragStart} />
                  ))}
                </div>
              )}
            </div>
          ))
        }
      </div>

      {/* Design management section */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
          maxHeight: 220,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <StorageWarningBanner />
        <DesignSidebar />
      </div>
    </aside>
  );
}
