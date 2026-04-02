import type { IconProps } from '../types';
export function AppServerIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2"/>
      <path d="M9 12L11 14L15 10"/>
      <path d="M3 8H21"/>
    </svg>
  );
}
