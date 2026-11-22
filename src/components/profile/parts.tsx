// Small building blocks of the Patient page: section wrapper, "date · source" note,
// key-value grid, "not available" text and a small SVG trend line.
import { useState, type ReactNode } from 'react'
import { formatDate } from '../../lib/dates'

// One section of the page, with an id the section list on the left jumps to.
export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="profile-section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {children}
    </section>
  )
}

// "12 Feb 2026 · Pathology report": when a value was recorded and where it came from.
export function Source({ date, source }: { date?: string; source?: string }) {
  if (!date && !source) return null
  return <span className="source-note">{[date ? formatDate(date) : '', source ?? ''].filter(Boolean).join(' · ')}</span>
}

// Grey "Not available" / "Not done" text, used instead of a blank.
export function Missing({ text = 'Not available' }: { text?: string }) {
  return <span className="missing">{text}</span>
}

export interface KeyValue {
  label: string
  value: ReactNode
  source?: ReactNode
  wide?: boolean // takes the full row
}

// A grid of label / value pairs, with the source under the value.
export function KeyValueGrid({ items }: { items: KeyValue[] }) {
  return (
    <dl className="kv-grid">
      {items.map((item) => (
        <div key={item.label} className={item.wide ? 'kv kv-wide' : 'kv'}>
          <dt>{item.label}</dt>
          <dd>
            {item.value === '' || item.value === null || item.value === undefined ? <Missing /> : item.value}
            {item.source}
          </dd>
        </div>
      ))}
    </dl>
  )
}

// ---------- Trend line ----------

export interface TrendPoint {
  date: string
  value: number
  label?: string // the value as text, if it needs a fixed number of decimals
  flag?: 'H' | 'L' | null
}

interface TrendProps {
  title: string
  unit: string
  points: TrendPoint[] // oldest first
  low?: number | null // reference range, drawn as a light band
  high?: number | null
  emptyText?: string
}

const W = 300
const H = 128
const PAD = { left: 38, right: 12, top: 12, bottom: 28 }

// A small line chart with the dates on the x axis. Hover a point to see its value.
export function TrendChart({ title, unit, points, low = null, high = null, emptyText = 'Not done' }: TrendProps) {
  const [hover, setHover] = useState<number | null>(null)

  if (points.length < 2) {
    return (
      <figure className="trend">
        <figcaption>
          <strong>{title}</strong> <span className="muted">{unit}</span>
        </figcaption>
        <p className="trend-empty">{points.length === 1 ? `Only one value: ${points[0].value} ${unit}` : emptyText}</p>
      </figure>
    )
  }

  // Scales: x by date, y by value (with the reference limits included, and a little room).
  const times = points.map((p) => new Date(`${p.date}T00:00:00`).getTime())
  const t0 = Math.min(...times)
  const t1 = Math.max(...times)
  const values = points.map((p) => p.value)
  const limits = [low, high].filter((v): v is number => v !== null && v !== undefined)
  let v0 = Math.min(...values, ...limits)
  let v1 = Math.max(...values, ...limits)
  const room = (v1 - v0) * 0.12 || 1
  v0 = Math.max(0, v0 - room)
  v1 = v1 + room
  const x = (t: number) => PAD.left + ((t - t0) / (t1 - t0 || 1)) * (W - PAD.left - PAD.right)
  const y = (v: number) => H - PAD.bottom - ((v - v0) / (v1 - v0)) * (H - PAD.top - PAD.bottom)
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(times[i]).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })

  // The reference band (between low and high, or below high / above low).
  const bandTop = y(Math.min(v1, high ?? v1))
  const bandBottom = y(Math.max(v0, low ?? v0))
  const hovered = hover === null ? null : points[hover]

  return (
    <figure className="trend">
      <figcaption>
        <strong>{title}</strong> <span className="muted">{unit}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title} trend`} onMouseLeave={() => setHover(null)}>
        {(low !== null || high !== null) && (
          <rect className="trend-band" x={PAD.left} y={bandTop} width={W - PAD.left - PAD.right} height={Math.max(0, bandBottom - bandTop)} />
        )}
        {[v0, v1].map((v) => (
          <text key={v} className="trend-axis" x={PAD.left - 6} y={y(v) + 4} textAnchor="end">
            {Number(v.toFixed(v < 10 ? 1 : 0))}
          </text>
        ))}
        <line className="trend-base" x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} />
        <path className="trend-line" d={line} />
        {points.map((p, i) => (
          <g key={p.date + i}>
            <circle className={`trend-dot${p.flag ? ' is-flagged' : ''}`} cx={x(times[i])} cy={y(p.value)} r={hover === i ? 5 : 3.5} />
            {/* A wider invisible circle makes the point easy to hover. */}
            <circle cx={x(times[i])} cy={y(p.value)} r={12} fill="transparent" onMouseEnter={() => setHover(i)} />
            <text className="trend-axis" x={x(times[i])} y={H - 10} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>
              {/* Only every other date when they are many, so they do not overlap. */}
              {points.length <= 4 || i % 2 === 0 || i === points.length - 1 ? shortDate(p.date) : ''}
            </text>
          </g>
        ))}
        {hovered && hover !== null && (
          <g className="trend-tip" transform={`translate(${Math.min(Math.max(x(times[hover]), PAD.left + 50), W - 60)}, ${Math.max(y(hovered.value) - 14, 12)})`}>
            <rect x={-56} y={-13} width={112} height={18} rx={4} />
            <text textAnchor="middle" y={0}>
              {hovered.label ?? hovered.value} {hovered.flag ?? ''} · {formatDate(hovered.date)}
            </text>
          </g>
        )}
      </svg>
    </figure>
  )
}
