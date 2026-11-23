import assert from 'node:assert/strict'
import { applyBalance, balance } from './balance.ts'
import { futurePlan, type Task } from './logic.ts'

const base: Task = {
  id: 'a', name: '정석', type: 'amount', kind: 'book', bookMode: 'toc', unit: '쪽', startPoint: 1, amount: 100, perDay: 0,
  startDate: '2026-11-23', endDate: '2026-12-02', week: [true, true, true, true, true, true, true], repeatEvery: null, supplementDow: null,
  custom: {}, categoryId: null, notifyTime: null, completed: false, completedDate: null, archived: false, order: 0, createdAt: 0,
}
const sum = (p: Record<string, number>) => Object.values(p).reduce((a, b) => a + b, 0)

// 단원 무게: 어려운 단원(앞 50쪽)은 하루 쪽 수가 적다
const w = { ...base, chapters: [{ id: 'c1', name: '어려움', from: 1, to: 50, weight: 3 as const }, { id: 'c2', name: '쉬움', from: 51, to: 100, weight: 1 as const }] }
const pw = futurePlan(w, {}, '2026-11-23')
assert.equal(sum(pw), 100)
assert.ok(pw['2026-11-23'] < pw['2026-12-01'], `어려운 단원 ${pw['2026-11-23']} < 쉬운 단원 ${pw['2026-12-01']}`)

// 요일 비율: 토·일(시간 2배)에 더 많이
const dw = { ...base, dayWeights: [2, 1, 1, 1, 1, 1, 2] }
const pd = futurePlan(dw, {}, '2026-11-23')
assert.equal(sum(pd), 100)
assert.ok(pd['2026-11-29'] > pd['2026-11-24'] * 1.5, `일요일 ${pd['2026-11-29']} > 화요일 ${pd['2026-11-24']}`)

// 나눠 담기: 하루 50분, 두 계획이 각 하루 10쪽×3분 = 30분씩 → 60분. 마감이 먼 b를 옮긴다
const a: Task = { ...base, id: 'a', endDate: '2026-12-02' }
const b: Task = { ...base, id: 'b', amount: 200, endDate: '2026-12-12' }
const out = balance({ tasks: [a, b], recs: {}, offOf: () => undefined, capOf: () => 50, spu: () => 180, today: '2026-11-23', horizon: 20 })
assert.ok(out.moves.length > 0)
assert.ok(out.moves.every((m) => m.taskId === 'b'), '마감이 가까운 a는 자리를 지킨다')
assert.ok(out.moves.every((m) => m.date > '2026-11-23'), '오늘은 옮기지 않는다')
const tasks = applyBalance([a, b], out, '2026-11-23')
const pb = futurePlan(tasks[1], {}, '2026-11-23')
assert.equal(sum(pb), 200, '옮겨도 전체 분량은 그대로')
assert.ok(pb['2026-11-24'] < 20 && pb['2026-11-24'] === out.moves[0].to)
assert.equal(tasks[1].fitFrom!['2026-11-24'], out.moves[0].from)
// 직접 정한 날은 옮기지 않는다
const out2 = balance({ tasks: [a, { ...b, custom: { '2026-11-24': 20 } }], recs: {}, offOf: () => undefined, capOf: () => 50, spu: () => 180, today: '2026-11-23', horizon: 3 })
assert.ok(!out2.moves.some((m) => m.date === '2026-11-24' && m.taskId === 'b'))
// 마감이 가까우면(3일 안) 옮길 수 없어서 넘치는 날로 남는다
const near = { ...a, endDate: '2026-11-25' }
const out3 = balance({ tasks: [near, { ...b, custom: { '2026-11-24': 20 } }], recs: {}, offOf: () => undefined, capOf: () => 50, spu: () => 180, today: '2026-11-23', horizon: 1 })
assert.deepEqual([out3.moves.length, out3.over], [0, ['2026-11-24']])
// 같은 입력이면 바뀌지 않는다
assert.equal(applyBalance(tasks, out, '2026-11-23'), tasks)
// 시간이 넉넉하면 아무것도 옮기지 않는다
assert.equal(balance({ tasks: [a, b], recs: {}, offOf: () => undefined, capOf: () => 600, spu: () => 180, today: '2026-11-23' }).moves.length, 0)
console.log('balance ok')
