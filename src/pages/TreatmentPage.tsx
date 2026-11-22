// Treatment page: the patient's treatment plan as a graph. Every phase the doctor entered is a
// column, time runs left to right, and each step is a node (done, in progress or planned).
// Click a node to open its details on the right; "Add step" adds a new one. The plan is
// written by the doctor only: the app never suggests a step.
import { useEffect, useRef, useState } from 'react'
import StepPanel, { emptyStep } from '../components/treatment/StepPanel'
import TreatmentGraph from '../components/treatment/TreatmentGraph'
import type { RecordStore } from '../data/record'
import { formatDate, today } from '../lib/dates'
import { HEAD_H, LANE_H, LANES, layoutGraph, phaseOrder, stepDateText } from '../lib/treatmentGraph'
import type { GoTo } from '../PatientView'
import type { LesionCode } from '../lib/lesions'
import type { PatientProfile } from '../profileTypes'
import type { TreatmentStep, Visit } from '../types'

interface Props {
  store: RecordStore
  profile: PatientProfile
  visits: Visit[]
  codes: Record<string, LesionCode>
  goTo: GoTo
}

type PanelState = { mode: 'view' | 'edit'; id: string } | { mode: 'new' } | null

export default function TreatmentPage({ store, profile, visits, codes, goTo }: Props) {
  const steps = store.record!.steps
  const now = today()
  const layout = layoutGraph(steps, now)
  const scroller = useRef<HTMLDivElement>(null)
  const [panel, setPanel] = useState<PanelState>(null)
  const [fit, setFit] = useState(false) // false = actual size (only shrunk if the height does not fit)
  const [box, setBox] = useState({ width: 1000, height: 480 })

  // Watch the size of the graph area, for "Fit to screen".
  useEffect(() => {
    const el = scroller.current!
    const observer = new ResizeObserver(() => setBox({ width: el.clientWidth, height: el.clientHeight }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // The graph is shrunk to fit the height; "Fit to screen" also fits the width.
  const heightScale = Math.min(1, (box.height - 12) / layout.height)
  const scale = Math.max(0.35, fit ? Math.min(heightScale, (box.width - 12) / layout.width) : heightScale)

  // Scroll so the Today line is in the middle.
  const jumpToToday = () => {
    const el = scroller.current!
    el.scrollTo({ left: layout.todayX * scale - el.clientWidth / 2, behavior: 'smooth' })
  }

  // Start with the Today line in view.
  useEffect(() => {
    const el = scroller.current!
    el.scrollLeft = layout.todayX * scale - el.clientWidth / 2
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the page opens
  }, [])

  // Open a step's details. If the step would be under the panel, scroll it into view.
  const open = (id: string) => {
    setPanel({ mode: 'view', id })
    const node = layout.nodes.find((n) => n.step.id === id)
    const el = scroller.current!
    const panelWidth = Math.min(440, el.clientWidth * 0.92)
    if (node && (node.x + node.w) * scale - el.scrollLeft > el.clientWidth - panelWidth) {
      el.scrollTo({ left: (node.x + node.w) * scale - (el.clientWidth - panelWidth) + 40, behavior: 'smooth' })
    }
  }

  // Esc closes the panel.
  useEffect(() => {
    if (!panel) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPanel(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panel])

  // Header facts.
  const done = steps.filter((s) => s.status === 'done').length
  const nextPlanned = [...steps].filter((s) => s.status === 'planned').sort((a, b) => a.date.localeCompare(b.date))[0]
  const inProgress = steps.filter((s) => s.status === 'in-progress').sort((a, b) => a.date.localeCompare(b.date))
  const lastDone = [...steps].filter((s) => s.status === 'done').sort((a, b) => b.date.localeCompare(a.date))[0]
  const currentPhase = inProgress[inProgress.length - 1]?.phase ?? lastDone?.phase ?? nextPlanned?.phase ?? 'None'

  const selected = panel && panel.mode !== 'new' ? (steps.find((s) => s.id === panel.id) ?? null) : null
  const phases = phaseOrder(steps)

  const save = (step: TreatmentStep) => {
    if (panel?.mode === 'new') {
      const { id: _unused, ...rest } = step
      void _unused
      const id = store.addStep(rest)
      setPanel({ mode: 'view', id })
    } else if (panel) {
      store.updateStep(panel.id, step)
      setPanel({ mode: 'view', id: panel.id })
    }
  }

  return (
    <div className="page treatment-page">
      <div className="treatment-head">
        <div className="treatment-facts">
          <span>
            <strong>{profile.name}</strong> <span className="muted">{profile.id}</span>
          </span>
          <span className="demo-data-tag">Demo data</span>
          <span>
            <span className="muted">Current phase</span> <strong>{currentPhase}</strong>
          </span>
          <span>
            <strong>
              {done} of {steps.length}
            </strong>{' '}
            steps done
          </span>
          <span>
            <span className="muted">Next planned</span>{' '}
            {nextPlanned ? (
              <>
                <strong>{nextPlanned.title}</strong> · {stepDateText(nextPlanned, formatDate)}
              </>
            ) : (
              <span className="muted">None</span>
            )}
          </span>
        </div>
        <div className="treatment-tools">
          <span className="legend">
            <span className="legend-item status-done">
              <span className="legend-swatch" /> Done
            </span>
            <span className="legend-item status-in-progress">
              <span className="legend-swatch" /> In progress
            </span>
            <span className="legend-item status-planned">
              <span className="legend-swatch" /> Planned
            </span>
          </span>
          <button className="button button-light" onClick={() => setFit((f) => !f)}>
            {fit ? 'Actual size' : 'Fit to screen'}
          </button>
          <button className="button button-light" onClick={jumpToToday}>
            Jump to today
          </button>
        </div>
      </div>
      <p className="treatment-note muted">Treatment plan as entered by the doctor. The app does not suggest any treatment.</p>

      <div className="graph-area">
        {/* Lane labels stay on the left while the graph scrolls. */}
        <div className="lane-labels" style={{ paddingTop: HEAD_H * scale }}>
          {LANES.map((l) => (
            <div key={l.id} className="lane-label" style={{ height: LANE_H * scale }}>
              {l.label}
            </div>
          ))}
        </div>
        <div className="graph-scroll" ref={scroller}>
          {steps.length === 0 ? (
            <p className="muted graph-empty">No steps yet. Use "Add step" to enter the plan.</p>
          ) : (
            <TreatmentGraph
              layout={layout}
              scale={scale}
              selectedId={selected?.id ?? null}
              today={now}
              onOpen={open}
            />
          )}
        </div>
      </div>

      <button className="button add-step-button" onClick={() => setPanel({ mode: 'new' })}>
        Add step
      </button>

      <aside className={`side-panel side-panel-right${panel ? ' is-open' : ''}`} inert={!panel} aria-label="Step details">
        {panel && (
          <StepPanel
            codes={codes}
            mode={panel.mode}
            step={panel.mode === 'new' ? emptyStep(now, currentPhase === 'None' ? '' : currentPhase) : selected}
            steps={steps}
            phases={phases}
            visits={visits}
            goTo={goTo}
            onClose={() => setPanel(null)}
            onEdit={() => selected && setPanel({ mode: 'edit', id: selected.id })}
            onView={() => selected && setPanel({ mode: 'view', id: selected.id })}
            onSave={save}
            onDelete={(id) => {
              store.removeStep(id)
              setPanel(null)
            }}
          />
        )}
      </aside>
    </div>
  )
}
