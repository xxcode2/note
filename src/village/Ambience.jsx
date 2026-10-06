import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function rng(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

/* ---------------- Trees with gentle sway ---------------- */
export function Trees({ night }) {
  const group = useRef()
  const trees = useMemo(() => {
    const r = rng(7)
    const out = []
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2
      const d = 6 + r() * 19
      const x = Math.cos(a) * d, z = Math.sin(a) * d
      if (x > 9 && z > -6) continue
      out.push({ x, z, h: 1.3 + r() * 1.6, w: 0.6 + r() * 0.5, kind: r(), ph: r() * 6 })
    }
    return out
  }, [])
  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    group.current.children.forEach((tree, i) => {
      const d = trees[i]
      if (!d) return
      tree.rotation.z = Math.sin(t * 0.7 + d.ph) * 0.03
      tree.rotation.x = Math.cos(t * 0.5 + d.ph) * 0.02
    })
  })
  return (
    <group ref={group}>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.h * 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.14, t.h * 0.56, 6]} />
            <meshStandardMaterial color={night ? '#3a2f26' : '#6b4f38'} roughness={1} flatShading />
          </mesh>
          {t.kind < 0.5 ? (
            <>
              <mesh position={[0, t.h * 0.72, 0]} castShadow>
                <coneGeometry args={[t.w, t.h * 0.7, 7]} />
                <meshStandardMaterial color={night ? '#22443a' : '#4d8a5e'} roughness={1} flatShading />
              </mesh>
              <mesh position={[0, t.h * 1.08, 0]} castShadow>
                <coneGeometry args={[t.w * 0.72, t.h * 0.5, 7]} />
                <meshStandardMaterial color={night ? '#27504a' : '#5c9c6c'} roughness={1} flatShading />
              </mesh>
            </>
          ) : (
            <mesh position={[0, t.h * 0.85, 0]} castShadow>
              <icosahedronGeometry args={[t.w * 1.05, 1]} />
              <meshStandardMaterial color={night ? '#2a4c40' : '#5f9a62'} roughness={1} flatShading />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

/* ---------------- Street lights ---------------- */
export function StreetLights({ count = 6, night, enabled }) {
  const spots = useMemo(() => {
    const out = []
    const r = rng(21)
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + r() * 0.4
      const d = 4.6 + r() * 5
      out.push([Math.cos(a) * d, Math.sin(a) * d])
    }
    return out
  }, [count])
  const glows = useRef([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    glows.current.forEach((m, i) => {
      if (m) m.material.emissiveIntensity = (night ? 1.9 : 0.35) + Math.sin(t * 2.2 + i * 1.7) * (night ? 0.18 : 0.05)
    })
  })
  if (!enabled) return null
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.05, 1.6, 6]} />
            <meshStandardMaterial color="#3d4652" />
          </mesh>
          <mesh ref={(el) => (glows.current[i] = el)} position={[0, 1.66, 0]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshStandardMaterial color="#ffe9b8" emissive="#ffce6b" emissiveIntensity={night ? 2 : 0.3} />
          </mesh>
          {night && i < 3 && <pointLight position={[x, 1.8, z]} color="#ffce8a" intensity={7} distance={7} decay={2} />}
        </group>
      ))}
    </group>
  )
}

/* ---------------- NPC walking the village loop ---------------- */
const NPC_PATH = [
  [-3.4, -3.2], [3.2, -3.6], [6.2, 1.4], [2.8, 5.4], [-2.6, 5.2], [-5.8, 1.2],
]
export function NPC({ speed = 0.35, color = '#e8b25c' }) {
  const ref = useRef()
  const state = useRef({ seg: 0, t: 0 })
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const s = state.current
    s.t += dt * speed
    if (s.t >= 1) { s.t = 0; s.seg = (s.seg + 1) % NPC_PATH.length }
    const a = NPC_PATH[s.seg], b = NPC_PATH[(s.seg + 1) % NPC_PATH.length]
    const x = THREE.MathUtils.lerp(a[0], b[0], s.t)
    const z = THREE.MathUtils.lerp(a[1], b[1], s.t)
    g.position.set(x, 0.02, z)
    g.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1])
    g.position.y = Math.abs(Math.sin(s.t * Math.PI * 8)) * 0.05
  })
  return (
    <group ref={ref}>
      <mesh position={[0, 0.36, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.32, 4, 8]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshStandardMaterial color="#f4d9bd" flatShading />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <coneGeometry args={[0.16, 0.12, 8]} />
        <meshStandardMaterial color="#7a5c3e" flatShading />
      </mesh>
    </group>
  )
}

/* ---------------- Birds ---------------- */
export function Birds() {
  const refs = useRef([])
  const birds = useMemo(() => Array.from({ length: 5 }, (_, i) => ({ r: 12 + i * 3, h: 7 + i * 1.4, sp: 0.05 + i * 0.012, ph: i * 2.1 })), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((b, i) => {
      if (!b) return
      const d = birds[i]
      const a = t * d.sp + d.ph
      b.position.set(Math.cos(a) * d.r, d.h + Math.sin(t * 0.7 + d.ph) * 0.6, Math.sin(a) * d.r)
      b.rotation.y = -a + Math.PI / 2
      const flap = Math.sin(t * 9 + d.ph) * 0.5
      b.children[0].rotation.z = 0.3 + flap
      b.children[1].rotation.z = -0.3 - flap
    })
  })
  return (
    <group>
      {birds.map((_, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} scale={0.35}>
          <mesh position={[-0.3, 0, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.6, 0.02, 0.22]} />
            <meshStandardMaterial color="#2e3846" />
          </mesh>
          <mesh position={[0.3, 0, 0]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.6, 0.02, 0.22]} />
            <meshStandardMaterial color="#2e3846" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ---------------- Clouds ---------------- */
export function Clouds() {
  const refs = useRef([])
  const clouds = useMemo(() => Array.from({ length: 5 }, (_, i) => ({ x: -30 + i * 14, y: 11 + (i % 3) * 2.4, z: -18 + i * 9, s: 1.6 + (i % 3) * 0.9, sp: 0.25 + (i % 3) * 0.1 })), [])
  useFrame((_, dt) => {
    refs.current.forEach((c, i) => {
      if (!c) return
      c.position.x += dt * clouds[i].sp
      if (c.position.x > 34) c.position.x = -34
    })
  })
  return (
    <group>
      {clouds.map((c, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} position={[c.x, c.y, c.z]} scale={c.s}>
          {[[-0.8, 0, 0, 0.7], [0, 0.2, 0, 0.9], [0.9, 0, 0.1, 0.6]].map(([x, y, z, r], j) => (
            <mesh key={j} position={[x, y, z]}>
              <sphereGeometry args={[r, 9, 8]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.82} roughness={1} flatShading />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/* ---------------- Floating particles (fireflies / dust) ---------------- */
/* soft round sprite so particles read as glow dots, not squares */
function softSprite() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.4, 'rgba(255,255,255,0.6)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(c)
  return tex
}

export function Fireflies({ night }) {
  const ref = useRef()
  const sprite = useMemo(softSprite, [])
  const data = useMemo(() => {
    const r = rng(11)
    const n = 90
    const pos = new Float32Array(n * 3)
    const ph = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (r() - 0.5) * 38
      pos[i * 3 + 1] = 0.6 + r() * 4.5
      pos[i * 3 + 2] = (r() - 0.5) * 38
      ph[i] = r() * Math.PI * 2
    }
    return { pos, ph, n }
  }, [])
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime
    const p = g.geometry.attributes.position
    for (let i = 0; i < data.n; i++) {
      const y = data.pos[i * 3 + 1] + Math.sin(t * 0.6 + data.ph[i]) * 0.5
      p.setY(i, y)
      p.setX(i, data.pos[i * 3] + Math.sin(t * 0.25 + data.ph[i]) * 0.7)
    }
    p.needsUpdate = true
    g.material.opacity = night ? 0.85 : 0.35
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos.slice(), 3]} />
      </bufferGeometry>
      <pointsMaterial size={night ? 0.16 : 0.1} map={sprite} color={night ? '#ffd98a' : '#ffffff'} transparent opacity={0.5} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

/* ---------------- Rain / Snow ---------------- */
export function Weather({ kind }) {
  const ref = useRef()
  const data = useMemo(() => {
    const r = rng(33)
    const n = kind === 'rain' ? 700 : 400
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (r() - 0.5) * 60
      pos[i * 3 + 1] = r() * 26
      pos[i * 3 + 2] = (r() - 0.5) * 60
    }
    return { pos, n }
  }, [kind])
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const p = g.geometry.attributes.position
    const fall = kind === 'rain' ? 26 : 2.2
    for (let i = 0; i < data.n; i++) {
      let y = p.getY(i) - fall * dt * 3
      if (y < 0) y = 24 + Math.random() * 4
      p.setY(i, y)
      if (kind === 'snow') p.setX(i, p.getX(i) + Math.sin(y + i) * dt * 0.6)
    }
    p.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos.slice(), 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={kind === 'rain' ? 0.055 : 0.11}
        color={kind === 'rain' ? '#9fc3e8' : '#ffffff'}
        transparent opacity={kind === 'rain' ? 0.6 : 0.85}
        sizeAttenuation depthWrite={false}
      />
    </points>
  )
}
