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

// 시험일 맞춤: 다음 복습이 시험을 넘기면 시험 이틀 전으로
const e1 = addRecall(addRecall(ch(), '2026-11-11', 'high'), '2026-11-14', 'high') // 다음은 11.21 (7일)
assert.equal(nextDue(e1, '2026-11-19'), '2026-11-17')
assert.equal(nextDue(e1, '2026-12-20'), '2026-11-21') // 시험이 멀면 그대로
// 시험 이틀 전 이후에 떠올렸으면 더 당기지 않는다
const e2 = addRecall(e1, '2026-11-18', 'high')
assert.equal(nextDue(e2, '2026-11-19'), '2026-12-02')
// 졸업한 단원도 시험 전에 한 번
assert.equal(nextDue(g, '2027-03-20'), '2027-03-18')
assert.equal(nextDue(g, null), null)
console.log('recall exam ok')

// 목차 없는 책·인강: 떠올리기 구간
{
  const { syncUnits, unitSize, reviewParts } = await import('./recall.ts')
  const bk = { id: 'b', name: '책', type: 'amount', kind: 'book', bookMode: 'amount', unit: '쪽', startPoint: 11, amount: 60, perDay: 0, startDate: '2026-11-01', endDate: '2026-11-30', week: [true, true, true, true, true, true, true], repeatEvery: null, supplementDow: null, custom: {}, categoryId: null, notifyTime: null, completed: false, completedDate: null, archived: false, order: 0, createdAt: 0 } as const
  const rec = (n: number) => ({ done: n, sec: 0, checked: false })
  assert.equal(unitSize(bk as never), 15)
  // 어제까지 20쪽(11~30쪽), 오늘 12쪽 더(~42쪽) → 11~25는 예전(old), 26~40은 오늘 끝, 나머지는 아직
  const u1 = syncUnits(bk as never, { '2026-11-10': rec(20), '2026-11-11': rec(12) }, '2026-11-11')!
  assert.deepEqual(u1.map((u) => [u.name, !!u.old, u.doneDate ?? null]), [['11~25쪽', true, null], ['26~40쪽', false, '2026-11-11'], ['41~55쪽', false, null], ['56~70쪽', false, null]])
  // 다음 날 14쪽 더(~56쪽) → 41~55쪽 끝, 그다음 날부터 떠올리기
  const u2 = syncUnits({ ...bk, units: u1 } as never, { '2026-11-10': rec(20), '2026-11-11': rec(12), '2026-11-12': rec(14) }, '2026-11-12')!
  assert.equal(u2[2].doneDate, '2026-11-12')
  assert.equal(nextDue(u2[2]), '2026-11-13')
  assert.equal(u2[1].doneDate, '2026-11-11') // 이미 끝난 구간은 그대로
  assert.equal(ladder(u2[0]), null) // 예전 구간은 복습 안 함
  // 목차가 있으면 구간을 만들지 않는다
  assert.equal(syncUnits({ ...bk, chapters: [{ id: 'c', name: '1', from: 11, to: 70 }] } as never, {}, '2026-11-12'), undefined)
  assert.equal(reviewParts({ ...bk, units: u2 } as never).length, 4)
  // 인강은 3강씩, 이름에 강 제목
  const lec = { ...bk, kind: 'lecture', unit: '강', startPoint: 1, amount: 7, lectures: [{ title: '오리엔테이션', min: 30 }, { title: '2강', min: 30 }, { title: '3강', min: 30 }, { title: '문법', min: 30 }] }
  assert.deepEqual(syncUnits(lec as never, {}, '2026-11-12')!.map((u) => u.name), ['1~3강 · 오리엔테이션', '4~6강 · 문법', '7~7강'])
  console.log('recall units ok')
}
