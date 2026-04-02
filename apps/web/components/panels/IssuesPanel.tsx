'use client';

import { X, AlertTriangle, Zap, Crosshair } from 'lucide-react';
import { useIssuesStore } from '@/store/issuesStore';
import type { Issue } from '@/store/issuesStore';
import { AnimatePresence, motion } from 'framer-motion';

interface IssuesPanelProps {
  open: boolean;
  onClose: () => void;
  onAutoFix?: (patternId: string) => void;
}

function IssueCard({
  issue,
  onDismiss,
  onAutoFix,
  isFocused,
  onFocus,
}: {
  issue: Issue;
  onDismiss: () => void;
  onAutoFix?: () => void;
  isFocused: boolean;
  onFocus: () => void;
}) {
  if (issue.dismissed) return null;
  const isWarning = issue.severity === 'warning';
  const color = isWarning ? '#F5A623' : '#FF4444';

  const bg = isFocused
    ? isWarning ? 'rgba(245,166,35,0.13)' : 'rgba(255,68,68,0.13)'
    : isWarning ? 'rgba(245,166,35,0.06)' : 'rgba(255,68,68,0.06)';
  const borderColor = isFocused
    ? isWarning ? 'rgba(245,166,35,0.5)' : 'rgba(255,68,68,0.5)'
    : isWarning ? 'rgba(245,166,35,0.15)' : 'rgba(255,68,68,0.15)';

  const hasAffected = !!(issue.affectedNodeIds?.length || issue.affectedEdgeIds?.length);

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      onClick={onFocus}
      style={{
        backgroundColor: bg,
        borderTop: `1px solid ${borderColor}`,
        borderRight: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        padding: '10px 12px',
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'background-color 0.15s, border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {issue.type === 'antipattern' ? (
            <Zap size={10} color={color} />
          ) : (
            <AlertTriangle size={10} color={color} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color, marginBottom: 3 }}>
            {issue.title}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(232,230,227,0.6)',
              lineHeight: 1.5,
              marginBottom: issue.suggestedFix ? 6 : 0,
            }}
          >
            {issue.body}
          </div>
          {issue.suggestedFix && (
            <div style={{ fontSize: 11, color: '#C4F042', lineHeight: 1.4 }}>
              → {issue.suggestedFix}
            </div>
          )}
          {issue.autoFixAvailable && onAutoFix && (
            <button
              onClick={(e) => { e.stopPropagation(); onAutoFix(); }}
              style={{
                marginTop: 8,
                fontSize: 11,
                fontFamily: 'var(--font-mono, monospace)',
                color: '#C4F042',
                backgroundColor: 'rgba(196,240,66,0.1)',
                border: 'none',
                borderRadius: 4,
                padding: '4px 10px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(196,240,66,0.2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(196,240,66,0.1)';
              }}
            >
              Auto-fix
            </button>
          )}
        </div>

        {/* Crosshair: locate on canvas */}
        {hasAffected && (
          <button
            onClick={(e) => { e.stopPropagation(); onFocus(); }}
            title={isFocused ? 'Clear highlight' : 'Locate on canvas'}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isFocused ? color : 'rgba(232,230,227,0.25)',
              padding: 2,
              flexShrink: 0,
              transition: 'color 0.15s',
            }}
          >
            <Crosshair size={12} />
          </button>
        )}

        {/* Dismiss */}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(232,230,227,0.3)',
            padding: 2,
            flexShrink: 0,
          }}
        >
          <X size={11} />
        </button>
      </div>
    </motion.div>
  );
}

export function IssuesPanel({ open, onClose, onAutoFix }: IssuesPanelProps) {
  const issues = useIssuesStore((s) => s.issues);
  const dismissIssue = useIssuesStore((s) => s.dismissIssue);
  const focusedIssueId = useIssuesStore((s) => s.focusedIssueId);
  const setFocusedIssue = useIssuesStore((s) => s.setFocusedIssue);
  const activeIssues = issues.filter((i) => !i.dismissed);
  const warnings = activeIssues.filter((i) => i.type === 'connection_warning');
  const antipatterns = activeIssues.filter((i) => i.type === 'antipattern');

  const handleFocus = (issueId: string) => {
    setFocusedIssue(focusedIssueId === issueId ? null : issueId);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200 }}
            onClick={() => {
              // First click clears focused issue; second click closes the panel
              if (focusedIssueId) {
                setFocusedIssue(null);
              } else {
                onClose();
              }
            }}
          />
          <motion.div
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: 360,
              backgroundColor: '#111115',
              border: '1px solid rgba(255,255,255,0.08)',
              zIndex: 201,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={13} color="#F5A623" style={{ marginRight: 8 }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#E8E6E3' }}>
                Issues{' '}
                {activeIssues.length > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      backgroundColor: 'rgba(245,166,35,0.2)',
                      color: '#F5A623',
                      padding: '1px 6px',
                      borderRadius: 10,
                      marginLeft: 6,
                    }}
                  >
                    {activeIssues.length}
                  </span>
                )}
              </span>
              {focusedIssueId && (
                <button
                  onClick={() => setFocusedIssue(null)}
                  title="Clear highlight"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(245,166,35,0.3)',
                    borderRadius: 5,
                    cursor: 'pointer',
                    color: '#F5A623',
                    padding: '2px 8px',
                    fontSize: 10,
                    fontFamily: 'var(--font-mono, monospace)',
                    marginRight: 8,
                  }}
                >
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(232,230,227,0.4)',
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
              {activeIssues.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 16px',
                    fontSize: 12,
                    color: 'rgba(232,230,227,0.3)',
                  }}
                >
                  No issues detected.
                </div>
              ) : (
                <>
                  {warnings.length > 0 && (
                    <>
                      <div
                        style={{
                          fontSize: 10,
                          fontFamily: 'var(--font-mono, monospace)',
                          color: 'rgba(232,230,227,0.35)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: 8,
                        }}
                      >
                        Connection Warnings ({warnings.length})
                      </div>
                      <AnimatePresence>
                        {warnings.map((issue) => (
                          <IssueCard
                            key={issue.id}
                            issue={issue}
                            onDismiss={() => dismissIssue(issue.id)}
                            onAutoFix={
                              issue.autoFixPatternId && onAutoFix
                                ? () => onAutoFix(issue.autoFixPatternId!)
                                : undefined
                            }
                            isFocused={focusedIssueId === issue.id}
                            onFocus={() => handleFocus(issue.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </>
                  )}
                  {antipatterns.length > 0 && (
                    <>
                      <div
                        style={{
                          fontSize: 10,
                          fontFamily: 'var(--font-mono, monospace)',
                          color: 'rgba(232,230,227,0.35)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: 8,
                          marginTop: warnings.length > 0 ? 16 : 0,
                        }}
                      >
                        Anti-Patterns ({antipatterns.length})
                      </div>
                      <AnimatePresence>
                        {antipatterns.map((issue) => (
                          <IssueCard
                            key={issue.id}
                            issue={issue}
                            onDismiss={() => dismissIssue(issue.id)}
                            onAutoFix={
                              issue.autoFixPatternId && onAutoFix
                                ? () => onAutoFix(issue.autoFixPatternId!)
                                : undefined
                            }
                            isFocused={focusedIssueId === issue.id}
                            onFocus={() => handleFocus(issue.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
