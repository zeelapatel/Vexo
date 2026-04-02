import type { IconProps } from '../types';
export function PostgreSQLIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V19C8 19.55 8.45 20 9 20H15C15.55 20 16 19.55 16 19V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2ZM12 15C9.24 15 7 12.76 7 10C7 7.24 9.24 5 12 5C14.76 5 17 7.24 17 10C17 12.76 14.76 15 12 15Z"/>
      <circle cx="10" cy="9" r="1.2"/>
      <path d="M12 11C13.1 11 14 10.1 14 9" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}
