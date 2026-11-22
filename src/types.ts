// Shared data shapes used across the app.
import type { SegmentId } from './data/segments'

export type FindingKind = 'polyp' | 'tumor'
export type ImageType = 'colonoscopy' | 'ct'

// Size: polyps in mm, tumors in cm.
export interface Size {
  value: number
  unit: 'mm' | 'cm'
}

// Paris classification of superficial lesions (polyps).
export type ParisType = '0-Ip' | '0-Isp' | '0-Is' | '0-IIa' | '0-IIb' | '0-IIc' | '0-IIa+IIc' | '0-III'
export type TumorMorphology = 'polypoid-fungating' | 'ulcerated' | 'annular-stenosing' | 'flat-infiltrating'
export type LocationBasis = 'estimated' | 'measured' | 'surgery-confirmed'
export type ResectionMethod = 'snare' | 'EMR' | 'ESD' | 'biopsy' | 'surgery' | 'none'

// One polyp or tumor, shown in the findings list and on the 3D colon.
// The fields after "position" are all optional (as a colonoscopy and pathology report would
// give them). The app never fills in histology or stage by itself.
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

  // Common to polyps and tumors
  distanceFromAnalVergeCm?: number // along the colon, in cm
  locationBasis?: LocationBasis // how the position was obtained (AI findings: always estimated)
  clockPosition?: number // 1 to 12, rectum only (clock face as seen by the endoscopist)
  notes?: string

  // Polyps
  paris?: ParisType
  opticalDiagnosis?: { nice?: 1 | 2 | 3; kudo?: 'I' | 'II' | 'IIIS' | 'IIIL' | 'IV' | 'Vi' | 'Vn' }
  histology?: { result: string; dysplasia?: 'low-grade' | 'high-grade'; date: string } // only from a pathology report
  resection?: { method: ResectionMethod; extent?: 'en-bloc' | 'piecemeal'; complete?: boolean; date: string }

  // Tumors
  morphology?: TumorMorphology
  lengthMm?: number
  circumferentialExtentPct?: number // 25, 50, 75 or 100
  lumen?: 'open' | 'narrowed' | 'nearly-blocked'
  stage?: { clinical?: string; pathologic?: string } // shown, never computed
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

// ---------- The treatment plan (shown as a graph on the Treatment page) ----------
// Written by the doctor, never by the app. The status is stored, not computed.
export type StepStatus = 'done' | 'in-progress' | 'planned'
export type StepKind = 'procedure' | 'medicine' | 'radiotherapy' | 'imaging' | 'lab' | 'review'
export type Lane = 'procedures' | 'medicine' | 'imaging-tests' | 'reviews'

// One cycle of a repeated treatment (or one repeat of a repeated test).
export interface StepCycle {
  n: number
  date: string
  status: StepStatus
  note?: string
}

export interface TreatmentStep {
  id: string
  phase: string // the doctor's own phase name, shown as the column header
  lane: Lane
  kind: StepKind
  title: string // short, about 28 characters at most
  status: StepStatus
  date: string // start date
  endDate?: string
  monthOnly?: boolean // the date is only known to the month (shown as "Feb 2027")
  dependsOn: string[] // ids of the steps this one follows
  description?: string
  performedBy?: string // "Dr. Khaled Saleh, colorectal surgeon"
  place?: string
  regimen?: { drugs: string; dose: string; route: string; schedule: string }
  cycles?: StepCycle[]
  radiotherapy?: { totalGy: number; fractions: number }
  outcome?: string
  sideEffects?: { name: string; grade: number }[]
  visitId?: string // link to a visit
  findingIds?: string[] // link to findings of that visit
  profileSection?: string // related section of the Patient page, e.g. "labs" or "pathology"
  notes?: string
}

// What the app keeps about one patient that the doctor can change: the visits (pictures and
// findings) and the treatment plan. Saved per patient in the browser (localStorage).
// The rest of the patient's file (the Patient page) is read-only data in src/data/patients.
export interface PatientRecord {
  patientId: string
  visits: Visit[]
  steps: TreatmentStep[]
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
