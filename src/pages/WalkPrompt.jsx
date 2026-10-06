import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store.js'
import { colorOf } from '../lib/helpers.js'

/* Floating control hint shown while you wander the village in third person.
   When you stand next to a building it offers an Enter action. */
export default function WalkPrompt() {
  const s = useStore()
  const near = s.ui.nearCatId ? s.categories.find((c) => c.id === s.ui.nearCatId) : null
  const exit = () => s.setUi({ walkMode: false, nearCatId: null })
  const enter = () => { s.setUi({ walkMode: false, nearCatId: null, walkReturn: near.id }); s.navigate('category', { catId: near.id }) }
  const accent = near ? colorOf(near.color).hex : 'var(--accent)'

  return (
    <motion.div
      className="walk-prompt"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
    >
      <AnimatePresence mode="wait">
        {near ? (
          <motion.div
            key={near.id}
            className="wp-enter glass"
            style={{ '--a': accent }}
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
          >
            <span className="wp-ico">{near.icon}</span>
            <div className="wp-txt">
              <b>{near.name}</b>
              <small>langkahmu sampai di depan pintu</small>
            </div>
            <button className="btn sm primary" onClick={enter}>🚪 Masuk <span className="kbd" style={{ marginLeft: 6 }}>E</span></button>
          </motion.div>
        ) : (
          <motion.div
            key="ctrl"
            className="wp-hint glass"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
          >
            <span className="wp-k"><span className="kbd">W A S D</span> / <span className="kbd">↑←↓→</span></span>
            <span className="wp-sep">·</span>
            <span>atau <b>klik tanah</b> untuk berjalan</span>
            <span className="wp-sep">·</span>
            <span>dekati bangunan untuk masuk</span>
            <button className="btn sm ghost" onClick={exit} style={{ marginLeft: 8 }}>✕ Keluar</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
