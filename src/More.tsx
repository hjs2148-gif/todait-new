import { useState } from 'react'
import { diffDays, fmtDate, todayISO } from './date.ts'
import { isFinished, sumDone, type Task } from './logic.ts'
import { notifySupported, requestNotify } from './notify.ts'
import { actions, COLORS, exportBackup, importBackup, resetAll, uid, useStore, type Category, type DDay } from './store.ts'
import { Field, Sheet } from './ui.tsx'

function CategorySheet({ cat, onClose }: { cat: Category | null; onClose: () => void }) {
  const s = useStore()
  const [name, setName] = useState(cat?.name ?? '')
  const [color, setColor] = useState(cat?.color ?? COLORS[0])
  const dup = s.categories.some((c) => c.name === name.trim() && c.id !== cat?.id)
  return (
    <Sheet title={cat ? '카테고리 수정' : '새로운 카테고리'} onClose={onClose}>
      <Field label="이름"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="카테고리 이름" autoFocus /></Field>
      <div className="colors">
        {COLORS.map((c) => <button key={c} className={c === color ? 'on' : ''} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />)}
      </div>
      {dup && <p className="error">이미 존재하는 카테고리 이름입니다</p>}
      <button className="primary" disabled={!name.trim() || dup} onClick={() => { actions.saveCategory({ id: cat?.id ?? uid(), name: name.trim(), color }); onClose() }}>저장하기</button>
      {cat && <button className="ghost danger" onClick={() => { if (confirm('카테고리를 삭제할까요? 계획은 남습니다.')) { actions.deleteCategory(cat.id); onClose() } }}>삭제하기</button>}
    </Sheet>
  )
}

function DDaySheet({ dday, onClose }: { dday: DDay | null; onClose: () => void }) {
  const s = useStore()
  const [name, setName] = useState(dday?.name ?? '')
  const [date, setDate] = useState(dday?.date ?? todayISO())
  return (
    <Sheet title={dday ? 'D-day 수정' : '새로운 D-day 추가'} onClose={onClose}>
      <Field label="이름"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 수능" autoFocus /></Field>
      <Field label="날짜"><input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
      <button className="primary" disabled={!name.trim()} onClick={() => { actions.saveDDay({ id: dday?.id ?? uid(), name: name.trim(), date, selected: dday?.selected ?? s.ddays.length === 0 }); onClose() }}>저장하기</button>
      {dday && <button className="ghost danger" onClick={() => { actions.deleteDDay(dday.id); onClose() }}>삭제하기</button>}
    </Sheet>
  )
}

export function More({ editTask }: { editTask: (t: Task) => void }) {
  const s = useStore()
  const today = todayISO()
  const [cat, setCat] = useState<Category | null | 'new'>(null)
  const [dday, setDday] = useState<DDay | null | 'new'>(null)
  const [msg, setMsg] = useState('')
  const finished = s.tasks.filter((t) => !t.archived && isFinished(t, today))
  const archived = s.tasks.filter((t) => t.archived)
  const perm = notifySupported() ? Notification.permission : 'unsupported'

  const toggleNotify = async () => {
    if (s.settings.notifyOn) return actions.setSettings({ notifyOn: false })
    if (await requestNotify()) actions.setSettings({ notifyOn: true })
    else setMsg('알림 권한이 꺼져 있습니다. 브라우저 설정에서 이 사이트의 알림을 허용해주세요.')
  }
  const download = async () => {
    const url = URL.createObjectURL(new Blob([await exportBackup()], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `todait-backup-${today}.json`
    a.click()
    URL.revokeObjectURL(url)
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
  const taskRow = (t: Task, extra: string) => (
    <div className="list-row" key={t.id}>
      <div onClick={() => editTask(t)}><strong>{t.name}</strong><small>{extra}</small></div>
      {t.archived
        ? <button className="chip" onClick={() => actions.patchTask(t.id, { archived: false })}>복구</button>
        : t.completed && <button className="chip" onClick={() => actions.patchTask(t.id, { completed: false, completedDate: null })}>되돌리기</button>}
      <button className="chip danger" onClick={() => confirm(`'${t.name}' 계획과 기록을 영구 삭제할까요?`) && actions.deleteTask(t.id)}>삭제</button>
    </div>
  )

  return (
    <div className="page">
      <header className="top"><span /><h1>더보기</h1><span /></header>
      {msg && <p className="preview" onClick={() => setMsg('')}>{msg}</p>}

      <section>
        <h3>D-day <em onClick={() => setDday('new')}>+ 추가</em></h3>
        {s.ddays.length === 0 && <p className="empty">선택된 D-day가 없습니다</p>}
        {s.ddays.map((d) => {
          const n = diffDays(today, d.date)
          return (
            <div className="list-row" key={d.id}>
              <input type="radio" checked={d.selected} onChange={() => actions.saveDDay({ ...d, selected: true })} aria-label="메인에 표시" />
              <div onClick={() => setDday(d)}><strong>{d.name}</strong><small>{fmtDate(d.date)}</small></div>
              <b>{n === 0 ? 'D-DAY' : n > 0 ? `D-${n}` : `D+${-n}`}</b>
            </div>
          )
        })}
      </section>

      <section>
        <h3>카테고리 <em onClick={() => setCat('new')}>+ 추가</em></h3>
        {s.categories.map((c) => (
          <div className="list-row" key={c.id} onClick={() => setCat(c)}>
            <i className="dot" style={{ background: c.color }} />
            <div><strong>{c.name}</strong></div>
            <small>{s.tasks.filter((t) => t.categoryId === c.id).length}개</small>
          </div>
        ))}
      </section>

      <section>
        <h3>알림</h3>
        <div className="list-row">
          <div><strong>알림 받기</strong><small>{perm === 'unsupported' ? '이 브라우저는 알림을 지원하지 않습니다' : '앱이 열려 있거나 백그라운드에 있을 때 울립니다'}</small></div>
          <input type="checkbox" className="switch" checked={s.settings.notifyOn} disabled={perm === 'unsupported'} onChange={() => void toggleNotify()} />
        </div>
        <div className="list-row">
          <div><strong>오늘 계획 알림 시각</strong><small>남은 계획과 D-day를 알려줍니다</small></div>
          <input type="time" value={s.settings.dailyNotifyTime ?? ''} onChange={(e) => actions.setSettings({ dailyNotifyTime: e.target.value || null })} />
        </div>
      </section>

      <section>
        <h3>완료한 계획 <span>{finished.length}</span></h3>
        {finished.map((t) => taskRow(t, t.type === 'amount' ? `${sumDone(s.recs[t.id] ?? {})} / ${t.amount}${t.unit}` : '기간 종료'))}
      </section>
      <section>
        <h3>계획 보관함 <span>{archived.length}</span></h3>
        {archived.map((t) => taskRow(t, '보관됨'))}
      </section>

      <section>
        <h3>데이터</h3>
        <p className="hint">모든 데이터는 이 기기의 브라우저에만 저장됩니다. 브라우저 데이터를 지우면 함께 사라지니 가끔 백업해두세요.</p>
        <div className="menu">
          <button onClick={() => void download()}>백업 파일 내보내기</button>
          <label className="menu-btn">백업 파일 불러오기<input type="file" accept="application/json,.json" hidden onChange={(e) => { void restore(e.target.files?.[0]); e.target.value = '' }} /></label>
          <button className="danger" onClick={() => confirm('모든 계획·기록·일기를 지웁니다. 되돌릴 수 없습니다. 계속할까요?') && void resetAll()}>데이터 초기화</button>
        </div>
      </section>

      {cat && <CategorySheet cat={cat === 'new' ? null : cat} onClose={() => setCat(null)} />}
      {dday && <DDaySheet dday={dday === 'new' ? null : dday} onClose={() => setDday(null)} />}
    </div>
  )
}
