// 안내형 계획 만들기: 한 화면에 질문 하나. 1 유형 → 2 이름·과목 → 3 얼마나(목차) → 4 기간·요일 → 5 시간대 → 6 한눈에 → 7 만들었어요
// 분량 계획만 안내형으로 만들고, 시간·습관·할 일은 한 화면 입력(NewPlan)으로 보낸다. 시안: design/gen 의 WZ* 보드
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import { addDays, diffDays, dow, todayISO } from './date.ts'
import { futurePlan, secPerUnit, type Task, type TaskKind } from './logic.ts'
import { chapterSpans } from './progress.ts'
import { actions, planOf, subjectVar, SUBJECTS, uid, useStore, type Category, type State } from './store.ts'
import { Num } from './ui.tsx'
import { Icon } from './Icon.tsx'
import { PRESETS } from './presets.ts'
import { autoNums, countLabel, lineSpans, normalize, parseTocText, patternLevels, resolveToc, shiftPattern, splitRow, type TocLine } from './toc.ts'
import { bufferDates, clock, DEFAULT_WINDOWS, emptyWiz, pickDate, rangeOf, weekShape, windowsOn, winSum, wizardTask, type DayKind, type StudyWindows, type Win, type Wiz } from './wizard.ts'

const TOTAL = 6
const ORDER = [1, 2, 3, 4, 5, 6, 0] // 월 … 일
const DOW = ['일', '월', '화', '수', '목', '금', '토']
const md = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}.${Number(d)}` }
const mdKo = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}월 ${Number(d)}일` }
const dur = (m: number) => `${Math.floor(m / 60)}:${String(Math.round(m) % 60).padStart(2, '0')}`
const NEXT_KIND: Record<DayKind, DayKind> = { on: 'sp', sp: 'off', off: 'on' }

type Sub = null | 'paste' | 'read' | 'type'
/** 직접 입력의 한 줄 */
type Row = { depth: number; text: string }
const rowsToLines = (rows: Row[]): TocLine[] => normalize(rows.filter((r) => r.text.trim()).map((r) => {
  const p = splitRow(r.text)
  return { depth: r.depth, num: '', pat: 'plain', name: p.name || r.text.trim(), page: p.page }
}))
const linesToRows = (lines: TocLine[]): Row[] => (lines.length ? lines.map((l) => ({ depth: l.depth, text: `${l.name}${l.page !== null && !l.est ? ` ${l.page}` : ''}` })) : [{ depth: 0, text: '' }])

export function NewPlanWizard({ onClose, onForm, onOpen }: { onClose: () => void; onForm: (kind?: TaskKind) => void; onOpen: (t: Task) => void }) {
  const s = useStore()
  const today = todayISO()
  const exam = useMemo(() => s.exams.filter((e) => e.date > today).sort((a, b) => Number(b.selected) - Number(a.selected) || a.date.localeCompare(b.date))[0], [s.exams, today])
  const [w, setW] = useState<Wiz>(() => ({
    ...emptyWiz(today, exam ? addDays(exam.date, -1) : addDays(today, 27), exam?.id ?? ''),
    windows: s.settings.studyWindows ?? DEFAULT_WINDOWS,
  }))
  const [step, setStep] = useState(1)
  const [sub, setSub] = useState<Sub>(null)
  const [text, setText] = useState('')
  const [rows, setRows] = useState<Row[]>([{ depth: 0, text: '' }])
  const [draft, setDraft] = useState<TocLine[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [made, setMade] = useState<Task | null>(null)
  const set = (p: Partial<Wiz>) => { setW((x) => ({ ...x, ...p })); setError('') }

  const built = wizardTask(w, 'preview', 0, 0)
  const task = typeof built === 'string' ? null : built
  const back = () => { setError(''); if (sub === 'read') setSub(text ? 'paste' : null); else if (sub) setSub(null); else if (step > 1) setStep(step - 1); else onClose() }
  const go = (n: number) => { setError(''); setSub(null); setStep(n) }
  const need = (msg: string | null, n: number) => (msg ? setError(msg) : go(n))
  const examDate = s.exams.find((e) => e.id === w.examId)?.date ?? null
  const typeDone = () => { const l = rowsToLines(rows); if (!l.length) return setError('목차를 한 줄 이상 적어 주세요'); setDraft(l); setSub('read') }

  const create = () => {
    const t = wizardTask(w, uid(), Math.max(0, ...s.tasks.map((x) => x.order)) + 1, Date.now())
    if (typeof t === 'string') return setError(t)
    actions.saveTask(t)
    actions.setSettings({ studyWindows: w.windows })
    const ex = s.exams.find((e) => e.id === w.examId)
    if (ex && ex.scope.length > 0) actions.saveExam({ ...ex, scope: [...ex.scope, { taskId: t.id, from: null, to: null }] })
    setMade(t)
    go(7)
  }
  const again = () => {
    setW((x) => ({ ...emptyWiz(today, x.endDate, x.examId), days: x.days, buffer: x.buffer, windows: x.windows, notify: x.notify, startDate: x.startDate }))
    setMade(null); setText(''); setDraft([]); setRows([{ depth: 0, text: '' }])
    go(2)
  }

  let body: ReactNode
  let foot: ReactNode = null
  if (sub === 'paste') {
    body = <PasteStep text={text} setText={setText} />
    foot = <><button className="wz-sec" onClick={() => { setRows(linesToRows(parseTocText(text))); setSub('type') }}>직접 입력</button><button className="primary" disabled={!text.trim()} onClick={() => { const l = parseTocText(text); if (!l.length) return setError('읽을 줄이 없어요'); setDraft(l); setSub('read') }}>읽기</button></>
  } else if (sub === 'type') {
    body = <TypeStep rows={rows} setRows={setRows} />
  } else if (sub === 'read') {
    body = <ReadStep lines={draft} setLines={setDraft} w={w} set={set} />
    foot = <button className="primary" onClick={() => {
      const r = resolveToc(draft, w.to, w.from)
      if (!r) return setError('목차가 비어 있어요')
      set({ toc: draft, ...(w.to === null ? { from: r.start, to: r.end } : {}) })
      setSub(null)
    }}>이대로 넣기</button>
  } else if (step === 1) {
    body = <TypeCards pick={(k) => (k === 'amount' ? go(2) : onForm(k))} />
    foot = <button className="wz-link" onClick={() => onForm()}>한 화면에서 한 번에 입력하기<Icon name="right" size={16} /></button>
  } else if (step === 2) {
    body = <NameStep w={w} set={set} />
    foot = <button className="primary" onClick={() => need(w.name.trim() ? null : '이름을 적어 주세요', 3)}>다음</button>
  } else if (step === 3) {
    body = <AmountStep w={w} set={set} openToc={(k) => { if (k === 'type') setRows(linesToRows(w.toc)); setSub(k) }} editToc={() => { setDraft(w.toc); setText(''); setSub('read') }} />
    foot = <button className="primary" onClick={() => { const r = rangeOf(w); need(r.to === null || r.to < r.start ? '범위를 적어 주세요' : null, 4) }}>다음</button>
  } else if (step === 4) {
    body = <PeriodStep w={w} set={set} task={task} pending={pending} setPending={setPending} examDate={examDate} today={today} />
    foot = <button className="primary" disabled={pending} onClick={() => need(typeof built === 'string' ? built : null, 5)}>다음</button>
  } else if (step === 5) {
    body = <TimeStep w={w} set={set} />
    foot = <><button className="wz-sec" onClick={() => { set({ notify: false }); go(6) }}>건너뛰기</button><button className="primary" onClick={() => go(6)}>다음</button></>
  } else if (step === 6) {
    body = task ? <SummaryStep s={s} w={w} task={task} today={today} examDate={examDate} go={go} /> : <p className="error">{built as string}</p>
    foot = <button className="primary" disabled={!task} onClick={create}>다음</button>
  } else {
    body = made ? <DoneStep s={s} t={made} today={today} again={again} open={() => onOpen(made)} /> : null
    foot = <><button className="wz-sec" onClick={onClose}>오늘 탭으로</button><button className="primary" onClick={() => { if (made && made.startDate === today) actions.startTimer(made.id, today); onClose() }}>지금 시작</button></>
  }

  const shown = Math.min(step, TOTAL)
  const typing = sub === 'type'
  return (
    <div className="fullpage wz" role="dialog" aria-label="새 계획">
      <header className="fp-h">
        {step === 7 ? <span style={{ width: 56 }} /> : <button className="fp-b" onClick={back} aria-label={step === 1 && !sub ? undefined : '뒤로'}>{step === 1 && !sub ? '취소' : <Icon name="left" size={20} />}</button>}
        {typing && <h1>목차 직접 입력</h1>}
        {step === 7 ? <button className="fp-b strong" onClick={onClose}>닫기</button>
          : typing ? <button className="fp-b strong" onClick={typeDone}>완료</button>
            : <small className="wz-count">{shown} / {TOTAL}</small>}
      </header>
      {step < 7 && !typing && <div className="wz-prog" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={shown}><i style={{ width: `${(shown / TOTAL) * 100}%` }} /></div>}
      <div className="fp-body wz-body">{body}{error && <p className="error" role="alert">{error}</p>}</div>
      {foot && <footer className="wz-ft">{foot}</footer>}
    </div>
  )
}

/** 화면 아래에서 올라오는 시트 (새 계획 화면 안) */
function WzSheet({ title, onClose, children, foot }: { title: string; onClose: () => void; children: ReactNode; foot: ReactNode }) {
  return (
    <>
      <div className="wz-scrim" onClick={onClose} />
      <section className="wz-sheet" role="dialog" aria-label={title}>
        <div className="wz-grab" />
        <div className="wz-sheet-h"><b>{title}</b><button className="fp-b" onClick={onClose}>닫기</button></div>
        <div className="wz-sheet-b">{children}</div>
        <div className="wz-ft">{foot}</div>
      </section>
    </>
  )
}

const Q = ({ q, sub }: { q: string; sub?: string }) => <div className="wz-q"><h2>{q}</h2>{sub && <p>{sub}</p>}</div>

// ── 1. 유형 ──
const TYPES: ['amount' | TaskKind, string, string, string][] = [
  ['amount', '분량', '끝낼 범위가 있어요', '책 · 문제집 · 인강'], ['time', '시간', '매일 시간을 채워요', '자습 2시간'],
  ['habit', '습관', '꾸준히 반복해요', '영단어 50개 · 스트레칭'], ['todo', '할 일', '한 번 하면 끝나요', '수행평가 제출'],
]
function TypeArt({ k }: { k: string }) {
  if (k === 'amount') return <span className="wz-art">{[1, 1, 1, 1, 1, 0, 0, 0].map((on, i) => <i key={i} className={on ? 'm' : ''} style={{ width: 13, height: 20, ...(i === 4 ? { boxShadow: '4px 0 0 -1px var(--rib)' } : {}) }} />)}</span>
  if (k === 'time') return <span className="wz-art">{[1, 1, 1, 1, 0, 0].map((on, i) => <i key={i} className={on ? 'c' : ''} style={{ width: 20, height: 14, borderRadius: 4 }} />)}</span>
  if (k === 'habit') return <span className="wz-art grid">{'111011011111101111011'.split('').map((on, i) => <i key={i} className={on === '1' ? 'e' : ''} />)}</span>
  return <span className="wz-art col">{[1, 0].map((on) => <span key={on}><b className={on ? 'on' : ''}>{on ? <Icon name="check" size={11} stroke={3.4} /> : null}</b><i style={{ width: on ? 44 : 58, height: 6 }} /></span>)}</span>
}
function TypeCards({ pick }: { pick: (k: 'amount' | TaskKind) => void }) {
  return (
    <>
      <Q q="무엇을 계획할까요?" sub="하나를 누르면 다음으로 넘어가요." />
      <div className="wz-types" role="list">
        {TYPES.map(([k, n, d, ex]) => (
          <button key={k} onClick={() => pick(k)}><TypeArt k={k} /><span><b>{n}</b><span>{d}</span><small>{ex}</small></span></button>
        ))}
      </div>
    </>
  )
}

// ── 2. 이름 + 과목 ──
const swatchHex = (v: string, dark: boolean) => {
  const x = SUBJECTS.find((c) => c.hex === v)
  if (x) return dark ? x.dark : x.hex
  const h = Number(v.slice(4)) || 0
  return dark ? `hsl(${h} 50% 72%)` : `hsl(${h} 40% 40%)`
}
const HUES = [0, 30, 55, 90, 140, 175, 200, 225, 260, 290, 330, 360]
/** 과목 색: 추천 16색 + 색상 띠. 밝기는 앱이 라이트·다크에 맞춘다 */
function ColorSheet({ name, value, onPick, onClose }: { name: string; value: string; onPick: (v: string) => void; onClose: () => void }) {
  const [v, setV] = useState(value)
  const hue = v.startsWith('hue:') ? Number(v.slice(4)) : null
  return (
    <WzSheet title={`${name || '과목'} 색`} onClose={onClose} foot={<button className="primary" onClick={() => { onPick(v); onClose() }}>이 색으로</button>}>
      <small>추천 16색</small>
      <div className="wz-sw" role="radiogroup" aria-label="추천색">
        {SUBJECTS.map((c) => <button key={c.key} role="radio" aria-checked={v === c.hex} aria-label={c.name} className={v === c.hex ? 'on' : ''} style={{ background: `var(--s-${c.key})` }} onClick={() => setV(c.hex)} />)}
      </div>
      <small>직접 고르기</small>
      <input type="range" className="wz-hue" min={0} max={359} value={hue ?? 28} aria-label="색상"
        style={{ background: `linear-gradient(90deg,${HUES.map((h) => `hsl(${h} 42% 46%)`).join(',')})`, ['--thumb' as string]: `hsl(${hue ?? 28} 40% 40%)` }}
        onChange={(e) => setV(`hue:${e.target.value}`)} />
      <div className="wz-pv">
        {[false, true].map((dk) => (
          <div key={String(dk)} style={{ background: dk ? '#121110' : '#f3f0ea', color: dk ? '#f2eee7' : '#1f1c18' }}>
            <small style={{ color: dk ? '#a69f94' : '#655f56' }}>{dk ? '다크' : '라이트'}</small>
            <span><i className="wz-dot" style={{ background: swatchHex(v, dk) }} />{name || '과목'}</span>
            <i className="wz-pvbar" style={{ background: `linear-gradient(90deg,${swatchHex(v, dk)} 60%,${dk ? '#322e29' : '#ece7de'} 0)` }} />
          </div>
        ))}
      </div>
      <small>어떤 색을 골라도 글자와 막대가 잘 보이게 밝기를 맞춰요.</small>
    </WzSheet>
  )
}

type PItem = { on: boolean; name: string; color: string }
function PresetSheet({ onClose, onAdded }: { onClose: () => void; onAdded: (id: string) => void }) {
  const s = useStore()
  const cats = [...PRESETS.map(([n]) => n), '예전 과목']
  const [cat, setCat] = useState(0)
  const [items, setItems] = useState<Record<string, PItem>>({})
  const [color, setColor] = useState<string | null>(null)
  const have = new Set(s.categories.map((c) => c.name))
  const list: [string, string][] = cat < PRESETS.length
    ? PRESETS[cat][1].map(([n, k]) => [n, SUBJECTS.find((x) => x.key === k)!.hex])
    : s.settings.oldCategories.map((c) => [c.name, c.color])
  const key = (i: number) => `${cat}:${i}`
  const item = (i: number): PItem => items[key(i)] ?? { on: false, name: list[i][0], color: list[i][1] }
  const put = (i: number, p: Partial<PItem>) => setItems({ ...items, [key(i)]: { ...item(i), ...p } })
  const chosen = Object.values(items).filter((x) => x.on && x.name.trim() && !have.has(x.name.trim()))
  const add = () => {
    let first = ''
    for (const x of chosen) { const id = uid(); first ||= id; actions.saveCategory({ id, name: x.name.trim(), color: x.color }) }
    if (first) onAdded(first)
    onClose()
  }
  const ci = color === null ? null : Number(color)
  if (ci !== null && list[ci]) return <ColorSheet name={item(ci).name} value={item(ci).color} onPick={(c) => put(ci, { color: c, on: true })} onClose={() => setColor(null)} />
  return (
    <>
      <WzSheet title="프리셋에서 고르기" onClose={onClose} foot={<button className="primary" disabled={!chosen.length} onClick={add}>{chosen.length ? `${chosen.length}개 더하기` : '고른 과목이 없어요'}</button>}>
        <div className="wz-chips">{cats.map((c, i) => <button key={c} className={`chip${cat === i ? ' dark' : ''}`} onClick={() => setCat(i)}>{c}</button>)}</div>
        <section className="fcard tight wz-plist">
          {list.length === 0 && <div className="frow"><small>지운 과목이 없어요</small></div>}
          {list.map((_, i) => {
            const x = item(i)
            const exists = have.has(x.name.trim())
            return (
              <div key={key(i)} className="frow">
                <input type="checkbox" className="wz-cb" checked={exists || x.on} disabled={exists} onChange={(e) => put(i, { on: e.target.checked })} aria-label={`${x.name} 고르기`} />
                <button className="wz-cdot" aria-label={`${x.name} 색`} style={{ background: subjectVar(x.color), opacity: x.on || exists ? 1 : 0.45 }} onClick={() => setColor(String(i))} />
                <input className="wz-pname" value={x.name} onChange={(e) => put(i, { name: e.target.value, on: true })} aria-label="과목 이름" />
                {exists && <small>이미 있음</small>}
              </div>
            )
          })}
        </section>
        <small>이미 있는 과목은 그대로 두고 새 것만 더해요. 이름과 색은 눌러서 바꿔요.</small>
      </WzSheet>
    </>
  )
}

function NameStep({ w, set }: { w: Wiz; set: (p: Partial<Wiz>) => void }) {
  const s = useStore()
  const [adding, setAdding] = useState(false)
  const [sheet, setSheet] = useState<null | 'preset' | 'color' | string>(null)
  const [cn, setCn] = useState('')
  const [cc, setCc] = useState<string>(SUBJECTS[0].hex)
  const q = w.name.trim()
  const past = q.length >= 2 ? s.tasks.filter((t) => t.type === 'amount' && t.name.includes(q) && t.name !== q).slice(0, 3) : []
  const addCat = () => {
    if (!cn.trim()) return
    const id = uid()
    actions.saveCategory({ id, name: cn.trim(), color: cc })
    set({ categoryId: id }); setAdding(false); setCn('')
  }
  const editing = sheet && sheet !== 'preset' && sheet !== 'color' ? s.categories.find((c) => c.id === sheet) : null
  return (
    <>
      <Q q="무엇으로 공부하나요?" sub="책이나 강의 이름과 과목을 정해 주세요." />
      <label className="wz-field"><small>이름</small><input className="wz-big" value={w.name} onChange={(e) => set({ name: e.target.value })} placeholder="예) 수학의 정석 미적분" autoFocus /></label>
      {past.length > 0 && (
        <section className="fcard tight">
          {past.map((t) => (
            <button key={t.id} className="frow btn" onClick={() => set({ name: t.name, categoryId: t.categoryId ?? '', unit: t.unit || '쪽' })}>
              <i className="wz-dot" style={{ background: subjectVar(s.categories.find((c) => c.id === t.categoryId)?.color) }} />
              <span className="grow ell">{t.name}</span><small>{t.completed ? `끝냄${t.completedDate ? ` · ${Number(t.completedDate.slice(5, 7))}월` : ''}` : '진행 중'}</small>
            </button>
          ))}
        </section>
      )}
      <div className="wz-lab"><small>과목</small><small>없어도 괜찮아요</small></div>
      <div className="wz-chips" role="radiogroup" aria-label="과목">
        {s.categories.map((c) => (
          <button key={c.id} role="radio" aria-checked={w.categoryId === c.id} className={`chip${w.categoryId === c.id ? ' dark' : ''}`}
            onClick={() => (w.categoryId === c.id ? setSheet(c.id) : set({ categoryId: c.id }))}>
            <i className="wz-dot" style={{ background: subjectVar(c.color) }} />{c.name}
          </button>
        ))}
        <button className="chip wz-add" onClick={() => setAdding(true)}><Icon name="plus" size={15} />새 과목</button>
        <button className="chip" onClick={() => setSheet('preset')}>프리셋에서 고르기<Icon name="right" size={16} /></button>
      </div>
      {adding && (
        <section className="fcard wz-newcat">
          <div className="wz-row2">
            <button className="wz-cdot lg" aria-label="과목 색" style={{ background: subjectVar(cc) }} onClick={() => setSheet('color')} />
            <input value={cn} onChange={(e) => setCn(e.target.value)} placeholder="과목 이름" aria-label="과목 이름" autoFocus onKeyDown={(e) => e.key === 'Enter' && addCat()} />
          </div>
          <div className="wz-row2"><button className="chip" onClick={() => setAdding(false)}>취소</button><button className="chip dark" disabled={!cn.trim()} onClick={addCat}>더하기</button></div>
        </section>
      )}
      <small className="wz-note">{past.length > 0 ? '예전 이름을 고르면 과목과 단위도 그때처럼 채워요.' : w.categoryId ? '고른 과목을 한 번 더 누르면 색을 바꿔요.' : ''}</small>
      {sheet === 'preset' && <PresetSheet onClose={() => setSheet(null)} onAdded={(id) => !w.categoryId && set({ categoryId: id })} />}
      {sheet === 'color' && <ColorSheet name={cn} value={cc} onPick={setCc} onClose={() => setSheet(null)} />}
      {editing && <ColorSheet name={editing.name} value={editing.color} onPick={(color) => actions.saveCategory({ ...(editing as Category), color })} onClose={() => setSheet(null)} />}
    </>
  )
}

// ── 3. 얼마나 ──
const UNITS = ['쪽', '문항', '강']
const CH_TONE = (i: number) => `color-mix(in srgb, var(--s-m) ${i % 2 ? 22 : 34}%, var(--sf))`
function UnitBar({ chapters }: { chapters: { from: number; to: number }[] }) {
  return <div className="wz-ubar" aria-hidden="true">{chapters.map((c, i) => <span key={i} style={{ flex: c.to - c.from + 1, background: CH_TONE(i) }}>{chapters.length <= 16 ? i + 1 : ''}</span>)}</div>
}
function AmountStep({ w, set, openToc, editToc }: { w: Wiz; set: (p: Partial<Wiz>) => void; openToc: (k: 'paste' | 'type') => void; editToc: () => void }) {
  const custom = !UNITS.includes(w.unit)
  const { res, to, start } = rangeOf(w)
  const total = to !== null && to >= start ? to - start + 1 : null
  return (
    <>
      <Q q="얼마나 하나요?" sub="범위를 적으면 하루 분량을 나눠 드려요." />
      <div className="seg" role="radiogroup" aria-label="시작 위치">
        <button role="radio" aria-checked={!w.part} className={!w.part ? 'on' : ''} onClick={() => set({ part: false })}>처음부터 해요</button>
        <button role="radio" aria-checked={w.part} className={w.part ? 'on' : ''} onClick={() => set({ part: true })}>이미 한 부분이 있어요</button>
      </div>
      <div className="wz-range">
        <span className="wz-big"><Num value={w.from} onChange={(v) => set({ from: v })} placeholder="1" /></span><span className="mu">~</span>
        <span className="wz-big"><Num value={w.to} onChange={(v) => set({ to: v })} placeholder="232" /></span>
      </div>
      {w.part && <label className="wz-done"><span>어디까지 했나요?</span><span className="wz-big sm"><Num value={w.done} onChange={(v) => set({ done: v })} placeholder={String(w.from ?? 1)} /></span><span className="mu">{w.unit}까지</span></label>}
      <div className="wz-chips">
        {UNITS.map((u) => <button key={u} className={`chip${w.unit === u ? ' dark' : ''}`} onClick={() => set({ unit: u })}>{u}</button>)}
        {custom ? <input className="chip wz-unit" value={w.unit} onChange={(e) => set({ unit: e.target.value })} aria-label="단위" autoFocus /> : <button className="chip" onClick={() => set({ unit: '' })}>직접</button>}
        {total !== null && <small className="wz-push">{w.part ? '남은' : '모두'} {total}{w.unit}</small>}
      </div>
      {w.unit !== '강' && (res ? (
        <section className="fcard prev" aria-label="넣은 목차">
          <div className="wz-lab"><b>목차 <small>{countLabel(res.counts)}</small></b><button className="chip" onClick={editToc}>고치기</button></div>
          <UnitBar chapters={res.chapters} />
          <div className="wz-units">
            {res.chapters.slice(0, 3).map((c, i) => <div key={c.id}><span className="mu">{i + 1}</span><span className="grow ell">{c.name}</span><small>{c.from}~{c.to}</small></div>)}
            {res.chapters.length > 3 && <small className="wz-more">외 {res.chapters.length - 3}단원</small>}
          </div>
          <small>하루 분량은 가장 아래 항목 끝에서 끊고, 단원이 끝나는 날은 달력에 책갈피로 표시해요.</small>
        </section>
      ) : (
        <section className="fcard prev">
          <div className="wz-lab"><b>목차도 넣을래요?</b><span className="wz-tag">선택</span></div>
          <small>단원별로 진도와 복습 시기를 챙겨 드려요. 나중에 넣어도 돼요.</small>
          <div className="wz-row2"><button className="chip" onClick={() => openToc('paste')}><Icon name="paste" size={16} />목차 붙여넣기</button><button className="chip" onClick={() => openToc('type')}><Icon name="plus" size={15} />직접 입력</button></div>
        </section>
      ))}
    </>
  )
}

// ── 3-1. 붙여넣기 ──
function PasteStep({ text, setText }: { text: string; setText: (v: string) => void }) {
  const fromClip = async () => { try { const t = await navigator.clipboard.readText(); if (t) setText(t) } catch { /* 권한이 없으면 직접 붙여넣기 */ } }
  const n = text.split(/\r?\n/).filter((l) => l.trim()).length
  return (
    <>
      <Q q="목차를 붙여넣어 주세요" sub="들여쓰기가 없어도 번호 모양(Ⅰ. → 1. → (1))으로 단계를 읽어요." />
      <textarea className="wz-src" value={text} onChange={(e) => setText(e.target.value)} aria-label="붙여넣은 목차" placeholder={'Ⅰ. 수열의 극한\n1. 수열의 수렴과 발산 ······ 1\n2. 수열의 극한값의 계산 ···· 10'} />
      <div className="wz-lab"><small>{n ? `${n}줄 붙여넣음` : '아직 비어 있어요'}</small><button className="chip" onClick={fromClip}><Icon name="paste" size={16} />{n ? '다시 붙여넣기' : '붙여넣기'}</button></div>
      <section className="fcard tight" aria-label="어디서 복사하나요">
        <div className="frow"><span className="fl">온라인 서점</span><span className="fr sm">책 소개의 목차 부분을 복사</span></div>
        <div className="frow"><span className="fl">PDF</span><span className="fr sm">목차 쪽을 골라 복사</span></div>
        <div className="frow"><span className="fl">종이책</span><span className="fr sm">카메라로 목차를 비추고 글자 복사</span></div>
      </section>
    </>
  )
}

// ── 3-3. 직접 입력: 한 줄에 하나. 줄을 바꾸면 같은 단계, 줄 앞 '-'는 한 단계 아래, 줄 끝 숫자는 시작 쪽 ──
function TypeStep({ rows, setRows }: { rows: Row[]; setRows: (r: Row[]) => void }) {
  const [cur, setCur] = useState(rows.length - 1)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const caret = useRef<number | null>(null)
  useEffect(() => {
    const el = refs.current[cur]
    if (!el) return
    el.focus()
    const p = caret.current ?? el.value.length
    el.setSelectionRange(p, p)
    caret.current = null
  }, [cur, rows.length])
  const fix = (r: Row[]) => { let prev = -1; return r.map((x) => { const depth = Math.max(0, Math.min(x.depth, prev + 1)); prev = depth; return depth === x.depth ? x : { ...x, depth } }) }
  const put = (r: Row[], at = cur) => { setRows(fix(r)); setCur(Math.max(0, Math.min(at, r.length - 1))) }
  const nums = autoNums(rows.map((r) => ({ depth: r.depth, num: '', pat: 'plain', name: r.text, page: null })))
  const shift = (by: number) => put(rows.map((r, i) => (i === cur ? { ...r, depth: Math.max(0, r.depth + by) } : r)))
  const del = () => put(rows.length > 1 ? rows.filter((_, i) => i !== cur) : [{ depth: 0, text: '' }], cur - 1)
  const key = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    const at = el.selectionStart ?? el.value.length
    if (e.key === 'Enter') {
      e.preventDefault()
      const r = [...rows]
      r.splice(i, 1, { ...rows[i], text: rows[i].text.slice(0, at) }, { depth: rows[i].depth, text: rows[i].text.slice(at) })
      caret.current = 0
      put(r, i + 1)
    } else if (e.key === 'Backspace' && at === 0 && el.selectionEnd === 0) {
      if (rows[i].depth > 0) { e.preventDefault(); shift(-1) } else if (i > 0) {
        e.preventDefault()
        caret.current = rows[i - 1].text.length
        put(rows.flatMap((r, j) => (j === i - 1 ? [{ ...r, text: r.text + rows[i].text }] : j === i ? [] : [r])), i - 1)
      }
    }
  }
  const change = (i: number, v: string) => {
    const m = v.match(/^-+\s*/)
    put(rows.map((r, j) => (j === i ? (m ? { depth: r.depth + m[0].replace(/\s/g, '').length, text: v.slice(m[0].length) } : { ...r, text: v }) : r)), i)
  }
  return (
    <>
      <section className="fcard tight wz-typed" aria-label="입력한 목차">
        {rows.map((r, i) => {
          const pg = splitRow(r.text).page
          return (
            <div key={i} className={`frow wz-line${i === cur ? ' sel' : ''}`} style={{ paddingLeft: 4 + r.depth * 20 }}>
              <small>{nums[i]}</small>
              {i === cur
                ? <input ref={(el) => { refs.current[i] = el }} className={r.depth === 0 ? 'b' : ''} value={r.text} onChange={(e) => change(i, e.target.value)} onKeyDown={(e) => key(i, e)} enterKeyHint="next" aria-label={`${nums[i]} 줄`} placeholder={i === 0 ? '단원 이름' : ''} />
                : <button className={`grow ell wz-rowtxt${r.depth === 0 ? ' b' : ''}`} onClick={() => setCur(i)}>{splitRow(r.text).name || r.text}</button>}
              {pg !== null && <span className={`wz-pg${i === cur ? ' wz-ghost' : ''}`}>{pg}<small>쪽</small></span>}
            </div>
          )
        })}
        <div className="frow"><small>줄을 바꾸면 같은 단계로 이어져요</small></div>
      </section>
      <small className="wz-note">줄 끝의 숫자는 시작 쪽으로 읽어요. 줄 앞에 ‘-’를 쓰면 한 단계 아래로 들어가요.</small>
      <div className="wz-kbar">
        <button className="chip" onMouseDown={(e) => e.preventDefault()} onClick={() => shift(-1)}><Icon name="outdent" size={18} />내어쓰기</button>
        <button className="chip" onMouseDown={(e) => e.preventDefault()} onClick={() => shift(1)}><Icon name="indent" size={18} />들여쓰기</button>
        <button className="chip sq" aria-label="줄 지우기" onMouseDown={(e) => e.preventDefault()} onClick={del}><Icon name="trash" size={17} /></button>
      </div>
    </>
  )
}

// ── 3-2. 읽은 결과 ──
function ReadStep({ lines, setLines, w, set }: { lines: TocLine[]; setLines: (l: TocLine[]) => void; w: Wiz; set: (p: Partial<Wiz>) => void }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set([0, 1]))
  const [sel, setSel] = useState<number | null>(null)
  const res = resolveToc(lines, w.to, null)
  if (!res) return <Q q="읽을 줄이 없어요" />
  const spans = lineSpans(lines, res.end)
  const pats = patternLevels(lines)
  const nums = autoNums(lines)
  const matches = w.to === null || (res.start === (w.from ?? 1) && res.end === w.to)
  const edit = (i: number, p: Partial<TocLine>) => setLines(normalize(lines.map((l, j) => (j === i ? { ...l, ...p } : l))))
  let unit = -1
  const rows: ReactNode[] = []
  lines.forEach((l, i) => {
    if (l.depth === 0) unit++
    const u = unit
    const shownLine = l.depth === 0 || open.has(u)
    if (!shownLine) return
    const leaf = !(lines[i + 1] && lines[i + 1].depth > l.depth)
    const r = res.lines[i]
    const kids = l.depth === 0 ? lines.slice(i + 1).findIndex((x) => x.depth === 0) : 0
    const nKids = l.depth === 0 ? (kids < 0 ? lines.length - i - 1 : kids) : 0
    rows.push(
      <button key={i} className={`frow btn wz-line${sel === i ? ' sel' : ''}`} style={{ paddingLeft: 4 + l.depth * 20 }} onClick={() => (l.depth === 0 && !open.has(u) ? setOpen(new Set([...open, u])) : setSel(sel === i ? null : i))}>
        <small>{nums[i]}</small><span className={`grow ell${l.depth === 0 ? ' b' : ''}`}>{l.name}</span>
        {l.depth === 0 && !open.has(u) ? <><small>{nKids}개</small><small>{spans[i][0]}~{spans[i][1]}쪽</small><Icon name="right" size={16} /></>
          : leaf ? <span className={`wz-pg${r.est ? ' est' : ''}${res.bad.includes(i) ? ' bad' : ''}`}>{r.est && <b>추정</b>}{r.page}<small>쪽</small></span>
            : <small>{spans[i][0]}~{spans[i][1]}쪽</small>}
      </button>,
    )
    if (sel === i) rows.push(
      <div key={`e${i}`} className="frow wz-edit">
        <button className="chip" aria-label="한 단계 위로" onClick={() => edit(i, { depth: Math.max(0, l.depth - 1) })}><Icon name="outdent" size={18} /></button>
        <button className="chip" aria-label="한 단계 아래로" onClick={() => edit(i, { depth: l.depth + 1 })}><Icon name="indent" size={18} /></button>
        {leaf && <span className="wz-pgin"><Num value={l.page} onChange={(v) => edit(i, { page: v })} placeholder={String(r.page)} /><small>쪽</small></span>}
        <button className="chip" aria-label="이 줄 지우기" onClick={() => { setLines(normalize(lines.filter((_, j) => j !== i))); setSel(null) }}><Icon name="trash" size={17} /></button>
      </div>,
    )
  })
  const est = res.lines.filter((l) => l.est).length
  return (
    <>
      <Q q="이렇게 읽었어요" sub="단계가 틀린 줄만 고쳐 주세요." />
      <section className="fcard prev" aria-label="읽은 목차 요약">
        <div className="wz-lab"><b>{countLabel(res.counts)}</b><small>{res.start}~{res.end}쪽</small></div>
        <UnitBar chapters={res.chapters} />
        {matches ? <small className="wz-ok"><Icon name="check" size={16} />{w.to === null ? '범위를 목차에서 채울게요' : `3단계에 적은 범위 ${w.from ?? 1}~${w.to}쪽과 맞아요`}</small>
          : <div className="wz-lab"><small>적은 범위 {w.from ?? 1}~{w.to}쪽과 달라요</small><button className="chip" onClick={() => set({ from: res.start, to: res.end })}>{res.start}~{res.end}쪽으로</button></div>}
        {res.bad.length > 0 && <small className="bad">쪽이 앞 줄보다 작은 줄이 {res.bad.length}개 있어요. 눌러서 고쳐 주세요.</small>}
      </section>
      {pats.length > 1 && (
        <>
          <div className="wz-lab sh"><b>번호 모양</b><small>모양마다 한 번에 바뀌어요</small></div>
          <section className="fcard tight" aria-label="번호 모양과 단계">
            {pats.map((p) => (
              <div key={p.pat} className="frow" style={{ paddingLeft: p.depth * 16 }}>
                <span className="wz-pg c">{p.num || '글'}</span><span className="grow sm">{p.depth + 1}단계 · {p.count}줄</span>
                <button className="chip sq" aria-label="한 단계 위로" onClick={() => setLines(shiftPattern(lines, p.pat, -1))}><Icon name="outdent" size={18} /></button>
                <button className="chip sq" aria-label="한 단계 아래로" onClick={() => setLines(shiftPattern(lines, p.pat, 1))}><Icon name="indent" size={18} /></button>
              </div>
            ))}
          </section>
        </>
      )}
      <div className="wz-lab sh"><b>목차</b><small>줄을 누르면 쪽·단계를 고쳐요</small></div>
      <section className="fcard tight" aria-label="읽은 목차">{rows}</section>
      <section className="fcard prev">
        {est > 0 && <small style={{ color: 'var(--ink)' }}>쪽이 없는 줄 {est}개는 앞뒤 쪽 사이로 <b className="rib">추정</b>했어요.</small>}
        <small>끝 쪽은 다음 줄의 시작 쪽에서 채워요.</small>
      </section>
    </>
  )
}

// ── 4. 기간 + 요일 ──
function PeriodStep({ w, set, task, pending, setPending, examDate, today }: { w: Wiz; set: (p: Partial<Wiz>) => void; task: Task | null; pending: boolean; setPending: (v: boolean) => void; examDate: string | null; today: string }) {
  const first = addDays(today, -((dow(today) + 6) % 7))
  const last = (() => { const e = [w.endDate, examDate ?? '', addDays(today, 27)].sort().pop()!; return addDays(e, 6 - ((dow(e) + 6) % 7)) })()
  const allWeeks = Math.max(5, Math.ceil((diffDays(first, last) + 1) / 7))
  const [page, setPage] = useState(0)
  const weeks = 5
  const from = addDays(first, page * 28)
  const buf = new Set(task ? bufferDates(w).filter((d) => task.custom[d] === 0) : [])
  const tap = (d: string) => {
    const r = pickDate({ start: w.startDate, end: pending ? null : w.endDate }, d)
    if (r.end === null) { set({ startDate: r.start, endDate: r.start }); setPending(true) } else { set({ startDate: r.start, endDate: r.end }); setPending(false) }
  }
  const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(from, i))
  const mon = (d: string) => `${Number(d.slice(5, 7))}월`
  const title = mon(days[0]) === mon(days[days.length - 1]) ? mon(days[0]) : `${mon(days[0])} – ${mon(days[days.length - 1])}`
  const len = diffDays(w.startDate, w.endDate) + 1
  const shape = task ? weekShape(task, today) : null
  const study = task ? Object.values(futurePlan(task, {}, w.startDate)).filter((v) => v > 0).length : 0
  const plan = task ? futurePlan(task, {}, w.startDate) : {}
  const used = Object.keys(plan).filter((d) => plan[d] > 0).sort()
  const endUsed = used[used.length - 1]
  const per = task && study ? Math.round(task.amount / (study - (task.custom[task.startDate] ? 0.5 : 0))) : 0
  const ex = examDate ? addDays(examDate, -1) : null
  return (
    <>
      <Q q="언제부터 언제까지 할까요?" sub={pending ? '끝나는 날을 눌러요.' : '달력에서 시작과 끝을 눌러요.'} />
      <div className="wz-quick">
        <div><small>시작</small><button className={`chip${w.startDate === today ? ' dark' : ''}`} onClick={() => set({ startDate: today })}>오늘 {md(today)}</button><button className={`chip${w.startDate === addDays(today, 1) ? ' dark' : ''}`} onClick={() => set({ startDate: addDays(today, 1) })}>내일</button></div>
        <div><small>끝</small>{ex && <button className={`chip${w.endDate === ex ? ' dark' : ''}`} onClick={() => { set({ endDate: ex }); setPending(false) }}>시험 전날 {md(ex)}</button>}<button className={`chip${w.endDate === addDays(w.startDate, 27) ? ' dark' : ''}`} onClick={() => { set({ endDate: addDays(w.startDate, 27) }); setPending(false) }}>4주 뒤</button></div>
      </div>
      <section className="fcard wz-cal" aria-label="기간 달력">
        <div className="wz-cal-nav"><button className="fp-b" aria-label="이전 달" disabled={page === 0} onClick={() => setPage(page - 1)}><Icon name="left" size={20} /></button><b>{title}</b><button className="fp-b" aria-label="다음 달" disabled={page * 4 + 5 >= Math.max(allWeeks, 26)} onClick={() => setPage(page + 1)}><Icon name="right" size={20} /></button></div>
        <div className="wz-cal-h">{ORDER.map((d) => <small key={d}>{DOW[d]}</small>)}</div>
        <div className="wz-cal-g">
          {days.map((d, i) => {
            const inR = d >= w.startDate && d <= w.endDate
            const cap = d === w.startDate || (d === w.endDate && !pending)
            const col = i % 7
            const k = w.days[dow(d)]
            const cls = ['wz-cd', inR ? 'in' : '', inR && (d === w.startDate || col === 0) ? 'l' : '', inR && (d === w.endDate || col === 6) ? 'r' : '', d < today ? 'past' : '', d === examDate ? 'ex' : ''].join(' ')
            return (
              <button key={d} className={cls} disabled={d < today} onClick={() => tap(d)} aria-label={`${mdKo(d)}${d === examDate ? ' 시험' : ''}`} aria-pressed={cap}>
                <span className={cap ? 'cap' : k === 'sp' && inR ? 'rib b' : ''}>{d === examDate ? <><b>{Number(d.slice(8))}</b><small>시험</small></> : Number(d.slice(8))}</span>
                {inR && !cap && k === 'sp' && <i className="sp" />}{inR && !cap && buf.has(d) && <i className="hatch" />}
              </button>
            )
          })}
        </div>
        <div className="wz-lgd"><span><i className="sq rib" />예비일</span>{buf.size > 0 && <span><i className="sq hatch" />마지막 {buf.size}일 여유</span>}<span>{len >= 7 ? `${Math.floor(len / 7)}주${len % 7 ? ` ${len % 7}일` : ''} · ` : ''}{len}일</span></div>
      </section>
      <div className="wz-lab"><small>공부하는 요일</small><small>누를 때마다 공부 → 예비 → 쉼</small></div>
      <section className="fcard wz-days">
        {ORDER.map((d) => <button key={d} className={`wz-dy ${w.days[d]}`} aria-label={`${DOW[d]}요일 ${w.days[d] === 'on' ? '공부' : w.days[d] === 'sp' ? '예비' : '쉼'}`} onClick={() => {
          const k = NEXT_KIND[w.days[d]]
          // 예비일은 한 요일만 (밀린 분량을 몰아 하는 날)
          set({ days: w.days.map((x, i) => (i === d ? k : k === 'sp' && x === 'sp' ? 'on' : x)) })
        }}>{DOW[d]}</button>)}
      </section>
      {task && shape && (
        <section className="fcard prev" aria-label="한 주 모양">
          <div className="wz-lab"><b>한 주는 이렇게 돼요</b><small>하루 {per}{task.unit}쯤</small></div>
          <div className="wz-week">
            {ORDER.map((d) => <span key={d}><small>{DOW[d]}</small>
              {w.days[d] === 'sp' ? <i className="sp"><small>예비</small></i> : w.days[d] === 'off' ? <i className="off"><small>쉼</small></i> : <i><b>{shape[d] ?? per}</b><small>{task.unit}</small></i>}
            </span>)}
          </div>
          <small style={{ color: 'var(--ink)' }}>공부 {study}일 · {endUsed ? `${mdKo(endUsed)} 끝` : ''}{examDate && endUsed ? ` · 시험 전 여유 ${diffDays(endUsed, examDate) - 1}일` : ''}</small>
          <small>다음 단계에서 시간대를 정하면 알림 시간도 맞춰요.</small>
        </section>
      )}
    </>
  )
}

// ── 5. 시간대: 띠에서 끌어서 정한다 (가운데 = 옮기기, 양 끝 손잡이 = 늘이고 줄이기, 빈 곳 = 새 시간대) ──
const HRS = [6, 9, 12, 15, 18, 21, 24]
const LO = 360
const HI = 1440
const pos = (m: number) => `${((m - LO) / (HI - LO)) * 100}%`
const QUICK: [string, 'weekday' | 'weekend', Win][] = [['아침 6~8시', 'weekday', [360, 480]], ['방과 후 4~6시', 'weekday', [960, 1080]], ['저녁 8~10시', 'weekday', [1200, 1320]], ['밤 10~12시', 'weekday', [1320, 1440]], ['주말 오전', 'weekend', [600, 780]]]
const snap = (m: number) => Math.round(m / 30) * 30
const short = (m: number) => clock(m).replace(/^오[전후] /, '')
/** 빈 자리에 len분짜리 시간대 (from 근처부터) */
function freeSlot(ws: Win[], from: number, len = 120): Win | null {
  const sorted = [...ws].sort((a, b) => a[0] - b[0])
  for (const start of [snap(from), ...Array.from({ length: 36 }, (_, i) => LO + i * 30)]) {
    const a = Math.max(LO, Math.min(start, HI - len))
    if (!sorted.some(([x, y]) => a < y && a + len > x)) return [a, a + len]
  }
  return null
}
function Band({ label, ws, onChange }: { label: string; ws: Win[]; onChange: (ws: Win[]) => void }) {
  const track = useRef<HTMLDivElement>(null)
  const drag = useRef<{ i: number; mode: 'move' | 'a' | 'b'; x0: number; w0: Win; moved: boolean } | null>(null)
  const [sel, setSel] = useState<number | null>(null)
  const sorted = [...ws].sort((a, b) => a[0] - b[0])
  const minsPerPx = () => (HI - LO) / (track.current?.clientWidth || 1)
  const down = (i: number, mode: 'move' | 'a' | 'b') => (e: PointerEvent) => {
    e.stopPropagation()
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    drag.current = { i, mode, x0: e.clientX, w0: sorted[i], moved: false }
  }
  const move = (e: PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dm = snap((e.clientX - d.x0) * minsPerPx())
    if (dm === 0 && !d.moved) return
    d.moved = true
    const lo = d.i > 0 ? sorted[d.i - 1][1] : LO
    const hi = d.i < sorted.length - 1 ? sorted[d.i + 1][0] : HI
    const [a0, b0] = d.w0
    const next: Win = d.mode === 'move' ? (() => { const a = Math.max(lo, Math.min(a0 + dm, hi - (b0 - a0))); return [a, a + b0 - a0] })()
      : d.mode === 'a' ? [Math.max(lo, Math.min(a0 + dm, b0 - 30)), b0] : [a0, Math.max(a0 + 30, Math.min(b0 + dm, hi))]
    onChange(sorted.map((x, j) => (j === d.i ? next : x)))
  }
  const up = () => { const d = drag.current; drag.current = null; if (d && !d.moved) setSel(sel === d.i ? null : d.i) }
  const tapEmpty = (e: MouseEvent) => {
    if (e.target !== track.current) return
    const r = track.current!.getBoundingClientRect()
    const m = LO + ((e.clientX - r.left) / r.width) * (HI - LO)
    const slot = freeSlot(sorted, m - 60)
    if (slot) onChange([...sorted, slot])
  }
  return (
    <div className="wz-band">
      <div className="wz-lab"><b>{label}</b><small style={{ color: 'var(--ink)' }}>{sorted.length ? <>{sorted.map(([a, b]) => `${short(a)} ~ ${short(b)}`).join(' · ')} <span className="mu">· {winSum(sorted) % 60 ? dur(winSum(sorted)) : `${winSum(sorted) / 60}시간`}</span></> : <span className="mu">빈 곳을 눌러 더해요</span>}</small></div>
      <div ref={track} className="wz-track" onClick={tapEmpty} onPointerMove={move} onPointerUp={up} onPointerCancel={up} role="group" aria-label={`${label} 시간대`}>
        {HRS.slice(1, -1).map((h) => <span key={h} className="wz-tick" style={{ left: pos(h * 60) }} />)}
        {sorted.map(([a, b], i) => (
          <span key={i} className={`blk${sel === i ? ' sel' : ''}`} style={{ left: pos(a), width: `calc(${pos(b)} - ${pos(a)})` }} onPointerDown={down(i, 'move')} onPointerMove={move} onPointerUp={up}>
            <i className="h a" onPointerDown={down(i, 'a')} onPointerMove={move} onPointerUp={up} />
            <i className="h b" onPointerDown={down(i, 'b')} onPointerMove={move} onPointerUp={up} />
          </span>
        ))}
      </div>
      <div className="wz-hrs" aria-hidden="true">{HRS.map((h) => <small key={h} style={{ left: pos(h * 60), transform: `translateX(${h === 6 ? '0' : h === 24 ? '-100%' : '-50%'})` }}>{h}시</small>)}</div>
      {sel !== null && sorted[sel] && <div className="wz-lab"><small>{clock(sorted[sel][0])} ~ {clock(sorted[sel][1])}</small><button className="chip" onClick={() => { onChange(sorted.filter((_, j) => j !== sel)); setSel(null) }}><Icon name="trash" size={16} />이 시간대 지우기</button></div>}
    </div>
  )
}
function TimeStep({ w, set }: { w: Wiz; set: (p: Partial<Wiz>) => void }) {
  const win = w.windows
  const put = (p: Partial<StudyWindows>) => set({ windows: { ...win, ...p } })
  const per = win.perDay ?? null
  const first = windowsOn(win, 1)[0] ?? null
  const firstEnd = windowsOn(win, 6)[0] ?? null
  return (
    <>
      <Q q="보통 언제 공부해요?" sub="공부할 수 있는 시간대를 밀어서 정해요. 이 시간에 다음 공부를 띄우고, 하루에 넣을 양도 여기에 맞춰요." />
      <section className="fcard prev wz-bands">
        {per ? ORDER.map((d) => <Band key={d} label={`${DOW[d]}요일`} ws={per[d]} onChange={(ws) => put({ perDay: per.map((x, i) => (i === d ? ws : x)) })} />)
          : <><Band label="평일" ws={win.weekday} onChange={(weekday) => put({ weekday })} /><Band label="주말" ws={win.weekend} onChange={(weekend) => put({ weekend })} /></>}
        <div className="wz-row2">
          {!per && <button className="chip" onClick={() => { const slot = freeSlot(win.weekday, 1200); if (slot) put({ weekday: [...win.weekday, slot] }) }}><Icon name="plus" size={15} />시간대 더하기</button>}
          <button className="chip" onClick={() => put({ perDay: per ? null : Array.from({ length: 7 }, (_, d) => windowsOn(win, d)) })}>{per ? '평일·주말로 묶기' : '요일마다 따로'}</button>
        </div>
      </section>
      <small className="wz-note">빨리 고르기</small>
      <div className="wz-chips">{QUICK.map(([l, k, v]) => <button key={l} className="chip" onClick={() => {
        if (per) put({ perDay: per.map((x, d) => ((k === 'weekend') === (d === 0 || d === 6) && !x.some((y) => y[0] < v[1] && y[1] > v[0]) ? [...x, v] : x)) })
        else if (!win[k].some((y) => y[0] < v[1] && y[1] > v[0])) put({ [k]: [...win[k], v] })
      }}>{l}</button>)}</div>
      <section className="fcard tight">
        <label className="frow"><span className="grow"><span style={{ display: 'block' }}>시작할 때 알려 주기</span><small>{first ? `평일 ${short(first[0])}` : '평일 시간대 없음'}{firstEnd ? ` · 주말 ${short(firstEnd[0])}` : ''} · 앱이 꺼져 있으면 늦을 수 있어요</small></span>
          <input type="checkbox" className="switch" checked={w.notify} onChange={(e) => set({ notify: e.target.checked })} aria-label="시작할 때 알려 주기" /></label>
      </section>
    </>
  )
}

// ── 6. 한눈에 ──
/** 1단위에 드는 초: 같은 단위로 기록이 쌓인 계획이 있으면 그 속도, 없으면 기본값 */
function speedOf(s: State, t: Task) {
  const same = s.tasks.filter((x) => x.type === 'amount' && x.unit === t.unit && Object.values(s.recs[x.id] ?? {}).filter((r) => r.done > 0 && r.sec > 0).length >= 3)
  return same.length ? same.reduce((a, x) => a + secPerUnit(x, s.recs[x.id] ?? {}), 0) / same.length : secPerUnit(t, {})
}
/** 평일 하루 평균(분): 이 계획 · 다른 계획 · 공부 가능 시간 */
function weekdayLoad(s: State, t: Task, today: string, windows: StudyWindows) {
  const from = t.startDate > today ? t.startDate : today
  const days = Array.from({ length: 14 }, (_, i) => addDays(from, i)).filter((d) => dow(d) >= 1 && dow(d) <= 5)
  const plan = futurePlan(t, {}, t.startDate)
  const spu = speedOf(s, t)
  const mineDays = days.filter((d) => (plan[d] ?? 0) > 0)
  const mine = mineDays.length ? mineDays.reduce((a, d) => a + plan[d] * spu, 0) / mineDays.length / 60 : 0
  let other = 0
  for (const x of s.tasks) {
    if (x.completed || x.archived || x.id === t.id) continue
    if (x.type === 'amount') {
      const p = planOf(s, x, today)
      const sp = secPerUnit(x, s.recs[x.id] ?? {})
      other += days.reduce((a, d) => a + (p[d] ?? 0) * sp, 0) / days.length / 60
    } else if (x.type === 'time') {
      other += days.filter((d) => d >= x.startDate && (!x.endDate || d <= x.endDate) && x.week[dow(d)]).length * x.perDay / days.length / 60
    }
  }
  const avail = [1, 2, 3, 4, 5].reduce((a, d) => a + winSum(windowsOn(windows, d)), 0) / 5
  return { mine: Math.round(mine / 5) * 5, other: Math.round(other / 5) * 5, avail }
}

function SummaryStep({ s, w, task, today, examDate, go }: { s: State; w: Wiz; task: Task; today: string; examDate: string | null; go: (n: number) => void }) {
  const cats = s.categories
  const ld = weekdayLoad(s, task, today, w.windows)
  const total = ld.mine + ld.other
  const scale = Math.max(ld.avail, total, 1)
  const color = subjectVar(cats.find((c) => c.id === w.categoryId)?.color ?? SUBJECTS[0].hex)
  const plan = futurePlan(task, {}, task.startDate)
  const used = Object.keys(plan).filter((d) => plan[d] > 0).sort()
  const end = used[used.length - 1] ?? task.endDate!
  const study = used.length
  const per = study ? Math.round(task.amount / (study - (task.custom[task.startDate] ? 0.5 : 0))) : 0
  const ends = new Set(chapterSpans(task, {}, task.startDate).map((c) => c.end).filter(Boolean) as string[])
  const buf = new Set(bufferDates(w).filter((d) => task.custom[d] === 0))
  const first = addDays(task.startDate, -((dow(task.startDate) + 6) % 7))
  const lastD = [task.endDate!, examDate ?? ''].sort().pop()!
  const weeks = Math.ceil((diffDays(first, lastD) + 1) / 7)
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(first, i))
  // 책갈피 길: 주의 마지막 공부일(일요일)마다 도착 위치
  const start = task.startPoint ?? 1
  let acc = start - 1
  const stops: [number, string, string][] = [[0, '오늘', `${start}쪽`]]
  for (const d of Object.keys(plan).sort()) {
    acc += plan[d]
    if (dow(d) === 0 && plan[d] >= 0 && acc < start + task.amount - 1 && d > task.startDate) stops.push([(acc - start + 1) / task.amount, md(d), `${acc}${task.unit}`])
  }
  stops.push([1, md(end), '끝'])
  const shownStops = stops.length > 4 ? [stops[0], ...stops.slice(1, -1).filter((_, i, a) => i % Math.ceil(a.length / 2) === 0).slice(0, 2), stops[stops.length - 1]] : stops
  const cat = cats.find((c) => c.id === w.categoryId)
  const res = w.toc.length ? resolveToc(w.toc, w.to, w.from) : null
  const fmtDays = ORDER.filter((d) => w.days[d] === 'on').map((d) => DOW[d]).join('')
  const sp = ORDER.find((d) => w.days[d] === 'sp')
  const rows: [string, ReactNode, number][] = [
    ['이름', <><i className="wz-dot" style={{ background: subjectVar(cat?.color) }} /> {w.name}{cat ? ` · ${cat.name}` : ''}</>, 2],
    ['범위', `${task.startPoint} ~ ${(task.startPoint ?? 1) + task.amount - 1}${task.unit}`, 3],
    ['목차', res ? countLabel(res.counts) : <span className="mu">없음</span>, 3],
    ['기간', `${md(task.startDate)} ~ ${md(task.endDate!)}${buf.size ? ` · 마지막 ${buf.size}일 여유` : ''}`, 4],
    ['요일', `${fmtDays} 공부${sp !== undefined ? ` · ${DOW[sp]}요일 예비` : ''}`, 4],
    ['시간', w.windows.weekday[0] || w.windows.weekend[0] ? `평일 ${dur(winSum(w.windows.weekday))} · 주말 ${dur(winSum(w.windows.weekend))}` : <span className="mu">정하지 않음</span>, 5],
    ['첫날', task.custom[task.startDate] ? `${task.custom[task.startDate]}${task.unit}만 · 평소의 절반` : '평소대로', 4],
  ]
  return (
    <>
      <Q q="이렇게 짜 볼게요" sub="날짜나 줄을 누르면 고칠 수 있어요." />
      <section className="fcard prev" aria-label="하루 분량">
        <div className="wz-lab"><span className="wz-per"><b>{per}</b>{task.unit} / 일쯤</span><small>{mdKo(end)} 끝{examDate ? ` · 시험 ${diffDays(end, examDate)}일 전` : ''}</small></div>
        <div className="wz-lab wz-use"><span>평일 하루에 쓰는 시간</span><span><b>{dur(total)}</b>{ld.avail > 0 && <span className="mu"> / {dur(ld.avail)}</span>}</span></div>
        <div className="wz-usebar" aria-hidden="true"><span style={{ width: `${(ld.mine / scale) * 100}%`, background: color }} /><span className="o" style={{ width: `${(ld.other / scale) * 100}%` }} /></div>
        <div className="wz-lgd"><span><i className="sq" style={{ background: color }} />이 계획 {dur(ld.mine)}</span>{ld.other > 0 && <span><i className="sq o" />다른 계획 {dur(ld.other)}</span>}{ld.avail > 0 && <span>{total <= ld.avail ? `남는 시간 ${dur(ld.avail - total)}` : `가능 시간보다 ${dur(total - ld.avail)} 많아요`}</span>}</div>
      </section>
      <section className="fcard prev" aria-label="날짜별 분량">
        <div className="wz-lab"><b>날짜별로</b><small>숫자 = 그날 {task.unit} 수</small></div>
        <div className="wz-cal-h">{ORDER.map((d) => <small key={d}>{DOW[d]}</small>)}</div>
        <div className="wz-month">
          {cells.map((d) => {
            const v = plan[d] ?? 0
            const inR = d >= task.startDate && d <= task.endDate!
            const k = w.days[dow(d)]
            const label = d === today ? '오늘' : String(Number(d.slice(8)))
            if (d === examDate) return <button key={d} className="mc ex" onClick={() => go(4)}><small>{label}</small><b>시험</b></button>
            if (!inR) return <span key={d} className="mc out"><small>{label}</small></span>
            if (buf.has(d)) return <button key={d} className="mc hatch" onClick={() => go(4)}><small>{label}</small><small>여유</small></button>
            if (k === 'sp') return <button key={d} className="mc sp" onClick={() => go(4)}><small>{label}</small><small className="rib b">예비</small></button>
            if (!v) return <button key={d} className="mc" onClick={() => go(4)}><small>{label}</small></button>
            return <button key={d} className={`mc v${d === today ? ' now' : ''}`} style={{ background: `color-mix(in srgb, var(--s-m) ${Math.round(8 + Math.min(1, v / (per * 2 || 1)) * 30)}%, var(--sf))` }} onClick={() => go(4)}>
              <small>{label}</small>{ends.has(d) && <i className="rb" aria-label="단원 끝" />}<b>{v}</b></button>
          })}
        </div>
        <div className="wz-lgd">{ends.size > 0 && <span><i className="rb" />단원 끝</span>}<span><i className="sq rib" />예비 · 밀린 것, 없으면 복습</span>{buf.size > 0 && <span><i className="sq hatch" />여유</span>}</div>
      </section>
      <section className="fcard prev" aria-label="책갈피 길">
        <div className="wz-lab"><b>책갈피 길</b><small>주말마다 여기까지</small></div>
        <div className="wz-path">
          {res ? <UnitBar chapters={res.chapters.filter((c) => c.to >= start)} /> : <div className="wz-ubar"><span style={{ flex: 1, background: CH_TONE(0) }} /></div>}
          {shownStops.map(([p, d, pg], i) => {
            const tx = p === 0 ? '0' : p === 1 ? '-100%' : '-50%'
            return <span key={i}><i className={i === 0 ? 'now' : ''} style={{ left: `${p * 100}%` }} /><small className={i === 0 ? 'rib b' : ''} style={{ left: `${p * 100}%`, transform: `translateX(${tx})`, top: 0 }}>{d}</small><small className="b" style={{ left: `${p * 100}%`, transform: `translateX(${tx})`, bottom: 0, color: 'var(--ink)' }}>{pg}</small></span>
          })}
        </div>
        {res && <small>칸 숫자는 단원 번호예요.</small>}
      </section>
      <section className="fcard tight" aria-label="계획 내용">
        {rows.map(([l, v, n]) => <button key={l} className="frow btn" onClick={() => go(n)}><span className="fl">{l}</span><span className="grow ell">{v}</span><Icon name="right" size={16} /></button>)}
        <div className="frow"><span className="fl">복습</span><span className="grow">예비일에 밀린 게 없으면 복습</span></div>
      </section>
    </>
  )
}

// ── 7. 만들었어요 ──
function DoneStep({ s, t, today, again, open }: { s: State; t: Task; today: string; again: () => void; open: () => void }) {
  const plan = futurePlan(t, {}, t.startDate)
  const firstDay = Object.keys(plan).sort().find((d) => plan[d] > 0) ?? t.startDate
  const v = plan[firstDay] ?? 0
  const next = Object.keys(plan).sort().find((d) => d > firstDay && plan[d] > 0)
  const a = t.startPoint ?? 1
  const normal = next ? plan[next] : v
  const on = Math.max(1, Math.min(14, Math.round((14 * v) / Math.max(normal, 1))))
  const mins = Math.max(5, Math.round((v * speedOf(s, t)) / 300) * 5)
  return (
    <>
      <div className="wz-book" aria-hidden="true"><span><i /></span></div>
      <div className="wz-q c"><h2>계획을 만들었어요</h2><p>첫날은 가볍게 시작해요.{next ? ` 그다음부터 하루 ${plan[next]}${t.unit}쯤이에요.` : ''}</p></div>
      <section className="fcard prev">
        <small>{firstDay === today ? '오늘' : mdKo(firstDay)} 할 것{t.notifyTime ? ` · ${clock(Number(t.notifyTime.slice(0, 2)) * 60 + Number(t.notifyTime.slice(3)))}부터` : ''}</small>
        <span className="wz-lab"><b className="wz-today">{a} ~ {a + v - 1}{t.unit}<small> · 약 {mins}분</small></b></span>
        <div className="wz-blocks" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} className={i < on ? 'on' : ''} />)}</div>
        <small>여기까지만 해도 그날은 '했음'이에요.</small>
      </section>
      <section className="fcard tight">
        <button className="frow btn" onClick={open}><span className="grow">계획 한눈에 보기</span><Icon name="right" size={16} /></button>
        <button className="frow btn" onClick={again}><span className="grow"><span style={{ display: 'block' }}>같은 시험으로 하나 더 만들기</span><small>기간·요일·시간은 그대로 가져와요</small></span><Icon name="right" size={16} /></button>
      </section>
    </>
  )
}
