// 분량 입력 시트, 스톱워치를 끝낸 뒤 기록 시트.
import { useState } from 'react'
import { Icon } from './Icon.tsx'
import { fmtDur } from './date.ts'
import { sumDone, type Grade } from './logic.ts'
import { actions, type State } from './store.ts'
import { hm } from './todayData.ts'
import { Sheet } from './ui.tsx'
import { colorOf, type Item } from './view.ts'

const GRADES: [Grade, string][] = [['high', '상'], ['mid', '중'], ['low', '하']]

/** −/+ 큰 숫자 */
export function Stepper({ value, unit, min, max, onChange, label }: { value: number; unit: string; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="stepper">
      <button type="button" aria-label={`${label} 빼기`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}><b>−</b></button>
      <span><b>{value}</b><small>{unit}</small></span>
      <button type="button" aria-label={`${label} 더하기`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}><b>+</b></button>
    </div>
  )
}

/** 쪽 칸 + 리본 (오늘 목표 범위가 14칸 이하일 때) */
export function Cells({ from, to, pos, color, onPick }: { from: number; to: number; pos: number; color: string; onPick: (n: number) => void }) {
  const n = to - from + 1
  const cells = Array.from({ length: n }, (_, i) => from + i)
  const rib = ((pos - from + 1) / n) * 100
  return (
    <div className="cells" role="group" aria-label={`오늘 쪽: ${pos >= from ? `${pos}쪽까지 함` : '아직 안 함'}`}>
      {cells.map((c) => (
        <button key={c} type="button" className={c <= pos ? 'on' : ''} style={c <= pos ? { background: color } : undefined} onClick={() => onPick(c === pos ? c - 1 : c)}>{c}</button>
      ))}
      {pos >= from && pos < to + 1 && <span className="rib" style={{ left: `${rib}%` }} aria-hidden="true" />}
    </div>
  )
}

/** 오늘 한 분량 입력. 목차 계획은 쪽 번호로, 그 밖에는 한 양으로 센다 */
export function EntrySheet({ s, item, date, onClose, onFinish }: { s: State; item: Item; date: string; onClose: () => void; onFinish?: (taskId: string, chapterId: string) => void }) {
  const { task, expect } = item
  const recs = s.recs[task.id] ?? {}
  const before = sumDone(recs, date)
  const alreadyToday = item.rec?.done ?? 0
  const room = task.type === 'amount' ? Math.max(task.amount - before, 0) : Infinity
  const hasPos = task.type === 'amount' && task.startPoint !== null
  const base = hasPos ? task.startPoint! - 1 + before : 0 // 오늘 시작 직전 위치
  const [done, setDone] = useState(alreadyToday)
  const [note, setNote] = useState(item.rec?.note ?? '')
  const [right, setRight] = useState(item.rec?.right ?? 0)
  const [wrong, setWrong] = useState(item.rec?.wrong ?? 0)
  const v = Math.min(done, room)
  const pos = base + v
  const color = colorOf(s, task)
  const unit = task.unit || '분량'
  const isWork = task.bookMode === 'workbook'

  // 이 입력으로 끝나는 단원
  const finishing = hasPos ? task.chapters?.find((c) => c.to <= pos && c.to > base && !c.doneDate) : undefined
  const chapterEnd = hasPos ? task.chapters?.find((c) => c.to > base)?.to : undefined
  const goalTo = hasPos ? base + expect : expect
  const set = (n: number) => setDone(Math.max(0, Math.min(room, hasPos ? n - base : n)))
  const startFrom = hasPos ? base + 1 : 1
  const showCells = hasPos && expect > 0 && expect <= 14

  const save = () => {
    actions.setDone(task.id, date, v)
    actions.setNote(task.id, date, note)
    if (isWork) actions.setScore(task.id, date, right, wrong)
    onClose()
    if (finishing) onFinish?.(task.id, finishing.id)
  }
  const curChapter = task.chapters?.find((c) => c.to > base)

  return (
    <Sheet title={`${task.name} 분량 입력`} onClose={onClose}>
      <div className="entry-sub"><i style={{ background: color }} />{curChapter ? `${curChapter.name} · ` : ''}오늘 목표 {hasPos ? `${startFrom}~${goalTo}${task.unit}` : `${expect}${unit}`}</div>
      <div className="entry-q">어디까지 했나요?</div>
      <Stepper label={hasPos ? '쪽' : unit} value={hasPos ? pos : v} unit={task.unit || unit} min={hasPos ? base : 0} max={hasPos ? base + room : room} onChange={(n) => set(n)} />
      <p className="entry-left">오늘 <b>{v}</b> / {expect}{unit} · {v >= expect ? '목표를 채웠어요' : <b className="bad">{expect - v}{unit} 남음</b>}</p>
      {showCells && <Cells from={startFrom} to={goalTo} pos={pos} color={color} onPick={set} />}
      <div className="chips">
        <button type="button" onClick={() => set(hasPos ? goalTo : expect)}>{hasPos ? `${goalTo}${task.unit}까지 · 오늘 목표` : '오늘 목표만큼'}</button>
        {chapterEnd !== undefined && chapterEnd > goalTo && <button type="button" onClick={() => set(chapterEnd)}>{chapterEnd}{task.unit} · {curChapter?.name} 끝</button>}
      </div>
      <div className="entry-rows">
        <div><span>공부한 시간</span><b>{hm(item.rec?.sec ?? 0)}</b><small>스톱워치</small></div>
        {isWork && (
          <div><span>맞은 · 틀린 수</span>
            <input aria-label="맞은 수" className="mini" type="number" inputMode="numeric" min={0} value={right} onChange={(e) => setRight(Math.max(0, Number(e.target.value) || 0))} />
            <input aria-label="틀린 수" className="mini" type="number" inputMode="numeric" min={0} value={wrong} onChange={(e) => setWrong(Math.max(0, Number(e.target.value) || 0))} />
          </div>
        )}
        {curChapter && <div><span>{curChapter.name}</span><small>끝내면 이해도를 물어봐요</small></div>}
        <label className="note"><Icon name="pencil" size={18} /><input value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} placeholder="헷갈린 것이나 다음에 할 것 한 줄" aria-label="메모" /></label>
      </div>
      <button className="primary" onClick={save}>저장</button>
    </Sheet>
  )
}

/** 스톱워치를 끝낸 뒤: 얼마나 했는지, 어디까지 했는지 기록 */
export function EndSheet({ s, rec, tasks, onClose }: { s: State; rec: { id: string; taskId: string; date: string; sec: number }; tasks: Item[]; onClose: () => void }) {
  const [taskId, setTaskId] = useState(rec.taskId)
  const [pickTask, setPickTask] = useState(false)
  const item = tasks.find((i) => i.task.id === taskId)
  const task = item?.task
  const counts = !!task && (task.type === 'amount' || task.type === 'daily')
  const before = task ? sumDone(s.recs[task.id] ?? {}, rec.date) : 0
  const [done, setDone] = useState(item?.rec?.done ?? 0)
  const [note, setNote] = useState('')
  const room = task && task.type === 'amount' ? Math.max(task.amount - before, 0) : Infinity
  const hasPos = !!task && task.type === 'amount' && task.startPoint !== null
  const base = hasPos ? task!.startPoint! - 1 + before : 0
  const v = Math.min(done, room)
  const blocks = Math.max(Math.round(rec.sec / 600), 1)
  const total = (item?.rec?.sec ?? 0)

  const finish = (withAmount: boolean) => {
    if (taskId !== rec.taskId) actions.reassignHistory(rec.id, taskId)
    if (withAmount && task) {
      if (counts) actions.setDone(task.id, rec.date, v)
      actions.setNote(task.id, rec.date, note)
    }
    onClose()
  }
  return (
    <Sheet title={`${fmtDur(rec.sec)} 공부했어요`} onClose={() => finish(false)}>
      <div className="blocks" role="img" aria-label={`10분 칸 ${blocks}개`}>{Array.from({ length: Math.min(blocks, 18) }, (_, i) => <i key={i} />)}</div>
      <p className="entry-left">오늘 이 계획 <b>{hm(total)}</b> · 오늘 전체 <b>{hm(Object.values(s.recs).reduce((a, r) => a + (r[rec.date]?.sec ?? 0), 0))}</b></p>
      <div className="entry-rows">
        <div>
          <span>계획</span>
          <b className="grow">{task?.name ?? '—'}</b>
          <button type="button" className="chip" onClick={() => setPickTask(!pickTask)}>바꾸기</button>
        </div>
        {pickTask && (
          <div className="pick">{tasks.filter((i) => i.task.kind !== 'todo').map((i) => (
            <button key={i.task.id} type="button" aria-pressed={i.task.id === taskId} className={i.task.id === taskId ? 'on' : ''} onClick={() => { setTaskId(i.task.id); setDone(i.rec?.done ?? 0); setPickTask(false) }}>{i.task.name}</button>
          ))}</div>
        )}
      </div>
      {task && counts && (
        <>
          <div className="entry-q">{hasPos ? '어디까지 했나요?' : '얼마나 했나요?'}</div>
          <Stepper label={task.unit || '분량'} value={hasPos ? base + v : v} unit={task.unit} min={hasPos ? base : 0} max={hasPos ? base + room : room} onChange={(n) => setDone(Math.max(0, hasPos ? n - base : n))} />
        </>
      )}
      <div className="entry-rows"><label className="note"><Icon name="pencil" size={18} /><input value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} placeholder="헷갈린 것이나 다음에 할 것 한 줄" aria-label="메모" /></label></div>
      <div className="two">
        <button type="button" className="ghost" onClick={() => finish(false)}>시간만 저장</button>
        <button type="button" className="primary" onClick={() => finish(true)}>저장</button>
      </div>
    </Sheet>
  )
}
