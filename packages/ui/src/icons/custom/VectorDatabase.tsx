import type { IconProps } from '../types';
export function VectorDatabaseIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="12" cy="6" rx="8" ry="3"/>
      <path d="M4 6V18C4 19.66 7.58 21 12 21C16.42 21 20 19.66 20 18V6"/>
      <path d="M8 12L12 10L16 12M8 15L12 13L16 15" opacity="0.7"/>
    </svg>
  );
}
