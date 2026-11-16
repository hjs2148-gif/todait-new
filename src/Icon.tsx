// 문자(▶ ✎ ✓ …) 대신 쓰는 SVG 아이콘. 폰마다 이모지로 바뀌거나 크기가 달라지지 않는다.
import type { ReactNode } from 'react'

const PATHS: Record<string, ReactNode> = {
  today: <><rect x="4" y="4" width="16" height="16" rx="3.5" /><path d="M8.5 12.3l2.5 2.5 4.5-5" /></>,
  calendar: <><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" /><path d="M4 10.5h16M8.5 3.5v4M15.5 3.5v4" /></>,
  chart: <path d="M6 20v-6M12 20V5M18 20v-9" strokeWidth="2.6" />,
  pencil: <path d="M4 20l1-4.5L16.5 4a2.1 2.1 0 013 3L8 18.5 4 20z" />,
  more: <><circle cx="6" cy="12" r="1.7" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" /><circle cx="18" cy="12" r="1.7" fill="currentColor" stroke="none" /></>,
  play: <path d="M9 6.5v11l9-5.5z" fill="currentColor" />,
  stop: <rect x="7.5" y="7.5" width="9" height="9" rx="1.5" fill="currentColor" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="2.4" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  left: <path d="M14.5 5l-7 7 7 7" />,
  right: <path d="M9.5 5l7 7-7 7" />,
  plus: <path d="M12 5v14M5 12h14" strokeWidth="2.4" />,
}

export type IconName = 'today' | 'calendar' | 'chart' | 'pencil' | 'more' | 'play' | 'stop' | 'check' | 'close' | 'left' | 'right' | 'plus'

export const Icon = ({ name, size = 22 }: { name: IconName; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {PATHS[name]}
  </svg>
)
