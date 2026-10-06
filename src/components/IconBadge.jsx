import React from 'react'
import { motion } from 'framer-motion'

/* A dimensional icon badge: the emoji sits on a soft gradient tile with an
   inner highlight, drop shadow and accent glow — so icons read as "real"
   objects instead of flat glyphs. `size` is the tile edge in px. */
export default function IconBadge({ icon = '📝', accent = '#f5a524', size = 44, float = false, complete = false, children }) {
  const fs = Math.round(size * 0.52)
  const tile = (
    <div
      className={'ico-badge' + (complete ? ' done' : '')}
      style={{
        width: size,
        height: size,
        fontSize: fs,
        '--a': accent,
        background: `linear-gradient(155deg, color-mix(in srgb, ${accent} 42%, #fff 4%), color-mix(in srgb, ${accent} 14%, transparent))`,
        boxShadow: `0 ${Math.round(size * 0.12)}px ${Math.round(size * 0.32)}px color-mix(in srgb, ${accent} 32%, transparent), inset 0 1px 0 rgba(255,255,255,.5)`,
      }}
    >
      <span className="ico-glyph">{complete ? '✓' : icon}</span>
      <span className="ico-sheen" />
    </div>
  )
  return float ? (
    <motion.div
      style={{ display: 'inline-grid', willChange: 'transform' }}
      animate={{ y: [0, -size * 0.09, 0] }}
      transition={{ duration: 3 + Math.random() * 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {tile}
    </motion.div>
  ) : (
    tile
  )
}
