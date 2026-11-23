// 개발용 가상 데이터. `npm run dev` 주소에 ?demo=장면 을 붙이면 켜진다 (배포 빌드에서는 아무것도 하지 않는다).
// - 실제 기록과 섞이지 않게 IndexedDB를 'todait-demo'로 바꿔 쓴다.
// - 장면의 날짜·시각으로 시계를 옮긴다 (시간은 계속 흐른다).
// - 장면이 바뀌거나 &reset 을 붙이면 다시 채운다. 같은 장면이면 고친 내용이 남는다.
// 장면: mid(수요일 저녁) · done(목표 다 함) · monday(새 주) · catchup(어제 밀림) · rest(쉬는 날) · empty(첫날) · tight(공부 시간이 빠듯해 넘치는 날이 있음)
// 예: http://localhost:5173/?demo=mid   ·   ?demo=done&t=23:30   ·   ?demo=mid&reset
import { addDays, diffDays, dow } from './date.ts'
import { liveExpect, secPerUnit, type Chapter, type Task } from './logic.ts'
import { emptyState, offFor, type State, type TimeHistory } from './model.ts'

type Scene = { date: string; clock: string; today: 'none' | 'part' | 'full'; missYesterday?: boolean; rest?: boolean; empty?: boolean; tight?: boolean }
const SCENES: Record<string, Scene> = {
  mid: { date: '2026-11-25', clock: '20:30', today: 'part' },
  done: { date: '2026-11-25', clock: '22:10', today: 'full' },
  monday: { date: '2026-11-23', clock: '08:10', today: 'none' },
  catchup: { date: '2026-11-26', clock: '07:40', today: 'none', missYesterday: true },
  rest: { date: '2026-11-25', clock: '10:20', today: 'none', rest: true },
  empty: { date: '2026-11-25', clock: '19:00', today: 'none', empty: true },
  tight: { date: '2026-11-25', clock: '20:30', today: 'part', tight: true },
}

const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null
const name = import.meta.env.DEV ? params?.get('demo') ?? null : null
const scene = name ? SCENES[name] ?? SCENES.mid : null

if (scene) {
  // 시계 옮기기
  const RealDate = Date
  const clock = params!.get('t') ?? scene.clock
  const [y, m, d] = scene.date.split('-').map(Number)
  const [hh, mm] = clock.split(':').map(Number)
  const offset = new RealDate(y, m - 1, d, hh, mm).getTime() - RealDate.now()
  class FakeDate extends RealDate {
    constructor(...args: unknown[]) {
      // @ts-expect-error 인자를 그대로 넘긴다
      if (args.length === 0) super(RealDate.now() + offset); else super(...args)
    }
    static now() { return RealDate.now() + offset }
  }
  globalThis.Date = FakeDate as DateConstructor
  // 저장소 바꾸기
  const open = indexedDB.open.bind(indexedDB)
  indexedDB.open = ((n: string, v?: number) => open(n === 'todait' ? 'todait-demo' : n, v)) as typeof indexedDB.open
  document.title = `[데모 ${name}] ${document.title}`
}

/** 데모면 저장소를 장면 데이터로 채운다 */
export async function demoReady(): Promise<void> {
  if (!scene) return
  const db = await new Promise<IDBDatabase>((res, rej) => {
    const r = indexedDB.open('todait', 1) // 위에서 todait-demo로 바뀜
    r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('photos') }
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
  const kv = (mode: IDBTransactionMode) => db.transaction('kv', mode).objectStore('kv')
  const req = <T>(r: IDBRequest) => new Promise<T>((res, rej) => { r.onsuccess = () => res(r.result as T); r.onerror = () => rej(r.error) })
  const prev = await req<string | undefined>(kv('readonly').get('demo-scene'))
  if (prev !== name || params!.has('reset')) {
    const s = build(scene)
    await req(kv('readwrite').put(s, 'state'))
    await req(kv('readwrite').put(name, 'demo-scene'))
  }
  db.close()
}

// ── 장면 데이터 만들기 ─────────────────────────────────────

/** 같은 글자면 늘 같은 0~1 값 */
const rnd = (key: string) => {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return ((h >>> 0) % 10000) / 10000
}

const WEEKDAYS = [false, true, true, true, true, true, true]
const ALL = [true, true, true, true, true, true, true]
let seq = 0
const id = (p: string) => `${p}-${++seq}`

function mk(p: Partial<Task> & Pick<Task, 'name' | 'kind' | 'type' | 'startDate'>): Task {
  return {
    id: id('t'), unit: '쪽', startPoint: null, amount: 0, perDay: 0, endDate: null, week: WEEKDAYS,
    repeatEvery: null, supplementDow: null, custom: {}, categoryId: null, notifyTime: null,
    completed: false, completedDate: null, archived: false, order: seq, createdAt: 0, ...p,
  }
}

const chapters = (names: string[], from: number, to: number): Chapter[] => {
  const n = names.length
  const size = (to - from + 1) / n
  return names.map((nm, i) => ({ id: id('c'), name: nm, from: Math.round(from + i * size), to: i === n - 1 ? to : Math.round(from + (i + 1) * size) - 1 }))
}

function build(sc: Scene): State {
  seq = 0
  const T = sc.date
  const now = Date.now()
  const s = emptyState()
  s.settings = { ...s.settings, lastBackupAt: now - 2 * 86400000, catchupSeenOn: T, weekCardSeen: null }
  if (sc.empty) return s
  // 과목은 처음에 비어 있으므로 장면에서 채운다
  s.categories = [{ id: 'c1', name: '국어', color: '#3d8762' }, { id: 'c2', name: '수학', color: '#4a67ad' }, { id: 'c3', name: '영어', color: '#8d5aa0' }]
  const [kor, math, eng] = s.categories.map((c) => c.id)
  if (sc.tight) s.settings.studyWindows = { weekday: [[20 * 60, 21 * 60]], weekend: [[10 * 60, 11 * 60]] }
  s.categories.push({ id: 'c4', name: '과학', color: '#2c7f8c' })

  const at = (n: number) => addDays(T, n)
  const tasks: Task[] = [
    mk({
      name: '수학의 정석 수학Ⅱ', kind: 'book', bookMode: 'toc', split: 'chapter', type: 'amount', categoryId: math,
      startPoint: 1, amount: 320, startDate: at(-38), endDate: at(14),
      chapters: chapters(['함수의 극한', '함수의 연속', '미분계수와 도함수', '도함수의 활용 1', '도함수의 활용 2', '부정적분', '정적분', '정적분의 활용'], 1, 320),
    }),
    mk({
      name: '쎈 수학Ⅱ', kind: 'book', bookMode: 'workbook', type: 'amount', unit: '문항', categoryId: math,
      startPoint: 1, amount: 480, startDate: at(-30), endDate: at(13),
      chapters: chapters(['함수의 극한과 연속', '미분', '도함수의 활용', '적분', '정적분의 활용'], 1, 480),
    }),
    mk({
      name: '영어 독해 인강 (수능 대비 완성)', kind: 'lecture', type: 'amount', unit: '강', categoryId: eng,
      startPoint: 1, amount: 30, startDate: at(-31), endDate: at(10),
      lectures: Array.from({ length: 30 }, (_, i) => ({ title: `${i + 1}강 ${['주제 찾기', '요지 파악', '빈칸 추론', '순서 배열', '문장 삽입', '요약문'][i % 6]}`, min: 35 + (i % 4) * 5 })),
    }),
    mk({
      name: '국어 비문학 독해', kind: 'book', bookMode: 'amount', type: 'amount', categoryId: kor,
      startPoint: 1, amount: 180, startDate: at(-24), endDate: at(12),
    }),
    mk({ name: '물리 개념 정리', kind: 'time', type: 'time', unit: '', perDay: 3600, categoryId: 'c4', startDate: at(-20) }),
    mk({ name: '영단어 50개', kind: 'habit', type: 'daily', unit: '단어', perDay: 50, categoryId: eng, startDate: at(-40), week: ALL, keepOnRest: true }),
    mk({ name: '아침 스트레칭', kind: 'habit', type: 'check', unit: '', categoryId: null, startDate: at(-26), week: ALL }),
    mk({ name: '수행평가 보고서 제출', kind: 'todo', type: 'check', unit: '', categoryId: kor, startDate: T, endDate: T, due: at(2) }),
    mk({ name: '오답노트 정리', kind: 'todo', type: 'check', unit: '', categoryId: math, startDate: T, endDate: T }),
    mk({ name: '학원 숙제 프린트', kind: 'todo', type: 'check', unit: '', categoryId: eng, startDate: at(3), endDate: at(3), due: at(3) }),
    mk({ name: '실험 보고서 초안', kind: 'todo', type: 'check', unit: '', categoryId: 'c4', startDate: at(-1), endDate: at(-1) }),
  ]
  tasks.forEach((t, i) => { t.order = i; t.createdAt = new Date(t.startDate).getTime() })
  s.tasks = tasks
  s.exams = [{ id: 'e1', name: '2학기 기말고사', date: at(17), selected: true, blankDays: 2, scope: [], fitEnd: false }]
  if (sc.rest) s.settings.restDays = { [T]: 'spread' }
  if (sc.missYesterday) s.settings.catchupSeenOn = at(-1)

  /** 그날 목표 대비 얼마나 했나 (0~1 이상) */
  const perf = (t: Task, d: string): number => {
    if (d === T) {
      if (sc.today === 'full') return 1
      if (sc.today === 'none') return 0
      return ({ book: 0.6, lecture: 0, time: 0.75, habit: 1, todo: 0 } as const)[t.kind] * (t.bookMode === 'workbook' ? 0 : 1)
    }
    if (sc.missYesterday && d === at(-1)) return t.kind === 'habit' ? 1 : t.kind === 'time' ? 0.4 : 0
    const p = rnd(t.id + d)
    if (t.kind === 'lecture') return p < 0.25 ? 0 : p < 0.55 ? 0.5 : 1
    if (t.kind === 'habit') return p < 0.08 ? 0 : 1
    if (d >= at(-3) && t.name.startsWith('수학의 정석')) return p < 0.5 ? 0.7 : 1 // 최근에 조금 밀림
    return p < 0.08 ? 0 : p < 0.25 ? 0.7 : p > 0.9 ? 1.3 : 1
  }

  const histories: TimeHistory[] = []
  const start = tasks.reduce((a, t) => (t.startDate < a ? t.startDate : a), T)
  for (let d = start; d <= T; d = addDays(d, 1)) {
    const isToday = d === T
    const weekend = dow(d) === 0 || dow(d) === 6
    const [yy, mo, dd] = d.split('-').map(Number)
    let cursor = new Date(yy, mo - 1, dd, weekend ? 10 : 16, 0).getTime() + Math.round(rnd('c' + d) * 40) * 60000
    if (isToday && sc.today === 'full') cursor = new Date(yy, mo - 1, dd, 13, 0).getTime()
    for (const t of tasks) {
      if (d < t.startDate || (t.endDate && d > t.endDate)) continue
      const recs = (s.recs[t.id] ??= {})
      const e = liveExpect(t, recs, d, offFor(s, t))
      if (e <= 0) continue
      const f = perf(t, d)
      let done = 0, sec = 0, checked = false
      if (t.type === 'time') sec = Math.round((e * f) / 60) * 60
      else if (t.type === 'check') { checked = f >= 0.5; sec = checked && t.kind === 'habit' ? 600 : 0 }
      else {
        done = Math.round(e * f)
        if (t.type === 'amount') done = Math.min(done, t.amount - Object.values(recs).reduce((a, r) => a + r.done, 0))
        sec = Math.round(done * (t.type === 'daily' ? 24 : secPerUnit(t, {})) * (0.8 + 0.4 * rnd('s' + t.id + d)))
      }
      if (!done && !sec && !checked) { if (!isToday) recs[d] = { expect: e, done: 0, sec: 0, checked: false }; continue }
      const rec = { ...(isToday ? {} : { expect: e }), done, sec, checked }
      if (t.bookMode === 'workbook' && done) {
        const right = Math.round(done * (0.68 + 0.25 * rnd('r' + t.id + d)))
        Object.assign(rec, { right, wrong: done - right })
      }
      recs[d] = rec
      // 공부 시간 덩어리: 50분 넘으면 둘로 나눈다
      let left = sec
      while (left > 0) {
        const part = left > 3000 ? Math.round(left / 2 / 60) * 60 : left
        histories.push({ id: id('h'), taskId: t.id, date: d, startedAt: cursor, endedAt: cursor + part * 1000 })
        cursor += part * 1000 + (8 + Math.round(rnd('g' + cursor) * 15)) * 60000
        left -= part
      }
      // 단원 끝낸 날·이해도
      if (t.chapters && t.startPoint !== null) {
        const pos = t.startPoint + Object.values(recs).reduce((a, r) => a + r.done, 0)
        for (const c of t.chapters) {
          if (c.doneDate || c.to >= pos) continue
          c.doneDate = d
          const g = rnd('grade' + c.id)
          c.grade = g < 0.3 ? 'low' : g < 0.7 ? 'mid' : 'high'
          if (diffDays(d, T) > 9 && g > 0.5) c.reviews = [addDays(d, 7)]
        }
      }
    }
  }
  s.histories = histories
  // 메모 몇 줄
  const mathRecs = s.recs[tasks[0].id]
  const memoDays = Object.keys(mathRecs).filter((d) => mathRecs[d].done > 0).slice(-6)
  if (memoDays[0]) mathRecs[memoDays[0]].note = '극한 정의 다시 보기. 좌극한·우극한 헷갈림'
  if (memoDays[3]) mathRecs[memoDays[3]].note = '예제 12번 풀이 방식 외우기'
  return s
}
