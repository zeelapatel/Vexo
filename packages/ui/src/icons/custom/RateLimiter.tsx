import type { IconProps } from '../types';
export function RateLimiterIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 4H19L14 12H19L5 20L10 12H5L5 4Z"/>
    </svg>
  );
}
