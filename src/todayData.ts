// 오늘 탭이 쓰는 계산 모음. 화면 코드(React)와 섞이지 않게 따로 둔다.
import { addDays } from './date.ts'
import { expectIfOnTrack, liveExpect, secPerUnit, type Task, type TaskKind } from './logic.ts'
import { offFor, subjectVar, type State } from './store.ts'
import { daySec, itemsOn, type Item } from './view.ts'

export const KIND_TABS: ['all' | TaskKind, string][] = [
  ['all', '전체'], ['book', '책'], ['lecture', '인강'], ['time', '시간'], ['habit', '습관'], ['todo', '할 일'],
]
export const KIND_NAME: Record<TaskKind, string> = { book: '책', lecture: '인강', time: '시간', habit: '습관', todo: '할 일' }

const hasTime = (t: Task) => t.kind === 'book' || t.kind === 'lecture' || t.kind === 'time'

/** 그 날 목표를 채우는 데 드는 시간(초). 습관·할 일은 시간으로 치지 않는다 */
export function targetSec(s: State, { task, expect }: Item): number {
  if (!hasTime(task)) return 0
  return task.kind === 'time' ? expect : expect * secPerUnit(task, s.recs[task.id] ?? {})
}

/** 아직 남은 시간(초) */
export function remainSec(s: State, { task, rec, expect }: Item): number {
  if (!hasTime(task)) return 0
  if (task.kind === 'time') return Math.max(expect - (rec?.sec ?? 0), 0)
  return Math.max(expect - (rec?.done ?? 0), 0) * secPerUnit(task, s.recs[task.id] ?? {})
}

/** 예정보다 밀린 양 (지난 날 목표 합 − 한 양). 할 일은 마감이 지났으면 1 */
export function behindOf(s: State, task: Task, today: string): number {
  const recs = s.recs[task.id] ?? {}
  if (task.completed || task.archived) return 0
  if (task.kind === 'todo') {
    const due = task.due ?? task.endDate ?? task.startDate
    return due < today && !Object.values(recs).some((r) => r.checked) ? 1 : 0
  }
  if (task.type !== 'amount') return 0
  let exp = 0
  let done = 0
  for (const d in recs) if (d < today) { exp += recs[d].expect ?? 0; done += recs[d].done }
  return Math.max(exp - done, 0)
}

export interface DayStats {
  active: Item[]
  resting: Item[]
  sec: number
  target: number
  /** 시간 % (공부 시간 / 목표 시간). 목표 시간이 없으면 null */
  timeRate: number | null
  goalsDone: number
  goalsTotal: number
  remain: number
}

export function dayStats(s: State, date: string, today: string): DayStats {
  const { active, resting } = itemsOn(s, date, today)
  let target = 0
  let remain = 0
  for (const i of active) { target += targetSec(s, i); remain += remainSec(s, i) }
  const sec = daySec(s, date)
  return {
    active, resting, sec, target, remain,
    timeRate: target > 0 ? sec / target : null,
    goalsDone: active.filter((i) => i.rate >= 1).length,
    goalsTotal: active.length,
  }
}

/** 오늘 공부 도넛: 과목(카테고리)별 공부 시간 */
export function subjectSecs(s: State, date: string) {
  const by = new Map<string, { name: string; color: string; sec: number }>()
  for (const t of s.tasks) {
    const sec = s.recs[t.id]?.[date]?.sec ?? 0
    if (sec <= 0) continue
    const c = s.categories.find((x) => x.id === t.categoryId)
    const key = c?.id ?? '_'
    const cur = by.get(key) ?? { name: c?.name ?? '기타', color: subjectVar(c?.color), sec: 0 }
    cur.sec += sec
    by.set(key, cur)
  }
  return [...by.values()].sort((a, b) => b.sec - a.sec)
}

/** 최근 n일 공부 시간(초), 오래된 날부터 */
export const recentSecs = (s: State, end: string, n: number) =>
  Array.from({ length: n }, (_, i) => daySec(s, addDays(end, i - n + 1)))

/** 연속 공부: 하루 minSec 이상 공부한 날이 이어진 일수. 쉬는 날은 끊지 않고 세지도 않는다 */
export function streakInfo(s: State, today: string, minSec: number) {
  const ok = (d: string) => daySec(s, d) >= minSec
  const rest = (d: string) => d in s.settings.restDays
  let count = 0
  let d = ok(today) ? today : addDays(today, -1)
  const doneToday = ok(today)
  for (let i = 0; i < 800; i++, d = addDays(d, -1)) {
    if (rest(d)) continue
    if (!ok(d)) break
    count++
  }
  // 최고 기록: 기록이 있는 가장 이른 날부터 훑는다
  let first = today
  for (const id in s.recs) for (const k in s.recs[id]) if (k < first) first = k
  let best = 0
  let run = 0
  for (let x = first; x <= today; x = addDays(x, 1)) {
    if (rest(x)) continue
    run = ok(x) ? run + 1 : 0
    if (run > best) best = run
  }
  return { count, best: Math.max(best, count), doneToday }
}

/** 습관 연속 일수와 최근 n일 칸 (끝낸 날 = true) */
export function habitDays(s: State, t: Task, end: string, n: number) {
  const recs = s.recs[t.id] ?? {}
  const did = (d: string) => (t.type === 'check' ? !!recs[d]?.checked : (recs[d]?.done ?? 0) >= Math.max(recs[d]?.expect ?? 1, 1))
  const days = Array.from({ length: n }, (_, i) => {
    const d = addDays(end, i - n + 1)
    return { date: d, done: did(d), before: d < t.startDate }
  })
  let streak = 0
  for (let d = did(end) ? end : addDays(end, -1); d >= t.startDate && did(d); d = addDays(d, -1)) streak++
  return { days, streak, doneCount: days.filter((x) => x.done).length, span: days.filter((x) => !x.before).length }
}

/** 지금 시각 + 남은 시간 → "21:55" */
export const finishClock = (remainSecs: number, now = new Date()) => {
  const t = new Date(now.getTime() + remainSecs * 1000)
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
}

/** 시:분 (예: 4:22) */
export const hm = (sec: number) => {
  const m = Math.round(Math.max(0, sec) / 60)
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
}

export { examProgress } from './progress.ts'

// ── 밀린 분량 정리 ─────────────────────────────────────────

export interface CatchupItem {
  task: Task
  missed: number
  /** 밀리지 않았다면 오늘 분량 / 남은 날에 나눴을 때 오늘 분량 */
  base: number
  spread: number
  /** 할 일: 마감이 지남 */
  overdue: boolean
}

/** 어제 못 한 분량이 있는 계획들 (오늘 탭을 열 때 한 번 정리한다) */
export function catchupItems(s: State, today: string): CatchupItem[] {
  const y = addDays(today, -1)
  const out: CatchupItem[] = []
  for (const task of s.tasks) {
    if (task.archived || task.completed) continue
    const recs = s.recs[task.id] ?? {}
    const r = recs[y]
    if (task.kind === 'todo') {
      if (r && (r.expect ?? 0) > 0 && !r.checked) out.push({ task, missed: 1, base: 0, spread: 0, overdue: true })
      continue
    }
    if (task.type !== 'amount' || !r) continue
    const missed = Math.max((r.expect ?? 0) - r.done, 0)
    if (missed <= 0) continue
    const off = offFor(s, task)
    out.push({ task, missed, base: expectIfOnTrack(task, recs, y, today, off), spread: liveExpect(task, recs, today, off), overdue: false })
  }
  return out
}
