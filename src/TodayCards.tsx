// 오늘 탭 맨 위에 때에 따라 나오는 카드들: 백업 알림 · 새 주 시작 · 목표 완료 · 쉬는 날 · 첫날 빈 화면
import { useRef, useState } from 'react'
import { addDays, diffDays } from './date.ts'
import { liveExpect } from './logic.ts'
import { backupDue, isoWeek } from './model.ts'
import { bestDaySecBefore, lastWeekSummary, weekTargets } from './stats.ts'
import { actions, downloadBackup, importBackup, offFor, type State } from './store.ts'
import { hm, streakInfo, type DayStats } from './todayData.ts'
import { RowAction } from './Today.tsx'
import { colorOf } from './view.ts'
import { ExamWidget, StreakWidget } from './widgets.tsx'

const md = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}월 ${Number(d)}일` }

/** 7일 넘게 백업을 안 했으면 한 번 알린다. 기록은 이 폰에만 있어서 잃으면 되돌릴 수 없다 */
export function BackupCard({ s, today }: { s: State; today: string }) {
  const [busy, setBusy] = useState(false)
  const days = backupDue(s, Date.now(), today)
  if (days === null) return null
  const never = s.settings.lastBackupAt === null
  return (
    <section className="tcard notice" role="region" aria-label="백업 알림">
      <div className="nt-t"><b>{never ? '아직 백업한 적이 없어요' : `백업한 지 ${days}일 됐어요`}</b><small>기록은 이 폰 브라우저에만 있어요. 파일로 저장해 두면 폰을 바꿔도 돌려놓을 수 있어요.</small></div>
      <div className="two">
        <button className="chip" onClick={() => actions.setSettings({ backupRemindedOn: today })}>나중에</button>
        <button className="chip dark" disabled={busy} onClick={async () => { setBusy(true); await downloadBackup(); setBusy(false) }}>지금 백업</button>
      </div>
    </section>
  )
}

/** 월요일 첫 화면: 지난주 결과와 이번 주 목표 */
export function NewWeekCard({ s, today, goProgress }: { s: State; today: string; goProgress: () => void }) {
  const last = lastWeekSummary(s, today)
  const targets = weekTargets(s, today)
  const exam = s.exams.find((e) => e.selected)
  const n = exam ? diffDays(today, exam.date) : null
  if (!s.tasks.length) return null
  return (
    <section className="tcard weekcard" role="region" aria-label="새 주 시작">
      <div className="tc-meta"><span>{isoWeek(today)}번째 주{n !== null && n >= 0 ? ` · ${exam!.name} D-${n}` : ''}</span></div>
      <h2 className="wk-h">새 주가 시작됐어요</h2>
      <div className="wk-last">
        <div className="tc-meta"><b>지난주 {last.period.from.slice(5).replace('-', '.')} ~ {last.period.to.slice(8).replace(/^0/, '')}</b><span>{last.rate === null ? '목표 없음' : `달성 ${Math.round(last.rate * 100)}%`}</span></div>
        <div className="wk-nums"><div><b>{hm(last.sec)}</b><small>공부 시간</small></div><div><b>{last.goalTotal}개</b><small>목표 · 개수</small></div></div>
        {(last.units.length > 0 || last.chapters > 0) && <div className="tc-sub">쌓은 것 {[...last.units.map((u) => `${u.n}${u.unit}`), ...(last.chapters ? [`${last.chapters}단원 끝`] : [])].join(' · ')}</div>}
      </div>
      {last.missed.length > 0 && <p className="fnote">지난주에 못 한 {last.missed.map((m) => `${m.n}${m.unit}`).join(' · ')}은 이번 주 목표에 나눠 넣었어요.</p>}
      {targets.length > 0 && (
        <>
          <b className="wk-sub">이번 주 목표</b>
          <div className="wk-targets">
            {targets.map((x) => (
              <div key={x.task.id}><i className="dot" style={{ background: colorOf(s, x.task) }} /><span className="grow ell">{x.task.name}</span>
                <small>하루 {x.task.type === 'time' ? hm(x.perDay) : `${x.perDay}${x.task.unit}`}</small><b>{x.task.type === 'time' ? hm(x.total) : `${x.total}${x.task.unit}`}</b></div>
            ))}
          </div>
        </>
      )}
      <div className="two">
        <button className="chip" onClick={() => { actions.setSettings({ weekCardSeen: today }); goProgress() }}>목표 바꾸기</button>
        <button className="chip dark" onClick={() => actions.setSettings({ weekCardSeen: today })}>이번 주 시작</button>
      </div>
    </section>
  )
}

/** 오늘 목표를 다 채웠을 때 */
export function DoneDayCard({ s, today, stats, openDayEnd, tomorrow }: { s: State; today: string; stats: DayStats; openDayEnd: () => void; tomorrow: () => void }) {
  const st = streakInfo(s, today, s.settings.streakMinSec)
  const best = bestDaySecBefore(s, today, today)
  const record = best > 0 && stats.sec > best
  const dots = Math.min(Math.max(st.best, st.count + 1, 12), 24)
  return (
    <section className="tcard weekcard" role="region" aria-label="오늘 목표 완료">
      <div className="tc-meta"><b className="big16">목표를 다 채웠어요</b>{record && <b className="ribc">하루 최고 기록 · 전 기록 {hm(best)}</b>}</div>
      <div className="tc-meta"><span>연속 <b className="ribc">{st.count}일</b>째</span><span>{st.best > st.count ? `최고 기록 ${st.best}일까지 ${st.best - st.count}일` : '최고 기록이에요'}</span></div>
      <div className="dots" aria-hidden="true">{Array.from({ length: dots }, (_, i) => <i key={i} className={i < st.count ? 'on' : ''} />)}</div>
      <div className="two">
        <button className="chip dark" onClick={openDayEnd}>하루 마무리 보기</button>
        <button className="chip" onClick={tomorrow}>내일 미리 보기</button>
      </div>
    </section>
  )
}

/** 쉬는 날 */
export function RestView({ s, date, today }: { s: State; date: string; today: string }) {
  const way = s.settings.restDays[date]
  const tomorrow = addDays(date, 1)
  const moved = s.tasks
    .filter((t) => t.type === 'amount' && !t.archived && !t.completed)
    .map((t) => {
      const recs = s.recs[t.id] ?? {}
      const was = s.settings.restMoves[date]?.[t.id] ?? 0
      const nowTom = liveExpect(t, recs, tomorrow, offFor(s, t))
      return { t, was, nowTom, before: way === 'tomorrow' ? nowTom - was : nowTom }
    })
    .filter((x) => (way === 'tomorrow' ? x.was > 0 : liveExpect(x.t, s.recs[x.t.id] ?? {}, date) > 0))
  const heavy = moved.find((x) => way === 'tomorrow' && x.before > 0 && x.nowTom >= x.before * 2)
  const habits = s.tasks.filter((t) => t.kind === 'habit' && t.keepOnRest && !t.archived)
  const rec = (id: string) => s.recs[id]?.[date]
  return (
    <>
      <section className="tcard restcard" role="region" aria-label="쉬는 날">
        <svg width="96" height="84" viewBox="0 0 96 84" aria-hidden="true">
          <rect x="22" y="14" width="52" height="62" rx="6" fill="var(--s-m)" /><rect x="22" y="14" width="7" height="62" rx="3" fill="rgba(0,0,0,.18)" />
          <path d="M56 4h12v36l-6-5-6 5z" fill="var(--rib)" /><rect x="36" y="54" width="30" height="4" rx="2" fill="rgba(255,255,255,.5)" />
        </svg>
        <h2>{date === today ? '오늘은 쉬는 날' : `${md(date)}은 쉬는 날`}</h2>
        <p className="tc-sub">책갈피를 끼워 뒀어요.{moved.length > 0 ? ` 계획 ${moved.length}개를 옮겼어요.` : ''}</p>
        <div className="two">
          <button className="chip" onClick={() => actions.setRestDay(date, null)}>쉬는 날 취소</button>
          <button className="chip" onClick={() => actions.setRestDay(date, way === 'tomorrow' ? 'spread' : 'tomorrow')}>옮긴 방법 바꾸기</button>
        </div>
      </section>
      <div className="wd-grid"><StreakWidget s={s} today={today} /><ExamWidget s={s} today={today} /></div>
      <div className="sec-h"><h2>{way === 'tomorrow' ? '내일로 옮긴 분량' : '남은 날에 나눈 분량'}</h2><small>{way === 'tomorrow' ? '내일 분량에 더함' : '자동으로 나눔'}</small></div>
      <section className="tcard tight">
        {moved.length === 0 && <p className="empty tight">옮길 분량이 없어요</p>}
        {moved.map((x) => (
          <div key={x.t.id} className="rv">
            <i className="dot" style={{ background: colorOf(s, x.t) }} />
            <span className="grow"><b className="blk ell">{x.t.name}</b><small className="blk">{way === 'tomorrow' ? `내일 ${x.before}${x.t.unit} → ${x.nowTom}${x.t.unit}으로 늘어남` : '다음 공부일에 조금씩 더해요'}</small></span>
            <b>{way === 'tomorrow' ? x.was : liveExpect(x.t, s.recs[x.t.id] ?? {}, date)}{x.t.unit}</b>
          </div>
        ))}
      </section>
      {heavy && <p className="fnote"><b>내일 {heavy.t.name}이 두 배라 무거워요.</b> <button className="linkbtn" onClick={() => actions.setRestDay(date, 'spread')}>나눠서 옮기기</button>로 바꾸면 남은 날에 조금씩 더해요.</p>}
      {habits.length > 0 && (
        <>
          <div className="sec-h"><h2>쉬는 날에도 하는 습관</h2><small>원하면</small></div>
          <section className="tcard tight">
            {habits.map((t) => {
              const item = { task: t, rec: rec(t.id), expect: 1, rate: rec(t.id)?.checked ? 1 : 0 }
              return (
                <div key={t.id} className="todo">
                  <RowAction s={s} item={item} date={date} today={today} onEntry={() => {}} />
                  <span className="grow">{t.name}</span><small className="mu">연속 {Object.values(s.recs[t.id] ?? {}).filter((r) => r.checked).length}일</small>
                </div>
              )
            })}
          </section>
        </>
      )}
    </>
  )
}

/** 첫날: 계획이 하나도 없을 때 */
export function EmptyCard({ newPlan }: { newPlan: () => void }) {
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const restore = async (f: File | undefined) => {
    if (!f) return
    try { await importBackup(await f.text()); setMsg('백업을 불러왔어요.') } catch (e) { setMsg(e instanceof Error ? e.message : '백업 파일을 읽지 못했어요.') }
  }
  return (
    <section className="tcard emptycard" role="region" aria-label="첫 계획 만들기">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--mu)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h12l-2.5 4 2.5 4H5" /></svg>
      <h2>첫 계획을 만들어 볼까요?</h2>
      <p className="tc-sub">책 이름과 목차, 끝낼 날만 넣으면 하루 분량을 나눠 드려요.</p>
      <button className="primary" onClick={newPlan}>새 계획 만들기</button>
      <button className="ghost" onClick={() => file.current?.click()}>백업 불러오기</button>
      <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { void restore(e.target.files?.[0]); e.target.value = '' }} />
      {msg && <p className="fnote" role="status">{msg}</p>}
      <p className="fnote">기록은 이 폰 브라우저에만 저장돼요. 홈 화면에 추가하면 앱처럼 쓸 수 있어요.</p>
    </section>
  )
}

