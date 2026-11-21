// 하루 마무리 (RDayEnd): 밤에 한 장 요약
import { addDays, fmtDate, fmtDur } from './date.ts'
import { actions, subjectVar, useStore } from './store.ts'
import { dayTimeline, secOn } from './stats.ts'
import { dayStats, hm, streakInfo, subjectSecs } from './todayData.ts'
import { FullPage } from './ui.tsx'
import { Icon } from './Icon.tsx'
import { colorOf, itemsOn } from './view.ts'

const clock = (ms: number) => { const d = new Date(ms); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` }

export function DayEnd({ date, today, onClose, goTomorrow }: { date: string; today: string; onClose: () => void; goTomorrow: () => void }) {
  const s = useStore()
  const stats = dayStats(s, date, today)
  const st = streakInfo(s, today, s.settings.streakMinSec)
  const yday = secOn(s, addDays(date, -1))
  const diff = stats.sec - yday
  const longest = s.histories.filter((h) => h.date === date).reduce((m, h) => Math.max(m, Math.round((h.endedAt - h.startedAt) / 1000)), 0)
  const subs = subjectSecs(s, date)
  const tl = dayTimeline(s, date)
  const tomorrow = addDays(date, 1)
  const first = itemsOn(s, tomorrow, today).active[0]
  const notes = s.tasks.flatMap((t) => (s.recs[t.id]?.[date]?.note ? [{ t, note: s.recs[t.id][date].note! }] : []))
  const total = Math.max(stats.target, stats.sec, 1)
  const R = 38
  const C = 2 * Math.PI * R
  let acc = 0
  const pct = stats.timeRate === null ? '—' : `${Math.min(Math.round(stats.timeRate * 100), 100)}%`
  const open = stats.active.filter((i) => i.rate < 1)
  const done = stats.active.filter((i) => i.rate >= 1)
  const minuteLabel = new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })

  return (
    <FullPage title="하루 마무리" onClose={onClose}>
      <div className="de-title"><small>{fmtDate(date)} · {minuteLabel}</small><h2>{stats.sec > 0 ? `오늘 ${fmtDur(stats.sec)} 공부했어요` : '오늘은 공부 기록이 없어요'}</h2></div>
      <section className="tcard" aria-label="오늘 요약">
        <div className="de-sum">
          <div className="donut">
            <svg width="92" height="92" viewBox="0 0 92 92" role="img" aria-label={`오늘 ${hm(stats.sec)}`}>
              <g transform="rotate(-90 46 46)" fill="none" strokeWidth="10" strokeLinecap="round">
                <circle cx="46" cy="46" r={R} stroke="var(--trk)" />
                {subs.map((x, i) => { const len = (x.sec / total) * C; const el = <circle key={i} cx="46" cy="46" r={R} stroke={x.color} strokeDasharray={`${Math.max(0.1, len - (subs.length > 1 ? 9 : 0)).toFixed(1)} ${C.toFixed(1)}`} strokeDashoffset={(-acc).toFixed(1)} />; acc += len; return el })}
              </g>
            </svg>
            <span className="donut-c">{pct}</span>
          </div>
          <div className="de-grid">
            <div><b>{stats.goalsDone} / {stats.goalsTotal}</b><small>끝낸 목표</small></div>
            <div><b className="ribc">{st.count}일</b><small>연속 공부</small></div>
            <div><b>{longest ? hm(longest) : '—'}</b><small>가장 긴 집중</small></div>
            <div><b>{yday ? `${diff >= 0 ? '+' : '−'}${hm(Math.abs(diff))}` : '—'}</b><small>어제보다</small></div>
          </div>
        </div>
      </section>
      <section className="tcard" aria-label="공부한 시간대">
        <div className="tc-meta"><b className="big16">언제 공부했나</b><span>{tl.length}개 기록</span></div>
        <div className="tline" role="img" aria-label={tl.length ? `${tl.length}개 기록` : '시간 기록 없음'}>
          {tl.map((x) => { const t = s.tasks.find((y) => y.id === x.taskId); return <span key={x.id} style={{ left: `${x.left * 100}%`, width: `${Math.max(x.width * 100, 0.8)}%`, background: t ? colorOf(s, t) : 'var(--mu)' }} /> })}
        </div>
        <div className="tline-l" aria-hidden="true">{[6, 9, 12, 15, 18, 21, 24].map((h, i) => <span key={h} style={{ left: `${(i / 6) * 100}%`, transform: i === 0 ? 'none' : i === 6 ? 'translateX(-100%)' : 'translateX(-50%)' }}>{h}시</span>)}</div>
        <div className="legend wide">{subs.map((x) => <span key={x.name}><i style={{ color: x.color }}>●</i> {x.name} {hm(x.sec)}</span>)}</div>
      </section>
      <div className="fp-h2 fsplit"><h2>오늘 한 것</h2><small>{stats.goalsTotal}개 중 {stats.goalsDone}개</small></div>
      <section className="tcard tight">
        {stats.active.length === 0 && <p className="empty tight">오늘 목표가 없었어요</p>}
        {done.map((i) => <div key={i.task.id} className="rv"><span className="cn on" style={{ background: colorOf(s, i.task), width: 22, height: 22, borderRadius: 11 }}><Icon name="check" size={13} stroke={3.2} /></span><span className="grow ell"><b>{i.task.name}</b></span><small>{i.task.type === 'time' ? hm(i.rec?.sec ?? 0) : i.task.type === 'check' ? '끝' : `${i.rec?.done ?? 0} / ${i.expect}${i.task.unit}`}</small></div>)}
        {open.map((i) => (
          <div key={i.task.id} className="rv">
            <span className="cn" style={{ borderColor: 'var(--bad)', borderStyle: 'solid', width: 22, height: 22, borderRadius: 11 }} />
            <span className="grow ell"><b>{i.task.name}</b></span>
            {i.task.kind === 'todo'
              ? <button className="chip" onClick={() => actions.moveTodo(i.task.id, tomorrow)}>내일로</button>
              : <small className="mu">{i.task.type === 'time' ? `${hm(i.rec?.sec ?? 0)} / ${hm(i.expect)}` : `${i.rec?.done ?? 0} / ${i.expect}${i.task.unit}`} · 남은 날에 나눠요</small>}
          </div>
        ))}
      </section>
      {notes.length > 0 && (
        <>
          <div className="fp-h2 fsplit"><h2>오늘 남긴 메모</h2><small>단원 자세히에도 남아요</small></div>
          <section className="tcard tight">
            {notes.map((x) => <div key={x.t.id} className="rv"><span className="nbar" style={{ background: colorOf(s, x.t) }} /><span className="grow"><span className="blk">{x.note}</span><small className="blk mu">{x.t.name}</small></span></div>)}
          </section>
        </>
      )}
      <div className="fp-h2 fsplit"><h2>내일 첫 공부</h2></div>
      <section className="tcard">
        {first ? (
          <>
            <div className="tc-meta"><b className="big16"><i className="dot" style={{ background: colorOf(s, first.task) }} /> {first.task.name}</b><span>{fmtDate(tomorrow)}</span></div>
            <div className="tc-sub">{first.task.type === 'time' ? hm(first.expect) : first.task.type === 'check' ? '체크' : `${first.expect}${first.task.unit}`}</div>
          </>
        ) : <p className="tc-sub">내일은 쉬어요.</p>}
        <div className="two">
          <button className="chip" onClick={goTomorrow}>내일 전체 보기</button>
          <button className="chip dark" onClick={onClose}>오늘은 끝</button>
        </div>
      </section>
    </FullPage>
  )
}
