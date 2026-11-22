// Patient PT-1001 (Layla Nasser): her 4 dated visits with sample pictures, and her treatment
// plan. Her profile is in ./patients/pt1001.ts. The pictures are labelled placeholders in
// public/samples. The AI findings are not written here: they come from the detector
// (src/detector.ts) when her record is first built.
import type { Finding, ImageType, TreatmentStep } from '../types'
import type { SegmentId } from './segments'

// A visit and its sample pictures. For colonoscopy pictures the segment is the one the
// doctor chose when the picture was taken.
export interface DemoVisit {
  id: string
  date: string
  title: string
  pictures: { file: string; name: string; type: ImageType; segment?: SegmentId }[]
}

export const DEMO_VISITS: DemoVisit[] = [
  {
    id: 'visit-1',
    date: '2025-03-11',
    title: 'Screening colonoscopy',
    pictures: [
      { file: 'v1-colonoscopy-ascending.png', name: 'Colonoscopy, ascending colon', type: 'colonoscopy', segment: 'ascending' },
      { file: 'v1-colonoscopy-sigmoid.png', name: 'Colonoscopy, sigmoid colon', type: 'colonoscopy', segment: 'sigmoid' },
    ],
  },
  {
    id: 'visit-2',
    date: '2025-08-12',
    title: 'CT scan',
    pictures: [{ file: 'v2-ct.png', name: 'CT scan', type: 'ct' }],
  },
  {
    id: 'visit-3',
    date: '2026-01-13',
    title: 'Follow-up CT scan and colonoscopy',
    pictures: [
      { file: 'v3-ct.png', name: 'CT scan', type: 'ct' },
      { file: 'v3-colonoscopy-ascending.png', name: 'Colonoscopy, ascending colon', type: 'colonoscopy', segment: 'ascending' },
    ],
  },
  {
    id: 'visit-4',
    date: '2026-06-16',
    title: 'Follow-up colonoscopy',
    pictures: [
      { file: 'v4-colonoscopy-ascending.png', name: 'Colonoscopy, ascending colon', type: 'colonoscopy', segment: 'ascending' },
    ],
  },
]

// Extra details of the AI findings, by finding id, as the colonoscopy and pathology reports
// give them. Merged into the findings when the record is built. Positions stay estimated
// (AI); histology and stage come only from the reports.
export const DEMO_FINDING_DETAILS: Record<string, Partial<Finding>> = {
  'v1-colonoscopy-ascending-polyp-1': { paris: '0-Is' },
  'v1-colonoscopy-sigmoid-polyp-1': {
    paris: '0-Is',
    histology: { result: 'Adenocarcinoma (biopsy)', date: '2025-03-28' },
    resection: { method: 'biopsy', complete: false, date: '2025-03-25' },
    notes: 'Ulcerated surface. Biopsied and tattooed at flexible sigmoidoscopy.',
  },
  'v2-ct-tumor': { stage: { clinical: 'cT4a cN1a M0' }, histology: { result: 'Adenocarcinoma, G2 (biopsy)', date: '2025-03-28' } },
  'v3-ct-tumor': {
    stage: { clinical: 'cT4a cN1a M0', pathologic: 'ypT3 ypN0 (0 of 16) M0' },
    histology: { result: 'Adenocarcinoma, G2, margins clear (R0), after chemotherapy', date: '2026-02-17' },
    resection: { method: 'surgery', extent: 'en-bloc', complete: true, date: '2026-02-10' },
  },
  'v3-colonoscopy-ascending-polyp-1': { paris: '0-Is' },
  'v4-colonoscopy-ascending-polyp-1': { paris: '0-Is', notes: 'Not removed at this colonoscopy (poor preparation). Polypectomy booked for 2026-12-01.' },
}

// The treatment plan, converted from the record the (fictional) previous doctors left: the
// same dates, text (in the description) and status. Shown as a graph on the Treatment page.
// The MDT meeting entry (2025-08-19) is not a care step, so it is not part of the graph.
export const DEMO_STEPS: TreatmentStep[] = [
  {
    id: 'step-1',
    phase: 'Diagnosis and staging',
    lane: 'procedures',
    kind: 'procedure',
    title: 'Sigmoid polyp biopsy',
    status: 'done',
    date: '2025-03-25',
    dependsOn: [],
    description: 'Biopsy of the sigmoid colon polyp (flexible sigmoidoscopy, six biopsies, lesion marked with tattoo ink).',
    performedBy: 'Dr. Hani Barakat, gastroenterologist',
    place: 'Endoscopy Unit',
    outcome: 'Adenocarcinoma, G2 (pathology report 2025-03-28)',
    visitId: 'visit-1',
    findingIds: ['v1-colonoscopy-sigmoid-polyp-1'],
    profileSection: 'pathology',
    notes: 'Pathology report on file.',
  },
  {
    id: 'step-2',
    phase: 'Neoadjuvant treatment',
    lane: 'medicine',
    kind: 'medicine',
    title: 'Chemotherapy, 6 cycles',
    status: 'done',
    date: '2025-09-01',
    endDate: '2025-11-12',
    dependsOn: ['step-1'],
    description: 'Chemotherapy, 6 cycles (oncology team), before surgery.',
    performedBy: 'Dr. Rania Farouk, medical oncologist',
    place: 'Oncology Day Unit',
    regimen: {
      drugs: 'FOLFOX: oxaliplatin, folinic acid, fluorouracil',
      dose: 'Oxaliplatin 85 mg/m2, folinic acid 400 mg/m2, fluorouracil 400 mg/m2 bolus then 2400 mg/m2 over 46 hours',
      route: 'IV (implanted port)',
      schedule: 'Every 14 days',
    },
    cycles: [
      { n: 1, date: '2025-09-01', status: 'done', note: 'Full dose' },
      { n: 2, date: '2025-09-15', status: 'done', note: 'Full dose' },
      { n: 3, date: '2025-09-29', status: 'done', note: 'Full dose' },
      { n: 4, date: '2025-10-13', status: 'done', note: 'Full dose' },
      { n: 5, date: '2025-10-27', status: 'done', note: 'Full dose' },
      { n: 6, date: '2025-11-10', status: 'done', note: 'Full dose; white cells low after this cycle' },
    ],
    outcome: 'Partial response on CT (tumor 34 mm to 23 mm, 2026-01-13)',
    sideEffects: [
      { name: 'Peripheral neuropathy', grade: 1 },
      { name: 'Fatigue', grade: 1 },
      { name: 'Neutropenia', grade: 1 },
    ],
    visitId: 'visit-3',
    findingIds: ['v3-ct-tumor'],
    profileSection: 'medications',
    notes: 'Medicines as prescribed by the oncology team.',
  },
  {
    id: 'step-3',
    phase: 'Surgery',
    lane: 'procedures',
    kind: 'procedure',
    title: 'Sigmoid colectomy',
    status: 'done',
    date: '2026-02-10',
    dependsOn: ['step-2'],
    description: 'Surgery: removal of the sigmoid colon segment (laparoscopic sigmoid colectomy with anastomosis).',
    performedBy: 'Dr. Khaled Saleh, colorectal surgeon',
    place: 'Colorectal Surgery, main theatre',
    outcome: 'Margins clear (R0). ypT3 ypN0 (0 of 16 nodes).',
    visitId: 'visit-3',
    findingIds: ['v3-ct-tumor'],
    profileSection: 'pathology',
  },
  {
    id: 'step-4',
    phase: 'Surveillance',
    lane: 'medicine',
    kind: 'medicine',
    title: 'Follow-up prescription',
    status: 'in-progress',
    date: '2026-06-30',
    dependsOn: ['step-3'],
    description: 'Medicine: follow-up prescription from the oncology team (duloxetine for nerve pain and numbness after oxaliplatin).',
    performedBy: 'Dr. Rania Farouk, medical oncologist',
    place: 'Oncology Day Unit',
    regimen: { drugs: 'Duloxetine', dose: '30 mg', route: 'Oral', schedule: 'Once daily' },
    profileSection: 'medications',
    notes: 'Reviewed at each visit.',
  },
  {
    id: 'step-5',
    phase: 'Surveillance',
    lane: 'procedures',
    kind: 'procedure',
    title: 'Ascending polypectomy',
    status: 'planned',
    date: '2026-12-01',
    dependsOn: ['step-3'],
    description: 'Removal of the ascending colon polyp (polypectomy).',
    performedBy: 'Dr. Hani Barakat, gastroenterologist',
    place: 'Endoscopy Unit',
    visitId: 'visit-4',
    findingIds: ['v4-colonoscopy-ascending-polyp-1'],
    notes: 'Planned after the June 2026 colonoscopy.',
  },
  {
    id: 'step-6',
    phase: 'Surveillance',
    lane: 'imaging-tests',
    kind: 'imaging',
    title: 'Follow-up CT scan',
    status: 'planned',
    date: '2027-01-12',
    dependsOn: ['step-3'],
    description: 'Follow-up CT scan of the chest, abdomen and pelvis.',
    place: 'Radiology Department',
    profileSection: 'imaging',
  },
]
