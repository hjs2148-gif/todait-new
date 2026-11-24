// 학습 위젯 (design/gen 의 WG*·WC* 시안): 칸 격자(작게 1×1 · 넓게 2×1 · 크게 2×2), 과목색 틴트 + 주인공 한 장.
// 좁게 = 질문 하나에 답하는 숫자 하나, 넓게 = 이유 + 다음 행동, 크게 = 그 위에 자세한 내용. 누르면 자세히 시트.
import { useState, type ReactNode } from 'react'
import { addDays, diffDays } from './date.ts'
import type { Chapter, Task } from './logic.ts'
import { reviewDue } from './progress.ts'
import { roundTask } from './rounds.ts'
import { actions, uid, type State, type WidgetSize } from './store.ts'
import { finishClock, hm, type DayStats } from './todayData.ts'
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
        {size === 's2' && <div className="t-cols"><div className="l"><span className="t-num">{pct ?? '—'}<small>%</small></span><span className="t-sub">{endText}</span></div><div className="r"><Sessions s={s} date={date} /></div></div>}
        {size === 's4' && <>
          <span className="t-num">{pct ?? '—'}<small>% · {items.length}개 중 {doneN}개 끝</small></span>
          <Sessions s={s} date={date} />
          <div className="t-kv">
            <div><small>공부한 시간</small><b>{hm(stats.sec)}</b></div>
            <div><small>남은 공부</small><b>{stats.remain > 0 ? hm(stats.remain) : '없음'}</b></div>
            <div><small>남은 계획</small><b>{items.length - doneN}개</b></div>
          </div>
          {next && date === today && <button className="t-act" onClick={() => startTimer(s, next.task, today)}>다음: {next.task.name} 시작</button>}
        </>}
      </Tile>
      {open && (
        <WSheet icon="progress" title="오늘 진행" onClose={() => setOpen(false)} big={<>{pct ?? '—'}<small>%</small></>}
          sub={<>{items.length}개 중 {doneN}개 끝{end && <> · 이대로면 <b>{end}</b> 끝</>}</>}
          foot={next && date === today ? <button className="primary" onClick={() => { startTimer(s, next.task, today); setOpen(false) }}>다음: {next.task.name} 시작</button> : undefined}>
          <WSec title="공부한 때"><Sessions s={s} date={date} big /></WSec>
          <WSec title="계획별" right={`${doneN} / ${items.length}`}><div className="t-list in-sheet">{rows(items.length, true)}</div></WSec>
        </WSheet>
      )}
    </>
  )
}
/** 오늘 공부한 때: 6시~24시 줄에 과목색 블록 */
export function Sessions({ s, date, big }: { s: State; date: string; big?: boolean }) {
  const hs = s.histories.filter((h) => h.date === date)
  const total = hs.reduce((a, h) => a + (h.endedAt - h.startedAt) / 1000, 0)
  const min = (ms: number) => { const d = new Date(ms); return d.getHours() * 60 + d.getMinutes() }
  const H0 = 6 * 60
  const x = (m: number) => `${Math.max(0, Math.min(100, ((m - H0) / (18 * 60)) * 100))}%`
  return (
    <div className={`t-ses${big ? ' big' : ''}`}>
      {big ? <span className="t-sm">{total ? `모두 ${hm(total)}` : '아직 공부한 기록이 없어요'}</span> : <span className="t-sm">공부한 때 · {total ? hm(total) : '아직 없어요'}</span>}
      <div className="t-tl" aria-hidden="true">{hs.map((h) => { const t = s.tasks.find((x) => x.id === h.taskId); const a = min(h.startedAt); const b = Math.max(a + 6, min(h.endedAt)); return <i key={h.id} style={{ left: x(a), width: `calc(${x(b)} - ${x(a)})`, background: t ? colorOf(s, t) : 'var(--mu)' }} /> })}</div>
      {big && <div className="t-tk" aria-hidden="true">{[6, 12, 18, 24].map((h) => <span key={h} style={{ left: x(h * 60) }}>{h === 24 ? '밤 12' : h > 12 ? `오후 ${h - 12}` : `오전 ${h}`}시</span>)}</div>}
    </div>
  )
}

// ── 오늘 복습 ──
const GRADE: Record<string, [string, number]> = { low: ['흐릿', 0], mid: ['절반', 1], high: ['잘', 2] }
export function ReviewWidget({ s, size, today }: { s: State; size: WidgetSize; today: string }) {
  const [open, setOpen] = useState(false)
  const due = reviewDue(s.tasks, today)
  const first = due[0]
  const row = (r: (typeof due)[number]) => (
    <div key={r.task.id + r.chapter.id} className="t-row"><span className={`t-g g${r.chapter.grade ? GRADE[r.chapter.grade][1] : 'n'}`}>{r.chapter.grade ? GRADE[r.chapter.grade][0] : '모름'}</span><span className="t-nm">{r.chapter.name}</span><span className="t-v">{r.days ? `${r.days}일 지남` : '오늘'}</span></div>
  )
  return (
    <>
      <Tile size={size} icon="review" label={size === 's2' && due.length ? `오늘 복습 · ${due.length}단원` : '오늘 복습'} onOpen={due.length ? () => setOpen(true) : undefined}
        right={size === 's2' && first ? <span className="t-r b">{first.chapter.name}부터 ›</span> : undefined}>
        {size === 's1' && <><span className="t-num">{due.length}<small>단원</small></span><span className="t-sub">{first ? <>먼저 <b>{first.chapter.name}</b><br />{first.chapter.grade ? GRADE[first.chapter.grade][0] : '이해도 모름'} · {first.days}일 지남</> : '복습할 단원이 없어요'}</span></>}
        {size === 's2' && (due.length ? <div className="t-list end">{due.slice(0, 3).map(row)}</div> : <span className="t-sub">복습할 단원이 없어요</span>)}
      </Tile>
      {open && (
        <WSheet icon="review" title="오늘 복습" onClose={() => setOpen(false)} big={<>{due.length}<small>단원</small></>} sub="잊을 때쯤 다시 보면 오래 남아요. 덮고 떠올린 뒤 표시해요.">
          <WSec title="복습할 때가 된 단원" right="흐릿한 것부터"><div className="t-list in-sheet">{due.map((r) => (
            <div key={r.task.id + r.chapter.id} className="t-row tall">
              <span className="t-nm"><b>{r.chapter.name}</b><small>{r.task.name} · {r.days}일 지남</small></span>
              <span className={`t-g g${r.chapter.grade ? GRADE[r.chapter.grade][1] : 'n'}`}>{r.chapter.grade ? GRADE[r.chapter.grade][0] : '모름'}</span>
              <button className="chip" onClick={() => actions.addReview(r.task.id, r.chapter.id, today)}>복습했어요</button>
            </div>
          ))}</div></WSec>
        </WSheet>
      )}
    </>
  )
}

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

// ── 떠올리기 (인출 연습) ──
type Done = { t: Task; c: Chapter; i: number }
const recentDone = (s: State, today: string): Done[] => {
  const out: Done[] = []
  for (const t of s.tasks) if (!t.archived) t.chapters?.forEach((c, i) => { if (c.doneDate && diffDays(c.doneDate, today) <= 14 && c.doneDate < today) out.push({ t, c, i }) })
  return out.sort((a, b) => b.c.doneDate!.localeCompare(a.c.doneDate!))
}
function G3({ d }: { d: Done }) {
  return <div className="t-g3">{(['low', 'mid', 'high'] as const).map((g) => <button key={g} className={d.c.grade === g ? 'on' : ''} aria-pressed={d.c.grade === g} onClick={() => actions.setGrade(d.t.id, d.c.id, g)}>{GRADE[g][0]}</button>)}</div>
}
export function RecallWidget({ s, size, today }: { s: State; size: WidgetSize; today: string }) {
  const [open, setOpen] = useState(false)
  const list = recentDone(s, today)
  const d = list.find((x) => !x.c.grade) ?? list[0]
  const tint = d ? colorOf(s, d.t) : null
  const ago = (x: Done) => { const n = diffDays(x.c.doneDate!, today); return n === 1 ? '어제' : `${n}일 전` }
  if (!d) return <Tile size={size} icon="recall" label="떠올리기"><span className="t-sub">단원을 끝내면 다음 날 물어봐요</span></Tile>
  const left = list.filter((x) => !x.c.grade).length
  return (
    <>
      <Tile size={size} icon="recall" label={size === 's4' ? '떠올리기 · 책을 덮고 핵심 세 가지' : size === 's2' ? `떠올리기 · ${ago(d)} 끝낸 단원` : `${ago(d)} 끝낸 단원 · ${d.c.name}`} tint={tint} onOpen={() => setOpen(true)}>
        {size === 's1' && <><span className="t-q">덮고 떠올려 보면?</span><div className="t-end"><G3 d={d} /></div></>}
        {size === 's2' && <><span className="t-q big">{d.c.name}, 덮고 핵심 세 가지를 떠올려 보면?</span><div className="t-end"><G3 d={d} /></div></>}
        {size === 's4' && <>{list.slice(0, 3).map((x) => <div key={x.t.id + x.c.id} className="t-rc"><span className="t-nm"><b>{x.c.name}</b><small>{ago(x)} 끝냄</small></span><G3 d={x} /></div>)}<span className="t-sub">고른 대로 복습 날짜를 잡아요.</span></>}
      </Tile>
      {open && (
        <WSheet icon="recall" tint={tint} title="떠올리기" onClose={() => setOpen(false)} big={<>{left}<small>단원 남음</small></>}
          sub="책을 덮고 핵심 세 가지를 떠올려 본 뒤 골라요. 다시 읽기보다 떠올리기가 오래 남아요.">
          <WSec title="해 보는 법"><ol className="ws-steps"><li>책과 노트를 덮어요</li><li>단원 이름만 보고 핵심 세 가지를 말하거나 적어요</li><li>펼쳐서 맞춰 보고, 느낌대로 골라요</li></ol></WSec>
          <WSec title="최근 2주 끝낸 단원"><div className="t-list in-sheet">{list.map((x) => (
            <div key={x.t.id + x.c.id} className="t-row tall"><span className="t-dot" style={{ background: colorOf(s, x.t) }} /><span className="t-nm"><b>{x.c.name}</b><small>{x.t.name} · {ago(x)} 끝냄</small></span><span style={{ width: 168, flex: 'none' }}><G3 d={x} /></span></div>
          ))}</div></WSec>
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
        <WSheet icon="umap" tint={colorOf(s, t)} title={`이해도 · ${t.name}`} onClose={() => setOpen(false)} big={<>{ch.filter((c) => c.grade === 'high').length}<small> / {ch.length}단원 잘 앎</small></>} sub="덮고 떠올려 본 느낌으로 골라요. 고른 대로 복습 날짜를 잡아요.">
          {squares}
          {conf !== null && acc !== null && <WSec title="자신감 vs 정답률"><div className="t-cal in"><div><span>자신감</span><i style={{ width: `${conf * 60}%`, background: 'color-mix(in srgb, var(--ink) 40%, var(--sf))' }} /><b>{Math.round(conf * 100)}%</b></div><div><span>정답률</span><i style={{ width: `${acc * 60}%`, background: 'var(--ink)' }} /><b>{Math.round(acc * 100)}%</b></div></div></WSec>}
          <WSec title="단원별"><div className="t-list in-sheet">{ch.map((c, i) => (
            <div key={c.id} className="t-row tall"><span className="t-nm"><b>{i + 1}. {c.name}</b><small>{c.doneDate ? `${mdKo(c.doneDate)} 끝냄` : '아직'}</small></span>
              {c.doneDate && <G3 d={{ t, c, i }} />}</div>
          ))}</div></WSec>
        </WSheet>
      )}
    </>
  )
}
