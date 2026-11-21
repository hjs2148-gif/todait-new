// 새 계획 화면의 입력 → 계획(Task) 만들기. React와 무관한 순수 코드.
import { addDays, dow } from './date.ts'
import { futurePlan, type BookMode, type Chapter, type Lecture, type Task, type TaskKind } from './logic.ts'
import { chapterSpans } from './progress.ts'

export interface PlanForm {
  kind: TaskKind
  bookMode: BookMode
  name: string
  categoryId: string
  examId: string
  unit: string
  /** 목차 붙여넣기 글 (한 줄에 "단원 이름 1~28") */
  toc: string
  from: number | null
  to: number | null
  total: number | null
  /** 인강: 강의 수, 강의 제목(줄바꿈, 비우면 "1강…") */
  lectureCount: number | null
  lectureText: string
  startDate: string
  endDate: string
  week: boolean[]
  split: 'chapter' | 'even'
  perDay: number | null
  hours: number | null
  mins: number | null
  repeat: 'week' | 'day'
  every: number | null
  keepOnRest: boolean
  due: string
}

export const ALL_WEEK = [true, true, true, true, true, true, true]

export const emptyForm = (today: string): PlanForm => ({
  kind: 'book', bookMode: 'toc', name: '', categoryId: '', examId: '', unit: '쪽', toc: '', from: 1, to: null, total: null,
  lectureCount: null, lectureText: '', startDate: today, endDate: addDays(today, 29), week: ALL_WEEK, split: 'chapter',
  perDay: null, hours: 1, mins: 0, repeat: 'week', every: 2, keepOnRest: false, due: '',
})

/** "수열의 극한 1~28쪽", "1단원 급수 29-52", "Ⅰ 원자의 구조  1~40" 같은 줄을 단원으로 읽는다. 읽지 못한 줄은 bad에 담는다 */
export function parseToc(text: string): { chapters: Chapter[]; bad: string[] } {
  const chapters: Chapter[] = []
  const bad: string[] = []
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const m = line.match(/^(.*?)[\s:,·]*(\d+)\s*(?:[~\-–—]|부터)\s*(\d+)\s*(?:쪽|p|문항|번)?$/)
    if (!m || Number(m[3]) < Number(m[2])) { bad.push(line); continue }
    const name = m[1].trim() || `${chapters.length + 1}단원`
    chapters.push({ id: `c${chapters.length + 1}`, name, from: Number(m[2]), to: Number(m[3]) })
  }
  return { chapters, bad }
}

export const parseLectures = (text: string, count: number): Lecture[] => {
  const titles = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  return Array.from({ length: count }, (_, i) => ({ title: titles[i] ?? `${i + 1}강`, min: null }))
}

const BASE = {
  completed: false, completedDate: null, archived: false, notifyTime: null, custom: {}, repeatEvery: null, supplementDow: null,
} as const

/** 입력을 계획으로. 문제가 있으면 문자열(오류 문구)을 돌려준다 */
export function buildTask(f: PlanForm, id: string, order: number, now: number): Task | string {
  const name = f.name.trim()
  if (!name) return '계획 이름을 입력해주세요'
  const common = { ...BASE, id, name, categoryId: f.categoryId || null, order, createdAt: now, startDate: f.startDate, week: f.week }
  if (f.kind === 'todo') {
    const day = f.startDate
    return { ...common, type: 'check', kind: 'todo', unit: '', startPoint: null, amount: 0, perDay: 0, endDate: day, due: f.due || null, week: ALL_WEEK }
  }
  if (f.kind === 'time') {
    const per = (f.hours ?? 0) * 3600 + (f.mins ?? 0) * 60
    if (per <= 0) return '하루 목표 시간을 입력해주세요'
    if (f.endDate && f.endDate < f.startDate) return '종료일이 시작일보다 빠릅니다'
    if (f.repeat === 'week' && !f.week.some(Boolean)) return '공부할 요일을 선택해주세요'
    return { ...common, type: 'time', kind: 'time', unit: '', startPoint: null, amount: 0, perDay: per, endDate: f.endDate || null, repeatEvery: f.repeat === 'day' ? f.every : null }
  }
  if (f.kind === 'habit') {
    if (f.endDate && f.endDate < f.startDate) return '종료일이 시작일보다 빠릅니다'
    if (f.repeat === 'week' && !f.week.some(Boolean)) return '할 요일을 선택해주세요'
    if (f.repeat === 'day' && (!f.every || f.every < 2)) return '반복 간격은 2일 이상으로 입력해주세요'
    return { ...common, type: 'check', kind: 'habit', unit: '', startPoint: null, amount: 0, perDay: 0, endDate: f.endDate || null, repeatEvery: f.repeat === 'day' ? f.every : null, keepOnRest: f.keepOnRest }
  }
  // 책·인강: 기간에 나눠 하는 분량 계획
  if (!f.endDate) return '종료일을 입력해주세요'
  if (f.endDate < f.startDate) return '종료일이 시작일보다 빠릅니다'
  if (!f.week.some(Boolean)) return '공부할 요일을 선택해주세요'
  if (f.kind === 'lecture') {
    const n = f.lectureCount ?? 0
    if (n <= 0) return '강의 수를 입력해주세요'
    return { ...common, type: 'amount', kind: 'lecture', unit: '강', startPoint: 1, amount: n, perDay: 0, endDate: f.endDate, lectures: parseLectures(f.lectureText, n) }
  }
  if (f.bookMode === 'toc') {
    const { chapters, bad } = parseToc(f.toc)
    if (bad.length) return `이 줄을 읽지 못했어요: ${bad[0]}`
    if (!chapters.length) return '목차를 붙여넣어 주세요 (한 줄에 "단원 이름 1~28")'
    const start = chapters[0].from
    const end = Math.max(...chapters.map((c) => c.to))
    return { ...common, type: 'amount', kind: 'book', bookMode: 'toc', unit: f.unit.trim() || '쪽', startPoint: start, amount: end - start + 1, perDay: 0, endDate: f.endDate, chapters, split: f.split }
  }
  const unit = f.unit.trim() || (f.bookMode === 'workbook' ? '문항' : '쪽')
  if (f.bookMode === 'workbook') {
    if (f.from === null || f.to === null || f.to < f.from) return '문항 범위를 입력해주세요'
    return { ...common, type: 'amount', kind: 'book', bookMode: 'workbook', unit, startPoint: f.from, amount: f.to - f.from + 1, perDay: 0, endDate: f.endDate }
  }
  if (!f.total || f.total <= 0) return '총 분량을 입력해주세요'
  return { ...common, type: 'amount', kind: 'book', bookMode: 'amount', unit, startPoint: null, amount: f.total, perDay: 0, endDate: f.endDate }
}

export interface PlanPreview { days: number; perDay: number; end: string | null; chapterEnds: { name: string; end: string | null }[] }

/** 미리보기: 공부일 수, 하루 평균, 단원이 끝나는 날 */
export function previewPlan(t: Task, today: string): PlanPreview | null {
  if (t.type !== 'amount' || !t.endDate || t.endDate < t.startDate) return null
  let days = 0
  for (let d = t.startDate; d <= t.endDate; d = addDays(d, 1)) if (t.week[dow(d)] && dow(d) !== t.supplementDow) days++
  if (days === 0) return null
  const probe = today < t.startDate ? today : t.startDate
  const plan = futurePlan(t, {}, probe)
  const used = Object.entries(plan).filter(([, v]) => v > 0).map(([d]) => d).sort()
  const spans = chapterSpans(t, {}, probe)
  return {
    days, perDay: t.amount / days, end: used.length ? used[used.length - 1] : null,
    chapterEnds: spans.map((s) => ({ name: s.chapter.name, end: s.end })),
  }
}
