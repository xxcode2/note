import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// deterministic pseudo-random
function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function River({ night, animate = true }) {
  const geoRef = useRef()
  useFrame(({ clock }) => {
    const g = geoRef.current
    if (!g || !animate) return
    const t = clock.elapsedTime
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i)
      pos.setZ(i, Math.sin(x * 0.7 + t * 1.3) * 0.06 + Math.cos(y * 0.9 + t * 0.9) * 0.05)
    }
    pos.needsUpdate = true
  })
  return (
    <group position={[14.5, 0.06, 2]} rotation={[0, -0.62, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry ref={geoRef} args={[9, 30, 36, 12]} />
        <meshStandardMaterial
          color={night ? '#1d3a5e' : '#5f9ec9'}
          transparent opacity={0.9} roughness={0.15} metalness={0.35}
        />
      </mesh>
      {/* banks */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10.2, 31]} />
        <meshStandardMaterial color={night ? '#20313f' : '#4c6a52'} />
      </mesh>
      {/* sparkles */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(Array.from({ length: 90 }, (_, i) => {
            const r = mulberry(i * 7 + 3)
            return [(r() - 0.5) * 8, (r() - 0.5) * 28, 0.1]
          }).flat()), 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.09} color="#dff1ff" transparent opacity={night ? 0.35 : 0.8} />
      </points>
    </group>
  )
}

function Paths() {
  const seg = (x, z, ry, w, l) => (
    <mesh key={`${x}-${z}-${ry}`} position={[x, 0.035, z]} rotation={[-Math.PI / 2, 0, ry]} receiveShadow>
      <planeGeometry args={[w, l]} />
      <meshStandardMaterial color="#c8b493" roughness={0.95} />
    </mesh>
  )
  return (
    <group>
      {seg(-2, -1.2, 0.12, 1.6, 15)}
      {seg(1.5, 3, 1.35, 1.6, 17)}
      {seg(0.5, -6.2, 0.9, 1.4, 8)}
      {seg(-6.5, 2.5, 1.5, 1.4, 9)}
      {/* plaza */}
      <mesh position={[0.2, 0.03, -0.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.5, 32]} />
        <meshStandardMaterial color="#cfe0d2" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.05, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 2.72, 32]} />
        <meshStandardMaterial color="#a99a7d" roughness={0.9} />
      </mesh>
      {/* center fountain */}
      <group position={[0.2, 0, -0.6]}>
        <mesh castShadow position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.55, 0.65, 0.56, 16]} />
          <meshStandardMaterial color="#b8c4d0" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.58, 0]}>
          <cylinderGeometry args={[0.46, 0.46, 0.06, 16]} />
          <meshStandardMaterial color="#5f9ec9" roughness={0.15} metalness={0.4} />
        </mesh>
        <mesh castShadow position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.09, 0.14, 0.8, 10]} />
          <meshStandardMaterial color="#a9b7c6" />
        </mesh>
      </group>
    </group>
  )
}

function Scatter({ night }) {
  const items = useMemo(() => {
    const r = mulberry(42)
    const out = []
    for (let i = 0; i < 90; i++) {
      const a = r() * Math.PI * 2
      const d = 4 + r() * 20
      const x = Math.cos(a) * d, z = Math.sin(a) * d
      if (Math.abs(x) < 3.2 && Math.abs(z) < 3.2) continue // keep plaza clear
      if (x > 9 && z > -4) continue // keep river clear
      const type = r()
      out.push({ x, z, s: 0.6 + r() * 0.9, type, hue: r() })
    }
    return out
  }, [])
  return (
    <group>
      {items.map((it, i) =>
        it.type < 0.62 ? (
          <mesh key={i} position={[it.x, 0.12 * it.s, it.z]} rotation={[0, i, 0]} scale={it.s}>
            <coneGeometry args={[0.16, 0.42, 5]} />
            <meshStandardMaterial color={night ? '#2e4a38' : i % 2 ? '#6f9e62' : '#5f8f56'} />
          </mesh>
        ) : it.type < 0.88 ? (
          <group key={i} position={[it.x, 0, it.z]} scale={it.s}>
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.28, 4]} />
              <meshStandardMaterial color="#4e6b46" />
            </mesh>
            <mesh position={[0, 0.32, 0]}>
              <sphereGeometry args={[0.09, 6, 6]} />
              <meshStandardMaterial color={['#e86fa6', '#f5c542', '#c58af5', '#f2785f'][Math.floor(it.hue * 4)]} />
            </mesh>
          </group>
        ) : (
          <mesh key={i} castShadow position={[it.x, 0.12 * it.s, it.z]} rotation={[it.hue * 3, it.hue * 6, 0]} scale={it.s}>
            <dodecahedronGeometry args={[0.24, 0]} />
            <meshStandardMaterial color={night ? '#3a414d' : '#8d99a8'} roughness={0.9} />
          </mesh>
        ),
      )}
    </group>
  )
}

export default function Ground({ night, waterAnim = true }) {
  return (
    <group>
      {/* main island */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[27, 48]} />
        <meshStandardMaterial color={night ? '#2c4638' : '#6f9e62'} roughness={1} />
      </mesh>
      {/* rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
        <circleGeometry args={[27.6, 48]} />
        <meshStandardMaterial color={night ? '#1a2530' : '#4a5f47'} roughness={1} />
      </mesh>
      {/* subtle lawn patches */}
      {[[-6, -8, 4], [7, -2, 5], [-2, 9, 4.4], [10, 8, 3.4]].map(([x, z, r], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, i]} position={[x, 0.015, z]}>
          <circleGeometry args={[r, 24]} />
          <meshStandardMaterial color={night ? '#315041' : '#78a86a'} roughness={1} />
        </mesh>
      ))}
      <Paths />
      <River night={night} animate={waterAnim} />
      <Scatter night={night} />
    </group>
  )
}
