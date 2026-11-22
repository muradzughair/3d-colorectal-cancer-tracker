// Distance along the colon in cm from the anal verge, for the generic atlas colon (NOT the
// patient's own colon, so every cm value from here is approximate and shown with "about").
// Each colon part gets typical adult values; inside a part the cm are spread evenly along the
// centerline. One helper for the finding positions, the colon map and the Inside view.
import * as THREE from 'three'
import { CENTERLINE, CENTERLINE_PARTS } from '../data/centerline'
import type { SegmentId } from '../data/segments'

// Typical adult cm from the anal verge at the two ends of each part: [cecum end, rectum end].
// The flexures are short bends around 65 cm (splenic) and 110 cm (hepatic).
const PART_CM: Record<string, [number, number]> = {
  cecum: [150, 135],
  ascending: [135, 111],
  hepatic: [111, 109],
  transverse: [109, 66],
  splenic: [66, 64],
  descending: [64, 40],
  sigmoid: [40, 15],
  rectum: [15, 0],
}

// Arc length along the centerline up to each point (model units).
const ARC: number[] = [0]
for (let i = 1; i < CENTERLINE.length; i++) {
  const [a, b] = [CENTERLINE[i - 1], CENTERLINE[i]]
  ARC.push(ARC[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]))
}
const LAST = CENTERLINE.length - 1

// The cm value at each centerline point: each part is stretched over its cm range, measured
// from the middle of the gap to the previous part to the middle of the gap to the next one.
const CM: number[] = new Array(CENTERLINE.length).fill(0)
CENTERLINE_PARTS.forEach((part, p) => {
  const start = p === 0 ? 0 : (ARC[part.from] + ARC[CENTERLINE_PARTS[p - 1].to]) / 2
  const end = p === CENTERLINE_PARTS.length - 1 ? ARC[LAST] : (ARC[part.to] + ARC[CENTERLINE_PARTS[p + 1].from]) / 2
  const [cmStart, cmEnd] = PART_CM[part.segment]
  for (let i = part.from; i <= part.to; i++) {
    const f = Math.min(1, Math.max(0, (ARC[i] - start) / (end - start || 1)))
    CM[i] = cmStart + (cmEnd - cmStart) * f
  }
})

// cm from the anal verge at a (fractional) centerline index, from 0 (cecum) to the last point.
export function cmAtIndex(index: number): number {
  const i = Math.min(LAST, Math.max(0, index))
  const a = Math.floor(i)
  const b = Math.min(LAST, a + 1)
  return CM[a] + (CM[b] - CM[a]) * (i - a)
}

// The (fractional) centerline index at a cm value (the inverse of cmAtIndex).
export function indexAtCm(cm: number): number {
  const c = Math.min(CM[0], Math.max(0, cm))
  for (let i = 0; i < LAST; i++) {
    if (c <= CM[i] && c >= CM[i + 1]) return i + (CM[i] - c) / (CM[i] - CM[i + 1] || 1)
  }
  return c >= CM[0] ? 0 : LAST
}

// The colon part at a cm value.
export function segmentAtCm(cm: number): SegmentId {
  const at = Math.round(indexAtCm(cm))
  return (CENTERLINE_PARTS.find((p) => at >= p.from && at <= p.to) ?? CENTERLINE_PARTS[CENTERLINE_PARTS.length - 1]).segment
}

// A typical cm value for a part (its middle), used when a finding has no distance.
export function middleCm(segment: SegmentId): number {
  const range = PART_CM[segment] ?? PART_CM.cecum // the appendix counts as the cecum
  return (range[0] + range[1]) / 2
}

// The centerline in model coordinates (as in colon.glb), for the 3D views.
export function centerlinePoint(index: number, out = new THREE.Vector3()): THREE.Vector3 {
  const i = Math.min(LAST, Math.max(0, index))
  const a = Math.floor(i)
  const b = Math.min(LAST, a + 1)
  const f = i - a
  return out.set(...CENTERLINE[a]).lerp(new THREE.Vector3(...CENTERLINE[b]), f)
}

// The nearest (fractional) centerline index to a point given in model coordinates.
export function nearestCenterlineIndex(point: THREE.Vector3): number {
  let best = 0
  let bestDistance = Infinity
  CENTERLINE.forEach((p, i) => {
    const d = (p[0] - point.x) ** 2 + (p[1] - point.y) ** 2 + (p[2] - point.z) ** 2
    if (d < bestDistance) {
      bestDistance = d
      best = i
    }
  })
  return best
}

// "about 30 cm" (from the model) or "8 cm" (measured), and the short "~30 cm" form.
export function cmText(cm: number, measured: boolean, short = false): string {
  const value = Math.round(cm)
  if (measured) return `${value} cm`
  return short ? `~${value} cm` : `about ${value} cm`
}
