// Reminder engine: computes occurrences and fires notifications.
import { addDays, addWeeks, addMonths, isValid, parseISO, isBefore, differenceInSeconds, differenceInCalendarDays } from 'date-fns'

// Next occurrence (Date) of a reminder after `from`. Supports recurrence and N-days-before deadlines.
export function nextOccurrence(r, from = new Date()) {
  let base = null
  if (r.beforeDue != null && r.dueSource) {
    const due = typeof r.dueSource === 'string' ? parseISO(r.dueSource) : r.dueSource
    if (isValid(due)) base = addDays(due, -r.beforeDue)
  } else if (r.when) {
    const d = new Date(r.when)
    if (r.time) { d.setHours(parseInt(r.time.slice(0, 2), 10), parseInt(r.time.slice(3, 5), 10), 0, 0) }
    base = d
  }
  if (!base || !isValid(base)) return null
  if (r.repeat === 'none' || !r.repeat) return isBefore(from, base) ? base : null

  const setT = (d) => {
    if (r.time) d.setHours(parseInt(r.time.slice(0, 2), 10), parseInt(r.time.slice(3, 5), 10), 0, 0)
    return d
  }
  let cand = setT(new Date(base))
  let guard = 0
  while (!isBefore(from, cand) && guard++ < 800) {
    if (r.repeat === 'daily') cand = setT(addDays(cand, 1))
    else if (r.repeat === 'weekly') cand = setT(addWeeks(cand, 1))
    else if (r.repeat === 'monthly') cand = setT(addMonths(cand, 1))
    else break
  }
  // align weekly/monthly to configured day
  if (r.repeat === 'weekly' && r.dayOfWeek != null) {
    while (cand.getDay() !== r.dayOfWeek && guard++ < 800) cand = setT(addDays(cand, 1))
  }
  if (r.repeat === 'monthly' && r.dateOfMonth != null) {
    const target = Math.min(r.dateOfMonth, new Date(cand.getFullYear(), cand.getMonth() + 1, 0).getDate())
    cand = setT(new Date(cand.getFullYear(), cand.getMonth(), target))
    if (isBefore(from, cand) === false) cand = setT(new Date(cand.getFullYear(), cand.getMonth() + 1, target))
  }
  return cand
}

export function occLabel(r) {
  const t = r.time ? ` · ${r.time}` : ''
  if (r.repeat === 'daily') return 'Every day' + t
  if (r.repeat === 'weekly') return 'Every ' + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][r.dayOfWeek ?? 1] + t
  if (r.repeat === 'monthly') return `On day ${r.dateOfMonth ?? 1} each month` + t
  if (r.beforeDue != null) return `${r.beforeDue} days before deadline`
  return 'Once' + t
}

let timer = null
export function startReminderEngine(useStore) {
  const tick = () => {
    const s = useStore.getState()
    if (!s.settings.notify.reminders) return
    const now = new Date()
    const fire = (title, body, key) => {
      if (s.firedKeys.includes(key)) return
      s.markFired(key)
      s.toast(`⏰ ${title}`, { type: 'notify', sub: body, ttl: 7000 })
      if (s.settings.notify.browser && 'Notification' in window && Notification.permission === 'granted') {
        try { new Notification(title, { body, icon: '/favicon.ico' }) } catch { /* ignore */ }
      }
    }
    // recurring / timed reminders — fire when within the last 60s
    for (const r of s.reminders) {
      if (!r.active) continue
      const next = nextOccurrence(r, now)
      if (!next) continue
      const diff = differenceInSeconds(next, new Date(r.lastFired || 0))
      const justPassed = (next <= now) && differenceInSeconds(now, next) < 90
      if (justPassed && (r.lastFired == null || diff > 30)) {
        fire(r.title, r.note || occLabel(r), 'rem-' + r.id + '-' + next.toISOString())
        useStore.setState((st) => ({ reminders: st.reminders.map((x) => (x.id === r.id ? { ...x, lastFired: next.toISOString() } : x)) }))
      }
    }
    // due-date notices
    if (s.settings.notify.dueDates) {
      for (const n of s.notes) {
        if (!n.dueDate || ['Completed', 'Archived'].includes(n.status)) continue
        const days = differenceInCalendarDays(parseISO(n.dueDate), now)
        if (days === 1) fire(`Due tomorrow: ${n.title}`, `${n.icon || '📝'} from your village`, 'due-' + n.id + '-1')
        else if (days === 0) fire(`Due today: ${n.title}`, 'Handle it today', 'due-' + n.id + '-0')
        else if (days < 0 && days > -30) fire(`Overdue: ${n.title}`, `${-days} days past deadline`, 'due-' + n.id + '-over')
      }
    }
  }
  tick()
  timer = setInterval(tick, 60000)
  return () => timer && clearInterval(timer)
}
