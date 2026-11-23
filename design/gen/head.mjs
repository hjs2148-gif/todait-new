// 새 계획 개편 보드 생성기. node np.mjs <root>
import fs from 'node:fs'
import path from 'node:path'
const ROOT = process.argv[2]
const P = path.join(ROOT, 'project')

const PAL = `{ light: { bg: '#f3f0ea', sf: '#fffdf9', chip: '#e8e3da', segon: '#ffffff', ink: '#1f1c18', mu: '#655f56', hl: '#ebe6dd', trk: '#ece7de', pg: '#f3efe7', cur: '#f6f1e6', m: '#4a67ad', k: '#3d8762', e: '#8d5aa0', c: '#2c7f8c', g: '#6d675e', s: '#2b77a8', l: '#557d2e', y: '#a85a2c', r: '#a8435a', i: '#5a54a8', t: '#56677a', d: '#8a7350', a: '#3f3b36', p: '#a24d76', o: '#6e7a2c', b: '#8a5d3b', rib: '#b0750f', ribt: '#f4e7cf', bad: '#b03a2a', shd: 'rgba(60,45,20,0.07)', scrim: 'rgba(31,28,24,0.45)' }, dark: { bg: '#121110', sf: '#1d1b18', chip: '#2a2723', segon: '#4a4640', ink: '#f2eee7', mu: '#a69f94', hl: '#2c2925', trk: '#322e29', pg: '#272420', cur: '#25221e', m: '#8ea6ea', k: '#85c2a0', e: '#c79ad8', c: '#6cc4cf', g: '#b3ab9f', s: '#79b8e3', l: '#a6cf7a', y: '#e7a679', r: '#e8909f', i: '#aaa4ec', t: '#a9b8c9', d: '#cdb48a', a: '#d8d2c8', p: '#e391b8', o: '#bcc777', b: '#d6a682', rib: '#e2ac48', ribt: '#3a2f1c', bad: '#ff8a75', shd: 'rgba(0,0,0,0.4)', scrim: 'rgba(0,0,0,0.6)' } }`

let CSS = `body{margin:0}
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

