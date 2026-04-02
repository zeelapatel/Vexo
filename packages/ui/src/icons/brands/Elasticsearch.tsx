import type { IconProps } from '../types';
export function ElasticsearchIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="12" r="9" opacity="0.15"/>
      <circle cx="12" cy="12" r="5" opacity="0.4"/>
      <circle cx="12" cy="12" r="2.5"/>
      <path d="M12 4V7M12 17V20M4 12H7M17 12H20" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}
