import React from 'react'

// Small SVG silhouette preview of each building type (used in the builder UI)
const SHAPES = {
  house: 'M12 30 L12 16 L24 7 L36 16 L36 30 Z M20 30 L20 22 L28 22 L28 30 Z',
  civic: 'M8 30 L8 14 L24 6 L40 14 L40 30 Z M14 30 L14 18 M24 30 L24 18 M34 30 L34 18',
  hospital: 'M10 30 L10 10 L38 10 L38 30 Z M24 14 L24 22 M20 18 L28 18',
  office: 'M14 30 L14 6 L34 6 L34 30 Z M18 10 L22 10 M26 10 L30 10 M18 16 L22 16 M26 16 L30 16 M18 22 L22 22 M26 22 L30 22',
  bank: 'M8 30 L8 16 L24 8 L40 16 L40 30 Z M13 30 L13 18 M21 30 L21 18 M29 30 L29 18 M37 30 L37 18',
  school: 'M6 30 L6 16 L24 8 L42 16 L42 30 Z M22 14 A2.4 2.4 0 1 1 26 14 L26 18 L22 18 Z',
  warehouse: 'M6 30 L6 16 Q24 4 42 16 L42 30 Z M18 30 L18 20 L30 20 L30 30 Z',
  shop: 'M10 30 L10 14 L38 14 L38 30 Z M8 14 L40 14 M14 14 L14 9 L20 9 L20 14 M20 14 L20 9 L26 9 L26 14 M26 14 L26 9 L32 9 L32 14 M32 14 L32 9 L38 9 L38 14',
  tower: 'M18 30 L18 8 L30 8 L30 30 Z M24 8 L24 3 M20 14 L28 14 M20 20 L28 20',
  garage: 'M8 30 L8 18 L24 12 L40 18 L40 30 Z M15 30 L15 21 L33 21 L33 30 M15 24 L33 24 M15 27 L33 27',
  library: 'M8 30 L8 15 L24 7 L40 15 L40 30 Z M13 30 L13 19 M19 30 L19 19 M29 30 L29 19 M35 30 L35 19',
  star: 'M24 6 L27 15 L36 15 L29 21 L32 30 L24 24 L16 30 L19 21 L12 15 L21 15 Z',
}

export default function BuildingModel({ type, palette, lit, scale = 34 }) {
  const path = SHAPES[type] || SHAPES.house
  return (
    <svg width={scale * 2.6} height={scale * 2.2} viewBox="0 0 48 36" fill="none" style={{ overflow: 'visible' }}>
      <path d={path} stroke={palette.hex} strokeWidth="1.6" fill={palette.soft} strokeLinejoin="round" strokeLinecap="round" />
      {lit && <circle cx="24" cy="3" r="1.6" fill={palette.glow} opacity="0.9" />}
    </svg>
  )
}
