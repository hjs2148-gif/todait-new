import { demoReady } from './demo.ts' // 맨 먼저: 개발용 ?demo= 이면 시계·저장소를 바꾼다
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { startNotifier } from './notify.ts'
import { loadState } from './store.ts'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './styles.css'
import './today.css'
import './progress.css'
import './stats.css'
import './forms.css'
import './moments.css'
import './wizard.css'
import './guide.css'
import './learnwidgets.css'
import './quick.css'

const root = createRoot(document.getElementById('root')!)
demoReady()
  .then(loadState)
  .then(() => {
    root.render(<StrictMode><App /></StrictMode>)
    startNotifier()
  })
  .catch((e) => root.render(<p className="empty">저장소를 열지 못했습니다. 사생활 보호 모드에서는 동작하지 않을 수 있습니다.{'\n'}{String(e)}</p>))

if ('serviceWorker' in navigator && import.meta.env.PROD) void navigator.serviceWorker.register('./sw.js')
