import React from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store.js'
import { colorOf, STATUS_DOT, relDeadline, richIcon } from '../lib/helpers.js'
import IconBadge from './IconBadge.jsx'

export default function NoteCard({ note, showArea, style }) {
  const s = useStore()
  const cat = s.categories.find((c) => c.id === note.categoryId)
  const accent = note.color ? colorOf(note.color).hex : cat ? colorOf(cat.color).hex : 'var(--ink-2)'
  const icon = richIcon({ ...note, categories: s.categories })
  const rel = relDeadline(note.dueDate)
  const done = note.status === 'Completed'
  const checked = note.checklist.filter((c) => c.done).length

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/note', note.id); e.dataTransfer.effectAllowed = 'move' }}
      onDrop={(e) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/note')
        if (id && id !== note.id) {
          const ids = s.notes.map((n) => n.id).filter((x) => x !== id)
          const at = ids.indexOf(note.id)
          ids.splice(at, 0, id)
          s.reorderNotes(ids)
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      style={style}
    >
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={'note-card' + (done ? ' done' : '')}
      onClick={() => s.setUi({ detailNoteId: note.id })}
    >
      <i className="bar" style={{ background: accent }} />
      {note.important && <span className="star">⭐</span>}
      <div className="nc-top">
        <IconBadge icon={icon} accent={accent === 'var(--ink-2)' ? '#8fa3bf' : accent} size={42} complete={done} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h4 className="ell">{note.title}</h4>
          <div className="muted" style={{ fontSize: 11, fontWeight: 600 }}>{STATUS_DOT[note.status] && <i className="dot" style={{ width: 7, height: 7, borderRadius: 9, display: 'inline-block', background: STATUS_DOT[note.status], marginRight: 5, verticalAlign: 'middle' }} />}{note.status}</div>
        </div>
      </div>
      {note.description && <div className="nc-desc clamp2">{note.description}</div>}
      <div className="nc-meta">
        {rel && !done && <span className="chip" dot={rel.tone === 'overdue' ? 'var(--bad)' : rel.tone === 'soon' ? 'var(--warn)' : 'var(--ink-2)'} style={rel.tone === 'overdue' ? { color: 'var(--bad)' } : undefined}>🗓 {rel.text}</span>}
        {note.priority === 'High' && <span className="chip" dot="#f5a524">High</span>}
        {note.priority === 'Critical' && <span className="chip" dot="#f2789f" style={{ color: '#f2789f' }}>Critical</span>}
        {note.checklist.length > 0 && <span className="chip">☑ {checked}/{note.checklist.length}</span>}
        {note.attachments.length > 0 && <span className="chip">📎 {note.attachments.length}</span>}
        {showArea && cat && <span className="chip" dot={colorOf(cat.color).hex}>{cat.icon} {cat.name}</span>}
        {note.tags.slice(0, 2).map((t) => <span className="tag" key={t}>#{t}</span>)}
      </div>
    </motion.div>
    </div>
  )
}
