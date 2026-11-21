// 오늘 탭 위쪽 위젯 타일. 편집(순서·크기)은 위젯 편집 화면에서 정한다.
import { addDays, diffDays } from './date.ts'
import type { WidgetSlot } from './model.ts'
import { actions, type State } from './store.ts'
import { reviewDue } from './progress.ts'
import { goalTotals } from './stats.ts'
import { itemsOn } from './view.ts'
import { finishClock, hm, examProgress, recentSecs, streakInfo, subjectSecs, type DayStats } from './todayData.ts'

const DOW = ['일', '월', '화', '수', '목', '금', '토']

function Donut({ s, date, stats }: { s: State; date: string; stats: DayStats }) {
  const subs = subjectSecs(s, date)
  const total = Math.max(stats.target, stats.sec, 1)
  const R = 38
  const C = 2 * Math.PI * R
  let acc = 0
  const pct = stats.timeRate === null ? null : Math.round(stats.timeRate * 100)
  return (
    <div className="donut">
      <svg width="92" height="92" viewBox="0 0 92 92" role="img" aria-label={`오늘 ${hm(stats.sec)}${stats.target ? ` / 목표 ${hm(stats.target)}` : ''}`}>
        <g transform="rotate(-90 46 46)" fill="none" strokeWidth="10" strokeLinecap="round">
          <circle cx="46" cy="46" r={R} stroke="var(--trk)" />
          {subs.map((x, i) => {
            const len = (x.sec / total) * C
            const el = <circle key={i} cx="46" cy="46" r={R} stroke={x.color} strokeDasharray={`${Math.max(0.1, len - (subs.length > 1 ? 9 : 0)).toFixed(1)} ${C.toFixed(1)}`} strokeDashoffset={(-acc).toFixed(1)} />
            acc += len
            return el
          })}
        </g>
      </svg>
      <span className="donut-c">{pct !== null && pct >= 100 ? <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label="목표 채움"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg> : <>{pct === null ? '—' : `${pct}%`}<small>시간</small></>}</span>
    </div>
  )
}

function TodayWidget({ s, date, stats }: { s: State; date: string; stats: DayStats }) {
  const subs = subjectSecs(s, date)
  return (
    <section className="wd wd-wide" aria-label="오늘 공부 시간">
      <Donut s={s} date={date} stats={stats} />
      <div className="wd-body">
        <div className="wd-t">오늘 공부</div>
        <div className="wd-big">{hm(stats.sec)}{stats.target > 0 && <small> / {hm(stats.target)}</small>}</div>
        <div className="legend">{subs.slice(0, 4).map((x) => <span key={x.name}><i style={{ color: x.color }}>●</i> {x.name} {hm(x.sec)}</span>)}</div>
      </div>
    </section>
  )
}

function LeftWidget({ stats, isToday }: { stats: DayStats; isToday: boolean }) {
  return (
    <section className="wd" aria-label="남은 공부">
      <div className="wd-t">남은 공부</div>
      <div className="wd-num">{stats.target > 0 ? hm(stats.remain) : '—'}</div>
      <div className="wd-sub">{stats.target === 0 ? '시간으로 잴 계획이 없어요' : stats.remain === 0 ? '다 했어요' : isToday ? <>지금 속도면<br /><b>{finishClock(stats.remain)} 끝</b></> : '그날 남은 시간'}</div>
    </section>
  )
}

export function ExamWidget({ s, today }: { s: State; today: string }) {
  const exam = s.exams.find((e) => e.selected)
  if (!exam) return <section className="wd" aria-label="시험"><div className="wd-t">시험</div><div className="wd-sub">더보기에서 시험을 추가하면 진도가 보여요</div></section>
  const p = examProgress(s, exam, today)
  const n = diffDays(today, exam.date)
  const L = Math.PI * 50
  const th = Math.PI * (1 - (p?.planned ?? 0))
  const pt = (r: number) => [60 + r * Math.cos(th), 60 - r * Math.sin(th)].map((v) => v.toFixed(1))
  const [x1, y1] = pt(41)
  const [x2, y2] = pt(59)
  const gap = p ? Math.round(p.done * 100) - Math.round(p.planned * 100) : 0
  return (
    <section className="wd" aria-label={`${exam.name} 진도`}>
      <div className="wd-row"><span className="wd-t">{exam.name}</span><b>{n === 0 ? 'D-DAY' : n > 0 ? `D-${n}` : `D+${-n}`}</b></div>
      {p ? (
        <>
          <div className="gauge">
            <svg width="100%" height="66" viewBox="0 0 120 66" preserveAspectRatio="xMidYMax meet" role="img" aria-label={`범위 진도 ${Math.round(p.done * 100)}%, 예정 ${Math.round(p.planned * 100)}%`}>
              <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="var(--trk)" strokeWidth="10" strokeLinecap="round" />
              <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="var(--ink)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(L * p.done).toFixed(1)} ${L.toFixed(1)}`} />
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--bad)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div className="gauge-n">{Math.round(p.done * 100)}%</div>
          </div>
          <div className="wd-sub c">{gap === 0 ? '예정대로' : `예정보다 ${Math.abs(gap)}%p ${gap < 0 ? '뒤' : '앞'}`}</div>
        </>
      ) : <div className="wd-sub">범위에 든 계획이 없어요</div>}
    </section>
  )
}

function WeekWidget({ s, today }: { s: State; today: string }) {
  const secs = recentSecs(s, today, 7)
  const max = Math.max(...secs, 1)
  const total = secs.reduce((a, b) => a + b, 0)
  const names = secs.map((_, i) => DOW[(new Date(today.replace(/-/g, '/')).getDay() + i - 6 + 14) % 7])
  return (
    <section className="wd" aria-label="최근 7일">
      <div className="wd-row"><span className="wd-t">최근 7일</span><b>{hm(total)}</b></div>
      <div className="spark" role="img" aria-label={`최근 7일 공부 시간 합계 ${hm(total)}`}>
        {secs.map((v, i) => (
          <span key={i} className={i === 6 ? 'on' : ''} style={{ height: `${Math.max(Math.round((v / max) * 50), v > 0 ? 4 : 2)}px` }} />
        ))}
      </div>
      <div className="spark-l">{names.map((d, i) => <span key={i} className={i === 6 ? 'on' : ''}>{d}</span>)}</div>
    </section>
  )
}

export function StreakWidget({ s, today }: { s: State; today: string }) {
  const { count, best, doneToday } = streakInfo(s, today, s.settings.streakMinSec)
  const min = Math.round(s.settings.streakMinSec / 60)
  return (
    <section className="wd" aria-label="연속 공부">
      <div className="wd-t">연속 공부</div>
      <div className="wd-num">{count}<small>일</small></div>
      <div className="dots" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} className={i < Math.min(count, 12) ? 'on' : ''} />)}</div>
      <div className="wd-sub">{doneToday ? `최고 ${best}일` : count > 0 ? `오늘 ${min}분이면 ${count + 1}일째` : `오늘 ${min}분이면 시작`}</div>
    </section>
  )
}


function SubjectsWidget({ s, date }: { s: State; date: string }) {
  const subs = subjectSecs(s, date)
  const total = subs.reduce((a, x) => a + x.sec, 0)
  return (
    <section className="wd" aria-label="과목 비중">
      <div className="wd-t">과목 비중</div>
      {total === 0 ? <div className="wd-sub">오늘 공부하면 보여요</div> : (
        <>
          <div className="split slim" role="img" aria-label={subs.map((x) => `${x.name} ${Math.round((x.sec / total) * 100)}%`).join(', ')}>{subs.map((x) => <i key={x.name} style={{ flexGrow: x.sec, background: x.color }} />)}</div>
          <div className="legend one">{subs.slice(0, 3).map((x) => <span key={x.name}><i style={{ color: x.color }}>●</i> {x.name} {Math.round((x.sec / total) * 100)}%</span>)}</div>
        </>
      )}
    </section>
  )
}

function ReviewWidget({ s, today }: { s: State; today: string }) {
  const r = reviewDue(s.tasks, today)[0]
  return (
    <section className="wd" aria-label="다음 복습">
      <div className="wd-t">다음 복습</div>
      {r ? <><div className="wd-name">{r.index + 1}단원 {r.chapter.name}</div><div className="wd-sub">{r.task.name} · {r.days}일 지남</div></> : <div className="wd-sub">복습할 단원이 없어요</div>}
    </section>
  )
}

function WeekGoalWidget({ s, today }: { s: State; today: string }) {
  const g = goalTotals(s, { from: addDays(today, -6), to: today, days: 7 }, today)
  return (
    <section className="wd" aria-label="이번 주 목표">
      <div className="wd-t">이번 주 목표</div>
      <div className="wd-num">{g.rate === null ? '—' : Math.round(g.rate * 100)}<small>%</small></div>
      <div className="wd-sub">목표 {g.total}개 중 {g.done}개 · 개수</div>
    </section>
  )
}

function TomorrowWidget({ s, today }: { s: State; today: string }) {
  const tm = addDays(today, 1)
  const first = itemsOn(s, tm, today).active[0]
  return (
    <section className="wd" aria-label="내일 미리 보기">
      <div className="wd-t">내일 미리 보기</div>
      {first ? <><div className="wd-name">{first.task.name}</div><div className="wd-sub">{first.task.type === 'time' ? hm(first.expect) : first.task.type === 'check' ? '체크' : `${first.expect}${first.task.unit}`}</div></> : <div className="wd-sub">내일은 쉬어요</div>}
    </section>
  )
}

function MemoWidget({ s }: { s: State }) {
  let best: { date: string; note: string; name: string } | null = null
  for (const t of s.tasks) for (const [d, r] of Object.entries(s.recs[t.id] ?? {})) if (r.note && (!best || d > best.date)) best = { date: d, note: r.note, name: t.name }
  return (
    <section className="wd" aria-label="오늘 메모">
      <div className="wd-t">오늘 메모</div>
      {best ? <><div className="wd-note">{best.note}</div><div className="wd-sub">{best.name}</div></> : <div className="wd-sub">분량 입력에서 한 줄을 남기면 보여요</div>}
    </section>
  )
}

function QuickStartWidget({ s, today }: { s: State; today: string }) {
  const last = [...s.histories].sort((a, b) => b.endedAt - a.endedAt).map((h) => s.tasks.find((t) => t.id === h.taskId)).find((t) => t && !t.archived && !t.completed)
  return (
    <section className="wd" aria-label="바로 시작">
      <div className="wd-t">바로 시작</div>
      {last ? <><div className="wd-name">{last.name}</div><button className="go sm" onClick={() => { if (s.timer) actions.stopTimer(); actions.startTimer(last.id, today) }}>시작</button></> : <div className="wd-sub">스톱워치를 쓰면 마지막 계획이 보여요</div>}
    </section>
  )
}

function renderWidget(slot: WidgetSlot, s: State, date: string, today: string, stats: DayStats) {
  switch (slot.id) {
    case 'today': return <TodayWidget key={slot.id} s={s} date={date} stats={stats} />
    case 'left': return <LeftWidget key={slot.id} stats={stats} isToday={date === today} />
    case 'exam': return <ExamWidget key={slot.id} s={s} today={today} />
    case 'week': return <WeekWidget key={slot.id} s={s} today={today} />
    case 'streak': return <StreakWidget key={slot.id} s={s} today={today} />
    case 'subjects': return <SubjectsWidget key={slot.id} s={s} date={date} />
    case 'review': return <ReviewWidget key={slot.id} s={s} today={today} />
    case 'weekGoal': return <WeekGoalWidget key={slot.id} s={s} today={today} />
    case 'tomorrow': return <TomorrowWidget key={slot.id} s={s} today={today} />
    case 'memo': return <MemoWidget key={slot.id} s={s} />
    case 'quickStart': return <QuickStartWidget key={slot.id} s={s} today={today} />
    default: return null
  }
}

/** 넓은 위젯은 한 줄, 작은 위젯은 둘씩 묶어 격자로 */
export function Widgets({ s, date, today, stats }: { s: State; date: string; today: string; stats: DayStats }) {
  const out: JSX.Element[] = []
  let small: JSX.Element[] = []
  const flush = () => { if (small.length) out.push(<div className="wd-grid" key={`g${out.length}`}>{small}</div>); small = [] }
  for (const slot of s.settings.widgets) {
    const el = renderWidget(slot, s, date, today, stats)
    if (!el) continue
    if (slot.wide) { flush(); out.push(el) } else small.push(el)
  }
  flush()
  return <>{out}</>
}
