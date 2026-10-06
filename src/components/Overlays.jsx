import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useStore, allAttachments } from '../store.js'
import { parseQuickAdd } from '../lib/nlp.js'
import { colorOf, fmtDateTime, isLocked } from '../lib/helpers.js'

/* ================= Global search (Ctrl+K) ================= */
export function SearchOverlay() {
  const s = useStore()
  const open = s.ui.searchOpen
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef()

  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 40) } }, [open])

  const results = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return []
    const groups = []
    const catMatch = s.categories.filter((c) => (c.name + ' ' + c.description).toLowerCase().includes(query)).slice(0, 4)
    if (catMatch.length) groups.push({ label: 'Areas', items: catMatch.map((c) => ({ icon: c.icon, title: c.name, sub: `${s.notes.filter((n) => n.categoryId === c.id).length} notes`, go: () => s.navigate('category', { catId: c.id }) })) })
    const noteMatch = s.notes.filter((n) =>
      !isLocked(n, s.notes) &&
      (n.title + ' ' + n.description + ' ' + n.tags.join(' ') + ' ' + n.status).toLowerCase().includes(query),
    ).slice(0, 8)
    if (noteMatch.length) groups.push({ label: 'Notes', items: noteMatch.map((n) => ({ icon: n.icon || '📝', title: n.title, sub: `${n.status} · ${s.categories.find((c) => c.id === n.categoryId)?.name || 'No area'}`, go: () => s.setUi({ detailNoteId: n.id }) })) })
    const docs = allAttachments(s.notes).filter((a) => a.name.toLowerCase().includes(query)).slice(0, 4)
    if (docs.length) groups.push({ label: 'Documents', items: docs.map((d) => ({ icon: '🗂️', title: d.name, sub: `from ${d.noteTitle}`, go: () => s.setUi({ docPreview: d }) })) })
    const rems = s.reminders.filter((r) => r.title.toLowerCase().includes(query)).slice(0, 4)
    if (rems.length) groups.push({ label: 'Reminders', items: rems.map((r) => ({ icon: '⏰', title: r.title, sub: r.when ? fmtDateTime(r.when) : 'recurring', go: () => s.navigate('reminders') })) })
    return groups
  }, [q, s]) // eslint-disable-line

  const flat = results.flatMap((g) => g.items)

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((v) => Math.min(v + 1, flat.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((v) => Math.max(v - 1, 0)) }
    else if (e.key === 'Enter' && flat[sel]) { flat[sel].go(); s.setUi({ searchOpen: false }) }
    else if (e.key === 'Escape') s.setUi({ searchOpen: false })
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="search-pop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && s.setUi({ searchOpen: false })}>
          <motion.div
            className="search-box glass"
            initial={{ opacity: 0, y: -18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <input ref={inputRef} className="big" placeholder="Search everything…  (title, tag, status, document)" value={q} onChange={(e) => { setQ(e.target.value); setSel(0) }} onKeyDown={onKey} />
            <div className="search-results">
              {!q && <div style={{ padding: '18px 20px' }} className="muted small">Type to search across notes, areas, documents and reminders.</div>}
              {q && flat.length === 0 && <div style={{ padding: '18px 20px' }} className="muted small">No results for “{q}”.</div>}
              {results.map((g) => (
                <div key={g.label}>
                  <div className="sr-group">{g.label}</div>
                  {g.items.map((it) => {
                    const i = flat.indexOf(it)
                    return (
                      <div key={it.title + i} className={'sr-item' + (i === sel ? ' sel' : '')} onMouseEnter={() => setSel(i)} onClick={() => { it.go(); s.setUi({ searchOpen: false }) }}>
                        <span className="si">{it.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}><b className="ell" style={{ display: 'block' }}>{it.title}</b><span className="sub">{it.sub}</span></div>
                        {i === sel && <span className="kbd">↵</span>}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            <div style={{ padding: '9px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }} className="muted small">
              <span><span className="kbd">↑↓</span> navigate</span><span><span className="kbd">↵</span> open</span><span><span className="kbd">esc</span> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ================= Quick add (Ctrl+N) ================= */
export function QuickAdd() {
  const s = useStore()
  const open = s.ui.quickAddOpen
  const [text, setText] = useState('')
  const parsed = useMemo(() => parseQuickAdd(text, s.categories), [text, s.categories])
  const [override, setOverride] = useState({})
  useEffect(() => { if (open) { setText(''); setOverride({}) } }, [open])
  const eff = { ...parsed, ...override }

  const save = () => {
    if (!eff.title.trim()) return
    s.addNote({
      title: eff.title.trim(), categoryId: eff.categoryId, dueDate: eff.dueDate,
      priority: eff.priority || undefined, tags: eff.tags, status: 'Inbox',
    })
    s.setUi({ quickAddOpen: false })
    s.toast('📝 Added to your village', { type: 'ok' })
  }

  const cat = s.categories.find((c) => c.id === eff.categoryId)
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="overlay" style={{ alignItems: 'flex-start', paddingTop: '16vh' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && s.setUi({ quickAddOpen: false })}>
          <motion.div className="modal" style={{ width: 'min(560px, 94%)' }}
            initial={{ opacity: 0, y: -14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
            <div className="modal-body">
              <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-2)', marginBottom: 8 }}>⚡ Quick add</div>
              <input
                autoFocus className="big" style={{ border: 0, padding: '6px 0 12px', fontSize: 18, fontWeight: 600 }}
                placeholder="Besok jam 10 urus BPJS #kesehatan"
                value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && save()}
              />
              {text.trim() && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
                  <span className="chip"><b>{eff.title || '…'}</b></span>
                  {eff.dueDate && <span className="chip" dot="#f5a524">🗓 {fmtDateTime(eff.dueDate)}</span>}
                  {cat && <span className="chip" dot={colorOf(cat.color).hex}>{cat.icon} {cat.name}</span>}
                  {eff.priority && <span className="chip" dot="#f2789f">⚡ {eff.priority}</span>}
                  {eff.tags.map((t) => <span className="tag" key={t}>#{t}</span>)}
                  <button className="btn sm ghost" onClick={() => { s.setUi({ quickAddOpen: false }); s.setUi({ editor: { open: true, noteId: null, defaults: { title: eff.title, dueDate: eff.dueDate, categoryId: eff.categoryId, tags: eff.tags } } }) }}>Refine ↗</button>
                </motion.div>
              )}
              <div className="muted small" style={{ marginTop: 12 }}>Understood automatically — press <span className="kbd">↵</span> to save as-is.</div>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => s.setUi({ quickAddOpen: false })}>Cancel</button>
              <button className="btn primary" onClick={save} disabled={!eff.title.trim()}>Save note</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
