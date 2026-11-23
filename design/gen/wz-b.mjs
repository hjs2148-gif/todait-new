
// ── 2. 이름 + 과목 ──
const W2 = page('무엇으로 공부하나요', 390, 844, `
${wzHd(2, 6)}
<main class="mn">
${Q('무엇으로 공부하나요?', '책이나 강의 이름과 과목을 정해 주세요.')}
<label style="display:block;padding:4px 4px 0"><span class="xs mu">이름</span><span class="big">수학의 정석 미${caret}</span></label>
<section class="cd" style="margin-top:6px">
<div class="rw" style="min-height:48px"><span class="dt" style="background:var(--m)"></span><span class="gr">수학의 정석 <b>미</b>적분Ⅰ</span><span class="xs mu">끝냄 · 9월</span></div>
<div class="rw nl" style="min-height:48px"><span class="dt" style="background:var(--m)"></span><span class="gr">수학의 정석 수학Ⅱ</span><span class="xs mu">진행 중</span></div>
</section>
<div style="padding:18px 4px 0;display:flex;justify-content:space-between;align-items:baseline"><span class="xs mu">과목</span><span class="xs mu">없어도 괜찮아요</span></div>
<div style="display:flex;flex-wrap:wrap;gap:8px;padding:2px 0 0">
<button type="button" class="ch lg on"><span class="dt" style="background:var(--m)"></span>수학</button>
<button type="button" class="ch lg"><span class="dt" style="background:var(--e)"></span>영어</button>
<button type="button" class="ch lg add">${I.plus}새 과목</button>
<button type="button" class="ch lg">프리셋에서 고르기${I.chev}</button>
</div>
<p class="xs mu" style="margin:6px 4px 0">예전 이름을 고르면 과목과 단위도 그때처럼 채워요.</p>
</main>
${next()}
`)

// ── 3. 얼마나 ──
const W3 = page('얼마나 하나요', 390, 844, `
${wzHd(3, 6)}
<main class="mn">
${Q('얼마나 하나요?', '범위를 적으면 하루 분량을 나눠 드려요.')}
<div class="seg" role="tablist" aria-label="시작 위치"><button type="button" class="on">처음부터 해요</button><button type="button">이미 한 부분이 있어요</button></div>
<div style="display:flex;align-items:center;gap:10px;padding:6px 4px 0">
<span class="big" style="flex:1;justify-content:center">1</span><span class="mu" style="font-size:20px">~</span><span class="big" style="flex:1;justify-content:center">232${caret}</span>
</div>
<div style="display:flex;gap:6px;padding:12px 4px 0;flex-wrap:wrap">${['쪽', '문항', '강', '직접'].map((u) => `<button type="button" class="ch lg${u === '쪽' ? ' on' : ''}">${u}</button>`).join('')}<span class="sm mu" style="margin-left:auto;align-self:center">모두 232쪽</span></div>
<section class="cd pd" style="margin-top:14px">
<div style="display:flex;align-items:center;gap:8px"><b style="font-size:16px">목차도 넣을래요?</b><span class="tag">선택</span></div>
<p class="sm mu" style="margin:6px 0 12px">단원별로 진도와 복습 시기를 챙겨 드려요. 나중에 넣어도 돼요.</p>
<div style="display:flex;gap:8px"><button type="button" class="ch lg" style="flex:1;justify-content:center">${I.paste}목차 붙여넣기</button><button type="button" class="ch lg" style="flex:1;justify-content:center">${I.plus}직접 입력</button></div>
</section>
</main>
${next()}
`)

// ── 4. 기간 + 요일 (달력에서 고르기) ──
// 11/23(월) ~ 12/20(일). 범위 11/24 ~ 12/14, 시험 12/15
const PICK = [
  ['23', 'out'], ['24', 'start'], ['25', 'in'], ['26', 'in'], ['27', 'in'], ['28', 'in'], ['29', 'sp'],
  ['30', 'in'], ['1', 'in'], ['2', 'in'], ['3', 'in'], ['4', 'in'], ['5', 'in'], ['6', 'sp'],
  ['7', 'in'], ['8', 'in'], ['9', 'in'], ['10', 'in'], ['11', 'in'], ['12', 'in'], ['13', 'bf'],
  ['14', 'end'], ['15', 'ex'], ['16', 'out'], ['17', 'out'], ['18', 'out'], ['19', 'out'], ['20', 'out'],
]
const pickCell = ([d, k], i) => {
  const col = i % 7
  const inR = ['start', 'in', 'sp', 'bf', 'end'].includes(k)
  const band = inR ? `background:color-mix(in srgb, var(--ink) 9%, transparent);${k === 'start' || col === 0 ? 'border-top-left-radius:20px;border-bottom-left-radius:20px;' : ''}${k === 'end' || col === 6 ? 'border-top-right-radius:20px;border-bottom-right-radius:20px;' : ''}` : ''
  const cap = k === 'start' || k === 'end'
  const inner = cap
    ? `<span style="width:40px;height:40px;border-radius:20px;background:var(--ink);color:var(--bg);display:flex;align-items:center;justify-content:center;font-weight:700">${d}</span>`
    : k === 'ex'
      ? `<span style="width:40px;height:40px;border-radius:20px;box-shadow:inset 0 0 0 2px var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:14px"><b style="font-size:14px">${d}</b><span style="font-size:12px">시험</span></span>`
      : `<span style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;${k === 'out' ? 'color:var(--mu);' : ''}${k === 'sp' ? 'color:var(--rib);font-weight:700;' : ''}">${d}</span>`
  const mark = k === 'sp' ? '<span style="position:absolute;bottom:3px;left:50%;margin-left:-3px;width:6px;height:6px;border-radius:3px;background:var(--rib)"></span>' : k === 'bf' ? '<span class="hatch" style="position:absolute;bottom:3px;left:50%;margin-left:-9px;width:18px;height:5px;border-radius:2px"></span>' : ''
  return `<span style="position:relative;height:44px;display:flex;align-items:center;justify-content:center;${band}">${inner}${mark}</span>`
}
const WEEK = [['월', 14], ['화', 14], ['수', 14], ['목', 14], ['금', 14], ['토', 14], ['일', 'sp']]
const weekShape = `<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px">${WEEK.map(([d, v]) => `<span style="display:flex;flex-direction:column;align-items:center;gap:5px"><span class="xs mu">${d}</span>${v === 'sp'
  ? '<span style="width:100%;height:52px;border-radius:10px;background:var(--ribt);box-shadow:inset 0 0 0 1.5px var(--rib);display:flex;align-items:center;justify-content:center"><span class="xs rib bd">예비</span></span>'
  : v === 'off' ? '<span style="width:100%;height:52px;border-radius:10px;box-shadow:inset 0 0 0 1px var(--hl);display:flex;align-items:center;justify-content:center"><span class="xs mu">쉼</span></span>'
    : `<span style="width:100%;height:52px;border-radius:10px;background:color-mix(in srgb, var(--m) 34%, var(--sf));display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:18px"><b style="font-size:17px">${v}</b><span class="xs mu" style="color:var(--ink)">쪽</span></span>`}</span>`).join('')}</div>`
const W4 = page('언제부터 언제까지', 390, 930, `
${wzHd(4, 6)}
<main class="mn">
${Q('언제부터 언제까지 할까요?', '달력에서 시작과 끝을 눌러요.')}
<div style="display:flex;flex-direction:column;gap:8px">
<div style="display:flex;align-items:center;gap:8px"><span class="sm mu" style="width:30px">시작</span><button type="button" class="ch lg on">오늘 11.24</button><button type="button" class="ch lg">내일</button></div>
<div style="display:flex;align-items:center;gap:8px"><span class="sm mu" style="width:30px">끝</span><button type="button" class="ch lg on">시험 전날 12.14</button><button type="button" class="ch lg">4주 뒤</button></div>
</div>
<section class="cd" style="padding:12px 10px 10px" aria-label="기간 달력">
<div style="display:flex;justify-content:space-between;align-items:center;padding:0 6px 8px"><button type="button" class="tb" aria-label="이전 달" style="height:32px;padding:0 4px">${I.back}</button><b>11월 – 12월</b><button type="button" class="tb" aria-label="다음 달" style="height:32px;padding:0 4px;transform:scaleX(-1)">${I.back}</button></div>
<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));margin-bottom:2px" class="xs mu">${['월', '화', '수', '목', '금', '토', '일'].map((d) => `<span style="text-align:center">${d}</span>`).join('')}</div>
<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));row-gap:4px">${PICK.map(pickCell).join('')}</div>
<div class="lgd xs mu" style="margin:10px 6px 0"><span><span class="sq" style="background:var(--rib);border-radius:5px"></span>예비일</span><span><span class="sq hatch"></span>마지막 2일 여유</span><span>3주 · 21일</span></div>
</section>
<div class="xs mu" style="padding:8px 4px 0;display:flex;justify-content:space-between"><span>공부하는 요일</span><span>누를 때마다 공부 → 예비 → 쉼</span></div>
<div class="cd" style="padding:12px 14px">${dayBtns(['on', 'on', 'on', 'on', 'on', 'on', 'sp'])}</div>
<section class="cd pd" aria-label="한 주 모양">
<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px"><b style="font-size:15px">한 주는 이렇게 돼요</b><span class="sm mu">하루 14쪽쯤</span></div>
${weekShape}
<div class="sm" style="margin-top:12px">공부 17일 · 12월 12일 끝 · 시험 전 여유 2일</div>
<div class="xs mu" style="margin-top:2px">다음 단계에서 시간대를 정하면 요일마다 양을 맞춰요.</div>
</section>
</main>
${next()}
`)

// ── 5. 언제 공부 (시간대 띠) ──
const HRS = [6, 9, 12, 15, 18, 21, 24]
const band = (label, blocks, sum) => {
  const pos = (h) => ((h - 6) / 18) * 100
  return `<div style="display:flex;flex-direction:column;gap:6px">
<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:15px">${label}</b><span class="sm">${sum}</span></div>
<div style="position:relative;height:44px;border-radius:12px;background:var(--pg);box-shadow:inset 0 0 0 1px var(--hl)">
${HRS.slice(1, -1).map((h) => `<span style="position:absolute;left:${pos(h)}%;top:8px;bottom:8px;width:1px;background:var(--hl)"></span>`).join('')}
${blocks.map(([a, b]) => `<span style="position:absolute;left:${pos(a)}%;width:${pos(b) - pos(a)}%;top:5px;bottom:5px;border-radius:9px;background:var(--ink)"><span style="position:absolute;left:-5px;top:9px;width:10px;height:16px;border-radius:5px;background:var(--sf);box-shadow:0 0 0 2px var(--ink)"></span><span style="position:absolute;right:-5px;top:9px;width:10px;height:16px;border-radius:5px;background:var(--sf);box-shadow:0 0 0 2px var(--ink)"></span></span>`).join('')}
</div>
<div style="position:relative;height:16px" class="xs mu">${HRS.map((h) => `<span style="position:absolute;left:${pos(h)}%;transform:translateX(${h === 6 ? '0' : h === 24 ? '-100%' : '-50%'})">${h}시</span>`).join('')}</div>
</div>`
}
const W5 = page('보통 언제 공부해요', 390, 844, `
${wzHd(5, 6)}
<main class="mn">
${Q('보통 언제 공부해요?', '공부할 수 있는 시간대를 밀어서 정해요. 이 시간에 다음 공부를 띄우고, 하루에 넣을 양도 여기에 맞춰요.')}
<section class="cd pd" style="display:flex;flex-direction:column;gap:16px">
${band('평일', [[16, 18], [20, 22]], '4:00 ~ 6:00 · 8:00 ~ 10:00 <span class="mu">· 4시간</span>')}
${band('주말', [[10, 13]], '오전 10:00 ~ 1:00 <span class="mu">· 3시간</span>')}
<div style="display:flex;gap:8px"><button type="button" class="ch lg" style="flex:1;justify-content:center">${I.plus}시간대 더하기</button><button type="button" class="ch lg" style="flex:1;justify-content:center">요일마다 따로</button></div>
</section>
<div class="xs mu" style="padding:4px 4px 0">빨리 고르기</div>
<div style="display:flex;flex-wrap:wrap;gap:6px">${['아침 6~8시', '방과 후 4~6시', '저녁 8~10시', '밤 10~12시', '주말 오전'].map((x) => `<button type="button" class="ch lg">${x}</button>`).join('')}</div>
<section class="cd" style="margin-top:6px">
<div class="rw nl"><span class="gr"><span style="display:block">시작할 때 알려 주기</span><span class="xs mu">평일 4:00 · 주말 10:00 · 앱이 꺼져 있으면 늦을 수 있어요</span></span><button type="button" class="sw on" aria-label="알림 켜짐"><i></i></button></div>
</section>
</main>
${next('다음', '건너뛰기')}
`)

// ── 프리셋 시트 (2번에서) ──
const PCAT = ['고등 내신', '수능 탐구', '공무원 9급', '자격증·어학', '예전 과목']
const PRE = [['국어', 'k', true], ['수학', 'm', true, '씀'], ['영어', 'e', true, '씀'], ['한국사', 'b', true], ['통합사회', 'o', false], ['통합과학', 'c', true]]
const W2a = page('프리셋에서 고르기', 390, 844, `
${hd('<span style="width:56px"></span>', '새 계획', '<span style="width:56px"></span>')}
<div style="position:absolute;inset:0;background:var(--scrim)"></div>
<section class="sheet" aria-label="프리셋" style="top:40px">
<div class="grab"></div>
<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 16px 8px"><b style="font-size:18px">프리셋에서 고르기</b><button type="button" class="tb">닫기</button></div>
<div style="padding:0 16px;display:flex;flex-direction:column;gap:12px">
<div style="display:flex;flex-wrap:wrap;gap:6px">${PCAT.map((c, i) => `<button type="button" class="ch lg${i === 0 ? ' on' : ''}">${c}</button>`).join('')}</div>
<div class="cd" style="box-shadow:inset 0 0 0 1px var(--hl)">
${PRE.map(([n, c, on, used], i) => `<div class="rw${i === PRE.length - 1 ? ' nl' : ''}" style="min-height:52px"><span class="cb ${on ? 'on' : 'off'}">${on ? I.check : ''}</span><button type="button" aria-label="${n} 색" style="width:24px;height:24px;border-radius:12px;border:0;padding:0;background:var(--${c});flex:none;${on ? '' : 'opacity:.45;'}"></button><span class="gr"><span class="pg" style="justify-content:flex-start;width:100%;font-size:15px;${on ? '' : 'color:var(--mu);'}">${n}</span></span>${used ? '<span class="xs mu">이미 있음</span>' : ''}</div>`).join('')}
</div>
<p class="xs mu" style="margin:0">이미 있는 과목은 그대로 두고 새 것만 더해요. 이름과 색은 눌러서 바꿔요.</p>
</div>
<div class="ft" style="padding-top:14px"><button type="button" class="pri">3개 더하기</button></div>
</section>
`)

// ── 색 시트: 추천 16색 + 색상 띠 ──
const SW = ['m', 's', 'c', 'k', 'l', 'o', 'd', 'b', 'y', 'r', 'p', 'e', 'i', 't', 'g', 'a']
const hues = [0, 30, 55, 90, 140, 175, 200, 225, 260, 290, 330, 360]
const W2b = page('과목 색', 390, 844, `
${hd('<span style="width:56px"></span>', '새 계획', '<span style="width:56px"></span>')}
<div style="position:absolute;inset:0;background:var(--scrim)"></div>
<section class="sheet" aria-label="과목 색">
<div class="grab"></div>
<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 16px 8px"><b style="font-size:18px">한국사 색</b><button type="button" class="tb">닫기</button></div>
<div style="padding:0 16px;display:flex;flex-direction:column;gap:14px">
<div style="display:flex;flex-direction:column;gap:8px"><span class="sm mu">추천 16색</span>
<div style="display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:9px">${SW.map((c) => `<button type="button" aria-label="추천색" style="aspect-ratio:1;border-radius:50%;border:0;padding:0;background:var(--${c});${c === 'b' ? 'box-shadow:0 0 0 2px var(--sf),0 0 0 4px var(--ink);' : ''}"></button>`).join('')}</div>
</div>
<div style="display:flex;flex-direction:column;gap:10px"><span class="sm mu">직접 고르기</span>
<div style="position:relative;height:32px;border-radius:16px;background:linear-gradient(90deg,${hues.map((h) => `hsl(${h} 42% 46%)`).join(',')})"><span style="position:absolute;left:8%;top:-4px;width:40px;height:40px;margin-left:-20px;border-radius:20px;background:hsl(28 40% 38%);box-shadow:0 0 0 3px var(--sf),0 1px 4px rgba(0,0,0,.35)"></span></div></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
<div style="border-radius:14px;background:#f3f0ea;padding:12px;display:flex;flex-direction:column;gap:8px"><span style="font-size:12px;color:#655f56">라이트</span><span style="display:flex;align-items:center;gap:6px;color:#1f1c18;font-size:14px"><span style="width:8px;height:8px;border-radius:4px;background:#8a5d3b"></span>한국사</span><span style="height:8px;border-radius:4px;background:linear-gradient(90deg,#8a5d3b 60%,#ece7de 0)"></span></div>
<div style="border-radius:14px;background:#121110;padding:12px;display:flex;flex-direction:column;gap:8px"><span style="font-size:12px;color:#a69f94">다크</span><span style="display:flex;align-items:center;gap:6px;color:#f2eee7;font-size:14px"><span style="width:8px;height:8px;border-radius:4px;background:#d6a682"></span>한국사</span><span style="height:8px;border-radius:4px;background:linear-gradient(90deg,#d6a682 60%,#322e29 0)"></span></div>
</div>
<p class="xs mu" style="margin:0">어떤 색을 골라도 글자와 막대가 잘 보이게 밝기를 맞춰요.</p>
</div>
<div class="ft" style="padding-top:16px"><button type="button" class="pri">이 색으로</button></div>
</section>
`)

// ── 6. 한눈에 보기 ──
const MONTH = [
  [['23', '-'], ['24', 7, 'today'], ['25', 15], ['26', 12, 'end'], ['27', 12], ['28', 9], ['29', 'sp']],
  [['30', 15, 'end'], ['1', 14], ['2', 16], ['3', 14, 'end'], ['4', 16], ['5', 11, 'end'], ['6', 'sp']],
  [['7', 16], ['8', 15, 'end'], ['9', 16], ['10', 16, 'end'], ['11', 16], ['12', 12, 'end'], ['13', 'bf']],
  [['14', 'bf'], ['15', 'ex'], ['16', '-'], ['17', '-'], ['18', '-'], ['19', '-'], ['20', '-']],
]
const cell = ([d, v, f]) => {
  const base = 'height:52px;border-radius:9px;display:flex;flex-direction:column;justify-content:space-between;padding:4px 5px;position:relative;'
  const date = `<span class="xs ${f === 'today' ? 'bd' : 'mu'}" style="font-size:12px;line-height:14px;${f === 'today' ? 'color:var(--ink)' : ''}">${f === 'today' ? '오늘' : d}</span>`
  const rib = f === 'end' ? '<span aria-label="단원 끝" style="position:absolute;right:5px;top:0;width:6px;height:13px;background:var(--rib);clip-path:polygon(0 0,100% 0,100% 100%,50% 75%,0 100%)"></span>' : ''
  if (v === '-') return `<span style="${base}opacity:.45">${date}</span>`
  if (v === 'sp') return `<span style="${base}background:var(--ribt);box-shadow:inset 0 0 0 1.5px var(--rib)">${date}<span class="xs rib bd" style="font-size:12px;text-align:center">예비</span></span>`
  if (v === 'bf') return `<span class="hatch" style="${base}">${date}<span class="xs mu" style="font-size:12px;text-align:center">여유</span></span>`
  if (v === 'ex') return `<span style="${base}box-shadow:inset 0 0 0 2px var(--ink)">${date}<span class="xs bd" style="font-size:12px;text-align:center">시험</span></span>`
  return `<span style="${base}background:color-mix(in srgb, var(--m) ${Math.round(6 + v * 2.4)}%, var(--sf));${f === 'today' ? 'box-shadow:inset 0 0 0 2px var(--ink);' : ''}">${date}${rib}<b style="font-size:15px;line-height:18px;text-align:center">${v}</b></span>`
}
// 책갈피 길: 1~232쪽, 단원 8개, 주말마다 도착 위치
const STOPS = [[0, '오늘', '1쪽', true], [55 / 232, '11.29', '55쪽'], [141 / 232, '12.6', '141쪽'], [1, '12.12', '끝']]
const bookPath = `<div style="position:relative;padding:22px 0 30px">
<div aria-hidden="true" style="display:flex;gap:2px;height:22px">${CH.map((w, i) => `<span style="flex:${w};border-radius:3px;background:color-mix(in srgb, var(--m) ${i % 2 ? 22 : 34}%, var(--sf));display:flex;align-items:center;justify-content:center"><span class="xs" style="font-size:12px">${i + 1}</span></span>`).join('')}</div>
${STOPS.map(([p, d, pg, now]) => {
  const left = `${p * 100}%`
  const tx = p === 0 ? '0' : p === 1 ? '-100%' : '-50%'
  return `<span style="position:absolute;left:${left};top:16px;width:2px;height:34px;margin-left:-1px;background:${now ? 'var(--rib)' : 'var(--ink)'}"></span>${now ? `<span style="position:absolute;left:${left};top:8px;width:12px;height:26px;margin-left:-1px;background:var(--rib);clip-path:polygon(0 0,100% 0,100% 100%,50% 78%,0 100%)"></span>` : ''}<span style="position:absolute;left:${left};top:0;transform:translateX(${tx});white-space:nowrap" class="xs ${now ? 'rib bd' : 'mu'}">${d}</span><span style="position:absolute;left:${left};bottom:6px;transform:translateX(${tx});white-space:nowrap" class="xs bd">${pg}</span>`
}).join('')}
</div>`
const SUM = [
  ['이름', '<span class="dt" style="background:var(--m)"></span> 수학의 정석 미적분 · 수학'],
  ['범위', '1 ~ 232쪽'],
  ['목차', '8단원 · 소단원 22'],
  ['기간', '11.24 ~ 12.14 · 마지막 2일 여유'],
  ['요일', '월~토 공부 · 일요일 예비'],
  ['시간', '평일 4시·8시 · 주말 10시'],
  ['첫날', '7쪽만 · 평소의 절반'],
  ['복습', '예비일에 자동으로'],
]
const W6 = page('계획 한눈에', 390, 1430, `
${wzHd(6, 6)}
<main class="mn">
${Q('이렇게 짜 볼게요', '날짜나 줄을 누르면 바로 고칠 수 있어요.')}
<section class="cd pd" aria-label="하루 분량과 시간">
<div style="display:flex;align-items:baseline;gap:6px"><span style="font-size:30px;line-height:36px;font-weight:700">14<span style="font-size:15px;font-weight:500;color:var(--mu)">쪽 / 일쯤</span></span><span class="sm mu" style="margin-left:auto">12월 12일 끝 · 시험 3일 전</span></div>
<div class="sm" style="margin:12px 0 6px;display:flex;justify-content:space-between"><span>평일 하루에 쓰는 시간</span><span><b>2:50</b> <span class="mu">/ 4:00</span></span></div>
<div aria-hidden="true" style="display:flex;height:12px;border-radius:6px;overflow:hidden;box-shadow:inset 0 0 0 1px var(--hl)"><span style="width:28%;background:var(--m)"></span><span style="width:43%;background:var(--chip);box-shadow:inset 1px 0 0 var(--sf)"></span></div>
<div class="lgd xs mu" style="margin-top:8px"><span><span class="sq" style="background:var(--m)"></span>이 계획 1:05</span><span><span class="sq" style="background:var(--chip)"></span>다른 계획 1:45</span><span>남는 시간 1:10</span></div>
</section>
<section class="cd pd" aria-label="달력">
<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px"><b style="font-size:16px">날짜별로</b><span class="sm mu">숫자 = 그날 쪽 수</span></div>
<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin-bottom:4px" class="xs mu">${['월', '화', '수', '목', '금', '토', '일'].map((d) => `<span style="text-align:center">${d}</span>`).join('')}</div>
<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px">${MONTH.flat().map(cell).join('')}</div>
<div class="lgd xs mu" style="margin-top:10px"><span><span style="display:inline-block;width:6px;height:11px;background:var(--rib);clip-path:polygon(0 0,100% 0,100% 100%,50% 75%,0 100%)"></span>단원 끝</span><span><span class="sq" style="background:var(--ribt);box-shadow:inset 0 0 0 1.5px var(--rib)"></span>예비 · 밀린 것, 없으면 복습</span><span><span class="sq hatch"></span>여유</span></div>
</section>
<section class="cd pd" aria-label="책갈피 길">
<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:16px">책갈피 길</b><span class="sm mu">주말마다 여기까지</span></div>
${bookPath}
<div class="xs mu">칸 숫자는 단원 번호예요. 칸을 누르면 단원 이름이 보여요.</div>
</section>
<section class="cd" aria-label="계획 내용">
${SUM.map(([l, v, r], i) => `<div class="rw${i === SUM.length - 1 ? ' nl' : ''}" style="min-height:50px"><span class="lb">${l}</span><span class="gr el">${v}</span>${r ?? `<span class="mu">${I.chev}</span>`}</div>`).join('')}
</section>
<section class="cd">
<div class="rw" style="min-height:60px"><span class="gr"><b style="display:block">더 정하기</b><span class="xs mu">단원 무게 · 회독 · 바쁜 날 최소 목표</span></span><span class="mu">${I.down}</span></div>
<div class="rw nl" style="min-height:62px"><span class="dt" style="background:var(--e)"></span><span class="gr"><span style="display:block">다른 계획 1개가 맞춰져요</span><span class="xs mu">영어 독해 인강 토요일 2강 → 1강 · 남은 건 예비일로</span></span><span class="mu">${I.chev}</span></div>
</section>
</main>
${next('다음')}
`)

// ── 7. 만든 뒤 ──
const W7 = page('계획을 만들었어요', 390, 844, `
${hd('<span style="width:56px"></span>', '', '<button type="button" class="tb">닫기</button>')}
<main class="mn">
<div style="display:flex;justify-content:center;padding:28px 0 8px" aria-hidden="true"><span style="position:relative;width:96px;height:120px;border-radius:6px 10px 10px 6px;background:var(--sf);box-shadow:0 2px 6px var(--shd),inset 6px 0 0 var(--m)"><span style="position:absolute;right:22px;top:-6px;width:14px;height:52px;background:var(--rib);clip-path:polygon(0 0,100% 0,100% 100%,50% 82%,0 100%)"></span></span></div>
<div style="text-align:center;padding:8px 4px 4px"><h2 class="q">계획을 만들었어요</h2><p class="sm mu" style="margin:8px 0 0;font-size:14px;line-height:20px">첫날은 가볍게 시작해요. 내일부터 하루 14쪽쯤이에요.</p></div>
<section class="cd pd" style="margin-top:14px">
<div class="xs mu">오늘 할 것 · 오후 4시부터</div>
<div style="display:flex;align-items:baseline;gap:6px;margin:2px 0 10px"><b style="font-size:20px">1 ~ 7쪽</b><span class="sm mu">· 약 25분</span></div>
<div aria-hidden="true" style="display:flex;gap:3px">${Array.from({ length: 14 }, (_, i) => `<span style="flex:1;height:18px;border-radius:3px;background:${i < 7 ? 'color-mix(in srgb, var(--m) 30%, var(--trk))' : 'var(--trk)'}"></span>`).join('')}</div>
<div class="xs mu" style="margin-top:8px">여기까지만 해도 오늘은 '했음'이에요.</div>
</section>
<section class="cd">
<div class="rw" style="min-height:52px"><span class="gr">계획 한눈에 보기</span><span class="mu">${I.chev}</span></div>
<div class="rw nl" style="min-height:58px"><span class="gr"><span style="display:block">같은 시험으로 하나 더 만들기</span><span class="xs mu">기간·요일·시간은 그대로 가져와요</span></span><span class="mu">${I.chev}</span></div>
</section>
</main>
<div class="ft"><button type="button" class="sec">오늘 탭으로</button><button type="button" class="pri">지금 시작</button></div>
`)

const BOARDS = [
  ['WZType', '1 · 무엇을 계획할까요', W1, 844],
  ['WZName', '2 · 무엇으로 공부하나요 (이름 + 과목)', W2, 844],
  ['WZPreset', '2-1 · 프리셋에서 고르기', W2a, 844],
  ['WZColor', '2-2 · 과목 색 (추천 16색)', W2b, 844],
  ['WZAmount', '3 · 얼마나 하나요', W3, 844],
  ['WZTocPaste', '3-1 · 목차 붙여넣기', WT1, 844],
  ['WZTocRead', '3-2 · 이렇게 읽었어요', WT2, 1410],
  ['WZTocType', '3-3 · 목차 직접 입력', WT3, 844],
  ['WZAmountToc', '3-4 · 목차를 넣은 뒤', WT4, 844],
  ['WZPeriod', '4 · 언제부터 언제까지 (요일 포함)', W4, 930],
  ['WZTime', '5 · 보통 언제 공부해요 (시간대)', W5, 844],
  ['WZSummary', '6 · 계획 한눈에', W6, 1430],
  ['WZDone', '7 · 계획을 만들었어요', W7, 844],
]
const canvas = JSON.parse(fs.readFileSync(path.join(P, 'canvas.json'), 'utf8'))
if (!canvas.pages.some((p) => p.id === 'wizard')) canvas.pages.push({ id: 'wizard', name: '안내형 계획 만들기' })
// 합쳐서 없어진 보드
for (const n of ['WZSubject', 'WZDue']) for (const k of [`${n}.dc.html`, `${n}Dark.dc.html`]) {
  delete canvas.boards[k]
  canvas.order = canvas.order.filter((x) => x !== k)
}
const DARK_Y = 1430 + 340
BOARDS.forEach(([n, title, html, h], i) => {
  fs.writeFileSync(path.join(P, `${n}.dc.html`), html)
  fs.writeFileSync(path.join(P, `${n}Dark.dc.html`), dark(n, title, h))
  const x = i * 470
  canvas.boards[`${n}.dc.html`] = { x, y: 0, w: 390, h, title, page: 'wizard' }
  canvas.boards[`${n}Dark.dc.html`] = { x, y: DARK_Y, w: 390, h, title: `${title} · 다크`, page: 'wizard' }
  for (const k of [`${n}.dc.html`, `${n}Dark.dc.html`]) if (!canvas.order.includes(k)) canvas.order.push(k)
})
const W = BOARDS.length * 470 - 80
canvas.notes.wz_t = { x: 0, y: -300, page: 'wizard', kind: 'title1', text: '안내형 계획 만들기 — 질문 5개, 마지막에 한눈에 보고 고치기', maxW: W }
canvas.notes.wz_d = { x: 0, y: DARK_Y - 260, page: 'wizard', kind: 'title1', text: '다크 화면', maxW: W }
canvas.launch = { view: 'canvas', page: 'wizard' }
fs.writeFileSync(path.join(P, 'canvas.json'), JSON.stringify(canvas, null, 1))
console.log('ok', BOARDS.map((b) => b[0]).join(' '))
