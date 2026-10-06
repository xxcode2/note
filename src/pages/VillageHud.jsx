import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { isToday, parseISO, isValid } from 'date-fns'
import { useStore } from '../store.js'
import { greetingFor, fmtDate, colorOf, relDeadline, isLocked } from '../lib/helpers.js'
import { resetPlayer } from '../village/playerState.js'

/* ============ The "Today" dock shown over the village ============ */
export function TodayDock() {
  const s = useStore()
  const [collapsed, setCollapsed] = React.useState(false)
  const active = s.notes.filter((n) => !['Completed', 'Archived'].includes(n.status) && !isLocked(n, s.notes))
  const today = active.filter((n) => n.dueDate && isToday(parseISO(n.dueDate)))
  const upcoming = active
    .filter((n) => n.dueDate && parseISO(n.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4)
  const pinned = s.notes.filter((n) => n.pinned && !['Completed'].includes(n.status)).slice(0, 3)

  return (
    <motion.div
      className="today-dock glass"
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30, delay: 0.5 }}
    >
      {collapsed ? (
        <button className="btn sm ghost" style={{ border: 'none', background: 'transparent' }} onClick={() => setCollapsed(false)}>
          {greetingFor()} 👋 <span className="muted small">· show today</span>
        </button>
      ) : (
      <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: '-0.01em' }}>
            {greetingFor()} 👋
          </div>
          <div className="muted small">{s.workspace.greeting}</div>
        </div>
        <button className="btn sm primary" onClick={() => s.setUi({ quickAddOpen: true })}>⚡ Quick add</button>
        <button className="icon-btn" title="Collapse" onClick={() => setCollapsed(true)}>▾</button>
      </div>

      <div style={{ height: 10 }} />
      <div className="side-label" style={{ padding: '10px 0 4px' }}>Today’s tasks {today.length > 0 && <span className="chip" style={{ marginLeft: 6 }}>{today.length}</span>}</div>
      {today.length === 0 && upcoming.length === 0 && (
        <div className="muted small" style={{ padding: '6px 0 10px' }}>Nothing due today. A quiet day in the village 🌿</div>
      )}
      <AnimatePresence initial={false}>
        {today.slice(0, 5).map((n) => (
          <motion.div
            key={n.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.94 }}
            className="check" onClick={() => s.setUi({ detailNoteId: n.id })}
          >
            <span
              className="box"
              onClick={(e) => { e.stopPropagation(); s.completeNote(n.id) }}
              style={{ cursor: 'pointer' }}
            />
            <span className="txt ell" style={{ flex: 1 }}>{n.icon || '📝'} {n.title}</span>
            {n.important && <span style={{ fontSize: 11 }}>⭐</span>}
          </motion.div>
        ))}
      </AnimatePresence>

      {(upcoming.length > 0 || pinned.length > 0) && (
        <>
          <hr className="hair" style={{ margin: '10px 0' }} />
          <div className="side-label" style={{ padding: '0 0 6px' }}>Upcoming</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {upcoming.map((n) => (
              <span key={n.id} className="chip pick" onClick={() => s.setUi({ detailNoteId: n.id })}
                title={n.title}>
                <b className="ell" style={{ maxWidth: 110 }}>{n.icon || '📝'} {n.title}</b>
                <span className="muted">{relDeadline(n.dueDate)?.text}</span>
              </span>
            ))}
            {pinned.map((n) => (
              <span key={n.id} className="chip pick" onClick={() => s.setUi({ detailNoteId: n.id })} dot="var(--warn)">📌 {n.title.slice(0, 18)}</span>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button className="btn sm ghost" onClick={() => s.navigate('notes')}>All notes →</button>
        <button className="btn sm ghost" onClick={() => s.navigate('calendar')}>📅 Calendar</button>
        <button className="btn sm ghost" onClick={() => s.navigate('overview')}>📊 Overview</button>
      </div>
      </>
      )}
    </motion.div>
  )
}

/* ============ Floating tools on the right of the village ============ */
export function VillageTools() {
  const s = useStore()
  const editing = s.ui.editingVillage
  const walking = s.ui.walkMode
  const focus = s.ui.focusCatId
  const startWalk = () => {
    resetPlayer(0, 8)
    s.navigate('village')
    s.setUi({ walkMode: true, editingVillage: false, nearCatId: null })
    s.toast('🚶 You step into the village — walk up to a building and go inside', { type: 'ok', ttl: 3600 })
  }
  const cycleEnv = () => {
    const order = ['day', 'sunset', 'night']
    const next = order[(order.indexOf(s.settings.environment) + 1) % 3]
    // manual pick pins the sky — stop following the real clock
    s.updateSettings({ environment: next, autoEnv: false })
    s.toast(`${next === 'day' ? '☀️' : next === 'sunset' ? '🌇' : '🌙'} Suasana manual — otomatis jam nyata dimatikan`, { type: 'notify', ttl: 2600 })
  }
  return (
    <motion.div
      className="village-tools"
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7, type: 'spring', stiffness: 300, damping: 26 }}
    >
      {focus && <button className="btn sm glass" onClick={() => s.navigate('village')}>↩ Village</button>}
      {!walking && <button className="btn sm glass" onClick={startWalk} title="Walk around as yourself">🚶 Jelajah</button>}
      <button className={'btn sm ' + (editing ? 'primary' : 'glass')} onClick={() => s.setUi({ editingVillage: !editing })}>
        {editing ? '✓ Done editing' : '🏗 Edit village'}
      </button>
      <button className="btn sm glass" onClick={() => s.setUi({ catEditor: { open: true, catId: null } })}>＋ Area</button>
      <button className="btn sm glass" onClick={cycleEnv} title="Day / sunset / night">
        {s.settings.environment === 'day' ? '☀️' : s.settings.environment === 'sunset' ? '🌇' : '🌙'}
      </button>
    </motion.div>
  )
}

/* ============ Empty village guidance ============ */
export function EmptyVillage() {
  const s = useStore()
  return (
    <motion.div
      className="today-dock glass" style={{ width: 420, alignSelf: 'center', marginBottom: 40 }}
      initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.4 }}
    >
      <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 6 }}>🌾</div>
      <h3 style={{ textAlign: 'center', fontSize: 18, fontWeight: 800 }}>Your village is empty</h3>
      <p className="muted" style={{ textAlign: 'center', fontSize: 13, margin: '8px 0 16px' }}>
        Start building your personal world. Every area of your life — documents, health, work, money — becomes a place you can visit.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={() => s.setUi({ catEditor: { open: true, catId: null } })}>＋ Create first category</button>
        <button className="btn ghost" onClick={() => s.loadDemo()}>Explore a sample village</button>
      </div>
    </motion.div>
  )
}
