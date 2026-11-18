// A cross-section of the colon wall, drawn as a simple picture with labelled layers.
// If `growth` is given, a growth is drawn on the lining that gets bigger and deeper.

// Layer positions (top to bottom) in drawing units. The picture is 420 x 190 units; the
// layers are drawn extra wide so they fill the box on wide screens too.
const SURFACE = 56 // top of the inner lining
const LAYERS = [
  { name: 'Inside of the colon', top: 0, bottom: SURFACE, color: '#f8f4f3', text: '#8a7a78' },
  { name: 'Inner lining', top: SURFACE, bottom: 86, color: '#f0b6b2', text: '#6e3c3a' },
  { name: 'Under the lining', top: 86, bottom: 116, color: '#f7e2cd', text: '#6d5638' },
  { name: 'Muscle layer', top: 116, bottom: 162, color: '#d9898b', text: '#5a2629' },
  { name: 'Outer layer', top: 162, bottom: 176, color: '#eed3cf', text: '#6e4a46' },
]
export const WALL_DEPTH = 176 - SURFACE // from the lining surface to the bottom of the outer layer

export interface Growth {
  width: number // width of the part above the surface
  height: number // how far it bulges into the inside of the colon
  depth: number // how far it has grown down into the wall (0 = not at all)
  color: string
}

const GROWTH_X = 280 // the growth sits on the right, away from the layer labels

export default function WallCrossSection({ growth }: { growth: Growth | null }) {
  return (
    <svg className="wall" viewBox="0 0 420 190" preserveAspectRatio="xMinYMid meet">
      {LAYERS.map((layer) => (
        <rect key={layer.name} x={0} y={layer.top} width={2000} height={layer.bottom - layer.top} fill={layer.color} />
      ))}

      {/* Thin lines inside the muscle layer to suggest muscle fibres. */}
      {[128, 139, 150].map((y) => (
        <line key={y} x1={0} x2={2000} y1={y} y2={y} stroke="#c97376" strokeWidth={0.6} opacity={0.5} />
      ))}

      {growth && <path d={growthPath(growth)} fill={growth.color} fillOpacity={0.88} stroke={growth.color} strokeWidth={1.2} />}

      {LAYERS.map((layer) => (
        <text
          key={layer.name}
          x={8}
          y={(layer.top + layer.bottom) / 2}
          dominantBaseline="central"
          fontSize={layer.bottom - layer.top < 20 ? 10 : 11.5}
          fill={layer.text}
        >
          {layer.name}
        </text>
      ))}
    </svg>
  )
}

// The growth outline: a dome on the lining, plus a tapering root that grows down into the wall.
function growthPath({ width, height, depth }: Growth): string {
  const x = GROWTH_X
  const left = x - width / 2
  const right = x + width / 2
  const top = SURFACE - height / 0.75 // a curve only reaches 3/4 of the way to its control points
  let d = `M ${left} ${SURFACE}`
  d += ` C ${left} ${top}, ${right} ${top}, ${right} ${SURFACE}` // dome above the lining
  if (depth > 0) {
    const root = Math.min(width * 0.36, 20 + depth * 0.4) // half-width of the root
    const bottom = SURFACE + depth
    d += ` L ${x + root} ${SURFACE}`
    d += ` C ${x + root * 1.25} ${SURFACE + depth * 0.55}, ${x + root * 0.7} ${bottom}, ${x} ${bottom}` // right side, down
    d += ` C ${x - root * 0.7} ${bottom}, ${x - root * 1.25} ${SURFACE + depth * 0.55}, ${x - root} ${SURFACE}` // left side, up
  }
  return d + ' Z'
}
