import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

export function Modal({ open, onClose, children, wide }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
        >
          <motion.div
            className={'modal' + (wide ? ' wide' : '')}
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function Seg({ options, value, onChange, labels }) {
  return (
    <div className="seg">
      {options.map((o, i) => (
        <button key={o} type="button" className={value === o ? 'sel' : ''} onClick={() => onChange(o)}>
          {labels ? labels[i] : o}
        </button>
      ))}
    </div>
  )
}

export function Switch({ on, onChange }) {
  return (
    <div className={'switch' + (on ? ' on' : '')} role="switch" aria-checked={on} onClick={() => onChange(!on)} style={{ flexShrink: 0 }}>
      <i />
    </div>
  )
}

export function Chip({ children, dot, className = '', ...rest }) {
  return (
    <span className={'chip ' + className} {...rest}>
      {dot && <i className="dot" style={{ background: dot }} />}
      {children}
    </span>
  )
}

export function ColorSwatches({ value, onChange }) {
  const keys = ['amber', 'blue', 'green', 'violet', 'rose', 'cyan', 'slate', 'lime']
  const hex = { amber: '#f5a524', blue: '#4ea1ff', green: '#53c99a', violet: '#a78bfa', rose: '#f2789f', cyan: '#45c4d6', slate: '#8fa3bf', lime: '#a3d952' }
  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
      {keys.map((k) => (
        <div key={k} className={'swatch' + (value === k ? ' sel' : '')} style={{ background: hex[k] }} onClick={() => onChange(k)} title={k} />
      ))}
    </div>
  )
}

export function EmojiPick({ options, value, onChange }) {
  return (
    <div className="emoji-pick">
      {options.map((e) => (
        <button type="button" key={e} className={value === e ? 'sel' : ''} onClick={() => onChange(e)}>{e}</button>
      ))}
    </div>
  )
}

export function Empty({ emoji, title, text, action }) {
  return (
    <motion.div className="empty" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
      <div className="e-emoji">{emoji}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </motion.div>
  )
}
