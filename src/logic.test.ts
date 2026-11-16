import assert from 'node:assert/strict'
import { liveExpect, rollForward, futurePlan, type Task, type Recs } from './logic.ts'

const base: Task = {
  id: 't', name: '수학', type: 'amount', unit: '쪽', startPoint: 1, amount: 100, perDay: 0,
  startDate: '2026-11-02', endDate: '2026-11-11', // 월 ~ 다음 주 수, 10일
  week: [true, true, true, true, true, true, true], repeatEvery: null, supplementDow: null, custom: {},
  categoryId: null, notifyTime: null, completed: false, completedDate: null, archived: false, order: 0, createdAt: 0,
}
const rec = (expect: number, done: number) => ({ expect, done, sec: 0, checked: false })

// 균등 분배: 100쪽 / 10일 = 10쪽
assert.equal(liveExpect(base, {}, '2026-11-02'), 10)

// 재분배: 첫날 0쪽 → 남은 100쪽 / 9일 = 올림 12쪽
let recs: Recs = rollForward(base, {}, '2026-11-03')
assert.equal(recs['2026-11-02'].expect, 10)
assert.equal(liveExpect(base, recs, '2026-11-03'), 12)

// 더 많이 하면 이후 분량이 줄어든다: 첫날 28쪽 → 72 / 9 = 8쪽
assert.equal(liveExpect(base, { '2026-11-02': rec(10, 28) }, '2026-11-03'), 8)

// 요일 제외: 주말 빼면 공부일 8일 → 올림 13쪽, 토요일은 0
const weekdays = { ...base, week: [false, true, true, true, true, true, false] }
assert.equal(liveExpect(weekdays, {}, '2026-11-02'), 13)
assert.equal(liveExpect(weekdays, {}, '2026-11-07'), 0)

// 쉬는 날(분량 0)·분량 변경: 그 날 몫을 빼고 나머지 날에 분배
const off = { ...base, custom: { '2026-11-03': 0, '2026-11-04': 30 } }
assert.equal(liveExpect(off, {}, '2026-11-02'), 9) // (100-30) / 8일 = 올림 9
assert.equal(liveExpect(off, {}, '2026-11-03'), 0)
assert.equal(liveExpect(off, { '2026-11-02': rec(9, 9) }, '2026-11-04'), 30)

// 보충 요일(일): 평일에 밀린 분량은 재분배하지 않고 일요일로 몰린다
const sup = { ...base, week: [false, true, true, true, true, true, true], supplementDow: 0 }
assert.equal(liveExpect(sup, {}, '2026-11-02'), 12) // 100 / 9일(일요일 제외) = 올림 12
const supRecs: Recs = { '2026-11-02': rec(12, 2) } // 10쪽 밀림
assert.equal(liveExpect(sup, supRecs, '2026-11-03'), 11) // (98-10) / 8 = 11
const week1: Recs = { ...supRecs }
for (const d of ['03', '04', '05', '06', '07']) week1[`2026-11-${d}`] = rec(11, 11)
assert.equal(liveExpect(sup, week1, '2026-11-08'), 10) // 일요일 = 밀린 10쪽

// 마지막 날엔 남은 분량 전부, 이후 계획 합계는 남은 분량과 같다
assert.equal(liveExpect(base, { '2026-11-02': rec(10, 10) }, '2026-11-11'), 90)
const plan = futurePlan(base, recs, '2026-11-03')
assert.equal(Object.values(plan).reduce((a, b) => a + b, 0), 100)
assert.ok(Object.keys(plan).every((d) => d >= '2026-11-03' && d <= '2026-11-11'))

// 종료일 없음: 하루 분량씩, 남은 만큼만
const open = { ...base, endDate: null, perDay: 30 }
assert.equal(liveExpect(open, {}, '2026-11-02'), 30)
assert.equal(liveExpect(open, { '2026-11-02': rec(30, 90) }, '2026-11-03'), 10)

// 반복 계획: 요일 반복, N일마다 반복
const daily = { ...base, type: 'daily' as const, perDay: 30, endDate: null, week: [false, true, false, true, false, true, false] }
assert.equal(liveExpect(daily, {}, '2026-11-02'), 30)
assert.equal(liveExpect(daily, {}, '2026-11-03'), 0)
const every3 = { ...daily, repeatEvery: 3 }
assert.deepEqual(['02', '03', '04', '05'].map((d) => liveExpect(every3, {}, `2026-11-${d}`)), [30, 0, 0, 30])

console.log('logic tests passed')
