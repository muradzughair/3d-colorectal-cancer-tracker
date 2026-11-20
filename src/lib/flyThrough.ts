// Fly-through (demo): the camera flies from outside, through the colon wall next to a
// finding, and stops inside the colon looking at the finding. A small light on the camera
// plays the part of the endoscope light. This is a visual demonstration only: the model is a
// reference shape with no inside texture, not built from the patient's scans.
import * as THREE from 'three'
import type { ColonScene } from './colonScene'
import { surfaceNormalAt, type ColonModel } from './colonModel'
import type { FindingKind, Size } from '../types'

const FLY_SECONDS = 3.2
const BACK_SECONDS = 1.6
const LAMP = 0.25 // brightness of the light on the camera

export interface Flight {
  exit: (done: () => void) => void // fly back out to the normal view
  dispose: () => void // stop at once and put everything back (when the page closes)
}

export function startFlight(view: ColonScene, model: ColonModel, point: THREE.Vector3, kind: FindingKind, size: Size | null): Flight {
  const { camera, controls, scene } = view

  // Remember the normal view, to put it back afterwards.
  const saved = {
    position: camera.position.clone(),
    target: controls.target.clone(),
    near: camera.near,
    fov: camera.fov,
    minDistance: controls.minDistance,
    maxDistance: controls.maxDistance,
    damping: controls.enableDamping,
    environment: scene.environmentIntensity,
  }

  // From inside, the colon wall is the back of the surface, so draw both sides.
  model.meshes.forEach((m) => ((m.material as THREE.Material).side = THREE.DoubleSide))

  // Measure the colon at the finding. The model's wall has an outer and an inner surface, so a
  // ray straight in from the finding first crosses the near wall (inner surface), then the
  // inside of the colon, then the far wall. The finding sits on the inner surface.
  const normal = surfaceNormalAt(model, point) // outward direction of the wall
  const inward = normal.clone().negate()
  const raycaster = new THREE.Raycaster()
  raycaster.set(point.clone().addScaledVector(inward, 0.0005), inward)
  const hits = raycaster.intersectObjects(model.meshes, false).map((h) => h.distance)
  const wall = hits[0] ?? 0.01 // thickness of the near wall
  const far = hits.find((d) => d > wall + 0.03) ?? wall + 0.2 // the opposite wall
  const across = far - wall // width of the inside of the colon here
  const onWall = point.clone().addScaledVector(inward, wall) // the finding, seen from inside
  const middle = point.clone().addScaledVector(inward, (wall + far) / 2) // centre of the colon here
  const along = tubeDirection(model, middle, Math.max(across * 1.5, 0.12), normal)

  // Stop a little way along the colon, so the finding is seen on the wall ahead.
  raycaster.set(middle, along)
  const room = raycaster.intersectObjects(model.meshes, false)[0]?.distance ?? across
  const inside = middle.clone().addScaledVector(along, Math.min(across * 1.1, room * 0.6))
  const aboveInside = inside.clone().addScaledVector(normal, across / 2 + 0.25) // outside the wall, over that spot
  const inFront = point.clone().addScaledVector(normal, 0.7) // outside, facing the finding

  // A small bump on the wall shows the finding (blue polyp, red tumor), sized from its size.
  const mm = size ? (size.unit === 'cm' ? size.value * 10 : size.value) : 6
  const radius = Math.max(across * 0.05, (mm / 2) * (across / 55)) // the colon is roughly 5.5 cm wide
  const bump = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 20),
    new THREE.MeshPhysicalMaterial({ color: kind === 'polyp' ? '#2563eb' : '#dc2626', roughness: 0.4, clearcoat: 0.5 }),
  )
  bump.position.copy(onWall)
  bump.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), inward) // grows into the colon
  bump.scale.set(radius, radius * 0.6, radius)
  scene.add(bump)

  // The "endoscope light" travels with the camera.
  const lamp = new THREE.PointLight(0xfff4ee, 0, 0, 1.2)
  camera.add(lamp)
  scene.add(camera)

  // Camera settings for working inside a narrow tube.
  camera.near = 0.003
  camera.fov = 60
  camera.updateProjectionMatrix()
  controls.enabled = false
  controls.enableDamping = false // the camera moves exactly along the path

  let stopAnimation = animate(view, [saved.position, inFront, aboveInside, inside], [saved.target, point, onWall, onWall], FLY_SECONDS, (t) => {
    lamp.intensity = t * LAMP
    scene.environmentIntensity = saved.environment * (1 - 0.5 * t) // a little darker inside
  }, () => {
    // Arrived: the doctor can zoom towards the finding. Turning is off inside, because the
    // colon is narrow and the camera would swing through the wall.
    controls.target.copy(onWall)
    controls.minDistance = across * 0.25
    controls.maxDistance = inside.distanceTo(onWall)
    controls.enableRotate = false
    controls.enabled = true
  })

  function restore() {
    stopAnimation()
    scene.remove(bump)
    bump.geometry.dispose()
    camera.remove(lamp)
    model.meshes.forEach((m) => ((m.material as THREE.Material).side = THREE.FrontSide))
    camera.near = saved.near
    camera.fov = saved.fov
    camera.updateProjectionMatrix()
    controls.minDistance = saved.minDistance
    controls.maxDistance = saved.maxDistance
    controls.enableDamping = saved.damping
    controls.enableRotate = true
    controls.enabled = true
    scene.environmentIntensity = saved.environment
  }

  return {
    exit: (done) => {
      stopAnimation()
      controls.enabled = false
      const from = camera.position.clone()
      const out = from.clone().addScaledVector(normal, across / 2 + 0.3)
      stopAnimation = animate(view, [from, out, saved.position], [controls.target.clone(), point, saved.target], BACK_SECONDS, (t) => {
        lamp.intensity = (1 - t) * LAMP
        scene.environmentIntensity = saved.environment * (0.5 + 0.5 * t)
      }, () => {
        controls.target.copy(saved.target)
        camera.position.copy(saved.position)
        restore()
        done()
      })
    },
    dispose: restore,
  }
}

// Move the camera smoothly along a curve through `points`, looking at a point that moves
// through `targets`. Returns a function that stops the movement.
function animate(
  view: ColonScene,
  points: THREE.Vector3[],
  targets: THREE.Vector3[],
  seconds: number,
  onStep: (t: number) => void,
  onDone: () => void,
): () => void {
  const path = new THREE.CatmullRomCurve3(points)
  const start = performance.now()
  const lookAt = new THREE.Vector3()
  const stop = view.onFrame(() => {
    const raw = Math.min(1, (performance.now() - start) / 1000 / seconds)
    const t = raw < 0.5 ? 2 * raw * raw : 1 - (-2 * raw + 2) ** 2 / 2 // ease in and out
    view.camera.position.copy(path.getPointAt(t))
    // Look target: between the listed targets, matching the progress along the path.
    const step = t * (targets.length - 1)
    const i = Math.min(targets.length - 2, Math.floor(step))
    lookAt.lerpVectors(targets[i], targets[i + 1], step - i)
    view.controls.target.copy(lookAt)
    view.camera.lookAt(lookAt)
    onStep(t)
    if (raw >= 1) {
      stop()
      onDone()
    }
  })
  return stop
}

// Which way the colon runs at a point inside it: the main direction of the nearby surface
// points (a short piece of tube is longer than it is wide), kept at right angles to the wall.
function tubeDirection(model: ColonModel, center: THREE.Vector3, radius: number, normal: THREE.Vector3): THREE.Vector3 {
  const points: THREE.Vector3[] = []
  const p = new THREE.Vector3()
  for (const mesh of model.meshes) {
    const positions = mesh.geometry.getAttribute('position')
    for (let i = 0; i < positions.count; i++) {
      p.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld)
      if (p.distanceTo(center) < radius) points.push(p.clone())
    }
  }
  const fallback = new THREE.Vector3(0, 1, 0).cross(normal).normalize()
  if (points.length < 10) return fallback

  // Spread of the points in each direction (covariance), then its main direction.
  const mean = points.reduce((sum, q) => sum.add(q), new THREE.Vector3()).divideScalar(points.length)
  const c = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  for (const q of points) {
    const d = [q.x - mean.x, q.y - mean.y, q.z - mean.z]
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) c[r * 3 + k] += d[r] * d[k]
  }
  const v = fallback.clone()
  for (let n = 0; n < 30; n++) {
    v.set(c[0] * v.x + c[1] * v.y + c[2] * v.z, c[3] * v.x + c[4] * v.y + c[5] * v.z, c[6] * v.x + c[7] * v.y + c[8] * v.z).normalize()
  }
  v.addScaledVector(normal, -v.dot(normal)) // along the wall, not into it
  return v.lengthSq() > 1e-6 ? v.normalize() : fallback
}
