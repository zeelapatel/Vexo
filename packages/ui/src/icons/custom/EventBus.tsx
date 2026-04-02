import type { IconProps } from '../types';
export function EventBusIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12H21"/>
      <path d="M7 8V12M7 12V16"/>
      <path d="M12 6V12M12 12V18"/>
      <path d="M17 9V12M17 12V15"/>
      <circle cx="7" cy="12" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="17" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}
