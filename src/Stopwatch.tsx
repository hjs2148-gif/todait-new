import { useEffect, useState } from 'react'
import { fmtClock, fmtDur, todayISO } from './date.ts'
import { actions, useStore } from './store.ts'
import { DoneSheet } from './Today.tsx'
import { itemsOn } from './view.ts'

/** 실행 중인 스톱워치 화면. 앱을 닫았다 열어도 시작 시각 기준으로 이어진다 */
export function Stopwatch() {
  const s = useStore()
  const timer = s.timer
  const [now, setNow] = useState(Date.now())
  const [ask, setAsk] = useState<{ taskId: string; date: string } | null>(null)

  useEffect(() => {
    if (!timer) return
    const iv = setInterval(() => setNow(Date.now()), 500)
    let lock: { release: () => Promise<void> } | undefined
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
    wl?.request('screen').then((l) => (lock = l)).catch(() => {})
    return () => {
      clearInterval(iv)
      void lock?.release()
    }
  }, [timer])

  if (ask) {
    const { active, resting } = itemsOn(s, ask.date, todayISO())
    const item = [...active, ...resting].find((i) => i.task.id === ask.taskId)
    return item ? <DoneSheet s={s} item={item} date={ask.date} onClose={() => setAsk(null)} /> : null
  }
  if (!timer) return null
  const task = s.tasks.find((t) => t.id === timer.taskId)
  if (!task) return null
  const elapsed = Math.max(0, (now - timer.startedAt) / 1000)
  const before = s.recs[task.id]?.[timer.date]?.sec ?? 0

  const stop = () => {
    actions.stopTimer()
    if (task.type === 'amount' || task.type === 'daily') setAsk({ taskId: task.id, date: timer.date })
  }
  return (
    <div className="stopwatch">
      <small>공부 중</small>
      <h1>{task.name}</h1>
      <div className="clock">{fmtClock(elapsed)}</div>
      <p>오늘 이 계획에 {fmtDur(before + elapsed)}</p>
      <button onClick={stop}>공부 종료</button>
    </div>
  )
}
