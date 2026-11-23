// 위젯 편집 (One UI 방식): 칸 격자를 그대로 보여 주고, 길게 눌러 들어 올려 옮기면 다른 위젯이 미끄러지듯 비켜요.
// 누르면 그 위젯이 쓸 수 있는 크기만 칩으로. − 로 빼고, 아래 목록에서 더해요. 개수 제한 없음.
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { todayISO } from './date.ts'
import { Icon } from './Icon.tsx'
import { actions, useStore, WIDGET_SIZES, type WidgetId, type WidgetSize, type WidgetSlot } from './store.ts'
import { dayStats } from './todayData.ts'
import { renderWidget } from './widgets.tsx'

const INFO: Record<WidgetId, [string, string]> = {
  progress: ['오늘 진행', '계획별 진행과 끝나는 시각, 다음 할 것'],
  review: ['오늘 복습', '잊을 때쯤 다시 볼 단원'],
  slack: ['시험까지 여유', '계획별 여유 며칠, 가장 빠듯한 것'],
  recall: ['떠올리기', '끝낸 단원을 덮고 떠올려 이해도 고르기'],
  wrong: ['다시 풀 문항', '틀린 문항을 단원별로, 오답만 풀기'],
  umap: ['이해도 지도', '단원별 이해도와 자신감 vs 정답률'],
  today: ['오늘 공부 시간', '과목별 도넛과 목표 시간'],
  left: ['남은 공부', '남은 시간과 끝나는 때'],
  exam: ['시험 진도', 'D-day와 범위 진도 게이지'],
  week: ['최근 7일', '하루 공부 시간 막대'],
  streak: ['연속 공부', '연속 일수와 최고 기록'],
  subjects: ['과목 비중', '오늘 과목별 공부 시간'],
  weekGoal: ['이번 주 목표', '이번 주 달성률'],
  tomorrow: ['내일 미리 보기', '내일 첫 공부와 분량'],
  memo: ['오늘 메모', '마지막으로 남긴 한 줄'],
  quickStart: ['바로 시작', '마지막 계획으로 스톱워치'],
}
const ALL = Object.keys(INFO) as WidgetId[]
const SIZE_NAME: Record<WidgetSize, string> = { s1: '작게', s2: '넓게', s4: '크게' }
const reduce = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function WidgetEdit({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const today = todayISO()
  const stats = dayStats(s, today, today)
  const [list, setList] = useState<WidgetSlot[]>(s.settings.widgets)
  const [sel, setSel] = useState<WidgetId | null>(null)
  const [drag, setDrag] = useState<WidgetId | null>(null)
  const els = useRef(new Map<WidgetId, HTMLDivElement>())
  const prev = useRef(new Map<WidgetId, DOMRect>())
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const grab = useRef<{ id: WidgetId; dx: number; dy: number; x: number; y: number; moved: boolean } | null>(null)
  const body = useRef<HTMLDivElement>(null)
  const dragRef = useRef<WidgetId | null>(null)
  dragRef.current = drag
  // 들어 올린 동안에는 화면 스크롤을 막는다 (손가락을 따라 옮기도록)
  useEffect(() => {
    const el = body.current
    if (!el) return
    const stop = (e: TouchEvent) => { if (dragRef.current) e.preventDefault() }
    el.addEventListener('touchmove', stop, { passive: false })
    return () => el.removeEventListener('touchmove', stop)
  }, [])
  const addable = ALL.filter((id) => !list.some((w) => w.id === id))
  const done = () => { actions.setSettings({ widgets: list }); onClose() }

  // 자리 바뀜 애니메이션(FLIP): 바뀌기 전 자리에서 새 자리로 미끄러진다
  const snapshot = () => { prev.current = new Map([...els.current].map(([id, el]) => [id, el.getBoundingClientRect()])) }
  const change = (next: WidgetSlot[]) => { snapshot(); setList(next) }
  useLayoutEffect(() => {
    if (reduce()) return
    for (const [id, el] of els.current) {
      const a = prev.current.get(id)
      if (!a || id === drag) continue
      const b = el.getBoundingClientRect()
      const dx = a.left - b.left
      const dy = a.top - b.top
      const sx = a.width / b.width
      const sy = a.height / b.height
      if (!dx && !dy && sx === 1 && sy === 1) continue
      el.style.transition = 'none'
      el.style.transformOrigin = '0 0'
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
      requestAnimationFrame(() => {
        el.style.transition = 'transform .28s cubic-bezier(.2,.9,.3,1.15)'
        el.style.transform = ''
      })
    }
    prev.current = new Map()
  }, [list, drag])

  // 길게 누르면 들어 올리고, 손가락을 따라 움직인다
  const down = (id: WidgetId) => (e: RPointerEvent) => {
    const el = els.current.get(id)!
    const r = el.getBoundingClientRect()
    grab.current = { id, dx: e.clientX - r.left, dy: e.clientY - r.top, x: e.clientX, y: e.clientY, moved: false }
    clearTimeout(hold.current)
    hold.current = setTimeout(() => { setDrag(id); setSel(null); navigator.vibrate?.(10) }, 280)
  }
  const follow = (id: WidgetId, x: number, y: number) => {
    const el = els.current.get(id)
    const g = grab.current
    if (!el || !g) return
    // 레이아웃 자리(변형 전)를 기준으로 손가락 위치까지 옮긴다
    const parent = el.offsetParent as HTMLElement
    const pr = parent.getBoundingClientRect()
    const tx = x - g.dx - (pr.left + el.offsetLeft)
    const ty = y - g.dy - (pr.top + el.offsetTop)
    el.style.transition = 'none'
    el.style.transform = `translate(${tx}px, ${ty}px) scale(1.04)`
  }
  const move = (e: RPointerEvent) => {
    const g = grab.current
    if (!g) return
    if (!drag) {
      if (Math.hypot(e.clientX - g.x, e.clientY - g.y) > 8) { clearTimeout(hold.current); grab.current = null }
      return
    }
    e.preventDefault()
    g.moved = true
    follow(drag, e.clientX, e.clientY)
    const over = (document.elementsFromPoint(e.clientX, e.clientY).map((n) => n.closest('[data-wid]')).find((n) => n && (n as HTMLElement).dataset.wid !== drag) as HTMLElement | undefined)?.dataset.wid as WidgetId | undefined
    if (!over) return
    const from = list.findIndex((w) => w.id === drag)
    const to = list.findIndex((w) => w.id === over)
    if (from < 0 || to < 0 || from === to) return
    const next = [...list]
    const [x] = next.splice(from, 1)
    next.splice(to, 0, x)
    change(next)
    requestAnimationFrame(() => follow(drag, e.clientX, e.clientY))
  }
  const up = () => {
    clearTimeout(hold.current)
    const g = grab.current
    grab.current = null
    if (drag) {
      // 놓으면 제자리로 안착
      const el = els.current.get(drag)
      if (el) { el.style.transition = reduce() ? 'none' : 'transform .25s cubic-bezier(.2,.9,.3,1.2)'; el.style.transform = '' }
      setDrag(null)
    } else if (g && !g.moved) setSel(sel === g.id ? null : g.id)
  }
  const resize = (id: WidgetId, size: WidgetSize) => change(list.map((x) => (x.id === id ? { ...x, size } : x)))

  return (
    <div className="fullpage" role="dialog" aria-label="오늘 위젯 편집">
      <header className="fp-h">
        <button className="fp-b" onClick={onClose}>취소</button>
        <h1>오늘 위젯</h1>
        <button className="fp-b strong" onClick={done}>완료</button>
      </header>
      <div ref={body} className="fp-body" onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <p className="fnote top">길게 눌러 옮기고, 누르면 크기를 골라요.</p>
        <div className={`wgrid edit${drag ? ' dragging' : ''}`}>
          {list.map((w) => (
            <div key={w.id} data-wid={w.id} ref={(el) => { if (el) els.current.set(w.id, el); else els.current.delete(w.id) }}
              className={`we-cell ${w.size}${drag === w.id ? ' lifted' : ''}${sel === w.id ? ' sel' : ''}`} onPointerDown={down(w.id)}>
              <div className="we-live" aria-hidden="true">{renderWidget(w, s, today, today, stats)}</div>
              <button className="we-minus" aria-label={`${INFO[w.id][0]} 빼기`} onPointerDown={(e) => e.stopPropagation()} onClick={() => change(list.filter((x) => x.id !== w.id))}><Icon name="minus" size={14} stroke={3} /></button>
              {sel === w.id && WIDGET_SIZES[w.id].length > 1 && (
                <div className="we-sizes" role="radiogroup" aria-label={`${INFO[w.id][0]} 크기`} onPointerDown={(e) => e.stopPropagation()}>
                  {(['s1', 's2', 's4'] as const).filter((z) => WIDGET_SIZES[w.id].includes(z)).map((z) => (
                    <button key={z} role="radio" aria-checked={w.size === z} className={w.size === z ? 'on' : ''} onClick={() => resize(w.id, z)}>{SIZE_NAME[z]}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {list.length === 0 && <p className="empty tight">위젯이 없어요. 아래에서 더해요.</p>}
        </div>
        <div className="fp-h2 fsplit"><h2>더할 수 있는 위젯</h2><small>{addable.length}개</small></div>
        <section className="tcard tight">
          {addable.map((id) => (
            <div key={id} className="frow wrow">
              <span className="grow"><b className="blk">{INFO[id][0]}</b><small className="blk mu">{INFO[id][1]} · {WIDGET_SIZES[id].map((z) => SIZE_NAME[z]).join('·')}</small></span>
              <button className="we-add" aria-label={`${INFO[id][0]} 더하기`} onClick={() => change([...list, { id, size: WIDGET_SIZES[id][0] }])}><Icon name="plus" size={18} /></button>
            </div>
          ))}
          {addable.length === 0 && <p className="empty tight">모든 위젯을 쓰고 있어요</p>}
        </section>
      </div>
    </div>
  )
}
