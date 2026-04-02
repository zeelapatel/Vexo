import type { IconProps } from '../types';
export function GraphQLIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <polygon points="12,3 20.5,8 20.5,16 12,21 3.5,16 3.5,8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="3" r="1.5"/>
      <circle cx="20.5" cy="8" r="1.5"/>
      <circle cx="20.5" cy="16" r="1.5"/>
      <circle cx="12" cy="21" r="1.5"/>
      <circle cx="3.5" cy="16" r="1.5"/>
      <circle cx="3.5" cy="8" r="1.5"/>
      <line x1="3.5" y1="8" x2="20.5" y2="16" stroke="currentColor" strokeWidth="1"/>
      <line x1="3.5" y1="16" x2="20.5" y2="8" stroke="currentColor" strokeWidth="1"/>
      <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="1"/>
    </svg>
  );
}
