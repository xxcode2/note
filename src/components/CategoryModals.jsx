import React, { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store.js'
import { Modal, ColorSwatches, EmojiPick, Empty } from './Kit.jsx'
import { BUILDING_TYPES, EMOJI_CHOICES, colorOf } from '../lib/helpers.js'
import BuildingModel from './Building3DPreview.jsx'
import NoteCard from './NoteCard.jsx'

/* ==================== Category builder modal ==================== */
export function CategoryBuilder() {
  const s = useStore()
  const { open, catId } = s.ui.catEditor
  const existing = useMemo(() => s.categories.find((c) => c.id === catId), [s.categories, catId])
  const [f, setF] = useState({})
  const set = (p) => setF((v) => ({ ...v, ...p }))

  useEffect(() => {
    if (!open) return
    setF(
      existing
        ? { name: existing.name, description: existing.description, icon: existing.icon, color: existing.color, type: existing.building?.type || 'house', light: existing.building?.light || 'warm' }
        : { name: '', description: '', icon: '🌿', color: 'amber', type: 'house', light: 'warm' },
    )
  }, [open, catId]) // eslint-disable-line

  const save = () => {
    if (!f.name.trim()) return
    if (existing) {
      s.updateCategory(existing.id, { name: f.name.trim(), description: f.description, icon: f.icon, color: f.color, building: { type: f.type, light: f.light, color: f.color } })
      s.toast(`${f.icon} ${f.name} renovated`, { type: 'ok' })
    } else {
      s.addCategory({ name: f.name.trim(), description: f.description, icon: f.icon, color: f.color, building: f.type, light: f.light })
    }
    s.setUi({ catEditor: { open: false, catId: null } })
  }
  const palette = colorOf(f.color || 'amber')

  return (
    <Modal open={open} onClose={() => s.setUi({ catEditor: { open: false, catId: null } })} wide>
      <div className="modal-head" style={{ paddingTop: 20 }}>
        <h2 style={{ fontSize: 19, fontWeight: 800 }}>{existing ? 'Renovate area' : '＋ New area of your life'}</h2>
        <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={() => s.setUi({ catEditor: { open: false, catId: null } })}>✕</button>
      </div>
      <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="field"><span className="lbl">Name</span>
            <input autoFocus placeholder="e.g. BPJS, Side Project, Family…" value={f.name || ''} onChange={(e) => set({ name: e.target.value })} />
          </label>
          <label className="field"><span className="lbl">Description</span>
            <input placeholder="What lives in this building?" value={f.description || ''} onChange={(e) => set({ description: e.target.value })} />
          </label>
          <div>
            <div className="lbl muted small" style={{ marginBottom: 6, fontWeight: 700 }}>Icon</div>
            <EmojiPick options={EMOJI_CHOICES} value={f.icon} onChange={(icon) => set({ icon })} />
          </div>
          <div>
            <div className="lbl muted small" style={{ marginBottom: 6, fontWeight: 700 }}>Color</div>
            <ColorSwatches value={f.color} onChange={(color) => set({ color })} />
          </div>
        </div>
        <div>
          <div className="lbl muted small" style={{ marginBottom: 6, fontWeight: 700 }}>Building in the village</div>
          {/* live preview */}
          <div style={{ height: 150, borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', background: 'linear-gradient(170deg, var(--glass-soft), transparent)', display: 'grid', placeItems: 'center', marginBottom: 10, overflow: 'hidden' }}>
            <BuildingModel type={f.type || 'house'} palette={palette} lit={f.light === 'warm'} scale={34} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 190, overflowY: 'auto' }}>
            {BUILDING_TYPES.map((b) => (
              <span key={b.id} className={'chip pick' + (f.type === b.id ? ' sel' : '')} style={{ justifyContent: 'flex-start' }} onClick={() => set({ type: b.id })}>
                {b.icon} {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="modal-actions">
        {existing && (
          <button className="btn danger" style={{ marginRight: 'auto' }} onClick={() => {
            if (confirm(`Remove "${existing.name}" from the village? Its notes will stay, unassigned.`)) {
              s.deleteCategory(existing.id)
              s.setUi({ catEditor: { open: false, catId: null } })
              if (s.ui.route.params?.catId === existing.id) s.navigate('village')
            }
          }}>🗑 Demolish</button>
        )}
        <button className="btn ghost" onClick={() => s.setUi({ catEditor: { open: false, catId: null } })}>Cancel</button>
        <button className="btn primary" onClick={save} disabled={!f.name?.trim()}>{existing ? 'Save' : '🏗 Build area'}</button>
      </div>
    </Modal>
  )
}

/* ==================== Category page (dock / full page) ==================== */
export function CategoryContent({ catId, dock }) {
  const s = useStore()
  const cat = s.categories.find((c) => c.id === catId)
  const [filter, setFilter] = useState('All')
  const notes = s.notes.filter((n) => n.categoryId === catId)
  if (!cat) return <Empty emoji="🌫️" title="This area vanished" text="It may have been demolished." action={<button className="btn" onClick={() => s.navigate('village')}>Back to village</button>} />
  const stats = {
    total: notes.length,
    imp: notes.filter((n) => n.important).length,
    pending: notes.filter((n) => !['Completed', 'Archived'].includes(n.status)).length,
    done: notes.filter((n) => n.status === 'Completed').length,
  }
  const shown = filter === 'All' ? notes : notes.filter((n) => n.important ? filter === 'Important' : filter === 'Active' ? !['Completed', 'Archived'].includes(n.status) : n.status === filter)
  const accent = colorOf(cat.color).hex

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: dock ? '18px 18px 12px' : 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center', fontSize: 22, background: `color-mix(in srgb, ${accent} 16%, transparent)`, border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)` }}>{cat.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em' }}>{cat.name}</h2>
            {cat.description && <div className="muted small ell">{cat.description}</div>}
          </div>
          <button className="icon-btn" title="Renovate area" onClick={() => s.setUi({ catEditor: { open: true, catId } })}>🛠</button>
          {!dock && <button className="icon-btn" onClick={() => s.navigate('village')}>✕</button>}
          {dock && <button className="icon-btn" onClick={() => s.navigate('village')} title="Back to village">↩</button>}
        </div>
        <div style={{ display: 'flex', gap: 14, margin: '13px 0 10px', flexWrap: 'wrap' }}>
          {[['🗒', stats.total, 'Notes'], ['⭐', stats.imp, 'Important'], ['◔', stats.pending, 'Pending'], ['✅', stats.done, 'Completed']].map(([i, v, k]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 15 }}>{i}</span><b style={{ fontSize: 16 }}>{v}</b><span className="muted small">{k}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {['All', 'Active', 'Important', ...['Completed', 'Archived']].map((f) => (
            <span key={f} className={'chip pick' + (filter === f ? ' sel' : '')} onClick={() => setFilter(f)}>{f}</span>
          ))}
          <button className="btn sm primary" style={{ marginLeft: 'auto' }} onClick={() => s.setUi({ editor: { open: true, noteId: null, defaults: { categoryId: catId } } })}>＋ New note</button>
        </div>
      </div>

      <div className={dock ? 'dock-scroll' : ''} style={{ marginTop: dock ? 10 : 16 }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const id = e.dataTransfer.getData('text/note')
          if (id) { s.moveNoteToCategory(id, catId); s.toast('📥 Note moved here', { type: 'ok' }) }
        }}>
        {shown.length === 0
          ? <Empty emoji={cat.icon} title={`Nothing in ${cat.name} yet`} text="Drop a note here or create the first one." action={<button className="btn primary" onClick={() => s.setUi({ editor: { open: true, noteId: null, defaults: { categoryId: catId } } })}>＋ Create first note</button>} />
          : <div className="grid notes" style={{ paddingTop: 4 }}>{shown.map((n) => <NoteCard key={n.id} note={n} />)}</div>}
      </div>
    </div>
  )
}
