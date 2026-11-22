
// ── 안내형 계획 만들기 ──
CSS += `.q{margin:0;font-size:24px;line-height:32px;font-weight:700;letter-spacing:-0.2px}
.prog{height:4px;border-radius:2px;background:var(--trk);margin:0 16px;overflow:hidden;flex:none}
.prog i{display:block;height:100%;background:var(--ink);border-radius:2px}
.opt{display:flex;align-items:center;gap:12px;min-height:64px;padding:0 16px;border:0;border-radius:16px;background:var(--sf);box-shadow:0 1px 2px var(--shd);color:var(--ink);font:inherit;text-align:left;width:100%}
.opt.on{box-shadow:inset 0 0 0 2px var(--ink)}
.rad{width:22px;height:22px;border-radius:11px;box-shadow:inset 0 0 0 2px var(--mu);flex:none;display:flex;align-items:center;justify-content:center}
.opt.on .rad{box-shadow:inset 0 0 0 7px var(--ink)}
.tag{font-size:12px;line-height:16px;padding:2px 7px;border-radius:6px;background:var(--chip);color:var(--ink);font-weight:600;flex:none}
.big{font-size:22px;line-height:30px;font-weight:700;padding:10px 2px;box-shadow:inset 0 -2px 0 var(--ink);display:flex;align-items:center}
.cb{width:22px;height:22px;border-radius:6px;flex:none;display:flex;align-items:center;justify-content:center}
.cb.on{background:var(--ink);color:var(--bg)}
.cb.off{box-shadow:inset 0 0 0 2px var(--mu)}
`
const caret = '<span style="width:2px;height:26px;background:var(--ink);margin-left:2px"></span>'
const wzHd = (step, total, first) => `${hd(first ? '<button type="button" class="tb">취소</button>' : `<button type="button" class="tb" aria-label="뒤로">${I.back}</button>`, '', `<span class="sm mu" style="padding-right:12px">${step} / ${total}</span>`)}
<div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${step}"><i style="width:${(step / total) * 100}%"></i></div>`
const Q = (q, sub) => `<div style="padding:22px 4px 6px"><h2 class="q">${q}</h2>${sub ? `<p class="sm mu" style="margin:8px 0 0;font-size:14px;line-height:20px">${sub}</p>` : ''}</div>`
const next = (label = '다음', skip) => `<div class="ft">${skip ? `<button type="button" class="sec">${skip}</button>` : ''}<button type="button" class="pri">${label}</button></div>`

// 유형 그림
const art = {
  amount: `<span style="display:flex;gap:3px;align-items:flex-end">${[1, 1, 1, 1, 1, 0, 0, 0].map((on, i) => `<span style="width:13px;height:20px;border-radius:3px;background:${on ? 'var(--m)' : 'var(--trk)'};${i === 4 ? 'box-shadow:4px 0 0 -1px var(--rib);' : ''}"></span>`).join('')}</span>`,
  time: `<span style="display:flex;gap:3px">${[1, 1, 1, 1, 0, 0].map((on) => `<span style="width:20px;height:14px;border-radius:4px;background:${on ? 'var(--c)' : 'var(--trk)'}"></span>`).join('')}</span>`,
  habit: `<span style="display:grid;grid-template-columns:repeat(7,10px);gap:3px">${'111011011111101111011'.split('').map((on) => `<span style="width:10px;height:10px;border-radius:3px;background:${on === '1' ? 'var(--e)' : 'var(--trk)'}"></span>`).join('')}</span>`,
  todo: `<span style="display:flex;flex-direction:column;gap:6px">${[1, 0].map((on) => `<span style="display:flex;align-items:center;gap:7px"><span class="cb ${on ? 'on' : 'off'}" style="width:16px;height:16px;border-radius:4px">${on ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>' : ''}</span><span style="width:${on ? 44 : 58}px;height:6px;border-radius:3px;background:var(--trk)"></span></span>`).join('')}</span>`,
}
const TYPES = [['amount', '분량', '끝낼 범위가 있어요', '책 · 문제집 · 인강'], ['time', '시간', '매일 시간을 채워요', '자습 2시간'], ['habit', '습관', '꾸준히 반복해요', '영단어 50개 · 스트레칭'], ['todo', '할 일', '한 번 하면 끝나요', '수행평가 제출']]

const W1 = page('무엇을 계획할까요', 390, 844, `
${wzHd(1, 6, true)}
<main class="mn">
${Q('무엇을 계획할까요?', '하나를 누르면 다음으로 넘어가요.')}
<div role="radiogroup" aria-label="계획 유형" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">
${TYPES.map(([k, n, d, ex]) => `<button type="button" role="radio" aria-checked="false" style="height:184px;border:0;border-radius:20px;background:var(--sf);box-shadow:0 1px 2px var(--shd);color:var(--ink);font:inherit;text-align:left;padding:16px;display:flex;flex-direction:column;justify-content:space-between"><span style="height:40px;display:flex;align-items:center">${art[k]}</span><span><span style="display:block;font-size:19px;line-height:26px;font-weight:700">${n}</span><span style="display:block;font-size:14px;line-height:20px;margin-top:2px">${d}</span><span class="xs mu" style="display:block;margin-top:4px">${ex}</span></span></button>`).join('')}
</div>
</main>
<div style="margin-top:auto;padding:0 16px 28px;display:flex;justify-content:center"><button type="button" class="tb sm mu" style="font-size:14px;color:var(--mu)">한 화면에서 한 번에 입력하기${I.chev}</button></div>
`)

