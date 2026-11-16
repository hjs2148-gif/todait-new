// 날짜는 모두 'YYYY-MM-DD' 문자열로 다룬다 (문자열 비교 = 날짜 비교).

const pad = (n: number) => String(n).padStart(2, '0')

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const todayISO = () => toISO(new Date())
export const addDays = (iso: string, n: number) => {
  const d = parse(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}
export const diffDays = (from: string, to: string) =>
  Math.round((parse(to).getTime() - parse(from).getTime()) / 86400000)
/** 0=일 … 6=토 */
export const dow = (iso: string) => parse(iso).getDay()

export const DOW_KO = ['일', '월', '화', '수', '목', '금', '토']

export const fmtDate = (iso: string) => {
  const d = parse(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW_KO[d.getDay()]})`
}
export const fmtDur = (sec: number) => {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}시간 ${m}분`
  if (m > 0) return `${m}분`
  return `${s}초`
}
export const fmtClock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec))
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}
