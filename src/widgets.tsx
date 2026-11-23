// 오늘 탭 위젯: 칸 격자(작게 1×1 · 넓게 2×1 · 크게 2×2). 편집(순서·크기)은 위젯 편집 화면에서 정한다.
import type { WidgetSlot } from './model.ts'
import type { State } from './store.ts'
import type { DayStats } from './todayData.ts'
import { MapWidget, ProgressWidget, RecallWidget, ReviewWidget, SlackWidget, WrongWidget } from './LearnWidgets.tsx'
import { ExamWidget2, LeftWidget2, MemoWidget2, QuickStartWidget2, SmartStack, StreakWidget2, SubjectsWidget2, TimeWidget, TomorrowWidget2, WeekGoalWidget2, WeekWidget2 } from './MoreWidgets.tsx'

export function renderWidget(slot: WidgetSlot, s: State, date: string, today: string, stats: DayStats): JSX.Element | null {
  const z = slot.size
  const k = slot.id
  switch (slot.id) {
    case 'stack': return <SmartStack key={k} slot={slot} render={(x) => renderWidget(x, s, date, today, stats)} />
    case 'progress': return <ProgressWidget key={k} s={s} size={z} date={date} today={today} stats={stats} />
    case 'review': return <ReviewWidget key={k} s={s} size={z} today={today} />
    case 'slack': return <SlackWidget key={k} s={s} size={z} today={today} />
    case 'recall': return <RecallWidget key={k} s={s} size={z} today={today} />
    case 'wrong': return <WrongWidget key={k} s={s} size={z} today={today} />
    case 'umap': return <MapWidget key={k} s={s} size={z} />
    case 'today': return <TimeWidget key={k} s={s} size={z} date={date} stats={stats} />
    case 'left': return <LeftWidget2 key={k} s={s} size={z} date={date} today={today} stats={stats} />
    case 'exam': return <ExamWidget2 key={k} s={s} size={z} today={today} />
    case 'week': return <WeekWidget2 key={k} s={s} size={z} today={today} />
    case 'streak': return <StreakWidget2 key={k} s={s} size={z} today={today} />
    case 'subjects': return <SubjectsWidget2 key={k} s={s} size={z} date={date} today={today} />
    case 'weekGoal': return <WeekGoalWidget2 key={k} s={s} size={z} today={today} />
    case 'tomorrow': return <TomorrowWidget2 key={k} s={s} size={z} today={today} />
    case 'memo': return <MemoWidget2 key={k} s={s} size={z} />
    case 'quickStart': return <QuickStartWidget2 key={k} s={s} size={z} today={today} />
    default: return null
  }
}

/** 칸 격자: 빈칸은 작은 위젯이 채운다 */
export function Widgets({ s, date, today, stats }: { s: State; date: string; today: string; stats: DayStats }) {
  return <div className="wgrid">{s.settings.widgets.map((slot) => renderWidget(slot, s, date, today, stats))}</div>
}
