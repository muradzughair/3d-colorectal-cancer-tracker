// The patient records: one per patient, with the visits (pictures and findings) and the
// treatment plan. All pages read the open patient's record from here. Changes are saved in
// the browser (localStorage) under one key that holds every patient's record by id, so they
// stay after a refresh.
import { useEffect, useState } from 'react'
import { detect } from '../detector'
import { findingsFromPicture, newId } from '../lib/findings'
import { DEMO_FINDING_DETAILS, type DemoVisit } from './demoPatient'
import { getPatient } from './patients'
import type { Finding, PatientRecord, Picture, TreatmentStep, Visit } from '../types'

const STORAGE_KEY = 'colorectal-care-record-v3'
export const SAMPLES_FOLDER = `${import.meta.env.BASE_URL}samples/`

// Build visits from sample pictures: run the detector on every picture (demo mode).
async function visitsFromPictures(demoVisits: DemoVisit[]): Promise<Visit[]> {
  const visits: Visit[] = []
  for (const demo of demoVisits) {
    const pictures: Picture[] = []
    for (const p of demo.pictures) {
      const result = await detect({ name: p.file, url: SAMPLES_FOLDER + p.file }, p.type)
      pictures.push({ name: p.name, type: p.type, file: p.file, result, segment: p.segment ?? '' })
    }
    const findings = pictures.flatMap(findingsFromPicture).map((f) => ({ ...f, ...DEMO_FINDING_DETAILS[f.id] }))
    visits.push({ id: demo.id, date: demo.date, title: demo.title, pictures, findings })
  }
  return visits
}

// The starting record of a patient, from the demo data.
async function buildRecord(patientId: string): Promise<PatientRecord> {
  const data = getPatient(patientId)!
  const visits = data.demoVisits ? await visitsFromPictures(data.demoVisits) : structuredClone(data.visits ?? [])
  return { patientId, visits, steps: structuredClone(data.steps) }
}

// All saved records, by patient id.
function loadAll(): Record<string, PatientRecord> {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    const records = text ? (JSON.parse(text) as Record<string, PatientRecord>) : {}
    // A record saved by an older version gets what it is missing from the demo data: the
    // treatment plan, and the lesion details of the demo findings (kept under saved values).
    for (const r of Object.values(records)) {
      const data = getPatient(r.patientId)
      if (!r.steps) r.steps = structuredClone(data?.steps ?? [])
      const seed = new Map((data?.visits ?? []).flatMap((v) => v.findings).map((f) => [f.id, f]))
      for (const v of r.visits) v.findings = v.findings.map((f) => ({ ...(seed.get(f.id) ?? DEMO_FINDING_DETAILS[f.id] ?? {}), ...f }))
    }
    return records
  } catch {
    return {} // nothing saved yet, or the browser does not allow storage
  }
}

function save(record: PatientRecord) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadAll(), [record.patientId]: record }))
  } catch {
    // Storage full or not allowed: the app keeps working, the data just isn't saved.
  }
}

// Forget every saved record (the "Reset demo data" link). Each patient is rebuilt from the
// demo data the next time it is opened.
export function resetSavedRecords() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to do.
  }
}

// Visits from the oldest to the newest.
export function sortedVisits(record: PatientRecord): Visit[] {
  return [...record.visits].sort((a, b) => a.date.localeCompare(b.date))
}

// The hook every page uses: the open patient's record (null while it is being prepared) and
// the small set of changes the doctor can make to it. The component that uses it is rebuilt
// for every patient, so nothing of one patient is kept for the next.
export function useRecord(patientId: string) {
  const [record, setRecord] = useState<PatientRecord | null>(() => loadAll()[patientId] ?? null)

  // First time this patient is opened: build the record from the demo data.
  useEffect(() => {
    if (record) return
    let cancelled = false
    buildRecord(patientId).then((built) => !cancelled && setRecord(built))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the component appears
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

    // The treatment plan. Removing a step also removes it from the steps that followed it.
    addStep: (step: Omit<TreatmentStep, 'id'>): string => {
      const id = newId()
      setRecord((r) => r && { ...r, steps: [...r.steps, { ...step, id }] })
      return id
    },
    updateStep: (stepId: string, step: TreatmentStep) =>
      setRecord((r) => r && { ...r, steps: r.steps.map((s) => (s.id === stepId ? step : s)) }),
    removeStep: (stepId: string) =>
      setRecord(
        (r) =>
          r && {
            ...r,
            steps: r.steps.filter((s) => s.id !== stepId).map((s) => ({ ...s, dependsOn: s.dependsOn.filter((d) => d !== stepId) })),
          },
      ),
  }
}

export type RecordStore = ReturnType<typeof useRecord>

// Where the browser can load a picture from.
export function pictureUrl(picture: Picture): string {
  return SAMPLES_FOLDER + picture.file
}
