import React, { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store.js'
import Ground from './Ground.jsx'
import Building from './Building.jsx'
import { Trees, StreetLights, NPC, Birds, Clouds, Fireflies, Weather } from './Ambience.jsx'
import Player from './Player.jsx'
import CameraRig from './CameraRig.jsx'

// Environment presets: sky/fog/lighting moods
export const ENV = {
  day: {
    sky: '#a8c4dd', horizon: '#dce9f2', fog: '#bccfe0', fogD: 46,
    sun: '#fff2d8', sunI: 1.35, sunPos: [12, 18, 8],
    amb: '#cfe0f2', ambI: 0.75, night: false, ground: '#6f9e62', groundDeep: '#5c8a55',
  },
  sunset: {
    sky: '#e8a06a', horizon: '#f2c894', fog: '#d99a6b', fogD: 42,
    sun: '#ffb36b', sunI: 1.2, sunPos: [-16, 7, 10],
    amb: '#e8b28a', ambI: 0.55, night: false, ground: '#6d8a55', groundDeep: '#59764a',
  },
  night: {
    sky: '#0b1226', horizon: '#16203a', fog: '#101a30', fogD: 40,
    sun: '#8fa8ff', sunI: 0.35, sunPos: [-8, 14, -6],
    amb: '#233252', ambI: 0.35, night: true, ground: '#2c4638', groundDeep: '#22382d',
  },
}

function Atmosphere() {
  const environment = useStore((s) => s.settings.environment)
  const { scene, gl } = useThree()
  const target = ENV[environment] || ENV.day
  const cur = useRef({ sun: new THREE.Color('#ffffff'), amb: new THREE.Color('#ffffff'), fog: new THREE.Color('#ffffff'), sky: new THREE.Color('#ffffff') })

  useEffect(() => {
    scene.background = new THREE.Color(target.sky)
    scene.fog = new THREE.FogExp2(target.fog, 1 / target.fogD)
    gl.toneMapping = THREE.ACESFilmicToneMapping
  }, []) // eslint-disable-line

  const sunRef = useRef()
  const ambRef = useRef()
  useFrame((_, dt) => {
    const k = Math.min(1, dt * 2.2)
    cur.current.sky.lerp(new THREE.Color(target.sky), k)
    cur.current.fog.lerp(new THREE.Color(target.fog), k)
    cur.current.sun.lerp(new THREE.Color(target.sun), k)
    cur.current.amb.lerp(new THREE.Color(target.amb), k)
    if (scene.background) scene.background.copy(cur.current.sky)
    if (scene.fog) { scene.fog.color.copy(cur.current.fog); scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, 1 / target.fogD, k) }
    if (sunRef.current) {
      sunRef.current.intensity = THREE.MathUtils.lerp(sunRef.current.intensity, target.sunI, k)
      sunRef.current.color.copy(cur.current.sun)
      sunRef.current.position.lerp(new THREE.Vector3(...target.sunPos), k)
    }
    if (ambRef.current) { ambRef.current.intensity = THREE.MathUtils.lerp(ambRef.current.intensity, target.ambI, k); ambRef.current.color.copy(cur.current.amb) }
  })

  return (
    <>
      <ambientLight ref={ambRef} />
      <hemisphereLight args={['#cfe4ff', '#3a4a3a', 0.35]} />
      <directionalLight
        ref={sunRef}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-22} shadow-camera-right={22}
        shadow-camera-top={22} shadow-camera-bottom={-22}
        shadow-camera-far={70}
        shadow-bias={-0.0004}
      />
    </>
  )
}

function VillageContent() {
  const categories = useStore((s) => s.categories)
  const notes = useStore((s) => s.notes)
  const settings = useStore((s) => s.settings)
  const editingVillage = useStore((s) => s.ui.editingVillage)
  const walkMode = useStore((s) => s.ui.walkMode)
  const stats = useMemo(() => {
    const m = {}
    const now = Date.now()
    for (const n of notes) {
      const k = n.categoryId || '_'
      const st = (m[k] = m[k] || { total: 0, imp: 0, soon: 0, done: 0, pending: 0, overdue: 0 })
      st.total++
      if (n.important) st.imp++
      const closed = n.status === 'Completed' || n.status === 'Archived'
      if (closed) st.done++
      else st.pending++
      if (n.dueDate && !closed) {
        const t = new Date(n.dueDate).getTime()
        if (t < now) st.overdue++
        else if ((t - now) / 86400000 < 8) st.soon++
      }
    }
    return m
  }, [notes])

  return (
    <>
      <Atmosphere />
      <Ground night={settings.environment === 'night'} waterAnim={settings.waterAnim} />
      {categories.map((c) => (
        <Building key={c.id} cat={c} stats={stats[c.id] || { total: 0, imp: 0, soon: 0, done: 0, pending: 0, overdue: 0 }} editable={editingVillage} />
      ))}
      <Trees night={settings.environment === 'night'} />
      <StreetLights count={6} night={settings.environment === 'night'} enabled={settings.ambient} />
      {settings.npc && !walkMode && <NPC />}
      {walkMode && <Player accent="#f5a524" />}
      {settings.ambient && <Birds />}
      {settings.ambient && <Clouds />}
      {settings.particles && <Fireflies night={settings.environment === 'night'} />}
      {settings.weather !== 'off' && <Weather kind={settings.weather} />}
    </>
  )
}

export default function VillageCanvas() {
  const animations = useStore((s) => s.settings.animations)
  const shadows = useStore((s) => s.settings.shadows)
  const cameraMode = useStore((s) => s.settings.camera)
  const walkMode = useStore((s) => s.ui.walkMode)
  const reduced = animations !== 'full'

  return (
    <Canvas
      shadows={shadows && !reduced}
      dpr={[1, 1.6]}
      camera={{ position: [16, 15, 16], fov: cameraMode === 'minimal' ? 50 : 38, near: 0.5, far: 160 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      frameloop={animations === 'off' && !walkMode ? 'demand' : 'always'}
      onCreated={({ gl }) => gl.setClearColor('#a8c4dd')}
      style={{ position: 'absolute', inset: 0 }}
    >
      <VillageContent />
      <CameraRig mode={cameraMode} reduced={reduced} />
    </Canvas>
  )
}
