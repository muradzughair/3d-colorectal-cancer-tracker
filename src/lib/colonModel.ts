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
// estimated point: the middle of the segment's front, and for the 2nd, 3rd... finding in
// the same segment, a little further along so the pins do not sit on top of each other.
export function estimatedPoint(model: ColonModel, segment: SegmentId, index: number): SurfacePoint {
  const part = SEGMENTS.find((s) => s.id === segment)!.part
  const mesh = model.meshes.find((m) => m.name === part)!
  const box = new THREE.Box3().setFromObject(mesh)
  const size = box.getSize(new THREE.Vector3())
  const target = box.getCenter(new THREE.Vector3())
  // Steps along the longer side of the segment: 0, +1, -1, +2, -2 ...
  const step = Math.ceil(index / 2) * (index % 2 === 1 ? 1 : -1) * 0.15
  if (size.x > size.y) target.x += step * size.x
  else target.y += step * size.y
  return frontPointNear(mesh, target)
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
