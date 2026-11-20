// The patient record: one shared place for the patient, the visits, the treatment record and
// the reports. All pages (and, later, the patient view and the outside-doctor view) read it
// from here. Changes are saved in the browser (localStorage), so they stay after a refresh.
import { useEffect, useState } from 'react'
import { detect } from '../detector'
import { findingsFromPicture, newId } from '../lib/findings'
import { DEMO_ENTRIES, DEMO_PATIENT, DEMO_VISITS } from './demoPatient'
import type { Finding, PatientRecord, Picture, ReportText, TreatmentEntry, Visit } from '../types'

const STORAGE_KEY = 'colorectal-care-record-v2'
export const SAMPLES_FOLDER = `${import.meta.env.BASE_URL}samples/`

// Build the demo record: run the detector on every picture of the 4 visits.
async function buildDemoRecord(): Promise<PatientRecord> {
  const visits: Visit[] = []
  for (const demo of DEMO_VISITS) {
    const pictures: Picture[] = []
    for (const p of demo.pictures) {
      const result = await detect({ name: p.file, url: SAMPLES_FOLDER + p.file }, p.type)
      pictures.push({ name: p.name, type: p.type, file: p.file, result, segment: p.segment ?? '' })
    }
    visits.push({
      id: demo.id,
      date: demo.date,
      title: demo.title,
      pictures,
      findings: pictures.flatMap(findingsFromPicture),
    })
  }
  return { patient: DEMO_PATIENT, visits, entries: DEMO_ENTRIES, reports: {} }
}

function loadSaved(): PatientRecord | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    return text ? (JSON.parse(text) as PatientRecord) : null
  } catch {
    return null // nothing saved yet, or the browser does not allow storage
  }
}

function save(record: PatientRecord) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Storage full or not allowed: the app keeps working, the data just isn't saved.
  }
}

// Visits from the oldest to the newest.
export function sortedVisits(record: PatientRecord): Visit[] {
  return [...record.visits].sort((a, b) => a.date.localeCompare(b.date))
}

// The hook every page uses: the record (null while the demo is being prepared) and the
// small set of changes the doctor can make to it.
export function useRecord() {
  const [record, setRecord] = useState<PatientRecord | null>(loadSaved)

  // First start: prepare the demo patient.
  useEffect(() => {
    if (!record) buildDemoRecord().then(setRecord)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on the first start
  }, [])

  // Save after every change.
  useEffect(() => {
    if (record) save(record)
  }, [record])

  // Change one visit.
  const changeVisit = (visitId: string, change: (visit: Visit) => Visit) =>
    setRecord((r) => r && { ...r, visits: r.visits.map((v) => (v.id === visitId ? change(v) : v)) })

  return {
    record,

    addFinding: (visitId: string, finding: Finding) => changeVisit(visitId, (v) => ({ ...v, findings: [...v.findings, finding] })),
    updateFinding: (visitId: string, findingId: string, change: Partial<Finding>) =>
      changeVisit(visitId, (v) => ({ ...v, findings: v.findings.map((f) => (f.id === findingId ? { ...f, ...change } : f)) })),
    removeFinding: (visitId: string, findingId: string) =>
      changeVisit(visitId, (v) => ({ ...v, findings: v.findings.filter((f) => f.id !== findingId) })),

    addEntry: (entry: Omit<TreatmentEntry, 'id'>) =>
      setRecord((r) => r && { ...r, entries: [...r.entries, { ...entry, id: newId() }] }),
    updateEntry: (entryId: string, change: Partial<TreatmentEntry>) =>
      setRecord((r) => r && { ...r, entries: r.entries.map((e) => (e.id === entryId ? { ...e, ...change } : e)) }),
    removeEntry: (entryId: string) => setRecord((r) => r && { ...r, entries: r.entries.filter((e) => e.id !== entryId) }),

    updateReport: (visitId: string, change: Partial<ReportText>) =>
      setRecord(
        (r) =>
          r && {
            ...r,
            reports: { ...r.reports, [visitId]: { ...(r.reports[visitId] ?? { comments: '', radiologist: '' }), ...change } },
          },
      ),
  }
}

export type RecordStore = ReturnType<typeof useRecord>

// Where the browser can load a picture from.
export function pictureUrl(picture: Picture): string {
  return SAMPLES_FOLDER + picture.file
}
