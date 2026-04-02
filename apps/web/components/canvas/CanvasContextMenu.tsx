'use client';

import { useCallback } from 'react';
import type { VexoNode as VexoNodeType } from '@vexo/types';

interface NodeContextMenuProps {
  node: VexoNodeType;
  x: number;
  y: number;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (node: VexoNodeType) => void;
}

export function NodeContextMenu({
  node,
  x,
  y,
  onClose,
  onDelete,
  onDuplicate,
}: NodeContextMenuProps) {
  const handleDelete = useCallback(() => {
    onDelete(node.id);
    onClose();
  }, [node.id, onDelete, onClose]);

  const handleDuplicate = useCallback(() => {
    onDuplicate(node);
    onClose();
  }, [node, onDuplicate, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={onClose} />
      {/* Menu */}
      <div
        style={{
          position: 'fixed',
          left: x,
          top: y,
          zIndex: 1000,
          backgroundColor: '#1C1C22',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: '4px',
          minWidth: 160,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <ContextMenuItem onClick={handleDuplicate}>Duplicate</ContextMenuItem>
        <div
          style={{
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.05)',
            margin: '2px 0',
          }}
        />
        <ContextMenuItem onClick={handleDelete} danger>
          Delete
        </ContextMenuItem>
      </div>
    </>
  );
}

function ContextMenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: '7px 12px',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        borderRadius: 6,
        fontSize: 13,
        color: danger ? '#FF4444' : '#E8E6E3',
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      {children}
    </button>
  );
}
