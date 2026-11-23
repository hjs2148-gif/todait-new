// 가능 시간에 맞춰 나눠 담기: 여러 계획이 앱 전체 공부 가능 시간을 나눠 쓴다.
// 넘치는 날은 마감이 먼 계획부터 분량을 뒤로 옮긴다. 마감이 가까운 계획(3일 안), 직접 정한 날(custom), 오늘과 지난 날은 건드리지 않는다.
// React와 무관한 순수 코드.
import { addDays, diffDays } from './date.ts'
import { futurePlan, liveExpect, type OffFn, type Recs, type Task } from './logic.ts'

export interface Move { taskId: string; date: string; from: number; to: number }
export interface BalanceIn {
  tasks: Task[]
  recs: Record<string, Recs>
  offOf: (t: Task) => OffFn | undefined
  /** 그 날 공부 가능 시간(분). 0이면 모르는 날로 보고 건드리지 않는다 */
  capOf: (date: string) => number
  /** 1단위에 드는 초 */
  spu: (t: Task) => number
  today: string
  horizon?: number
}
export interface BalanceOut {
  /** 계획별 엔진이 정한 분량 (오늘 뒤 날짜만) */
  fit: Record<string, Record<string, number>>
  /** 계획별 줄인 날의 원래 분량 */
  from: Record<string, Record<string, number>>
  moves: Move[]
  /** 옮겨도 가능 시간을 넘는 날 */
  over: string[]
  /** 날짜별 쓰는 시간(분), 옮긴 뒤 */
  load: Record<string, number>
}

const keepPast = (fit: Record<string, number> | undefined, today: string) => {
  const out: Record<string, number> = {}
  for (const d in fit ?? {}) if (d <= today) out[d] = fit![d]
  return out
}
const active = (t: Task) => !t.completed && !t.archived

export function balance(inp: BalanceIn): BalanceOut {
  const { recs, offOf, capOf, spu, today } = inp
  const H = inp.horizon ?? 60
  // 예전에 정한 미래 몫은 지우고 다시 계산한다
  const tasks = inp.tasks.filter(active).map((t) => ({ ...t, fit: keepPast(t.fit, today), fitFrom: keepPast(t.fitFrom, today) }))
  const plans = new Map<string, Record<string, number>>()
  const planFor = (t: Task) => futurePlan(t, recs[t.id] ?? {}, today, offOf(t))
  for (const t of tasks) if (t.type === 'amount') plans.set(t.id, planFor(t))
  const fixedMin = (d: string) => tasks.reduce((a, t) => (t.type === 'time' ? a + liveExpect(t, recs[t.id] ?? {}, d, offOf(t)) / 60 : a), 0)
  const loadOn = (d: string) => fixedMin(d) + tasks.reduce((a, t) => a + ((plans.get(t.id)?.[d] ?? 0) * spu(t)) / 60, 0)
  const fit: Record<string, Record<string, number>> = {}
  const from: Record<string, Record<string, number>> = {}
  const moves: Move[] = []
  const over: string[] = []
  const load: Record<string, number> = {}
  for (let i = 1; i <= H; i++) {
    const d = addDays(today, i)
    const cap = capOf(d)
    let l = loadOn(d)
    if (cap > 0 && l > cap + 1) {
      const cands = tasks
        .filter((t) => t.type === 'amount' && t.endDate && (plans.get(t.id)?.[d] ?? 0) > 0 && t.custom[d] === undefined && diffDays(d, t.endDate) >= 3)
        .sort((a, b) => b.endDate!.localeCompare(a.endDate!) || (plans.get(b.id)![d] - plans.get(a.id)![d]))
      for (const t of cands) {
        if (l <= cap + 1) break
        const p = plans.get(t.id)!
        const cut = Math.min(p[d], Math.ceil(((l - cap) * 60) / spu(t)))
        if (cut <= 0) continue
        // 앞 날짜는 지금 값으로 묶어 두고, 줄인 몫은 뒤 날짜로 간다
        const f = (fit[t.id] ??= {})
        for (let e = addDays(today, 1); e < d; e = addDays(e, 1)) if ((p[e] ?? 0) > 0 && t.custom[e] === undefined && f[e] === undefined) f[e] = p[e]
        f[d] = p[d] - cut
        ;(from[t.id] ??= {})[d] = (from[t.id][d] ?? p[d])
        moves.push({ taskId: t.id, date: d, from: p[d], to: p[d] - cut })
        t.fit = { ...t.fit, ...f }
        plans.set(t.id, planFor(t))
        l = loadOn(d)
      }
      if (l > cap + 1) over.push(d)
    }
    load[d] = Math.round(l)
  }
  return { fit, from, moves, over, load }
}

/** 상태의 계획들에 balance 결과를 적용한다. 바뀐 게 없으면 같은 배열 */
export function applyBalance(tasks: Task[], out: BalanceOut, today: string): Task[] {
  let changed = false
  const next = tasks.map((t) => {
    if (!active(t)) return t
    const fit = { ...keepPast(t.fit, today), ...(out.fit[t.id] ?? {}) }
    const fitFrom = { ...keepPast(t.fitFrom, today), ...(out.from[t.id] ?? {}) }
    const same = JSON.stringify(fit) === JSON.stringify(t.fit ?? {}) && JSON.stringify(fitFrom) === JSON.stringify(t.fitFrom ?? {})
    if (same) return t
    changed = true
    const r: Task = { ...t, fit, fitFrom }
    if (!Object.keys(fit).length) delete r.fit
    if (!Object.keys(fitFrom).length) delete r.fitFrom
    return r
  })
  return changed ? next : tasks
}
