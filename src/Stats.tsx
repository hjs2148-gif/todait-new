// 통계 (RStats) 와 자세한 통계 (RStatsMore)
import { useState } from 'react'
import { Icon } from './Icon.tsx'
import { addDays, diffDays, dow, todayISO, DOW_KO } from './date.ts'
import { isProgressTask, planProgress } from './progress.ts'
import { subjectVar, useStore, type State } from './store.ts'
import {
  bestStreak, bestWindow, datesBetween, finishedChapters, firstRecord, goalTotals, grassLevel, hourHeat, longestFocus, periodOf, planTotals,
  prevPeriod, secByDaySubject, secOn, subjectSplit, totalSec, weekdayAvg, weeklyGoalTrend, type Period, type PeriodKind,
} from './stats.ts'
import { hm, streakInfo } from './todayData.ts'
import { colorOf } from './view.ts'

const md = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}월 ${Number(d)}일` }
const mdS = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}.${Number(d)}` }
const pctS = (r: number | null) => (r === null ? '—' : `${Math.round(r * 100)}`)
const GRADE_KO = { high: '상', mid: '중', low: '하' } as Record<string, string>

const KINDS: [PeriodKind, string][] = [['week', '이번 주'], ['month', '이번 달'], ['exam', '시험까지']]
const hourName = (h: number) => (h === 24 ? '자정' : h < 12 ? `오전 ${h}시` : h === 12 ? '낮 12시' : `${h < 18 ? '오후' : '저녁'} ${h - 12}시`)

/** 날짜별 공부 시간 막대 (과목색으로 쌓음). 31일이 넘으면 주 단위로 묶는다 */
function DayBars({ s, p }: { s: State; p: Period }) {
  const dates = datesBetween(p.from, p.to)
  const weekly = dates.length > 31
  const groups = weekly
    ? Array.from({ length: Math.ceil(dates.length / 7) }, (_, i) => dates.slice(i * 7, i * 7 + 7))
    : dates.map((d) => [d])
  const data = groups.map((g) => {
    const by: Record<string, number> = {}
    for (const d of g) for (const [k, v] of Object.entries(secByDaySubject(s, d))) by[k] = (by[k] ?? 0) + v
    return { g, by, sum: Object.values(by).reduce((a, b) => a + b, 0) }
  })
  const max = Math.max(...data.map((x) => x.sum), 1)
  const today = todayISO()
  const colorFor = (k: string) => subjectVar(s.categories.find((c) => c.id === k)?.color)
  return (
    <>
      <div className="sbars" role="img" aria-label={`공부 시간 합계 ${hm(data.reduce((a, x) => a + x.sum, 0))}`}>
        <span className="ax" style={{ bottom: '50%' }} /><span className="axl" style={{ bottom: '50%' }}>{hm(max / 2)}</span>
        {data.map((x) => (
          <span key={x.g[0]} className="sb" title={`${mdS(x.g[0])} ${hm(x.sum)}`}>
            <span className="stk" style={{ height: `${(x.sum / max) * 100}%` }}>
              {Object.entries(x.by).sort((a, b) => b[1] - a[1]).map(([k, v]) => <i key={k} style={{ height: `${(v / x.sum) * 100}%`, background: colorFor(k) }} />)}
            </span>
          </span>
        ))}
      </div>
      <div className="wlab sbl">
        {data.map((x, i) => (
          <span key={x.g[0]} className={x.g.includes(today) ? 'on' : ''}>{weekly ? (i % 2 === 0 ? mdS(x.g[0]) : '') : dates.length <= 7 ? DOW_KO[dow(x.g[0])] : Number(x.g[0].slice(8)) % 5 === 0 ? Number(x.g[0].slice(8)) : ''}</span>
        ))}
      </div>
    </>
  )
}

export function Stats() {
  const s = useStore()
  const today = todayISO()
  const [kind, setKind] = useState<PeriodKind>('week')
  const [more, setMore] = useState(false)
  if (more) return <StatsMore s={s} today={today} onBack={() => setMore(false)} />

  const first = firstRecord(s, today)
  const p = periodOf(kind, today, first)
  const prev = prevPeriod(p)
  const total = totalSec(s, p)
  const diff = kind === 'exam' ? null : total - totalSec(s, prev)
  const goals = goalTotals(s, p, today)
  const focus = s.histories.filter((h) => h.date >= p.from && h.date <= p.to && h.endedAt > h.startedAt)
  const avgFocus = focus.length ? focus.reduce((a, h) => a + (h.endedAt - h.startedAt) / 1000, 0) / focus.length : 0
  const longest = longestFocus(s, p, 1)[0]
  const chs = finishedChapters(s, p)
  const st = streakInfo(s, today, s.settings.streakMinSec)
  const best = bestStreak(s, today, s.settings.streakMinSec)
  const split = subjectSplit(s, p)
  const heat = hourHeat(s, p)
  const bins = [6, 9, 12, 15, 18, 21]
  const bw = bestWindow(heat)
  const cell = (d: number, h: number) => heat[d].slice(h, h + 3).reduce((a, b) => a + b, 0)
  const maxCell = Math.max(...[0, 1, 2, 3, 4, 5, 6].flatMap((d) => bins.map((h) => cell(d, h))), 1)
  const plans = planTotals(s, p, today)
  const rowOrder = [1, 2, 3, 4, 5, 6, 0]
  const R = 22
  const C = 2 * Math.PI * R

  return (
    <div className="page today">
      <header className="th">
        <h1>통계</h1>
        <div className="th-r"><button className="chip" onClick={() => setMore(true)}>자세히</button></div>
      </header>
      <div className="tbody">
        <div role="tablist" aria-label="기간" className="segs">
          {KINDS.map(([k, l]) => <button key={k} role="tab" aria-selected={kind === k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{l}</button>)}
        </div>
        <section className="tcard" aria-label="공부 시간">
          <div className="tc-meta"><span>{mdS(p.from)} ~ {mdS(p.to)}</span></div>
          <div className="ex-big"><b>{hm(total)}</b><span>{kind === 'week' ? '이번 주 공부' : kind === 'month' ? '이번 달 공부' : '시험까지 공부'}</span>{diff !== null && <small>{kind === 'week' ? '지난주' : '지난달'}보다 {diff >= 0 ? '' : '−'}{hm(Math.abs(diff))}</small>}</div>
          <DayBars s={s} p={p} />
        </section>
        <div className="wd-grid">
          <section className="wd" aria-label="목표 달성">
            <div className="wd-t">목표 달성 · 개수</div>
            <div className="ringrow">
              <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true"><g transform="rotate(-90 28 28)" fill="none" strokeWidth="6" strokeLinecap="round"><circle cx="28" cy="28" r={R} stroke="var(--trk)" /><circle cx="28" cy="28" r={R} stroke="var(--ink)" strokeDasharray={`${(C * (goals.rate ?? 0)).toFixed(1)} ${C.toFixed(1)}`} /></g></svg>
              <b className="wd-num">{pctS(goals.rate)}<small>%</small></b>
            </div>
            <div className="wd-sub">목표 {goals.total}개 중 {goals.done}개</div>
          </section>
          <section className="wd" aria-label="한 번에 집중">
            <div className="wd-t">한 번에 집중</div>
            <div className="wd-num">{focus.length ? Math.round(avgFocus / 60) : '—'}<small> 분</small></div>
            <div className="wd-sub">{longest ? `가장 길게 ${hm(longest.sec)} · ${longest.task?.name ?? ''}` : '스톱워치 기록이 쌓이면 보여요'}</div>
          </section>
          <section className="wd" aria-label="끝낸 단원">
            <div className="wd-t">끝낸 단원</div>
            <div className="wd-num">{chs.length}<small> 개</small></div>
            <div className="wd-sub">{chs[0] ? `${chs[0].name}${chs[0].grade ? ` · 이해 ${GRADE_KO[chs[0].grade]}` : ''}` : '아직 없어요'}</div>
          </section>
          <section className="wd" aria-label="연속 공부">
            <div className="wd-t">연속 공부</div>
            <div className="wd-num">{st.count}<small> 일</small></div>
            <div className="wd-sub">최고 기록 {best}일</div>
          </section>
        </div>
        <section className="tcard" aria-label="과목 비중">
          <div className="tc-meta"><b className="big16">과목 비중</b><span>{hm(total)}</span></div>
          {split.length === 0 ? <p className="tc-sub">이 기간에 스톱워치 기록이 없어요.</p> : (
            <>
              <div className="split" role="img" aria-label={split.map((x) => `${x.name} ${Math.round((x.sec / total) * 100)}%`).join(', ')}>
                {split.map((x) => <i key={x.key} style={{ flexGrow: x.sec, background: subjectVar(x.color) }} />)}
              </div>
              <div className="splist">
                {split.map((x) => <div key={x.key}><i className="dot" style={{ background: subjectVar(x.color) }} /><span className="grow">{x.name}</span><b>{hm(x.sec)}</b><small>{Math.round((x.sec / total) * 100)}%</small></div>)}
              </div>
            </>
          )}
        </section>
        <section className="tcard" aria-label="집중 시간대">
          <div className="tc-meta"><b className="big16">집중 시간대</b><span>진할수록 오래</span></div>
          <div className="heat">
            <span />{bins.map((h) => <small key={h}>{h}시</small>)}
            {rowOrder.map((d) => (
              <span key={d} style={{ display: 'contents' }}>
                <small className="hl">{DOW_KO[d]}</small>
                {bins.map((h) => <i key={h} style={{ background: `color-mix(in srgb, var(--ink) ${Math.round((cell(d, h) / maxCell) * 85)}%, var(--trk))` }} />)}
              </span>
            ))}
          </div>
          {bw !== null && <div className="tc-meta"><span>가장 집중하는 때</span><b>{hourName(bw)} ~ {hourName(bw + 3)}</b></div>}
        </section>
        {plans.length > 0 && (
          <section className="tcard" aria-label="계획별">
            <div className="tc-meta"><b className="big16">계획별 {kind === 'week' ? '이번 주' : kind === 'month' ? '이번 달' : '지금까지'}</b><span>한 양 / 목표</span></div>
            {plans.map((x) => {
              const isTime = x.task.type === 'time'
              return (
                <div key={x.task.id} className="plrow">
                  <div className="pc-1"><span className="pc-name"><i className="dot" style={{ background: colorOf(s, x.task) }} /><span>{x.task.name}</span></span><b>{isTime ? `${hm(x.got)} / ${hm(x.goal)}` : `${x.got} / ${x.goal}${x.task.unit}`}</b></div>
                  <div className="track"><div style={{ width: `${Math.min(x.goal ? x.got / x.goal : 0, 1) * 100}%`, background: colorOf(s, x.task) }} /></div>
                </div>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}

function StatsMore({ s, today, onBack }: { s: State; today: string; onBack: () => void }) {
  const [range, setRange] = useState<'4' | '12' | 'all'>('12')
  const first = firstRecord(s, today)
  const days = range === '4' ? 28 : range === '12' ? 84 : Math.max(diffDays(first, today) + 1, 1)
  const p: Period = { from: addDays(today, -(days - 1)), to: today, days }
  const secs = datesBetween(p.from, p.to).map((d) => secOn(s, d))
  const total = secs.reduce((a, b) => a + b, 0)
  const studied = secs.filter((v) => v > 0).length
  const best = bestStreak(s, today, s.settings.streakMinSec)
  const max = Math.max(...secs, 1)
  const avg = weekdayAvg(s, p)
  const maxAvg = Math.max(...avg, 1)
  const topDay = avg.indexOf(Math.max(...avg))
  const longest = longestFocus(s, p, 5)
  const weeks = range === '4' ? 4 : 8
  const trend = weeklyGoalTrend(s, today, weeks)
  const exam = s.exams.find((e) => e.selected) ?? null
  const plans = s.tasks.filter((t) => isProgressTask(t) && !t.archived && !t.completed).map((t) => planProgress(s, t, today, exam))

  // 잔디: 12주 고정 (오래된 주 → 최근 주, 열=주, 행=월~일)
  const gridWeeks = 12
  const monday = addDays(today, -((dow(today) + 6) % 7))
  const start = addDays(monday, -7 * (gridWeeks - 1))
  const grassMax = Math.max(...datesBetween(start, today).map((d) => secOn(s, d)), 1)
  const grass = datesBetween(start, addDays(monday, 6))
  const studied12 = grass.filter((d) => d <= today && secOn(s, d) > 0).length
  const past12 = grass.filter((d) => d <= today).length

  // 목표 달성 추이 꺾은선
  const W = 300, H = 90
  const pts = trend.map((v, i) => (v === null ? null : [(i / Math.max(weeks - 1, 1)) * W, H - v * H] as const))
  const valid = pts.filter((x): x is readonly [number, number] => x !== null)
  const avgTrend = valid.length ? valid.reduce((a, x) => a + (H - x[1]) / H, 0) / valid.length : null

  return (
    <div className="page">
      <header className="nav-h">
        <button className="back" onClick={onBack}><Icon name="left" size={20} />통계</button>
        <h1 className="nav-t">자세한 통계</h1>
        <span style={{ width: 56 }} />
      </header>
      <div className="tbody">
        <div role="tablist" aria-label="기간" className="segs">
          {([['4', '최근 4주'], ['12', '최근 12주'], ['all', '전체']] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={range === k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>{l}</button>)}
        </div>
        <section className="tcard" aria-label="공부 잔디">
          <div className="tc-meta"><b className="big16">공부 잔디</b><span>{past12}일 중 {studied12}일</span></div>
          <div className="grass" role="img" aria-label={`최근 12주 ${past12}일 중 ${studied12}일 공부`} style={{ gridTemplateColumns: `repeat(${gridWeeks}, minmax(0, 1fr))` }}>
            {Array.from({ length: gridWeeks * 7 }, (_, i) => {
              const d = grass[(i % gridWeeks) * 7 + Math.floor(i / gridWeeks)]
              const future = d > today
              const lv = future ? -1 : grassLevel(secOn(s, d), grassMax)
              return <i key={d} className={d === today ? 'gnow' : ''} style={{ background: lv < 0 ? 'transparent' : `color-mix(in srgb, var(--ink) ${[0, 25, 50, 75, 100][lv]}%, var(--trk))` }} />
            })}
          </div>
          <div className="tc-meta small"><span>{md(start)}</span><span>적게 → 많이</span><span>오늘</span></div>
        </section>
        <div className="trio3">
          <section className="tcard"><b>{hm(total)}</b><small>{range === 'all' ? '전체' : range === '4' ? '4주' : '12주'} 공부</small></section>
          <section className="tcard"><b>{hm(studied ? total / studied : 0)}</b><small>하루 평균</small></section>
          <section className="tcard"><b>{best}일</b><small>최고 연속</small></section>
        </div>
        <section className="tcard" aria-label="요일별 평균">
          <div className="tc-meta"><b className="big16">요일별 평균</b><span>{total > 0 ? `${DOW_KO[topDay]}요일에 가장 많이` : ''}</span></div>
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <div key={d} className="wkrow"><span>{DOW_KO[d]}</span><div className="track"><div style={{ width: `${(avg[d] / maxAvg) * 100}%`, background: d === topDay && total > 0 ? 'var(--ink)' : 'var(--mu)' }} /></div><b>{hm(avg[d])}</b></div>
          ))}
        </section>
        <section className="tcard" aria-label="목표 달성 추이">
          <div className="tc-meta"><b className="big16">목표 달성 추이 · 개수</b><span>{avgTrend === null ? '' : `${weeks}주 평균 ${Math.round(avgTrend * 100)}%`}</span></div>
          <svg viewBox={`-6 -6 ${W + 12} ${H + 12}`} width="100%" role="img" aria-label="주별 목표 달성 추이" className="trend">
            <line x1="0" x2={W} y1={H * 0.2} y2={H * 0.2} stroke="var(--mu)" strokeDasharray="4 4" strokeWidth="1.2" />
            {valid.length > 1 && <polyline points={valid.map((x) => x.join(',')).join(' ')} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
            {valid.map((x, i) => <circle key={i} cx={x[0]} cy={x[1]} r={i === valid.length - 1 ? 5 : 3.5} fill={i === valid.length - 1 ? 'var(--ink)' : 'var(--sf)'} stroke="var(--ink)" strokeWidth="2" />)}
          </svg>
          <div className="tc-meta small"><span>{weeks - 1}주 전</span><span>목표 80%</span><span>이번 주 {pctS(trend[trend.length - 1])}%</span></div>
        </section>
        <section className="tcard tight" aria-label="가장 오래 집중한 기록">
          <div className="tc-meta pad"><b className="big16">가장 오래 집중한 기록</b><span>한 번에</span></div>
          {longest.length === 0 && <p className="tc-sub">스톱워치 기록이 쌓이면 보여요.</p>}
          {longest.map((x, i) => (
            <div key={x.h.id} className="rv">
              <b className="rank">{i + 1}</b>
              <span className="grow ell">{x.task?.name ?? ''}</span>
              <b>{hm(x.sec)}</b>
              <small className="dt">{mdS(x.h.date)}</small>
            </div>
          ))}
        </section>
        {plans.length > 0 && (
          <section className="tcard" aria-label="언제 끝날까">
            <div className="tc-meta"><b className="big16">언제 끝날까</b><span>{exam ? `시험 ${mdS(exam.date)}` : ''}</span></div>
            <div className="endrow head"><span /><small>계획대로</small><small>지금 속도</small></div>
            {plans.map((x) => {
              const lateEnd = exam && x.paceEnd && x.paceEnd > exam.date
              return (
                <div key={x.task.id} className="endrow">
                  <span className="grow ell"><i className="dot" style={{ background: colorOf(s, x.task) }} /> {x.task.name}</span>
                  <b>{x.planEnd ? mdS(x.planEnd) : '—'}</b>
                  <b className={lateEnd ? 'bad' : ''}>{x.paceEnd ? mdS(x.paceEnd) : '—'}{lateEnd ? ' 시험 뒤' : ''}</b>
                </div>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}
