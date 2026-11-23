import { useEffect, useState } from 'react'
import { Icon, type IconName } from './Icon.tsx'
import { Calendar } from './Calendar.tsx'
import { todayISO } from './date.ts'
import { DiaryForm, DiaryPage, type Draft } from './Diary.tsx'
import type { Task, TaskKind } from './logic.ts'
import { More } from './More.tsx'
import { Progress } from './Progress.tsx'
import { Stats } from './Stats.tsx'
import { Stopwatch } from './Stopwatch.tsx'
import { refreshForNewDay, useStore } from './store.ts'
import { applyTheme } from './theme.ts'
import { NewPlan } from './NewPlan.tsx'
import { NewPlanWizard } from './NewPlanWizard.tsx'
import { PlanEdit } from './PlanEdit.tsx'
import { WidgetEdit } from './WidgetEdit.tsx'
import { Today } from './Today.tsx'

type Tab = 'today' | 'progress' | 'calendar' | 'stats' | 'diary' | 'more'
const TABS: [Tab, string, IconName][] = [
  ['today', '오늘', 'today'],
  ['progress', '진도', 'flag'],
  ['calendar', '캘린더', 'calendar'],
  ['stats', '통계', 'chart'],
  ['more', '더보기', 'more'],
]

export function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [date, setDate] = useState(todayISO())
  const [form, setForm] = useState<{ task: Task | null; one?: TaskKind | true } | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [widgets, setWidgets] = useState(false)
  const theme = useStore().settings.theme
  useEffect(() => applyTheme(theme), [theme])

  // 자정이 지나면 지난 날 목표를 고정하고 오늘 화면으로 넘긴다
  useEffect(() => {
    let last = todayISO()
    const tick = () => {
      const now = todayISO()
      if (now === last) return
      setDate((d) => (d === last ? now : d))
      last = now
      refreshForNewDay()
    }
    const iv = setInterval(tick, 30000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(iv)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  const editTask = (task: Task | null) => setForm({ task })
  return (
    <>
      {tab === 'today' && <Today nav={{ date, setDate, editTask, writeDiary: (d, taskId) => setDraft({ date: d, taskId }), editWidgets: () => setWidgets(true), goProgress: () => setTab('progress') }} />}
      {tab === 'progress' && <Progress editTask={editTask} />}
      {tab === 'calendar' && <Calendar goTo={(d) => { setDate(d); setTab('today') }} />}
      {tab === 'stats' && <Stats />}
      {tab === 'diary' && <DiaryPage open={setDraft} />}
      {tab === 'more' && <More editTask={editTask} openDiary={() => setTab('diary')} />}

      <nav className="tabs">
        {TABS.map(([id, label, icon]) => (
          <button key={id} className={tab === id || (id === 'more' && tab === 'diary') ? 'on' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
            <Icon name={icon} size={24} stroke={1.9} />
            {label}
          </button>
        ))}
      </nav>

      {form && (form.task ? <PlanEdit task={form.task} onClose={() => setForm(null)} />
        : form.one ? <NewPlan onClose={() => setForm(null)} kind={form.one === true ? undefined : form.one} />
          : <NewPlanWizard onClose={() => setForm(null)} onForm={(k) => setForm({ task: null, one: k ?? true })} />)}
      {widgets && <WidgetEdit onClose={() => setWidgets(false)} />}
      {draft && <DiaryForm draft={draft} onClose={() => setDraft(null)} />}
      <Stopwatch showStart={tab === 'today' && date === todayISO()} />
    </>
  )
}
