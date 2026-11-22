// The Inside view: a simulated endoscopy (NOT a real video and not from patient scan data).
// The doctor moves a free camera through the inside of the colon (see insideControls.ts); the
// colon "tube" (colonTube.ts) keeps it inside the lumen. Like a real endoscope the camera
// carries its own light, which fades with distance, and dark fog hides what is far away. The
// findings of the visit are drawn with the shared lesion builder (lesionMesh.ts): polyps by
// their Paris type, tumors by their morphology, length and share of the wall.
import * as THREE from 'three'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { CENTERLINE, CENTERLINE_RADII } from '../data/centerline'
import { createMucosaMaterial } from './mucosa'
import { subdivideSmooth } from './subdivide'
import { loadColonModel, surfaceNormalAt, type ColonModel } from './colonModel'
import { createColonTube, type ColonTube } from './colonTube'
import { buildPolyp, buildTumor, createLesionKit, lesionSizeMm } from './lesionMesh'
import { indexAtCm } from './colonDistance'
import { findingPositions } from './pinPositions'
import type { Finding } from '../types'

const MODEL_URL = `${import.meta.env.BASE_URL}models/colon.glb`
export const MM = 0.0032 // one millimetre in scene units (the colon is roughly 5.5 cm wide here)
const HEADLIGHT = 0.035 // brightness of the light on the camera

// A finding as placed on the inside wall.
export interface InsideFinding {
  id: string
  point: THREE.Vector3 // on the inner wall
  viewFrom: THREE.Vector3 // where the camera goes for "Go to finding" (about 5 cm away, clear view)
}

export interface InsideScene {
  camera: THREE.PerspectiveCamera
  canvas: HTMLCanvasElement
  tube: ColonTube // the inside of the colon, in scene units
  findings: InsideFinding[]
  onFrame: (callback: (dt: number) => void) => void // called every frame before drawing (dt in seconds)
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

  // Wide-angle camera (about 100 degrees, like an endoscope) with its own light. The near
  // plane is very close, so the wall is not cut open when the camera looks at it from nearby.
  const camera = new THREE.PerspectiveCamera(100, 1, 0.002, 10)
  const headlight = new THREE.PointLight(0xfff2ea, HEADLIGHT, 1.6, 2) // fades with distance
  camera.add(headlight)
  scene.add(camera)

  // The colon, with the wet lining material on every part. Around tumors the lining loses its
  // fine vein pattern (positions filled in below).
  const model = await loadColonModel(MODEL_URL)
  const tumorSpots: THREE.Vector4[] = []
  const lining = createMucosaMaterial(tumorSpots)
  const modelSpace = model.root.children[0] // the model's own coordinates (as in the .glb file)
  modelSpace.updateMatrixWorld(true)
  const scale = new THREE.Vector3().setFromMatrixScale(modelSpace.matrixWorld).x
  const tube = createColonTube(
    CENTERLINE.map((p) => new THREE.Vector3(...p).applyMatrix4(modelSpace.matrixWorld)),
    CENTERLINE_RADII.map((r) => r * scale),
  )
  model.meshes.forEach((mesh) => (mesh.material = lining)) // both sides, for the checks below

  // The model's parts are welded into one surface (so there are no seams between segments),
  // then made finer and rounder for the close-up view. The coarse welded surface is kept,
  // not drawn, for the quick "is this hidden behind the wall?" checks.
  const coarseWall = new THREE.Mesh(weldParts(model.meshes), lining)
  addAlongAttribute(coarseWall, tube.points, tube.length)
  const wall = new THREE.Mesh(subdivideSmooth(coarseWall.geometry, 2), lining)
  scene.add(wall)

  // Where the findings sit on the inside wall (worked out on the original, coarse parts), and
  // their centerline point: from the recorded distance when there is one (loops of the colon
  // lie close together, so the nearest point could be on another loop), else the nearest.
  const placed = placeFindings(model, findings)
  const lastTube = tube.points.length - 1
  const tubeIndex = (f: Finding, point: THREE.Vector3) =>
    f.distanceFromAnalVergeCm !== undefined
      ? Math.round((indexAtCm(f.distanceFromAnalVergeCm) / (CENTERLINE.length - 1)) * lastTube)
      : nearestIndex(tube.points, point)

  // The rounder wall sits a little away from the coarse one: move each point onto it.
  const seat = new THREE.Raycaster()
  for (const f of placed) {
    seat.set(f.point.clone().addScaledVector(f.inward, 0.04), f.inward.clone().negate()) // from the lumen side
    const hit = seat.intersectObject(wall, false)[0]
    if (hit && hit.distance < 0.08) f.point.copy(hit.point)
  }

  // The lesions themselves (see lesionMesh.ts). Polyps stand on the wall; tumors are built
  // around the centerline so they can follow the wall all round (and narrow the lumen).
  const kit = createLesionKit()
  const wallRay = new THREE.Raycaster()
  const lesionMeshes: THREE.Mesh[] = []
  for (const f of placed) {
    const finding = findings.find((x) => x.id === f.id)!
    if (finding.kind === 'polyp') {
      const mesh = buildPolyp(finding, MM, kit)
      mesh.position.copy(f.point)
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), f.inward) // grows into the colon
      lesionMeshes.push(mesh)
      continue
    }
    const k = tubeIndex(finding, f.point)
    const center = tube.points[k]
    const along0 = tube.tangents[k]
    const across0 = f.point.clone().sub(center)
    across0.addScaledVector(along0, -across0.dot(along0)).normalize()
    // The frame at a distance z along the colon (it follows the bends): centerline point,
    // direction of the colon, and "across" kept as close as possible to the tumor's middle.
    const step = tube.length / (tube.points.length - 1)
    const origin = new THREE.Vector3()
    const along = new THREE.Vector3()
    const across = new THREE.Vector3()
    const up = new THREE.Vector3()
    const direction = new THREE.Vector3()
    const frameAt = (z: number) => {
      const i = Math.min(tube.points.length - 1, Math.max(0, k + z / step))
      const a = Math.floor(i)
      const b = Math.min(tube.points.length - 1, a + 1)
      origin.lerpVectors(tube.points[a], tube.points[b], i - a)
      along.lerpVectors(tube.tangents[a], tube.tangents[b], i - a).normalize()
      across.copy(across0).addScaledVector(along, -across0.dot(along)).normalize()
      up.crossVectors(along, across)
    }
    // Distance to the wall in one direction. A ray can slip through a small gap in the model
    // and hit another loop of the colon, so the result is kept near the usual inner radius.
    const innerRadius = CENTERLINE_RADII[Math.round((k / (tube.points.length - 1)) * (CENTERLINE_RADII.length - 1))] * scale
    const rayDistance = (angle: number, z: number) => {
      frameAt(z)
      direction.copy(across).multiplyScalar(Math.cos(angle)).addScaledVector(up, Math.sin(angle))
      wallRay.set(origin, direction)
      const d = wallRay.intersectObject(coarseWall, false)[0]?.distance ?? innerRadius
      return Math.min(innerRadius * 1.5, Math.max(innerRadius * 0.7, d))
    }
    // Single rays catch folds and small gaps, which makes the tumor surface jump (flat slabs).
    // So the wall distance is sampled on a coarse grid, smoothed, and read back smoothly.
    const GA = 24
    const GZ = 13
    const spanZ = ((finding.lengthMm ?? lesionSizeMm(finding)) / 2 + 9) * MM
    let grid: number[][] = []
    for (let i = 0; i < GZ; i++) {
      const z = -spanZ + (i / (GZ - 1)) * 2 * spanZ
      grid.push(Array.from({ length: GA }, (_, j) => rayDistance((j / GA) * Math.PI * 2, z)))
    }
    for (let pass = 0; pass < 3; pass++) {
      grid = grid.map((row, i) =>
        row.map((_, j) => {
          const near = [grid[i][(j + 1) % GA], grid[i][(j + GA - 1) % GA], grid[Math.max(0, i - 1)][j], grid[Math.min(GZ - 1, i + 1)][j]]
          return 0.4 * grid[i][j] + 0.15 * near.reduce((sum, d) => sum + d, 0)
        }),
      )
    }
    const wallDistance = (angle: number, z: number) => {
      const fa = ((((angle / (Math.PI * 2)) % 1) + 1) % 1) * GA
      const fz = Math.min(GZ - 1, Math.max(0, ((z + spanZ) / (2 * spanZ)) * (GZ - 1)))
      const j0 = Math.floor(fa) % GA
      const j1 = (j0 + 1) % GA
      const i0 = Math.floor(fz)
      const i1 = Math.min(GZ - 1, i0 + 1)
      const ta = fa - Math.floor(fa)
      const tz = fz - i0
      const a = grid[i0][j0] * (1 - ta) + grid[i0][j1] * ta
      const b = grid[i1][j0] * (1 - ta) + grid[i1][j1] * ta
      return a * (1 - tz) + b * tz
    }
    const point = (angle: number, z: number, radius: number, out: THREE.Vector3) => {
      frameAt(z)
      return out.copy(origin).addScaledVector(across, Math.cos(angle) * radius).addScaledVector(up, Math.sin(angle) * radius)
    }
    const lumenRadius = [0, 1, 2, 3, 4, 5].reduce((sum, i) => sum + wallDistance((i / 6) * Math.PI * 2, 0), 0) / 6
    const mesh = buildTumor(finding, MM, kit, { wallDistance, point, lumenRadius })
    lesionMeshes.push(mesh)

    // Around the tumor: no fine veins, and the folds pulled towards it.
    const reach = (Math.max(finding.lengthMm ?? 0, lesionSizeMm(finding)) / 2) * MM * 1.4
    if (tumorSpots.length < 4) tumorSpots.push(new THREE.Vector4(f.point.x, f.point.y, f.point.z, reach))
    pullFolds(wall, f.point, (k / (tube.points.length - 1)) * tube.length, reach)
  }
  lesionMeshes.forEach((m) => scene.add(m))

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

  const callbacks: ((dt: number) => void)[] = []
  let lastTime = performance.now()
  renderer.setAnimationLoop((ms) => {
    const dt = Math.min(0.1, (ms - lastTime) / 1000) // seconds since the last frame (capped after a pause)
    lastTime = ms
    callbacks.forEach((cb) => cb(Math.max(0, dt)))
    renderer.render(scene, camera)
  })

  const raycaster = new THREE.Raycaster()
  const toPoint = new THREE.Vector3()
  const isVisibleFrom = (from: THREE.Vector3, point: THREE.Vector3) => {
    toPoint.subVectors(point, from)
    const distance = toPoint.length()
    raycaster.set(from, toPoint.normalize())
    const hit = raycaster.intersectObject(coarseWall, false)[0]
    return !hit || hit.distance > distance - 0.02
  }

  return {
    camera,
    canvas: renderer.domElement,
    tube,
    findings: placed.map(({ id, point }) => ({
      id,
      point,
      viewFrom: viewingSpot(tube, tubeIndex(findings.find((x) => x.id === id)!, point), point, isVisibleFrom),
    })),
    onFrame: (cb) => callbacks.push(cb),
    isVisible: (point) => isVisibleFrom(camera.position, point),
    dispose: () => {
      renderer.setAnimationLoop(null)
      callbacks.length = 0
      observer.disconnect()
      lesionMeshes.forEach((m) => m.geometry.dispose())
      kit.dispose()
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

// Put each finding on the inside wall. A finding's position is on the outer surface of the
// model's wall, so step in through the wall to its inner surface.
function placeFindings(model: ColonModel, findings: Finding[]) {
  const places = findingPositions(model, findings)
  const raycaster = new THREE.Raycaster()
  return findings.map((f) => {
    const outside = places[f.id]
    const outward = surfaceNormalAt(model, outside)
    const inward = outward.clone().negate()
    raycaster.set(outside.clone().addScaledVector(inward, 0.0005), inward)
    const wall = raycaster.intersectObjects(model.meshes, false)[0]?.distance ?? 0.02
    const point = outside.clone().addScaledVector(inward, wall)
    return { id: f.id, point, inward }
  })
}

// Pull the haustral folds towards a tumor: near it, the "distance along the colon" used by the
// lining shader is moved towards the tumor's own, so the fold rings bunch up at the tumor.
function pullFolds(wall: THREE.Mesh, at: THREE.Vector3, tumorAlong: number, reach: number) {
  const along = wall.geometry.getAttribute('along') as THREE.BufferAttribute
  const positions = wall.geometry.getAttribute('position')
  const p = new THREE.Vector3()
  for (let i = 0; i < positions.count; i++) {
    p.fromBufferAttribute(positions, i)
    const d = p.distanceTo(at)
    if (d > reach * 2.2) continue
    const pull = 0.45 * (1 - Math.min(1, Math.max(0, (d - reach * 0.6) / (reach * 1.6))))
    along.setX(i, along.getX(i) + (tumorAlong - along.getX(i)) * pull)
  }
  along.needsUpdate = true
}

// Where the camera stops for "Go to finding": a centerline point about 5 cm along the colon
// from the finding, on the anal side (the way a colonoscope comes in), with nothing in between.
// If that is blocked, a little nearer or further, or on the other side.
function viewingSpot(tube: ColonTube, k: number, point: THREE.Vector3, isVisibleFrom: (from: THREE.Vector3, point: THREE.Vector3) => boolean): THREE.Vector3 {
  const step = tube.length / (tube.points.length - 1) // scene units between two points
  const last = tube.points.length - 1
  for (const cm of [5, 4, 6, 3, 7, -5, -4, -6, 2, -3]) {
    const i = Math.min(last, Math.max(0, Math.round(k + (cm * 10 * MM) / step)))
    if (isVisibleFrom(tube.points[i], point)) return tube.points[i].clone()
  }
  return tube.points[Math.min(last, Math.round(k + (50 * MM) / step))].clone()
}

