// 안내형 계획 만들기(분량 계획)의 입력 → 계획. React와 무관한 순수 코드.
import { addDays, dow } from './date.ts'
import { futurePlan, type Task } from './logic.ts'
import { resolveToc, type TocLine } from './toc.ts'
import { buildTask, emptyForm } from './planForm.ts'

/** 요일마다: 공부 · 예비 · 쉼 (0=일 … 6=토) */
export type DayKind = 'on' | 'sp' | 'off'
/** 공부 가능 시간대 [시작 분, 끝 분] */
export type Win = [number, number]
/** 평일·주말 시간대. perDay가 있으면 요일마다 따로 (0=일 … 6=토) */
export interface StudyWindows { weekday: Win[]; weekend: Win[]; perDay?: Win[][] | null }
/** 그 요일의 시간대 */
export const windowsOn = (w: StudyWindows, d: number): Win[] => w.perDay?.[d] ?? (d === 0 || d === 6 ? w.weekend : w.weekday)

export interface Wiz {
  name: string
  categoryId: string
  /** 이미 한 부분이 있음 → done까지 했음 */
  part: boolean
  from: number | null
  to: number | null
  done: number | null
  unit: string
  toc: TocLine[]
  startDate: string
  endDate: string
  days: DayKind[]
  /** 끝에 비워 둘 날 */
  buffer: number
  examId: string
  windows: StudyWindows
  notify: boolean
  /** 단원 무게 (맨 위 단원 순서 → 1 쉬움 · 2 보통 · 3 어려움) */
  weights: Record<number, 1 | 2 | 3>
  /** 바쁜 날엔 이것만 */
  minGoal: number | null
  // ── 시간 · 습관 · 할 일 ──
  /** 시간: 하루 목표(분) */
  perMin: number
  /** 시간·습관: 요일마다 / N일마다 */
  repeat: 'week' | 'day'
  every: number
  /** 시간·습관: 하는 요일 (0=일 … 6=토) */
  week: boolean[]
  /** 습관: 전체 쉬는 날에도 한다 */
  keepOnRest: boolean
  /** 시간·습관: 끝나는 날 없이 계속 */
  endless: boolean
  /** 할 일: 마감일 */
  due: string
}

export const DEFAULT_WINDOWS: StudyWindows = { weekday: [[16 * 60, 18 * 60], [20 * 60, 22 * 60]], weekend: [[10 * 60, 13 * 60]] }
export const DEFAULT_DAYS: DayKind[] = ['sp', 'on', 'on', 'on', 'on', 'on', 'on']

export const emptyWiz = (today: string, endDate: string, examId = ''): Wiz => ({
  name: '', categoryId: '', part: false, from: 1, to: null, done: null, unit: '쪽', toc: [],
  startDate: today, endDate, days: [...DEFAULT_DAYS], buffer: 2, examId, windows: DEFAULT_WINDOWS, notify: true, weights: {}, minGoal: null,
  perMin: 60, repeat: 'week', every: 2, week: [true, true, true, true, true, true, true], keepOnRest: false, endless: true, due: '',
})

export const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
/** 오후 4:00 처럼 */
export const clock = (m: number) => {
  const h = Math.floor(m / 60) % 24
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(m % 60).padStart(2, '0')}`
}
export const winSum = (ws: Win[]) => ws.reduce((a, [s, e]) => a + Math.max(0, e - s), 0)

/** 끝에 비워 둘 날짜들 */
export const bufferDates = (w: Pick<Wiz, 'endDate' | 'buffer'>) => Array.from({ length: w.buffer }, (_, i) => addDays(w.endDate, -i))

/** 범위: 목차가 있으면 목차에서, 없으면 입력값 */
export function rangeOf(w: Wiz) {
  const res = w.toc.length ? resolveToc(w.toc, w.to, w.from) : null
  const from = w.from ?? res?.start ?? 1
  const to = w.to ?? res?.end ?? null
  const start = w.part && w.done !== null ? w.done + 1 : from
  return { res, from, to, start }
}

const BASE = {
  completed: false, completedDate: null, archived: false, repeatEvery: null, perDay: 0,
} as const

/** 입력을 계획으로. 문제가 있으면 문자열(오류 문구). firstHalf: 첫날은 평소의 절반 */
export function wizardTask(w: Wiz, id: string, order: number, now: number, firstHalf = true): Task | string {
  const name = w.name.trim()
  if (!name) return '이름을 적어 주세요'
  const { res, to, start } = rangeOf(w)
  if (to === null || to < start) return '범위를 적어 주세요'
  if (w.endDate < w.startDate) return '끝나는 날이 시작보다 빨라요'
  if (!w.days.some((d) => d !== 'off')) return '공부하는 요일을 하나 이상 골라 주세요'
  const unit = w.unit.trim() || '쪽'
  const lecture = unit === '강'
  const sp = w.days.indexOf('sp')
  const custom: Record<string, number> = {}
  if (w.buffer > 0 && w.endDate > addDays(w.startDate, w.buffer + 2)) for (const d of bufferDates(w)) custom[d] = 0
  const t: Task = {
    ...BASE, id, name, order, createdAt: now, categoryId: w.categoryId || null,
    type: 'amount', kind: lecture ? 'lecture' : 'book',
    ...(lecture ? {} : { bookMode: unit === '문항' ? 'workbook' as const : 'toc' as const, split: 'chapter' as const }),
    ...(res && !lecture ? { chapters: res.chapters.map((c, i) => (w.weights[i] && w.weights[i] !== 2 ? { ...c, weight: w.weights[i] } : c)), cuts: res.cuts, toc: res.lines } : {}),
    ...(dayWeights(w.windows) ? { dayWeights: dayWeights(w.windows)! } : {}),
    ...(w.minGoal ? { minGoal: w.minGoal } : {}),
    unit, startPoint: start, amount: to - start + 1,
    startDate: w.startDate, endDate: w.endDate,
    week: w.days.map((d) => d !== 'off'), supplementDow: sp >= 0 ? sp : null,
    custom, notifyTime: w.notify && windowsOn(w.windows, 1)[0] ? hhmm(windowsOn(w.windows, 1)[0][0]) : null,
  }
  if (firstHalf) {
    const plan = futurePlan(t, {}, w.startDate)
    const first = plan[w.startDate] ?? 0
    if (first >= 2) t.custom = { ...t.custom, [w.startDate]: Math.ceil(first / 2) }
  }
  return t
}

/** 요일별 공부 가능 시간 → 하루 분량 비율. 시간이 없는 요일은 평균으로, 모두 같으면 없음 */
export function dayWeights(win: StudyWindows): number[] | null {
  const m = [0, 1, 2, 3, 4, 5, 6].map((d) => winSum(windowsOn(win, d)))
  const pos = m.filter((x) => x > 0)
  if (!pos.length || pos.every((x) => x === pos[0]) && pos.length === 7) return null
  const avg = pos.reduce((a, b) => a + b, 0) / pos.length
  return m.map((x) => Math.round(((x || avg) / avg) * 100) / 100)
}

/** 요일별 평균 분량 (0=일 … 6=토). 한 주 모양 그림에 쓴다 */
export function weekShape(t: Task, today: string): (number | null)[] {
  const plan = futurePlan(t, {}, today < t.startDate ? today : t.startDate)
  const sum = [0, 0, 0, 0, 0, 0, 0]
  const n = [0, 0, 0, 0, 0, 0, 0]
  for (const [d, v] of Object.entries(plan)) {
    if (v <= 0 || t.custom[d] !== undefined) continue
    sum[dow(d)] += v
    n[dow(d)]++
  }
  return sum.map((s, i) => (n[i] ? Math.round(s / n[i]) : null))
}

/** 날짜 고르기: 처음 누르면 시작, 다음에 누르면 끝 (시작보다 앞이면 시작을 바꾼다) */
export function pickDate(cur: { start: string; end: string | null }, d: string): { start: string; end: string | null } {
  if (cur.end !== null) return { start: d, end: null }
  return d < cur.start ? { start: d, end: null } : { start: cur.start, end: d }
}

/** 시간·습관·할 일 계획 (planForm.buildTask를 쓴다) */
export function simpleTask(kind: 'time' | 'habit' | 'todo', w: Wiz, id: string, order: number, now: number): Task | string {
  const f = {
    ...emptyForm(w.startDate), kind, name: w.name, categoryId: w.categoryId, startDate: w.startDate,
    endDate: kind === 'todo' ? w.startDate : w.endless ? '' : w.endDate,
    hours: Math.floor(w.perMin / 60), mins: w.perMin % 60, repeat: w.repeat, every: w.every, week: w.week, keepOnRest: w.keepOnRest,
    due: kind === 'todo' ? w.due || w.startDate : '',
  }
  if (kind === 'todo' && f.due < f.startDate) return '마감일이 하는 날보다 빨라요'
  const t = buildTask(f, id, order, now)
  if (typeof t === 'string') return t
  const first = windowsOn(w.windows, dow(w.startDate))[0]
  return { ...t, notifyTime: kind !== 'todo' && w.notify && first ? hhmm(first[0]) : null }
}
