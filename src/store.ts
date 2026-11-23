// 앱 상태와 IndexedDB 저장. 서버 없이 이 기기 브라우저에만 저장된다.
import { useSyncExternalStore } from 'react'
import { addDays, dow, todayISO } from './date.ts'
import { applyBalance, balance } from './balance.ts'
import { windowsOn, winSum } from './wizard.ts'
import {
  expectIfOnTrack, extendEnd, futurePlan, liveExpect, missedSince, rollForward, secPerUnit, sumDone,
  type Chapter, type DayRec, type Grade, type Task,
} from './logic.ts'
import {
  emptyState, migrate, offFor, STATE_VERSION, timerElapsed,
  type CatchupWay, type Category, type Exam, type Diary, type RestWay, type Settings, type State, type TimeHistory,
} from './model.ts'

export * from './model.ts'

export const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)

// ── IndexedDB ───────────────────────────────────────────────
const db = new Promise<IDBDatabase>((resolve, reject) => {
  const req = indexedDB.open('todait', 1)
  req.onupgradeneeded = () => {
    req.result.createObjectStore('kv')
    req.result.createObjectStore('photos')
  }
  req.onsuccess = () => resolve(req.result)
  req.onerror = () => reject(req.error)
})
const idb = async <T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> => {
  const d = await db
  return new Promise<T>((resolve, reject) => {
    const req = fn(d.transaction(store, mode).objectStore(store))
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}
export const savePhoto = async (blob: Blob) => {
  const id = uid()
  await idb('photos', 'readwrite', (s) => s.put(blob, id))
  return id
}
export const loadPhoto = (id: string) => idb<Blob | undefined>('photos', 'readonly', (s) => s.get(id))
export const deletePhoto = (id: string) => idb('photos', 'readwrite', (s) => s.delete(id))

// ── 상태 ────────────────────────────────────────────────────
let state: State = emptyState()
const listeners = new Set<() => void>()
let saveTimer: ReturnType<typeof setTimeout> | undefined
/** 저장된 기록을 다 읽기 전에는 절대 쓰지 않는다 (빈 상태로 덮어쓰기 방지) */
let loaded = false

const freeze = (s: State): State => {
  const today = todayISO()
  let recs = s.recs
  for (const t of s.tasks) {
    const cur = recs[t.id] ?? {}
    const next = rollForward(t, cur, today, offFor(s, t))
    if (next !== cur) {
      if (recs === s.recs) recs = { ...recs }
      recs[t.id] = next
    }
  }
  const next = recs === s.recs ? s : { ...s, recs }
  return fitToHours(next, today)
}

/** 공부 가능 시간을 정했으면, 넘치는 날의 분량을 마감이 먼 계획부터 뒤로 옮긴다 (balance.ts) */
/** 그날 공부 가능 시간대 (그날만 바꾼 것이 우선) */
export const windowsFor = (s: State, d: string) => s.settings.windowOverrides?.[d] ?? (s.settings.studyWindows ? windowsOn(s.settings.studyWindows, dow(d)) : [])
/** 가능 시간에 맞춰 나눠 담기 (오늘 탭·진도 탭의 넘치는 날 계산에도 쓴다) */
export const balanceOf = (s: State, today: string, tasks = s.tasks) => balance({
  tasks, recs: s.recs, today,
  offOf: (t) => offFor(s, t),
  capOf: (d) => winSum(windowsFor(s, d)),
  spu: (t) => secPerUnit(t, s.recs[t.id] ?? {}),
})
function fitToHours(s: State, today: string): State {
  if (!s.settings.studyWindows) return s
  const out = balanceOf(s, today)
  const tasks = applyBalance(s.tasks, out, today)
  return tasks === s.tasks ? s : { ...s, tasks }
}

export const getState = () => state
export function setState(fn: (s: State) => State) {
  const next = freeze(fn(state))
  if (next === state) return
  state = next
  listeners.forEach((l) => l())
  clearTimeout(saveTimer)
  saveTimer = setTimeout(flushSave, 150)
}

/** 저장을 기다리지 않고 바로 쓴다. 앱이 가려지거나 닫힐 때 마지막 변경을 잃지 않게 한다 */
export function flushSave() {
  clearTimeout(saveTimer)
  saveTimer = undefined
  if (!loaded) return Promise.resolve()
  return idb('kv', 'readwrite', (s) => s.put(state, 'state')).catch(() => {})
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void flushSave() })
  window.addEventListener('pagehide', () => void flushSave())
}
export const useStore = () =>
  useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, getState)

export async function loadState() {
  const saved = await idb<unknown>('kv', 'readonly', (s) => s.get('state'))
  const migrated = saved ? migrate(saved) : emptyState()
  // 옮기기 전 기록은 한 번만 따로 남겨 둔다 (문제가 생기면 되돌릴 수 있게)
  if (saved && (saved as { version?: number }).version !== STATE_VERSION) {
    await idb('kv', 'readwrite', (s) => s.put(saved, `state-v${(saved as { version?: number }).version ?? 1}-backup`))
    await idb('kv', 'readwrite', (s) => s.put(migrated, 'state'))
  }
  state = freeze(migrated)
  loaded = true
  void requestPersist()
}

/** 브라우저가 저장소를 마음대로 지우지 않도록 요청한다. 결과를 돌려준다 (지원 안 하면 null) */
export async function requestPersist(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null
    if (await navigator.storage.persisted?.()) return true
    return await navigator.storage.persist()
  } catch {
    return null
  }
}

/** 날짜가 바뀌었을 때 지난 날 목표를 고정하고 화면을 새로 그린다 */
export const refreshForNewDay = () => {
  state = { ...freeze(state) }
  listeners.forEach((l) => l())
}

// 앞으로의 분배 계획은 상태가 바뀔 때까지 캐시한다
const planCache = new WeakMap<State, Map<string, Record<string, number>>>()
export function planOf(s: State, t: Task, today: string) {
  let m = planCache.get(s)
  if (!m) planCache.set(s, (m = new Map()))
  const key = t.id + today
  let p = m.get(key)
  if (!p) m.set(key, (p = futurePlan(t, s.recs[t.id] ?? {}, today, offFor(s, t))))
  return p
}

// ── 동작 ────────────────────────────────────────────────────
const blankRec = (): DayRec => ({ done: 0, sec: 0, checked: false })
const patchRec = (s: State, taskId: string, date: string, fn: (r: DayRec) => DayRec): State => {
  const recs = s.recs[taskId] ?? {}
  const rec = fn(recs[date] ?? blankRec())
  return { ...s, recs: { ...s.recs, [taskId]: { ...recs, [date]: rec } } }
}
const patchTask = (s: State, id: string, fn: (t: Task) => Task): State => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? fn(t) : t)) })
const patchChapter = (s: State, taskId: string, chapterId: string, fn: (c: Chapter) => Chapter): State =>
  patchTask(s, taskId, (t) => ({ ...t, chapters: t.chapters?.map((c) => (c.id === chapterId ? fn(c) : c)) }))
const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]

/** 분량 계획은 전체 분량을 다 채우면 자동 완료, 다시 줄이면 완료 취소. 목차 단원은 끝낸 날을 적는다 */
const syncCompleted = (s: State, taskId: string, date: string): State =>
  patchTask(s, taskId, (t) => {
    if (t.type !== 'amount') return t
    const done = sumDone(s.recs[taskId] ?? {})
    let next = t
    if (t.chapters?.length && t.startPoint !== null) {
      const pos = t.startPoint + done - 1
      const chapters = t.chapters.map((c) =>
        c.to <= pos ? (c.doneDate ? c : { ...c, doneDate: date }) : c.doneDate ? { ...c, doneDate: undefined, grade: undefined } : c
      )
      if (chapters.some((c, i) => c !== t.chapters![i])) next = { ...next, chapters }
    }
    const full = done >= t.amount
    if (full !== t.completed) next = { ...next, completed: full, completedDate: full ? date : null }
    return next
  })

/** 방금 멈춘 스톱워치가 남긴 기록 (끝낸 뒤 기록 시트가 읽는다) */
let lastStopped: { id: string; taskId: string; date: string; sec: number } | null = null
export const takeLastStopped = () => {
  const v = lastStopped
  lastStopped = null
  return v
}

export const actions = {
  saveTask: (task: Task) =>
    setState((s) => syncCompleted({ ...s, tasks: upsert(s.tasks, task) }, task.id, todayISO())),
  deleteTask: (id: string) =>
    setState((s) => {
      const { [id]: _, ...recs } = s.recs
      return {
        ...s, tasks: s.tasks.filter((t) => t.id !== id), recs,
        histories: s.histories.filter((h) => h.taskId !== id),
        exams: s.exams.map((e) => ({ ...e, scope: e.scope.filter((x) => x.taskId !== id) })),
        timer: s.timer?.taskId === id ? null : s.timer,
      }
    }),
  patchTask: (id: string, patch: Partial<Task>) => setState((s) => patchTask(s, id, (t) => ({ ...t, ...patch }))),
  setDone: (taskId: string, date: string, done: number) =>
    setState((s) => syncCompleted(patchRec(s, taskId, date, (r) => ({ ...r, done: Math.max(0, done) })), taskId, date)),
  setSec: (taskId: string, date: string, sec: number) => setState((s) => patchRec(s, taskId, date, (r) => ({ ...r, sec: Math.max(0, sec) }))),
  toggleCheck: (taskId: string, date: string) => setState((s) => patchRec(s, taskId, date, (r) => ({ ...r, checked: !r.checked }))),
  /** 문제집 맞은 수·틀린 수 */
  setScore: (taskId: string, date: string, right: number, wrong: number) =>
    setState((s) => patchRec(s, taskId, date, (r) => ({ ...r, right: Math.max(0, right), wrong: Math.max(0, wrong) }))),
  /** 한 줄 메모 (빈 문자열이면 지움) */
  setNote: (taskId: string, date: string, note: string) =>
    setState((s) => patchRec(s, taskId, date, (r) => {
      const { note: _, ...rest } = r
      return note.trim() ? { ...rest, note: note.trim() } : rest
    })),
  /** 분량 변경 (0 = 쉬는 날, undefined = 자동 분배로 되돌리기) */
  setCustom: (taskId: string, date: string, value: number | undefined) =>
    setState((s) =>
      patchTask(s, taskId, (t) => {
        const custom = { ...t.custom }
        if (value === undefined) delete custom[date]
        else custom[date] = value
        return { ...t, custom }
      })
    ),
  // 단원 이해도·복습
  setGrade: (taskId: string, chapterId: string, grade: Grade | undefined) =>
    setState((s) => patchChapter(s, taskId, chapterId, (c) => ({ ...c, grade }))),
  addReview: (taskId: string, chapterId: string, date: string) =>
    setState((s) => patchChapter(s, taskId, chapterId, (c) => ({ ...c, reviews: [...(c.reviews ?? []), date] }))),
  // 멈추기·다시 시작
  pauseTask: (id: string, date: string) =>
    setState((s) => patchTask(s, id, (t) => ({ ...t, archived: true, pauses: [...(t.pauses ?? []), { from: date, to: null }] }))),
  resumeTask: (id: string, date: string) =>
    setState((s) => patchTask(s, id, (t) => ({
      ...t, archived: false,
      pauses: (t.pauses ?? []).map((p) => (p.to === null ? { ...p, to: addDays(date, -1) } : p)).filter((p) => p.to === null || p.to >= p.from),
    }))),
  /** 밀린 분량 처리. from = 밀린 것을 세기 시작한 날(보통 어제) */
  applyCatchup: (taskId: string, way: CatchupWay, from: string, today: string) =>
    setState((s) => {
      const t = s.tasks.find((x) => x.id === taskId)
      if (!t || t.type !== 'amount' || way === 'spread') return s
      const recs = s.recs[taskId] ?? {}
      const off = offFor(s, t)
      const base = expectIfOnTrack(t, recs, from, today, off)
      if (way === 'today') {
        const left = t.amount - sumDone(recs)
        const v = Math.min(base + missedSince(recs, from, today), left)
        return patchTask(s, taskId, (x) => ({ ...x, custom: { ...x.custom, [today]: v } }))
      }
      const end = extendEnd(t, recs, today, base, off)
      return end ? patchTask(s, taskId, (x) => ({ ...x, endDate: end })) : s
    }),
  /** 할 일을 다른 날로 옮긴다 */
  moveTodo: (taskId: string, date: string) =>
    setState((s) => patchTask(s, taskId, (t) => ({ ...t, startDate: date, endDate: date, due: t.due && t.due < date ? date : t.due }))),
  // 전체 쉬는 날. '내일로'는 그날 몫을 다음 날 분량에 더해 두고, 취소·방법 바꾸기 때 되돌린다
  setRestDay: (date: string, way: RestWay | null) =>
    setState((s) => {
      const tomorrow = addDays(date, 1)
      const restDays = { ...s.settings.restDays }
      const restMoves = { ...s.settings.restMoves }
      let next: State = s
      // 이전에 내일로 옮긴 것을 되돌린다
      if (restDays[date] === 'tomorrow' && restMoves[date]) {
        for (const id of Object.keys(restMoves[date])) next = patchTask(next, id, (t) => { const custom = { ...t.custom }; delete custom[tomorrow]; return { ...t, custom } })
        delete restMoves[date]
      }
      // 쉬는 날이 아니었을 때의 그날 몫
      const without = { ...s.settings.restDays }
      delete without[date]
      const base = { exams: s.exams, settings: { ...s.settings, restDays: without } }
      if (way === null) delete restDays[date]
      else restDays[date] = way
      if (way === 'tomorrow') {
        const moves: Record<string, number> = {}
        for (const t of next.tasks) {
          if (t.type !== 'amount' || t.archived || t.completed) continue
          const recs = next.recs[t.id] ?? {}
          const was = liveExpect(t, recs, date, offFor(base, t))
          if (was <= 0) continue
          moves[t.id] = was
          const tom = liveExpect(t, recs, tomorrow, offFor(base, t))
          next = patchTask(next, t.id, (x) => ({ ...x, custom: { ...x.custom, [tomorrow]: tom + was } }))
        }
        restMoves[date] = moves
      }
      return { ...next, settings: { ...next.settings, restDays, restMoves } }
    }),
  // 공부 시간 기록 (rec.sec는 합계, histories는 목록)
  startTimer: (taskId: string, date: string) => setState((s) => ({ ...s, timer: { taskId, date, startedAt: Date.now() } })),
  stopTimer: () =>
    setState((s) => {
      if (!s.timer) return s
      const { taskId, date, startedAt } = s.timer
      const endedAt = Date.now()
      const sec = Math.round(timerElapsed(s.timer, endedAt))
      const next = sec > 0 ? patchRec(s, taskId, date, (r) => ({ ...r, sec: r.sec + sec })) : s
      const id = uid()
      lastStopped = sec > 0 ? { id, taskId, date, sec } : null
      return { ...next, timer: null, histories: sec > 0 ? [...s.histories, { id, taskId, date, startedAt, endedAt }] : s.histories }
    }),
  /** 재고 있는 시간을 다른 계획으로 (시작 시각은 그대로) */
  switchTimerTask: (taskId: string) => setState((s) => (s.timer ? { ...s, timer: { ...s.timer, taskId } } : s)),
  pauseTimer: () => setState((s) => (s.timer && s.timer.pausedAt === undefined ? { ...s, timer: { ...s.timer, pausedAt: Date.now() } } : s)),
  resumeTimer: () =>
    setState((s) => {
      const t = s.timer
      if (!t || t.pausedAt === undefined) return s
      const { pausedAt, ...rest } = t
      return { ...s, timer: { ...rest, pausedMs: (t.pausedMs ?? 0) + (Date.now() - pausedAt) } }
    }),
  /** 방금 잰 시간을 다른 계획으로 옮긴다 */
  reassignHistory: (id: string, taskId: string) =>
    setState((s) => {
      const h = s.histories.find((x) => x.id === id)
      if (!h || h.taskId === taskId) return s
      const sec = Math.round((h.endedAt - h.startedAt) / 1000)
      const minus = patchRec(s, h.taskId, h.date, (r) => ({ ...r, sec: Math.max(0, r.sec - sec) }))
      return { ...patchRec(minus, taskId, h.date, (r) => ({ ...r, sec: r.sec + sec })), histories: s.histories.map((x) => (x.id === id ? { ...x, taskId } : x)) }
    }),
  addHistory: (h: Omit<TimeHistory, 'id'>) =>
    setState((s) => {
      const sec = Math.round((h.endedAt - h.startedAt) / 1000)
      if (sec <= 0) return s
      return { ...patchRec(s, h.taskId, h.date, (r) => ({ ...r, sec: r.sec + sec })), histories: [...s.histories, { ...h, id: uid() }] }
    }),
  deleteHistory: (id: string) =>
    setState((s) => {
      const h = s.histories.find((x) => x.id === id)
      if (!h) return s
      const sec = Math.round((h.endedAt - h.startedAt) / 1000)
      return { ...patchRec(s, h.taskId, h.date, (r) => ({ ...r, sec: Math.max(0, r.sec - sec) })), histories: s.histories.filter((x) => x.id !== id) }
    }),
  saveCategory: (c: Category) => setState((s) => ({ ...s, categories: upsert(s.categories, c) })),
  deleteCategory: (id: string) =>
    setState((s) => ({ ...s, settings: { ...s.settings, oldCategories: [...s.settings.oldCategories.filter((c) => c.id !== id), ...s.categories.filter((c) => c.id === id)] }, categories: s.categories.filter((c) => c.id !== id), tasks: s.tasks.map((t) => (t.categoryId === id ? { ...t, categoryId: null } : t)) })),
  saveExam: (e: Exam) =>
    setState((s) => {
      const list = upsert(s.exams, e)
      return { ...s, exams: e.selected ? list.map((x) => ({ ...x, selected: x.id === e.id })) : list }
    }),
  deleteExam: (id: string) => setState((s) => ({ ...s, exams: s.exams.filter((d) => d.id !== id) })),
  saveDiary: (d: Diary) => setState((s) => ({ ...s, diaries: upsert(s.diaries, d) })),
  deleteDiary: (id: string) =>
    setState((s) => {
      s.diaries.find((d) => d.id === id)?.photoIds.forEach((p) => void deletePhoto(p))
      return { ...s, diaries: s.diaries.filter((d) => d.id !== id) }
    }),
  setSettings: (patch: Partial<Settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
}

// ── 백업 ────────────────────────────────────────────────────
const blobToDataURL = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = () => rej(r.error)
    r.readAsDataURL(b)
  })

/** 백업 파일을 내려받고 마지막 백업 시각을 적는다 */
export async function downloadBackup() {
  const url = URL.createObjectURL(new Blob([await exportBackup()], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `todait-backup-${todayISO()}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
  actions.setSettings({ lastBackupAt: Date.now() })
}

export async function exportBackup() {
  const photos: Record<string, string> = {}
  for (const d of state.diaries)
    for (const id of d.photoIds) {
      const b = await loadPhoto(id)
      if (b) photos[id] = await blobToDataURL(b)
    }
  return JSON.stringify({ app: 'todait-web', version: STATE_VERSION, exportedAt: new Date().toISOString(), state: { ...state, timer: null }, photos })
}

/** 덮어쓰기 전에 지금 기록을 한 칸 따로 남긴다 (잘못 불러오거나 초기화했을 때 되살릴 수 있게) */
const keepCopy = (key: string) => idb('kv', 'readwrite', (s) => s.put({ ...state, timer: null, savedAt: Date.now() }, key))

export async function importBackup(json: string) {
  const data = JSON.parse(json)
  if (data?.app !== 'todait-web' || !data.state || !Array.isArray(data.state.tasks)) throw new Error('Todait 백업 파일이 아닙니다')
  const next = migrate(data.state)
  await keepCopy('state-before-import')
  for (const [id, url] of Object.entries((data.photos ?? {}) as Record<string, string>)) {
    const blob = await (await fetch(url)).blob()
    await idb('photos', 'readwrite', (s) => s.put(blob, id))
  }
  setState(() => ({ ...next, timer: null }))
  await flushSave()
}

export async function resetAll() {
  await keepCopy('state-before-reset')
  await idb('photos', 'readwrite', (s) => s.clear())
  setState(() => emptyState())
  await flushSave()
}
