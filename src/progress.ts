// 진도 탭·진도 자세히가 쓰는 계산. React·IndexedDB와 무관해 node 테스트에서 바로 쓴다.
// 원칙: %에는 늘 이름을 붙인다. 여기 숫자는 모두 "범위 진도"(분량 기준, 계획끼리는 예상 공부 시간 비중).
import { ladder, nextDue } from './recall.ts'
import { addDays, diffDays, dow } from './date.ts'
import { doneInRange, futurePlan, secPerUnit, sumDone, type Chapter, type Grade, type OffFn, type Recs, type Task } from './logic.ts'
import { offFor, type Exam, type State } from './model.ts'

/** 진도 탭에 나오는 계획: 끝이 있는 책·인강 */
export const isProgressTask = (t: Task) => t.type === 'amount' && (t.kind === 'book' || t.kind === 'lecture')

/** 그 날 이 계획을 공부하는 날인지 (요일·쉬는 날·분량 0으로 바꾼 날 반영) */
export function isStudyDay(t: Task, d: string, off?: OffFn) {
  if (d < t.startDate) return false
  if (t.custom[d] !== undefined) return t.custom[d] > 0
  if (off?.(d)) return false
  return t.week[dow(d)] && dow(d) !== t.supplementDow
}

/** 오늘 전까지 예정된 양 (지난 날의 고정된 목표 합) */
export function plannedBefore(recs: Recs, today: string) {
  let p = 0
  for (const d in recs) if (d < today) p += recs[d].expect ?? 0
  return p
}

/** 계획대로 하면 끝나는 날. 이미 끝났으면 끝난 날 */
export function planEnd(t: Task, recs: Recs, today: string, off?: OffFn): string | null {
  if (t.completed) return t.completedDate
  if (sumDone(recs) >= t.amount) return today
  const plan = futurePlan(t, recs, today, off)
  let last: string | null = null
  let acc = sumDone(recs)
  for (const d of Object.keys(plan).sort()) {
    if (plan[d] > 0) { last = d; acc += plan[d] }
  }
  return acc >= t.amount ? last : null
}

/** 최근 7일(오늘 제외) 공부일 하루 평균 */
export function recentPace(t: Task, recs: Recs, today: string, off?: OffFn) {
  let done = 0
  let days = 0
  for (let i = 1; i <= 7; i++) {
    const d = addDays(today, -i)
    if (d < t.startDate) break
    done += recs[d]?.done ?? 0
    if (isStudyDay(t, d, off) || (recs[d]?.done ?? 0) > 0) days++
  }
  return days > 0 ? done / days : null
}

/** 하루 perDay씩 공부일마다 하면 언제 끝나는지 (오늘 포함). 2년 안에 안 끝나면 null */
export function projectEnd(t: Task, remaining: number, perDay: number, today: string, off?: OffFn): string | null {
  if (remaining <= 0) return today
  if (perDay <= 0) return null
  let left = remaining
  for (let i = 0, d = today; i < 730; i++, d = addDays(d, 1)) {
    if (!isStudyDay(t, d, off)) continue
    left -= perDay
    if (left <= 1e-9) return d
  }
  return null
}

/** from~to(포함) 사이 공부일 수 */
export function studyDaysBetween(t: Task, from: string, to: string, off?: OffFn) {
  let n = 0
  for (let d = from; d <= to; d = addDays(d, 1)) if (isStudyDay(t, d, off)) n++
  return n
}

/** 시험 범위를 끝내야 하는 마지막 날 (비워 둘 날 전날) */
export const examDeadline = (e: Exam) => addDays(e.date, -(e.blankDays + 1))

export interface PlanProgress {
  task: Task
  done: number
  total: number
  rate: number
  /** 오늘 위치로 예정된 양 (지난 날 목표 합) */
  planned: number
  /** 예정보다 뒤처진 양 (음수면 앞섬) */
  behind: number
  planEnd: string | null
  pace: number | null
  paceEnd: string | null
  /** 지금 하고 있는 단원 */
  chapter: Chapter | null
  /** 시험 마감과 비교: 시험 전 끝남 / 늦어짐 / 시험 없음 */
  vsExam: 'ok' | 'late' | null
  /** 늦어질 때: 시험 전에 끝내려면 하루에 얼마 (올림) */
  needPerDay: number | null
  needEnd: string | null
}

export function planProgress(s: Pick<State, 'exams' | 'settings' | 'recs'>, t: Task, today: string, exam?: Exam | null): PlanProgress {
  const recs = s.recs[t.id] ?? {}
  const off = offFor(s, t)
  const done = Math.min(sumDone(recs), t.amount)
  const planned = Math.min(plannedBefore(recs, today), t.amount)
  const end = planEnd(t, recs, today, off)
  const pace = recentPace(t, recs, today, off)
  const remaining = t.amount - done
  const paceEnd = pace ? projectEnd(t, remaining, pace, today, off) : null
  const pos = (t.startPoint ?? 1) + done
  const chapter = t.chapters?.find((c) => c.to >= pos) ?? null
  let vsExam: PlanProgress['vsExam'] = null
  let needPerDay: number | null = null
  let needEnd: string | null = null
  if (exam && (exam.scope.length === 0 || exam.scope.some((x) => x.taskId === t.id))) {
    const dl = examDeadline(exam)
    vsExam = end && end <= dl ? 'ok' : 'late'
    if (vsExam === 'late' && remaining > 0) {
      const days = studyDaysBetween(t, today, dl, off)
      if (days > 0) {
        needPerDay = Math.ceil(remaining / days)
        needEnd = projectEnd(t, remaining, needPerDay, today, off)
      }
    }
  }
  return {
    task: t, done, total: t.amount, rate: t.amount ? done / t.amount : 0, planned, behind: planned - done,
    planEnd: end, pace, paceEnd, chapter, vsExam, needPerDay, needEnd,
  }
}

// ── 시험 범위 진도 ─────────────────────────────────────────

function overlap(start: number, n: number, from: number | null, to: number | null) {
  if (from === null || to === null) return n
  return Math.max(Math.min(start + n - 1, to) - Math.max(start, from) + 1, 0)
}

/** 시험 범위에 든 계획 (범위를 고르지 않았으면 진행 중인 책·인강 전부) */
export const examScope = (s: Pick<State, 'tasks'>, exam: Exam) =>
  exam.scope.length
    ? exam.scope
    : s.tasks.filter((t) => isProgressTask(t) && !t.archived && !t.completed).map((t) => ({ taskId: t.id, from: null, to: null }))

/** 시험 범위의 진도와 예정 위치(0~1). 계획끼리는 예상 공부 시간(분량 × 한 단위 시간) 비중으로 합친다 */
export function examProgress(s: Pick<State, 'tasks' | 'recs'>, exam: Exam, today: string) {
  const scope = examScope(s, exam)
  let total = 0
  let done = 0
  let planned = 0
  let n = 0
  for (const sc of scope) {
    const t = s.tasks.find((x) => x.id === sc.taskId)
    if (!t || t.type !== 'amount') continue
    const recs: Recs = s.recs[t.id] ?? {}
    const w = secPerUnit(t, recs)
    const start = t.startPoint ?? 1
    const len = overlap(start, t.amount, sc.from, sc.to)
    if (len <= 0) continue
    const past = plannedBefore(recs, today)
    const doneN = sc.from === null || sc.to === null ? Math.min(sumDone(recs), t.amount) : doneInRange(t, recs, sc.from, sc.to)
    const planN = sc.from === null ? Math.min(past, t.amount) : overlap(start, Math.min(past, t.amount), sc.from, sc.to)
    total += len * w
    done += Math.min(doneN, len) * w
    planned += Math.min(planN, len) * w
    n++
  }
  return total > 0 ? { done: done / total, planned: planned / total, days: diffDays(today, exam.date), tasks: n } : null
}

// ── 복습 ──────────────────────────────────────────────────

export interface ReviewItem { task: Task; chapter: Chapter; index: number; since: string; days: number; due: string; step: number; lastGrade: Grade | null; lowRun: number }

const LAST_ORDER: Record<Grade | 'none', number> = { low: 0, none: 1, mid: 2, high: 3 }

/** 오늘(까지) 복습할 단원: 떠올리기 사다리로 다음 복습일이 된 단원. 지난번 흐릿 → 처음 → 절반 → 잘, 같으면 오래 밀린 순 */
export function reviewDue(tasks: Task[], today: string): ReviewItem[] {
  const out: ReviewItem[] = []
  for (const t of tasks) {
    if (t.archived) continue
    t.chapters?.forEach((c, index) => {
      const due = nextDue(c)
      if (!due || due > today) return
      const l = ladder(c)!
      out.push({ task: t, chapter: c, index, since: l.last, days: diffDays(l.last, today), due, step: l.step, lastGrade: l.lastGrade, lowRun: l.lowRun })
    })
  }
  return out.sort((a, b) => LAST_ORDER[a.lastGrade ?? 'none'] - LAST_ORDER[b.lastGrade ?? 'none'] || a.due.localeCompare(b.due))
}

// ── 쌓은 것 ───────────────────────────────────────────────

/** 이번 달(1일~오늘)에 쌓은 양: 단위별 합 + 끝낸 단원 수 */
export function monthStack(s: Pick<State, 'tasks' | 'recs'>, today: string) {
  const first = today.slice(0, 8) + '01'
  const units = new Map<string, { unit: string; amount: number; taskId: string }>()
  let chapters = 0
  for (const t of s.tasks) {
    if (!isProgressTask(t)) continue
    const recs = s.recs[t.id] ?? {}
    let sum = 0
    for (const d in recs) if (d >= first && d <= today) sum += recs[d].done
    if (sum > 0) {
      const u = t.unit || '개'
      const cur = units.get(u) ?? { unit: u, amount: 0, taskId: t.id }
      cur.amount += sum
      units.set(u, cur)
    }
    chapters += t.chapters?.filter((c) => c.doneDate && c.doneDate >= first && c.doneDate <= today).length ?? 0
  }
  return { units: [...units.values()].sort((a, b) => b.amount - a.amount), chapters, days: Number(today.slice(8)) }
}

/** 계획에 쌓인 전체 공부 시간(초) */
export const taskSec = (recs: Recs) => Object.values(recs).reduce((a, r) => a + r.sec, 0)

/** 끝낸 단원의 평균 이해도 */
export function avgGrade(t: Task): Grade | null {
  const g = (t.chapters ?? []).map((c) => c.grade).filter((x): x is Grade => !!x)
  if (!g.length) return null
  const v = g.reduce((a, x) => a + (x === 'high' ? 3 : x === 'mid' ? 2 : 1), 0) / g.length
  return v >= 2.5 ? 'high' : v >= 1.5 ? 'mid' : 'low'
}

// ── 단원 지도 ─────────────────────────────────────────────

export interface ChapterSpan { chapter: Chapter; start: string | null; end: string | null; days: number | null; planned: boolean; doneIn: number }

/** 단원마다 실제로(또는 계획상) 시작한 날·끝난 날 */
export function chapterSpans(t: Task, recs: Recs, today: string, off?: OffFn): ChapterSpan[] {
  if (!t.chapters?.length) return []
  const start = t.startPoint ?? 1
  const past = Object.keys(recs).filter((d) => recs[d].done > 0).sort()
  const plan = futurePlan(t, recs, today, off)
  // 날짜별 누적 위치 (지난 기록 + 앞으로의 계획)
  const steps: { d: string; to: number; planned: boolean }[] = []
  let acc = 0
  for (const d of past) { if (d >= today) continue; acc += recs[d].done; steps.push({ d, to: start + acc - 1, planned: false }) }
  const todayDone = recs[today]?.done ?? 0
  if (todayDone > 0) { acc += todayDone; steps.push({ d: today, to: start + acc - 1, planned: false }) }
  for (const d of Object.keys(plan).sort()) {
    const add = d === today ? Math.max(plan[d] - todayDone, 0) : plan[d]
    if (add <= 0) continue
    acc += add
    steps.push({ d, to: start + acc - 1, planned: true })
  }
  const doneTo = start + sumDone(recs) - 1
  return t.chapters.map((c) => {
    let s: (typeof steps)[number] | undefined
    let e: (typeof steps)[number] | undefined
    let prevTo = start - 1
    for (const st of steps) {
      if (!s && st.to >= c.from && prevTo < c.to) s = st
      if (!e && st.to >= c.to) { e = st; break }
      prevTo = st.to
    }
    const end = c.doneDate ?? e?.d ?? null
    const begin = s?.d ?? null
    return {
      chapter: c, start: begin, end,
      days: begin && end ? diffDays(begin, end) + 1 : null,
      planned: !c.doneDate && (!e || e.planned),
      doneIn: Math.max(Math.min(doneTo, c.to) - c.from + 1, 0),
    }
  })
}


/** "끝나는 날을 비워 둘 날 전으로 맞추기": 범위에 든 책·인강마다 새 끝나는 날과 하루 분량 변화 */
export function fitPreview(s: Pick<State, 'tasks' | 'recs' | 'exams' | 'settings'>, exam: Exam, today: string) {
  const dl = examDeadline(exam)
  const out: { task: Task; end: string | null; newEnd: string; perDayNow: number; perDayNew: number; same: boolean }[] = []
  for (const sc of examScope(s, exam)) {
    const t = s.tasks.find((x) => x.id === sc.taskId)
    if (!t || !isProgressTask(t) || t.completed) continue
    const recs = s.recs[t.id] ?? {}
    const off = offFor(s, t)
    const left = Math.max(t.amount - sumDone(recs), 0)
    const now = t.endDate ? studyDaysBetween(t, today, t.endDate, off) : 0
    const next = studyDaysBetween(t, today, dl, off)
    out.push({
      // 이미 마감 전에 끝나는 계획은 그대로 둔다 (늦게 끝나는 것만 당긴다)
      task: t, end: t.endDate, newEnd: dl, same: t.endDate !== null && t.endDate <= dl,
      perDayNow: now > 0 ? Math.ceil(left / now) : 0, perDayNew: next > 0 ? Math.ceil(left / next) : 0,
    })
  }
  return out
}
