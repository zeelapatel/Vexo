'use client';

import { memo } from 'react';
import { getComponentIcon } from '@vexo/ui';
import { ComponentCategory } from '@vexo/types';

interface NodeIconProps {
  componentId: string;
  category: ComponentCategory;
  size?: number;
}

const categoryColors: Record<ComponentCategory, { bg: string; color: string }> = {
  [ComponentCategory.Compute]: { bg: 'rgba(74,158,255,0.15)', color: '#4A9EFF' },
  [ComponentCategory.Database]: { bg: 'rgba(168,85,247,0.15)', color: '#A855F7' },
  [ComponentCategory.Storage]: { bg: 'rgba(232,230,227,0.08)', color: 'rgba(232,230,227,0.6)' },
  [ComponentCategory.Networking]: { bg: 'rgba(196,240,66,0.15)', color: '#C4F042' },
  [ComponentCategory.Messaging]: { bg: 'rgba(245,166,35,0.15)', color: '#F5A623' },
  [ComponentCategory.Security]: { bg: 'rgba(255,68,68,0.15)', color: '#FF4444' },
  [ComponentCategory.Observability]: { bg: 'rgba(74,158,255,0.12)', color: '#4A9EFF' },
  [ComponentCategory.AIML]: { bg: 'rgba(168,85,247,0.15)', color: '#A855F7' },
  [ComponentCategory.ClientEdge]: { bg: 'rgba(232,230,227,0.08)', color: 'rgba(232,230,227,0.6)' },
};

export const NodeIcon = memo(function NodeIcon({ componentId, category, size = 28 }: NodeIconProps) {
  const Icon = getComponentIcon(componentId, category);
  const colors = categoryColors[category] ?? {
    bg: 'rgba(232,230,227,0.08)',
    color: 'rgba(232,230,227,0.6)',
  };
  const iconSize = Math.round(size * 0.64);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        backgroundColor: colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: colors.color,
      }}
    >
      <Icon size={iconSize} />
    </div>
  );
});
