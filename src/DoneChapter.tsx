// 단원을 끝냈을 때 (RDoneChapter): 과장된 효과 없이, 이해도를 묻고 복습 날짜를 알려 준다
import { Icon } from './Icon.tsx'
import { addDays, diffDays } from './date.ts'
import { chapterSpans } from './progress.ts'
import { chapterSec } from './stats.ts'
import { actions, offFor, useStore } from './store.ts'
import { hm } from './todayData.ts'
import { Sheet } from './ui.tsx'
import { colorOf } from './view.ts'

const md = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}월 ${Number(d)}일` }

export function DoneChapterSheet({ taskId, chapterId, onClose }: { taskId: string; chapterId: string; onClose: () => void }) {
  const s = useStore()
  const t = s.tasks.find((x) => x.id === taskId)
  const idx = t?.chapters?.findIndex((c) => c.id === chapterId) ?? -1
  const c = t?.chapters?.[idx]
  if (!t || !c || !t.chapters) return null
  const recs = s.recs[t.id] ?? {}
  const done = c.doneDate ?? t.startDate
  const span = chapterSpans(t, recs, done, offFor(s, t))[idx]
  const took = span?.start ? diffDays(span.start, done) + 1 : null
  const len = c.to - c.from + 1
  const plannedDays = Math.max(Math.ceil(len / Math.max(t.amount / Math.max(diffDays(t.startDate, t.endDate ?? t.startDate) + 1, 1), 1)), 1)
  const next = t.chapters[idx + 1]
  const finished = t.chapters.filter((x) => x.doneDate).length
  const color = colorOf(s, t)
  const askOn = addDays(done, 1)
  const pos = (t.startPoint ?? 1) + Object.values(recs).reduce((a, r) => a + r.done, 0) - 1

  const save = onClose
  return (
    <Sheet title={`${idx + 1}단원 끝`} onClose={save}>
      <div className="dc-hero">
        <span className="dc-book" style={{ background: color }} aria-hidden="true"><i /><b>{idx + 1}</b></span>
        <h2>{idx + 1}단원을 끝냈어요</h2>
        <small>{t.name} · {c.name} · {c.from}~{c.to}{t.unit}</small>
      </div>
      <div className="trio3 flat">
        <div><b>{took ?? '—'}일</b><small>걸림 · 예정 {plannedDays}일</small></div>
        <div><b>{hm(chapterSec(t, recs, span?.start ?? null, done))}</b><small>공부 시간</small></div>
        <div><b>{finished} / {t.chapters.length}</b><small>단원 끝</small></div>
      </div>
      <div className="cbar dc-bar" aria-hidden="true">
        {t.chapters.map((x) => <span key={x.id} style={{ flexGrow: x.to - x.from + 1 }}><span style={{ width: `${Math.max(0, Math.min(1, (pos - x.from + 1) / (x.to - x.from + 1))) * 100}%`, background: color }} /></span>)}
      </div>
      {!t.roundOf && <div className="dc-ask">
        <b>{md(askOn)}에 떠올리기로 물어볼게요</b>
        <small>지금 바로 묻지 않아요. 공부 직후엔 다 아는 것 같아서, 하루 뒤에 책을 덮고 떠올려 봐야 정확해요. 진도 탭 복습 칸에 나와요.</small>
      </div>}
      {next && <div className="dc-next"><span className="grow">다음은 <b>{idx + 2}단원 {next.name}</b> · {next.from}{t.unit}부터</span><Icon name="right" size={16} /></div>}
      <button className="primary" onClick={save}>저장하고 이어서</button>
    </Sheet>
  )
}
