// Page 4: the patient, a summary of the findings and the treatment plan.
// Everything here is edited by the doctor. The plan also drives the Before / after page.
import { getSegment } from '../data/segments'
import { describeFindings, formatSize } from '../lib/findings'
import { PLAN_ACTIONS, planFor, type Plan, type PlanAction, type PlanItem } from '../lib/plan'
import type { Finding, Patient } from '../types'

interface Props {
  patient: Patient
  onPatient: (change: Partial<Patient>) => void
  findings: Finding[]
  plan: Plan
  onPlan: (findingId: string, change: Partial<PlanItem>) => void
  followUp: string
  onFollowUp: (date: string) => void
}

export default function PatientPage({ patient, onPatient, findings, plan, onPlan, followUp, onFollowUp }: Props) {
  const names = describeFindings(findings)

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
              <input value={patient.name} onChange={(e) => onPatient({ name: e.target.value })} />
            </label>
            <label className="field">
              <span>Age</span>
              <input value={patient.age} inputMode="numeric" onChange={(e) => onPatient({ age: e.target.value })} />
            </label>
            <label className="field">
              <span>Sex</span>
              <input value={patient.sex} onChange={(e) => onPatient({ sex: e.target.value })} />
            </label>
            <label className="field span-2">
              <span>File number</span>
              <input value={patient.fileNumber} onChange={(e) => onPatient({ fileNumber: e.target.value })} />
            </label>
            <label className="field span-2">
              <span>Visit date</span>
              <input type="date" value={patient.visitDate} onChange={(e) => onPatient({ visitDate: e.target.value })} />
            </label>
            <label className="field span-2">
              <span>Relevant history</span>
              <textarea rows={3} value={patient.history} onChange={(e) => onPatient({ history: e.target.value })} />
            </label>
            <label className="field span-2">
              <span>Doctor's notes</span>
              <textarea rows={3} value={patient.notes} onChange={(e) => onPatient({ notes: e.target.value })} />
            </label>
          </div>
        </section>

        <section className="doc-section">
          <h2>Findings</h2>
          {findings.length === 0 ? (
            <p className="muted">No findings yet. Add a picture or mark the 3D colon to create findings.</p>
          ) : (
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Finding</th>
                  <th>Segment</th>
                  <th>Size</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <span className={`dot dot-${f.kind}`} />
                      {names[f.id].name}
                    </td>
                    <td>{getSegment(f.segment).name}</td>
                    <td>{formatSize(f.size)}</td>
                    <td>{f.source === 'ai' ? 'AI' : 'Manual'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="doc-section">
          <h2>Treatment plan</h2>
          <p className="muted plan-note">The doctor chooses the plan. The AI does not suggest a treatment.</p>
          {findings.length === 0 ? (
            <p className="muted">The plan has one row for each finding.</p>
          ) : (
            <table className="doc-table plan-table">
              <thead>
                <tr>
                  <th>Finding</th>
                  <th>Action</th>
                  <th>Planned date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((f) => {
                  const item = planFor(plan, f.id)
                  return (
                    <tr key={f.id}>
                      <td>
                        <span className={`dot dot-${f.kind}`} />
                        {names[f.id].name}
                        <span className="muted"> · {getSegment(f.segment).name}</span>
                      </td>
                      <td>
                        <select
                          value={item.action}
                          aria-label={`Action for ${names[f.id].name}`}
                          onChange={(e) => onPlan(f.id, { action: e.target.value as PlanAction })}
                        >
                          {PLAN_ACTIONS[f.kind].map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="date"
                          value={item.date}
                          aria-label={`Planned date for ${names[f.id].name}`}
                          onChange={(e) => onPlan(f.id, { date: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          value={item.notes}
                          placeholder="Notes"
                          aria-label={`Notes for ${names[f.id].name}`}
                          onChange={(e) => onPlan(f.id, { notes: e.target.value })}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="doc-section">
          <h2>Follow-up</h2>
          <label className="field follow-up">
            <span>Follow-up date</span>
            <input type="date" value={followUp} onChange={(e) => onFollowUp(e.target.value)} />
          </label>
        </section>
      </div>
    </div>
  )
}
