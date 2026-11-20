// The fictional demo patient: details, 4 pre-loaded dated visits and the treatment record.
// The pictures and videos are labelled placeholders in public/samples. The AI findings are
// not written here: they come from the detector (src/detector.ts) when the app starts.
import type { ImageType, Patient, TreatmentEntry } from '../types'
import type { SegmentId } from './segments'

export const DEMO_PATIENT: Patient = {
  name: 'Layla Nasser',
  age: '58',
  sex: 'Female',
  fileNumber: 'DEMO-0001',
  history: 'Fictional example: change in bowel habits since early 2025. No earlier colonoscopy.',
  notes: '',
}

// A visit as it is pre-loaded: which sample files it has. For colonoscopy pictures the
// segment is the one the doctor chose when the picture was taken.
export interface DemoVisit {
  id: string
  date: string
  title: string
  tests: string
  pictures: { file: string; name: string; type: ImageType; segment?: SegmentId }[]
  video?: { file: string; name: string }
}

export const DEMO_VISITS: DemoVisit[] = [
  {
    id: 'visit-1',
    date: '2025-03-11',
    title: 'Screening colonoscopy',
    tests: 'Stool test (FIT): positive. Biopsy taken from the sigmoid polyp; report kept by pathology. (Fictional)',
    pictures: [
      { file: 'v1-colonoscopy-ascending.png', name: 'Colonoscopy, ascending colon', type: 'colonoscopy', segment: 'ascending' },
      { file: 'v1-colonoscopy-sigmoid.png', name: 'Colonoscopy, sigmoid colon', type: 'colonoscopy', segment: 'sigmoid' },
    ],
    video: { file: 'v1-colonoscopy.mp4', name: 'Colonoscopy video' },
  },
  {
    id: 'visit-2',
    date: '2025-08-12',
    title: 'CT scan',
    tests: 'Blood tests recorded in the lab system. (Fictional)',
    pictures: [{ file: 'v2-ct.png', name: 'CT scan', type: 'ct' }],
  },
  {
    id: 'visit-3',
    date: '2026-01-13',
    title: 'Follow-up CT scan and colonoscopy',
    tests: 'Blood tests recorded in the lab system. (Fictional)',
    pictures: [
      { file: 'v3-ct.png', name: 'CT scan', type: 'ct' },
      { file: 'v3-colonoscopy-ascending.png', name: 'Colonoscopy, ascending colon', type: 'colonoscopy', segment: 'ascending' },
    ],
  },
  {
    id: 'visit-4',
    date: '2026-06-16',
    title: 'Follow-up colonoscopy',
    tests: 'No new tests at this visit. (Fictional)',
    pictures: [
      { file: 'v4-colonoscopy-ascending.png', name: 'Colonoscopy, ascending colon', type: 'colonoscopy', segment: 'ascending' },
    ],
    video: { file: 'v4-colonoscopy.mp4', name: 'Colonoscopy video' },
  },
]

// The treatment and medicine record as the (fictional) previous doctors left it.
export const DEMO_ENTRIES: TreatmentEntry[] = [
  { id: 'entry-1', date: '2025-03-25', text: 'Biopsy of the sigmoid colon polyp', status: 'done', note: 'Pathology report on file.' },
  { id: 'entry-2', date: '2025-08-19', text: 'MDT meeting: case discussed', status: 'done', note: '' },
  { id: 'entry-3', date: '2025-09-01', text: 'Chemotherapy, 6 cycles (oncology team)', status: 'done', note: 'Medicines as prescribed by the oncology team.' },
  { id: 'entry-4', date: '2026-02-10', text: 'Surgery: removal of the sigmoid colon segment', status: 'done', note: '' },
  { id: 'entry-5', date: '2026-06-30', text: 'Medicine: follow-up prescription from the oncology team', status: 'in-progress', note: 'Reviewed at each visit.' },
  { id: 'entry-6', date: '2026-12-01', text: 'Removal of the ascending colon polyp (polypectomy)', status: 'planned', note: 'Planned after the June 2026 colonoscopy.' },
  { id: 'entry-7', date: '2027-01-12', text: 'Follow-up CT scan', status: 'planned', note: '' },
]
