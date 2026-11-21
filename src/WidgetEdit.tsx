// 위젯 편집 (RWidgetEdit): 빼기, 크기, 순서, 더하기
import { actions, useStore, WIDGET_MAX, type WidgetId, type WidgetSlot } from './store.ts'
import { Icon } from './Icon.tsx'
import { FullPage } from './ui.tsx'

const INFO: Record<WidgetId, [string, string]> = {
  today: ['오늘 공부', '과목별 도넛과 목표 시간'],
  left: ['남은 공부', '남은 시간과 끝나는 때'],
  exam: ['시험 진도', 'D-day와 범위 진도 게이지'],
  week: ['최근 7일', '하루 공부 시간 막대'],
  streak: ['연속 공부', '연속 일수와 최고 기록'],
  subjects: ['과목 비중', '오늘 과목별 공부 시간'],
  review: ['다음 복습', '복습할 때가 된 단원'],
  weekGoal: ['이번 주 목표', '이번 주 달성률 · 개수'],
  tomorrow: ['내일 미리 보기', '내일 첫 공부와 분량'],
  memo: ['오늘 메모', '마지막으로 남긴 한 줄'],
  quickStart: ['바로 시작', '마지막 계획으로 스톱워치'],
}
const ALL: WidgetId[] = ['today', 'left', 'exam', 'week', 'streak', 'subjects', 'review', 'weekGoal', 'tomorrow', 'memo', 'quickStart']

export function WidgetEdit({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const list = s.settings.widgets
  const set = (widgets: WidgetSlot[]) => actions.setSettings({ widgets })
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= list.length) return
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    set(next)
  }
  const addable = ALL.filter((id) => !list.some((w) => w.id === id))
  return (
    <FullPage title="오늘 위젯" onClose={onClose}>
      <p className="fnote top">위아래 화살표로 옮기고, 크기 버튼으로 넓게·작게 바꿔요. <b>{list.length} / {WIDGET_MAX}개</b></p>
      <section className="fcard tight">
        {list.map((w, i) => (
          <div key={w.id} className="frow wrow">
            <button className="sq" aria-label={`${INFO[w.id][0]} 빼기`} onClick={() => set(list.filter((x) => x.id !== w.id))}><Icon name="close" size={16} /></button>
            <span className="grow"><b className="blk ell">{INFO[w.id][0]}</b><small className="blk mu ell">{INFO[w.id][1]}</small></span>
            <button className="chip" aria-pressed={w.wide} onClick={() => set(list.map((x) => (x.id === w.id ? { ...x, wide: !x.wide } : x)))}>{w.wide ? '넓게' : '작게'}</button>
            <span className="plact">
              <button aria-label="위로" disabled={i === 0} onClick={() => move(i, -1)} className="rot"><Icon name="left" size={14} /></button>
              <button aria-label="아래로" disabled={i === list.length - 1} onClick={() => move(i, 1)} className="rot"><Icon name="right" size={14} /></button>
            </span>
          </div>
        ))}
        {list.length === 0 && <p className="empty tight">위젯이 없어요. 아래에서 더해요.</p>}
      </section>
      <div className="fp-h2 fsplit"><h2>더할 수 있는 위젯</h2><small>{addable.length}개</small></div>
      <section className="fcard tight">
        {addable.map((id) => (
          <div key={id} className="frow wrow">
            <button className="sq ink" aria-label={`${INFO[id][0]} 더하기`} disabled={list.length >= WIDGET_MAX} onClick={() => set([...list, { id, wide: id === 'today' }])}><Icon name="plus" size={16} /></button>
            <span className="grow"><b className="blk">{INFO[id][0]}</b><small className="blk mu">{INFO[id][1]}</small></span>
          </div>
        ))}
        {addable.length === 0 && <p className="empty tight">모든 위젯을 쓰고 있어요</p>}
      </section>
    </FullPage>
  )
}
