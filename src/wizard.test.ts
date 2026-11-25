import assert from 'node:assert/strict'
import { futurePlan } from './logic.ts'
import { parseTocText } from './toc.ts'
import { emptyWiz, pickDate, simpleTask, weekShape, wizardTask } from './wizard.ts'

// 2026-11-24(화) ~ 12-14(월), 일요일 예비, 끝 2일 여유, 1~232쪽, 목차 2단원
const w = { ...emptyWiz('2026-11-24', '2026-12-14'), name: '정석', to: 232, toc: parseTocText('Ⅰ. 가\n1. 가1 1\n2. 가2 50\nⅡ. 나\n1. 나1 120\n2. 나2 180') }
const t = wizardTask(w, 'a', 1, 0)
assert.ok(typeof t !== 'string')
if (typeof t !== 'string') {
  assert.deepEqual([t.kind, t.bookMode, t.startPoint, t.amount, t.supplementDow, t.notifyTime], ['book', 'toc', 1, 232, 0, '20:00'])
  assert.deepEqual(t.chapters!.map((c) => [c.from, c.to]), [[1, 119], [120, 232]])
  assert.deepEqual(t.cuts, [49, 119, 179, 232])
  // 끝 2일은 비우고, 첫날은 절반
  assert.equal(t.custom['2026-12-14'], 0)
  assert.equal(t.custom['2026-12-13'], 0)
  const plan = futurePlan(t, {}, '2026-11-24')
  assert.ok(plan['2026-11-24'] < plan['2026-11-25'])
  assert.equal(Object.values(plan).reduce((a, b) => a + b, 0), 232)
  assert.equal(plan['2026-12-13'] ?? 0, 0)
  const shape = weekShape(t, '2026-11-24')
  assert.equal(shape[0], null) // 일요일 예비는 밀린 게 없으면 0
  assert.ok(shape[1]! > 0)
}
// 이미 한 부분: 30쪽까지 했으면 31쪽부터
const p = wizardTask({ ...w, toc: [], part: true, done: 30 }, 'b', 1, 0, false)
assert.ok(typeof p !== 'string' && p.startPoint === 31 && p.amount === 202 && p.chapters === undefined)
// 강 단위 → 인강
const l = wizardTask({ ...w, toc: [], unit: '강', to: 40 }, 'c', 1, 0)
assert.ok(typeof l !== 'string' && l.kind === 'lecture' && l.bookMode === undefined)
// 오류
assert.equal(wizardTask({ ...w, name: ' ' }, 'd', 1, 0), '이름을 적어 주세요')
assert.equal(wizardTask({ ...w, toc: [], to: null }, 'd', 1, 0), '범위를 적어 주세요')
assert.equal(wizardTask({ ...w, days: ['off', 'off', 'off', 'off', 'off', 'off', 'off'] }, 'd', 1, 0), '공부하는 요일을 하나 이상 골라 주세요')
// 날짜 고르기
assert.deepEqual(pickDate({ start: '2026-11-24', end: '2026-12-14' }, '2026-11-26'), { start: '2026-11-26', end: null })
assert.deepEqual(pickDate({ start: '2026-11-26', end: null }, '2026-12-01'), { start: '2026-11-26', end: '2026-12-01' })
assert.deepEqual(pickDate({ start: '2026-11-26', end: null }, '2026-11-20'), { start: '2026-11-20', end: null })
// 시간·습관·할 일
const sw = { ...emptyWiz('2026-11-24', '2026-12-14'), name: '자습', perMin: 90 }
const tt = simpleTask('time', sw, 't', 1, 0)
assert.ok(typeof tt !== 'string' && tt.kind === 'time' && tt.perDay === 5400 && tt.endDate === null && tt.notifyTime === '20:00')
const hb = simpleTask('habit', { ...sw, name: '영단어', repeat: 'day', every: 3, keepOnRest: true, endless: false }, 'h', 1, 0)
assert.ok(typeof hb !== 'string' && hb.kind === 'habit' && hb.repeatEvery === 3 && hb.keepOnRest && hb.endDate === '2026-12-14')
const td = simpleTask('todo', { ...sw, name: '보고서', due: '2026-11-27' }, 'd', 1, 0)
assert.ok(typeof td !== 'string' && td.kind === 'todo' && td.due === '2026-11-27' && td.notifyTime === null)
assert.equal(simpleTask('todo', { ...sw, name: '보고서', due: '2026-11-20' }, 'd', 1, 0), '마감일이 하는 날보다 빨라요')
console.log('wizard ok')

// 달력에서 시작·끝 칸 고르기
{
  const { pickEdge, rangeKo } = await import('./wizard.ts')
  const cur = { start: '2026-11-25', end: '2026-12-11' }
  assert.deepEqual(pickEdge(cur, '2026-12-05', 'end'), { start: '2026-11-25', end: '2026-12-05', mode: 'end' })
  assert.deepEqual(pickEdge(cur, '2026-11-27', 'start'), { start: '2026-11-27', end: '2026-12-11', mode: 'end' })
  assert.deepEqual(pickEdge(cur, '2026-12-20', 'start'), { start: '2026-12-20', end: '2026-12-20', mode: 'end' })
  assert.deepEqual(pickEdge(cur, '2026-11-20', 'end'), { start: '2026-11-20', end: '2026-12-11', mode: 'end' })
  assert.equal(rangeKo(960, 1080), '오후 4~6시')
  assert.equal(rangeKo(600, 780), '오전 10시~오후 1시')
  assert.equal(rangeKo(990, 1080), '오후 4시 30분~6시')
  assert.equal(rangeKo(1320, 1440), '오후 10시~밤 12시')
  console.log('wizard pick ok')
}
