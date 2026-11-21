// 다음 날 오늘 탭을 열면 한 번 뜨는 "어제 못 한 분량" 정리 시트.
import { useState } from 'react'
import { addDays, fmtDate, todayISO } from './date.ts'
import { extendEnd } from './logic.ts'
import { actions, offFor, type CatchupWay, type State } from './store.ts'
import { Sheet } from './ui.tsx'
import { colorOf } from './view.ts'
import type { CatchupItem } from './todayData.ts'

const fmt1 = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export function CatchupSheet({ s, items, onClose }: { s: State; items: CatchupItem[]; onClose: () => void }) {
  const today = todayISO()
  const yesterday = addDays(today, -1)
  const [way, setWay] = useState<Record<string, CatchupWay>>({})
  const [moveTo, setMoveTo] = useState<Record<string, string>>({})
  const [always, setAlways] = useState(false)
  const amounts = items.filter((i) => !i.overdue)
  const todos = items.filter((i) => i.overdue)
  const exam = s.exams.find((e) => e.selected)

  const apply = () => {
    for (const i of amounts) actions.applyCatchup(i.task.id, way[i.task.id] ?? 'spread', yesterday, today)
    for (const i of todos) actions.moveTodo(i.task.id, moveTo[i.task.id] ?? today)
    actions.setSettings({ catchupSeenOn: today, ...(always ? { autoSpread: true } : {}) })
    onClose()
  }
  const later = () => { actions.setSettings({ catchupSeenOn: today }); onClose() }

  return (
    <Sheet title="어제 못 한 분량이 있어요" onClose={later}>
      <div className="entry-sub">{fmtDate(yesterday)} · {items.length}개</div>
      <div className="cu-list">
        {items.map((i) => (
          <div key={i.task.id}><i style={{ background: colorOf(s, i.task) }} /><span className="grow">{i.task.name}</span>{i.overdue ? <b className="bad">마감 지남</b> : <b className="bad">{i.missed}{i.task.unit}</b>}</div>
        ))}
      </div>
      {amounts.map((i) => {
        const w = way[i.task.id] ?? 'spread'
        const recs = s.recs[i.task.id] ?? {}
        const end = extendEnd(i.task, recs, today, i.base, offFor(s, i.task))
        const clash = !!exam && !!end && end >= exam.date
        const opts: [CatchupWay, string, string, string, boolean][] = [
          ['spread', '남은 날에 나누기', `${i.task.endDate ? `${fmtDate(i.task.endDate)}까지 ` : ''}조금씩 더해요`, `오늘 ${fmt1(i.base)}${i.task.unit} → ${fmt1(i.spread)}${i.task.unit} · 끝나는 날 그대로`, false],
          ['today', '오늘 더하기', '오늘 한 번에 끝내요', `오늘 ${fmt1(i.base)}${i.task.unit} → ${fmt1(i.base + i.missed)}${i.task.unit}`, false],
          ['extend', '끝나는 날 늦추기', '하루 분량은 그대로 둬요', end ? (end === i.task.endDate ? '늦추지 않아도 돼요' : `${fmtDate(i.task.endDate!)} → ${fmtDate(end)}${clash ? ' · 시험 당일 이후' : ''}`) : '1년 안에 끝낼 수 없어요', clash || !end],
        ]
        return (
          <div key={i.task.id} className="cu-block">
            <div className="cu-h">{i.task.name} {i.missed}{i.task.unit}은</div>
            <div role="radiogroup" aria-label={`${i.task.name} 밀린 분량 처리`} className="cu-opts">
              {opts.map(([v, title, sub, res, warn]) => (
                <button key={v} type="button" role="radio" aria-checked={w === v} disabled={v === 'extend' && !i.task.endDate} className={w === v ? 'on' : ''} onClick={() => setWay({ ...way, [i.task.id]: v })}>
                  <span className="dot-r" aria-hidden="true" />
                  <span>
                    <span className="cu-t"><b>{title}</b>{v === 'spread' && <small>추천</small>}</span>
                    <small>{sub}</small>
                    <span className={`cu-res${warn ? ' bad' : ''}`}>{res}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      })}
      {todos.map((i) => (
        <div key={i.task.id} className="cu-todo">
          <span className="grow">{i.task.name}은 <b>오늘로</b> 옮겨요</span>
          <input type="date" aria-label="옮길 날짜" min={today} value={moveTo[i.task.id] ?? today} onChange={(e) => e.target.value && setMoveTo({ ...moveTo, [i.task.id]: e.target.value })} />
        </div>
      ))}
      <label className="cu-sw"><span className="grow">다음부터 묻지 않고 남은 날에 나누기</span><input type="checkbox" className="switch" checked={always} onChange={(e) => setAlways(e.target.checked)} /></label>
      <button className="primary" onClick={apply}>이대로 정리</button>
    </Sheet>
  )
}
