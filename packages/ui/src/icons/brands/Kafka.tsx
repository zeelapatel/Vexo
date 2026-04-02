import type { IconProps } from '../types';
export function KafkaIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="12" r="2.2"/>
      <circle cx="4.5" cy="6" r="2.2"/>
      <circle cx="19.5" cy="6" r="2.2"/>
      <circle cx="4.5" cy="18" r="2.2"/>
      <circle cx="19.5" cy="18" r="2.2"/>
      <line x1="6.5" y1="7" x2="10" y2="10.5" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="14" y1="10.5" x2="17.5" y2="7" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="6.5" y1="17" x2="10" y2="13.5" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="14" y1="13.5" x2="17.5" y2="17" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
}
