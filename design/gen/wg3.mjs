
// ── 위젯 색 비교: A+C(추천) · A 과목색 틴트 · B 위젯 종류별 색 (head.mjs + wg2.mjs 뒤에 이어 붙여 실행) ──
CSS += `.vc .tile .lab{display:block}
.vc .tile .lab .ic{vertical-align:-6px;margin-right:6px}
.ic{width:22px;height:22px;border-radius:11px;display:inline-flex;align-items:center;justify-content:center;flex:none}
.ic svg{display:block}
.hero{background:var(--ink)!important;color:var(--bg)}
.hero .lab,.hero .t13,.hero .t12,.hero .num small,.hero .mrow .v{color:color-mix(in srgb, var(--bg) 72%, transparent)!important}
.hero .t13 b{color:var(--bg)!important}
.hero .mrow .bar,.hero .tlb{background:color-mix(in srgb, var(--bg) 16%, transparent)}
.hero .act{background:var(--bg);color:var(--ink)}
.hero .ic{background:color-mix(in srgb, var(--bg) 18%, transparent)!important;color:var(--bg)!important}
.vtag{align-self:flex-start;font-size:13px;line-height:18px;font-weight:700;padding:3px 10px;border-radius:9px;background:var(--ink);color:var(--bg);margin:2px 4px 8px}
`
const SV = (d) => `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`
const ICON = {
  prog: SV('<circle cx="12" cy="12" r="8"></circle><path d="M8.5 12.3l2.5 2.5 4.5-5"></path>'),
  rev: SV('<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5"></path>'),
  slack: SV('<path d="M6 21V4M6 4h11l-2.5 4 2.5 4H6"></path>'),
  recall: SV('<path d="M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"></path><path d="M5 17a3 3 0 0 1 3-3h10"></path>'),
  wrong: SV('<circle cx="12" cy="12" r="8"></circle><path d="M9 9l6 6M15 9l-6 6"></path>'),
  map: SV('<rect x="4" y="4" width="7" height="7" rx="1.5"></rect><rect x="13" y="4" width="7" height="7" rx="1.5"></rect><rect x="4" y="13" width="7" height="7" rx="1.5"></rect><rect x="13" y="13" width="7" height="7" rx="1.5"></rect>'),
}
// 위젯 순서와 그 위젯이 다루는 과목(한 과목일 때만), 종류별 고유색(B)
const TILES = [['prog', prog.s4, null, 's'], ['rev', rev.s1, null, 'k'], ['slack', slack.s1, null, 'y'], ['recall', recall.s2, 'm', 'e'], ['wrong', wrong.s1, 'c', 'p'], ['map', map.s1, 'm', 'i']]
const tint = (c) => `background:color-mix(in srgb, var(--${c}) 15%, var(--sf));`
const chip = (k, c) => `<i class="ic" style="background:${c ? `color-mix(in srgb, var(--${c}) 22%, var(--sf));color:var(--${c})` : 'var(--chip);color:var(--ink)'}">${ICON[k]}</i>`
function variant(mode) {
  return TILES.map(([k, html, subj, typ]) => {
    let h = html
    const color = mode === 'B' ? typ : subj
    if (mode === 'AC' && k === 'prog') {
      h = h.replace('class="tile s4"', 'class="tile s4 hero"')
    } else if (color) {
      h = h.replace(/class="tile (s\d)"/, `class="tile $1" style="${tint(color)}"`)
    }
    return h.replace('<span class="lab">', `<span class="lab">${chip(k, mode === 'AC' && k === 'prog' ? null : color)}`)
  }).join('')
}
const VAR = [
  ['WCAC', 'AC', 'A+C 추천 · 과목색 틴트 + 주인공 한 장', '한 과목 위젯은 그 과목색을 옅게, 오늘 진행만 진하게. 색은 데이터에서만 나와요.'],
  ['WCA', 'A', 'A · 과목색 틴트만', '한 과목 위젯만 과목색을 옅게. 여러 과목 위젯은 그대로.'],
  ['WCB', 'B', 'B · 위젯 종류별 색', '위젯마다 대표색. 구분은 쉽지만 과목색과 섞여요.'],
]
const VB = VAR.map(([n, mode, title, note]) => [n, title, page(title, 390, 1030, `
${hd('<span style="padding-left:8px;font-size:20px;font-weight:700">11월 25일 수요일</span>', '', '<span></span>')}
<main class="mn vc" style="padding-top:0"><span class="vtag">${title}</span>
<div class="grid2">${variant(mode)}</div>
<p class="t13 mu" style="margin:6px 4px 0">${note}</p></main>
`), 1000])
const cv = JSON.parse(fs.readFileSync(path.join(P, 'canvas.json'), 'utf8'))
if (!cv.pages.some((p) => p.id === 'wcolor')) cv.pages.push({ id: 'wcolor', name: '위젯 색 비교' })
VB.forEach(([n, title, html, h], i) => {
  fs.writeFileSync(path.join(P, `${n}.dc.html`), html)
  fs.writeFileSync(path.join(P, `${n}Dark.dc.html`), dark(n, title, h))
  cv.boards[`${n}.dc.html`] = { x: i * 470, y: 0, w: 390, h, title, page: 'wcolor' }
  cv.boards[`${n}Dark.dc.html`] = { x: i * 470, y: 1030 + 340, w: 390, h, title: `${title} · 다크`, page: 'wcolor' }
  for (const k of [`${n}.dc.html`, `${n}Dark.dc.html`]) if (!cv.order.includes(k)) cv.order.push(k)
})
cv.notes.wc_t = { x: 0, y: -300, page: 'wcolor', kind: 'title1', text: '위젯 색: A+C · A · B', maxW: 1330 }
cv.launch = { view: 'canvas', page: 'wcolor' }
fs.writeFileSync(path.join(P, 'canvas.json'), JSON.stringify(cv, null, 1))
console.log('ok colors')
