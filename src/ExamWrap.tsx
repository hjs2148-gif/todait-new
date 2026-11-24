import { useState } from 'react'
import { addDays, diffDays } from './date.ts'
import { minGoalMet, type Exam } from './model.ts'
import { actions, type State } from './store.ts'
import { Sheet } from './ui.tsx'
import { daySec } from './view.ts'

/** 시험 날이 지났고 아직 정리 안 한 시험 */
export const endedExam = (s: State, today: string) => s.exams.find((e) => e.selected && e.date < today && !e.closedAt) ?? null

/** 시험이 끝난 뒤 흐름: 수고 요약 → 점수 적기 → 끝난 계획 정리 → 다음 시험 */
export function ExamWrap({ s, exam, today, onClose, onNext }: { s: State; exam: Exam; today: string; onClose: () => void; onNext: () => void }) {
  // 기록이 있는 가장 이른 날부터 시험일까지 훑는다 (최대 200일)
  let first = exam.date
  for (const id in s.recs) for (const k in s.recs[id]) if (k < first) first = k
  if (diffDays(first, exam.date) > 200) first = addDays(exam.date, -200)
  const min = s.settings.streakMinSec
  let secs = 0
  let kept = 0
  for (let d = first; d <= exam.date; d = addDays(d, 1)) {
    const x = daySec(s, d)
    secs += x
    if (x >= min || minGoalMet(s, d)) kept++
  }
  const span = diffDays(first, exam.date) + 1

  const scopeTasks = exam.scope.map((x) => s.tasks.find((t) => t.id === x.taskId)).filter((t): t is NonNullable<typeof t> => !!t)
  const catIds = [...new Set(scopeTasks.map((t) => t.categoryId).filter((c): c is string => !!c))]
  const cats = s.categories.filter((c) => (catIds.length ? catIds.includes(c.id) : true))
  const [scores, setScores] = useState<Record<string, string>>(exam.scores ?? {})
  const open = scopeTasks.filter((t) => !t.completed && !t.archived)
  const [picked, setPicked] = useState<Set<string>>(new Set(open.map((t) => t.id)))
  const nxt = s.exams.filter((e) => e.id !== exam.id && e.date >= today && !e.closedAt).sort((a, b) => a.date.localeCompare(b.date))[0]

  const save = (then?: () => void) => {
    const clean = Object.fromEntries(Object.entries(scores).filter(([, v]) => v.trim()).map(([k, v]) => [k, v.trim()]))
    actions.saveExam({ ...exam, selected: false, closedAt: today, scores: clean })
    for (const id of picked) actions.patchTask(id, { completed: true, completedDate: today })
    if (nxt) actions.saveExam({ ...nxt, selected: true })
    onClose()
    then?.()
  }
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <Sheet title={`${exam.name} 끝`} sub="수고했어요" onClose={onClose}>
      <div className="xw-sum"><b>{span}<small>일 동안</small> {Math.floor(secs / 3600)}<small>시간</small> {Math.floor((secs % 3600) / 60)}<small>분</small></b><span>계획 지킨 날 {kept}일</span></div>
      {cats.length > 0 && (
        <div className="xw-step"><span className="no">1</span><div className="grow"><b>점수 적기</b><small className="mu"> 건너뛰어도 돼요</small>
          <div className="xw-sc">{cats.map((c) => (
            <label key={c.id}><i className="dot" style={{ background: c.color }} /><span className="xw-nm">{c.name}</span>
              <input value={scores[c.id] ?? ''} placeholder="—" inputMode="text" maxLength={8} aria-label={`${c.name} 점수`} onChange={(e) => setScores({ ...scores, [c.id]: e.target.value })} /></label>
          ))}</div></div></div>
      )}
      <div className="xw-step"><span className="no">{cats.length > 0 ? 2 : 1}</span><div className="grow"><b>끝난 계획 정리</b><small className="mu"> 기록은 남아요</small>
        {open.length === 0 ? <p className="sm mu">정리할 시험 범위 계획이 없어요</p> : (
          <div className="xw-ck">{open.map((t) => (
            <label key={t.id}><input type="checkbox" checked={picked.has(t.id)} onChange={() => toggle(t.id)} />{t.name}</label>
          ))}</div>
        )}</div></div>
      <div className="xw-step"><span className="no">{(cats.length > 0 ? 2 : 1) + 1}</span><div className="grow"><b>다음 시험</b>
        <p className="sm mu">{nxt ? `${nxt.name} (${nxt.date.slice(5).replace('-', '.')})을 오늘 탭에 보여 줄게요` : '다음 시험이 있으면 바로 만들 수 있어요'}</p></div></div>
      <div className="two">
        <button className="chip dark" onClick={() => save()}>정리하기</button>
        <button className="chip" onClick={() => save(onNext)}>정리하고 새 시험</button>
      </div>
    </Sheet>
  )
}
