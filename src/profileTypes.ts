// Data shapes for the Patient page (the full patient profile). All patient data is fictional.
// Every value carries the date it was recorded and where it came from (its "source"),
// for example "Pathology report", "Lab", "Colonoscopy report" or "Clinic note".
import type { SegmentId } from './data/segments'
import type { FindingKind } from './types'

// When a value was recorded and where it came from.
export interface Sourced {
  date: string // "2026-02-17"
  source: string
}

// A short written value with its date and source.
export interface SourcedText extends Sourced {
  text: string
}

export type PatientStatus =
  | 'Surveillance'
  | 'Under treatment'
  | 'Awaiting surgery'
  | 'Post-treatment follow-up'
  | 'Newly diagnosed'

export type Sex = 'Female' | 'Male'

// ---------- Alerts and allergies ----------

export interface Allergy extends Sourced {
  substance: string
  type: string // e.g. "Drug", "Contact", "Contrast"
  reaction: string
  severity: 'Mild' | 'Moderate' | 'Severe'
}

// A special precaution, e.g. latex-free care or an implanted port.
export interface Precaution extends Sourced {
  text: string
}

// ---------- Endoscopy findings ----------

// The status of one finding at one visit, written in the data (the app never guesses it).
// A finding is matched by visit, kind and segment.
export interface FindingStatusNote {
  visitId: string
  kind: FindingKind
  segment: SegmentId
  status: 'Present' | 'Removed' | 'Biopsied'
  note?: string
}

// ---------- Diagnosis and staging ----------

export interface Stage extends Sourced {
  tnm: string // e.g. "cT3 cN1 M0"
  group: string // e.g. "IIIB"
}

export interface Diagnosis extends Sourced {
  site: string // e.g. "Sigmoid colon"
  segment: SegmentId
  distanceFromAnalVergeCm: number | null // rectal and left-sided tumors only
  sidedness: 'Right colon' | 'Left colon' | 'Rectum'
  histology: string
  grade: string
  clinicalStage: Stage
  pathologicStage: Stage | null // null = no surgery yet
  pathologicStageNote?: string // why it is not available
  tumorSize: SourcedText[]
  symptoms: string
  synchronousLesions: string
}

// ---------- Pathology ----------

// A cancer specimen (biopsy or resection), following the standard colorectal report elements.
export interface CancerSpecimen extends Sourced {
  kind: 'cancer'
  label: string // e.g. "Specimen A"
  procedure: string
  site: string
  histology: string
  grade: string // G1 to G4
  depth: string
  lymphovascular: string
  perineural: string
  budding: string
  emvi: string // extramural venous invasion
  margins: { proximal: string; distal: string; radial: string }
  nodes: string // "4 of 18 positive"
  deposits: string
  regression: string // treatment effect / regression grade
  ptnm: string
  comment: string
}

// A polyp specimen.
export interface PolypSpecimen extends Sourced {
  kind: 'polyp'
  label: string
  procedure: string
  site: string
  size: string
  histology: string
  dysplasia: string
  completeness: string
  comment: string
}

export type Specimen = CancerSpecimen | PolypSpecimen

// ---------- Biomarkers and genetics ----------

// done = result given; not-done = not tested; not-required = not needed at this stage;
// pending = sent or referred, no result yet.
export type TestState = 'done' | 'not-done' | 'not-required' | 'pending'

export interface TestResult {
  state: TestState
  result?: string
  date?: string
  source?: string
  note?: string
}

export type StainResult = 'Intact' | 'Lost'

export interface MmrResult extends TestResult {
  stains?: { mlh1: StainResult; msh2: StainResult; msh6: StainResult; pms2: StainResult }
}

export interface Biomarkers {
  mmr: MmrResult // the "result" is pMMR or dMMR
  msi: TestResult
  kras: TestResult
  nras: TestResult
  braf: TestResult // BRAF V600E
  her2: TestResult
  ntrk: TestResult
  dpyd: TestResult
  germline: TestResult
  familyRisk: string
}

// ---------- Medications ----------

export type MedicationGroup =
  | 'Cancer treatment'
  | 'Blood thinners and antiplatelets'
  | 'Heart and blood pressure'
  | 'Diabetes'
  | 'Supportive'
  | 'Other'

export interface Medication {
  name: string
  dose: string
  route: string
  frequency: string
  purpose: string
  start: string // date
  source: string
  group: MedicationGroup // stored in the data, never guessed by the app
  stopped?: { date: string; reason: string } // stopped medicines are listed under "Stopped"
  note?: string
}

// ---------- Labs ----------

export type LabGroup =
  | 'Blood count'
  | 'Iron'
  | 'Kidney and electrolytes'
  | 'Liver'
  | 'Clotting'
  | 'Inflammation'
  | 'Tumor markers'
  | 'Diabetes'
  | 'Stool test'

export interface LabResult {
  date: string
  value: number
  source: string
}

// One lab test with its reference range (fictional typical adult range) and dated results.
// A value is flagged H or L only when it is outside low..high (null = no limit on that side).
export interface LabTest {
  id: string // e.g. "cea"
  name: string
  group: LabGroup
  unit: string
  low: number | null
  high: number | null
  results: LabResult[] // oldest first; empty = not done (see note)
  note?: string // e.g. "Not required: polyps only"
}

// ---------- Imaging and procedures ----------

export interface ImagingItem extends Sourced {
  type: string // e.g. "Colonoscopy", "CT", "MRI", "Surgery"
  region: string
  findings: string
  impression: string
  visitId?: string // the visit it belongs to, when there is one
}

// ---------- Medical history ----------

export interface Condition {
  name: string
  since: string // year, e.g. "2014"
  source: string
  note?: string
}

export interface PastSurgery extends Sourced {
  name: string
}

export interface HospitalStay {
  from: string
  to: string
  reason: string
  place: string
  source: string
}

export interface MedicalHistory {
  conditions: Condition[]
  surgeries: PastSurgery[]
  stays: HospitalStay[]
  ecog: Sourced & { value: number } // performance status 0 to 4
  asa: Sourced & { value: string } // e.g. "ASA II"
}

// ---------- Family history ----------

export interface FamilyMember extends Sourced {
  relative: string
  condition: string
  ageAtDiagnosis: number | null
}

// ---------- Lifestyle ----------

export interface Lifestyle {
  smoking: Sourced & { status: 'Never' | 'Former' | 'Current'; packYears: number | null; detail: string }
  alcohol: SourcedText
  activity: SourcedText
  diet: SourcedText
  heightCm: Sourced & { value: number }
  weights: { date: string; kg: number; source: string }[] // oldest first; BMI uses the newest
}

// ---------- Symptoms and examination ----------

export interface Symptom {
  name: string // e.g. "Bowel habit"
  detail: string
  since: string | null // date the symptom started, null = no symptom
}

export interface Vitals extends Sourced {
  bloodPressure: string // "126/78"
  pulse: number // beats per minute
  temperature: number // degrees C
  oxygen: number // saturation in %
}

// ---------- Care team and appointments ----------

export interface CareTeamMember {
  role: string
  name: string
  clinic: string
}

export interface Appointment {
  date: string
  what: string
  with: string
}

// ---------- The whole profile ----------

export interface PatientProfile {
  id: string // e.g. "PT-1001"
  name: string
  age: number
  sex: Sex
  bloodGroup: string
  diagnosisSummary: string // one short line, e.g. "Mid-rectal adenocarcinoma"
  stage: string // short stage, e.g. "cIIIB" or "No cancer"
  status: PatientStatus

  allergies: Allergy[] // empty = no known allergies
  precautions: Precaution[]
  findingStatus: FindingStatusNote[]
  diagnosis: Diagnosis | null // null = no cancer (polyps only)
  pathology: Specimen[]
  biomarkers: Biomarkers
  medications: Medication[]
  labs: LabTest[]
  imaging: ImagingItem[] // imaging and procedures, oldest first
  history: MedicalHistory
  family: FamilyMember[] // empty = none known
  familyNote: string
  lifestyle: Lifestyle
  symptoms: Sourced & { items: Symptom[] }
  vitals: Vitals
  exam: SourcedText
  careTeam: CareTeamMember[]
  appointments: Appointment[] // upcoming, oldest first
}
