// 계획 관리 (RPlans): 진행 중 · 멈춘 것 · 끝낸 것, 5가지 분류로 묶음
import { useState } from 'react'
import { Icon } from './Icon.tsx'
import { todayISO } from './date.ts'
import { isFinished, sumDone, type Task, type TaskKind } from './logic.ts'
import { actions, useStore } from './store.ts'
import { KIND_NAME, hm } from './todayData.ts'
import { FullPage } from './ui.tsx'
import { colorOf } from './view.ts'
import { habitDays } from './todayData.ts'

const md = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}.${Number(d)}` }
const KIND_ORDER: TaskKind[] = ['book', 'lecture', 'time', 'habit', 'todo']

export function Plans({ onClose, edit }: { onClose: () => void; edit: (t: Task) => void }) {
  const s = useStore()
  const today = todayISO()
  const [view, setView] = useState<'doing' | 'paused' | 'done'>('doing')
  const finished = (t: Task) => !t.archived && isFinished(t, today)
  const groups = {
    doing: s.tasks.filter((t) => !t.archived && !finished(t)),
    paused: s.tasks.filter((t) => t.archived),
    done: s.tasks.filter(finished),
  }
  const list = [...groups[view]].sort((a, b) => a.order - b.order)

  const sub = (t: Task) => {
    const recs = s.recs[t.id] ?? {}
    if (t.type === 'amount') return `${md(t.startDate)}${t.endDate ? ` ~ ${md(t.endDate)}` : ''} · ${sumDone(recs)} / ${t.amount}${t.unit}`
    if (t.kind === 'time') return `매일 ${hm(t.perDay)} · ${t.endDate ? `${md(t.endDate)}까지` : '계속'}`
    if (t.kind === 'habit') return `${t.repeatEvery ? `${t.repeatEvery}일마다` : t.week.every(Boolean) ? '매일' : '요일마다'} · 연속 ${habitDays(s, t, today, 16).streak}일`
    return t.due ? `${md(t.due)}까지` : md(t.startDate)
  }
  const swap = (a: Task, b: Task | undefined) => {
    if (!b) return
    actions.patchTask(a.id, { order: b.order })
    actions.patchTask(b.id, { order: a.order })
  }

  return (
    <FullPage title="계획 관리" onClose={onClose}>
      <div role="tablist" aria-label="보기" className="segs">
        {([['doing', '진행 중'], ['paused', '멈춘 것'], ['done', '끝낸 것']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={view === k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l} {groups[k].length}</button>
        ))}
      </div>
      {view === 'doing' && <p className="fnote">위아래 화살표로 순서를 바꾸고, 멈춤·끝냄으로 정리해요.</p>}
      {list.length === 0 && <p className="empty">{view === 'doing' ? '진행 중인 계획이 없어요' : view === 'paused' ? '멈춘 계획이 없어요' : '끝낸 계획이 없어요'}</p>}
      {KIND_ORDER.map((k) => {
        const rows = list.filter((t) => t.kind === k)
        if (!rows.length) return null
        return (
          <section key={k} className="tcard tight plgroup" aria-label={KIND_NAME[k]}>
            <div className="tc-meta pad"><b className="big16">{KIND_NAME[k]}</b><span>{rows.length}</span></div>
            {rows.map((t, i) => (
              <div key={t.id} className="plrow2">
                <button className="plmain" onClick={() => edit(t)}>
                  <i className="dot" style={{ background: colorOf(s, t) }} />
                  <span className="grow"><b className="blk ell">{t.name}</b><small className="blk ell">{sub(t)}</small></span>
                </button>
                {view === 'doing' && (
                  <span className="plact">
                    <button aria-label={`${t.name} 위로`} disabled={i === 0} onClick={() => swap(t, rows[i - 1])}><Icon name="left" size={14} /></button>
                    <button aria-label={`${t.name} 아래로`} disabled={i === rows.length - 1} onClick={() => swap(t, rows[i + 1])}><Icon name="right" size={14} /></button>
                    <button className="chip" onClick={() => actions.pauseTask(t.id, today)}>멈춤</button>
                    <button className="chip" onClick={() => actions.patchTask(t.id, { completed: true, completedDate: today })}>끝냄</button>
                  </span>
                )}
                {view === 'paused' && <button className="chip" onClick={() => actions.resumeTask(t.id, today)}>다시 시작</button>}
                {view === 'done' && <button className="chip" onClick={() => actions.patchTask(t.id, { completed: false, completedDate: null })}>되돌리기</button>}
              </div>
            ))}
          </section>
        )
      })}
    </FullPage>
  )
}
