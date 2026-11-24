import { useEffect, useRef, useState, type PointerEvent as RPE, type ReactNode } from 'react'

export interface SwipeAct { label: string; run: () => void }

/** 줄을 오른쪽으로 밀면 right, 왼쪽으로 밀면 left를 실행한다. 세로 스크롤과 안 겹치게 가로로 움직일 때만 잡는다 */
export function SwipeRow({ right, left, children }: { right?: SwipeAct; left?: SwipeAct; children: ReactNode }) {
  const [dx, setDx] = useState(0)
  const dxRef = useRef(0)
  const st = useRef<{ x: number; y: number; id: number; mode: 'idle' | 'h' | 'v' } | null>(null)
  const moved = useRef(false)
  const MAX = 150
  const GO = 88
  const put = (v: number) => { dxRef.current = v; setDx(v) }
  const down = (e: RPE) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    st.current = { x: e.clientX, y: e.clientY, id: e.pointerId, mode: 'idle' }
    moved.current = false
  }
  const move = (e: RPE) => {
    const t = st.current
    if (!t || t.mode === 'v') return
    const mx = e.clientX - t.x
    const my = e.clientY - t.y
    if (t.mode === 'idle') {
      if (Math.abs(my) > 10 && Math.abs(my) > Math.abs(mx)) { t.mode = 'v'; return }
      if (Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my)) { t.mode = 'h'; try { e.currentTarget.setPointerCapture(t.id) } catch { /* 무시 */ } } else return
    }
    moved.current = true
    const can = mx > 0 ? !!right : !!left
    put(can ? Math.max(-MAX, Math.min(MAX, mx)) : mx / 8)
  }
  const end = (cancel: boolean) => {
    const t = st.current
    st.current = null
    const v = dxRef.current
    put(0)
    if (!t || t.mode !== 'h' || cancel) return
    if (v >= GO && right) right.run()
    else if (v <= -GO && left) left.run()
  }
  return (
    <div className="swp">
      <div className="swp-r" aria-hidden="true" style={{ opacity: dx > 8 ? 1 : 0 }}>{right?.label}</div>
      <div className="swp-l" aria-hidden="true" style={{ opacity: dx < -8 ? 1 : 0 }}>{left?.label}</div>
      <div
        className="swp-o"
        style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: st.current?.mode === 'h' ? 'none' : 'transform .2s ease' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => end(false)}
        onPointerCancel={() => end(true)}
        onClickCapture={(e) => { if (moved.current) { e.stopPropagation(); e.preventDefault(); moved.current = false } }}
      >{children}</div>
    </div>
  )
}

export interface ToastMsg { id: number; text: string; undo?: () => void }

/** 아래에 4초 떠 있다가 사라지는 알림. 되돌리기를 달 수 있다 */
export function Toast({ t, onClose }: { t: ToastMsg | null; onClose: () => void }) {
  useEffect(() => {
    if (!t) return
    const h = setTimeout(onClose, 4000)
    return () => clearTimeout(h)
  }, [t, onClose])
  if (!t) return null
  return (
    <div className="qtoast" role="status">
      <span className="grow">{t.text}</span>
      {t.undo && <button onClick={() => { t.undo?.(); onClose() }}>되돌리기</button>}
    </div>
  )
}

export const buzz = (ms = 18) => { try { navigator.vibrate?.(ms) } catch { /* 지원 안 하는 기기 */ } }
