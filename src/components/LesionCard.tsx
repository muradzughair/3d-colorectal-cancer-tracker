// The lesion detail card (slides in from the right): position, size and shape, optical
// diagnosis, histology, resection, stage and source of one polyp or tumor, with "Show inside",
// "Edit" and "Delete". Nothing here is invented: histology and stage come only from what is
// recorded, and missing values say "not available".
import { useState, type ReactNode } from 'react'
import { getSegment } from '../data/segments'
import { cmText } from '../lib/colonDistance'
import { formatDate } from '../lib/dates'
import { BASIS_LABELS, LUMEN_LABELS, MORPHOLOGY, PARIS, RESECTION_METHODS, isMeasured, sizeMmText } from '../lib/lesions'
import type { Finding, LocationBasis, ParisType, ResectionMethod, TumorMorphology, Visit } from '../types'

const KUDO = ['I', 'II', 'IIIS', 'IIIL', 'IV', 'Vi', 'Vn'] as const

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="panel-block">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

function Missing({ text }: { text: string }) {
  return <span className="missing">{text}</span>
}

interface Props {
  finding: Finding
  visit: Visit // the visit the finding belongs to
  code: string
  modelCm: number | null // cm worked out from the model, for findings without a distance
  removedLater?: boolean // shown on a later visit after its removal
  canShowInside: boolean
  onShowInside: () => void
  onOpenPatientPage: () => void
  onSave: (change: Partial<Finding>) => void
  onDelete: () => void
  onClose: () => void
}

// ---------- Read mode ----------

function CardView({ finding: f, visit, code, modelCm, removedLater, canShowInside, onShowInside, onOpenPatientPage, onEdit, onDelete }: Props & { onEdit: () => void }) {
  const paris = PARIS.find((p) => p.id === f.paris)
  const cm = f.distanceFromAnalVergeCm ?? modelCm
  const basis = f.locationBasis ?? 'estimated'
  const method = RESECTION_METHODS.find((m) => m.id === f.resection?.method)

  return (
    <>
      <div className="panel-head">
        <span className={`lesion-code lesion-code-${f.kind}`}>{code}</span>
        <h2>{f.kind === 'polyp' ? 'Polyp' : 'Tumor'}</h2>
        {removedLater && <span className="muted">removed</span>}
      </div>

      <Block title="Position">
        <p>
          <strong>{getSegment(f.segment).name}</strong>
          {cm !== null && <>, {cmText(cm, f.distanceFromAnalVergeCm !== undefined && isMeasured(f))} from the anal verge</>}
        </p>
        <p className="muted">
          {BASIS_LABELS[basis]}
          {f.segment === 'rectum' && f.clockPosition ? ` · ${f.clockPosition} o'clock` : ''}
        </p>
      </Block>

      <Block title="Size and shape">
        <p>{sizeMmText(f)}</p>
        {f.kind === 'polyp' ? (
          paris ? (
            <p>
              Paris {paris.id}, {paris.name.toLowerCase()}: <span className="muted">{paris.description}</span>
            </p>
          ) : (
            <p>
              <Missing text="Paris type not recorded" />
            </p>
          )
        ) : (
          <dl className="panel-facts">
            <div>
              <dt>Morphology</dt>
              <dd>{MORPHOLOGY.find((m) => m.id === f.morphology)?.name ?? <Missing text="Not recorded" />}</dd>
            </div>
            <div>
              <dt>Length</dt>
              <dd>{f.lengthMm ? `${f.lengthMm} mm` : <Missing text="Not recorded" />}</dd>
            </div>
            <div>
              <dt>Around the wall</dt>
              <dd>{f.circumferentialExtentPct ? `${f.circumferentialExtentPct} percent` : <Missing text="Not recorded" />}</dd>
            </div>
            <div>
              <dt>Lumen</dt>
              <dd>{f.lumen ? LUMEN_LABELS[f.lumen] : <Missing text="Not recorded" />}</dd>
            </div>
          </dl>
        )}
      </Block>

      {f.kind === 'polyp' && (f.opticalDiagnosis?.nice || f.opticalDiagnosis?.kudo) && (
        <Block title="Optical diagnosis (entered by the doctor)">
          <p>
            {f.opticalDiagnosis.nice && `NICE type ${f.opticalDiagnosis.nice}`}
            {f.opticalDiagnosis.nice && f.opticalDiagnosis.kudo && ' · '}
            {f.opticalDiagnosis.kudo && `Kudo pit pattern ${f.opticalDiagnosis.kudo}`}
          </p>
        </Block>
      )}

      <Block title="Histology">
        {f.histology ? (
          <p>
            <strong>{f.histology.result}</strong>
            {f.histology.dysplasia && `, ${f.histology.dysplasia} dysplasia`}
            <span className="source-note">Pathology report, {formatDate(f.histology.date)}</span>
          </p>
        ) : (
          <p>
            <Missing text="Pathology result not available" />
          </p>
        )}
      </Block>

      <Block title="Resection">
        {f.resection && f.resection.method !== 'none' ? (
          <p>
            {method?.name}
            {f.resection.extent && `, ${f.resection.extent}`}
            {f.resection.complete !== undefined && (f.resection.complete ? ', complete' : ', not complete')}
            <span className="source-note">{formatDate(f.resection.date)}</span>
          </p>
        ) : (
          <p>Not removed</p>
        )}
      </Block>

      {f.kind === 'tumor' && (
        <Block title="Stage">
          {f.stage?.clinical || f.stage?.pathologic ? (
            <p>
              {f.stage.clinical && (
                <>
                  Clinical: <strong>{f.stage.clinical}</strong>
                </>
              )}
              {f.stage.clinical && f.stage.pathologic && <br />}
              {f.stage.pathologic && (
                <>
                  Pathologic: <strong>{f.stage.pathologic}</strong>
                </>
              )}
            </p>
          ) : (
            <p>
              <Missing text="Not recorded" />
            </p>
          )}
          <button className="link-button" onClick={onOpenPatientPage}>
            Open on the Patient page
          </button>
        </Block>
      )}

      {f.notes && (
        <Block title="Notes">
          <p>{f.notes}</p>
        </Block>
      )}

      <Block title="Source">
        <p>
          {f.source === 'ai' ? 'Detected by AI (demo)' : 'Entered by the doctor'} · visit of {formatDate(visit.date)}
        </p>
        {f.source === 'ai' && <p className="muted">Position is approximate. Confirm it with the colonoscopy report.</p>}
      </Block>

      <div className="panel-actions">
        <button className="button" onClick={onShowInside} disabled={!canShowInside} title={canShowInside ? '' : 'Only lesions of the chosen visit can be shown inside'}>
          Show inside
        </button>
        <button className="button button-light" onClick={onEdit}>
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

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`form-field${wide ? ' wide' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

// Number input value: "" = empty (undefined).
const num = (text: string): number | undefined => (text === '' || !(Number(text) >= 0) ? undefined : Number(text))

function CardForm({ finding, code, onSave, onCancel }: { finding: Finding; code: string; onSave: (change: Partial<Finding>) => void; onCancel: () => void }) {
  const [f, setF] = useState<Finding>(finding)
  const set = (change: Partial<Finding>) => setF((x) => ({ ...x, ...change }))
  const sizeValue = f.size ? (f.size.unit === 'cm' ? f.size.value * 10 : f.size.value) : ''
  const histology = f.histology ?? { result: '', date: '' }
  const resection = f.resection ?? { method: 'none' as ResectionMethod, date: '' }

  const save = () => {
    // Empty parts are cleared; an AI finding changed by the doctor is marked "edited".
    const change: Partial<Finding> = { ...f, edited: finding.source === 'ai' ? true : undefined }
    if (!histology.result.trim()) change.histology = undefined
    if (!f.resection || (f.resection.method === 'none' && !f.resection.date)) change.resection = undefined
    if (f.segment !== 'rectum') change.clockPosition = undefined
    if (!f.stage?.clinical && !f.stage?.pathologic) change.stage = undefined
    if (!f.opticalDiagnosis?.nice && !f.opticalDiagnosis?.kudo) change.opticalDiagnosis = undefined
    onSave(change)
  }

  return (
    <form
      className="step-form"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <div className="panel-head">
        <span className={`lesion-code lesion-code-${f.kind}`}>{code}</span>
        <h2>Edit {f.kind === 'polyp' ? 'polyp' : 'tumor'}</h2>
      </div>
      <div className="form-grid">
        <h3 className="form-heading">Position</h3>
        <Field label="Distance from the anal verge (cm)">
          <input type="number" min={0} max={160} step={1} value={f.distanceFromAnalVergeCm ?? ''} onChange={(e) => set({ distanceFromAnalVergeCm: num(e.target.value) })} />
        </Field>
        <Field label="Position obtained by">
          <select value={f.locationBasis ?? 'estimated'} onChange={(e) => set({ locationBasis: e.target.value as LocationBasis })}>
            {(Object.keys(BASIS_LABELS) as LocationBasis[]).map((b) => (
              <option key={b} value={b}>
                {BASIS_LABELS[b]}
              </option>
            ))}
          </select>
        </Field>
        {f.segment === 'rectum' && (
          <Field label="Clock position (rectum)">
            <select value={f.clockPosition ?? ''} onChange={(e) => set({ clockPosition: num(e.target.value) })}>
              <option value="">Not recorded</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {h} o'clock
                </option>
              ))}
            </select>
          </Field>
        )}

        <h3 className="form-heading">Size and shape</h3>
        <Field label="Size (mm)">
          <input
            type="number"
            min={0}
            step={1}
            value={sizeValue}
            onChange={(e) => {
              const mm = num(e.target.value)
              set({ size: mm === undefined ? null : f.kind === 'polyp' ? { value: mm, unit: 'mm' } : { value: mm / 10, unit: 'cm' } })
            }}
          />
        </Field>
        {f.kind === 'polyp' ? (
          <>
            <Field label="Paris type">
              <select value={f.paris ?? ''} onChange={(e) => set({ paris: (e.target.value || undefined) as ParisType | undefined })}>
                <option value="">Not recorded</option>
                {PARIS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} {p.name.toLowerCase()}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="NICE type">
              <select
                value={f.opticalDiagnosis?.nice ?? ''}
                onChange={(e) => set({ opticalDiagnosis: { ...f.opticalDiagnosis, nice: (num(e.target.value) as 1 | 2 | 3 | undefined) || undefined } })}
              >
                <option value="">Not entered</option>
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    Type {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kudo pit pattern">
              <select
                value={f.opticalDiagnosis?.kudo ?? ''}
                onChange={(e) => set({ opticalDiagnosis: { ...f.opticalDiagnosis, kudo: (e.target.value || undefined) as (typeof KUDO)[number] | undefined } })}
              >
                <option value="">Not entered</option>
                {KUDO.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </Field>
          </>
        ) : (
          <>
            <Field label="Morphology">
              <select value={f.morphology ?? ''} onChange={(e) => set({ morphology: (e.target.value || undefined) as TumorMorphology | undefined })}>
                <option value="">Not recorded</option>
                {MORPHOLOGY.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Length (mm)">
              <input type="number" min={0} step={1} value={f.lengthMm ?? ''} onChange={(e) => set({ lengthMm: num(e.target.value) })} />
            </Field>
            <Field label="Around the wall (percent)">
              <select value={f.circumferentialExtentPct ?? ''} onChange={(e) => set({ circumferentialExtentPct: num(e.target.value) })}>
                <option value="">Not recorded</option>
                {[25, 50, 75, 100].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Lumen">
              <select value={f.lumen ?? ''} onChange={(e) => set({ lumen: (e.target.value || undefined) as Finding['lumen'] })}>
                <option value="">Not recorded</option>
                {(Object.keys(LUMEN_LABELS) as (keyof typeof LUMEN_LABELS)[]).map((l) => (
                  <option key={l} value={l}>
                    {LUMEN_LABELS[l]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Clinical stage (as written)">
              <input value={f.stage?.clinical ?? ''} placeholder="e.g. cT3 cN1 M0" onChange={(e) => set({ stage: { ...f.stage, clinical: e.target.value || undefined } })} />
            </Field>
            <Field label="Pathologic stage (as written)">
              <input value={f.stage?.pathologic ?? ''} onChange={(e) => set({ stage: { ...f.stage, pathologic: e.target.value || undefined } })} />
            </Field>
          </>
        )}

        <h3 className="form-heading">Histology (from the pathology report)</h3>
        <Field label="Result" wide>
          <input value={histology.result} placeholder="Leave empty if there is no pathology report" onChange={(e) => set({ histology: { ...histology, result: e.target.value } })} />
        </Field>
        <Field label="Dysplasia">
          <select value={histology.dysplasia ?? ''} onChange={(e) => set({ histology: { ...histology, dysplasia: (e.target.value || undefined) as 'low-grade' | 'high-grade' | undefined } })}>
            <option value="">Not stated</option>
            <option value="low-grade">Low-grade</option>
            <option value="high-grade">High-grade</option>
          </select>
        </Field>
        <Field label="Report date">
          <input type="date" value={histology.date} onChange={(e) => set({ histology: { ...histology, date: e.target.value } })} />
        </Field>

        <h3 className="form-heading">Resection</h3>
        <Field label="Method">
          <select value={resection.method} onChange={(e) => set({ resection: { ...resection, method: e.target.value as ResectionMethod } })}>
            {RESECTION_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input type="date" value={resection.date} onChange={(e) => set({ resection: { ...resection, date: e.target.value } })} />
        </Field>
        <Field label="En bloc or piecemeal">
          <select value={resection.extent ?? ''} onChange={(e) => set({ resection: { ...resection, extent: (e.target.value || undefined) as 'en-bloc' | 'piecemeal' | undefined } })}>
            <option value="">Not stated</option>
            <option value="en-bloc">En bloc</option>
            <option value="piecemeal">Piecemeal</option>
          </select>
        </Field>
        <Field label="Complete">
          <select
            value={resection.complete === undefined ? '' : resection.complete ? 'yes' : 'no'}
            onChange={(e) => set({ resection: { ...resection, complete: e.target.value === '' ? undefined : e.target.value === 'yes' } })}
          >
            <option value="">Not stated</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>

        <Field label="Notes" wide>
          <textarea rows={2} value={f.notes ?? ''} onChange={(e) => set({ notes: e.target.value || undefined })} />
        </Field>
      </div>
      <div className="panel-actions">
        <button className="button" type="submit">
          Save
        </button>
        <button className="button button-light" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function LesionCard(props: Props) {
  const [editing, setEditing] = useState(false)
  return (
    <div className="step-panel-body">
      <button className="close-button panel-close" onClick={props.onClose} aria-label="Close the card" title="Close (Esc)">
        ×
      </button>
      {editing ? (
        <CardForm
          key={props.finding.id}
          finding={props.finding}
          code={props.code}
          onSave={(change) => {
            props.onSave(change)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <CardView
          {...props}
          onEdit={() => setEditing(true)}
          onDelete={() => window.confirm(`Delete ${props.code}? This cannot be undone.`) && props.onDelete()}
        />
      )}
    </div>
  )
}
