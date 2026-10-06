import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from './lib/idb.js'
import { uid, slotAt, PRIORITY_META, kindOfFile, isLocked } from './lib/helpers.js'

const defaultSettings = {
  theme: 'dark',            // dark | light | auto
  environment: 'day',       // day | sunset | night
  weather: 'clear',         // clear | rain | snow | off
  camera: 'isometric',      // isometric | free | minimal
  autoEnv: false,           // follow the real clock (day/sunset/night)
  animations: 'full',       // full | reduced | off
  enable3D: true,
  shadows: true,
  npc: true,
  particles: true,
  waterAnim: true,
  ambient: true,            // clouds / birds / streetlight glow
  gamification: true,
  defaultCategory: null,
  defaultPriority: 'Medium',
  defaultStatus: 'Inbox',
  notify: { reminders: true, dueDates: true, browser: false },
}

const defaultWorkspace = {
  name: 'My Haven',
  villageName: 'Havenwood',
  avatar: '🧑‍🌾',
  greeting: 'Here\u2019s what needs your attention.',
}

const defaultUi = {
  route: { name: 'village', params: {} },
  sidebarOpen: true,
  searchOpen: false,
  quickAddOpen: false,
  editor: { open: false, noteId: null, defaults: {} },   // note editor modal
  detailNoteId: null,                                     // note detail modal
  catEditor: { open: false, catId: null },                // category builder modal
  editingVillage: false,
  focusCatId: null,
  docPreview: null,
  walkMode: false,        // third-person "be yourself" exploration in the village
  nearCatId: null,        // building the player is standing next to (walkMode)
  walkReturn: null,       // catId you entered on foot — leaving its view resumes walk mode
}

const seedDemo = () => {
  const now = new Date()
  const d = (off, h = 9) => {
    const x = new Date(now)
    x.setDate(x.getDate() + off)
    x.setHours(h, 0, 0, 0)
    return x.toISOString()
  }
  const cats = [
    { key: 'personal', name: 'Personal', icon: '🌿', color: 'green', building: 'house', desc: 'Catatan dan pikiran pribadi' },
    { key: 'village', name: 'Village Admin', icon: '🏛️', color: 'amber', building: 'civic', desc: 'Urusan desa & administrasi' },
    { key: 'health', name: 'Health', icon: '🏥', color: 'rose', building: 'hospital', desc: 'BPJS, kesehatan, jaminan' },
    { key: 'work', name: 'Work', icon: '🏢', color: 'blue', building: 'office', desc: 'Pekerjaan & proyek' },
    { key: 'docs', name: 'Documents', icon: '📄', color: 'cyan', building: 'school', desc: 'KK, KTP, Akta & dokumen' },
    { key: 'finance', name: 'Finance', icon: '💰', color: 'lime', building: 'bank', desc: 'Keuangan, tagihan, pajak' },
    { key: 'vehicle', name: 'Vehicle', icon: '🚗', color: 'violet', building: 'garage', desc: 'Servis & dokumen kendaraan' },
    { key: 'archive', name: 'Archive', icon: '📦', color: 'slate', building: 'warehouse', desc: 'Arsip & dokumen lama' },
    { key: 'important', name: 'Star Notes', icon: '⭐', color: 'amber', building: 'star', desc: 'Catatan paling penting' },
    { key: 'library', name: 'Library', icon: '📚', color: 'blue', building: 'library', desc: 'Informasi & referensi' },
  ].map((c, i) => ({
    id: uid(), name: c.name, icon: c.icon, color: c.color, description: c.desc,
    building: { type: c.building, slot: i, color: c.color, roof: null, light: 'warm' },
    createdAt: now.toISOString(),
  }))
  const cid = (k) => cats.find((c) => c.key === k)?.id
  const notes = [
    { t: 'Perubahan data KK', c: 'docs', icon: '📄', d: 'Perlu mengurus perubahan data KK setelah pindah alamat. Bawa fotokopi KK lama dan surat pengantar RT.', s: 'Waiting', p: 'High', due: d(6), tags: ['dokumen', 'administrasi', 'kk'], imp: true, chk: [['Fotokopi KK', true], ['Fotokopi KTP', true], ['Surat pengantar RT', false], ['Datang ke kantor desa', false]] },
    { t: 'Perpanjangan KTP', c: 'docs', icon: '🪪', d: 'KTP hampir habis masa berlaku. Lakukan perpanjangan di Disdukcapil.', s: 'Completed', p: 'Medium', due: d(-3), tags: ['dokumen', 'ktp'], imp: false, chk: [] },
    { t: 'Perpanjang BPJS Kesehatan', c: 'health', icon: '🏥', d: 'Cek iuran dan pastikan kartu aktif sebelum perawat anak.', s: 'Todo', p: 'High', due: d(9), tags: ['bpjs', 'kesehatan'], imp: true, chk: [['Cek status keaktifan', false], ['Bayar iuran bulan ini', false]] },
    { t: 'Pajak kendaraan tahunan', c: 'vehicle', icon: '🚗', d: 'Pajak STNK lima tahunan — siapkan BPKB, KTP, dan kendaraan untuk cek fisik.', s: 'In Progress', p: 'Critical', due: d(14), tags: ['pajak', 'stnk'], imp: true, chk: [['Cek fisik kendaraan', false], ['Bayar di Samsat', false]] },
    { t: 'Q4 project roadmap', c: 'work', icon: '🎯', d: 'Susun roadmap kuartal depan, selaraskan dengan tim design dan engineering.', s: 'In Progress', p: 'Medium', due: d(4), tags: ['work', 'planning'], imp: false, chk: [['Draft timeline', true], ['Review dengan lead', false], ['Submit ke manager', false]] },
    { t: 'Laporan bulanan', c: 'work', icon: '📝', d: 'Rekap progress tim dan kirim sebelum akhir bulan.', s: 'Todo', p: 'Low', due: d(20), tags: ['work'], imp: false, chk: [] },
    { t: 'Bayar tagihan listrik & air', c: 'finance', icon: '🧾', d: 'Auto-debit gagal bulan lalu, bayar manual sebelum tanggal 10.', s: 'Todo', p: 'High', due: d(3), tags: ['tagihan'], imp: false, chk: [['Listrik', false], ['Air PDAM', false], ['Internet', false]] },
    { t: 'Buku referensi: sistem operasi modern', c: 'library', icon: '📚', d: 'Bab 3–5 selesai. Catat bagian virtual memory untuk proyek.', s: 'In Progress', p: 'Low', due: null, tags: ['buku', 'belajar'], imp: false, chk: [['Bab 3', true], ['Bab 4', true], ['Bab 5', false]] },
    { t: 'Idea: dashboard keuangan pribadi', c: 'personal', icon: '💡', d: 'Buat visualisasi pengeluaran per kategori, terhubung dengan catatan keuangan di sini.', s: 'Inbox', p: 'Low', due: null, tags: ['idea'], imp: false, chk: [] },
    { t: 'Rutin cek kesehatan tahunan', c: 'health', icon: '❤️', d: 'Booking jadwal check-up: kolesterol, gula darah, tensi.', s: 'Inbox', p: 'Medium', due: d(27), tags: ['bpjs', 'checkup'], imp: false, chk: [] },
    { t: 'Dokumen lama: akta kelahiran', c: 'archive', icon: '🗂️', d: 'Sudah discan dan disimpan di vault. Fisik ada di lemari kiri.', s: 'Archived', p: 'Low', due: null, tags: ['akta', 'arsip'], imp: false, chk: [] },
    { t: 'Tuangan: target nabung 30 juta', c: 'important', icon: '⭐', d: 'Prioritas utama tahun ini. Sisihkan 25% penghasilan setiap gajian.', s: 'In Progress', p: 'Critical', due: null, tags: ['target', 'keuangan'], imp: true, chk: [['Otomatis transfer tiap gajian', true], ['Evaluasi tiap kuartal', false]] },
  ].map((n) => ({
    id: uid(), title: n.t, description: n.d, categoryId: cid(n.c), icon: n.icon, color: null,
    tags: n.tags, status: n.s, priority: n.p, important: n.imp, pinned: n.imp,
    dueDate: n.due, reminder: null,
    checklist: n.chk.map(([text, done]) => ({ id: uid(), text, done })),
    attachments: [], createdAt: now.toISOString(), updatedAt: now.toISOString(),
  }))
  // demo chain: this note stays hidden until "Perpanjang BPJS Kesehatan" is completed
  const bpjs = notes.find((n) => n.title.startsWith('Perpanjang BPJS'))
  notes.push({
    id: uid(), title: 'Klaim rawat inap (setelah kartu aktif)', description: 'Catatan berantai — muncul begitu perpanjangan BPJS selesai.',
    categoryId: cid('health'), icon: '🏥', color: null, tags: ['bpjs', 'klaim'], status: 'Todo', priority: 'Medium',
    important: false, pinned: false, dueDate: d(12), reminder: null, checklist: [], dependsOn: bpjs ? [bpjs.id] : [],
    attachments: [], createdAt: now.toISOString(), updatedAt: now.toISOString(),
  })
  const reminders = [
    { id: uid(), title: 'Bayar iuran BPJS', repeat: 'monthly', dateOfMonth: 1, time: '09:00', active: true, lastFired: null, note: 'Cek aplikasi BPJS sebelum bayar.', createdAt: now.toISOString() },
    { id: uid(), title: 'Update progress kerja', repeat: 'weekly', dayOfWeek: 1, time: '10:00', active: true, lastFired: null, note: 'Every Monday standup notes.', createdAt: now.toISOString() },
    { id: uid(), title: 'Cek deadline pajak kendaraan', repeat: 'none', when: d(11, 8), active: true, lastFired: null, note: 'H-3 sebelum jatuh tempo.', createdAt: now.toISOString() },
  ]
  return { categories: cats, notes, reminders }
}

export const useStore = create(
  persist(
    (set, get) => ({
      onboardingDone: false,
      workspace: defaultWorkspace,
      settings: defaultSettings,
      categories: [],
      notes: [],
      reminders: [],
      customMenus: [],
      xp: 0,
      firedKeys: [],
      toasts: [],
      ui: defaultUi,

      // ---------- ui ----------
      setUi: (partial) => set((s) => ({ ui: { ...s.ui, ...partial } })),
      navigate: (name, params = {}) =>
        set((s) => {
          // leaving a building you walked into → drop back into the avatar
          if (name === 'village' && s.settings.enable3D && s.ui.walkReturn) {
            return { ui: { ...s.ui, route: { name, params }, focusCatId: null, walkMode: true, nearCatId: s.ui.walkReturn, walkReturn: null } }
          }
          return { ui: { ...s.ui, route: { name, params }, focusCatId: name === 'category' ? (params.catId ?? null) : null } }
        }),
      openVillage: () =>
        set((s) => {
          if (s.settings.enable3D && s.ui.walkReturn)
            return { ui: { ...s.ui, route: { name: 'village', params: {} }, focusCatId: null, walkMode: true, nearCatId: s.ui.walkReturn, walkReturn: null } }
          return { ui: { ...s.ui, route: { name: 'village', params: {} }, focusCatId: null } }
        }),

      // ---------- toasts ----------
      toast: (message, opts = {}) => {
        const id = uid()
        set((s) => ({ toasts: [...s.toasts, { id, message, ...opts }] }))
        setTimeout(() => get().dismissToast(id), opts.ttl ?? 4200)
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      // ---------- categories ----------
      addCategory: (data) => {
        const s = get()
        const taken = s.categories.map((c) => c.building?.slot).filter((x) => x != null && x < 1000)
        const slot = data.slot != null ? data.slot : slotAt(taken, s.categories.length)
        const cat = {
          id: uid(),
          name: data.name || 'New Area',
          description: data.description || '',
          icon: data.icon || '🌿',
          color: data.color || 'amber',
          building: { type: data.building || 'house', slot, color: data.color || 'amber', roof: data.roof || null, light: data.light || 'warm' },
          createdAt: new Date().toISOString(),
        }
        set({ categories: [...s.categories, cat] })
        get().toast(`${cat.icon} ${cat.name} rises in your village`, { type: 'build', ttl: 2600 })
        return cat.id
      },
      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id
              ? { ...c, ...patch, building: { ...c.building, ...(patch.building || {}), slot: patch.slot != null ? patch.slot : patch.building?.slot ?? c.building?.slot } }
              : c,
          ),
        })),
      deleteCategory: (id) => {
        const s = get()
        set({
          categories: s.categories.filter((c) => c.id !== id),
          notes: s.notes.map((n) => (n.categoryId === id ? { ...n, categoryId: null } : n)),
        })
        get().toast('Area dissolved into the mist', { type: 'dissolve' })
      },

      // ---------- notes ----------
      addNote: (data = {}) => {
        const s = get()
        const st = s.settings
        const note = {
          id: uid(),
          title: data.title || 'Untitled',
          description: data.description || '',
          categoryId: data.categoryId ?? st.defaultCategory ?? null,
          tags: data.tags || [],
          status: data.status || st.defaultStatus,
          priority: data.priority || st.defaultPriority,
          dueDate: data.dueDate || null,
          reminder: data.reminder || null,
          attachments: data.attachments || [],
          checklist: data.checklist || [],
          dependsOn: data.dependsOn || [],
          color: data.color || null,
          icon: data.icon || '📝',
          important: data.important || false,
          pinned: data.pinned || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set({ notes: [note, ...s.notes] })
        return note.id
      },
      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)),
        })),
      deleteNote: (id) => {
        const s = get()
        const idx = s.notes.findIndex((n) => n.id === id)
        if (idx < 0) return
        const note = s.notes[idx]
        set({ notes: s.notes.filter((n) => n.id !== id) })
        get().toast(`🗑 "${note.title}" dihapus`, {
          type: 'notify', ttl: 6500,
          action: { label: 'Undo', onClick: () => {
            set((st) => { const arr = [...st.notes]; arr.splice(Math.min(idx, arr.length), 0, note); return { notes: arr } })
            get().toast('↩ Catatan dikembalikan', { type: 'ok', ttl: 2000 })
          } },
        })
      },
      duplicateNote: (id) => {
        const n = get().notes.find((x) => x.id === id)
        if (n) get().addNote({ ...n, title: n.title + ' (copy)', status: 'Inbox', dueDate: n.dueDate })
      },
      completeNote: (id) => {
        const s = get()
        const n = s.notes.find((x) => x.id === id)
        if (!n || n.status === 'Completed') return
        get().updateNote(id, { status: 'Completed' })
        if (s.settings.gamification) get().toast(`${n.icon} ${n.title} — selesai!`, { type: 'ok' })
        else get().toast(`${n.icon} ${n.title} completed`, { type: 'ok' })
        // reveal any chained notes this just unlocked
        const after = get().notes
        const unlocked = after.filter((x) => (x.dependsOn || []).includes(id) && !isLocked(x, after))
        if (unlocked.length) get().toast(`🔓 ${unlocked.length} catatan terbuka: ${unlocked.map((u) => u.title).join(', ')}`, { type: 'ok', ttl: 4600 })
      },
      toggleCheck: (noteId, itemId) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  updatedAt: new Date().toISOString(),
                  checklist: n.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)),
                }
              : n,
          ),
        })),
      toggleImportant: (id) => set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, important: !n.important } : n)) })),
      togglePinned: (id) => set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)) })),
      moveNoteToCategory: (noteId, catId) => get().updateNote(noteId, { categoryId: catId }),
      reorderNotes: (ids) =>
        set((s) => {
          const map = new Map(s.notes.map((n) => [n.id, n]))
          const moved = ids.map((id) => map.get(id)).filter(Boolean)
          const rest = s.notes.filter((n) => !ids.includes(n.id))
          return { notes: [...moved, ...rest] }
        }),

      // ---------- reminders ----------
      addReminder: (data) => {
        const r = {
          id: uid(), active: true, lastFired: null, createdAt: new Date().toISOString(),
          title: data.title || 'Reminder', note: data.note || '', repeat: data.repeat || 'none',
          when: data.when || null, time: data.time || null, dayOfWeek: data.dayOfWeek ?? null, dateOfMonth: data.dateOfMonth ?? null,
          beforeDue: data.beforeDue ?? null, categoryId: data.categoryId || null,
        }
        set((s) => ({ reminders: [...s.reminders, r] }))
        return r.id
      },
      updateReminder: (id, patch) => set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteReminder: (id) => set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),
      markFired: (key) => set((s) => ({ firedKeys: [...s.firedKeys.slice(-200), key] })),

      // ---------- custom menus ----------
      addMenu: (m) => set((s) => ({ customMenus: [...s.customMenus, { id: uid(), label: m.label, icon: m.icon || '🔗', route: m.route, params: m.params || {} }] })),
      removeMenu: (id) => set((s) => ({ customMenus: s.customMenus.filter((m) => m.id !== id) })),

      // ---------- settings / workspace ----------
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch, notify: { ...s.settings.notify, ...(patch.notify || {}) } } })),
      updateWorkspace: (patch) => set((s) => ({ workspace: { ...s.workspace, ...patch } })),
      finishOnboarding: (payload) => {
        if (payload?.workspace) get().updateWorkspace(payload.workspace)
        if (payload?.category) get().addCategory(payload.category)
        if (payload?.note) get().addNote(payload.note)
        set({ onboardingDone: true })
      },
      loadDemo: () => {
        const { categories, notes, reminders } = seedDemo()
        set({ categories, notes, reminders, onboardingDone: true })
        get().toast('A starter village has been built for you', { type: 'build', ttl: 3200 })
      },

      // ---------- data ----------
      exportData: () => {
        const s = get()
        const data = {
          _app: 'haven', _v: 1, exportedAt: new Date().toISOString(),
          workspace: s.workspace, settings: s.settings, categories: s.categories,
          notes: s.notes, reminders: s.reminders, customMenus: s.customMenus, xp: s.xp,
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `haven-backup-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      },
      importData: (json) => {
        try {
          const data = typeof json === 'string' ? JSON.parse(json) : json
          if (!data || !Array.isArray(data.notes)) return 'Invalid backup file'
          set({
            workspace: data.workspace || defaultWorkspace,
            settings: { ...defaultSettings, ...(data.settings || {}) },
            categories: data.categories || [],
            notes: data.notes || [],
            reminders: data.reminders || [],
            customMenus: data.customMenus || [],
            xp: data.xp || 0,
            onboardingDone: true,
          })
          get().toast('World restored from backup', { type: 'ok' })
        } catch {
          return 'Could not parse file'
        }
      },
      resetAll: () => {
        set({
          onboardingDone: false, workspace: defaultWorkspace, settings: defaultSettings,
          categories: [], notes: [], reminders: [], customMenus: [], xp: 0, firedKeys: [],
          ui: { ...defaultUi },
        })
      },
    }),
    {
      name: 'haven-state',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({
        onboardingDone: s.onboardingDone, workspace: s.workspace, settings: s.settings,
        categories: s.categories, notes: s.notes, reminders: s.reminders,
        customMenus: s.customMenus, xp: s.xp, firedKeys: s.firedKeys,
      }),
    },
  ),
)

// ---------- selectors ----------
export const notesOfCategory = (notes, catId) => notes.filter((n) => n.categoryId === catId)
export const allAttachments = (notes) =>
  notes.flatMap((n) => n.attachments.map((a) => ({ ...a, kind: kindOfFile((a.type || '') + (a.name || '')), noteId: n.id, noteTitle: n.title, categoryId: n.categoryId })))
