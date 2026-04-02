import type { IconProps } from '../types';
export function PrometheusIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 3C9 3 7 5 6 7L8 8C8 6.5 9.5 5.5 12 5.5C14.5 5.5 16 6.5 16 8L18 7C17 5 15 3 12 3Z" opacity="0.6"/>
      <path d="M6 7C5 9 4.5 11 4.5 12C4.5 17.25 7.9 21 12 21C16.1 21 19.5 17.25 19.5 12C19.5 11 19 9 18 7L16 8C16.8 9.5 17.2 10.8 17.2 12C17.2 15.98 14.9 18.7 12 18.7C9.1 18.7 6.8 15.98 6.8 12C6.8 10.8 7.2 9.5 8 8L6 7Z"/>
      <path d="M9 14L10.5 11L12 14L13.5 11L15 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
