// 통계·캘린더 계산. React·IndexedDB와 무관한 순수 코드.
// 원칙: %에는 늘 이름을 붙인다. 여기서는 시간(초), 목표 개수(끝낸/전체), 범위 진도를 섞지 않는다.
import { addDays, diffDays, dow } from './date.ts'
import { futurePlan, liveExpect, rateOf, type Task } from './logic.ts'
import { offFor, type State, type TimeHistory } from './model.ts'

const visible = (t: Task, d: string) =>
  !t.archived && d >= t.startDate && (!t.endDate || d <= t.endDate) && (!t.completedDate || d <= t.completedDate)

/** 그 날의 목표 (지난 날은 고정된 값, 오늘은 지금 계산) */
export function expectOf(s: State, t: Task, d: string, today: string) {
  if (d > today) return 0
  if (d < today) return s.recs[t.id]?.[d]?.expect ?? 0
  return liveExpect(t, s.recs[t.id] ?? {}, d, offFor(s, t))
}

/** 그 날 목표 개수와 끝낸 개수 */
export function dayGoals(s: State, d: string, today: string) {
  let total = 0
  let done = 0
  for (const t of s.tasks) {
    if (!visible(t, d)) continue
    const e = expectOf(s, t, d, today)
    if (e <= 0) continue
    total++
    if (rateOf(t, s.recs[t.id]?.[d], e) >= 1) done++
  }
  return { total, done }
}

export const secOn = (s: State, d: string) => {
  let sec = 0
  for (const id in s.recs) sec += s.recs[id][d]?.sec ?? 0
  return sec
}

export const datesBetween = (from: string, to: string) => {
  const out: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

/** 가장 이른 기록 날짜 (없으면 today) */
export function firstRecord(s: State, today: string) {
  let first = today
  for (const id in s.recs) for (const k in s.recs[id]) if (k < first && (s.recs[id][k].sec > 0 || s.recs[id][k].done > 0)) first = k
  return first
}

export interface Period { from: string; to: string; days: number }
export type PeriodKind = 'week' | 'month' | 'exam'
/** 이번 주(최근 7일)·이번 달(최근 30일)·시험까지(첫 기록부터 오늘) */
export function periodOf(kind: PeriodKind, today: string, first: string): Period {
  const days = kind === 'week' ? 7 : kind === 'month' ? 30 : Math.max(diffDays(first, today) + 1, 1)
  return { from: addDays(today, -(days - 1)), to: today, days }
}
export const prevPeriod = (p: Period): Period => ({ from: addDays(p.from, -p.days), to: addDays(p.from, -1), days: p.days })

export const totalSec = (s: State, p: Period) => datesBetween(p.from, p.to).reduce((a, d) => a + secOn(s, d), 0)

/** 과목(카테고리)별 공부 시간, 날짜별 쌓은 막대용 */
export function subjectSplit(s: State, p: Period) {
  const by = new Map<string, { key: string; name: string; color: string | null; sec: number }>()
  for (const t of s.tasks) {
    let sec = 0
    for (const d of datesBetween(p.from, p.to)) sec += s.recs[t.id]?.[d]?.sec ?? 0
    if (sec <= 0) continue
    const c = s.categories.find((x) => x.id === t.categoryId)
    const key = c?.id ?? '_'
    const cur = by.get(key) ?? { key, name: c?.name ?? '기타', color: c?.color ?? null, sec: 0 }
    cur.sec += sec
    by.set(key, cur)
  }
  return [...by.values()].sort((a, b) => b.sec - a.sec)
}

/** 날짜 × 과목 공부 시간 (과목 키는 카테고리 id) */
export function secByDaySubject(s: State, d: string) {
  const out: Record<string, number> = {}
  for (const t of s.tasks) {
    const sec = s.recs[t.id]?.[d]?.sec ?? 0
    if (sec > 0) out[t.categoryId ?? '_'] = (out[t.categoryId ?? '_'] ?? 0) + sec
  }
  return out
}

export function goalTotals(s: State, p: Period, today: string) {
  let total = 0
  let done = 0
  for (const d of datesBetween(p.from, p.to)) { const g = dayGoals(s, d, today); total += g.total; done += g.done }
  return { total, done, rate: total ? done / total : null }
}

const dur = (h: TimeHistory) => Math.max(Math.round((h.endedAt - h.startedAt) / 1000), 0)

/** 한 번에 가장 오래 공부한 기록들 (긴 순) */
export function longestFocus(s: State, p: Period, n = 5) {
  return s.histories
    .filter((h) => h.date >= p.from && h.date <= p.to && dur(h) > 0)
    .map((h) => ({ h, sec: dur(h), task: s.tasks.find((t) => t.id === h.taskId) }))
    .sort((a, b) => b.sec - a.sec)
    .slice(0, n)
}

/** 집중 시간대: 요일(0=일)×시(0~23) 공부 분. 시간 기록(histories)을 시 단위로 쪼갠다 */
export function hourHeat(s: State, p: Period) {
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0) as number[])
  for (const h of s.histories) {
    if (h.date < p.from || h.date > p.to) continue
    for (let t = h.startedAt; t < h.endedAt; ) {
      const dt = new Date(t)
      const next = Math.min(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours() + 1).getTime(), h.endedAt)
      grid[dt.getDay()][dt.getHours()] += (next - t) / 60000
      t = next
    }
  }
  return grid
}

/** 가장 집중하는 3시간 구간의 시작 시(0~21) */
export function bestWindow(grid: number[][]) {
  const byHour = Array(24).fill(0) as number[]
  for (const row of grid) row.forEach((v, h) => (byHour[h] += v))
  let best = -1
  let bestH = 0
  for (let h = 0; h < 22; h++) {
    const v = byHour[h] + byHour[h + 1] + byHour[h + 2]
    if (v > best) { best = v; bestH = h }
  }
  return best > 0 ? bestH : null
}

/** 요일별 평균 공부 시간(초) */
export function weekdayAvg(s: State, p: Period) {
  const sum = Array(7).fill(0) as number[]
  const cnt = Array(7).fill(0) as number[]
  for (const d of datesBetween(p.from, p.to)) { sum[dow(d)] += secOn(s, d); cnt[dow(d)]++ }
  return sum.map((v, i) => (cnt[i] ? v / cnt[i] : 0))
}

/** 일주일 단위 목표 달성(개수 기준) 추이, 오래된 주부터 */
export function weeklyGoalTrend(s: State, today: string, weeks: number) {
  return Array.from({ length: weeks }, (_, i) => {
    const to = addDays(today, -7 * (weeks - 1 - i))
    const g = goalTotals(s, { from: addDays(to, -6), to, days: 7 }, today)
    return g.rate
  })
}

/** 공부 잔디 단계 0~4 (그날 시간 / 그 기간 하루 최대) */
export const grassLevel = (sec: number, max: number) => (sec <= 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((sec / Math.max(max, 1)) * 4))))

/** 최고 연속 공부일 수 (하루 minSec 이상, 쉬는 날은 끊지 않음) */
export function bestStreak(s: State, today: string, minSec: number) {
  let best = 0
  let run = 0
  for (const d of datesBetween(firstRecord(s, today), today)) {
    if (d in s.settings.restDays) continue
    run = secOn(s, d) >= minSec ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

/** 기간 안에 끝낸 단원 */
export function finishedChapters(s: State, p: Period) {
  const out: { task: Task; name: string; grade?: string; date: string }[] = []
  for (const t of s.tasks) for (const c of t.chapters ?? []) if (c.doneDate && c.doneDate >= p.from && c.doneDate <= p.to) out.push({ task: t, name: c.name, grade: c.grade, date: c.doneDate })
  return out.sort((a, b) => b.date.localeCompare(a.date))
}

/** 계획별 기간 합계: 한 양 / 목표 (시간 계획은 초) */
export function planTotals(s: State, p: Period, today: string) {
  return s.tasks
    .filter((t) => t.type === 'amount' || t.type === 'time')
    .map((t) => {
      let got = 0
      let goal = 0
      for (const d of datesBetween(p.from, p.to)) {
        const r = s.recs[t.id]?.[d]
        goal += expectOf(s, t, d, today)
        got += t.type === 'time' ? r?.sec ?? 0 : r?.done ?? 0
      }
      return { task: t, got, goal }
    })
    .filter((x) => x.goal > 0 || x.got > 0)
}

/** 날짜 하나의 계획별 요약 (캘린더·지난 기록용) */
export function dayRows(s: State, d: string, today: string) {
  const rows: { task: Task; expect: number; done: number; sec: number; checked: boolean; rate: number }[] = []
  for (const t of s.tasks) {
    if (!visible(t, d) && !(s.recs[t.id]?.[d])) continue
    const r = s.recs[t.id]?.[d]
    const e = expectOf(s, t, d, today)
    if (e <= 0 && !(r && (r.done > 0 || r.sec > 0 || r.checked))) continue
    rows.push({ task: t, expect: e, done: r?.done ?? 0, sec: r?.sec ?? 0, checked: !!r?.checked, rate: rateOf(t, r, e) })
  }
  return rows.sort((a, b) => a.task.order - b.task.order)
}

/** 그 날 단원을 시작한 계획 (캘린더 점) */
export function chapterStartsOn(s: State, d: string) {
  const out: Task[] = []
  for (const t of s.tasks) {
    if (!t.chapters?.length || t.startPoint === null) continue
    const recs = s.recs[t.id] ?? {}
    let before = 0
    for (const k in recs) if (k < d) before += recs[k].done
    const pos = t.startPoint + before
    const today = recs[d]?.done ?? 0
    if (today > 0 && t.chapters.some((c) => c.from === pos)) out.push(t)
  }
  return out
}

/** 하루 최고 기록(초): date 전까지 */
export function bestDaySecBefore(s: State, date: string, today: string) {
  let best = 0
  for (const d of datesBetween(firstRecord(s, today), addDays(date, -1))) best = Math.max(best, secOn(s, d))
  return best
}

/** 그 주(월~일)의 월요일 */
export const mondayOf = (d: string) => addDays(d, -((dow(d) + 6) % 7))

/** 지난주 요약: 월요일 오늘 탭 맨 위 카드용 */
export function lastWeekSummary(s: State, today: string) {
  const to = addDays(mondayOf(today), -1)
  const p: Period = { from: addDays(to, -6), to, days: 7 }
  const g = goalTotals(s, p, today)
  const units = new Map<string, number>()
  for (const t of s.tasks) {
    if (t.type !== 'amount') continue
    let n = 0
    for (const d of datesBetween(p.from, p.to)) n += s.recs[t.id]?.[d]?.done ?? 0
    if (n > 0) units.set(t.unit || '개', (units.get(t.unit || '개') ?? 0) + n)
  }
  let missed = new Map<string, number>()
  for (const t of s.tasks) {
    if (t.type !== 'amount' || t.completed || t.archived) continue
    let m = 0
    for (const d of datesBetween(p.from, p.to)) { const r = s.recs[t.id]?.[d]; if (r) m += Math.max((r.expect ?? 0) - r.done, 0) }
    if (m > 0) missed.set(t.unit || '개', (missed.get(t.unit || '개') ?? 0) + m)
  }
  return {
    period: p, rate: g.rate, sec: totalSec(s, p), goalTotal: g.total,
    units: [...units].map(([unit, n]) => ({ unit, n })), missed: [...missed].map(([unit, n]) => ({ unit, n })),
    chapters: finishedChapters(s, p).length,
  }
}

/** 이번 주(월~일) 계획별 목표: 하루 평균(공부하는 날 기준)과 합계. 시간 계획은 초 */
export function weekTargets(s: State, today: string) {
  const mon = mondayOf(today)
  const week = datesBetween(mon, addDays(mon, 6))
  const out: { task: Task; perDay: number; total: number }[] = []
  for (const t of s.tasks) {
    if (t.archived || t.completed || (t.type !== 'amount' && t.type !== 'time')) continue
    const recs = s.recs[t.id] ?? {}
    const off = offFor(s, t)
    const plan = t.type === 'amount' ? futurePlan(t, recs, today, off) : {}
    let total = 0
    let days = 0
    for (const d of week) {
      if (!visible(t, d)) continue
      const e = d <= today ? expectOf(s, t, d, today) : t.type === 'amount' ? plan[d] ?? 0 : liveExpect(t, recs, d, off)
      if (e > 0) { total += e; days++ }
    }
    if (total > 0) out.push({ task: t, perDay: Math.ceil(total / days), total })
  }
  return out.sort((a, b) => a.task.order - b.task.order)
}

/** 하루 타임라인(6~24시): 시간 기록을 6시 기준 0~1 구간으로 */
export function dayTimeline(s: State, date: string) {
  const day0 = new Date(date.replace(/-/g, '/') + ' 00:00:00').getTime()
  const from = day0 + 6 * 3600000
  const span = 18 * 3600000
  const out: { id: string; taskId: string; left: number; width: number }[] = []
  for (const h of s.histories) {
    if (h.date !== date) continue
    const a = Math.max(h.startedAt, from)
    const b = Math.min(h.endedAt, from + span)
    if (b > a) out.push({ id: h.id, taskId: h.taskId, left: (a - from) / span, width: (b - a) / span })
  }
  return out.sort((x, y) => x.left - y.left)
}

/** 단원에 든 공부 시간(초): 시작한 날부터 끝낸 날까지 쪽을 한 날들의 합 */
export function chapterSec(t: Task, recs: State['recs'][string], start: string | null, end: string | null) {
  if (!start || !end) return 0
  let sec = 0
  for (const d in recs) if (d >= start && d <= end) sec += recs[d].sec
  return sec
}

