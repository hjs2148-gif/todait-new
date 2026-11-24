import assert from 'node:assert/strict'
import type { Task } from './logic.ts'
import { emptyState, type Exam } from './model.ts'
import {
  avgGrade, chapterSpans, examDeadline, examProgress, fitPreview, monthStack, planEnd, planProgress, plannedBefore, projectEnd, recentPace, reviewDue, studyDaysBetween,
} from './progress.ts'

const base: Task = {
  id: 'a', name: '수학', type: 'amount', kind: 'book', bookMode: 'amount', unit: '쪽', startPoint: 1, amount: 100, perDay: 0,
  startDate: '2026-11-02', endDate: '2026-11-11',
  week: [true, true, true, true, true, true, true], repeatEvery: null, supplementDow: null, custom: {},
  categoryId: null, notifyTime: null, completed: false, completedDate: null, archived: false, order: 0, createdAt: 0,
}
const rec = (expect: number, done: number, sec = 0) => ({ expect, done, sec, checked: false })
const today = '2026-11-04'
const recs = { '2026-11-02': rec(10, 4), '2026-11-03': rec(11, 11) }

// 예정 위치·밀림
assert.equal(plannedBefore(recs, today), 21)
const st = { ...emptyState(), recs: { a: recs } }
const p = planProgress(st, base, today)
assert.equal(p.done, 15)
assert.equal(p.behind, 6)
assert.equal(p.planEnd, '2026-11-11') // 계획대로면 끝나는 날은 그대로
assert.equal(p.vsExam, null)

// 최근 7일 속도와 그 속도로 끝나는 날
assert.equal(recentPace(base, recs, today), 7.5) // 15쪽 / 공부일 2일
assert.equal(projectEnd(base, 85, 7.5, today), '2026-11-15') // 12일 걸림
assert.equal(projectEnd(base, 0, 7.5, today), today)
assert.equal(projectEnd(base, 10, 0, today), null)
assert.equal(studyDaysBetween({ ...base, week: [false, true, true, true, true, true, false] }, '2026-11-02', '2026-11-08'), 5)

// 시험과 비교: 시험 전 끝남 / 늦어짐 + 시험 전에 끝내려면 하루 얼마
const exam = (date: string, blankDays = 0): Exam => ({ id: 'e', name: '기말', date, selected: true, blankDays, scope: [], fitEnd: false })
assert.equal(examDeadline(exam('2026-11-12', 1)), '2026-11-10')
assert.equal(planProgress(st, base, today, exam('2026-11-12')).vsExam, 'ok')
const late = planProgress(st, base, today, exam('2026-11-10'))
assert.equal(late.vsExam, 'late')
assert.equal(late.needPerDay, 15) // 85쪽 / 공부일 6일(4~9일) = 올림 15
assert.equal(late.needEnd, '2026-11-09')
// 범위에 없는 계획은 시험과 비교하지 않는다
assert.equal(planProgress(st, base, today, { ...exam('2026-11-10'), scope: [{ taskId: 'x', from: null, to: null }] }).vsExam, null)

// 시험 범위 진도: 계획끼리는 예상 공부 시간 비중으로 합친다
const lec: Task = { ...base, id: 'b', kind: 'lecture', bookMode: undefined, unit: '강', amount: 10, lectures: Array.from({ length: 10 }, (_, i) => ({ title: `${i + 1}강`, min: 30 })) }
const two = { tasks: [base, lec], recs: { a: { '2026-11-02': rec(50, 50) }, b: {} } }
const ep = examProgress(two, exam('2026-11-20'), today)!
assert.equal(ep.done, 0.25) // 책 100쪽×3분 = 인강 10강×30분 → 책 절반 = 전체 25%
assert.equal(ep.tasks, 2)
// 시험 범위가 계획 일부(1~50쪽)일 때
const part = examProgress({ tasks: [base], recs: { a: { '2026-11-02': rec(40, 40) } } }, { ...exam('2026-11-20'), scope: [{ taskId: 'a', from: 1, to: 50 }] }, today)!
assert.equal(part.done, 0.8)
assert.equal(examProgress({ tasks: [], recs: {} }, exam('2026-11-20'), today), null)

// 복습할 단원: 떠올리기 사다리 (recall.test.ts). 지난번 흐릿 → 처음 → 절반 → 잘 순서
const toc: Task = {
  ...base, id: 't', bookMode: 'toc',
  chapters: [
    { id: 'c1', name: '1단원', from: 1, to: 12, doneDate: '2026-11-01', grade: 'low', recalls: [{ d: '2026-11-01', g: 'low' }] },
    { id: 'c2', name: '2단원', from: 13, to: 30, doneDate: '2026-11-01', grade: 'high', recalls: [{ d: '2026-11-01', g: 'high' }] },
    { id: 'c3', name: '3단원', from: 31, to: 60, doneDate: '2026-10-20', grade: 'mid', recalls: [{ d: '2026-10-20', g: 'mid' }, { d: '2026-11-03', g: 'mid' }] },
    { id: 'c4', name: '4단원', from: 61, to: 100, doneDate: '2026-10-25' },
    { id: 'c5', name: '5단원', from: 101, to: 110, doneDate: '2026-10-31', grade: 'high', recalls: [{ d: '2026-11-04', g: 'high' }] },
  ],
}
assert.deepEqual(reviewDue([toc], today).map((r) => [r.chapter.id, r.days]), [['c1', 3], ['c4', 10], ['c3', 1], ['c2', 3]])
assert.equal(avgGrade(toc), 'mid')

// 이번 달에 쌓은 것
const ms = monthStack({ tasks: [base, lec, toc], recs: { a: { '2026-10-31': rec(5, 5), '2026-11-02': rec(10, 7) }, b: { '2026-11-03': rec(1, 2) }, t: {} } }, today)
assert.deepEqual(ms.units.map((u) => [u.unit, u.amount]), [['쪽', 7], ['강', 2]])
assert.equal(ms.chapters, 2) // 11월에 끝낸 단원
assert.equal(ms.days, 4)

// 단원 지도: 끝낸 단원은 실제 날짜, 남은 단원은 계획상 날짜
const map: Task = {
  ...base, id: 'm', bookMode: 'toc',
  chapters: [
    { id: 'x1', name: '1', from: 1, to: 12, doneDate: '2026-11-02' },
    { id: 'x2', name: '2', from: 13, to: 30 },
    { id: 'x3', name: '3', from: 31, to: 100 },
  ],
}
const spans = chapterSpans(map, { '2026-11-02': rec(10, 12) }, '2026-11-03')
assert.deepEqual([spans[0].start, spans[0].end, spans[0].planned], ['2026-11-02', '2026-11-02', false])
assert.equal(spans[1].start, '2026-11-03')
assert.equal(spans[1].planned, true)
assert.equal(spans[2].end, '2026-11-11')
assert.equal(spans[1].doneIn, 0)
assert.equal(planEnd(map, { '2026-11-02': rec(10, 12) }, '2026-11-03'), '2026-11-11')

// 끝나는 날 맞추기 미리보기: 시험 하루 전(비워 둘 날 1일 포함 전날)으로 당기면 하루 분량이 늘어난다

const fp = fitPreview({ ...emptyState(), tasks: [base], recs: { a: { '2026-11-02': rec(10, 10) } } }, { ...exam('2026-11-10'), blankDays: 1 }, '2026-11-03')
assert.equal(fp.length, 1)
assert.equal(fp[0].newEnd, '2026-11-08') // 시험 11/10, 비워 둘 날 1일 → 11/8까지
assert.equal(fp[0].same, false)
assert.equal(fp[0].perDayNow, 10) // 90쪽 / 9일 (3~11일)
assert.equal(fp[0].perDayNew, 15) // 90쪽 / 6일 (3~8일)
// 이미 마감 전에 끝나는 계획은 늦추지 않는다
const early = fitPreview({ ...emptyState(), tasks: [{ ...base, endDate: '2026-11-06' }], recs: {} }, { ...exam('2026-11-10'), blankDays: 1 }, '2026-11-03')
assert.equal(early[0].same, true)
console.log('progress tests passed')
