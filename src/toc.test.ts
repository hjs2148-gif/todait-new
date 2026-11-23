import assert from 'node:assert/strict'
import { autoNums, countLabel, lineSpans, parseTocText, patternLevels, resolveToc, shiftPattern } from './toc.ts'

// 서점에서 복사한 목차: 들여쓰기 없음, 번호 모양으로 깊이, 점선과 끝 쪽 번호
const SRC = `Ⅰ. 수열의 극한
1. 수열의 수렴과 발산 ·········· 1
2. 수열의 극한값의 계산 ······ 10
3. 등비수열의 극한
Ⅱ. 급수
1. 급수의 수렴과 발산 ········ 29
2. 등비급수
(1) 등비급수의 합 ············ 38
(2) 등비급수의 활용 ·········· 46`
const lines = parseTocText(SRC)
assert.deepEqual(lines.map((l) => [l.depth, l.num, l.name, l.page]), [
  [0, 'Ⅰ', '수열의 극한', null], [1, '1', '수열의 수렴과 발산', 1], [1, '2', '수열의 극한값의 계산', 10], [1, '3', '등비수열의 극한', null],
  [0, 'Ⅱ', '급수', null], [1, '1', '급수의 수렴과 발산', 29], [1, '2', '등비급수', null], [2, '(1)', '등비급수의 합', 38], [2, '(2)', '등비급수의 활용', 46],
])
assert.deepEqual(patternLevels(lines).map((p) => [p.pat, p.depth, p.count]), [['roman', 0, 2], ['num', 1, 5], ['paren', 2, 2]])

const r = resolveToc(lines, 52)!
// 단원 범위, 쪽 없는 줄은 앞뒤 사이로 추정 (10과 29 사이 → 20)
assert.deepEqual(r.chapters.map((c) => [c.name, c.from, c.to]), [['수열의 극한', 1, 28], ['급수', 29, 52]])
assert.equal(r.lines[3].page, 20)
assert.equal(r.lines[3].est, true)
assert.equal(r.lines[1].est, undefined)
// 끊을 자리 = 가장 아래 항목 끝. '등비급수'는 아래 항목이 있어서 끊는 자리가 아니다
assert.deepEqual(r.cuts, [9, 19, 28, 37, 45, 52])
assert.deepEqual(r.counts, [2, 5, 2])
assert.equal(countLabel(r.counts), '2단원 · 소단원 5 · 세부 2')
assert.deepEqual([r.start, r.end, r.bad], [1, 52, []])
assert.deepEqual(lineSpans(lines, 52)[6], [38, 52])

// 끝 쪽을 모르면 마지막 항목의 시작 쪽까지
assert.equal(resolveToc(lines)!.end, 46)

// 번호 모양 한꺼번에 단계 바꾸기: (1)을 한 단계 위로 → 소단원과 같은 단계
const up = shiftPattern(lines, 'paren', -1)
assert.deepEqual(up.slice(6).map((l) => l.depth), [1, 1, 1])

// 들여쓰기·'-'가 있으면 그것으로 깊이를 읽는다. 1-1 같은 번호, "1~28" 범위도
const dash = parseTocText('수열의 극한 1~28\n- 수렴과 발산 1\n- 극한값 계산 12\n급수 29~52\n  1-1 급수의 수렴 29\n')
assert.deepEqual(dash.map((l) => [l.depth, l.name, l.page]), [[0, '수열의 극한', 1], [1, '수렴과 발산', 1], [1, '극한값 계산', 12], [0, '급수', 29], [1, '급수의 수렴', 29]])
const rd = resolveToc(dash)!
assert.deepEqual(rd.chapters.map((c) => [c.from, c.to]), [[1, 28], [29, 52]])

// 예전 한 줄 목차 ("단원 1~28")도 그대로 읽는다
const flat = resolveToc(parseTocText('가 1~10\n나 11~30'))!
assert.deepEqual(flat.chapters.map((c) => [c.name, c.from, c.to]), [['가', 1, 10], ['나', 11, 30]])
assert.deepEqual(flat.cuts, [10, 30])

// 깊이가 두 단계 이상 뛰지 않는다, 번호가 없으면 위치로 번호를 만든다
const jump = parseTocText('가\n    나 3\n        다 5\n라 9')
assert.deepEqual(jump.map((l) => l.depth), [0, 1, 2, 0])
assert.deepEqual(autoNums(jump), ['1', '1-1', '1-1-1', '2'])

// 쪽이 거꾸로 가는 줄은 알려 준다
assert.deepEqual(resolveToc(parseTocText('가 10\n나 5\n다 20'), 30)!.bad, [1])

// 빈 글
assert.deepEqual(parseTocText('\n  \n'), [])
assert.equal(resolveToc([]), null)

console.log('toc ok')
