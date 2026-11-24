import { useEffect, useMemo, useRef, useState } from 'react'
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
import { BookCard, KindHead, LectureCard, MiniBar } from './BookCards.tsx'
import { DayEnd } from './DayEnd.tsx'
import { DoneChapterSheet } from './DoneChapter.tsx'
import { BackupCard, DoneDayCard, EmptyCard, NewWeekCard, RestView, RoundCard, roundToday } from './TodayCards.tsx'
import { GuideCard, OverCard, overDays, SuggestCard } from './Guide.tsx'
import { buzz, SwipeRow, Toast, type ToastMsg } from './QuickLog.tsx'
import { StreakBadge } from './Streak.tsx'
import { endedExam, ExamWrap } from './ExamWrap.tsx'
import { ExamEdit } from './ExamEdit.tsx'
import { ReviewLine } from './ReviewTab.tsx'
import { openProgressView } from './Progress.tsx'

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

const KIND_ICON = { book: 'book', lecture: 'lecture', time: 'clock', habit: 'repeat', todo: 'check' } as const
/** 줄 오른쪽 숫자 하나: 남은 양 */
const leftText = ({ task, rec, expect, rate }: Item) => {
  if (rate >= 1) return <>끝</>
  if (task.type === 'check') return <small>할 일</small>
  if (task.type === 'time') return <>{hm(Math.max(0, expect - (rec?.sec ?? 0)))}<small> 남음</small></>
  return <>{Math.max(0, expect - (rec?.done ?? 0))}<small>{task.unit} 남음</small></>
}

/** 행 오른쪽: 한 양 / 목표 */
const amountText = ({ task, rec, expect }: Item) =>
  task.type === 'time' ? `${hm(rec?.sec ?? 0)} / ${hm(expect)}` : task.type === 'check' ? (rec?.checked ? '끝' : '') : `${rec?.done ?? 0} / ${expect}${task.unit}`

function goalText(s: State, { task, rec, expect }: Item, date: string) {
  const recs = s.recs[task.id] ?? {}
  if (task.kind === 'time') return `목표 ${hm(expect)} · ${hm(rec?.sec ?? 0)} 함`
  if (task.type === 'check') return task.kind === 'todo' ? (task.due ? `${MD(task.due)}까지` : '오늘') : '오늘 체크'
  const startAt = task.startPoint !== null && task.type === 'amount' ? task.startPoint + sumDone(recs, date) : null
  const range = startAt !== null && expect > 1 ? `${startAt}~${startAt + expect - 1}${task.unit}` : startAt !== null && expect === 1 ? `${startAt}${task.unit}` : `${expect}${task.unit}`
  return `목표 ${range}${rec?.done ? ` · ${rec.done}${task.unit} 함` : ''}`
}

// ── 전체 탭 ────────────────────────────────────────────────
function AllRows({ s, items, date, today, goTab, onEntry, say }: { s: State; items: Item[]; date: string; today: string; goTab: (k: TaskKind) => void; onEntry: (id: string) => void; say: (text: string, undo?: () => void) => void }) {
  const [showDone, setShowDone] = useState(false)
  const open = items.filter((i) => i.rate < 1)
  const done = items.filter((i) => i.rate >= 1)
  const [openId, setOpenId] = useState<string | null>(null)
  /** 밀어서 기록: 목표만큼 했다고 적고 4초 동안 되돌릴 수 있게 한다 */
  const quick = (i: Item) => {
    const { task, rec, expect } = i
    if (task.type === 'check') {
      actions.toggleCheck(task.id, date)
      buzz()
      say(`${task.name} 끝`, () => actions.toggleCheck(task.id, date))
    } else if (task.type === 'amount') {
      const prev = rec?.done ?? 0
      actions.setDone(task.id, date, Math.max(expect, prev))
      buzz()
      say(`${task.name} ${expect}${task.unit} 기록했어요`, () => actions.setDone(task.id, date, prev))
    }
  }
  const canQuick = (i: Item) => date <= today && i.rate < 1 && ((i.task.type === 'amount' && i.expect > 0) || (i.task.type === 'check' && !i.rec?.checked))
  const row = (i: Item) => {
    const b = date === today ? behindText(s, i.task, today) : ''
    const late = b.includes('밀림') || b.includes('지남')
    const color = colorOf(s, i.task)
    const isOpen = openId === i.task.id
    const toggle = () => setOpenId(isOpen ? null : i.task.id)
    return (
      <div key={i.task.id} className={`prow-w${isOpen ? ' open' : ''}`}>
        <SwipeRow
          right={canQuick(i) ? { label: '다 했어요', run: () => quick(i) } : undefined}
          left={date <= today && i.task.type === 'amount' && i.rate < 1 ? { label: '직접 입력', run: () => onEntry(i.task.id) } : undefined}
        >
        <div className="prow" role="button" tabIndex={0} aria-expanded={isOpen} onClick={toggle} onKeyDown={(e) => e.key === 'Enter' && toggle()}>
          <span className="kind-ic" style={{ background: `color-mix(in srgb, ${color} 18%, var(--sf))`, color }} aria-label={KIND_NAME[i.task.kind]}><Icon name={/문항|문제/.test(i.task.unit) ? 'pencil' : KIND_ICON[i.task.kind]} size={15} /></span>
          <div className="prow-main">
            <div className="prow-1"><span className="prow-name">{i.task.name}{late && <span className="flag">{b.includes('지남') ? '지남' : '밀림'}</span>}</span><b>{leftText(i)}</b></div>
            <div className="track" aria-hidden="true"><div style={{ width: `${pctOf(i.rate)}%`, background: color }} /></div>
          </div>
          <RowAction s={s} item={i} date={date} today={today} onEntry={() => onEntry(i.task.id)} />
        </div>
        </SwipeRow>
        {isOpen && (
          <div className="prow-more">
            <div className="pm-grid">
              <div><small>오늘 목표</small><b>{goalText(s, i, date).replace(/^목표 /, '').replace(/ · .*함$/, '')}</b></div>
              <div><small>했어요</small><b>{amountText(i) || '아직'}</b></div>
              <div><small>밀린 양</small><b>{late ? b.replace(' 밀림', '') : '없음'}</b></div>
            </div>
            {i.task.fitFrom?.[date] !== undefined && <p className="pm-note">가능 시간에 맞춰 오늘 양을 줄였어요</p>}
            <div className="pm-act">
              {canQuick(i) && <button className="chip dark" onClick={() => quick(i)}>{i.task.type === 'check' ? '했어요' : '목표만큼 했어요'}</button>}
              {date <= today && i.task.type === 'amount' && <button className="chip" onClick={() => onEntry(i.task.id)}>직접 입력</button>}
              <button className="chip" onClick={() => goTab(i.task.kind)}>{KIND_NAME[i.task.kind]} 탭에서 자세히</button>
            </div>
          </div>
        )}
      </div>
    )
  }
  return (
    <>
      <div className="sec-h"><h2>오늘 목표 {items.length}개 중 <b>{done.length}개</b> 끝</h2><small>밀린 것부터</small></div>
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
  const [toast, setToast] = useState<ToastMsg | null>(null)
  const say = (text: string, undo?: () => void) => setToast({ id: Date.now(), text, undo })
  const [wrap, setWrap] = useState(false)
  const [newExam, setNewExam] = useState(false)
  const [hideEnd, setHideEnd] = useState(false)
  const ended = date === today && !hideEnd ? endedExam(s, today) : null
  // 계획 하나가 끝나면 짧게 진동
  const doneRef = useRef<number | null>(null)
  useEffect(() => {
    if (date !== today) { doneRef.current = null; return }
    if (doneRef.current !== null && stats.goalsDone > doneRef.current) buzz(20)
    doneRef.current = stats.goalsDone
  }, [stats.goalsDone, date, today])
  const find = (id: string | null) => [...active, ...resting].find((i) => i.task.id === id)
  const menuItem = find(menu)
  const entryItem = find(entry)

  const kindItems = (k: TaskKind) => active.filter((i) => i.task.kind === k)
  const lateTab = (k: TaskKind) => s.tasks.some((t) => t.kind === k && behindOf(s, t, today) > 0 && date === today)
  const upcoming = s.tasks.filter((t) => t.kind === 'todo' && !t.completed && !t.archived && (t.due ?? t.startDate) > today && diffDays(today, t.due ?? t.startDate) <= 7)

  const title = new Date(date.replace(/-/g, '/')).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })
  const ratePct = stats.timeRate === null ? null : Math.round(stats.timeRate * 100)
  const isRest = date in s.settings.restDays
  // 탭 줄이 화면 위에 붙었는지 (붙었을 때만 날짜·진행 줄을 보인다)
  const stickRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const onScroll = () => { const el = stickRef.current; if (el) setStuck(el.getBoundingClientRect().top <= 0.5 && window.scrollY > 0) }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isRest])
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
          {active.length > 0 && <AllRows s={s} items={active} date={date} today={today} goTab={setTab} onEntry={setEntry} say={say} />}
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
    const avg = list.length ? list.reduce((a, i) => a + i.rate, 0) / list.length : 0
    const doneN = list.filter((i) => i.rate >= 1).length
    const head = <KindHead kind={tab} count={list.length} right={tab === 'habit' || tab === 'todo' ? <><b>{doneN} / {list.length}</b> 끝</> : <MiniBar rate={avg} />} />
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
          <button className="chip" onClick={nav.editWidgets}>편집</button>
          <button className="sq ink" onClick={() => nav.editTask(null)} aria-label="새 계획"><Icon name="plus" size={18} /></button>
        </div>
      </header>

      {date === today && !isRest && <div className="th-s"><StreakBadge s={s} today={today} /></div>}

      <div className="wd-wrap">
        {ended && (
          <section className="tcard weekcard" role="region" aria-label="시험 끝">
            <div className="tc-meta"><b className="big16">시험이 끝났어요</b></div>
            <p className="sm mu">{ended.name} 수고했어요. 점수를 적고 끝난 계획을 정리해요.</p>
            <div className="two"><button className="chip dark" onClick={() => setWrap(true)}>정리하기</button><button className="chip" onClick={() => setHideEnd(true)}>나중에</button></div>
          </section>
        )}
        {date === today && <BackupCard s={s} today={today} />}
        {date === today && <GuideSlot s={s} today={today} />}
        {date === today && dow(today) === 1 && s.settings.weekCardSeen !== today && !isRest && <NewWeekCard s={s} today={today} goProgress={nav.goProgress} />}
        {allDone && !isRest && <DoneDayCard s={s} today={today} stats={stats} openDayEnd={() => setDayEnd(true)} tomorrow={() => setDate(addDays(today, 1))} />}
        {!isRest && <Widgets s={s} date={date} today={today} stats={stats} />}
        {date === today && !isRest && <ReviewLine s={s} today={today} go={() => { openProgressView('review'); nav.goProgress() }} />}
      </div>

      {isRest && <div className="tbody"><RestView s={s} date={date} today={today} /></div>}

      {!isRest && <div ref={stickRef} className={`sticky-bar${stuck ? ' stuck' : ''}`}>
        <div className="sb-1" aria-hidden={!stuck}><b>{new Date(date.replace(/-/g, '/')).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</b>
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
      {wrap && ended && <ExamWrap s={s} exam={ended} today={today} onClose={() => setWrap(false)} onNext={() => setNewExam(true)} />}
      {newExam && <ExamEdit examId={null} onClose={() => setNewExam(false)} />}
      <Toast t={toast} onClose={() => setToast(null)} />
    </div>
  )
}


/** 안내 카드는 한 번에 한 장: 넘치는 날 → 회독 → 필요할 때 제안 */
function GuideSlot({ s, today }: { s: State; today: string }) {
  const [done, setDone] = useState<string | null>(null)
  const over = useMemo(() => (s.settings.overSnooze === today ? [] : overDays(s, today, 14)), [s, today])
  if (done) return <GuideCard lab="정리됐어요" head={done}><button className="g-s" onClick={() => setDone(null)}>닫기</button></GuideCard>
  if (over.length) return <OverCard s={s} today={today} list={over} onDone={setDone} />
  if (roundToday(s, today)) return <RoundCard s={s} today={today} />
  return <SuggestCard s={s} today={today} />
}
