// The patient list (landing page): one row per fictional patient, sortable by any column and
// searchable by name or ID. Click a row to open the patient.
import { useState } from 'react'
import { PATIENTS, type PatientData } from '../data/patients'
import { resetSavedRecords } from '../data/record'
import { formatDate } from '../lib/dates'
import { lastVisitDate, nextAppointment, statusClass } from '../lib/patientInfo'
import { patientHref } from '../lib/route'

type Column = 'id' | 'name' | 'age' | 'diagnosis' | 'stage' | 'status' | 'last' | 'next' | 'allergy'

const COLUMNS: { id: Column; label: string }[] = [
  { id: 'id', label: 'ID' },
  { id: 'name', label: 'Name' },
  { id: 'age', label: 'Age, sex' },
  { id: 'diagnosis', label: 'Diagnosis' },
  { id: 'stage', label: 'Stage' },
  { id: 'status', label: 'Status' },
  { id: 'last', label: 'Last visit' },
  { id: 'next', label: 'Next appointment' },
  { id: 'allergy', label: 'Allergy' },
]

// The value a column is sorted by.
function sortValue(p: PatientData, column: Column): string | number {
  const profile = p.profile
  switch (column) {
    case 'id':
      return profile.id
    case 'name':
      return profile.name
    case 'age':
      return profile.age
    case 'diagnosis':
      return profile.diagnosisSummary
    case 'stage':
      return profile.stage
    case 'status':
      return profile.status
    case 'last':
      return lastVisitDate(p)
    case 'next':
      return nextAppointment(profile)?.date ?? '9999' // none booked: last
    case 'allergy':
      return profile.allergies.length > 0 ? 0 : 1 // patients with an allergy first
  }
}

export default function PatientListPage() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<{ column: Column; up: boolean }>({ column: 'id', up: true })
  const [resetDone, setResetDone] = useState(false)

  const words = search.trim().toLowerCase()
  const rows = PATIENTS.filter((p) => !words || `${p.profile.name} ${p.profile.id}`.toLowerCase().includes(words)).sort((a, b) => {
    const x = sortValue(a, sort.column)
    const y = sortValue(b, sort.column)
    const order = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
    return sort.up ? order : -order
  })

  // Click a header: sort by it; click it again: reverse the order.
  const sortBy = (column: Column) => setSort((s) => ({ column, up: s.column === column ? !s.up : true }))

  const reset = () => {
    if (!window.confirm('Reset the demo data? All changes to findings and treatment records of every patient will be lost.')) return
    resetSavedRecords()
    setResetDone(true)
  }

  return (
    <div className="page page-text patient-list-page">
      <div className="list-head">
        <h2>Patients</h2>
        <span className="demo-data-tag">Demo data</span>
        <span className="muted">{rows.length === PATIENTS.length ? `${PATIENTS.length} patients` : `${rows.length} of ${PATIENTS.length} patients`}</span>
        <input
          className="search-box"
          type="search"
          placeholder="Search by name or ID"
          aria-label="Search by name or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="doc-table patient-table">
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.id} aria-sort={sort.column === c.id ? (sort.up ? 'ascending' : 'descending') : undefined}>
                <button className="sort-button" onClick={() => sortBy(c.id)}>
                  {c.label}
                  <span className="sort-mark">{sort.column === c.id ? (sort.up ? '▲' : '▼') : ''}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const profile = p.profile
            const next = nextAppointment(profile)
            const open = () => (window.location.hash = patientHref(profile.id, 'colon'))
            return (
              <tr
                key={profile.id}
                className="patient-row"
                tabIndex={0}
                onClick={open}
                onKeyDown={(e) => e.key === 'Enter' && open()}
                aria-label={`Open ${profile.name}`}
              >
                <td className="mono">{profile.id}</td>
                <td>
                  <strong>{profile.name}</strong>
                </td>
                <td>
                  {profile.age}, {profile.sex}
                </td>
                <td className="diagnosis-cell">{profile.diagnosisSummary}</td>
                <td>{profile.stage}</td>
                <td>
                  <span className={statusClass(profile.status)}>{profile.status}</span>
                </td>
                <td>{formatDate(lastVisitDate(p))}</td>
                <td>{next ? formatDate(next.date) : <span className="muted">None booked</span>}</td>
                <td>
                  {profile.allergies.length > 0 ? (
                    <span className="allergy-mark" title={profile.allergies.map((a) => a.substance).join(', ')}>
                      Allergy
                    </span>
                  ) : (
                    <span className="muted">None known</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {rows.length === 0 && <p className="muted small-note">No patient matches "{search}".</p>}

      <p className="reset-line">
        <button className="link-button" onClick={reset}>
          Reset demo data
        </button>
        {resetDone && <span className="muted"> Saved records cleared. Each patient starts again from the demo data.</span>}
      </p>
    </div>
  )
}
