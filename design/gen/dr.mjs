
// ── 디자인 검토 2·3단계 시안 (head.mjs 뒤에 이어 붙여 실행) ──
// cat gen/head.mjs gen/dr.mjs > gen/drx.mjs && node gen/drx.mjs np
CSS += `.dtag{align-self:flex-start;font-size:13px;line-height:18px;font-weight:700;padding:3px 10px;border-radius:9px;background:var(--ink);color:var(--bg);margin:0 4px}
.dnote{margin:0 4px;font-size:13px;line-height:19px;color:var(--mu)}
.dnote b{color:var(--ink)}
.dic{width:26px;height:26px;border-radius:13px;display:inline-flex;align-items:center;justify-content:center;flex:none;background:var(--chip);color:var(--ink)}
.dbig{font-size:34px;line-height:38px;font-weight:700;letter-spacing:-.5px}
.dbig small{font-size:15px;font-weight:600;color:var(--mu);margin-left:2px;letter-spacing:0}
.dw{background:var(--sf);border-radius:20px;box-shadow:0 1px 2px var(--shd);padding:14px 16px}
.dw.hero{background:var(--ink);color:var(--bg)}
.dw.hero .mu{color:color-mix(in srgb,var(--bg) 70%,transparent)}
.dw.hero .dlab{color:color-mix(in srgb,var(--bg) 72%,transparent)}
.dw.hero .dic{background:color-mix(in srgb,var(--bg) 18%,transparent);color:var(--bg)}
.dlab{display:flex;align-items:center;gap:8px;font-size:13px;line-height:18px;color:var(--mu)}
.dtrk{height:8px;border-radius:4px;background:var(--trk);overflow:hidden;display:flex}
.dw.hero .dtrk{background:color-mix(in srgb,var(--bg) 16%,transparent)}
.dtrk i{display:block;height:100%}
.dbtn{height:44px;border-radius:12px;border:0;background:var(--bg);color:var(--ink);font:inherit;font-size:15px;font-weight:700;width:100%}
.dg2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.drow{display:flex;align-items:center;gap:12px;min-height:64px;padding:10px 12px 10px 16px;box-shadow:inset 0 -1px 0 var(--hl)}
.drow:last-child{box-shadow:none}
.drow .t{font-size:16px;line-height:22px;font-weight:600}
.drow .n{font-size:17px;line-height:22px;font-weight:700;text-align:right;white-space:nowrap}
.drow .n small{font-size:13px;font-weight:500;color:var(--mu)}
.dplay{width:40px;height:40px;border-radius:20px;background:var(--chip);border:0;display:inline-flex;align-items:center;justify-content:center;color:var(--ink);flex:none}
.dbar{height:4px;border-radius:2px;background:var(--trk);margin-top:6px;overflow:hidden}
.dbar i{display:block;height:100%;border-radius:2px}
.dflag{display:inline-flex;align-items:center;height:20px;padding:0 7px;border-radius:6px;background:var(--chip);font-size:12px;font-weight:700;color:var(--ink);margin-left:6px;vertical-align:1px}
.dsw{width:4px;align-self:stretch;border-radius:2px;flex:none;margin:6px 0}
.dkind{width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;flex:none}
.dtab{height:64px;flex:none;display:flex;justify-content:space-around;align-items:center;background:var(--sf);box-shadow:inset 0 1px 0 var(--hl);font-size:12px;color:var(--mu)}
.dtab span{display:flex;flex-direction:column;align-items:center;gap:3px}
.dtab span.on{color:var(--ink);font-weight:700}
.dtab i{width:22px;height:22px;border-radius:6px;box-shadow:inset 0 0 0 1.8px currentColor;display:block}
.dfab{position:absolute;right:16px;width:56px;height:56px;border-radius:28px;background:var(--ink);color:var(--bg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.22)}
.dzone{position:absolute;left:0;right:0;bottom:0;height:300px;background:linear-gradient(to top,color-mix(in srgb,var(--k) 16%,transparent),transparent);pointer-events:none}
.dzl{position:absolute;left:16px;font-size:12px;line-height:16px;font-weight:700;color:var(--k)}
.dcal{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:13px;line-height:34px}
.dcal .h{font-size:12px;line-height:24px;color:var(--mu)}
.dcal .x{color:var(--mu);opacity:.5}
.dcal .tdy{background:var(--ink);color:var(--bg);border-radius:17px;font-weight:700}
.dspec{display:flex;align-items:center;gap:10px;font-size:13px;line-height:18px}
.dspec code{font:inherit;font-size:12px;color:var(--mu);margin-left:auto}
`
const SVG = (d, s = 15, w = 2.2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`
const IC = {
  prog: SVG('<circle cx="12" cy="12" r="8"></circle><path d="M8.5 12.3l2.5 2.5 4.5-5"></path>', 14),
  rev: SVG('<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5"></path>', 14),
  flag: SVG('<path d="M6 21V4M6 4h11l-2.5 4 2.5 4H6"></path>', 14),
  play: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"></path></svg>',
  book: SVG('<path d="M5 4.5h10a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z"></path><path d="M5 17a3 3 0 0 1 3-3h10"></path>', 15),
  pen: SVG('<path d="M15 5l4 4L9 19H5v-4z"></path><path d="M13 7l4 4"></path>', 15),
  video: SVG('<rect x="3.5" y="6" width="13" height="12" rx="2.5"></rect><path d="M16.5 10.5l4-2.5v8l-4-2.5"></path>', 15),
  chart: SVG('<path d="M5 20V10M12 20V4M19 20v-7"></path>', 14),
}
const T = (s) => `<span style="padding-left:8px;font-size:20px;font-weight:700">${s}</span>`
const tabbar = `<nav class="dtab">${['오늘', '진도', '캘린더', '통계', '더보기'].map((t, i) => `<span class="${i ? '' : 'on'}"><i></i>${t}</span>`).join('')}</nav>`

// 오늘 계획 목록 (2·3단계 공용)
const PLANS = [
  ['수학의 정석 수학Ⅱ', 'm', 7, 12, '쪽', 25, 'book'],
  ['쎈 수학Ⅱ', 'm', 0, 15, '문항', 48, 'pen'],
  ['영어 독해 인강', 'e', 0, 1, '강', 6, 'video'],
  ['국어 비문학 독해', 'k', 4, 7, '쪽', 25, 'book'],
  ['물리 개념 정리', 'c', 45, 60, '분', 0, 'book'],
]
const left = (d, t, u) => u === '분' ? `${t - d}<small>분 남음</small>` : `${t - d}<small>${u} 남음</small>`
// 한 줄에 숫자 하나: 남은 양만 크게. 밀림은 칩 하나. 나머지는 눌러서.
const rowSimple = ([n, c, d, t, u, late], opt = {}) => `<div class="drow">
${opt.mark ? opt.mark : ''}<div class="gr"><div class="t el">${n}${late && !opt.noflag ? '<span class="dflag">밀림</span>' : ''}</div>
<div class="dbar"><i style="width:${Math.round((d / t) * 100)}%;background:var(--${c})"></i></div></div>
<span class="n">${d >= t ? '끝' : left(d, t, u)}</span>
<button class="dplay" type="button" aria-label="시작">${IC.play}</button></div>`

// ── 2-A 오늘 탭: 진행 위젯은 요약만, 계획 목록은 아래 한 번만 ──
const todayA = page('오늘 · 겹침 없앰', 390, 960, `
${hd(T('11월 25일 수요일'), '', '<span style="display:flex;gap:6px;padding-right:8px"><span class="ch lg">편집</span><span class="ch lg" style="width:36px;padding:0;justify-content:center">' + I.plus + '</span></span>')}
<main class="mn" style="padding-top:0"><span class="dtag">2-A · 오늘 탭 겹침 없애기</span>
<div class="dw hero" style="display:flex;flex-direction:column;gap:12px">
 <div class="dlab"><i class="dic">${IC.prog}</i>오늘 진행<span style="margin-left:auto">밤 10시 18분 끝</span></div>
 <div style="display:flex;align-items:flex-end;gap:12px"><span class="dbig" style="color:var(--bg)">43<small>%</small></span><span class="mu sm" style="padding-bottom:6px">9개 중 2개 끝 · 1:53 공부</span></div>
 <div class="dtrk"><i style="width:18%;background:var(--m)"></i><i style="width:8%;background:var(--k)"></i><i style="width:11%;background:var(--c)"></i><i style="width:6%;background:var(--e)"></i></div>
 <button class="dbtn" type="button">다음: 수학의 정석 수학Ⅱ 시작</button>
</div>
<div class="dg2">
 <div class="dw"><div class="dlab"><i class="dic">${IC.rev}</i>오늘 복습</div><div class="dbig" style="margin-top:10px">4<small>단원</small></div><div class="sm mu" style="margin-top:6px">먼저 <b style="color:var(--ink)">함수의 연속</b></div></div>
 <div class="dw"><div class="dlab"><i class="dic">${IC.flag}</i>기말 D-17</div><div class="dbig" style="margin-top:10px">0<small>일 여유</small></div><div class="sm mu" style="margin-top:6px">수학Ⅱ가 가장 빠듯</div></div>
</div>
<div class="sh"><h2>오늘 할 것</h2><span class="sm mu">밀린 것부터</span></div>
<div class="cd">${PLANS.map((p) => rowSimple(p)).join('')}</div>
<p class="dnote">진행 위젯에서 <b>과목별 줄을 뺐어요.</b> 계획은 아래 목록에서 한 번만 보여요. 위젯은 "얼마나 했나·언제 끝나나·다음 뭐 하나" 세 가지만.</p>
</main>`)

// ── 2-B 목록 줄: 숫자 하나 + 눌러서 펼치기 ──
const rowsB = page('목록 줄 · 숫자 하나', 390, 860, `
${hd(T('목록 줄 정리'), '', '<span></span>')}
<main class="mn" style="padding-top:0"><span class="dtag">2-B · 줄마다 숫자 하나</span>
<div class="sh"><h2>지금</h2><span class="sm mu">숫자 5개</span></div>
<div class="cd"><div class="drow"><div class="gr"><div class="t el">수학의 정석 수학Ⅱ</div><div class="sm mu">목표 229~240쪽 · <b style="color:var(--ink)">25쪽 밀림</b></div><div class="dbar"><i style="width:58%;background:var(--m)"></i></div></div><div style="text-align:right"><div class="n">58<small>%</small></div><div class="sm mu">7 / 12쪽</div></div><button class="dplay" type="button">${IC.play}</button></div></div>
<div class="sh"><h2>바꾸면</h2><span class="sm mu">남은 양 하나만</span></div>
<div class="cd">${rowSimple(PLANS[0])}${rowSimple(PLANS[1])}</div>
<div class="sh"><h2>누르면 펼쳐져요</h2><span class="sm mu">자세한 숫자는 여기</span></div>
<div class="cd">
 ${rowSimple(PLANS[0])}
 <div style="padding:4px 16px 14px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:var(--pg)">
  ${[['오늘 범위', '229~240쪽'], ['했어요', '7 / 12쪽'], ['밀린 양', '25쪽']].map(([a, b]) => `<div style="padding-top:10px"><div class="xs mu">${a}</div><div class="bd" style="font-size:15px">${b}</div></div>`).join('')}
  <div style="grid-column:1/-1;display:flex;gap:8px;margin-top:4px"><span class="ch lg">기록 고치기</span><span class="ch lg">밀린 것 나누기</span></div>
 </div>
 ${rowSimple(PLANS[3])}
</div>
<p class="dnote">줄에는 <b>남은 양</b>만 크게. 퍼센트는 막대가 대신 말해줘요. 밀렸으면 "밀림" 칩 하나만 붙어요.</p>
</main>`)

// ── 3-A 화면끼리 모양 통일 ──
const spec = (k, v, code) => `<div class="dspec">${k}<span>${v}</span><code>${code}</code></div>`
const unify = page('화면 모양 통일', 390, 880, `
${hd(T('모양 규칙 하나로'), '', '<span></span>')}
<main class="mn" style="padding-top:0"><span class="dtag">3-A · 오늘·진도·통계 같은 모양</span>
<div class="dw" style="display:flex;flex-direction:column;gap:12px">
 ${spec('<i class="dic">' + IC.prog + '</i>', '아이콘 칩: 원 26, 회색 바탕', '모든 카드 제목 앞')}
 ${spec('<span class="dbig" style="font-size:28px">43<small>%</small></span>', '큰 숫자 + 작은 단위', '34 / 15')}
 ${spec('<span style="width:36px;height:24px;border-radius:8px;background:var(--chip)"></span>', '모서리: 카드 20 · 버튼 12 · 칩 8', '세 가지만')}
</div>
<div class="sh"><h2>오늘 탭 카드</h2></div>
<div class="dw"><div class="dlab"><i class="dic">${IC.rev}</i>오늘 복습</div><div class="dbig" style="margin-top:10px">4<small>단원</small></div></div>
<div class="sh"><h2>진도 탭 카드</h2></div>
<div class="dw"><div class="dlab"><i class="dic">${IC.flag}</i>2학기 기말 · 12월 12일</div><div style="display:flex;gap:24px;margin-top:10px"><span class="dbig">17<small>일 남음</small></span><span class="dbig">62<small>% 진도</small></span></div><div class="dtrk" style="margin-top:12px"><i style="width:62%;background:var(--ink)"></i></div></div>
<div class="sh"><h2>통계 탭 카드</h2></div>
<div class="dw"><div class="dlab"><i class="dic">${IC.chart}</i>이번 주 공부</div><div class="dbig" style="margin-top:10px">11<small>시간</small> 40<small>분</small></div><div style="display:flex;gap:6px;align-items:flex-end;height:44px;margin-top:10px">${[22, 30, 18, 40, 26, 34, 12].map((h, i) => `<i style="flex:1;height:${h}px;border-radius:4px;background:${i === 2 ? 'var(--ink)' : 'var(--trk)'}"></i>`).join('')}</div></div>
<p class="dnote">세 탭 카드가 <b>같은 머리(칩+제목) · 같은 숫자 크기 · 같은 모서리</b>를 써요. 탭을 넘겨도 한 앱처럼 보여요.</p>
</main>`)

// ── 3-B 같은 과목 계획 구분 ──
const kindMark = (c, k) => `<span class="dkind" style="background:color-mix(in srgb,var(--${c}) 18%,var(--sf));color:var(--${c})">${IC[k]}</span>`
const shadeMark = (c, dark) => `<span class="dsw" style="background:var(--${c});${dark ? '' : 'opacity:.45'}"></span>`
const same = page('같은 과목 구분', 390, 800, `
${hd(T('수학 계획 두 개'), '', '<span></span>')}
<main class="mn" style="padding-top:0"><span class="dtag">3-B · 같은 과목 계획 구분</span>
<div class="sh"><h2>지금</h2><span class="sm mu">둘 다 같은 파랑</span></div>
<div class="cd">${rowSimple(PLANS[0], { noflag: true })}${rowSimple(PLANS[1], { noflag: true })}</div>
<div class="sh"><h2>① 진하기로</h2><span class="sm mu">같은 파랑, 진하게·옅게</span></div>
<div class="cd">${rowSimple(PLANS[0], { noflag: true, mark: shadeMark('m', true) })}${rowSimple([PLANS[1][0], 'm', 3, 15, '문항', 0], { noflag: true, mark: shadeMark('m', false) }).replace('background:var(--m)"></i>', 'background:var(--m);opacity:.45"></i>')}</div>
<div class="sh"><h2>② 종류 아이콘 (추천)</h2><span class="sm mu">책 · 문제집 · 인강</span></div>
<div class="cd">${PLANS.slice(0, 3).map((p) => rowSimple(p, { noflag: true, mark: kindMark(p[1], p[6]) })).join('')}</div>
<p class="dnote">②는 색은 과목, 아이콘은 종류라 <b>한눈에 "수학 책" / "수학 문제집"</b>이 갈려요. ①은 차이가 작아 다크에서 잘 안 보여요.</p>
</main>`)

// ── 3-C 자주 누르는 버튼을 엄지 쪽으로 ──
const thumb = page('엄지 닿는 곳', 390, 844, `
${hd(T('11월 25일 수요일'), '', '<span></span>')}
<main class="mn" style="padding-top:0;flex:1"><span class="dtag">3-C · 버튼을 엄지 쪽으로</span><p class="dnote">위 오른쪽 [편집][+]를 없애고 <b>+는 오른쪽 아래 둥근 버튼</b>, 편집은 위젯 맨 아래로.</p>
<div class="dw hero" style="display:flex;flex-direction:column;gap:12px">
 <div class="dlab"><i class="dic">${IC.prog}</i>오늘 진행<span style="margin-left:auto">밤 10시 18분 끝</span></div>
 <span class="dbig" style="color:var(--bg)">43<small>%</small></span>
 <div class="dtrk"><i style="width:43%;background:var(--bg)"></i></div>
</div>
<div class="dg2">
 <div class="dw"><div class="dlab"><i class="dic">${IC.rev}</i>오늘 복습</div><div class="dbig" style="margin-top:10px">4<small>단원</small></div></div>
 <div class="dw"><div class="dlab"><i class="dic">${IC.flag}</i>기말 D-17</div><div class="dbig" style="margin-top:10px">0<small>일 여유</small></div></div>
</div>
<div class="cd">${rowSimple(PLANS[0])}${rowSimple(PLANS[3])}</div>
<div style="text-align:center;padding:4px 0"><span class="ch lg">위젯 편집</span></div>
</main>
<div class="dzone" style="bottom:64px"></div>
<span class="dzl" style="bottom:150px">엄지가 편한 곳</span>
<span class="dfab" style="bottom:84px">${I.plus.replace('width="15" height="15"', 'width="24" height="24"')}</span>
${tabbar}

`)

// ── 3-D 달력 일요일 색 (선택) ──
const cal = (sunRed) => {
  const H = ['일', '월', '화', '수', '목', '금', '토']
  const cells = []
  for (let i = 0; i < 35; i++) {
    const d = i - 6 + 1 // 11월 1일 = 토요일
    const day = d < 1 ? 31 + d : d > 30 ? d - 30 : d
    const out = d < 1 || d > 30
    const sun = i % 7 === 0
    const cls = out ? 'x' : d === 25 ? 'tdy' : ''
    const st = !out && sun && d !== 25 ? (sunRed ? 'color:var(--bad)' : 'color:var(--mu)') : ''
    cells.push(`<span class="${cls}" style="${st}">${day}</span>`)
  }
  return `<div class="dcal">${H.map((h, i) => `<span class="h" style="${i === 0 ? (sunRed ? 'color:var(--bad)' : '') : ''}">${h}</span>`).join('')}${cells.join('')}</div>`
}
const calB = page('달력 일요일 색', 390, 740, `
${hd(T('2026년 11월'), '', '<span></span>')}
<main class="mn" style="padding-top:0"><span class="dtag">3-D · 달력 일요일 (선택)</span>
<div class="sh"><h2>지금 · 일요일 빨강</h2></div>
<div class="dw">${cal(true)}</div>
<div class="sh"><h2>바꾸면 · 일요일 회색</h2></div>
<div class="dw">${cal(false)}</div>
<p class="dnote">빨강은 "지금 해야 할 일" 한 곳에만 쓰기로 했어요. 일요일은 <b>회색</b>이면 충분히 구분되고, 밀린 날 표시와 헷갈리지 않아요. 익숙한 빨강이 좋으면 그대로 둬도 돼요.</p>
</main>`)

const BOARDS = [
  ['DR2Today', '2-A 오늘 탭 겹침 없앰', todayA, 960, 0, 0],
  ['DR2Rows', '2-B 목록 줄 숫자 하나', rowsB, 860, 1, 0],
  ['DR3Unify', '3-A 화면 모양 통일', unify, 880, 2, 1],
  ['DR3Same', '3-B 같은 과목 구분', same, 800, 3, 1],
  ['DR3Thumb', '3-C 엄지 닿는 곳', thumb, 844, 4, 1],
  ['DR3Cal', '3-D 달력 일요일', calB, 740, 5, 1],
]
const cv = JSON.parse(fs.readFileSync(path.join(P, 'canvas.json'), 'utf8'))
if (!cv.pages.some((p) => p.id === 'review')) cv.pages.push({ id: 'review', name: '디자인 검토 2·3' })
for (const [n, title, html, h, i] of BOARDS) {
  fs.writeFileSync(path.join(P, `${n}.dc.html`), html)
  fs.writeFileSync(path.join(P, `${n}Dark.dc.html`), dark(n, title, h))
  cv.boards[`${n}.dc.html`] = { x: i * 470, y: 0, w: 390, h, title, page: 'review' }
  cv.boards[`${n}Dark.dc.html`] = { x: i * 470, y: 960 + 240, w: 390, h, title: `${title} · 다크`, page: 'review' }
  for (const k of [`${n}.dc.html`, `${n}Dark.dc.html`]) if (!cv.order.includes(k)) cv.order.push(k)
}
cv.notes.dr_t = { x: 0, y: -300, page: 'review', kind: 'title1', text: '디자인 검토 · 2번(겹침·숫자) · 3번(통일·구분·엄지·달력)', maxW: 2700 }
cv.launch = { view: 'canvas', page: 'review' }
fs.writeFileSync(path.join(P, 'canvas.json'), JSON.stringify(cv, null, 1))
console.log('ok review')
