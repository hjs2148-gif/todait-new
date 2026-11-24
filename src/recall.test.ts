import assert from 'node:assert/strict'
import type { Chapter } from './logic.ts'
import { addRecall, gapAfter, ladder, legacyRecalls, nextDue } from './recall.ts'

const ch = (extra: Partial<Chapter> = {}): Chapter => ({ id: 'c', name: '연속', from: 1, to: 10, doneDate: '2026-11-10', ...extra })

// 안 끝낸 단원은 복습 없음
assert.equal(nextDue({ id: 'x', name: 'a', from: 1, to: 2 }), null)
// 끝낸 다음 날 처음 떠올리기
assert.equal(nextDue(ch()), '2026-11-11')
// 잘 → 한 칸씩 위로: 1 → 3 → 7 → 14 → 30, 기준은 마지막으로 떠올린 날
let c = addRecall(ch(), '2026-11-11', 'high')
assert.equal(nextDue(c), '2026-11-14')
c = addRecall(c, '2026-11-14', 'high')
assert.equal(nextDue(c), '2026-11-21')
// 절반 → 그 칸 그대로
c = addRecall(c, '2026-11-21', 'mid')
assert.equal(nextDue(c), '2026-11-28')
// 흐릿 → 맨 아래 1일
c = addRecall(c, '2026-11-28', 'low')
assert.equal(nextDue(c), '2026-11-29')
assert.equal(ladder(c)!.lowRun, 1)
// 같은 날 다시 고르면 마지막 것만 남는다
c = addRecall(c, '2026-11-28', 'high')
assert.equal(c.recalls!.filter((r) => r.d === '2026-11-28').length, 1)
assert.equal(c.grade, 'high')
// 졸업: 30일 칸에서 또 잘
let g = ch()
for (const d of ['2026-11-11', '2026-11-14', '2026-11-21', '2026-12-05', '2027-01-04']) g = addRecall(g, d, 'high')
assert.equal(ladder(g)!.step, 4)
assert.equal(gapAfter(g, 'high'), null)
g = addRecall(g, '2027-02-03', 'high')
assert.equal(ladder(g)!.graduated, true)
assert.equal(nextDue(g), null)
// 복습에 넣으면(pull) 사다리보다 먼저, 떠올리면 풀린다
const p = { ...addRecall(ch(), '2026-11-11', 'high'), pull: '2026-11-12' }
assert.equal(nextDue(p), '2026-11-12')
assert.equal(nextDue(addRecall(p, '2026-11-12', 'high')), '2026-11-19')
// 연속 흐릿 세기
let w = ch()
for (const d of ['2026-11-11', '2026-11-12', '2026-11-13']) w = addRecall(w, d, 'low')
assert.equal(ladder(w)!.lowRun, 3)
// 고를 때 보여 줄 다음 간격
assert.deepEqual([gapAfter(ch(), 'low'), gapAfter(ch(), 'mid'), gapAfter(ch(), 'high')], [1, 1, 3])
// 예전 기록 옮기기: 이해도는 끝낸 날, 복습한 날은 절반으로
assert.deepEqual(legacyRecalls(ch({ grade: 'low', reviews: ['2026-11-13'] })), [{ d: '2026-11-10', g: 'low' }, { d: '2026-11-13', g: 'mid' }])
assert.equal(legacyRecalls(ch()), undefined)
assert.deepEqual(legacyRecalls(ch({ recalls: [] })), [])
console.log('recall ok')
