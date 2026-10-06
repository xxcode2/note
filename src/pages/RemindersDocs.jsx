import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, isValid } from 'date-fns'
import { useStore, allAttachments } from '../store.js'
import { Empty, Modal, Seg } from '../components/Kit.jsx'
import { occLabel, nextOccurrence } from '../lib/reminderEngine.js'
import { fmtDate } from '../lib/helpers.js'

/* ==================== Reminders ==================== */
export function RemindersPage() {
  const s = useStore()
  const [editing, setEditing] = useState(null) // reminder object being edited (or blank new)
  const blank = { title: '', note: '', repeat: 'none', when: new Date().toISOString().slice(0, 10), time: '09:00', dayOfWeek: 1, dateOfMonth: 1, active: true }

  const rows = useMemo(() => s.reminders.map((r) => ({ r, next: nextOccurrence(r) })), [s.reminders])

  const save = () => {
    if (!editing.title.trim()) return
    const data = {
      title: editing.title.trim(), note: editing.note, repeat: editing.repeat,
      time: editing.time || null,
      when: editing.repeat === 'none' ? new Date(editing.when + 'T' + (editing.time || '09:00')).toISOString() : null,
      dayOfWeek: Number(editing.dayOfWeek), dateOfMonth: Number(editing.dateOfMonth),
    }
    if (editing.id) s.updateReminder(editing.id, data)
    else s.addReminder(data)
    setEditing(null)
    s.toast('⏰ Reminder saved', { type: 'ok' })
  }

  return (
    <div className="pad">
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">⏰ Reminders</h1>
          <p className="page-sub">One-time or recurring. The village will notify you when it’s due.</p>
        </div>
        <button className="btn primary" style={{ marginLeft: 'auto' }} onClick={() => setEditing(blank)}>＋ New reminder</button>
      </div>

      {s.reminders.length === 0 ? (
        <Empty emoji="🔔" title="No reminders yet" text="“Every Monday”, “on day 1 of the month”, “3 days before a deadline” — your call."
          action={<button className="btn primary" onClick={() => setEditing(blank)}>＋ Create the first one</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
          {rows.map(({ r, next }) => (
            <motion.div layout key={r.id} className="note-card" style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'default' }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <span className={'switch' + (r.active ? ' on' : '')} style={{ transform: 'scale(.9)' }} onClick={() => s.updateReminder(r.id, { active: !r.active })}><i /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 14, opacity: r.active ? 1 : 0.5 }}>{r.title}</b>
                {r.note && <div className="muted small ell">{r.note}</div>}
              </div>
              <span className="chip" dot={next ? 'var(--warn)' : 'var(--ink-2)'}>{occLabel(r)}</span>
              <div style={{ textAlign: 'right', minWidth: 120 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>{next ? format(next, 'EEE, d MMM') : '—'}</div>
                <div className="muted small">{next ? format(next, 'HH:mm') : r.active ? 'no upcoming' : 'paused'}</div>
              </div>
              <button className="icon-btn" onClick={() => setEditing({ ...blank, ...r, when: r.when ? r.when.slice(0, 10) : blank.when })}>✎</button>
              <button className="icon-btn" onClick={() => s.deleteReminder(r.id)}>🗑</button>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <>
            <div className="modal-head"><b>{editing.id ? 'Edit reminder' : '⏰ New reminder'}</b>
              <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={() => setEditing(null)}>✕</button></div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input placeholder="Remind me to…" autoFocus value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              <input placeholder="Extra note (optional)" value={editing.note || ''} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
              <Seg options={['none', 'daily', 'weekly', 'monthly']} value={editing.repeat} onChange={(repeat) => setEditing({ ...editing, repeat })} labels={['One time', 'Every day', 'Every week', 'Every month']} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {editing.repeat === 'none' && <label className="field"><span className="lbl">Date</span>
                  <input type="date" value={editing.when} onChange={(e) => setEditing({ ...editing, when: e.target.value })} /></label>}
                {(editing.repeat === 'none' || editing.repeat !== 'daily') && (
                  <label className="field"><span className="lbl">Time</span>
                    <input type="time" value={editing.time} onChange={(e) => setEditing({ ...editing, time: e.target.value })} /></label>)}
                {editing.repeat === 'weekly' && <label className="field"><span className="lbl">Day</span>
                  <select value={editing.dayOfWeek} onChange={(e) => setEditing({ ...editing, dayOfWeek: e.target.value })}>
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select></label>}
                {editing.repeat === 'monthly' && <label className="field"><span className="lbl">Day of month</span>
                  <input type="number" min="1" max="31" value={editing.dateOfMonth} onChange={(e) => setEditing({ ...editing, dateOfMonth: e.target.value })} /></label>}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn primary" onClick={save} disabled={!editing.title.trim()}>Save</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

/* ==================== Document vault ==================== */
export function DocumentsPage() {
  const s = useStore()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const docs = allAttachments(s.notes)
    .filter((d) => (kind === 'all' || d.kind === kind))
    .filter((d) => (d.name + d.noteTitle).toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="pad">
      <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">🗂️ Document Vault</h1>
          <p className="page-sub">Every file attached to a note, gathered in one vault.</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input style={{ width: 220 }} placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Seg options={['all', 'pdf', 'image', 'document', 'other']} value={kind} onChange={setKind} labels={['All', 'PDF', 'Images', 'Docs', 'Other']} />
          <button className="btn primary" onClick={() => s.setUi({ editor: { open: true, noteId: null, defaults: {} } })}>＋ Upload via note</button>
        </div>
      </div>

      {docs.length === 0 ? (
        <Empty emoji="📄" title="The vault is empty" text="Attach files (KK, KTP, BPJS scans…) to any note and they appear here automatically." />
      ) : (
        <div className="grid docs" style={{ marginTop: 22 }}>
          <AnimatePresence>
            {docs.map((d) => (
              <motion.div key={d.id} layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="doc-card" onClick={() => s.setUi({ docPreview: d })}>
                <div className="doc-thumb">
                  {d.type?.startsWith('image/') ? <img src={d.dataUrl} alt={d.name} /> : d.type === 'pdf' ? '📄' : '🗁'}
                </div>
                <div className="doc-body">
                  <b className="ell">{d.name}</b>
                  <span className="muted small">{d.kind.toUpperCase()} · from {d.noteTitle}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* global preview modal */}
      <Modal open={!!s.ui.docPreview} onClose={() => s.setUi({ docPreview: null })} wide>
        {s.ui.docPreview && (() => {
          const d = s.ui.docPreview
          const note = s.notes.find((n) => n.id === d.noteId)
          const cat = s.categories.find((c) => c.id === d.categoryId)
          const doRename = () => {
            const name = prompt('Rename document', d.name)
            if (!name || !note) return
            s.updateNote(note.id, { attachments: note.attachments.map((a) => (a.id === d.id ? { ...a, name } : a)) })
            s.setUi({ docPreview: { ...d, name } })
          }
          const doDelete = () => {
            if (!confirm('Delete this document?') || !note) return
            s.updateNote(note.id, { attachments: note.attachments.filter((a) => a.id !== d.id) })
            s.setUi({ docPreview: null })
          }
          return (
            <>
              <div className="modal-head" style={{ paddingTop: 20 }}>
                <b style={{ flex: 1 }} className="ell">{d.name}</b>
                <button className="icon-btn" onClick={() => s.setUi({ docPreview: null })}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-2)', minHeight: 220, display: 'grid', placeItems: 'center' }}>
                  {d.type?.startsWith('image/')
                    ? <img src={d.dataUrl} alt={d.name} style={{ maxWidth: '100%', maxHeight: '52vh', objectFit: 'contain' }} />
                    : d.type === 'pdf'
                      ? <iframe title={d.name} src={d.dataUrl} style={{ width: '100%', height: '52vh', border: 0 }} />
                      : <div className="muted" style={{ padding: 60, fontSize: 40 }}>🗁</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  {cat && <span className="chip">{cat.icon} {cat.name}</span>}
                  <span className="chip">📝 {d.noteTitle}</span>
                  {d.createdAt && <span className="chip">🗓 {fmtDate(d.createdAt)}</span>}
                  {note && note.tags.slice(0, 3).map((t) => <span className="tag" key={t}>#{t}</span>)}
                </div>
              </div>
              <div className="modal-actions">
                <a className="btn ghost" href={d.dataUrl} download={d.name}>⬇ Download</a>
                <button className="btn ghost" onClick={doRename}>✎ Rename</button>
                <button className="btn ghost" onClick={() => { s.setUi({ docPreview: null }); s.setUi({ detailNoteId: d.noteId }) }}>Open note</button>
                <button className="btn danger" onClick={doDelete}>🗑 Delete</button>
              </div>
            </>
          )
        })()}
      </Modal>
    </div>
  )
}
