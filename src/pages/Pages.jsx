import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store.js'
import NoteCard from '../components/NoteCard.jsx'
import { Empty, Chip } from '../components/Kit.jsx'
import { colorOf, STATUS_DOT, STATUSES } from '../lib/helpers.js'

/* ==================== All Notes / Important ==================== */
export function AllNotes({ importantOnly }) {
  const s = useStore()
  const [cat, setCat] = useState('all')
  const [st, setSt] = useState('all')
  let notes = [...s.notes]
  if (importantOnly) notes = notes.filter((n) => n.important)
  if (cat !== 'all') notes = notes.filter((n) => (cat === 'none' ? !n.categoryId : n.categoryId === cat))
  if (st !== 'all') notes = notes.filter((n) => n.status === st)
  notes = notes.filter((n) => !['Archived'].includes(n.status) || st === 'Archived')
  notes.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updatedAt) - new Date(a.updatedAt))

  return (
    <div className="pad">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">{importantOnly ? '⭐ Important' : '📝 All Notes'}</h1>
          <p className="page-sub">{importantOnly ? 'The things that deserve your focus.' : 'Everything across every building of your village.'}</p>
        </div>
        <button className="btn primary" style={{ marginLeft: 'auto' }} onClick={() => s.setUi({ editor: { open: true, noteId: null, defaults: {} } })}>＋ New note</button>
      </div>

      {/* area rail — drop targets */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', margin: '18px 0 6px' }}>
        <span className={'chip pick' + (cat === 'all' ? ' sel' : '')} onClick={() => setCat('all')}>All areas</span>
        {s.categories.map((c) => (
          <span
            key={c.id}
            className={'chip pick drop-zone' + (cat === c.id ? ' sel' : '')}
            onClick={() => setCat(c.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { const id = e.dataTransfer.getData('text/note'); if (id) { s.moveNoteToCategory(id, c.id); s.toast(`📥 Moved into ${c.icon} ${c.name}`, { type: 'ok' }) } }}
          >
            {c.icon} {c.name}
          </span>
        ))}
        <span className={'chip pick' + (cat === 'none' ? ' sel' : '')} onClick={() => setCat('none')}>🗃 Unassigned</span>
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', margin: '6px 0 16px' }}>
        <span className={'chip pick' + (st === 'all' ? ' sel' : '')} onClick={() => setSt('all')}>Any status</span>
        {STATUSES.map((x) => (
          <span key={x} className={'chip pick' + (st === x ? ' sel' : '')} onClick={() => setSt(st === x ? 'all' : x)}>
            <i className="dot" style={{ background: STATUS_DOT[x] }} />{x}
          </span>
        ))}
      </div>

      {notes.length === 0
        ? <Empty emoji="🍃" title="No notes here" text={importantOnly ? 'Star a note to make it important.' : 'Nothing matches this filter — or your village is still quiet.'}
            action={<button className="btn primary" onClick={() => s.setUi({ editor: { open: true, noteId: null, defaults: {} } })}>＋ Write your first note</button>} />
        : (
          <div className="grid notes">
            <AnimatePresence>
              {notes.map((n) => <NoteCard key={n.id} note={n} showArea />)}
            </AnimatePresence>
          </div>
        )}
      {!importantOnly && notes.length > 0 && (
        <p className="muted small" style={{ marginTop: 18, textAlign: 'center' }}>Tip: drag a note onto an area chip above to move it between buildings.</p>
      )}
    </div>
  )
}

/* ==================== Categories overview ==================== */
export function CategoriesPage() {
  const s = useStore()
  return (
    <div className="pad">
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">📁 Categories</h1>
          <p className="page-sub">Every building is an area of your life. Build as many as you need.</p>
        </div>
        <button className="btn primary" style={{ marginLeft: 'auto' }} onClick={() => s.setUi({ catEditor: { open: true, catId: null } })}>＋ Add category</button>
      </div>

      {s.categories.length === 0 ? (
        <Empty emoji="🏗️" title="Your village is empty" text="Start building your personal world — every area of life gets its own place."
          action={<button className="btn primary" onClick={() => s.setUi({ catEditor: { open: true, catId: null } })}>＋ Create first category</button>} />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', marginTop: 22 }}>
          {s.categories.map((c, i) => {
            const notes = s.notes.filter((n) => n.categoryId === c.id)
            const done = notes.filter((n) => n.status === 'Completed').length
            const accent = colorOf(c.color).hex
            return (
              <motion.div
                key={c.id}
                className="note-card"
                style={{ cursor: 'pointer' }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 320, damping: 26 }}
                onClick={() => s.navigate('category', { catId: c.id })}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { const id = e.dataTransfer.getData('text/note'); if (id) s.moveNoteToCategory(id, c.id) }}
              >
                <i className="bar" style={{ background: accent }} />
                <div className="nc-top">
                  <div className="nc-icon" style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)`, fontSize: 19 }}>{c.icon}</div>
                  <div style={{ minWidth: 0 }}><h4>{c.name}</h4><div className="muted" style={{ fontSize: 11 }}>{c.description}</div></div>
                </div>
                <div style={{ marginTop: 12 }} className="prog"><i style={{ width: notes.length ? `${(done / notes.length) * 100}%` : '0%' }} /></div>
                <div className="nc-meta">
                  <Chip>{notes.length} notes</Chip>
                  <Chip dot="#53c99a">{done} done</Chip>
                  <Chip dot={accent}>{notes.filter((n) => n.important).length} ⭐</Chip>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
