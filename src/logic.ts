// 계획 분량 배분 로직.
// 원본 앱의 ByAmountTaskLogic(남은 분량을 남은 공부일에 올림 분배, 보충 요일, 분량 변경/쉬는 날)을 옮긴 것.
import { addDays, diffDays, dow } from './date.ts'
import type { TocLine } from './toc.ts'

/** 배분 엔진이 쓰는 방식. 화면의 분류(kind)와 따로 둔다 */
export type TaskType = 'amount' | 'daily' | 'time' | 'check'
/** 앱 전체에서 쓰는 계획 분류 5가지: 책(책·문제집) · 인강 · 시간 · 습관 · 할 일 */
export type TaskKind = 'book' | 'lecture' | 'time' | 'habit' | 'todo'
/** 책을 나누는 방식: 목차(쪽) · 문제집(문항) · 분량만 */
export type BookMode = 'toc' | 'workbook' | 'amount'
/** 이해도 상·중·하 */
export type Grade = 'high' | 'mid' | 'low'

export interface Chapter {
  id: string
  name: string
  /** 단원 범위 (쪽 또는 문항, 양 끝 포함) */
  from: number
  to: number
  /** 단원을 끝낸 날 */
  doneDate?: string
  grade?: Grade
  /** 복습한 날들 */
  reviews?: string[]
  /** 단원 무게: 1 쉬움 · 2 보통(기본) · 3 어려움. 어려울수록 하루 쪽 수가 줄어든다 */
  weight?: 1 | 2 | 3
}

/** 회독: 1회독 → 2회독(인출 중심, 더 빠르게) → 오답만. 2회독·오답만은 roundOf로 이어진 별도 계획이다 */
export interface Round {
  kind: 'first' | 'second' | 'wrong'
  /** 1회독 대비 속도 배율 (2회독 기본 2) */
  speed: number
  from: string | null
  to: string | null
}

export interface Lecture { title: string; min: number | null }

/** 그 날을 쉬는 날로 볼지. 시험 전 비워 둘 날·전체 쉬는 날·멈춘 기간을 합쳐 넘긴다 */
export type OffFn = (date: string) => boolean

export interface Task {
  id: string
  name: string
  /** amount: 전체 분량을 기간에 나눠 하는 계획 / daily: 매일 일정 분량 / time: 매일 목표 시간 / check: 했는지만 체크 */
  type: TaskType
  /** 화면 분류. 옛 기록은 migrate()가 type으로 채운다 */
  kind: TaskKind
  /** kind === 'book' 일 때 나누는 방식 */
  bookMode?: BookMode
  /** 목차·문제집 단원 (맨 위 단계) */
  chapters?: Chapter[]
  /** 깊이 자유 목차 원본 (고칠 때 다시 씀) */
  toc?: TocLine[]
  /** 하루 분량을 끊을 자리: 가장 아래 항목의 끝 쪽들. 없으면 단원 끝 */
  cuts?: number[]
  /** 요일별 공부 가능 시간 비율 (0=일 … 6=토). 있으면 하루 분량을 이 비율로 나눈다 */
  dayWeights?: number[]
  /** 가능 시간에 맞춰 엔진이 정한 날짜별 분량 (직접 바꾼 custom이 우선) */
  fit?: Record<string, number>
  /** fit 가운데 실제로 줄인 날의 원래 분량 ("15 → 10" 표시용) */
  fitFrom?: Record<string, number>
  /** 바쁜 날엔 이것만 (최소 목표) */
  minGoal?: number | null
  /** 회독 결정: 1회독이 끝날 무렵 제안에 답하면 채워진다 (2회독·오답만은 따로 계획을 만든다) */
  rounds?: Round[]
  /** 2회독·오답만 계획이면 1회독 계획 id */
  roundOf?: string
  /** 기본 속도 배율 (2회독은 2배 빠르게) */
  speed?: number
  /** 인강 강의 목록 (없으면 amount개의 이름 없는 강의) */
  lectures?: Lecture[]
  /** 목차 계획: 단원 순서대로(단원 끝에 맞춰 끊기) / 하루 쪽 수 같게 */
  split?: 'chapter' | 'even'
  /** 습관: 쉬는 날에도 한다 */
  keepOnRest?: boolean
  /** 할 일: 마감일 (없으면 하는 날 = 마감) */
  due?: string | null
  /** 잠깐 멈춘 기간. to가 null이면 지금 멈춘 상태 */
  pauses?: { from: string; to: string | null }[]
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
  /** 멈춘 계획 (계획 관리의 '멈춘 것') */
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
  /** 문제집: 맞은 수·틀린 수 */
  right?: number
  wrong?: number
  /** 한 줄 메모 */
  note?: string
}
export type Recs = Record<string, DayRec>

export const sumDone = (recs: Recs, before?: string) => {
  let s = 0
  for (const d in recs) if (before === undefined || d < before) s += recs[d].done
  return s
}

const inPeriod = (t: Task, date: string) => date >= t.startDate && (!t.endDate || date <= t.endDate)

/** 그 날의 분량 변경. 직접 바꾼 값이 우선이고, 쉬는 날(off)이면 0 */
const customOf = (t: Task, date: string, off?: OffFn): number | undefined => {
  const c = t.custom[date] ?? t.fit?.[date]
  if (c !== undefined) return c
  return off?.(date) ? 0 : undefined
}

/** 멈춘 기간에 들어가는 날인지 */
export const isPausedOn = (t: Task, date: string) =>
  !!t.pauses?.some((p) => date >= p.from && (p.to === null || date <= p.to))

const FACTOR = { 1: 0.7, 2: 1, 3: 1.4 } as const
/** 그 쪽의 노력 배율 (단원 무게) */
const factorAt = (t: Task, p: number) => FACTOR[t.chapters?.find((c) => p >= c.from && p <= c.to)?.weight ?? 2]
/** a~b쪽에 드는 노력 */
function effort(t: Task, a: number, b: number) {
  let e = 0
  for (let p = a; p <= b; p++) e += factorAt(t, p)
  return e
}
/** 요일 비율 (없으면 1) */
const dayW = (t: Task, d: string) => (t.dayWeights ? t.dayWeights[dow(d)] || 1 : 1)

/** 목차 '단원 순서대로': 하루 끝이 끊을 자리(가장 아래 항목 끝) 근처(하루 분량의 절반 안)면 거기서 끊는다 */
function snapToChapter(t: Task, recs: Recs, date: string, v: number, left: number) {
  if (t.split !== 'chapter' || !t.chapters?.length || t.startPoint === null || v <= 0) return v
  const pos = t.startPoint + sumDone(recs, date)
  const end = pos + v - 1
  const reach = Math.floor(v / 2)
  let best = v
  let bestGap = Infinity
  for (const to of t.cuts ?? t.chapters.map((c) => c.to)) {
    if (to < pos) continue
    const gap = Math.abs(to - end)
    if (gap <= reach && gap < bestGap) {
      best = to - pos + 1
      bestGap = gap
    }
  }
  return Math.min(Math.max(best, 1), left)
}

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
export function liveExpect(t: Task, recs: Recs, date: string, off?: OffFn): number {
  if (!inPeriod(t, date)) return 0
  const custom = customOf(t, date, off)

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
    if (ns && customOf(t, ns, off) === undefined) {
      delayed = Math.min(delayed, left)
      left -= delayed
    }
  }
  if (custom !== undefined) return Math.min(custom, left)
  if (sup !== null && wd === sup) return Math.min(delayed, left)
  if (!t.week[wd]) return 0
  if (!t.endDate) return snapToChapter(t, recs, date, Math.min(t.perDay, left), left)

  // 남은 분량(분량 변경한 날 몫 제외)을 남은 공부일 수로 올림 분배
  let customSum = 0
  let days = 0
  let sumW = 0
  for (let d = date; d <= t.endDate; d = addDays(d, 1)) {
    const c = customOf(t, d, off)
    if (c !== undefined) customSum += c
    else if (t.week[dow(d)] && dow(d) !== sup) { days++; sumW += dayW(t, d) }
  }
  const rest = Math.max(left - customSum, 0)
  const weighted = t.startPoint !== null && !!t.chapters?.some((c) => c.weight && c.weight !== 2)
  let v: number
  if (!t.dayWeights && !weighted) v = Math.min(days > 0 ? Math.ceil(rest / days) : 0, left)
  else if (days <= 1) v = Math.min(rest, left)
  else {
    const share = dayW(t, date) / sumW
    if (!weighted) v = Math.min(Math.ceil(rest * share - 1e-9), left)
    else {
      // 단원 무게: 남은 '노력'을 나누고, 오늘 몫의 노력만큼 쪽을 센다
      const pos = t.startPoint! + sumDone(recs, date)
      const target = effort(t, pos, pos + rest - 1) * share
      let acc = 0
      let n = 0
      while (n < rest && acc < target - 1e-9) { acc += factorAt(t, pos + n); n++ }
      v = Math.min(Math.max(n, 1), left)
    }
  }
  // 마지막 공부일엔 남은 분량을 그대로 둔다
  return days > 1 ? snapToChapter(t, recs, date, v, left) : v
}

/** 지난 날짜들의 목표를 고정한다. 바뀐 게 없으면 같은 객체를 돌려준다 */
export function rollForward(t: Task, recs: Recs, today: string, off?: OffFn): Recs {
  let out = recs
  const last = t.endDate && t.endDate < today ? t.endDate : addDays(today, -1)
  for (let d = t.startDate; d <= last; d = addDays(d, 1)) {
    if (t.completedDate && d > t.completedDate) break
    if (out[d]?.expect !== undefined) continue
    const e = liveExpect(t, out, d, off)
    if (e <= 0 && !out[d]) continue
    if (out === recs) out = { ...recs }
    out[d] = { ...(out[d] ?? { done: 0, sec: 0, checked: false }), expect: e }
  }
  return out
}

/** 오늘 이후 날짜별 예상 목표 (매일 목표를 채운다고 가정) */
export function futurePlan(t: Task, recs: Recs, today: string, off?: OffFn): Record<string, number> {
  const plan: Record<string, number> = {}
  if (t.type !== 'amount' || t.completed) return plan
  const sim: Recs = { ...recs }
  const last = t.endDate ?? addDays(today, 365)
  for (let d = today < t.startDate ? t.startDate : today; d <= last; d = addDays(d, 1)) {
    const e = liveExpect(t, sim, d, off)
    plan[d] = e
    const cur = sim[d]
    sim[d] = { done: Math.max(e, cur?.done ?? 0), sec: 0, checked: false, expect: e }
    if (sumDone(sim) >= t.amount) break
  }
  return plan
}

/** 화면에 보여줄 그 날의 목표 */
export function expectOn(t: Task, recs: Recs, date: string, today: string, plan?: Record<string, number>, off?: OffFn): number {
  if (date < today) return recs[date]?.expect ?? 0
  if (t.type !== 'amount' || date === today) return liveExpect(t, recs, date, off)
  return (plan ?? futurePlan(t, recs, today, off))[date] ?? 0
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

// ── 밀린 분량 정리 ─────────────────────────────────────────

/** from(포함)부터 today 전까지 목표에 못 미친 양 */
export function missedSince(recs: Recs, from: string, today: string) {
  let m = 0
  for (const d in recs) if (d >= from && d < today) m += Math.max((recs[d].expect ?? 0) - recs[d].done, 0)
  return m
}

/** 밀리지 않았다면 오늘 목표가 얼마였을지 (from~어제를 목표만큼 했다고 보고 계산) */
export function expectIfOnTrack(t: Task, recs: Recs, from: string, today: string, off?: OffFn) {
  const sim: Recs = { ...recs }
  for (const d in sim) if (d >= from && d < today) sim[d] = { ...sim[d], done: Math.max(sim[d].done, sim[d].expect ?? 0) }
  return liveExpect(t, sim, today, off)
}

/** '끝나는 날 늦추기': 오늘 목표가 target 이하가 되는 가장 이른 종료일 (1년 안에 없으면 null) */
export function extendEnd(t: Task, recs: Recs, today: string, target: number, off?: OffFn): string | null {
  if (t.type !== 'amount' || !t.endDate) return null
  for (let k = 0; k <= 366; k++) {
    const end = addDays(t.endDate, k)
    if (liveExpect({ ...t, endDate: end }, recs, today, off) <= target) return end
  }
  return null
}

/** 남은 공부일 하루 평균 (미리보기의 "하루 7.2쪽") */
export function avgPerDay(plan: Record<string, number>) {
  const v = Object.values(plan).filter((x) => x > 0)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0
}

// ── 진도 계산 ─────────────────────────────────────────────

/** 한 단위(쪽·문항·강)에 드는 예상 시간(초). 기록이 쌓이면 실제 속도를 쓴다 */
export function secPerUnit(t: Task, recs: Recs): number {
  let done = 0
  let sec = 0
  for (const d in recs) if (recs[d].done > 0 && recs[d].sec > 0) { done += recs[d].done; sec += recs[d].sec }
  if (done >= 5 && sec > 0) return sec / done
  if (t.kind === 'lecture') {
    const mins = (t.lectures ?? []).map((l) => l.min).filter((m): m is number => !!m)
    return mins.length ? (mins.reduce((a, b) => a + b, 0) / mins.length) * 60 : 30 * 60
  }
  if (t.bookMode === 'workbook') return (2 * 60) / (t.speed ?? 1)
  return (3 * 60) / (t.speed ?? 1)
}

/** 지금까지 한 범위가 [from, to] 범위와 겹치는 양 */
export function doneInRange(t: Task, recs: Recs, from: number, to: number) {
  const start = t.startPoint ?? 1
  const doneTo = start + sumDone(recs) - 1
  return Math.max(Math.min(doneTo, to) - Math.max(start, from) + 1, 0)
}

/** 지금 하고 있는 단원 (다 끝났으면 null) */
export function currentChapter(t: Task, recs: Recs): Chapter | null {
  if (!t.chapters?.length || t.startPoint === null) return null
  const pos = t.startPoint + sumDone(recs)
  return t.chapters.find((c) => c.to >= pos) ?? null
}
