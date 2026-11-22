// The treatment plan graph: phase columns, lanes, step nodes, curved link lines and the
// "Today" marker. Nodes are buttons (Tab to focus, Enter to open). The positions come from
// layoutGraph (src/lib/treatmentGraph.ts); this component only draws them.
import { formatDate } from '../../lib/dates'
import { cycleText, LANE_H, LANES, HEAD_H, STATUS_LABELS, stepDateText, type GraphLayout } from '../../lib/treatmentGraph'
import type { StepKind, TreatmentStep } from '../../types'

// A tiny shape per kind of step, drawn in SVG (12 x 12).
export function KindIcon({ kind }: { kind: StepKind }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg className="kind-icon" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
      {kind === 'procedure' && <path d="M2 10 L8 4 M7 3 L9 5 M8.5 2.5 L9.5 1.5 L10.5 2.5 L9.5 3.5" {...common} />}
      {kind === 'medicine' && (
        <g {...common}>
          <rect x="1.5" y="4" width="9" height="4" rx="2" />
          <path d="M6 4 V8" />
        </g>
      )}
      {kind === 'radiotherapy' && (
        <g {...common}>
          <circle cx="6" cy="6" r="1.4" />
          <path d="M6 1.5 V3 M6 9 V10.5 M1.5 6 H3 M9 6 H10.5 M2.8 2.8 L3.8 3.8 M8.2 8.2 L9.2 9.2 M9.2 2.8 L8.2 3.8 M3.8 8.2 L2.8 9.2" />
        </g>
      )}
      {kind === 'imaging' && (
        <g {...common}>
          <rect x="1.5" y="2" width="9" height="8" rx="1" />
          <circle cx="6" cy="6" r="2" />
        </g>
      )}
      {kind === 'lab' && <path d="M4.5 1.5 H7.5 M5 1.5 V5 L2.2 9.6 A0.8 0.8 0 0 0 2.9 10.5 H9.1 A0.8 0.8 0 0 0 9.8 9.6 L7 5 V1.5" {...common} />}
      {kind === 'review' && (
        <g {...common}>
          <path d="M2 2.5 H10 V8 H5 L3 10 V8 H2 Z" />
        </g>
      )}
    </svg>
  )
}

// The status mark in the corner of a node: a check for done, a ring for in progress.
function StatusMark({ step }: { step: TreatmentStep }) {
  if (step.status === 'done') {
    return (
      <svg className="status-mark" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
        <circle cx="7" cy="7" r="7" className="status-mark-fill" />
        <path d="M4 7.2 L6.1 9.2 L10 5" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (step.status === 'in-progress') {
    return (
      <svg className="status-mark" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
        <circle cx="7" cy="7" r="5.5" fill="none" className="status-mark-ring" strokeWidth="2" />
        <path d="M7 1.5 A5.5 5.5 0 0 1 7 12.5 Z" className="status-mark-fill" />
      </svg>
    )
  }
  return null
}

interface Props {
  layout: GraphLayout
  scale: number
  selectedId: string | null
  today: string
  onOpen: (id: string) => void
}

export default function TreatmentGraph({ layout, scale, selectedId, today, onOpen }: Props) {
  return (
    // The outer box has the zoomed size, so the scroll area matches what is drawn.
    <div className="graph-sizer" style={{ width: layout.width * scale, height: layout.height * scale }}>
      <div className="graph" style={{ width: layout.width, height: layout.height, transform: `scale(${scale})` }}>
        {/* Phase headers and thin dividers between phases. */}
        {layout.phases.map((p, i) => (
          <div key={p.name} className="graph-phase" style={{ left: p.x, width: p.width }}>
            <span className="graph-phase-name">{p.name}</span>
            {i > 0 && <span className="graph-phase-line" />}
          </div>
        ))}

        {/* Thin lines between the lanes. */}
        {LANES.map((lane, i) => (
          <div key={lane.id} className="graph-lane-line" style={{ top: HEAD_H + i * LANE_H }} />
        ))}

        <svg className="graph-lines" width={layout.width} height={layout.height}>
          {layout.edges.map((e) => (
            <path key={e.key} d={e.path} className={selectedId && (e.from === selectedId || e.to === selectedId) ? 'is-related' : ''} />
          ))}
          <line className="today-line" x1={layout.todayX} x2={layout.todayX} y1={HEAD_H - 4} y2={HEAD_H + LANES.length * LANE_H} />
        </svg>
        <div className="today-label" style={{ left: layout.todayX }}>
          Today, {formatDate(today)}
        </div>

        {layout.nodes.map(({ step, x, y, w, h }) => {
          const cycles = step.cycles ?? []
          return (
            <button
              key={step.id}
              className={`step-node status-${step.status}${step.id === selectedId ? ' is-selected' : ''}`}
              style={{ left: x, top: y, width: w, height: h }}
              onClick={() => onOpen(step.id)}
              title={`${step.title} · ${STATUS_LABELS[step.status]}`}
              aria-label={`${step.title}, ${STATUS_LABELS[step.status]}, ${stepDateText(step, formatDate)}`}
            >
              <span className="step-top">
                <KindIcon kind={step.kind} />
                <span className="step-title">{step.title}</span>
                <StatusMark step={step} />
              </span>
              <span className="step-date">{stepDateText(step, formatDate)}</span>
              {cycles.length > 0 && (
                <span className="step-cycles">
                  <span className="cycle-dots">
                    {cycles.map((c) => (
                      <span key={c.n} className={`cycle-dot cycle-${c.status}`} />
                    ))}
                  </span>
                  <span className="cycle-text">{cycleText(step)}</span>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
