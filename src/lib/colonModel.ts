// Loads colon.glb, makes it look smooth and realistic, and centres it in the view.
// The model file itself is never changed; all improvements happen here in code.
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { PART_TO_SEGMENT, SEGMENTS, type SegmentId } from '../data/segments'

// A point on the colon surface (in scene coordinates) with its outward direction.
export interface SurfacePoint {
  position: THREE.Vector3
  normal: THREE.Vector3
}

export interface ColonModel {
  root: THREE.Group // add this to the scene
  meshes: THREE.Mesh[] // one mesh per model part (used for clicking)
  anchors: Record<SegmentId, SurfacePoint> // one front-facing point per segment (for labels)
}

// Final height of the model in scene units (the original is only about 0.3 units tall).
const MODEL_SIZE = 2

export async function loadColonModel(url: string): Promise<ColonModel> {
  const gltf = await new GLTFLoader().loadAsync(url)
  const model = gltf.scene
  const meshes: THREE.Mesh[] = []

  model.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return
    const segment = PART_TO_SEGMENT[obj.name]
    if (!segment) return
    obj.geometry = smoothGeometry(obj.geometry)
    obj.material = tissueMaterial(segment)
    obj.userData.tissue = obj.material // remembered, so a greyed-out segment can be restored
    obj.userData.segment = segment
    meshes.push(obj)
  })

  // Centre the model at (0, 0, 0) and scale it up so it fills the view.
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  model.position.sub(center)
  const root = new THREE.Group()
  root.add(model)
  root.scale.setScalar(MODEL_SIZE / Math.max(size.x, size.y, size.z))
  root.updateMatrixWorld(true)

  return { root, meshes, anchors: findAnchors(meshes) }
}

// The model is low-detail and looks faceted. Joining duplicate corner points and
// recomputing the normals lets the light shade it smoothly.
function smoothGeometry(original: THREE.BufferGeometry): THREE.BufferGeometry {
  let geometry = original.clone()
  geometry.deleteAttribute('normal') // old flat normals would stop points from merging
  geometry = mergeVertices(geometry, 1e-5)
  geometry.computeVertexNormals()
  return geometry
}

// Soft pink, slightly moist-looking tissue material.
function tissueMaterial(segment: SegmentId): THREE.MeshPhysicalMaterial {
  const color = SEGMENTS.find((s) => s.id === segment)!.color
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.45,
    clearcoat: 0.6, // thin shiny layer on top = moist look
    clearcoatRoughness: 0.22,
    sheen: 0.35, // soft velvety highlight at grazing angles
    sheenColor: new THREE.Color('#ffe2df'),
    sheenRoughness: 0.6,
  })
}

// For each segment, pick a surface point that faces the viewer (front = +z)
// and lies near the middle of that segment. Used to attach labels.
function findAnchors(meshes: THREE.Mesh[]): Record<SegmentId, SurfacePoint> {
  const anchors = {} as Record<SegmentId, SurfacePoint>
  for (const segment of SEGMENTS) {
    const mesh = meshes.find((m) => m.name === segment.part)
    if (mesh) anchors[segment.id] = frontPointNear(mesh, getMeshCenter(mesh))
  }
  return anchors
}

// A picture does not tell us exactly where in a segment a finding is, so we pick an
// estimated point on the part of the segment you can see from the front. The 1st finding
// goes near the middle; the 2nd, 3rd... go a little apart so pins don't sit on each other.
const PIN_GAP = 0.16 // minimum distance between estimated pins in one segment (scene units)
const visibleCache = new WeakMap<ColonModel, Map<SegmentId, THREE.Vector3[]>>() // computed once

export function estimatedPoint(model: ColonModel, segment: SegmentId, index: number): THREE.Vector3 {
  if (!visibleCache.has(model)) visibleCache.set(model, new Map())
  const cache = visibleCache.get(model)!
  if (!cache.has(segment)) cache.set(segment, visibleFrontPoints(model, segment))
  const candidates = cache.get(segment)!

  // Walk outwards from the middle, keeping only points far enough from those already used.
  const chosen: THREE.Vector3[] = []
  for (const point of candidates) {
    if (chosen.every((c) => c.distanceTo(point) >= PIN_GAP)) chosen.push(point)
    if (chosen.length > index) return point
  }
  return chosen[index % chosen.length] // tiny segment: share a spot
}

// Shoot straight rays from the front over a grid of points. Keep the points where the first
// surface hit belongs to this segment (= visible from the front), sorted from the middle out.
function visibleFrontPoints(model: ColonModel, segment: SegmentId): THREE.Vector3[] {
  const part = SEGMENTS.find((s) => s.id === segment)!.part
  const mesh = model.meshes.find((m) => m.name === part)!
  const box = new THREE.Box3().setFromObject(mesh)
  const center = box.getCenter(new THREE.Vector3())
  const raycaster = new THREE.Raycaster()
  const forward = new THREE.Vector3(0, 0, -1)
  const points: THREE.Vector3[] = []
  const steps = 14

  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= steps; j++) {
      const x = box.min.x + ((box.max.x - box.min.x) * i) / steps
      const y = box.min.y + ((box.max.y - box.min.y) * j) / steps
      raycaster.set(new THREE.Vector3(x, y, 10), forward)
      const hit = raycaster.intersectObjects(model.meshes, false)[0]
      if (hit && hit.object === mesh) points.push(hit.point.clone())
    }
  }
  // Fall back to any front-facing point if the segment is hidden from the front.
  if (points.length === 0) points.push(frontPointNear(mesh, center).position)
  return points.sort((a, b) => a.distanceTo(center) - b.distanceTo(center))
}

// Centre of a mesh's bounding box, in scene coordinates.
export function getMeshCenter(mesh: THREE.Mesh): THREE.Vector3 {
  return new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3())
}

// Find the surface point of a mesh closest to `target` that faces the front.
export function frontPointNear(mesh: THREE.Mesh, target: THREE.Vector3): SurfacePoint {
  const positions = mesh.geometry.getAttribute('position')
  const normals = mesh.geometry.getAttribute('normal')
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)
  const p = new THREE.Vector3()
  const n = new THREE.Vector3()
  let best: SurfacePoint | null = null
  let bestScore = Infinity

  for (let i = 0; i < positions.count; i++) {
    p.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld)
    n.fromBufferAttribute(normals, i).applyMatrix3(normalMatrix).normalize()
    // Low score = close to the target (sideways) and facing the viewer.
    const sideways = Math.hypot(p.x - target.x, p.y - target.y)
    const score = sideways - 0.15 * n.z - 0.3 * p.z
    if (score < bestScore) {
      bestScore = score
      best = { position: p.clone(), normal: n.clone() }
    }
  }
  return best!
}

// The outward direction of the colon surface at a point on it: the normal of the model
// triangle closest to the point. Used to stand the growth on the surface in the close-up.
export function surfaceNormalAt(model: ColonModel, point: THREE.Vector3): THREE.Vector3 {
  const corner = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
  const triangle = new THREE.Triangle()
  const closest = new THREE.Vector3()
  const smooth = new THREE.Vector3()
  const best = new THREE.Vector3(0, 0, 1)
  let bestDistance = Infinity

  for (const mesh of model.meshes) {
    const positions = mesh.geometry.getAttribute('position')
    const normals = mesh.geometry.getAttribute('normal')
    const index = mesh.geometry.index
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)
    const triangleCount = (index ? index.count : positions.count) / 3

    for (let t = 0; t < triangleCount; t++) {
      const ids = [0, 1, 2].map((k) => (index ? index.getX(t * 3 + k) : t * 3 + k))
      ids.forEach((id, k) => corner[k].fromBufferAttribute(positions, id).applyMatrix4(mesh.matrixWorld))
      triangle.set(corner[0], corner[1], corner[2])
      const distance = triangle.closestPointToPoint(point, closest).distanceToSquared(point)
      if (distance >= bestDistance) continue
      bestDistance = distance
      triangle.getNormal(best)
      // Make sure it points outwards: it must agree with the smoothed model normals.
      smooth.set(0, 0, 0)
      ids.forEach((id) => smooth.add(new THREE.Vector3().fromBufferAttribute(normals, id).applyMatrix3(normalMatrix)))
      if (best.dot(smooth) < 0) best.negate()
    }
  }
  return best.clone()
}

// Soft grey, slightly see-through material for a segment that is removed by surgery.
const removedMaterial = new THREE.MeshPhysicalMaterial({
  color: '#b4bbc6',
  roughness: 0.6,
  transparent: true,
  opacity: 0.3,
  depthWrite: false,
})

// Show the given segments greyed out and transparent; all other segments look normal.
export function setRemovedSegments(model: ColonModel, removed: SegmentId[]) {
  for (const mesh of model.meshes) {
    mesh.material = removed.includes(mesh.userData.segment) ? removedMaterial : mesh.userData.tissue
  }
}
