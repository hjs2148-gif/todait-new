import { useState } from 'react'
import { Icon } from './Icon.tsx'
import { addDays, diffDays, fmtDate, fmtDur, todayISO } from './date.ts'
import { isExpired, sumDone, type Task } from './logic.ts'
import { actions, useStore, type State } from './store.ts'
import { Bar, Field, Num, Ring, Sheet } from './ui.tsx'
import { categoryOf, colorOf, dayRate, daySec, itemsOn, pct, progressLabel, targetLabel, type Item } from './view.ts'

export interface Nav {
  date: string
  setDate: (d: string) => void
  editTask: (t: Task | null) => void
  writeDiary: (date: string, taskId: string | null) => void
}

/** 오늘 한 분량 입력 */
export function DoneSheet({ s, item, date, onClose }: { s: State; item: Item; date: string; onClose: () => void }) {
  const { task, expect } = item
  const [done, setDone] = useState<number | null>(item.rec?.done ?? 0)
  const before = sumDone(s.recs[task.id] ?? {}, date)
  const max = task.type === 'amount' ? task.amount - sumDone(s.recs[task.id] ?? {}) + (item.rec?.done ?? 0) : Infinity
  const v = Math.min(done ?? 0, max)
  const bump = (n: number) => setDone(Math.max(0, Math.min(max, (done ?? 0) + n)))
  return (
    <Sheet title={task.name} onClose={onClose}>
      <p className="hint">오늘 목표 {targetLabel(s, item, date)}</p>
      <Field label={`오늘 공부한 분량 (${task.unit || '분량'})`}>
        <Num value={done} onChange={setDone} />
      </Field>
      <div className="chips">
        <button onClick={() => bump(-1)}>−1</button>
        <button onClick={() => bump(1)}>+1</button>
        <button onClick={() => bump(5)}>+5</button>
        <button onClick={() => bump(10)}>+10</button>
        <button onClick={() => setDone(Math.min(expect, max))}>목표만큼</button>
      </div>
      {task.type === 'amount' && task.startPoint !== null && v > 0 && (
        <p className="preview">{task.startPoint + before}~{task.startPoint + before + v - 1}{task.unit}까지 완료</p>
      )}
      {task.type === 'amount' && <p className="hint">전체 {before + v} / {task.amount}{task.unit}</p>}
      <button className="primary" onClick={() => { actions.setDone(task.id, date, v); onClose() }}>저장하기</button>
    </Sheet>
  )
}

function TaskMenu({ s, item, date, nav, onClose, onDone }: { s: State; item: Item; date: string; nav: Nav; onClose: () => void; onDone: () => void }) {
  const { task, rec } = item
  const [mode, setMode] = useState<'menu' | 'custom' | 'time'>('menu')
  const [custom, setCustom] = useState<number | null>(task.custom[date] ?? item.expect)
  const [minutes, setMinutes] = useState<number | null>(Math.round((rec?.sec ?? 0) / 60))
  const hasCustom = task.custom[date] !== undefined
  const act = (fn: () => void) => () => { fn(); onClose() }

  if (mode === 'custom')
    return (
      <Sheet title="분량 변경" onClose={onClose}>
        <p className="hint">{fmtDate(date)}의 목표만 바꿉니다. 나머지 날짜는 자동으로 다시 분배됩니다.</p>
        <Field label={task.type === 'time' ? '목표 시간 (분)' : `목표 분량 (${task.unit || '분량'})`}>
          <Num value={task.type === 'time' && custom !== null ? Math.round(custom / 60) : custom} onChange={(v) => setCustom(v === null ? null : task.type === 'time' ? v * 60 : v)} />
        </Field>
        <button className="primary" disabled={custom === null} onClick={act(() => actions.setCustom(task.id, date, custom!))}>저장하기</button>
      </Sheet>
    )
  if (mode === 'time')
    return (
      <Sheet title="공부 시간 수정" onClose={onClose}>
        <Field label="공부한 시간 (분)"><Num value={minutes} onChange={setMinutes} /></Field>
        <button className="primary" onClick={act(() => actions.setSec(task.id, date, (minutes ?? 0) * 60))}>저장하기</button>
      </Sheet>
    )
  return (
    <Sheet title={task.name} onClose={onClose}>
      <div className="menu">
        {(task.type === 'amount' || task.type === 'daily') && <button onClick={onDone}>분량 입력</button>}
        <button onClick={() => setMode('time')}>공부 시간 수정</button>
        {task.type !== 'check' && <button onClick={() => setMode('custom')}>분량 변경</button>}
        {hasCustom
          ? <button onClick={act(() => actions.setCustom(task.id, date, undefined))}>{task.custom[date] === 0 ? '쉬는 날 취소' : '자동 분배로 되돌리기'}</button>
          : <button onClick={act(() => actions.setCustom(task.id, date, 0))}>쉬는 날로 지정</button>}
        <button onClick={act(() => nav.writeDiary(date, task.id))}>공부일기 쓰기</button>
        <button onClick={act(() => nav.editTask(task))}>계획 수정</button>
        {!task.completed && <button onClick={act(() => actions.patchTask(task.id, { completed: true, completedDate: date }))}>계획 완료</button>}
        <button onClick={act(() => actions.patchTask(task.id, { archived: true }))}>보관하기</button>
        <button className="danger" onClick={act(() => { if (confirm(`'${task.name}' 계획과 기록을 삭제할까요?`)) actions.deleteTask(task.id) })}>삭제하기</button>
      </div>
    </Sheet>
  )
}

function ExtendSheet({ task, onClose }: { task: Task; onClose: () => void }) {
  const [end, setEnd] = useState(addDays(todayISO(), 6))
  return (
    <Sheet title="기간 연장" onClose={onClose}>
      <p className="hint">'{task.name}'의 남은 분량을 새 종료일까지 다시 분배합니다.</p>
      <Field label="새 종료일"><input type="date" min={todayISO()} value={end} onChange={(e) => e.target.value && setEnd(e.target.value)} /></Field>
      <button className="primary" onClick={() => { actions.patchTask(task.id, { endDate: end }); onClose() }}>연장하기</button>
    </Sheet>
  )
}

export function Today({ nav }: { nav: Nav }) {
  const s = useStore()
  const today = todayISO()
  const { date, setDate } = nav
  const { active, resting } = itemsOn(s, date, today)
  const rate = dayRate(active)
  const expired = date === today ? s.tasks.filter((t) => !t.archived && isExpired(t, s.recs[t.id] ?? {}, today)) : []
  const dday = s.ddays.find((d) => d.selected)
  const [menu, setMenu] = useState<string | null>(null)
  const [doneFor, setDoneFor] = useState<string | null>(null)
  const [extend, setExtend] = useState<Task | null>(null)
  const [showResting, setShowResting] = useState(false)
  const find = (id: string | null) => [...active, ...resting].find((i) => i.task.id === id)
  const menuItem = find(menu)
  const doneItem = find(doneFor)

  const ddayLabel = (d: string) => {
    const n = diffDays(today, d)
    return n === 0 ? 'D-DAY' : n > 0 ? `D-${n}` : `D+${-n}`
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="date-nav">
          <button onClick={() => setDate(addDays(date, -1))} aria-label="이전 날"><Icon name="left" /></button>
          <div>
            <strong>{fmtDate(date)}</strong>
            {date !== today && <button className="link" onClick={() => setDate(today)}>오늘로</button>}
          </div>
          <button onClick={() => setDate(addDays(date, 1))} aria-label="다음 날"><Icon name="right" /></button>
        </div>
        <div className="hero-stats">
          <Ring rate={rate ?? 0} label={pct(rate)} />
          <div>
            <small>{date === today ? '오늘 공부한 시간' : '공부한 시간'}</small>
            <div className="big">{fmtDur(daySec(s, date))}</div>
            <small>계획 {active.filter((i) => i.rate >= 1).length} / {active.length} 완료</small>
          </div>
          {dday && (
            <div className="dday">
              <small>{dday.name}</small>
              <div className="big">{ddayLabel(dday.date)}</div>
            </div>
          )}
        </div>
      </header>

      {expired.length > 0 && (
        <section>
          <h3>미완료 계획</h3>
          {expired.map((t) => (
            <div className="card expired" key={t.id}>
              <div className="card-main">
                <strong>{t.name}</strong>
                <small>기간이 끝났습니다 · {t.amount - sumDone(s.recs[t.id] ?? {})}{t.unit} 남음</small>
              </div>
              <button className="chip" onClick={() => setExtend(t)}>기간 연장</button>
              <button className="chip" onClick={() => actions.patchTask(t.id, { completed: true, completedDate: today })}>완료</button>
            </div>
          ))}
        </section>
      )}

      <section>
        <h3>{date === today ? '오늘 계획' : '계획'} <span>{active.length}</span></h3>
        {active.length === 0 && (
          <p className="empty">{s.tasks.length === 0 ? '계획이 없네요!\n아래 + 버튼으로 첫 계획을 만들어보세요.' : '이 날은 계획이 없습니다.'}</p>
        )}
        {active.map((item) => {
          const { task, rec } = item
          const color = colorOf(s, task)
          const running = s.timer?.taskId === task.id
          return (
            <div className={`card${item.rate >= 1 ? ' done' : ''}`} key={task.id} style={{ borderLeftColor: color }}>
              <div className="card-main" onClick={() => setMenu(task.id)}>
                <div className="card-title">
                  <strong>{task.name}</strong>
                  {categoryOf(s, task) && <span className="tag" style={{ color }}>{categoryOf(s, task)!.name}</span>}
                </div>
                <small>
                  {task.custom[date] === 0
                    ? `쉬는 날${rec?.done ? ` · ${rec.done}${task.unit} 함` : ''}`
                    : task.type === 'check' ? '체크 계획' : task.type === 'time' ? progressLabel(item) : `${targetLabel(s, item, date)} · ${progressLabel(item)}`}
                  {task.type !== 'time' && (rec?.sec ?? 0) > 0 && ` · ${fmtDur(rec!.sec)}`}
                  {(task.custom[date] ?? 0) > 0 && ' · 분량 변경됨'}
                </small>
                <Bar rate={item.rate} color={categoryOf(s, task)?.color} />
              </div>
              <div className="card-actions">
                {date <= today && (
                  <button className={`round${running ? ' on' : ''}`} onClick={() => (running ? actions.stopTimer() : actions.startTimer(task.id, date))} aria-label="스톱워치">
                    <Icon name={running ? 'stop' : 'play'} />
                  </button>
                )}
                {date > today ? null : task.type === 'check' ? (
                  <button className={`round check${rec?.checked ? ' on' : ''}`} onClick={() => actions.toggleCheck(task.id, date)} aria-label="체크"><Icon name="check" /></button>
                ) : task.type !== 'time' ? (
                  <button className="round" onClick={() => setDoneFor(task.id)} aria-label="분량 입력"><Icon name="pencil" size={19} /></button>
                ) : null}
              </div>
            </div>
          )
        })}
      </section>

      {resting.length > 0 && (
        <section>
          <h3 onClick={() => setShowResting(!showResting)}>쉬는 계획 <span>{resting.length}</span> <em>{showResting ? '접기' : '펼치기'}</em></h3>
          {showResting && resting.map((item) => (
            <div className="card resting" key={item.task.id} style={{ borderLeftColor: colorOf(s, item.task) }} onClick={() => setMenu(item.task.id)}>
              <div className="card-main">
                <strong>{item.task.name}</strong>
                <small>{item.task.custom[date] === 0 ? '쉬는 날' : '오늘은 계획이 없는 날'}</small>
              </div>
            </div>
          ))}
        </section>
      )}

      <button className="fab" onClick={() => nav.editTask(null)} aria-label="새 계획"><Icon name="plus" size={28} /></button>

      {menuItem && !doneItem && (
        <TaskMenu s={s} item={menuItem} date={date} nav={nav} onClose={() => setMenu(null)} onDone={() => { setDoneFor(menuItem.task.id); setMenu(null) }} />
      )}
      {doneItem && <DoneSheet s={s} item={doneItem} date={date} onClose={() => setDoneFor(null)} />}
      {extend && <ExtendSheet task={extend} onClose={() => setExtend(null)} />}
    </div>
  )
}
