// 화면에서 공통으로 쓰는 계산.
import { fmtDur, todayISO } from './date.ts'
import { expectOn, rateOf, sumDone, type DayRec, type Task } from './logic.ts'
import { offFor, planOf, subjectVar, type State } from './store.ts'

export interface Item { task: Task; rec: DayRec | undefined; expect: number; rate: number }

const visibleOn = (t: Task, date: string) =>
  !t.archived && date >= t.startDate && (!t.endDate || date <= t.endDate) && (!t.completedDate || date <= t.completedDate)

/** 그 날짜에 해당하는 계획들. active = 그 날 할 계획, resting = 기간 중이지만 쉬는 계획 */
export function itemsOn(s: State, date: string, today: string) {
  const active: Item[] = []
  const resting: Item[] = []
  for (const task of [...s.tasks].sort((a, b) => a.order - b.order)) {
    if (!visibleOn(task, date)) continue
    const recs = s.recs[task.id] ?? {}
    const rec = recs[date]
    const expect = expectOn(task, recs, date, today, date > today ? planOf(s, task, today) : undefined, offFor(s, task))
    const item = { task, rec, expect, rate: rateOf(task, rec, expect) }
    if (expect > 0 || (rec && (rec.done > 0 || rec.sec > 0 || rec.checked))) active.push(item)
    else resting.push(item)
  }
  return { active, resting }
}

/** 하루 성취율(0~1). 계획이 없으면 null */
export const dayRate = (items: Item[]) => {
  const planned = items.filter((i) => i.expect > 0)
  return planned.length ? planned.reduce((a, i) => a + i.rate, 0) / planned.length : null
}

export const daySec = (s: State, date: string) => {
  let sec = 0
  for (const id in s.recs) sec += s.recs[id][date]?.sec ?? 0
  return sec
}

/** "31~45쪽" 같은 오늘 범위 또는 "15쪽" */
export function targetLabel(s: State, { task, expect }: Item, date: string) {
  if (task.type === 'time') return fmtDur(expect)
  if (task.type === 'check') return '체크'
  // 미래 날짜는 그때까지의 진행을 알 수 없으니 범위 대신 분량만 보여준다
  if (task.type === 'amount' && task.startPoint !== null && expect > 0 && date <= todayISO()) {
    const from = task.startPoint + sumDone(s.recs[task.id] ?? {}, date)
    return `${from}~${from + expect - 1}${task.unit}`
  }
  return `${expect}${task.unit}`
}

export const progressLabel = ({ task, rec, expect }: Item) => {
  if (task.type === 'time') return `${fmtDur(rec?.sec ?? 0)} / ${fmtDur(expect)}`
  if (task.type === 'check') return rec?.checked ? '완료' : '미완료'
  return `${rec?.done ?? 0} / ${expect}${task.unit}`
}

export const categoryOf = (s: State, t: Task) => s.categories.find((c) => c.id === t.categoryId)
export const colorOf = (s: State, t: Task) => subjectVar(categoryOf(s, t)?.color)
export const pct = (rate: number | null) => (rate === null ? '-' : `${Math.round(rate * 100)}%`)
