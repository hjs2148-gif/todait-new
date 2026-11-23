
// ── 넘치는 날 안내(토스식 3화면) + 진도 탭 책갈피 길 (head.mjs 뒤에 이어 붙여 실행) ──
// 그래픽은 정보를 직접 담는다: 하루 = 상자(높이 = 시간), 계획 = 과목색 블록, 넘치면 블록이 상자 밖으로 나온다.
CSS += `.t13{font-size:13px;line-height:18px}.t15{font-size:15px;line-height:22px}
.qq{margin:0;font-size:24px;line-height:33px;font-weight:700;letter-spacing:-0.3px}
.boxw{position:relative;flex:none}
.blk2{position:absolute;left:0;right:0;border-radius:6px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;text-align:left;padding:0 8px;overflow:hidden;box-shadow:inset 0 -1.5px 0 var(--sf)}
.blk2 b{font-size:12px;line-height:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--bg)}
.blk2 span{font-size:12px;line-height:15px;color:color-mix(in srgb, var(--bg) 85%, transparent)}
.cap2{position:absolute;left:-6px;right:-6px;bottom:-6px;border:2px solid var(--ink);border-top-width:3px;border-radius:14px;pointer-events:none}
.ext2{position:absolute;left:-6px;right:-6px;border:2px dashed var(--ink);border-bottom:0;border-radius:14px 14px 0 0;pointer-events:none}
.brk{position:absolute;width:10px;border:2px solid var(--ink);border-left:0;border-radius:0 6px 6px 0}
.brl{position:absolute;white-space:nowrap;font-size:13px;line-height:18px}
.dayl{position:absolute;left:0;right:0;text-align:center;font-size:13px;line-height:18px;font-weight:700}
.olist{display:flex;flex-direction:column}
.oi{display:flex;gap:12px;align-items:center;min-height:64px;padding:10px 0;border:0;background:transparent;font:inherit;color:var(--ink);text-align:left;width:100%;box-shadow:inset 0 -1px 0 var(--hl)}
.oi:last-child{box-shadow:none}
.oi .rad2{width:22px;height:22px;border-radius:11px;box-shadow:inset 0 0 0 2px var(--mu);flex:none}
.oi.on .rad2{box-shadow:inset 0 0 0 7px var(--ink)}
.rec{font-size:12px;line-height:16px;font-weight:700;padding:2px 7px;border-radius:6px;background:var(--chip);margin-left:6px;vertical-align:2px}
.okc{width:64px;height:64px;border-radius:32px;background:var(--ink);color:var(--bg);display:flex;align-items:center;justify-content:center}
.pp{position:relative}
.pp .ax{position:absolute;top:0;bottom:0;width:0}
.pp .flag{border-left:2px solid var(--ink)}
.pp .now{border-left:1.5px dashed var(--mu)}
.prow{position:relative;height:58px}
.prow .nm{position:absolute;left:0;top:6px;font-size:15px;line-height:20px;font-weight:700;white-space:nowrap}
.prow .tr{position:absolute;top:36px;height:8px;border-radius:4px}
.prow .gap{position:absolute;top:34px;height:12px;border-radius:0 6px 6px 0}
.prow .bm{position:absolute;top:26px;width:12px;height:26px;margin-left:-6px;background:var(--rib);clip-path:polygon(0 0,100% 0,100% 100%,50% 78%,0 100%)}
.prow .sl2{position:absolute;top:6px;right:0;font-size:13px;line-height:20px;white-space:nowrap}
.sl2 b{font-size:15px}
.sl2.z b{background:var(--ink);color:var(--bg);border-radius:7px;padding:1px 7px}
`
const S = 0.8 // 1분 = 0.8px
const hmk = (m) => `${m >= 60 ? `${Math.floor(m / 60)}시간` : ''}${m % 60 ? ` ${m % 60}분` : ''}`.trim()
/** 하루 상자: blocks [이름, 과목색, 분], cap 가능 분, ext 늘린 분 */
const dayBox = ({ cap, blocks, ext = 0, w = 132, label = '', ghost = null }) => {
  const total = blocks.reduce((a, b) => a + b[2], 0)
  const top = Math.max(total, cap + ext)
  const H = top * S + 8
  let y = 0
  const bl = blocks.map(([n, c, m, faded]) => {
    const h = m * S
    const el = `<div class="blk2" style="bottom:${y}px;height:${h - 2}px;background:var(--${c});${faded ? 'opacity:.35;' : ''}">${h >= 34 ? `<b>${n}</b><span>${hmk(m)}</span>` : h >= 18 ? `<b>${n}</b>` : ''}</div>`
    y += h
    return el
  }).join('')
  const g = ghost ? `<div class="blk2" style="bottom:${ghost[0] * S}px;height:${ghost[1] * S - 2}px;background:transparent;box-shadow:inset 0 0 0 2px var(--${ghost[2]});border-style:dashed"></div>` : ''
  return `<div class="boxw" style="width:${w}px;height:${H}px">${bl}${g}<div class="cap2" style="height:${cap * S + 9}px"></div>${ext ? `<div class="ext2" style="bottom:${cap * S + 3}px;height:${ext * S}px"></div>` : ''}${label ? `<div class="dayl" style="bottom:-30px">${label}</div>` : ''}</div>`
}
/** 상자 오른쪽 괄호: from~to 분 높이 */
const bracket = (from, to, text, left = 146) => `<div class="brk" style="left:${left}px;bottom:${from * S}px;height:${(to - from) * S}px"></div><div class="brl" style="left:${left + 16}px;bottom:${((from + to) / 2) * S - 9}px">${text}</div>`
const TUE = [['국어 비문학', 'k', 60], ['영어 인강', 'e', 90], ['쎈 수학Ⅱ', 'c', 100], ['정석 미적분', 'm', 60]]
const flowHd = (back) => hd(back ? `<button type="button" class="tb" aria-label="뒤로">${I.back}</button>` : '<span style="width:56px"></span>', '', '<button type="button" class="tb">닫기</button>')

// ── 1. 무슨 일인지 ──
const O1 = page('넘치는 날 · 1 무슨 일인지', 390, 844, `
${flowHd(false)}
<main class="mn" style="padding-top:8px">
<h2 class="qq">12월 1일 화요일,<br>계획이 1시간 10분 많아요</h2>
<p class="t15 mu" style="margin:8px 0 0">상자는 그날 공부할 수 있는 시간이에요.</p>
<div style="position:relative;height:330px;margin:28px 0 0 8px">
<div style="position:absolute;left:0;bottom:30px">${dayBox({ cap: 240, blocks: TUE, label: '화요일' })}
${bracket(0, 240, '<span class="mu">가능</span> <b>4시간</b>')}
${bracket(240, 310, '<b>1시간 10분 넘침</b>')}
</div>
</div>
<p class="t15" style="margin:0">마감이 가까운 계획들이라 다른 날로 자동으로 옮기지 못했어요.</p>
</main>
<div class="ft"><button type="button" class="pri">어떻게 할지 보기</button></div>
`)

// ── 2. 고치기: 고르면 상자가 바로 바뀐다 ──
const opts = (on) => `<div class="olist" role="radiogroup" aria-label="방법">${[
  ['저녁 1시간 30분 더 공부', '이번 주 화요일만', true],
  ['쎈 수학 35분을 일요일로', '일요일은 예비일이에요'],
  ['정석 미적분을 이틀 늦게 끝내기', '12월 11일 끝 · 시험 하루 전'],
].map(([t, s, rec], i) => `<button type="button" role="radio" aria-checked="${i === on}" class="oi${i === on ? ' on' : ''}"><span class="rad2"></span><span style="flex:1;min-width:0"><b style="display:block;font-size:16px;line-height:22px">${t}${rec ? '<span class="rec">추천</span>' : ''}</b><span class="t13 mu">${s}</span></span></button>`).join('')}</div>`
const O2 = page('넘치는 날 · 2 고치기 (추천)', 390, 844, `
${flowHd(true)}
<main class="mn" style="padding-top:8px">
<h2 class="qq">이렇게 하면<br>다 들어가요</h2>
<div style="position:relative;height:338px;margin:20px 0 0 8px">
<div style="position:absolute;left:0;bottom:30px">${dayBox({ cap: 240, ext: 90, blocks: TUE, label: '화요일' })}
${bracket(240, 330, '<b>+1시간 30분</b><br><span class="mu">저녁 11시 30분까지</span>')}
</div>
</div>
${opts(0)}
</main>
<div class="ft"><button type="button" class="pri">이렇게 하기</button></div>
`)
const O2b = page('넘치는 날 · 2 고치기 (다른 방법을 누르면)', 390, 844, `
${flowHd(true)}
<main class="mn" style="padding-top:8px">
<h2 class="qq">쎈 수학 35분을<br>일요일로 옮겨요</h2>
<div style="position:relative;height:292px;margin:20px 0 0 8px;display:flex;gap:40px;align-items:flex-end">
<div style="position:relative;margin-bottom:30px">${dayBox({ cap: 240, w: 120, blocks: [['국어 비문학', 'k', 60], ['영어 인강', 'e', 90], ['쎈 수학Ⅱ', 'c', 65], ['정석 미적분', 'm', 60]], label: '화요일' })}</div>
<div style="position:relative;margin-bottom:30px">${dayBox({ cap: 120, w: 120, blocks: [['쎈 수학Ⅱ', 'c', 35]], label: '일요일 · 예비' })}</div>
<svg width="60" height="40" viewBox="0 0 60 40" aria-hidden="true" style="position:absolute;left:112px;bottom:120px"><path d="M4 30 C 20 4, 40 4, 54 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path><path d="M46 20 L 55 24 L 54 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
</div>
<p class="t15" style="margin:0 0 4px">화요일은 <b>15분 넘침</b>, 일요일은 <b>1시간 25분 남아요</b>.</p>
${opts(1)}
</main>
<div class="ft"><button type="button" class="pri">이렇게 하기</button></div>
`)

// ── 3. 정리됐어요 ──
const O3 = page('넘치는 날 · 3 정리됐어요', 390, 844, `
${hd('<span style="width:56px"></span>', '', '<span style="width:56px"></span>')}
<main class="mn" style="align-items:center;text-align:center;padding-top:40px">
<div class="okc" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></div>
<h2 class="qq" style="margin-top:18px">화요일이 정리됐어요</h2>
<p class="t15 mu" style="margin:8px 0 0">저녁 11시 30분까지 · 이번 주만 바꿨어요.</p>
<div style="position:relative;height:300px;width:132px;margin-top:28px">
<div style="position:absolute;left:0;bottom:30px">${dayBox({ cap: 330, blocks: TUE, label: '화요일' })}</div>
</div>
<p class="t15" style="margin:0">20분 남아요.</p>
</main>
<div class="ft"><button type="button" class="sec">되돌리기</button><button type="button" class="pri">확인</button></div>
`)

// ── 4. 진도 탭: 책갈피 길 (같은 날짜 축 + 시험 깃발) ──
const D = 18 // 11.25(0) ~ 12.13
const px = (d) => `${(d / D) * 100}%`
const EXAM = 17
const PL = [['e', '영어 독해 인강', 16], ['c', '쎈 수학Ⅱ', 15], ['m', '수학의 정석 미적분', 14], ['k', '국어 비문학 독해', 11]]
const PG = page('진도 탭 · 책갈피 길', 390, 844, `
${hd('<span style="padding-left:8px;font-size:20px;font-weight:700">진도</span>', '', '<span></span>')}
<main class="mn">
<section class="cd" style="padding:18px 20px 16px" aria-label="시험까지">
<div class="t13 mu">기말고사까지 17일</div>
<div style="font-size:20px;line-height:28px;font-weight:700;margin-top:2px">영어 인강은 여유가 없어요</div>
<div class="t15 mu">나머지는 시험 전에 끝나요.</div>
<div class="pp" style="margin-top:18px">
<div class="ax now" style="left:0"></div><div class="ax flag" style="left:${px(EXAM)}"></div>
<div style="position:relative;height:20px"><span class="t13 mu" style="position:absolute;left:4px;top:0">오늘</span><span class="t13 bd" style="position:absolute;left:${px(EXAM)};transform:translateX(-100%);padding-right:6px;top:0;white-space:nowrap">시험 12.12</span></div>
${PL.map(([c, n, end]) => {
  const e = end + 1
  const slack = EXAM - e
  return `<div class="prow"><span class="nm" style="left:8px">${n}</span><span class="sl2${slack === 0 ? ' z' : ''}" style="right:${100 - (EXAM / D) * 100}%;padding-right:8px">${slack === 0 ? '<b>여유 없음</b>' : `여유 <b>${slack}일</b>`}</span>
<span class="tr" style="left:0;width:${px(e)};background:var(--${c})"></span>${slack ? `<span class="gap" style="left:${px(e)};width:${px(slack)};background:color-mix(in srgb, var(--${c}) 18%, var(--sf))"></span>` : ''}<span class="bm" style="left:${px(e)}"></span></div>`
}).join('')}
<div style="position:relative;height:20px;margin-top:4px">${[[0, '11.25'], [6, '12.1'], [13, '12.8']].map(([d, l]) => `<span class="t13 mu" style="position:absolute;left:${px(d)};${d ? 'transform:translateX(-50%);' : ''}">${l}</span>`).join('')}</div>
</div>
</section>
<p class="t13 mu" style="margin:4px 4px 0">책갈피 = 이대로 하면 끝나는 날 · 세로선 = 시험 · 그 사이가 여유예요.</p>
</main>
`)

const BOARDS = [
  ['OVWhat', '넘치는 날 1 · 무슨 일인지', O1, 844],
  ['OVFix', '넘치는 날 2 · 고치기 (추천)', O2, 844],
  ['OVFix2', '넘치는 날 2 · 다른 방법을 누르면', O2b, 844],
  ['OVDone', '넘치는 날 3 · 정리됐어요', O3, 844],
  ['PGPath', '진도 탭 · 책갈피 길과 여유', PG, 844],
]
const canvas = JSON.parse(fs.readFileSync(path.join(P, 'canvas.json'), 'utf8'))
if (!canvas.pages.some((p) => p.id === 'guided')) canvas.pages.push({ id: 'guided', name: '안내형 해결 · 그래픽' })
const DARK_Y = 844 + 340
BOARDS.forEach(([n, title, html, h], i) => {
  fs.writeFileSync(path.join(P, `${n}.dc.html`), html)
  fs.writeFileSync(path.join(P, `${n}Dark.dc.html`), dark(n, title, h))
  const x = i * 470
  canvas.boards[`${n}.dc.html`] = { x, y: 0, w: 390, h, title, page: 'guided' }
  canvas.boards[`${n}Dark.dc.html`] = { x, y: DARK_Y, w: 390, h, title: `${title} · 다크`, page: 'guided' }
  for (const k of [`${n}.dc.html`, `${n}Dark.dc.html`]) if (!canvas.order.includes(k)) canvas.order.push(k)
})
const W = BOARDS.length * 470 - 80
canvas.notes.ov_t = { x: 0, y: -300, page: 'guided', kind: 'title1', text: '하루 = 상자, 넘치면 블록이 밖으로 · 고르면 상자가 바로 바뀜', maxW: W }
canvas.notes.ov_d = { x: 0, y: DARK_Y - 260, page: 'guided', kind: 'title1', text: '다크 화면', maxW: W }
canvas.launch = { view: 'canvas', page: 'guided' }
fs.writeFileSync(path.join(P, 'canvas.json'), JSON.stringify(canvas, null, 1))
console.log('ok', BOARDS.map((b) => b[0]).join(' '))
