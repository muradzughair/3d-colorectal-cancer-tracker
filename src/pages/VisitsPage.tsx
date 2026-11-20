// Patient & visits: the patient's details and the list of dated visits (oldest first).
// Clicking a visit chooses it for every page. The doctor can add a visit and edit the
// test notes of any visit.
import { useState } from 'react'
import type { RecordStore } from '../data/record'
import { formatDate, today } from '../lib/dates'
import type { Visit } from '../types'

interface Props {
  store: RecordStore
  visits: Visit[] // oldest first
  visit: Visit | null // the chosen visit
  onVisit: (id: string) => void
}

// "2 polyps, 1 tumor" or "No findings".
function findingSummary(visit: Visit): string {
  const polyps = visit.findings.filter((f) => f.kind === 'polyp').length
  const tumors = visit.findings.filter((f) => f.kind === 'tumor').length
  const parts = []
  if (polyps) parts.push(`${polyps} ${polyps === 1 ? 'polyp' : 'polyps'}`)
  if (tumors) parts.push(`${tumors} ${tumors === 1 ? 'tumor' : 'tumors'}`)
  return parts.length ? parts.join(', ') : 'No findings'
}

// "1 CT scan, 1 colonoscopy picture, video"
function contentSummary(visit: Visit): string {
  const ct = visit.pictures.filter((p) => p.type === 'ct').length
  const scope = visit.pictures.filter((p) => p.type === 'colonoscopy').length
  const parts = []
  if (ct) parts.push(`${ct} CT ${ct === 1 ? 'image' : 'images'}`)
  if (scope) parts.push(`${scope} colonoscopy ${scope === 1 ? 'picture' : 'pictures'}`)
  if (visit.video) parts.push('video')
  return parts.length ? parts.join(', ') : 'No pictures yet'
}

export default function VisitsPage({ store, visits, visit, onVisit }: Props) {
  const patient = store.record!.patient
  const [newDate, setNewDate] = useState(today())
  const [newTitle, setNewTitle] = useState('')

  const addVisit = () => {
    const id = store.addVisit(newDate, newTitle.trim())
    onVisit(id)
    setNewTitle('')
  }

  return (
    <div className="page page-text">
      <div className="doc">
        <section className="doc-section">
          <div className="doc-heading">
            <h2>Patient</h2>
            <span className="demo-tag">Demo patient (fictional)</span>
          </div>
          <div className="field-grid">
            <label className="field span-2">
              <span>Name</span>
              <input value={patient.name} onChange={(e) => store.updatePatient({ name: e.target.value })} />
            </label>
            <label className="field">
              <span>Age</span>
              <input value={patient.age} inputMode="numeric" onChange={(e) => store.updatePatient({ age: e.target.value })} />
            </label>
            <label className="field">
              <span>Sex</span>
              <input value={patient.sex} onChange={(e) => store.updatePatient({ sex: e.target.value })} />
            </label>
            <label className="field span-2">
              <span>File number</span>
              <input value={patient.fileNumber} onChange={(e) => store.updatePatient({ fileNumber: e.target.value })} />
            </label>
            <label className="field span-2">
              <span>Relevant history</span>
              <textarea rows={2} value={patient.history} onChange={(e) => store.updatePatient({ history: e.target.value })} />
            </label>
            <label className="field span-4">
              <span>Doctor's notes</span>
              <textarea rows={2} value={patient.notes} onChange={(e) => store.updatePatient({ notes: e.target.value })} />
            </label>
          </div>
        </section>

        <section className="doc-section">
          <div className="doc-heading">
            <h2>Visits</h2>
            <span className="muted">Click a visit to open it on every page.</span>
          </div>

          <ol className="visit-list">
            {visits.map((v, i) => (
              <li key={v.id} className={`visit-row${v.id === visit?.id ? ' is-chosen' : ''}`} onClick={() => onVisit(v.id)}>
                <span className="visit-number">{i + 1}</span>
                <div className="visit-main">
                  <div className="visit-top">
                    <strong>{formatDate(v.date)}</strong>
                    <span>{v.title || 'Visit'}</span>
                    {v.addedByDoctor && <span className="source-tag source-manual">Added</span>}
                  </div>
                  <div className="visit-meta muted">
                    {contentSummary(v)} · {findingSummary(v)}
                  </div>
                  <label className="field visit-tests">
                    <span>Tests</span>
                    <input
                      value={v.tests}
                      placeholder="Test information for this visit"
                      onChange={(e) => store.updateVisit(v.id, { tests: e.target.value })}
                    />
                  </label>
                </div>
                {v.addedByDoctor && (
                  <button
                    className="remove-button"
                    title="Remove this visit"
                    aria-label="Remove this visit"
                    onClick={(e) => {
                      e.stopPropagation()
                      store.removeVisit(v.id)
                    }}
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ol>

          <div className="add-row">
            <label className="field">
              <span>New visit date</span>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </label>
            <label className="field add-title">
              <span>What was done</span>
              <input value={newTitle} placeholder="e.g. Follow-up colonoscopy" onChange={(e) => setNewTitle(e.target.value)} />
            </label>
            <button className="button" onClick={addVisit} disabled={!newDate}>
              Add visit
            </button>
          </div>
          <p className="muted small-note">Add pictures to the chosen visit on the 3D colon page.</p>
        </section>
      </div>
    </div>
  )
}
