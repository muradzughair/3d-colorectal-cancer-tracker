// What-if time slider: shows how a polyp that is left in place could grow into the colon
// wall over the years, next to the same wall when the polyp is removed now.
// This is an illustration with assumed numbers, NOT a prediction.
import { useState, type CSSProperties } from 'react'
import { getSegment } from '../data/segments'
import { describeFindings, formatSize } from '../lib/findings'
import type { Finding } from '../types'
import WallCrossSection, { WALL_DEPTH, type Growth } from './WallCrossSection'

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

// Once the growth passes the inner lining it is shown as a tumor (depth in drawing units,
// matching the layers in WallCrossSection).
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
  selectedId: string | null
}

export default function TimeSlider({ findings, selectedId }: Props) {
  const [speed, setSpeed] = useState<Speed>('medium')
  const [progress, setProgress] = useState(0) // 0 = now, 1 = end of the time range

  // Use the selected polyp, or a generic example polyp if no polyp is selected.
  const selected = findings.find((f) => f.id === selectedId && f.kind === 'polyp')
  const startMm = selected?.size?.unit === 'mm' ? selected.size.value : EXAMPLE_POLYP_MM
  const subject = selected
    ? `${describeFindings(findings)[selected.id].name} · ${getSegment(selected.segment).name} · ${formatSize(selected.size)}`
    : 'Example polyp (no polyp selected)'

  const totalYears = YEARS_TO_OUTER_LAYER[speed]
  const years = progress * totalYears

  // The growth gets wider and taller, and after a while starts growing down into the wall.
  const depth = Math.max(0, (progress - 0.25) / 0.75) * WALL_DEPTH
  const growth: Growth = {
    width: 22 + startMm * 2.2 + progress * 110,
    height: 8 + startMm * 1.2 + progress * 30,
    depth,
    color: depth < TUMOR_DEPTH ? '#2563eb' : '#dc2626', // blue while a polyp, red once it is a tumor
  }

  return (
    <div className="time-slider">
      <div className="slider-controls">
        <p className="slider-subject">
          <span className="muted">Showing:</span> {subject}
        </p>

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

        <p className="stage">
          <span className="stage-years">{years === 0 ? 'Now' : `${years.toFixed(1)} years`}</span>
          {stageText(progress, depth)}
        </p>

        <p className="disclaimer">Illustration with assumed settings. Not a prediction for any patient.</p>
      </div>

      <div className="wall-panels">
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
    </div>
  )
}
