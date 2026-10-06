import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store.js'
import { BUILDING_TYPES, colorOf } from '../lib/helpers.js'
import { ColorSwatches, EmojiPick } from './Kit.jsx'
import BuildingPreview from './Building3DPreview.jsx'

const STEPS = ['workspace', 'category', 'building', 'note', 'done']

export default function Onboarding() {
  const s = useStore()
  const [step, setStep] = useState(0)
  const [f, setF] = useState({
    ws: 'My Haven', village: 'Havenwood', avatar: '🧑‍🌾',
    cat: '', desc: '', icon: '🌿', color: 'amber', building: 'house',
    note: '',
  })
  const set = (p) => setF((v) => ({ ...v, ...p }))
  const palette = colorOf(f.color)
  const canNext = [f.ws.trim(), f.cat.trim(), true, true, true][step]

  const finish = () => {
    const catId = s.addCategory({ name: f.cat.trim(), description: f.desc, icon: f.icon, color: f.color, building: f.building })
    if (f.note.trim()) s.addNote({ title: f.note.trim(), categoryId: catId })
    s.updateWorkspace({ name: f.ws.trim(), villageName: f.village.trim() || 'Havenwood', avatar: f.avatar })
    // cinematic: brief white glow handled by exit animation; camera flies in from home
    s.finishOnboarding({})
    s.navigate('category', { catId })
    setTimeout(() => s.navigate('village'), 2400) // let them see the new building, then pull back
  }

  return (
    <motion.div
      className="ob-wrap"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
      style={{ background: 'radial-gradient(120% 120% at 50% 10%, rgba(60,80,120,.35), transparent), var(--bg-0)' }}
    >
      <div className="ob-card glass">
        <div className="ob-steps">{STEPS.map((_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 34 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -34 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            {step === 0 && (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Welcome to your personal world 🌏</h2>
                <p className="muted" style={{ marginBottom: 20 }}>Not an app — a quiet place that holds everything: documents, work, health, money, ideas.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <label className="field"><span className="lbl">Name your workspace</span>
                    <input autoFocus value={f.ws} onChange={(e) => set({ ws: e.target.value })} placeholder="My Haven" /></label>
                  <label className="field"><span className="lbl">Name your village</span>
                    <input value={f.village} onChange={(e) => set({ village: e.target.value })} placeholder="Havenwood" /></label>
                  <div>
                    <div className="lbl muted small" style={{ marginBottom: 6, fontWeight: 700 }}>You, wandering inside it</div>
                    <div className="emoji-pick">
                      {['🧑‍🌾', '👤', '🧑‍💻', '🦊', '🐻', '🧙'].map((e) => (
                        <button key={e} className={f.avatar === e ? 'sel' : ''} onClick={() => set({ avatar: e })}>{e}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>Create your first area</h2>
                <p className="muted small" style={{ marginBottom: 14 }}>An area becomes a building in your village — administration, health, work… anything.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <label className="field"><span className="lbl">What area of your life is this?</span>
                    <input autoFocus value={f.cat} onChange={(e) => set({ cat: e.target.value })} placeholder="e.g. Administrasi, BPJS, Pekerjaan…" /></label>
                  <label className="field"><span className="lbl">One-line description (optional)</span>
                    <input value={f.desc} onChange={(e) => set({ desc: e.target.value })} placeholder="Semua urusan dokumen dan administrasi" /></label>
                  <div>
                    <div className="lbl muted small" style={{ marginBottom: 6, fontWeight: 700 }}>Icon</div>
                    <EmojiPick options={['📄', '🏥', '🏢', '💰', '🚗', '📦', '⭐', '📚', '🌿', '🎯']} value={f.icon} onChange={(icon) => set({ icon })} />
                  </div>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>Choose its building</h2>
                <div style={{ display: 'grid', placeItems: 'center', padding: '8px 0 14px' }}>
                  <motion.div key={f.building + f.color} initial={{ y: 18, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
                    <BuildingPreview type={f.building} palette={palette} lit scale={46} />
                  </motion.div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
                  {BUILDING_TYPES.slice(0, 9).map((b) => (
                    <span key={b.id} className={'chip pick' + (f.building === b.id ? ' sel' : '')} style={{ justifyContent: 'center' }} onClick={() => set({ building: b.id })}>{b.icon} {b.label}</span>
                  ))}
                </div>
                <ColorSwatches value={f.color} onChange={(color) => set({ color })} />
              </>
            )}
            {step === 3 && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>Write your first note</h2>
                <p className="muted small" style={{ marginBottom: 14 }}>One thing you don’t want to forget. You can add details later.</p>
                <input autoFocus value={f.note} onChange={(e) => set({ note: e.target.value })} placeholder="e.g. Perpanjang KTP sebelum akhir bulan" style={{ fontSize: 16, padding: '13px 15px' }} />
                <div className="muted small" style={{ marginTop: 12 }}>Tip: you can also press <span className="kbd">Ctrl K</span> anytime, or <span className="kbd">Ctrl N</span> for a lightning-fast note.</div>
              </>
            )}
            {step === 4 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>{f.icon}</div>
                <h2 style={{ fontSize: 21, fontWeight: 800 }}><b>{f.cat}</b> is being built…</h2>
                <p className="muted" style={{ margin: '10px 0 22px' }}>Your village will grow around whatever matters to you. Everything can be changed later.</p>
                <button className="btn ghost sm" onClick={() => { s.loadDemo(); s.finishOnboarding({}) }}>or explore the full sample village instead</button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div style={{ display: 'flex', marginTop: 26, gap: 10 }}>
          {step > 0 && <button className="btn ghost" onClick={() => setStep(step - 1)}>← Back</button>}
          <div style={{ flex: 1 }} />
          {step < 4 && <button className="btn primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Continue →</button>}
          {step === 4 && <button className="btn primary" onClick={finish}>🏡 Enter my village</button>}
        </div>
      </div>
    </motion.div>
  )
}
