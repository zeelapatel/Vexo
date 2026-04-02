import type { IconProps } from '../types';
export function KubernetesIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 3L20.5 7.5V16.5L12 21L3.5 16.5V7.5L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="12" cy="12" r="2.5"/>
      <line x1="12" y1="5" x2="12" y2="9.5" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="12" y1="14.5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="5.5" y1="8.5" x2="9.3" y2="10.8" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="14.7" y1="13.2" x2="18.5" y2="15.5" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="18.5" y1="8.5" x2="14.7" y2="10.8" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="9.3" y1="13.2" x2="5.5" y2="15.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
}
