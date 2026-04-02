import type { IconProps } from '../types';
export function RedisIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2L20.5 6.5V13L12 17.5L3.5 13V6.5L12 2Z" opacity="0.9"/>
      <path d="M7.5 9.5L12 7L16.5 9.5L12 12L7.5 9.5Z" fill="#050507" opacity="0.6"/>
      <ellipse cx="12" cy="20" rx="6" ry="1.5" opacity="0.3"/>
    </svg>
  );
}
