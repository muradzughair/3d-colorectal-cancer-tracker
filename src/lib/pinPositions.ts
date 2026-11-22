// Where each finding sits on the 3D colon. All pages use this, so a finding is at the same
// spot everywhere:
//   - a finding with a distance from the anal verge is placed from that distance (on the
//     centerline, then out to the wall; for the rectum the clock position gives the side)
//   - a manual mark without a distance has its exact clicked point
//   - any other finding (old AI findings) gets an estimated spot in its segment (several
//     findings in one segment are spread apart)
import * as THREE from 'three'
import { estimatedPoint, type ColonModel } from './colonModel'
import { centerlinePoint, indexAtCm, nearestCenterlineIndex, cmAtIndex } from './colonDistance'
import type { SegmentId } from '../data/segments'
import type { Finding } from '../types'

const FRONT = new THREE.Vector3(0, 0, 1) // towards the viewer of the front view (the patient's front)
const LEFT = new THREE.Vector3(1, 0, 0) // the patient's left (the viewer's right)
const WALL_MAX = 0.15 // the most the inner and outer surface of the wall are apart (scene units)

// A point on the colon wall at a distance from the anal verge.
export function pointAtCm(model: ColonModel, cm: number, clock?: number): THREE.Vector3 {
  const space = model.root.children[0].matrixWorld // model coordinates to scene coordinates
  const i = indexAtCm(cm)
  const center = centerlinePoint(i).applyMatrix4(space)
  const tangent = centerlinePoint(i + 0.5).applyMatrix4(space).sub(centerlinePoint(i - 0.5).applyMatrix4(space)).normalize()

  // The side of the wall: the clock face (12 = front, 3 = patient's left), or the front.
  const angle = clock ? (clock / 12) * Math.PI * 2 : 0
  const side = FRONT.clone().multiplyScalar(Math.cos(angle)).addScaledVector(LEFT, Math.sin(angle))
  side.addScaledVector(tangent, -side.dot(tangent)) // across the colon, not along it
  if (side.lengthSq() < 1e-6) side.set(0, 1, 0).addScaledVector(tangent, -tangent.y)
  side.normalize()

  // The wall has an inner and an outer surface: take the outer one of the first wall crossed
  // (the 3D views show the outside; the Inside view steps back in through the wall).
  // (Both sides of the surface must count here, whatever the material draws.)
  const sides = model.meshes.map((m) => (m.material as THREE.Material).side)
  model.meshes.forEach((m) => ((m.material as THREE.Material).side = THREE.DoubleSide))
  const hits = new THREE.Raycaster(center, side).intersectObjects(model.meshes, false)
  model.meshes.forEach((m, i) => ((m.material as THREE.Material).side = sides[i]))
  if (hits.length === 0) return center
  const outer = hits[1] && hits[1].distance - hits[0].distance < WALL_MAX ? hits[1] : hits[0]
  return outer.point.clone()
}

// The approximate cm from the anal verge of a point on the 3D colon (scene coordinates).
export function cmAtPoint(model: ColonModel, point: THREE.Vector3): number {
  const inverse = model.root.children[0].matrixWorld.clone().invert()
  return cmAtIndex(nearestCenterlineIndex(point.clone().applyMatrix4(inverse)))
}

export function findingPositions(model: ColonModel, findings: Finding[]): Record<string, THREE.Vector3> {
  const countPerSegment: Partial<Record<SegmentId, number>> = {}
  const positions: Record<string, THREE.Vector3> = {}

  for (const f of findings) {
    if (f.distanceFromAnalVergeCm !== undefined) {
      positions[f.id] = pointAtCm(model, f.distanceFromAnalVergeCm, f.segment === 'rectum' ? f.clockPosition : undefined)
    } else if (f.position) {
      positions[f.id] = new THREE.Vector3(...f.position) // manual mark: exact point
    } else {
      const index = countPerSegment[f.segment] ?? 0
      countPerSegment[f.segment] = index + 1
      positions[f.id] = estimatedPoint(model, f.segment, index)
    }
  }
  return positions
}
