import type { IconProps } from '../types';
export function LoadBalancerL4Icon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="5" cy="12" r="2"/>
      <circle cx="19" cy="7" r="2"/>
      <circle cx="19" cy="17" r="2"/>
      <path d="M7 12H12"/>
      <path d="M12 12L17 7"/>
      <path d="M12 12L17 17"/>
    </svg>
  );
}
