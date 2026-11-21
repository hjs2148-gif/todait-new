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
  const [picking, setPicking] = useState(false)
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
    // 쉬는 날에는 다음 공부를 권하지 않는다
    const next = showStart && !(today in s.settings.restDays) ? nextStudy(s, today) : null
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

  const miniItem = itemsOn(s, timer.date, today).active.find((i) => i.task.id === task.id)
  const miniGoal = (miniItem ? targetSec(s, miniItem) : 0) - before - elapsed
  const mmssMini = (sec: number) => { const x = Math.floor(sec); const h = Math.floor(x / 3600); const m = Math.floor((x % 3600) / 60); const r = x % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` }
  if (!open)
    return (
      <div className="dock mini" role="region" aria-label="스톱워치">
        <button className="dock-open" onClick={() => setOpen(true)} aria-label="스톱워치 열기">
          <span className="dock-t"><small><i className="dot" style={{ background: color }} /> {task.name}{miniGoal > 0 ? ` · 목표까지 ${Math.ceil(miniGoal / 60)}분` : running ? '' : ' · 멈춤'}</small><b className="clk">{mmssMini(elapsed)}</b></span>
        </button>
        <button className="mini-b" onClick={toggle} aria-label={running ? '잠깐 멈춤' : '이어서'}><Icon name={running ? 'pause' : 'play'} size={18} /></button>
        <button className="mini-b end" onClick={end} aria-label="끝내고 기록"><Icon name="stop" size={18} /></button>
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
  const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const mmss = (sec: number) => { const t = Math.floor(sec); const h = Math.floor(t / 3600); const m = Math.floor((t % 3600) / 60); const x = t % 60; return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` }
  const leftToGoal = goal - before - elapsed
  const dayNow = dayTotal.sec + elapsed
  const others = itemsOn(s, timer.date, today).active.filter((i) => i.task.id !== task.id && i.task.kind !== 'todo' && i.task.kind !== 'habit')
  return (
    <div className="stopwatch sw2" role="dialog" aria-label="스톱워치">
      <div className="sw-top">
        <button className="sq" onClick={() => setOpen(false)} aria-label="내리기"><Icon name="left" size={18} /></button>
        <span className="sw-awake"><Icon name="phone" size={16} stroke={1.9} />화면 켜 둠</span>
      </div>
      <button className="sw-plan" onClick={() => setPicking(!picking)} aria-expanded={picking}><i className="dot" style={{ background: color }} />{task.name}{others.length > 0 && <Icon name="right" size={14} />}</button>
      {picking && others.length > 0 && (
        <div className="sw-pick">{others.map((i) => <button key={i.task.id} className="chip" onClick={() => { actions.switchTimerTask(i.task.id); setPicking(false) }}><i className="dot" style={{ background: colorOf(s, i.task) }} />{i.task.name}</button>)}</div>
      )}
      <div className="ringwrap">
        <svg width="260" height="260" viewBox="0 0 260 260" aria-hidden="true">
          <g transform="rotate(-90 130 130)" fill="none" strokeWidth="16" strokeLinecap="butt">
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
        <div className="sw-in">
          <small>{running ? '이번 공부' : '멈춤'} · {hhmm(startClock)} 시작</small>
          <b className="sw-clock">{mmss(elapsed)}</b>
          <small>오늘 <b>{hm(before + elapsed)}</b>{goal > 0 ? ` / ${hm(goal)}` : ''}</small>
        </div>
      </div>
      <b className="sw-goal">{goal <= 0 ? '오늘 목표 시간이 없어요' : leftToGoal > 0 ? `목표까지 ${Math.ceil(leftToGoal / 60)}분` : '목표를 채웠어요'}</b>
      <div className="sw-leg"><span><i style={{ background: color, opacity: 0.45 }} />앞서 한 {hm(before)}</span><span><i style={{ background: color }} />지금 {hm(elapsed)}</span></div>
      <section className="tcard sw-day" aria-label="오늘 전체">
        <div className="tc-meta"><span>오늘 전체</span><b>{hm(dayNow)}{dayTotal.target > 0 ? ` / ${hm(dayTotal.target)} · ${Math.round((dayNow / dayTotal.target) * 100)}%` : ''}</b></div>
        <div className="trk-day"><span style={{ width: `${Math.min((dayNow / Math.max(dayTotal.target, dayNow, 1)) * 100, 100)}%` }} /></div>
      </section>
      <div className="sw-btns2">
        <button onClick={toggle} aria-label={running ? '잠깐 멈춤' : '이어서'}><span className="rb"><Icon name={running ? 'pause' : 'play'} size={24} /></span>{running ? '잠깐 멈춤' : '이어서'}</button>
        <button onClick={end} aria-label="끝내고 기록"><span className="rb ink"><Icon name="stop" size={24} /></span>끝내고 기록</button>
      </div>
    </div>
  )
}
