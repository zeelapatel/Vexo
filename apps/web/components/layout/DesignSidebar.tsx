'use client';

import { useState, useRef, useCallback } from 'react';
import { Plus, MoreHorizontal, Trash2, Copy, RefreshCw } from 'lucide-react';
import { useDesignStore } from '@/store/designStore';

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export function DesignSidebar() {
  const {
    getActiveDesigns,
    getDeletedDesigns,
    activeDesignId,
    createDesign,
    switchDesign,
    renameDesign,
    duplicateDesign,
    deleteDesign,
    restoreDesign,
  } = useDesignStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeDesigns = getActiveDesigns();
  const deletedDesigns = getDeletedDesigns();

  const startRename = useCallback((id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
    setMenuId(null);
    setTimeout(() => inputRef.current?.select(), 0);
  }, []);

  const commitRename = useCallback(() => {
    if (editingId && editName.trim()) {
      renameDesign(editingId, editName.trim());
    }
    setEditingId(null);
  }, [editingId, editName, renameDesign]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px 6px',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono, monospace)',
            color: 'rgba(232,230,227,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Designs
        </span>
        <button
          onClick={() => createDesign()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(232,230,227,0.5)',
            padding: 2,
            borderRadius: 4,
          }}
          title="New Design"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#C4F042';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'rgba(232,230,227,0.5)';
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Design list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeDesigns.map((design) => {
          const isActive = design.id === activeDesignId;
          const isEditing = editingId === design.id;
          return (
            <div
              key={design.id}
              onClick={() => !isEditing && switchDesign(design.id)}
              onDoubleClick={() => startRename(design.id, design.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                cursor: 'pointer',
                backgroundColor: isActive ? 'rgba(196,240,66,0.06)' : 'transparent',
                borderLeft: isActive ? '2px solid #C4F042' : '2px solid transparent',
                transition: 'background 0.1s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    'rgba(255,255,255,0.03)';
                const btn = e.currentTarget.querySelector('.design-menu-btn') as HTMLElement;
                if (btn) btn.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                const btn = e.currentTarget.querySelector('.design-menu-btn') as HTMLElement;
                if (btn && menuId !== design.id) btn.style.opacity = '0';
              }}
            >
              {/* Thumbnail placeholder */}
              <div
                style={{
                  width: 28,
                  height: 20,
                  backgroundColor: isActive
                    ? 'rgba(196,240,66,0.1)'
                    : 'rgba(255,255,255,0.04)',
                  borderRadius: 4,
                  flexShrink: 0,
                  border: isActive
                    ? '1px solid rgba(196,240,66,0.2)'
                    : '1px solid rgba(255,255,255,0.05)',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                  <input
                    ref={inputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    style={{
                      width: '100%',
                      background: '#16161B',
                      border: '1px solid rgba(196,240,66,0.4)',
                      borderRadius: 4,
                      padding: '1px 4px',
                      fontSize: 12,
                      color: '#E8E6E3',
                      outline: 'none',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: 12,
                      color: isActive ? '#E8E6E3' : 'rgba(232,230,227,0.7)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {design.name}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-mono, monospace)',
                    color: 'rgba(232,230,227,0.3)',
                    marginTop: 1,
                  }}
                >
                  {formatTime(design.updatedAt)}
                </div>
              </div>
              {/* Context menu button */}
              <button
                className="design-menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuId(menuId === design.id ? null : design.id);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(232,230,227,0.4)',
                  padding: 2,
                  borderRadius: 4,
                  flexShrink: 0,
                  opacity: isActive ? '1' : '0',
                  transition: 'opacity 0.1s',
                }}
              >
                <MoreHorizontal size={12} />
              </button>
              {/* Context menu */}
              {menuId === design.id && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 50 }}
                    onClick={() => setMenuId(null)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '100%',
                      zIndex: 51,
                      backgroundColor: '#1C1C22',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      padding: 4,
                      minWidth: 140,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}
                  >
                    <DesignMenuItem
                      icon={<Copy size={12} />}
                      label="Duplicate"
                      onClick={() => {
                        duplicateDesign(design.id);
                        setMenuId(null);
                      }}
                    />
                    <DesignMenuItem
                      icon={<span style={{ fontSize: 12 }}>✎</span>}
                      label="Rename"
                      onClick={() => startRename(design.id, design.name)}
                    />
                    <div
                      style={{
                        height: 1,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        margin: '2px 0',
                      }}
                    />
                    <DesignMenuItem
                      icon={<Trash2 size={12} />}
                      label="Delete"
                      danger
                      disabled={activeDesigns.length <= 1}
                      onClick={() => {
                        deleteDesign(design.id);
                        setMenuId(null);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Recently Deleted */}
        {deletedDesigns.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => setShowDeleted((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                width: '100%',
                padding: '4px 12px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 10,
                fontFamily: 'var(--font-mono, monospace)',
                color: 'rgba(232,230,227,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Recently Deleted ({deletedDesigns.length})
            </button>
            {showDeleted &&
              deletedDesigns.map((design) => (
                <div
                  key={design.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    opacity: 0.5,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: 'rgba(232,230,227,0.5)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {design.name}
                  </div>
                  <button
                    onClick={() => restoreDesign(design.id)}
                    title="Restore"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'rgba(232,230,227,0.4)',
                      padding: 2,
                    }}
                  >
                    <RefreshCw size={11} />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DesignMenuItem({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '6px 10px',
        background: 'transparent',
        border: 'none',
        borderRadius: 5,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
        color: disabled ? 'rgba(232,230,227,0.2)' : danger ? '#FF4444' : '#E8E6E3',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      {icon}
      {label}
    </button>
  );
}
