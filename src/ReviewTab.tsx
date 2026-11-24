// 진도 탭 · 복습 칸: 오늘 할 복습(떠올리기) · 다가오는 복습 · 계획별 기억 · 살펴볼 단원 · 설정
import { useState } from 'react'
import { Icon } from './Icon.tsx'
import { DOW_KO, dow } from './date.ts'
import { sumDone, type Grade, type Task } from './logic.ts'
import { reviewCap, reviewExam, todayReviews, upcomingReviews, type DueReview } from './progress.ts'
import { gapAfter, GRADE_WORD, ladder, nextDue, recallsOf, STEPS } from './recall.ts'
import { actions, type State } from './store.ts'
import { Sheet } from './ui.tsx'
import { colorOf } from './view.ts'

const md = (iso: string) => { const [, m, d] = iso.split('-'); return `${Number(m)}.${Number(d)}` }
const G3: Grade[] = ['low', 'mid', 'high']
const gapWord = (n: number | null) => (n === null ? '졸업' : n === 1 ? '내일' : `${n}일 뒤`)
const whyOf = (r: DueReview) => (r.lastGrade === 'low' ? '지난번 흐릿' : r.lastGrade === null ? '끝내고 처음' : `${r.days}일 만에`)

/** 사다리 몇 칸째인지 작은 계단 */
const Stairs = ({ step, grad }: { step: number; grad?: boolean }) => (
  <span className="rv-lv" aria-label={grad ? '졸업' : `사다리 ${step + 1}칸`}>{[5, 7, 9, 11, 14].map((h, i) => <i key={i} className={grad || i <= step ? 'f' : ''} style={{ height: h }} />)}</span>
)

/** 떠올리기 세 버튼: 고르면 다음 복습이 언제인지 같이 보인다 */
function Pick3({ c, on, onPick }: { c: NonNullable<Task['chapters']>[number]; on?: Grade; onPick: (g: Grade) => void }) {
  return (
    <div className="rv-g3" role="group" aria-label="떠올려 보니">
      {G3.map((g) => (
        <button key={g} aria-pressed={on === g} className={on === g ? 'on' : ''} onClick={() => onPick(g)} aria-label={`${GRADE_WORD[g]}, 다음 복습 ${gapWord(gapAfter(c, g))}`}>
          <b>{GRADE_WORD[g]}</b><small>{gapWord(gapAfter(c, g))}</small>
        </button>
      ))}
    </div>
  )
}

/** 단원 하나: 사다리 · 떠올리기 기록 · 오늘 떠올려 보기 */
export function RecallSheet({ s, taskId, chapterId, today, onClose }: { s: State; taskId: string; chapterId: string; today: string; onClose: () => void }) {
  const task = s.tasks.find((t) => t.id === taskId)
  const c = task?.chapters?.find((x) => x.id === chapterId)
  if (!task || !c) return null
  const idx = task.chapters!.indexOf(c)
  const l = ladder(c)
  const due = nextDue(c, reviewExam(s, today))
  const log = recallsOf(c).reverse()
  const todayG = c.recalls?.find((r) => r.d === today)?.g
  return (
    <Sheet title={`${idx + 1}단원 ${c.name}`} dot={colorOf(s, task)} sub={`${task.name} · ${c.from}~${c.to}${task.unit}`} onClose={onClose}>
      {!l ? <p className="hint">단원을 끝내면 다음 날부터 떠올리기로 복습해요.</p> : (
        <>
          <div className="rv-next"><span>다음 복습</span><b>{due ? (due <= today ? '오늘' : md(due)) : '졸업'}</b><small>{l.graduated ? '시험 전에 한 번만 다시 나와요' : l.lastGrade === 'low' ? '지난번 흐릿이라 금방 다시 물어요' : `지금 ${STEPS[l.step]}일 간격`}</small></div>
          <div className="rv-lad" aria-hidden="true">
            {[...STEPS.map((d) => `${d}일`), '졸업'].map((t, i) => (
              <span key={t} className={l.graduated ? (i === 5 ? 'cur' : 'on') : i < l.step ? 'on' : i === l.step ? 'cur' : ''}><i style={{ height: 14 + i * 12 }} /><small>{t}</small></span>
            ))}
          </div>
          <div className="entry-q left">책을 덮고 핵심을 떠올려 본 뒤, 펼쳐서 맞춰 보면?</div>
          <Pick3 c={c} on={todayG} onPick={(g) => actions.recall(task.id, c.id, g, today)} />
          {l.lowRun >= 3 && <p className="rv-warn"><b>{l.lowRun}번 연속 흐릿이에요.</b> 떠올리기만으로는 부족할 수 있어요. 이 단원을 한 번 다시 읽고 나서 떠올려 보세요.</p>}
          {log.length > 0 && (
            <>
              <div className="sec-h tight"><h2>떠올리기 기록</h2><small>{log.length}번</small></div>
              <div className="rv-log">{log.map((r) => <div key={r.d}><span>{md(r.d)}</span><b className={`g-${r.g}`}>{GRADE_WORD[r.g]}</b></div>)}</div>
            </>
          )}
        </>
      )}
    </Sheet>
  )
}

/** 오늘 할 복습을 한 단원씩: 덮고 떠올리기 → 세 버튼 */
function ReviewRun({ s, list: start, today, onClose }: { s: State; list: DueReview[]; today: string; onClose: () => void }) {
  // 시작할 때 목록을 붙잡아 둔다 (하나 고를 때마다 오늘 목록이 줄어들기 때문)
  const [list] = useState(start)
  const [i, setI] = useState(0)
  const [got, setGot] = useState<Grade[]>([])
  const r = list[i]
  if (!r) {
    const n = (g: Grade) => got.filter((x) => x === g).length
    return (
      <Sheet title="오늘 복습 끝" onClose={onClose}>
        <div className="rv-done"><b>{got.length}<small>단원 떠올림</small></b><span>잘 {n('high')} · 절반 {n('mid')} · 흐릿 {n('low')}</span></div>
        <p className="hint">흐릿했던 단원은 내일 다시 물어요. 잘 떠오른 단원은 간격이 길어져요.</p>
        <button className="primary" onClick={onClose}>닫기</button>
      </Sheet>
    )
  }
  const c = s.tasks.find((t) => t.id === r.task.id)?.chapters?.find((x) => x.id === r.chapter.id) ?? r.chapter
  const next = () => setI(i + 1)
  return (
    <Sheet title={`복습 ${i + 1} / ${list.length}`} onClose={onClose}>
      <div className="rv-card">
        <small><i className="dot" style={{ background: colorOf(s, r.task) }} />{r.task.name} · {r.index + 1}단원</small>
        <b>{r.chapter.name}</b>
        <small>{r.chapter.from}~{r.chapter.to}{r.task.unit} · {whyOf(r)}</small>
      </div>
      <div className="rv-how">
        <b>책을 덮고 떠올려 보세요</b>
        <ol><li>핵심 개념 세 가지</li><li>중요한 공식이나 그림 하나</li><li>친구에게 설명한다면 첫 문장</li></ol>
        <small>말로 해도, 종이에 써도 돼요. 앱에 적을 건 없어요.</small>
      </div>
      <div className="entry-q left">펼쳐서 맞춰 보면?</div>
      <Pick3 c={c} onPick={(g) => { actions.recall(r.task.id, r.chapter.id, g, today); setGot([...got, g]); next() }} />
      <button className="ghost wide" onClick={next}>건너뛰기 <small>(잘한 걸로 치지 않아요)</small></button>
    </Sheet>
  )
}

export function ReviewView({ s, today }: { s: State; today: string }) {
  const [run, setRun] = useState(false)
  const [open, setOpen] = useState<{ t: string; c: string } | null>(null)
  const tr = todayReviews(s, today)
  const up = upcomingReviews(s, today, 7)
  const maxUp = Math.max(...up.map((x) => x.count), 1)
  const books = s.tasks.filter((t) => !t.archived && !t.roundOf && t.chapters?.some((c) => c.doneDate))
  // 살펴볼 단원: 연속 흐릿, 느낌과 정답률이 다른 문제집 단원
  const watch: { t: Task; c: NonNullable<Task['chapters']>[number]; why: string; pull?: boolean }[] = []
  let grads = 0
  for (const t of books) {
    const recs = Object.values(s.recs[t.id] ?? {})
    const right = recs.reduce((a, r) => a + (r.right ?? 0), 0)
    const wrong = recs.reduce((a, r) => a + (r.wrong ?? 0), 0)
    const lowAcc = t.bookMode === 'workbook' && right + wrong >= 20 && right / (right + wrong) < 0.7
    for (const c of t.chapters ?? []) {
      const l = ladder(c)
      if (!l) continue
      if (l.graduated) grads++
      if (l.lowRun >= 3) watch.push({ t, c, why: `${l.lowRun}번 연속 흐릿 · 다시 읽기 권해요` })
      else if (lowAcc && l.lastGrade === 'high' && !(c.pull && !c.recalls?.some((r) => r.d >= c.pull!))) watch.push({ t, c, why: `떠올리기는 "잘" · 문제 정답 ${right}/${right + wrong}`, pull: true })
    }
  }
  const caps = [15, 30, 45, 60]

  if (!s.settings.reviewOn)
    return (
      <section className="tcard">
        <div className="tc-meta"><b className="big16">떠올리기 복습이 꺼져 있어요</b></div>
        <p className="sm mu">끝낸 단원을 잊을 때쯤 다시 떠올려 보게 해 줘요. 켜면 오늘 탭에 복습 한 줄이 생기고, 복습 시간이 하루 계획에 들어가요.</p>
        <button className="chip dark" onClick={() => actions.setSettings({ reviewOn: true })}>켜기</button>
      </section>
    )

  return (
    <>
      <section className="tcard rv-today">
        <div className="tc-meta"><span className="rv-ic"><Icon name="repeat" size={16} /></span><span>오늘 복습</span></div>
        {tr.list.length ? (
          <div className="rv-big"><b>{tr.list.length}<small>단원</small> {tr.min}<small>분</small></b><button className="chip dark" onClick={() => setRun(true)}>시작</button></div>
        ) : <p className="rv-none">{tr.doneToday ? `오늘 ${tr.doneToday}단원 떠올렸어요. 다 했어요.` : '오늘은 복습할 단원이 없어요.'}</p>}
        {tr.doneToday > 0 && tr.list.length > 0 && <small className="mu">오늘 벌써 {tr.doneToday}단원 했어요</small>}
      </section>

      {tr.list.length > 0 && (
        <section className="tcard tight">
          {tr.list.map((r) => (
            <div key={r.task.id + r.chapter.id} className="rv" role="button" tabIndex={0} onClick={() => setOpen({ t: r.task.id, c: r.chapter.id })} onKeyDown={(e) => e.key === 'Enter' && setOpen({ t: r.task.id, c: r.chapter.id })}>
              <i className="dot" style={{ background: colorOf(s, r.task) }} />
              <span className="grow"><b className="blk ell">{r.chapter.name}</b><small className="blk ell">{r.task.name} · {r.index + 1}단원 · {whyOf(r)}</small></span>
              <Stairs step={r.step} />
              <small className="rv-min">{r.min}분</small>
            </div>
          ))}
        </section>
      )}
      {tr.later.length > 0 && <p className="rv-later">{tr.later.length}단원은 하루 {reviewCap(s, today)}분을 넘어서 <b>내일 이후로 나눠요</b>. 흐릿했던 것부터 먼저 넣었어요.</p>}

      <div className="sec-h"><h2>다가오는 복습</h2><small>7일</small></div>
      <section className="tcard rv-up" aria-label="다가오는 7일 복습 단원 수">
        {up.map((d) => (
          <span key={d.date} className={d.count >= 6 ? 'heavy' : ''}>
            <small className="n">{d.count || ''}</small>
            <i style={{ height: 4 + (d.count / maxUp) * 52 }} />
            <small>{DOW_KO[dow(d.date)]}</small>
          </span>
        ))}
      </section>

      {books.length > 0 && (
        <>
          <div className="sec-h"><h2>계획별 기억</h2><small>끝낸 단원 기준</small></div>
          {books.map((t) => {
            const done = t.chapters!.filter((c) => c.doneDate)
            const cnt = { high: 0, mid: 0, low: 0, none: 0 }
            for (const c of done) cnt[ladder(c)?.lastGrade ?? 'none']++
            const prog = Math.min(1, sumDone(s.recs[t.id] ?? {}) / Math.max(t.amount, 1))
            return (
              <section key={t.id} className="tcard rv-mem">
                <div className="tc-meta"><span className="ell"><i className="dot" style={{ background: colorOf(s, t) }} /> <b>{t.name}</b></span><span>{done.length} / {t.chapters!.length}단원 끝</span></div>
                <div className="rv-bars">
                  <span>진도</span><div className="rv-trk"><i style={{ width: `${prog * 100}%`, background: colorOf(s, t) }} /></div><b>{Math.round(prog * 100)}%</b>
                  <span>기억</span>
                  <div className="rv-trk mem">{(['high', 'mid', 'low', 'none'] as const).map((k) => cnt[k] ? <i key={k} className={`m-${k}`} style={{ flex: cnt[k] }} /> : null)}</div>
                  <b>잘 {cnt.high}/{done.length}</b>
                </div>
              </section>
            )
          })}
          <div className="rv-leg"><span><i className="m-high" />잘</span><span><i className="m-mid" />절반</span><span><i className="m-low" />흐릿</span><span><i className="m-none" />아직 안 떠올림</span></div>
        </>
      )}

      {(watch.length > 0 || grads > 0) && (
        <>
          <div className="sec-h"><h2>살펴볼 단원</h2></div>
          <section className="tcard tight">
            {watch.map((w) => (
              <div key={w.t.id + w.c.id} className="rv" role="button" tabIndex={0} onClick={() => setOpen({ t: w.t.id, c: w.c.id })}>
                <i className="dot" style={{ background: colorOf(s, w.t) }} />
                <span className="grow"><b className="blk ell">{w.c.name}</b><small className="blk ell">{w.why}</small></span>
                {w.pull ? <button className="chip" onClick={(e) => { e.stopPropagation(); actions.pullReview(w.t.id, w.c.id, today) }}>복습에 넣기</button> : <Icon name="right" size={16} />}
              </div>
            ))}
            {grads > 0 && <div className="rv"><span className="grow"><b className="blk">졸업한 단원 {grads}개</b><small className="blk">30일 간격에서도 잘 떠올렸어요 · 시험 전에 한 번만 다시 나와요</small></span></div>}
          </section>
        </>
      )}

      <div className="sec-h"><h2>복습 설정</h2></div>
      <section className="tcard">
        <div className="tc-meta"><span>하루 복습 상한</span><span>넘치면 다음 날로 나눠요</span></div>
        {reviewCap(s, today) > s.settings.reviewCapMin && <small className="mu">시험이 가까워서 지금은 {reviewCap(s, today)}분까지 넣어요</small>}
        <div className="segs" role="group" aria-label="하루 복습 상한">
          {caps.map((m) => <button key={m} aria-pressed={s.settings.reviewCapMin === m} className={s.settings.reviewCapMin === m ? 'on' : ''} onClick={() => actions.setSettings({ reviewCapMin: m })}>{m}분</button>)}
        </div>
        <button className="chip" onClick={() => actions.setSettings({ reviewOn: false })}>떠올리기 복습 끄기</button>
      </section>

      {run && <ReviewRun s={s} list={tr.list} today={today} onClose={() => setRun(false)} />}
      {open && <RecallSheet s={s} taskId={open.t} chapterId={open.c} today={today} onClose={() => setOpen(null)} />}
    </>
  )
}

/** 오늘 탭의 복습 한 줄: 누르면 진도 탭 복습 칸으로 */
export function ReviewLine({ s, today, go }: { s: State; today: string; go: () => void }) {
  const tr = todayReviews(s, today)
  if (!tr.list.length) return null
  const first = tr.list[0]
  return (
    <button className="tcard rv-line" onClick={go}>
      <span className="rv-ic"><Icon name="repeat" size={16} /></span>
      <span className="grow"><b className="blk">복습 {tr.list.length}단원 · {tr.min}분</b><small className="blk ell">{first.chapter.name}{tr.list.length > 1 ? ` 외 ${tr.list.length - 1}개` : ''} · 진도 탭에서</small></span>
      <Icon name="right" size={16} />
    </button>
  )
}

/** 공부를 끝내고 기록할 때 한 번: 오늘 복습할 단원 하나를 떠올려 보기 (하루 한 번, 건너뛰면 복습 칸에 남는다) */
export function EndRecall({ s, today }: { s: State; today: string }) {
  const key = `endRecall:${today}`
  const [pick] = useState(() => {
    if (s.settings.suggested[key]) return null
    const l = todayReviews(s, today).list
    return l.find((r) => r.lastGrade === null) ?? l[0] ?? null
  })
  const [got, setGot] = useState<Grade | null>(null)
  if (!pick) return null
  const c = s.tasks.find((t) => t.id === pick.task.id)?.chapters?.find((x) => x.id === pick.chapter.id) ?? pick.chapter
  const mark = () => actions.setSettings({ suggested: { ...s.settings.suggested, [key]: today } })
  const ago = pick.lastGrade === null ? (pick.days <= 1 ? '어제 끝낸 단원' : `${pick.days}일 전 끝낸 단원`) : '오늘 복습할 단원'
  return (
    <section className="end-recall">
      <small><span className="rv-ic sm"><Icon name="repeat" size={14} /></span>잠깐, {ago}</small>
      <b>{pick.chapter.name}, 책 덮고 핵심 세 가지를 떠올려 보면?</b>
      {got ? <p className="sm mu">{GRADE_WORD[got]}이면 {gapWord(gapAfter({ ...c, recalls: c.recalls?.filter((r) => r.d !== today) }, got))} 다시 물어요.</p> : (
        <>
          <Pick3 c={c} onPick={(g) => { actions.recall(pick.task.id, pick.chapter.id, g, today); mark(); setGot(g) }} />
          <button type="button" className="linkish" onClick={() => { mark(); setGot(null) }}>다음에 (진도 탭 복습 칸에 남아요)</button>
        </>
      )}
    </section>
  )
}
