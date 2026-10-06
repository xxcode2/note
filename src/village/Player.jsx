import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store.js'
import { colorOf, slotPosition } from '../lib/helpers.js'
import { playerState } from './playerState.js'

const SPEED = 6.2          // world units / second
const ENTER_R = 3.4        // proximity radius that "activates" a building
const ISLAND_R = 20.5      // keep the player on the island

export default function Player({ accent = '#f5a524' }) {
  const group = useRef()
  const legs = useRef([])
  const { camera } = useThree()
  const keys = useRef(new Set())
  const categories = useStore((s) => s.categories)
  const setUi = useStore((s) => s.setUi)
  const nearRef = useRef(null)

  const spots = useMemo(
    () => categories.map((c) => {
      const p = c.building?.position || slotPosition(c.building?.slot ?? 0)
      return { id: c.id, x: p[0], z: p[1] }
    }),
    [categories],
  )

  // keyboard
  useEffect(() => {
    const down = (e) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault()
        keys.current.add(e.code)
        playerState.target = null // manual control cancels click-to-move
      }
    }
    const up = (e) => keys.current.delete(e.code)
    const blur = () => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const d = Math.min(dt, 0.05)

    // camera-relative basis on the ground plane
    const fwd = new THREE.Vector3().subVectors(playerState.pos, camera.position).setY(0)
    if (fwd.lengthSq() < 0.001) fwd.set(0, 0, -1)
    fwd.normalize()
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x) // screen-right relative to the camera

    let mx = 0
    let mz = 0
    const k = keys.current
    if (k.has('KeyW') || k.has('ArrowUp')) { mx += fwd.x; mz += fwd.z }
    if (k.has('KeyS') || k.has('ArrowDown')) { mx -= fwd.x; mz -= fwd.z }
    if (k.has('KeyD') || k.has('ArrowRight')) { mx += right.x; mz += right.z }
    if (k.has('KeyA') || k.has('ArrowLeft')) { mx -= right.x; mz -= right.z }

    const dir = new THREE.Vector3(mx, 0, mz)
    if (dir.lengthSq() > 0.0001) {
      dir.normalize().multiplyScalar(SPEED * d)
      playerState.pos.add(dir)
      playerState.facing = Math.atan2(dir.x, dir.z)
      playerState.moving = true
    } else if (playerState.target) {
      const to = new THREE.Vector3().subVectors(playerState.target, playerState.pos).setY(0)
      const dist = to.length()
      if (dist < 0.3) {
        playerState.target = null
        playerState.moving = false
      } else {
        to.normalize().multiplyScalar(Math.min(SPEED * d, dist))
        playerState.pos.add(to)
        playerState.facing = Math.atan2(to.x, to.z)
        playerState.moving = true
      }
    } else {
      playerState.moving = false
    }

    // stay on the island
    const r = Math.hypot(playerState.pos.x, playerState.pos.z)
    if (r > ISLAND_R) {
      playerState.pos.x = (playerState.pos.x / r) * ISLAND_R
      playerState.pos.z = (playerState.pos.z / r) * ISLAND_R
    }

    // walk bob + apply
    if (playerState.moving) playerState.bob += d * 11
    const bob = playerState.moving ? Math.abs(Math.sin(playerState.bob)) * 0.08 : 0
    g.position.set(playerState.pos.x, 0.02 + bob, playerState.pos.z)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, turnTo(g.rotation.y, playerState.facing), 12, d)
    legs.current.forEach((leg, i) => {
      if (leg) leg.rotation.x = playerState.moving ? Math.sin(playerState.bob + (i ? 0 : Math.PI)) * 0.7 : 0
    })

    // nearest-building detection
    let nearId = null
    let best = ENTER_R
    for (const sp of spots) {
      const dist = Math.hypot(sp.x - playerState.pos.x, sp.z - playerState.pos.z)
      if (dist < best) { best = dist; nearId = sp.id }
    }
    if (nearId !== nearRef.current) {
      nearRef.current = nearId
      setUi({ nearCatId: nearId })
    }
  })

  const palette = colorOf('amber')
  return (
    <group>
      {/* click-to-move catcher (only active in walk mode) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.015, 0]}
        onPointerDown={(e) => {
          e.stopPropagation()
          playerState.target = new THREE.Vector3(e.point.x, 0, e.point.z)
        }}
      >
        <planeGeometry args={[80, 80]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={group}>
        {/* footprint ring marks "you" */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.34, 0.46, 32]} />
          <meshBasicMaterial color={accent} transparent opacity={0.9} />
        </mesh>
        {/* body */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.34, 4, 10]} />
          <meshStandardMaterial color={palette.hex} roughness={0.6} flatShading />
        </mesh>
        {/* head */}
        <mesh position={[0, 0.86, 0]} castShadow>
          <sphereGeometry args={[0.16, 14, 14]} />
          <meshStandardMaterial color="#f6dcc0" roughness={0.7} flatShading />
        </mesh>
        {/* hair */}
        <mesh position={[0, 0.98, -0.02]}>
          <sphereGeometry args={[0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
          <meshStandardMaterial color="#3b2d21" roughness={0.9} flatShading />
        </mesh>
        {/* legs */}
        {[-0.08, 0.08].map((x, i) => (
          <mesh key={i} ref={(el) => (legs.current[i] = el)} position={[x, 0.12, 0]}>
            <boxGeometry args={[0.1, 0.24, 0.12]} />
            <meshStandardMaterial color="#33404f" roughness={0.8} />
          </mesh>
        ))}
        {/* soft glow above so you can spot yourself */}
        <pointLight position={[0, 1.4, 0]} color={accent} intensity={2.2} distance={3.2} decay={2} />
      </group>
    </group>
  )
}

// shortest-angle damping toward a target yaw (handles wrap-around)
function turnTo(cur, target) {
  let diff = target - cur
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return cur + diff
}
