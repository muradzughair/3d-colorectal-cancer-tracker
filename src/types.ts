// Shared data shapes used across the app.
import type { SegmentId } from './data/segments'

export type FindingKind = 'polyp' | 'tumor'
export type ImageType = 'colonoscopy' | 'ct'

// Size: polyps in mm, tumors in cm.
export interface Size {
  value: number
  unit: 'mm' | 'cm'
}

// One polyp or tumor, shown in the findings list and on the 3D colon.
export interface Finding {
  id: string
  kind: FindingKind
  segment: SegmentId
  size: Size | null // null = not measured (manual marks)
  source: 'ai' | 'manual'
  edited?: boolean // true when the doctor changed a value the AI gave
  imageName?: string // which picture an AI finding came from
  // Exact 3D point for manual marks. AI findings have none: their pin is placed at an
  // estimated spot in the segment.
  position?: [number, number, number]
}

// The (fictional) patient's details, shown on the report.
export interface Patient {
  name: string
  age: string
  sex: string
  fileNumber: string
}

// A picture of a visit, with what the detector found in it.
export interface Picture {
  name: string // shown to the doctor, and stored on each finding
  type: ImageType
  file: string // the picture file in public/samples
  result: DetectionResult | null // null = the detector had no result for it
  segment: SegmentId | '' // colonoscopy only: the segment the doctor chose
}

// One dated visit: its pictures and findings.
export interface Visit {
  id: string
  date: string // "2025-03-11"
  title: string // e.g. "Screening colonoscopy"
  pictures: Picture[]
  findings: Finding[]
}

// One step in the treatment and medicine record. Written by the doctor, never by the app.
export type EntryStatus = 'done' | 'in-progress' | 'planned'

export interface TreatmentEntry {
  id: string
  date: string
  text: string // what was done or planned, e.g. "Surgery: removal of the sigmoid colon"
  status: EntryStatus
  note: string
}

// The radiologist's report for one visit. findings === undefined means "not edited yet":
// the text is then filled in from the visit's findings.
export interface ReportText {
  findings?: string
  comments: string
  radiologist: string
}

// Everything the app keeps about the patient. Saved in the browser (localStorage).
export interface PatientRecord {
  patient: Patient
  visits: Visit[]
  entries: TreatmentEntry[]
  reports: Record<string, ReportText> // by visit id
}

// ---------- What the detector returns (see src/detector.ts) ----------

// Box around a polyp, in pixels of the original image.
export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface DetectedPolyp {
  box: Box
  size: Size
}

export interface DetectedTumor {
  outline: [number, number][] // polygon points in pixels of the original image
  size: Size
  segment: SegmentId // a CT scan shows where the tumor is
}

export interface DetectionResult {
  polyps: DetectedPolyp[]
  tumor: DetectedTumor | null
}
