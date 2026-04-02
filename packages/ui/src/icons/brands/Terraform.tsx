import type { IconProps } from '../types';
export function TerraformIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M9 4.5L15 8V14.5L9 11V4.5Z" opacity="0.9"/>
      <path d="M16 8.5L21 5.5V12L16 15V8.5Z" opacity="0.6"/>
      <path d="M3 11.5L9 14.5V21L3 18V11.5Z" opacity="0.7"/>
    </svg>
  );
}
