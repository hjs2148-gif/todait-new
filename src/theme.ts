// 화면 모드(기기 설정·라이트·다크)를 문서에 적용한다. 색 자체는 styles.css의 변수에 있다.
import type { Settings } from './model.ts'

const THEME_COLOR = { light: '#f3f0ea', dark: '#121110' }

/** 적용을 끝낸 뒤 되돌리는 함수를 돌려준다 (기기 설정 변경 감지 해제) */
export function applyTheme(theme: Settings['theme']) {
  const root = document.documentElement
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const apply = () => {
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    const dark = theme === 'dark' || (theme === 'system' && mq.matches)
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? THEME_COLOR.dark : THEME_COLOR.light)
  }
  apply()
  mq.addEventListener('change', apply)
  return () => mq.removeEventListener('change', apply)
}
