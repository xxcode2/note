import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, addWeeks, addDays,
  format, isSameMonth, isSameDay, parseISO, isValid, isToday,
} from 'date-fns'
import { useStore } from '../store.js'
import { colorOf } from '../lib/helpers.js'
import { Seg } from '../components/Kit.jsx'

export default function CalendarPage() {
  const s = useStore()
  const [cursor, setCursor] = useState(new Date())
  const [view, setView] = useState('month')
  const [dragOver, setDragOver] = useState(null)

  const events = useMemo(() => {
    const map = {}
    for (const n of s.notes) {
      if (!n.dueDate || n.status === 'Archived') continue
      const d = parseISO(n.dueDate)
      if (!isValid(d)) continue
      const k = format(d, 'yyyy-MM-dd')
      ;(map[k] = map[k] || []).push(n)
    }
    return map
  }, [s.notes])

  const days = useMemo(() => {
    if (view === 'day') return [cursor]
    if (view === 'week') return eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) })
    return eachDayOfInterval({ start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }) })
  }, [cursor, view])

  const moveDue = (noteId, day) => {
    const n = s.notes.find((x) => x.id === noteId)
    if (!n) return
    const d = new Date(day)
    if (n.dueDate && isValid(parseISO(n.dueDate))) {
      const old = parseISO(n.dueDate)
      d.setHours(old.getHours(), old.getMinutes(), 0, 0)
    } else d.setHours(9, 0, 0, 0)
    s.updateNote(noteId, { dueDate: d.toISOString() })
    s.toast(`🗓 Moved “${n.title}” to ${format(d, 'd MMM')}`, { type: 'ok', ttl: 2200 })
  }

  const shift = (dir) => {
    if (view === 'month') setCursor(addMonths(cursor, dir))
    else if (view === 'week') setCursor(addWeeks(cursor, dir))
    else setCursor(addDays(cursor, dir))
  }

  const Ev = ({ n }) => {
    const cat = s.categories.find((c) => c.id === n.categoryId)
    const accent = cat ? colorOf(cat.color).hex : 'var(--ink-2)'
    return (
      <div
        className="cal-ev"
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/note', n.id)}
        onClick={() => s.setUi({ detailNoteId: n.id })}
        title={n.title}
        style={{ opacity: n.status === 'Completed' ? 0.5 : 1, borderLeft: `3px solid ${accent}` }}
      >
        <span>{n.icon || cat?.icon || '📝'}</span>
        <span className="ell" style={{ textDecoration: n.status === 'Completed' ? 'line-through' : 'none' }}>{n.title}</span>
      </div>
    )
  }

  return (
    <div className="pad">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">📅 Calendar</h1>
          <p className="page-sub">Deadlines live here. Drag an event to move its deadline.</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Seg options={['month', 'week', 'day']} value={view} onChange={setView} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 12px' }}>
        <button className="icon-btn" onClick={() => shift(-1)}>←</button>
        <b style={{ fontSize: 17, fontWeight: 800, minWidth: 190, textAlign: 'center' }}>
          {format(cursor, view === 'day' ? 'EEEE, d MMMM yyyy' : view === 'week' ? "'Week of' d MMM yyyy" : 'MMMM yyyy')}
        </b>
        <button className="icon-btn" onClick={() => shift(1)}>→</button>
        <button className="btn sm ghost" onClick={() => setCursor(new Date())}>Today</button>
      </div>

      <motion.div layout className="cal">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div className="dow" key={d}>{d}</div>)}
        {days.map((day) => {
          const k = format(day, 'yyyy-MM-dd')
          const list = events[k] || []
          const key = k + (view === 'month' ? '' : format(cursor, 'mm'))
          return (
            <div
              key={key}
              className={'cal-day' + (isSameMonth(day, cursor) || view !== 'month' ? '' : ' other') + (isToday(day) ? ' today' : '') + (dragOver === k ? ' drop' : '')}
              style={view === 'day' ? { gridColumn: '1 / -1', minHeight: 160 } : view === 'week' ? { minHeight: 200 } : undefined}
              onDragOver={(e) => { e.preventDefault(); setDragOver(k) }}
              onDragLeave={() => setDragOver((v) => (v === k ? null : v))}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(null)
                const id = e.dataTransfer.getData('text/note')
                if (id) moveDue(id, day)
              }}
            >
              <div className="dn">{format(day, view === 'month' ? 'd' : 'EEE d')}</div>
              {list.slice(0, view === 'month' ? 4 : 20).map((n) => <Ev key={n.id} n={n} />)}
              {view === 'month' && list.length > 4 && <div className="muted" style={{ fontSize: 10, paddingLeft: 6 }}>+{list.length - 4} more</div>}
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
