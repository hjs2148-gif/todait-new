// 학습 위젯 (design/gen 의 WG*·WC* 시안): 칸 격자(작게 1×1 · 넓게 2×1 · 크게 2×2), 과목색 틴트 + 주인공 한 장.
// 좁게 = 질문 하나에 답하는 숫자 하나, 넓게 = 이유 + 다음 행동, 크게 = 그 위에 자세한 내용. 누르면 자세히 시트.
import { Dur } from './ui.tsx'
import { useState, type ReactNode } from 'react'
import { addDays, diffDays } from './date.ts'
import type { Chapter, Task } from './logic.ts'
import { nextDue } from './recall.ts'
import { roundTask } from './rounds.ts'
import { actions, uid, type State, type WidgetSize } from './store.ts'
import { behindOf, finishClock, hm, remainSec, type DayStats } from './todayData.ts'
import { colorOf, type Item } from './view.ts'
import { examFor, SlackCal, slackRows } from './Guide.tsx'
import { IconChip, WSec, WSheet, type WIconName } from './WSheet.tsx'

type Icon = WIconName
/** "22:18" → "밤 10시 18분" */
export const clockWord = (hhmm: string) => {
  const m = hhmm.match(/(\d+):(\d+)/)
  if (!m) return hhmm
  const h = Number(m[1]) % 24
  const part = h < 6 ? '새벽' : h < 12 ? '오전' : h < 18 ? '오후' : h < 21 ? '저녁' : '밤'
  return `${part} ${h % 12 || 12}시${Number(m[2]) ? ` ${Number(m[2])}분` : ''}`
}
export const mdKo = (iso: string) => `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8))}일`

/** 위젯 칸: 라벨 앞 아이콘 칩, 한 과목이면 그 과목색 틴트, 주인공이면 먹색 */
export function Tile({ size, icon, label, right, tint, hero, onOpen, children }: { size: WidgetSize; icon: Icon; label: string; right?: ReactNode; tint?: string | null; hero?: boolean; onOpen?: () => void; children: ReactNode }) {
  return (
    <section className={`tile ${size}${hero ? ' hero' : ''}${onOpen ? ' tap' : ''}`} aria-label={label}
      style={tint && !hero ? { background: `color-mix(in srgb, ${tint} 15%, var(--sf))` } : undefined}
      onClick={(e) => { if (onOpen && !(e.target as HTMLElement).closest('button')) onOpen() }}>
      <div className="t-hd"><span className="t-lab"><IconChip icon={icon} tint={hero ? null : tint} />{label}</span>{right}</div>
      {children}
    </section>
  )
}
export const Bar = ({ p, color, w = 56 }: { p: number; color: string; w?: number }) => <span className="t-bar" style={{ width: w }}><i style={{ width: `${Math.round(Math.min(1, p) * 100)}%`, background: color }} /></span>
export const startTimer = (s: State, t: Task, today: string) => { if (s.timer) actions.stopTimer(); actions.startTimer(t.id, today) }

// ── 오늘 진행 ──
const amountText = (i: Item) => i.task.type === 'time' ? `${hm(i.rec?.sec ?? 0)}/${hm(i.expect)}` : i.task.type === 'check' ? (i.rec?.checked ? '했음' : '할 일') : `${i.rec?.done ?? 0}/${i.expect}${i.task.unit}`
export function ProgressWidget({ s, size, date, today, stats }: { s: State; size: WidgetSize; date: string; today: string; stats: DayStats }) {
  const [open, setOpen] = useState(false)
  const items = stats.active.filter((i) => i.expect > 0 || i.task.type === 'check')
  const pct = items.length ? Math.round((items.reduce((a, i) => a + i.rate, 0) / items.length) * 100) : null
  const doneN = items.filter((i) => i.rate >= 1).length
  const end = date === today && stats.remain > 0 ? clockWord(finishClock(stats.remain)) : null
  const next = items.find((i) => i.rate < 1)
  const hero = size === 's4'
  const plan = date === today ? items.filter((i) => i.rate < 1) : undefined
  const endText = end ? <>이대로면 <b>{end}</b> 끝</> : pct === 100 ? '오늘 다 했어요' : items.length ? '' : '오늘 할 계획이 없어요'
  const rows = (n: number, withV: boolean) => items.slice(0, n).map((i) => (
    <div key={i.task.id} className="t-row"><span className="t-dot" style={{ background: colorOf(s, i.task) }} /><span className="t-nm">{i.task.name}</span><Bar p={i.rate} color={colorOf(s, i.task)} />{withV && <span className="t-v">{amountText(i)}</span>}</div>
  ))
  return (
    <>
      <Tile size={size} icon="progress" label="오늘 진행" hero={hero} onOpen={() => setOpen(true)} right={size !== 's1' && size !== 's2' && end ? <span className="t-r">{endText}</span> : undefined}>
        {size === 's1' && <>
          <span className="t-num">{pct ?? '—'}<small>%</small></span>
          <div className="t-seg">{items.slice(0, 6).map((i) => <i key={i.task.id}><b style={{ width: `${Math.round(i.rate * 100)}%`, background: colorOf(s, i.task) }} /></i>)}</div>
          <span className="t-sub">{endText}</span>
        </>}
        {size === 's2' && <div className="t-cols"><div className="l"><span className="t-num">{pct ?? '—'}<small>%</small></span><span className="t-sub">{endText}</span></div><div className="r"><Sessions s={s} date={date} plan={plan} review={stats.reviewSec} /></div></div>}
        {size === 's4' && <>
          <span className="t-num">{pct ?? '—'}<small>% · {items.length}개 중 {doneN}개 끝</small></span>
          <Sessions s={s} date={date} plan={plan} ticks review={stats.reviewSec} />
          <div className="t-kv">
            <div><small>공부한 시간</small><b><Dur sec={stats.sec} /></b></div>
            <div><small>남은 공부</small><b>{stats.remain > 0 ? <Dur sec={stats.remain} /> : '없음'}</b></div>
            <div><small>남은 계획</small><b>{items.length - doneN}개</b></div>
          </div>
          {next && date === today && <button className="t-act" onClick={() => startTimer(s, next.task, today)}>다음: {next.task.name} 시작</button>}
        </>}
      </Tile>
      {open && (
        <WSheet icon="progress" title="오늘 진행" onClose={() => setOpen(false)} big={<>{pct ?? '—'}<small>%</small></>}
          sub={<>{items.length}개 중 {doneN}개 끝{end && <> · 이대로면 <b>{end}</b> 끝</>}</>}
          foot={next && date === today ? <button className="primary" onClick={() => { startTimer(s, next.task, today); setOpen(false) }}>다음: {next.task.name} 시작</button> : undefined}>
          <WSec title="오늘 시간 줄"><Sessions s={s} date={date} big plan={plan} review={stats.reviewSec} /></WSec>
          <WSec title="계획별" right={`${doneN} / ${items.length}`}><div className="t-list in-sheet">{rows(items.length, true)}</div></WSec>
        </WSheet>
      )}
    </>
  )
}
/** 오늘 공부한 때: 6시~24시 줄에 과목색 블록 */
export function Sessions({ s, date, big, plan, ticks, review = 0 }: { s: State; date: string; big?: boolean; plan?: Item[]; ticks?: boolean; review?: number }) {
  const hs = s.histories.filter((h) => h.date === date)
  const total = hs.reduce((a, h) => a + (h.endedAt - h.startedAt) / 1000, 0)
  const min = (ms: number) => { const d = new Date(ms); return d.getHours() * 60 + d.getMinutes() }
  const H0 = 6 * 60
  const pos = (m: number) => Math.max(0, Math.min(100, ((m - H0) / (18 * 60)) * 100))
  const x = (m: number) => `${pos(m)}%`
  const colorOfId = (id: string) => { const t = s.tasks.find((y) => y.id === id); return t ? colorOf(s, t) : 'var(--mu)' }
  const nowMs = Date.now()
  const nowM = min(nowMs)
  // 지금 재고 있는 공부도 진하게
  const live = s.timer && s.timer.date === date && s.timer.pausedAt === undefined ? { a: min(s.timer.startedAt), b: nowM, c: colorOfId(s.timer.taskId) } : null
  // 남은 계획: 밀린 것부터, 계획 순서대로 지금부터 이어 붙인다 (이대로면 ○시 끝과 같은 계산)
  const fut: { id: string; a: number; b: number; c: string }[] = []
  if (plan) {
    let cur = nowM
    // 오늘 남은 복습이 먼저 (책갈피색)
    if (review >= 60) { fut.push({ id: '_review', a: cur, b: cur + review / 60, c: 'var(--rib)' }); cur += review / 60 }
    for (const i of [...plan].sort((p, q) => behindOf(s, q.task, date) - behindOf(s, p.task, date) || p.task.order - q.task.order)) {
      let len = remainSec(s, i) / 60
      if (s.timer?.taskId === i.task.id) len = Math.max(0, len - (nowMs - s.timer.startedAt) / 60000)
      if (len < 1) continue
      fut.push({ id: i.task.id, a: cur, b: cur + len, c: colorOf(s, i.task) })
      cur += len
    }
  }
  const showTicks = big || ticks
  const tk: [number, string][] = [[6 * 60, '오전 6시'], [12 * 60, '정오'], [18 * 60, '오후 6시'], [24 * 60, '밤 12시']]
  const nowTick = plan && fut.length > 0 && nowM > H0 && nowM < 24 * 60 ? nowM : null
  const ticksShown = tk.filter(([m]) => nowTick === null || Math.abs(pos(m) - pos(nowTick)) > 20)
  return (
    <div className={`t-ses${big ? ' big' : ''}`}>
      {big ? <span className="t-sm">{total ? `모두 ${hm(total)}` : '아직 공부한 기록이 없어요'}{fut.length > 0 && (review >= 60 ? ' · 옅은 칸은 남은 계획 · 주황 칸은 복습' : ' · 옅은 칸은 남은 계획')}</span> : <span className="t-sm">공부한 때 · {total ? hm(total) : '아직 없어요'}{fut.length > 0 && ticks ? (review >= 60 ? ' · 옅은 칸 남은 계획 · 주황 복습' : ' · 옅은 칸은 남은 계획') : ''}</span>}
      <div className="t-tl" aria-hidden="true">
        {hs.map((h) => { const a = min(h.startedAt); const b = Math.max(a + 6, min(h.endedAt)); return <i key={h.id} style={{ left: x(a), width: `calc(${x(b)} - ${x(a)})`, background: colorOfId(h.taskId) }} /> })}
        {live && <i style={{ left: x(live.a), width: `calc(${x(Math.max(live.b, live.a + 3))} - ${x(live.a)})`, background: live.c }} />}
        {fut.map((f) => <i key={f.id} className="plan" style={{ left: x(f.a), width: `calc(${x(f.b)} - ${x(f.a)} - 2px)`, background: f.c }} />)}
        {nowTick !== null && <b className="t-now" style={{ left: x(nowTick) }} />}
      </div>
      {showTicks && <div className="t-tk" aria-hidden="true">{[...ticksShown.map(([m, l]) => [m, l, ''] as const), ...(nowTick !== null ? [[nowTick, '지금', 'now'] as const] : [])].sort((p, q) => p[0] - q[0]).map(([m, l, c]) => <span key={l} className={c} style={{ left: x(m) }}>{l}</span>)}</div>}
    </div>
  )
}

// 단원 지도에서 쓰는 떠올리기 결과 이름과 단계
const GRADE: Record<string, [string, number]> = { low: ['흐릿', 0], mid: ['절반', 1], high: ['잘', 2] }

// ── 시험까지 여유 ──
export function SlackWidget({ s, size, today }: { s: State; size: WidgetSize; today: string }) {
  const [open, setOpen] = useState<string | null | false>(false)
  const exam = examFor(s, today)
  if (!exam) return <Tile size={size} icon="slack" label="시험까지 여유"><span className="t-sub">더보기에서 시험을 추가하면 보여요</span></Tile>
  const rows = slackRows(s, exam, today)
  const d = diffDays(today, exam.date)
  const r0 = rows[0]
  const row = (r: (typeof rows)[number]) => <div key={r.t.id} className="t-row"><span className={`t-sl${r.slack <= 0 ? ' z' : ''}${r.slack < 0 ? ' late' : ''}`}>{r.slack < 0 ? `늦음 ${-r.slack}일` : `여유 ${r.slack}일`}</span><span className="t-nm">{r.t.name}</span><span className="t-v">{Number(r.end.slice(5, 7))}.{Number(r.end.slice(8))} 끝</span></div>
  return (
    <>
      <Tile size={size} icon="slack" label={size === 's1' ? `${exam.name} D-${d}` : `${exam.name} ${mdKo(exam.date)}`} right={size !== 's1' ? <b className="t-r b">D-{d}</b> : undefined} onOpen={rows.length ? () => setOpen(null) : undefined}>
        {size === 's1' && (r0 ? <><span className={`t-dd${r0.slack < 0 ? ' late' : ''}`}><small>{r0.slack < 0 ? '늦음' : '여유'}</small><b>{Math.abs(r0.slack)}일</b></span><span className="t-sub"><b>{r0.t.name}</b><br />{r0.slack <= 0 ? '가장 빠듯해요' : '모두 시험 전에 끝나요'}</span></> : <span className="t-sub">범위에 든 계획이 없어요</span>)}
        {size !== 's1' && <div className={`t-list${size === 's2' ? ' end' : ''}`}>{rows.slice(0, 3).map(row)}</div>}
        {size === 's4' && r0 && <><span className="t-sm" style={{ marginTop: 10 }}>{r0.t.name} · 끝나는 날과 시험</span><SlackCal end={r0.end} exam={exam.date} today={today} /></>}
      </Tile>
      {open !== false && (
        <WSheet icon="slack" title={exam.name} onClose={() => setOpen(false)} big={<>D-{d}</>} sub={<>{mdKo(exam.date)} · {r0 ? (r0.slack < 0 ? <><b>{r0.t.name}</b>이 시험 뒤에 끝나요</> : r0.slack === 0 ? <><b>{r0.t.name}</b>은 여유가 없어요</> : '모두 시험 전에 끝나요') : ''}</>}>
          <WSec title="계획별 여유" right="눌러서 달력 보기"><div className="t-list in-sheet">{rows.map((r) => <button key={r.t.id} className="t-rowbtn" onClick={() => setOpen(open === r.t.id ? null : r.t.id)}>{row(r)}</button>)}</div></WSec>
          {(() => { const sel = rows.find((r) => r.t.id === open) ?? r0; return sel ? <WSec title={`${sel.t.name} · 끝나는 날과 시험`}><SlackCal end={sel.end} exam={exam.date} today={today} /></WSec> : null })()}
          <p className="ws-note">여유는 이대로 끝나는 날부터 시험 전 마지막 공부일까지 남는 날이에요.</p>
        </WSheet>
      )}
    </>
  )
}

// ── 다시 풀 문항 ──
function wrongOf(s: State, today: string) {
  let best: { t: Task; total: number; last: string; by: Map<string, number>; days: [string, number, number][] } | null = null
  for (const t of s.tasks) {
    if (t.bookMode !== 'workbook' || t.archived) continue
    const recs = s.recs[t.id] ?? {}
    const by = new Map<string, number>()
    const days: [string, number, number][] = []
    let total = 0
    let last = ''
    let pos = t.startPoint ?? 1
    for (const d of Object.keys(recs).sort()) {
      const r = recs[d]
      if ((r.wrong ?? 0) > 0 && diffDays(d, today) <= 30) {
        total += r.wrong!
        days.push([d, r.wrong!, r.right ?? 0])
        if (d > last) last = d
        const c = t.chapters?.find((x) => pos >= x.from && pos <= x.to)
        const k = c?.name ?? '기타'
        by.set(k, (by.get(k) ?? 0) + r.wrong!)
      }
      pos += r.done
    }
    if (total && (!best || total > best.total)) best = { t, total, last, by, days: days.reverse() }
  }
  return best
}
export function WrongWidget({ s, size, today }: { s: State; size: WidgetSize; today: string }) {
  const [open, setOpen] = useState(false)
  const w = wrongOf(s, today)
  if (!w) return <Tile size={size} icon="wrong" label="다시 풀 문항"><span className="t-sub">문제집에서 틀린 문항을 적으면 보여요</span></Tile>
  const ago = diffDays(w.last, today)
  const all = [...w.by.entries()].sort((a, b) => b[1] - a[1])
  const top = all.slice(0, 3)
  const max = Math.max(...all.map((x) => x[1]), 1)
  const tint = colorOf(s, w.t)
  const start = () => { actions.saveTask(roundTask({ task: w.t, kind: 'wrong', from: today, to: addDays(today, 3), amount: w.total, daysLeft: 0 }, uid(), Math.max(0, ...s.tasks.map((x) => x.order)) + 1, Date.now())); setOpen(false) }
  return (
    <>
      <Tile size={size} icon="wrong" label="다시 풀 문항" tint={tint} onOpen={() => setOpen(true)}>
        {size === 's1' && <><span className="t-num">{w.total}<small>{w.t.unit}</small></span><span className="t-sub"><b>{w.t.name}</b><br />{ago === 0 ? '오늘 틀린 것까지' : `틀린 지 ${ago}일 지남`}</span></>}
        {size === 's2' && <div className="t-cols"><div className="l"><span className="t-num">{w.total}<small>{w.t.unit}</small></span><button className="t-act sm" onClick={start}>오답만 풀기</button></div>
          <div className="r">{top.map(([n, v]) => <div key={n} className="t-row"><span className="t-nm">{n}</span><Bar p={v / max} color="var(--ink)" w={48} /><span className="t-v" style={{ width: 18 }}>{v}</span></div>)}<span className="t-sm">{w.t.name}</span></div></div>}
      </Tile>
      {open && (
        <WSheet icon="wrong" tint={tint} title={`다시 풀 문항 · ${w.t.name}`} onClose={() => setOpen(false)} big={<>{w.total}<small>{w.t.unit}</small></>}
          sub={`최근 30일에 틀린 문항이에요. 틀리고 며칠 지나 다시 풀면 가장 잘 남아요.`}
          foot={<button className="primary" onClick={start}>오답만 {w.total}{w.t.unit} 풀기 계획 만들기</button>}>
          <WSec title="단원별"><div className="t-list in-sheet">{all.map(([n, v]) => <div key={n} className="t-row"><span className="t-nm">{n}</span><Bar p={v / max} color="var(--ink)" w={120} /><span className="t-v" style={{ width: 44 }}>{v}{w.t.unit}</span></div>)}</div></WSec>
          <WSec title="날짜별 정답률"><div className="t-list in-sheet">{w.days.slice(0, 7).map(([d, wr, rt]) => (
            <div key={d} className="t-row"><span className="t-nm">{mdKo(d)}</span><span className="t-v">{rt + wr ? `${Math.round((rt / (rt + wr)) * 100)}%` : ''} · 틀림 {wr}</span></div>
          ))}</div></WSec>
        </WSheet>
      )}
    </>
  )
}

// ── 이해도 지도 ──
function mapOf(s: State) {
  let best: { t: Task; last: string } | null = null
  for (const t of s.tasks) {
    if (!t.chapters?.length || t.archived || t.completed) continue
    const last = Object.keys(s.recs[t.id] ?? {}).sort().pop() ?? ''
    if (!best || last > best.last) best = { t, last }
  }
  return best?.t ?? null
}
const gk = (c: Chapter) => (c.grade ? `g${GRADE[c.grade][1]}` : c.doneDate ? 'gq' : 'gn')
export function MapWidget({ s, size }: { s: State; size: WidgetSize }) {
  const [open, setOpen] = useState(false)
  const t = mapOf(s)
  if (!t) return <Tile size={size} icon="umap" label="이해도 지도"><span className="t-sub">목차가 있는 계획을 만들면 보여요</span></Tile>
  const ch = t.chapters!
  const low = ch.filter((c) => c.grade === 'low').length
  const yet = ch.filter((c) => !c.doneDate).length
  const recs = Object.values(s.recs[t.id] ?? {})
  const right = recs.reduce((a, r) => a + (r.right ?? 0), 0)
  const wrong = recs.reduce((a, r) => a + (r.wrong ?? 0), 0)
  const graded = ch.filter((c) => c.grade)
  const conf = graded.length ? graded.reduce((a, c) => a + (c.grade === 'high' ? 1 : c.grade === 'mid' ? 0.5 : 0), 0) / graded.length : null
  const acc = right + wrong >= 10 ? right / (right + wrong) : null
  const squares = <div className={`t-map${size === 's4' ? ' n8' : ''}`}>{ch.slice(0, size === 's4' ? 16 : 8).map((c, i) => <span key={c.id} className={gk(c)}>{i + 1}</span>)}</div>
  return (
    <>
      <Tile size={size} icon="umap" label={`이해도 · ${t.name}`} tint={colorOf(s, t)} onOpen={() => setOpen(true)}>
        {squares}
        {size === 's1' && <span className="t-sub">흐릿 <b>{low}단원</b> · 아직 {yet}</span>}
        {size === 's4' && <>
          <div className="lgd t-lgd"><span><i className="g2" />잘</span><span><i className="g1" />절반</span><span><i className="g0" />흐릿</span><span><i className="gn" />아직</span></div>
          {conf !== null && acc !== null ? <div className="t-cal">
            <div><span>자신감</span><i style={{ width: `${conf * 60}%`, background: 'color-mix(in srgb, var(--ink) 40%, var(--sf))' }} /><b>{Math.round(conf * 100)}%</b></div>
            <div><span>정답률</span><i style={{ width: `${acc * 60}%`, background: 'var(--ink)' }} /><b>{Math.round(acc * 100)}%</b></div>
            <span className="t-q sm">{conf - acc > 0.15 ? '아는 느낌보다 실제가 낮아요.' : '느낌과 실제가 비슷해요.'}</span>
          </div> : <span className="t-sub">문제를 풀어 정답률이 쌓이면 자신감과 비교해 보여 줘요.</span>}
        </>}
      </Tile>
      {open && (
        <WSheet icon="umap" tint={colorOf(s, t)} title={`이해도 · ${t.name}`} onClose={() => setOpen(false)} big={<>{ch.filter((c) => c.grade === 'high').length}<small> / {ch.length}단원 잘 앎</small></>} sub="진도 탭 복습 칸에서 덮고 떠올려 본 결과로 칠해요.">
          {squares}
          {conf !== null && acc !== null && <WSec title="자신감 vs 정답률"><div className="t-cal in"><div><span>자신감</span><i style={{ width: `${conf * 60}%`, background: 'color-mix(in srgb, var(--ink) 40%, var(--sf))' }} /><b>{Math.round(conf * 100)}%</b></div><div><span>정답률</span><i style={{ width: `${acc * 60}%`, background: 'var(--ink)' }} /><b>{Math.round(acc * 100)}%</b></div></div></WSec>}
          <WSec title="단원별"><div className="t-list in-sheet">{ch.map((c, i) => (
            <div key={c.id} className="t-row tall"><span className="t-nm"><b>{i + 1}. {c.name}</b><small>{c.doneDate ? `${mdKo(c.doneDate)} 끝냄` : '아직'}</small></span>
              {c.doneDate && <span className="t-sm">{c.grade ? GRADE[c.grade][0] : '아직 안 떠올림'}{(() => { const n = nextDue(c); return n ? ` · 다음 ${mdKo(n)}` : ' · 졸업' })()}</span>}</div>
          ))}</div></WSec>
        </WSheet>
      )}
    </>
  )
}
