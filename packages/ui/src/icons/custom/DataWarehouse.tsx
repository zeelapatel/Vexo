import type { IconProps } from '../types';
export function DataWarehouseIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="12" cy="6" rx="8" ry="3"/>
      <path d="M4 6V16C4 17.66 7.58 19 12 19C16.42 19 20 17.66 20 16V6"/>
      <path d="M8 13L10 15L14 11"/>
    </svg>
  );
}
