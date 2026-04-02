import type { IconProps } from '../types';
export function BlockStorageIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="12" cy="6" rx="8" ry="2.5"/>
      <path d="M4 6V10C4 11.38 7.58 12.5 12 12.5C16.42 12.5 20 11.38 20 10V6"/>
      <path d="M4 10V14C4 15.38 7.58 16.5 12 16.5C16.42 16.5 20 15.38 20 14V10"/>
      <path d="M4 14V18C4 19.38 7.58 20.5 12 20.5C16.42 20.5 20 19.38 20 18V14"/>
    </svg>
  );
}
