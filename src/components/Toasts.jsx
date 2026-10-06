import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store.js'

export default function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  return (
    <div className="toast-stack">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            className={'toast ' + (t.type || '')}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onClick={() => dismiss(t.id)}
          >
            {t.type === 'xp' ? (
              <motion.span
                initial={{ display: 'inline-block' }}
                style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}
              >
                <motion.span
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.05 }}
                  style={{
                    width: 22, height: 22, borderRadius: 7, background: 'var(--ok)', color: '#0b1410',
                    display: 'inline-grid', placeItems: 'center', fontSize: 13, fontWeight: 900,
                  }}
                >✓</motion.span>
                {t.message}
              </motion.span>
            ) : (
              <>
                {t.message}
                {t.sub && <div className="sub">{t.sub}</div>}
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
