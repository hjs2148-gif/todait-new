// 알림. 서버가 없어서 앱(탭/설치된 PWA)이 열려 있거나 백그라운드에 살아 있을 때만 울린다.
import { diffDays, todayISO } from './date.ts'
import { getState } from './store.ts'
import { itemsOn } from './view.ts'

export const notifySupported = () => typeof Notification !== 'undefined'

export async function requestNotify() {
  if (!notifySupported()) return false
  return (await Notification.requestPermission()) === 'granted'
}

async function show(title: string, body: string, tag: string) {
  const opts = { body, tag, icon: './icon-192.png' }
  const reg = await navigator.serviceWorker?.getRegistration()
  if (reg) await reg.showNotification(title, opts)
  else new Notification(title, opts)
}

const KEY = 'todait-notified'
/** 같은 알림은 하루에 한 번만 */
function once(id: string, today: string) {
  let seen: { date: string; ids: string[] } = { date: today, ids: [] }
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (saved?.date === today) seen = saved
  } catch { /* 깨진 값은 무시 */ }
  if (seen.ids.includes(id)) return false
  seen.ids.push(id)
  localStorage.setItem(KEY, JSON.stringify(seen))
  return true
}

function check() {
  const s = getState()
  if (!s.settings.notifyOn || !notifySupported() || Notification.permission !== 'granted') return
  const now = new Date()
  const mins = now.getHours() * 60 + now.getMinutes()
  const today = todayISO()
  // 설정 시각부터 30분 안에 앱이 살아 있으면 알린다
  const due = (hhmm: string | null) => {
    if (!hhmm) return false
    const [h, m] = hhmm.split(':').map(Number)
    return mins >= h * 60 + m && mins < h * 60 + m + 30
  }
  const todo = itemsOn(s, today, today).active.filter((i) => i.rate < 1)

  if (due(s.settings.dailyNotifyTime) && once('daily', today)) {
    const dday = s.exams.find((d) => d.selected)
    const n = dday ? diffDays(today, dday.date) : null
    const ddayText = dday && n !== null && n >= 0 ? `${dday.name} ${n === 0 ? 'D-DAY' : `D-${n}`} · ` : ''
    void show('오늘 계획', `${ddayText}${todo.length ? `남은 계획 ${todo.length}개: ${todo.map((i) => i.task.name).join(', ')}` : '오늘 계획을 모두 마쳤습니다!'}`, 'daily')
  }
  for (const i of todo)
    if (due(i.task.notifyTime) && once(i.task.id, today)) void show(i.task.name, '계획을 시작할 시간입니다.', i.task.id)
}

export function startNotifier() {
  check()
  setInterval(check, 20000)
}
