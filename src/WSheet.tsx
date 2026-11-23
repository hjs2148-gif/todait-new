// 위젯을 누르면 열리는 자세히 시트 (One UI 방식): 위쪽에 넉넉한 제목·큰 숫자, 아래는 묶음 카드.
import { useEffect, useState, type ReactNode } from 'react'
import { Icon } from './Icon.tsx'

const SV = (d: ReactNode) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
/** 위젯 아이콘 (라벨 앞 동그란 칩) */
export const WICON = {
  progress: SV(<><circle cx="12" cy="12" r="8" /><path d="M8.5 12.3l2.5 2.5 4.5-5" /></>),
  review: SV(<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5" />),
  slack: SV(<path d="M6 21V4M6 4h11l-2.5 4 2.5 4H6" />),
  recall: SV(<><path d="M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h10" /></>),
  wrong: SV(<><circle cx="12" cy="12" r="8" /><path d="M9 9l6 6M15 9l-6 6" /></>),
  umap: SV(<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>),
  time: SV(<><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 1.5M9 3h6" /></>),
  left: SV(<><path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9" /></>),
  exam: SV(<><path d="M4 18a8 8 0 1 1 16 0" /><path d="M12 18l4-5" /></>),
  week: SV(<path d="M6 20v-6M12 20V6M18 20v-9" />),
  streak: SV(<><circle cx="6" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="18" cy="12" r="2" /></>),
  subjects: SV(<><path d="M12 3a9 9 0 1 0 9 9h-9z" /><path d="M14 3.3A9 9 0 0 1 20.7 10H14z" /></>),
  goal: SV(<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /></>),
  tomorrow: SV(<><rect x="4" y="5.5" width="16" height="14.5" rx="2.5" /><path d="M4 10.5h16M9 15h6M13 13l2 2-2 2" /></>),
  memo: SV(<path d="M4 20l1-4.5L16.5 4a2.1 2.1 0 013 3L8 18.5 4 20z" />),
  play: SV(<path d="M9 6.5v11l9-5.5z" fill="currentColor" />),
  stack: SV(<><path d="M12 4l8 4-8 4-8-4z" /><path d="M4 12l8 4 8-4M4 16l8 4 8-4" /></>),
}
export type WIconName = keyof typeof WICON

/** 아이콘 칩. tint가 있으면 과목색으로 */
export const IconChip = ({ icon, tint }: { icon: WIconName; tint?: string | null }) => (
  <i className="t-ic" style={tint ? { background: `color-mix(in srgb, ${tint} 24%, var(--sf))`, color: tint } : undefined}>{WICON[icon]}</i>
)

/** 자세히 시트 */
export function WSheet({ icon, tint, title, big, sub, onClose, children, foot }: { icon: WIconName; tint?: string | null; title: string; big?: ReactNode; sub?: ReactNode; onClose: () => void; children?: ReactNode; foot?: ReactNode }) {
  const [shown, setShown] = useState(false)
  useEffect(() => { const r = requestAnimationFrame(() => setShown(true)); const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => { cancelAnimationFrame(r); removeEventListener('keydown', k) } }, [onClose])
  return (
    <div className={`ws-bg${shown ? ' on' : ''}`} onClick={onClose}>
      <section className="ws" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="ws-grab" />
        <header className="ws-h"><span className="ws-t"><IconChip icon={icon} tint={tint} />{title}</span><button className="ws-x" onClick={onClose} aria-label="닫기"><Icon name="close" size={18} stroke={2.4} /></button></header>
        {big !== undefined && <div className="ws-hero"><div className="ws-big">{big}</div>{sub && <p className="ws-sub">{sub}</p>}</div>}
        <div className="ws-body">{children}</div>
        {foot && <div className="ws-ft">{foot}</div>}
      </section>
    </div>
  )
}
/** 시트 안 묶음 카드 */
export const WSec = ({ title, right, children }: { title?: string; right?: ReactNode; children: ReactNode }) => (
  <div className="ws-sec">{title && <div className="ws-sh"><h3>{title}</h3>{right && <span>{right}</span>}</div>}<div className="ws-card">{children}</div></div>
)
