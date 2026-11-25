import { useEffect, useState, type ReactNode } from 'react'
import { Icon } from './Icon.tsx'
import { DOW_KO } from './date.ts'
import { loadPhoto } from './store.ts'

export function Sheet({ title, dot, label, lead, sub, onClose, children }: { title: string; dot?: string; label?: string; lead?: ReactNode; sub?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={label ?? title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          {lead}
          <span className="sh-t"><h2>{dot && <i className="sh-dot" style={{ background: dot }} />}{title}</h2>{sub && <small>{sub}</small>}</span>
          <button className="icon-btn" onClick={onClose} aria-label="닫기"><Icon name="close" size={18} stroke={2.4} /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

export function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map(([v, label]) => (
        <button key={v} type="button" className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{label}</button>
      ))}
    </div>
  )
}

export function WeekPicker({ value, onChange, disabled }: { value: boolean[]; onChange: (v: boolean[]) => void; disabled?: number | null }) {
  return (
    <div className="week">
      {[1, 2, 3, 4, 5, 6, 0].map((i) => (
        <button
          key={i}
          type="button"
          disabled={disabled === i}
          className={value[i] && disabled !== i ? 'on' : ''}
          onClick={() => onChange(value.map((v, j) => (j === i ? !v : v)))}
        >
          {DOW_KO[i]}
        </button>
      ))}
    </div>
  )
}

export const Bar = ({ rate, color }: { rate: number; color?: string }) => (
  <div className="bar"><div style={{ width: `${Math.round(Math.min(rate, 1) * 100)}%`, background: color }} /></div>
)

export function Ring({ rate, size = 76, label }: { rate: number; size?: number; label: string }) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="ring">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--trk)" strokeWidth="6" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} stroke="var(--ink)" strokeWidth="6" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(rate, 1))} transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="var(--ink)" fontSize="17" fontWeight="700">{label}</text>
    </svg>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

/** 빈 칸을 허용하는 숫자 입력 */
export function Num({ value, onChange, min = 0, placeholder }: { value: number | null; onChange: (v: number | null) => void; min?: number; placeholder?: string }) {
  return (
    <input
      type="number" inputMode="numeric" min={min} placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Math.max(min, Math.floor(Number(e.target.value))))}
    />
  )
}

export function Photo({ id, onClick }: { id: string; onClick?: () => void }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    let u: string | undefined
    let alive = true
    loadPhoto(id).then((b) => {
      if (b && alive) setUrl((u = URL.createObjectURL(b)))
    })
    return () => {
      alive = false
      if (u) URL.revokeObjectURL(u)
    }
  }, [id])
  return url ? <img className="photo" src={url} alt="" onClick={onClick} /> : <div className="photo" />
}

/** 화면 전체를 덮는 입력 페이지 (취소 · 제목 · 저장) */
export function FullPage({ title, onClose, action, actionLabel = '저장', actionDisabled, cancelLabel, children }: { title: string; onClose: () => void; action?: () => void; actionLabel?: string; actionDisabled?: boolean; cancelLabel?: string; children: ReactNode }) {
  return (
    <div className="fullpage" role="dialog" aria-label={title}>
      <header className="fp-h">
        <button className="fp-b" onClick={onClose}>{action || cancelLabel ? cancelLabel ?? '취소' : <><Icon name="left" size={20} />뒤로</>}</button>
        <h1>{title}</h1>
        {action ? <button className="fp-b strong" disabled={actionDisabled} onClick={action}>{actionLabel}</button> : <span style={{ width: 56 }} />}
      </header>
      <div className="fp-body">{children}</div>
    </div>
  )
}

/** 항목 이름 + 오른쪽 내용 한 줄 */
export const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="frow"><span className="fl">{label}</span><span className="fr">{children}</span></div>
)

/** 날짜를 "11월 1일"처럼 보여 주고, 누르면 기기 날짜 고르기가 열린다 */
export function DateText({ value, onChange, label, min, empty = '', weekday }: { value: string; onChange: (v: string) => void; label: string; min?: string; empty?: string; weekday?: boolean }) {
  const [, m, d] = value ? value.split('-') : []
  return (
    <span className="datetext">
      <span className={value ? '' : 'mu'}>{value ? `${Number(m)}월 ${Number(d)}일${weekday ? ` ${DOW_KO[new Date(value.replace(/-/g, '/')).getDay()]}요일` : ''}` : empty}</span>
      <input type="date" value={value} min={min} onChange={(e) => onChange(e.target.value)} aria-label={label} />
    </span>
  )
}

/** 큰 숫자 + 작은 단위로 쓰는 길이 (예: 1<small>시간</small> 53<small>분</small>). 통계 칸·카드 숫자에 쓴다 */
export function Dur({ sec }: { sec: number }) {
  const m = Math.round(Math.max(0, sec) / 60)
  const h = Math.floor(m / 60)
  const r = m % 60
  return <>{h > 0 && <>{h}<small>시간</small></>}{h > 0 && r > 0 && ' '}{(r > 0 || h === 0) && <>{r}<small>분</small></>}</>
}
