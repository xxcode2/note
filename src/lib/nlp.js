// Natural-language quick-add parsing (Indonesian + English hints)
import { addDays, startOfMonth } from 'date-fns'

const DAYS_ID = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']
const MONTH_OFFSET = { besok: 1, lusa: 2, 'hari ini': 0, today: 0, tomorrow: 1 }

export function parseQuickAdd(text, categories = []) {
  const out = { title: text.trim(), dueDate: null, time: null, categoryId: null, priority: null, tags: [] }
  if (!out.title) return out
  let work = ' ' + out.title + ' '

  // time: "jam 10", "pkl 14.30", "at 9am", "10:00"
  const tm = work.match(/\b(?:jam|pkl|pk\.?|at)\s*(\d{1,2})(?:[.:](\d{2}))?\s*(pagi|siang|sore|malam|am|pm)?/i)
  if (tm) {
    let h = parseInt(tm[1], 10)
    const m = tm[2] ? parseInt(tm[2], 10) : 0
    const mer = (tm[3] || '').toLowerCase()
    if (mer === 'malam' || mer === 'pm') { if (h < 12) h += 12 }
    else if (mer === 'pagi') h = h === 12 ? 0 : h
    else if (mer === 'siang') { if (h < 7) h += 12 }
    else if (mer === 'sore') h = h < 12 ? h + 12 : h
    out.time = `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    work = work.replace(tm[0], ' ')
  }

  // relative day keywords
  let dateFound = null
  for (const [k, off] of Object.entries(MONTH_OFFSET)) {
    const re = new RegExp('\\b' + k.replace(' ', '\\s') + '\\b', 'i')
    if (re.test(work)) { dateFound = off; work = work.replace(re, ' '); break }
  }
  // "tanggal 12", "tanggal 12 oktober"
  if (dateFound == null) {
    const dm = work.match(/\btanggal\s*(\d{1,2})(?:\s*(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|oct|dec))?\b/i)
    if (dm) {
      const now = new Date()
      const monNames = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember']
      let month = now.getMonth()
      if (dm[2]) {
        const idx = monNames.findIndex((m) => m.startsWith(dm[2].toLowerCase().slice(0, 3)) || m.slice(0, 3) === dm[2].toLowerCase())
        if (idx >= 0) month = idx
      }
      const d = new Date(now.getFullYear(), month, parseInt(dm[1], 10))
      if (dateFound === null && d < now && !dm[2]) d.setMonth(d.getMonth() + 1)
      dateFound = d
      work = work.replace(dm[0], ' ')
    }
  }
  // weekday names: "senin", "rabu depan"
  if (dateFound == null) {
    for (let i = 1; i < DAYS_ID.length; i++) {
      const re = new RegExp('\\b' + DAYS_ID[i] + '\\b', 'i')
      if (re.test(work)) {
        const now = new Date()
        let delta = (i - now.getDay() + 7) % 7
        if (delta === 0) delta = 7
        dateFound = addDays(now, delta)
        work = work.replace(re, ' ')
        break
      }
    }
  }
  // "minggu depan", "bulan depan", "2 hari lagi"
  if (dateFound == null) {
    const rel = work.match(/\b(\d+)\s*(hari|hr|day)s?\s*(lagi|ke depan|depan|from now)?\b/i)
    if (rel && !/\bjam/i.test(rel[0])) { dateFound = addDays(new Date(), parseInt(rel[1], 10)); work = work.replace(rel[0], ' ') }
  }
  if (dateFound == null && /\b(lusa)\b/i.test(work)) { dateFound = 2 }
  if (dateFound == null && /\b(minggu|bulan)\s(depan| depan)\b/i.test(work)) {
    dateFound = /\bbulan depan\b/i.test(work) ? startOfMonth(addDays(new Date(), 32)) : addDays(new Date(), 7)
    work = work.replace(/\b(minggu|bulan)\s+depan\b/i, ' ')
  }

  const base = new Date()
  if (typeof dateFound === 'number') {
    const d = addDays(base, dateFound)
    d.setHours(dateFound === 0 ? (out.time ? parseInt(out.time.slice(0, 2)) : 9) : out.time ? parseInt(out.time.slice(0, 2)) : 9, out.time ? parseInt(out.time.slice(3, 5)) : 0, 0, 0)
    out.dueDate = d.toISOString()
  } else if (dateFound instanceof Date) {
    const d = new Date(dateFound)
    d.setHours(out.time ? parseInt(out.time.slice(0, 2)) : 9, out.time ? parseInt(out.time.slice(3, 5)) : 0, 0, 0)
    out.dueDate = d.toISOString()
  } else if (out.time) {
    const d = addDays(base, 1)
    d.setHours(parseInt(out.time.slice(0, 2)), parseInt(out.time.slice(3, 5)), 0, 0)
    out.dueDate = d.toISOString()
  }

  // tags
  const tags = [...work.matchAll(/#([\w-]+)/g)].map((m) => m[1].toLowerCase())
  if (tags.length) { out.tags = tags; work = work.replace(/#[\w-]+/g, ' ') }
  if (/\b(urgent|penting|critical|⭐)\b/i.test(work)) { out.priority = 'High'; work = work.replace(/\b(urgent|penting|critical|⭐)\b/i, ' ') }

  // clean title
  out.title = work.replace(/\s{2,}/g, ' ').replace(/^\s+|\s+$/g, '').replace(/^[-–—,;.]+\s*/, '') || text.trim()

  // category match by name (word boundary, pick longest matching name)
  const lower = out.title.toLowerCase() + ' ' + text.toLowerCase()
  let best = null, bestLen = 0
  for (const c of categories) {
    const name = c.name.toLowerCase()
    if (lower.includes(name) && name.length > bestLen) { best = c.id; bestLen = name.length }
  }
  out.categoryId = best
  return out
}
