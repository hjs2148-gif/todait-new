// 계획 관리 (RPlans): 진행 중 · 멈춘 것 · 끝낸 것, 5가지 분류로 묶음.
// 점 여섯 개 손잡이를 끌어 순서를 바꾸고, 행을 왼쪽으로 밀어 멈추거나 끝낸다.
import { useRef, useState } from 'react'
import { Icon } from './Icon.tsx'
import { todayISO } from './date.ts'
import { isFinished, sumDone, type Task, type TaskKind } from './logic.ts'
import { planProgress } from './progress.ts'
import { actions, useStore, type State } from './store.ts'
import { habitDays, hm, KIND_NAME } from './todayData.ts'
import { colorOf } from './view.ts'

const md = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}.${Number(d)}` }
const KIND_ORDER: TaskKind[] = ['book', 'lecture', 'time', 'habit', 'todo']
const OPEN = -148

function sub(s: State, t: Task, today: string): { text: string; bad?: boolean } {
  const recs = s.recs[t.id] ?? {}
  if (t.type === 'amount') {
    const exam = s.exams.find((e) => e.selected) ?? null
    const p = planProgress(s, t, today, exam)
    const range = `${t.startDate > today ? `${md(t.startDate)} 시작` : `${md(t.startDate)}${t.endDate ? ` ~ ${md(t.endDate)}` : ''}`} · ${sumDone(recs)} / ${t.amount}${t.unit}`
    return p.vsExam === 'late' ? { text: `${sumDone(recs)} / ${t.amount}${t.unit} · 시험 뒤에 끝남`, bad: true } : { text: range }
  }
  if (t.kind === 'time') return { text: `매일 ${hm(t.perDay)} · ${t.endDate ? `${md(t.endDate)}까지` : '계속'}` }
  if (t.kind === 'habit') return { text: `${t.repeatEvery ? `${t.repeatEvery}일마다` : t.week.every(Boolean) ? '매일' : '요일마다'} · 연속 ${habitDays(s, t, today, 16).streak}일` }
  return { text: t.completed ? `${md(t.completedDate ?? t.startDate)} 끝` : t.due === today || t.startDate === today ? '오늘까지' : `${md(t.due ?? t.startDate)}까지` }
}

/** 한 줄: 왼쪽으로 밀면 멈춤·끝냄 */
function PlanRow({ s, t, today, view, onEdit, onDragStart }: { s: State; t: Task; today: string; view: 'doing' | 'paused' | 'done'; onEdit: () => void; onDragStart: (e: React.PointerEvent) => void }) {
  const [x, setX] = useState(0)
  const start = useRef<{ x: number; y: number; base: number; moved: boolean } | null>(null)
  const info = sub(s, t, today)
  const rate = t.type === 'amount' ? Math.min(sumDone(s.recs[t.id] ?? {}) / Math.max(t.amount, 1), 1) : null
  const down = (e: React.PointerEvent) => { start.current = { x: e.clientX, y: e.clientY, base: x, moved: false } }
  const move = (e: React.PointerEvent) => {
    const st = start.current
    if (!st || view !== 'doing') return
    const dx = e.clientX - st.x
    if (!st.moved && Math.abs(dx) < 8) return
    if (!st.moved && Math.abs(e.clientY - st.y) > Math.abs(dx)) { start.current = null; return }
    st.moved = true
    setX(Math.max(OPEN, Math.min(0, st.base + dx)))
  }
  const up = () => {
    const st = start.current
    start.current = null
    if (!st) return
    if (!st.moved) { if (x !== 0) setX(0); else onEdit(); return }
    setX(x < OPEN / 2 ? OPEN : 0)
  }
  return (
    <div className="prow2">
      {view === 'doing' && (
        <div className="prow2-acts" aria-hidden={x === 0}>
          <button onClick={() => { actions.pauseTask(t.id, today); setX(0) }}>멈춤</button>
          <button className="end" onClick={() => { actions.patchTask(t.id, { completed: true, completedDate: today }); setX(0) }}>끝냄</button>
        </div>
      )}
      <div className="prow2-main" style={{ transform: `translateX(${x}px)` }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { start.current = null; setX(0) }}>
        {view === 'doing' && <span className="grip" role="button" aria-label={`${t.name} 순서 옮기기`} onPointerDown={(e) => { e.stopPropagation(); onDragStart(e) }}>⠿</span>}
        <i className="dot" style={{ background: colorOf(s, t) }} />
        <span className="grow"><b className="blk ell">{t.name}</b><small className={`blk ell${info.bad ? ' bad' : ''}`}>{info.text}</small></span>
        {rate !== null && <span className="mbar" aria-hidden="true"><span style={{ width: `${rate * 100}%`, background: colorOf(s, t) }} /></span>}
        {view === 'paused' && <button className="chip" onPointerDown={(e) => e.stopPropagation()} onClick={() => actions.resumeTask(t.id, today)}>다시 시작</button>}
        {view === 'done' && <button className="chip" onPointerDown={(e) => e.stopPropagation()} onClick={() => actions.patchTask(t.id, { completed: false, completedDate: null })}>되돌리기</button>}
        <Icon name="right" size={16} />
      </div>
    </div>
  )
}

export function Plans({ onClose, edit, newPlan }: { onClose: () => void; edit: (t: Task) => void; newPlan?: () => void }) {
  const s = useStore()
  const today = todayISO()
  const [view, setView] = useState<'doing' | 'paused' | 'done'>('doing')
  const [drag, setDrag] = useState<{ id: string; dy: number } | null>(null)
  const dragRef = useRef<{ id: string; y: number; kind: TaskKind } | null>(null)
  const finished = (t: Task) => !t.archived && isFinished(t, today)
  const groups = {
    doing: s.tasks.filter((t) => !t.archived && !finished(t)),
    paused: s.tasks.filter((t) => t.archived),
    done: s.tasks.filter(finished),
  }
  const list = [...groups[view]].sort((a, b) => a.order - b.order)

  // 손잡이로 끌기: 한 줄 높이만큼 움직이면 옆 계획과 순서를 바꾼다
  const ROW = 64
  const onDragStart = (t: Task) => (e: React.PointerEvent) => {
    dragRef.current = { id: t.id, y: e.clientY, kind: t.kind }
    setDrag({ id: t.id, dy: 0 })
    const moveFn = (ev: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      let dy = ev.clientY - d.y
      const rows = list.filter((x) => x.kind === d.kind)
      const i = rows.findIndex((x) => x.id === d.id)
      const j = dy > ROW / 2 ? i + 1 : dy < -ROW / 2 ? i - 1 : i
      if (j !== i && rows[j]) {
        const a = rows[i]
        const b = rows[j]
        actions.patchTask(a.id, { order: b.order })
        actions.patchTask(b.id, { order: a.order })
        d.y += (j - i) * ROW
        dy = ev.clientY - d.y
      }
      setDrag({ id: d.id, dy })
    }
    const upFn = () => { dragRef.current = null; setDrag(null); window.removeEventListener('pointermove', moveFn); window.removeEventListener('pointerup', upFn) }
    window.addEventListener('pointermove', moveFn)
    window.addEventListener('pointerup', upFn)
  }

  return (
    <div className="fullpage" role="dialog" aria-label="계획 관리">
      <header className="fp-h">
        <button className="fp-b" onClick={onClose}><Icon name="left" size={20} />더보기</button>
        {newPlan ? <button className="sq ink" onClick={newPlan} aria-label="새 계획"><Icon name="plus" size={18} /></button> : <span />}
      </header>
      <div className="fp-body">
        <h1 className="big-title">계획 관리</h1>
        <div role="tablist" aria-label="보기" className="segs">
          {([['doing', '진행 중'], ['paused', '멈춘 것'], ['done', '끝낸 것']] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={view === k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l} {groups[k].length}</button>
          ))}
        </div>
        {view === 'doing' && <p className="fnote top">점 여섯 개를 끌어 순서를 바꾸고, 왼쪽으로 밀어 멈추거나 끝내요.</p>}
        {list.length === 0 && <p className="empty">{view === 'doing' ? '진행 중인 계획이 없어요' : view === 'paused' ? '멈춘 계획이 없어요' : '끝낸 계획이 없어요'}</p>}
        {KIND_ORDER.map((k) => {
          const rows = list.filter((t) => t.kind === k)
          if (!rows.length) return null
          return (
            <div key={k} className="plgroup2">
              <div className="khead"><h2>{KIND_NAME[k]}</h2><span className="khead-r">{rows.length}</span></div>
              <section className="tcard tight" aria-label={KIND_NAME[k]}>
                {rows.map((t) => (
                  <div key={t.id} className={drag?.id === t.id ? 'dragging' : ''} style={drag?.id === t.id ? { transform: `translateY(${drag.dy}px)` } : undefined}>
                    <PlanRow s={s} t={t} today={today} view={view} onEdit={() => edit(t)} onDragStart={onDragStart(t)} />
                  </div>
                ))}
              </section>
            </div>
          )
        })}
      </div>
    </div>
  )
}
