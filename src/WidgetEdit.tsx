// 위젯 편집 (RWidgetEdit): 실제 위젯을 그대로 보여 주고, − 로 빼고, 크기 칩으로 넓게·작게, 길게 눌러 옮긴다.
import { useRef, useState } from 'react'
import { todayISO } from './date.ts'
import { Icon } from './Icon.tsx'
import { actions, useStore, WIDGET_MAX, type WidgetId, type WidgetSlot } from './store.ts'
import { dayStats } from './todayData.ts'
import { renderWidget } from './widgets.tsx'

const INFO: Record<WidgetId, [string, string]> = {
  today: ['오늘 공부', '과목별 도넛과 목표 시간'],
  left: ['남은 공부', '남은 시간과 끝나는 때'],
  exam: ['시험 진도', 'D-day와 범위 진도 게이지'],
  week: ['최근 7일', '하루 공부 시간 막대'],
  streak: ['연속 공부', '연속 일수와 최고 기록'],
  subjects: ['과목 비중', '오늘 과목별 공부 시간'],
  review: ['다음 복습', '복습할 때가 된 단원'],
  weekGoal: ['이번 주 목표', '이번 주 달성률'],
  tomorrow: ['내일 미리 보기', '내일 첫 공부와 분량'],
  memo: ['오늘 메모', '마지막으로 남긴 한 줄'],
  quickStart: ['바로 시작', '마지막 계획으로 스톱워치'],
}
const ALL: WidgetId[] = ['today', 'left', 'exam', 'week', 'streak', 'subjects', 'review', 'weekGoal', 'tomorrow', 'memo', 'quickStart']

/** 더할 수 있는 위젯의 작은 미리보기 그림 */
function Thumb({ id }: { id: WidgetId }) {
  switch (id) {
    case 'subjects': return <span className="th-g"><i style={{ flex: 3, background: 'var(--s-m)' }} /><i style={{ flex: 2, background: 'var(--s-k)' }} /><i style={{ flex: 1, background: 'var(--s-e)' }} /></span>
    case 'review': return <span className="th-g bars">{[6, 10, 14].map((h, i) => <i key={i} style={{ height: h, background: i ? 'var(--trk)' : 'var(--bad)' }} />)}</span>
    case 'weekGoal': return <span className="th-g"><svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="8" fill="none" stroke="var(--trk)" strokeWidth="4" /><circle cx="11" cy="11" r="8" fill="none" stroke="var(--ink)" strokeWidth="4" strokeDasharray="38 50" transform="rotate(-90 11 11)" /></svg></span>
    case 'tomorrow': return <span className="th-g">{[1, 1, 0].map((on, i) => <i key={i} style={{ flex: 1, height: 12, background: on ? 'var(--s-m)' : 'var(--trk)' }} />)}</span>
    case 'memo': return <span className="th-g col"><i style={{ width: '80%' }} /><i style={{ width: '55%' }} /></span>
    case 'quickStart': return <span className="th-g"><span className="th-play"><Icon name="play" size={12} /></span></span>
    default: return <span className="th-g" />
  }
}

export function WidgetEdit({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const today = todayISO()
  const stats = dayStats(s, today, today)
  const [list, setList] = useState<WidgetSlot[]>(s.settings.widgets)
  const [dragId, setDragId] = useState<WidgetId | null>(null)
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const addable = ALL.filter((id) => !list.some((w) => w.id === id))
  const done = () => { actions.setSettings({ widgets: list }); onClose() }

  // 길게 누르면 집고, 손가락 아래 위젯 자리로 옮긴다
  const startHold = (id: WidgetId) => () => {
    clearTimeout(hold.current)
    hold.current = setTimeout(() => setDragId(id), 300)
  }
  const cancelHold = () => clearTimeout(hold.current)
  const onMove = (e: React.PointerEvent) => {
    if (!dragId) return
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-wid]') as HTMLElement | null
    const over = el?.dataset.wid as WidgetId | undefined
    if (!over || over === dragId) return
    const from = list.findIndex((w) => w.id === dragId)
    const to = list.findIndex((w) => w.id === over)
    const next = [...list]
    const [x] = next.splice(from, 1)
    next.splice(to, 0, x)
    setList(next)
  }
  const endDrag = () => { cancelHold(); setDragId(null) }

  // 넓은 위젯은 한 줄, 작은 위젯은 둘씩
  const rows: WidgetSlot[][] = []
  let pair: WidgetSlot[] = []
  for (const w of list) {
    if (w.wide) { if (pair.length) { rows.push(pair); pair = [] } rows.push([w]) } else { pair.push(w); if (pair.length === 2) { rows.push(pair); pair = [] } }
  }
  if (pair.length) rows.push(pair)

  return (
    <div className="fullpage" role="dialog" aria-label="오늘 위젯 편집">
      <header className="fp-h">
        <button className="fp-b" onClick={onClose}>취소</button>
        <h1>오늘 위젯</h1>
        <button className="fp-b strong" onClick={done}>완료</button>
      </header>
      <div className="fp-body" onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <p className="fnote top">길게 눌러 옮기고, 크기 버튼으로 넓게·작게 바꿔요. <b>{list.length} / {WIDGET_MAX}개</b></p>
        <div className={`we-grid${dragId ? ' dragging' : ''}`}>
          {rows.map((r, i) => (
            <div key={i} className={r[0].wide ? 'we-row wide' : 'we-row'}>
              {r.map((w) => (
                <div key={w.id} data-wid={w.id} className={`we-tile${dragId === w.id ? ' lifted' : ''}`} onPointerDown={startHold(w.id)} onPointerUp={cancelHold} onPointerLeave={() => !dragId && cancelHold()}>
                  <div className="we-live" aria-hidden="true">{renderWidget(w, s, today, today, stats)}</div>
                  <button className="we-minus" aria-label={`${INFO[w.id][0]} 빼기`} onPointerDown={(e) => e.stopPropagation()} onClick={() => setList(list.filter((x) => x.id !== w.id))}><Icon name="minus" size={14} stroke={3} /></button>
                  <button className="we-size" aria-label={`${INFO[w.id][0]} ${w.wide ? '작게' : '넓게'}`} onPointerDown={(e) => e.stopPropagation()} onClick={() => setList(list.map((x) => (x.id === w.id ? { ...x, wide: !x.wide } : x)))}>{w.wide ? '넓게' : '작게'}</button>
                </div>
              ))}
            </div>
          ))}
          {list.length === 0 && <p className="empty tight">위젯이 없어요. 아래에서 더해요.</p>}
        </div>
        <div className="fp-h2 fsplit"><h2>더할 수 있는 위젯</h2><small>{addable.length}개</small></div>
        <section className="tcard tight">
          {addable.map((id) => (
            <div key={id} className="frow wrow">
              <Thumb id={id} />
              <span className="grow"><b className="blk">{INFO[id][0]}</b><small className="blk mu">{INFO[id][1]}</small></span>
              <button className="we-add" aria-label={`${INFO[id][0]} 더하기`} disabled={list.length >= WIDGET_MAX} onClick={() => setList([...list, { id, wide: id === 'today' }])}><Icon name="plus" size={18} /></button>
            </div>
          ))}
          {addable.length === 0 && <p className="empty tight">모든 위젯을 쓰고 있어요</p>}
        </section>
      </div>
    </div>
  )
}
