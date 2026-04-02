import type { IconProps } from '../types';
export function CDNIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 3V9M12 15V21M3 12H9M15 12H21" opacity="0.5"/>
    </svg>
  );
}
