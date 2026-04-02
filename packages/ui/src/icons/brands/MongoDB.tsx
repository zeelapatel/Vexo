import type { IconProps } from '../types';
export function MongoDBIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C12 2 7 7 7 13C7 16.31 9.24 19.08 12 20C14.76 19.08 17 16.31 17 13C17 7 12 2 12 2Z"/>
      <rect x="11.25" y="19" width="1.5" height="3" rx="0.75"/>
    </svg>
  );
}
