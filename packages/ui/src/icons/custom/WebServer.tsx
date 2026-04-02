import type { IconProps } from '../types';
export function WebServerIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9"/>
      <path d="M3 12H21M12 3C9.5 6 8 9 8 12C8 15 9.5 18 12 21M12 3C14.5 6 16 9 16 12C16 15 14.5 18 12 21"/>
    </svg>
  );
}
