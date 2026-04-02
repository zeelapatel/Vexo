import type { IconProps } from '../types';
export function MySQLIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <ellipse cx="12" cy="7" rx="8" ry="3"/>
      <path d="M4 7V12C4 13.66 7.58 15 12 15C16.42 15 20 13.66 20 12V7" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 12V17C4 18.66 7.58 20 12 20C16.42 20 20 18.66 20 17V12" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
