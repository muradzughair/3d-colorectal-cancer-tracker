// Top bar. First line: title, demo tag and the decision-support line.
// Second line (only when a patient is open): the page tabs, the visit date dropdown (used by
// the 3D pages), and on the right the patient's name and ID (opens the Patient page) and a
// link back to the patient list.
import { DEMO_MODE } from '../detector'
import { formatDate } from '../lib/dates'
import { PAGES, patientHref, type PageId } from '../lib/route'
import type { PatientProfile } from '../profileTypes'
import type { Visit } from '../types'

interface PatientBar {
  profile: PatientProfile
  page: PageId
  visits: Visit[] // oldest first
  visitId: string | null
  onVisit: (id: string) => void
}

// The pages that show one visit: only these use the visit date dropdown.
const VISIT_PAGES: PageId[] = ['colon', 'time', 'compare']

export default function TopBar({ patient }: { patient?: PatientBar }) {
  return (
    <header className="topbar">
      <div className="topbar-line">
        <h1>Colorectal Care Record</h1>
        {DEMO_MODE && <span className="demo-tag">Demo mode</span>}
        <p className="topbar-notice">Decision-support tool. The doctor makes the final decision.</p>
      </div>

      {patient && (
        <div className="topbar-line">
          <nav className="tabs" aria-label="Pages">
            {PAGES.map((p) => (
              <a
                key={p.id}
                href={patientHref(patient.profile.id, p.id)}
                className={p.id === patient.page ? 'is-active' : ''}
                aria-current={p.id === patient.page ? 'page' : undefined}
              >
                {p.label}
              </a>
            ))}
          </nav>

          {VISIT_PAGES.includes(patient.page) && patient.visits.length > 0 && (
            <label className="visit-select">
              <span>Visit date</span>
              <select
                value={patient.visitId ?? ''}
                onChange={(e) => patient.onVisit(e.target.value)}
                title={patient.visits.find((v) => v.id === patient.visitId)?.title}
              >
                {patient.visits.map((v) => (
                  <option key={v.id} value={v.id}>
                    {formatDate(v.date)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="patient-chip">
            <a href={patientHref(patient.profile.id, 'profile')} title="Open the Patient page">
              <strong>{patient.profile.name}</strong> <span className="muted">{patient.profile.id}</span>
            </a>
            <span className="demo-data-tag">Demo data</span>
            <a className="all-patients" href="#/patients">
              All patients
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
