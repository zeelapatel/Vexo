'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { getComponentIcon } from '@vexo/ui';
import type { VexoNode as VexoNodeType } from '@vexo/types';
import { PropertiesTab } from './PropertiesTab';
import { SimulationTab } from './SimulationTab';
import { ConnectionsTab } from './ConnectionsTab';
import { useState } from 'react';
import { useEdges } from '@xyflow/react';
import type { VexoEdge as VexoEdgeType } from '@vexo/types';
import { getComponent } from '@vexo/cbr';

interface PropertyPanelProps {
  node: VexoNodeType | null;
  onClose: () => void;
}

const TABS = ['Properties', 'Simulation', 'Connections'] as const;
type Tab = (typeof TABS)[number];

export function PropertyPanel({ node, onClose }: PropertyPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Properties');
  const edges = useEdges<VexoEdgeType>();

  const connectedEdges = node
    ? edges.filter((e) => e.source === node.id || e.target === node.id)
    : [];

  const cbrEntry = node ? getComponent(node.data.componentId) : undefined;

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ x: 260, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 260, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            right: 16,
            top: 16,
            bottom: 16,
            width: 260,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#111115',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              flexShrink: 0,
            }}
          >
            <div style={{ color: 'rgba(196,240,66,0.8)', display: 'flex' }}>
              {(() => {
                const Icon = getComponentIcon(node.data.componentId, node.data.category);
                return <Icon size={16} />;
              })()}
            </div>
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: 500,
                color: '#E8E6E3',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {node.data.label}
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(232,230,227,0.4)',
                display: 'flex',
                padding: 2,
                borderRadius: 4,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#E8E6E3';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(232,230,227,0.4)';
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              flexShrink: 0,
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #C4F042' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: activeTab === tab ? '#E8E6E3' : 'rgba(232,230,227,0.4)',
                  transition: 'color 0.1s',
                  marginBottom: -1,
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
            {activeTab === 'Properties' && (
              <PropertiesTab node={node} cbrEntry={cbrEntry} />
            )}
            {activeTab === 'Simulation' && (
              <SimulationTab node={node} cbrEntry={cbrEntry} />
            )}
            {activeTab === 'Connections' && (
              <ConnectionsTab node={node} edges={connectedEdges} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
