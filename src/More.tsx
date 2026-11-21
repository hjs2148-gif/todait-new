import { useEffect, useState, type ReactNode } from 'react'
import { ExamEdit } from './ExamEdit.tsx'
import { Icon } from './Icon.tsx'
import { diffDays, fmtDate, todayISO } from './date.ts'
import { isFinished, type Task } from './logic.ts'
import { notifySupported, requestNotify } from './notify.ts'
import { Plans } from './Plans.tsx'
import { actions, downloadBackup, importBackup, requestPersist, resetAll, SUBJECTS, subjectVar, uid, useStore, type Category, type RestWay } from './store.ts'
import { Field, Sheet } from './ui.tsx'
import { WidgetEdit } from './WidgetEdit.tsx'

function CategorySheet({ cat, onClose }: { cat: Category | null; onClose: () => void }) {
  const s = useStore()
  const [name, setName] = useState(cat?.name ?? '')
  const [color, setColor] = useState(cat?.color ?? SUBJECTS[0].hex)
  const dup = s.categories.some((c) => c.name === name.trim() && c.id !== cat?.id)
  return (
    <Sheet title={cat ? '과목 수정' : '새 과목'} onClose={onClose}>
      <Field label="이름"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="과목 이름" autoFocus /></Field>
      <div className="colors">
        {SUBJECTS.map((c) => <button key={c.key} className={c.hex === color ? 'on' : ''} style={{ background: subjectVar(c.hex) }} onClick={() => setColor(c.hex)} aria-label={c.name} aria-pressed={c.hex === color} />)}
      </div>
      {dup && <p className="error">이미 있는 과목 이름입니다</p>}
      <button className="primary" disabled={!name.trim() || dup} onClick={() => { actions.saveCategory({ id: cat?.id ?? uid(), name: name.trim(), color }); onClose() }}>저장</button>
      {cat && <button className="ghost danger" onClick={() => { if (confirm('과목을 지울까요? 계획은 남습니다.')) { actions.deleteCategory(cat.id); onClose() } }}>지우기</button>}
    </Sheet>
  )
}

function RestSheet({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const today = todayISO()
  const [date, setDate] = useState(today)
  const [way, setWay] = useState<RestWay>('spread')
  const days = Object.entries(s.settings.restDays).sort(([a], [b]) => a.localeCompare(b))
  return (
    <Sheet title="쉬는 날" onClose={onClose}>
      <p className="hint">쉬는 날에는 분량이 없어요. 연속 공부는 끊기지 않아요. 옮긴 분량은 남은 날에 나누거나 다음 날로 넘겨요.</p>
      <div className="two-in big"><input type="date" value={date} min={today} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="쉬는 날" /></div>
      <div className="seg" role="radiogroup" aria-label="옮기는 방법">
        <button role="radio" aria-checked={way === 'spread'} className={way === 'spread' ? 'on' : ''} onClick={() => setWay('spread')}>남은 날에 나누기</button>
        <button role="radio" aria-checked={way === 'tomorrow'} className={way === 'tomorrow' ? 'on' : ''} onClick={() => setWay('tomorrow')}>내일로</button>
      </div>
      <button className="primary" onClick={() => actions.setRestDay(date, way)}>쉬는 날로 정하기</button>
      {days.length > 0 && (
        <div className="menu">
          {days.map(([d, w]) => (
            <div key={d} className="list-row"><div><strong>{fmtDate(d)}</strong><small>{w === 'spread' ? '남은 날에 나눔' : '내일로 옮김'}</small></div><button className="chip" onClick={() => actions.setRestDay(d, null)}>취소</button></div>
          ))}
        </div>
      )}
    </Sheet>
  )
}

function StreakSheet({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const min = Math.round(s.settings.streakMinSec / 60)
  return (
    <Sheet title="연속 공부 기준" onClose={onClose}>
      <p className="hint">하루에 이만큼 이상 공부하면 연속 공부가 이어져요.</p>
      <div className="chips">
        {[5, 10, 20, 30, 60].map((m) => <button key={m} aria-pressed={m === min} className={m === min ? 'on' : ''} onClick={() => { actions.setSettings({ streakMinSec: m * 60 }); onClose() }}>{m}분</button>)}
      </div>
    </Sheet>
  )
}

const Item = ({ label, value, onClick, children }: { label: string; value?: ReactNode; onClick?: () => void; children?: ReactNode }) => (
  <div className={`mrow${onClick ? ' tap' : ''}`} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} onClick={onClick} onKeyDown={(e) => onClick && e.key === 'Enter' && onClick()}>
    <span className="grow"><b className="blk">{label}</b>{children && <small className="blk mu">{children}</small>}</span>
    {value !== undefined && <span className="mv">{value}</span>}
    {onClick && <Icon name="right" size={16} />}
  </div>
)

type Page = 'plans' | 'widgets' | 'rest' | 'streak' | null

export function More({ editTask, openDiary }: { editTask: (t: Task) => void; openDiary: () => void }) {
  const s = useStore()
  const today = todayISO()
  const [page, setPage] = useState<Page>(null)
  const [cat, setCat] = useState<Category | null | 'new'>(null)
  const [exam, setExam] = useState<string | 'new' | null>(null)
  const [msg, setMsg] = useState('')
  const [persisted, setPersisted] = useState<boolean | null | undefined>(undefined)
  useEffect(() => { void requestPersist().then(setPersisted) }, [])
  const perm = notifySupported() ? Notification.permission : 'unsupported'
  const active = s.tasks.filter((t) => !t.archived && !isFinished(t, today)).length
  const done = s.tasks.filter((t) => !t.archived && isFinished(t, today)).length
  const selected = s.exams.find((e) => e.selected) ?? s.exams[0]
  const lastBackup = s.settings.lastBackupAt ? new Date(s.settings.lastBackupAt) : null

  const toggleNotify = async () => {
    if (s.settings.notifyOn) return actions.setSettings({ notifyOn: false })
    if (await requestNotify()) actions.setSettings({ notifyOn: true })
    else setMsg('알림 권한이 꺼져 있습니다. 브라우저 설정에서 이 사이트의 알림을 허용해주세요.')
  }
  const download = async () => {
    await downloadBackup()
    setMsg('백업 파일을 저장했어요. 다운로드 폴더를 확인하세요.')
  }
  const restore = async (file: File | undefined) => {
    if (!file || !confirm('지금 데이터를 백업 파일 내용으로 바꿉니다. 계속할까요?')) return
    try {
      await importBackup(await file.text())
      setMsg('백업을 불러왔습니다.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '백업 파일을 읽지 못했습니다.')
    }
  }
  const restN = Object.keys(s.settings.restDays).length

  return (
    <div className="page today">
      <header className="th"><h1>더보기</h1></header>
      <div className="tbody">
        {msg && <p className="preview" role="status" onClick={() => setMsg('')}>{msg}</p>}
        <section className="tcard tight" aria-label="계획">
          <Item label="계획 관리" value={`${active}개`} onClick={() => setPage('plans')} />
          <Item label="끝낸 계획" value={`${done}개`} onClick={() => setPage('plans')} />
          <Item label="시험과 D-day" value={selected ? `${selected.name} ${selected.date.slice(5).replace('-', '.')}` : '없음'} onClick={() => setExam(selected?.id ?? 'new')} />
          <Item label="오늘 위젯 편집" value={`${s.settings.widgets.length}개`} onClick={() => setPage('widgets')} />
          <Item label="과목과 색" value={`${s.categories.length}개`} onClick={() => setCat('new')}>새 과목 추가</Item>
          <Item label="쉬는 날" value={restN ? `${restN}일` : '없음'} onClick={() => setPage('rest')} />
          <Item label="연속 공부 기준" value={`하루 ${Math.round(s.settings.streakMinSec / 60)}분 이상`} onClick={() => setPage('streak')} />
        </section>

        {s.exams.length > 1 && (
          <section className="tcard tight" aria-label="시험 목록">
            {s.exams.map((e) => {
              const n = diffDays(today, e.date)
              return <Item key={e.id} label={e.name} value={n === 0 ? 'D-DAY' : n > 0 ? `D-${n}` : `D+${-n}`} onClick={() => setExam(e.id)} />
            })}
          </section>
        )}
        {s.categories.length > 0 && (
          <section className="tcard tight" aria-label="과목">
            {s.categories.map((c) => (
              <div key={c.id} className="mrow tap" role="button" tabIndex={0} onClick={() => setCat(c)} onKeyDown={(e) => e.key === 'Enter' && setCat(c)}>
                <i className="dot" style={{ background: subjectVar(c.color) }} /><span className="grow"><b>{c.name}</b></span><small className="mu">{s.tasks.filter((t) => t.categoryId === c.id).length}개</small><Icon name="right" size={16} />
              </div>
            ))}
          </section>
        )}

        <section className="tcard" aria-label="화면 모드">
          <div className="tc-meta"><b className="big16">화면 모드</b></div>
          <div className="segs" role="group" aria-label="화면 모드">
            {([['system', '기기 설정'], ['light', '라이트'], ['dark', '다크']] as const).map(([v, l]) => (
              <button key={v} className={s.settings.theme === v ? 'on' : ''} aria-pressed={s.settings.theme === v} onClick={() => actions.setSettings({ theme: v })}>{l}</button>
            ))}
          </div>
        </section>

        <section className="tcard tight" aria-label="알림">
          <div className="mrow"><span className="grow"><b className="blk">남은 공부 알림</b><small className="blk mu">{perm === 'unsupported' ? '이 브라우저는 알림을 지원하지 않아요' : '앱이 열려 있을 때만 울려요'}</small></span>
            <input type="checkbox" className="switch" aria-label="알림 받기" checked={s.settings.notifyOn} disabled={perm === 'unsupported'} onChange={() => void toggleNotify()} /></div>
          <div className="mrow"><span className="grow"><b className="blk">알림 시각</b></span>
            <input type="time" className="tin" value={s.settings.dailyNotifyTime ?? ''} onChange={(e) => actions.setSettings({ dailyNotifyTime: e.target.value || null })} aria-label="알림 시각" /></div>
        </section>

        <section className="tcard tight" aria-label="데이터">
          <Item label="백업 내보내기" value={lastBackup ? `${lastBackup.getMonth() + 1}월 ${lastBackup.getDate()}일` : '아직 안 함'} onClick={() => void download()} />
          <label className="mrow tap"><span className="grow"><b className="blk">백업 불러오기</b></span><Icon name="right" size={16} /><input type="file" accept="application/json,.json" hidden onChange={(e) => { void restore(e.target.files?.[0]); e.target.value = '' }} /></label>
          <Item label="기록 보호" value={persisted === undefined ? '확인 중' : persisted === null ? '알 수 없음' : persisted ? '켜짐' : '꺼짐'}>{persisted ? '브라우저가 이 기록을 함부로 지우지 않아요' : '홈 화면에 추가하고 자주 열면 지워질 가능성이 줄어요. 백업을 꼭 해 두세요'}</Item>
          <Item label="지난 공부일기" onClick={openDiary}>사진과 글은 그대로 남아 있어요</Item>
          <div className="mrow tap" role="button" tabIndex={0} onClick={() => confirm('모든 계획·기록·일기를 지웁니다. 되돌릴 수 없습니다. 계속할까요?') && void resetAll()}><span className="grow"><b className="bad">데이터 초기화</b></span></div>
        </section>
        <p className="fnote">기록은 이 폰 브라우저에만 저장돼요. 브라우저 데이터를 지우기 전에 백업을 내보내 두세요.</p>
      </div>

      {page === 'plans' && <Plans onClose={() => setPage(null)} edit={editTask} />}
      {page === 'widgets' && <WidgetEdit onClose={() => setPage(null)} />}
      {page === 'rest' && <RestSheet onClose={() => setPage(null)} />}
      {page === 'streak' && <StreakSheet onClose={() => setPage(null)} />}
      {cat && <CategorySheet cat={cat === 'new' ? null : cat} onClose={() => setCat(null)} />}
      {exam && <ExamEdit examId={exam === 'new' ? null : exam} onClose={() => setExam(null)} />}
    </div>
  )
}
