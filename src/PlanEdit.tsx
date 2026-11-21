// 계획 편집 (RPlanEdit): 기간·요일, 남은 분량, 날짜별 분량, 계획 정리
import { useState } from 'react'
import { addDays, dow, DOW_KO, todayISO } from './date.ts'
import { futurePlan, liveExpect, sumDone, type Task } from './logic.ts'
import { actions, offFor, useStore } from './store.ts'
import { Num, FullPage, Row, WeekPicker } from './ui.tsx'

const md = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}.${Number(d)}` }

export function PlanEdit({ task, onClose }: { task: Task; onClose: () => void }) {
  const s = useStore()
  const today = todayISO()
  const live = s.tasks.find((t) => t.id === task.id) ?? task
  const [name, setName] = useState(live.name)
  const [categoryId, setCategoryId] = useState(live.categoryId ?? '')
  const [startDate, setStartDate] = useState(live.startDate)
  const [endDate, setEndDate] = useState(live.endDate ?? '')
  const [week, setWeek] = useState(live.week)
  const [every, setEvery] = useState<number | null>(live.repeatEvery)
  const [hours, setHours] = useState<number | null>(live.type === 'time' ? Math.floor(live.perDay / 3600) : null)
  const [mins, setMins] = useState<number | null>(live.type === 'time' ? Math.floor((live.perDay % 3600) / 60) : null)
  const [due, setDue] = useState(live.due ?? '')
  const [sel, setSel] = useState<string | null>(null)
  const [error, setError] = useState('')

  const recs = s.recs[live.id] ?? {}
  const off = offFor(s, live)
  const isAmount = live.type === 'amount'
  const isTime = live.type === 'time'
  const done = sumDone(recs)
  const left = isAmount ? Math.max(live.amount - done, 0) : 0
  const plan = isAmount ? futurePlan(live, recs, today, off) : {}
  const studyDays = Object.values(plan).filter((v) => v > 0).length
  const perDay = studyDays ? Math.ceil(left / studyDays) : 0

  const expectOn = (d: string): number => {
    if (isAmount) return plan[d] ?? 0
    return liveExpect(live, recs, d, off)
  }
  // 오늘이 속한 주의 월요일부터 3주
  const monday = addDays(today, -((dow(today) + 6) % 7))
  const days = Array.from({ length: 21 }, (_, i) => addDays(monday, i))
  const unit = isTime ? '분' : live.unit || '분량'
  const toVal = (n: number) => (isTime ? Math.round(n / 60) : n)
  const fromVal = (n: number) => (isTime ? n * 60 : n)

  // 고른 날의 분량을 바꿨을 때 달라지는 다음 날들
  const selVal = sel ? (live.custom[sel] ?? expectOn(sel)) : 0
  const moved = (() => {
    if (!sel || !isAmount || live.custom[sel] === undefined) return null
    const base = { ...live, custom: { ...live.custom } }
    delete base.custom[sel]
    const before = futurePlan(base, recs, today, off)
    const diffs = Object.keys(plan).filter((d) => d !== sel && (plan[d] ?? 0) !== (before[d] ?? 0)).sort()
    const delta = (before[sel] ?? 0) - (plan[sel] ?? 0)
    return { delta, from: diffs[0], to: diffs[diffs.length - 1], n: diffs.length }
  })()
  const setDay = (v: number | undefined) => { if (sel) actions.setCustom(live.id, sel, v) }

  const save = () => {
    if (!name.trim()) return setError('이름을 입력해주세요')
    if (endDate && endDate < startDate) return setError('종료일이 시작일보다 빠릅니다')
    // 종료일 없이 하루 분량으로 하던 옛 계획은 비워 둘 수 있다
    if (isAmount && !endDate && !live.perDay) return setError('종료일을 입력해주세요')
    const patch: Partial<Task> = { name: name.trim(), categoryId: categoryId || null, startDate, endDate: live.kind === 'todo' ? startDate : endDate || null, week }
    if (live.repeatEvery) patch.repeatEvery = every
    if (isTime) patch.perDay = (hours ?? 0) * 3600 + (mins ?? 0) * 60
    if (live.kind === 'todo') patch.due = due || null
    actions.patchTask(live.id, patch)
    onClose()
  }
  const paused = live.archived

  return (
    <FullPage title="계획 편집" onClose={onClose} action={save}>
      <div className="pe-head"><b>{live.name}</b>{isAmount && <small> · {done} / {live.amount}{live.unit}</small>}</div>
      <section className="fcard">
        <Row label="이름"><input value={name} onChange={(e) => setName(e.target.value)} aria-label="이름" /></Row>
        <Row label="과목">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="과목">
            <option value="">없음</option>
            {s.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Row>
        {isTime && <Row label="하루 목표"><span className="two-in"><Num value={hours} onChange={setHours} /><span>시간</span><Num value={mins} onChange={setMins} /><span>분</span></span></Row>}
      </section>
      <h2 className="fp-h2">기간</h2>
      <section className="fcard">
        <Row label="시작"><input type="date" value={startDate} onChange={(e) => e.target.value && setStartDate(e.target.value)} aria-label="시작일" /></Row>
        {live.kind !== 'todo' && <Row label="끝"><input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} aria-label="종료일" /></Row>}
        {live.kind === 'todo' && <Row label="마감일"><input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="마감일" /></Row>}
        {live.kind !== 'todo' && (live.repeatEvery
          ? <Row label="며칠마다"><Num value={every} onChange={setEvery} min={2} /></Row>
          : <div className="frow col"><span className="fl">요일</span><WeekPicker value={week} onChange={setWeek} /></div>)}
        {isAmount && <p className="fnote">끝나는 날을 바꾸면 하루 분량이 다시 계산돼요</p>}
      </section>
      {isAmount && (
        <section className="fcard">
          <Row label="남은 분량"><b>{left}{live.unit}</b></Row>
          <Row label="하루 분량"><b>{perDay}{live.unit} · 공부일 {studyDays}일</b></Row>
        </section>
      )}

      {(isAmount || isTime) && !live.completed && (
        <>
          <div className="fp-h2 fsplit"><h2>날짜별 분량</h2><small>눌러서 바꾸기</small></div>
          <section className="fcard">
            <div className="pe-cal">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => <small key={d}>{DOW_KO[d]}</small>)}
              {days.map((d) => {
                const v = expectOn(d)
                const custom = live.custom[d] !== undefined
                const past = d < today
                const inc = isAmount && !custom && v > perDay
                const rest = v === 0
                return (
                  <button key={d} disabled={past || d < live.startDate || (!!live.endDate && d > live.endDate)} className={`pc${sel === d ? ' sel' : ''}${custom ? ' custom' : ''}${inc ? ' inc' : ''}`} onClick={() => setSel(sel === d ? null : d)} aria-pressed={sel === d} aria-label={`${md(d)} ${rest ? '쉼' : `${toVal(v)}${unit}`}`}>
                    <small>{Number(d.slice(8)) === 1 ? `${Number(d.slice(5, 7))}.1` : Number(d.slice(8))}</small>
                    <b>{rest ? '쉼' : toVal(v)}</b>
                  </button>
                )
              })}
            </div>
            <div className="legend2"><span><i />기본</span><span><i className="c" />바꾼 날</span><span><i className="u" />늘어난 날</span></div>
            {sel && (
              <div className="pe-sel">
                <div className="tc-meta"><b>{md(sel)} ({DOW_KO[dow(sel)]})</b><span>원래 {toVal(isAmount ? (plan[sel] ?? 0) : live.perDay)}{unit}</span></div>
                <div className="stepper sm">
                  <button type="button" aria-label="줄이기" disabled={selVal <= 0} onClick={() => setDay(Math.max(0, fromVal(toVal(selVal) - (isTime ? 10 : 1))))}>−</button>
                  <span><b>{toVal(selVal)}</b><small>{unit}</small></span>
                  <button type="button" aria-label="늘리기" onClick={() => setDay(fromVal(toVal(selVal) + (isTime ? 10 : 1)))}>+</button>
                </div>
                <div className="two">
                  <button type="button" className="chip" onClick={() => setDay(0)}>쉬는 날로</button>
                  <button type="button" className="chip" disabled={live.custom[sel] === undefined} onClick={() => setDay(undefined)}>원래대로</button>
                </div>
                {moved && moved.delta !== 0 && moved.from && (
                  <p className="fnote">{moved.delta > 0 ? '줄인' : '늘린'} {Math.abs(moved.delta)}{unit}은 {md(moved.from)}{moved.to !== moved.from ? `~${md(moved.to)}` : ''}에 {moved.delta > 0 ? '더해요' : '덜어요'}</p>
                )}
              </div>
            )}
          </section>
        </>
      )}

      <h2 className="fp-h2">계획 정리</h2>
      <section className="fcard tight">
        <button className="frow btn" onClick={() => { paused ? actions.resumeTask(live.id, today) : actions.pauseTask(live.id, today); onClose() }}>
          <span className="fl strong">{paused ? '다시 시작하기' : '잠깐 멈추기'}</span><small className="mu">{paused ? '멈춘 날부터 다시 나눠요' : '분량이 쌓이지 않아요'}</small>
        </button>
        {!live.completed && <button className="frow btn" onClick={() => { actions.patchTask(live.id, { completed: true, completedDate: today }); onClose() }}><span className="fl strong">다 끝낸 것으로</span></button>}
        <button className="frow btn" onClick={() => { if (confirm(`'${live.name}' 계획과 기록을 지울까요? 되돌릴 수 없어요.`)) { actions.deleteTask(live.id); onClose() } }}><span className="fl bad">계획 지우기</span></button>
      </section>
      {error && <p className="error pad" role="alert">{error}</p>}
    </FullPage>
  )
}
