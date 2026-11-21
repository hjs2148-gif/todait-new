// 계획 편집 (RPlanEdit): 기간·요일, 남은 분량, 날짜별 분량, 계획 정리
import { useState } from 'react'
import { addDays, diffDays, dow, DOW_KO, todayISO } from './date.ts'
import { futurePlan, liveExpect, sumDone, type Task } from './logic.ts'
import { actions, offFor, subjectVar, useStore } from './store.ts'
import { PlanBar } from './Progress.tsx'
import { planProgress } from './progress.ts'
import { colorOf } from './view.ts'
import { DateText, Num, FullPage, Row, WeekPicker } from './ui.tsx'
import { Icon } from './Icon.tsx'

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
  const [weekOpen, setWeekOpen] = useState(false)

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
  const base0 = (() => { if (!sel || !isAmount) return plan; const bb = { ...live, custom: { ...live.custom } }; delete bb.custom[sel]; return futurePlan(bb, recs, today, off) })()
  const color = colorOf(s, live)
  const exam = s.exams.find((e) => e.selected && (e.scope.length === 0 || e.scope.some((x) => x.taskId === live.id)))
  const examNote = exam && endDate ? (() => { const n = diffDays(endDate, exam.date); return n > 0 ? `시험 ${n}일 전` : n === 0 ? '시험 당일' : `시험 ${-n}일 뒤` })() : ''

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
      <div className="pe-head"><i className="dot" style={{ background: color }} /><b>{live.name}</b>{isAmount && <small> · {done} / {live.amount}{live.unit}</small>}</div>
      <h2 className="fp-h2">기간</h2>
      <section className="fcard">
        <Row label="시작"><DateText value={startDate} onChange={(v) => v && setStartDate(v)} label="시작일" /></Row>
        {live.kind !== 'todo' && <Row label="끝"><DateText value={endDate} min={startDate} onChange={setEndDate} label="종료일" empty="계속" />{examNote && <small className="mu nowrap">{examNote}</small>}<Icon name="right" size={16} /></Row>}
        {live.kind === 'todo' && <Row label="마감일"><DateText value={due} onChange={setDue} label="마감일" empty="없음" /></Row>}
        {live.kind !== 'todo' && (live.repeatEvery
          ? <Row label="며칠마다"><Num value={every} onChange={setEvery} min={2} /></Row>
          : <>
              <button className="frow btn" onClick={() => setWeekOpen(!weekOpen)} aria-expanded={weekOpen}><span className="fl">요일</span><span className="grow">{weekText(week)}</span><Icon name="right" size={16} /></button>
              {weekOpen && <div className="week-in pad0"><WeekPicker value={week} onChange={setWeek} /></div>}
            </>)}
      </section>
      {isAmount && (
        <section className="tcard pe-left">
          <div className="tc-meta"><b className="big16">남은 {left}{live.unit}</b><span>하루 <b>{perDay}{live.unit}</b> · 공부일 {studyDays}일</span></div>
          <PlanBar s={s} p={planProgress(s, live, today, s.exams.find((e) => e.selected) ?? null)} />
          <small className="mu">끝나는 날을 바꾸면 하루 분량이 다시 계산돼요</small>
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
                const out = d < today || d < live.startDate || (!!live.endDate && d > live.endDate)
                const inc = isAmount && !custom && v > perDay
                const rest = v === 0
                return (
                  <button key={d} disabled={out} className={`pc${sel === d ? ' sel' : ''}${inc ? ' inc' : ''}${rest ? ' rest' : ''}`} onClick={() => setSel(sel === d ? null : d)} aria-pressed={sel === d} aria-label={`${md(d)} ${rest ? '쉼' : `${toVal(v)}${unit}`}`}>
                    <small>{Number(d.slice(8)) === 1 ? `${Number(d.slice(5, 7))}.1` : Number(d.slice(8))}</small>
                    <b>{out ? '' : rest ? '쉼' : toVal(v)}</b>
                    {!out && !rest && <u />}
                  </button>
                )
              })}
            </div>
            <div className="legend2"><span><i />기본</span><span><i className="u" />늘어난 날</span></div>
            {sel && (
              <div className="pe-sel">
                <div className="tc-meta"><b className="big16">{Number(sel.slice(5, 7))}월 {Number(sel.slice(8))}일 {DOW_KO[dow(sel)]}요일</b><span>원래 {toVal(isAmount ? (base0[sel] ?? 0) : live.perDay)}{unit}</span></div>
                <div className="end-q">
                  <span>이 날 분량</span>
                  <span className="stepper sm">
                    <button type="button" aria-label="줄이기" disabled={selVal <= 0} onClick={() => setDay(Math.max(0, fromVal(toVal(selVal) - (isTime ? 10 : 1))))}><Icon name="minus" size={18} /></button>
                    <span><b>{toVal(selVal)}</b><small>{unit}</small></span>
                    <button type="button" aria-label="늘리기" onClick={() => setDay(fromVal(toVal(selVal) + (isTime ? 10 : 1)))}><Icon name="plus" size={18} /></button>
                  </span>
                </div>
                <div className="pe-chips">
                  <button type="button" className="chip" onClick={() => setDay(0)}>쉬는 날로</button>
                  <button type="button" className="chip" disabled={live.custom[sel] === undefined} onClick={() => setDay(undefined)}>원래대로</button>
                </div>
                {moved && moved.delta !== 0 && moved.from && (
                  <p className="fnote">{moved.delta > 0 ? '줄인' : '늘린'} {Math.abs(moved.delta)}{unit}은 <b>{md(moved.from)}{moved.to !== moved.from ? `~${md(moved.to)}` : ''}</b>에 {moved.delta > 0 ? '나눠 더해요' : '덜어요'}</p>
                )}
              </div>
            )}
          </section>
        </>
      )}

      <h2 className="fp-h2">이름과 과목</h2>
      <section className="fcard">
        <Row label="이름"><input value={name} onChange={(e) => setName(e.target.value)} aria-label="이름" /></Row>
        <Row label="과목">
          <span className="subj" role="radiogroup" aria-label="과목">
            {[...s.categories, { id: '', name: '기타', color: '' }].map((c) => (
              <button key={c.id || 'none'} role="radio" aria-checked={categoryId === c.id} className={categoryId === c.id ? 'on' : ''} onClick={() => setCategoryId(c.id)}>
                <i style={{ background: c.id ? subjectVar(c.color) : 'var(--s-g)' }} />{c.name}
              </button>
            ))}
          </span>
        </Row>
        {isTime && <Row label="하루 목표"><span className="two-in"><Num value={hours} onChange={setHours} /><span>시간</span><Num value={mins} onChange={setMins} /><span>분</span></span></Row>}
      </section>

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

const WEEK_NAMES = ['일', '월', '화', '수', '목', '금', '토']
function weekText(w: boolean[]) {
  if (w.every(Boolean)) return '매일'
  if (w.join() === [false, true, true, true, true, true, false].join()) return '평일'
  if (w.join() === [true, false, false, false, false, false, true].join()) return '주말'
  return [1, 2, 3, 4, 5, 6, 0].filter((i) => w[i]).map((i) => WEEK_NAMES[i]).join('·') || '없음'
}

