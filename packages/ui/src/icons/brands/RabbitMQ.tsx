import type { IconProps } from '../types';
export function RabbitMQIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M9 4C9 4 7 4 6 6C5 8 6 10 6 10C5 10 3 11 3 14C3 17 5.5 19 9 19H15C18.5 19 21 17 21 14C21 11 19 10 18 10C18 10 19 8 18 6C17 4 15 4 15 4L14 7H10L9 4Z"/>
      <circle cx="8.5" cy="13" r="1.5" fill="#050507"/>
      <circle cx="15.5" cy="13" r="1.5" fill="#050507"/>
      <path d="M9 16H15" stroke="#050507" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}
