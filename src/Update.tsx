// 새 버전 알림: 앱을 열 때·다시 앞으로 올 때·30분마다 version.json을 보고, 빌드 번호가 다르면 새로 고침을 권한다.
// 폰 홈 화면에서 연 앱은 오래 켜져 있어 예전 화면이 남기 쉽다. 기록은 기기에 있어서 새로 고쳐도 그대로다.
import { useEffect, useState } from 'react'
import { Icon } from './Icon.tsx'

export function UpdateBanner() {
  const [fresh, setFresh] = useState(false)
  useEffect(() => {
    if (!import.meta.env.PROD) return
    let alive = true
    const check = async () => {
      try {
        const r = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' })
        const v = (await r.json()) as { build?: string }
        if (alive && v.build && v.build !== __BUILD__) setFresh(true)
      } catch { /* 오프라인이면 다음에 */ }
    }
    void check()
    const onShow = () => { if (document.visibilityState === 'visible') void check() }
    document.addEventListener('visibilitychange', onShow)
    const iv = setInterval(check, 30 * 60 * 1000)
    return () => { alive = false; document.removeEventListener('visibilitychange', onShow); clearInterval(iv) }
  }, [])
  if (!fresh) return null
  return (
    <div className="upd" role="status">
      <span className="grow">새 버전이 나왔어요<small>기록은 그대로예요</small></span>
      <button onClick={() => location.reload()}>새로 고침</button>
      <button className="x" onClick={() => setFresh(false)} aria-label="나중에"><Icon name="close" size={16} /></button>
    </div>
  )
}
