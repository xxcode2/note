import React, { useEffect, useState, lazy, Suspense, Component } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from './store.js'
import { colorOf } from './lib/helpers.js'
import { startReminderEngine } from './lib/reminderEngine.js'
import VillageCanvas from './village/VillageCanvas.jsx'
import { TopBar, Sidebar, BottomNav } from './components/Nav.jsx'
import { SearchOverlay, QuickAdd } from './components/Overlays.jsx'
import { NoteEditor, NoteDetail } from './components/NoteModals.jsx'
import { CategoryBuilder, CategoryContent } from './components/CategoryModals.jsx'
import CategoryContentPage from './pages/CategoryFull.jsx'
import HoloNotes from './components/HoloNotes.jsx'
import WalkPrompt from './pages/WalkPrompt.jsx'
import Onboarding from './components/Onboarding.jsx'
import Toasts from './components/Toasts.jsx'
import { TodayDock, VillageTools, VillageScore, EmptyVillage } from './pages/VillageHud.jsx'

const AllNotes = lazy(() => import('./pages/Pages.jsx').then((m) => ({ default: m.AllNotes })))
const CategoriesPage = lazy(() => import('./pages/Pages.jsx').then((m) => ({ default: m.CategoriesPage })))
const CalendarPage = lazy(() => import('./pages/Calendar.jsx').then((m) => ({ default: m.CalendarPage })))
const RemindersPage = lazy(() => import('./pages/RemindersDocs.jsx').then((m) => ({ default: m.RemindersPage })))
const DocumentsPage = lazy(() => import('./pages/RemindersDocs.jsx').then((m) => ({ default: m.DocumentsPage })))
const Overview = lazy(() => import('./pages/Overview.jsx').then((m) => ({ default: m.default })))
const SettingsPage = lazy(() => import('./pages/Settings.jsx').then((m) => ({ default: m.default })))

/* Never let a lazy-route/deploy hiccup blank the whole app — show a recover card instead. */
class ErrorBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null } }
  static getDerivedStateFromError(err) { return { err } }
  componentDidCatch(err) { console.error('[App]', err) }
  render() {
    if (this.state.err) {
      return (
        <div className="card" style={{ maxWidth: 460, margin: '12vh auto', textAlign: 'center', padding: 28 }}>
          <div style={{ fontSize: 38, marginBottom: 8 }}>🛠️</div>
          <h2 style={{ margin: '0 0 6px' }}>Ada yang error</h2>
          <p className="muted" style={{ fontSize: 13, margin: '0 0 16px' }}>Data kamu tetap aman. Coba muat ulang halaman.</p>
          <button className="btn primary" onClick={() => location.reload()}>🔄 Muat ulang</button>
        </div>
      )
    }
    return this.props.children
  }
}

function useHydrated() {
  const [h, setH] = useState(useStore.persist.hasHydrated())
  useEffect(() => {
    if (!h) return useStore.persist.onFinishHydration(() => setH(true))
  }, [h])
  return h || useStore.persist.hasHydrated()
}

function useIsMobile() {
  const [m, setM] = useState(window.matchMedia('(max-width: 860px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)')
    const f = (e) => setM(e.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  return m
}

const pageMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { type: 'spring', stiffness: 320, damping: 32 },
}

export default function App() {
  const hydrated = useHydrated()
  const s = useStore()
  const isMobile = useIsMobile()
  const { route } = s.ui

  // theme
  useEffect(() => {
    const apply = () => {
      const t = s.settings.theme
      const auto = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      document.documentElement.dataset.theme = t === 'auto' ? auto : t
    }
    apply()
    if (s.settings.theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [s.settings.theme])

  // accent per focused area
  useEffect(() => {
    const cat = route.name === 'category' ? s.categories.find((c) => c.id === route.params.catId) : null
    document.documentElement.style.setProperty('--accent', cat ? colorOf(cat.color).hex : '#f5a524')
  }, [route, s.categories])

  // animations setting → body class
  useEffect(() => {
    document.body.classList.toggle('anim-off', s.settings.animations === 'off')
  }, [s.settings.animations])

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey
      const st = useStore.getState()
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); st.setUi({ searchOpen: true }) }
      else if (mod && e.key.toLowerCase() === 'n') { e.preventDefault(); st.setUi({ quickAddOpen: true }) }
      else if (e.key === 'Escape') {
        const u = st.ui
        if (u.detailNoteId) st.setUi({ detailNoteId: null })
        else if (u.docPreview) st.setUi({ docPreview: null })
        else if (u.editor.open) st.setUi({ editor: { open: false, noteId: null, defaults: {} } })
        else if (u.catEditor.open) st.setUi({ catEditor: { open: false, catId: null } })
        else if (u.searchOpen || u.quickAddOpen) st.setUi({ searchOpen: false, quickAddOpen: false })
        else if (u.route.name === 'category') st.navigate('village') // leave the building → back to your avatar (walk) if you entered on foot
        else if (u.walkMode) st.setUi({ walkMode: false, nearCatId: null, walkReturn: null })
        else st.setUi({ editingVillage: false })
      } else if ((e.key === 'e' || e.key === 'E') && st.ui.walkMode && st.ui.nearCatId) {
        st.setUi({ walkMode: false, nearCatId: null, walkReturn: st.ui.nearCatId })
        st.navigate('category', { catId: st.ui.nearCatId })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // reminder engine
  useEffect(() => startReminderEngine(useStore), [])

  if (!hydrated) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'var(--bg-0)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>🏡</div>
          <div className="muted small" style={{ marginTop: 8 }}>waking up your village…</div>
        </motion.div>
      </div>
    )
  }

  const wants3D = s.settings.enable3D && (route.name === 'village' || route.name === 'category')
  const show3D = wants3D && !s.onboardingDone ? true : wants3D // during onboarding the (empty) village is the backdrop
  const villagePage = route.name === 'village'
  const catFocus = route.name === 'category' ? s.categories.find((c) => c.id === route.params.catId) : null

  const wrap = (el, key) => (
    <motion.div key={k2(key)} {...pageMotion} style={{ height: '100%' }}>
      <div className="scroll-area">{el}</div>
    </motion.div>
  )
  const k2 = (k) => 'r-' + k

  const render2D = () => {
    switch (route.name) {
      case 'notes': return wrap(<AllNotes importantOnly={false} />, 'notes')
      case 'important': return wrap(<AllNotes importantOnly />, 'important')
      case 'calendar': return wrap(<CalendarPage />, 'cal')
      case 'reminders': return wrap(<RemindersPage />, 'rem')
      case 'documents': return wrap(<DocumentsPage />, 'docs')
      case 'categories': return wrap(<CategoriesPage />, 'cats')
      case 'overview': return wrap(<Overview />, 'ov')
      case 'settings': return wrap(<SettingsPage />, 'set')
      case 'category': return wrap(<CategoryContentPage catId={route.params.catId} />, 'cat-' + route.params.catId)
      default: return wrap(<TodayFallback />, 'today')
    }
  }

  return (
    <ErrorBoundary key={route.name}>
    <div className={'app' + (isMobile ? ' has-bottom' : '')}>
      {/* 3D stage */}
      {show3D && <div className="stage"><VillageCanvas /></div>}

      <div className="ui-layer">
        <TopBar />
        <div className="body-row">
          {!isMobile && <Sidebar />}
          <main className={'main' + (show3D ? ' transparent' : ' glass')}>
            {show3D ? (
              <div className="village-hud">
                <div style={{ flex: 1 }} />
                {villagePage && s.categories.length > 0 && !s.ui.walkMode && <VillageScore key="score" />}
                <AnimatePresence mode="wait">
                  {villagePage && s.categories.length === 0 && <EmptyVillage key="empty" />}
                  {villagePage && s.categories.length > 0 && !s.ui.walkMode && <TodayDock key="today" />}
                  {catFocus && (
                    <motion.div key={catFocus.id} className="holo-wrap"
                      initial={{ opacity: 0, y: 70, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 28 }}>
                      <HoloNotes catId={catFocus.id} />
                    </motion.div>
                  )}
                </AnimatePresence>
                {s.ui.walkMode && <WalkPrompt />}
                <VillageTools />
              </div>
            ) : (
              <Suspense fallback={<div className="pad muted small">loading…</div>}>
                <AnimatePresence mode="wait" initial={false}>{render2D()}</AnimatePresence>
              </Suspense>
            )}
          </main>
        </div>
      </div>

      {/* overlays */}
      <SearchOverlay />
      <QuickAdd />
      <NoteEditor />
      <NoteDetail />
      <CategoryBuilder />
      <Toasts />

      <AnimatePresence>
        {!s.onboardingDone && <Onboarding key="ob" />}
      </AnimatePresence>

      {isMobile && <BottomNav />}
    </div>
    </ErrorBoundary>
  )
}

/* 2D fallback when 3D is disabled — the Today dashboard as a page */
function TodayFallback() {
  const s = useStore()
  if (s.categories.length === 0 && s.notes.length === 0) {
    return (
      <div className="pad" style={{ display: 'grid', placeItems: 'center', minHeight: '100%' }}>
        <EmptyVillage />
      </div>
    )
  }
  return (
    <div className="pad" style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 430, maxWidth: '100%' }}><TodayDock /></div>
    </div>
  )
}
