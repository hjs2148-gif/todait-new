import { useState } from 'react'
import { Catchup } from './TodayCatchup.tsx'
import { EntrySheet } from './Entry.tsx'
import { Icon } from './Icon.tsx'
import { addDays, diffDays, dow, fmtDate, fmtDur, todayISO } from './date.ts'
import { isExpired, sumDone, type Task, type TaskKind } from './logic.ts'
import { actions, useStore, type State } from './store.ts'
import { behindOf, dayStats, habitDays, hm, KIND_TABS, KIND_NAME } from './todayData.ts'
import { Field, Num, Sheet } from './ui.tsx'
import { colorOf, type Item } from './view.ts'
import { Widgets } from './widgets.tsx'
import { DayEnd } from './DayEnd.tsx'
import { DoneChapterSheet } from './DoneChapter.tsx'
import { BackupCard, DoneDayCard, EmptyCard, NewWeekCard, RestView } from './TodayCards.tsx'

export interface Nav {
  date: string
  setDate: (d: string) => void
  editTask: (t: Task | null) => void
  writeDiary: (date: string, taskId: string | null) => void
  editWidgets: () => void
  goProgress: () => void
}

const MD = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}.${Number(d)}` }
const pctOf = (r: number) => Math.round(r * 100)

function TaskMenu({ s, item, date, nav, onClose, onEntry }: { s: State; item: Item; date: string; nav: Nav; onClose: () => void; onEntry: () => void }) {
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
        {(task.type === 'amount' || task.type === 'daily') && <button onClick={onEntry}>분량 입력</button>}
        <button onClick={() => setMode('time')}>공부 시간 수정</button>
        {task.type !== 'check' && <button onClick={() => setMode('custom')}>분량 변경</button>}
        {hasCustom
          ? <button onClick={act(() => actions.setCustom(task.id, date, undefined))}>{task.custom[date] === 0 ? '쉬는 날 취소' : '자동 분배로 되돌리기'}</button>
          : <button onClick={act(() => actions.setCustom(task.id, date, 0))}>쉬는 날로 지정</button>}
        <button onClick={act(() => nav.writeDiary(date, task.id))}>공부일기 쓰기</button>
        <button onClick={act(() => nav.editTask(task))}>계획 수정</button>
        {!task.completed && <button onClick={act(() => actions.patchTask(task.id, { completed: true, completedDate: date }))}>계획 완료</button>}
        <button onClick={act(() => actions.pauseTask(task.id, date))}>잠깐 멈추기</button>
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

/** 행 오른쪽 버튼: ▶ (책·인강·시간), 체크 (습관·할 일), 분량 입력 (매일 분량 습관) */
export function RowAction({ s, item, date, today, onEntry }: { s: State; item: Item; date: string; today: string; onEntry: () => void }) {
  const { task, rec } = item
  if (date > today) return null
  const running = s.timer?.taskId === task.id
  const start = () => {
    if (running) return actions.stopTimer()
    if (s.timer) actions.stopTimer()
    actions.startTimer(task.id, date)
  }
  if (task.kind === 'habit' || task.kind === 'todo')
    return task.type === 'check'
      ? <button className={`tick${rec?.checked ? ' on' : ''}`} role="checkbox" aria-checked={!!rec?.checked} aria-label={`${task.name} 체크`} onClick={(e) => { e.stopPropagation(); actions.toggleCheck(task.id, date) }}>{rec?.checked && <Icon name="check" size={14} />}</button>
      : <button className="round" onClick={(e) => { e.stopPropagation(); onEntry() }} aria-label="분량 입력"><Icon name="pencil" size={18} /></button>
  return (
    <button className={`round play${running ? ' on' : ''}`} onClick={(e) => { e.stopPropagation(); start() }} aria-label={running ? `${task.name} 멈추기` : `${task.name} 시작`}>
      <Icon name={running ? 'stop' : 'play'} size={18} />
    </button>
  )
}

function behindText(s: State, task: Task, today: string) {
  const b = behindOf(s, task, today)
  return b > 0 ? (task.kind === 'todo' ? '마감 지남' : `${b}${task.unit} 밀림`) : task.type === 'amount' ? '예정대로' : ''
}

function goalText(s: State, { task, rec, expect }: Item, date: string) {
  const recs = s.recs[task.id] ?? {}
  if (task.kind === 'time') return `목표 ${hm(expect)} · ${hm(rec?.sec ?? 0)} 함`
  if (task.type === 'check') return task.kind === 'todo' ? (task.due ? `${MD(task.due)}까지` : '오늘') : '오늘 체크'
  const startAt = task.startPoint !== null && task.type === 'amount' ? task.startPoint + sumDone(recs, date) : null
  const range = startAt !== null && expect > 0 ? `${startAt}~${startAt + expect - 1}${task.unit}` : `${expect}${task.unit}`
  return `목표 ${range}${rec?.done ? ` · ${rec.done}${task.unit} 함` : ''}`
}

// ── 전체 탭 ────────────────────────────────────────────────
function AllRows({ s, items, date, today, goTab, onEntry }: { s: State; items: Item[]; date: string; today: string; goTab: (k: TaskKind) => void; onEntry: (id: string) => void }) {
  const [showDone, setShowDone] = useState(false)
  const open = items.filter((i) => i.rate < 1)
  const done = items.filter((i) => i.rate >= 1)
  const row = (i: Item) => {
    const b = date === today ? behindText(s, i.task, today) : ''
    return (
      <div key={i.task.id} className="prow" role="button" tabIndex={0} onClick={() => goTab(i.task.kind)} onKeyDown={(e) => e.key === 'Enter' && goTab(i.task.kind)}>
        <div className="prow-main">
          <div className="prow-1"><i className="dot" style={{ background: colorOf(s, i.task) }} /><span className="prow-name">{i.task.name}</span><b>{pctOf(i.rate)}<small>%</small></b></div>
          <div className="prow-2">{goalText(s, i, date)}{b && <> · <span className={b.includes('밀림') || b.includes('지남') ? 'strong' : ''}>{b}</span></>}</div>
          <div className="track" aria-hidden="true"><div style={{ width: `${pctOf(i.rate)}%`, background: colorOf(s, i.task) }} /></div>
        </div>
        <RowAction s={s} item={i} date={date} today={today} onEntry={() => onEntry(i.task.id)} />
      </div>
    )
  }
  return (
    <>
      <div className="sec-h"><h2>오늘 목표 {items.length}개 중 <b>{done.length}개</b> 끝</h2></div>
      <section className="plist">{open.map(row)}{open.length === 0 && items.length > 0 && <p className="empty tight">목표를 모두 채웠어요</p>}</section>
      {done.length > 0 && (
        <>
          <button className="fold" aria-expanded={showDone} onClick={() => setShowDone(!showDone)}>끝낸 것 {done.length}개 · {done.map((i) => i.task.name).slice(0, 2).join(', ')}{done.length > 2 ? ' …' : ''}</button>
          {showDone && <section className="plist">{done.map(row)}</section>}
        </>
      )}
    </>
  )
}

// ── 유형 탭 카드 ───────────────────────────────────────────
function CardHead({ s, item, right, onMenu }: { s: State; item: Item; right: string; onMenu: () => void }) {
  return (
    <div className="ch">
      <i className="dot" style={{ background: colorOf(s, item.task) }} />
      <b className="ch-name">{item.task.name}</b>
      <span className="ch-r">{right}</span>
      <button className="more" aria-label={`${item.task.name} 메뉴`} onClick={onMenu}><Icon name="more" size={18} /></button>
    </div>
  )
}

function BookCard({ s, item, date, today, onEntry, onMenu }: { s: State; item: Item; date: string; today: string; onEntry: () => void; onMenu: () => void }) {
  const { task, rec, expect } = item
  const recs = s.recs[task.id] ?? {}
  const color = colorOf(s, task)
  const before = sumDone(recs, date)
  const doneAll = sumDone(recs)
  const start = task.startPoint ?? 1
  const from = start + before
  const to = from + Math.max(expect, 1) - 1
  const posNow = start + doneAll - 1
  let past = 0
  for (const d in recs) if (d < today) past += recs[d].expect ?? 0
  const planned = Math.min(past / Math.max(task.amount, 1), 1)
  const circles = task.bookMode === 'workbook' && task.amount <= 40
  const showCells = task.startPoint !== null && !circles && expect > 0 && expect <= 14
  const chapters = task.chapters ?? []
  const b = behindText(s, task, today)
  return (
    <section className="tcard" aria-label={task.name}>
      <CardHead s={s} item={item} right={`${pctOf(item.rate)}%`} onMenu={onMenu} />
      <div className="tc-sub">{goalText(s, item, date)}{b && date === today && <> · <span className={b.includes('밀림') ? 'strong' : ''}>{b}</span></>}</div>
      {showCells && (
        <div className="cells ro" role="img" aria-label={`오늘 ${from}~${to}쪽 중 ${rec?.done ?? 0}쪽 함`}>
          {Array.from({ length: to - from + 1 }, (_, i) => from + i).map((n) => <span key={n} className={n < from + (rec?.done ?? 0) ? 'on' : ''} style={n < from + (rec?.done ?? 0) ? { background: color } : undefined}>{n}</span>)}
          <span className="rib" style={{ left: `${Math.min((rec?.done ?? 0) / (to - from + 1), 1) * 100}%` }} aria-hidden="true" />
        </div>
      )}
      {circles && (
        <div className="qs" role="img" aria-label={`전체 ${task.amount}문항 중 ${doneAll}문항`}>
          {Array.from({ length: task.amount }, (_, i) => <i key={i} className={i < doneAll ? 'on' : ''} style={i < doneAll ? { background: color } : undefined} />)}
        </div>
      )}
      <div className="cbar" role="img" aria-label={`전체 ${task.amount}${task.unit} 중 ${doneAll}${task.unit}`}>
        {chapters.length > 0 ? chapters.map((c) => {
          const len = c.to - c.from + 1
          const f = Math.max(0, Math.min(1, (posNow - c.from + 1) / len))
          return <span key={c.id} style={{ flexGrow: len }}><span style={{ width: `${f * 100}%`, background: color }} /></span>
        }) : <span style={{ flexGrow: 1 }}><span style={{ width: `${Math.min(doneAll / task.amount, 1) * 100}%`, background: color }} /></span>}
        <i className="tick-exp" style={{ left: `${planned * 100}%` }} aria-hidden="true" />
      </div>
      <div className="tc-meta"><span>{doneAll} / {task.amount}{task.unit}</span><span>{task.endDate ? `${MD(task.endDate)} 끝 예정` : ''}</span></div>
      {chapters.length > 0 && (
        <ul className="chlist">
          {chapters.map((c, i) => {
            const cur = !c.doneDate && posNow >= c.from - 1 && posNow < c.to
            const done = c.doneDate !== undefined
            const grade = c.grade === 'high' ? '상' : c.grade === 'mid' ? '중' : c.grade === 'low' ? '하' : ''
            return (
              <li key={c.id} className={cur ? 'cur' : ''}>
                <span className={`cn${done ? ' on' : ''}${cur ? ' now' : ''}`} style={done ? { background: color } : cur ? { background: `conic-gradient(${color} 0 ${Math.round(((posNow - c.from + 1) / (c.to - c.from + 1)) * 100)}%, var(--trk) 0)` } : undefined}>{done && <Icon name="check" size={12} />}</span>
                <span className="cl-name"><small>{i + 1}</small> {c.name}</span>
                <span className="cl-meta">{done ? `${MD(c.doneDate!)} 끝${grade ? ` · 이해 ${grade}` : ''}` : cur ? `${posNow - c.from + 1} / ${c.to - c.from + 1}${task.unit}` : `${c.from}~${c.to}${task.unit}`}</span>
              </li>
            )
          })}
        </ul>
      )}
      <div className="tc-actions">
        <RowAction s={s} item={item} date={date} today={today} onEntry={onEntry} />
        <button className="chip" onClick={onEntry}>분량 입력</button>
      </div>
    </section>
  )
}

function LectureCard({ s, item, date, today, onEntry, onMenu }: { s: State; item: Item; date: string; today: string; onEntry: () => void; onMenu: () => void }) {
  const { task, expect } = item
  const recs = s.recs[task.id] ?? {}
  const color = colorOf(s, task)
  const doneAll = sumDone(recs)
  const before = sumDone(recs, date)
  const lectures = task.lectures ?? Array.from({ length: task.amount }, (_, i) => ({ title: `${(task.startPoint ?? 1) + i}${task.unit || '강'}`, min: null }))
  const b = behindText(s, task, today)
  const around = lectures.slice(Math.max(doneAll - 1, 0), Math.max(doneAll - 1, 0) + 5)
  const first = Math.max(doneAll - 1, 0)
  return (
    <section className="tcard" aria-label={task.name}>
      <CardHead s={s} item={item} right={`${doneAll} / ${task.amount}${task.unit || '강'}`} onMenu={onMenu} />
      <div className="tc-sub">{goalText(s, item, date)}{b && date === today && <> · <span className={b.includes('밀림') ? 'strong' : ''}>{b}</span></>}</div>
      <div className="cbar thick" role="img" aria-label={`${task.amount}강 중 ${doneAll}강 끝`}><span style={{ flexGrow: 1 }}><span style={{ width: `${Math.min(doneAll / task.amount, 1) * 100}%`, background: color }} /></span></div>
      {task.amount <= 60 && (
        <div className="lec" role="img" aria-label="강의 칸">
          {lectures.map((_, i) => <i key={i} className={i < doneAll ? 'on' : ''} style={{ ...(i < doneAll ? { background: color } : {}), ...(i >= before && i < before + expect ? { boxShadow: `inset 0 0 0 2px ${color}` } : {}) }} />)}
        </div>
      )}
      <ul className="chlist">
        {around.map((l, i) => {
          const idx = first + i
          const done = idx < doneAll
          const cur = idx === doneAll
          return (
            <li key={idx} className={cur ? 'cur' : ''}>
              <span className={`cn${done ? ' on' : ''}${cur ? ' now' : ''}`} style={done ? { background: color } : undefined}>{done && <Icon name="check" size={12} />}</span>
              <span className="cl-name"><small>{idx + 1}</small> {l.title}</span>
              <span className="cl-meta">{done ? '끝' : cur ? '진행 중' : '예정'}</span>
            </li>
          )
        })}
      </ul>
      <div className="tc-actions"><RowAction s={s} item={item} date={date} today={today} onEntry={onEntry} /><button className="chip" onClick={onEntry}>강의 입력</button></div>
    </section>
  )
}

function TimeCard({ s, item, date, today, onMenu }: { s: State; item: Item; date: string; today: string; onMenu: () => void }) {
  const { task, rec, expect } = item
  const color = colorOf(s, task)
  const sec = rec?.sec ?? 0
  const n = Math.min(Math.max(Math.ceil(expect / 600), 1), 18)
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(date, i - 6)
    return { d, sec: s.recs[task.id]?.[d]?.sec ?? 0, goal: s.recs[task.id]?.[d]?.expect ?? (d === date ? expect : 0) }
  })
  const max = Math.max(expect, ...week.map((w) => w.sec), 1)
  const hit = week.filter((w) => w.goal > 0 && w.sec >= w.goal).length
  const left = Math.max(expect - sec, 0)
  return (
    <>
      <section className="tcard" aria-label={task.name}>
        <CardHead s={s} item={item} right={left > 0 ? `${Math.ceil(left / 60)}분 남음` : '목표 달성'} onMenu={onMenu} />
        <div className="tc-sub">목표 {hm(expect)} · 오늘 <b>{hm(sec)}</b></div>
        <div className="blocks big" role="img" aria-label={`10분 칸 ${n}개 중 ${(sec / 600).toFixed(1)}칸`}>
          {Array.from({ length: n }, (_, i) => <span key={i}><span style={{ width: `${Math.max(0, Math.min(100, (sec / 600 - i) * 100))}%`, background: color }} /></span>)}
        </div>
        <div className="tc-actions"><RowAction s={s} item={item} date={date} today={today} onEntry={() => {}} /></div>
      </section>
      <section className="tcard" aria-label="최근 7일">
        <div className="tc-meta"><b>최근 7일 · {task.name}</b><span>목표 {hm(expect)}</span></div>
        <div className="wbars" role="img" aria-label={`최근 7일 중 목표 달성 ${hit}일`}>
          <span className="goal" style={{ bottom: `${(Math.min(expect, max) / max) * 100}%` }} />
          {week.map((w) => <i key={w.d} style={{ height: `${Math.max((w.sec / max) * 100, w.sec > 0 ? 4 : 1)}%`, background: w.goal > 0 && w.sec >= w.goal ? color : `color-mix(in srgb, ${color} 45%, var(--trk))` }} />)}
        </div>
        <div className="wlab">{week.map((w) => <span key={w.d} className={w.d === date ? 'on' : ''}>{['일', '월', '화', '수', '목', '금', '토'][new Date(w.d.replace(/-/g, '/')).getDay()]}</span>)}</div>
        <div className="tc-meta"><span>목표를 채운 날 <b>{hit}일</b> / 7일</span></div>
      </section>
    </>
  )
}

function HabitCard({ s, items, date, today, onEntry }: { s: State; items: Item[]; date: string; today: string; onEntry: (id: string) => void }) {
  const doneN = items.filter((i) => i.rate >= 1).length
  return (
    <section className="tcard tight" aria-label="습관">
      <div className="tc-meta pad"><b>{doneN} / {items.length} 끝</b></div>
      {items.map((i) => {
        const h = habitDays(s, i.task, date, 16)
        const color = colorOf(s, i.task)
        return (
          <div key={i.task.id} className="habit">
            <div className="habit-1"><RowAction s={s} item={i} date={date} today={today} onEntry={() => onEntry(i.task.id)} /><span className="grow">{i.task.name}</span><small>연속 <b>{h.streak}일</b></small></div>
            <div className="hgrid" role="img" aria-label={`${h.span}일 중 ${h.doneCount}일`}>{h.days.map((d) => <i key={d.date} style={d.done ? { background: color } : undefined} />)}</div>
            <div className="hlab"><span>{MD(h.days[0].date)}</span><span>{h.span}일 중 {h.doneCount}일</span><span>오늘</span></div>
          </div>
        )
      })}
    </section>
  )
}

function TodoCard({ s, items, date, today, upcoming }: { s: State; items: Item[]; date: string; today: string; upcoming: Task[] }) {
  return (
    <>
      <section className="tcard tight" aria-label="할 일">
        <div className="tc-meta pad"><b>{items.filter((i) => i.rate >= 1).length} / {items.length} 끝</b></div>
        {items.map((i) => (
          <div key={i.task.id} className="todo">
            <RowAction s={s} item={i} date={date} today={today} onEntry={() => {}} />
            <span className={`grow${i.rate >= 1 ? ' done' : ''}`}>{i.task.name}</span>
            {i.task.due && i.rate < 1 && <small className={i.task.due <= today ? 'strong' : ''}>{i.task.due === today ? '오늘까지' : `${MD(i.task.due)}까지`}</small>}
          </div>
        ))}
      </section>
      <div className="sec-h"><h2>다가오는 할 일</h2><small>이번 주</small></div>
      <section className="tcard tight">
        {upcoming.length === 0 && <p className="empty tight">이번 주에 예정된 할 일이 없어요</p>}
        {upcoming.map((t) => {
          const n = diffDays(today, t.due ?? t.startDate)
          return <div key={t.id} className="todo"><span className="tick" /><span className="grow"><b>{t.name}</b><small className="blk">{fmtDate(t.due ?? t.startDate)}</small></span><small>D-{n}</small></div>
        })}
      </section>
    </>
  )
}

// ── 오늘 탭 ────────────────────────────────────────────────
export function Today({ nav }: { nav: Nav }) {
  const s = useStore()
  const today = todayISO()
  const { date, setDate } = nav
  const stats = dayStats(s, date, today)
  const { active, resting } = stats
  const tab = s.settings.todayTab
  const setTab = (t: typeof tab) => actions.setSettings({ todayTab: t })
  const expired = date === today ? s.tasks.filter((t) => !t.archived && isExpired(t, s.recs[t.id] ?? {}, today)) : []
  const [menu, setMenu] = useState<string | null>(null)
  const [entry, setEntry] = useState<string | null>(null)
  const [extend, setExtend] = useState<Task | null>(null)
  const [dayEnd, setDayEnd] = useState(false)
  const [chapterDone, setChapterDone] = useState<{ taskId: string; chapterId: string } | null>(null)
  const [showResting, setShowResting] = useState(false)
  const find = (id: string | null) => [...active, ...resting].find((i) => i.task.id === id)
  const menuItem = find(menu)
  const entryItem = find(entry)

  const kindItems = (k: TaskKind) => active.filter((i) => i.task.kind === k)
  const lateTab = (k: TaskKind) => s.tasks.some((t) => t.kind === k && behindOf(s, t, today) > 0 && date === today)
  const upcoming = s.tasks.filter((t) => t.kind === 'todo' && !t.completed && !t.archived && (t.due ?? t.startDate) > today && diffDays(today, t.due ?? t.startDate) <= 7)

  const title = new Date(date.replace(/-/g, '/')).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
  const ratePct = stats.timeRate === null ? null : Math.round(stats.timeRate * 100)
  const isRest = date in s.settings.restDays
  const allDone = date === today && stats.goalsTotal > 0 && stats.goalsDone === stats.goalsTotal

  const body = () => {
    if (tab === 'all')
      return (
        <>
          {expired.length > 0 && (
            <section className="tcard">
              <div className="tc-meta"><b>기간이 끝난 계획</b></div>
              {expired.map((t) => (
                <div key={t.id} className="exp"><span className="grow"><b>{t.name}</b><small className="blk">{t.amount - sumDone(s.recs[t.id] ?? {})}{t.unit} 남음</small></span>
                  <button className="chip" onClick={() => setExtend(t)}>기간 연장</button>
                  <button className="chip" onClick={() => actions.patchTask(t.id, { completed: true, completedDate: today })}>완료</button></div>
              ))}
            </section>
          )}
          {s.tasks.length === 0 && <EmptyCard newPlan={() => nav.editTask(null)} />}
          {s.tasks.length > 0 && active.length === 0 && <p className="empty">이 날은 계획이 없습니다.</p>}
          {active.length > 0 && <AllRows s={s} items={active} date={date} today={today} goTab={setTab} onEntry={setEntry} />}
          {resting.length > 0 && (
            <>
              <button className="fold" aria-expanded={showResting} onClick={() => setShowResting(!showResting)}>쉬는 계획 {resting.length}개 · {showResting ? '접기' : '펼치기'}</button>
              {showResting && resting.map((i) => (
                <div key={i.task.id} className="prow rest" role="button" tabIndex={0} onClick={() => setMenu(i.task.id)}>
                  <div className="prow-main"><div className="prow-1"><i className="dot" style={{ background: colorOf(s, i.task) }} /><span className="prow-name">{i.task.name}</span></div><div className="prow-2">{i.task.custom[date] === 0 ? '쉬는 날' : '오늘은 계획이 없는 날'}</div></div>
                </div>
              ))}
            </>
          )}
        </>
      )
    const list = kindItems(tab)
    const head = (
      <div className="sec-h"><h2>{KIND_NAME[tab]} <small>{list.length}</small></h2></div>
    )
    if (list.length === 0) return <>{head}<p className="empty">{KIND_NAME[tab]} 계획이 오늘은 없어요</p></>
    const common = { s, date, today }
    return (
      <>
        {head}
        {tab === 'book' && list.map((i) => <BookCard key={i.task.id} {...common} item={i} onEntry={() => setEntry(i.task.id)} onMenu={() => setMenu(i.task.id)} />)}
        {tab === 'lecture' && list.map((i) => <LectureCard key={i.task.id} {...common} item={i} onEntry={() => setEntry(i.task.id)} onMenu={() => setMenu(i.task.id)} />)}
        {tab === 'time' && list.map((i) => <TimeCard key={i.task.id} {...common} item={i} onMenu={() => setMenu(i.task.id)} />)}
        {tab === 'habit' && <HabitCard {...common} items={list} onEntry={setEntry} />}
        {tab === 'todo' && <TodoCard {...common} items={list} upcoming={upcoming} />}
      </>
    )
  }

  return (
    <div className="page today">
      <header className="th">
        <h1>{title}</h1>
        <div className="th-r">
          {date !== today && <button className="chip" onClick={() => setDate(today)}>오늘로</button>}
          {isRest && <><button className="sq" onClick={() => setDate(addDays(date, -1))} aria-label="이전 날"><Icon name="left" size={18} /></button><button className="sq" onClick={() => setDate(addDays(date, 1))} aria-label="다음 날"><Icon name="right" size={18} /></button></>}
          <button className="chip" onClick={nav.editWidgets}>편집</button>
          <button className="sq ink" onClick={() => nav.editTask(null)} aria-label="새 계획"><Icon name="plus" size={18} /></button>
        </div>
      </header>

      <div className="wd-wrap">
        {date === today && <BackupCard s={s} today={today} />}
        {date === today && dow(today) === 1 && s.settings.weekCardSeen !== today && !isRest && <NewWeekCard s={s} today={today} goProgress={nav.goProgress} />}
        {allDone && !isRest && <DoneDayCard s={s} today={today} stats={stats} openDayEnd={() => setDayEnd(true)} tomorrow={() => setDate(addDays(today, 1))} />}
        {!isRest && <Widgets s={s} date={date} today={today} stats={stats} />}
      </div>

      {isRest && <div className="tbody"><RestView s={s} date={date} today={today} /></div>}

      {!isRest && <div className="sticky-bar">
        <div className="sb-1"><span className="sb-d"><button className="sq sm" onClick={() => setDate(addDays(date, -1))} aria-label="이전 날"><Icon name="left" size={16} /></button><b>{new Date(date.replace(/-/g, '/')).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</b><button className="sq sm" onClick={() => setDate(addDays(date, 1))} aria-label="다음 날"><Icon name="right" size={16} /></button></span>
          <span>{stats.target > 0 ? `${date === today ? '오늘' : '그날'} ${hm(stats.sec)} / ${hm(stats.target)}${ratePct === null ? '' : ` · ${ratePct}%`}` : `공부 ${fmtDur(stats.sec)}`}</span></div>
        <div role="tablist" aria-label="계획 유형" className="segs">
          {KIND_TABS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
              {label}{k !== 'all' && lateTab(k) && <span className="late" aria-label="밀린 계획 있음" />}
            </button>
          ))}
        </div>
      </div>}
      {!isRest && <div className="tbody">{body()}</div>}

      <Catchup s={s} date={date} today={today} />
      {menuItem && !entryItem && <TaskMenu s={s} item={menuItem} date={date} nav={nav} onClose={() => setMenu(null)} onEntry={() => { setEntry(menuItem.task.id); setMenu(null) }} />}
      {entryItem && <EntrySheet s={s} item={entryItem} date={date} onClose={() => setEntry(null)} onFinish={(taskId, chapterId) => setChapterDone({ taskId, chapterId })} />}
      {chapterDone && <DoneChapterSheet taskId={chapterDone.taskId} chapterId={chapterDone.chapterId} onClose={() => setChapterDone(null)} />}
      {dayEnd && <DayEnd date={date} today={today} onClose={() => setDayEnd(false)} goTomorrow={() => { setDayEnd(false); setDate(addDays(today, 1)) }} />}
      {extend && <ExtendSheet task={extend} onClose={() => setExtend(null)} />}
    </div>
  )
}

