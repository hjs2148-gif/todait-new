
// ── 추천안: 오늘 탭 한 줄 + 진도 탭 복습 칸 + 캘린더 점 + 공부 끝 떠올리기 ──
// cat gen/head.mjs gen/dr.mjs gen/ap.mjs gen/rv.mjs gen/rv2.mjs > gen/rv2x.mjs && node gen/rv2x.mjs np
CSS += `.ptabs{display:flex;gap:2px;padding:2px;border-radius:12px;background:var(--chip)}
.ptabs button{flex:1;height:38px;border:0;border-radius:10px;background:transparent;color:var(--ink);font:inherit;font-size:15px;font-weight:600}
.ptabs button.on{background:var(--segon);box-shadow:0 1px 2px rgba(0,0,0,.12);font-weight:700}
.ptabs button i{display:inline-block;min-width:20px;height:20px;border-radius:10px;background:var(--rib);color:#fff;font-style:normal;font-size:12px;line-height:20px;margin-left:6px;padding:0 6px}
.rvline{display:flex;align-items:center;gap:12px;padding:12px 14px 12px 16px;border-radius:16px;background:var(--sf);box-shadow:0 1px 2px var(--shd)}
.rvline .gr b{font-size:15px}
.dueRow{display:flex;align-items:center;gap:12px;min-height:60px;padding:8px 16px;box-shadow:inset 0 -1px 0 var(--hl)}
.dueRow:last-child{box-shadow:none}
.dueRow .t{font-size:15px;line-height:21px;font-weight:600}
.lv{display:inline-flex;align-items:flex-end;gap:2px;height:14px;flex:none}
.lv i{display:block;width:4px;border-radius:1px;background:var(--trk)}
.lv i.f{background:var(--ink)}
.calg{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center}
.calg .h{font-size:12px;line-height:24px;color:var(--mu)}
.calg .d{height:52px;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:6px;gap:4px;font-size:13px}
.calg .d.x{color:var(--mu);opacity:.45}
.calg .d.sel{background:var(--ink);color:var(--bg)}
.calg .d.tdy b{box-shadow:inset 0 -2px 0 var(--ink)}
.calg .dots{display:flex;gap:2px;height:6px}
.calg .dots i{width:6px;height:6px;border-radius:3px;background:var(--rib)}
.calg .d.sel .dots i{background:var(--ribt)}
.calg .d.heavy{box-shadow:inset 0 0 0 1.5px var(--rib)}
.hist{display:flex;flex-direction:column;gap:0}
.hist div{display:flex;align-items:center;gap:10px;min-height:36px;font-size:14px;box-shadow:inset 0 -1px 0 var(--hl)}
.hist div:last-child{box-shadow:none}
.hist .pill{font-size:12px;font-weight:700;padding:2px 8px;border-radius:6px;background:var(--chip)}
`
const lv = (n) => `<span class="lv" aria-label="사다리 ${n}칸">${[5, 7, 9, 11, 14].map((h, i) => `<i class="${i < n ? 'f' : ''}" style="height:${h}px"></i>`).join('')}</span>`
const progHd = (on) => `${hd(T('진도'), '', '<span></span>')}
<div style="padding:0 16px 6px"><div class="ptabs"><button type="button" class="${on === 'p' ? 'on' : ''}">진도</button><button type="button" class="${on === 'r' ? 'on' : ''}">복습<i>3</i></button></div></div>`
const tabbar2 = (on) => `<nav class="dtab">${['오늘', '진도', '캘린더', '통계', '더보기'].map((t) => `<span class="${t === on ? 'on' : ''}"><i></i>${t}</span>`).join('')}</nav>`

// ── 1. 오늘 탭: 복습은 한 줄 ──
const t1 = page('오늘 · 복습 한 줄', 390, 844, `
${hd(T('11월 25일 수요일'), '', '<span></span>')}
<main class="mn" style="padding-top:0;flex:1"><span class="dtag">1 · 오늘 탭은 한 줄만</span>
<div class="dw hero" style="display:flex;flex-direction:column;gap:12px">
 <div class="dlab"><i class="dic">${IC.prog}</i>오늘 진행<span style="margin-left:auto">밤 10시 43분 끝</span></div>
 <span class="dbig" style="color:var(--bg)">38<small>%</small></span>
 <div><div class="tl">${[[9, 9.8, 'm', 0], [10.2, 10.7, 'k', 0], [13.5, 14.3, 'c', 0], [19.6, 20.0, 'rib', 1], [20.05, 21.0, 'm', 1], [21.1, 21.6, 'e', 1], [21.7, 22.7, 'm', 1]].map(([a, b, c, p]) => `<i class="${p ? 'plan' : ''}" style="left:${X(a)}%;width:${X(b) - X(a)}%;background:var(--${c})"></i>`).join('')}<span class="now" style="left:${X(19.5)}%"></span></div></div>
</div>
<div class="rvline"><span class="dkind" style="background:var(--ribt);color:var(--rib)">${IC.rev}</span><div class="gr"><b>복습 3단원 · 25분</b><div class="sm mu">함수의 연속 외 2개 · 진도 탭에서</div></div>${I.chev}</div>
<div class="sh"><h2>오늘 할 것</h2><span class="sm mu">밀린 것부터</span></div>
<div class="cd">${rowSimple(PLANS[0], { mark: kindMark('m', 'book') })}${rowSimple(PLANS[1], { mark: kindMark('m', 'pen') })}</div>
<p class="dnote">"오늘 복습"·"떠올리기" 위젯 두 개를 없애고 <b>이 한 줄</b>로 합쳐요. 복습 시간은 시간 줄(책갈피색)과 "끝" 시각에만 조용히 들어가요. 복습을 끄면 이 줄도 사라져요.</p>
</main>
${tabbar2('오늘')}`)

// ── 2. 진도 탭 · 복습 칸 (오늘 할 복습) ──
const DUE = [['함수의 연속', 'm', '수학의 정석 수학Ⅱ · 3단원', '지난번 흐릿 · 1일 만에', 0, '8분'], ['관계대명사', 'e', '수능 영어 독해 · 5단원', '3일 만에', 2, '6분'], ['수열의 극한', 'm', '수학의 정석 수학Ⅱ · 1단원', '7일 만에', 3, '11분']]
const t2 = page('진도 · 복습 칸', 390, 844, `
${progHd('r')}
<main class="mn" style="padding-top:6px;flex:1"><span class="dtag">2 · 진도 탭 복습 칸 · 오늘 할 복습</span>
<div class="dw" style="display:flex;align-items:center;gap:14px">
 <div class="gr"><div class="dlab"><i class="dic">${IC.rev}</i>오늘 복습</div><div style="margin-top:8px"><span class="dbig">3<small>단원</small></span> <span class="dbig" style="font-size:24px">25<small>분</small></span></div></div>
 <button class="dbtn" type="button" style="width:auto;padding:0 18px;background:var(--ink);color:var(--bg)">시작</button>
</div>
<div class="cd">${DUE.map(([n, c, src, why, l, m]) => `<div class="dueRow"><span class="dt" style="background:var(--${c})"></span><div class="gr"><div class="t el">${n}</div><div class="xs mu el">${src} · ${why}</div></div>${lv(l)}<span class="sm mu" style="width:34px;text-align:right">${m}</span></div>`).join('')}</div>
<div class="sh"><h2>다가오는 복습</h2><span class="sm mu">캘린더에서 자세히</span></div>
<div class="dw" style="display:flex;gap:6px;align-items:flex-end;height:96px">${[['목', 2], ['금', 4], ['토', 1], ['일', 0], ['월', 6], ['화', 3], ['수', 2]].map(([d, n]) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;justify-content:flex-end;height:100%"><span class="xs ${n >= 6 ? 'bd' : 'mu'}">${n || ''}</span><i style="width:100%;height:${n * 8 + 2}px;border-radius:5px;background:${n >= 6 ? 'var(--rib)' : 'var(--trk)'}"></i><span class="xs mu">${d}</span></div>`).join('')}</div>
<p class="dnote">"시작"을 누르면 한 단원씩 <b>덮고 떠올리기 → 흐릿·절반·잘</b> 화면이 이어져요. 오른쪽 작은 계단은 그 단원이 사다리 몇 칸째인지예요.</p>
</main>
${tabbar2('진도')}`)

// ── 3. 진도 탭 · 복습 칸 (기억 상태) ──
const t3 = page('진도 · 기억 상태', 390, 920, `
${progHd('r')}
<main class="mn" style="padding-top:6px"><span class="dtag">3 · 복습 칸 아래 · 과목별 기억</span>
<div class="sh" style="padding-top:2px"><h2>과목별 기억</h2><span class="sm mu">끝낸 단원 기준</span></div>
${subjCard('수학', 'm', 80, 4, 2, 2, 1)}
${subjCard('영어', 'e', 65, 5, 1, 0, 2)}
${memLg}
<div class="sh"><h2>살펴볼 단원</h2></div>
<div class="cd">
 <div class="rvrow"><span class="dkind" style="background:var(--ribt);color:var(--rib)">${IC.rev}</span><div class="gr"><div class="t" style="font-size:15px;font-weight:600">도함수의 활용</div><div class="why">세 번 연속 흐릿 · 다시 읽기 권해요</div></div>${I.chev}</div>
 <div class="rvrow"><span class="dkind" style="background:var(--ribt);color:var(--rib)">${IC.pen}</span><div class="gr"><div class="t" style="font-size:15px;font-weight:600">수열의 극한</div><div class="why">떠올리기는 "잘" · 문제 정답 11/20</div></div>${I.chev}</div>
 <div class="rvrow"><span class="dkind" style="background:var(--chip)">${chk}</span><div class="gr"><div class="t" style="font-size:15px;font-weight:600">졸업한 단원 6개</div><div class="why">시험 전에 한 번만 다시 나와요</div></div>${I.chev}</div>
</div>
<div class="cd">
 <div class="rvrow"><div class="gr"><div class="t" style="font-size:15px;font-weight:600">2회독 만들기</div><div class="why">흐릿한 단원에 시간을 더 줘요</div></div>${I.chev}</div>
 <div class="rvrow"><div class="gr"><div class="t" style="font-size:15px;font-weight:600">복습 설정</div><div class="why">켜짐 · 하루 30분까지</div></div>${I.chev}</div>
</div>
</main>`)

// ── 4. 단원 자세히 ──
const t4 = page('단원 자세히', 390, 860, `
${hd('<span class="tb">' + I.back + '</span>', '함수의 연속', '<span></span>')}
<main class="mn" style="padding-top:4px"><span class="dtag">4 · 단원 자세히 · 사다리와 기록</span>
<div class="dw" style="display:flex;flex-direction:column;gap:4px"><span class="dlab"><span class="dt" style="background:var(--m)"></span>수학의 정석 수학Ⅱ · 3단원 · 76~98쪽</span><span class="dbig" style="font-size:26px">다음 복습 <span style="color:var(--rib)">11.26</span></span><span class="sm mu">지난번 흐릿이라 내일 다시 물어요</span></div>
<div class="dw" style="display:flex;flex-direction:column;gap:12px">${ladder(0, 0)}
 <div class="lgd sm mu"><span><span class="sq" style="background:var(--rib)"></span>지금 칸</span><span>잘이면 3일, 흐릿이면 그대로 1일</span></div></div>
<div class="sh"><h2>떠올리기 기록</h2><span class="sm mu">4번</span></div>
<div class="dw hist">${[['11.25', '흐릿', '3번째 흐릿'], ['11.18', '흐릿', ''], ['11.15', '절반', ''], ['11.12', '흐릿', '단원 끝 다음 날']].map(([d, g, n]) => `<div><span class="mu" style="width:44px">${d}</span><span class="pill" style="${g === '흐릿' ? 'background:var(--ribt);color:var(--rib)' : ''}">${g}</span><span class="sm mu">${n}</span></div>`).join('')}</div>
<div class="dw" style="display:flex;gap:12px;align-items:flex-start"><i class="dic">${IC.book}</i><div class="gr"><b>세 번 연속 흐릿이에요</b><div class="sm mu" style="margin-top:4px">떠올리기만으로는 부족할 수 있어요. 이 단원을 한 번 다시 읽는 계획을 넣을까요?</div><div style="display:flex;gap:8px;margin-top:10px"><span class="ch lg" style="background:var(--ink);color:var(--bg)">다시 읽기 넣기 (40분)</span><span class="ch lg">괜찮아요</span></div></div></div>
</main>`)

// ── 5. 캘린더: 복습 점 ──
const CALD = { 24: 2, 25: 3, 26: 2, 27: 4, 28: 1, 30: 6, 1: 3, 2: 2, 3: 1, 4: 2, 7: 5, 9: 1 }
const calCells = () => {
  const out = []
  for (let i = 0; i < 42; i++) {
    const d = i - 6 + 1
    const out1 = d < 1 || d > 30
    const day = d < 1 ? 31 + d : d > 30 ? d - 30 : d
    const n = out1 ? (d > 30 ? CALD[day] ?? 0 : 0) : (CALD[day] && day >= 24 ? CALD[day] : 0)
    const cls = ['d', out1 ? 'x' : '', d === 25 ? 'sel' : '', n >= 5 ? 'heavy' : ''].join(' ')
    out.push(`<span class="${cls}"><b style="font-weight:${d === 25 ? 700 : 500}">${day}</b><span class="dots">${Array.from({ length: Math.min(n, 3) }, () => '<i></i>').join('')}</span></span>`)
  }
  return out.join('')
}
const t5 = page('캘린더 복습 점', 390, 960, `
${hd(T('2026년 11월'), '', '<span></span>')}
<main class="mn" style="padding-top:0"><span class="dtag">5 · 캘린더 · 날마다 복습 점</span>
<div class="dw"><div class="calg">${['일', '월', '화', '수', '목', '금', '토'].map((h) => `<span class="h">${h}</span>`).join('')}${calCells()}</div>
 <div class="lgd sm mu" style="margin-top:10px"><span><span class="sq" style="background:var(--rib);border-radius:3px"></span>복습 (점 하나 = 1~2단원)</span><span><span class="sq" style="box-shadow:inset 0 0 0 1.5px var(--rib);background:none"></span>몰린 날</span></div></div>
<div class="dw" style="display:flex;flex-direction:column;gap:10px">
 <b>11월 25일 수요일</b>
 <div class="dspec"><span class="dkind" style="background:var(--ribt);color:var(--rib)">${IC.rev}</span><span>복습 3단원</span><b style="margin-left:auto">25분</b></div>
 <div class="dspec"><span class="dkind">${IC.book}</span><span>새 공부 5개</span><b style="margin-left:auto">1:49</b></div>
</div>
<div class="dw" style="display:flex;gap:12px;align-items:center"><div class="gr"><b>11월 30일에 복습 6단원이 몰려요</b><div class="sm mu">하루 30분을 넘어서 2단원은 다음 날로 넘길게요</div></div><span class="ch">보기</span></div>
</main>`)

// ── 6. 공부 끝날 때 떠올리기 ──
const t6 = page('공부 끝 떠올리기', 390, 844, `
<div style="position:absolute;inset:0;background:var(--scrim)"></div>
<div class="sheet" style="padding:0 16px 24px;gap:12px">
 <div class="grab"></div>
 <span class="dtag" style="margin:4px 0 0">6 · 공부 끝낼 때 한 번 (집중 화면 다음)</span>
 <div style="display:flex;align-items:center;gap:10px;padding-top:4px"><b style="font-size:19px">42분 기록했어요</b><span class="sm mu" style="margin-left:auto">쎈 수학Ⅱ · 305~319문항</span></div>
 <div class="dw" style="background:var(--pg);box-shadow:none;display:flex;flex-direction:column;gap:10px">
  <span class="dlab"><i class="dic">${IC.rev}</i>잠깐, 어제 끝낸 단원</span>
  <b style="font-size:17px;line-height:24px">수열의 극한, 책 덮고 핵심 세 가지를 떠올려 보면?</b>
  ${g3(null, true)}
 </div>
 <div style="display:flex;gap:8px"><button class="sec" type="button" style="flex:1;padding:0">다음에</button><button class="pri" type="button">기록 저장</button></div>
 <p class="dnote" style="margin:0">하루에 <b>한 번, 한 단원만</b> 물어요. 이미 공부 모드라 떠올리기 좋은 때예요. "다음에"를 누르면 진도 탭 복습 칸에 남아요.</p>
</div>`)

const R2 = [
  ['RX1Today', '1 오늘 탭 한 줄', t1, 844],
  ['RX2Due', '2 복습 칸 · 오늘', t2, 844],
  ['RX3Mem', '3 복습 칸 · 기억', t3, 920],
  ['RX4Ch', '4 단원 자세히', t4, 860],
  ['RX5Cal', '5 캘린더 점', t5, 960],
  ['RX6End', '6 공부 끝 떠올리기', t6, 844],
]
const cv4 = JSON.parse(fs.readFileSync(path.join(P, 'canvas.json'), 'utf8'))
if (!cv4.pages.some((p) => p.id === 'recall2')) cv4.pages.push({ id: 'recall2', name: '복습 자리 · 추천안' })
R2.forEach(([n, title, html, h], i) => {
  fs.writeFileSync(path.join(P, `${n}.dc.html`), html)
  fs.writeFileSync(path.join(P, `${n}Dark.dc.html`), dark(n, title, h))
  cv4.boards[`${n}.dc.html`] = { x: i * 470, y: 0, w: 390, h, title, page: 'recall2' }
  cv4.boards[`${n}Dark.dc.html`] = { x: i * 470, y: 960 + 240, w: 390, h, title: `${title} · 다크`, page: 'recall2' }
  for (const k of [`${n}.dc.html`, `${n}Dark.dc.html`]) if (!cv4.order.includes(k)) cv4.order.push(k)
})
cv4.notes.rx_t = { x: 0, y: -300, page: 'recall2', kind: 'title1', text: '복습 자리: 오늘 한 줄 · 진도 탭 복습 칸 · 캘린더 점 · 공부 끝', maxW: 2700 }
cv4.launch = { view: 'canvas', page: 'recall2' }
fs.writeFileSync(path.join(P, 'canvas.json'), JSON.stringify(cv4, null, 1))
console.log('ok recall2')
