import type { IconProps } from '../types';
export function CacheIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13 2L9 12H14L11 22L19 9H14L17 2H13Z"/>
      <rect x="2" y="8" width="6" height="4" rx="1" opacity="0.6"/>
      <rect x="2" y="14" width="6" height="4" rx="1" opacity="0.4"/>
    </svg>
  );
}
