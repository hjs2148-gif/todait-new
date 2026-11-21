import { useEffect } from 'react'
import { CatchupSheet } from './Catchup.tsx'
import { actions, type State } from './store.ts'
import { catchupItems } from './todayData.ts'

/** 오늘 탭을 처음 열 때 어제 못 한 분량이 있으면 정리 시트를 띄운다 */
export function Catchup({ s, date, today }: { s: State; date: string; today: string }) {
  const seen = s.settings.catchupSeenOn === today
  const items = date === today && !seen && !s.timer ? catchupItems(s, today) : []
  const auto = items.length > 0 && s.settings.autoSpread
  useEffect(() => {
    if (date === today && !seen && (items.length === 0 || auto)) actions.setSettings({ catchupSeenOn: today })
  }, [date, today, seen, items.length, auto])
  if (items.length === 0 || auto) return null
  return <CatchupSheet s={s} items={items} onClose={() => actions.setSettings({ catchupSeenOn: today })} />
}
