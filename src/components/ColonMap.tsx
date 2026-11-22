// A flat colon map like a report diagram (plain SVG, no box): the colon as a tube from the
// cecum to the anal verge, the part names beside it (they follow the "Names" toggle), a ruler
// in cm from the anal verge with a tick every 10 cm, and a mark for each lesion at its cm
// position (blue polyp, red tumor, grey removed) with its code. Clicking a mark opens it.
import { useNamesVisible } from '../lib/namesSetting'
import type { FindingKind } from '../types'

export interface MapLesion {
  id: string
  code: string
  kind: FindingKind
  cm: number
  removed?: boolean
}

// The drawing path with the cm from the anal verge at each corner (typical adult lengths,
// as in src/lib/colonDistance.ts).
const PATH: { x: number; y: number; cm: number }[] = [
  { x: 46, y: 168, cm: 150 }, // bottom of the cecum
  { x: 46, y: 150, cm: 135 },
  { x: 46, y: 54, cm: 112 },
  { x: 60, y: 40, cm: 108 }, // hepatic flexure
  { x: 206, y: 40, cm: 67 },
  { x: 220, y: 54, cm: 63 }, // splenic flexure
  { x: 220, y: 142, cm: 40 },
  { x: 202, y: 166, cm: 32 },
  { x: 166, y: 162, cm: 24 },
  { x: 146, y: 150, cm: 18 },
  { x: 136, y: 160, cm: 15 }, // start of the rectum
  { x: 136, y: 200, cm: 0 }, // anal verge
]

// The point (and the direction of the tube) at a cm value.
function at(cm: number): { x: number; y: number; dx: number; dy: number } {
  const c = Math.min(150, Math.max(0, cm))
  for (let i = 0; i < PATH.length - 1; i++) {
    const a = PATH[i]
    const b = PATH[i + 1]
    if (c <= a.cm && c >= b.cm) {
      const f = (a.cm - c) / (a.cm - b.cm || 1)
      const length = Math.hypot(b.x - a.x, b.y - a.y) || 1
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, dx: (b.x - a.x) / length, dy: (b.y - a.y) / length }
    }
  }
  const last = PATH[PATH.length - 1]
  return { x: last.x, y: last.y, dx: 0, dy: 1 }
}

const LINE = PATH.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')

// Part names and where they go beside the tube.
const NAMES: { text: string; x: number; y: number; anchor: 'start' | 'end' | 'middle' }[] = [
  { text: 'Cecum', x: 30, y: 172, anchor: 'end' },
  { text: 'Ascending', x: 26, y: 80, anchor: 'end' },
  { text: 'Transverse', x: 133, y: 20, anchor: 'middle' },
  { text: 'Descending', x: 240, y: 96, anchor: 'start' },
  { text: 'Sigmoid', x: 190, y: 190, anchor: 'middle' },
  { text: 'Rectum', x: 122, y: 192, anchor: 'end' },
]

export default function ColonMap({ lesions, onOpen }: { lesions: MapLesion[]; onOpen: (id: string) => void }) {
  const showNames = useNamesVisible()
  const ticks = Array.from({ length: 16 }, (_, i) => i * 10) // 0 to 150 cm

  return (
    <figure className="colon-map">
      <svg viewBox="-34 6 344 222" role="img" aria-label="Colon map with lesions by distance from the anal verge">
        <path className="map-tube" d={LINE} />
        <path className="map-tube-core" d={LINE} />

        {/* The ruler: a tick every 10 cm, a number every 20 cm. */}
        {ticks.map((cm) => {
          const p = at(cm)
          const nx = -p.dy // across the tube
          const ny = p.dx
          const big = cm % 20 === 0
          return (
            <g key={cm} className="map-tick">
              <line x1={p.x + nx * 8} y1={p.y + ny * 8} x2={p.x + nx * (big ? 13 : 11)} y2={p.y + ny * (big ? 13 : 11)} />
              {big && (
                <text x={p.x + nx * 19} y={p.y + ny * 19 + 3} textAnchor="middle">
                  {cm}
                </text>
              )}
            </g>
          )
        })}

        {showNames &&
          NAMES.map((n) => (
            <text key={n.text} className="map-name" x={n.x} y={n.y} textAnchor={n.anchor}>
              {n.text}
            </text>
          ))}
        <text className="map-name" x={136} y={216} textAnchor="middle">
          Anal verge (0 cm)
        </text>

        {[...lesions].sort((a, b) => a.cm - b.cm).map((l, i, sorted) => {
          const p = at(l.cm)
          // Lesions within 5 cm of each other share one text with all their codes.
          const startsGroup = i === 0 || l.cm - sorted[i - 1].cm > 5
          let codes = ''
          if (startsGroup) {
            const group = [l]
            for (let j = i + 1; j < sorted.length && sorted[j].cm - sorted[j - 1].cm <= 5; j++) group.push(sorted[j])
            codes = group
              .map((g) => g.code)
              .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
              .join(', ')
          }
          return (
            <g
              key={l.id}
              className={`map-mark map-mark-${l.removed ? 'removed' : l.kind}`}
              onClick={() => onOpen(l.id)}
              tabIndex={0}
              role="button"
              aria-label={`${l.code}, about ${Math.round(l.cm)} cm`}
              onKeyDown={(e) => e.key === 'Enter' && onOpen(l.id)}
            >
              <circle cx={p.x} cy={p.y} r={6} />
              {/* The code sits on the other side of the tube from the ruler. */}
              {codes && (
                <text x={p.x + p.dy * 16} y={p.y - p.dx * 16 + 4} textAnchor={Math.abs(p.dx) > 0.5 ? 'middle' : p.dy < 0 ? 'end' : 'start'}>
                  {codes}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <figcaption className="muted">cm from the anal verge, approximate (typical adult colon)</figcaption>
    </figure>
  )
}
