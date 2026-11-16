import { useState } from 'react'
import { Icon } from './Icon.tsx'
import { addDays, dow, fmtDur, parse, todayISO, DOW_KO } from './date.ts'
import { useStore } from './store.ts'
import { Bar, Seg } from './ui.tsx'
import { dayRate, daySec, itemsOn, pct } from './view.ts'

export function Stats() {
  const s = useStore()
  const today = todayISO()
  const [span, setSpan] = useState<'week' | 'month'>('week')
  const [offset, setOffset] = useState(0)
  const len = span === 'week' ? 7 : 30
  const end = addDays(today, offset * len)
  const days = Array.from({ length: len }, (_, i) => addDays(end, i - len + 1))

  const secs = days.map((d) => daySec(s, d))
  const rates = days.map((d) => (d <= today ? dayRate(itemsOn(s, d, today).active) : null))
  const total = secs.reduce((a, b) => a + b, 0)
  const studied = secs.filter((v) => v > 0).length
  const rated = rates.filter((r): r is number => r !== null)
  const avgRate = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null
  const maxSec = Math.max(...secs, 1)

  // 카테고리별·계획별 공부 시간
  const byTask = s.tasks
    .map((t) => ({ t, sec: days.reduce((a, d) => a + (s.recs[t.id]?.[d]?.sec ?? 0), 0) }))
    .filter((x) => x.sec > 0)
    .sort((a, b) => b.sec - a.sec)
  const byCat = new Map<string, { name: string; color: string; sec: number }>()
  for (const { t, sec } of byTask) {
    const c = s.categories.find((x) => x.id === t.categoryId)
    const key = c?.id ?? ''
    const cur = byCat.get(key) ?? { name: c?.name ?? '카테고리 없음', color: c?.color ?? '#aeaeae', sec: 0 }
    cur.sec += sec
    byCat.set(key, cur)
  }
  const label = (d: string) => (span === 'week' ? DOW_KO[dow(d)] : parse(d).getDate() % 5 === 0 ? String(parse(d).getDate()) : '')
  const md = (d: string) => `${parse(d).getMonth() + 1}.${parse(d).getDate()}`

  const Chart = ({ values, max, color, title }: { values: (number | null)[]; max: number; color: string; title: (v: number) => string }) => (
    <div className="chart">
      {values.map((v, i) => (
        <div key={days[i]} className="chart-col" title={v === null ? '' : title(v)}>
          <div className="chart-bar"><div style={{ height: `${v === null ? 0 : Math.max((v / max) * 100, v > 0 ? 3 : 0)}%`, background: color }} /></div>
          <small className={days[i] === today ? 'now' : ''}>{label(days[i])}</small>
        </div>
      ))}
    </div>
  )

  return (
    <div className="page">
      <header className="top">
        <button onClick={() => setOffset(offset - 1)} aria-label="이전"><Icon name="left" /></button>
        <h1>{md(days[0])} ~ {md(end)}</h1>
        <button onClick={() => setOffset(Math.min(0, offset + 1))} disabled={offset === 0} aria-label="다음"><Icon name="right" /></button>
      </header>
      <div className="pad"><Seg value={span} onChange={(v) => { setSpan(v); setOffset(0) }} options={[['week', '주간'], ['month', '월간']]} /></div>

      <div className="tiles">
        <div><small>총 공부 시간</small><strong>{fmtDur(total)}</strong></div>
        <div><small>공부한 날 평균</small><strong>{fmtDur(studied ? total / studied : 0)}</strong></div>
        <div><small>평균 성취율</small><strong>{pct(avgRate)}</strong></div>
      </div>

      <section>
        <h3>공부 시간</h3>
        <Chart values={secs} max={maxSec} color="#00d2b1" title={fmtDur} />
      </section>
      <section>
        <h3>성취율</h3>
        <Chart values={rates} max={1} color="#5393d1" title={(v) => pct(v)} />
      </section>

      <section>
        <h3>카테고리별</h3>
        {byCat.size === 0 && <p className="empty">이 기간에 스톱워치 기록이 없습니다.</p>}
        {[...byCat.values()].sort((a, b) => b.sec - a.sec).map((c) => (
          <div className="stat-row" key={c.name}>
            <div><span>{c.name}</span><span>{fmtDur(c.sec)} · {Math.round((c.sec / total) * 100)}%</span></div>
            <Bar rate={c.sec / total} color={c.color} />
          </div>
        ))}
      </section>
      {byTask.length > 0 && (
        <section>
          <h3>계획별</h3>
          {byTask.map(({ t, sec }) => (
            <div className="stat-row" key={t.id}>
              <div><span>{t.name}</span><span>{fmtDur(sec)}</span></div>
              <Bar rate={sec / byTask[0].sec} />
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
