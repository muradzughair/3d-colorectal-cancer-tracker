// Where each finding sits on the 3D colon. All pages use this, so a finding is at the same
// spot everywhere. A manual mark has its exact point; a picture finding gets an estimated spot
// in its segment (several findings in one segment are spread apart).
import * as THREE from 'three'
import { estimatedPoint, type ColonModel } from './colonModel'
import type { SegmentId } from '../data/segments'
import type { Finding } from '../types'

export function findingPositions(model: ColonModel, findings: Finding[]): Record<string, THREE.Vector3> {
  const countPerSegment: Partial<Record<SegmentId, number>> = {}
  const positions: Record<string, THREE.Vector3> = {}

  for (const f of findings) {
    if (f.position) {
      positions[f.id] = new THREE.Vector3(...f.position) // manual mark: exact point
    } else {
      const index = countPerSegment[f.segment] ?? 0
      countPerSegment[f.segment] = index + 1
      positions[f.id] = estimatedPoint(model, f.segment, index)
    }
  }
  return positions
}
