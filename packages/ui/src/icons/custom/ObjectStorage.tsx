import type { IconProps } from '../types';
export function ObjectStorageIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 5H18C18 5 20 5.5 20 7C20 8.5 18 9 18 9H6C6 9 4 8.5 4 7C4 5.5 6 5 6 5Z"/>
      <path d="M4 7V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V7"/>
      <circle cx="8" cy="14" r="1.5"/>
      <circle cx="12" cy="14" r="1.5"/>
    </svg>
  );
}
