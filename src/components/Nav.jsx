import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isToday, parseISO, isValid } from 'date-fns'
import { useStore } from '../store.js'
import { relDeadline, fmtDate } from '../lib/helpers.js'
import { nextOccurrence } from '../lib/reminderEngine.js'
import { Modal } from './Kit.jsx'

/* ================= Top Bar ================= */
export function TopBar() {
  const s = useStore()
  const [bellOpen, setBellOpen] = useState(false)

  const notifs = useMemo(() => {
    const out = []
    for (const n of s.notes) {
      if (!n.dueDate || ['Completed', 'Archived'].includes(n.status)) continue
      const d = parseISO(n.dueDate)
      if (!isValid(d)) continue
      const days = Math.round((d - new Date()) / 86400000)
      if (days <= 2) out.push({ id: n.id, icon: n.icon || '📝', title: n.title, when: relDeadline(n.dueDate)?.text, tone: days < 0 ? 'overdue' : 'soon', go: () => s.setUi({ detailNoteId: n.id }) })
    }
    for (const r of s.reminders) {
      if (!r.active) continue
      const next = nextOccurrence(r)
      if (next && (next - new Date()) / 86400000 <= 2) out.push({ id: r.id, icon: '⏰', title: r.title, when: format(next, 'd MMM · HH:mm'), tone: 'soon', go: () => s.navigate('reminders') })
    }
    return out.sort((a, b) => (a.tone === 'overdue' ? -1 : 1)).slice(0, 12)
  }, [s.notes, s.reminders]) // eslint-disable-line

  const todayCount = notifs.filter((n) => n.tone === 'overdue').length

  return (
    <header className="topbar glass">
      <button className="icon-btn" title="Toggle sidebar" onClick={() => s.setUi({ sidebarOpen: !s.ui.sidebarOpen })} style={{ display: 'var(--desk, grid)' }}>☰</button>
      <div className="brand" onClick={() => s.navigate('village')}>
        <div className="logo">{s.workspace.avatar || '🏡'}</div>
        <div>
          <b className="ell" style={{ maxWidth: 150 }}>{s.workspace.name}</b>
          <small>{s.workspace.villageName}</small>
        </div>
      </div>

      <button className="search-pill" onClick={() => s.setUi({ searchOpen: true })}>
        <span style={{ fontSize: 14 }}>🔍</span>
        Search notes, areas, documents…
        <span className="kbd" style={{ marginLeft: 'auto' }}>Ctrl K</span>
      </button>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
        {s.settings.gamification && (
          <span className="chip" title="Village progress" style={{ marginRight: 6 }}>
            <span style={{ color: 'var(--ok)' }}>◆</span> {s.xp}
          </span>
        )}
        <button className="btn sm ghost" onClick={() => s.navigate('village')} title="Today">
          Today
        </button>
        <div style={{ position: 'relative' }}>
          <button className={'icon-btn' + (bellOpen ? ' on' : '')} onClick={() => setBellOpen(!bellOpen)} title="Notifications">
            🔔
            {todayCount > 0 && (
              <span style={{ position: 'absolute', top: 5, right: 5, width: 9, height: 9, borderRadius: 9, background: 'var(--bad)', boxShadow: '0 0 8px var(--bad)' }} />
            )}
          </button>
          <AnimatePresence>
            {bellOpen && (
              <motion.div
                className="glass"
                style={{ position: 'absolute', right: -60, top: 44, width: 320, maxHeight: '56vh', overflowY: 'auto', borderRadius: 'var(--r-lg)', padding: 8, zIndex: 50 }}
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              >
                <div style={{ padding: '6px 10px', fontWeight: 800, fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>Needs attention</div>
                {notifs.length === 0 && <div className="muted small" style={{ padding: '10px 10px 16px' }}>Nothing due — the village is at peace. 🌿</div>}
                {notifs.map((n) => (
                  <div key={n.id + n.title} className="sr-item" style={{ borderRadius: 10 }} onClick={() => { setBellOpen(false); n.go() }}>
                    <span className="si">{n.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b className="ell" style={{ display: 'block' }}>{n.title}</b>
                      <span className="sub" style={{ color: n.tone === 'overdue' ? 'var(--bad)' : undefined }}>{n.when}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button className="btn sm primary" onClick={() => s.setUi({ editor: { open: true, noteId: null, defaults: {} } })}>
          <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Add
        </button>
        <button className="icon-btn" title="Settings" onClick={() => s.navigate('settings')}>⚙️</button>
        <button className="icon-btn" title="Profile" onClick={() => s.navigate('settings')} style={{ fontSize: 18 }}>{s.workspace.avatar || '🧑‍🌾'}</button>
      </div>
    </header>
  )
}

/* ================= Sidebar ================= */
const BASE_MENU = [
  { icon: '🏡', label: 'Home', route: 'village' },
  { icon: '📝', label: 'All Notes', route: 'notes' },
  { icon: '⭐', label: 'Important', route: 'important' },
  { icon: '📅', label: 'Calendar', route: 'calendar' },
  { icon: '⏰', label: 'Reminders', route: 'reminders' },
  { icon: '📁', label: 'Categories', route: 'categories' },
  { icon: '🗂️', label: 'Documents', route: 'documents' },
  { icon: '📊', label: 'Overview', route: 'overview' },
  { icon: '⚙️', label: 'Settings', route: 'settings' },
]

export function Sidebar() {
  const s = useStore()
  const collapsed = !s.ui.sidebarOpen
  const [menuModal, setMenuModal] = useState(false)
  const [nm, setNm] = useState({ label: '', icon: '🔗', route: 'notes' })
  const active = s.ui.route.name

  const item = (icon, label, onClick, isActive, onRemove, key) => (
    <div key={key ?? label} className={'nav-item' + (isActive ? ' active' : '')} onClick={onClick} title={label}>
      <span className="ni">{icon}</span>
      <span className="nt ell" style={{ flex: 1 }}>{label}</span>
      {!collapsed && onRemove && (
        <span className="nt" style={{ opacity: .4, fontSize: 11 }} onClick={(e) => { e.stopPropagation(); onRemove() }}>✕</span>
      )}
    </div>
  )

  return (
    <aside className={'sidebar glass' + (collapsed ? ' collapsed' : '')}>
      {BASE_MENU.slice(0, 2).map((m) => item(m.icon, m.label, () => s.navigate(m.route), active === m.route, null, m.route))}
      <div className="side-label">Life areas</div>
      {s.categories.map((c) =>
        item(c.icon, c.name, () => s.navigate('category', { catId: c.id }), active === 'category' && s.ui.route.params.catId === c.id, null, c.id),
      )}
      {!collapsed && s.categories.length === 0 && (
        <div className="nav-item" onClick={() => s.setUi({ catEditor: { open: true, catId: null } })} style={{ color: 'var(--accent)' }}>
          <span className="ni">＋</span><span className="nt">Create first area</span>
        </div>
      )}
      <div style={{ height: 8 }} />
      {BASE_MENU.slice(2, 8).map((m) => item(m.icon, m.label, () => s.navigate(m.route), active === m.route, null, m.route))}
      {s.customMenus.map((m) => item(m.icon, m.label, () => s.navigate(m.route, m.params), active === m.route, () => s.removeMenu(m.id), m.id))}
      {BASE_MENU.slice(8).map((m) => item(m.icon, m.label, () => s.navigate(m.route), active === m.route, null, m.route))}
      <div className="side-foot">
        {!collapsed ? (
          <button className="btn sm block ghost" onClick={() => setMenuModal(true)}>＋ Custom menu</button>
        ) : (
          <div style={{ textAlign: 'center' }}>{item('＋', 'Menu', () => setMenuModal(true), false)}</div>
        )}
        <div style={{ textAlign: 'center', paddingTop: 10 }}>
          <button className="icon-btn" onClick={() => s.setUi({ sidebarOpen: !s.ui.sidebarOpen })} title="Collapse">{collapsed ? '»' : '«'}</button>
        </div>
      </div>

      <Modal open={menuModal} onClose={() => setMenuModal(false)}>
        <div className="modal-head"><b>Add a custom menu</b></div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label className="field"><span className="lbl">Icon</span>
            <input value={nm.icon} maxLength={4} onChange={(e) => setNm({ ...nm, icon: e.target.value })} style={{ width: 70 }} />
          </label>
          <label className="field"><span className="lbl">Label</span>
            <input value={nm.label} onChange={(e) => setNm({ ...nm, label: e.target.value })} placeholder="e.g. Journal" />
          </label>
          <label className="field"><span className="lbl">Goes to</span>
            <select value={nm.route} onChange={(e) => setNm({ ...nm, route: e.target.value })}>
              {['notes', 'important', 'calendar', 'reminders', 'documents', 'overview'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={() => setMenuModal(false)}>Cancel</button>
          <button className="btn primary" disabled={!nm.label.trim()} onClick={() => { s.addMenu(nm); setMenuModal(false); setNm({ label: '', icon: '🔗', route: 'notes' }) }}>Add menu</button>
        </div>
      </Modal>
    </aside>
  )
}

/* ================= Bottom navigation (mobile) ================= */
export function BottomNav() {
  const s = useStore()
  const active = s.ui.route.name
  const tabs = [
    { icon: '🏡', label: 'Village', route: 'village' },
    { icon: '📝', label: 'Notes', route: 'notes' },
    { icon: '📅', label: 'Plan', route: 'calendar' },
    { icon: '📊', label: 'Stats', route: 'overview' },
    { icon: '⚙️', label: 'More', route: 'settings' },
  ]
  return (
    <nav className="bottom-nav glass">
      {tabs.map((t) => (
        <button key={t.route} className={'bn' + (active === t.route ? ' active' : '')} onClick={() => s.navigate(t.route)}>
          {t.icon}<small>{t.label}</small>
        </button>
      ))}
      <button className="bn" style={{ color: 'var(--accent)' }} onClick={() => s.setUi({ quickAddOpen: true })}>
        ＋<small>Add</small>
      </button>
    </nav>
  )
}
