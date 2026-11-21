// 새 계획 (RNew)
import { useState } from 'react'
import { addDays, DOW_KO, todayISO } from './date.ts'
import type { BookMode, TaskKind } from './logic.ts'
import { buildTask, emptyForm, parseToc, previewPlan, type PlanForm } from './planForm.ts'
import { actions, uid, useStore } from './store.ts'
import { FullPage, Num, Row, WeekPicker } from './ui.tsx'

const KINDS: [TaskKind, string, string][] = [
  ['book', '책', '책 · 문제집'], ['lecture', '인강', '강의 수로'], ['time', '시간', '매일 몇 분'], ['habit', '습관', '매일 체크'], ['todo', '할 일', '한 번만'],
]
const KIND_ICON: Record<TaskKind, string> = { book: '▤', lecture: '▶', time: '◔', habit: '↻', todo: '☑' }
const MODES: [BookMode, string][] = [['toc', '목차 (쪽)'], ['workbook', '문제집 (문항)'], ['amount', '분량만']]
const md = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}.${Number(d)}` }

export function NewPlan({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const today = todayISO()
  const [f, setF] = useState<PlanForm>(() => ({ ...emptyForm(today), categoryId: s.categories[0]?.id ?? '' }))
  const [error, setError] = useState('')
  const set = (p: Partial<PlanForm>) => { setF({ ...f, ...p }); setError('') }
  const exam = s.exams.find((e) => e.id === f.examId)
  const built = buildTask(f, 'preview', 0, 0)
  const task = typeof built === 'string' ? null : built
  const pv = task ? previewPlan(task, today) : null
  const toc = f.kind === 'book' && f.bookMode === 'toc' ? parseToc(f.toc) : null
  const lastDay = !!exam && f.endDate > addDays(exam.date, -1)

  const save = () => {
    const t = buildTask(f, uid(), Math.max(0, ...s.tasks.map((x) => x.order)) + 1, Date.now())
    if (typeof t === 'string') return setError(t)
    actions.saveTask(t)
    // 범위가 비어 있으면 '진행 중인 책·인강 전부'라서 새 계획도 이미 들어 있다. 하나만 넣으면 범위가 좁아진다
    if (f.examId && exam && exam.scope.length > 0 && (t.kind === 'book' || t.kind === 'lecture'))
      actions.saveExam({ ...exam, scope: [...exam.scope, { taskId: t.id, from: null, to: null }] })
    onClose()
  }
  const pickKind = (kind: TaskKind) => {
    const patch: Partial<PlanForm> = { kind }
    if (kind === 'book') patch.unit = f.bookMode === 'workbook' ? '문항' : '쪽'
    if (kind === 'time' || kind === 'habit') patch.endDate = ''
    else if (!f.endDate) patch.endDate = addDays(f.startDate, 29)
    set(patch)
  }
  const pickMode = (bookMode: BookMode) => set({ bookMode, unit: bookMode === 'workbook' ? '문항' : '쪽', from: 1 })
  const repeating = f.kind === 'time' || f.kind === 'habit'

  return (
    <FullPage title="새 계획" onClose={onClose} action={save} actionLabel="만들기">
      <h2 className="fp-h2">무엇으로 공부하나요</h2>
      <div className="kinds" role="radiogroup" aria-label="계획 종류">
        {KINDS.map(([k, name, sub]) => (
          <button key={k} role="radio" aria-checked={f.kind === k} className={f.kind === k ? 'on' : ''} onClick={() => pickKind(k)}>
            <i aria-hidden="true">{KIND_ICON[k]}</i><b>{name}</b><small>{sub}</small>
          </button>
        ))}
      </div>

      {f.kind === 'book' && (
        <>
          <h2 className="fp-h2">책은 어떻게 나눌까요?</h2>
          <div className="seg" role="radiogroup" aria-label="나누는 방식">
            {MODES.map(([m, l]) => <button key={m} role="radio" aria-checked={f.bookMode === m} className={f.bookMode === m ? 'on' : ''} onClick={() => pickMode(m)}>{l}</button>)}
          </div>
        </>
      )}

      <h2 className="fp-h2">{f.kind === 'book' ? '책 정보' : f.kind === 'lecture' ? '강의 정보' : '정보'}</h2>
      <section className="fcard">
        <Row label="이름"><input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="예) 수학의 정석" aria-label="이름" /></Row>
        <Row label="과목">
          <select value={f.categoryId} onChange={(e) => set({ categoryId: e.target.value })} aria-label="과목">
            <option value="">없음</option>
            {s.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Row>
        {(f.kind === 'book' || f.kind === 'lecture') && s.exams.length > 0 && (
          <Row label="시험">
            <select value={f.examId} onChange={(e) => set({ examId: e.target.value })} aria-label="시험">
              <option value="">연결 안 함</option>
              {s.exams.map((e) => <option key={e.id} value={e.id}>{e.name} · {md(e.date)}</option>)}
            </select>
          </Row>
        )}
        {f.kind === 'book' && f.bookMode === 'workbook' && (
          <Row label="문항 범위"><span className="two-in"><Num value={f.from} onChange={(v) => set({ from: v })} placeholder="1" /><span>~</span><Num value={f.to} onChange={(v) => set({ to: v })} placeholder="600" /></span></Row>
        )}
        {f.kind === 'book' && f.bookMode === 'amount' && (
          <Row label="총 분량"><span className="two-in"><Num value={f.total} onChange={(v) => set({ total: v })} min={1} placeholder="50" /><input value={f.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="쪽" aria-label="단위" /></span></Row>
        )}
        {f.kind === 'lecture' && <Row label="강의 수"><Num value={f.lectureCount} onChange={(v) => set({ lectureCount: v })} min={1} placeholder="30" /></Row>}
        {f.kind === 'time' && (
          <Row label="하루 목표"><span className="two-in"><Num value={f.hours} onChange={(v) => set({ hours: v })} /><span>시간</span><Num value={f.mins} onChange={(v) => set({ mins: v })} /><span>분</span></span></Row>
        )}
        {f.kind === 'todo' && <Row label="마감일"><input type="date" value={f.due} min={f.startDate} onChange={(e) => set({ due: e.target.value })} aria-label="마감일" /></Row>}
      </section>

      {toc && (
        <>
          <div className="fp-h2 fsplit"><h2>목차</h2><small>{toc.chapters.length ? `${toc.chapters.length}단원 · ${toc.chapters.reduce((a, c) => a + c.to - c.from + 1, 0)}${f.unit || '쪽'}` : ''}</small></div>
          <section className="fcard">
            <textarea className="toc-in" rows={5} value={f.toc} onChange={(e) => set({ toc: e.target.value })} aria-label="목차" placeholder={'한 줄에 단원 하나씩 붙여넣으세요\n수열의 극한 1~28\n급수 29~52'} />
            {toc.chapters.length > 0 && (
              <ul className="toc-list">
                {toc.chapters.slice(0, 5).map((c, i) => <li key={c.id}><b>{i + 1}</b><span className="grow ell">{c.name}</span><small>{c.from}~{c.to}쪽</small></li>)}
                {toc.chapters.length > 5 && <li className="mu">…외 {toc.chapters.length - 5}단원</li>}
              </ul>
            )}
            {toc.bad.length > 0 && <p className="error pad">읽지 못한 줄: {toc.bad.join(' / ')}</p>}
          </section>
        </>
      )}
      {f.kind === 'lecture' && (
        <>
          <h2 className="fp-h2">강의 제목 <small>(선택)</small></h2>
          <section className="fcard"><textarea className="toc-in" rows={3} value={f.lectureText} onChange={(e) => set({ lectureText: e.target.value })} aria-label="강의 제목" placeholder={'한 줄에 한 강씩. 비우면 1강, 2강…'} /></section>
        </>
      )}

      <h2 className="fp-h2">{f.kind === 'todo' ? '언제 하나요' : '언제 공부하나요'}</h2>
      <section className="fcard">
        <Row label={f.kind === 'todo' ? '날짜' : '기간'}>
          <span className="two-in">
            <input type="date" value={f.startDate} onChange={(e) => e.target.value && set({ startDate: e.target.value })} aria-label="시작일" />
            {f.kind !== 'todo' && <><span>~</span><input type="date" value={f.endDate} min={f.startDate} onChange={(e) => set({ endDate: e.target.value })} aria-label="종료일" /></>}
          </span>
        </Row>
        {repeating && <Row label="계속하기"><small className="mu">종료일을 비우면 계속해요</small></Row>}
        {f.kind !== 'todo' && (
          <>
            {repeating && (
              <Row label="반복">
                <span className="seg mini" role="radiogroup" aria-label="반복">
                  <button role="radio" aria-checked={f.repeat === 'week'} className={f.repeat === 'week' ? 'on' : ''} onClick={() => set({ repeat: 'week' })}>요일마다</button>
                  <button role="radio" aria-checked={f.repeat === 'day'} className={f.repeat === 'day' ? 'on' : ''} onClick={() => set({ repeat: 'day' })}>N일마다</button>
                </span>
              </Row>
            )}
            {repeating && f.repeat === 'day'
              ? <Row label="며칠마다"><Num value={f.every} onChange={(v) => set({ every: v })} min={2} placeholder="3" /></Row>
              : <div className="frow col"><span className="fl">요일</span><WeekPicker value={f.week} onChange={(week) => set({ week })} /></div>}
            {f.kind === 'habit' && (
              <Row label="쉬는 날에도"><input type="checkbox" className="switch" checked={f.keepOnRest} onChange={(e) => set({ keepOnRest: e.target.checked })} aria-label="쉬는 날에도 하기" /></Row>
            )}
          </>
        )}
        {f.kind === 'book' && f.bookMode === 'toc' && (
          <div className="frow col"><span className="fl">나누는 방식</span>
            <span className="seg" role="radiogroup" aria-label="나누는 방식">
              <button role="radio" aria-checked={f.split === 'chapter'} className={f.split === 'chapter' ? 'on' : ''} onClick={() => set({ split: 'chapter' })}>단원 순서대로</button>
              <button role="radio" aria-checked={f.split === 'even'} className={f.split === 'even' ? 'on' : ''} onClick={() => set({ split: 'even' })}>하루 쪽 수 같게</button>
            </span>
          </div>
        )}
      </section>

      {pv && task && (
        <section className="fcard prev" aria-label="미리보기">
          <div className="pv-h"><b>미리보기</b><small>{f.week.every(Boolean) ? '매일' : f.week.map((on, i) => (on ? DOW_KO[i] : '')).join('')} · 쉬는 날 없음</small></div>
          <div className="pv-big"><b>{pv.perDay >= 10 ? Math.round(pv.perDay) : Math.round(pv.perDay * 10) / 10}</b><span>{task.unit} / 일</span><small>공부일 {pv.days}일 · {pv.end ? `${md(pv.end)} 끝` : ''}</small></div>
          {pv.chapterEnds.length > 1 && (
            <>
              <div className="pv-ch">{pv.chapterEnds.map((c, i) => <i key={i} />)}</div>
              <div className="pv-dates">{pv.chapterEnds.slice(0, 6).map((c, i) => <span key={i}>{c.end ? md(c.end) : ''}</span>)}</div>
              <small className="mu">단원 끝나는 날{exam ? ` · ${lastDay ? '시험 뒤에 끝나요' : '시험 전에 끝나요'}` : ''}</small>
            </>
          )}
          {exam && pv.chapterEnds.length <= 1 && <small className={lastDay ? 'bad' : 'mu'}>{lastDay ? '시험 뒤에 끝나요' : '시험 전에 끝나요'}</small>}
        </section>
      )}
      {error && <p className="error pad" role="alert">{error}</p>}
    </FullPage>
  )
}
