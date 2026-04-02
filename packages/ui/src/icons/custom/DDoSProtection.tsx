import type { IconProps } from '../types';
export function DDoSProtectionIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3L20 7V13C20 17.5 16.5 21 12 21C7.5 21 4 17.5 4 13V7L12 3Z"/>
      <path d="M8 12H16M10 9H14M9 15H15" opacity="0.6"/>
    </svg>
  );
}
