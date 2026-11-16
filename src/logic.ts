// 계획 분량 배분 로직.
// 원본 앱의 ByAmountTaskLogic(남은 분량을 남은 공부일에 올림 분배, 보충 요일, 분량 변경/쉬는 날)을 옮긴 것.
import { addDays, diffDays, dow } from './date.ts'

export type TaskType = 'amount' | 'daily' | 'time' | 'check'

export interface Task {
  id: string
  name: string
  /** amount: 전체 분량을 기간에 나눠 하는 계획 / daily: 매일 일정 분량 / time: 매일 목표 시간 / check: 했는지만 체크 */
  type: TaskType
  unit: string
  /** amount 전용: 범위 시작 값 (예: 31쪽부터면 31). 총 분량 방식이면 null */
  startPoint: number | null
  /** amount 전용: 전체 분량 */
  amount: number
  /** daily: 하루 분량, time: 하루 목표(초), amount(종료일 없음): 하루 분량 */
  perDay: number
  startDate: string
  endDate: string | null
  /** 공부하는 요일 (0=일 … 6=토) */
  week: boolean[]
  /** N일마다 반복 (daily/time/check). null이면 요일 반복 */
  repeatEvery: number | null
  /** amount 전용: 이번 주에 밀린 분량을 몰아서 하는 요일 */
  supplementDow: number | null
  /** 날짜별 분량 변경. 0이면 쉬는 날 */
  custom: Record<string, number>
  categoryId: string | null
  notifyTime: string | null
  completed: boolean
  completedDate: string | null
  archived: boolean
  order: number
  createdAt: number
}

export interface DayRec {
  /** 그 날의 목표(분량 또는 초). 지난 날짜는 고정된다 */
  expect?: number
  done: number
  sec: number
  checked: boolean
}
export type Recs = Record<string, DayRec>

export const sumDone = (recs: Recs, before?: string) => {
  let s = 0
  for (const d in recs) if (before === undefined || d < before) s += recs[d].done
  return s
}

const inPeriod = (t: Task, date: string) => date >= t.startDate && (!t.endDate || date <= t.endDate)

/** 보충 요일 기준으로 "이번 주"가 시작된 뒤 date 전까지 밀린 분량 */
function delayedThisWeek(recs: Recs, date: string, sup: number) {
  const wd = dow(date)
  const begin = addDays(date, sup - (sup >= wd ? wd + 7 : wd) + 1)
  let diff = 0
  for (let d = begin; d < date; d = addDays(d, 1)) {
    const r = recs[d]
    if (r) diff += (r.expect ?? 0) - r.done
  }
  return Math.max(diff, 0)
}

function nextSupplementDate(date: string, sup: number, end: string | null) {
  const wd = dow(date)
  const next = addDays(date, sup - (wd > sup ? wd - 7 : wd))
  return end && next > end ? null : next
}

/** date 시점에 계산한 그 날의 목표. 지난 날짜의 기록(recs)만 참고한다 */
export function liveExpect(t: Task, recs: Recs, date: string): number {
  if (!inPeriod(t, date)) return 0
  const custom = t.custom[date]

  if (t.type !== 'amount') {
    if (custom !== undefined) return custom
    const on = t.repeatEvery ? diffDays(t.startDate, date) % t.repeatEvery === 0 : t.week[dow(date)]
    return on ? (t.type === 'check' ? 1 : t.perDay) : 0
  }

  let left = Math.max(t.amount - sumDone(recs, date), 0)
  const sup = t.supplementDow
  const wd = dow(date)
  let delayed = sup === null ? 0 : delayedThisWeek(recs, date, sup)
  if (sup !== null && wd !== sup && delayed > 0) {
    // 밀린 분량은 다가오는 보충 요일 몫으로 떼어 둔다
    const ns = nextSupplementDate(date, sup, t.endDate)
    if (ns && t.custom[ns] === undefined) {
      delayed = Math.min(delayed, left)
      left -= delayed
    }
  }
  if (custom !== undefined) return Math.min(custom, left)
  if (sup !== null && wd === sup) return Math.min(delayed, left)
  if (!t.week[wd]) return 0
  if (!t.endDate) return Math.min(t.perDay, left)

  // 남은 분량(분량 변경한 날 몫 제외)을 남은 공부일 수로 올림 분배
  let customSum = 0
  let days = 0
  for (let d = date; d <= t.endDate; d = addDays(d, 1)) {
    const c = t.custom[d]
    if (c !== undefined) customSum += c
    else if (t.week[dow(d)] && dow(d) !== sup) days++
  }
  const rest = Math.max(left - customSum, 0)
  return Math.min(days > 0 ? Math.ceil(rest / days) : 0, left)
}

/** 지난 날짜들의 목표를 고정한다. 바뀐 게 없으면 같은 객체를 돌려준다 */
export function rollForward(t: Task, recs: Recs, today: string): Recs {
  let out = recs
  const last = t.endDate && t.endDate < today ? t.endDate : addDays(today, -1)
  for (let d = t.startDate; d <= last; d = addDays(d, 1)) {
    if (t.completedDate && d > t.completedDate) break
    if (out[d]?.expect !== undefined) continue
    const e = liveExpect(t, out, d)
    if (e <= 0 && !out[d]) continue
    if (out === recs) out = { ...recs }
    out[d] = { ...(out[d] ?? { done: 0, sec: 0, checked: false }), expect: e }
  }
  return out
}

/** 오늘 이후 날짜별 예상 목표 (매일 목표를 채운다고 가정) */
export function futurePlan(t: Task, recs: Recs, today: string): Record<string, number> {
  const plan: Record<string, number> = {}
  if (t.type !== 'amount' || t.completed) return plan
  const sim: Recs = { ...recs }
  const last = t.endDate ?? addDays(today, 365)
  for (let d = today < t.startDate ? t.startDate : today; d <= last; d = addDays(d, 1)) {
    const e = liveExpect(t, sim, d)
    plan[d] = e
    const cur = sim[d]
    sim[d] = { done: Math.max(e, cur?.done ?? 0), sec: 0, checked: false, expect: e }
    if (sumDone(sim) >= t.amount) break
  }
  return plan
}

/** 화면에 보여줄 그 날의 목표 */
export function expectOn(t: Task, recs: Recs, date: string, today: string, plan?: Record<string, number>): number {
  if (date < today) return recs[date]?.expect ?? 0
  if (t.type !== 'amount' || date === today) return liveExpect(t, recs, date)
  return (plan ?? futurePlan(t, recs, today))[date] ?? 0
}

/** 0~1 달성률 */
export function rateOf(t: Task, rec: DayRec | undefined, expect: number): number {
  if (expect <= 0) return 0
  if (t.type === 'check') return rec?.checked ? 1 : 0
  const v = t.type === 'time' ? rec?.sec ?? 0 : rec?.done ?? 0
  return Math.min(v / expect, 1)
}

/** 기간이 끝났는데 분량이 남은 계획 */
export const isExpired = (t: Task, recs: Recs, today: string) =>
  t.type === 'amount' && !t.completed && !!t.endDate && t.endDate < today && sumDone(recs) < t.amount

/** 기간이 끝나 자연히 종료된 반복 계획 */
export const isFinished = (t: Task, today: string) =>
  t.completed || (t.type !== 'amount' && !!t.endDate && t.endDate < today)
