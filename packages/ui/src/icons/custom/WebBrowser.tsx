import type { IconProps } from '../types';
export function WebBrowserIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2"/>
      <path d="M3 9H21"/>
      <circle cx="6.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      <circle cx="9.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}
