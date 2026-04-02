import type { IconProps } from '../types';
export function ServerlessFunctionIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13 2L4 14H12L11 22L20 10H12L13 2Z"/>
    </svg>
  );
}
