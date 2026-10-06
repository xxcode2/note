// ---------- ids ----------
export const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2))

// ---------- palettes ----------
export const PALETTE = {
  amber:   { hex: '#f5a524', soft: 'rgba(245,165,36,.14)',  roof: '#b3552e', wall: '#e8d5b5', glow: '#ffcf7a' },
  blue:    { hex: '#4ea1ff', soft: 'rgba(78,161,255,.14)',   roof: '#2e5f8f', wall: '#dbe7f2', glow: '#9ecbff' },
  green:   { hex: '#53c99a', soft: 'rgba(83,201,154,.14)',   roof: '#2f7a52', wall: '#e2eddc', glow: '#a8ecc4' },
  violet:  { hex: '#a78bfa', soft: 'rgba(167,139,250,.14)',  roof: '#5b4a9e', wall: '#e6e0f3', glow: '#cdbcff' },
  rose:    { hex: '#f2789f', soft: 'rgba(242,120,159,.14)',  roof: '#9e3b5c', wall: '#f3dede', glow: '#ffc4d8' },
  cyan:    { hex: '#45c4d6', soft: 'rgba(69,196,214,.14)',   roof: '#2a6d80', wall: '#dceef2', glow: '#a5e6f0' },
  slate:   { hex: '#8fa3bf', soft: 'rgba(143,163,191,.14)',  roof: '#3d4c63', wall: '#dfe6ef', glow: '#c9d6ea' },
  lime:    { hex: '#a3d952', soft: 'rgba(163,217,82,.14)',   roof: '#5c8a2a', wall: '#e9f0d8', glow: '#d3f59b' },
}
export const colorOf = (name) => PALETTE[name] || PALETTE.amber

// ---------- domain constants ----------
export const STATUSES = ['Inbox', 'Todo', 'In Progress', 'Waiting', 'Completed', 'Archived']
export const STATUS_DOT = {
  Inbox: '#8fa3bf', Todo: '#4ea1ff', 'In Progress': '#f5a524',
  Waiting: '#a78bfa', Completed: '#53c99a', Archived: '#5c6b7f',
}
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
export const PRIORITY_META = {
  Low: { label: 'Low', color: '#53c99a', xp: 5 },
  Medium: { label: 'Medium', color: '#4ea1ff', xp: 10 },
  High: { label: 'High', color: '#f5a524', xp: 15 },
  Critical: { label: 'Critical', color: '#f2789f', xp: 25 },
}

export const BUILDING_TYPES = [
  { id: 'house',     label: 'House',     icon: '🏠' },
  { id: 'office',    label: 'Office',    icon: '🏢' },
  { id: 'hospital',  label: 'Hospital',  icon: '🏥' },
  { id: 'bank',      label: 'Bank',      icon: '💰' },
  { id: 'school',    label: 'School',    icon: '🏫' },
  { id: 'warehouse', label: 'Warehouse', icon: '📦' },
  { id: 'shop',      label: 'Shop',      icon: '🏪' },
  { id: 'tower',     label: 'Tower',     icon: '🗼' },
  { id: 'garage',    label: 'Garage',    icon: '🚗' },
  { id: 'library',   label: 'Library',   icon: '📚' },
  { id: 'civic',     label: 'Civic Hall',icon: '🏛️' },
  { id: 'star',      label: 'Star Pavilion', icon: '⭐' },
]
export const buildingMeta = (t) => BUILDING_TYPES.find((b) => b.id === t) || BUILDING_TYPES[0]

export const ICON_CHOICES = ['📄','🪪','📁','🗂️','💡','📌','🗓️','⏰','💳','🧾','📝','✅','🔑','❤️','🧠','🌿','📷','🎯','🚗','🏠','🏥','🏢','💰','📚','⭐','🔒']
export const EMOJI_CHOICES = ['🏠','🏛️','🏥','🏢','📄','💰','🚗','📦','⭐','📚','🌿','🎯','🧾','🗝️','💼','🛒','🎓','⚖️','🏦','🧳']

// ---------- richer, context-aware icons ----------
// Maps Indonesian/admin keywords to a more "real" icon so notes don't all look like a plain 📝.
const RICH_RULES = [
  { re: /\bkk\b|kartu ?keluarga|keluarga/i, icon: '👪', tone: 'family' },
  { re: /\bktp\b|kartu ?tanda ?penduduk|identitas|id ?card/i, icon: '🪪', tone: 'id' },
  { re: /bpjs|kesehatan|jaminan|klaim|rs\b|klinik|check ?up|obat/i, icon: '🏥', tone: 'health' },
  { re: /akta|surat ?keterangan|legalisir|ijazah|sertifikat|dokumen|surat/i, icon: '📜', tone: 'doc' },
  { re: /stnk|bpkb|pajak ?kendaraan|kendara|servis|motor|mobil|bensin/i, icon: '🚗', tone: 'vehicle' },
  { re: /pajak|\bspt\b|samsat/i, icon: '🧾', tone: 'tax' },
  { re: /listrik|tagihan|pdam|\bair\b|internet|wifi|token|pulsa|bps/i, icon: '💡', tone: 'bill' },
  { re: /bayar|invoice|pembayaran|cicilan|kredit|\bttp\b/i, icon: '💳', tone: 'pay' },
  { re: /nabung|tabungan|keuangan|gaji|income|pengeluaran|budget|dompet|investasi|rekening|bank/i, icon: '💰', tone: 'money' },
  { re: /kerja|proyek|project|kantor|meeting|rapat|deadline|tugas|standup|roadmap|client/i, icon: '💼', tone: 'work' },
  { re: /jadwal|agenda|\bcalendar\b|janji|booking|reservasi|rencana/i, icon: '🗓️', tone: 'plan' },
  { re: /belajar|buku|baca|referensi|riset|informasi|kajian|library/i, icon: '📚', tone: 'read' },
  { re: /ide|gagasan|brainstorm|konsep/i, icon: '💡', tone: 'idea' },
  { re: /target|goal|prioritas|penting|star|utama/i, icon: '⭐', tone: 'star' },
  { re: /rumah|properti|kontrakan|kos|bangun|renovasi/i, icon: '🏠', tone: 'home' },
  { re: /kunci|password|login|akun|otp|verifikasi|aman|security/i, icon: '🔑', tone: 'key' },
  { re: /belanja|beli|groceries|pasar|supermarket|order/i, icon: '🛒', tone: 'shop' },
  { re: /paspor|passport|visa|liburan|travel|pulang|hotel/i, icon: '🧳', tone: 'travel' },
  { re: /nikah|kawin|cerai|kelahiran|kematian|Keluarga/i, icon: '💞', tone: 'civil' },
  { re: /desa|rt|rw|kelurahan|kecamatan|pengantar|administrasi/i, icon: '🏛️', tone: 'civic' },
]
const GENERIC = new Set(['📝', '', null, undefined])

// Returns a richer emoji for a note, respecting an explicit non-generic user choice.
export const richIcon = ({ title = '', description = '', tags = [], icon, categoryId, categories }) => {
  // respect a deliberate custom icon the user picked (anything that isn't the generic default)
  if (icon && !GENERIC.has(icon)) return icon
  const hay = [title, (tags || []).join(' '), description, (categories || []).find((c) => c.id === categoryId)?.name || ''].join(' ').toLowerCase()
  for (const r of RICH_RULES) if (r.re.test(hay)) return r.icon
  return icon && !GENERIC.has(icon) ? icon : '📝'
}

// ---------- village slots (grid positions for buildings) ----------
export const VILLAGE_SLOTS = [
  [-7.5, -5.5], [-2.5, -7], [3, -6.5], [7.5, -4.5],
  [-8.5, 0.5], [-4, 3.5], [0.5, -1.5], [4.5, 2.5], [8.5, 0],
  [-1.5, 7], [4, 7.5], [8.5, 5.5], [-8, 6], [-4.5, -2.5], [1, 4],
]

export const slotAt = (taken, count) => {
  for (let i = 0; i < VILLAGE_SLOTS.length; i++) if (!taken.includes(i)) return i
  // procedural overflow: spiral outward
  const n = count
  return 1000 + n
}

export const slotPosition = (index) => {
  if (index < VILLAGE_SLOTS.length) return VILLAGE_SLOTS[index]
  const n = index - 1000
  const a = n * 0.9
  const r = 12 + n * 1.2
  return [Math.cos(a) * r, Math.sin(a) * r]
}

// ---------- dates ----------
import { format, parseISO, isValid, isToday, isTomorrow, differenceInCalendarDays, addDays } from 'date-fns'
export const fmtDate = (s, f = 'd MMM yyyy') => {
  if (!s) return ''
  const d = typeof s === 'string' ? parseISO(s) : s
  return isValid(d) ? format(d, f) : ''
}
export const fmtDateTime = (s) => fmtDate(s, 'd MMM yyyy · HH:mm')
export const relDeadline = (s) => {
  if (!s) return null
  const d = parseISO(s)
  if (!isValid(d)) return null
  const days = differenceInCalendarDays(d, new Date())
  if (isToday(d)) return { text: 'Today', tone: days < 0 ? 'overdue' : 'soon' }
  if (isTomorrow(d)) return { text: 'Tomorrow', tone: 'soon' }
  if (days < 0) return { text: `${-days}d overdue`, tone: 'overdue' }
  if (days <= 7) return { text: `${days} days left`, tone: 'soon' }
  return { text: fmtDate(s), tone: 'normal' }
}
export const daysLeft = (s) => (s ? differenceInCalendarDays(parseISO(s), new Date()) : null)

// ---------- file helpers ----------
export const fileToDataUrl = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
export const kindOfFile = (nameOrType = '') => {
  const n = nameOrType.toLowerCase()
  if (n.includes('pdf')) return 'pdf'
  if (/(png|jpe?g|gif|webp|img)/.test(n)) return 'image'
  if (/(doc|xls|ppt|text|document)/.test(n)) return 'document'
  return 'other'
}
export const bytesOf = (dataUrl = '') => Math.round((dataUrl.length * 3) / 4)
export const humanSize = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB')

// ---------- greeting ----------
export const greetingFor = (h = new Date().getHours()) =>
  h < 11 ? 'Good morning' : h < 15 ? 'Good afternoon' : h < 19 ? 'Good evening' : 'Good night'

// ---------- gamification: village level from XP ----------
export const LEVEL_TITLES = ['Wanderer', 'Settler', 'Homestead', 'Cottage', 'Hamlet', 'Village', 'Market Town', 'Little City', 'Metropolis', 'Sky Kingdom']
export const levelFor = (xp = 0) => {
  let level = 0, need = 100, rem = Math.max(0, xp)
  while (rem >= need) { rem -= need; level += 1; need = 100 + level * 45 }
  return {
    level: level + 1,
    title: LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)],
    into: rem, need, pct: Math.min(1, rem / need), next: LEVEL_TITLES[Math.min(level + 1, LEVEL_TITLES.length - 1)],
  }
}

// ---------- per-building "vibe": how alive/complete an area looks ----------
export const vibeFor = ({ total = 0, done = 0, pending = 0, overdue = 0 }) => {
  const ratio = total ? done / total : 0
  const allDone = total > 0 && pending === 0
  const tier = total === 0 ? 0 : ratio >= 0.9 ? 3 : ratio >= 0.5 ? 2 : ratio > 0 ? 1 : 0
  let mood = 'idle'
  if (overdue > 0) mood = 'overdue'
  else if (allDone) mood = 'celebrate'
  else if (ratio > 0) mood = 'growing'
  else if (total > 0) mood = 'busy'
  return { ratio, tier, allDone, overdue: overdue > 0, overdueCount: overdue, mood }
}

// ---------- chained notes (dependency: B hidden until A is completed) ----------
export const isLocked = (note, notes) => {
  const deps = note.dependsOn || []
  if (!deps.length) return false
  return deps.some((id) => { const d = notes.find((n) => n.id === id); return d && d.status !== 'Completed' })
}
export const blockersOf = (note, notes) => (note.dependsOn || [])
  .map((id) => notes.find((n) => n.id === id))
  .filter((d) => d && d.status !== 'Completed')

// ---------- day-night that follows the real clock ----------
export const envForHour = (h = new Date().getHours()) =>
  h < 5 || h >= 19 ? 'night' : h < 7 || h >= 17 ? 'sunset' : 'day'
