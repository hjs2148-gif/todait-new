
// ── 남은 것: 넘치는 날 알림 · 다른 방법 · 앞으로 2주와 여유 · 필요할 때 제안 (head.mjs 뒤에 이어 붙여 실행) ──
// 원칙: 카드 한 장 = 문장 하나 + 행동 하나. 앱이 추천하고 사용자는 확인만. 정상은 조용히, 문제만 먹색. 시간은 "1시간 10분" 한 가지로.
CSS += `.t13{font-size:13px;line-height:18px}.t15{font-size:15px;line-height:22px}
.nc{background:var(--sf);border-radius:20px;box-shadow:0 1px 2px var(--shd);padding:18px 20px 20px;display:flex;flex-direction:column}
.nc .lab{font-size:13px;line-height:18px;color:var(--mu)}
.nc .head{font-size:20px;line-height:28px;font-weight:700;letter-spacing:-0.2px;margin-top:2px}
.nc .body{font-size:15px;line-height:22px;margin-top:6px}
.nc .acts{display:flex;gap:8px;margin-top:16px}
.nc .acts button{height:44px;border-radius:12px;border:0;font:inherit;font-size:15px;font-weight:600;padding:0 16px}
.nc .acts .s{background:var(--chip);color:var(--ink);flex:none}
.nc .acts .p{background:var(--ink);color:var(--bg);flex:1;font-weight:700}
.nc .acts .c{background:var(--chip);color:var(--ink);flex:1}
.when{font-size:13px;line-height:18px;color:var(--mu);padding:16px 4px 6px}
.dg{display:grid;grid-template-columns:44px repeat(7,minmax(0,1fr));align-items:center;row-gap:10px}
.dg .wk{text-align:center;font-size:13px;line-height:18px;color:var(--mu)}
.dg .rl{font-size:13px;line-height:18px;color:var(--mu)}
.dg .dot{justify-self:center;width:10px;height:10px;border-radius:5px;background:var(--trk)}
.dg .dot.past{background:transparent;box-shadow:inset 0 0 0 1.5px var(--trk)}
.dg .dot.now{box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--ink)}
.dg .dot.hot{width:14px;height:14px;border-radius:7px;background:var(--ink)}
.orow{display:flex;gap:12px;align-items:flex-start;padding:16px 0;border:0;background:transparent;font:inherit;color:var(--ink);text-align:left;width:100%;box-shadow:inset 0 -1px 0 var(--hl)}
.orow:last-child{box-shadow:none}
.rad2{width:22px;height:22px;border-radius:11px;box-shadow:inset 0 0 0 2px var(--mu);flex:none;margin-top:1px}
.orow.on .rad2{box-shadow:inset 0 0 0 7px var(--ink)}
.rec{font-size:12px;line-height:16px;font-weight:700;padding:2px 7px;border-radius:6px;background:var(--chip);margin-left:6px;vertical-align:2px}
.sl{display:flex;align-items:center;gap:12px;padding:14px 20px;box-shadow:inset 0 -1px 0 var(--hl)}
.sl:last-child{box-shadow:none}
.sl .n{flex:1;min-width:0}
.sl .v{text-align:right;flex:none}
.sl .v b{display:block;font-size:20px;line-height:26px}
.sl .v.z b{display:inline-block;background:var(--ink);color:var(--bg);border-radius:9px;padding:0 9px}
`
const todayTop = `${hd('<span style="padding-left:8px;font-size:20px;font-weight:700">11월 25일 수요일</span>', '', '<span style="display:flex;gap:6px;padding-right:8px"><button type="button" class="ch lg">편집</button><button type="button" class="ch lg on" aria-label="새 계획" style="width:36px;padding:0;justify-content:center">' + I.plus + '</button></span>')}`
const dimRows = `<section class="cd" style="opacity:.5" aria-hidden="true">${[['수학의 정석 미적분', '목표 31~40쪽', '58%'], ['쎈 수학Ⅱ', '목표 305~319문항', '0%'], ['영어 독해 인강', '목표 21강', '0%']].map(([a, b, c], i) => `<div class="rw${i === 2 ? ' nl' : ''}" style="min-height:60px"><span class="gr"><b style="display:block">${a}</b><span class="t13 mu">${b}</span></span><b>${c}</b></div>`).join('')}</section>`
/** 문장 하나 + 행동 하나 카드 */
const card = (lab, head, body, acts) => `<section class="nc"><span class="lab">${lab}</span><span class="head">${head}</span>${body ? `<span class="body">${body}</span>` : ''}<div class="acts">${acts}</div></section>`

// ── 1. 오늘 탭: 넘치는 날 ──
const R1 = page('오늘 탭 · 넘치는 날 알림', 390, 844, `
${todayTop}
<main class="mn">
${card('12월 1일 화요일', '계획이 1시간 10분 많아요', '그날 저녁 공부를 11시 30분까지 늘리면 다 들어가요.', '<button type="button" class="s">다른 방법</button><button type="button" class="p">이렇게 하기</button>')}
${sh('오늘 목표 10개 중 2개 끝')}
${dimRows}
</main>
`)

// ── 2. 다른 방법: 막대 없이 결과 한 줄 ──
const orow = (on, title, result, rec) => `<button type="button" class="orow${on ? ' on' : ''}"><span class="rad2"></span><span style="flex:1;min-width:0"><b style="display:block;font-size:16px;line-height:22px">${title}${rec ? '<span class="rec">추천</span>' : ''}</b><span class="t15 mu" style="display:block;margin-top:2px">${result}</span></span></button>`
const R2 = page('다른 방법 고르기', 390, 844, `
${todayTop}
<div style="position:absolute;inset:0;background:var(--scrim)"></div>
<section class="sheet" aria-label="다른 방법">
<div class="grab"></div>
<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:4px 8px 4px 20px"><div><div class="t13 mu">12월 1일 화요일 · 계획 5시간 10분, 가능 4시간</div><b style="display:block;font-size:20px;line-height:28px;margin-top:2px">1시간 10분을 어떻게 할까요?</b></div><button type="button" class="tb">닫기</button></div>
<div style="padding:4px 20px 0">
${orow(true, '그날 저녁 1시간 30분 더', '다 들어가요 · 이번 주만', true)}
${orow(false, '정석 미적분 끝나는 날 이틀 늦추기', '12월 11일에 끝나요 · 시험 하루 전')}
${orow(false, '쎈 수학 그날만 7문항 줄이기', '줄인 7문항은 일요일 예비일로 가요')}
</div>
<div class="ft" style="padding-top:12px"><button type="button" class="pri">이렇게 하기</button></div>
</section>
`)

// ── 3. 진도 탭: 앞으로 2주(문제만 표시) + 시험까지 여유 ──
const ROWS = [['이번 주', ['past', 'past', 'now', '', '', '', '']], ['다음 주', ['', 'hot', '', '', '', '', '']]]
const SLK = [['e', '영어 독해 인강', '12월 11일 끝', 0], ['c', '쎈 수학Ⅱ', '12월 10일 끝', 1], ['m', '수학의 정석 미적분', '12월 9일 끝', 3], ['k', '국어 비문학 독해', '12월 6일 끝', 6]]
const R3 = page('진도 탭 · 앞으로 2주와 여유', 390, 844, `
${hd('<span style="padding-left:8px;font-size:20px;font-weight:700">진도</span>', '', '<span></span>')}
<main class="mn">
<section class="nc" aria-label="앞으로 2주">
<span class="lab">앞으로 2주</span><span class="head">다음 주 화요일만 빠듯해요</span>
<div class="dg" style="margin-top:16px"><span></span>${['월', '화', '수', '목', '금', '토', '일'].map((d) => `<span class="wk">${d}</span>`).join('')}
${ROWS.map(([l, ds]) => `<span class="rl">${l}</span>${ds.map((k) => `<span class="dot${k ? ' ' + k : ''}"></span>`).join('')}`).join('')}</div>
<button type="button" class="rw nl" style="margin:14px -20px -20px;padding:0 20px;min-height:52px;border:0;background:transparent;font:inherit;color:var(--ink);box-shadow:inset 0 1px 0 var(--hl);text-align:left"><span class="gr"><b>12월 1일 화요일</b> <span class="mu">· 1시간 10분 많아요</span></span><span class="mu">${I.chev}</span></button>
</section>
${sh('시험까지 여유', '기말고사 12월 12일')}
<section class="cd" aria-label="계획별 여유">
${SLK.map(([c, n, sub, d]) => `<div class="sl"><span class="dt" style="width:8px;height:8px;border-radius:4px;background:var(--${c})"></span><span class="n"><b class="el" style="display:block;font-size:16px;line-height:22px">${n}</b><span class="t13 mu">${sub}</span></span><span class="v${d === 0 ? ' z' : ''}"><span class="t13 mu" style="display:block">여유</span><b>${d}일</b></span></div>`).join('')}
</section>
<p class="t13 mu" style="margin:4px 4px 0">여유는 이대로 끝나는 날부터 시험까지 남는 공부일이에요.</p>
</main>
`)

// ── 4. 필요할 때 제안: 같은 틀, 하루에 하나만 ──
const R4 = page('필요할 때 제안 (같은 틀)', 390, 1380, `
${hd('<span style="width:56px"></span>', '오늘 탭에 뜨는 제안', '<span style="width:56px"></span>')}
<main class="mn">
<p class="t15 mu" style="margin:0 4px">처음에 묻지 않은 것은 필요한 순간에 하나씩 물어봐요. 하루에 한 장만 떠요.</p>
<div class="when">계획을 만들고 1주 뒤</div>
${card('수학의 정석 미적분 · 첫 주', '생각보다 조금 느려요', '이 속도면 12월 14일에 끝나요. 하루 15쪽으로 늘리면 12월 9일에 끝나요.', '<button type="button" class="s">그대로</button><button type="button" class="p">15쪽으로 늘리기</button>')}
<div class="when">단원을 끝낸 다음 날</div>
${card('어제 끝낸 2단원 급수', '책을 덮고 떠올려 보면?', '고른 대로 복습 날짜를 잡아요.', '<button type="button" class="c">흐릿해요</button><button type="button" class="c">절반쯤</button><button type="button" class="c">잘 나요</button>')}
<div class="when">기록이 2주 쌓였을 때</div>
${card('공부 시간 기록', '토요일엔 평균 3시간 했어요', '공부 가능 시간을 토요일 3시간으로 바꿀까요? 지금은 2시간이에요.', '<button type="button" class="s">나중에</button><button type="button" class="p">3시간으로 바꾸기</button>')}
<div class="when">문제집 정답률이 쌓였을 때</div>
${card('쎈 수학Ⅱ · 급수', '정답률이 58%예요', '잘 안다고 고른 단원이에요. 틀린 문항 위주로 복습을 넣을까요?', '<button type="button" class="s">괜찮아요</button><button type="button" class="p">복습 넣기</button>')}
<div class="when">1회독이 3일 남았을 때 (앱에 들어가 있음)</div>
${card('수학의 정석 미적분 · 1회독 3일 남음', '2회독도 할까요?', '다시 읽기보다 덮고 떠올리기 위주로 빠르게 · 12월 10일 ~ 12월 11일', '<button type="button" class="s">안 할래요</button><button type="button" class="p">2회독 만들기</button>')}
</main>
`)

const BOARDS = [
  ['RMToday', '오늘 탭 · 넘치는 날 알림', R1, 844],
  ['RMFix', '다른 방법 고르기 (시트)', R2, 844],
  ['RMLoad', '진도 탭 · 앞으로 2주와 여유 ○일', R3, 844],
  ['RMSuggest', '필요할 때 제안 · 같은 틀', R4, 1380],
]
const canvas = JSON.parse(fs.readFileSync(path.join(P, 'canvas.json'), 'utf8'))
if (!canvas.pages.some((p) => p.id === 'remaining')) canvas.pages.push({ id: 'remaining', name: '남은 것 (넘치는 날 · 여유)' })
const DARK_Y = 1380 + 340
BOARDS.forEach(([n, title, html, h], i) => {
  fs.writeFileSync(path.join(P, `${n}.dc.html`), html)
  fs.writeFileSync(path.join(P, `${n}Dark.dc.html`), dark(n, title, h))
  const x = i * 470
  canvas.boards[`${n}.dc.html`] = { x, y: 0, w: 390, h, title, page: 'remaining' }
  canvas.boards[`${n}Dark.dc.html`] = { x, y: DARK_Y, w: 390, h, title: `${title} · 다크`, page: 'remaining' }
  for (const k of [`${n}.dc.html`, `${n}Dark.dc.html`]) if (!canvas.order.includes(k)) canvas.order.push(k)
})
const W = BOARDS.length * 470 - 80
canvas.notes.rm_t = { x: 0, y: -300, page: 'remaining', kind: 'title1', text: '카드 한 장 = 문장 하나 + 행동 하나', maxW: W }
canvas.notes.rm_d = { x: 0, y: DARK_Y - 260, page: 'remaining', kind: 'title1', text: '다크 화면', maxW: W }
delete canvas.notes.rm_s
canvas.launch = { view: 'canvas', page: 'remaining' }
fs.writeFileSync(path.join(P, 'canvas.json'), JSON.stringify(canvas, null, 1))
console.log('ok', BOARDS.map((b) => b[0]).join(' '))
