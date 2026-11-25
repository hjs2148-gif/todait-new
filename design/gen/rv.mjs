
// ── 인출·복습 통합 시안 (head.mjs + dr.mjs + ap.mjs 뒤에 이어 붙여 실행) ──
// cat gen/head.mjs gen/dr.mjs gen/ap.mjs gen/rv.mjs > gen/rvx.mjs && node gen/rvx.mjs np
CSS += `.g3{display:flex;gap:6px}
.g3 button{flex:1;height:40px;border-radius:12px;border:0;background:var(--chip);color:var(--ink);font:inherit;font-size:14px;font-weight:600;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:16px}
.g3 button small{font-size:12px;font-weight:500;color:var(--mu)}
.g3 button.on{background:var(--ink);color:var(--bg)}
.g3 button.on small{color:color-mix(in srgb,var(--bg) 70%,transparent)}
.g3.tall button{height:56px}
.rvh{display:flex;align-items:center;gap:10px;padding:12px 16px 8px}
.rvh b{font-size:15px}
.rvrow{display:flex;align-items:center;gap:12px;min-height:56px;padding:8px 16px;box-shadow:inset 0 -1px 0 var(--hl)}
.rvrow:last-child{box-shadow:none}
.rvrow .why{font-size:12px;line-height:16px;color:var(--mu)}
.lad{display:flex;align-items:flex-end;gap:6px;height:100px}
.lad .st{background:none;border-radius:0;flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;justify-content:flex-end;height:100%}
.lad .st i{display:block;width:100%;border-radius:8px;background:var(--trk)}
.lad .st.on i{background:var(--ink)}
.lad .st.cur i{background:var(--rib)}
.lad .st span{font-size:12px;color:var(--mu);white-space:nowrap}
.lad .st.cur span{color:var(--ink);font-weight:700}
.mem{display:flex;height:10px;border-radius:5px;overflow:hidden;gap:2px}
.mem i{display:block;height:100%}
.memlg{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12px;color:var(--mu)}
.memlg span{display:inline-flex;align-items:center;gap:5px}
.memlg i{width:9px;height:9px;border-radius:3px;display:inline-block}
.wbar{display:flex;align-items:center;gap:10px;min-height:40px;font-size:14px}
.wbar .w{flex:1;height:10px;border-radius:5px;background:var(--trk);overflow:hidden}
.wbar .w i{display:block;height:100%;border-radius:5px}
`
// 기억 색: 잘=진한 먹, 절반=중간, 흐릿=책갈피(행동 필요), 미평가=빗금
const MEM = { ok: 'var(--ink)', half: 'color-mix(in srgb,var(--ink) 45%,var(--sf))', fog: 'var(--rib)' }
const memBar = (ok, half, fog, none) => `<div class="mem">${[[ok, MEM.ok], [half, MEM.half], [fog, MEM.fog]].map(([n, c]) => n ? `<i style="flex:${n};background:${c}"></i>` : '').join('')}${none ? `<i class="hatch" style="flex:${none}"></i>` : ''}</div>`
const memLg = `<div class="memlg"><span><i style="background:${MEM.ok}"></i>잘</span><span><i style="background:${MEM.half}"></i>절반</span><span><i style="background:${MEM.fog}"></i>흐릿</span><span><i class="hatch"></i>아직 안 떠올림</span></div>`
const g3 = (on, sub) => `<div class="g3${sub ? ' tall' : ''}">${[['fog', '흐릿', '내일'], ['half', '절반', '3일 뒤'], ['ok', '잘', '7일 뒤']].map(([k, l, d]) => `<button type="button" class="${on === k ? 'on' : ''}">${l}${sub ? `<small>${d}</small>` : ''}</button>`).join('')}</div>`

// ── 1. 오늘 탭: 복습이 계획 안에 ──
const rvToday = page('오늘 탭 복습', 390, 820, `
${hd(T('11월 25일 수요일'), '', '<span></span>')}
<main class="mn" style="padding-top:0"><span class="dtag">① 오늘 탭 · 복습도 하루 계획 안에</span>
<div class="dw hero" style="display:flex;flex-direction:column;gap:12px">
 <div class="dlab"><i class="dic">${IC.prog}</i>오늘 진행<span style="margin-left:auto">밤 10시 43분 끝</span></div>
 <span class="dbig" style="color:var(--bg)">38<small>%</small></span>
 <div class="dg2" style="gap:8px"><div><div class="xs mu">새 공부</div><b style="font-size:18px">1:49</b></div><div><div class="xs mu">복습</div><b style="font-size:18px">0:25</b></div></div>
</div>
<div class="sh"><h2>오늘 할 것</h2><span class="sm mu">밀린 것부터</span></div>
<div class="cd">
 <div class="rvh"><span class="dkind" style="background:var(--ribt);color:var(--rib)">${IC.rev}</span><b class="gr">복습 3단원</b><span class="n" style="font-size:17px;font-weight:700">25<small style="font-size:13px;font-weight:500;color:var(--mu)">분</small></span><button class="dplay" type="button">${IC.play}</button></div>
 <div style="padding:0 16px 10px 56px;display:flex;flex-direction:column;gap:4px" class="sm">
  <span><span class="dt" style="background:var(--m);margin-right:6px"></span>함수의 연속 <span class="mu">· 지난번 흐릿</span></span>
  <span><span class="dt" style="background:var(--e);margin-right:6px"></span>관계대명사 <span class="mu">· 3일 만에</span></span>
  <span><span class="dt" style="background:var(--m);margin-right:6px"></span>수열의 극한 <span class="mu">· 7일 만에</span></span>
 </div>
 <div style="box-shadow:inset 0 1px 0 var(--hl)">${rowSimple(PLANS[0], { mark: kindMark('m', 'book') })}${rowSimple(PLANS[1], { mark: kindMark('m', 'pen') })}${rowSimple(PLANS[2], { mark: kindMark('e', 'video') })}</div>
</div>
<p class="dnote">복습은 <b>목록 맨 위 한 줄</b>로 묶여요. 시간은 그 단원 공부에 걸린 시간의 약 20%로 잡아서 "밤 10시 43분 끝"에 같이 들어가요. 새 탭은 없어요.</p>
</main>`)

// ── 2. 복습 화면: 덮고 떠올리기 → 버튼 하나 ──
const rvSheet = page('복습하기', 390, 820, `
${hd('<span class="tb">' + I.back + '</span>', '복습 1 / 3', '<span class="tb">닫기</span>')}
<main class="mn" style="padding-top:4px"><span class="dtag">② 복습 화면 · 덮고 떠올린 뒤 하나 고르기</span>
<div class="dw" style="display:flex;flex-direction:column;gap:6px">
 <span class="dlab"><span class="dt" style="background:var(--m)"></span>수학의 정석 수학Ⅱ · 3단원</span>
 <b style="font-size:22px;line-height:30px">함수의 연속</b>
 <span class="sm mu">76~98쪽 · 지난번 절반 · 3일 만에</span>
</div>
<div class="dw" style="display:flex;flex-direction:column;gap:10px">
 <b>책을 덮고 떠올려 보세요</b>
 <ol style="margin:0;padding-left:20px;font-size:14px;line-height:22px">
  <li>핵심 개념 세 가지</li><li>중요한 공식이나 그림 하나</li><li>친구에게 설명한다면 첫 문장</li>
 </ol>
 <span class="sm mu">말로 해도, 종이에 써도 돼요. 앱에 적을 건 없어요.</span>
</div>
<div class="dw" style="display:flex;flex-direction:column;gap:10px">
 <b>펼쳐서 맞춰 보면?</b>
 ${g3('half', true)}
 <span class="sm mu">절반이면 <b style="color:var(--ink)">3일 뒤(11.28)</b>에 다시 물어요</span>
</div>
<p class="dnote">"복습했어요" 한 번 누르던 자리에 <b>세 버튼 중 하나</b>를 눌러요. 누르는 횟수는 같고, 결과가 다음 날짜를 정해요. 건너뛰면 잘한 걸로 치지 않아요.</p>
</main>
<div class="ft"><button class="sec" type="button">건너뛰기</button><button class="pri" type="button">다음 단원</button></div>`)

// ── 3. 단원 끝 + 간격 사다리 ──
const STEPS = [['1일', 18], ['3일', 32], ['7일', 48], ['14일', 66], ['30일', 84], ['졸업', 96]]
const ladder = (cur, done) => `<div class="lad">${STEPS.map(([l, h], i) => `<div class="st ${i < done ? 'on' : ''} ${i === cur ? 'cur' : ''}"><i style="height:${14 + i * 13}px"></i><span>${l}</span></div>`).join('')}</div>`
const rvLadder = page('단원 끝·사다리', 390, 760, `
${hd(T('3단원 끝'), '', '<span></span>')}
<main class="mn" style="padding-top:0"><span class="dtag">③ 단원 끝 화면 · 간격 사다리</span>
<div class="dw" style="display:flex;flex-direction:column;gap:6px"><b style="font-size:20px">3단원을 끝냈어요</b><span class="sm mu">수학의 정석 수학Ⅱ · 함수의 연속 · 76~98쪽</span>
 <div class="dg2" style="margin-top:8px"><div><div class="xs mu">걸림</div><b>4일</b></div><div><div class="xs mu">공부 시간</div><b>3:12</b></div></div></div>
<div class="dw" style="display:flex;gap:12px;align-items:flex-start"><i class="dic">${IC.rev}</i><div><b>내일 떠올리기로 물어볼게요</b><div class="sm mu" style="margin-top:4px">지금 바로 묻지 않아요. 공부 직후엔 다 아는 것 같아서, <b style="color:var(--ink)">하루 뒤 떠올려 봐야</b> 정확해요.</div></div></div>
<p class="dnote" style="margin-top:-2px">지금의 "얼마나 알 것 같나요? 상·중·하"는 빼요. 평가는 다음 날 한 번만.</p>
<div class="sh"><h2>복습 간격 사다리</h2><span class="sm mu">단원 자세히에서</span></div>
<div class="dw" style="display:flex;flex-direction:column;gap:12px">
 ${ladder(2, 2)}
 <div class="lgd sm mu"><span><span class="sq" style="background:var(--ink)"></span>지나온 칸</span><span><span class="sq" style="background:var(--rib)"></span>지금 · 다음 복습 12.2</span></div>
 <div style="display:flex;flex-direction:column;gap:4px;font-size:14px;border-top:1px solid var(--hl);padding-top:10px">
  <span><b>잘</b> <span class="mu">→ 한 칸 위로 (간격이 길어져요)</span></span>
  <span><b>절반</b> <span class="mu">→ 그 칸 그대로</span></span>
  <span><b>흐릿</b> <span class="mu">→ 맨 아래 1일로</span></span>
  <span><b>30일에서 또 잘</b> <span class="mu">→ 졸업, 시험 전 한 번만 다시</span></span>
 </div>
</div>
</main>`)

// ── 4. 진도 탭: 진도와 기억 나란히 + 문제집 보정 ──
const subjCard = (n, c, prog, ok, half, fog, none) => `<div class="dw" style="display:flex;flex-direction:column;gap:10px">
 <div style="display:flex;align-items:center;gap:8px"><span class="dt" style="background:var(--${c})"></span><b class="gr">${n}</b><span class="sm mu">${ok + half + fog + none}단원 끝</span></div>
 <div style="display:grid;grid-template-columns:44px 1fr 64px;gap:8px 10px;align-items:center;font-size:13px">
  <span class="mu">진도</span><div class="dtrk"><i style="width:${prog}%;background:var(--${c})"></i></div><b style="text-align:right">${prog}%</b>
  <span class="mu">기억</span>${memBar(ok, half, fog, none)}<b style="text-align:right">잘 ${ok}/${ok + half + fog + none}</b>
 </div></div>`
const rvProg = page('진도와 기억', 390, 780, `
${hd(T('진도'), '', '<span></span>')}
<main class="mn" style="padding-top:0"><span class="dtag">④ 진도 탭 · 진도와 기억을 따로</span>
${subjCard('수학', 'm', 80, 4, 2, 2, 1)}
${subjCard('영어', 'e', 65, 5, 1, 0, 2)}
${subjCard('국어', 'k', 90, 2, 2, 3, 0)}
${memLg}
<div class="sh"><h2>생각보다 헷갈리는 단원</h2><span class="sm mu">문제집 기록으로</span></div>
<div class="cd"><div class="rvrow"><span class="dkind" style="background:var(--ribt);color:var(--rib)">${IC.pen}</span><div class="gr"><div class="t" style="font-size:15px;font-weight:600">쎈 수학Ⅱ · 수열의 극한</div><div class="why">떠올리기는 "잘" · 문제 정답 11/20</div></div><span class="ch">복습에 넣기</span></div></div>
<p class="dnote">진도 100%여도 기억은 따로 봐요. <b>"기억률 55%" 같은 확률은 쓰지 않고</b> 몇 단원 중 몇인지, 아직 안 떠올린 단원(빗금)을 따로 보여요.</p>
</main>`)

// ── 5. 복습이 쌓였을 때 ──
const rvOver = page('복습 쌓임', 390, 720, `
${hd(T('11월 25일 수요일'), '', '<span></span>')}
<main class="mn" style="padding-top:0"><span class="dtag">⑤ 복습이 쌓였을 때 · 몰래 늘리지 않기</span>
<div class="dw" style="display:flex;flex-direction:column;gap:12px">
 <div class="dlab"><i class="dic">${IC.rev}</i>복습이 밀려 있어요</div>
 <span class="dbig">11<small>단원</small></span>
 <span class="sm mu">사흘 쉬는 동안 쌓였어요. 한꺼번에 넣지 않고 <b style="color:var(--ink)">하루 30분까지만</b> 넣을게요.</span>
 <div style="display:flex;gap:4px;align-items:flex-end;height:64px">${[[30, '오늘'], [30, '내일'], [30, '금'], [20, '토']].map(([m, d]) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><i style="width:100%;height:${m * 1.6}px;border-radius:6px;background:var(--rib)"></i><span class="xs mu">${d}</span></div>`).join('')}</div>
 <span class="xs mu">흐릿했던 것 → 오래 밀린 것 → 시험 범위 순서로</span>
 <div style="display:flex;gap:8px"><span class="ch lg" style="flex:1;justify-content:center;background:var(--ink);color:var(--bg)">이렇게 나눠 하기</span><span class="ch lg" style="flex:1;justify-content:center">하루 상한 바꾸기</span></div>
</div>
<div class="sh"><h2>하루 복습 상한</h2><span class="sm mu">설정</span></div>
<div class="dw" style="display:flex;flex-direction:column;gap:10px">
 <div class="seg"><button type="button">15분</button><button type="button" class="on">30분</button><button type="button">45분</button><button type="button">60분</button></div>
 <span class="sm mu">시험 2주 전부터는 상한을 자동으로 조금씩 올려요 (끌 수 있어요)</span>
</div>
<p class="dnote">"넘치는 날" 안내 카드와 같은 모양이에요. 감당 못 할 계획을 만들지 않고 <b>나눠서 하자고 먼저 말해요</b>.</p>
</main>`)

// ── 6. 기억으로 2회독 무게 ──
const W = [['1. 함수의 극한', 'ok', 30], ['2. 연속', 'fog', 92], ['3. 미분계수', 'half', 60], ['4. 도함수', 'ok', 34], ['5. 도함수 활용', 'fog', 88], ['6. 부정적분', 'none', 60]]
const lab = { ok: ['잘', MEM.ok], half: ['절반', MEM.half], fog: ['흐릿', MEM.fog], none: ['미평가', 'var(--mu)'] }
const rvRound = page('2회독 무게', 390, 720, `
${hd('<span class="tb">' + I.back + '</span>', '2회독 만들기', '<span></span>')}
<main class="mn" style="padding-top:4px"><span class="dtag">⑥ 기억으로 2회독 분량 정하기</span>
<div class="dw" style="display:flex;flex-direction:column;gap:6px"><b>수학의 정석 수학Ⅱ · 2회독</b><span class="sm mu">12월 1일 ~ 12월 9일 · 시험 3일 전까지</span></div>
<div class="dw" style="display:flex;flex-direction:column;gap:4px">
 <div class="sm mu" style="display:flex;justify-content:space-between;margin-bottom:4px"><span>단원 · 떠올리기</span><span>쓸 시간</span></div>
 ${W.map(([n, k, w]) => `<div class="wbar"><span style="width:104px;flex:none" class="el">${n}</span><span class="xs" style="width:40px;flex:none;color:${lab[k][1]};font-weight:700">${lab[k][0]}</span><div class="w"><i style="width:${w}%;background:var(--m);${k === 'ok' ? 'opacity:.45' : ''}"></i></div></div>`).join('')}
</div>
<div class="dw" style="display:flex;gap:12px;align-items:center"><span class="seg mini" style="flex:none"><button type="button" class="on">기억대로</button><button type="button">똑같이</button></span><span class="sm mu">흐릿한 단원에 2~3배 시간</span></div>
<p class="dnote">이미 있는 <b>단원 무게</b>(쉬움·보통·어려움)에 떠올리기 결과를 넣는 거예요. 자동 분량 배분이 그대로 흐릿한 단원에 더 많은 날을 줘요.</p>
</main>`)

const RB = [
  ['RV1Today', '① 오늘 탭 복습', rvToday, 820],
  ['RV2Sheet', '② 복습 화면', rvSheet, 820],
  ['RV3Ladder', '③ 단원 끝·사다리', rvLadder, 760],
  ['RV4Prog', '④ 진도와 기억', rvProg, 780],
  ['RV5Over', '⑤ 복습 쌓임', rvOver, 720],
  ['RV6Round', '⑥ 2회독 무게', rvRound, 720],
]
const cv3 = JSON.parse(fs.readFileSync(path.join(P, 'canvas.json'), 'utf8'))
if (!cv3.pages.some((p) => p.id === 'recall')) cv3.pages.push({ id: 'recall', name: '인출·복습 통합' })
RB.forEach(([n, title, html, h], i) => {
  fs.writeFileSync(path.join(P, `${n}.dc.html`), html)
  fs.writeFileSync(path.join(P, `${n}Dark.dc.html`), dark(n, title, h))
  cv3.boards[`${n}.dc.html`] = { x: i * 470, y: 0, w: 390, h, title, page: 'recall' }
  cv3.boards[`${n}Dark.dc.html`] = { x: i * 470, y: 820 + 240, w: 390, h, title: `${title} · 다크`, page: 'recall' }
  for (const k of [`${n}.dc.html`, `${n}Dark.dc.html`]) if (!cv3.order.includes(k)) cv3.order.push(k)
})
cv3.notes.rv_t = { x: 0, y: -300, page: 'recall', kind: 'title1', text: '인출·복습을 계획 안으로 · 시안 6장', maxW: 2700 }
cv3.launch = { view: 'canvas', page: 'recall' }
fs.writeFileSync(path.join(P, 'canvas.json'), JSON.stringify(cv3, null, 1))
console.log('ok recall')
