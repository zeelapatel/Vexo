import type { IconProps } from '../types';
export function MicroserviceIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12,4 19,8 19,16 12,20 5,16 5,8"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  );
}
