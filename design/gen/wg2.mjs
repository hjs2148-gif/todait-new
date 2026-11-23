
// ── 학습 위젯 칸 격자: 작게 1×1 · 넓게 2×1 · 크게 2×2 (head.mjs 뒤에 이어 붙여 실행) ──
// 칸 = 174×164, 간격 10. 넓게는 가로만 두 배(1:2), 크게는 가로·세로 두 배. 위젯마다 맞는 크기만 연다.
const CW = 174
const CH = 164
const GAP = 10
CSS += `.t12{font-size:12px;line-height:16px}.t13{font-size:13px;line-height:18px}.t15{font-size:15px;line-height:22px}
.grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:${CH}px;gap:${GAP}px;grid-auto-flow:dense}
.tile{background:var(--sf);border-radius:24px;box-shadow:0 1px 2px var(--shd);padding:16px;display:flex;flex-direction:column;min-width:0;overflow:hidden;position:relative}
.s1{grid-column:span 1;grid-row:span 1}.s2{grid-column:span 2;grid-row:span 1}.s4{grid-column:span 2;grid-row:span 2}
.tile .lab{font-size:13px;line-height:18px;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tile .num{font-size:30px;line-height:36px;font-weight:700;letter-spacing:-0.5px}
.tile .num small{font-size:14px;font-weight:500;color:var(--mu);margin-left:2px}
.tile .sub{font-size:13px;line-height:18px;color:var(--mu);margin-top:auto}
.tile .sub b{color:var(--ink)}
.tile .q{font-size:16px;line-height:22px;font-weight:700;margin-top:2px}
.hd2{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.cols{display:flex;gap:16px;flex:1;min-height:0}
.cols>.l{width:110px;flex:none;display:flex;flex-direction:column}
.cols>.r{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:2px}
.segbar{display:flex;gap:3px;height:8px;margin-top:10px}
.segbar i{flex:1;border-radius:4px;background:var(--trk);position:relative;overflow:hidden}
.segbar i b{position:absolute;left:0;top:0;bottom:0;border-radius:4px}
.mrow{display:flex;align-items:center;gap:8px;min-height:28px}
.mrow .nm{flex:1;min-width:0;font-size:14px;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mrow .bar{width:56px;height:6px;border-radius:3px;background:var(--trk);flex:none;position:relative;overflow:hidden}
.mrow .bar i{position:absolute;left:0;top:0;bottom:0;border-radius:3px}
.mrow .v{font-size:13px;line-height:18px;color:var(--mu);flex:none;text-align:right}
.dot8{width:8px;height:8px;border-radius:4px;flex:none}
.act{height:40px;border-radius:12px;border:0;font:inherit;font-size:14px;font-weight:700;background:var(--ink);color:var(--bg);width:100%;flex:none}
.act.s{background:var(--chip);color:var(--ink);font-weight:600}
.lnk{font-size:13px;line-height:18px;font-weight:700;color:var(--ink);white-space:nowrap}
.g3{display:flex;gap:4px}
.g3 button{flex:1;height:34px;border-radius:10px;border:0;font:inherit;font-size:12px;font-weight:600;background:var(--chip);color:var(--ink);padding:0}
.chipg{font-size:12px;line-height:16px;padding:1px 7px;border-radius:6px;flex:none;white-space:nowrap}
.gk0{background:color-mix(in srgb, var(--ink) 12%, var(--sf))}
.gk1{background:color-mix(in srgb, var(--ink) 40%, var(--sf));color:var(--ink)}
.gk2{background:var(--ink);color:var(--bg)}
.gk-{box-shadow:inset 0 0 0 1.5px var(--hl)}
.umap{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}
.umap span{height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.dd2{text-align:center;border-radius:12px;padding:6px 10px;background:var(--ink);color:var(--bg);align-self:flex-start}
.dd2 small{display:block;font-size:12px;line-height:16px;opacity:.8}
.dd2 b{display:block;font-size:20px;line-height:24px}
.sl{min-width:52px;text-align:center;font-size:13px;line-height:22px;font-weight:700;border-radius:7px;flex:none}
.tlb{position:relative;height:24px;border-radius:7px;background:var(--pg)}
.tlb i{position:absolute;top:4px;bottom:4px;border-radius:4px}
.mcal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;text-align:center}
.mcal span{height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px}
.mcal .w{height:16px;color:var(--mu)}
.mcal .o{color:var(--mu);opacity:.5}
.mcal .ex{background:var(--ink);color:var(--bg);font-weight:700}
.mcal .en{box-shadow:inset 0 0 0 2px var(--rib);font-weight:700}
.cbar{display:flex;align-items:center;gap:8px}
.cbar span{width:40px;flex:none;font-size:13px;color:var(--mu)}
.cbar i{display:block;height:10px;border-radius:5px}
.szcap{font-size:13px;line-height:18px;color:var(--mu);font-weight:700;padding:16px 2px 6px}
.edit .tile{box-shadow:inset 0 0 0 1.5px var(--hl)}
.lift{transform:scale(1.04);box-shadow:0 14px 30px rgba(0,0,0,.2)!important;z-index:2}
.szpick{position:absolute;left:50%;transform:translateX(-50%);display:flex;gap:4px;padding:4px;border-radius:14px;background:var(--ink);z-index:3;box-shadow:0 6px 16px rgba(0,0,0,.25)}
.szpick button{height:32px;padding:0 12px;border-radius:10px;border:0;font:inherit;font-size:13px;font-weight:600;background:transparent;color:var(--bg)}
.szpick button.on{background:var(--bg);color:var(--ink)}
`
const bar = (c, p, w = 56) => `<span class="bar" style="width:${w}px"><i style="width:${p}%;background:var(--${c})"></i></span>`
const PLANS = [['m', '정석 미적분', 60, '6/10쪽'], ['c', '쎈 수학Ⅱ', 0, '0/15'], ['e', '영어 인강', 0, '0/1강'], ['k', '국어 비문학', 57, '4/7쪽']]
const seg = `<div class="segbar">${PLANS.map(([c, , p]) => `<i><b style="width:${p}%;background:var(--${c})"></b></i>`).join('')}</div>`

// ── 오늘 진행 ──
const prog = {
  s1: `<section class="tile s1"><span class="lab">오늘 진행</span><span class="num">62<small>%</small></span>${seg}<span class="sub">이대로면 <b>밤 10시</b> 끝</span></section>`,
  s2: `<section class="tile s2"><div class="cols"><div class="l"><span class="lab">오늘 진행</span><span class="num">62<small>%</small></span><span class="sub">이대로면<br><b>밤 10시</b> 끝</span></div>
<div class="r">${PLANS.map(([c, n, p]) => `<div class="mrow"><span class="dot8" style="background:var(--${c})"></span><span class="nm">${n}</span>${bar(c, p)}</div>`).join('')}</div></div></section>`,
  s4: (() => {
    const S = [[16 * 60 + 10, 16 * 60 + 50, 'm'], [17 * 60, 17 * 60 + 25, 'k'], [20 * 60, 20 * 60 + 40, 'm']]
    const x = (m) => `${((m - 14 * 60) / (10 * 60)) * 100}%`
    return `<section class="tile s4"><div class="hd2"><span class="lab">오늘 진행</span><span class="t13 mu">이대로면 <b style="color:var(--ink)">밤 10시</b> 끝</span></div>
<span class="num">62<small>% · 4개 중 1개 끝</small></span>
<span class="t12 mu" style="margin-top:8px">공부한 때 · 1시간 45분</span>
<div class="tlb" aria-hidden="true" style="margin-top:4px">${S.map(([a, b, c]) => `<i style="left:${x(a)};width:calc(${x(b)} - ${x(a)});background:var(--${c})"></i>`).join('')}</div>
<div style="margin-top:8px">${PLANS.map(([c, n, p, v]) => `<div class="mrow"><span class="dot8" style="background:var(--${c})"></span><span class="nm">${n}</span>${bar(c, p)}<span class="v" style="width:48px">${v}</span></div>`).join('')}</div>
<button type="button" class="act" style="margin-top:auto">다음: 쎈 수학Ⅱ 시작</button></section>`
  })(),
}
// ── 오늘 복습 ──
const REV = [['급수', '흐릿', 0, '7일'], ['수열의 극한', '절반', 1, '12일'], ['지수함수', '절반', 1, '오늘']]
const rev = {
  s1: `<section class="tile s1"><span class="lab">오늘 복습</span><span class="num">3<small>단원</small></span><span class="sub">먼저 <b>급수</b><br>흐릿 · 7일 지남</span></section>`,
  s2: `<section class="tile s2"><div class="hd2"><span class="lab">오늘 복습 · 3단원</span><span class="lnk">급수부터 시작 ›</span></div>
<div style="margin-top:auto">${REV.map(([n, g, k, d]) => `<div class="mrow" style="min-height:32px"><span class="chipg gk${k}">${g}</span><span class="nm">${n}</span><span class="v">${d === '오늘' ? '오늘' : `${d} 지남`}</span></div>`).join('')}</div></section>`,
}
// ── 시험까지 여유 ──
const SL = [['영어 독해 인강', '12.11 끝', 0], ['쎈 수학Ⅱ', '12.10 끝', 1], ['정석 미적분', '12.9 끝', 2]]
const slRows = SL.map(([n, e, d]) => `<div class="mrow" style="min-height:32px"><span class="sl ${d === 0 ? 'gk2' : 'gk0'}">여유 ${d}일</span><span class="nm">${n}</span><span class="v">${e}</span></div>`).join('')
const slack = {
  s1: `<section class="tile s1"><span class="lab">기말고사 D-17</span><div class="dd2" style="margin-top:8px"><small>여유</small><b>0일</b></div><span class="sub"><b>영어 인강</b><br>가장 빠듯해요</span></section>`,
  s2: `<section class="tile s2"><div class="hd2"><span class="lab">기말고사 12월 12일</span><b style="font-size:15px">D-17</b></div><div style="margin-top:auto">${slRows}</div></section>`,
  s4: (() => {
    const days = Array.from({ length: 21 }, (_, i) => i)
    const lab = (i) => { const d = 23 + i; return d <= 30 ? d : d - 30 }
    return `<section class="tile s4"><div class="hd2"><span class="lab">기말고사 12월 12일</span><b style="font-size:15px">D-17</b></div>
<div style="margin-top:6px">${slRows}</div>
<span class="t12 mu" style="margin-top:10px">영어 독해 인강 · 끝나는 날과 시험</span>
<div class="mcal" style="margin-top:4px">${['월', '화', '수', '목', '금', '토', '일'].map((d) => `<span class="w">${d}</span>`).join('')}${days.map((i) => `<span class="${i < 2 ? 'o' : i === 18 ? 'en' : i === 19 ? 'ex' : ''}">${i === 19 ? '시험' : lab(i)}</span>`).join('')}</div></section>`
  })(),
}
// ── 떠올리기 ──
const g3 = '<div class="g3"><button type="button">흐릿</button><button type="button">절반</button><button type="button">잘</button></div>'
const recall = {
  s1: `<section class="tile s1"><span class="lab">어제 끝낸 단원 · 급수</span><span class="q">덮고 떠올려 보면?</span><div style="margin-top:auto">${g3}</div></section>`,
  s2: `<section class="tile s2"><span class="lab">떠올리기 · 어제 끝낸 단원</span><span class="q" style="font-size:18px;line-height:26px">급수, 덮고 핵심 세 가지를 떠올려 보면?</span><div style="margin-top:auto">${g3}</div></section>`,
  s4: `<section class="tile s4"><span class="lab">떠올리기 · 책을 덮고 핵심 세 가지</span>
${[['급수', '어제'], ['수열의 극한', '3일 전'], ['등비수열', '6일 전']].map(([n, d]) => `<div style="display:flex;align-items:center;gap:8px;margin-top:14px"><span style="flex:1;min-width:0"><b style="display:block;font-size:15px;line-height:20px">${n}</b><span class="t12 mu">${d} 공부</span></span><span style="width:160px;flex:none">${g3}</span></div>`).join('')}
<span class="t13 mu" style="margin-top:auto">고른 대로 복습 날짜를 잡아요.</span></section>`,
}
// ── 다시 풀 문항 ──
const WR = [['급수', 5], ['수열의 극한', 4], ['미분계수', 3]]
const wrong = {
  s1: `<section class="tile s1"><span class="lab">다시 풀 문항</span><span class="num">12<small>문항</small></span><span class="sub"><b>쎈 수학Ⅱ</b><br>틀린 지 3일 지남</span></section>`,
  s2: `<section class="tile s2"><div class="cols"><div class="l"><span class="lab">다시 풀 문항</span><span class="num">12<small>문항</small></span><button type="button" class="act" style="margin-top:auto">오답만 풀기</button></div>
<div class="r">${WR.map(([n, v]) => `<div class="mrow"><span class="nm">${n}</span><span class="bar" style="width:52px"><i style="width:${(v / 5) * 100}%;background:var(--ink)"></i></span><span class="v" style="width:18px">${v}</span></div>`).join('')}<span class="t12 mu">쎈 수학Ⅱ · 틀린 지 3일 지남</span></div></div></section>`,
}
// ── 이해도 지도 ──
const UM = [[2, 1, '수열의 극한'], [0, 2, '급수'], [1, 3, '지수·로그 미분'], [2, 4, '삼각함수 미분'], [1, 5, '여러 가지 미분법'], ['-', 6, '도함수의 활용'], ['-', 7, '여러 가지 적분법'], ['-', 8, '정적분의 활용']]
const umap = UM.map(([k, i]) => `<span class="gk${k}">${i}</span>`).join('')
const map = {
  s1: `<section class="tile s1"><span class="lab">이해도 · 정석 미적분</span><div class="umap" style="margin-top:10px">${umap}</div><span class="sub">흐릿 <b>1단원</b> · 아직 3</span></section>`,
  s4: `<section class="tile s4"><span class="lab">이해도 지도 · 정석 미적분</span>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;margin-top:8px">${UM.map(([k, i, n]) => `<div class="mrow" style="min-height:26px"><span class="chipg gk${k}" style="min-width:22px;text-align:center">${i}</span><span class="nm" style="font-size:13px">${n}</span></div>`).join('')}</div>
<div class="lgd t12 mu" style="margin-top:8px"><span><span class="sq gk2"></span>잘</span><span><span class="sq gk1"></span>절반</span><span><span class="sq gk0"></span>흐릿</span><span><span class="sq gk-"></span>아직</span></div>
<div style="display:flex;flex-direction:column;gap:6px;margin-top:auto">
<div class="cbar"><span>자신감</span><i style="width:85%;max-width:220px;background:color-mix(in srgb, var(--ink) 40%, var(--sf))"></i><b class="t13">85%</b></div>
<div class="cbar"><span>정답률</span><i style="width:58%;max-width:150px;background:var(--ink)"></i><b class="t13">58%</b></div>
<span class="t13" style="margin-top:2px"><b>아는 느낌보다 실제가 낮아요.</b></span></div></section>`,
}

// ── 1. 오늘 탭 예시: 섞어 놓아도 줄이 맞는다 ──
const G1 = page('학습 위젯 · 칸 격자 예시', 390, 930, `
${hd('<span style="padding-left:8px;font-size:20px;font-weight:700">11월 25일 수요일</span>', '', '<span></span>')}
<main class="mn" style="padding-top:4px"><div class="grid2">${prog.s4}${rev.s1}${slack.s1}${recall.s2}${wrong.s1}${map.s1}</div></main>
`)

// ── 2. 위젯별 크기 비교 ──
const SIZES = [['오늘 진행', prog, ['s1', 's2', 's4']], ['시험까지 여유', slack, ['s1', 's2', 's4']], ['떠올리기', recall, ['s1', 's2', 's4']], ['오늘 복습', rev, ['s1', 's2']], ['다시 풀 문항', wrong, ['s1', 's2']], ['이해도 지도', map, ['s1', 's4']]]
const NAME = { s1: '작게 1×1', s2: '넓게 2×1', s4: '크게 2×2' }
const blockH = (ks) => ks.reduce((a, k) => a + 30 + (k === 's4' ? CH * 2 + GAP : CH), 0) + 46
const G2H = 200 + SIZES.reduce((a, [, , ks]) => a + blockH(ks), 0)
const G2 = page('학습 위젯 · 위젯별 크기', 390, G2H, `
${hd('<span style="width:56px"></span>', '위젯별 크기', '<span style="width:56px"></span>')}
<main class="mn" style="padding-top:0;gap:0">
${SIZES.map(([n, w, ks]) => `<h2 style="margin:18px 2px 0;font-size:18px;line-height:26px">${n}</h2>${ks.map((k) => `<div class="szcap">${NAME[k]}</div><div class="grid2">${w[k]}</div>`).join('')}`).join('')}
</main>
`)

// ── 3. 편집: 고를 수 있는 크기만 칩으로 ──
const G3 = page('학습 위젯 · 편집', 390, 880, `
${hd('<button type="button" class="tb">취소</button>', '오늘 위젯', '<button type="button" class="tb b">완료</button>')}
<main class="mn edit" style="padding-top:4px">
<p class="t13 mu" style="margin:0 4px 4px">길게 눌러 옮기고, 누르면 크기를 골라요. 개수 제한은 없어요.</p>
<div class="grid2" style="position:relative">${prog.s2.replace('class="tile s2"', 'class="tile s2 lift"')}${rev.s1}${slack.s1}${recall.s2}${wrong.s1}${map.s1}
<div class="szpick" style="top:${CH + 8}px"><button type="button">작게</button><button type="button" class="on">넓게</button><button type="button">크게</button></div>
</div>
<p class="t13 mu" style="margin:8px 4px 0">들어 올린 위젯은 1.04배로 커지고, 다른 위젯은 미끄러지듯 비켜요. 크기 칩에는 그 위젯이 쓸 수 있는 크기만 보여요.</p>
</main>
`)

const BOARDS = [['WGGrid', '칸 격자 예시 (작게·넓게·크게 섞기)', G1, 930], ['WGSizes', '위젯별 크기 (맞는 크기만)', G2, G2H], ['WGEdit', '편집: 옮기기와 크기 칩', G3, 880]]
const canvas = JSON.parse(fs.readFileSync(path.join(P, 'canvas.json'), 'utf8'))
if (!canvas.pages.some((p) => p.id === 'widgets3')) canvas.pages.push({ id: 'widgets3', name: '학습 위젯 · 칸 격자' })
const DARK_Y = G2H + 340
BOARDS.forEach(([n, title, html, h], i) => {
  fs.writeFileSync(path.join(P, `${n}.dc.html`), html)
  fs.writeFileSync(path.join(P, `${n}Dark.dc.html`), dark(n, title, h))
  canvas.boards[`${n}.dc.html`] = { x: i * 470, y: 0, w: 390, h, title, page: 'widgets3' }
  canvas.boards[`${n}Dark.dc.html`] = { x: i * 470, y: DARK_Y, w: 390, h, title: `${title} · 다크`, page: 'widgets3' }
  for (const k of [`${n}.dc.html`, `${n}Dark.dc.html`]) if (!canvas.order.includes(k)) canvas.order.push(k)
})
canvas.notes.wg3_t = { x: 0, y: -300, page: 'widgets3', kind: 'title1', text: '칸 174×164 · 넓게 2×1 · 크게 2×2', maxW: BOARDS.length * 470 - 80 }
canvas.launch = { view: 'canvas', page: 'widgets3' }
fs.writeFileSync(path.join(P, 'canvas.json'), JSON.stringify(canvas, null, 1))
console.log('ok', G2H)
