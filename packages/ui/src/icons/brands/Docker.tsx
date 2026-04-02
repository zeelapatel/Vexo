import type { IconProps } from '../types';
export function DockerIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13 8H11V10H13V8ZM10 8H8V10H10V8ZM13 5H11V7H13V5ZM10 11H8V13H10V11ZM13 11H11V13H13V11ZM16 11H14V13H16V11ZM19 11C18.67 9.32 17.49 7.93 16 7.34V11H14V8H12V11H10V8H8V11H6C4.9 11 4 11.9 4 13V16C4 17.1 4.9 18 6 18H19C20.1 18 21 17.1 21 16V13C21 12.45 20.55 11.84 20 11.5L19 11Z"/>
      <path d="M20 8C19.5 7.5 19 7 18 7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="20.5" cy="9.5" r="1" fill="currentColor"/>
    </svg>
  );
}
