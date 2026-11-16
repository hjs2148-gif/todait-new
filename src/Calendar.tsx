import { useState } from 'react'
import { addDays, dow, fmtDate, fmtDur, parse, toISO, todayISO, DOW_KO } from './date.ts'
import { useStore } from './store.ts'
import { Bar } from './ui.tsx'
import { colorOf, dayRate, daySec, itemsOn, pct, progressLabel } from './view.ts'

export function Calendar({ goTo }: { goTo: (date: string) => void }) {
  const s = useStore()
  const today = todayISO()
  const [month, setMonth] = useState(today.slice(0, 7))
  const [sel, setSel] = useState(today)

  const first = `${month}-01`
  const shift = (n: number) => {
    const d = parse(first)
    d.setMonth(d.getMonth() + n)
    setMonth(toISO(d).slice(0, 7))
  }
  const cells: (string | null)[] = Array(dow(first)).fill(null)
  for (let d = first; d.slice(0, 7) === month; d = addDays(d, 1)) cells.push(d)

  const selItems = itemsOn(s, sel, today).active
  const [y, m] = month.split('-').map(Number)

  return (
    <div className="page">
      <header className="top">
        <button onClick={() => shift(-1)} aria-label="이전 달">‹</button>
        <h1>{y}년 {m}월</h1>
        <button onClick={() => shift(1)} aria-label="다음 달">›</button>
      </header>
      <div className="cal">
        {DOW_KO.map((d, i) => <div key={d} className={`cal-head${i === 0 ? ' sun' : ''}`}>{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const rate = dayRate(itemsOn(s, d, today).active)
          const sec = daySec(s, d)
          const past = d <= today
          return (
            <button key={d} className={`cal-cell${d === sel ? ' sel' : ''}${d === today ? ' today' : ''}`} onClick={() => setSel(d)}>
              <span className={dow(d) === 0 ? 'sun' : ''}>{Number(d.slice(8))}</span>
              {rate !== null && (
                <i style={past ? { background: `rgba(0,210,177,${0.15 + rate * 0.85})`, color: rate > 0.5 ? '#fff' : '#05a388' } : undefined}>
                  {past ? Math.round(rate * 100) : '·'}
                </i>
              )}
              {sec > 0 && <small>{sec >= 3600 ? `${(sec / 3600).toFixed(1)}h` : `${Math.round(sec / 60)}m`}</small>}
            </button>
          )
        })}
      </div>

      <section>
        <h3>
          {fmtDate(sel)}
          <em onClick={() => goTo(sel)}>이 날로 이동</em>
        </h3>
        {selItems.length > 0 && (
          <p className="hint">{sel <= today ? `성취율 ${pct(dayRate(selItems))} · 공부 ${fmtDur(daySec(s, sel))}` : '예정된 계획입니다. 진행 상황에 따라 분량이 달라질 수 있습니다.'}</p>
        )}
        {selItems.length === 0 && <p className="empty">계획이 없는 날입니다.</p>}
        {selItems.map((item) => (
          <div className="card" key={item.task.id} style={{ borderLeftColor: colorOf(s, item.task) }}>
            <div className="card-main">
              <strong>{item.task.name}</strong>
              <small>{progressLabel(item)}</small>
              {sel <= today && <Bar rate={item.rate} color={colorOf(s, item.task)} />}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
