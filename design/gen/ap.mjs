
// ── 잘나가는 앱에서 가져올 것 시안 (head.mjs + dr.mjs 뒤에 이어 붙여 실행) ──
// cat gen/head.mjs gen/dr.mjs gen/ap.mjs > gen/apx.mjs && node gen/apx.mjs np
CSS += `.swp{position:relative;overflow:hidden}
.swp .under{position:absolute;inset:0;display:flex;align-items:center;padding-left:18px;gap:8px;font-size:15px;font-weight:700}
.swp .over{position:relative;background:var(--sf)}
.toast{display:flex;align-items:center;gap:10px;height:52px;padding:0 8px 0 16px;border-radius:16px;background:var(--ink);color:var(--bg);font-size:14px}
.toast b{margin-left:auto;height:36px;padding:0 12px;border-radius:10px;display:inline-flex;align-items:center;background:color-mix(in srgb,var(--bg) 16%,transparent)}
.rib{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px 0 10px;border-radius:10px;background:var(--ribt);color:var(--rib);font-size:14px;font-weight:700}
.bm{width:14px;height:18px;flex:none;background:currentColor;clip-path:polygon(0 0,100% 0,100% 100%,50% 72%,0 100%)}
.sgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.sgrid span{height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--mu);background:var(--pg)}
.sgrid span.ok{background:var(--ribt);color:var(--rib)}
.sgrid span.ok i{width:10px;height:13px;background:var(--rib);clip-path:polygon(0 0,100% 0,100% 100%,50% 72%,0 100%)}
.sgrid span.rest{background:repeating-linear-gradient(135deg,var(--trk) 0 3px,transparent 3px 6px);box-shadow:inset 0 0 0 1px var(--trk)}
.sgrid span.tdy{box-shadow:inset 0 0 0 2px var(--ink);color:var(--ink);font-weight:700}
.step{display:flex;gap:12px;align-items:flex-start}
.step .no{width:26px;height:26px;border-radius:13px;background:var(--ink);color:var(--bg);font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}
.step .no.off{background:var(--chip);color:var(--mu)}
.sc{width:64px;height:36px;border-radius:10px;background:var(--pg);display:inline-flex;align-items:center;justify-content:flex-end;padding:0 10px;font-size:15px;font-weight:700;flex:none}
.frm{display:flex;flex-direction:column;gap:8px}
.frm .lab{font-size:12px;line-height:16px;font-weight:700;color:var(--mu);margin:0 4px}
.pop{width:28px;height:28px;border-radius:8px;background:var(--ink);color:var(--bg);display:inline-flex;align-items:center;justify-content:center;flex:none;box-shadow:0 0 0 6px color-mix(in srgb,var(--ink) 12%,transparent)}
.ring{position:relative;width:260px;height:260px;margin:0 auto}
.ring svg{position:absolute;inset:0}
.ring .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.tl{position:relative;height:34px;border-radius:8px;background:color-mix(in srgb,var(--bg) 12%,transparent)}
.tl i{position:absolute;top:5px;bottom:5px;border-radius:4px}
.tl i.plan{opacity:.38}
.tl .now{position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--bg);border-radius:1px}
.tlk{position:relative;height:16px;font-size:12px;line-height:16px}
.tlk span{position:absolute;transform:translateX(-50%);white-space:nowrap}
`
const BK = '<span class="bm"></span>'
const chk = SVG('<path d="M5 12.5l4.5 4.5L19 7.5"></path>', 16, 2.6)

// ── 1. 1초 기록: 밀어서 기록 + 되돌리기 ──
const swipe = page('1초 기록', 390, 900, `
${hd(T('11월 25일 수요일'), '', '<span></span>')}
<main class="mn" style="padding-top:0"><span class="dtag">기능 ③ · 1초 기록 (투두메이트)</span>
<div class="sh"><h2>오른쪽으로 밀면</h2><span class="sm mu">목표만큼 바로 기록</span></div>
<div class="cd">
 <div class="swp"><div class="under" style="background:var(--m);color:var(--bg)">${chk}12쪽 다 했음</div>
  <div class="over" style="transform:translateX(150px);border-radius:0 0 0 0">${rowSimple(PLANS[0], { mark: kindMark('m', 'book') })}</div></div>
 ${rowSimple(PLANS[1], { mark: kindMark('m', 'pen') })}
</div>
<div class="sh"><h2>놓으면</h2><span class="sm mu">끝 + 되돌리기 4초</span></div>
<div class="cd">
 <div class="drow"><span class="pop">${chk}</span><div class="gr"><div class="t el">수학의 정석 수학Ⅱ</div><div class="dbar"><i style="width:100%;background:var(--m)"></i></div></div><span class="n">끝</span><button class="dplay" type="button">${IC.play}</button></div>
 ${rowSimple(PLANS[1], { mark: kindMark('m', 'pen') })}
</div>
<div class="toast">수학의 정석 12쪽 기록했어요<b>되돌리기</b></div>
<div class="sh"><h2>왼쪽으로 밀면</h2><span class="sm mu">일부만 했을 때</span></div>
<div class="cd"><div class="swp"><div class="under" style="justify-content:flex-end;padding:0 18px;background:var(--chip);color:var(--ink)">몇 쪽 했나요?</div>
 <div class="over" style="transform:translateX(-130px)">${rowSimple(PLANS[3], { mark: kindMark('k', 'book') })}</div></div></div>
<p class="dnote">지금은 시트를 열고 숫자를 넣어야 해요. <b>다 했을 땐 밀기 한 번</b>, 일부만 했을 땐 숫자 칸이 바로 떠요. 잘못 밀어도 되돌리기가 있어요.</p>
</main>`)

// ── 2. 연속 기록: 책갈피 + 쉬는 날은 안 끊김 ──
const S28 = 'ok ok ok rest ok ok ok ok ok ok rest ok x ok ok ok ok rest ok ok ok ok ok ok rest ok ok tdy'.split(' ')
const streak = page('연속 기록', 390, 900, `
${hd(T('11월 25일 수요일'), '', '<span></span>')}
<main class="mn" style="padding-top:0"><span class="dtag">기능 ② · 연속 기록 (Duolingo)</span>
<div class="sh"><h2>오늘 탭 맨 위</h2><span class="sm mu">날짜 옆 작은 책갈피</span></div>
<div class="dw" style="display:flex;align-items:center;gap:10px"><b style="font-size:18px">11월 25일 수요일</b><span class="rib" style="margin-left:auto">${BK}15일째</span></div>
<div class="sh"><h2>누르면</h2><span class="sm mu">4주 책갈피</span></div>
<div class="dw" style="display:flex;flex-direction:column;gap:14px">
 <div style="display:flex;align-items:flex-end;gap:16px"><span class="dbig">15<small>일째 이어가는 중</small></span></div>
 <div class="sgrid">${['월', '화', '수', '목', '금', '토', '일'].map((d) => `<span style="background:none;height:16px">${d}</span>`).join('')}${S28.map((k, i) => `<span class="${k}">${k === 'ok' ? '<i></i>' : k === 'tdy' ? '오늘' : k === 'x' ? '' : ''}</span>`).join('')}</div>
 <div class="lgd sm mu"><span><span class="sq" style="background:var(--rib)"></span>계획 지킴</span><span><span class="sq hatch"></span>쉬는 날 (안 끊김)</span><span><span class="sq" style="background:var(--pg)"></span>못 함</span></div>
 <div class="dspec" style="border-top:1px solid var(--hl);padding-top:12px"><span>가장 길었던 기록</span><b style="margin-left:auto">23일</b></div>
</div>
<p class="dnote"><b>쉬는 날·예비일은 끊기지 않아요.</b> "오늘 목표의 절반 이상"이면 지킨 날로 쳐서 하루 못 채웠다고 0이 되는 부담을 줄여요. 빨강·불꽃 대신 앱의 책갈피 색을 써요.</p>
</main>`)

// ── 3. 시험 끝난 뒤 ──
const after = page('시험 끝난 뒤', 390, 900, `
${hd('<span class="tb">' + I.back + '</span>', '2학기 중간고사 끝', '<span class="tb">닫기</span>')}
<main class="mn" style="padding-top:4px"><span class="dtag">기능 ⑥ · 시험 끝난 뒤 흐름</span>
<div class="dw" style="display:flex;flex-direction:column;gap:6px"><span class="dlab"><i class="dic">${IC.flag}</i>수고했어요</span><span class="dbig">38<small>일 동안</small> 61<small>시간</small></span><span class="sm mu">계획 지킨 날 31일 · 가장 많이 한 과목 수학</span></div>
<div class="dw" style="display:flex;flex-direction:column;gap:12px">
 <div class="step"><span class="no">1</span><div class="gr"><b>점수 적기</b><span class="sm mu"> (건너뛰어도 돼요)</span>
  <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">${[['수학', 'm', '88'], ['영어', 'e', '92'], ['국어', 'k', '']].map(([n, c, v]) => `<div style="display:flex;align-items:center;gap:8px"><span class="dt" style="background:var(--${c})"></span><span class="gr">${n}</span><span class="sc">${v || '<span class="mu" style="font-weight:500">—</span>'}</span></div>`).join('')}</div></div></div>
 <div class="step"><span class="no off">2</span><div class="gr"><b>끝난 계획 정리</b><div class="sm mu">시험 범위 계획 4개 → 보관함으로 (기록은 남아요)</div></div></div>
 <div class="step"><span class="no off">3</span><div class="gr"><b>다음 시험 만들기</b><div class="sm mu">기말고사 12월 12일 · 이어서 볼 책 고르기</div></div></div>
</div>
</main>
<div class="ft"><button class="pri" type="button">다음</button></div>`)

// ── 4. 끝냈을 때 축하 ──
const cheer = page('끝냈을 때', 390, 900, `
${hd(T('11월 25일 수요일'), '', '<span></span>')}
<main class="mn" style="padding-top:0"><span class="dtag">디자인 ③ · 끝냈을 때 작은 축하</span>
<div class="sh"><h2>계획 하나 끝</h2><span class="sm mu">0.4초 · 짧은 진동</span></div>
<div class="cd"><div class="drow"><span class="pop">${chk}</span><div class="gr"><div class="t el">국어 비문학 독해</div><div class="dbar"><i style="width:100%;background:var(--k)"></i></div></div><span class="n">끝</span></div></div>
<div class="lgd sm mu" style="padding:0 4px">${['체크가 톡 커졌다 돌아옴', '막대가 끝까지 참', '줄이 "끝낸 것"으로 접힘'].map((t, i) => `<span><b style="color:var(--ink)">${i + 1}</b> ${t}</span>`).join('')}</div>
<div class="sh"><h2>오늘 계획 전부 끝</h2><span class="sm mu">하루 한 번</span></div>
<div class="dw hero" style="display:flex;flex-direction:column;gap:12px;position:relative;overflow:hidden">
 <span style="position:absolute;top:0;right:24px;width:28px;height:52px;background:var(--rib);clip-path:polygon(0 0,100% 0,100% 100%,50% 78%,0 100%)"></span>
 <div class="dlab"><i class="dic">${IC.prog}</i>오늘 진행</div>
 <span class="dbig" style="color:var(--bg)">100<small>%</small></span>
 <span class="sm mu">9개 모두 끝 · 4시간 12분 공부 · 15일째 책갈피</span>
 <button class="dbtn" type="button">내일 계획 미리 보기</button>
</div>
<p class="dnote">책갈피가 위에서 <b>스르륵 꽂혀요</b>(0.6초). 폭죽·이모지는 쓰지 않고, 한 번 보고 나면 다시 안 나와요.</p>
</main>`)

// ── 5. 집중 화면 ──
const arc = (p, r = 118) => { const a = p * 2 * Math.PI, x = 130 + r * Math.sin(a), y = 130 - r * Math.cos(a); return `M130 ${130 - r}A${r} ${r} 0 ${p > 0.5 ? 1 : 0} 1 ${x.toFixed(1)} ${y.toFixed(1)}` }
const focus = page('집중 화면', 390, 844, `
${hd('<span class="tb">' + I.down + '</span>', '', '<span class="tb sm mu" style="font-size:14px">방해 금지 켜기</span>')}
<main class="mn" style="flex:1;justify-content:center;gap:24px">
 <span class="dtag" style="align-self:center">기능 ① · 집중 화면 (Forest·열품타)</span>
 <div style="text-align:center"><span class="dt" style="background:var(--m);margin-right:6px"></span><b style="font-size:17px">수학의 정석 수학Ⅱ</b><div class="sm mu" style="margin-top:4px">232쪽부터 · 목표 240쪽</div></div>
 <div class="ring"><svg width="260" height="260" viewBox="0 0 260 260" aria-hidden="true"><circle cx="130" cy="130" r="118" fill="none" stroke="var(--trk)" stroke-width="14"></circle><path d="${arc(0.62)}" fill="none" stroke="var(--m)" stroke-width="14" stroke-linecap="round"></path></svg>
  <div class="c"><span style="font-size:56px;line-height:60px;font-weight:700;letter-spacing:-1px">24:13</span><span class="sm mu" style="margin-top:6px">이번 집중 · 목표 40분</span></div></div>
 <div class="dg2" style="text-align:center"><div><div class="xs mu">오늘 공부</div><b style="font-size:18px">2:17</b></div><div><div class="xs mu">남은 쪽</div><b style="font-size:18px">9쪽</b></div></div>
</main>
<div style="padding:0 16px 28px;display:flex;flex-direction:column;align-items:center;gap:8px">
 <span style="width:40px;height:5px;border-radius:3px;background:var(--hl)"></span>
 <span class="sm mu">위로 밀어서 멈추고 기록하기</span>
</div>`)

// ── 6. 계획까지 보이는 시간 줄 ──
const X = (h) => ((h - 6) / 18) * 100
const blocks = [[9, 9.8, 'm', 0], [10.2, 10.7, 'k', 0], [13.5, 14.3, 'c', 0], [15, 15.4, 'e', 0], [19.6, 20.6, 'm', 1], [20.8, 21.4, 'e', 1], [21.5, 22.3, 'm', 1]]
const tline = page('하루 시간 줄', 390, 900, `
${hd(T('11월 25일 수요일'), '', '<span></span>')}
<main class="mn" style="padding-top:0"><span class="dtag">디자인 ② · 계획까지 보이는 시간 줄 (Structured)</span>
<div class="dw hero" style="display:flex;flex-direction:column;gap:12px">
 <div class="dlab"><i class="dic">${IC.prog}</i>오늘 진행<span style="margin-left:auto">밤 10시 18분 끝</span></div>
 <span class="dbig" style="color:var(--bg)">43<small>%</small></span>
 <div><div class="tl">${blocks.map(([a, b, c, p]) => `<i class="${p ? 'plan' : ''}" style="left:${X(a)}%;width:${X(b) - X(a)}%;background:var(--${c})"></i>`).join('')}<span class="now" style="left:${X(19.3)}%"></span></div>
 <div class="tlk mu" style="margin-top:6px">${[[6, '오전 6'], [12, '정오'], [19.3, '지금'], [24, '밤 12']].map(([h, t]) => `<span style="left:${Math.min(94, Math.max(6, X(h)))}%">${t}</span>`).join('')}</div></div>
 <div class="lgd sm mu"><span><span class="sq" style="background:var(--bg)"></span>한 공부</span><span><span class="sq" style="background:var(--bg);opacity:.38"></span>남은 계획 (예상)</span></div>
 <button class="dbtn" type="button">다음: 수학의 정석 수학Ⅱ 시작</button>
</div>
<div class="sh"><h2>남은 계획 순서</h2><span class="sm mu">끌어서 바꾸기</span></div>
<div class="cd">${[['7:36', '수학의 정석 수학Ⅱ', 'm', '1시간'], ['8:48', '영어 독해 인강', 'e', '35분'], ['9:30', '쎈 수학Ⅱ', 'm', '48분']].map(([t, n, c, d]) => `<div class="rw"><span class="lb">${t}</span><span class="dsw" style="background:var(--${c})"></span><span class="gr el">${n}</span><span class="sm mu">${d}</span></div>`).join('')}</div>
<p class="dnote">지금은 <b>이미 한 공부</b>만 줄에 그려져요. 남은 계획을 옅게 이어 그리면 "밤 10시 18분 끝"이 <b>글이 아니라 그림</b>으로 보여요.</p>
</main>`)

const AB = [
  ['AP1Swipe', '기능③ 1초 기록', swipe, 900],
  ['AP2Streak', '기능② 연속 기록', streak, 900],
  ['AP3After', '기능⑥ 시험 끝난 뒤', after, 900],
  ['AP4Cheer', '디자인③ 끝냈을 때', cheer, 900],
  ['AP5Focus', '기능① 집중 화면', focus, 844],
  ['AP6Line', '디자인② 시간 줄', tline, 900],
]
const cv2 = JSON.parse(fs.readFileSync(path.join(P, 'canvas.json'), 'utf8'))
if (!cv2.pages.some((p) => p.id === 'apps')) cv2.pages.push({ id: 'apps', name: '잘나가는 앱에서 가져오기' })
AB.forEach(([n, title, html, h], i) => {
  fs.writeFileSync(path.join(P, `${n}.dc.html`), html)
  fs.writeFileSync(path.join(P, `${n}Dark.dc.html`), dark(n, title, h))
  cv2.boards[`${n}.dc.html`] = { x: i * 470, y: 0, w: 390, h, title, page: 'apps' }
  cv2.boards[`${n}Dark.dc.html`] = { x: i * 470, y: 900 + 240, w: 390, h, title: `${title} · 다크`, page: 'apps' }
  for (const k of [`${n}.dc.html`, `${n}Dark.dc.html`]) if (!cv2.order.includes(k)) cv2.order.push(k)
})
cv2.notes.ap_t = { x: 0, y: -300, page: 'apps', kind: 'title1', text: '잘나가는 앱에서 가져오기 · 바로 할 것 4 + 다음 2', maxW: 2700 }
cv2.launch = { view: 'canvas', page: 'apps' }
fs.writeFileSync(path.join(P, 'canvas.json'), JSON.stringify(cv2, null, 1))
console.log('ok apps')
