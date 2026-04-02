import type { IconProps } from '../types';
export function NginxIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 3L21 8.5V15.5L12 21L3 15.5V8.5L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 16V8L12 11V16" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 8V16L12 13V8" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
