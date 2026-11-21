import assert from 'node:assert/strict'
import { buildTask, emptyForm, parseLectures, parseToc, previewPlan } from './planForm.ts'

const today = '2026-11-02'
const f = (patch: object) => ({ ...emptyForm(today), name: '수학', endDate: '2026-11-11', ...patch })

// 목차 붙여넣기: 여러 모양을 읽고, 못 읽은 줄은 알려 준다
const { chapters, bad } = parseToc('수열의 극한 1~28쪽\n1단원 급수 29-52\n\nⅠ 원자의 구조: 53~80\n엉터리 줄\n거꾸로 90~80')
assert.deepEqual(chapters.map((c) => [c.name, c.from, c.to]), [['수열의 극한', 1, 28], ['1단원 급수', 29, 52], ['Ⅰ 원자의 구조', 53, 80]])
assert.deepEqual(bad, ['엉터리 줄', '거꾸로 90~80'])
assert.deepEqual(parseToc('30~40').chapters.map((c) => c.name), ['1단원'])
assert.deepEqual(parseLectures('논증\n\n구조', 4).map((l) => l.title), ['논증', '구조', '3강', '4강'])

// 책(목차): 시작 쪽은 첫 단원, 분량은 마지막 쪽까지
const toc = buildTask(f({ toc: '가 1~10\n나 11~30' }), 'a', 1, 0)
assert.ok(typeof toc !== 'string')
if (typeof toc !== 'string') {
  assert.deepEqual([toc.kind, toc.bookMode, toc.type, toc.startPoint, toc.amount, toc.split], ['book', 'toc', 'amount', 1, 30, 'chapter'])
  // 10일 / 30쪽, 단원 순서대로 → 하루 3쪽쯤, 1단원은 4일째 끝(3+3+3+1)→ 단원 끝에서 끊김
  const pv = previewPlan(toc, today)!
  assert.equal(pv.days, 10)
  assert.equal(pv.perDay, 3)
  assert.equal(pv.end, '2026-11-11')
  assert.equal(pv.chapterEnds.length, 2)
  assert.ok(pv.chapterEnds[0].end! < pv.chapterEnds[1].end!)
}
// 문제집·분량만·인강
const wb = buildTask(f({ bookMode: 'workbook', from: 11, to: 40, unit: '' }), 'b', 1, 0)
assert.ok(typeof wb !== 'string' && wb.unit === '문항' && wb.startPoint === 11 && wb.amount === 30)
const only = buildTask(f({ bookMode: 'amount', total: 50, unit: '장' }), 'c', 1, 0)
assert.ok(typeof only !== 'string' && only.startPoint === null && only.amount === 50 && only.unit === '장')
const lec = buildTask(f({ kind: 'lecture', lectureCount: 12 }), 'd', 1, 0)
assert.ok(typeof lec !== 'string' && lec.kind === 'lecture' && lec.amount === 12 && lec.lectures?.length === 12 && lec.unit === '강')
// 시간·습관·할 일
const tm = buildTask(f({ kind: 'time', hours: 1, mins: 30, endDate: '' }), 'e', 1, 0)
assert.ok(typeof tm !== 'string' && tm.type === 'time' && tm.perDay === 5400 && tm.endDate === null)
const hb = buildTask(f({ kind: 'habit', repeat: 'day', every: 3, keepOnRest: true, endDate: '' }), 'g', 1, 0)
assert.ok(typeof hb !== 'string' && hb.type === 'check' && hb.kind === 'habit' && hb.repeatEvery === 3 && hb.keepOnRest === true)
const td = buildTask(f({ kind: 'todo', startDate: '2026-11-05', due: '2026-11-06' }), 'h', 1, 0)
assert.ok(typeof td !== 'string' && td.kind === 'todo' && td.startDate === '2026-11-05' && td.endDate === '2026-11-05' && td.due === '2026-11-06')

// 입력 오류는 문구로
assert.equal(buildTask(f({ name: ' ' }), 'x', 1, 0), '계획 이름을 입력해주세요')
assert.equal(buildTask(f({ bookMode: 'amount', total: null }), 'x', 1, 0), '총 분량을 입력해주세요')
assert.equal(buildTask(f({ endDate: '2026-10-01', bookMode: 'amount', total: 5 }), 'x', 1, 0), '종료일이 시작일보다 빠릅니다')
assert.equal(buildTask(f({ bookMode: 'amount', total: 5, week: [false, false, false, false, false, false, false] }), 'x', 1, 0), '공부할 요일을 선택해주세요')
assert.match(buildTask(f({ toc: '엉터리' }), 'x', 1, 0) as string, /읽지 못했어요/)
assert.equal(buildTask(f({ kind: 'time', hours: 0, mins: 0 }), 'x', 1, 0), '하루 목표 시간을 입력해주세요')

console.log('planForm tests passed')
