
// ── 학습 위젯 시안: 핵심 6개(좁게·넓게) · 스마트 스택 · 펼쳐지는 시트 (head.mjs 뒤에 이어 붙여 실행) ──
// 원칙: 좁게 = 질문 하나에 답하는 숫자·문장 하나, 넓게 = 이유 + 다음 행동 하나. 기호는 먹색과 과목색만.
CSS += `.t12{font-size:12px;line-height:16px}.t13{font-size:13px;line-height:18px}.t15{font-size:15px;line-height:22px}
.wg{background:var(--sf);border-radius:24px;box-shadow:0 1px 2px var(--shd);padding:16px;display:flex;flex-direction:column;min-width:0;position:relative}
.wg.n{height:164px}
.wg .lab{font-size:13px;line-height:18px;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wg .num{font-size:30px;line-height:36px;font-weight:700;letter-spacing:-0.5px}
.wg .num small{font-size:14px;font-weight:500;color:var(--mu);margin-left:2px}
.wg .sub{font-size:13px;line-height:18px;color:var(--mu);margin-top:auto}
.wg .sub b{color:var(--ink)}
.wg .q{font-size:16px;line-height:22px;font-weight:700;margin-top:2px}
.wgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.segbar{display:flex;gap:3px;height:8px;margin-top:10px}
.segbar i{flex:1;border-radius:4px;background:var(--trk);position:relative;overflow:hidden}
.segbar i b{position:absolute;left:0;top:0;bottom:0;border-radius:4px}
.mrow{display:flex;align-items:center;gap:10px;min-height:34px}
.mrow .nm{flex:1;min-width:0;font-size:14px;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mrow .bar{width:64px;height:6px;border-radius:3px;background:var(--trk);flex:none;position:relative;overflow:hidden}
.mrow .bar i{position:absolute;left:0;top:0;bottom:0;border-radius:3px}
.mrow .v{font-size:13px;line-height:18px;color:var(--mu);width:44px;text-align:right;flex:none}
.act{height:40px;border-radius:12px;border:0;font:inherit;font-size:14px;font-weight:700;background:var(--ink);color:var(--bg);margin-top:12px;width:100%}
.act.s{background:var(--chip);color:var(--ink);font-weight:600}
.g3{display:flex;gap:4px;margin-top:auto}
.g3 button{flex:1;height:34px;border-radius:10px;border:0;font:inherit;font-size:12px;font-weight:600;background:var(--chip);color:var(--ink);padding:0}
.chipg{font-size:12px;line-height:16px;padding:1px 7px;border-radius:6px;flex:none}
.gk0{background:color-mix(in srgb, var(--ink) 12%, var(--sf))}
.gk1{background:color-mix(in srgb, var(--ink) 40%, var(--sf));color:var(--ink)}
.gk2{background:var(--ink);color:var(--bg)}
.gk-{box-shadow:inset 0 0 0 1.5px var(--hl)}
.umap{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-top:10px}
.umap span{height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.dd2{min-width:60px;text-align:center;border-radius:12px;padding:6px 8px;background:var(--ink);color:var(--bg);flex:none}
.dd2 small{display:block;font-size:12px;line-height:16px;opacity:.8}
.dd2 b{display:block;font-size:20px;line-height:24px}
.cal2{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.cal2 .r{display:flex;align-items:center;gap:8px}
.cal2 .r span:first-child{width:44px;font-size:13px;color:var(--mu);flex:none}
.cal2 .r i{display:block;height:10px;border-radius:5px}
.pdots{display:flex;gap:5px;justify-content:center;margin-top:10px}
.pdots i{width:6px;height:6px;border-radius:3px;background:var(--trk)}
.pdots i.on{width:16px;background:var(--ink)}
.cap3{font-size:13px;line-height:18px;color:var(--mu);padding:14px 4px 6px;display:flex;align-items:center;gap:6px}
.tlb{position:relative;height:28px;border-radius:8px;background:var(--pg);margin-top:8px}
.tlb i{position:absolute;top:4px;bottom:4px;border-radius:5px}
`
const bar = (c, p) => `<span class="bar"><i style="width:${p}%;background:var(--${c})"></i></span>`
const PLANS = [['m', '정석 미적분', 60, '6/10쪽'], ['c', '쎈 수학Ⅱ', 0, '0/15'], ['e', '영어 인강', 0, '0/1강'], ['k', '국어 비문학', 57, '4/7쪽']]

// ── 1. 오늘 진행 ──
const todayN = `<section class="wg n"><span class="lab">오늘 진행</span><span class="num">62<small>%</small></span>
<div class="segbar">${PLANS.map(([c, , p]) => `<i><b style="width:${p}%;background:var(--${c})"></b></i>`).join('')}</div>
<span class="sub">이대로면 <b>밤 10시</b> 끝</span></section>`
const todayW = `<section class="wg"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="lab">오늘 진행</span><span class="t13 mu">이대로면 <b style="color:var(--ink)">밤 10시</b> 끝</span></div>
<span class="num">62<small>% · 4개 중 1개 끝</small></span>
<div style="margin-top:6px">${PLANS.map(([c, n, p, v]) => `<div class="mrow"><span class="dt" style="width:8px;height:8px;border-radius:4px;background:var(--${c})"></span><span class="nm">${n}</span>${bar(c, p)}<span class="v">${v}</span></div>`).join('')}</div>
<button type="button" class="act">다음: 쎈 수학Ⅱ 시작</button></section>`

// ── 2. 오늘 복습 (간격 반복) ──
const REV = [['급수', '흐릿', 0, '7일 지남'], ['수열의 극한', '절반', 1, '12일 지남'], ['지수함수', '절반', 1, '오늘']]
const revN = `<section class="wg n"><span class="lab">오늘 복습</span><span class="num">3<small>단원</small></span>
<span class="sub">먼저 <b>급수</b><br>흐릿 · 7일 지남</span></section>`
const revW = `<section class="wg"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="lab">오늘 복습 · 3단원</span><span class="t13 mu">잊을 때쯤 다시</span></div>
<div style="margin-top:6px">${REV.map(([n, g, k, d]) => `<div class="mrow"><span class="chipg gk${k}">${g}</span><span class="nm">${n}</span><span class="v" style="width:auto">${d}</span></div>`).join('')}</div>
<button type="button" class="act">급수 복습 시작 · 덮고 떠올리기부터</button></section>`

// ── 3. 시험까지 여유 ──
const slackN = `<section class="wg n"><span class="lab">기말고사 D-17</span>
<div style="display:flex;align-items:center;gap:10px;margin-top:8px"><span class="dd2"><small>여유</small><b>0일</b></span></div>
<span class="sub"><b>영어 인강</b><br>가장 빠듯해요</span></section>`
const slackW = `<section class="wg"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="lab">기말고사 12월 12일</span><b style="font-size:15px">D-17</b></div>
<div style="margin-top:6px">${[['영어 독해 인강', '12월 11일 끝', 0], ['쎈 수학Ⅱ', '12월 10일 끝', 1], ['정석 미적분', '12월 9일 끝', 2]].map(([n, e, d]) => `<div class="mrow" style="min-height:44px"><span class="chipg ${d === 0 ? 'gk2' : 'gk0'}" style="min-width:58px;text-align:center;font-size:13px;line-height:22px;font-weight:700">여유 ${d}일</span><span class="nm">${n}</span><span class="v" style="width:auto">${e}</span></div>`).join('')}</div>
<button type="button" class="act s">영어 인강 하루 분량 늘리기</button></section>`

// ── 4. 떠올리기 (인출 연습) ──
const recallN = `<section class="wg n"><span class="lab">어제 끝낸 단원 · 급수</span><span class="q">덮고 떠올려 보면?</span>
<div class="g3"><button type="button">흐릿</button><button type="button">절반</button><button type="button">잘</button></div></section>`
const recallW = `<section class="wg"><span class="lab">떠올리기 · 책을 덮고 핵심 세 가지</span>
${[['급수', '어제'], ['수열의 극한', '3일 전'], ['등비수열', '6일 전']].map(([n, d]) => `<div style="display:flex;align-items:center;gap:8px;margin-top:10px"><span style="flex:1;min-width:0"><b style="display:block;font-size:15px;line-height:20px">${n}</b><span class="t12 mu">${d} 공부</span></span><span class="g3" style="flex:none;width:168px;margin:0"><button type="button">흐릿</button><button type="button">절반</button><button type="button">잘</button></span></div>`).join('')}
<span class="t13 mu" style="margin-top:12px">고른 대로 복습 날짜를 잡아요. 다시 읽기보다 떠올리기가 오래 남아요.</span></section>`

// ── 5. 다시 풀 문항 ──
const WR = [['급수', 5], ['수열의 극한', 4], ['미분계수', 3]]
const wrongN = `<section class="wg n"><span class="lab">다시 풀 문항</span><span class="num">12<small>문항</small></span>
<span class="sub"><b>쎈 수학Ⅱ</b><br>틀린 지 3일 지남</span></section>`
const wrongW = `<section class="wg"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="lab">다시 풀 문항 · 쎈 수학Ⅱ</span><b style="font-size:15px">12문항</b></div>
<div style="margin-top:6px">${WR.map(([n, v]) => `<div class="mrow"><span class="nm">${n}</span><span class="bar" style="width:120px"><i style="width:${(v / 5) * 100}%;background:var(--ink)"></i></span><span class="v">${v}문항</span></div>`).join('')}</div>
<button type="button" class="act">오답만 12문항 풀기</button></section>`

// ── 6. 이해도 지도 (메타인지) ──
const UM = [[2, 1], [0, 2], [1, 3], [2, 4], [1, 5], ['-', 6], ['-', 7], ['-', 8]]
const umap = UM.map(([k, i]) => `<span class="gk${k}">${i}</span>`).join('')
const mapN = `<section class="wg n"><span class="lab">이해도 지도 · 정석 미적분</span><div class="umap">${umap}</div>
<span class="sub">흐릿 <b>1단원</b> · 아직 4단원</span></section>`
const mapW = `<section class="wg"><span class="lab">이해도 지도 · 정석 미적분</span><div class="umap" style="grid-template-columns:repeat(8,minmax(0,1fr))">${umap}</div>
<div class="lgd t12 mu" style="margin-top:8px"><span><span class="sq gk2"></span>잘</span><span><span class="sq gk1"></span>절반</span><span><span class="sq gk0"></span>흐릿</span><span><span class="sq gk-"></span>아직</span></div>
<div class="cal2"><div class="r"><span>자신감</span><i style="width:85%;background:color-mix(in srgb, var(--ink) 40%, var(--sf))"></i><b class="t13">85%</b></div><div class="r"><span>정답률</span><i style="width:58%;background:var(--ink)"></i><b class="t13">58%</b></div></div>
<span class="t13" style="margin-top:10px"><b>아는 느낌보다 실제가 낮아요.</b> <span class="mu">2단원 급수부터 문제로 확인해 봐요.</span></span></section>`

const W1 = page('학습 위젯 · 좁게', 390, 640, `
${hd('<span style="padding-left:8px;font-size:20px;font-weight:700">11월 25일 수요일</span>', '', '<span></span>')}
<main class="mn" style="padding-top:4px"><div class="wgrid">${todayN}${revN}${slackN}${recallN}${wrongN}${mapN}</div></main>
`)
const W2 = page('학습 위젯 · 넓게', 390, 1830, `
${hd('<span style="padding-left:8px;font-size:20px;font-weight:700">넓게</span>', '', '<span></span>')}
<main class="mn" style="padding-top:4px">${todayW}${revW}${slackW}${recallW}${wrongW}${mapW}</main>
`)

// ── 스마트 스택: 시간대에 맞는 장이 앞에, 옆으로 넘겨 보기 ──
const W3 = page('스마트 스택', 390, 980, `
${hd('<span style="width:56px"></span>', '스마트 스택', '<span style="width:56px"></span>')}
<main class="mn" style="padding-top:0">
<p class="t15 mu" style="margin:0 4px">한 칸에 위젯 여러 장을 겹쳐 두고 옆으로 넘겨요. 시간대에 맞는 장이 앞에 와요.</p>
<div class="cap3">아침 8시 · 시작 전</div>
${todayW.replace('<section class="wg">', '<section class="wg" style="padding-bottom:12px">').replace('</section>', '<div class="pdots"><i class="on"></i><i></i><i></i></div></section>')}
<div class="cap3">밤 10시 · 끝난 뒤</div>
${recallW.replace('</section>', '<div class="pdots"><i></i><i class="on"></i><i></i></div></section>')}
<p class="t13 mu" style="margin:8px 4px 0">스택에 넣은 순서: 오늘 진행 · 떠올리기 · 내일 미리 보기. 직접 넘긴 장은 그날 그대로 둬요.</p>
</main>
`)

// ── 펼쳐지는 시트: 위젯을 누르면 커지며 열린다 ──
const SESS = [[16 * 60 + 10, 16 * 60 + 50, 'm'], [17 * 60, 17 * 60 + 25, 'k'], [20 * 60, 20 * 60 + 40, 'm']]
const x = (m) => `${((m - 14 * 60) / (10 * 60)) * 100}%`
const W4 = page('위젯을 누르면 · 오늘 진행', 390, 844, `
${hd('<span style="padding-left:8px;font-size:20px;font-weight:700">11월 25일 수요일</span>', '', '<span></span>')}
<div style="position:absolute;inset:0;background:var(--scrim)"></div>
<section class="sheet" aria-label="오늘 진행 자세히" style="top:110px">
<div class="grab"></div>
<div style="padding:4px 20px 0;display:flex;flex-direction:column">
<div style="display:flex;justify-content:space-between;align-items:center"><span class="t13 mu">오늘 진행</span><button type="button" class="tb" style="margin-right:-10px">닫기</button></div>
<span style="font-size:30px;line-height:36px;font-weight:700">62<small style="font-size:15px;font-weight:500;color:var(--mu)">% · 이대로면 밤 10시 끝</small></span>
<span class="t13 mu" style="margin-top:14px">오늘 공부한 때 · 1시간 45분</span>
<div class="tlb" aria-hidden="true">${SESS.map(([a, b, c]) => `<i style="left:${x(a)};width:calc(${x(b)} - ${x(a)});background:var(--${c})"></i>`).join('')}</div>
<div style="position:relative;height:16px;white-space:nowrap" class="t12 mu">${[14, 16, 18, 20, 22, 24].map((h) => `<span style="position:absolute;left:${x(h * 60)};transform:translateX(${h === 14 ? '0' : h === 24 ? '-100%' : '-50%'})">${h === 24 ? '밤 12' : h > 12 ? h - 12 : h}시</span>`).join('')}</div>
<span class="t13 mu" style="margin-top:14px">계획별</span>
${PLANS.map(([c, n, p, v]) => `<div class="mrow" style="min-height:44px"><span class="dt" style="width:8px;height:8px;border-radius:4px;background:var(--${c})"></span><span class="nm" style="font-size:15px">${n}</span>${bar(c, p)}<span class="v" style="width:52px">${v}</span></div>`).join('')}
</div>
<div class="ft" style="padding-top:14px"><button type="button" class="sec">통계에서 더 보기</button><button type="button" class="pri">쎈 수학Ⅱ 시작</button></div>
</section>
`)

const BOARDS = [['WGNarrow', '학습 위젯 · 좁게 (핵심 6)', W1, 640], ['WGWide', '학습 위젯 · 넓게 (핵심 6)', W2, 1830], ['WGStack', '스마트 스택 (아침 · 밤)', W3, 980], ['WGSheet', '위젯을 누르면 · 펼쳐지는 시트', W4, 844]]
const canvas = JSON.parse(fs.readFileSync(path.join(P, 'canvas.json'), 'utf8'))
if (!canvas.pages.some((p) => p.id === 'widgets2')) canvas.pages.push({ id: 'widgets2', name: '학습 위젯' })
const DARK_Y = 1830 + 340
BOARDS.forEach(([n, title, html, h], i) => {
  fs.writeFileSync(path.join(P, `${n}.dc.html`), html)
  fs.writeFileSync(path.join(P, `${n}Dark.dc.html`), dark(n, title, h))
  canvas.boards[`${n}.dc.html`] = { x: i * 470, y: 0, w: 390, h, title, page: 'widgets2' }
  canvas.boards[`${n}Dark.dc.html`] = { x: i * 470, y: DARK_Y, w: 390, h, title: `${title} · 다크`, page: 'widgets2' }
  for (const k of [`${n}.dc.html`, `${n}Dark.dc.html`]) if (!canvas.order.includes(k)) canvas.order.push(k)
})
canvas.notes.wg_t = { x: 0, y: -300, page: 'widgets2', kind: 'title1', text: '좁게 = 답 하나 · 넓게 = 이유 + 다음 행동', maxW: BOARDS.length * 470 - 80 }
canvas.launch = { view: 'canvas', page: 'widgets2' }
fs.writeFileSync(path.join(P, 'canvas.json'), JSON.stringify(canvas, null, 1))
console.log('ok')
