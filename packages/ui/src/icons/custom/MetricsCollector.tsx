import type { IconProps } from '../types';
export function MetricsCollectorIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 17L7 13L11 15L15 8L19 11"/>
      <path d="M3 20H21"/>
      <path d="M3 4V20"/>
    </svg>
  );
}
