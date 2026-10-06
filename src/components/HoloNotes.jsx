import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store.js'
import { colorOf, richIcon, relDeadline, STATUS_DOT, isLocked } from '../lib/helpers.js'
import IconBadge from './IconBadge.jsx'

/* Immersive 3D "inside the building" stage — notes become floating,
   mouse-tilting dimensional plaques instead of a flat list. */
export default function HoloNotes({ catId }) {
  const s = useStore()
  const cat = s.categories.find((c) => c.id === catId)
  if (!cat) return null
  const accent = colorOf(cat.color).hex
  const all = s.notes.filter((n) => n.categoryId === catId)
  const lockedCount = all.filter((n) => isLocked(n, s.notes)).length
  const notes = all
    .filter((n) => !isLocked(n, s.notes))
    .sort((a, b) => (a.status === 'Completed') - (b.status === 'Completed'))
  const stats = {
    total: notes.length,
    imp: notes.filter((n) => n.important).length,
    pending: notes.filter((n) => !['Completed', 'Archived'].includes(n.status)).length,
    done: notes.filter((n) => n.status === 'Completed').length,
  }

  return (
    <motion.div
      className="holo-stage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="holo-head">
        <IconBadge icon={cat.icon} accent={accent} size={46} float />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="holo-title">{cat.name}</h2>
          {cat.description && <div className="muted small ell">{cat.description}</div>}
        </div>
        <div className="holo-stats">
          <span><b>{stats.total}</b><small>notes</small></span>
          <span><b>{stats.pending}</b><small>to do</small></span>
          <span><b>{stats.done}</b><small>done</small></span>
          <span><b>{stats.imp}</b><small>⭐</small></span>
        </div>
        <button className="btn sm primary" onClick={() => s.setUi({ editor: { open: true, noteId: null, defaults: { categoryId: catId } } })}>＋ Note</button>
        <button className="icon-btn" title="Renovate / delete this area" onClick={() => s.setUi({ catEditor: { open: true, catId } })}>🛠</button>
        <button className="icon-btn" title="Back to village" onClick={() => s.navigate('village')}>↩</button>
      </div>

      {lockedCount > 0 && (
        <div className="muted small" style={{ padding: '0 2px 10px' }}>🔒 {lockedCount} catatan berantai masih terkunci — selesai catatan sebelumnya untuk memunculkannya.</div>
      )}

      {notes.length === 0 ? (
        <div className="holo-empty">
          <div style={{ fontSize: 34 }}>🌱</div>
          <div className="muted">Nothing here yet — plant the first note in <b>{cat.name}</b>.</div>
          <button className="btn primary" onClick={() => s.setUi({ editor: { open: true, noteId: null, defaults: { categoryId: catId } } })}>＋ Create first note</button>
        </div>
      ) : (
        <div className="holo-rail">
          {notes.map((n, i) => <HoloCard key={n.id} note={n} i={i} accent={accent} />)}
        </div>
      )}
    </motion.div>
  )
}

function HoloCard({ note, i, accent }) {
  const s = useStore()
  const ref = useRef()
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const [hover, setHover] = useState(false)
  const cat = s.categories.find((c) => c.id === note.categoryId)
  const icon = richIcon({ ...note, categories: s.categories })
  const rel = relDeadline(note.dueDate)
  const done = note.status === 'Completed'
  const checked = note.checklist.filter((c) => c.done).length

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setTilt({ rx: -py * 14, ry: px * 16 })
  }

  return (
    <motion.div
      layout
      className={'holo-card' + (done ? ' done' : '')}
      style={{ '--a': accent }}
      initial={{ opacity: 0, y: 34, rotateX: 22, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24, delay: 0.05 + i * 0.045 }}
    >
      <div
        ref={ref}
        className="hc-body"
        onMouseMove={onMove}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setTilt({ rx: 0, ry: 0 }); setHover(false) }}
        onClick={() => s.setUi({ detailNoteId: note.id })}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(${hover ? 34 : 0}px) scale(${hover ? 1.03 : 1})`,
        }}
      >
        <span className="hc-sheen" style={{ opacity: hover ? 1 : 0.5 }} />
        <div className="hc-top">
          <IconBadge icon={icon} accent={accent} size={46} complete={done} />
          {note.important && <span className="hc-star">⭐</span>}
        </div>
        <h4 className="hc-title">{note.title}</h4>
        {note.description && <p className="hc-desc">{note.description}</p>}
        <div className="hc-meta">
          <span className="hc-status" style={{ '--d': STATUS_DOT[note.status] }}>{note.status}</span>
          {rel && !done && <span className={'hc-due' + (rel.tone === 'overdue' ? ' bad' : rel.tone === 'soon' ? ' warn' : '')}>🗓 {rel.text}</span>}
          {note.checklist.length > 0 && <span className="hc-chk">☑ {checked}/{note.checklist.length}</span>}
          {note.attachments.length > 0 && <span className="hc-chk">📎 {note.attachments.length}</span>}
        </div>
      </div>
    </motion.div>
  )
}
