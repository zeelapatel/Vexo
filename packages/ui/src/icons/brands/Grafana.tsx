import type { IconProps } from '../types';
export function GrafanaIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M12 6V12L15.5 15.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="1.5"/>
      <path d="M12 3V5M12 19V21M3 12H5M19 12H21" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}
