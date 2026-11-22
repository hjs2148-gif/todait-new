// 새 계획 개편 보드 생성기. node np.mjs <root>
import fs from 'node:fs'
import path from 'node:path'
const ROOT = process.argv[2]
const P = path.join(ROOT, 'project')

const PAL = `{ light: { bg: '#f3f0ea', sf: '#fffdf9', chip: '#e8e3da', segon: '#ffffff', ink: '#1f1c18', mu: '#655f56', hl: '#ebe6dd', trk: '#ece7de', pg: '#f3efe7', cur: '#f6f1e6', m: '#4a67ad', k: '#3d8762', e: '#8d5aa0', c: '#2c7f8c', g: '#6d675e', p: '#a24d76', o: '#6e7a2c', b: '#8a5d3b', rib: '#b0750f', ribt: '#f4e7cf', bad: '#b03a2a', shd: 'rgba(60,45,20,0.07)', scrim: 'rgba(31,28,24,0.45)' }, dark: { bg: '#121110', sf: '#1d1b18', chip: '#2a2723', segon: '#4a4640', ink: '#f2eee7', mu: '#a69f94', hl: '#2c2925', trk: '#322e29', pg: '#272420', cur: '#25221e', m: '#8ea6ea', k: '#85c2a0', e: '#c79ad8', c: '#6cc4cf', g: '#b3ab9f', p: '#e391b8', o: '#bcc777', b: '#d6a682', rib: '#e2ac48', ribt: '#3a2f1c', bad: '#ff8a75', shd: 'rgba(0,0,0,0.4)', scrim: 'rgba(0,0,0,0.6)' } }`

const CSS = `body{margin:0}
.R{position:relative;width:390px;box-sizing:border-box;display:flex;flex-direction:column;overflow:hidden;background:var(--bg);color:var(--ink);font-family:'Pretendard Variable',Pretendard,'Noto Sans KR',sans-serif;font-size:15px;line-height:22px;font-variant-numeric:tabular-nums}
.R *{box-sizing:border-box}
.hd{height:52px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 8px;position:relative}
.hd h1{position:absolute;left:50%;transform:translateX(-50%);margin:0;font-size:17px;line-height:24px;font-weight:700;white-space:nowrap}
.tb{height:40px;padding:0 10px;border:0;background:transparent;color:var(--ink);font:inherit;font-size:16px;display:inline-flex;align-items:center;gap:2px}
.tb.b{font-weight:700}
.mn{padding:0 16px 8px;display:flex;flex-direction:column;gap:10px}
.sh{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:12px 4px 0}
.sh h2{margin:0;font-size:17px;line-height:24px;font-weight:700}
.mu{color:var(--mu)}.sm{font-size:13px;line-height:18px}.xs{font-size:12px;line-height:16px}.bd{font-weight:700}
.cd{background:var(--sf);border-radius:20px;box-shadow:0 1px 2px var(--shd);overflow:hidden}
.pd{padding:14px 16px}
.rw{display:flex;align-items:center;gap:12px;min-height:52px;padding:0 16px;box-shadow:inset 0 -1px 0 var(--hl)}
.rw.nl{box-shadow:none}
.lb{width:52px;flex:none;color:var(--mu);font-size:14px}
.gr{flex:1;min-width:0}
.el{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ch{height:30px;padding:0 10px;border-radius:15px;border:0;flex:none;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;font:inherit;font-size:13px;background:var(--chip);color:var(--ink)}
.ch.on{background:var(--ink);color:var(--bg);font-weight:700}
.ch.add{background:transparent;box-shadow:inset 0 0 0 1.5px var(--mu);color:var(--ink)}
.ch.lg{height:36px;padding:0 12px;font-size:14px;font-weight:500}
.dt{display:inline-block;width:7px;height:7px;border-radius:4px;flex:none}
.seg{display:flex;gap:2px;padding:2px;border-radius:10px;background:var(--chip)}
.seg button{flex:1;height:32px;border:0;border-radius:8px;background:transparent;color:var(--ink);font:inherit;font-size:14px;font-weight:500;padding:0}
.seg button.on{background:var(--segon);box-shadow:0 1px 2px rgba(0,0,0,.12);font-weight:700}
.seg.mini button{height:26px;font-size:12px;padding:0 8px;flex:none;white-space:nowrap}
.pri{height:54px;border:0;border-radius:16px;background:var(--ink);color:var(--bg);font:inherit;font-size:17px;font-weight:700;flex:1}
.sec{height:54px;border:0;border-radius:16px;background:var(--chip);color:var(--ink);font:inherit;font-size:16px;font-weight:600;flex:none;padding:0 22px}
.ft{flex:none;margin-top:auto;padding:12px 16px 24px;display:flex;gap:8px}
.sw{width:46px;height:28px;border-radius:14px;background:var(--trk);position:relative;flex:none;border:0;padding:0}
.sw.on{background:var(--ink)}
.sw i{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:11px;background:var(--sf);box-shadow:0 1px 2px rgba(0,0,0,.2)}
.sw.on i{left:21px}
.st{display:inline-flex;align-items:center;gap:0;border-radius:12px;background:var(--chip);flex:none}
.st button{width:36px;height:34px;border:0;background:transparent;color:var(--ink);font:inherit;font-size:18px;padding:0}
.st b{min-width:44px;text-align:center;font-size:15px}
.bad{color:var(--bad)}.rib{color:var(--rib)}
.days{display:flex;gap:6px;flex:1;min-width:0}
.dy{flex:1 1 0;min-width:0;max-width:34px;height:34px;border-radius:17px;display:flex;align-items:center;justify-content:center;font-size:13px;border:0;font:inherit;font-size:13px;padding:0}
.dy.on{background:var(--ink);color:var(--bg);font-weight:700}
.dy.sp{background:var(--ribt);color:var(--rib);font-weight:700;box-shadow:inset 0 0 0 1.5px var(--rib)}
.dy.off{background:transparent;color:var(--mu);box-shadow:inset 0 0 0 1px var(--hl)}
.lgd{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.lgd span{display:inline-flex;align-items:center;gap:5px}
.sq{display:inline-block;width:10px;height:10px;border-radius:3px;flex:none}
.hatch{background:repeating-linear-gradient(135deg,var(--trk) 0 3px,transparent 3px 6px);box-shadow:inset 0 0 0 1px var(--trk)}
.sheet{position:absolute;left:0;right:0;bottom:0;background:var(--sf);border-radius:24px 24px 0 0;display:flex;flex-direction:column}
.grab{width:36px;height:5px;border-radius:3px;background:var(--hl);margin:8px auto 4px}
.inp{height:44px;border-radius:12px;background:var(--pg);display:flex;align-items:center;padding:0 12px;font-size:15px}
.pg{min-width:52px;height:32px;border-radius:9px;background:var(--pg);display:inline-flex;align-items:center;justify-content:flex-end;padding:0 8px;font-size:14px;flex:none;gap:2px}
.wt{display:inline-flex;align-items:flex-end;gap:2px;height:12px;flex:none}
.wt i{display:block;width:4px;border-radius:1px;background:var(--trk)}
.wt i.f{background:var(--ink)}
`

const I = {
  chev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M9.5 6l6 6-6 6"></path></svg>',
  down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M6 9.5l6 6 6-6"></path></svg>',
  back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M14.5 6l-6 6 6 6"></path></svg>',
  plus: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" style="flex:none"><path d="M12 5v14M5 12h14"></path></svg>',
  grip: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="flex:none"><circle cx="9" cy="6" r="1.6"></circle><circle cx="15" cy="6" r="1.6"></circle><circle cx="9" cy="12" r="1.6"></circle><circle cx="15" cy="12" r="1.6"></circle><circle cx="9" cy="18" r="1.6"></circle><circle cx="15" cy="18" r="1.6"></circle></svg>',
  paste: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><rect x="6" y="4.5" width="12" height="16" rx="2.5"></rect><path d="M9.5 3.5h5v3h-5zM9 11h6M9 14.5h6"></path></svg>',
  outdent: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M20 6H10M20 12H13M20 18H10M7 9l-3 3 3 3"></path></svg>',
  indent: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M20 6H10M20 12H13M20 18H10M4 9l3 3-3 3"></path></svg>',
  trash: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"></path></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>',
}

const page = (title, w, h, body) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&amp;display=swap">
<style>
${CSS}</style>
</helmet>
<div class="R" style="{{vars}} height: ${h}px;">
${body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"dark":{"editor":"boolean","default":false},"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic {
  renderVals() {
    const P = ${PAL};
    const p = this.props.dark ? P.dark : P.light;
    return { vars: Object.keys(p).map((k) => '--' + k + ':' + p[k] + ';').join(' ') };
  }
}
</script>
</body>
</html>
`
const dark = (name, title, h) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${title} · 다크</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&amp;display=swap">
<style>
body{margin:0}
</style>
</helmet>
<dc-import name="${name}" dark="{{yes}}" hint-size="390px,${h}px"></dc-import>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":${h}}}'>
class Component extends DCLogic {
  renderVals() { return { yes: true }; }
}
</script>
</body>
</html>
`

// ── 공통 조각 ──
const hm = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
const hd = (left, title, right) => `<header class="hd">${left}<h1>${title}</h1>${right}</header>`
const sh = (t, r = '') => `<div class="sh"><h2>${t}</h2><span class="sm mu">${r}</span></div>`
const dayBtns = (states) => {
  const L = ['월', '화', '수', '목', '금', '토', '일']
  return `<span class="days">${states.map((s, i) => `<button type="button" class="dy ${s}" aria-label="${L[i]}요일 ${s === 'on' ? '공부' : s === 'sp' ? '예비' : '쉼'}">${L[i]}</button>`).join('')}</span>`
}
const wt = (n) => `<span class="wt" aria-label="${['쉬움', '보통', '어려움'][n - 1]}"><i class="f" style="height:5px"></i><i class="${n >= 2 ? 'f' : ''}" style="height:8px"></i><i class="${n >= 3 ? 'f' : ''}" style="height:12px"></i></span>`
const subj = (on) => {
  const S = [['수학', 'm'], ['영어', 'e'], ['물리학Ⅰ', 'c']]
  return `<span style="display:flex;flex-wrap:wrap;gap:6px;padding:10px 0">${S.map(([n, c]) => `<span class="ch${n === on ? ' on' : ''}"><span class="dt" style="background:var(--${c})"></span>${n}</span>`).join('')}<button type="button" class="ch add">${I.plus}과목</button></span>`
}

// 미리보기 달력 막대: 11/24(화) ~ 12/12(토)
const CAL = [
  ['24', 11], ['25', 15], ['26', 11], ['27', 13], ['28', 26], ['29', 'sp'], ['30', 15], ['1', 11], ['2', 15], ['3', 11], ['4', 16], ['5', 32], ['6', 'sp'], ['7', 16], ['8', 11], ['9', 16], ['10', 13], ['11', 'bf'], ['12', 'bf'],
]
const hard = new Set(['27', '28'])
const calStrip = () => {
  const bars = CAL.map(([d, v]) => {
    if (v === 'sp') return `<span style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:68px"><span style="height:14px;border-radius:3px;background:var(--ribt);box-shadow:inset 0 0 0 1.5px var(--rib)"></span></span>`
    if (v === 'bf') return `<span style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:68px"><span class="hatch" style="height:14px;border-radius:3px"></span></span>`
    return `<span style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:stretch;height:68px"><span class="xs mu" style="text-align:center;font-size:12px;line-height:14px">${v >= 26 ? v : ''}</span><span style="height:${Math.round(v * 1.6)}px;border-radius:3px;background:var(--m);${hard.has(d) ? 'opacity:.6;' : ''}"></span></span>`
  }).join('')
  const labels = CAL.map(([d], i) => `<span style="flex:1;text-align:center;white-space:nowrap">${[0, 7, 14].includes(i) ? (i === 0 ? '11.24' : i === 7 ? '12.1' : '12.8') : ''}</span>`).join('')
  return `<div aria-hidden="true" style="display:flex;gap:2px;align-items:flex-end">${bars}</div>
<div class="xs mu" style="display:flex;gap:2px;margin-top:6px">${labels}</div>`
}

// ── 1. 새 계획 기본 ──
const kindTiles = `<div role="radiogroup" aria-label="계획 종류" style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px">
${[['책', true], ['인강'], ['시간'], ['습관'], ['할 일']].map(([n, on]) => `<button type="button" role="radio" aria-checked="${!!on}" style="height:44px;border:0;border-radius:14px;background:var(--sf);${on ? 'box-shadow:inset 0 0 0 2px var(--ink);font-weight:700;' : 'box-shadow:0 1px 2px var(--shd);'}color:var(--ink);font:inherit;font-size:14px;${on ? 'font-weight:700;' : ''}">${n}</button>`).join('')}
</div>`

const tocTop = [
  ['1', '수열의 극한', '1~28쪽', 3, 2], ['2', '급수', '29~52쪽', 4, 3], ['3', '지수·로그함수의 미분', '53~80쪽', 3, 2], ['4', '삼각함수의 미분', '81~110쪽', 4, 3],
]
const modeSeg = (on) => `<div class="seg" role="tablist" aria-label="계획 짜는 방식"><button type="button" role="tab" aria-selected="${on === 'quick'}" class="${on === 'quick' ? 'on' : ''}">간단하게</button><button type="button" role="tab" aria-selected="${on === 'detail'}" class="${on === 'detail' ? 'on' : ''}">자세히</button></div>`
const NP1 = page('새 계획 · 자세히', 390, 1612, `
${hd('<button type="button" class="tb">취소</button>', '새 계획', '<span style="width:56px"></span>')}
<main class="mn">
${modeSeg('detail')}
${kindTiles}
<div class="seg" role="tablist" aria-label="책 나누는 방식"><button type="button" class="on">목차 (쪽)</button><button type="button">문제집 (문항)</button><button type="button">분량만</button></div>
${sh('책 정보')}
<section class="cd" aria-label="기본 정보">
<div class="rw"><span class="lb">이름</span><span class="gr bd">수학의 정석 미적분</span></div>
<div class="rw"><span class="lb">과목</span><span class="gr">${subj('수학')}</span></div>
<div class="rw nl"><span class="lb">시험</span><span class="gr">2학기 기말고사 · 12월 15일</span><span class="mu">${I.chev}</span></div>
</section>
${sh('목차', '8단원 · 소단원 23 · 232쪽')}
<section class="cd" aria-label="목차">
${tocTop.map(([n, t, r, k, w]) => `<div class="rw" style="min-height:50px;gap:10px"><span class="sm mu" style="width:16px">${n}</span><span class="gr el">${t}</span><span class="xs mu" style="flex:none">소단원 ${k}</span>${wt(w)}<span class="sm mu" style="flex:none;min-width:62px;text-align:right">${r}</span></div>`).join('')}
<div class="rw nl" style="justify-content:space-between"><span class="sm mu">5~8단원 · 4개 더</span><span style="display:flex;gap:6px"><button type="button" class="ch lg">${I.paste}붙여넣기</button><button type="button" class="ch lg">목차 편집${I.chev}</button></span></div>
</section>
<p class="xs mu" style="margin:0 4px;display:flex;align-items:center;gap:6px">${wt(3)}<span>막대가 단원 무게예요. 어려운 단원엔 날을 더 줘요.</span></p>
${sh('언제 공부하나요')}
<section class="cd" aria-label="기간과 요일">
<div class="rw"><span class="lb">기간</span><span class="gr">11월 24일 ~ 12월 12일</span><span class="sm mu">19일</span></div>
<div class="rw" style="flex-direction:column;align-items:stretch;gap:10px;padding:12px 16px">
<div style="display:flex;align-items:center;gap:12px"><span class="lb">요일</span>${dayBtns(['on', 'on', 'on', 'on', 'on', 'on', 'sp'])}</div>
<div class="lgd xs mu" style="padding-left:64px"><span><span class="sq" style="background:var(--ink)"></span>공부</span><span><span class="sq" style="background:var(--ribt);box-shadow:inset 0 0 0 1.5px var(--rib)"></span>예비</span><span><span class="sq" style="box-shadow:inset 0 0 0 1px var(--mu)"></span>쉼</span><span>누를 때마다 바뀌어요</span></div>
</div>
<div class="rw"><span class="lb">끝 여유</span><span class="gr sm mu">마지막 며칠은 비워 둬요</span><span class="st"><button type="button" aria-label="줄이기">−</button><b>2일</b><button type="button" aria-label="늘리기">+</button></span></div>
<div class="rw nl"><span class="lb">자세히</span><span class="gr sm el">무게·가능 시간 · 1회독 · 최소 5쪽</span><span class="mu">${I.chev}</span></div>
</section>
<section class="cd pd" aria-label="미리보기">
<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:16px">미리보기</b><span class="sm mu">공부 15일 · 예비 2일 · 여유 2일</span></div>
<div style="display:flex;align-items:baseline;gap:6px;margin:4px 0 2px"><span style="font-size:28px;line-height:34px;font-weight:700">15<span style="font-size:15px;font-weight:500;color:var(--mu)">쪽 / 일 평균</span></span></div>
<div class="sm mu" style="margin-bottom:12px">평일 11~16쪽 · 토요일 26~32쪽 · 급수 단원은 천천히</div>
${calStrip()}
<div class="lgd xs mu" style="margin-top:10px"><span><span class="sq" style="background:var(--m)"></span>하루 쪽 수</span><span><span class="sq" style="background:var(--ribt);box-shadow:inset 0 0 0 1.5px var(--rib)"></span>예비일 · 밀린 것, 없으면 복습</span><span><span class="sq hatch"></span>끝 여유</span></div>
<div style="margin-top:12px;font-size:14px"><b>12월 10일</b> 끝 · 여유 2일 · 시험 5일 전</div>
<div style="height:1px;background:var(--hl);margin:14px 0 12px"></div>
<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:14px">다른 계획에 생기는 변화</b><span class="xs mu">가능 시간에 맞춰 옮겨요</span></div>
<div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
<div style="display:flex;gap:10px;align-items:flex-start"><span class="dt" style="background:var(--m);margin-top:7px"></span><span class="gr"><span style="display:flex;justify-content:space-between;gap:8px"><span class="el">쎈 수학Ⅱ</span><span class="sm" style="flex:none">토 12.5 <b>30 → 22문항</b></span></span><span class="xs mu">남은 8문항은 12월 6일 예비일로</span></span></div>
<div style="display:flex;gap:10px;align-items:flex-start"><span class="dt" style="background:var(--e);margin-top:7px"></span><span class="gr"><span style="display:flex;justify-content:space-between;gap:8px"><span class="el">영어 독해 인강</span><span class="sm" style="flex:none">끝나는 날 <b>12.8 → 12.9</b></span></span><span class="xs mu">시험 6일 전 · 마감이 멀어서 이 계획이 양보해요</span></span></div>
</div>
</section>
</main>
<div class="ft"><button type="button" class="pri">계획 만들기</button></div>
`)

// ── 2. 목차 편집 ──
const tree = [
  [0, '1', '수열의 극한', null, '1~28', 2],
  [1, '1-1', '수열의 수렴과 발산', 1],
  [1, '1-2', '수열의 극한값 계산', 12],
  [1, '1-3', '등비수열의 극한', 21],
  [0, '2', '급수', null, '29~52', 3],
  [1, '2-1', '급수의 수렴과 발산', 29],
  [1, '2-2', '등비급수', null, '38~52', 0, true],
  [2, '', '예제·유제', 38],
  [2, '', '연습문제', 46],
  [0, '3', '지수·로그함수의 미분', null, '53~80', 2],
  [1, '3-1', '지수함수와 로그함수의 극한', 53],
  [1, '3-2', '지수·로그함수의 도함수', 66],
  [0, '4', '삼각함수의 미분', null, '81~110', 3, false, true],
]
const treeRows = tree.map(([d, n, t, pg, range, w, sel, closed]) => {
  const parent = pg === null
  const bg = sel ? 'background:var(--cur);' : ''
  return `<div class="rw" style="${bg}min-height:${d === 0 ? 52 : 46}px;gap:8px;padding-left:${10 + d * 22}px;padding-right:12px"><span class="mu" style="width:16px;display:flex;justify-content:center">${I.grip}</span>${parent ? `<span class="mu" style="display:flex">${closed ? I.chev : I.down}</span>` : '<span style="width:16px;flex:none"></span>'}${n ? `<span class="sm mu" style="flex:none;min-width:${d === 0 ? 12 : 26}px">${n}</span>` : ''}<span class="gr el" style="${d === 0 ? 'font-weight:700;' : d === 2 ? 'font-size:14px;' : ''}">${t}</span>${d === 0 ? wt(w) : ''}${parent ? `<span class="sm mu" style="flex:none;min-width:52px;text-align:right">${range}</span>` : `<span class="pg">${pg}<span class="xs mu">쪽</span></span>`}</div>${sel ? `<div class="rw" style="background:var(--cur);min-height:48px;padding:0 12px;gap:6px;justify-content:space-between"><button type="button" class="ch lg">${I.outdent}내어쓰기</button><button type="button" class="ch lg">${I.indent}들여쓰기</button><button type="button" class="ch lg">${I.plus}아래에</button><button type="button" class="ch lg" aria-label="지우기" style="padding:0 10px">${I.trash}</button></div>` : ''}`
}).join('\n')
const NP2 = page('목차 편집', 390, 1060, `
${hd('<button type="button" class="tb">취소</button>', '목차', '<button type="button" class="tb b">완료</button>')}
<main class="mn">
<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 4px 0"><span class="sm mu">8단원 · 소단원 23 · 1~232쪽</span><button type="button" class="ch lg">${I.paste}붙여넣기</button></div>
<section class="cd" aria-label="목차 트리">
${treeRows}
<div class="rw" style="justify-content:center;min-height:48px"><button type="button" class="ch lg" style="background:transparent">${I.plus}단원 추가</button></div>
<div class="rw nl"><span class="gr sm">마지막 쪽</span><span class="pg">232<span class="xs mu">쪽</span></span></div>
</section>
<div class="cd pd" style="display:flex;flex-direction:column;gap:8px">
<div class="sm"><b>쪽은 시작 쪽만 넣어요.</b> 끝 쪽은 다음 항목의 시작 쪽에서 자동으로 채워요. 위 단계 범위도 자동이에요.</div>
<div class="sm mu" style="display:flex;align-items:center;gap:8px">${wt(1)}${wt(2)}${wt(3)}<span>단원 무게 · 누를 때마다 쉬움 → 보통 → 어려움</span></div>
<div class="sm mu">하루 분량은 가장 아래 항목 끝에서 끊어요. 진도·이해도·복습은 맨 위 단원으로 묶어서 보여 줘요.</div>
</div>
</main>
`)

// ── 3. 붙여넣기 (번호 모양으로 깊이 읽기) ──
const lvBtns = `<span style="display:flex;gap:4px;flex:none"><button type="button" class="ch" aria-label="한 단계 위로" style="width:32px;padding:0;justify-content:center">${I.outdent}</button><button type="button" class="ch" aria-label="한 단계 아래로" style="width:32px;padding:0;justify-content:center">${I.indent}</button></span>`
const pasteSrc = ['Ⅰ. 수열의 극한', '1. 수열의 수렴과 발산 ········ 8', '(1) 수렴하는 수열 ········ 8', '(2) 발산하는 수열 ········ 12', '2. 수열의 극한값의 계산 ······ 16', '3. 등비수열의 극한', 'Ⅱ. 급수', '1. 급수의 수렴과 발산 ········ 29', '2. 등비급수 ············ 38', '(1) 등비급수의 합 ········ 38', '(2) 등비급수의 활용 ········ 46']
const parsed = [
  [0, 'Ⅰ', '수열의 극한', '8~28'], [1, '1', '수열의 수렴과 발산', '8~15'], [2, '(1)', '수렴하는 수열', '8'], [2, '(2)', '발산하는 수열', '12'],
  [1, '2', '수열의 극한값의 계산', '16'], [1, '3', '등비수열의 극한', 'est'], [0, 'Ⅱ', '급수', '29~52'], [1, '1', '급수의 수렴과 발산', '29'],
  [1, '2', '등비급수', '38~52'], [2, '(1)', '등비급수의 합', '38'], [2, '(2)', '등비급수의 활용', '46'],
]
const NP3 = page('목차 붙여넣기', 390, 1250, `
${hd('<button type="button" class="tb">취소</button>', '목차 붙여넣기', '<button type="button" class="tb b">넣기</button>')}
<main class="mn">
<p class="sm mu" style="margin:4px 4px 0">서점 책 소개나 PDF의 목차를 그대로 복사해 붙여넣으세요. 들여쓰기가 없어도 번호 모양으로 단계를 읽어요.</p>
<div style="border-radius:14px;background:var(--sf);box-shadow:0 1px 2px var(--shd);padding:12px 14px;font-size:14px;line-height:22px;white-space:pre;overflow:hidden">${pasteSrc.join('\n')}</div>
${sh('이렇게 읽었어요', '단원 2 · 소단원 6 · 세부 4')}
<section class="cd" aria-label="번호 모양과 단계">
${[['Ⅰ.  Ⅱ.', '단원', 0], ['1.  2.', '소단원', 1], ['(1)  (2)', '세부', 2]].map(([p, n, d], i) => `<div class="rw${i === 2 ? ' nl' : ''}" style="min-height:46px"><span style="width:${16 + d * 14}px;flex:none"></span><span class="pg" style="justify-content:center;min-width:70px;font-weight:700">${p}</span><span class="gr sm">${d + 1}단계 · ${n}</span>${lvBtns}</div>`).join('')}
</section>
<p class="xs mu" style="margin:0 4px">같은 번호 모양의 줄은 함께 바뀌어요. 한 줄만 바꾸려면 아래에서 고르세요.</p>
<section class="cd" aria-label="읽은 목차">
${parsed.map(([d, n, t, pg], i) => {
  const est = pg === 'est'
  const range = pg.includes('~')
  return `<div class="rw${i === parsed.length - 1 ? ' nl' : ''}" style="min-height:${d === 0 ? 48 : 42}px;gap:8px;padding-left:${14 + d * 20}px;padding-right:12px"><span class="sm mu" style="flex:none;min-width:22px">${n}</span><span class="gr el" style="${d === 0 ? 'font-weight:700;' : d === 2 ? 'font-size:14px;' : ''}">${t}</span>${est ? `<span class="pg" style="box-shadow:inset 0 0 0 1.5px var(--rib);background:transparent"><span class="xs rib bd">추정</span> 21</span>` : range ? `<span class="sm mu" style="flex:none">${pg}쪽</span>` : `<span class="pg">${pg}<span class="xs mu">쪽</span></span>`}</div>`
}).join('')}
</section>
<div class="cd pd" style="display:flex;flex-direction:column;gap:8px">
<div class="sm"><b>쪽이 없는 줄</b>은 앞뒤 쪽 사이로 <span class="rib bd">추정</span>해 두었어요. 눌러서 고칠 수 있어요.</div>
<div class="sm mu">목차가 8쪽부터 시작해요. 1~7쪽은 범위에서 빼요.</div>
<div class="sm mu">직접 쓸 때는 줄 앞에 <b style="color:var(--ink)">-</b>나 <b style="color:var(--ink)">1-1</b>처럼 쓰면 한 단계 아래로 들어가요.</div>
</div>
</main>
`)

// ── 4. 과목 추가 (처음엔 비어 있음 + 프리셋) ──
const PRESETS = [
  ['고등 내신', ['국어', '수학', '영어', '한국사', '통합사회', '통합과학']],
  ['수능 탐구', ['물리학Ⅰ', '화학Ⅰ', '생명과학Ⅰ', '지구과학Ⅰ', '사회·문화', '생활과 윤리']],
  ['공무원 9급', ['국어', '영어', '한국사', '행정법총론', '행정학개론']],
  ['예전에 쓴 과목', ['화학 · 1학기', '논술']],
]
const NP4 = page('과목 추가', 390, 900, `
${hd('<span style="width:56px"></span>', '새 계획', '<span style="width:56px"></span>')}
<div style="position:absolute;inset:0;background:var(--scrim)"></div>
<section class="sheet" aria-label="과목 추가" style="top:40px">
<div class="grab"></div>
<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 16px 8px"><b style="font-size:18px">과목 추가</b><button type="button" class="tb">닫기</button></div>
<div style="padding:0 16px;display:flex;flex-direction:column;gap:12px">
<label style="display:flex;flex-direction:column;gap:6px"><span class="sm mu">이름</span><span class="inp">물<span style="width:1.5px;height:20px;background:var(--ink);margin-left:1px"></span></span></label>
<div class="cd" style="box-shadow:inset 0 0 0 1px var(--hl);margin-top:-6px">
<div class="rw" style="min-height:44px"><span class="gr">물리학Ⅰ</span><span class="xs mu">수능 탐구</span></div>
<div class="rw nl" style="min-height:44px"><span class="gr">물리학Ⅱ</span><span class="xs mu">수능 탐구</span></div>
</div>
<div style="display:flex;align-items:center;gap:10px"><span class="sm mu" style="flex:none">색</span><span style="display:flex;gap:8px;flex:1">${['m', 'k', 'e', 'c', 'p', 'o', 'b', 'g'].map((c) => `<button type="button" aria-label="색" style="width:28px;height:28px;border-radius:14px;border:0;padding:0;background:var(--${c});${c === 'c' ? 'box-shadow:0 0 0 2px var(--sf),0 0 0 4px var(--ink);' : ''}"></button>`).join('')}</span></div>
<p class="xs mu" style="margin:-4px 0 0">아직 안 쓴 색을 골라 두었어요.</p>
<div style="height:1px;background:var(--hl);margin:2px 0"></div>
<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:15px">프리셋에서 가져오기</b><span class="xs mu">누르면 추가돼요</span></div>
${PRESETS.map(([g, xs]) => `<div style="display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;align-items:center"><span class="sm bd">${g}</span>${g.startsWith('예전') ? '' : '<button type="button" class="ch">모두 넣기</button>'}</div><span style="display:flex;flex-wrap:wrap;gap:6px">${xs.map((x) => `<button type="button" class="ch">${I.plus}${x}</button>`).join('')}</span></div>`).join('')}
</div>
<div class="ft" style="padding-top:16px"><button type="button" class="pri">물리학Ⅰ 추가</button></div>
</section>
`)

// ── 0. 간단하게 ──
const NPQ = page('새 계획 · 간단하게', 390, 900, `
${hd('<button type="button" class="tb">취소</button>', '새 계획', '<span style="width:56px"></span>')}
<main class="mn">
${modeSeg('quick')}
${kindTiles}
<section class="cd" aria-label="기본 정보" style="margin-top:6px">
<div class="rw"><span class="lb">이름</span><span class="gr bd">수학의 정석 미적분</span></div>
<div class="rw"><span class="lb">과목</span><span class="gr sm mu">아직 없어요</span><button type="button" class="ch add">${I.plus}과목</button></div>
<div class="rw"><span class="lb">범위</span><span class="gr" style="display:flex;align-items:center;gap:8px"><span class="pg" style="min-width:56px">1</span><span class="mu">~</span><span class="pg" style="min-width:56px">232</span><span class="sm mu">쪽</span></span></div>
<div class="rw" style="min-height:48px"><span class="lb"></span><span class="gr sm mu">목차는 나중에 넣어도 돼요</span><button type="button" class="ch">${I.paste}목차 넣기</button></div>
<div class="rw nl" style="flex-direction:column;align-items:stretch;gap:8px;padding:12px 16px 14px"><div style="display:flex;align-items:center;gap:12px"><span class="lb">마감</span><span class="gr bd">12월 12일 (토)</span><span class="sm mu">19일</span></div>
<span style="display:flex;gap:6px;padding-left:64px;flex-wrap:wrap"><button type="button" class="ch">2주</button><button type="button" class="ch">4주</button><button type="button" class="ch on">기말고사 3일 전</button></span></div>
</section>
${sh('이렇게 짜 둘게요', '자세히에서 바꿀 수 있어요')}
<section class="cd pd" aria-label="미리보기">
<div style="display:flex;align-items:baseline;gap:6px;margin-bottom:2px"><span style="font-size:28px;line-height:34px;font-weight:700">15<span style="font-size:15px;font-weight:500;color:var(--mu)">쪽 / 일쯤</span></span></div>
<div class="sm mu" style="margin-bottom:12px">공부 15일 · 12월 10일 끝 · 시험 5일 전</div>
${calStrip()}
<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">
<div class="sm" style="display:flex;align-items:center;gap:8px"><span class="sq" style="background:var(--ribt);box-shadow:inset 0 0 0 1.5px var(--rib);width:12px;height:12px"></span>일요일은 예비일 · 밀린 것, 없으면 복습</div>
<div class="sm" style="display:flex;align-items:center;gap:8px"><span class="sq hatch" style="width:12px;height:12px"></span>마지막 2일은 여유로 비워 둬요</div>
<div class="sm" style="display:flex;align-items:center;gap:8px"><span class="sq" style="background:var(--m);width:12px;height:12px"></span>첫 주 속도를 보고 다시 맞춰 드려요</div>
</div>
</section>
</main>
<div class="ft"><button type="button" class="pri">만들고 바로 시작</button></div>
`)

// ── 7. 필요할 때 제안 ──
const cap = (t) => `<div class="xs mu" style="padding:14px 4px 0;display:flex;align-items:center;gap:6px"><span style="width:6px;height:6px;border-radius:3px;background:var(--mu)"></span>${t}</div>`
const two = (a, b) => `<div style="display:flex;gap:8px;margin-top:12px"><button type="button" class="ch lg" style="flex:1;justify-content:center">${a}</button><button type="button" class="ch lg on" style="flex:1;justify-content:center">${b}</button></div>`
const hbar = (label, v, txt, faint) => `<div style="display:flex;align-items:center;gap:10px"><span class="sm" style="width:52px;flex:none">${label}</span><span style="flex:1;height:10px;border-radius:5px;background:var(--trk);overflow:hidden"><span style="display:block;height:100%;width:${v}%;background:${faint ? 'var(--mu)' : 'var(--ink)'}"></span></span><span class="sm bd" style="min-width:58px;text-align:right">${txt}</span></div>`
const NPS = page('필요할 때 제안', 390, 1250, `
${hd('<span style="width:56px"></span>', '오늘 탭에 뜨는 제안', '<span style="width:56px"></span>')}
<main class="mn" style="gap:6px">
<p class="sm mu" style="margin:0 4px">처음에 묻지 않은 것들은 필요한 순간에 한 장씩 물어봐요. 하루에 하나만 떠요.</p>
${cap('계획을 만들고 1주 뒤')}
<section class="cd pd"><b style="font-size:16px">첫 주 속도를 쟀어요</b>
<div style="display:flex;flex-direction:column;gap:8px;margin:12px 0 10px">${hbar('계획', 94, '하루 15쪽', true)}${hbar('실제', 69, '하루 11쪽')}</div>
<div class="sm">이 속도면 <b>12월 14일</b>에 끝나요 · 시험 1일 전</div>
<div class="xs mu" style="margin-top:4px">보통 계획보다 1.3배 걸려요. 다음 계획 미리보기에도 반영해요.</div>
${two('그대로', '끝나는 날 맞추기')}
</section>
${cap('단원을 끝낸 다음 날')}
<section class="cd pd"><b style="font-size:16px">어제 끝낸 2단원 급수, 지금 떠올려 보면?</b>
<div class="sm mu" style="margin:4px 0 12px">책을 덮고 핵심 세 가지를 떠올려 본 뒤 골라요. 끝낸 직후보다 지금이 더 정확해요.</div>
<div class="seg"><button type="button">거의 안 떠올라요</button><button type="button" class="on">절반쯤</button><button type="button">잘 떠올라요</button></div>
<div class="xs mu" style="margin-top:8px">고르면 복습 날짜를 맞춰요 · 절반쯤이면 7일 뒤 예비일</div>
</section>
${cap('1회독이 3일 남았을 때')}
<section class="cd pd"><b style="font-size:16px">2회독도 할까요?</b>
<div aria-hidden="true" style="display:flex;gap:3px;margin:12px 0 8px"><span style="flex:12;height:10px;border-radius:3px;background:var(--m)"></span><span style="flex:3;height:10px;border-radius:3px;background:color-mix(in srgb, var(--m) 50%, var(--trk))"></span><span class="hatch" style="flex:2;height:10px;border-radius:3px"></span></div>
<div class="sm">다시 읽기보다 <b>문제 위주로</b> 빠르게 · 12월 7일 ~ 12월 9일</div>
<div class="xs mu" style="margin-top:4px">이해도 '절반쯤' 이하인 단원부터 넣어요.</div>
${two('안 할래요', '2회독 만들기')}
</section>
${cap('기록이 2주 쌓였을 때')}
<section class="cd pd"><b style="font-size:16px">요일마다 공부한 시간을 봤어요</b>
<div style="display:flex;gap:6px;align-items:flex-end;height:84px;margin:12px 0 6px">${[['월', 110], ['화', 80], ['수', 115], ['목', 70], ['금', 95], ['토', 180], ['일', 40]].map(([d, m]) => `<span style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><span class="xs ${d === '토' ? 'bd' : 'mu'}">${hm(m)}</span><span style="width:100%;height:${m / 3.2}px;border-radius:4px;background:${d === '토' ? 'var(--ink)' : 'var(--chip)'}"></span><span class="xs">${d}</span></span>`).join('')}</div>
<div class="sm">토요일엔 평균 <b>3시간</b> 했어요. 공부 가능 시간으로 정할까요?</div>
${two('나중에', '이대로 정하기')}
</section>
${cap('문제집 정답률이 쌓였을 때')}
<section class="cd pd"><b style="font-size:16px">급수 · 자신감보다 정답률이 낮아요</b>
<div style="display:flex;flex-direction:column;gap:8px;margin:12px 0 10px">${hbar('자신감', 85, '잘 떠오름', true)}${hbar('정답률', 58, '58%')}</div>
<div class="sm mu">틀린 문항 위주로 복습을 넣을까요?</div>
${two('괜찮아요', '복습 넣기')}
</section>
</main>
`)

// ── 5. 자세히 ──
const rounds = [['1회독', '전체 · 기본 속도', '11.24~12.4', 'var(--m)', 9], ['2회독', '전체 · 2배 빠르게', '12.5~12.8', 'color-mix(in srgb, var(--m) 55%, var(--trk))', 4], ['오답만', '이해도 하·틀린 문항', '12.9~12.10', 'color-mix(in srgb, var(--m) 28%, var(--trk))', 2]]
const NP5 = page('나누기·회독·최소 목표', 390, 1160, `
${hd(`<button type="button" class="tb">${I.back}새 계획</button>`, '자세히', '<span style="width:72px"></span>')}
<main class="mn">
${sh('나누는 기준')}
<section class="cd" aria-label="나누는 기준">
<div class="rw"><span class="gr"><span style="display:block">단원 무게 반영</span><span class="xs mu">처음엔 모두 보통. 공부를 시작하면 실제 속도로 저절로 맞춰져요</span></span><button type="button" class="sw on" aria-label="단원 무게 반영 켜짐"><i></i></button></div>
<div class="rw" style="min-height:48px;padding-left:28px"><span class="gr sm">8단원 모두 <b>보통</b></span><button type="button" class="ch">단원별로 바꾸기${I.chev}</button></div>
<div class="rw"><span class="gr"><span style="display:block">공부 가능 시간 따르기</span><span class="xs mu">시간이 많은 요일에 더 많이 넣어요</span></span><button type="button" class="sw on" aria-label="공부 가능 시간 따르기 켜짐"><i></i></button></div>
<div class="rw nl" style="padding:12px 16px 14px;gap:6px;align-items:flex-end">
${[['월', 2], ['화', 1.5], ['수', 2], ['목', 1.5], ['금', 2], ['토', 4], ['일', 'sp']].map(([d, h]) => `<span style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><span class="xs mu">${h === 'sp' ? '예비' : hm(h * 60)}</span><span style="width:100%;height:${h === 'sp' ? 18 : h * 14}px;border-radius:4px;${h === 'sp' ? 'background:var(--ribt);box-shadow:inset 0 0 0 1.5px var(--rib)' : 'background:var(--chip)'}"></span><span class="xs">${d}</span></span>`).join('')}
<span class="mu" style="align-self:center">${I.chev}</span>
</div>
</section>
<p class="xs mu" style="margin:0 4px">요일별 시간은 앱 전체에 한 번 정해요 (더보기 › 공부 가능 시간).</p>
${sh('회독', '정하지 않아도 돼요')}
<p class="xs mu" style="margin:0 4px">비워 두면 1회독이 끝나 갈 때 2회독을 할지 물어봐요.</p>
<section class="cd pd" aria-label="회독">
<div aria-hidden="true" style="display:flex;gap:3px;margin-bottom:12px">${rounds.map(([, , , c, n]) => `<span style="flex:${n};height:12px;border-radius:3px;background:${c}"></span>`).join('')}<span class="hatch" style="flex:2;height:12px;border-radius:3px"></span></div>
${rounds.map(([n, s, r, c]) => `<div style="display:flex;align-items:center;gap:10px;min-height:48px;box-shadow:inset 0 -1px 0 var(--hl)"><span class="sq" style="background:${c};width:12px;height:12px"></span><span class="gr"><b style="display:block;font-size:15px">${n}</b><span class="xs mu">${s}</span></span><span class="sm mu">${r}</span><span class="mu">${I.chev}</span></div>`).join('')}
<div style="display:flex;gap:6px;margin-top:12px"><button type="button" class="ch lg">${I.plus}회독 추가</button><button type="button" class="ch lg on">1회독만</button></div>
<p class="xs mu" style="margin:10px 0 0">회독마다 진도를 따로 쌓아요. 2회독은 1회독 속도를 기준으로 계산해요.</p>
</section>
${sh('예비일과 여유')}
<section class="cd" aria-label="예비일과 여유">
<div class="rw"><span class="gr"><span style="display:block">예비일에 할 일</span><span class="xs mu">그 주에 밀린 분량 → 없으면 복습할 단원</span></span><span class="sm mu">일요일</span></div>
<div class="rw nl"><span class="gr">끝 여유</span><span class="st"><button type="button" aria-label="줄이기">−</button><b>2일</b><button type="button" aria-label="늘리기">+</button></span></div>
</section>
${sh('바쁜 날 최소 목표')}
<section class="cd" aria-label="최소 목표">
<div class="rw nl"><span class="gr"><span style="display:block">이만큼만 해도 했음</span><span class="xs mu">연속 공부가 이어지고, 나머지는 예비일로 가요</span></span><span class="st"><button type="button" aria-label="줄이기">−</button><b>5쪽</b><button type="button" aria-label="늘리기">+</button></span></div>
</section>
</main>
<div class="ft"><button type="button" class="pri">적용</button></div>
`)

// ── 6. 공부 가능 시간 (더보기) ──
// 요일: 가능 시간(분), 계획별 사용(분, 과목색)
const WK = [
  ['월', 120, [['m', 50], ['e', 40], ['k', 25]]],
  ['화', 90, [['m', 40], ['e', 30], ['c', 20]]],
  ['수', 120, [['m', 55], ['k', 35], ['e', 30]]],
  ['목', 90, [['m', 40], ['c', 30], ['k', 20]]],
  ['금', 120, [['m', 50], ['e', 40], ['k', 25]]],
  ['토', 240, [['m', 130], ['e', 50], ['k', 40], ['c', 20]], true],
  ['일', 180, [], 'sp'],
]
const chart = WK.map(([d, cap, use, mark]) => {
  const k = 0.5
  const used = use.reduce((a, [, v]) => a + v, 0)
  const box = mark === 'sp'
    ? `<span style="position:relative;width:100%;height:${cap * k}px;border-radius:6px;background:var(--ribt);box-shadow:inset 0 0 0 1.5px var(--rib);display:flex;align-items:center;justify-content:center"><span class="xs rib bd" style="writing-mode:vertical-rl">밀린 것·복습</span></span>`
    : `<span style="position:relative;width:100%;height:${cap * k}px;border-radius:6px;box-shadow:inset 0 0 0 1.5px var(--hl);display:flex;flex-direction:column-reverse;overflow:hidden">${use.map(([c, v]) => `<span style="height:${v * k}px;background:var(--${c});flex:none"></span>`).join('')}</span>`
  return `<span style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;justify-content:flex-end"><span class="xs ${mark === true ? 'bd' : 'mu'}">${mark === 'sp' ? '예비' : hm(used)}</span>${box}<span class="sm${mark === true ? ' bd' : ''}">${d}</span></span>`
}).join('')
const NP6 = page('공부 가능 시간', 390, 980, `
${hd(`<button type="button" class="tb">${I.back}더보기</button>`, '공부 가능 시간', '<span style="width:72px"></span>')}
<main class="mn">
<p class="sm mu" style="margin:4px 4px 0">요일마다 공부할 수 있는 시간이에요. 모든 계획이 이 시간을 나눠 써요. 넘치는 날은 마감이 먼 계획부터 다른 날로 옮겨요.</p>
<section class="cd pd" aria-label="이번 주 쓰는 시간">
<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px"><b style="font-size:16px">이번 주</b><span class="sm mu">계획 7개 · 15:20 / 16:00</span></div>
<div style="display:flex;gap:8px;align-items:flex-end;height:170px">${chart}</div>
<div class="lgd xs mu" style="margin-top:12px"><span><span class="sq" style="background:var(--m)"></span>수학</span><span><span class="sq" style="background:var(--e)"></span>영어</span><span><span class="sq" style="background:var(--k)"></span>국어</span><span><span class="sq" style="background:var(--c)"></span>과학</span><span><span class="sq" style="box-shadow:inset 0 0 0 1.5px var(--hl)"></span>남는 시간</span></div>
</section>
${sh('요일별 시간')}
<section class="cd" aria-label="요일별 시간">
${WK.map(([d, cap, , mark], i) => `<div class="rw${i === 6 ? ' nl' : ''}" style="min-height:50px"><span style="width:20px" class="bd">${d}</span><span class="gr sm mu">${mark === 'sp' ? '예비일 · 밀린 것과 복습만' : ''}</span><span class="st"><button type="button" aria-label="${d}요일 줄이기">−</button><b>${hm(cap)}</b><button type="button" aria-label="${d}요일 늘리기">+</button></span></div>`).join('')}
</section>
${sh('자동으로 옮긴 것', '이번 주')}
<section class="cd" aria-label="자동으로 옮긴 것">
<div class="rw" style="min-height:62px"><span class="dt" style="background:var(--m)"></span><span class="gr"><span class="el" style="display:block">쎈 수학Ⅱ 8문항</span><span class="xs mu">토 11.28 → 11.29 예비일 · 토요일 시간이 넘쳐서</span></span><button type="button" class="ch">되돌리기</button></div>
<div class="rw nl" style="min-height:62px"><span class="dt" style="background:var(--e)"></span><span class="gr"><span class="el" style="display:block">영어 독해 인강</span><span class="xs mu">끝나는 날 12.8 → 12.9 · 시험 6일 전이라 괜찮아요</span></span></div>
</section>
</main>
`)

const BOARDS = [
  ['NPQuick', '새 계획 · 간단하게', NPQ, 900],
  ['NPNew', '새 계획 · 자세히', NP1, 1612],
  ['NPMore', '나누기·회독·최소 목표', NP5, 1160],
  ['NPToc', '목차 편집', NP2, 1060],
  ['NPPaste', '목차 붙여넣기', NP3, 1250],
  ['NPSubject', '과목 추가', NP4, 900],
  ['NPHours', '공부 가능 시간', NP6, 980],
  ['NPSuggest', '필요할 때 제안', NPS, 1250],
]
const canvas = JSON.parse(fs.readFileSync(path.join(P, 'canvas.json'), 'utf8'))
if (!canvas.pages.some((p) => p.id === 'newplan')) canvas.pages.push({ id: 'newplan', name: '새 계획 개편' })
const DARK_Y = 1612 + 340
BOARDS.forEach(([n, title, html, h], i) => {
  fs.writeFileSync(path.join(P, `${n}.dc.html`), html)
  fs.writeFileSync(path.join(P, `${n}Dark.dc.html`), dark(n, title, h))
  const x = i * 470
  canvas.boards[`${n}.dc.html`] = { x, y: 0, w: 390, h, title, page: 'newplan' }
  canvas.boards[`${n}Dark.dc.html`] = { x, y: DARK_Y, w: 390, h, title: `${title} · 다크`, page: 'newplan' }
  for (const k of [`${n}.dc.html`, `${n}Dark.dc.html`]) if (!canvas.order.includes(k)) canvas.order.push(k)
})
canvas.notes.np_t = { x: 0, y: -300, page: 'newplan', kind: 'title1', text: '새 계획 개편 — 간단하게·자세히 · 과목 프리셋 · 번호로 읽는 목차 · 필요할 때 제안', maxW: 3680 }
canvas.notes.np_d = { x: 0, y: DARK_Y - 260, page: 'newplan', kind: 'title1', text: '다크 화면', maxW: 3680 }
canvas.launch = { view: 'canvas', page: 'newplan' }
fs.writeFileSync(path.join(P, 'canvas.json'), JSON.stringify(canvas, null, 1))
console.log('ok', BOARDS.length * 2, 'files')
