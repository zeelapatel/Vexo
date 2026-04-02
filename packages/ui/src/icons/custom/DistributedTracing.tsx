import type { IconProps } from '../types';
export function DistributedTracingIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="5" cy="6" r="2"/>
      <circle cx="12" cy="12" r="2"/>
      <circle cx="19" cy="6" r="2"/>
      <circle cx="12" cy="19" r="2"/>
      <path d="M7 6H10C11.1 6 12 6.9 12 8V10"/>
      <path d="M17 6H14C12.9 6 12 6.9 12 8V10"/>
      <path d="M12 14V17"/>
    </svg>
  );
}
