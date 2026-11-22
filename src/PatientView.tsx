// Everything shown while one patient is open: the top bar with the tabs and the current page.
// This component is rebuilt for every patient (see App), so all page state (findings shown,
// pictures panel, selected visit, selected finding, camera) starts fresh for each patient.
import { useMemo, useState } from 'react'
import TopBar from './components/TopBar'
import ColonPage from './pages/ColonPage'
import TimePage from './pages/TimePage'
import ComparePage from './pages/ComparePage'
import TreatmentPage from './pages/TreatmentPage'
import PatientPage from './pages/PatientPage'
import type { PatientData } from './data/patients'
import { sortedVisits, useRecord } from './data/record'
import { patientHref, type PageId } from './lib/route'
import { lesionCodes } from './lib/lesions'
import type { FindingKind } from './types'

// What another page can ask to show when it opens a page: a visit, and a finding in it.
export interface Focus {
  visitId?: string
  findingId?: string
  section?: string // a section of the Patient page, e.g. "labs"
  inside?: boolean // open the 3D colon page in the Inside view at the finding
}

export type GoTo = (page: PageId, focus?: Focus) => void

export default function PatientView({ data, page }: { data: PatientData; page: PageId }) {
  const profile = data.profile
  const store = useRecord(profile.id)
  const [chosenVisitId, setChosenVisitId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [markMode, setMarkMode] = useState<FindingKind | null>(null)
  const [profileSection, setProfileSection] = useState<string | null>(null)
  const [insideFocus, setInsideFocus] = useState<string | null>(null)

  const visits = useMemo(() => (store.record ? sortedVisits(store.record) : []), [store.record])
  const codes = useMemo(() => lesionCodes(visits), [visits]) // P1, T1 ... the same on every page
  // The chosen visit, or the newest one if none is chosen (or it was removed).
  const visit = visits.find((v) => v.id === chosenVisitId) ?? visits[visits.length - 1] ?? null

  const chooseVisit = (id: string) => {
    setChosenVisitId(id)
    setSelectedId(null) // a finding belongs to one visit
    setMarkMode(null)
  }

  // Click a finding (or its pin) to select it; click it again to unselect.
  const select = (id: string) => setSelectedId((current) => (current === id ? null : id))

  // Open another page, optionally on a given visit with a given finding selected.
  const goTo: GoTo = (target, focus) => {
    if (focus?.visitId) chooseVisit(focus.visitId)
    if (focus?.findingId) setSelectedId(focus.findingId)
    setProfileSection(focus?.section ?? null)
    setInsideFocus(focus?.inside && focus.findingId ? focus.findingId : null)
    window.location.hash = patientHref(profile.id, target)
  }

  return (
    <>
      <TopBar patient={{ profile, page, visits, visitId: visit?.id ?? null, onVisit: chooseVisit }} />

      {!store.record ? (
        <div className="page page-text">
          <p className="muted">Preparing the patient record…</p>
        </div>
      ) : (
        <>
          {/* Only the current page is built, so only one 3D view exists at a time. */}
          {page === 'colon' && visit && (
            <ColonPage
              key={visit.id}
              store={store}
              visit={visit}
              visits={visits}
              codes={codes}
              goTo={goTo}
              initialInside={insideFocus}
              selectedId={selectedId}
              onSelect={select}
              onClearSelection={() => setSelectedId(null)}
              markMode={markMode}
              onMarkMode={setMarkMode}
            />
          )}
          {page === 'time' && visit && <TimePage key={`${visit.id}-${selectedId}`} findings={visit.findings} codes={codes} selectedId={selectedId} />}
          {page === 'compare' && visit && <ComparePage store={store} visits={visits} visit={visit} codes={codes} goTo={goTo} onVisit={chooseVisit} />}
          {page === 'treatment' && <TreatmentPage store={store} profile={profile} visits={visits} codes={codes} goTo={goTo} />}
          {page === 'profile' && <PatientPage profile={profile} visits={visits} codes={codes} goTo={goTo} initialSection={profileSection} />}
          {(page === 'colon' || page === 'time' || page === 'compare') && !visit && (
            <div className="page page-text">
              <p className="muted">This patient has no visits yet.</p>
            </div>
          )}
        </>
      )}
    </>
  )
}
