import * as THREE from 'three'

/* Module-level singleton so the 3D loop (Player, CameraRig, Building) can share
   the avatar's live position every frame without hammering the zustand store.
   Only discrete events (nearCatId changes) bubble up to React state. */
export const playerState = {
  pos: new THREE.Vector3(0, 0, 8),      // current ground position
  target: null,                          // click-to-move destination (Vector3) or null
  facing: Math.PI,                        // yaw the avatar is turned toward
  moving: false,                          // is the avatar currently walking
  bob: 0,                                 // walk-cycle phase accumulator
}

export function resetPlayer(x = 0, z = 8) {
  playerState.pos.set(x, 0, z)
  playerState.target = null
  playerState.facing = Math.PI
  playerState.moving = false
  playerState.bob = 0
}
