// Page 2: what-if time slider. Left: a 3D close-up of the polyp that grows over time.
// Right: the colon wall if the polyp is removed now, and if it is left in place.
// This is an illustration with assumed numbers, NOT a prediction.
import { useState, type CSSProperties } from 'react'
import PolypCloseup from '../components/PolypCloseup'
import NamesToggle from '../components/NamesToggle'
import WallCrossSection, { WALL_DEPTH, type Growth } from '../components/WallCrossSection'
import { getSegment } from '../data/segments'
import { formatSize } from '../lib/findings'
import { lesionName, type LesionCode } from '../lib/lesions'
import type { Finding } from '../types'

// ASSUMED values. Edit freely. Years for a polyp left in place to grow from a small polyp
// to reaching the outer layer of the wall, for each growth speed.
const YEARS_TO_OUTER_LAYER = {
  slow: 15, // ASSUMED
  medium: 10, // ASSUMED
  fast: 5, // ASSUMED
}

type Speed = keyof typeof YEARS_TO_OUTER_LAYER
const SPEEDS: Speed[] = ['slow', 'medium', 'fast']

const EXAMPLE_POLYP_MM = 5 // size of the generic example polyp when no polyp is selected
const MAX_START_MM = 30 // largest starting size the drawing can show

// Once the growth passes the inner lining it is shown as a tumor (depth in drawing units,
// matching the layers in WallCrossSection). The 3D growth turns red at the same moment.
const TUMOR_DEPTH = 30

// Stage text for the current point in time.
function stageText(progress: number, depth: number): string {
  if (progress < 0.15) return 'Small polyp on the surface'
  if (depth < TUMOR_DEPTH) return 'Polyp growing larger on the surface'
  if (depth < 60) return 'Growing into the wall, now a tumor'
  if (depth < 106) return 'Deep in the wall, in the muscle layer'
  return 'Through the wall, reaching the outer layer'
}

interface Props {
  findings: Finding[]
  codes: Record<string, LesionCode>
  selectedId: string | null
}

export default function TimePage({ findings, codes, selectedId }: Props) {
  const [speed, setSpeed] = useState<Speed>('medium')
  const [progress, setProgress] = useState(0) // 0 = now, 1 = end of the time range

  // Use the selected polyp, or a generic example polyp if no polyp is selected.
  // The illustration starts from its measured size; the doctor can change that size here.
  const selected = findings.find((f) => f.id === selectedId && f.kind === 'polyp')
  const measuredMm = selected?.size?.unit === 'mm' ? selected.size.value : EXAMPLE_POLYP_MM
  const [sizeText, setSizeText] = useState(String(measuredMm))
  const startMm = Math.min(MAX_START_MM, Math.max(1, Number(sizeText) || measuredMm))
  const subject = selected
    ? `${lesionName(selected, codes)} · ${getSegment(selected.segment).name} · ${formatSize(selected.size)}`
    : 'Example polyp in the sigmoid colon (no polyp selected)'

  const totalYears = YEARS_TO_OUTER_LAYER[speed]
  const years = progress * totalYears

  // The growth gets wider and taller, and after a while starts growing down into the wall.
  const depth = Math.max(0, (progress - 0.25) / 0.75) * WALL_DEPTH
  const color = depth < TUMOR_DEPTH ? '#2563eb' : '#dc2626' // blue while a polyp, red once it is a tumor
  const width = 22 + startMm * 2.2 + progress * 110
  const growth: Growth = { width, height: 8 + startMm * 1.2 + progress * 30, depth, color }
  const radius3d = (width / 2) * 0.001 // the same growth as a size in the 3D scene

  return (
    <div className="page time-page">
      <p className="time-subject">
        <span className="muted">Showing:</span> <strong>{subject}</strong>
        <span className="muted"> · A polyp can be selected on the 3D colon page.</span>
        <label className="start-size">
          <span className="muted">Starting size</span>
          <input type="number" min={1} max={MAX_START_MM} step={1} value={sizeText} onChange={(e) => setSizeText(e.target.value)} />
          <span className="muted">mm</span>
        </label>
      </p>

      <div className="time-closeup">
        <NamesToggle className="floating-names" />
        <PolypCloseup findings={findings} selectedId={selectedId} radius={radius3d} color={color} />
      </div>

      <div className="time-walls">
        <figure>
          <figcaption>
            <strong>Removed now</strong>
            <span className="muted">The wall stays healthy</span>
          </figcaption>
          <WallCrossSection growth={null} />
        </figure>
        <figure>
          <figcaption>
            <strong>Left in place</strong>
            <span className="muted">{years === 0 ? 'Today' : `After ${years.toFixed(1)} years`}</span>
          </figcaption>
          <WallCrossSection growth={growth} />
        </figure>
      </div>

      <div className="time-controls">
        <div className="speed-row">
          <span className="muted">Growth speed</span>
          <div className="type-switch" role="group" aria-label="Growth speed">
            {SPEEDS.map((s) => (
              <button key={s} className={speed === s ? 'is-active' : ''} onClick={() => setSpeed(s)}>
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="slider-block">
          <input
            className="range"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            style={{ '--fill': `${progress * 100}%` } as CSSProperties}
            aria-label="Time"
          />
          <div className="range-ends muted">
            <span>Now</span>
            <span>{totalYears} years</span>
          </div>
        </div>

        <p className="stage">
          <span className="stage-years">{years === 0 ? 'Now' : `${years.toFixed(1)} years`}</span>
          {stageText(progress, depth)}
        </p>

        <p className="disclaimer">Illustration with assumed settings. Not a prediction for any patient.</p>
      </div>
    </div>
  )
}
