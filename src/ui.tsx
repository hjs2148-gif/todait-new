import { useEffect, useState, type ReactNode } from 'react'
import { DOW_KO } from './date.ts'
import { loadPhoto } from './store.ts'

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="닫기">✕</button>
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
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.3)" strokeWidth="6" fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r} stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(rate, 1))} transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="17" fontWeight="700">{label}</text>
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
