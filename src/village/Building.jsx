import React, { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store.js'
import { colorOf, slotPosition, vibeFor } from '../lib/helpers.js'

/* ------------------------------------------------------------------ */
/* Procedural low-poly building models                                 */
/* ------------------------------------------------------------------ */

function Win({ pos, rot, size = [0.34, 0.34], glow, lit }) {
  return (
    <mesh position={pos} rotation={rot}>
      <boxGeometry args={[size[0], size[1], 0.05]} />
      <meshStandardMaterial
        color={lit ? glow : '#2a3646'}
        emissive={glow}
        emissiveIntensity={lit ? 1.4 : 0.06}
        roughness={0.3}
      />
    </mesh>
  )
}

function Door({ pos, rot, color = '#5a4634', h = 0.72 }) {
  return (
    <mesh position={pos} rotation={rot}>
      <boxGeometry args={[0.4, h, 0.06]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  )
}

function Roof({ pos, rot, type, color, args }) {
  if (type === 'pyramid')
    return (
      <mesh position={pos} rotation={rot || [0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[args[0], args[1], 4]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
    )
  if (type === 'gable')
    return (
      <mesh position={pos} rotation={[0, Math.PI / 2, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[args[0], args[0], args[1], 3]} />
        <meshStandardMaterial color={color} roughness={0.85} flatShading />
      </mesh>
    )
  // flat slab
  return (
    <mesh position={pos} castShadow>
      <boxGeometry args={[args[0], args[1] || 0.16, args[2]]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  )
}

export function BuildingModel({ type, palette, lit }) {
  const wall = palette.wall
  const roof = palette.roof
  const glow = palette.glow
  const accent = palette.hex
  const Box = (p, a, c, extra) => (
    <mesh position={p} castShadow receiveShadow {...extra}>
      <boxGeometry args={a} />
      <meshStandardMaterial color={c} roughness={0.82} flatShading />
    </mesh>
  )

  switch (type) {
    case 'house':
      return (
        <group>
          {Box([0, 0.6, 0], [1.9, 1.2, 1.6], wall)}
          <Roof pos={[0, 1.55, 0]} type="pyramid" color={roof} args={[1.55, 1.0]} />
          <Door pos={[0, 0.36, 0.83]} color="#6b4f38" />
          <Win pos={[-0.55, 0.78, 0.82]} glow={glow} lit={lit} />
          <Win pos={[0.55, 0.78, 0.82]} glow={glow} lit={lit} />
          {/* chimney */}
          {Box([0.55, 1.6, -0.3], [0.26, 0.5, 0.26], '#7d6a58')}
        </group>
      )
    case 'civic':
      return (
        <group>
          {Box([0, 0.08, 0], [2.6, 0.18, 2.2], '#cfd6de')}
          {Box([0, 0.85, 0], [2.1, 1.4, 1.7], wall)}
          {[[-0.85, 0.35], [-0.29, 0.35], [0.29, 0.35], [0.85, 0.35]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.75, 0.92]} castShadow>
              <cylinderGeometry args={[0.09, 0.11, 1.3, 8]} />
              <meshStandardMaterial color="#e9e4d8" flatShading />
            </mesh>
          ))}
          {Box([0, 1.66, 0], [2.3, 0.14, 1.85], '#d9d2c2')}
          <Roof pos={[0, 1.95, 0]} rot={[0, Math.PI / 2, 0]} type="pyramid" color={roof} args={[1.35, 0.55]} />
          <Win pos={[0, 1.05, 0.88]} glow={glow} lit={lit} size={[0.9, 0.28]} />
          <mesh position={[0, 2.35, 0]}>
            <sphereGeometry args={[0.14, 10, 10]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={lit ? 1.2 : 0.25} />
          </mesh>
        </group>
      )
    case 'hospital':
      return (
        <group>
          {Box([0, 0.8, 0], [2.0, 1.6, 1.6], '#f0efe9')}
          {Box([0.62, 1.9, 0], [0.8, 0.7, 1.2], '#e8e7e1')}
          {Box([0, 1.75, 0.83], [0.5, 0.5, 0.06], '#fff')}
          <mesh position={[0, 1.75, 0.87]}>
            <boxGeometry args={[0.34, 0.11, 0.04]} />
            <meshStandardMaterial color="#e0556f" emissive="#e0556f" emissiveIntensity={lit ? 0.8 : 0.2} />
          </mesh>
          <mesh position={[0, 1.75, 0.87]}>
            <boxGeometry args={[0.11, 0.34, 0.04]} />
            <meshStandardMaterial color="#e0556f" emissive="#e0556f" emissiveIntensity={lit ? 0.8 : 0.2} />
          </mesh>
          {Box([0, 2.28, 0], [2.2, 0.14, 1.8], '#d5d3ca')}
          {[-0.5, 0.5].map((x, i) => <Win key={i} pos={[x, 0.95, 0.82]} glow="#cfe6ff" lit={lit} />)}
          <Door pos={[-0.02, 0.4, 0.83]} color="#9fb6c9" />
        </group>
      )
    case 'office':
      return (
        <group>
          {Box([0, 1.05, 0], [1.7, 2.1, 1.5], '#c9d4df')}
          {Box([0.35, 2.35, -0.15], [0.8, 0.5, 1.0], '#b3bfcc')}
          {Box([0, 2.16, 0], [1.85, 0.1, 1.65], roof)}
          {[0.45, 0.95, 1.45].map((y, r) =>
            [-0.45, 0.45].map((x, c) => <Win key={`${r}-${c}`} pos={[x, y, 0.77]} glow={glow} lit={lit && (r + c) % 3 !== 0} size={[0.5, 0.34]} />))}
          {Box([0, 0.35, 0.79], [0.6, 0.7, 0.06], '#3e4c5a')}
        </group>
      )
    case 'bank':
      return (
        <group>
          {Box([0, 0.7, 0], [2.2, 1.4, 1.7], wall)}
          {[[-0.85], [-0.3], [0.3], [0.85]].map(([x], i) => (
            <mesh key={i} position={[x, 0.75, 0.95]} castShadow>
              <cylinderGeometry args={[0.1, 0.12, 1.5, 8]} />
              <meshStandardMaterial color="#efe8d8" flatShading />
            </mesh>
          ))}
          {Box([0, 1.52, 0], [2.4, 0.18, 1.9], '#e5dcc8')}
          <mesh position={[0, 2.0, 0]} castShadow>
            <sphereGeometry args={[0.62, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          <mesh position={[0, 2.75, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#ffd76e" emissive="#ffd76e" emissiveIntensity={lit ? 1.3 : 0.3} metalness={0.6} roughness={0.3} />
          </mesh>
          <Win pos={[0, 0.85, 0.87]} glow={glow} lit={lit} size={[1.1, 0.5]} />
        </group>
      )
    case 'school':
      return (
        <group>
          {Box([0, 0.6, 0], [2.6, 1.2, 1.3], wall)}
          <Roof pos={[0, 1.42, 0]} type="gable" color={roof} args={[0.78, 2.7]} rot={[0, 0, 0]} />
          {Box([-1.35, 0.85, 0], [0.7, 1.7, 1.1], wall)}
          <Roof pos={[-1.35, 1.9, 0]} type="pyramid" color={roof} args={[0.62, 0.6]} />
          <mesh position={[-1.35, 1.75, 0.5]}><sphereGeometry args={[0.12, 8, 8]} /><meshStandardMaterial color="#d9a441" metalness={0.5} roughness={0.4} /></mesh>
          {[-0.7, 0, 0.7].map((x, i) => <Win key={i} pos={[x, 0.72, 0.68]} glow={glow} lit={lit} size={[0.4, 0.4]} />)}
          <Door pos={[0.35, 0.35, 0.68]} />
        </group>
      )
    case 'warehouse':
      return (
        <group>
          {Box([0, 0.55, 0], [2.4, 1.1, 1.6], wall)}
          <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.8, 0.8, 2.4, 12, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          {Box([0, 0.5, 0.82], [1.2, 1.0, 0.06], '#8b8f96')}
          {Box([0, 0.5, 0.85], [1.2, 0.06, 0.03], roof)}
          <Win pos={[-0.85, 0.75, 0.82]} glow={glow} lit={lit} size={[0.3, 0.3]} />
          <Win pos={[0.85, 0.75, 0.82]} glow={glow} lit={lit} size={[0.3, 0.3]} />
        </group>
      )
    case 'shop':
      return (
        <group>
          {Box([0, 0.6, 0], [1.7, 1.2, 1.3], wall)}
          {Box([0, 1.32, 0], [1.9, 0.14, 1.5], roof)}
          {/* awning */}
          <mesh position={[0, 1.05, 0.85]} rotation={[0.5, 0, 0]} castShadow>
            <boxGeometry args={[1.7, 0.05, 0.6]} />
            <meshStandardMaterial color={accent} />
          </mesh>
          {Box([0, 0.35, 0.67], [0.9, 0.7, 0.05], '#4a3f36')}
          <Win pos={[-0.5, 0.72, 0.68]} glow={glow} lit={lit} size={[0.55, 0.5]} />
          <Win pos={[0.5, 0.72, 0.68]} glow={glow} lit={lit} size={[0.55, 0.5]} />
          <mesh position={[0, 1.6, 0]}><sphereGeometry args={[0.16, 8, 8]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={lit ? 1 : 0.2} /></mesh>
        </group>
      )
    case 'tower':
      return (
        <group>
          {Box([0, 1.1, 0], [1.0, 2.2, 1.0], wall)}
          {Box([0, 2.45, 0], [1.2, 0.24, 1.2], roof)}
          {Box([0, 2.85, 0], [0.55, 0.6, 0.55], wall)}
          <Roof pos={[0, 3.35, 0]} type="pyramid" color={accent} args={[0.55, 0.55]} />
          {[0.6, 1.2, 1.8, 2.55].map((y, i) => <Win key={i} pos={[0, y, 0.53]} glow={glow} lit={lit} size={[0.5, 0.2]} />)}
          <mesh position={[0, 3.9, 0]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshStandardMaterial color="#ff5f6d" emissive="#ff5f6d" emissiveIntensity={lit ? 1.6 : 0.7} />
          </mesh>
        </group>
      )
    case 'garage':
      return (
        <group>
          {Box([0, 0.5, 0], [2.0, 1.0, 1.4], wall)}
          <mesh position={[0, 1.06, 0]} rotation={[0, 0, 0]} castShadow>
            <boxGeometry args={[2.15, 0.12, 1.55]} />
            <meshStandardMaterial color={roof} />
          </mesh>
          {Box([0, 0.45, 0.72], [1.3, 0.8, 0.05], '#7f8a94')}
          {[0.2, 0.45, 0.7].map((y, i) => (
            <mesh key={i} position={[0, y, 0.75]}><boxGeometry args={[1.3, 0.03, 0.02]} /><meshStandardMaterial color="#5c6672" /></mesh>
          ))}
          {/* little car */}
          {Box([-1.45, 0.16, 0.2], [0.7, 0.22, 0.36], accent)}
          {Box([-1.45, 0.32, 0.2], [0.36, 0.16, 0.32], accent)}
        </group>
      )
    case 'library':
      return (
        <group>
          {Box([0, 0.7, 0], [2.2, 1.4, 1.6], wall)}
          {[[-0.9], [-0.3], [0.3], [0.9]].map(([x], i) => (
            <mesh key={i} position={[x, 0.75, 0.92]} castShadow>
              <cylinderGeometry args={[0.09, 0.1, 1.4, 8]} />
              <meshStandardMaterial color="#e7ddc9" flatShading />
            </mesh>
          ))}
          {Box([0, 1.5, 0], [2.45, 0.14, 1.85], '#dcd2bd')}
          <Roof pos={[0, 1.85, 0]} rot={[0, Math.PI / 2, 0]} type="pyramid" color={roof} args={[1.3, 0.5]} />
          <Win pos={[0, 0.85, 0.83]} glow={glow} lit={lit} size={[1.2, 0.7]} />
          {/* books on top */}
          {Box([0.7, 1.75, -0.5], [0.16, 0.24, 0.12], accent)}
          {Box([0.88, 1.73, -0.5], [0.14, 0.2, 0.12], '#6f86c9')}
        </group>
      )
    case 'star':
      return (
        <group>
          <mesh position={[0, 0.1, 0]} receiveShadow>
            <cylinderGeometry args={[1.35, 1.5, 0.2, 10]} />
            <meshStandardMaterial color="#dfd8c6" flatShading />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[Math.cos((i / 4) * Math.PI * 2) * 1.0, 0.85, Math.sin((i / 4) * Math.PI * 2) * 1.0]} castShadow>
              <cylinderGeometry args={[0.05, 0.07, 1.5, 6]} />
              <meshStandardMaterial color={wall} />
            </mesh>
          ))}
          <mesh position={[0, 1.9, 0]} castShadow>
            <coneGeometry args={[1.6, 0.8, 10]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          <FloatingStar color={accent} glow={glow} lit={lit} />
        </group>
      )
    default:
      return (
        <group>
          {Box([0, 0.6, 0], [1.6, 1.2, 1.4], wall)}
          {Box([0, 1.3, 0], [1.75, 0.16, 1.55], roof)}
          <Win pos={[0, 0.7, 0.72]} glow={glow} lit={lit} />
          <Door pos={[0.45, 0.35, 0.72]} />
        </group>
      )
  }
}

function FloatingStar({ color, glow, lit }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.8
      ref.current.position.y = 1.15 + Math.sin(clock.elapsedTime * 1.6) * 0.12
    }
  })
  return (
    <mesh ref={ref} position={[0, 1.15, 0]}>
      <octahedronGeometry args={[0.34, 0]} />
      <meshStandardMaterial color={color} emissive={glow} emissiveIntensity={lit ? 1.5 : 0.5} flatShading />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/* Interactive wrapper: hover, label, click, drag (edit mode)          */
/* ------------------------------------------------------------------ */

export default function Building({ cat, stats, editable }) {
  const navigate = useStore((s) => s.navigate)
  const setUi = useStore((s) => s.setUi)
  const updateCategory = useStore((s) => s.updateCategory)
  const environment = useStore((s) => s.settings.environment)
  const walkMode = useStore((s) => s.ui.walkMode)
  const isNear = useStore((s) => s.ui.walkMode && s.ui.nearCatId === cat.id)
  const groupRef = useRef()
  const ringRef = useRef()
  const flagRef = useRef()
  const beaconRef = useRef()
  const [hovered, setHovered] = useState(false)
  const drag = useRef(false)
  const moved = useRef(false)
  const grown = useRef(0)
  const emerge = useRef(0)
  const palette = useMemo(() => colorOf(cat.building?.color || cat.color), [cat])
  const night = environment === 'night'
  const lit = hovered || night || (editable && drag.current) || isNear
  const pos = cat.building?.position || slotPosition(cat.building?.slot ?? 0)
  // face the plaza centre by default so every door/sign reads from the middle of the village
  const rot = cat.building?.rotation ?? (Math.hypot(pos[0], pos[1]) > 0.6 ? Math.atan2(-pos[0], -pos[1]) : 0)
  const topY = cat.building?.type === 'tower' ? 4.5 : 3.05
  const boardW = Math.min(4.2, Math.max(1.4, (cat.name || '').length * 0.2 + 0.9))
  const vibe = useMemo(() => vibeFor(stats), [stats])
  const ringHex = vibe.overdue ? '#ff5f6d' : vibe.allDone ? '#7de39a' : palette.hex

  useFrame(({ clock }, dt) => {
    const g = groupRef.current
    if (!g) return
    // spring hover scale + grow-in from the ground (ease-out back)
    const target = (hovered && !editable) || isNear ? 1.06 : 1
    grown.current = THREE.MathUtils.damp(grown.current, target, 8, dt)
    emerge.current = Math.min(1, emerge.current + dt / 0.7)
    const t = emerge.current
    const back = 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2)
    g.scale.setScalar(Math.max(0.001, grown.current * back))
    if (ringRef.current && isNear) {
      const p = 0.5 + Math.sin(clock.elapsedTime * 3.4) * 0.28
      ringRef.current.material.opacity = p
      ringRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3.4) * 0.05)
    }
    if (flagRef.current) flagRef.current.rotation.y = Math.sin(clock.elapsedTime * 1.7) * 0.22
    if (beaconRef.current) {
      const p = 0.55 + Math.sin(clock.elapsedTime * 4.2) * 0.45
      beaconRef.current.material.opacity = p
      beaconRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 4.2) * 0.18)
    }
  })

  const onMove = (e) => {
    if (!drag.current || !editable) return
    e.stopPropagation()
    const t = -e.ray.origin.y / e.ray.direction.y
    if (t > 0) {
      const x = e.ray.origin.x + e.ray.direction.x * t
      const z = e.ray.origin.z + e.ray.direction.z * t
      const cx = THREE.MathUtils.clamp(x, -20, 20)
      const cz = THREE.MathUtils.clamp(z, -20, 20)
      moved.current = true
      // avoid the plaza
      if (Math.hypot(cx - 0.2, cz + 0.6) > 3.4) updateCategory(cat.id, { building: { ...cat.building, position: [cx, cz] } })
    }
  }

  return (
    <group
      ref={groupRef}
      position={[pos[0], 0, pos[1]]}
      rotation={[0, rot, 0]}
      onPointerOver={(e) => { e.stopPropagation(); if (!editable) { setHovered(true); document.body.style.cursor = 'pointer' } }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = '' }}
      onPointerDown={(e) => {
        if (!editable) return
        e.stopPropagation()
        drag.current = true
        e.target.setPointerCapture?.(e.pointerId)
      }}
      onPointerMove={onMove}
      onPointerUp={(e) => {
        if (editable && drag.current) {
          drag.current = false
          e.target.releasePointerCapture?.(e.pointerId)
        }
      }}
      onClick={(e) => {
        if (editable) {
          // a real drag shouldn't also open the panel — only a clean click does
          if (moved.current) { moved.current = false; return }
          e.stopPropagation()
          setUi({ catEditor: { open: true, catId: cat.id } })
          return
        }
        e.stopPropagation()
        if (walkMode) setUi({ walkMode: false, nearCatId: null, walkReturn: cat.id })
        navigate('category', { catId: cat.id })
      }}
    >
      <BuildingModel type={cat.building?.type || 'house'} palette={palette} lit={lit} />
      {/* growth & mood decorations driven by the area's note progress */}
      <group>
        {vibe.tier >= 1 && [[0.95, 1.15], [-0.95, 1.15]].map(([x, z], i) => (
          <group key={`fb${i}`} position={[x, 0, z]}>
            <mesh position={[0, 0.12, 0]} castShadow><boxGeometry args={[0.5, 0.24, 0.3]} /><meshStandardMaterial color="#6b4f38" roughness={0.9} flatShading /></mesh>
            {[-0.14, 0, 0.14].map((bx, j) => (
              <mesh key={j} position={[bx, 0.3, 0]}><sphereGeometry args={[0.08, 8, 8]} /><meshStandardMaterial color={j % 2 ? palette.hex : palette.glow} emissive={palette.glow} emissiveIntensity={0.25} flatShading /></mesh>
            ))}
          </group>
        ))}
        {vibe.tier >= 2 && [[1.25, 1.05], [-1.25, 1.05]].map(([x, z], i) => (
          <group key={`ln${i}`} position={[x, 0, z]}>
            <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.02, 0.03, 1.0, 6]} /><meshStandardMaterial color="#3a332b" /></mesh>
            <mesh position={[0, 1.0, 0]}><sphereGeometry args={[0.11, 10, 10]} /><meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={lit ? 1.5 : 0.8} /></mesh>
          </group>
        ))}
        {(vibe.allDone || vibe.tier >= 3) && (
          <group ref={flagRef} position={[-1.15, 0, 1.0]}>
            <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.025, 0.025, 1.8, 6]} /><meshStandardMaterial color="#caa96a" metalness={0.4} roughness={0.5} /></mesh>
            <mesh position={[0.32, 1.62, 0]}><planeGeometry args={[0.62, 0.4]} /><meshStandardMaterial color={palette.hex} emissive={palette.hex} emissiveIntensity={0.3} side={THREE.DoubleSide} flatShading /></mesh>
            <mesh position={[0, 1.82, 0]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#ffe08a" emissive="#ffe08a" emissiveIntensity={1} /></mesh>
          </group>
        )}
        {vibe.overdue && (
          <mesh ref={beaconRef} position={[0, topY - 1.5, 0]}>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshBasicMaterial color="#ff5f6d" transparent opacity={0.7} />
          </mesh>
        )}
      </group>
      {/* footprint disc highlights hover / mood */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.9, 2.12, 40]} />
        <meshBasicMaterial color={ringHex} transparent opacity={hovered || editable ? (drag.current ? 0.9 : 0.45) : isNear ? 0.5 : vibe.overdue ? 0.3 : vibe.allDone ? 0.22 : 0} />
      </mesh>
      {/* pulsing "come in" ring when the player is near in walk mode */}
      {isNear && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[2.3, 2.6, 44]} />
          <meshBasicMaterial color={palette.glow} transparent opacity={0.6} />
        </mesh>
      )}
      {/* permanent dimensional name sign hovering over the building */}
      {cat.name && !(hovered && !walkMode) && !isNear && (
        <Billboard position={[0, topY, 0]} follow>
          <mesh position={[0, 0, -0.02]}>
            <planeGeometry args={[boardW, 0.66]} />
            <meshBasicMaterial color={palette.hex} transparent opacity={0.22} />
          </mesh>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[boardW - 0.12, 0.54]} />
            <meshBasicMaterial color="#141b26" transparent opacity={0.82} />
          </mesh>
          <Text
            value={cat.name}
            fontSize={0.3}
            color="#f4f7ff"
            anchorX="center"
            anchorY="middle"
            maxWidth={boardW - 0.2}
            outlineWidth={0.012}
            outlineColor="#0b1220"
            position={[0, 0, 0.01]}
          />
        </Billboard>
      )}
      {((hovered && !walkMode) || editable || isNear) && !drag.current && (
        <Html position={[0, cat.building?.type === 'tower' ? 4.4 : 2.9, 0]} center distanceFactor={16} zIndexRange={[10, 0]}>
          <div className="bld-label">
            <div className="lb">
              <b>{cat.icon} {cat.name}</b>
              <div className="row"><span>{stats.total} Notes</span><span>{Math.round(vibe.ratio * 100)}% · ⭐ {stats.imp}</span></div>
              <div className="row"><span className="muted">{stats.soon} upcoming</span><span className="muted">{editable ? 'drag to move · click to edit' : isNear ? 'click / E to enter' : 'click to open'}</span></div>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
