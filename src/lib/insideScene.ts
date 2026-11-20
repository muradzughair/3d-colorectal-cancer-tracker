// The Inside view: a simulated endoscopy (NOT a real video and not from patient scan data).
// The camera travels along the colon's centerline (src/data/centerline.ts), from the start of
// the colon (cecum) to the end (rectum). Like a real endoscope it carries its own light, which
// fades with distance, and dark fog hides what is far away. The findings of the visit sit on
// the wall: polyps as small raised bumps, a tumor as a larger irregular reddish mass.
import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { CENTERLINE } from '../data/centerline'
import { createMucosaMaterial } from './mucosa'
import { subdivideSmooth } from './subdivide'
import { loadColonModel, surfaceNormalAt, type ColonModel } from './colonModel'
import { findingPositions } from './pinPositions'
import type { Finding } from '../types'

const MODEL_URL = `${import.meta.env.BASE_URL}models/colon.glb`
const LOOK_AHEAD = 0.25 // how far ahead along the colon the camera looks (scene units)
const MM = 0.0032 // one millimetre in scene units (the colon is roughly 5.5 cm wide here)
const HEADLIGHT = 0.035 // brightness of the light on the camera

// A finding as placed on the inside wall.
export interface InsideFinding {
  id: string
  point: THREE.Vector3 // on the inner wall
  at: number // where along the path it is (0 = start, 1 = end)
}

export interface InsideScene {
  length: number // length of the path, in scene units
  findings: InsideFinding[]
  setProgress: (t: number) => void // 0 = start of the colon, 1 = end
  setFocus: (point: THREE.Vector3 | null) => void // turn towards a finding (null = look ahead)
  onFrame: (callback: () => void) => void
  camera: THREE.PerspectiveCamera
  isVisible: (point: THREE.Vector3) => boolean // not hidden behind the wall
  dispose: () => void
}

export async function createInsideScene(container: HTMLElement, findings: Finding[]): Promise<InsideScene> {
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // the lining shader is detailed; keep it smooth
  renderer.setClearColor(0x000000)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x000000, 0.12, 1.1) // far parts fade to black
  scene.add(new THREE.HemisphereLight(0xffffff, 0x220000, 0.04)) // almost dark without the headlight

  // Wide-angle camera (about 100 degrees, like an endoscope) with its own light.
  const camera = new THREE.PerspectiveCamera(100, 1, 0.003, 10)
  const headlight = new THREE.PointLight(0xfff2ea, HEADLIGHT, 1.6, 2) // fades with distance
  camera.add(headlight)
  scene.add(camera)

  // The colon, with the wet lining material on every part.
  const model = await loadColonModel(MODEL_URL)
  const lining = createMucosaMaterial()
  const modelSpace = model.root.children[0] // the model's own coordinates (as in the .glb file)
  modelSpace.updateMatrixWorld(true)
  const path = new THREE.CatmullRomCurve3(CENTERLINE.map((p) => new THREE.Vector3(...p).applyMatrix4(modelSpace.matrixWorld)))
  const length = path.getLength()
  const pathPoints = path.getSpacedPoints(400)
  model.meshes.forEach((mesh) => (mesh.material = lining)) // both sides, for the checks below

  // The findings on the inside wall (worked out on the original, coarse parts: much faster).
  const placed = placeFindings(model, findings, pathPoints)
  placed.forEach(({ mesh }) => scene.add(mesh))

  // The model's parts are welded into one surface (so there are no seams between segments),
  // then made finer and rounder for the close-up view. The coarse welded surface is kept,
  // not drawn, for the quick "is this hidden behind the wall?" checks.
  const coarseWall = new THREE.Mesh(weldParts(model.meshes), lining)
  addAlongAttribute(coarseWall, pathPoints, length)
  const wall = new THREE.Mesh(subdivideSmooth(coarseWall.geometry, 2), lining)
  scene.add(wall)

  // The rounder wall sits a little away from the coarse one: move each finding onto it.
  const seat = new THREE.Raycaster()
  for (const f of placed) {
    const inward = new THREE.Vector3(0, 1, 0).applyQuaternion(f.mesh.quaternion)
    seat.set(f.point.clone().addScaledVector(inward, 0.04), inward.clone().negate())
    const hit = seat.intersectObject(wall, false)[0]
    if (hit && hit.distance < 0.08) {
      f.point.copy(hit.point)
      f.mesh.position.copy(hit.point)
    }
  }

  // Keep the canvas the size of its container.
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container
    if (!w || !h) return
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(container)
  resize()

  // Camera position along the path, with a slight hand-held sway. It looks ahead along the
  // colon, or turns smoothly towards a finding chosen with "Go to finding".
  let progress = 0
  let focus: THREE.Vector3 | null = null
  let turn = 0 // 0 = looking ahead, 1 = looking at the finding
  let lastTime = 0
  const ahead = new THREE.Vector3()
  const lookedAt = new THREE.Vector3() // the last finding turned to (kept while turning back)
  const place = (time: number) => {
    const dt = Math.min(0.1, time - lastTime)
    lastTime = time
    turn += ((focus ? 1 : 0) - turn) * Math.min(1, dt * 2.5)
    const t = Math.min(progress, 0.999)
    path.getPointAt(t, camera.position)
    path.getPointAt(Math.min(1, t + LOOK_AHEAD / length), ahead)
    if (focus || turn > 0.001) ahead.lerp(lookedAt.copy(focus ?? lookedAt), turn * 0.8)
    camera.lookAt(ahead)
    const sway = 0.006
    camera.translateX(Math.sin(time * 0.9) * sway)
    camera.translateY(Math.cos(time * 0.7) * sway)
    camera.rotateZ(Math.sin(time * 0.45) * 0.03)
  }

  const callbacks: (() => void)[] = []
  renderer.setAnimationLoop((ms) => {
    place(ms / 1000)
    renderer.render(scene, camera)
    callbacks.forEach((cb) => cb())
  })

  const raycaster = new THREE.Raycaster()
  return {
    length,
    findings: placed.map(({ id, point, at }) => ({ id, point, at })),
    setProgress: (t) => (progress = Math.min(1, Math.max(0, t))),
    setFocus: (point) => (focus = point),
    onFrame: (cb) => callbacks.push(cb),
    camera,
    isVisible: (point) => {
      const toPoint = point.clone().sub(camera.position)
      const distance = toPoint.length()
      raycaster.set(camera.position, toPoint.normalize())
      const hit = raycaster.intersectObject(coarseWall, false)[0]
      return !hit || hit.distance > distance - 0.02
    },
    dispose: () => {
      renderer.setAnimationLoop(null)
      observer.disconnect()
      placed.forEach(({ mesh }) => mesh.geometry.dispose())
      coarseWall.geometry.dispose()
      wall.geometry.dispose()
      model.meshes.forEach((mesh) => mesh.geometry.dispose())
      lining.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

// All parts of the model as one surface, in scene coordinates. Neighbouring parts share their
// edge points, so joining equal points closes the seams between the segments.
function weldParts(meshes: THREE.Mesh[]): THREE.BufferGeometry {
  const parts = meshes.map((mesh) => {
    const g = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld)
    g.deleteAttribute('normal')
    return g
  })
  const welded = mergeVertices(mergeGeometries(parts), 1e-4)
  welded.computeVertexNormals()
  parts.forEach((g) => g.dispose())
  return welded
}

// Give every vertex its distance along the colon and the direction the colon runs there
// (from the nearest point of the path). The lining shader uses them to draw the folds as
// rings across the colon.
function addAlongAttribute(mesh: THREE.Mesh, pathPoints: THREE.Vector3[], length: number) {
  const positions = mesh.geometry.getAttribute('position')
  const along = new Float32Array(positions.count)
  const direction = new Float32Array(positions.count * 3)
  const p = new THREE.Vector3()
  const d = new THREE.Vector3()
  const last = pathPoints.length - 1
  for (let i = 0; i < positions.count; i++) {
    p.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld)
    const k = nearestIndex(pathPoints, p)
    along[i] = (k / last) * length
    d.subVectors(pathPoints[Math.min(last, k + 1)], pathPoints[Math.max(0, k - 1)]).normalize()
    direction.set([d.x, d.y, d.z], i * 3)
  }
  mesh.geometry.setAttribute('along', new THREE.BufferAttribute(along, 1))
  mesh.geometry.setAttribute('alongDirection', new THREE.BufferAttribute(direction, 3))
}

function nearestIndex(points: THREE.Vector3[], p: THREE.Vector3): number {
  let best = 0
  let bestDistance = Infinity
  points.forEach((q, i) => {
    const d = q.distanceToSquared(p)
    if (d < bestDistance) {
      bestDistance = d
      best = i
    }
  })
  return best
}

// Put each finding on the inside wall. A finding's position (estimated from a picture, or
// exact if the doctor clicked it) is on the outer surface, so step in through the wall.
// Also choose where the camera stops for "Go to finding": the nearest point of the path from
// which the finding can be seen (in a folded part, the very nearest point may be behind a wall).
function placeFindings(model: ColonModel, findings: Finding[], pathPoints: THREE.Vector3[]) {
  const places = findingPositions(model, findings)
  const raycaster = new THREE.Raycaster()
  return findings.map((f) => {
    const outside = places[f.id]
    const outward = surfaceNormalAt(model, outside)
    const inward = outward.clone().negate()
    raycaster.set(outside.clone().addScaledVector(inward, 0.0005), inward)
    const wall = raycaster.intersectObjects(model.meshes, false)[0]?.distance ?? 0.02
    const point = outside.clone().addScaledVector(inward, wall)
    const mesh = f.kind === 'polyp' ? polypBump(f) : tumorMass(f)
    mesh.position.copy(point)
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), inward) // grows into the colon
    return { id: f.id, point, at: viewingSpot(model, pathPoints, point) / (pathPoints.length - 1), mesh }
  })
}

// The path point (index) to look at a finding from: close, but not right on top of it, and
// with nothing in between.
function viewingSpot(model: ColonModel, pathPoints: THREE.Vector3[], point: THREE.Vector3): number {
  const raycaster = new THREE.Raycaster()
  const order = pathPoints.map((p, i) => ({ i, d: p.distanceTo(point) })).sort((a, b) => a.d - b.d)
  for (const { i, d } of order.slice(0, 80)) {
    if (d < 0.12) continue // too close to see it well
    raycaster.set(pathPoints[i], point.clone().sub(pathPoints[i]).normalize())
    const hit = raycaster.intersectObjects(model.meshes, false)[0]
    if (!hit || hit.distance > d - 0.02) return i
  }
  return order[0].i // nothing better found: the nearest point
}

// Size of a finding in mm (unknown: 6 mm for a polyp, 3 cm for a tumor).
function sizeMm(f: Finding): number {
  if (!f.size) return f.kind === 'polyp' ? 6 : 30
  return f.size.unit === 'cm' ? f.size.value * 10 : f.size.value
}

// A polyp: a small raised, rounded bump of slightly paler, shiny tissue.
function polypBump(f: Finding): THREE.Mesh {
  const r = Math.max(0.012, (sizeMm(f) / 2) * MM) // small polyps are drawn a little larger, so they can be seen
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 20),
    new THREE.MeshPhysicalMaterial({ color: '#e0837a', roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1 }),
  )
  mesh.scale.set(r, r * 0.8, r)
  return mesh
}

// A tumor: a larger, irregular, darker red mass.
function tumorMass(f: Finding): THREE.Mesh {
  const r = Math.max(0.02, (sizeMm(f) / 2) * MM)
  const ball = new THREE.IcosahedronGeometry(1, 5)
  ball.deleteAttribute('normal')
  ball.deleteAttribute('uv')
  const geometry = mergeVertices(ball) // shared corners, so the lumpy surface shades smoothly
  const positions = geometry.getAttribute('position')
  const v = new THREE.Vector3()
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i)
    const lumpy = 1 + 0.18 * Math.sin(v.x * 7.1 + v.y * 3.3) * Math.cos(v.z * 6.4 - v.x * 2.1) + 0.08 * Math.sin(v.y * 17 + v.z * 13)
    v.multiplyScalar(lumpy)
    positions.setXYZ(i, v.x, v.y, v.z)
  }
  geometry.computeVertexNormals()
  const mesh = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({ color: '#9b2f2f', roughness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.3 }))
  mesh.scale.set(r, r * 0.65, r)
  return mesh
}
