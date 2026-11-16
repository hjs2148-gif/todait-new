// 앱 상태와 IndexedDB 저장. 서버 없이 이 기기 브라우저에만 저장된다.
import { useSyncExternalStore } from 'react'
import { todayISO } from './date.ts'
import { futurePlan, rollForward, sumDone, type DayRec, type Recs, type Task } from './logic.ts'

export interface Category { id: string; name: string; color: string }
export interface DDay { id: string; name: string; date: string; selected: boolean }
export interface Diary { id: string; date: string; taskId: string | null; body: string; photoIds: string[]; timestamp: number }
export interface TimeHistory { id: string; taskId: string; date: string; startedAt: number; endedAt: number }
export interface Settings { notifyOn: boolean; dailyNotifyTime: string | null }
export interface Timer { taskId: string; date: string; startedAt: number }

export interface State {
  tasks: Task[]
  recs: Record<string, Recs>
  categories: Category[]
  ddays: DDay[]
  diaries: Diary[]
  histories: TimeHistory[]
  settings: Settings
  timer: Timer | null
}

export const COLORS = ['#00d2b1', '#5393d1', '#7e5df4', '#f6656e', '#ffc968', '#ff877d', '#65d3da', '#be99cb', '#38ba9c', '#848484']

const empty = (): State => ({
  tasks: [], recs: {}, ddays: [], diaries: [], histories: [], timer: null,
  categories: [
    { id: 'c1', name: '국어', color: COLORS[3] },
    { id: 'c2', name: '수학', color: COLORS[1] },
    { id: 'c3', name: '영어', color: COLORS[2] },
  ],
  settings: { notifyOn: false, dailyNotifyTime: '08:00' },
})

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
let state: State = empty()
const listeners = new Set<() => void>()
let saveTimer: ReturnType<typeof setTimeout> | undefined

const freeze = (s: State): State => {
  const today = todayISO()
  let recs = s.recs
  for (const t of s.tasks) {
    const cur = recs[t.id] ?? {}
    const next = rollForward(t, cur, today)
    if (next !== cur) {
      if (recs === s.recs) recs = { ...recs }
      recs[t.id] = next
    }
  }
  return recs === s.recs ? s : { ...s, recs }
}

export const getState = () => state
export function setState(fn: (s: State) => State) {
  const next = freeze(fn(state))
  if (next === state) return
  state = next
  listeners.forEach((l) => l())
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => void idb('kv', 'readwrite', (s) => s.put(state, 'state')), 150)
}
export const useStore = () =>
  useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, getState)

export async function loadState() {
  const saved = await idb<State | undefined>('kv', 'readonly', (s) => s.get('state'))
  state = freeze(saved ? { ...empty(), ...saved } : empty())
  navigator.storage?.persist?.().catch(() => {})
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
  if (!p) m.set(key, (p = futurePlan(t, s.recs[t.id] ?? {}, today)))
  return p
}

// ── 동작 ────────────────────────────────────────────────────
const patchRec = (s: State, taskId: string, date: string, fn: (r: DayRec) => DayRec): State => {
  const recs = s.recs[taskId] ?? {}
  const rec = fn(recs[date] ?? { done: 0, sec: 0, checked: false })
  return { ...s, recs: { ...s.recs, [taskId]: { ...recs, [date]: rec } } }
}
const patchTask = (s: State, id: string, fn: (t: Task) => Task): State => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? fn(t) : t)) })

/** 분량 계획은 전체 분량을 다 채우면 자동 완료, 다시 줄이면 완료 취소 */
const syncCompleted = (s: State, taskId: string, date: string): State =>
  patchTask(s, taskId, (t) => {
    if (t.type !== 'amount') return t
    const full = sumDone(s.recs[taskId] ?? {}) >= t.amount
    if (full === t.completed) return t
    return { ...t, completed: full, completedDate: full ? date : null }
  })

export const actions = {
  saveTask: (task: Task) =>
    setState((s) => {
      const exists = s.tasks.some((t) => t.id === task.id)
      const next = exists ? patchTask(s, task.id, () => task) : { ...s, tasks: [...s.tasks, task] }
      return syncCompleted(next, task.id, todayISO())
    }),
  deleteTask: (id: string) =>
    setState((s) => {
      const { [id]: _, ...recs } = s.recs
      return { ...s, tasks: s.tasks.filter((t) => t.id !== id), recs, histories: s.histories.filter((h) => h.taskId !== id), timer: s.timer?.taskId === id ? null : s.timer }
    }),
  patchTask: (id: string, patch: Partial<Task>) => setState((s) => patchTask(s, id, (t) => ({ ...t, ...patch }))),
  setDone: (taskId: string, date: string, done: number) =>
    setState((s) => syncCompleted(patchRec(s, taskId, date, (r) => ({ ...r, done: Math.max(0, done) })), taskId, date)),
  setSec: (taskId: string, date: string, sec: number) => setState((s) => patchRec(s, taskId, date, (r) => ({ ...r, sec: Math.max(0, sec) }))),
  toggleCheck: (taskId: string, date: string) => setState((s) => patchRec(s, taskId, date, (r) => ({ ...r, checked: !r.checked }))),
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
  startTimer: (taskId: string, date: string) => setState((s) => ({ ...s, timer: { taskId, date, startedAt: Date.now() } })),
  stopTimer: () =>
    setState((s) => {
      if (!s.timer) return s
      const { taskId, date, startedAt } = s.timer
      const endedAt = Date.now()
      const sec = Math.round((endedAt - startedAt) / 1000)
      const next = sec > 0 ? patchRec(s, taskId, date, (r) => ({ ...r, sec: r.sec + sec })) : s
      return { ...next, timer: null, histories: sec > 0 ? [...s.histories, { id: uid(), taskId, date, startedAt, endedAt }] : s.histories }
    }),
  saveCategory: (c: Category) =>
    setState((s) => ({ ...s, categories: s.categories.some((x) => x.id === c.id) ? s.categories.map((x) => (x.id === c.id ? c : x)) : [...s.categories, c] })),
  deleteCategory: (id: string) =>
    setState((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id), tasks: s.tasks.map((t) => (t.categoryId === id ? { ...t, categoryId: null } : t)) })),
  saveDDay: (d: DDay) =>
    setState((s) => {
      const list = s.ddays.some((x) => x.id === d.id) ? s.ddays.map((x) => (x.id === d.id ? d : x)) : [...s.ddays, d]
      return { ...s, ddays: d.selected ? list.map((x) => ({ ...x, selected: x.id === d.id })) : list }
    }),
  deleteDDay: (id: string) => setState((s) => ({ ...s, ddays: s.ddays.filter((d) => d.id !== id) })),
  saveDiary: (d: Diary) =>
    setState((s) => ({ ...s, diaries: s.diaries.some((x) => x.id === d.id) ? s.diaries.map((x) => (x.id === d.id ? d : x)) : [...s.diaries, d] })),
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

export async function exportBackup() {
  const photos: Record<string, string> = {}
  for (const d of state.diaries)
    for (const id of d.photoIds) {
      const b = await loadPhoto(id)
      if (b) photos[id] = await blobToDataURL(b)
    }
  return JSON.stringify({ app: 'todait-web', version: 1, exportedAt: new Date().toISOString(), state: { ...state, timer: null }, photos })
}

export async function importBackup(json: string) {
  const data = JSON.parse(json)
  if (data?.app !== 'todait-web' || !data.state || !Array.isArray(data.state.tasks)) throw new Error('Todait 백업 파일이 아닙니다')
  for (const [id, url] of Object.entries((data.photos ?? {}) as Record<string, string>)) {
    const blob = await (await fetch(url)).blob()
    await idb('photos', 'readwrite', (s) => s.put(blob, id))
  }
  setState(() => ({ ...empty(), ...data.state, timer: null }))
}

export async function resetAll() {
  await idb('photos', 'readwrite', (s) => s.clear())
  setState(() => empty())
}
