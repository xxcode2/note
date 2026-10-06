import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, isValid } from 'date-fns'
import { useStore } from '../store.js'
import { Modal, Seg, ColorSwatches, EmojiPick } from './Kit.jsx'
import { STATUSES, STATUS_DOT, PRIORITIES, PRIORITY_META, ICON_CHOICES, colorOf, fmtDateTime, uid, fileToDataUrl, relDeadline } from '../lib/helpers.js'

const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = parseISO(iso)
  if (!isValid(d)) return ''
  return format(d, "yyyy-MM-dd'T'HH:mm")
}
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null)

/* ==================== Note editor (create / edit) ==================== */
export function NoteEditor() {
  const s = useStore()
  const { open, noteId, defaults } = s.ui.editor
  const existing = useMemo(() => s.notes.find((n) => n.id === noteId), [s.notes, noteId])
  const [f, setF] = useState({})
  const set = (patch) => setF((v) => ({ ...v, ...patch }))

  useEffect(() => {
    if (!open) return
    setF(
      existing
        ? { ...existing, tagsText: existing.tags.join(' ') }
        : {
            title: defaults.title || '', description: defaults.description || '',
            categoryId: defaults.categoryId ?? s.settings.defaultCategory ?? s.categories[0]?.id ?? null,
            tagsText: (defaults.tags || []).join(' '), status: s.settings.defaultStatus,
            priority: defaults.priority || s.settings.defaultPriority, dueDate: defaults.dueDate || null,
            icon: '📝', color: null, important: false, checklist: defaults.checklist || [],
            attachments: defaults.attachments || [], remind: false,
          },
    )
  }, [open, noteId]) // eslint-disable-line

  const save = () => {
    if (!f.title?.trim()) return
    const tags = (f.tagsText || '').split(/[,\s]+/).map((t) => t.replace(/^#/, '').toLowerCase()).filter(Boolean)
    const data = { ...f, title: f.title.trim(), tags }
    delete data.tagsText
    if (noteId) s.updateNote(noteId, data)
    else {
      const id = s.addNote(data)
      if (f.remind && f.dueDate) s.addReminder({ title: `Deal with: ${data.title}`, when: f.dueDate, repeat: 'none', time: f.dueDate.slice(11, 16) })
    }
    s.setUi({ editor: { open: false, noteId: null, defaults: {} } })
    s.toast(noteId ? 'Note updated' : '📝 Note created', { type: 'ok' })
  }

  const onFiles = async (e) => {
    const files = [...e.target.files]
    const atts = []
    for (const file of files) {
      if (file.size > 4 * 1048576) { s.toast(`${file.name} too large (max 4MB)`, { type: 'notify' }); continue }
      atts.push({ id: uid(), name: file.name, type: file.type, size: file.size, dataUrl: await fileToDataUrl(file), createdAt: new Date().toISOString() })
    }
    if (atts.length) set({ attachments: [...(f.attachments || []), ...atts] })
  }

  return (
    <Modal open={open} onClose={() => s.setUi({ editor: { open: false, noteId: null, defaults: {} } })} wide>
      <div className="modal-head">
        <input value={f.icon || '📝'} readOnly style={{ width: 52, textAlign: 'center', fontSize: 18 }} />
        <input style={{ border: 0, background: 'transparent', fontSize: 19, fontWeight: 800, flex: 1, padding: '6px 0' }} placeholder="Note title… (Ctrl+Enter to save)" value={f.title || ''} onChange={(e) => set({ title: e.target.value })} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') save() }} autoFocus />
        <button className="icon-btn" onClick={() => s.setUi({ editor: { open: false, noteId: null, defaults: {} } })}>✕</button>
      </div>
      <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <textarea placeholder="What is this about? Details, next steps, links…" value={f.description || ''} onChange={(e) => set({ description: e.target.value })} rows={3} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <label className="field"><span className="lbl">Area</span>
            <select value={f.categoryId || ''} onChange={(e) => set({ categoryId: e.target.value || null })}>
              <option value="">— No area —</option>
              {s.categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </label>
          <label className="field"><span className="lbl">Deadline</span>
            <input type="datetime-local" value={toLocalInput(f.dueDate)} onChange={(e) => set({ dueDate: fromLocalInput(e.target.value) })} />
          </label>
          <label className="field"><span className="lbl">Tags (space separated)</span>
            <input placeholder="dokumen kk penting" value={f.tagsText || ''} onChange={(e) => set({ tagsText: e.target.value })} />
          </label>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
          <div>
            <div className="lbl muted small" style={{ marginBottom: 5, fontWeight: 700 }}>Status</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUSES.map((st) => (
                <span key={st} className={'chip pick' + (f.status === st ? ' sel' : '')} onClick={() => set({ status: st })}>
                  <i className="dot" style={{ background: STATUS_DOT[st] }} />{st}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="lbl muted small" style={{ marginBottom: 5, fontWeight: 700 }}>Priority</div>
            <Seg options={PRIORITIES} value={f.priority || 'Medium'} onChange={(p) => set({ priority: p })} />
          </div>
          <span className={'chip pick' + (f.important ? ' sel' : '')} onClick={() => set({ important: !f.important })}>⭐ Important</span>
          {!noteId && f.dueDate && <span className={'chip pick' + (f.remind ? ' sel' : '')} onClick={() => set({ remind: !f.remind })}>⏰ Remind me</span>}
        </div>

        {/* checklist */}
        <div>
          <div className="lbl muted small" style={{ marginBottom: 6, fontWeight: 700 }}>Checklist</div>
          {(f.checklist || []).map((it) => (
            <div key={it.id} className="check" onClick={() => set({ checklist: f.checklist.map((x) => x.id === it.id ? { ...x, done: !x.done } : x) })}>
              <span className={'box' } style={it.done ? { background: 'var(--ok)', borderColor: 'var(--ok)' } : {}}>{it.done ? '✓' : ''}</span>
              <span className={'txt' + (it.done ? ' checked' : '')} style={{ textDecoration: it.done ? 'line-through' : 'none', color: it.done ? 'var(--ink-2)' : undefined }}>{it.text}</span>
              <button className="icon-btn" style={{ width: 26, height: 26, fontSize: 11, marginLeft: 'auto' }} onClick={(e) => { e.stopPropagation(); set({ checklist: f.checklist.filter((x) => x.id !== it.id) }) }}>✕</button>
            </div>
          ))}
          <CheckAdd onAdd={(t) => set({ checklist: [...(f.checklist || []), { id: uid(), text: t, done: false }] })} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div>
            <div className="lbl muted small" style={{ marginBottom: 6, fontWeight: 700 }}>Icon</div>
            <EmojiPick options={ICON_CHOICES} value={f.icon} onChange={(icon) => set({ icon })} />
          </div>
          <div>
            <div className="lbl muted small" style={{ marginBottom: 6, fontWeight: 700 }}>Accent color (optional)</div>
            <ColorSwatches value={f.color} onChange={(color) => set({ color: color === f.color ? null : color })} />
          </div>
        </div>

        {/* attachments */}
        <div>
          <div className="lbl muted small" style={{ marginBottom: 6, fontWeight: 700 }}>Attachments</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {(f.attachments || []).map((a) => (
              <span key={a.id} className="chip">📎 {a.name.slice(0, 22)} <button style={{ marginLeft: 4, opacity: .6 }} onClick={() => set({ attachments: f.attachments.filter((x) => x.id !== a.id) })}>✕</button></span>
            ))}
            <label className="btn sm ghost" style={{ cursor: 'pointer' }}>
              ＋ Upload file
              <input type="file" multiple hidden onChange={onFiles} />
            </label>
          </div>
        </div>
      </div>
      <div className="modal-actions">
        {noteId && f.remind === undefined && null}
        <button className="btn ghost" onClick={() => s.setUi({ editor: { open: false, noteId: null, defaults: {} } })}>Cancel</button>
        <button className="btn primary" onClick={save} disabled={!f.title?.trim()}>{noteId ? 'Save changes' : 'Create note'}</button>
      </div>
    </Modal>
  )
}

function CheckAdd({ onAdd }) {
  const [v, setV] = useState('')
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
      <input placeholder="Add a step and press ↵" value={v} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && v.trim()) { onAdd(v.trim()); setV('') } }} />
    </div>
  )
}

/* ==================== Note detail (immersive) ==================== */
export function NoteDetail() {
  const s = useStore()
  const note = s.notes.find((n) => n.id === s.ui.detailNoteId)
  const cat = note ? s.categories.find((c) => c.id === note.categoryId) : null
  const accent = note ? (note.color ? colorOf(note.color).hex : cat ? colorOf(cat.color).hex : 'var(--ink-2)') : '#888'
  const rel = note ? relDeadline(note.dueDate) : null

  const completeWithFx = () => {
    if (!note) return
    s.completeNote(note.id)
  }

  return (
    <Modal open={!!note} onClose={() => s.setUi({ detailNoteId: null })} wide>
      {note && (
        <>
          <div className="modal-head" style={{ paddingTop: 22 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 22, background: `color-mix(in srgb, ${accent} 18%, transparent)`, border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)` }}>{note.icon || cat?.icon || '📝'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: accent === 'var(--ink-2)' ? 'var(--ink-2)' : accent }}>
                {cat ? `${cat.icon} ${cat.name}` : 'Unassigned'}
              </div>
              <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{note.title}</h2>
            </div>
            <button className="icon-btn" title={note.important ? 'Unstar' : 'Star'} onClick={() => s.toggleImportant(note.id)} style={note.important ? { color: 'var(--warn)' } : { opacity: .5 }}>⭐</button>
            <button className="icon-btn" onClick={() => s.setUi({ detailNoteId: null })}>✕</button>
          </div>

          <div className="modal-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              <Seg options={STATUSES} value={note.status} onChange={(st) => {
                if (st === 'Completed' && note.status !== 'Completed') completeWithFx()
                else s.updateNote(note.id, { status: st })
              }} labels={STATUSES.map((x) => ({ Inbox: 'Inbox', 'In Progress': 'Doing' }[x] || x))} />
              <span className="chip" dot={PRIORITY_META[note.priority]?.color}>⚡ {note.priority}</span>
              {note.dueDate && (
                <span className="chip" dot={rel?.tone === 'overdue' ? 'var(--bad)' : 'var(--warn)'} style={rel?.tone === 'overdue' ? { color: 'var(--bad)' } : undefined}>
                  🗓 {fmtDateTime(note.dueDate)} · {rel?.text}
                </span>
              )}
              {note.tags.map((t) => <span className="tag" key={t}>#{t}</span>)}
            </div>

            {note.description && <p style={{ color: 'var(--ink-1)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{note.description}</p>}

            {note.checklist.length > 0 && (() => {
              const done = note.checklist.filter((c) => c.done).length
              return (
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <b className="small">Checklist</b><span className="muted small">{done}/{note.checklist.length}</span>
                  </div>
                  <div className="prog" style={{ marginBottom: 10 }}><i style={{ width: `${(done / note.checklist.length) * 100}%` }} /></div>
                  {note.checklist.map((it) => (
                    <div key={it.id} className={'check' + (it.done ? ' on' : '')} onClick={() => s.toggleCheck(note.id, it.id)}>
                      <span className="box">{it.done && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 16 }}>✓</motion.span>}</span>
                      <span className="txt">{it.text}</span>
                    </div>
                  ))}
                </div>
              )
            })()}

            {note.attachments.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <b className="small">Attachments</b>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {note.attachments.map((a) => (
                    <span key={a.id} className="chip pick" onClick={() => s.setUi({ detailNoteId: null, docPreview: { ...a, noteId: note.id, categoryId: note.categoryId, noteTitle: note.title } })}>
                      {a.type?.startsWith('image') ? '🖼️' : '📄'} {a.name.slice(0, 26)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="muted small" style={{ marginTop: 18 }}>
              Created {fmtDateTime(note.createdAt)} · Updated {fmtDateTime(note.updatedAt)}
            </div>
          </div>

          <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {note.status !== 'Completed' && (
                <button className="btn primary" onClick={completeWithFx}>✓ Complete</button>
              )}
              <AnimatePresence>
                {note.status === 'Completed' && (
                  <motion.div initial={{ scale: 0 }}>
                    <span className="chip" dot="var(--ok)" style={{ padding: '9px 14px', fontWeight: 800, color: 'var(--ok)' }}>Completed 🎉</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn ghost" onClick={() => { s.setUi({ detailNoteId: null, editor: { open: true, noteId: note.id, defaults: {} } }) }}>✎ Edit</button>
              <button className="btn ghost" onClick={() => s.duplicateNote(note.id)}>⧉ Duplicate</button>
              <button className="btn ghost" onClick={() => { s.updateNote(note.id, { status: 'Archived' }); s.setUi({ detailNoteId: null }) }}>🗄 Archive</button>
              <button className="btn danger" onClick={() => { if (confirm('Delete this note for good?')) { s.deleteNote(note.id); s.setUi({ detailNoteId: null }) } }}>🗑 Delete</button>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}
