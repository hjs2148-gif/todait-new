// 떠올리기(인출)와 간격 사다리.
// 단원을 끝내면 다음 날 처음 떠올려 보고, 결과에 따라 간격이 1 → 3 → 7 → 14 → 30일로 늘어난다.
// 잘: 한 칸 위 · 절반: 그 칸 그대로 · 흐릿: 맨 아래(1일). 30일 칸에서 또 잘이면 졸업(시험 전 한 번만 다시).
// 간격 숫자는 연구로 정해진 최적값이 아니라 제품의 출발값이다.
// 다음 복습일은 저장하지 않고 기록에서 매번 계산한다 (계획·시험일을 바꿔도 어긋나지 않게).
import { addDays } from './date.ts'
import { sumDone, type Chapter, type Grade, type Recall, type Recs, type Task } from './logic.ts'

export const STEPS = [1, 3, 7, 14, 30] as const
export const GRADE_WORD: Record<Grade, string> = { low: '흐릿', mid: '절반', high: '잘' }

export interface Ladder {
  /** STEPS의 몇 번째 칸 (다음 간격) */
  step: number
  graduated: boolean
  /** 마지막으로 떠올린 날 (없으면 단원 끝낸 날) */
  last: string
  lastGrade: Grade | null
  /** 연속 흐릿 횟수 */
  lowRun: number
  count: number
}

export const recallsOf = (c: Chapter): Recall[] => [...(c.recalls ?? [])].sort((a, b) => a.d.localeCompare(b.d))

export function ladder(c: Chapter): Ladder | null {
  if (!c.doneDate) return null
  const rs = recallsOf(c)
  let step = 0
  let graduated = false
  let lowRun = 0
  for (const r of rs) {
    if (r.g === 'high') {
      if (step >= STEPS.length - 1) graduated = true
      else step++
      lowRun = 0
    } else if (r.g === 'low') {
      step = 0
      graduated = false
      lowRun++
    } else lowRun = 0
  }
  const lastR = rs[rs.length - 1]
  return { step, graduated, last: lastR ? (lastR.d > c.doneDate ? lastR.d : c.doneDate) : c.doneDate, lastGrade: lastR?.g ?? null, lowRun, count: rs.length }
}

/** 이 결과를 고르면 다음 복습은 며칠 뒤인지 (졸업이면 null) */
export function gapAfter(c: Chapter, g: Grade): number | null {
  const l = ladder(c)
  const step = l?.step ?? 0
  if (g === 'low') return STEPS[0]
  if (g === 'mid') return STEPS[step]
  return step >= STEPS.length - 1 ? null : STEPS[step + 1]
}

/** 다음 복습일. 졸업했거나 아직 안 끝낸 단원이면 null.
 *  시험일(exam)을 주면: 다음 복습이 시험을 넘기면 시험 이틀 전으로 당기고, 졸업한 단원도 시험 전 일주일 안에 한 번 떠올리게 한다
 *  (기억해야 하는 기간에 맞춰 간격을 줄이는 쪽이 낫다는 연구에 기댄 제품 규칙) */
export function nextDue(c: Chapter, exam?: string | null): string | null {
  const l = ladder(c)
  if (!l) return null
  const pulled = c.pull && !recallsOf(c).some((r) => r.d >= c.pull!) ? c.pull : null
  const before = exam ? addDays(exam, -2) : null
  let due: string | null = l.graduated ? null : addDays(l.last, STEPS[l.step])
  if (before && l.last < before) {
    // 다음 복습이 시험을 넘기면 시험 이틀 전으로
    if (due !== null && due > before) due = before
    // 졸업한 단원은 시험 전 일주일 안에 한 번도 안 떠올렸을 때만
    if (due === null && l.last < addDays(exam!, -7)) due = before
  }
  if (pulled && (due === null || pulled < due)) due = pulled
  return due
}

/** 예전 기록(이해도 + 복습한 날)을 떠올리기 기록으로 옮긴다. 이미 recalls가 있으면 그대로 */
export function legacyRecalls(c: Chapter): Recall[] | undefined {
  if (c.recalls) return c.recalls
  if (!c.doneDate || (!c.grade && !c.reviews?.length)) return undefined
  const out: Recall[] = []
  if (c.grade) out.push({ d: c.doneDate, g: c.grade })
  for (const d of c.reviews ?? []) if (!out.some((r) => r.d === d)) out.push({ d, g: 'mid' })
  return out.sort((a, b) => a.d.localeCompare(b.d))
}

/** 같은 날 두 번 고르면 마지막 것만 남긴다 */
export const addRecall = (c: Chapter, d: string, g: Grade): Chapter => ({
  ...c,
  recalls: [...(c.recalls ?? []).filter((r) => r.d !== d), { d, g }],
  grade: g,
})

// ── 목차 없는 책·인강: 떠올리기 구간 ──

/** 떠올리기 대상: 목차가 있으면 단원, 없으면 자동 구간 */
export const reviewParts = (t: Task): Chapter[] => (t.chapters?.length ? t.chapters : t.units ?? [])
/** 목록에 붙이는 이름 앞부분: 단원이면 'N단원 ', 구간이면 없음(이름에 범위가 있다) */
export const partNo = (t: Task, i: number) => (t.chapters?.length ? `${i + 1}단원 ` : '')

/** 구간 크기: 인강 3강, 문제집 25문항, 책 15쪽. 구간은 최대 20개 */
export function unitSize(t: Task): number {
  const base = t.kind === 'lecture' ? 3 : t.bookMode === 'workbook' || /문항|문제/.test(t.unit) ? 25 : 15
  return Math.max(base, Math.ceil(t.amount / 20))
}

/** 구간을 나누고, 오늘까지 지나간 구간에 끝낸 날을 적는다.
 *  처음 나눌 때 어제까지 이미 지나간 구간은 old로 두어 한꺼번에 복습이 쏟아지지 않게 한다 */
export function syncUnits(t: Task, recs: Recs, date: string): Chapter[] | undefined {
  if (t.chapters?.length || t.type !== 'amount' || (t.kind !== 'book' && t.kind !== 'lecture') || t.roundOf || t.amount <= 0) return t.units
  const start = t.startPoint ?? 1
  const pos = start + sumDone(recs) - 1
  let units = t.units
  if (!units) {
    const before = start + sumDone(recs, date) - 1
    const size = unitSize(t)
    const unit = t.kind === 'lecture' ? '강' : t.unit
    units = []
    for (let from = start; from < start + t.amount; from += size) {
      const to = Math.min(from + size - 1, start + t.amount - 1)
      const title = t.kind === 'lecture' ? t.lectures?.[from - start]?.title : undefined
      units.push({ id: `u${from}`, name: `${from}~${to}${unit}${title ? ` · ${title}` : ''}`, from, to, ...(to <= before ? { old: true } : {}) })
    }
  }
  const next = units.map((u) => (u.old ? u : u.to <= pos ? (u.doneDate ? u : { ...u, doneDate: date }) : u.doneDate && !u.recalls?.length ? { ...u, doneDate: undefined } : u))
  return next.some((u, i) => u !== units![i]) || !t.units ? next : t.units
}
