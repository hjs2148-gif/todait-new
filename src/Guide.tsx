// 안내 카드: 넘치는 날(시계로 보여 주고 버튼 하나로 해결), 시험까지 여유(디데이 목록 → 달력), 필요할 때 제안.
// 원칙: 카드 한 장 = 문장 하나 + 행동 하나. 앱이 추천하고 사용자는 확인만. 시간은 시각("밤 11시 10분")이나 "1시간 10분"으로.
import { useMemo, useState, type ReactNode } from 'react'
import { addDays, diffDays, dow } from './date.ts'
import { liveExpect, secPerUnit, sumDone, type Task } from './logic.ts'
import { examDeadline, examProgress, planProgress } from './progress.ts'
import { actions, balanceOf, offFor, planOf, windowsFor, type Exam, type State } from './store.ts'
import { winSum, type Win } from './wizard.ts'
import { Icon } from './Icon.tsx'

const DOW = ['일', '월', '화', '수', '목', '금', '토']
const mdKo = (iso: string) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8))}일`
const dayKo = (iso: string) => `${mdKo(iso)} ${DOW[dow(iso)]}요일`
const dur = (m: number) => { m = Math.ceil(m / 5) * 5; return `${m >= 60 ? `${Math.floor(m / 60)}시간` : ''}${m % 60 ? ` ${m % 60}분` : ''}`.trim() || '0분' }
/** 시각: 1390 → "밤 11시 10분" */
const clockKo = (m: number) => {
  const h = Math.floor(m / 60) % 24
  const part = h < 6 ? '새벽' : h < 12 ? '오전' : h < 18 ? '오후' : h < 21 ? '저녁' : '밤'
  return `${part} ${h % 12 || 12}시${m % 60 ? ` ${m % 60}분` : ''}`
}

/** 카드 틀 */
export function GuideCard({ lab, head, body, children }: { lab: string; head: string; body?: ReactNode; children: ReactNode }) {
  return (
    <section className="gcard" role="region" aria-label={head}>
      <span className="g-lab">{lab}</span><b className="g-head">{head}</b>{body && <span className="g-body">{body}</span>}
      <div className="g-acts">{children}</div>
    </section>
  )
}

// ── 넘치는 날 ──
export interface Over {
  date: string
  /** 쓰는 시간·가능 시간(분) */
  load: number
  cap: number
  wins: Win[]
  /** 계획대로면 끝나는 시각 / 평소 끝나는 시각 (분) */
  endAt: number
  usualEnd: number
}
/** 앞으로 days일 안의 넘치는 날 */
export function overDays(s: State, today: string, days = 14): Over[] {
  if (!s.settings.studyWindows) return []
  const out = balanceOf(s, today)
  return out.over.filter((d) => diffDays(today, d) <= days).map((d) => {
    const wins = [...windowsFor(s, d)].sort((a, b) => a[0] - b[0])
    const cap = winSum(wins)
    const load = out.load[d]
    // 시간대를 앞에서부터 채우고, 넘친 만큼 마지막 시간대 뒤로 이어진다
    const usualEnd = wins.length ? wins[wins.length - 1][1] : 22 * 60
    return { date: d, load, cap, wins, endAt: Math.ceil((usualEnd + Math.max(0, load - cap)) / 5) * 5, usualEnd }
  })
}
/** 그날 계획별 쓰는 시간 (분, 많은 순) */
function loadsOn(s: State, d: string, today: string) {
  return s.tasks.filter((t) => !t.completed && !t.archived).map((t) => {
    const v = t.type === 'amount' ? planOf(s, t, today)[d] ?? 0 : t.type === 'time' ? liveExpect(t, s.recs[t.id] ?? {}, d, offFor(s, t)) : 0
    const min = t.type === 'time' ? v / 60 : (v * secPerUnit(t, s.recs[t.id] ?? {})) / 60
    return { t, v, min }
  }).filter((x) => x.min > 0).sort((a, b) => b.min - a.min)
}
const ceil30 = (m: number) => Math.ceil(m / 30) * 30
/** 해결 방법들 (앞이 추천) */
function fixesFor(s: State, o: Over, today: string, exam: Exam | null) {
  const need = o.load - o.cap
  const out: { title: string; result: string; bad?: boolean; apply: () => void }[] = []
  // 1. 그날만 늘리기
  const ext = ceil30(o.usualEnd + need)
  if (ext <= 24 * 60 + 60) {
    const wins = o.wins.length ? o.wins.map((w, i) => (i === o.wins.length - 1 ? [w[0], ext] as Win : w)) : [[ext - ceil30(need), ext] as Win]
    out.push({ title: `${clockKo(ext)}까지 하기`, result: `이날만 · 다 들어가요`, apply: () => actions.setSettings({ windowOverrides: { ...s.settings.windowOverrides, [o.date]: wins } }) })
  }
  // 2. 마감이 먼 계획을 그날만 줄이기
  const movable = loadsOn(s, o.date, today).filter((x) => x.t.type === 'amount' && x.t.custom[o.date] === undefined && x.t.endDate).sort((a, b) => b.t.endDate!.localeCompare(a.t.endDate!))[0]
  if (movable) {
    const spu = secPerUnit(movable.t, s.recs[movable.t.id] ?? {})
    const cut = Math.min(movable.v, Math.ceil((need * 60) / spu))
    out.push({ title: `${movable.t.name} 그날 ${cut}${movable.t.unit} 줄이기`, result: `${movable.v} → ${movable.v - cut}${movable.t.unit} · 줄인 건 뒤 날짜로`, apply: () => actions.saveTask({ ...movable.t, custom: { ...movable.t.custom, [o.date]: movable.v - cut } }) })
  }
  // 3. 마감이 가까운 계획의 끝나는 날 늦추기
  const near = loadsOn(s, o.date, today).filter((x) => x.t.type === 'amount' && x.t.endDate).sort((a, b) => a.t.endDate!.localeCompare(b.t.endDate!))[0]
  if (near) {
    for (const k of [1, 2, 3, 5, 7]) {
      const end = addDays(near.t.endDate!, k)
      const moved = { ...near.t, endDate: end }
      const b = balanceOf(s, today, s.tasks.map((t) => (t.id === moved.id ? moved : t)))
      if (!b.over.includes(o.date)) {
        const late = !!exam && end >= examDeadline(exam)
        out.push({ title: `${near.t.name} ${k}일 늦게 끝내기`, result: `${mdKo(end)} 끝${exam ? ` · ${late ? '시험 뒤로 밀려요' : `시험 ${diffDays(end, exam.date)}일 전`}` : ''}`, bad: late, apply: () => actions.saveTask(moved) })
        break
      }
    }
  }
  return out
}
function Timeline({ o }: { o: Over }) {
  const H0 = Math.min(16 * 60, ...o.wins.map((w) => w[0]))
  const H1 = Math.max(24 * 60, o.endAt + 30)
  const x = (m: number) => `${((m - H0) / (H1 - H0)) * 100}%`
  const ticks: number[] = []
  for (let h = Math.ceil(H0 / 120) * 2; h * 60 <= H1; h += 2) ticks.push(h * 60)
  return (
    <div className="g-tl" aria-hidden="true">
      <i className="ax" />
      {o.wins.map(([a, b], i) => <i key={i} className="win" style={{ left: x(a), width: `calc(${x(b)} - ${x(a)})` }} />)}
      <i className="over" style={{ left: x(o.usualEnd), width: `calc(${x(o.endAt)} - ${x(o.usualEnd)})` }} />
      <span className="pin" style={{ left: x(o.endAt) }}>{clockKo(o.endAt).replace(/^(밤|저녁|오후|새벽|오전) /, '')}</span>
      {ticks.map((m) => <span key={m} className="tk" style={{ left: x(m) }}>{(m / 60) % 12 || 12}시</span>)}
    </div>
  )
}
/** 오늘 탭: 앞으로 2주 안 가장 가까운 넘치는 날 하나 */
export function OverCard({ s, today, list, onDone }: { s: State; today: string; list: Over[]; onDone: (text: string) => void }) {
  const [sheet, setSheet] = useState(false)
  const exam = s.exams.find((e) => e.selected) ?? null
  if (!list.length) return null
  const o = list[0]
  const fixes = fixesFor(s, o, today, exam)
  const apply = (i: number) => { fixes[i].apply(); setSheet(false); onDone(`${dayKo(o.date)}, ${fixes[i].title.replace(/ 하기$/, '')}로 바꿨어요`) }
  return (
    <>
      <section className="gcard" role="region" aria-label="넘치는 날">
        <span className="g-lab">{dayKo(o.date)}</span>
        <b className="g-head">계획대로면 {clockKo(o.endAt)}에 끝나요</b>
        <span className="g-body mu">평소엔 {clockKo(o.usualEnd)}까지 공부해요. {dur(o.load - o.cap)}이 넘쳐요.</span>
        <Timeline o={o} />
        <div className="g-acts">
          <button className="g-s" onClick={() => setSheet(true)}>다른 방법</button>
          {fixes[0] ? <button className="g-p" onClick={() => apply(0)}>{fixes[0].title}</button> : <button className="g-p" onClick={() => actions.setSettings({ overSnooze: today })}>나중에</button>}
        </div>
      </section>
      {sheet && (
        <div className="backdrop" onClick={() => setSheet(false)}>
          <section className="sheet g-sheet" role="dialog" aria-label="다른 방법" onClick={(e) => e.stopPropagation()}>
            <div className="g-sh"><div><span className="g-lab">{dayKo(o.date)} · 계획 {dur(o.load)}, 가능 {dur(o.cap)}</span><b className="g-head">{dur(o.load - o.cap)}을 어떻게 할까요?</b></div><button className="fp-b" onClick={() => setSheet(false)}>닫기</button></div>
            {fixes.map((f, i) => (
              <button key={i} className="g-opt" onClick={() => apply(i)}>
                <span className="grow"><b>{f.title}{i === 0 && <span className="g-rec">추천</span>}</b><span className={f.bad ? 'bad' : 'mu'}>{f.result}</span></span><Icon name="right" size={16} />
              </button>
            ))}
            <button className="g-opt" onClick={() => { actions.setSettings({ overSnooze: today }); setSheet(false) }}><span className="grow"><b>오늘은 그대로 두기</b><span className="mu">내일 다시 알려 드려요</span></span><Icon name="right" size={16} /></button>
          </section>
        </div>
      )}
    </>
  )
}

// ── 시험까지 여유 (진도 탭) ──
/** 시험 범위 계획별: 이대로 끝나는 날과 여유(시험 전 마지막 공부일까지 남는 날), 여유 적은 순 */
export function slackRows(s: State, exam: Exam, today: string) {
  const dl = examDeadline(exam)
  return s.tasks.filter((t) => t.type === 'amount' && !t.completed && !t.archived && (exam.scope.length ? exam.scope.some((x) => x.taskId === t.id) : t.kind === 'book' || t.kind === 'lecture'))
    .map((t) => ({ t, end: planProgress(s, t, today, exam).planEnd }))
    .filter((r): r is { t: Task; end: string } => !!r.end && sumDone(s.recs[r.t.id] ?? {}) < r.t.amount)
    .map((r) => ({ ...r, slack: diffDays(r.end, dl) }))
    .sort((a, b) => a.slack - b.slack)
}
/** 위젯·카드가 볼 시험: 고른 시험, 없으면 가장 가까운 시험 */
export const examFor = (s: State, today: string) => s.exams.find((e) => e.selected) ?? [...s.exams].filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
export function SlackCard({ s, exam, today }: { s: State; exam: Exam; today: string }) {
  const [open, setOpen] = useState<string | null>(null)
  const rows = slackRows(s, exam, today)
  const over = useMemo(() => overDays(s, today, 14), [s, today])
  if (!rows.length) return null
  const sel = rows.find((r) => r.t.id === open)
  return (
    <section className="gcard g-slack" aria-label="시험까지 여유">
      <span className="g-lab">{exam.name} {mdKo(exam.date)}</span>
      <b className="g-head">D-{diffDays(today, exam.date)}{rows[0].slack < 0 ? ` · ${rows[0].t.name}이 시험 뒤에 끝나요` : rows[0].slack === 0 ? ` · ${rows[0].t.name}은 여유가 없어요` : ' · 모두 시험 전에 끝나요'}</b>
      {(() => { const p = examProgress(s, exam, today); return p ? <span className="g-body mu">범위 진도 <b style={{ color: 'var(--ink)' }}>{Math.round(p.done * 100)}%</b> · 오늘까지 예정 {Math.round(p.planned * 100)}%</span> : null })()}
      {over.length > 0 && <span className="g-body">앞으로 2주 중 {over.length === 1 ? `${dayKo(over[0].date)}` : `${over.length}일`}이 가능 시간을 넘어요. 오늘 탭에서 고칠 수 있어요.</span>}
      <div className="g-list">
        {rows.map((r) => (
          <button key={r.t.id} className="g-dl" onClick={() => setOpen(open === r.t.id ? null : r.t.id)} aria-expanded={open === r.t.id}>
            <span className={`dd${r.slack <= 0 ? ' z' : ''}${r.slack < 0 ? ' late' : ''}`}><small>{r.slack < 0 ? '늦음' : '여유'}</small><b>{Math.abs(r.slack)}일</b></span>
            <span className="grow"><b className="ell">{r.t.name}</b><small>{mdKo(r.end)} 끝</small></span>
          </button>
        ))}
      </div>
      {sel && <SlackCal end={sel.end} exam={exam.date} today={today} />}
      <span className="g-body mu" style={{ fontSize: 13, lineHeight: '18px' }}>여유는 이대로 끝나는 날부터 시험 전 마지막 공부일까지 남는 날이에요.</span>
    </section>
  )
}
export function SlackCal({ end, exam, today }: { end: string; exam: string; today: string }) {
  const first = addDays(today, -((dow(today) + 6) % 7))
  const last = [end, exam].sort().pop()!
  const n = Math.ceil((diffDays(first, last) + 1) / 7) * 7
  return (
    <div className="g-cal" aria-label="끝나는 날과 시험">
      {['월', '화', '수', '목', '금', '토', '일'].map((d) => <span key={d} className="w">{d}</span>)}
      {Array.from({ length: n }, (_, i) => addDays(first, i)).map((d) => (
        <span key={d} className={d < today ? 'o' : d === exam ? 'ex' : d === end ? 'en' : ''}>{d === exam ? '시험' : Number(d.slice(8))}</span>
      ))}
    </div>
  )
}

// ── 필요할 때 제안 (하루에 한 장) ──
type Sug = { key: string; lab: string; head: string; body: string; acts: [string, () => void, 'p' | 's' | 'c'][] }
export function suggestions(s: State, today: string): Sug[] {
  const out: Sug[] = []
  const yday = addDays(today, -1)
  const answer = (key: string) => () => actions.setSettings({ suggested: { ...s.settings.suggested, [key]: today } })
  const live = s.tasks.filter((t) => !t.archived && !t.completed)
  // (단원을 끝낸 다음 날 떠올리기는 진도 탭 복습 칸에서 묻는다)
  // 2. 계획을 만들고 1주 뒤: 실제 속도
  const exam = s.exams.find((e) => e.selected) ?? null
  for (const t of live) {
    const key = `pace:${t.id}`
    const age = diffDays(t.startDate, today)
    if (t.type !== 'amount' || !t.endDate || age < 7 || age > 14 || s.settings.suggested[key]) continue
    const p = planProgress(s, t, today, exam)
    if (!p.paceEnd || p.paceEnd <= t.endDate) continue
    out.push({ key, lab: `${t.name} · 첫 주`, head: '생각보다 조금 느려요', body: `이 속도면 ${mdKo(p.paceEnd)}에 끝나요. 지금 끝나는 날(${mdKo(t.endDate)})을 지키려면 하루 분량이 늘어나요.`,
      acts: [['끝나는 날 늦추기', () => { actions.saveTask({ ...t, endDate: p.paceEnd! }); answer(key)() }, 's'], ['그대로 지키기', answer(key), 'p']] })
  }
  // 3. 문제집 정답률이 낮은데 잘 안다고 고른 단원이 있을 때
  for (const t of live) {
    const key = `acc:${t.id}`
    if (t.bookMode !== 'workbook' || s.settings.suggested[key]) continue
    const recs = Object.values(s.recs[t.id] ?? {})
    const right = recs.reduce((a, r) => a + (r.right ?? 0), 0)
    const wrong = recs.reduce((a, r) => a + (r.wrong ?? 0), 0)
    const sure = t.chapters?.filter((c) => c.grade === 'high') ?? []
    if (right + wrong < 20 || !sure.length || right / (right + wrong) >= 0.7) continue
    const pct = Math.round((right / (right + wrong)) * 100)
    out.push({ key, lab: t.name, head: `정답률이 ${pct}%예요`, body: `잘 안다고 고른 단원이 ${sure.length}개 있어요. 틀린 문항 위주로 복습을 넣을까요?`,
      acts: [['괜찮아요', answer(key), 's'], ['복습 넣기', () => { for (const c of sure) actions.pullReview(t.id, c.id, today); answer(key)() }, 'p']] })
  }
  // 4. 기록이 2주 쌓였을 때: 요일별 실제 공부 시간 → 공부 가능 시간
  const win = s.settings.studyWindows
  if (win) {
    const since = addDays(today, -28)
    const hist = s.histories.filter((h) => h.date >= since && h.date < today)
    if (hist.length && diffDays(hist.reduce((a, h) => (h.date < a ? h.date : a), today), today) >= 14) {
      const sum = [0, 0, 0, 0, 0, 0, 0]
      for (const h of hist) sum[dow(h.date)] += (h.endedAt - h.startedAt) / 60000
      let best: { d: number; avg: number; cur: number } | null = null
      for (let d = 0; d < 7; d++) {
        const avg = Math.round(sum[d] / 4 / 30) * 30
        const cur = winSum(windowsFor({ ...s, settings: { ...s.settings, windowOverrides: {} } }, addDays(today, (d - dow(today) + 7) % 7 || 7)))
        if (avg >= 60 && Math.abs(avg - cur) >= 60 && (!best || Math.abs(avg - cur) > Math.abs(best.avg - best.cur))) best = { d, avg, cur }
      }
      const key = best ? `dow:${best.d}:${best.avg}` : ''
      if (best && !s.settings.suggested[key]) {
        const b = best
        const per = win.perDay ?? Array.from({ length: 7 }, (_, d) => (d === 0 || d === 6 ? win.weekend : win.weekday))
        const start = per[b.d][0]?.[0] ?? 16 * 60
        out.push({ key, lab: '공부 시간 기록 · 최근 4주', head: `${DOW[b.d]}요일엔 평균 ${dur(b.avg)} 했어요`, body: `공부 가능 시간을 ${DOW[b.d]}요일 ${dur(b.avg)}으로 바꿀까요? 지금은 ${dur(b.cur)}이에요.`,
          acts: [['나중에', answer(key), 's'], [`${dur(b.avg)}으로 바꾸기`, () => { actions.setSettings({ studyWindows: { ...win, perDay: per.map((x, d) => (d === b.d ? [[start, start + b.avg] as Win] : x)) } }); answer(key)() }, 'p']] })
      }
    }
  }
  return out
}
/** 오늘 탭: 제안은 하루에 한 장 (오늘 이미 하나에 답했으면 내일) */
export function SuggestCard({ s, today }: { s: State; today: string }) {
  if (Object.values(s.settings.suggested).includes(today)) return null
  const g = suggestions(s, today)[0]
  if (!g) return null
  return (
    <GuideCard lab={g.lab} head={g.head} body={g.body}>
      {g.acts.map(([l, f, k]) => <button key={l} className={`g-${k}`} onClick={f}>{l}</button>)}
    </GuideCard>
  )
}
