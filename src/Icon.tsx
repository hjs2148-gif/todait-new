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
  flag: <><path d="M5 21V4" /><path d="M5 4h12l-2.5 4 2.5 4H5" /></>,
  minus: <path d="M5 12h14" strokeWidth="2.4" />,
  book: <><path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5z" /><path d="M4 20.5A2.5 2.5 0 016.5 18H20v3H6.5" /></>,
  lecture: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" /></>,
  clock: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 1.5M9 3h6" /></>,
  repeat: <><path d="M17 3l4 4-4 4" /><path d="M3 11V9a2 2 0 012-2h16" /><path d="M7 21l-4-4 4-4" /><path d="M21 13v2a2 2 0 01-2 2H3" /></>,
  list: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  archive: <><rect x="3.5" y="4" width="17" height="5" rx="1.5" /><path d="M5 9v9.5A1.5 1.5 0 006.5 20h11a1.5 1.5 0 001.5-1.5V9M10 13h4" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.6" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></>,
  palette: <><circle cx="12" cy="12" r="8.5" /><circle cx="8.5" cy="10" r="1" /><circle cx="12" cy="7.5" r="1" /><circle cx="15.5" cy="10" r="1" /><path d="M12 20.5c-1.5 0-2-1-2-2s1-2 2.5-2h1.5a3 3 0 003-3" /></>,
  restday: <><rect x="4" y="5" width="16" height="15" rx="4" /><path d="M4 10h16M9 14h.01M12 14h.01M15 14h.01" /></>,
  upload: <path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 006.5 20h11a1.5 1.5 0 001.5-1.5V14" />,
  download: <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 14v4.5A1.5 1.5 0 006.5 20h11a1.5 1.5 0 001.5-1.5V14" />,
  lock: <><rect x="5" y="10.5" width="14" height="9.5" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" /></>,
  moon: <path d="M19 14.5A7.5 7.5 0 019.5 5a7.5 7.5 0 109.5 9.5z" />,
  bell: <path d="M6 16v-5a6 6 0 0112 0v5l1.5 2h-15zM10 20.5a2 2 0 004 0" />,
  shield: <path d="M12 3.5l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9v-5z" />,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 17.5h2" /></>,
  pause: <path d="M9 6.5v11M15 6.5v11" strokeWidth="2.6" />,
  trash: <path d="M5 7h14M9.5 7V5h5v2M7 7l1 12.5h8L17 7" />,
  plus: <path d="M12 5v14M5 12h14" strokeWidth="2.4" />,
}

export type IconName = 'today' | 'calendar' | 'chart' | 'pencil' | 'more' | 'play' | 'stop' | 'check' | 'close' | 'left' | 'right' | 'plus' | 'flag' | 'minus' | 'book' | 'lecture' | 'clock' | 'repeat'
  | 'list' | 'archive' | 'target' | 'grid' | 'palette' | 'restday' | 'upload' | 'download' | 'lock' | 'moon' | 'bell' | 'shield' | 'trash' | 'phone' | 'pause'

export const Icon = ({ name, size = 22, stroke = 2 }: { name: IconName; size?: number; stroke?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {PATHS[name]}
  </svg>
)
