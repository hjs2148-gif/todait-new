
// ── 남은 것: 넘치는 날 알림 · 해결 방법 · 앞으로 2주 부담과 여유 ○일 (head.mjs 뒤에 이어 붙여 실행) ──
CSS += `.ov{display:flex;align-items:flex-end;gap:6px;height:96px;padding-top:6px}
.ov>span{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px}
.ov .col{position:relative;width:100%;max-width:30px;height:72px;display:flex;flex-direction:column;justify-content:flex-end}
.ov .cap{position:absolute;left:-3px;right:-3px;height:2px;background:var(--ink);border-radius:1px}
.ov .fill{width:100%;border-radius:5px 5px 2px 2px;background:color-mix(in srgb, var(--m) 45%, var(--sf))}
.ov .over{width:100%;border-radius:5px 5px 0 0;background:repeating-linear-gradient(135deg,var(--ink) 0 2px,transparent 2px 5px);box-shadow:inset 0 0 0 1.5px var(--ink)}
.opt2{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border-radius:16px;background:var(--sf);box-shadow:inset 0 0 0 1px var(--hl);text-align:left;border:0;font:inherit;color:var(--ink);width:100%}
.opt2.on{box-shadow:inset 0 0 0 2px var(--ink)}
.rad2{width:22px;height:22px;border-radius:11px;box-shadow:inset 0 0 0 2px var(--mu);flex:none;margin-top:1px}
.opt2.on .rad2{box-shadow:inset 0 0 0 7px var(--ink)}
.mini{display:flex;align-items:center;gap:8px;margin-top:8px}
.mini i{display:block;height:8px;border-radius:4px}
.slack{font-size:12px;line-height:16px;padding:2px 8px;border-radius:8px;background:var(--chip);font-weight:700;flex:none;white-space:nowrap}
.slack.z{background:var(--ink);color:var(--bg)}
.pbar{position:relative;height:8px;border-radius:4px;background:var(--trk);margin-top:8px}
.pbar i{position:absolute;left:0;top:0;bottom:0;border-radius:4px}
.pbar b{position:absolute;top:-4px;width:2px;height:16px;background:var(--rib);border-radius:1px}
`
// 앞으로 7일: [요일, 날짜, 쓰는 분, 가능 분]
const WK7 = [['목', '26', 170, 240], ['금', '27', 200, 240], ['토', '28', 150, 180], ['일', '29', 60, 120], ['월', '30', 220, 240], ['화', '1', 310, 240], ['수', '2', 190, 240]]
const ovChart = (rows, max = 320) => `<div class="ov" aria-hidden="true">${rows.map(([d, n, use, cap], i) => {
  const k = 72 / max
  const over = Math.max(0, use - cap)
  return `<span><span class="col"><i class="cap" style="bottom:${cap * k}px"></i>${over ? `<i class="over" style="height:${over * k}px"></i>` : ''}<i class="fill" style="height:${Math.min(use, cap) * k}px;${over ? 'border-radius:0 0 2px 2px;' : ''}"></i></span><span class="xs ${over ? 'bd' : 'mu'}">${d}</span>${n ? `<span class="xs mu">${n}</span>` : ''}</span>`
}).join('')}</div>`
const todayTop = `${hd('<span style="padding-left:8px;font-size:20px;font-weight:700">11월 25일 수요일</span>', '', '<span style="display:flex;gap:6px;padding-right:8px"><button type="button" class="ch lg">편집</button><button type="button" class="ch lg on" aria-label="새 계획" style="width:36px;padding:0;justify-content:center">' + I.plus + '</button></span>')}`
const dimRows = `<section class="cd" style="opacity:.55" aria-hidden="true">${[['수학의 정석 미적분', '목표 31~40쪽', '58%'], ['쎈 수학Ⅱ', '목표 305~319문항', '0%'], ['영어 독해 인강', '목표 21강', '0%']].map(([a, b, c], i) => `<div class="rw${i === 2 ? ' nl' : ''}" style="min-height:60px"><span class="gr"><b style="display:block">${a}</b><span class="xs mu">${b}</span></span><b>${c}</b></div>`).join('')}</section>`

const R1 = page('오늘 탭 · 넘치는 날 알림', 390, 844, `
${todayTop}
<main class="mn">
<section class="cd pd" aria-label="넘치는 날 알림">
<div class="xs mu">앞으로 7일 · 가능 시간과 비교</div>
<b style="display:block;font-size:17px;line-height:24px;margin-top:2px">화요일에 1시간 10분 넘쳐요</b>
<div class="sm mu" style="margin-top:2px">옮길 수 있는 계획이 모두 마감이 가까워서 자동으로는 못 옮겼어요.</div>
${ovChart(WK7)}
<div class="lgd xs mu" style="margin-top:8px"><span><span class="sq" style="background:color-mix(in srgb, var(--m) 45%, var(--sf))"></span>계획</span><span><span style="display:inline-block;width:12px;height:2px;background:var(--ink)"></span>가능 시간</span><span><span class="sq" style="background:repeating-linear-gradient(135deg,var(--ink) 0 2px,transparent 2px 5px);box-shadow:inset 0 0 0 1px var(--ink)"></span>넘침</span></div>
<div style="display:flex;gap:8px;margin-top:12px"><button type="button" class="ch lg" style="flex:1;justify-content:center">나중에</button><button type="button" class="ch lg on" style="flex:1;justify-content:center">해결하기</button></div>
</section>
${sh('오늘 목표 10개 중 2개 끝')}
${dimRows}
</main>
`)

const opt = (on, title, sub, before, after, note, bad) => `<button type="button" class="opt2${on ? ' on' : ''}"><span class="rad2"></span><span style="flex:1;min-width:0"><b style="display:block;font-size:16px">${title}</b><span class="sm mu" style="display:block;margin-top:2px">${sub}</span>
<span class="mini" aria-hidden="true"><span class="xs mu" style="width:28px">전</span><i style="width:${before * 0.6}%;background:repeating-linear-gradient(135deg,var(--ink) 0 2px,transparent 2px 5px);box-shadow:inset 0 0 0 1px var(--ink)"></i></span>
<span class="mini" aria-hidden="true"><span class="xs mu" style="width:28px">후</span><i style="width:${after * 0.6}%;background:color-mix(in srgb, var(--m) 45%, var(--sf))"></i><span class="xs ${bad ? 'bad bd' : 'bd'}" style="white-space:nowrap;flex:none">${note}</span></span></span></button>`
const R2 = page('해결 방법 고르기', 390, 844, `
${todayTop}
<div style="position:absolute;inset:0;background:var(--scrim)"></div>
<section class="sheet" aria-label="해결 방법" style="top:70px">
<div class="grab"></div>
<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 16px 4px"><b style="font-size:18px">12월 1일 화요일 · 1:10 넘침</b><button type="button" class="tb">닫기</button></div>
<p class="sm mu" style="margin:0 16px 12px">하나를 고르면 바뀌는 모습을 미리 보여 줘요.</p>
<div style="padding:0 16px;display:flex;flex-direction:column;gap:10px">
${opt(true, '그날 공부 시간 늘리기', '화요일 저녁 8~10시 → 8~11시 · 이번 주만', 70, 92, '들어가요')}
${opt(false, '끝나는 날 늦추기', '수학의 정석 미적분 12.9 → 12.11 · 시험 1일 전', 70, 80, '시험 전에 끝나요')}
${opt(false, '이번에만 줄이기', '쎈 수학Ⅱ 화요일 15 → 8문항 · 남은 건 일요일 예비일로', 70, 86, '예비일이 바빠져요')}
</div>
<p class="xs mu" style="margin:12px 16px 0">늦춘 날이 시험 뒤로 넘어가면 그 방법만 빨강으로 알려요.</p>
<div class="ft" style="padding-top:14px"><button type="button" class="pri">이렇게 하기</button></div>
</section>
`)

const WK14 = [['목', '', 170, 240], ['금', '', 200, 240], ['토', '', 150, 180], ['일', '', 60, 120], ['월', '', 220, 240], ['화', '', 310, 240], ['수', '', 190, 240], ['목', '', 210, 240], ['금', '', 180, 240], ['토', '', 140, 180], ['일', '', 40, 120], ['월', '', 230, 240], ['화', '', 200, 240], ['수', '', 160, 240]]
const SLK = [['m', '수학의 정석 미적분', '12.9 끝 · 시험 3일 전', 3, 62, 66], ['e', '영어 독해 인강', '12.11 끝 · 시험 전날', 0, 48, 55], ['c', '쎈 수학Ⅱ', '12.10 끝 · 시험 2일 전', 1, 40, 52], ['k', '국어 비문학 독해', '12.6 끝 · 시험 6일 전', 6, 75, 70]]
const R3 = page('진도 탭 · 앞으로 2주와 여유', 390, 1000, `
${hd('<span style="padding-left:8px;font-size:20px;font-weight:700">진도</span>', '', '<span></span>')}
<main class="mn">
<section class="cd pd" aria-label="앞으로 2주 부담">
<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:16px">앞으로 2주</b><span class="sm mu">하루 평균 2:58 / 3:42</span></div>
${ovChart(WK14)}
<div style="display:flex;justify-content:space-between;margin-top:4px" class="xs mu"><span>이번 주</span><span>다음 주</span></div>
<div class="sm" style="margin-top:10px">넘치는 날 1일 · 화요일 <span class="mu">(자동으로 못 옮김)</span></div>
<div class="xs mu" style="margin-top:2px">가능 시간에 맞춰 옮긴 날 4일 · 눌러서 보기</div>
</section>
${sh('시험까지 여유', '2학기 기말고사 · 12월 12일')}
<section class="cd" aria-label="계획별 여유">
${SLK.map(([c, n, sub, slack, done, plan], i) => `<div class="rw${i === SLK.length - 1 ? ' nl' : ''}" style="min-height:76px;align-items:flex-start;padding-top:12px;padding-bottom:12px;flex-direction:column;gap:0">
<div style="display:flex;align-items:center;gap:8px;width:100%"><span class="dt" style="background:var(--${c})"></span><b class="gr el">${n}</b><span class="slack${slack === 0 ? ' z' : ''}">여유 ${slack}일</span></div>
<div class="xs mu" style="margin:2px 0 0 15px">${sub}</div>
<div class="pbar" style="width:calc(100% - 15px);margin-left:15px" aria-hidden="true"><i style="width:${done}%;background:var(--${c})"></i><b style="left:${plan}%"></b></div>
</div>`).join('')}
</section>
<div class="cd pd sm" style="display:flex;flex-direction:column;gap:6px">
<div><b>여유</b> = 이대로 하면 끝나는 날과 시험 사이에 남는 공부일. %p보다 며칠인지가 더 잘 와닿아요.</div>
<div class="mu">여유 0일은 먹색으로 강조하고, 시험 뒤로 넘어갈 때만 빨강이에요. 막대의 책갈피 선은 오늘까지 했어야 할 위치예요.</div>
</div>
</main>
`)

const BOARDS = [
  ['RMToday', '오늘 탭 · 넘치는 날 알림', R1, 844],
  ['RMFix', '해결 방법 고르기 (시트)', R2, 844],
  ['RMLoad', '진도 탭 · 앞으로 2주와 여유 ○일', R3, 1000],
]
const canvas = JSON.parse(fs.readFileSync(path.join(P, 'canvas.json'), 'utf8'))
if (!canvas.pages.some((p) => p.id === 'remaining')) canvas.pages.push({ id: 'remaining', name: '남은 것 (넘치는 날 · 여유)' })
const DARK_Y = 1000 + 340
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
