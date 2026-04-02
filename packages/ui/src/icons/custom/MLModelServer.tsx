import type { IconProps } from '../types';
export function MLModelServerIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="3"/>
      <circle cx="5" cy="19" r="2"/>
      <circle cx="19" cy="19" r="2"/>
      <path d="M12 11V14"/>
      <path d="M12 14L7 17"/>
      <path d="M12 14L17 17"/>
      <path d="M9.5 6.5L7 5M14.5 6.5L17 5" strokeWidth="1"/>
    </svg>
  );
}
