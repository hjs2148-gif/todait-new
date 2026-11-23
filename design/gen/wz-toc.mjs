
// ── 3-1 ~ 3-4 · 목차 (3단계 안에서 열리는 화면, 진행 막대는 3 그대로) ──
CSS += `.tocsrc{border-radius:16px;background:var(--sf);box-shadow:0 1px 2px var(--shd);padding:12px 14px;font-size:14px;line-height:22px;white-space:pre;overflow:hidden;position:relative}
.tocsrc:after{content:'';position:absolute;left:0;right:0;bottom:0;height:44px;background:linear-gradient(transparent,var(--sf))}
.kb{background:var(--chip);padding:8px 4px 10px;display:flex;flex-direction:column;gap:9px;flex:none}
.kb div{display:flex;gap:5px;justify-content:center}
.kb span{height:42px;flex:0 0 33px;border-radius:6px;background:var(--sf);box-shadow:0 1px 0 var(--shd);display:flex;align-items:center;justify-content:center;font-size:18px}
.kb span.f{flex:0 0 48px;background:var(--trk);font-size:14px}
`
// 수학의 정석 미적분 1~232쪽. 단원 쪽 수(CH)는 6단계 책갈피 길과 같이 쓴다.
const CH = [28, 24, 28, 30, 30, 36, 30, 26]
const UNITS = [
  ['Ⅰ', '수열의 극한', '1~28', 3], ['Ⅱ', '급수', '29~52', 2], ['Ⅲ', '지수함수와 로그함수의 미분', '53~80', 3], ['Ⅳ', '삼각함수의 미분', '81~110', 3],
  ['Ⅴ', '여러 가지 미분법', '111~140', 3], ['Ⅵ', '도함수의 활용', '141~176', 3], ['Ⅶ', '여러 가지 적분법', '177~206', 3], ['Ⅷ', '정적분의 활용', '207~232', 2],
]
const unitBar = (h = 22) => `<div aria-hidden="true" style="display:flex;gap:2px;height:${h}px">${CH.map((w, i) => `<span style="flex:${w};border-radius:3px;background:color-mix(in srgb, var(--m) ${i % 2 ? 22 : 34}%, var(--sf));display:flex;align-items:center;justify-content:center"><span class="xs">${i + 1}</span></span>`).join('')}</div>`
const lvBtn = `<span style="display:flex;gap:4px;flex:none"><button type="button" class="ch" aria-label="한 단계 위로" style="width:34px;padding:0;justify-content:center">${I.outdent}</button><button type="button" class="ch" aria-label="한 단계 아래로" style="width:34px;padding:0;justify-content:center">${I.indent}</button></span>`

// ── 3-1 붙여넣기 ──
const SRC = ['Ⅰ. 수열의 극한', '1. 수열의 수렴과 발산 ·········· 1', '2. 수열의 극한값의 계산 ······ 10', '3. 등비수열의 극한', 'Ⅱ. 급수', '1. 급수의 수렴과 발산 ········ 29', '2. 등비급수', '(1) 등비급수의 합 ············ 38', '(2) 등비급수의 활용 ·········· 46', 'Ⅲ. 지수함수와 로그함수의 미분', '1. 지수함수와 로그함수의 극한 · 53']
const WT1 = page('목차 붙여넣기', 390, 844, `
${wzHd(3, 6)}
<main class="mn">
${Q('목차를 붙여넣어 주세요', '들여쓰기가 없어도 번호 모양(Ⅰ. → 1. → (1))으로 단계를 읽어요.')}
<div class="tocsrc" style="height:286px" aria-label="붙여넣은 목차">${SRC.join('\n')}</div>
<div style="display:flex;justify-content:space-between;align-items:center;padding:0 4px"><span class="sm mu">42줄 붙여넣음</span><button type="button" class="ch lg">${I.paste}다시 붙여넣기</button></div>
<section class="cd" aria-label="어디서 복사하나요">
<div class="rw" style="min-height:48px"><span class="sm mu" style="width:78px;flex:none">온라인 서점</span><span class="gr sm">책 소개의 목차 부분을 복사</span></div>
<div class="rw" style="min-height:48px"><span class="sm mu" style="width:78px;flex:none">PDF</span><span class="gr sm">목차 쪽을 골라 복사</span></div>
<div class="rw nl" style="min-height:48px"><span class="sm mu" style="width:78px;flex:none">종이책</span><span class="gr sm">카메라로 목차를 비추고 글자 복사</span></div>
</section>
</main>
${next('읽기', '직접 입력')}
`)

// ── 3-2 읽은 결과 ──
const READ = [
  [0, 'Ⅰ', '수열의 극한', '1~28'], [1, '1', '수열의 수렴과 발산', '1'], [1, '2', '수열의 극한값의 계산', '10'], [1, '3', '등비수열의 극한', 'est'],
  [0, 'Ⅱ', '급수', '29~52'], [1, '1', '급수의 수렴과 발산', '29'], [1, '2', '등비급수', '38~52'], [2, '(1)', '등비급수의 합', '38'], [2, '(2)', '등비급수의 활용', '46'],
]
const readRow = ([d, n, t, pg], last) => {
  const est = pg === 'est'
  const range = pg.includes('~')
  return `<div class="rw${last ? ' nl' : ''}" style="min-height:${d === 0 ? 50 : 44}px;gap:8px;padding-left:${14 + d * 20}px;padding-right:12px"><span class="sm mu" style="flex:none;min-width:22px">${n}</span><span class="gr el" style="${d === 0 ? 'font-weight:700;' : d === 2 ? 'font-size:14px;' : ''}">${t}</span>${est ? `<span class="pg" style="box-shadow:inset 0 0 0 1.5px var(--rib);background:transparent"><span class="xs rib bd">추정</span>19</span>` : range ? `<span class="sm mu" style="flex:none">${pg}쪽</span>` : `<span class="pg">${pg}<span class="xs mu">쪽</span></span>`}</div>`
}
const WT2 = page('이렇게 읽었어요', 390, 1410, `
${wzHd(3, 6)}
<main class="mn">
${Q('이렇게 읽었어요', '단계가 틀린 줄만 고쳐 주세요.')}
<section class="cd pd" aria-label="읽은 목차 요약">
<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px"><b style="font-size:16px">8단원 · 소단원 22 · 세부 6</b><span class="sm mu">1~232쪽</span></div>
${unitBar()}
<div class="sm" style="margin-top:10px;display:flex;align-items:center;gap:6px"><span style="color:var(--k);display:flex">${I.check}</span>3단계에 적은 범위 1~232쪽과 맞아요</div>
</section>
${sh('번호 모양', '모양마다 한 번에 바뀌어요')}
<section class="cd" aria-label="번호 모양과 단계">
${[['Ⅰ.', '단원', 0], ['1.', '소단원', 1], ['(1)', '세부', 2]].map(([p, n, d], i) => `<div class="rw${i === 2 ? ' nl' : ''}" style="min-height:48px"><span style="width:${d * 16}px;flex:none"></span><span class="pg" style="justify-content:center;min-width:48px;font-weight:700">${p}</span><span class="gr sm">${d + 1}단계 · ${n}</span>${lvBtn}</div>`).join('')}
</section>
${sh('목차', '줄을 누르면 이름·쪽·단계를 고쳐요')}
<section class="cd" aria-label="읽은 목차">
${READ.map((r, i) => readRow(r, false)).join('')}
${UNITS.slice(2).map(([n, t, r, k], i, a) => `<div class="rw${i === a.length - 1 ? ' nl' : ''}" style="min-height:50px;gap:8px;padding-left:14px;padding-right:12px"><span class="sm mu" style="flex:none;min-width:22px">${n}</span><span class="gr el bd">${t}</span><span class="xs mu" style="flex:none">${k}개</span><span class="sm mu" style="flex:none;min-width:62px;text-align:right">${r}쪽</span><span class="mu" style="display:flex">${I.chev}</span></div>`).join('')}
</section>
<div class="cd pd" style="display:flex;flex-direction:column;gap:6px">
<div class="sm">쪽이 없는 줄 1개는 앞뒤 쪽 사이로 <span class="rib bd">추정</span>했어요.</div>
<div class="sm mu">끝 쪽은 다음 줄의 시작 쪽에서 채워요.</div>
</div>
</main>
${next('이대로 넣기')}
`)

// ── 3-3 직접 입력 (키보드가 올라온 상태) ──
const TYPED = [
  [0, '1', '수열의 극한'], [1, '1-1', '수열의 수렴과 발산', '1'], [1, '1-2', '수열의 극한값의 계산', '10'],
]
const KB = [['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'], ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'], ['⇧', 'ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ', '⌫']]
const WT3 = page('목차 직접 입력', 390, 844, `
${hd(`<button type="button" class="tb" aria-label="뒤로">${I.back}</button>`, '목차 직접 입력', '<button type="button" class="tb b">완료</button>')}
<main class="mn" style="padding-top:4px">
<section class="cd" aria-label="입력한 목차">
${TYPED.map(([d, n, t, pg]) => `<div class="rw" style="min-height:${d === 0 ? 50 : 44}px;gap:8px;padding-left:${14 + d * 20}px;padding-right:12px"><span class="sm mu" style="flex:none;min-width:26px">${n}</span><span class="gr el" style="${d === 0 ? 'font-weight:700;' : ''}">${t}</span>${pg ? `<span class="pg">${pg}<span class="xs mu">쪽</span></span>` : ''}</div>`).join('')}
<div class="rw" style="min-height:48px;gap:8px;padding-left:34px;padding-right:12px;background:var(--cur)"><span class="sm mu" style="flex:none;min-width:26px">1-3</span><span class="gr" style="display:flex;align-items:center">등비수열의 극한 19${caret.replace('height:26px', 'height:20px')}</span><span class="pg" style="background:transparent;box-shadow:inset 0 0 0 1.5px var(--hl)">19<span class="xs mu">쪽</span></span></div>
<div class="rw nl" style="min-height:40px;padding-left:34px"><span class="xs mu">줄을 바꾸면 같은 단계로 이어져요</span></div>
</section>
<div class="xs mu" style="padding:0 4px;display:flex;flex-direction:column;gap:2px"><span>줄 끝의 숫자는 시작 쪽으로 읽어요.</span><span>줄 앞에 ‘-’를 쓰면 한 단계 아래로 들어가요.</span></div>
</main>
<div style="margin-top:auto;flex:none">
<div style="display:flex;align-items:center;gap:6px;padding:8px 10px;background:var(--sf);box-shadow:inset 0 1px 0 var(--hl)">
<button type="button" class="ch lg">${I.outdent}내어쓰기</button><button type="button" class="ch lg">${I.indent}들여쓰기</button><button type="button" class="ch lg" aria-label="줄 지우기" style="padding:0 10px">${I.trash}</button>
<button type="button" class="ch lg" aria-label="붙여넣기" style="margin-left:auto;padding:0 10px">${I.paste}</button>
</div>
<div class="kb" aria-hidden="true">
${KB.map((r) => `<div>${r.map((k) => `<span${k === '⇧' || k === '⌫' ? ' class="f"' : ''}>${k}</span>`).join('')}</div>`).join('')}
<div><span class="f" style="flex:0 0 52px">123</span><span style="flex:1 1 auto;font-size:14px">간격</span><span class="f" style="flex:0 0 88px">줄 바꿈</span></div>
</div>
</div>
`)

// ── 3-4 목차를 넣은 뒤 3단계 ──
const WT4 = page('얼마나 하나요 · 목차 넣음', 390, 844, `
${wzHd(3, 6)}
<main class="mn">
${Q('얼마나 하나요?', '범위를 적으면 하루 분량을 나눠 드려요.')}
<div class="seg" role="tablist" aria-label="시작 위치"><button type="button" class="on">처음부터 해요</button><button type="button">이미 한 부분이 있어요</button></div>
<div style="display:flex;align-items:center;gap:10px;padding:6px 4px 0">
<span class="big" style="flex:1;justify-content:center">1</span><span class="mu" style="font-size:20px">~</span><span class="big" style="flex:1;justify-content:center">232</span>
</div>
<div style="display:flex;gap:6px;padding:12px 4px 0;flex-wrap:wrap">${['쪽', '문항', '강', '직접'].map((u) => `<button type="button" class="ch lg${u === '쪽' ? ' on' : ''}">${u}</button>`).join('')}<span class="sm mu" style="margin-left:auto;align-self:center">모두 232쪽</span></div>
<section class="cd pd" style="margin-top:14px" aria-label="넣은 목차">
<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><b style="font-size:16px">목차</b><span class="sm mu">8단원 · 소단원 22</span><button type="button" class="ch" style="margin-left:auto">고치기</button></div>
${unitBar()}
<div style="display:flex;flex-direction:column;gap:2px;margin-top:12px">${UNITS.slice(0, 3).map(([n, t, r]) => `<div class="sm" style="display:flex;gap:8px"><span class="mu" style="width:18px;flex:none">${n}</span><span class="gr el">${t}</span><span class="mu" style="flex:none">${r}</span></div>`).join('')}<div class="sm mu" style="padding-left:26px">외 5단원</div></div>
<p class="xs mu" style="margin:12px 0 0">하루 분량은 소단원 끝에서 끊고, 단원이 끝나는 날은 달력에 책갈피로 표시해요.</p>
</section>
</main>
${next()}
`)
