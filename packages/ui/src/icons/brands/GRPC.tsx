import type { IconProps } from '../types';
export function GRPCIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 16V10C8 8.9 8.9 8 10 8H12C13.65 8 15 9.35 15 11C15 12.65 13.65 14 12 14H8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M11 14L15 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
