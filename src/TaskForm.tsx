import { useState } from 'react'
import { diffDays, addDays, dow, todayISO, DOW_KO } from './date.ts'
import type { Task, TaskType } from './logic.ts'
import { actions, uid, useStore } from './store.ts'
import { Field, Num, Seg, Sheet, WeekPicker } from './ui.tsx'

const ALL = [true, true, true, true, true, true, true]

export function TaskForm({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const s = useStore()
  const today = todayISO()
  const [name, setName] = useState(task?.name ?? '')
  const [type, setType] = useState<TaskType>(task?.type ?? 'amount')
  const [unit, setUnit] = useState(task?.unit ?? '쪽')
  const [mode, setMode] = useState<'range' | 'total'>(task && task.startPoint === null ? 'total' : 'range')
  const [from, setFrom] = useState<number | null>(task?.startPoint ?? 1)
  const [to, setTo] = useState<number | null>(task && task.startPoint !== null ? task.startPoint + task.amount - 1 : null)
  const [total, setTotal] = useState<number | null>(task?.type === 'amount' ? task.amount : null)
  const [perDay, setPerDay] = useState<number | null>(task && task.type !== 'time' && task.perDay ? task.perDay : null)
  const [hours, setHours] = useState<number | null>(task?.type === 'time' ? Math.floor(task.perDay / 3600) : 1)
  const [mins, setMins] = useState<number | null>(task?.type === 'time' ? Math.floor((task.perDay % 3600) / 60) : 0)
  const [startDate, setStartDate] = useState(task?.startDate ?? today)
  const [endDate, setEndDate] = useState(task ? task.endDate ?? '' : addDays(today, 29))
  const [week, setWeek] = useState(task?.week ?? ALL)
  const [repeat, setRepeat] = useState<'week' | 'day'>(task?.repeatEvery ? 'day' : 'week')
  const [every, setEvery] = useState<number | null>(task?.repeatEvery ?? 2)
  const [sup, setSup] = useState<number | null>(task?.supplementDow ?? null)
  const [categoryId, setCategoryId] = useState(task?.categoryId ?? '')
  const [notifyTime, setNotifyTime] = useState(task?.notifyTime ?? '')
  const [error, setError] = useState('')

  const amount = type !== 'amount' ? 0 : mode === 'range' ? (from !== null && to !== null ? to - from + 1 : 0) : total ?? 0
  const noEnd = endDate === ''

  // 분량 계획 미리보기: 공부일 수와 하루 분량
  let preview = ''
  if (type === 'amount' && amount > 0 && !noEnd && endDate >= startDate) {
    let days = 0
    for (let d = startDate; d <= endDate; d = addDays(d, 1)) if (week[dow(d)] && dow(d) !== sup) days++
    preview = days > 0 ? `공부하는 날 ${days}일 · 하루 약 ${Math.ceil(amount / days)}${unit}` : '기간 안에 공부하는 요일이 없습니다'
  }

  const save = () => {
    const fail = (m: string) => (setError(m), undefined)
    if (!name.trim()) return fail('계획 이름을 입력해주세요')
    if (!noEnd && endDate < startDate) return fail('종료일이 시작일보다 빠릅니다')
    if (!week.some(Boolean) && (type === 'amount' || repeat === 'week')) return fail('공부할 요일을 선택해주세요')
    let per = 0
    if (type === 'amount') {
      if (amount <= 0) return fail(mode === 'range' ? '범위를 입력해주세요' : '총 분량을 입력해주세요')
      if (noEnd && !perDay) return fail('종료일이 없으면 하루 분량을 입력해주세요')
      per = noEnd ? perDay! : 0
    } else if (type === 'daily') {
      if (!perDay) return fail('하루 분량을 입력해주세요')
      per = perDay
    } else if (type === 'time') {
      per = (hours ?? 0) * 3600 + (mins ?? 0) * 60
      if (per <= 0) return fail('하루 목표 시간을 입력해주세요')
    }
    if (type !== 'amount' && repeat === 'day' && (!every || every < 2)) return fail('반복 간격은 2일 이상으로 입력해주세요')

    actions.saveTask({
      id: task?.id ?? uid(),
      name: name.trim(),
      type,
      unit: type === 'amount' || type === 'daily' ? unit.trim() : '',
      startPoint: type === 'amount' && mode === 'range' ? from : null,
      amount,
      perDay: per,
      startDate,
      endDate: noEnd ? null : endDate,
      week,
      repeatEvery: type !== 'amount' && repeat === 'day' ? every : null,
      supplementDow: type === 'amount' ? sup : null,
      custom: task?.custom ?? {},
      categoryId: categoryId || null,
      notifyTime: notifyTime || null,
      completed: task?.completed ?? false,
      completedDate: task?.completedDate ?? null,
      archived: task?.archived ?? false,
      order: task?.order ?? Math.max(0, ...s.tasks.map((t) => t.order)) + 1,
      createdAt: task?.createdAt ?? Date.now(),
    })
    onClose()
  }

  return (
    <Sheet title={task ? '계획 수정' : '새 계획'} onClose={onClose}>
      <Field label="계획 이름">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 수학의 정석" autoFocus={!task} />
      </Field>

      <Field label="계획 종류">
        <Seg value={type} onChange={setType} options={[['amount', '분량'], ['daily', '매일 반복'], ['time', '시간'], ['check', '체크']]} />
      </Field>
      <p className="hint">
        {type === 'amount' && '전체 분량을 기간에 맞춰 자동 분배합니다. 밀리면 남은 날에 다시 나눕니다.'}
        {type === 'daily' && '매번 같은 분량을 반복합니다. 예) 단어 30개'}
        {type === 'time' && '하루 목표 시간을 정하고 스톱워치로 채웁니다.'}
        {type === 'check' && '했는지 안 했는지만 체크합니다.'}
      </p>

      {type === 'amount' && (
        <>
          <Field label="분량 입력 방식">
            <Seg value={mode} onChange={setMode} options={[['range', '범위 (시작~끝)'], ['total', '총 분량']]} />
          </Field>
          <div className="row">
            {mode === 'range' ? (
              <>
                <Field label="시작"><Num value={from} onChange={setFrom} placeholder="1" /></Field>
                <Field label="끝"><Num value={to} onChange={setTo} placeholder="300" /></Field>
              </>
            ) : (
              <Field label="총 분량"><Num value={total} onChange={setTotal} min={1} placeholder="50" /></Field>
            )}
            <Field label="단위"><input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="쪽, 개, 강" /></Field>
          </div>
        </>
      )}
      {type === 'daily' && (
        <div className="row">
          <Field label="하루 분량"><Num value={perDay} onChange={setPerDay} min={1} placeholder="30" /></Field>
          <Field label="단위"><input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="개" /></Field>
        </div>
      )}
      {type === 'time' && (
        <div className="row">
          <Field label="하루 목표 (시간)"><Num value={hours} onChange={setHours} /></Field>
          <Field label="(분)"><Num value={mins} onChange={setMins} /></Field>
        </div>
      )}

      <div className="row">
        <Field label="시작일"><input type="date" value={startDate} onChange={(e) => e.target.value && setStartDate(e.target.value)} /></Field>
        <Field label={type === 'amount' ? '종료일' : '종료일 (비우면 계속)'}>
          <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
      </div>
      {type === 'amount' && noEnd && (
        <Field label="하루 분량 (종료일 없이 진행)"><Num value={perDay} onChange={setPerDay} min={1} placeholder="10" /></Field>
      )}
      {!noEnd && endDate >= startDate && <p className="hint">총 {diffDays(startDate, endDate) + 1}일</p>}

      {type !== 'amount' && (
        <Field label="반복 설정">
          <Seg value={repeat} onChange={setRepeat} options={[['week', '요일마다'], ['day', 'N일마다']]} />
        </Field>
      )}
      {type !== 'amount' && repeat === 'day' ? (
        <Field label="며칠마다 반복할까요?"><Num value={every} onChange={setEvery} min={2} placeholder="3" /></Field>
      ) : (
        <Field label="공부할 요일"><WeekPicker value={week} onChange={setWeek} disabled={type === 'amount' ? sup : null} /></Field>
      )}

      {type === 'amount' && (
        <>
          <Field label="보충 요일 (밀린 분량을 몰아서 하는 날)">
            <select value={sup ?? ''} onChange={(e) => setSup(e.target.value === '' ? null : Number(e.target.value))}>
              <option value="">없음 — 밀리면 남은 날에 재분배</option>
              {[1, 2, 3, 4, 5, 6, 0].map((i) => <option key={i} value={i}>{DOW_KO[i]}요일</option>)}
            </select>
          </Field>
          {preview && <p className="preview">{preview}</p>}
        </>
      )}

      <div className="row">
        <Field label="카테고리">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">카테고리 없음</option>
            {s.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="계획 시작 알림">
          <input type="time" value={notifyTime} onChange={(e) => setNotifyTime(e.target.value)} />
        </Field>
      </div>

      {error && <p className="error">{error}</p>}
      <button className="primary" onClick={save}>저장하기</button>
    </Sheet>
  )
}
