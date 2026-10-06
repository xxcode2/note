import React from 'react'
import { motion } from 'framer-motion'
import { isToday, parseISO, isValid } from 'date-fns'
import { useStore } from '../store.js'
import { colorOf, STATUS_DOT, STATUSES, fmtDate } from '../lib/helpers.js'
import NoteCard from '../components/NoteCard.jsx'
import { Empty } from '../components/Kit.jsx'

const levelOf = (xp) => Math.floor(Math.sqrt(xp / 40)) + 1
const levelFloor = (lv) => Math.pow(lv - 1, 2) * 40

export default function Overview() {
  const s = useStore()
  const notes = s.notes
  const done = notes.filter((n) => n.status === 'Completed').length
  const pending = notes.filter((n) => !['Completed', 'Archived'].includes(n.status)).length
  const imp = notes.filter((n) => n.important && n.status !== 'Completed').length
  const todayDue = notes.filter((n) => n.dueDate && !['Completed', 'Archived'].includes(n.status) && isToday(parseISO(n.dueDate))).length
  const upcoming = notes.filter((n) => n.dueDate && n.status !== 'Completed' && isValid(parseISO(n.dueDate)) && parseISO(n.dueDate) > new Date()).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5)
  const base = notes.filter((n) => n.status !== 'Archived').length
  const overall = base ? Math.round((done / base) * 100) : 0
  const lv = levelOf(s.xp)
  const lvProgress = Math.round(((s.xp - levelFloor(lv)) / (levelFloor(lv + 1) - levelFloor(lv))) * 100)

  const tiles = [
    ['🗒', notes.length, 'Total notes'], ['✅', done, 'Completed'], ['◔', pending, 'Open'],
    ['⭐', imp, 'Important'], ['📅', todayDue, 'Due today'], ['🏛', s.categories.length, 'Areas'],
  ]

  return (
    <div className="pad">
      <h1 className="page-title">📊 Overview</h1>
      <p className="page-sub">How life is flowing through your village.</p>

      <div className="grid stats" style={{ marginTop: 20 }}>
        {tiles.map(([i, v, k], idx) => (
          <motion.div key={k} className="stat-tile" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <div className="v">{i} {v}</div>
            <div className="k">{k}</div>
          </motion.div>
        ))}
      </div>

      {s.settings.gamification && (
        <div className="stat-tile" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="v" style={{ color: 'var(--ok)' }}>Lv {lv}</div>
            <div className="k">Village progress</div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div className="prog"><i style={{ width: `${Math.min(100, Math.max(4, lvProgress))}%` }} /></div>
            <div className="muted small" style={{ marginTop: 5 }}>{s.xp} total progress points · next level at {levelFloor(lv + 1)}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, marginTop: 24 }}>
        <div className="stat-tile">
          <b>Progress by area</b>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
            {s.categories.length === 0 && <span className="muted small">No areas yet.</span>}
            {s.categories.map((c) => {
              const ns = notes.filter((n) => n.categoryId === c.id && n.status !== 'Archived')
              const d = ns.filter((n) => n.status === 'Completed').length
              const pct = ns.length ? Math.round((d / ns.length) * 100) : 0
              return (
                <div key={c.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span>{c.icon} {c.name}</span>
                    <span className="muted">{pct}%</span>
                  </div>
                  <div className="prog"><i style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colorOf(c.color).hex}, color-mix(in srgb, ${colorOf(c.color).hex} 55%, white))` }} /></div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="stat-tile">
          <b>Status distribution</b>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 14 }}>
            {STATUSES.map((st) => {
              const cnt = notes.filter((n) => n.status === st).length
              const pct = notes.length ? (cnt / notes.length) * 100 : 0
              return (
                <div key={st} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="chip" dot={STATUS_DOT[st]} style={{ width: 118, justifyContent: 'flex-start' }}>{st}</span>
                  <div className="prog" style={{ flex: 1 }}><i style={{ width: `${pct}%`, background: STATUS_DOT[st] }} /></div>
                  <span className="muted small" style={{ width: 24, textAlign: 'right' }}>{cnt}</span>
                </div>
              )
            })}
            <div style={{ marginTop: 6 }} className="muted small">Overall completion: {overall}%</div>
          </div>
        </div>
      </div>

      {upcoming.length > 0 && (
        <>
          <b style={{ display: 'block', marginTop: 28 }}>Coming up</b>
          <div className="grid notes" style={{ marginTop: 12 }}>
            {upcoming.map((n) => <NoteCard key={n.id} note={n} showArea />)}
          </div>
        </>
      )}
      {notes.length === 0 && (
        <Empty emoji="🌄" title="A clean slate" text="Nothing tracked yet. Create a note and watch your village come alive."
          action={<button className="btn primary" onClick={() => s.setUi({ editor: { open: true, noteId: null, defaults: {} } })}>＋ New note</button>} />
      )}
    </div>
  )
}
