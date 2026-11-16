import { useState } from 'react'
import { fmtDate, todayISO } from './date.ts'
import { actions, deletePhoto, savePhoto, uid, useStore, type Diary as DiaryT } from './store.ts'
import { Field, Photo, Sheet } from './ui.tsx'

export interface Draft { diary?: DiaryT; date: string; taskId: string | null }

/** 사진은 긴 변 1280px JPEG로 줄여서 저장한다 */
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b ?? file), 'image/jpeg', 0.85))
  } catch {
    return file
  }
}

export function DiaryForm({ draft, onClose }: { draft: Draft; onClose: () => void }) {
  const s = useStore()
  const [date, setDate] = useState(draft.diary?.date ?? draft.date)
  const [taskId, setTaskId] = useState(draft.diary?.taskId ?? draft.taskId ?? '')
  const [body, setBody] = useState(draft.diary?.body ?? '')
  const [photoIds, setPhotoIds] = useState(draft.diary?.photoIds ?? [])
  const [busy, setBusy] = useState(false)

  const addPhotos = async (files: FileList | null) => {
    if (!files) return
    setBusy(true)
    const ids: string[] = []
    for (const f of Array.from(files)) ids.push(await savePhoto(await shrink(f)))
    setPhotoIds((p) => [...p, ...ids])
    setBusy(false)
  }
  const save = () => {
    const kept = new Set(photoIds)
    draft.diary?.photoIds.filter((p) => !kept.has(p)).forEach((p) => void deletePhoto(p))
    actions.saveDiary({ id: draft.diary?.id ?? uid(), date, taskId: taskId || null, body: body.trim(), photoIds, timestamp: draft.diary?.timestamp ?? Date.now() })
    onClose()
  }
  return (
    <Sheet title={draft.diary ? '공부일기 수정' : '공부일기 쓰기'} onClose={onClose}>
      <div className="row">
        <Field label="날짜"><input type="date" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
        <Field label="계획">
          <select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
            <option value="">하루 전체</option>
            {s.tasks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
      </div>
      <Field label="내용">
        <textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="오늘의 이야기를 들려주세요!" />
      </Field>
      <div className="photos">
        {photoIds.map((id) => (
          <div key={id} className="photo-wrap">
            <Photo id={id} />
            <button onClick={() => setPhotoIds(photoIds.filter((p) => p !== id))} aria-label="사진 빼기">✕</button>
          </div>
        ))}
        <label className="photo add">
          {busy ? '…' : '+ 사진'}
          <input type="file" accept="image/*" multiple hidden onChange={(e) => { void addPhotos(e.target.files); e.target.value = '' }} />
        </label>
      </div>
      <button className="primary" disabled={busy || (!body.trim() && photoIds.length === 0)} onClick={save}>저장하기</button>
    </Sheet>
  )
}

export function DiaryPage({ open }: { open: (d: Draft) => void }) {
  const s = useStore()
  const [viewer, setViewer] = useState<string | null>(null)
  const list = [...s.diaries].sort((a, b) => (a.date === b.date ? b.timestamp - a.timestamp : a.date < b.date ? 1 : -1))
  return (
    <div className="page">
      <header className="top"><span /><h1>공부일기</h1><span /></header>
      {list.length === 0 && <p className="empty">아직 일기가 없습니다.{'\n'}오늘 하루를 돌아보며 한 줄 남겨보세요.</p>}
      {list.map((d, i) => {
        const task = s.tasks.find((t) => t.id === d.taskId)
        return (
          <article className="diary" key={d.id}>
            {(i === 0 || list[i - 1].date !== d.date) && <h3>{fmtDate(d.date)}</h3>}
            <div className="card col">
              {task && <span className="tag">{task.name}</span>}
              {d.body && <p>{d.body}</p>}
              {d.photoIds.length > 0 && <div className="photos">{d.photoIds.map((p) => <Photo key={p} id={p} onClick={() => setViewer(p)} />)}</div>}
              <div className="diary-actions">
                <button className="link" onClick={() => open({ diary: d, date: d.date, taskId: d.taskId })}>수정</button>
                <button className="link danger" onClick={() => confirm('이 일기를 삭제할까요?') && actions.deleteDiary(d.id)}>삭제</button>
              </div>
            </div>
          </article>
        )
      })}
      <button className="fab" onClick={() => open({ date: todayISO(), taskId: null })} aria-label="일기 쓰기">✎</button>
      {viewer && <div className="viewer" onClick={() => setViewer(null)}><Photo id={viewer} /></div>}
    </div>
  )
}
