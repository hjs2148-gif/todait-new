// 저장되는 데이터의 모양과 옛 기록 옮기기(마이그레이션).
// IndexedDB·React와 무관한 순수 코드라 node 테스트에서 바로 불러 쓸 수 있다.
import { addDays } from './date.ts'
import { isPausedOn, type Chapter, type OffFn, type Recs, type Task, type TaskKind } from './logic.ts'
import { legacyRecalls } from './recall.ts'
import type { StudyWindows } from './wizard.ts'

export const STATE_VERSION = 2

export interface Category { id: string; name: string; color: string }

/** 시험 범위: 계획 하나와 그 안의 범위. from·to가 null이면 계획 전체 */
export interface ExamScope { taskId: string; from: number | null; to: number | null }

export interface Exam {
  id: string
  name: string
  date: string
  /** 오늘 탭·진도 탭에 보여 줄 시험 */
  selected: boolean
  /** 시험 전에 비워 둘 날 수 (복습만 하는 날). 범위에 든 계획은 이 날들에 분량이 없다 */
  blankDays: number
  scope: ExamScope[]
  /** 범위 계획이 비워 둘 날 전에 끝나게 종료일을 맞춘다 */
  fitEnd: boolean
  /** 시험이 끝난 뒤 정리한 날 (있으면 끝난 시험) */
  closedAt?: string
  /** 과목(카테고리 id)별 점수 */
  scores?: Record<string, string>
}

export interface Diary { id: string; date: string; taskId: string | null; body: string; photoIds: string[]; timestamp: number }

/** 공부 시간 한 덩어리. manual = 직접 넣은 시간 */
export interface TimeHistory { id: string; taskId: string; date: string; startedAt: number; endedAt: number; manual?: boolean }

/** 스톱워치. pausedAt이 있으면 멈춘 상태, pausedMs는 지금까지 멈춰 있던 시간 */
export interface Timer { taskId: string; date: string; startedAt: number; pausedAt?: number; pausedMs?: number }

/** 스톱워치가 지금까지 센 초 (멈춘 동안은 세지 않는다) */
export const timerElapsed = (t: Timer, now: number) => Math.max(0, ((t.pausedAt ?? now) - t.startedAt - (t.pausedMs ?? 0)) / 1000)

export type WidgetId =
  | 'stack'
  | 'progress' | 'slack' | 'wrong' | 'umap'
  | 'today' | 'left' | 'exam' | 'week' | 'streak'
  | 'subjects' | 'weekGoal' | 'tomorrow' | 'memo' | 'quickStart'
/** 위젯 크기: 작게 1×1 · 넓게 2×1 · 크게 2×2 (칸 = 화면 반 너비 × 164px) */
export type WidgetSize = 's1' | 's2' | 's4'
/** items: 스마트 스택에 겹친 위젯들 (id가 'stack'일 때만) */
export interface WidgetSlot { id: WidgetId; size: WidgetSize; items?: WidgetId[] }
/** 스마트 스택 기본 구성 */
export const STACK_DEFAULT: WidgetId[] = ['progress', 'slack', 'tomorrow']
/** 위젯마다 고를 수 있는 크기 (앞이 기본) */
export const WIDGET_SIZES: Record<WidgetId, WidgetSize[]> = {
  stack: ['s2', 's1', 's4'],
  progress: ['s4', 's2', 's1'], slack: ['s2', 's1', 's4'], wrong: ['s1', 's2'], umap: ['s1', 's4'],
  today: ['s2', 's1'], left: ['s1'], exam: ['s1'], week: ['s1', 's2'], streak: ['s1', 's2'], subjects: ['s1', 's2'], weekGoal: ['s1'], tomorrow: ['s1', 's2'], memo: ['s1', 's2'], quickStart: ['s1'],
}
export const DEFAULT_WIDGETS: WidgetSlot[] = [
  { id: 'progress', size: 's4' },
  { id: 'slack', size: 's2' },
]
/** 예전 기본 위젯 (그대로 쓰고 있었다면 새 기본으로 바꾼다) */
const OLD_DEFAULT = 'today,left,exam,week,streak'

/** 밀린 분량을 어떻게 처리할지: 남은 날에 나누기 / 오늘 더하기 / 끝나는 날 늦추기 */
export type CatchupWay = 'spread' | 'today' | 'extend'
/** 쉬는 날 분량을 옮기는 방법: 남은 날에 나누기 / 내일로 */
export type RestWay = 'spread' | 'tomorrow'

export type TodayTab = 'all' | TaskKind

export interface Settings {
  notifyOn: boolean
  dailyNotifyTime: string | null
  theme: 'system' | 'light' | 'dark'
  /** 연속 공부로 치는 하루 최소 공부 시간(초) */
  streakMinSec: number
  /** 떠올리기 복습을 쓸지 (끄면 오늘 탭 복습 줄·복습 시간이 빠진다) */
  reviewOn: boolean
  /** 하루 복습에 넣을 최대 분 */
  reviewCapMin: number
  widgets: WidgetSlot[]
  todayTab: TodayTab
  /** 밀린 분량 시트를 띄우지 않고 남은 날에 나눈다 */
  autoSpread: boolean
  /** 밀린 분량 시트를 마지막으로 본 날 (이 날 전까지 밀린 것은 이미 정리함) */
  catchupSeenOn: string | null
  /** 전체 쉬는 날 → 옮기는 방법 */
  restDays: Record<string, RestWay>
  /** '내일로' 옮긴 쉬는 날: 날짜 → 계획별 옮긴 양 (취소할 때 되돌린다) */
  restMoves: Record<string, Record<string, number>>
  /** 마지막 백업 시각(ms)과 백업 알림을 띄운 날 */
  lastBackupAt: number | null
  backupRemindedOn: string | null
  /** 새 주 시작 카드를 닫은 주의 월요일 */
  weekCardSeen: string | null
  /** 공부할 수 있는 시간대 (평일·주말). 안내형 계획 만들기 5단계에서 정한다 */
  studyWindows: StudyWindows | null
  /** 지운 과목 (새 계획의 '예전 과목'에서 다시 가져온다) */
  oldCategories: Category[]
  /** 그날만 바꾼 공부 시간대 (넘치는 날 '이날만 늘리기') */
  windowOverrides: Record<string, [number, number][]>
  /** 넘치는 날 카드를 '나중에'로 닫은 날 */
  overSnooze: string | null
  /** 필요할 때 제안에 답한 날 (키 → 날짜). 하루에 한 장만 띄운다 */
  suggested: Record<string, string>
}

export interface State {
  version: number
  tasks: Task[]
  recs: Record<string, Recs>
  categories: Category[]
  exams: Exam[]
  diaries: Diary[]
  histories: TimeHistory[]
  settings: Settings
  timer: Timer | null
}

/** 과목 추천색 16가지. 저장은 라이트 값(hex)으로 하고, 화면에서는 subjectVar()로 다크 모드 색을 따라간다.
 * 직접 고른 색은 'hue:28'처럼 색상만 저장하고 밝기는 라이트·다크에 맞춘다 (--cs, --cl) */
export const SUBJECTS = [
  { key: 'm', name: '파랑', hex: '#4a67ad', dark: '#8ea6ea' },
  { key: 's', name: '하늘', hex: '#2b77a8', dark: '#79b8e3' },
  { key: 'c', name: '청록', hex: '#2c7f8c', dark: '#6cc4cf' },
  { key: 'k', name: '초록', hex: '#3d8762', dark: '#85c2a0' },
  { key: 'l', name: '연두', hex: '#557d2e', dark: '#a6cf7a' },
  { key: 'o', name: '올리브', hex: '#6e7a2c', dark: '#bcc777' },
  { key: 'd', name: '황토', hex: '#8a7350', dark: '#cdb48a' },
  { key: 'b', name: '갈색', hex: '#8a5d3b', dark: '#d6a682' },
  { key: 'y', name: '주황', hex: '#a85a2c', dark: '#e7a679' },
  { key: 'r', name: '장미', hex: '#a8435a', dark: '#e8909f' },
  { key: 'p', name: '자주', hex: '#a24d76', dark: '#e391b8' },
  { key: 'e', name: '보라', hex: '#8d5aa0', dark: '#c79ad8' },
  { key: 'i', name: '남색', hex: '#5a54a8', dark: '#aaa4ec' },
  { key: 't', name: '청회', hex: '#56677a', dark: '#a9b8c9' },
  { key: 'g', name: '회색', hex: '#6d675e', dark: '#b3ab9f' },
  { key: 'a', name: '먹색', hex: '#3f3b36', dark: '#d8d2c8' },
] as const
export const COLORS: string[] = SUBJECTS.map((x) => x.hex)

/** 저장된 과목색 → CSS 값 (다크 모드에서 밝은 색으로 바뀐다). 모르는 색은 그대로 */
export const subjectVar = (hex: string | null | undefined) => {
  const s = SUBJECTS.find((x) => x.hex === hex)
  if (s) return `var(--s-${s.key})`
  if (hex?.startsWith('hue:')) return `hsl(${Number(hex.slice(4)) || 0} var(--cs) var(--cl))`
  return hex ?? 'var(--s-g)'
}

/** 첫 버전의 파스텔 과목색을 새 과목색으로 옮긴다 */
const OLD_COLORS: Record<string, string> = {
  '#00d2b1': '#2c7f8c', '#5393d1': '#4a67ad', '#7e5df4': '#8d5aa0', '#f6656e': '#3d8762', '#ffc968': '#6d675e',
  '#ff877d': '#6d675e', '#65d3da': '#2c7f8c', '#be99cb': '#8d5aa0', '#38ba9c': '#3d8762', '#848484': '#6d675e',
}

export const defaultSettings = (): Settings => ({
  notifyOn: false,
  dailyNotifyTime: '08:00',
  theme: 'system',
  streakMinSec: 600,
  reviewOn: true,
  reviewCapMin: 30,
  widgets: DEFAULT_WIDGETS.map((w) => ({ ...w })),
  todayTab: 'all',
  autoSpread: false,
  catchupSeenOn: null,
  restDays: {},
  restMoves: {},
  lastBackupAt: null,
  backupRemindedOn: null,
  weekCardSeen: null,
  studyWindows: null,
  oldCategories: [],
  windowOverrides: {},
  overSnooze: null,
  suggested: {},
})

export const emptyState = (): State => ({
  version: STATE_VERSION,
  tasks: [], recs: {}, exams: [], diaries: [], histories: [], timer: null,
  categories: [],
  settings: defaultSettings(),
})

/** 옛 계획(분류 없음)의 분류를 배분 방식과 단위로 짐작한다 */
export function guessKind(t: Pick<Task, 'type' | 'unit'>): Pick<Task, 'kind' | 'bookMode'> {
  if (t.type === 'time') return { kind: 'time' }
  if (t.type === 'daily' || t.type === 'check') return { kind: 'habit' }
  if (/강/.test(t.unit)) return { kind: 'lecture' }
  if (/문항|문제/.test(t.unit)) return { kind: 'book', bookMode: 'workbook' }
  return { kind: 'book', bookMode: 'amount' }
}

const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * 저장된 상태(어느 버전이든)를 지금 모양으로 옮긴다.
 * 기존 기록(recs·histories·diaries)은 건드리지 않고, 새 필드만 기본값으로 채운다.
 */
export function migrate(raw: unknown): State {
  const base = emptyState()
  if (!isObj(raw)) return base
  const s = raw as Record<string, any>

  const tasks: Task[] = (Array.isArray(s.tasks) ? s.tasks : []).map((t: any) => {
    const kind = t.kind ? {} : guessKind(t)
    return {
      ...t,
      ...kind,
      custom: isObj(t.custom) ? t.custom : {},
      week: Array.isArray(t.week) && t.week.length === 7 ? t.week : [true, true, true, true, true, true, true],
      // 예전 이해도·복습 날짜 → 떠올리기 기록
      ...(Array.isArray(t.chapters) ? { chapters: t.chapters.map((c: Chapter) => { const r = legacyRecalls(c); return r ? { ...c, recalls: r } : c }) } : {}),
      archived: !!t.archived,
    } as Task
  })

  // v1의 D-day → 시험 (비워 둘 날 0, 범위 없음)
  const exams: Exam[] = Array.isArray(s.exams)
    ? s.exams.map((e: any) => ({ blankDays: 0, scope: [], fitEnd: false, selected: false, ...e }))
    : (Array.isArray(s.ddays) ? s.ddays : []).map((d: any) => ({
        id: d.id, name: d.name, date: d.date, selected: !!d.selected, blankDays: 0, scope: [], fitEnd: false,
      }))

  const settings: Settings = { ...base.settings, ...(isObj(s.settings) ? s.settings : {}) }
  if (!Array.isArray(settings.widgets) || settings.widgets.length === 0) settings.widgets = base.settings.widgets
  // 오늘 복습·떠올리기 위젯은 진도 탭 복습 칸으로 옮겼다. 빠지는 자리는 시험 여유 위젯을 넓혀 채운다 (한 번만)
  const hadReview = (settings.widgets as { id: string }[]).some((w) => w && (w.id === 'review' || w.id === 'recall'))
  if (hadReview) settings.widgets = (settings.widgets as WidgetSlot[]).map((w) => (w && w.id === 'slack' && w.size === 's1' ? { ...w, size: 's2' } : w))
  // 예전 넓게/작게(wide) → 크기(size). 예전 기본 구성 그대로면 새 학습 위젯 기본으로
  settings.widgets = (settings.widgets as (WidgetSlot & { wide?: boolean })[])
    .filter((w) => w && w.id in WIDGET_SIZES)
    .map((w) => ({ id: w.id, size: w.size && WIDGET_SIZES[w.id].includes(w.size) ? w.size : WIDGET_SIZES[w.id].includes(w.wide ? 's2' : 's1') ? (w.wide ? 's2' : 's1') : WIDGET_SIZES[w.id][0], ...(w.id === 'stack' ? { items: (w.items ?? STACK_DEFAULT).filter((x) => x in WIDGET_SIZES && x !== 'stack') } : {}) }))
  if (settings.widgets.map((w) => w.id).join(',') === OLD_DEFAULT) settings.widgets = base.settings.widgets
  if (!isObj(settings.restDays)) settings.restDays = {}
  if (!isObj(settings.restMoves)) settings.restMoves = {}
  if (!Array.isArray(settings.oldCategories)) settings.oldCategories = []
  if (!isObj(settings.windowOverrides)) settings.windowOverrides = {}
  if (!isObj(settings.suggested)) settings.suggested = {}

  return {
    version: STATE_VERSION,
    tasks,
    recs: isObj(s.recs) ? s.recs : {},
    categories: Array.isArray(s.categories)
      ? s.categories.map((c: Category) => ({ ...c, color: OLD_COLORS[c.color] ?? c.color }))
      : base.categories,
    exams,
    diaries: Array.isArray(s.diaries) ? s.diaries : [],
    histories: Array.isArray(s.histories) ? s.histories : [],
    settings,
    timer: isObj(s.timer) ? (s.timer as Timer) : null,
  }
}

/** 시험 전에 비워 둘 날짜들 */
export const blankDatesOf = (e: Exam) => Array.from({ length: e.blankDays }, (_, i) => addDays(e.date, -(i + 1)))

/** 계획이 분량을 받지 않는 날: 멈춘 기간, 범위에 든 시험의 비워 둘 날, 전체 쉬는 날(쉬는 날에도 하는 습관은 제외) */
export function offFor(s: Pick<State, 'exams' | 'settings'>, t: Task): OffFn | undefined {
  const blank = new Set<string>()
  // 시험 범위를 고르지 않았으면 진행 중인 책·인강 전부가 범위 (examScope와 같은 규칙)
  const inScope = (e: Exam) => (e.scope.length ? e.scope.some((x) => x.taskId === t.id) : t.type === 'amount' && (t.kind === 'book' || t.kind === 'lecture'))
  for (const e of s.exams) if (inScope(e)) for (const d of blankDatesOf(e)) blank.add(d)
  // 쉬는 날에도 하는 습관, 한 번만 하는 할 일은 전체 쉬는 날의 영향을 받지 않는다
  const rest = (t.kind === 'habit' && t.keepOnRest) || t.kind === 'todo' ? {} : s.settings.restDays
  const hasRest = Object.keys(rest).length > 0
  if (!blank.size && !hasRest && !t.pauses?.length) return undefined
  return (d) => blank.has(d) || d in rest || isPausedOn(t, d)
}

/** 바쁜 날 최소 목표를 채운 계획이 있는 날 (연속 공부로 친다) */
export const minGoalMet = (s: Pick<State, 'tasks' | 'recs'>, d: string) =>
  s.tasks.some((t) => !!t.minGoal && (s.recs[t.id]?.[d]?.done ?? 0) >= t.minGoal)

/** 백업 알림: 마지막 백업(없으면 가장 오래된 계획을 만든 날)에서 7일이 지났으면 지난 일수. 오늘 이미 "나중에"를 눌렀으면 null */
export function backupDue(s: Pick<State, 'tasks' | 'settings'>, now: number, today: string): number | null {
  if (!s.tasks.length || s.settings.backupRemindedOn === today) return null
  const base = s.settings.lastBackupAt ?? Math.min(...s.tasks.map((t) => t.createdAt))
  const days = Math.floor((now - base) / 86400000)
  return days >= 7 ? days : null
}

/** ISO 주 번호 (월요일 시작) */
export function isoWeek(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const y0 = Date.UTC(t.getUTCFullYear(), 0, 1)
  return Math.ceil(((t.getTime() - y0) / 86400000 + 1) / 7)
}
