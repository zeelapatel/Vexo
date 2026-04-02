import type { IconProps } from '../types';
export function MessageQueueIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="6" width="18" height="12" rx="2"/>
      <path d="M3 10H21"/>
      <path d="M3 14H21"/>
    </svg>
  );
}
