import assert from 'node:assert/strict'
import {
  avgPerDay, currentChapter, doneInRange, expectIfOnTrack, extendEnd, futurePlan, liveExpect, missedSince, rollForward, secPerUnit,
  type Recs, type Task,
} from './logic.ts'
import { backupDue, DEFAULT_WIDGETS, guessKind, isoWeek, migrate, minGoalMet, offFor, STATE_VERSION, emptyState, type Exam } from './model.ts'

const base: Task = {
  id: 't', name: '수학', type: 'amount', kind: 'book', bookMode: 'amount', unit: '쪽', startPoint: 1, amount: 100, perDay: 0,
  startDate: '2026-11-02', endDate: '2026-11-11', // 월 ~ 다음 주 수, 10일
  week: [true, true, true, true, true, true, true], repeatEvery: null, supplementDow: null, custom: {},
  categoryId: null, notifyTime: null, completed: false, completedDate: null, archived: false, order: 0, createdAt: 0,
}
const rec = (expect: number, done: number) => ({ expect, done, sec: 0, checked: false })

// ── 쉬는 날(off): 분량 0으로 보고 나머지 날에 나눈다 ───────────
const off2 = (d: string) => d === '2026-11-03' || d === '2026-11-04'
assert.equal(liveExpect(base, {}, '2026-11-02', off2), 13) // 100 / 8일 = 올림 13
assert.equal(liveExpect(base, {}, '2026-11-03', off2), 0)
// 직접 바꾼 분량이 쉬는 날보다 우선
assert.equal(liveExpect({ ...base, custom: { '2026-11-03': 5 } }, {}, '2026-11-03', off2), 5)
// 쉬는 날은 지난 날로 고정할 때도 밀린 것으로 치지 않는다
const frozen = rollForward(base, {}, '2026-11-05', off2)
assert.equal(frozen['2026-11-03'], undefined)
assert.equal(frozen['2026-11-02'].expect, 13)
// 습관도 쉬는 날엔 0
const habit: Task = { ...base, type: 'check', kind: 'habit', endDate: null }
assert.equal(liveExpect(habit, {}, '2026-11-03', off2), 0)
assert.equal(liveExpect(habit, {}, '2026-11-05', off2), 1)

// ── 목차 '단원 순서대로': 단원 끝 근처면 단원 끝에서 끊는다 ───────
const toc: Task = {
  ...base, bookMode: 'toc', split: 'chapter',
  chapters: [
    { id: 'a', name: '1단원', from: 1, to: 12 },
    { id: 'b', name: '2단원', from: 13, to: 30 },
    { id: 'c', name: '3단원', from: 31, to: 100 },
  ],
}
assert.equal(liveExpect(toc, {}, '2026-11-02'), 12) // 10쪽 끝(10쪽)이 1단원 끝(12쪽)과 2쪽 차이 → 12쪽
assert.equal(liveExpect({ ...toc, split: 'even' }, {}, '2026-11-02'), 10)
assert.equal(liveExpect(toc, { '2026-11-02': rec(12, 12) }, '2026-11-03'), 10) // 22쪽 끝, 30쪽까지 8쪽 → 그대로
const tocPlan = futurePlan(toc, {}, '2026-11-02')
assert.equal(Object.values(tocPlan).reduce((a, b) => a + b, 0), 100)
assert.equal(currentChapter(toc, { '2026-11-02': rec(12, 12) })?.id, 'b')
assert.equal(currentChapter(toc, { '2026-11-02': rec(100, 100) }), null)

// ── 밀린 분량 정리 ─────────────────────────────────────────
const missed: Recs = { '2026-11-02': rec(10, 0) }
assert.equal(missedSince(missed, '2026-11-02', '2026-11-03'), 10)
assert.equal(liveExpect(base, missed, '2026-11-03'), 12) // 남은 날에 나누기(기본)
assert.equal(expectIfOnTrack(base, missed, '2026-11-02', '2026-11-03'), 10) // 밀리지 않았다면 10쪽
// 끝나는 날 늦추기: 하루 10쪽 그대로 → 11일 → 12일
assert.equal(extendEnd(base, missed, '2026-11-03', 10), '2026-11-12')
assert.equal(liveExpect({ ...base, endDate: '2026-11-12' }, missed, '2026-11-03'), 10)
// 오늘 더하기: 오늘 20쪽으로 바꾸면 다음 날부터 10쪽
const addToday = { ...base, custom: { '2026-11-03': 20 } }
assert.equal(liveExpect(addToday, missed, '2026-11-03'), 20)
assert.equal(liveExpect(addToday, { ...missed, '2026-11-03': rec(20, 20) }, '2026-11-04'), 10)
assert.equal(avgPerDay({ a: 7, b: 8, c: 0 }), 7.5)

// ── 진도 계산 ─────────────────────────────────────────────
assert.equal(doneInRange(base, { '2026-11-02': rec(10, 40) }, 31, 60), 10) // 1~40쪽 중 31~60 범위
assert.equal(doneInRange({ ...base, startPoint: 50 }, { '2026-11-02': rec(10, 5) }, 1, 40), 0)
assert.equal(secPerUnit(base, {}), 180)
assert.equal(secPerUnit({ ...base, bookMode: 'workbook' }, {}), 120)
assert.equal(secPerUnit({ ...base, kind: 'lecture', lectures: [{ title: '1강', min: 40 }, { title: '2강', min: 20 }] }, {}), 1800)
assert.equal(secPerUnit(base, { d: { done: 10, sec: 1200, checked: false } }), 120) // 기록이 있으면 실제 속도

// ── 쉬는 날 모으기: 시험 비워 둘 날, 멈춘 기간, 전체 쉬는 날 ───────
const exam: Exam = { id: 'e', name: '기말', date: '2026-11-11', selected: true, blankDays: 2, scope: [{ taskId: 't', from: null, to: null }], fitEnd: false }
const s0 = { ...emptyState(), exams: [exam] }
const offT = offFor(s0, base)!
assert.ok(offT('2026-11-09') && offT('2026-11-10') && !offT('2026-11-11') && !offT('2026-11-08'))
assert.equal(offFor(s0, { ...base, id: 'other' }), undefined) // 범위 밖 계획은 그대로
const paused = { ...base, pauses: [{ from: '2026-11-05', to: null }] }
assert.ok(offFor(emptyState(), paused)!('2026-11-20'))
const rest = { ...emptyState(), settings: { ...emptyState().settings, restDays: { '2026-11-04': 'spread' as const } } }
assert.ok(offFor(rest, base)!('2026-11-04'))
assert.equal(offFor(rest, { ...habit, keepOnRest: true }), undefined) // 쉬는 날에도 하는 습관
assert.equal(offFor(rest, { ...habit, kind: 'todo' }), undefined) // 할 일은 전체 쉬는 날과 무관
// 범위를 고르지 않은 시험은 진행 중인 책·인강 전부에 비워 둘 날을 적용한다 (시간 계획은 제외)
const allScope = { ...emptyState(), exams: [{ ...exam, scope: [] }] }
assert.ok(offFor(allScope, base)!('2026-11-10'))
assert.equal(offFor(allScope, { ...base, type: 'time', kind: 'time' }), undefined)

// ── 옛 기록 옮기기 (v1 → v2) ──────────────────────────────────
const { kind: _k, bookMode: _b, ...v1Task } = base
const v1 = {
  tasks: [
    v1Task,
    { ...v1Task, id: 'l', unit: '강' },
    { ...v1Task, id: 'w', unit: '문항' },
    { ...v1Task, id: 'h', type: 'daily', unit: '개' },
    { ...v1Task, id: 'c', type: 'check', unit: '' },
    { ...v1Task, id: 'tm', type: 'time', unit: '' },
  ],
  recs: { t: { '2026-11-02': rec(10, 8) } },
  categories: [{ id: 'c1', name: '국어', color: '#f00' }],
  ddays: [{ id: 'd1', name: '수능', date: '2026-11-19', selected: true }],
  diaries: [{ id: 'y', date: '2026-11-02', taskId: null, body: '메모', photoIds: ['p'], timestamp: 1 }],
  histories: [{ id: 'h1', taskId: 't', date: '2026-11-02', startedAt: 0, endedAt: 60000 }],
  settings: { notifyOn: true, dailyNotifyTime: '09:00' },
  timer: null,
}
const v2 = migrate(JSON.parse(JSON.stringify(v1)))
assert.equal(v2.version, STATE_VERSION)
assert.deepEqual(v2.tasks.map((t) => [t.kind, t.bookMode]), [
  ['book', 'amount'], ['lecture', undefined], ['book', 'workbook'], ['habit', undefined], ['habit', undefined], ['time', undefined],
])
assert.deepEqual(v2.recs, v1.recs) // 기록은 그대로
assert.deepEqual(v2.histories, v1.histories)
assert.deepEqual(v2.diaries, v1.diaries)
assert.deepEqual(v2.categories, v1.categories)
assert.deepEqual(v2.exams, [{ id: 'd1', name: '수능', date: '2026-11-19', selected: true, blankDays: 0, scope: [], fitEnd: false }])
assert.equal(v2.settings.notifyOn, true)
assert.equal(v2.settings.dailyNotifyTime, '09:00')
assert.equal(v2.settings.streakMinSec, 600)
assert.deepEqual(v2.settings.widgets, DEFAULT_WIDGETS)
assert.equal((v2 as unknown as { ddays?: unknown }).ddays, undefined)
// 옮긴 뒤에도 배분 결과는 같다
assert.equal(liveExpect(v2.tasks[0], v2.recs.t, '2026-11-03'), liveExpect(base, v1.recs.t, '2026-11-03'))
// 이미 v2면 그대로, 깨진 값이면 빈 상태
assert.deepEqual(migrate(v2), v2)
assert.deepEqual(migrate(null), emptyState())
assert.deepEqual(guessKind({ type: 'amount', unit: '쪽' }), { kind: 'book', bookMode: 'amount' })

// 백업 알림: 기록이 있고 7일이 지났을 때만, 오늘 "나중에"를 눌렀으면 조용히
const DAY = 86400000
const withTask = (over: object) => ({ ...emptyState(), tasks: [{ ...base, createdAt: 0 }], settings: { ...emptyState().settings, ...over } })
assert.equal(backupDue(emptyState(), 10 * DAY, '2026-11-02'), null) // 계획이 없으면 알리지 않음
assert.equal(backupDue(withTask({}), 6 * DAY, '2026-11-02'), null) // 처음 6일은 조용히
assert.equal(backupDue(withTask({}), 9 * DAY, '2026-11-02'), 9) // 한 번도 백업 안 한 채 9일
assert.equal(backupDue(withTask({ lastBackupAt: 5 * DAY }), 9 * DAY, '2026-11-02'), null) // 4일 전에 백업
assert.equal(backupDue(withTask({ lastBackupAt: 1 * DAY }), 9 * DAY, '2026-11-02'), 8)
assert.equal(backupDue(withTask({ lastBackupAt: 1 * DAY, backupRemindedOn: '2026-11-02' }), 9 * DAY, '2026-11-02'), null) // 오늘은 나중에
assert.equal(backupDue(withTask({ lastBackupAt: 1 * DAY, backupRemindedOn: '2026-11-01' }), 9 * DAY, '2026-11-02'), 8) // 어제 미뤘으면 다시
assert.equal(isoWeek('2026-11-23'), 48)
assert.equal(isoWeek('2026-01-01'), 1)
assert.equal(isoWeek('2025-12-29'), 1)

// 바쁜 날 최소 목표를 채운 날
const mg = { tasks: [{ id: 'm', minGoal: 5 } as never], recs: { m: { '2026-11-02': { done: 5, sec: 0, checked: false }, '2026-11-03': { done: 4, sec: 0, checked: false } } } }
assert.deepEqual([minGoalMet(mg, '2026-11-02'), minGoalMet(mg, '2026-11-03'), minGoalMet(mg, '2026-11-04')], [true, false, false])

console.log('model tests passed')
