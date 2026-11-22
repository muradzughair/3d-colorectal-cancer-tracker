// A small flat front view of the colon centerline for the Inside view (plain SVG, no box):
// a dot for the camera, a short arrow for its heading, and marks for the findings (blue
// polyps, red tumors). Clicking a point on the line asks to move the camera there.
// The camera dot and arrow change every frame, so they are moved through setCamera (no
// re-render of the whole map).
import { useEffect, useMemo, useRef } from 'react'
import type { FindingKind } from '../types'

export interface MapPoint {
  x: number
  y: number
}

export interface MiniMapMark {
  id: string
  kind: FindingKind
  point: MapPoint
}

interface Props {
  line: MapPoint[] // the centerline, front view (x to the right, y up), in scene units
  marks: MiniMapMark[]
  onPick: (index: number) => void // index of the centerline point nearest to the click
  // Gives the parent a function to move the camera dot: position and heading (front view).
  register: (setCamera: (position: MapPoint, heading: MapPoint) => void) => void
}

const W = 150
const H = 170
const PAD = 10

export default function InsideMiniMap({ line, marks, onPick, register }: Props) {
  const dot = useRef<SVGCircleElement>(null)
  const arrow = useRef<SVGLineElement>(null)

  // Fit the line into the small box (same scale for x and y).
  const fit = useMemo(() => {
    const xs = line.map((p) => p.x)
    const ys = line.map((p) => p.y)
    const minX = Math.min(...xs)
    const maxY = Math.max(...ys)
    const s = Math.min((W - 2 * PAD) / (Math.max(...xs) - minX || 1), (H - 2 * PAD) / (maxY - Math.min(...ys) || 1))
    const offsetX = (W - (Math.max(...xs) - minX) * s) / 2
    return { s, toX: (x: number) => offsetX + (x - minX) * s, toY: (y: number) => PAD + (maxY - y) * s }
  }, [line])

  const path = useMemo(() => line.map((p, i) => `${i ? 'L' : 'M'}${fit.toX(p.x).toFixed(1)},${fit.toY(p.y).toFixed(1)}`).join(' '), [line, fit])

  useEffect(() => {
    register((position, heading) => {
      const x = fit.toX(position.x)
      const y = fit.toY(position.y)
      dot.current?.setAttribute('cx', x.toFixed(1))
      dot.current?.setAttribute('cy', y.toFixed(1))
      const length = Math.hypot(heading.x, heading.y) || 1
      arrow.current?.setAttribute('x1', x.toFixed(1))
      arrow.current?.setAttribute('y1', y.toFixed(1))
      arrow.current?.setAttribute('x2', (x + (heading.x / length) * 12).toFixed(1))
      arrow.current?.setAttribute('y2', (y - (heading.y / length) * 12).toFixed(1))
    })
  }, [register, fit])

  // Click: the nearest centerline point to the click (in the drawing).
  const pick = (e: React.MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const cx = ((e.clientX - box.left) / box.width) * W
    const cy = ((e.clientY - box.top) / box.height) * H
    let best = 0
    let bestDistance = Infinity
    line.forEach((p, i) => {
      const d = (fit.toX(p.x) - cx) ** 2 + (fit.toY(p.y) - cy) ** 2
      if (d < bestDistance) {
        bestDistance = d
        best = i
      }
    })
    onPick(best)
  }

  return (
    <svg className="inside-minimap" viewBox={`0 0 ${W} ${H}`} width={W} height={H} onClick={pick} role="img" aria-label="Map of the colon. Click to move the camera there.">
      <path className="minimap-line" d={path} />
      {marks.map((m) => (
        <circle key={m.id} className={`minimap-mark minimap-${m.kind}`} cx={fit.toX(m.point.x)} cy={fit.toY(m.point.y)} r={4} />
      ))}
      <line ref={arrow} className="minimap-arrow" />
      <circle ref={dot} className="minimap-camera" r={4} />
    </svg>
  )
}
