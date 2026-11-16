import { useEffect, useState } from 'react'
import { Calendar } from './Calendar.tsx'
import { todayISO } from './date.ts'
import { DiaryForm, DiaryPage, type Draft } from './Diary.tsx'
import type { Task } from './logic.ts'
import { More } from './More.tsx'
import { Stats } from './Stats.tsx'
import { Stopwatch } from './Stopwatch.tsx'
import { refreshForNewDay } from './store.ts'
import { TaskForm } from './TaskForm.tsx'
import { Today } from './Today.tsx'

type Tab = 'today' | 'calendar' | 'stats' | 'diary' | 'more'
const TABS: [Tab, string, string][] = [
  ['today', '오늘', '☑'],
  ['calendar', '캘린더', '▦'],
  ['stats', '통계', '▮'],
  ['diary', '일기', '✎'],
  ['more', '더보기', '⋯'],
]

export function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [date, setDate] = useState(todayISO())
  const [form, setForm] = useState<{ task: Task | null } | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)

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
      {tab === 'today' && <Today nav={{ date, setDate, editTask, writeDiary: (d, taskId) => setDraft({ date: d, taskId }) }} />}
      {tab === 'calendar' && <Calendar goTo={(d) => { setDate(d); setTab('today') }} />}
      {tab === 'stats' && <Stats />}
      {tab === 'diary' && <DiaryPage open={setDraft} />}
      {tab === 'more' && <More editTask={editTask} />}

      <nav className="tabs">
        {TABS.map(([id, label, icon]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {form && <TaskForm task={form.task} onClose={() => setForm(null)} />}
      {draft && <DiaryForm draft={draft} onClose={() => setDraft(null)} />}
      <Stopwatch />
    </>
  )
}
