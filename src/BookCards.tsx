// 오늘 탭의 책·인강 카드 (TV15Book · TV15Lec 시안). 요약 위주로, 단원·강의 목록은 접어 둔다.
import { useState } from 'react'
import { Icon, type IconName } from './Icon.tsx'
import { addDays, diffDays, dow } from './date.ts'
import { sumDone, type Task, type TaskKind } from './logic.ts'
import { chapterSpans, planProgress, reviewDue } from './progress.ts'
import { offFor, type State } from './store.ts'
import { behindOf, hm, KIND_NAME } from './todayData.ts'
import { colorOf, type Item } from './view.ts'

const md = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}월 ${Number(d)}일` }
const mdS = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}.${Number(d)}` }
const pct = (r: number) => `${Math.round(r * 100)}%`

const KIND_ICON: Record<TaskKind, IconName> = { book: 'book', lecture: 'lecture', time: 'clock', habit: 'repeat', todo: 'today' }
const KIND_TITLE: Record<TaskKind, string> = { book: '책 · 문제집', lecture: '인강', time: '시간', habit: '습관', todo: '할 일' }

/** 유형 탭 머리: 아이콘 · 이름 · 개수 · 오른쪽 요약 */
export function KindHead({ kind, count, right }: { kind: TaskKind; count: number; right?: React.ReactNode }) {
  return (
    <div className="khead">
      <Icon name={KIND_ICON[kind]} size={16} stroke={2.2} />
      <h2>{KIND_TITLE[kind] ?? KIND_NAME[kind]}</h2>
      <span className="mu">{count}</span>
      {right && <span className="khead-r">{right}</span>}
    </div>
  )
}

/** 오른쪽 요약용 작은 막대 + % */
export const MiniBar = ({ rate }: { rate: number }) => (
  <>오늘 <span className="minibar" aria-hidden="true"><span style={{ width: pct(Math.min(rate, 1)) }} /></span><b>{pct(Math.min(rate, 1))}</b></>
)

/** 끝나는 날 문구: 이대로면 ○월 ○일 끝 (시험 ○일 전) */
function EndLine({ s, t, today, left }: { s: State; t: Task; today: string; left: number }) {
  const exam = s.exams.find((e) => e.selected) ?? null
  const p = planProgress(s, t, today, exam)
  const late = p.vsExam === 'late'
  const tail = exam && p.planEnd && p.vsExam ? (() => { const n = diffDays(p.planEnd, exam.date); return n === 1 ? '시험 전날' : n > 0 ? `시험 ${n}일 전` : n === 0 ? '시험 당일' : `시험 ${-n}일 뒤` })() : ''
  return (
    <div className="bc-foot">
      <span className="mu">남은 {left}{t.unit}</span>
      <span>{p.planEnd ? <>이대로면 <b className={late ? 'bad' : ''}>{md(p.planEnd)}</b> 끝{tail && <span className={late ? 'bad' : 'mu'}> ({tail})</span>}</> : '끝나는 날 없음'}</span>
    </div>
  )
}

function Status({ s, t, today }: { s: State; t: Task; today: string }) {
  const b = behindOf(s, t, today)
  return b > 0 ? <b className="bad nowrap">{b}{t.unit} 밀림</b> : <span className="mu nowrap">예정대로</span>
}

export function BookCard({ s, item, date, today, onEntry, onMenu }: { s: State; item: Item; date: string; today: string; onEntry: () => void; onMenu: () => void }) {
  const { task: t, rec, expect } = item
  const [open, setOpen] = useState(false)
  const recs = s.recs[t.id] ?? {}
  const color = colorOf(s, t)
  const start = t.startPoint ?? 1
  const before = sumDone(recs, date)
  const doneAll = Math.min(sumDone(recs), t.amount)
  const from = start + before
  const to = from + Math.max(expect, 1) - 1
  const pos = start + doneAll - 1
  const doneToday = rec?.done ?? 0
  let past = 0
  for (const d in recs) if (d < today) past += recs[d].expect ?? 0
  const planned = Math.min(past / Math.max(t.amount, 1), 1)
  const chapters = t.chapters ?? []
  const cur = chapters.find((c) => c.to >= pos + 1)
  const curIdx = cur ? chapters.indexOf(cur) : -1
  const showCells = t.startPoint !== null && expect > 0 && expect <= 14
  const reviews = reviewDue([t], today).length
  const spans = open ? chapterSpans(t, recs, today, offFor(s, t)) : []
  const workbook = t.bookMode === 'workbook'

  return (
    <section className="tcard bcard" aria-label={t.name}>
      <div className="bc-h" role="button" tabIndex={0} onClick={onEntry} onKeyDown={(e) => e.key === 'Enter' && onEntry()}>
        <i className="dot" style={{ background: color }} />
        <b className="bc-name">{t.name}</b>
        {cur && <span className="bc-sub">{workbook ? cur.name : `${curIdx + 1}단원 ${cur.name}`}</span>}
        <span className="grow" />
        <Status s={s} t={t} today={today} />
      </div>
      <div className="bc-row"><span className="mu">오늘 {t.startPoint !== null && expect > 1 ? `${from}~${to}${t.unit}` : `${expect}${t.unit}`}</span><span><b>{doneToday}</b><span className="mu"> / {expect}{t.unit}</span></span></div>
      {showCells && (
        <div className="cells ro" role="img" aria-label={`오늘 ${from}~${to}${t.unit} 중 ${doneToday}${t.unit} 함`} onClick={onEntry}>
          {Array.from({ length: to - from + 1 }, (_, i) => from + i).map((n) => <span key={n} className={n < from + doneToday ? 'on' : ''} style={n < from + doneToday ? { background: color } : undefined}>{n}</span>)}
          <span className="rib" style={{ left: `${Math.min(doneToday / (to - from + 1), 1) * 100}%` }} aria-hidden="true" />
        </div>
      )}
      <div className="bc-row"><span className="mu">{workbook ? '문제집 전체' : `책 전체${chapters.length ? ` · ${chapters.length}단원` : ''}`}</span><span><b>{doneAll}</b><span className="mu"> / {t.amount}{t.unit} · {pct(doneAll / Math.max(t.amount, 1))}</span></span></div>
      <div className="cbar" role="img" aria-label={`전체 ${t.amount}${t.unit} 중 ${doneAll}${t.unit}, 예정 위치 ${pct(planned)}`}>
        {chapters.length > 0 && !workbook ? chapters.map((c) => {
          const len = c.to - c.from + 1
          return <span key={c.id} style={{ flexGrow: len }}><span style={{ width: `${Math.max(0, Math.min(1, (pos - c.from + 1) / len)) * 100}%`, background: color }} /></span>
        }) : <span style={{ flexGrow: 1 }}><span style={{ width: pct(doneAll / Math.max(t.amount, 1)), background: color }} /></span>}
        <i className="tick-exp" style={{ left: pct(planned) }} aria-hidden="true" />
      </div>
      {chapters.length > 0 && (
        <button className="bc-row bc-fold" aria-expanded={open} onClick={() => setOpen(!open)}>
          <b>단원별 진행</b>
          <span><b>{chapters.filter((c) => c.doneDate).length}</b><span className="mu"> / {chapters.length}단원 끝</span>{reviews > 0 && <b className="bad"> · 복습 {reviews}</b>}<Icon name={open ? 'left' : 'right'} size={14} /></span>
        </button>
      )}
      {open && (
        <ul className="chlist">
          {spans.map((sp, i) => {
            const c = sp.chapter
            const len = c.to - c.from + 1
            const isCur = !c.doneDate && sp.doneIn > 0
            const g = c.grade === 'high' ? '상' : c.grade === 'mid' ? '중' : c.grade === 'low' ? '하' : ''
            return (
              <li key={c.id} className={isCur ? 'cur' : ''}>
                <span className={`cn${c.doneDate ? ' on' : ''}`} style={c.doneDate ? { background: color } : isCur ? { border: 0, background: `conic-gradient(${color} 0 ${Math.round((sp.doneIn / len) * 100)}%, var(--trk) 0)` } : undefined}>{c.doneDate && <Icon name="check" size={12} stroke={3.2} />}</span>
                <span className="cl-name"><small>{i + 1}</small> {c.name}</span>
                <span className="cl-meta">{c.doneDate ? `${mdS(c.doneDate)} 끝${g ? ` · 이해 ${g}` : ''}` : isCur ? `${sp.doneIn} / ${len}${t.unit}` : sp.start ? `${mdS(sp.start)} 시작` : '예정'}</span>
              </li>
            )
          })}
        </ul>
      )}
      <EndLine s={s} t={t} today={today} left={t.amount - doneAll} />
      <button className="bc-more" aria-label={`${t.name} 메뉴`} onClick={onMenu}><Icon name="more" size={18} /></button>
    </section>
  )
}

export function LectureCard({ s, item, date, today, onEntry, onMenu }: { s: State; item: Item; date: string; today: string; onEntry: () => void; onMenu: () => void }) {
  const { task: t, rec, expect } = item
  const [open, setOpen] = useState(false)
  const recs = s.recs[t.id] ?? {}
  const color = colorOf(s, t)
  const start = t.startPoint ?? 1
  const doneAll = Math.min(sumDone(recs), t.amount)
  const lectures = t.lectures ?? Array.from({ length: t.amount }, (_, i) => ({ title: `${start + i}${t.unit || '강'}`, min: null }))
  const curIdx = Math.min(doneAll, t.amount - 1)
  const cur = lectures[curIdx]
  const label = (i: number) => { const l = lectures[i]; const n = `${start + i}강`; return l?.title && l.title !== n ? `${n} ${l.title}` : n }
  // 지금 강의: 오늘 공부 시간 / 강의 길이
  const sec = rec?.sec ?? 0
  const lecSec = (cur?.min ?? 0) * 60
  // 이번 주 범위 (월~일)
  const monday = addDays(today, -((dow(today) + 6) % 7))
  const beforeWeek = Math.min(sumDone(recs, monday), t.amount)
  const off = offFor(s, t)
  const spans = chapterSpans({ ...t, chapters: lectures.map((l, i) => ({ id: String(i), name: l.title, from: start + i, to: start + i })) }, recs, today, off)
  const weekEnd = addDays(monday, 6)
  const weekIdx = spans.map((sp, i) => (sp.end && sp.end >= monday && sp.end <= weekEnd ? i : -1)).filter((i) => i >= 0)
  const weekDone = Math.max(doneAll - beforeWeek, 0)
  const first = Math.max(curIdx - 3, 0)
  const shown = open ? spans.map((_, i) => i) : spans.map((_, i) => i).slice(first, first + 7)

  return (
    <>
      <section className="tcard bcard" aria-label={t.name}>
        <div className="bc-h" role="button" tabIndex={0} onClick={onEntry} onKeyDown={(e) => e.key === 'Enter' && onEntry()}>
          <i className="dot" style={{ background: color }} />
          <b className="bc-name">{t.name}</b>
          {doneAll < t.amount && <span className="bc-sub">{label(curIdx)}</span>}
          <span className="grow" />
          <Status s={s} t={t} today={today} />
        </div>
        {lecSec > 0 && doneAll < t.amount && (
          <>
            <div className="playbar" aria-hidden="true"><span style={{ width: pct(Math.min(sec / lecSec, 1)), background: color }} /></div>
            <div className="bc-row"><span><b>{hm(sec)}</b><span className="mu"> / {hm(lecSec)}</span></span><span className="mu">{Math.max(Math.ceil((lecSec - sec) / 60), 0)}분 남음</span></div>
          </>
        )}
        <div className="bc-row"><span className="mu">강의 전체</span><span><b>{doneAll}</b><span className="mu"> / {t.amount}{t.unit || '강'} · {pct(doneAll / Math.max(t.amount, 1))}</span></span></div>
        {t.amount <= 60 && (
          <div className="lec big" role="img" aria-label={`${t.amount}강 중 ${doneAll}강 끝`}>
            {lectures.map((_, i) => <i key={i} style={{ background: i < doneAll ? color : 'var(--trk)', boxShadow: i === doneAll ? `inset 0 0 0 2px ${color}` : weekIdx.includes(i) ? `inset 0 -3px 0 ${color}` : undefined }} />)}
          </div>
        )}
        <div className="bc-row"><span className="mu">이번 주 {weekIdx.length}강 중 {weekDone}강{expect > 0 ? ` · 오늘 ${expect}강` : ''}</span></div>
        <EndLine s={s} t={t} today={today} left={t.amount - doneAll} />
        <button className="bc-more" aria-label={`${t.name} 메뉴`} onClick={onMenu}><Icon name="more" size={18} /></button>
      </section>
      <section className="tcard tight" aria-label="강의 목록">
        <button className="bc-row bc-fold pad" aria-expanded={open} onClick={() => setOpen(!open)}>
          <b>강의 목록</b>
          <span><b>{doneAll}</b><span className="mu"> / {t.amount}강{weekIdx.length ? ` · 이번 주 ${start + weekIdx[0]}~${start + weekIdx[weekIdx.length - 1]}강` : ''}</span><Icon name={open ? 'left' : 'right'} size={14} /></span>
        </button>
        <ul className="chlist">
          {shown.map((i) => {
            const sp = spans[i]
            const done = i < doneAll
            const isCur = i === doneAll
            return (
              <li key={i} className={isCur ? 'cur' : ''}>
                <span className={`cn${done ? ' on' : ''}`} style={done ? { background: color } : isCur ? { border: 0, background: `conic-gradient(${color} 0 ${lecSec ? Math.round(Math.min(sec / lecSec, 1) * 100) : 0}%, var(--trk) 0)` } : undefined}>{done && <Icon name="check" size={12} stroke={3.2} />}</span>
                <span className="cl-name">{label(i)}</span>
                <span className="cl-meta">{done ? (sp?.end ? `${mdS(sp.end)} 끝` : '끝') : isCur ? (lecSec ? `${hm(sec)} / ${hm(lecSec)}` : '듣는 중') : sp?.end ? `${mdS(sp.end)} 예정` : '예정'}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </>
  )
}
