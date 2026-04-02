import type { IconProps } from '../types';
export function DNSIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="5" r="2"/>
      <circle cx="5" cy="17" r="2"/>
      <circle cx="19" cy="17" r="2"/>
      <path d="M12 7V12L5 15"/>
      <path d="M12 12L19 15"/>
    </svg>
  );
}
