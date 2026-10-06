import React, { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store.js'
import { slotPosition } from '../lib/helpers.js'
import { playerState } from './playerState.js'

const HOME = { pos: new THREE.Vector3(16, 15.5, 16), look: new THREE.Vector3(0.2, 0.6, -0.6) }
const HOME_MIN = { pos: new THREE.Vector3(0, 30, 8), look: new THREE.Vector3(0, 0, 0) }
const WALK_OFF = new THREE.Vector3(0, 5.2, 7.6) // third-person offset behind/above the player

export default function CameraRig({ mode, reduced }) {
  const { camera, pointer } = useThree()
  const focusCatId = useStore((s) => s.ui.focusCatId)
  const walkMode = useStore((s) => s.ui.walkMode)
  const categories = useStore((s) => s.categories)
  const lookCur = useRef(HOME.look.clone())
  const tgt = useMemo(() => {
    if (mode === 'free' || walkMode) return null
    if (focusCatId) {
      const cat = categories.find((c) => c.id === focusCatId)
      if (cat) {
        const p = cat.building?.position || slotPosition(cat.building?.slot ?? 0)
        const bp = new THREE.Vector3(p[0], 0, p[1])
        // approach from the plaza-centre side so we look at the building's front door (which faces the middle)
        const outward = bp.clone().setY(0)
        if (outward.lengthSq() < 0.01) outward.set(0, 0, -1)
        outward.normalize()
        const cp = bp.clone().addScaledVector(outward, -8).add(new THREE.Vector3(0, 4.8, 0))
        return { pos: cp, look: bp.clone().add(new THREE.Vector3(0, 1.5, 0)) }
      }
    }
    return mode === 'minimal' ? HOME_MIN : HOME
  }, [focusCatId, categories, mode, walkMode])

  useFrame((_, dt) => {
    const k = reduced ? 1 : 3.2
    // ---- walk mode: third-person follow the avatar ----
    if (walkMode) {
      const want = playerState.pos.clone().add(WALK_OFF)
      camera.position.x = THREE.MathUtils.damp(camera.position.x, want.x, k, dt)
      camera.position.y = THREE.MathUtils.damp(camera.position.y, want.y, k, dt)
      camera.position.z = THREE.MathUtils.damp(camera.position.z, want.z, k, dt)
      lookCur.current.x = THREE.MathUtils.damp(lookCur.current.x, playerState.pos.x, k + 2, dt)
      lookCur.current.y = THREE.MathUtils.damp(lookCur.current.y, 1.1, k, dt)
      lookCur.current.z = THREE.MathUtils.damp(lookCur.current.z, playerState.pos.z, k + 2, dt)
      camera.lookAt(lookCur.current)
      return
    }
    if (!tgt) return // free camera → OrbitControls owns the camera
    const px = THREE.MathUtils.damp(camera.position.x, tgt.pos.x, k, dt)
    const py = THREE.MathUtils.damp(camera.position.y, tgt.pos.y, k, dt)
    const pz = THREE.MathUtils.damp(camera.position.z, tgt.pos.z, k, dt)
    // subtle parallax (only in overview)
    const par = focusCatId ? 0 : 0.9
    camera.position.set(px + pointer.x * par, py + -pointer.y * par * 0.5, pz + pointer.x * par * 0.4)
    lookCur.current.x = THREE.MathUtils.damp(lookCur.current.x, tgt.look.x, k, dt)
    lookCur.current.y = THREE.MathUtils.damp(lookCur.current.y, tgt.look.y, k, dt)
    lookCur.current.z = THREE.MathUtils.damp(lookCur.current.z, tgt.look.z, k, dt)
    camera.lookAt(lookCur.current)
  })

  // free orbit only when NOT walking — in walk mode the follow-cam above owns the camera
  if (mode === 'free' && !walkMode)
    return <OrbitControls enablePan maxPolarAngle={Math.PI / 2.25} minDistance={8} maxDistance={55} target={[0, 0.5, 0]} makeDefault />
  return null
}
