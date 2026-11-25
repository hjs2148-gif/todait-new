// CSS 이름 겹침 검사: 같은 클래스 하나짜리 규칙이 여러 CSS 파일에 있으면 실패한다.
// 일부러 덮어쓰는 것만 ALLOW에 적는다. (.empty·.ghost·.sheet·.stk·.tick 충돌로 화면이 깨진 적이 있다)
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'

const ALLOW = new Set(['tabs', 'dot', 'stopwatch', 'nav-h'])
const dir = new URL('.', import.meta.url).pathname
const where = new Map<string, Set<string>>()
for (const f of readdirSync(dir).filter((x) => x.endsWith('.css'))) {
  const css = readFileSync(dir + f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  for (const [, sel] of css.matchAll(/([^{}]+)\{/g)) {
    if (sel.trim().startsWith('@')) continue
    for (const part of sel.split(',')) {
      const m = part.trim().match(/^\.([a-zA-Z][\w-]*)$/)
      if (m) where.set(m[1], (where.get(m[1]) ?? new Set()).add(f))
    }
  }
}
const dup = [...where].filter(([k, v]) => v.size > 1 && !ALLOW.has(k)).map(([k, v]) => `.${k}: ${[...v].join(', ')}`)
assert.deepEqual(dup, [], `여러 파일에 같은 클래스 규칙이 있어요:\n${dup.join('\n')}`)
console.log('css ok')
