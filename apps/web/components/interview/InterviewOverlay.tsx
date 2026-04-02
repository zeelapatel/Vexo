'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '@/store/interviewStore';
import { InterviewTimer } from './InterviewTimer';
import { HintButton } from './HintButton';
import { useInterviewAutoSave } from '@/hooks/useInterviewAutoSave';
import { trackTimeUp } from '@/lib/interviewAnalytics';

interface InterviewOverlayProps {
  onSubmit: () => void;
}

export function InterviewOverlay({ onSubmit }: InterviewOverlayProps) {
  const isActive = useInterviewStore((s) => s.isActive);
  const scenario = useInterviewStore((s) => s.scenario);
  const endInterview = useInterviewStore((s) => s.endInterview);
  const requirementsChecked = useInterviewStore((s) => s.requirementsChecked);
  const toggleRequirement = useInterviewStore((s) => s.toggleRequirement);
  const router = useRouter();

  // Wire auto-save
  useInterviewAutoSave();

  const handleTimeUp = useCallback(() => {
    if (scenario) trackTimeUp(scenario.id);
    onSubmit();
  }, [scenario, onSubmit]);

  const handleEnd = useCallback(() => {
    endInterview();
    router.push('/challenges');
  }, [endInterview, router]);

  if (!isActive || !scenario) return null;

  return (
    <>
      {/* Timer bar — fixed at the very top of the canvas area */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 44,
          zIndex: 300,
          backgroundColor: 'rgba(11,11,14,0.92)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 16,
          backdropFilter: 'blur(6px)',
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(232,230,227,0.6)',
            maxWidth: 300,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {scenario.title}
        </span>

        <div style={{ flex: 1 }} />

        <HintButton />

        <InterviewTimer onTimeUp={handleTimeUp} />

        {/* Submit */}
        <button
          onClick={onSubmit}
          style={{
            padding: '5px 14px',
            backgroundColor: '#C4F042',
            color: '#050507',
            border: 'none',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'opacity 0.1s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          Submit
        </button>

        {/* End without scoring */}
        <button
          onClick={handleEnd}
          style={{
            padding: '5px 10px',
            backgroundColor: 'transparent',
            color: 'rgba(232,230,227,0.35)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 6,
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          End
        </button>
      </div>

      {/* Requirements panel — collapsible, left side */}
      <RequirementsPanel
        requirements={scenario.requirements}
        nfrs={scenario.nonFunctionalRequirements}
        checked={requirementsChecked}
        onToggle={toggleRequirement}
      />
    </>
  );
}

interface RequirementsPanelProps {
  requirements: string[];
  nfrs: string[];
  checked: Set<number>;
  onToggle: (index: number) => void;
}

function RequirementsPanel({ requirements, nfrs, checked, onToggle }: RequirementsPanelProps) {
  const doneCount = checked.size;
  const total = requirements.length;

  return (
    <div
      style={{
        position: 'absolute',
        top: 52,
        left: 12,
        width: 260,
        zIndex: 200,
        backgroundColor: 'rgba(11,11,14,0.88)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        backdropFilter: 'blur(6px)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(232,230,227,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Requirements
        </span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: doneCount === total ? '#C4F042' : 'rgba(232,230,227,0.3)' }}>
          {doneCount}/{total}
        </span>
      </div>

      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
        {requirements.map((req, i) => (
          <label
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              cursor: 'pointer',
              fontSize: 12,
              lineHeight: 1.4,
              color: checked.has(i) ? 'rgba(232,230,227,0.4)' : 'rgba(232,230,227,0.75)',
              textDecoration: checked.has(i) ? 'line-through' : 'none',
            }}
          >
            <input
              type="checkbox"
              checked={checked.has(i)}
              onChange={() => onToggle(i)}
              style={{ marginTop: 2, accentColor: '#C4F042', flexShrink: 0 }}
            />
            {req}
          </label>
        ))}
      </div>

      {nfrs.length > 0 && (
        <>
          <div style={{ padding: '8px 14px 4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 10, color: 'rgba(232,230,227,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Scale targets
            </span>
          </div>
          <div style={{ padding: '4px 14px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {nfrs.map((nfr, i) => (
              <p key={i} style={{ margin: 0, fontSize: 11, color: 'rgba(232,230,227,0.4)', lineHeight: 1.4 }}>
                {nfr}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
