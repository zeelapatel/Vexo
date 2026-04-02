import type { IconProps } from '../types';
export function AuthServerIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2"/>
      <path d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11"/>
      <circle cx="12" cy="16" r="1.5"/>
    </svg>
  );
}
