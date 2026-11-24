import assert from 'node:assert/strict'
import type { Task } from './logic.ts'
import { roundDecision, roundOffer, roundTask } from './rounds.ts'

const t: Task = {
  id: 'a', name: '정석', type: 'amount', kind: 'book', bookMode: 'toc', unit: '쪽', startPoint: 1, amount: 100, perDay: 0,
  startDate: '2026-11-01', endDate: '2026-11-25', week: [true, true, true, true, true, true, true], repeatEvery: null, supplementDow: null,
  custom: {}, categoryId: null, notifyTime: null, completed: false, completedDate: null, archived: false, order: 0, createdAt: 0,
}
const done = (n: number) => ({ '2026-11-01': { done: n, sec: 0, checked: false } })
// 아직 많이 남았으면 묻지 않는다
assert.equal(roundOffer([t], () => ({}), '2026-11-10', () => null), null)
// 3일 남았을 때: 2회독, 1회독의 절반 기간
const o = roundOffer([t], () => done(90), '2026-11-23', () => null)!
assert.deepEqual([o.kind, o.daysLeft, o.from], ['second', 3, '2026-11-26'])
assert.equal(o.to, '2026-12-08') // 25일 공부 → 13일
// 시험이 있으면 시험 전날까지만
assert.equal(roundOffer([t], () => done(90), '2026-11-23', () => '2026-12-01')!.to, '2026-11-30')
const r = roundTask(o, 'b', 1, 0)
assert.deepEqual([r.name, r.roundOf, r.speed, r.startPoint, r.amount, r.startDate], ['정석 · 2회독', 'a', 2, 1, 100, '2026-11-26'])
// 답한 계획은 다시 묻지 않는다
assert.equal(roundOffer([{ ...t, rounds: roundDecision(o, false) }], () => done(90), '2026-11-23', () => null), null)
assert.equal(roundDecision(o, true)!.length, 2)
// 틀린 문항이 있는 문제집 → 오답만
const wb = { ...t, bookMode: 'workbook' as const, unit: '문항' }
const ow = roundOffer([wb], () => ({ '2026-11-01': { done: 90, sec: 0, checked: false, wrong: 12 } }), '2026-11-23', () => null)!
assert.deepEqual([ow.kind, ow.amount], ['wrong', 12])
assert.deepEqual([roundTask(ow, 'c', 1, 0).bookMode, roundTask(ow, 'c', 1, 0).startPoint], ['amount', null])
console.log('rounds ok')

// 2회독 단원: 떠올리기 결과로 무게, 끝낸 날·기록은 가져가지 않음
{
  const { secondChapters } = await import('./rounds.ts')
  const tc: Task = { ...t, chapters: [
    { id: 'a', name: '1', from: 1, to: 30, doneDate: '2026-11-05', grade: 'low', recalls: [{ d: '2026-11-06', g: 'low' }] },
    { id: 'b', name: '2', from: 31, to: 60, doneDate: '2026-11-10', grade: 'high' },
    { id: 'c', name: '3', from: 61, to: 100, weight: 3 },
  ] }
  assert.deepEqual(secondChapters(tc), [
    { id: 'a', name: '1', from: 1, to: 30, weight: 3 },
    { id: 'b', name: '2', from: 31, to: 60, weight: 1 },
    { id: 'c', name: '3', from: 61, to: 100, weight: 3 },
  ])
  console.log('rounds second ok')
}
