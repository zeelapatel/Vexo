import type { IconProps } from '../types';
export function VMInstanceIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="4" width="20" height="14" rx="2"/>
      <path d="M8 20H16M12 18V20"/>
      <path d="M7 11L10 8L13 11L16 8"/>
    </svg>
  );
}
