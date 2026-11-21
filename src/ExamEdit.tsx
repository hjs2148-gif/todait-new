// 시험 설정 (RExam): 이름·날짜·비워 둘 날, 시험 범위(계획 연결), 끝나는 날 맞추기
import { useState } from 'react'
import { diffDays, fmtDate, todayISO } from './date.ts'
import { sumDone, type Task } from './logic.ts'
import { examProgress, fitPreview, isProgressTask } from './progress.ts'
import { actions, uid, useStore, type Exam, type ExamScope } from './store.ts'
import { FullPage, Num, Row, Sheet } from './ui.tsx'
import { colorOf } from './view.ts'

const md = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}.${Number(d)}` }

function RangeSheet({ task, scope, onSave, onClose }: { task: Task; scope: ExamScope; onSave: (sc: ExamScope) => void; onClose: () => void }) {
  const start = task.startPoint ?? 1
  const end = start + task.amount - 1
  const [from, setFrom] = useState<number | null>(scope.from ?? start)
  const [to, setTo] = useState<number | null>(scope.to ?? end)
  const ok = from !== null && to !== null && from >= start && to <= end && from <= to
  const whole = from === start && to === end
  return (
    <Sheet title={`${task.name} 시험 범위`} onClose={onClose}>
      <p className="hint">전체는 {start}~{end}{task.unit}예요. 시험에 나오는 부분만 골라요.</p>
      {task.chapters && task.chapters.length > 0 && (
        <div className="chips">{task.chapters.map((c, i) => <button key={c.id} onClick={() => { setFrom(c.from); setTo(c.to) }}>{i + 1}단원</button>)}</div>
      )}
      <div className="two-in big"><Num value={from} onChange={setFrom} /><span>~</span><Num value={to} onChange={setTo} /><span>{task.unit}</span></div>
      {!ok && <p className="error">범위를 {start}~{end}{task.unit} 안에서 입력해주세요</p>}
      <button className="primary" disabled={!ok} onClick={() => { onSave(whole ? { taskId: task.id, from: null, to: null } : { taskId: task.id, from, to }); onClose() }}>저장</button>
    </Sheet>
  )
}

export function ExamEdit({ examId, onClose }: { examId: string | null; onClose: () => void }) {
  const s = useStore()
  const today = todayISO()
  const orig = s.exams.find((e) => e.id === examId) ?? null
  const [e, setE] = useState<Exam>(() => orig ?? { id: uid(), name: '', date: today, selected: s.exams.length === 0, blankDays: 0, scope: [], fitEnd: false })
  const [range, setRange] = useState<string | null>(null)
  const [error, setError] = useState('')
  const set = (p: Partial<Exam>) => { setE({ ...e, ...p }); setError('') }

  const cands = s.tasks.filter((t) => !t.archived && !t.completed && (isProgressTask(t) || t.kind === 'time'))
  const scoped = (id: string) => e.scope.find((x) => x.taskId === id)
  const toggle = (t: Task) => {
    if (!isProgressTask(t)) return
    set({ scope: scoped(t.id) ? e.scope.filter((x) => x.taskId !== t.id) : [...e.scope, { taskId: t.id, from: null, to: null }] })
  }
  const n = diffDays(today, e.date)
  const ep = examProgress(s, e, today)
  const fit = fitPreview(s, e, today)
  const rangeLabel = (t: Task, sc: ExamScope) => {
    const start = t.startPoint ?? 1
    const chs = t.chapters?.length ? `${t.chapters.length}단원 전체 · ` : ''
    return sc.from === null || sc.to === null ? `${chs}${t.amount}${t.unit}` : `${sc.from}~${sc.to}${t.unit} (전체 ${start}~${start + t.amount - 1})`
  }
  const leftOf = (t: Task) => Math.max(t.amount - sumDone(s.recs[t.id] ?? {}), 0)

  const save = () => {
    if (!e.name.trim()) return setError('시험 이름을 입력해주세요')
    const next: Exam = { ...e, name: e.name.trim() }
    actions.saveExam(next)
    if (next.fitEnd) for (const p of fitPreview(s, next, today)) if (!p.same && p.newEnd >= p.task.startDate) actions.patchTask(p.task.id, { endDate: p.newEnd })
    onClose()
  }

  return (
    <FullPage title="시험" onClose={onClose} action={save}>
      <section className="tcard" aria-label="시험">
        <div className="exam-top">
          <span className="dbox"><small>D</small><b>{n === 0 ? '0' : n > 0 ? `-${n}` : `+${-n}`}</b></span>
          <span className="grow"><b className="exam-name">{e.name || '새 시험'}</b><small className="blk mu">{fmtDate(e.date)} · 계획 {e.scope.length || cands.filter(isProgressTask).length}개{ep ? ` · 지금 ${Math.round(ep.done * 100)}%` : ''}</small></span>
        </div>
      </section>
      <section className="fcard">
        <Row label="이름"><input value={e.name} onChange={(ev) => set({ name: ev.target.value })} placeholder="예) 기말고사" aria-label="이름" /></Row>
        <Row label="날짜"><input type="date" value={e.date} onChange={(ev) => ev.target.value && set({ date: ev.target.value })} aria-label="날짜" /></Row>
        <Row label="비워 둘 날">
          <span className="two-in">
            <small className="mu">복습만</small>
            <button className="sq" aria-label="줄이기" disabled={e.blankDays <= 0} onClick={() => set({ blankDays: e.blankDays - 1 })}>−</button>
            <b className="nm">{e.blankDays}<small>일</small></b>
            <button className="sq" aria-label="늘리기" disabled={e.blankDays >= 14} onClick={() => set({ blankDays: e.blankDays + 1 })}>+</button>
          </span>
        </Row>
      </section>

      <div className="fp-h2 fsplit"><h2>시험 범위</h2><small>계획을 고르고 범위를 정해요</small></div>
      <section className="fcard tight">
        {cands.length === 0 && <p className="empty tight">책이나 인강 계획이 없어요</p>}
        {cands.map((t) => {
          const sc = scoped(t.id)
          const can = isProgressTask(t)
          return (
            <div key={t.id} className={`frow scope${can ? '' : ' dim'}`}>
              <button className={`chk${sc ? ' on' : ''}`} role="checkbox" aria-checked={!!sc} disabled={!can} aria-label={`${t.name} 범위에 넣기`} onClick={() => toggle(t)}>{sc && '✓'}</button>
              <i className="dot" style={{ background: colorOf(s, t) }} />
              <button className="grow sc-main" disabled={!sc} onClick={() => setRange(t.id)}>
                <b className="blk ell">{t.name}</b>
                <small className="blk ell mu">{can ? (sc ? rangeLabel(t, sc) : `${md(t.startDate)} 시작`) : '시간 계획은 범위가 없어요'}</small>
              </button>
              {sc && <small className="nowrap">{leftOf(t)}{t.unit} 남음</small>}
            </div>
          )
        })}
      </section>

      <section className="fcard">
        <div className="frow">
          <span className="grow"><b className="blk">끝나는 날 맞추기 · {md(fit[0]?.newEnd ?? e.date)}</b><small className="blk mu">비워 둘 날 전에 범위가 다 끝나게 나눠요</small></span>
          <input type="checkbox" className="switch" checked={e.fitEnd} onChange={(ev) => set({ fitEnd: ev.target.checked })} aria-label="끝나는 날 맞추기" />
        </div>
        {fit.length > 0 && (
          <div className="fit">
            {fit.map((p) => (
              <div key={p.task.id}>
                <i className="dot" style={{ background: colorOf(s, p.task) }} />
                <span className="grow ell">{p.task.name}</span>
                {p.same ? <small className="mu">그대로</small> : <small><s className="bad">{p.end ? md(p.end) : '계속'}</s> → <b>{md(p.newEnd)}</b></small>}
              </div>
            ))}
            {fit.some((p) => !p.same && p.perDayNew !== p.perDayNow) && (
              <p className="fnote">{fit.filter((p) => !p.same && p.perDayNew !== p.perDayNow).map((p) => `${p.task.name} 하루 ${p.perDayNow}${p.task.unit} → ${p.perDayNew}${p.task.unit}`).join(' · ')}</p>
            )}
          </div>
        )}
      </section>
      {orig && <button className="fcard delbtn bad" onClick={() => { if (confirm(`'${orig.name}' 시험을 지울까요? 계획은 그대로 남아요.`)) { actions.deleteExam(orig.id); onClose() } }}>시험 지우기</button>}
      {error && <p className="error pad" role="alert">{error}</p>}
      {range && (() => {
        const t = s.tasks.find((x) => x.id === range)
        const sc = scoped(range)
        return t && sc ? <RangeSheet task={t} scope={sc} onClose={() => setRange(null)} onSave={(x) => set({ scope: e.scope.map((y) => (y.taskId === x.taskId ? x : y)) })} /> : null
      })()}
    </FullPage>
  )
}
