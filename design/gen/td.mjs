
// ── 오늘 탭 지금 vs 바뀐 뒤 (실제 앱 화면 사진). head.mjs 뒤에 이어 붙여 실행. 사진은 project/TD*.png ──
CSS += `.tdcap{display:flex;align-items:center;gap:8px;height:52px;padding:0 14px;font-size:15px;font-weight:700}
.tdcap span{font-size:13px;font-weight:500;color:var(--mu)}
.tdimg{display:block;width:390px}`
const TD = [
  ['TDBefore', '지금', '오늘 복습 · 떠올리기 위젯 있음', 'TDBeforeL.png', 1555, 0, 0],
  ['TDAfter', '바뀐 뒤', '두 위젯 → 복습 한 줄', 'TDAfterL.png', 1455, 1, 0],
  ['TDBeforeDk', '지금 · 다크', '', 'TDBeforeD.png', 1555, 0, 1],
  ['TDAfterDk', '바뀐 뒤 · 다크', '', 'TDAfterD.png', 1455, 1, 1],
]
const cv5 = JSON.parse(fs.readFileSync(path.join(P, 'canvas.json'), 'utf8'))
if (!cv5.pages.some((p) => p.id === 'todaycmp')) cv5.pages.push({ id: 'todaycmp', name: '오늘 탭 · 지금 vs 바뀐 뒤' })
for (const [n, t, sub, img, h, col, row] of TD) {
  const H = h + 52
  fs.writeFileSync(path.join(P, `${n}.dc.html`), page(t, 390, H, `<div class="tdcap">${t}<span>${sub}</span></div><img class="tdimg" src="./${img}" alt="${t} 오늘 탭 화면" width="390" height="${h}">`))
  cv5.boards[`${n}.dc.html`] = { x: col * 450 + row * 960, y: 0, w: 390, h: H, title: t, page: 'todaycmp' }
  if (!cv5.order.includes(`${n}.dc.html`)) cv5.order.push(`${n}.dc.html`)
}
cv5.notes.td_t = { x: 0, y: -300, page: 'todaycmp', kind: 'title1', text: '오늘 탭: 위젯 두 개만 빠지고 복습 한 줄이 들어가요 (실제 앱 화면)', maxW: 1800 }
cv5.launch = { view: 'canvas', page: 'todaycmp' }
fs.writeFileSync(path.join(P, 'canvas.json'), JSON.stringify(cv5, null, 1))
console.log('ok todaycmp')
