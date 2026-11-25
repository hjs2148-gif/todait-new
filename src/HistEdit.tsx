// 지난 기록 고치기 (RHistEdit). 캘린더에서 날짜를 고르고 계획을 누르면 열린다.
import { Dur } from './ui.tsx'
import { useState } from 'react'
import { Stepper } from './Entry.tsx'
import { Icon } from './Icon.tsx'
import { fmtDate, fmtDur, todayISO } from './date.ts'
import { liveExpect, sumDone, type Recs } from './logic.ts'
import { actions, offFor, useStore } from './store.ts'
import { dayGoals, dayRows, secOn } from './stats.ts'
import { hm } from './todayData.ts'
import { colorOf } from './view.ts'

const clock = (ms: number) => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }

function statusText(row: ReturnType<typeof dayRows>[number]) {
  const t = row.task
  if (t.type === 'check') return row.checked ? (t.kind === 'todo' ? '끝' : '함') : t.kind === 'todo' ? '안 끝남' : '안 함'
  if (t.type === 'time') return `${hm(row.sec)} / ${hm(row.expect)}`
  return `${row.done}${t.unit}`
}

export function HistEdit({ date, taskId, onBack, onPick }: { date: string; taskId: string; onBack: () => void; onPick: (id: string) => void }) {
  const s = useStore()
  const today = todayISO()
  const rows = dayRows(s, date, today)
  const row = rows.find((r) => r.task.id === taskId)
  const task = row?.task
  const recs: Recs = (task && s.recs[task.id]) || {}
  const base = task && task.startPoint !== null && task.type === 'amount' ? task.startPoint - 1 + sumDone(recs, date) : 0
  const hasPos = !!task && task.type === 'amount' && task.startPoint !== null
  const [done, setDone] = useState(row?.done ?? 0)
  const [saved, setSaved] = useState(false)
  const [adding, setAdding] = useState(false)
  const [start, setStart] = useState('20:00')
  const [mins, setMins] = useState('30')
  const g = dayGoals(s, date, today)
  const secs = secOn(s, date)
  const hist = s.histories.filter((h) => h.taskId === taskId && h.date === date).sort((a, b) => a.startedAt - b.startedAt)
  if (!task || !row) return null
  const room = task.type === 'amount' ? Math.max(task.amount - sumDone(recs, date), 0) : Infinity
  const v = Math.min(done, room)
  const unit = task.unit || '분량'

  // 고치면 오늘부터 남은 분량이 어떻게 달라지는지
  let note: string | null = null
  if (task.type === 'amount' && date < today) {
    const off = offFor(s, task)
    const after: Recs = { ...recs, [date]: { ...(recs[date] ?? { sec: 0, checked: false, done: 0 }), done: v } }
    const e0 = liveExpect(task, recs, today, off)
    const e1 = liveExpect(task, after, today, off)
    const a0 = (task.startPoint ?? 0) + sumDone(recs, today)
    const a1 = (task.startPoint ?? 0) + sumDone(after, today)
    const fmt = (a: number, e: number) => (hasPos ? `${a}~${a + e - 1}${task.unit}` : `${e}${task.unit}`)
    if (e0 !== e1 || a0 !== a1) note = `오늘 ${fmt(a0, e0)} → ${fmt(a1, e1)}`
  }
  const dirty = v !== row.done
  const save = () => { actions.setDone(task.id, date, v); setSaved(true) }
  const addTime = () => {
    const m = Math.floor(Number(mins))
    const [hh, mm] = start.split(':').map(Number)
    if (!(m > 0) || Number.isNaN(hh)) return
    const startedAt = new Date(`${date.replace(/-/g, '/')} ${hh}:${mm}:00`).getTime()
    actions.addHistory({ taskId: task.id, date, startedAt, endedAt: startedAt + m * 60000, manual: true })
    setAdding(false)
  }

  return (
    <div className="page">
      <header className="nav-h">
        <button className="back" onClick={onBack}><Icon name="left" size={20} />캘린더</button>
        <h1 className="nav-t">{fmtDate(date)}</h1>
        <span style={{ width: 56 }} />
      </header>
      <div className="tbody">
        <div className="trio3">
          <section className="tcard"><b><Dur sec={secs} /></b><small>공부 시간</small></section>
          <section className="tcard"><b>{g.total ? `${Math.round((g.done / g.total) * 100)}%` : '—'}</b><small>목표 달성 · 개수</small></section>
          <section className="tcard"><b>{g.done} / {g.total}</b><small>끝낸 목표</small></section>
        </div>
        <div className="sec-h"><h2>고치는 중</h2></div>
        <section className="tcard" aria-label={`${task.name} 기록 고치기`}>
          <div className="ch"><i className="dot" style={{ background: colorOf(s, task) }} /><b className="ch-name">{task.name}</b><span className="ch-r mu">목표 {task.type === 'time' ? hm(row.expect) : task.type === 'check' ? '체크' : `${row.expect}${task.unit}`}</span></div>
          {task.type === 'check' && (
            <button className="ghost wide" onClick={() => { actions.toggleCheck(task.id, date) }}>{row.checked ? '함 → 안 함으로 바꾸기' : '안 함 → 함으로 바꾸기'}</button>
          )}
          {task.type !== 'check' && task.type !== 'time' && (
            <>
              <div className="entry-q left">어디까지 했나요?</div>
              <Stepper label={hasPos ? '쪽' : unit} value={hasPos ? base + v : v} unit={task.unit} min={hasPos ? base : 0} max={hasPos ? base + room : room} onChange={(n) => { setDone(Math.max(0, hasPos ? n - base : n)); setSaved(false) }} />
              <p className="entry-left">{hasPos ? `${base + row.done}${task.unit} → ` : `${row.done}${task.unit} → `}<b>{hasPos ? base + v : v}{task.unit}</b> · 이날 {row.done}{task.unit} → {v}{task.unit}</p>
            </>
          )}
          <hr className="hr" />
          <div className="tc-meta"><b>공부한 시간</b><b>{hm(row.sec)}</b></div>
          {hist.map((h) => (
            <div key={h.id} className="hrow">
              <span className="grow">{clock(h.startedAt)} ~ {clock(h.endedAt)}</span>
              <small>{h.manual ? '직접 넣음' : '스톱워치'}</small>
              <b>{Math.round((h.endedAt - h.startedAt) / 60000)}분</b>
              <button className="x" aria-label="이 기록 지우기" onClick={() => actions.deleteHistory(h.id)}><Icon name="close" size={14} /></button>
            </div>
          ))}
          {hist.length === 0 && row.sec > 0 && <p className="tc-sub">{fmtDur(row.sec)} (목록 없는 기록)</p>}
          {adding ? (
            <div className="hadd">
              <label>시작<input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></label>
              <label>분<input type="number" inputMode="numeric" min={1} value={mins} onChange={(e) => setMins(e.target.value)} /></label>
              <button className="chip dark" onClick={addTime}>넣기</button>
            </div>
          ) : <button className="dashed" onClick={() => setAdding(true)}><Icon name="plus" size={16} />시간 직접 넣기</button>}
          {task.type !== 'check' && (
            <div className="info"><span>지난 기록을 고치면 <b>오늘부터 남은 분량이 다시 나뉘어요.</b>{note ? ` ${note}` : ''}</span></div>
          )}
          {task.type !== 'check' && task.type !== 'time' && <button className="primary" disabled={!dirty && !saved} onClick={save}>{saved && !dirty ? '저장했어요' : '저장'}</button>}
        </section>
        {rows.length > 1 && (
          <>
            <div className="sec-h"><h2>이날 다른 기록</h2></div>
            <section className="tcard tight">
              {rows.filter((r) => r.task.id !== taskId).map((r) => (
                <button key={r.task.id} className="rv full" onClick={() => onPick(r.task.id)}>
                  <i className="dot" style={{ background: colorOf(s, r.task) }} />
                  <span className="grow"><b className="blk ell">{r.task.name}</b><small className="blk">{r.task.type === 'time' ? `목표 ${hm(r.expect)}` : r.task.type === 'check' ? (r.task.kind === 'todo' ? '할 일' : '습관') : `목표 ${r.expect}${r.task.unit}`}</small></span>
                  <b className="stat">{statusText(r)}</b>
                  <Icon name="right" size={16} />
                </button>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

