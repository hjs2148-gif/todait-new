import { useEffect, useState } from 'react'
import { EndSheet } from './Entry.tsx'
import { Icon } from './Icon.tsx'
import { fmtClock, todayISO } from './date.ts'
import { actions, takeLastStopped, timerElapsed, useStore, type State } from './store.ts'
import { behindOf, dayStats, hm, targetSec } from './todayData.ts'
import { colorOf, itemsOn, type Item } from './view.ts'

type Stopped = { id: string; taskId: string; date: string; sec: number }

/** 지금 하면 좋은 다음 공부: 밀린 것부터, 그다음 계획 순서. 책·인강·시간 계획만 시작할 수 있다 */
export function nextStudy(s: State, today: string): { item: Item; label: string } | null {
  const { active } = dayStats(s, today, today)
  const cand = active
    .filter((i) => (i.task.kind === 'book' || i.task.kind === 'lecture' || i.task.kind === 'time') && i.rate < 1)
    .sort((a, b) => behindOf(s, b.task, today) - behindOf(s, a.task, today) || a.task.order - b.task.order)[0]
  if (!cand) return null
  const { task, rec, expect } = cand
  const recs = s.recs[task.id] ?? {}
  let tail = ''
  if (task.kind === 'time') tail = `${Math.ceil(Math.max(expect - (rec?.sec ?? 0), 0) / 60)}분 남음`
  else if (task.kind === 'lecture') tail = `${(task.startPoint ?? 1) + Object.values(recs).reduce((a, r) => a + r.done, 0)}${task.unit || '강'}부터`
  else if (task.startPoint !== null && task.type === 'amount') tail = `${task.startPoint + Object.values(recs).reduce((a, r) => a + r.done, 0)}${task.unit}부터`
  else tail = `오늘 ${expect}${task.unit}`
  return { item: cand, label: `${task.name} · ${tail}` }
}

/** 하단 탭 위에 떠 있는 줄: 다음 공부 시작 / 스톱워치 미니 바. 스톱워치 전체 화면도 여기서 그린다 */
export function Stopwatch({ showStart }: { showStart: boolean }) {
  const s = useStore()
  const timer = s.timer
  const today = todayISO()
  const [now, setNow] = useState(Date.now())
  const [open, setOpen] = useState(true)
  const [ended, setEnded] = useState<Stopped | null>(null)
  const startedAt = timer?.startedAt

  // 새로 시작하면 전체 화면으로 연다
  useEffect(() => { if (startedAt) setOpen(true) }, [startedAt])

  useEffect(() => {
    if (!timer) return
    const iv = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(iv)
  }, [timer])

  const running = !!timer && timer.pausedAt === undefined
  useEffect(() => {
    if (!running || !open) return
    let lock: { release: () => Promise<void> } | undefined
    let alive = true
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
    wl?.request('screen').then((l) => { if (alive) lock = l; else void l.release() }).catch(() => {})
    return () => { alive = false; void lock?.release() }
  }, [running, open])

  if (ended) {
    const { active, resting } = itemsOn(s, ended.date, today)
    return <EndSheet s={s} rec={ended} tasks={[...active, ...resting]} onClose={() => setEnded(null)} />
  }

  if (!timer) {
    const next = showStart ? nextStudy(s, today) : null
    if (!next) return null
    const color = colorOf(s, next.item.task)
    return (
      <div className="dock" role="region" aria-label="다음 공부">
        <span className="dock-bar" style={{ background: color }} />
        <span className="dock-t"><small>다음 공부</small><b>{next.label}</b></span>
        <button className="go" onClick={() => actions.startTimer(next.item.task.id, today)}><Icon name="play" size={16} />시작</button>
      </div>
    )
  }

  const task = s.tasks.find((t) => t.id === timer.taskId)
  if (!task) return null
  const elapsed = timerElapsed(timer, now)
  const color = colorOf(s, task)
  const before = s.recs[task.id]?.[timer.date]?.sec ?? 0
  const end = () => {
    actions.stopTimer()
    const rec = takeLastStopped()
    if (rec) setEnded(rec)
  }
  const toggle = () => (running ? actions.pauseTimer() : actions.resumeTimer())

  if (!open)
    return (
      <div className="dock mini" role="region" aria-label="스톱워치">
        <button className="dock-open" onClick={() => setOpen(true)} aria-label="스톱워치 열기">
          <span className="dock-bar" style={{ background: color }} />
          <span className="dock-t"><small>{task.name}</small><b className="clk">{fmtClock(elapsed)}</b></span>
        </button>
        <button className="chip" onClick={toggle}>{running ? '멈춤' : '이어서'}</button>
        <button className="chip dark" onClick={end}>끝내기</button>
      </div>
    )

  // 전체 화면: 10분 칸 링
  const item = itemsOn(s, timer.date, today).active.find((i) => i.task.id === task.id)
  const goal = item ? targetSec(s, item) : 0
  const n = Math.min(Math.max(Math.ceil(Math.max(goal, before + elapsed) / 600), 6), 18)
  const R = 104
  const C = 2 * Math.PI * R
  const seg = C / n
  const gap = 8
  const arc = (i: number, from: number, to: number) => {
    const a = Math.max(0, Math.min(600, from - i * 600))
    const b = Math.max(0, Math.min(600, to - i * 600))
    const len = ((b - a) / 600) * (seg - gap)
    return len > 0.2 ? { d: `${len.toFixed(1)} ${C.toFixed(1)}`, o: -(i * seg + (a / 600) * (seg - gap)) } : null
  }
  const dayTotal = dayStats(s, timer.date, today)
  const startClock = new Date(timer.startedAt)
  return (
    <div className="stopwatch" role="dialog" aria-label="스톱워치">
      <button className="sw-down" onClick={() => setOpen(false)} aria-label="내리기"><Icon name="left" size={20} /></button>
      <small>{running ? '공부 중' : '멈춤'} · {task.name}</small>
      <div className="ringwrap">
        <svg width="260" height="260" viewBox="0 0 260 260" aria-hidden="true">
          <g transform="rotate(-90 130 130)" fill="none" strokeWidth="14" strokeLinecap="round">
            {Array.from({ length: n }, (_, i) => {
              const base = { d: `${(seg - gap).toFixed(1)} ${C.toFixed(1)}`, o: -(i * seg) }
              const p = arc(i, 0, before)
              const c = arc(i, before, before + elapsed)
              return (
                <g key={i}>
                  <circle cx="130" cy="130" r={R} stroke="var(--trk)" strokeDasharray={base.d} strokeDashoffset={base.o} />
                  {p && <circle cx="130" cy="130" r={R} stroke={color} strokeOpacity=".4" strokeDasharray={p.d} strokeDashoffset={p.o} />}
                  {c && <circle cx="130" cy="130" r={R} stroke={color} strokeDasharray={c.d} strokeDashoffset={c.o} />}
                </g>
              )
            })}
          </g>
        </svg>
        <div className="clock">{fmtClock(elapsed)}</div>
      </div>
      <p>{`${String(startClock.getHours()).padStart(2, '0')}:${String(startClock.getMinutes()).padStart(2, '0')}에 시작 · 이 계획 오늘 ${hm(before + elapsed)}`}</p>
      <div className="trk-day" role="img" aria-label="오늘 전체"><span style={{ width: `${Math.min(((dayTotal.sec + elapsed) / Math.max(dayTotal.target, dayTotal.sec + elapsed, 1)) * 100, 100)}%` }} /></div>
      <small>오늘 전체 {hm(dayTotal.sec + elapsed)}{dayTotal.target > 0 ? ` / ${hm(dayTotal.target)}` : ''}</small>
      <div className="sw-btns">
        <button className="ghost" onClick={toggle}>{running ? '멈춤' : '이어서'}</button>
        <button className="primary" onClick={end}>끝내기</button>
      </div>
      <small>화면이 꺼지지 않게 켜 둬요</small>
    </div>
  )
}
