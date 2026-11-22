// The Patient page: everything a doctor needs to know about the patient on one long page,
// so there is no need to go back to paper or a test result. A compact summary strip stays at
// the top while scrolling, and a thin section list on the left jumps to each section (the
// section in view is highlighted). Read-only. Values always show their date and source.
import { useEffect, useRef, useState } from 'react'
import {
  AlertsSection,
  AllergiesSection,
  BiomarkersSection,
  DiagnosisSection,
  FindingsSection,
  PathologySection,
} from '../components/profile/clinicalSections'
import {
  CareTeamSection,
  FamilySection,
  HistorySection,
  ImagingSection,
  LabsSection,
  LifestyleSection,
  MedicationsSection,
  SymptomsSection,
} from '../components/profile/careSections'
import { formatDate } from '../lib/dates'
import { currentBloodThinners, findLab, formatLabValue, labFlag, nextAppointment, statusClass } from '../lib/patientInfo'
import type { PatientProfile } from '../profileTypes'
import type { GoTo } from '../PatientView'
import type { LesionCode } from '../lib/lesions'
import type { Visit } from '../types'

// The sections, in page order (ids match the <section> ids).
const SECTIONS: { id: string; label: string }[] = [
  { id: 'alerts', label: 'Alerts' },
  { id: 'findings', label: 'Endoscopy findings' },
  { id: 'diagnosis', label: 'Diagnosis and staging' },
  { id: 'pathology', label: 'Pathology' },
  { id: 'biomarkers', label: 'Biomarkers and genetics' },
  { id: 'medications', label: 'Medications' },
  { id: 'allergies', label: 'Allergies' },
  { id: 'labs', label: 'Labs' },
  { id: 'imaging', label: 'Imaging and procedures' },
  { id: 'history', label: 'Medical history' },
  { id: 'family', label: 'Family history' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'symptoms', label: 'Symptoms and examination' },
  { id: 'care-team', label: 'Care team and appointments' },
]

// A small arrow for the direction of the last change (drawn in SVG).
function TrendArrow({ direction }: { direction: 'up' | 'down' | 'same' }) {
  const rotate = direction === 'up' ? -45 : direction === 'down' ? 45 : 0
  return (
    <svg className="trend-arrow" viewBox="0 0 12 12" width="12" height="12" aria-label={direction === 'same' ? 'no change' : direction}>
      <g transform={`rotate(${rotate} 6 6)`}>
        <path d="M1 6 H10 M7 3 L10 6 L7 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

// The compact strip at the top of the page.
function SummaryStrip({ profile }: { profile: PatientProfile }) {
  const cea = findLab(profile, 'cea')
  const last = cea?.results[cea.results.length - 1]
  const before = cea?.results[cea.results.length - 2]
  const direction = last && before ? (last.value > before.value ? 'up' : last.value < before.value ? 'down' : 'same') : null
  const thinners = currentBloodThinners(profile)
  const next = nextAppointment(profile)

  return (
    <div className="summary-strip">
      <div className="summary-line">
        <h2>{profile.name}</h2>
        <span>
          {profile.age}, {profile.sex}
        </span>
        <span className="mono muted">{profile.id}</span>
        <span>
          <span className="muted">Blood group</span> {profile.bloodGroup}
        </span>
        <span className="demo-data-tag">Demo data</span>
        <span className={statusClass(profile.status)}>{profile.status}</span>
      </div>
      <div className="summary-line">
        <span>
          <strong>{profile.diagnosisSummary}</strong>
        </span>
        <span>
          <span className="muted">Stage</span> <strong>{profile.stage}</strong>
        </span>
        <span>
          <span className="muted">ECOG</span> {profile.history.ecog.value}
        </span>
        <span>
          <span className="muted">Last CEA</span>{' '}
          {last && cea ? (
            <>
              <strong className={labFlag(cea, last.value) ? 'flagged' : undefined}>
                {formatLabValue(cea, last.value)} {cea.unit}
                {labFlag(cea, last.value) ? ` ${labFlag(cea, last.value)}` : ''}
              </strong>{' '}
              {direction && <TrendArrow direction={direction} />} <span className="muted">{formatDate(last.date)}</span>
            </>
          ) : (
            <span className="muted">{cea?.note ?? 'Not done'}</span>
          )}
        </span>
        <span>
          <span className="muted">Next appointment</span>{' '}
          {next ? (
            <>
              {formatDate(next.date)} <span className="muted">· {next.what}</span>
            </>
          ) : (
            <span className="muted">None booked</span>
          )}
        </span>
      </div>
      {(profile.allergies.length > 0 || thinners.length > 0) && (
        <div className="summary-line summary-alerts">
          {profile.allergies.length > 0 && (
            <span className="alert-text">
              <strong>Allergy:</strong> {profile.allergies.map((a) => a.substance).join(', ')}
            </span>
          )}
          {thinners.length > 0 && (
            <span className="alert-text">
              <strong>Blood thinner / antiplatelet:</strong> {thinners.map((m) => `${m.name} ${m.dose}`).join(', ')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  profile: PatientProfile
  visits: Visit[]
  codes: Record<string, LesionCode>
  goTo: GoTo
  initialSection?: string | null // jump to this section when the page opens
}

export default function PatientPage({ profile, visits, codes, goTo, initialSection }: Props) {
  const scroller = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(SECTIONS[0].id)

  // Highlight the section at the top of the view while scrolling.
  useEffect(() => {
    const box = scroller.current!
    const onScroll = () => {
      const strip = box.querySelector('.summary-strip') as HTMLElement | null
      const top = box.getBoundingClientRect().top + (strip?.offsetHeight ?? 0) + 24
      let id = SECTIONS[0].id
      for (const s of SECTIONS) {
        const el = box.querySelector(`#${s.id}`)
        if (el && el.getBoundingClientRect().top <= top) id = s.id
      }
      // At the very bottom, the last section counts as current.
      if (box.scrollTop + box.clientHeight >= box.scrollHeight - 4) id = SECTIONS[SECTIONS.length - 1].id
      setCurrent(id)
    }
    box.addEventListener('scroll', onScroll)
    onScroll()
    return () => box.removeEventListener('scroll', onScroll)
  }, [])

  // Opened from a link to one section (for example from the Treatment page): go there.
  useEffect(() => {
    if (!initialSection) return
    const box = scroller.current!
    const el = box.querySelector(`#${initialSection}`) as HTMLElement | null
    const strip = box.querySelector('.summary-strip') as HTMLElement | null
    if (el) box.scrollTop = el.offsetTop - (strip?.offsetHeight ?? 0) - 12
  }, [initialSection])

  // Jump to a section, leaving room for the summary strip.
  const jump = (id: string) => {
    const box = scroller.current!
    const el = box.querySelector(`#${id}`) as HTMLElement | null
    const strip = box.querySelector('.summary-strip') as HTMLElement | null
    if (el) box.scrollTo({ top: el.offsetTop - (strip?.offsetHeight ?? 0) - 12, behavior: 'smooth' })
  }

  return (
    <div className="page profile-page" ref={scroller}>
      <SummaryStrip profile={profile} />
      <div className="profile-body">
        <nav className="section-nav" aria-label="Sections">
          {SECTIONS.map((s) => (
            <button key={s.id} className={s.id === current ? 'is-active' : ''} onClick={() => jump(s.id)}>
              {s.label}
            </button>
          ))}
        </nav>
        <div className="profile-content">
          <AlertsSection profile={profile} />
          <FindingsSection profile={profile} visits={visits} codes={codes} goTo={goTo} />
          <DiagnosisSection profile={profile} />
          <PathologySection profile={profile} />
          <BiomarkersSection profile={profile} />
          <MedicationsSection profile={profile} />
          <AllergiesSection allergies={profile.allergies} />
          <LabsSection profile={profile} />
          <ImagingSection profile={profile} goTo={goTo} />
          <HistorySection profile={profile} />
          <FamilySection profile={profile} />
          <LifestyleSection profile={profile} />
          <SymptomsSection profile={profile} />
          <CareTeamSection profile={profile} />
        </div>
      </div>
    </div>
  )
}
