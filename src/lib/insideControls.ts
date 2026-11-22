// Free camera for the Inside view, like a first-person game:
//   - hold the left mouse button and drag to look around (up/down limited to about 85 degrees,
//     no roll); no pointer lock, so it works on every machine
//   - W forward, S back, A left, D right, Q down, E up, all relative to where the camera looks
//   - mouse wheel: small steps forward / back
// Movement speeds up gently and stops smoothly, at the same speed at any frame rate.
// Every move is passed through the colon tube, so the camera slides along the wall and can
// never leave the inside of the colon. "Go to" glides to a spot and turns to look at a point.
import * as THREE from 'three'
import type { ColonTube } from './colonTube'

const SPEED = 0.28 // scene units per second (about 9 cm per second)
const ACCELERATION = 6 // how quickly the speed follows the keys (higher = snappier)
const LOOK_SPEED = 0.0045 // radians per pixel of mouse drag
const MAX_PITCH = THREE.MathUtils.degToRad(85)
const WHEEL_STEP = 0.035 // distance of one wheel notch
const GLIDE_TIME = 1.1 // seconds for a short "Go to"
const GLIDE_SPEED = 1.6 // scene units per second when gliding a long way along the colon

const KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE'] as const

// True while the doctor is typing in a field (keys must then do nothing here).
export function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}

export interface InsideControls {
  update: (dt: number) => void // call every frame
  index: () => number // the nearest centerline point of the camera
  goTo: (position: THREE.Vector3, lookAt: THREE.Vector3) => void
  recenter: () => void // back onto the centerline, looking along the colon
  moveToIndex: (index: number) => void // to a centerline point, looking along the colon
  dispose: () => void
}

export function createInsideControls(camera: THREE.PerspectiveCamera, canvas: HTMLElement, tube: ColonTube, onHelp: () => void): InsideControls {
  let yaw = 0
  let pitch = 0
  let k = tube.points.length - 1 // start at the anal end, like a colonoscope
  const pressed = new Set<string>()
  const velocity = new THREE.Vector3()
  let wheel = 0 // distance still to travel from wheel notches
  // A glide to a spot: along the inside of the colon (from one centerline point to another),
  // ending exactly at the spot, turning to its view on the way.
  let glide: {
    from: THREE.Vector3
    to: THREE.Vector3
    fromIndex: number
    toIndex: number
    fromYaw: number
    fromPitch: number
    toYaw: number
    toPitch: number
    t: number
    time: number
  } | null = null
  const pathPoint = new THREE.Vector3()

  // Reused objects (no new objects in the frame loop).
  const forward = new THREE.Vector3()
  const right = new THREE.Vector3()
  const up = new THREE.Vector3()
  const wanted = new THREE.Vector3()
  const step = new THREE.Vector3()
  const direction = new THREE.Vector3()

  const setLook = () => camera.rotation.set(pitch, yaw, 0, 'YXZ')

  // Point the camera along a direction (yaw around the vertical axis, then pitch).
  const lookAlong = (dir: THREE.Vector3) => {
    direction.copy(dir).normalize()
    pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, Math.asin(direction.y)))
    yaw = Math.atan2(-direction.x, -direction.z)
    setLook()
  }

  // Start: just inside the anal end, looking up the colon.
  camera.position.copy(tube.points[k])
  lookAlong(direction.copy(tube.tangents[k]).negate())
  k = tube.constrain(camera.position, k)

  // ---------- Input ----------
  let dragging = false
  let lastX = 0
  let lastY = 0
  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
    canvas.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return
    glide = null
    yaw -= (e.clientX - lastX) * LOOK_SPEED
    pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch - (e.clientY - lastY) * LOOK_SPEED))
    lastX = e.clientX
    lastY = e.clientY
    setLook()
  }
  const onPointerUp = (e: PointerEvent) => {
    dragging = false
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
  }
  const onWheel = (e: WheelEvent) => {
    e.preventDefault() // the page must not scroll
    glide = null
    wheel += e.deltaY < 0 ? WHEEL_STEP : -WHEEL_STEP
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === '?') {
      onHelp()
      return
    }
    if (!(KEYS as readonly string[]).includes(e.code)) return
    e.preventDefault()
    glide = null
    pressed.add(e.code)
  }
  const onKeyUp = (e: KeyboardEvent) => pressed.delete(e.code)
  const onBlur = () => pressed.clear() // keys released while the window was not focused

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)

  // ---------- Every frame ----------
  const update = (dt: number) => {
    if (glide) {
      // Smooth glide (ease in and out): follow the centerline from the start index to the target
      // index, blending from the start position at the beginning and to the spot at the end.
      glide.t = Math.min(1, glide.t + dt / glide.time)
      const e = glide.t * glide.t * (3 - 2 * glide.t)
      const i = Math.round(glide.fromIndex + (glide.toIndex - glide.fromIndex) * e)
      pathPoint.copy(tube.points[i])
      camera.position.copy(pathPoint)
      camera.position.lerp(glide.from, Math.max(0, 1 - e * 4)) // leave the start smoothly
      camera.position.lerp(glide.to, Math.max(0, e * 4 - 3)) // arrive at the spot smoothly
      yaw = glide.fromYaw + (glide.toYaw - glide.fromYaw) * e
      pitch = glide.fromPitch + (glide.toPitch - glide.fromPitch) * e
      setLook()
      k = i
      velocity.set(0, 0, 0)
      if (glide.t >= 1) {
        glide = null
        k = tube.constrain(camera.position, k)
      }
      return
    }

    camera.getWorldDirection(forward)
    right.set(1, 0, 0).applyQuaternion(camera.quaternion)
    up.set(0, 1, 0).applyQuaternion(camera.quaternion)
    const has = (code: string) => (pressed.has(code) ? 1 : 0)
    wanted
      .set(0, 0, 0)
      .addScaledVector(forward, has('KeyW') - has('KeyS'))
      .addScaledVector(right, has('KeyD') - has('KeyA'))
      .addScaledVector(up, has('KeyE') - has('KeyQ'))
    if (wanted.lengthSq() > 0) wanted.normalize().multiplyScalar(SPEED)

    // Speed follows the keys smoothly; the same result at 30 or 60 frames per second.
    velocity.lerp(wanted, 1 - Math.exp(-ACCELERATION * dt))
    if (velocity.lengthSq() < 1e-8 && wanted.lengthSq() === 0) velocity.set(0, 0, 0)
    step.copy(velocity).multiplyScalar(dt)

    // Wheel notches: travel the remaining distance smoothly.
    if (wheel !== 0) {
      const part = wheel * (1 - Math.exp(-10 * dt))
      wheel = Math.abs(wheel - part) < 1e-4 ? 0 : wheel - part
      step.addScaledVector(forward, part)
    }

    if (step.lengthSq() > 0) {
      camera.position.add(step)
      k = tube.constrain(camera.position, k) // stay inside: slide along the wall
    }
  }

  // Shortest turn between two angles.
  const nearAngle = (from: number, to: number) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from))

  const goTo = (position: THREE.Vector3, lookAt: THREE.Vector3) => {
    direction.subVectors(lookAt, position).normalize()
    const toPitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, Math.asin(direction.y)))
    const toYaw = nearAngle(yaw, Math.atan2(-direction.x, -direction.z))
    const toIndex = tube.nearestAnywhere(position)
    const distance = (Math.abs(toIndex - k) / (tube.points.length - 1)) * tube.length
    glide = {
      from: camera.position.clone(),
      to: position.clone(),
      fromIndex: k,
      toIndex,
      fromYaw: yaw,
      fromPitch: pitch,
      toYaw,
      toPitch,
      t: 0,
      time: Math.max(GLIDE_TIME, Math.min(4, distance / GLIDE_SPEED)),
    }
    pressed.clear()
    wheel = 0
  }

  // Look along the colon at index i, in the direction closest to the current view.
  const alongAt = (i: number) => {
    camera.getWorldDirection(forward)
    direction.copy(tube.tangents[i])
    if (direction.dot(forward) < 0) direction.negate()
    return direction.clone()
  }

  const moveToIndex = (i: number) => {
    const dir = alongAt(i)
    goTo(tube.points[i], dir.multiplyScalar(0.2).add(tube.points[i]))
  }

  return {
    update,
    index: () => k,
    goTo,
    recenter: () => moveToIndex(tube.nearest(camera.position, k)),
    moveToIndex,
    dispose: () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    },
  }
}
