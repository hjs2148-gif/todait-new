
// ── 익숙한 그림 비교: 넘치는 날 카드 A 시계 · B 배터리 · C 숫자 두 개 / 여유 D 달력 · E 디데이 (head.mjs 뒤에 이어 붙여 실행) ──
CSS += `.t13{font-size:13px;line-height:18px}.t15{font-size:15px;line-height:22px}
.vc{background:var(--sf);border-radius:20px;box-shadow:0 1px 2px var(--shd);padding:18px 20px 20px;display:flex;flex-direction:column;gap:14px}
.vc .head{font-size:20px;line-height:28px;font-weight:700;letter-spacing:-0.2px}
.tag3{align-self:flex-start;font-size:13px;line-height:18px;font-weight:700;padding:3px 10px;border-radius:9px;background:var(--ink);color:var(--bg)}
.acts{display:flex;gap:8px}
.acts button{height:44px;border-radius:12px;border:0;font:inherit;font-size:15px;font-weight:600;padding:0 16px}
.acts .s{background:var(--chip);color:var(--ink)}
.acts .p{background:var(--ink);color:var(--bg);flex:1;font-weight:700}
.tl{position:relative;height:56px}
.tl .ax{position:absolute;left:0;right:0;top:22px;height:2px;background:var(--hl)}
.tl .win{position:absolute;top:12px;height:22px;border-radius:6px;background:color-mix(in srgb, var(--m) 45%, var(--sf))}
.tl .over{position:absolute;top:12px;height:22px;border-radius:0 6px 6px 0;background:var(--ink)}
.tl .tk{position:absolute;top:40px;font-size:13px;line-height:16px;color:var(--mu);transform:translateX(-50%);white-space:nowrap}
.tl .pin{position:absolute;top:0;font-size:13px;line-height:16px;font-weight:700;transform:translateX(-50%);white-space:nowrap}
.bat{display:flex;align-items:center;gap:4px}
.bat .bd2{flex:1;height:44px;border-radius:12px;box-shadow:inset 0 0 0 2.5px var(--ink);padding:5px;display:flex}
.bat .bd2 i{display:block;height:100%;border-radius:7px;background:var(--ink)}
.bat .nub{width:6px;height:16px;border-radius:0 4px 4px 0;background:var(--ink)}
.two2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.two2 div{border-radius:14px;background:var(--pg);padding:12px 14px}
.two2 b{display:block;font-size:24px;line-height:30px}
.two2 .hot{background:var(--ink);color:var(--bg)}
.two2 .hot .t13{color:var(--bg);opacity:.8}
.mcal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;text-align:center}
.mcal span{height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:14px;position:relative}
.mcal .w{height:18px;font-size:12px;color:var(--mu)}
.mcal .o{color:var(--mu);opacity:.5}
.mcal .ex{background:var(--ink);color:var(--bg);font-weight:700}
.mcal .en{box-shadow:inset 0 0 0 2px var(--rib);font-weight:700}
.mcal .gp{background:color-mix(in srgb, var(--rib) 16%, var(--sf))}
.dl{display:flex;align-items:center;gap:12px;padding:12px 0;box-shadow:inset 0 -1px 0 var(--hl)}
.dl:last-child{box-shadow:none}
.dl .dd{width:56px;flex:none;text-align:center;border-radius:10px;padding:6px 0;background:var(--pg)}
.dl .dd b{display:block;font-size:18px;line-height:22px}
.dl .dd.z{background:var(--ink);color:var(--bg)}
`
const H0 = 16 * 60
const H1 = 24 * 60
const xp = (m) => `${((m - H0) / (H1 - H0)) * 100}%`
const tline = (winA, winB, end, extra = null) => `<div class="tl" aria-hidden="true"><i class="ax"></i>
<i class="win" style="left:${xp(winA)};width:calc(${xp(Math.min(end, extra ?? winB))} - ${xp(winA)})"></i>
${end > (extra ?? winB) ? `<i class="over" style="left:${xp(extra ?? winB)};width:calc(${xp(end)} - ${xp(extra ?? winB)})"></i>` : ''}
<span class="pin" style="left:${xp(end)}">${end >= 1380 ? '밤' : '저녁'} ${Math.floor(end / 60) - 12}:${String(end % 60).padStart(2, '0')}</span>
${[16, 18, 20, 22, 24].map((h) => `<span class="tk" style="left:${xp(h * 60)}">${h === 24 ? '12시' : `${h - 12}시`}</span>`).join('')}</div>`
const A = `<section class="vc"><span class="tag3">A 시계</span>
<div><div class="t13 mu">12월 1일 화요일</div><div class="head">계획대로면 밤 11시 10분에 끝나요</div><div class="t15 mu" style="margin-top:4px">평소엔 10시까지 공부해요.</div></div>
${tline(16 * 60, 22 * 60, 23 * 60 + 10)}
<div class="acts"><button type="button" class="s">다른 방법</button><button type="button" class="p">11시 30분까지 하기</button></div></section>`
const B = `<section class="vc"><span class="tag3">B 배터리</span>
<div><div class="t13 mu">12월 1일 화요일</div><div class="head">하루 시간을 129% 써요</div><div class="t15 mu" style="margin-top:4px">1시간 10분이 모자라요.</div></div>
<div class="bat" aria-hidden="true"><span class="bd2"><i style="width:100%"></i></span><span class="nub"></span><b style="font-size:20px;margin-left:8px">129%</b></div>
<div class="acts"><button type="button" class="s">다른 방법</button><button type="button" class="p">1시간 30분 늘리기</button></div></section>`
const C = `<section class="vc"><span class="tag3">C 숫자 두 개</span>
<div><div class="t13 mu">12월 1일 화요일</div><div class="head">1시간 10분이 모자라요</div></div>
<div class="two2"><div><span class="t13 mu">공부할 수 있는 시간</span><b>4시간</b></div><div class="hot"><span class="t13">해야 할 계획</span><b>5시간 10분</b></div></div>
<div class="acts"><button type="button" class="s">다른 방법</button><button type="button" class="p">1시간 30분 늘리기</button></div></section>`

const CM1 = page('비교 · 넘치는 날 카드', 390, 1080, `
${hd('<span style="width:56px"></span>', '넘치는 날 · 그림 비교', '<span style="width:56px"></span>')}
<main class="mn">
<p class="t15 mu" style="margin:0 4px">같은 내용을 익숙한 그림 세 가지로 그렸어요.</p>
${A}${B}${C}
</main>
`)

// 여유: D 달력에 표시 / E 디데이 목록
const MCAL = ['23', '24', '25', '26', '27', '28', '29', '30', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13']
const DV = `<section class="vc"><span class="tag3">D 달력</span>
<div><div class="t13 mu">영어 독해 인강</div><div class="head">시험 전날 끝나요</div><div class="t15 mu" style="margin-top:4px">여유가 없어요. 하루만 밀려도 시험 뒤로 넘어가요.</div></div>
<div class="mcal">${['월', '화', '수', '목', '금', '토', '일'].map((d) => `<span class="w">${d}</span>`).join('')}
${MCAL.map((d, i) => `<span class="${i < 2 ? 'o' : d === '11' ? 'en' : d === '12' ? 'ex' : ''}">${d === '12' ? '시험' : d}</span>`).join('')}</div>
<div class="lgd t13 mu"><span><span class="sq" style="box-shadow:inset 0 0 0 2px var(--rib)"></span>끝나는 날</span><span><span class="sq" style="background:var(--ink)"></span>시험</span></div></section>`
const E = `<section class="vc" style="gap:4px"><span class="tag3" style="margin-bottom:10px">E 디데이 목록</span>
<div class="head" style="margin-bottom:6px">시험 12월 12일 · D-17</div>
${[['영어 독해 인강', '12월 11일 끝 · 시험 전날', '0', 'z'], ['쎈 수학Ⅱ', '12월 10일 끝', '1'], ['수학의 정석 미적분', '12월 9일 끝', '2'], ['국어 비문학 독해', '12월 6일 끝', '5']].map(([n, s, d, z]) => `<div class="dl"><span class="dd${z ? ' z' : ''}"><span class="t13" style="${z ? '' : 'color:var(--mu)'}">여유</span><b>${d}일</b></span><span style="flex:1;min-width:0"><b style="display:block;font-size:16px;line-height:22px">${n}</b><span class="t13 mu">${s}</span></span></div>`).join('')}
</section>`
const CM2 = page('비교 · 시험까지 여유', 390, 1080, `
${hd('<span style="width:56px"></span>', '여유 · 그림 비교', '<span style="width:56px"></span>')}
<main class="mn">
<p class="t15 mu" style="margin:0 4px">계획 하나를 볼 때는 D, 모두를 볼 때는 E가 맞아요.</p>
${DV}${E}
</main>
`)

const BOARDS = [['CMOver', '비교 · 넘치는 날 (A 시계 · B 배터리 · C 숫자)', CM1, 1080], ['CMSlack', '비교 · 여유 (D 달력 · E 디데이)', CM2, 1080]]
const canvas = JSON.parse(fs.readFileSync(path.join(P, 'canvas.json'), 'utf8'))
if (!canvas.pages.some((p) => p.id === 'compare')) canvas.pages.push({ id: 'compare', name: '익숙한 그림 비교' })
const DARK_Y = 1080 + 340
BOARDS.forEach(([n, title, html, h], i) => {
  fs.writeFileSync(path.join(P, `${n}.dc.html`), html)
  fs.writeFileSync(path.join(P, `${n}Dark.dc.html`), dark(n, title, h))
  canvas.boards[`${n}.dc.html`] = { x: i * 470, y: 0, w: 390, h, title, page: 'compare' }
  canvas.boards[`${n}Dark.dc.html`] = { x: i * 470, y: DARK_Y, w: 390, h, title: `${title} · 다크`, page: 'compare' }
  for (const k of [`${n}.dc.html`, `${n}Dark.dc.html`]) if (!canvas.order.includes(k)) canvas.order.push(k)
})
canvas.notes.cm_t = { x: 0, y: -300, page: 'compare', kind: 'title1', text: '익숙한 그림 고르기', maxW: 860 }
canvas.launch = { view: 'canvas', page: 'compare' }
fs.writeFileSync(path.join(P, 'canvas.json'), JSON.stringify(canvas, null, 1))
console.log('ok')
