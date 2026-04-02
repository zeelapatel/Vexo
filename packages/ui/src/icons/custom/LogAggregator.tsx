import type { IconProps } from '../types';
export function LogAggregatorIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 3H6C5.45 3 5 3.45 5 4V20C5 20.55 5.45 21 6 21H18C18.55 21 19 20.55 19 20V8L14 3Z"/>
      <path d="M14 3V8H19"/>
      <path d="M9 13H15M9 17H13"/>
    </svg>
  );
}
