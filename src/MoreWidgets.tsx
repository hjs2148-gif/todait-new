// 예전 위젯 10종을 칸 격자 디자인으로 다시 만들고, 누르면 자세히 시트. 그리고 스마트 스택.
import { useEffect, useRef, useState } from 'react'
import { addDays, diffDays, dow } from './date.ts'
import { examFor } from './Guide.tsx'
import { Bar, clockWord, mdKo, Sessions, startTimer, Tile } from './LearnWidgets.tsx'
import { examProgress } from './progress.ts'
import { dayGoals, goalTotals } from './stats.ts'
import { STACK_DEFAULT, WIDGET_SIZES, type State, type WidgetId, type WidgetSize, type WidgetSlot } from './store.ts'
import { finishClock, hm, recentSecs, streakInfo, subjectSecs, type DayStats } from './todayData.ts'
import { colorOf, daySec, itemsOn } from './view.ts'
import { WSec, WSheet } from './WSheet.tsx'

const DOW = ['일', '월', '화', '수', '목', '금', '토']
const useOpen = () => { const [o, setO] = useState(false); return [o, () => setO(true), () => setO(false)] as const }

// ── 오늘 공부 시간 ──
export function TimeWidget({ s, size, date, stats }: { s: State; size: WidgetSize; date: string; stats: DayStats }) {
  const [open, show, hide] = useOpen()
  const subs = subjectSecs(s, date)
  const total = subs.reduce((a, x) => a + x.sec, 0)
  const pct = stats.target ? Math.round((stats.sec / stats.target) * 100) : null
  const rows = (n: number) => subs.slice(0, n).map((x) => <div key={x.name} className="t-row"><span className="t-dot" style={{ background: x.color }} /><span className="t-nm">{x.name}</span><Bar p={total ? x.sec / total : 0} color={x.color} w={size === 's2' ? 56 : 120} /><span className="t-v" style={{ width: 40 }}>{hm(x.sec)}</span></div>)
  return (
    <>
      <Tile size={size} icon="time" label="오늘 공부 시간" onOpen={show}>
        {size === 's1' && <><span className="t-num">{hm(stats.sec)}</span><div className="t-split">{subs.map((x) => <i key={x.name} style={{ flexGrow: x.sec, background: x.color }} />)}{!total && <i style={{ flexGrow: 1 }} />}</div><span className="t-sub">{pct === null ? '목표 시간 없음' : <>목표의 <b>{pct}%</b> · {hm(stats.target)}</>}</span></>}
        {size === 's2' && <div className="t-cols"><div className="l"><span className="t-num">{hm(stats.sec)}</span><span className="t-sub">{pct === null ? '목표 시간 없음' : <>목표 {hm(stats.target)}<br />의 <b>{pct}%</b></>}</span></div><div className="r">{total ? rows(4) : <span className="t-sm">공부하면 과목별로 보여요</span>}</div></div>}
      </Tile>
      {open && (
        <WSheet icon="time" title="오늘 공부 시간" onClose={hide} big={hm(stats.sec)} sub={pct === null ? '시간으로 잴 계획이 없어요' : <>목표 {hm(stats.target)}의 <b>{pct}%</b></>}>
          <WSec title="공부한 때"><Sessions s={s} date={date} big /></WSec>
          {total > 0 && <WSec title="과목별"><div className="t-list in-sheet">{rows(subs.length)}</div></WSec>}
        </WSheet>
      )}
    </>
  )
}

// ── 남은 공부 ──
export function LeftWidget2({ s, size, date, today, stats }: { s: State; size: WidgetSize; date: string; today: string; stats: DayStats }) {
  const [open, show, hide] = useOpen()
  const end = date === today && stats.remain > 0 ? clockWord(finishClock(stats.remain)) : null
  const left = stats.active.filter((i) => i.rate < 1 && i.expect > 0)
  return (
    <>
      <Tile size={size} icon="left" label="남은 공부" onOpen={show}>
        <span className="t-num">{stats.target ? hm(stats.remain) : '—'}</span>
        <span className="t-sub">{!stats.target ? '시간으로 잴 계획이 없어요' : stats.remain === 0 ? '다 했어요' : end ? <>이대로면<br /><b>{end}</b> 끝</> : `${left.length}개 남음`}</span>
      </Tile>
      {open && (
        <WSheet icon="left" title="남은 공부" onClose={hide} big={stats.target ? hm(stats.remain) : '—'} sub={end ? <>지금 시작하면 <b>{end}</b>에 끝나요</> : undefined}>
          <WSec title="남은 계획" right={`${left.length}개`}><div className="t-list in-sheet">{left.length ? left.map((i) => (
            <div key={i.task.id} className="t-row tall"><span className="t-dot" style={{ background: colorOf(s, i.task) }} /><span className="t-nm"><b>{i.task.name}</b><small>{i.task.type === 'time' ? `${hm(Math.max(0, i.expect - (i.rec?.sec ?? 0)))} 남음` : `${Math.max(0, i.expect - (i.rec?.done ?? 0))}${i.task.unit} 남음`}</small></span>
              {date === today && <button className="chip" onClick={() => { startTimer(s, i.task, today); hide() }}>시작</button>}</div>
          )) : <p className="ws-note">오늘은 다 했어요.</p>}</div></WSec>
        </WSheet>
      )}
    </>
  )
}

// ── 시험 진도 ──
export function ExamWidget2({ s, size, today }: { s: State; size: WidgetSize; today: string }) {
  const [open, show, hide] = useOpen()
  const exam = examFor(s, today)
  if (!exam) return <Tile size={size} icon="exam" label="시험 진도"><span className="t-sub">더보기에서 시험을 추가하면 보여요</span></Tile>
  const p = examProgress(s, exam, today)
  const n = diffDays(today, exam.date)
  const gap = p ? Math.round(p.done * 100) - Math.round(p.planned * 100) : 0
  const track = (big?: boolean) => p && <div className={`t-prog${big ? ' big' : ''}`} aria-hidden="true"><i style={{ width: `${p.done * 100}%` }} /><b style={{ left: `${p.planned * 100}%` }} /></div>
  return (
    <>
      <Tile size={size} icon="exam" label={`${exam.name} D-${n}`} onOpen={show}>
        {p ? <><span className="t-num">{Math.round(p.done * 100)}<small>%</small></span>{track()}<span className="t-sub">{gap === 0 ? '예정대로' : <>예정보다 <b>{Math.abs(gap)}%p {gap < 0 ? '뒤' : '앞'}</b></>}</span></> : <span className="t-sub">범위에 든 계획이 없어요</span>}
      </Tile>
      {open && p && (
        <WSheet icon="exam" title={`${exam.name} 진도`} onClose={hide} big={<>{Math.round(p.done * 100)}<small>%</small></>} sub={<>D-{n} · 오늘까지 예정 {Math.round(p.planned * 100)}% · {gap === 0 ? '예정대로' : `${Math.abs(gap)}%p ${gap < 0 ? '뒤' : '앞'}`}</>}>
          <WSec title="범위 진도">{track(true)}<div className="t-lgd2"><span><i className="d" />한 만큼</span><span><i className="p" />오늘까지 했어야 할 곳</span></div></WSec>
          <p className="ws-note">계획마다 며칠 여유가 있는지는 '시험까지 여유' 위젯에서 볼 수 있어요.</p>
        </WSheet>
      )}
    </>
  )
}

// ── 최근 7일 ──
export function WeekWidget2({ s, size, today }: { s: State; size: WidgetSize; today: string }) {
  const [open, show, hide] = useOpen()
  const [pick, setPick] = useState<number | null>(null)
  const n = size === 's2' ? 7 : 7
  const secs = recentSecs(s, today, n)
  const total = secs.reduce((a, b) => a + b, 0)
  const days = secs.map((_, i) => addDays(today, i - n + 1))
  const bars = (vals: number[], ds: string[], h: number, tap?: boolean) => {
    const max = Math.max(...vals, 1)
    return <div className="t-bars" style={{ height: h }}>{vals.map((v, i) => <button key={i} className={`${ds[i] === today ? 'now' : ''}${pick === i && tap ? ' sel' : ''}`} disabled={!tap} onClick={() => setPick(i)} aria-label={`${mdKo(ds[i])} ${hm(v)}`}><i style={{ height: `${Math.max(4, (v / max) * 100)}%` }} /><span>{DOW[dow(ds[i])]}</span></button>)}</div>
  }
  const secs14 = recentSecs(s, today, 14)
  const d14 = secs14.map((_, i) => addDays(today, i - 13))
  const avg = Math.round(total / 7)
  const prev = recentSecs(s, addDays(today, -7), 7).reduce((a, b) => a + b, 0)
  return (
    <>
      <Tile size={size} icon="week" label="최근 7일" onOpen={show} right={size === 's2' ? <span className="t-r">하루 평균 <b>{hm(avg)}</b></span> : undefined}>
        <span className="t-num">{hm(total)}</span>
        {bars(secs, days, size === 's2' ? 70 : 52)}
      </Tile>
      {open && (
        <WSheet icon="week" title="최근 공부 시간" onClose={() => { hide(); setPick(null) }} big={hm(total)} sub={<>최근 7일 · 하루 평균 {hm(avg)} · 지난 7일보다 <b>{total >= prev ? `${hm(total - prev)} 더` : `${hm(prev - total)} 덜`}</b></>}>
          <WSec title="2주" right="막대를 눌러 보기">{bars(secs14, d14, 120, true)}{pick !== null && <p className="ws-note">{mdKo(d14[pick])} · {hm(secs14[pick])}</p>}</WSec>
        </WSheet>
      )}
    </>
  )
}

// ── 연속 공부 ──
export function StreakWidget2({ s, size, today }: { s: State; size: WidgetSize; today: string }) {
  const [open, show, hide] = useOpen()
  const { count, best, doneToday } = streakInfo(s, today, s.settings.streakMinSec)
  const min = Math.round(s.settings.streakMinSec / 60)
  const ok = (d: string) => daySec(s, d) >= s.settings.streakMinSec
  const grid = (weeks: number) => {
    const start = addDays(today, -((dow(today) + 6) % 7) - (weeks - 1) * 7)
    return <div className="t-heat" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}>{Array.from({ length: weeks * 7 }, (_, i) => { const d = addDays(start, Math.floor(i % 7) + Math.floor(i / 7) * 7); return <i key={i} className={d > today ? 'f' : ok(d) ? 'on' : ''} title={d} /> })}</div>
  }
  return (
    <>
      <Tile size={size} icon="streak" label="연속 공부" onOpen={show}>
        {size === 's1' ? <><span className="t-num">{count}<small>일</small></span><span className="t-sub">{doneToday ? <>최고 <b>{best}일</b></> : count > 0 ? <>오늘 {min}분이면 <b>{count + 1}일째</b></> : `오늘 ${min}분이면 시작`}</span></>
          : <div className="t-cols"><div className="l"><span className="t-num">{count}<small>일</small></span><span className="t-sub">최고 <b>{best}일</b></span></div><div className="r">{grid(4)}</div></div>}
      </Tile>
      {open && (
        <WSheet icon="streak" title="연속 공부" onClose={hide} big={<>{count}<small>일</small></>} sub={<>최고 기록 {best}일 · 하루 {min}분 이상이면 이어져요</>}>
          <WSec title="최근 10주" right="진할수록 공부한 날">{grid(10)}</WSec>
          <p className="ws-note">바쁜 날 최소 목표를 채운 날도 이어진 것으로 쳐요. 기준은 더보기에서 바꿀 수 있어요.</p>
        </WSheet>
      )}
    </>
  )
}

// ── 과목 비중 ──
export function SubjectsWidget2({ s, size, date, today }: { s: State; size: WidgetSize; date: string; today: string }) {
  const [open, show, hide] = useOpen()
  const subs = subjectSecs(s, date)
  const total = subs.reduce((a, x) => a + x.sec, 0)
  const week = new Map<string, { name: string; color: string; sec: number }>()
  for (let i = 0; i < 7; i++) for (const x of subjectSecs(s, addDays(today, -i))) { const w = week.get(x.name) ?? { ...x, sec: 0 }; w.sec += x.sec; week.set(x.name, w) }
  const wk = [...week.values()].sort((a, b) => b.sec - a.sec)
  const wkTotal = wk.reduce((a, x) => a + x.sec, 0)
  const split = (list: typeof subs, t: number) => <div className="t-split">{list.map((x) => <i key={x.name} style={{ flexGrow: x.sec, background: x.color }} />)}{!t && <i style={{ flexGrow: 1 }} />}</div>
  const rows = (list: typeof subs, t: number) => list.map((x) => <div key={x.name} className="t-row"><span className="t-dot" style={{ background: x.color }} /><span className="t-nm">{x.name}</span><span className="t-v">{hm(x.sec)} · {Math.round((x.sec / Math.max(t, 1)) * 100)}%</span></div>)
  return (
    <>
      <Tile size={size} icon="subjects" label="과목 비중 · 오늘" onOpen={show}>
        {!total ? <span className="t-sub">오늘 공부하면 보여요</span> : size === 's1'
          ? <><span className="t-q">{subs[0].name} <small className="t-sm">{Math.round((subs[0].sec / total) * 100)}%</small></span>{split(subs, total)}<span className="t-sub">{subs.length}과목 · {hm(total)}</span></>
          : <>{split(subs, total)}<div className="t-list">{rows(subs.slice(0, 3), total)}</div></>}
      </Tile>
      {open && (
        <WSheet icon="subjects" title="과목 비중" onClose={hide} big={hm(total)} sub="오늘과 최근 7일을 비교해요. 한 과목에만 몰리면 다른 과목이 밀려요.">
          <WSec title="오늘">{split(subs, total)}<div className="t-list in-sheet">{rows(subs, total)}</div></WSec>
          <WSec title="최근 7일" right={hm(wkTotal)}>{split(wk, wkTotal)}<div className="t-list in-sheet">{rows(wk, wkTotal)}</div></WSec>
        </WSheet>
      )}
    </>
  )
}

// ── 이번 주 목표 ──
export function WeekGoalWidget2({ s, size, today }: { s: State; size: WidgetSize; today: string }) {
  const [open, show, hide] = useOpen()
  const g = goalTotals(s, { from: addDays(today, -6), to: today, days: 7 }, today)
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
  return (
    <>
      <Tile size={size} icon="goal" label="이번 주 목표" onOpen={show}>
        <span className="t-num">{g.rate === null ? '—' : Math.round(g.rate * 100)}<small>%</small></span>
        <div className="t-dots7">{days.map((d) => { const x = dayGoals(s, d, today); return <i key={d} className={x.total && x.done >= x.total ? 'on' : x.done ? 'half' : ''} /> })}</div>
        <span className="t-sub">목표 {g.total}개 중 <b>{g.done}개</b></span>
      </Tile>
      {open && (
        <WSheet icon="goal" title="이번 주 목표" onClose={hide} big={<>{g.rate === null ? '—' : Math.round(g.rate * 100)}<small>%</small></>} sub={`최근 7일 · 목표 ${g.total}개 중 ${g.done}개를 채웠어요`}>
          <WSec title="날짜별"><div className="t-list in-sheet">{days.map((d) => { const x = dayGoals(s, d, today); return (
            <div key={d} className="t-row"><span className="t-nm">{mdKo(d)} {DOW[dow(d)]}</span><Bar p={x.total ? x.done / x.total : 0} color="var(--ink)" w={110} /><span className="t-v" style={{ width: 44 }}>{x.done}/{x.total}</span></div>
          ) })}</div></WSec>
        </WSheet>
      )}
    </>
  )
}

// ── 내일 미리 보기 ──
export function TomorrowWidget2({ s, size, today }: { s: State; size: WidgetSize; today: string }) {
  const [open, show, hide] = useOpen()
  const tm = addDays(today, 1)
  const list = itemsOn(s, tm, today).active
  const amt = (i: (typeof list)[number]) => i.task.type === 'time' ? hm(i.expect) : i.task.type === 'check' ? '체크' : `${i.expect}${i.task.unit}`
  const rows = (n: number) => list.slice(0, n).map((i) => <div key={i.task.id} className="t-row"><span className="t-dot" style={{ background: colorOf(s, i.task) }} /><span className="t-nm">{i.task.name}</span><span className="t-v">{amt(i)}</span></div>)
  return (
    <>
      <Tile size={size} icon="tomorrow" label={`내일 · ${list.length}개`} onOpen={show}>
        {!list.length ? <span className="t-sub">내일은 할 계획이 없어요</span> : size === 's1'
          ? <><span className="t-q">{list[0].task.name}</span><span className="t-sub"><b>{amt(list[0])}</b>{list.length > 1 ? ` 외 ${list.length - 1}개` : ''}</span></>
          : <div className="t-list">{rows(4)}</div>}
      </Tile>
      {open && (
        <WSheet icon="tomorrow" title="내일 미리 보기" onClose={hide} big={<>{list.length}<small>개</small></>} sub={`${mdKo(tm)} ${DOW[dow(tm)]}요일 · 자기 전에 무엇부터 할지 정해 두면 시작이 쉬워요`}>
          <WSec title="할 계획"><div className="t-list in-sheet">{list.length ? rows(list.length) : <p className="ws-note">없어요</p>}</div></WSec>
        </WSheet>
      )}
    </>
  )
}

// ── 오늘 메모 ──
export function MemoWidget2({ s, size }: { s: State; size: WidgetSize }) {
  const [open, show, hide] = useOpen()
  const notes: { date: string; note: string; name: string }[] = []
  for (const t of s.tasks) for (const [d, r] of Object.entries(s.recs[t.id] ?? {})) if (r.note) notes.push({ date: d, note: r.note, name: t.name })
  notes.sort((a, b) => b.date.localeCompare(a.date))
  return (
    <>
      <Tile size={size} icon="memo" label="메모" onOpen={notes.length ? show : undefined}>
        {!notes.length ? <span className="t-sub">분량 입력에서 한 줄을 남기면 보여요</span> : <>
          <span className={`t-note${size === 's2' ? ' two' : ''}`}>{notes[0].note}</span>
          <span className="t-sub">{notes[0].name} · {mdKo(notes[0].date)}</span></>}
      </Tile>
      {open && (
        <WSheet icon="memo" title="메모" onClose={hide} big={<>{notes.length}<small>개</small></>} sub="헷갈린 것, 다시 볼 것을 남겨 두면 복습할 때 도움이 돼요">
          <WSec title="최근"><div className="t-list in-sheet">{notes.slice(0, 20).map((n, i) => <div key={i} className="t-row tall"><span className="t-nm wrap"><b>{n.note}</b><small>{n.name} · {mdKo(n.date)}</small></span></div>)}</div></WSec>
        </WSheet>
      )}
    </>
  )
}

// ── 바로 시작 ──
export function QuickStartWidget2({ s, size, today }: { s: State; size: WidgetSize; today: string }) {
  const [open, show, hide] = useOpen()
  const seen = new Set<string>()
  const recent = [...s.histories].sort((a, b) => b.endedAt - a.endedAt).map((h) => s.tasks.find((t) => t.id === h.taskId)).filter((t): t is NonNullable<typeof t> => !!t && !t.archived && !t.completed && !seen.has(t.id) && !!seen.add(t.id))
  const last = recent[0]
  return (
    <>
      <Tile size={size} icon="play" label="바로 시작" onOpen={recent.length ? show : undefined}>
        {last ? <><span className="t-q">{last.name}</span><button className="t-act sm" onClick={() => startTimer(s, last, today)}>시작</button></> : <span className="t-sub">스톱워치를 쓰면 마지막 계획이 여기에</span>}
      </Tile>
      {open && (
        <WSheet icon="play" title="바로 시작" onClose={hide} sub="최근에 공부한 계획이에요. 누르면 스톱워치가 돌아요.">
          <WSec><div className="t-list in-sheet">{recent.slice(0, 6).map((t) => <div key={t.id} className="t-row tall"><span className="t-dot" style={{ background: colorOf(s, t) }} /><span className="t-nm"><b>{t.name}</b></span><button className="chip dark" onClick={() => { startTimer(s, t, today); hide() }}>시작</button></div>)}</div></WSec>
        </WSheet>
      )}
    </>
  )
}

// ── 스마트 스택: 한 칸에 여러 장, 옆으로 넘기고 시간대에 맞는 장이 앞에 ──
const PREFER: [number, WidgetId[]][] = [[12, ['progress', 'slack', 'today']], [20, ['progress', 'left', 'wrong']], [24, ['tomorrow', 'progress']]]
export function SmartStack({ slot, render }: { slot: WidgetSlot; render: (s: WidgetSlot) => JSX.Element | null }) {
  const items = (slot.items ?? STACK_DEFAULT).filter((id) => WIDGET_SIZES[id]?.includes(slot.size))
  const hour = new Date().getHours()
  const pref = PREFER.find(([h]) => hour < h)![1]
  const first = Math.max(0, items.findIndex((id) => pref.includes(id)) === -1 ? 0 : items.indexOf(pref.find((p) => items.includes(p))!))
  const ref = useRef<HTMLDivElement>(null)
  const [cur, setCur] = useState(first)
  useEffect(() => { const el = ref.current; if (el) el.scrollLeft = first * el.clientWidth }, [first, slot.size])
  if (!items.length) return null
  return (
    <div className={`sstack ${slot.size}`} aria-label="스마트 스택" role="group">
      <div className="stk-pages" ref={ref} onScroll={(e) => { const el = e.currentTarget; setCur(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))) }}>
        {items.map((id) => <div key={id} className="stk-page">{render({ id, size: slot.size })}</div>)}
      </div>
      {items.length > 1 && <div className="stk-dots" aria-hidden="true">{items.map((id, i) => <i key={id} className={i === cur ? 'on' : ''} />)}</div>}
    </div>
  )
}
