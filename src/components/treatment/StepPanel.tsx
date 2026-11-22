// The step details panel (slides in from the right) and its edit form.
// Read mode shows everything about one step with links to the visit, the lesion on the 3D
// colon and the Patient page. Edit mode is a simple form; the doctor is in charge and the
// app never fills anything in by itself.
import { useState, type ReactNode } from 'react'
import { getSegment } from '../../data/segments'
import { formatDate } from '../../lib/dates'
import { formatSize } from '../../lib/findings'
import { lesionName, type LesionCode } from '../../lib/lesions'
import { LANES, STATUS_LABELS, stepDateText } from '../../lib/treatmentGraph'
import type { GoTo } from '../../PatientView'
import type { Lane, StepCycle, StepKind, StepStatus, TreatmentStep, Visit } from '../../types'
import { KindIcon } from './TreatmentGraph'

const KINDS: { id: StepKind; label: string }[] = [
  { id: 'procedure', label: 'Procedure' },
  { id: 'medicine', label: 'Medicine' },
  { id: 'radiotherapy', label: 'Radiotherapy' },
  { id: 'imaging', label: 'Imaging' },
  { id: 'lab', label: 'Lab test' },
  { id: 'review', label: 'Review' },
]
const STATUSES: StepStatus[] = ['done', 'in-progress', 'planned']

// The Patient page sections a step can link to.
const SECTION_NAMES: Record<string, string> = {
  pathology: 'Pathology',
  labs: 'Labs',
  biomarkers: 'Biomarkers and genetics',
  imaging: 'Imaging and procedures',
  medications: 'Medications',
}

const kindLabel = (kind: StepKind) => KINDS.find((k) => k.id === kind)?.label ?? kind
const laneLabel = (lane: Lane) => LANES.find((l) => l.id === lane)?.label ?? lane

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="panel-block">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

// ---------- Read mode ----------

interface ViewProps {
  codes: Record<string, LesionCode>
  step: TreatmentStep
  steps: TreatmentStep[]
  visits: Visit[]
  goTo: GoTo
  onEdit: () => void
  onDelete: () => void
}

function StepView({ codes, step, steps, visits, goTo, onEdit, onDelete }: ViewProps) {
  const visit = visits.find((v) => v.id === step.visitId)
  const findings = visit ? visit.findings.filter((f) => step.findingIds?.includes(f.id)) : []
  const follows = steps.filter((s) => step.dependsOn.includes(s.id))

  return (
    <>
      <div className="panel-head">
        <KindIcon kind={step.kind} />
        <h2>{step.title}</h2>
      </div>
      <dl className="panel-facts">
        <div>
          <dt>Status</dt>
          <dd>
            <span className={`step-status-text status-${step.status}`}>{STATUS_LABELS[step.status]}</span>
          </dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>{stepDateText(step, formatDate)}</dd>
        </div>
        <div>
          <dt>Phase</dt>
          <dd>{step.phase}</dd>
        </div>
        <div>
          <dt>Lane</dt>
          <dd>
            {laneLabel(step.lane)}
            {kindLabel(step.kind) !== laneLabel(step.lane) && <span className="muted"> · {kindLabel(step.kind)}</span>}
          </dd>
        </div>
        {follows.length > 0 && (
          <div className="wide">
            <dt>Follows</dt>
            <dd>{follows.map((s) => s.title).join(', ')}</dd>
          </div>
        )}
      </dl>

      <Block title="What was done">
        <p>{step.description || <span className="missing">No description</span>}</p>
      </Block>

      <Block title="Who and where">
        <p>{step.performedBy || <span className="missing">Not recorded</span>}</p>
        {step.place && <p className="muted">{step.place}</p>}
      </Block>

      {step.regimen && (
        <Block title="Medicine">
          <dl className="panel-facts">
            <div className="wide">
              <dt>Drugs</dt>
              <dd>{step.regimen.drugs}</dd>
            </div>
            <div className="wide">
              <dt>Dose</dt>
              <dd>{step.regimen.dose}</dd>
            </div>
            <div>
              <dt>Route</dt>
              <dd>{step.regimen.route}</dd>
            </div>
            <div>
              <dt>Schedule</dt>
              <dd>{step.regimen.schedule}</dd>
            </div>
          </dl>
        </Block>
      )}

      {step.cycles && step.cycles.length > 0 && (
        <Block title={`Cycles: ${step.cycles.filter((c) => c.status === 'done').length} done of ${step.cycles.length} planned`}>
          <table className="doc-table cycle-table">
            <tbody>
              {step.cycles.map((c) => (
                <tr key={c.n}>
                  <td>
                    <span className={`cycle-dot cycle-${c.status}`} /> {c.n}
                  </td>
                  <td className="nowrap">{formatDate(c.date)}</td>
                  <td className="muted">{c.note || STATUS_LABELS[c.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
      )}

      {step.radiotherapy && (
        <Block title="Radiotherapy">
          <p>
            {step.radiotherapy.totalGy} Gy in {step.radiotherapy.fractions} fractions · {stepDateText(step, formatDate)}
          </p>
        </Block>
      )}

      <Block title="Result or outcome">
        <p>{step.outcome || <span className="missing">{step.status === 'planned' ? 'Not done yet' : 'Not recorded'}</span>}</p>
      </Block>

      {step.sideEffects && step.sideEffects.length > 0 && (
        <Block title="Side effects">
          <ul className="plain-list">
            {step.sideEffects.map((s) => (
              <li key={s.name}>
                {s.name}, grade {s.grade}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {(visit || step.profileSection) && (
        <Block title="Links">
          <div className="panel-links">
            {visit && (
              <button className="link-button" onClick={() => goTo('time', { visitId: visit.id })}>
                Open the visit ({formatDate(visit.date)})
              </button>
            )}
            {visit &&
              findings.map((f) => (
                <button key={f.id} className="link-button" onClick={() => goTo('colon', { visitId: visit.id, findingId: f.id })}>
                  <span className={`dot dot-${f.kind}`} />
                  Show the lesion on the 3D colon: {lesionName(f, codes)}, {getSegment(f.segment).name}, {formatSize(f.size)}
                </button>
              ))}
            {step.profileSection && (
              <button className="link-button" onClick={() => goTo('profile', { section: step.profileSection })}>
                Open in Patient page: {SECTION_NAMES[step.profileSection] ?? step.profileSection}
              </button>
            )}
          </div>
        </Block>
      )}

      <Block title="Notes">
        <p>{step.notes || <span className="missing">No notes</span>}</p>
      </Block>

      <div className="panel-actions">
        <button className="button" onClick={onEdit}>
          Edit
        </button>
        <button className="button button-light button-danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </>
  )
}

// ---------- Edit mode ----------

interface FormProps {
  codes: Record<string, LesionCode>
  initial: TreatmentStep
  isNew: boolean
  steps: TreatmentStep[]
  phases: string[]
  visits: Visit[]
  onSave: (step: TreatmentStep) => void
  onCancel: () => void
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`form-field${wide ? ' wide' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function StepForm({ codes, initial, isNew, steps, phases, visits, onSave, onCancel }: FormProps) {
  const [draft, setDraft] = useState<TreatmentStep>(initial)
  const set = (change: Partial<TreatmentStep>) => setDraft((d) => ({ ...d, ...change }))
  const visit = visits.find((v) => v.id === draft.visitId)
  const regimen = draft.regimen ?? { drugs: '', dose: '', route: '', schedule: '' }
  const cycles = draft.cycles ?? []
  const effects = draft.sideEffects ?? []
  const canSave = draft.title.trim() !== '' && draft.phase.trim() !== '' && draft.date !== ''

  const setCycle = (i: number, change: Partial<StepCycle>) => set({ cycles: cycles.map((c, j) => (j === i ? { ...c, ...change } : c)) })

  // Clean up before saving: empty optional parts are left out.
  const save = () => {
    const clean: TreatmentStep = { ...draft, title: draft.title.trim(), phase: draft.phase.trim() }
    if (!regimen.drugs.trim()) delete clean.regimen
    if (cycles.length === 0) delete clean.cycles
    if (effects.length === 0) delete clean.sideEffects
    if (!clean.endDate) delete clean.endDate
    if (!clean.visitId) {
      delete clean.visitId
      delete clean.findingIds
    }
    if (clean.kind !== 'radiotherapy') delete clean.radiotherapy
    onSave(clean)
  }

  return (
    <form
      className="step-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSave) save()
      }}
    >
      <div className="panel-head">
        <h2>{isNew ? 'Add step' : 'Edit step'}</h2>
      </div>
      <div className="form-grid">
        <Field label="Title (short)" wide>
          <input value={draft.title} maxLength={40} required onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label="Phase (pick or type a new one)" wide>
          <input list="phase-names" value={draft.phase} required onChange={(e) => set({ phase: e.target.value })} />
          <datalist id="phase-names">
            {phases.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>
        <Field label="Lane">
          <select value={draft.lane} onChange={(e) => set({ lane: e.target.value as Lane })}>
            {LANES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kind">
          <select value={draft.kind} onChange={(e) => set({ kind: e.target.value as StepKind })}>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={draft.status} onChange={(e) => set({ status: e.target.value as StepStatus })}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input type="date" value={draft.date} required onChange={(e) => set({ date: e.target.value, monthOnly: undefined })} />
        </Field>
        <Field label="End date (optional)">
          <input type="date" value={draft.endDate ?? ''} onChange={(e) => set({ endDate: e.target.value || undefined })} />
        </Field>

        <Field label="Depends on" wide>
          <div className="check-list">
            {steps
              .filter((s) => s.id !== draft.id)
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((s) => (
                <label key={s.id}>
                  <input
                    type="checkbox"
                    checked={draft.dependsOn.includes(s.id)}
                    onChange={(e) => set({ dependsOn: e.target.checked ? [...draft.dependsOn, s.id] : draft.dependsOn.filter((d) => d !== s.id) })}
                  />
                  {s.title} <span className="muted">{formatDate(s.date)}</span>
                </label>
              ))}
          </div>
        </Field>

        <Field label="What was done" wide>
          <textarea rows={2} value={draft.description ?? ''} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <Field label="Who (name and role)">
          <input value={draft.performedBy ?? ''} onChange={(e) => set({ performedBy: e.target.value })} />
        </Field>
        <Field label="Where">
          <input value={draft.place ?? ''} onChange={(e) => set({ place: e.target.value })} />
        </Field>

        <h3 className="form-heading">Medicine</h3>
        <Field label="Drugs" wide>
          <input value={regimen.drugs} onChange={(e) => set({ regimen: { ...regimen, drugs: e.target.value } })} />
        </Field>
        <Field label="Dose" wide>
          <input value={regimen.dose} onChange={(e) => set({ regimen: { ...regimen, dose: e.target.value } })} />
        </Field>
        <Field label="Route">
          <input value={regimen.route} onChange={(e) => set({ regimen: { ...regimen, route: e.target.value } })} />
        </Field>
        <Field label="Schedule">
          <input value={regimen.schedule} onChange={(e) => set({ regimen: { ...regimen, schedule: e.target.value } })} />
        </Field>

        <h3 className="form-heading">Cycles</h3>
        <div className="form-rows wide">
          {cycles.map((c, i) => (
            <div key={i} className="form-row">
              <span className="muted">{c.n}</span>
              <input type="date" value={c.date} aria-label={`Cycle ${c.n} date`} onChange={(e) => setCycle(i, { date: e.target.value })} />
              <select value={c.status} aria-label={`Cycle ${c.n} status`} onChange={(e) => setCycle(i, { status: e.target.value as StepStatus })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <input value={c.note ?? ''} placeholder="Note" aria-label={`Cycle ${c.n} note`} onChange={(e) => setCycle(i, { note: e.target.value })} />
              <button type="button" className="remove-button" aria-label={`Remove cycle ${c.n}`} onClick={() => set({ cycles: cycles.filter((_, j) => j !== i).map((x, j) => ({ ...x, n: j + 1 })) })}>
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="link-button"
            onClick={() => set({ cycles: [...cycles, { n: cycles.length + 1, date: cycles[cycles.length - 1]?.date ?? draft.date, status: 'planned' }] })}
          >
            Add cycle
          </button>
        </div>

        {draft.kind === 'radiotherapy' && (
          <>
            <h3 className="form-heading">Radiotherapy</h3>
            <Field label="Total dose (Gy)">
              <input
                type="number"
                min={0}
                step={0.1}
                value={draft.radiotherapy?.totalGy ?? ''}
                onChange={(e) => set({ radiotherapy: { totalGy: Number(e.target.value), fractions: draft.radiotherapy?.fractions ?? 0 } })}
              />
            </Field>
            <Field label="Fractions">
              <input
                type="number"
                min={0}
                value={draft.radiotherapy?.fractions ?? ''}
                onChange={(e) => set({ radiotherapy: { totalGy: draft.radiotherapy?.totalGy ?? 0, fractions: Number(e.target.value) } })}
              />
            </Field>
          </>
        )}

        <h3 className="form-heading">Result</h3>
        <Field label="Result or outcome" wide>
          <input value={draft.outcome ?? ''} onChange={(e) => set({ outcome: e.target.value })} />
        </Field>
        <div className="form-rows wide">
          <span className="form-label">Side effects</span>
          {effects.map((s, i) => (
            <div key={i} className="form-row form-row-effect">
              <input value={s.name} placeholder="Side effect" aria-label="Side effect" onChange={(e) => set({ sideEffects: effects.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
              <select value={s.grade} aria-label="Grade" onChange={(e) => set({ sideEffects: effects.map((x, j) => (j === i ? { ...x, grade: Number(e.target.value) } : x)) })}>
                {[1, 2, 3, 4, 5].map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
              <button type="button" className="remove-button" aria-label="Remove side effect" onClick={() => set({ sideEffects: effects.filter((_, j) => j !== i) })}>
                ×
              </button>
            </div>
          ))}
          <button type="button" className="link-button" onClick={() => set({ sideEffects: [...effects, { name: '', grade: 1 }] })}>
            Add side effect
          </button>
        </div>

        <h3 className="form-heading">Links and notes</h3>
        <Field label="Visit" wide>
          <select value={draft.visitId ?? ''} onChange={(e) => set({ visitId: e.target.value || undefined, findingIds: [] })}>
            <option value="">No visit</option>
            {visits.map((v) => (
              <option key={v.id} value={v.id}>
                {formatDate(v.date)} · {v.title}
              </option>
            ))}
          </select>
        </Field>
        {visit && visit.findings.length > 0 && (
          <Field label="Lesions of this visit" wide>
            <div className="check-list">
              {visit.findings.map((f) => (
                <label key={f.id}>
                  <input
                    type="checkbox"
                    checked={draft.findingIds?.includes(f.id) ?? false}
                    onChange={(e) =>
                      set({ findingIds: e.target.checked ? [...(draft.findingIds ?? []), f.id] : (draft.findingIds ?? []).filter((id) => id !== f.id) })
                    }
                  />
                  <span className={`dot dot-${f.kind}`} />
                  {lesionName(f, codes)}, {getSegment(f.segment).name}
                </label>
              ))}
            </div>
          </Field>
        )}
        <Field label="Notes" wide>
          <textarea rows={2} value={draft.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} />
        </Field>
      </div>

      <div className="panel-actions">
        <button className="button" type="submit" disabled={!canSave}>
          Save
        </button>
        <button className="button button-light" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

// ---------- The panel ----------

interface PanelProps {
  codes: Record<string, LesionCode>
  mode: 'view' | 'edit' | 'new'
  step: TreatmentStep | null // null for a new step
  steps: TreatmentStep[]
  phases: string[]
  visits: Visit[]
  goTo: GoTo
  onClose: () => void
  onEdit: () => void
  onView: () => void // back from editing to the details
  onSave: (step: TreatmentStep) => void
  onDelete: (id: string) => void
}

export function emptyStep(date: string, phase: string): TreatmentStep {
  return { id: '', phase, lane: 'procedures', kind: 'procedure', title: '', status: 'planned', date, dependsOn: [] }
}

export default function StepPanel({ codes, mode, step, steps, phases, visits, goTo, onClose, onEdit, onView, onSave, onDelete }: PanelProps) {
  return (
    <div className="step-panel-body">
      <button className="close-button panel-close" onClick={onClose} aria-label="Close the details" title="Close (Esc)">
        ×
      </button>
      {mode === 'view' && step && (
        <StepView
          codes={codes}
          step={step}
          steps={steps}
          visits={visits}
          goTo={goTo}
          onEdit={onEdit}
          onDelete={() => window.confirm(`Delete the step "${step.title}"? This cannot be undone.`) && onDelete(step.id)}
        />
      )}
      {(mode === 'edit' || mode === 'new') && step && (
        <StepForm
          codes={codes}
          key={step.id || 'new'}
          initial={step}
          isNew={mode === 'new'}
          steps={steps}
          phases={phases}
          visits={visits}
          onSave={onSave}
          onCancel={mode === 'new' ? onClose : onView}
        />
      )}
    </div>
  )
}
