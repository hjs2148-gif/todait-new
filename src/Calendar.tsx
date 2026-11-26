import { Dur } from './ui.tsx'
import { useState } from 'react'
import { HistEdit } from './HistEdit.tsx'
import { Icon } from './Icon.tsx'
import { addDays, dow, fmtDate, parse, toISO, todayISO, DOW_KO } from './date.ts'
import { useStore } from './store.ts'
import { chapterStartsOn, dayGoals, dayRows, datesBetween, secByDaySubject, secOn } from './stats.ts'
import { hm } from './todayData.ts'
import { reviewCounts, upcomingReviews } from './progress.ts'
import { colorOf } from './view.ts'
import { subjectVar } from './model.ts'

/** 날짜 아래 막대: 길이 = 목표 달성, 채움 = 그날 과목별 공부 시간 비율. 75% 미만은 연하게 */
function DayBar({ rate, subj }: { rate: number; subj: { c: string; v: number }[] }) {
  const tot = subj.reduce((a, x) => a + x.v, 0)
  return (
    <span className={`cbar2${rate < 0.75 ? ' low' : ''}`}>
      <span style={{ width: `${Math.max(rate * 100, 8)}%` }}>
        {tot > 0 ? subj.map((x, i) => <i key={i} style={{ flexGrow: x.v, background: x.c }} />) : <i style={{ flexGrow: 1, background: 'var(--ink)' }} />}
      </span>
    </span>
  )
}

export function Calendar({ goTo }: { goTo: (date: string) => void }) {
  const s = useStore()
  const order = (k: string) => { const i = s.categories.findIndex((c) => c.id === k); return i < 0 ? 999 : i }
  const subj = (d: string) => Object.entries(secByDaySubject(s, d)).filter(([, v]) => v > 0).sort((a, b) => order(a[0]) - order(b[0]))
    .map(([k, v]) => ({ c: subjectVar(s.categories.find((c) => c.id === k)?.color), v }))
  const today = todayISO()
  const [month, setMonth] = useState(today.slice(0, 7))
  const [sel, setSel] = useState(today)
  const [edit, setEdit] = useState<{ date: string; taskId: string } | null>(null)

  if (edit) return <HistEdit date={edit.date} taskId={edit.taskId} onBack={() => setEdit(null)} onPick={(id) => setEdit({ ...edit, taskId: id })} />

  const first = `${month}-01`
  const shift = (n: number) => {
    const d = parse(first)
    d.setMonth(d.getMonth() + n)
    setMonth(toISO(d).slice(0, 7))
  }
  const cells: (string | null)[] = Array(dow(first)).fill(null)
  for (let d = first; d.slice(0, 7) === month; d = addDays(d, 1)) cells.push(d)
  const last = cells[cells.length - 1]!
  const [y, m] = month.split('-').map(Number)

  // 월 요약: 공부 시간, 평균 달성(목표 개수 기준), 공부한 날
  const days = datesBetween(first, last).filter((d) => d <= today)
  const monthSec = days.reduce((a, d) => a + secOn(s, d), 0)
  const studied = days.filter((d) => secOn(s, d) > 0).length
  let gt = 0
  let gd = 0
  for (const d of days) { const g = dayGoals(s, d, today); gt += g.total; gd += g.done }

  // 복습: 날짜별 단원 수, 앞으로 2주 안에 몰리는 날
  const rv = reviewCounts(s, today, first, last)
  const heavy = s.settings.reviewOn ? upcomingReviews(s, today, 14).find((d) => d.count >= 6) : undefined
  const rows = dayRows(s, sel, today)
  const selGoals = dayGoals(s, sel, today)
  const shown = rows.filter((r) => r.expect > 0 || r.done > 0 || r.sec > 0 || r.checked)
  const main = shown.slice(0, 5)
  const rest = shown.slice(5)
  const text = (r: (typeof rows)[number]) =>
    r.task.type === 'time' ? `${hm(r.sec)} / ${hm(r.expect)}` : r.task.type === 'check' ? (r.checked ? '끝' : '안 함') : sel > today ? `${r.expect}${r.task.unit}` : `${r.done} / ${r.expect}${r.task.unit}`

  return (
    <div className="page">
      <header className="th">
        <span className="cal-title">
          <h1>{y}년 {m}월</h1>
          <button className="arrow" onClick={() => shift(-1)} aria-label="이전 달"><Icon name="left" size={20} /></button>
          <button className="arrow" onClick={() => shift(1)} aria-label="다음 달"><Icon name="right" size={20} /></button>
        </span>
        <div className="th-r"><button className="chip" onClick={() => { setMonth(today.slice(0, 7)); setSel(today) }}>오늘</button></div>
      </header>
      <div className="tbody">
        <section className="tcard cal2" aria-label="달력">
          <div className="cal2-head">{DOW_KO.map((d, i) => <span key={d} className={i === 0 ? 'sun' : ''}>{d}</span>)}</div>
          <div className="cal2-grid">
            {cells.map((d, i) => {
              if (!d) return <span key={i} />
              const g = dayGoals(s, d, today)
              const rate = g.total ? g.done / g.total : null
              const rest = d in s.settings.restDays
              const starts = chapterStartsOn(s, d)
              return (
                <button key={d} className={`c2${(rv[d] ?? 0) >= 6 && d >= today ? ' rheavy' : ''}${d === sel ? ' sel' : ''}${d === today ? ' now' : ''}${dow(d) === 0 ? ' sun' : ''}${d > today ? ' future' : ''}`} onClick={() => setSel(d)} aria-label={`${fmtDate(d)}${rate !== null && d <= today ? ` 목표 ${g.done}/${g.total}` : ''}`} aria-pressed={d === sel}>
                  <span className="n">{Number(d.slice(8))}</span>
                  {rest ? <em>쉼</em> : d <= today && rate !== null ? <DayBar rate={rate} subj={subj(d)} /> : <span className="cbar2 off" />}
                  {starts.length > 0 && <u style={{ background: colorOf(s, starts[0]) }} aria-label="단원 시작" />}
                  {(rv[d] ?? 0) > 0 && <span className="rdots" aria-label={`복습 ${rv[d]}단원`}>{Array.from({ length: Math.min(3, Math.ceil(rv[d] / 2)) }, (_, k) => <i key={k} />)}</span>}
                </button>
              )
            })}
          </div>
          <div className="cal2-leg"><span><i className="b" />막대 길이 = 그날 목표 달성 · 색 = 공부한 과목</span><span><i className="b gray" />75% 미만은 연하게</span><span><u />단원 시작</span>{Object.keys(rv).length > 0 && <span><i className="rd" />복습 (점 하나 = 1~2단원)</span>}</div>
        </section>
        {heavy && <section className="tcard rv-heavy"><b>{fmtDate(heavy.date)}에 복습 {heavy.count}단원이 몰려요</b><small>하루 상한을 넘는 단원은 다음 날로 나눠서 넣어요. 진도 탭 복습 칸에서 상한을 바꿀 수 있어요.</small></section>}
        <div className="trio3">
          <section className="tcard"><b><Dur sec={monthSec} /></b><small>{m}월 공부</small></section>
          <section className="tcard"><b>{gt ? `${Math.round((gd / gt) * 100)}%` : '—'}</b><small>평균 달성</small></section>
          <section className="tcard"><b>{studied}일</b><small>공부한 날</small></section>
        </div>
        <div className="sec-h">
          <h2>{fmtDate(sel)}</h2>
          <small>{sel <= today ? `${hm(secOn(s, sel))} 공부${selGoals.total ? ` · 목표 ${selGoals.done}/${selGoals.total}` : ''}` : '예정'}{rv[sel] ? ` · 복습 ${rv[sel]}단원${sel > today ? ' 예정' : ''}` : ''}</small>
        </div>
        <section className="tcard tight">
          {main.length === 0 && <p className="empty tight">계획이 없는 날입니다.</p>}
          {main.map((r) => (
            <button key={r.task.id} className="rv full" disabled={sel > today} onClick={() => setEdit({ date: sel, taskId: r.task.id })}>
              <i className="dot" style={{ background: colorOf(s, r.task) }} />
              <span className="grow"><b className="blk ell">{r.task.name}</b><small className="blk ell">{r.task.type === 'time' ? `목표 ${hm(r.expect)}` : r.task.type === 'check' ? `목표 ${r.task.kind === 'todo' ? '할 일' : '습관'}` : `목표 ${r.expect}${r.task.unit}`}</small></span>
              {sel <= today && <span className="mbar" aria-hidden="true"><span style={{ width: `${Math.round(r.rate * 100)}%`, background: colorOf(s, r.task) }} /></span>}
              <b className="stat">{text(r)}</b>
            </button>
          ))}
          {rest.length > 0 && <p className="tc-sub more-line">그 밖에 {rest.length}개 · {rest.map((r) => r.task.name).join(', ')}</p>}
        </section>
        <div className="two-btn">
          <button className="chip" onClick={() => goTo(sel)}>이 날 오늘 탭에서 보기</button>
        </div>
      </div>
    </div>
  )
}
