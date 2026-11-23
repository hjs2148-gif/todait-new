// 목차: 깊이 자유 트리. 붙여넣은 글을 번호 모양·들여쓰기·'-'로 읽고, 쪽 범위와 하루 분량을 끊을 자리를 만든다.
// React와 무관한 순수 코드.
import type { Chapter } from './logic.ts'

/** 목차 한 줄. page는 시작 쪽(가장 아래 항목만 의미가 있다). est = 쪽이 없어 앞뒤 사이로 추정 */
export interface TocLine {
  depth: number
  /** 번호 모양 ('Ⅰ', '1', '(1)' …). 없으면 '' */
  num: string
  /** 번호 모양의 종류. 같은 종류는 함께 단계가 바뀐다 */
  pat: string
  name: string
  page: number | null
  est?: boolean
  /** '1~28'처럼 끝 쪽까지 적힌 줄 */
  endHint?: number
}

const ROMAN = 'ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ'
const PATTERNS: [string, RegExp][] = [
  ['roman', new RegExp(`^([${ROMAN}]+|[IVX]+)(?:[.)]|\\s)\\s*`)],
  ['chap', /^(제\s*\d+\s*(?:장|부|편|단원|강)|\d+\s*(?:장|부|편|단원)|(?:part|chapter|unit)\s*\d+)[.:)]?\s*/i],
  ['multi', /^(\d+(?:[-.]\d+)+)\.?\s+/],
  ['num', /^(\d+)[.)]\s*/],
  ['paren', /^(\(\d+\))\s*/],
  ['circle', /^([①-⑳])\s*/],
  ['gana', /^([가-하])[.)]\s*/],
  ['pgana', /^(\([가-하]\))\s*/],
]

/** 줄 끝 쪽 번호: 점선(·····)이나 빈칸 뒤 숫자, "1~28", "p.8", "8쪽" */
const PAGE = /^(.*?)(?:\s*[·.…‥ㆍ_\-]{2,}\s*|\s+)(?:p\.?\s*)?(\d+)(?:\s*[~\-–—]\s*(\d+))?\s*(?:쪽|p)?$/i

function readLine(raw: string) {
  const indent = (raw.match(/^[ \t　]*/)?.[0] ?? '').replace(/\t/g, '    ').length
  let s = raw.trim()
  let dashes = 0
  const d = s.match(/^([-*•]+)\s*/)
  if (d) { dashes = d[1].length; s = s.slice(d[0].length) }
  let pat = 'plain'
  let num = ''
  for (const [k, re] of PATTERNS) {
    const m = s.match(re)
    if (m && s.length > m[0].length) {
      num = m[1].replace(/\s+/g, '')
      pat = k === 'multi' ? `multi${num.split(/[-.]/).length}` : k
      s = s.slice(m[0].length)
      break
    }
  }
  let page: number | null = null
  let endHint: number | undefined
  const p = s.match(PAGE)
  if (p && p[1].trim()) {
    page = Number(p[2])
    if (p[3]) endHint = Number(p[3])
    s = p[1]
  }
  return { indent, dashes, pat, num, name: s.replace(/[\s·.…‥]+$/, '').trim(), page, endHint }
}

/**
 * 붙여넣은 목차를 줄로 읽는다.
 * 깊이: 들여쓰기나 '-'가 있으면 그것으로, 없으면 번호 모양이 처음 나온 순서대로(Ⅰ → 1. → (1)).
 */
export function parseTocText(text: string): TocLine[] {
  const rows = text.split(/\r?\n/).filter((l) => l.trim()).map(readLine).filter((r) => r.name)
  if (!rows.length) return []
  const indents = [...new Set(rows.map((r) => r.indent))].sort((a, b) => a - b)
  const byShape = rows.some((r) => r.dashes) || indents.length > 1
  const order: string[] = []
  for (const r of rows) if (!order.includes(r.pat)) order.push(r.pat)
  const lines: TocLine[] = rows.map((r) => ({
    depth: byShape ? indents.indexOf(r.indent) + r.dashes : order.indexOf(r.pat),
    num: r.num, pat: r.pat, name: r.name, page: r.page, ...(r.endHint ? { endHint: r.endHint } : {}),
  }))
  return normalize(lines)
}

/** 깊이는 0부터, 앞 줄보다 두 단계 이상 깊어지지 않게 */
export function normalize(lines: TocLine[]): TocLine[] {
  let prev = -1
  return lines.map((l) => {
    const depth = Math.max(0, Math.min(l.depth, prev + 1))
    prev = depth
    return depth === l.depth ? l : { ...l, depth }
  })
}

/** 같은 번호 모양의 줄을 한꺼번에 한 단계 위(-1)·아래(+1)로 */
export function shiftPattern(lines: TocLine[], pat: string, by: number): TocLine[] {
  return normalize(lines.map((l) => (l.pat === pat ? { ...l, depth: Math.max(0, l.depth + by) } : l)))
}

/** 번호 모양별 단계 (처음 나온 순서) */
export function patternLevels(lines: TocLine[]): { pat: string; num: string; depth: number; count: number }[] {
  const out: { pat: string; num: string; depth: number; count: number }[] = []
  for (const l of lines) {
    const o = out.find((x) => x.pat === l.pat)
    if (o) o.count++
    else out.push({ pat: l.pat, num: l.num, depth: l.depth, count: 1 })
  }
  return out
}

const isLeaf = (lines: TocLine[], i: number) => !(lines[i + 1] && lines[i + 1].depth > lines[i].depth)

export interface TocResult {
  /** 쪽을 채운 줄 (추정한 쪽은 est) */
  lines: TocLine[]
  /** 맨 위 단원: 진도·이해도·복습을 묶는 단위 */
  chapters: Chapter[]
  /** 하루 분량을 끊을 자리 = 가장 아래 항목들의 끝 쪽 */
  cuts: number[]
  start: number
  end: number
  /** 단계별 줄 수 (0 = 단원) */
  counts: number[]
  /** 쪽이 앞 줄보다 작은 줄 (번호) */
  bad: number[]
}

/**
 * 쪽 범위 계산. 가장 아래 항목의 시작 쪽만 쓰고, 끝 쪽은 다음 항목 시작 − 1 (마지막은 lastPage).
 * 쪽이 없는 가장 아래 항목은 앞뒤 쪽 사이로 고르게 추정한다.
 */
export function resolveToc(input: TocLine[], lastPage?: number | null, firstPage?: number | null): TocResult | null {
  const lines = input.map((l) => ({ ...l, est: undefined as boolean | undefined }))
  const leaves = lines.map((_, i) => i).filter((i) => isLeaf(lines, i))
  if (!leaves.length) return null
  const known = leaves.filter((i) => lines[i].page !== null)
  const hints = lines.map((l) => l.endHint ?? 0)
  const start = known.length ? lines[known[0]].page! : (firstPage ?? 1)
  let end = lastPage ?? Math.max(0, ...hints)
  // 추정: 쪽이 있는 두 항목 사이를 고르게
  for (let k = 0; k < leaves.length; k++) {
    const i = leaves[k]
    if (lines[i].page !== null) continue
    let a = k - 1
    while (a >= 0 && lines[leaves[a]].page === null) a--
    let b = k + 1
    while (b < leaves.length && lines[leaves[b]].page === null) b++
    const pa = a >= 0 ? lines[leaves[a]].page! : start
    const ia = a >= 0 ? a : -1
    const pb = b < leaves.length ? lines[leaves[b]].page! : Math.max(end, pa + (leaves.length - ia))
    const ib = b < leaves.length ? b : leaves.length
    lines[i].page = a < 0 && k === 0 ? start : Math.round(pa + ((pb - pa) * (k - ia)) / (ib - ia))
    lines[i].est = true
  }
  const lastLeaf = lines[leaves[leaves.length - 1]]
  if (!end || end < lastLeaf.page!) end = Math.max(lastLeaf.endHint ?? 0, lastLeaf.page!)
  const bad: number[] = []
  const span = new Map<number, [number, number]>()
  leaves.forEach((i, k) => {
    const from = lines[i].page!
    if (k > 0 && from < lines[leaves[k - 1]].page!) bad.push(i)
    const next = k + 1 < leaves.length ? lines[leaves[k + 1]].page! - 1 : end
    span.set(i, [from, Math.max(from, next)])
  })
  // 위 단계 범위: 아래 항목들의 처음 ~ 끝
  const range = (i: number): [number, number] => {
    if (span.has(i)) return span.get(i)!
    let j = i + 1
    let last = i + 1
    while (j < lines.length && lines[j].depth > lines[i].depth) { last = j; j++ }
    const r: [number, number] = [range(i + 1)[0], range(last)[1]]
    span.set(i, r)
    return r
  }
  for (let i = lines.length - 1; i >= 0; i--) range(i)
  for (const [i, [a]] of span) if (!isLeaf(lines, i)) lines[i].page = a
  const chapters: Chapter[] = []
  lines.forEach((l, i) => {
    if (l.depth === 0) {
      const [from, to] = span.get(i)!
      chapters.push({ id: `c${chapters.length + 1}`, name: l.name, from, to })
    }
  })
  const counts: number[] = []
  for (const l of lines) counts[l.depth] = (counts[l.depth] ?? 0) + 1
  return {
    lines: lines.map((l) => (l.est ? l : (({ est, ...rest }) => rest)(l))),
    chapters, cuts: leaves.map((i) => span.get(i)![1]), start, end, counts, bad,
  }
}

/** 각 줄의 쪽 범위 [시작, 끝] (화면 표시용) */
export function lineSpans(lines: TocLine[], end: number): [number, number][] {
  const r = resolveToc(lines, end)
  if (!r) return []
  const out: [number, number][] = []
  r.lines.forEach((l, i) => {
    let j = i + 1
    while (j < r.lines.length && r.lines[j].depth > l.depth) j++
    const nextPage = j < r.lines.length ? r.lines[j].page! - 1 : r.end
    out.push([l.page!, Math.max(l.page!, nextPage)])
  })
  return out
}

/** 단계 이름: 단원 · 소단원 · 세부 · 4단계… */
export const levelName = (d: number) => ['단원', '소단원', '세부'][d] ?? `${d + 1}단계`

/** "8단원 · 소단원 22 · 세부 6" */
export const countLabel = (counts: number[]) =>
  counts.map((n, d) => (d === 0 ? `${n}단원` : `${levelName(d)} ${n}`)).join(' · ')

/** 줄 번호 표시: 번호 모양이 없으면 위치로 만든다 (1, 1-1, 1-1-1) */
export function autoNums(lines: TocLine[]): string[] {
  const stack: number[] = []
  return lines.map((l) => {
    stack.length = l.depth + 1
    stack[l.depth] = (stack[l.depth] ?? 0) + 1
    return l.num || stack.map((n) => n ?? 1).join('-')
  })
}

/** 직접 입력 한 줄: 앞 '-' 개수, 이름, 줄 끝 숫자(시작 쪽) */
export function splitRow(text: string): { dashes: number; name: string; page: number | null } {
  const r = readLine(text)
  return { dashes: r.dashes, name: r.name, page: r.page }
}
