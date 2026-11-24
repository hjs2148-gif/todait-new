// 떠올리기(인출)와 간격 사다리.
// 단원을 끝내면 다음 날 처음 떠올려 보고, 결과에 따라 간격이 1 → 3 → 7 → 14 → 30일로 늘어난다.
// 잘: 한 칸 위 · 절반: 그 칸 그대로 · 흐릿: 맨 아래(1일). 30일 칸에서 또 잘이면 졸업(시험 전 한 번만 다시).
// 간격 숫자는 연구로 정해진 최적값이 아니라 제품의 출발값이다.
// 다음 복습일은 저장하지 않고 기록에서 매번 계산한다 (계획·시험일을 바꿔도 어긋나지 않게).
import { addDays } from './date.ts'
import type { Chapter, Grade, Recall } from './logic.ts'

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

/** 다음 복습일. 졸업했거나 아직 안 끝낸 단원이면 null */
export function nextDue(c: Chapter): string | null {
  const l = ladder(c)
  if (!l) return null
  const pulled = c.pull && !recallsOf(c).some((r) => r.d >= c.pull!) ? c.pull : null
  if (l.graduated) return pulled
  const due = addDays(l.last, STEPS[l.step])
  return pulled && pulled < due ? pulled : due
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
