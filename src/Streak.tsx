import { useState } from 'react'
import { addDays, dow } from './date.ts'
import { minGoalMet } from './model.ts'
import type { State } from './store.ts'
import { streakInfo } from './todayData.ts'
import { Sheet } from './ui.tsx'
import { daySec } from './view.ts'

const DAYS = ['월', '화', '수', '목', '금', '토', '일']

/** 오늘 탭 날짜 아래 작은 책갈피: 연속 일수. 누르면 4주 달력 */
export function StreakBadge({ s, today }: { s: State; today: string }) {
  const [open, setOpen] = useState(false)
  const min = s.settings.streakMinSec
  const st = streakInfo(s, today, min)
  if (st.count < 1) return null
  const ok = (d: string) => daySec(s, d) >= min || minGoalMet(s, d)
  const start = addDays(today, -((dow(today) + 6) % 7) - 21)
  const cells = Array.from({ length: 28 }, (_, i) => addDays(start, i))
  return (
    <>
      <button className="rib-b" onClick={() => setOpen(true)} aria-label={`연속 ${st.count}일째, 4주 기록 보기`}><i className="bm" aria-hidden="true" />{st.count}일째</button>
      {open && (
        <Sheet title="연속 공부" sub={`${st.count}일째 · 최고 ${st.best}일`} onClose={() => setOpen(false)}>
          <div className="sgrid" role="img" aria-label="최근 4주 공부 기록">
            {DAYS.map((d) => <span key={d} className="h">{d}</span>)}
            {cells.map((d) => {
              const rest = d in s.settings.restDays
              const cls = d > today ? 'fut' : rest ? 'rest' : ok(d) ? 'ok' : ''
              return <span key={d} className={`${cls}${d === today ? ' tdy' : ''}`}>{cls === 'ok' ? <i /> : d === today ? '오늘' : ''}</span>
            })}
          </div>
          <div className="sleg"><span><i className="sq ok" />지킨 날</span><span><i className="sq rest" />쉬는 날 (안 끊겨요)</span><span><i className="sq" />못 한 날</span></div>
          <p className="hint">하루 {Math.round(min / 60)}분 이상 공부했거나 최소 목표를 채우면 지킨 날이에요. 쉬는 날·예비일은 이어 세고 끊지 않아요.</p>
        </Sheet>
      )}
    </>
  )
}
