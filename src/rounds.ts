// 회독 제안: 1회독이 3일 남았거나 끝났을 때 오늘 탭에 한 번 묻는다.
// 책 → 2회독(다시 읽기보다 문제·떠올리기 위주로 2배 빠르게), 틀린 문항이 쌓인 문제집 → 오답만. React와 무관한 순수 코드.
import { addDays, diffDays } from './date.ts'
import { futurePlan, type Recs, type Task } from './logic.ts'

export interface RoundOffer { task: Task; kind: 'second' | 'wrong'; from: string; to: string; amount: number; daysLeft: number }

const sumWrong = (recs: Recs) => Object.values(recs).reduce((a, r) => a + (r.wrong ?? 0), 0)

/** 오늘 띄울 회독 제안 (하나만). examDate: 이 계획이 든 시험 날 */
export function roundOffer(tasks: Task[], recsOf: (id: string) => Recs, today: string, examDateOf: (t: Task) => string | null): RoundOffer | null {
  for (const t of tasks) {
    if (t.kind !== 'book' || t.type !== 'amount' || t.archived || t.rounds || t.roundOf || !t.endDate) continue
    if (t.completed && (!t.completedDate || diffDays(t.completedDate, today) > 3)) continue
    const recs = recsOf(t.id)
    const plan = t.completed ? {} : futurePlan(t, recs, today)
    const days = Object.keys(plan).filter((d) => plan[d] > 0).sort()
    if (days.length > 3) continue
    const end = days[days.length - 1] ?? today
    const wrong = t.bookMode === 'workbook' ? sumWrong(recs) : 0
    const kind = wrong > 0 ? 'wrong' : 'second'
    const studied = Math.max(1, diffDays(t.startDate, end) + 1)
    const from = addDays(end, 1)
    const exam = examDateOf(t)
    const want = Math.max(3, Math.ceil(studied / (kind === 'second' ? 2 : 4)))
    const to = exam && addDays(exam, -1) > from ? (addDays(from, want - 1) < addDays(exam, -1) ? addDays(from, want - 1) : addDays(exam, -1)) : addDays(from, want - 1)
    return { task: t, kind, from, to, amount: kind === 'wrong' ? wrong : t.amount, daysLeft: days.length }
  }
  return null
}

/** 제안을 받아들였을 때 만드는 계획 */
export function roundTask(o: RoundOffer, id: string, order: number, now: number): Task {
  const t = o.task
  const second = o.kind === 'second'
  return {
    ...t, id, order, createdAt: now,
    name: `${t.name} · ${second ? '2회독' : '오답만'}`,
    startDate: o.from, endDate: o.to, amount: o.amount,
    startPoint: second ? t.startPoint : null,
    bookMode: second ? t.bookMode : 'amount',
    ...(second ? {} : { chapters: undefined, cuts: undefined, toc: undefined }),
    custom: {}, fit: undefined, fitFrom: undefined, completed: false, completedDate: null, archived: false,
    rounds: undefined, roundOf: t.id, speed: second ? 2 : 1, minGoal: null, pauses: undefined,
  }
}

/** 1회독 계획에 남기는 결정 */
export const roundDecision = (o: RoundOffer, accepted: boolean): Task['rounds'] => [
  { kind: 'first', speed: 1, from: o.task.startDate, to: o.task.endDate },
  ...(accepted ? [{ kind: o.kind, speed: o.kind === 'second' ? 2 : 1, from: o.from, to: o.to }] : []),
]
