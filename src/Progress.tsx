// 진도 탭 (RProg · RProgBook · RProgDone) 과 진도 자세히 (RDetail)
import { RecallSheet, ReviewView } from './ReviewTab.tsx'
import { useState } from 'react'
import { SlackCard, slackRows } from './Guide.tsx'
import { Icon } from './Icon.tsx'
import { addDays, diffDays, todayISO } from './date.ts'
import { sumDone, type Grade, type Task } from './logic.ts'
import {
  avgGrade, chapterSpans, examDeadline, examProgress, isProgressTask, monthStack, planProgress, projectEnd, reviewDue, todayReviews,
  studyDaysBetween, taskSec, type PlanProgress,
} from './progress.ts'
import { actions, offFor, useStore, type Exam, type State } from './store.ts'
import { hm } from './todayData.ts'
import { Sheet, Dur } from './ui.tsx'
import { categoryOf, colorOf } from './view.ts'

const md = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}월 ${Number(d)}일` }
const mdS = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}.${Number(d)}` }
const pct = (r: number) => `${Math.round(r * 100)}%`
const GRADE_KO: Record<Grade, string> = { high: '잘', mid: '절반', low: '흐릿' }

/** 이해도 막대 3칸 */
function GradeBars({ g }: { g: Grade }) {
  const n = g === 'high' ? 3 : g === 'mid' ? 2 : 1
  const c = g === 'low' ? 'var(--bad)' : 'var(--ink)'
  return (
    <span className="gbars" aria-label={`떠올리기 ${GRADE_KO[g]}`}>
      {[6.6, 9.2, 11.8].map((h, i) => <i key={i} style={{ height: h, background: i < n ? c : 'var(--trk)' }} />)}
    </span>
  )
}

/** 시험과 떨어진 날 */
const vsExamText = (d: string, exam: Exam) => {
  const n = diffDays(d, exam.date)
  return n > 0 ? `시험 ${n}일 전` : n === 0 ? '시험 당일' : `시험 ${-n}일 뒤`
}

/** 지금~오늘 예정 사이 빗금 (과목색) */
const stripe = (color: string) => `repeating-linear-gradient(135deg, color-mix(in srgb, ${color} 55%, transparent) 0 2.5px, color-mix(in srgb, ${color} 16%, transparent) 2.5px 6px)`
/** 예정 꼬리표: 위치(%)에 따라 가운데·왼쪽·오른쪽 맞춤 */
function PlanTag({ x, text }: { x: number; text: string }) {
  const side = x < 18 ? 'l' : x > 82 ? 'r' : 'c'
  return <>
    <span className={`ptag ${side}`} style={side === 'c' ? { left: `${x}%` } : undefined}>{text}</span>
    <i className="ptag-c" style={{ left: `${x}%` }} aria-hidden="true" />
  </>
}

/** 단원 블록(안에 단원 번호) + 지금~예정 빗금 + 예정 꼬리표. 인강은 한 강 = 한 칸 */
export function PlanBar({ s, p, tall }: { s: State; p: PlanProgress; tall?: boolean }) {
  const t = p.task
  const color = colorOf(s, t)
  const start = t.startPoint ?? 1
  const amount = Math.max(t.amount, 1)
  const showTag = !t.completed && p.planned > 0 && p.planned < amount && p.planned !== p.done
  if (t.kind === 'lecture' && t.amount <= 60) {
    const cols = Math.min(t.amount, 15)
    const ti = p.planned - 1
    const tx = ((ti % cols) + 0.5) / cols * 100
    return (
      <div className={`pwrap${showTag ? ' tagged' : ''}`}>
        {showTag && <PlanTag x={tx} text={`오늘 ${p.planned}강까지`} />}
        <div className="plec" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} role="img" aria-label={`${t.amount}강 중 ${p.done}강 끝, 오늘 예정 ${p.planned}강`}>
          {Array.from({ length: t.amount }, (_, i) => <span key={i} className={i === ti && showTag ? 'at' : ''} style={{ background: i < p.done ? color : i < p.planned ? stripe(color) : undefined }} />)}
        </div>
      </div>
    )
  }
  const parts = t.chapters?.length ? t.chapters.map((c, i) => ({ key: c.id, len: c.to - c.from + 1, from: c.from, label: /^[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+/.exec(c.name)?.[0] ?? String(i + 1) })) : [{ key: 'all', len: amount, from: start, label: '' }]
  const inside = parts.length > 1 && parts.length <= 12
  const done = start + p.done - 1
  const plan = start + p.planned - 1
  const frac = (v: number, c: { from: number; len: number }) => Math.max(0, Math.min(1, (v - c.from + 1) / c.len))
  const tx = (p.planned / amount) * 100
  return (
    <div className={`pwrap${showTag ? ' tagged' : ''}`}>
      {showTag && <PlanTag x={tx} text={`오늘 ${t.kind === 'lecture' ? `${p.planned}강` : `${plan}${t.unit}`}까지`} />}
      <div className={`pbar${inside ? ' in' : ''}${tall ? ' tall' : ''}`} role="img" aria-label={`${t.amount}${t.unit} 중 ${p.done}${t.unit}, 오늘 예정 ${p.planned}${t.unit}`}>
        {parts.map((c) => {
          const f = frac(done, c), pf = frac(plan, c)
          return (
            <span key={c.key} style={{ flex: c.len }}>
              {pf > f && <span className="st" style={{ left: `${f * 100}%`, width: `${(pf - f) * 100}%`, background: stripe(color) }} />}
              <span className="fd" style={{ width: `${f * 100}%`, background: color }} />
              {inside && <b className={f >= 0.5 ? 'on' : ''}>{c.label}</b>}
            </span>
          )
        })}
      </div>
      {parts.length > 12 && <div className="pnums">{parts.map((c) => <span key={c.key} style={{ flex: c.len }}>{c.label}</span>)}</div>}
    </div>
  )
}

function statusOf(p: PlanProgress) {
  const u = p.task.unit
  if (p.task.completed) return { text: '끝냄', bad: false }
  if (p.vsExam === 'late') return { text: '시험 뒤에 끝남', bad: true }
  if (p.behind > 0) return { text: `예정보다 ${p.behind}${u} 뒤`, bad: false }
  if (p.behind < 0) return { text: `예정보다 ${-p.behind}${u} 앞`, bad: false }
  return { text: '예정대로', bad: false }
}

function PlanCard({ s, p, exam, open }: { s: State; p: PlanProgress; exam: Exam | null; open: () => void }) {
  const t = p.task
  const st = statusOf(p)
  const where = t.kind === 'lecture'
    ? (() => { const i = p.done; const l = t.lectures?.[i]; return i < t.amount ? `${(t.startPoint ?? 1) + i}${t.unit || '강'}${l?.title && l.title !== `${i + 1}강` ? ` ${l.title}` : ''}` : '다 들었어요' })()
    : p.chapter ? `${(t.chapters!.indexOf(p.chapter) + 1)}단원 ${p.chapter.name}` : ''
  return (
    <section className="tcard pcard" aria-label={t.name} role="button" tabIndex={0} onClick={open} onKeyDown={(e) => e.key === 'Enter' && open()}>
      <div className="pc-1"><span className="pc-name"><i className="dot" style={{ background: colorOf(s, t) }} /><b>{t.name}</b></span><span className={st.bad ? 'bad strong' : 'mu'}>{st.text}</span></div>
      <div className="pc-2"><span>{where}</span><span><b>{p.done}</b> / {t.amount}{t.unit} · {pct(p.rate)}</span></div>
      <PlanBar s={s} p={p} />
      <div className="pc-foot">
        {p.planEnd ? (
          <span>{p.vsExam === 'late' ? '이대로면' : '계획대로면'} <b className={p.vsExam === 'late' ? 'bad' : ''}>{md(p.planEnd)}</b> 끝</span>
        ) : <span>끝나는 날 없음</span>}
        <span className={p.vsExam === 'late' ? 'bad' : 'mu'}>{exam && p.planEnd && p.vsExam ? vsExamText(p.planEnd, exam) : p.paceEnd ? `지금 속도면 ${mdS(p.paceEnd)}` : ''}</span>
      </div>
      {p.vsExam === 'late' && p.needPerDay && p.needEnd && (
        <div className="suggest" onClick={(e) => e.stopPropagation()}>
          <span className="grow">하루 {p.needPerDay}{t.unit}씩 하면 <b>{md(p.needEnd)}</b>에 끝나요</span>
          <button className="chip dark" onClick={() => actions.patchTask(t.id, { endDate: p.needEnd })}>계획 바꾸기</button>
        </div>
      )}
    </section>
  )
}

function ExamCard({ s, exam, plans, reviews, today }: { s: State; exam: Exam; plans: PlanProgress[]; reviews: number; today: string }) {
  const ep = examProgress(s, exam, today)
  const n = diffDays(today, exam.date)
  const inScope = plans.filter((p) => p.vsExam !== null)
  const gap = ep ? Math.round(ep.done * 100) - Math.round(ep.planned * 100) : 0
  return (
    <section className="tcard" aria-label={`${exam.name} 진도`}>
      <div className="tc-meta"><span>{exam.name} 범위 진도 · {md(exam.date)}</span><b>{n === 0 ? 'D-DAY' : n > 0 ? `D-${n}` : `D+${-n}`}</b></div>
      {ep ? (
        <>
          <div className="ex-big"><b>{pct(ep.done)}</b><span>예정 {pct(ep.planned)}</span><small>{gap === 0 ? '예정대로' : `${Math.abs(gap)}%p ${gap < 0 ? '뒤' : '앞'}`}</small></div>
          <div className="ex-bar" role="img" aria-label={`범위 진도 ${pct(ep.done)}, 예정 ${pct(ep.planned)}`}><div style={{ width: pct(ep.done) }} /><i style={{ left: pct(ep.planned) }} /></div>
          <div className="tc-meta small"><span>계획 {ep.tasks}개를 예상 공부 시간으로 합침</span><span>세로선 = 오늘 위치</span></div>
        </>
      ) : <p className="tc-sub">범위에 든 계획이 없어요. 더보기 → 시험에서 범위를 고르세요.</p>}
      <div className="trio">
        <div><b>{inScope.filter((p) => p.vsExam === 'ok').length}</b><small>시험 전 끝남</small></div>
        <div><b className={inScope.some((p) => p.vsExam === 'late') ? 'bad' : ''}>{inScope.filter((p) => p.vsExam === 'late').length}</b><small>늦어짐</small></div>
        <div><b>{reviews}</b><small>복습할 단원</small></div>
      </div>
    </section>
  )
}

function StackCard({ s, today }: { s: State; today: string }) {
  const ms = monthStack(s, today)
  const cells = [...ms.units.slice(0, 3).map((u) => ({ n: u.amount, l: u.unit, c: colorOf(s, s.tasks.find((t) => t.id === u.taskId)!) })), { n: ms.chapters, l: '단원 끝', c: 'var(--rib)' }]
  return (
    <section className="tcard" aria-label="이번 달에 쌓은 것">
      <div className="tc-meta"><b className="big16">{Number(today.slice(5, 7))}월에 쌓은 것</b><span>{ms.days}일 동안</span></div>
      <div className="stack" style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
        {cells.map((x, i) => <div key={i}><i style={{ background: x.c }} /><b>{x.n}</b><small>{x.l}</small></div>)}
      </div>
    </section>
  )
}

function Shelf({ s, done, doing }: { s: State; done: Task[]; doing: PlanProgress[] }) {
  const maxAmt = Math.max(...[...done, ...doing.map((p) => p.task)].map((t) => t.amount), 1)
  const hgt = (t: Task) => Math.round(110 + (t.amount / maxAmt) * 40)
  const wid = (t: Task) => 34 + Math.round((t.amount / maxAmt) * 6)
  const chapters = s.tasks.reduce((a, t) => a + (t.chapters?.filter((c) => c.doneDate).length ?? 0), 0)
  const allSec = s.tasks.reduce((a, t) => a + taskSec(s.recs[t.id] ?? {}), 0)
  const books = [...done.map((t) => ({ t, f: 1 })), ...doing.map((p) => ({ t: p.task, f: p.rate }))]
  return (
    <section className="tcard" aria-label="내 책장">
      <div className="tc-meta"><b className="big16">내 책장</b><span>끝낸 것 · 진행 중</span></div>
      {books.length === 0 ? <p className="empty tight">책이나 인강을 끝내면 여기 꽂혀요</p> : (
        <div role="img" aria-label={`끝낸 것 ${done.length}개, 진행 중 ${doing.length}개`} className="shelf-wrap">
          <div className="shelf">
            {books.map(({ t, f }, i) => (
              <span key={t.id} style={{ display: 'contents' }}>
                {i === done.length && done.length > 0 && <span className="sh-div" />}
                <span className={`spine${f >= 1 ? ' full' : ''}`} style={{ width: wid(t), height: hgt(t), ...(f >= 1 ? { background: colorOf(s, t) } : {}) }}>
                  {f < 1 && <span className="sp-fill" style={{ height: pct(f), background: `color-mix(in srgb, ${colorOf(s, t)} 40%, var(--pg))` }} />}
                  {f >= 1 && <><span className="band t" /><span className="band b" /></>}
                  <span className="sp-t">{t.name}</span>
                </span>
              </span>
            ))}
          </div>
          <div className="sh-board" />
          <div className="shelf lab">
            {books.map(({ t, f }, i) => (
              <span key={t.id} style={{ display: 'contents' }}>
                {i === done.length && done.length > 0 && <span style={{ width: 9 }} />}
                <span style={{ width: wid(t) }}>{f >= 1 ? (t.completedDate ? mdS(t.completedDate) : '끝') : pct(f)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="trio">
        <div><b>{done.length}권</b><small>끝낸 책·인강</small></div>
        <div><b>{chapters}개</b><small>끝낸 단원</small></div>
        <div><b><Dur sec={allSec} /></b><small>쌓은 시간</small></div>
      </div>
    </section>
  )
}

// ── 진도 자세히 ────────────────────────────────────────────
function Detail({ s, taskId, exam, today, onBack, editTask }: { s: State; taskId: string; exam: Exam | null; today: string; onBack: () => void; editTask: (t: Task) => void }) {
  const t = s.tasks.find((x) => x.id === taskId)
  const [chap, setChap] = useState<string | null>(null)
  if (!t) return null
  const recs = s.recs[t.id] ?? {}
  const off = offFor(s, t)
  const p = planProgress(s, t, today, exam)
  const u = t.unit
  const remaining = t.amount - p.done
  const deadline = exam && p.vsExam ? examDeadline(exam) : t.endDate
  const daysLeft = deadline && deadline >= today ? studyDaysBetween(t, today, deadline, off) : 0
  const need = daysLeft > 0 ? remaining / daysLeft : null
  const f1 = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
  const diff = need !== null && p.pace !== null ? p.pace - need : null
  const spans = chapterSpans(t, recs, today, off)
  const cat = categoryOf(s, t)
  const color = colorOf(s, t)
  // 언제 끝날까: 시작 ~ 가장 늦은 날짜 위에 표시
  const marks = [
    { k: '오늘', d: today, cls: 'now' },
    ...(p.planEnd ? [{ k: '계획', d: p.planEnd, cls: '' }] : []),
    ...(exam ? [{ k: '시험', d: exam.date, cls: 'exam' }] : []),
    ...(p.paceEnd ? [{ k: '지금 속도', d: p.paceEnd, cls: p.paceEnd > (deadline ?? '9999') ? 'bad' : '' }] : []),
  ]
  const lo = t.startDate
  const hi = [...marks.map((m) => m.d), t.endDate ?? today].sort().pop()!
  const span = Math.max(diffDays(lo, hi), 1)
  const x = (d: string) => (diffDays(lo, d) / span) * 100
  const paceGap = p.paceEnd && deadline ? diffDays(deadline, p.paceEnd) : null
  const fix = need !== null && p.pace !== null && p.paceEnd && deadline && p.paceEnd > deadline
    ? (() => { const more = Math.max(Math.ceil(need - p.pace), 1); const end = projectEnd(t, remaining, p.pace + more, today, off); return end ? { more, end } : null })()
    : null
  // 최근 14일
  const days14 = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13)).map((d) => ({ d, done: recs[d]?.done ?? 0, exp: recs[d]?.expect ?? 0, rest: d >= t.startDate && d < today && (recs[d]?.expect ?? 0) === 0 && !recs[d]?.done }))
  const goals = days14.filter((x) => x.exp > 0).map((x) => x.exp)
  const goal = goals.length ? Math.round(goals.reduce((a, b) => a + b, 0) / goals.length) : 0
  const max14 = Math.max(goal, ...days14.map((x) => x.done), 1)

  return (
    <div className="page">
      <header className="nav-h">
        <button className="back" onClick={onBack}><Icon name="left" size={20} />진도</button>
        <button className="chip" onClick={() => editTask(t)}>편집</button>
      </header>
      <div className="tbody">
        <div className="dt-title">
          <h1><i className="dot" style={{ background: color }} />{t.name}</h1>
          <p>{[cat?.name, `${t.amount}${u}`, t.chapters?.length ? `${t.chapters.length}단원` : '', exam && p.vsExam ? `${exam.name} 범위` : ''].filter(Boolean).join(' · ')}</p>
        </div>
        <section className="tcard">
          <div className="ex-big"><b>{p.done} <small>/ {t.amount}{u}</small></b><span className="push">{pct(p.rate)}</span></div>
          <div className="tc-sub">예정 {p.planned}{u} · {p.behind > 0 ? <b className="behind">{p.behind}{u} 늦음</b> : p.behind < 0 ? `${-p.behind}${u} 앞섬` : '예정대로'}</div>
          <PlanBar s={s} p={p} tall />
        </section>
        <div className="wd-grid">
          <section className="wd"><div className="wd-t">필요한 속도</div><div className="wd-num">{need === null ? '—' : f1(Math.round(need * 10) / 10)}<small> {u}/일</small></div><div className="wd-sub">{need === null ? '끝나는 날이 없어요' : `남은 ${remaining}${u} · 공부일 ${daysLeft}일`}</div></section>
          <section className="wd"><div className="wd-t">최근 7일 속도</div><div className="wd-num">{p.pace === null ? '—' : f1(Math.round(p.pace * 10) / 10)}<small> {u}/일</small></div><div className="wd-sub">{diff === null ? '기록이 쌓이면 보여요' : diff < 0 ? `하루 ${f1(Math.round(-diff * 10) / 10)}${u} 모자람` : `하루 ${f1(Math.round(diff * 10) / 10)}${u} 여유`}</div></section>
        </div>
        <section className="tcard">
          <div className="tc-meta"><b className="big16">언제 끝날까</b>{paceGap !== null && exam && p.paceEnd && <span className={paceGap > 0 ? 'bad strong' : ''}>{vsExamText(p.paceEnd, exam)}</span>}</div>
          <div className="tl2" role="img" aria-label={marks.map((m) => `${m.k} ${md(m.d)}`).join(', ')}>
            {marks.map((m, i) => {
              const xx = Math.min(Math.max(x(m.d), 0), 100)
              const row = m.k === '오늘' || m.k === '계획' ? 'up' : m.k === '시험' ? 'down1' : 'down2'
              const shift = xx < 12 ? '0' : xx > 88 ? '-100%' : '-50%'
              return <span key={i} className={`tl-lab ${row} ${m.cls}`} style={{ left: `${xx}%`, transform: `translateX(${shift})` }}>{m.k === '오늘' ? '오늘' : `${m.k} ${mdS(m.d)}`}</span>
            })}
            <div className="tl-track">
              <div className="tl-done" style={{ width: `${x(today)}%`, background: color }} />
              <div className="tl-rest" style={{ left: `${x(today)}%`, right: 0, borderColor: p.paceEnd && deadline && p.paceEnd > deadline ? 'var(--bad)' : 'var(--mu)' }} />
              {marks.map((m) => <span key={m.k} className={`tl-m ${m.cls}`} style={{ left: `${Math.min(Math.max(x(m.d), 0), 100)}%` }}><i /></span>)}
            </div>
            <span className="tl-start">{mdS(lo)}</span>
          </div>
          {fix && <p className="tip">하루 <b>{fix.more}{u}만 더</b> 하면 {md(fix.end)}{exam && fix.end <= examDeadline(exam) ? ', 시험 전에' : '에'} 끝나요.</p>}
        </section>
        <section className="tcard">
          <div className="tc-meta"><b className="big16">최근 14일</b><span>하루 {u} 수{goal > 0 ? ` · 목표 ${goal}${u}` : ''}</span></div>
          <div className="wbars b14" role="img" aria-label="최근 14일 하루 분량">
            {goal > 0 && <span className="goal red" style={{ bottom: `${(goal / max14) * 100}%` }}><b>{goal}{u}</b></span>}
            {days14.map((d) => d.rest ? <em key={d.d}>쉼</em> : <i key={d.d} style={{ height: `${Math.max((d.done / max14) * 100, d.done ? 4 : 1)}%`, background: d.d === today ? `repeating-linear-gradient(135deg, ${color} 0 3px, color-mix(in srgb, ${color} 55%, transparent) 3px 6px)` : d.exp > 0 && d.done >= d.exp ? color : `color-mix(in srgb, ${color} 45%, var(--trk))` }} />)}
          </div>
          <div className="wlab b14l">{days14.map((d, i) => <span key={d.d} className={d.d === today ? 'on' : ''}>{i % 2 ? Number(d.d.slice(8)) : ''}</span>)}</div>
        </section>
        {spans.length > 0 && (
          <>
            <div className="sec-h"><h2>단원 지도</h2><small>{spans.filter((x) => x.chapter.doneDate).length} / {spans.length}단원 끝</small></div>
            <section className="tcard tight">
              {spans.map((sp, i) => {
                const c = sp.chapter
                const len = c.to - c.from + 1
                const cur = !c.doneDate && sp.doneIn > 0
                const review = c.doneDate && reviewDue([t], today).some((r) => r.chapter.id === c.id)
                return (
                  <button key={c.id} className={`cmap${cur ? ' cur' : ''}`} onClick={() => c.doneDate && setChap(c.id)} disabled={!c.doneDate}>
                    <span className={`cn${c.doneDate ? ' on' : ''}`} style={c.doneDate ? { background: color } : cur ? { border: 0, background: `conic-gradient(${color} 0 ${Math.round((sp.doneIn / len) * 100)}%, var(--trk) 0)` } : undefined}>{c.doneDate ? <Icon name="check" size={12} /> : null}</span>
                    <span className="grow">
                      <b className="blk">{i + 1} {c.name}</b>
                      <small className="blk">{c.from}~{c.to}{u}{sp.start ? ` · ${mdS(sp.start)} ~ ${c.doneDate || (sp.planned && !cur) ? (sp.end ? mdS(sp.end) : '') : ''}` : ''}</small>
                    </span>
                    <small className="cm-r">
                      {c.doneDate ? <>{sp.days ? `${sp.days}일 걸림` : ''}{review ? <span className="strong"> · 복습</span> : ''}{c.grade ? <> · 떠올리기 {GRADE_KO[c.grade]}</> : ''}</> : cur ? <b>{sp.doneIn} / {len}{u}</b> : '예정'}
                    </small>
                  </button>
                )
              })}
            </section>
          </>
        )}
      </div>
      {chap && <RecallSheet s={s} taskId={t.id} chapterId={chap} today={today} onClose={() => setChap(null)} />}
    </div>
  )
}

// ── 진도 탭 ────────────────────────────────────────────────
/** 다음에 진도 탭을 열 때 보여 줄 칸 (오늘 탭 복습 줄 → 복습 칸) */
let openView: 'doing' | 'review' | 'done' | null = null
export const openProgressView = (v: 'doing' | 'review' | 'done') => { openView = v }

export function Progress({ editTask }: { editTask: (t: Task | null) => void }) {
  const s = useStore()
  const today = todayISO()
  const [view, setView] = useState<'doing' | 'review' | 'done'>(() => { const v = openView ?? 'doing'; openView = null; return v })
  const [kind, setKind] = useState<'all' | 'book' | 'lecture'>('all')
  const [detail, setDetail] = useState<string | null>(null)
  const exam = s.exams.find((e) => e.selected) ?? null
  const tasks = s.tasks.filter((t) => isProgressTask(t) && !t.archived).sort((a, b) => a.order - b.order)
  const doing = tasks.filter((t) => !t.completed && sumDone(s.recs[t.id] ?? {}) < t.amount).map((t) => planProgress(s, t, today, exam))
  const done = tasks.filter((t) => !doing.some((p) => p.task.id === t.id)).sort((a, b) => (b.completedDate ?? '').localeCompare(a.completedDate ?? ''))
  const reviews = reviewDue(tasks, today)
  const tr = todayReviews(s, today)

  if (detail) return <Detail s={s} taskId={detail} exam={exam} today={today} onBack={() => setDetail(null)} editTask={editTask} />

  const nextExam = () => {
    if (s.exams.length < 2) return
    const i = s.exams.findIndex((e) => e.selected)
    actions.saveExam({ ...s.exams[(i + 1) % s.exams.length], selected: true })
  }
  const shown = doing.filter((p) => kind === 'all' || p.task.kind === kind)
  const count = (k: 'book' | 'lecture') => doing.filter((p) => p.task.kind === k).length
  const lateIn = (k: 'all' | 'book' | 'lecture') => doing.some((p) => p.vsExam === 'late' && (k === 'all' || p.task.kind === k))

  return (
    <div className="page today">
      <header className="th">
        <h1>진도</h1>
        <div className="th-r">
          {exam && <button className="chip" onClick={nextExam} aria-label={s.exams.length > 1 ? '다른 시험 보기' : exam.name}>{exam.name}{s.exams.length > 1 && <span className="chev">▾</span>}</button>}
          <button className="sq ink" onClick={() => editTask(null)} aria-label="새 계획"><Icon name="plus" size={18} /></button>
        </div>
      </header>
      <div className="tbody">
        {/* 시험 카드는 한 장: 여유 목록이 있으면 그것으로(진도 %는 한 줄로), 없으면 예전 진도 카드 */}
        {view === 'doing' && exam && (slackRows(s, exam, today).length ? <SlackCard s={s} exam={exam} today={today} /> : <ExamCard s={s} exam={exam} plans={doing} reviews={reviews.length} today={today} />)}
        {view === 'doing' && <StackCard s={s} today={today} />}
        <div role="tablist" aria-label="보기" className="segs">
          <button role="tab" aria-selected={view === 'doing'} className={view === 'doing' ? 'on' : ''} onClick={() => setView('doing')}>진행 중 {doing.length}</button>
          <button role="tab" aria-selected={view === 'review'} className={view === 'review' ? 'on' : ''} onClick={() => setView('review')}>복습{tr.list.length > 0 && <span className="rv-badge">{tr.list.length}</span>}</button>
          <button role="tab" aria-selected={view === 'done'} className={view === 'done' ? 'on' : ''} onClick={() => setView('done')}>끝낸 것 {done.length}</button>
        </div>
        {view === 'doing' ? (
          <>
            <div role="tablist" aria-label="계획 유형" className="utabs">
              {([['all', '전체', doing.length], ['book', '책', count('book')], ['lecture', '인강', count('lecture')]] as const).map(([k, l, n]) => (
                <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
                  {l}<small>{n}</small>{k !== 'all' && lateIn(k) && <span className="late" aria-label="늦어지는 계획 있음" />}
                </button>
              ))}
            </div>
            {shown.length === 0 && <p className="empty">{tasks.length === 0 ? '책이나 인강 계획을 만들면\n진도가 여기에 보여요.' : '진행 중인 계획이 없어요'}</p>}
            {shown.map((p) => <PlanCard key={p.task.id} s={s} p={p} exam={exam} open={() => setDetail(p.task.id)} />)}
          </>
        ) : view === 'review' ? <ReviewView s={s} today={today} /> : (
          <>
            <Shelf s={s} done={done} doing={doing} />
            <div className="sec-h"><h2>끝낸 계획</h2><small>최근 끝낸 순</small></div>
            <section className="tcard tight">
              {done.length === 0 && <p className="empty tight">아직 끝낸 계획이 없어요</p>}
              {done.map((t) => {
                const g = avgGrade(t)
                const end = t.completedDate ?? today
                return (
                  <div key={t.id} className="rv" role="button" tabIndex={0} onClick={() => setDetail(t.id)}>
                    <span className="cn on" style={{ background: colorOf(s, t), width: 22, height: 22, borderRadius: 11 }}><Icon name="check" size={13} /></span>
                    <span className="grow"><b className="blk ell">{t.name}</b><small className="blk">{mdS(t.startDate)} ~ {mdS(end)} · {diffDays(t.startDate, end) + 1}일</small></span>
                    <span className="rv-r"><span className="blk">{t.amount}{t.unit} · {hm(taskSec(s.recs[t.id] ?? {}))}</span>{g && <small>평균 떠올리기 {GRADE_KO[g]} <GradeBars g={g} /></small>}</span>
                  </div>
                )
              })}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
