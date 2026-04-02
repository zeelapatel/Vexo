'use client';

import { useState } from 'react';

interface ExplanationWalkthroughProps {
  explanation: string;
}

/** Parses markdown explanation into sections by ## headings */
function parseSections(explanation: string): { title: string; content: string }[] {
  const lines = explanation.split('\n');
  const sections: { title: string; content: string }[] = [];
  let current: { title: string; content: string } | null = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) sections.push(current);
      current = { title: line.replace('## ', '').trim(), content: '' };
    } else if (current) {
      current.content += line + '\n';
    }
  }
  if (current) sections.push(current);
  return sections.length > 0 ? sections : [{ title: 'Solution Explanation', content: explanation }];
}

export function ExplanationWalkthrough({ explanation }: ExplanationWalkthroughProps) {
  const sections = parseSections(explanation);
  const [step, setStep] = useState(0);

  const current = sections[step];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Step indicators */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {sections.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            title={s.title}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: i === step ? '#C4F042' : 'rgba(255,255,255,0.15)',
              cursor: 'pointer',
              padding: 0,
              transition: 'background 0.15s',
            }}
          />
        ))}
        <span style={{ fontSize: 11, color: 'rgba(232,230,227,0.3)', fontFamily: 'var(--font-mono)', marginLeft: 8 }}>
          {step + 1} / {sections.length}
        </span>
      </div>

      {/* Current section */}
      <div
        style={{
          backgroundColor: '#111115',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10,
          padding: '16px 20px',
          minHeight: 160,
        }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#E8E6E3' }}>
          {current?.title}
        </h3>
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.65,
            color: 'rgba(232,230,227,0.75)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {current?.content.trim()}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: 'transparent',
            color: step === 0 ? 'rgba(232,230,227,0.2)' : 'rgba(232,230,227,0.6)',
            fontSize: 12,
            cursor: step === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          ← Previous
        </button>
        <button
          onClick={() => setStep((s) => Math.min(sections.length - 1, s + 1))}
          disabled={step === sections.length - 1}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: step < sections.length - 1 ? 'rgba(196,240,66,0.08)' : 'transparent',
            color: step < sections.length - 1 ? '#C4F042' : 'rgba(232,230,227,0.2)',
            fontSize: 12,
            cursor: step === sections.length - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
