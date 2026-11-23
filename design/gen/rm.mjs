
// ── 남은 것: 넘치는 날 알림 · 해결 방법 · 앞으로 2주와 여유 ○일 (head.mjs 뒤에 이어 붙여 실행) ──
// 정렬 원칙: 날짜 칸은 grid 한 곳에서만 위치를 정하고, 막대는 모두 '분' 단위 flex 비율로 그린다 (따로 그린 선 없음).
CSS += `.t13{font-size:13px;line-height:18px}.t15{font-size:15px;line-height:22px}
.big20{font-size:22px;line-height:30px;font-weight:700;letter-spacing:-0.2px}
.dg{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
.dg .wk{text-align:center;font-size:12px;line-height:16px;color:var(--mu)}
.dc{height:58px;border-radius:10px;padding:5px 0 6px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;position:relative;min-width:0}
.dc .d{font-size:12px;line-height:14px;color:var(--mu)}
.dc .v{font-size:14px;line-height:16px;font-weight:700}
.dc .u{font-size:12px;line-height:14px;color:color-mix(in srgb, var(--ink) 72%, transparent)}
.dc.past{opacity:.4}
.dc.now{box-shadow:inset 0 0 0 2px var(--ink)}
.dc.now .d{color:var(--ink);font-weight:700}
.dc.ov{background:var(--ink)!important}
.dc.ov .d,.dc.ov .v,.dc.ov .u{color:var(--bg)}
.dc .mv{position:absolute;top:0;right:3px;width:5px;height:11px;background:var(--rib);clip-path:polygon(0 0,100% 0,100% 100%,50% 75%,0 100%)}
.hb{display:flex;height:16px;border-radius:5px;overflow:hidden}
.hb i{display:block;height:100%}
.hb .f{background:color-mix(in srgb, var(--m) 50%, var(--sf))}
.hb .fr{background:var(--trk)}
.hb .o{background:repeating-linear-gradient(135deg,var(--ink) 0 2px,transparent 2px 6px);box-shadow:inset 0 0 0 1.5px var(--ink)}
.hl{display:flex;margin-top:6px;font-size:13px;line-height:18px}
.hl span{min-width:0;white-space:nowrap}
.opt2{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border-radius:16px;background:var(--sf);box-shadow:inset 0 0 0 1px var(--hl);text-align:left;border:0;font:inherit;color:var(--ink);width:100%}
.opt2.on{box-shadow:inset 0 0 0 2px var(--ink)}
.rad2{width:22px;height:22px;border-radius:11px;box-shadow:inset 0 0 0 2px var(--mu);flex:none;margin-top:1px}
.opt2.on .rad2{box-shadow:inset 0 0 0 7px var(--ink)}
.slack{font-size:13px;line-height:18px;padding:3px 9px;border-radius:9px;background:var(--chip);font-weight:700;flex:none;white-space:nowrap}
.slack.z{background:var(--ink);color:var(--bg)}
.pbar{position:relative;height:8px;border-radius:4px;background:var(--trk)}
.pbar i{position:absolute;left:0;top:0;bottom:0;border-radius:4px}
.pbar b{position:absolute;top:-4px;width:3px;height:16px;margin-left:-1.5px;background:var(--rib);border-radius:1.5px}
`
const hm2 = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
const tint = (use, cap) => `color-mix(in srgb, var(--m) ${Math.round(8 + Math.min(1, use / cap) * 30)}%, var(--sf))`
/** 날짜 칸 하나: [날짜 글, 쓰는 분, 가능 분, 표시] 표시: past · now · mv(옮김) */
const dcell = ([d, use, cap, flag = '']) => {
  if (flag.includes('past')) return `<span class="dc past" style="box-shadow:inset 0 0 0 1px var(--hl)"><span class="d">${d}</span><span class="u">·</span></span>`
  const over = use > cap
  const cls = ['dc', over ? 'ov' : '', flag.includes('now') ? 'now' : ''].join(' ')
  return `<span class="${cls}" style="background:${tint(use, cap)}">${flag.includes('mv') ? '<i class="mv" aria-label="옮김"></i>' : ''}<span class="d">${d}</span><span class="v">${hm2(Math.abs(cap - use))}</span><span class="u">${over ? '넘침' : '남음'}</span></span>`
}
const DOWS = ['월', '화', '수', '목', '금', '토', '일']
/** 가능 시간 대비 막대: 모두 분 단위 flex라 경계가 어긋나지 않는다 */
const hbar2 = (use, cap, scale) => {
  const f = Math.min(use, cap)
  const free = Math.max(0, cap - use)
  const o = Math.max(0, use - cap)
  const empty = Math.max(0, scale - Math.max(use, cap))
  return `<div class="hb" aria-hidden="true"><i class="f" style="flex:${f}"></i>${free ? `<i class="fr" style="flex:${free}"></i>` : ''}${o ? `<i class="o" style="flex:${o}"></i>` : ''}${empty ? `<i style="flex:${empty}"></i>` : ''}</div>`
}
const todayTop = `${hd('<span style="padding-left:8px;font-size:20px;font-weight:700">11월 25일 수요일</span>', '', '<span style="display:flex;gap:6px;padding-right:8px"><button type="button" class="ch lg">편집</button><button type="button" class="ch lg on" aria-label="새 계획" style="width:36px;padding:0;justify-content:center">' + I.plus + '</button></span>')}`
const dimRows = `<section class="cd" style="opacity:.55" aria-hidden="true">${[['수학의 정석 미적분', '목표 31~40쪽', '58%'], ['쎈 수학Ⅱ', '목표 305~319문항', '0%'], ['영어 독해 인강', '목표 21강', '0%']].map(([a, b, c], i) => `<div class="rw${i === 2 ? ' nl' : ''}" style="min-height:60px"><span class="gr"><b style="display:block">${a}</b><span class="t13 mu">${b}</span></span><b>${c}</b></div>`).join('')}</section>`

// ── 1. 오늘 탭 카드 ──
const NEXT7 = [['26', 190, 240], ['27', 200, 240], ['28', 150, 180], ['29', 60, 120], ['30', 220, 240, 'mv'], ['1', 310, 240], ['2', 190, 240, 'mv']]
const NEXT7D = ['목', '금', '토', '일', '월', '화', '수']
const R1 = page('오늘 탭 · 넘치는 날 알림', 390, 844, `
${todayTop}
<main class="mn">
<section class="cd pd" aria-label="넘치는 날 알림" style="display:flex;flex-direction:column;gap:12px">
<div><div class="t13 mu">12월 1일 화요일</div><div class="big20">1시간 10분 넘쳐요</div></div>
<div>
${hbar2(310, 240, 310)}
<div class="hl"><span style="flex:240">가능 시간 <b>4:00</b></span><span style="flex:70;text-align:right"><b>+1:10</b></span></div>
<div class="t13 mu" style="margin-top:2px">이날 계획 5:10</div>
</div>
<div class="t15">마감이 가까운 계획들이라 자동으로 못 옮겼어요.</div>
<div>
<div class="t13 mu" style="margin-bottom:6px">앞으로 7일 · 남는 시간</div>
<div class="dg" style="margin-bottom:4px">${NEXT7D.map((d) => `<span class="wk">${d}</span>`).join('')}</div>
<div class="dg">${NEXT7.map(dcell).join('')}</div>
</div>
<div style="display:flex;gap:8px"><button type="button" class="ch lg" style="flex:1;justify-content:center;height:44px;font-size:15px">나중에</button><button type="button" class="ch lg on" style="flex:1;justify-content:center;height:44px;font-size:15px">해결하기</button></div>
</section>
${sh('오늘 목표 10개 중 2개 끝')}
${dimRows}
</main>
`)

// ── 2. 해결 방법 (세 방법을 같은 눈금으로) ──
const SCALE = 330
const opt = (on, title, desc, use, cap, result) => `<button type="button" class="opt2${on ? ' on' : ''}"><span class="rad2"></span><span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px">
<span><b style="display:block;font-size:16px;line-height:22px">${title}</b><span class="t15 mu" style="display:block">${desc}</span></span>
${hbar2(use, cap, SCALE)}
<span class="t15"><b>${result}</b> <span class="mu">· 계획 ${hm2(use)} / 가능 ${hm2(cap)}</span></span></span></button>`
const R2 = page('해결 방법 고르기', 390, 844, `
${todayTop}
<div style="position:absolute;inset:0;background:var(--scrim)"></div>
<section class="sheet" aria-label="해결 방법" style="top:60px">
<div class="grab"></div>
<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:4px 8px 12px 16px"><div><div class="t13 mu">12월 1일 화요일</div><b style="font-size:20px;line-height:28px">1시간 10분 넘침, 어떻게 할까요?</b></div><button type="button" class="tb">닫기</button></div>
<div style="padding:0 16px;display:flex;flex-direction:column;gap:10px">
${opt(true, '그날 공부 시간 늘리기', '저녁 10시 → 11시 30분까지 · 이번 주만', 310, 330, '들어가요')}
${opt(false, '끝나는 날 늦추기', '정석 미적분 12.9 → 12.11 · 시험 1일 전', 240, 240, '딱 맞아요')}
${opt(false, '이번에만 줄이기', '쎈 수학Ⅱ 15 → 8문항 · 남은 건 일요일로', 235, 240, '들어가요')}
</div>
<div class="lgd t13 mu" style="margin:12px 16px 0"><span><span class="sq" style="background:color-mix(in srgb, var(--m) 50%, var(--sf))"></span>계획</span><span><span class="sq" style="background:var(--trk)"></span>남는 시간</span><span><span class="sq" style="background:repeating-linear-gradient(135deg,var(--ink) 0 2px,transparent 2px 6px);box-shadow:inset 0 0 0 1px var(--ink)"></span>넘침</span></div>
<div class="ft" style="padding-top:14px"><button type="button" class="pri">이렇게 하기</button></div>
</section>
`)

// ── 3. 진도 탭: 앞으로 2주 (월요일 시작 달력) + 여유 ○일 ──
const W1 = [['23', 0, 240, 'past'], ['24', 0, 240, 'past'], ['오늘', 170, 240, 'now'], ['26', 190, 240], ['27', 200, 240], ['28', 150, 180], ['29', 60, 120]]
const W2 = [['30', 220, 240, 'mv'], ['1', 310, 240], ['2', 190, 240, 'mv'], ['3', 210, 240], ['4', 160, 240, 'mv'], ['5', 140, 180, 'mv'], ['6', 40, 120]]
const SLK = [['m', '수학의 정석 미적분', '12.9 끝 · 시험 3일 전', 3, 62, 66], ['e', '영어 독해 인강', '12.11 끝 · 시험 전날', 0, 48, 55], ['c', '쎈 수학Ⅱ', '12.10 끝 · 시험 2일 전', 1, 40, 52], ['k', '국어 비문학 독해', '12.6 끝 · 시험 6일 전', 6, 75, 70]]
const R3 = page('진도 탭 · 앞으로 2주와 여유', 390, 1060, `
${hd('<span style="padding-left:8px;font-size:20px;font-weight:700">진도</span>', '', '<span></span>')}
<main class="mn">
<section class="cd pd" aria-label="앞으로 2주" style="display:flex;flex-direction:column;gap:12px">
<div><div class="t13 mu">앞으로 2주 · 가능 시간과 비교</div><div class="big20">넘치는 날 1일</div><div class="t15 mu">가능 시간에 맞춰 옮긴 날 4일</div></div>
<div class="dg">${DOWS.map((d) => `<span class="wk">${d}</span>`).join('')}</div>
<div><div class="t13 mu" style="margin-bottom:4px">이번 주</div><div class="dg">${W1.map(dcell).join('')}</div></div>
<div><div class="t13 mu" style="margin-bottom:4px">다음 주</div><div class="dg">${W2.map(dcell).join('')}</div></div>
<div class="lgd t13 mu"><span><span class="sq" style="background:var(--ink)"></span>넘침</span><span><span style="display:inline-block;width:6px;height:12px;background:var(--rib);clip-path:polygon(0 0,100% 0,100% 100%,50% 75%,0 100%)"></span>옮긴 날</span><span>진할수록 꽉 찬 날</span></div>
</section>
${sh('시험까지 여유', '기말고사 12.12')}
<section class="cd" aria-label="계획별 여유">
${SLK.map(([c, n, sub, slack, done, plan], i) => `<div style="padding:14px 16px;${i < SLK.length - 1 ? 'box-shadow:inset 0 -1px 0 var(--hl);' : ''}display:flex;flex-direction:column;gap:8px">
<div style="display:flex;align-items:center;gap:8px"><span class="dt" style="width:8px;height:8px;border-radius:4px;background:var(--${c})"></span><b class="gr el" style="font-size:16px">${n}</b><span class="slack${slack === 0 ? ' z' : ''}">여유 ${slack}일</span></div>
<div style="padding-left:16px;display:flex;flex-direction:column;gap:8px"><span class="t13 mu">${sub}</span><div class="pbar" aria-hidden="true"><i style="width:${done}%;background:var(--${c})"></i><b style="left:${plan}%"></b></div></div>
</div>`).join('')}
</section>
<div class="cd pd" style="display:flex;flex-direction:column;gap:4px">
<div class="t15"><b>여유</b>는 이대로 끝나는 날부터 시험까지 남는 공부일이에요.</div>
<div class="t13 mu">책갈피 선 = 오늘까지 했어야 할 곳 · 여유 0일은 먹색, 시험 뒤로 넘어가면 빨강</div>
</div>
</main>
`)

const BOARDS = [
  ['RMToday', '오늘 탭 · 넘치는 날 알림', R1, 844],
  ['RMFix', '해결 방법 고르기 (시트)', R2, 844],
  ['RMLoad', '진도 탭 · 앞으로 2주와 여유 ○일', R3, 1060],
]
const canvas = JSON.parse(fs.readFileSync(path.join(P, 'canvas.json'), 'utf8'))
if (!canvas.pages.some((p) => p.id === 'remaining')) canvas.pages.push({ id: 'remaining', name: '남은 것 (넘치는 날 · 여유)' })
const DARK_Y = 1060 + 340
BOARDS.forEach(([n, title, html, h], i) => {
  fs.writeFileSync(path.join(P, `${n}.dc.html`), html)
  fs.writeFileSync(path.join(P, `${n}Dark.dc.html`), dark(n, title, h))
  const x = i * 470
  canvas.boards[`${n}.dc.html`] = { x, y: 0, w: 390, h, title, page: 'remaining' }
  canvas.boards[`${n}Dark.dc.html`] = { x, y: DARK_Y, w: 390, h, title: `${title} · 다크`, page: 'remaining' }
  for (const k of [`${n}.dc.html`, `${n}Dark.dc.html`]) if (!canvas.order.includes(k)) canvas.order.push(k)
})
const W = BOARDS.length * 470 - 80
canvas.notes.rm_t = { x: 0, y: -300, page: 'remaining', kind: 'title1', text: '넘치는 날 알림 · 해결 방법 · 여유 ○일', maxW: W }
canvas.notes.rm_d = { x: 0, y: DARK_Y - 260, page: 'remaining', kind: 'title1', text: '다크 화면', maxW: W }
canvas.notes.rm_s = { x: W + 80, y: 0, page: 'remaining', w: 360, text: "'필요할 때 제안' 4가지(첫 주 속도 · 단원 다음 날 이해도 · 요일별 기록으로 가능 시간 · 정답률로 복습)는 '새 계획 개편' 페이지의 '필요할 때 제안' 보드에 있어요. 회독 제안은 이미 앱에 들어갔어요." }
canvas.launch = { view: 'canvas', page: 'remaining' }
fs.writeFileSync(path.join(P, 'canvas.json'), JSON.stringify(canvas, null, 1))
console.log('ok', BOARDS.map((b) => b[0]).join(' '))
