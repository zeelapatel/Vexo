import type { IconProps } from '../types';
export function IoTDeviceIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="7" y="7" width="10" height="10" rx="2"/>
      <path d="M4 10V14M20 10V14"/>
      <path d="M10 4H14M10 20H14"/>
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
    </svg>
  );
}
