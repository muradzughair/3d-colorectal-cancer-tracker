// The inside of the colon as a "tube" around its centerline, for the free camera in the
// Inside view: where the camera may go (inside the lumen, never through the wall), the
// nearest centerline point, and which colon part a point is in.
// Pure geometry (no drawing). Points and radii must be in the same units.
import * as THREE from 'three'
import { CENTERLINE_PARTS } from '../data/centerline'
import type { SegmentId } from '../data/segments'

export interface ColonTube {
  points: THREE.Vector3[] // evenly spaced along the centerline, from the cecum (0) to the rectum (last)
  tangents: THREE.Vector3[] // the direction of the colon at each point (towards the rectum)
  radii: number[] // how far from the centerline the camera may go at each point
  length: number
  nearest: (position: THREE.Vector3, hint: number) => number // index of the nearest point, searched near hint
  nearestAnywhere: (position: THREE.Vector3) => number // index of the nearest point, searched everywhere
  constrain: (position: THREE.Vector3, hint: number) => number // moves position inside; returns the nearest index
  segmentAt: (index: number) => SegmentId
}

const SEARCH = 30 // how many points around the last known one are searched

// centerline: points of the original centerline; innerRadii: the inner radius at each of them.
// keepOut: the share of the radius kept free near the wall and the haustral folds. Half the
// radius was tested against the model wall: no way out, and the camera stays about 3 mm away.
export function createColonTube(centerline: THREE.Vector3[], innerRadii: number[], count = 600, keepOut = 0.5): ColonTube {
  const curve = new THREE.CatmullRomCurve3(centerline)
  const points = curve.getSpacedPoints(count - 1)
  const tangents = points.map((_, i) => curve.getTangentAt(i / (count - 1)).normalize())
  const last = centerline.length - 1

  // The radius at each spaced point, from the nearest original points. The smallest of the
  // neighbours is used, so a narrow spot is never skipped.
  const radii = points.map((_, i) => {
    const at = (i / (count - 1)) * last
    const a = Math.max(0, Math.floor(at) - 1)
    const b = Math.min(last, Math.ceil(at) + 1)
    let r = Infinity
    for (let k = a; k <= b; k++) r = Math.min(r, innerRadii[Math.min(k, innerRadii.length - 1)])
    return r * (1 - keepOut)
  })

  const nearest = (position: THREE.Vector3, hint: number) => {
    let best = Math.min(count - 1, Math.max(0, hint))
    let bestDistance = points[best].distanceToSquared(position)
    // Search a window around the hint; if the best is at the window's edge, keep going that way.
    let from = best - SEARCH
    let to = best + SEARCH
    for (let pass = 0; pass < 20; pass++) {
      const start = best
      for (let i = Math.max(0, from); i <= Math.min(count - 1, to); i++) {
        const d = points[i].distanceToSquared(position)
        if (d < bestDistance) {
          bestDistance = d
          best = i
        }
      }
      if (best === start || (best > from + 1 && best < to - 1)) break
      from = best - SEARCH
      to = best + SEARCH
    }
    return best
  }

  const offset = new THREE.Vector3()
  const radial = new THREE.Vector3()
  const constrain = (position: THREE.Vector3, hint: number) => {
    const k = nearest(position, hint)
    const center = points[k]
    const tangent = tangents[k]
    offset.subVectors(position, center)
    let along = offset.dot(tangent)
    radial.copy(offset).addScaledVector(tangent, -along)
    // End stops: no further than the first and the last point.
    if (k === 0 && along < 0) along = 0
    if (k === count - 1 && along > 0) along = 0
    // Too far from the centerline: keep the direction, shorten it (this slides along the wall).
    const limit = radii[k]
    const distance = radial.length()
    if (distance > limit) radial.multiplyScalar(limit / distance)
    position.copy(center).addScaledVector(tangent, along).add(radial)
    return k
  }

  // Index ranges of the parts are given on the original centerline points.
  const segmentAt = (index: number) => {
    const at = Math.round((index / (count - 1)) * last)
    return (CENTERLINE_PARTS.find((p) => at >= p.from && at <= p.to) ?? CENTERLINE_PARTS[CENTERLINE_PARTS.length - 1]).segment
  }

  const nearestAnywhere = (position: THREE.Vector3) => {
    let best = 0
    let bestDistance = Infinity
    points.forEach((p, i) => {
      const d = p.distanceToSquared(position)
      if (d < bestDistance) {
        bestDistance = d
        best = i
      }
    })
    return best
  }

  return { points, tangents, radii, length: curve.getLength(), nearest, nearestAnywhere, constrain, segmentAt }
}
