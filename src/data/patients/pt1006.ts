// PT-1006 Fatima Al-Zoubi, 52, female. Polyps only, surveillance.
// First screening colonoscopy 2026-03-24: three polyps removed (22 mm stalked tubulovillous
// adenoma, 6 mm tubular adenoma, 4 mm hyperplastic polyp). No cancer. Next colonoscopy in 3 years.
import type { PatientProfile } from '../../profileTypes'
import type { TreatmentStep, Visit } from '../../types'
import { GASTROENTEROLOGIST, NURSE, PATHOLOGIST, notInvolved } from './careTeam'
import { polypOnlyBiomarkers, routineLabs, step, symptomList } from './helpers'

const GI = 'Dr. Hani Barakat, gastroenterologist'

export const VISITS_1006: Visit[] = [
  { id: 'visit-1', date: '2026-03-03', title: 'Gastroenterology clinic: screening referral', pictures: [], findings: [] },
  {
    id: 'visit-2',
    date: '2026-03-24',
    title: 'Screening colonoscopy with polypectomy',
    pictures: [],
    findings: [
      { id: 'pt1006-v2-polyp-sig', kind: 'polyp', segment: 'sigmoid', size: { value: 22, unit: 'mm' }, source: 'manual', distanceFromAnalVergeCm: 32, locationBasis: 'estimated', paris: '0-Ip', opticalDiagnosis: { nice: 2 }, histology: { result: 'Tubulovillous adenoma', dysplasia: 'low-grade', date: '2026-03-31' }, resection: { method: 'snare', extent: 'en-bloc', complete: true, date: '2026-03-24' }, notes: 'Stalk 8 mm wide. Clip placed on the stalk after removal.' },
      { id: 'pt1006-v2-polyp-tra', kind: 'polyp', segment: 'transverse', size: { value: 6, unit: 'mm' }, source: 'manual', distanceFromAnalVergeCm: 85, locationBasis: 'estimated', paris: '0-IIa', opticalDiagnosis: { nice: 2 }, histology: { result: 'Tubular adenoma', dysplasia: 'low-grade', date: '2026-03-31' }, resection: { method: 'snare', extent: 'en-bloc', complete: true, date: '2026-03-24' }, notes: 'Cold snare.' },
      { id: 'pt1006-v2-polyp-rec', kind: 'polyp', segment: 'rectum', size: { value: 4, unit: 'mm' }, source: 'manual', distanceFromAnalVergeCm: 8, locationBasis: 'measured', clockPosition: 3, paris: '0-IIa', opticalDiagnosis: { nice: 1 }, histology: { result: 'Hyperplastic polyp', date: '2026-03-31' }, resection: { method: 'snare', extent: 'en-bloc', complete: true, date: '2026-03-24' }, notes: 'Cold snare.' },
    ],
  },
  { id: 'visit-3', date: '2026-04-14', title: 'Results clinic', pictures: [], findings: [] },
]

export const STEPS_1006: TreatmentStep[] = [
  step('step-1', 'Screening', 'reviews', 'review', 'Gastroenterology clinic', 'done', '2026-03-03', [], { description: 'Referred by the family doctor for a first screening colonoscopy at age 52. No symptoms.', performedBy: GI, place: 'Endoscopy Unit clinic', visitId: 'visit-1' }),
  step('step-2', 'Screening', 'procedures', 'procedure', 'Screening colonoscopy', 'done', '2026-03-24', ['step-1'], { description: 'Complete colonoscopy to the cecum. Three polyps removed: 22 mm stalked sigmoid polyp (hot snare, clip on the stalk), 6 mm transverse polyp and 4 mm rectal polyp (cold snare).', performedBy: GI, place: 'Endoscopy Unit', outcome: 'All three polyps removed en bloc. No bleeding.', visitId: 'visit-2', findingIds: ['pt1006-v2-polyp-sig', 'pt1006-v2-polyp-tra', 'pt1006-v2-polyp-rec'], profileSection: 'imaging' }),
  step('step-3', 'Screening', 'imaging-tests', 'lab', 'Pathology result', 'done', '2026-03-31', ['step-2'], { description: 'Pathology of the three polyps.', performedBy: 'Dr. Lina Odeh, pathologist', place: 'Pathology Department', outcome: 'Tubulovillous adenoma (22 mm) and tubular adenoma (6 mm), both low-grade dysplasia; hyperplastic polyp (4 mm). No cancer.', visitId: 'visit-2', findingIds: ['pt1006-v2-polyp-sig', 'pt1006-v2-polyp-tra', 'pt1006-v2-polyp-rec'], profileSection: 'pathology' }),
  step('step-4', 'Screening', 'reviews', 'review', 'Results clinic', 'done', '2026-04-14', ['step-3'], { description: 'Pathology results discussed. Surveillance colonoscopy in 3 years (adenoma 10 mm or larger).', performedBy: GI, place: 'Endoscopy Unit clinic', visitId: 'visit-3' }),
  step('step-5', 'Surveillance', 'procedures', 'procedure', 'Surveillance colonoscopy', 'planned', '2029-03-01', ['step-4'], { monthOnly: true, description: 'Surveillance colonoscopy, 3 years after the polypectomy.', performedBy: GI, place: 'Endoscopy Unit' }),
]

export const PROFILE_1006: PatientProfile = {
  id: 'PT-1006',
  name: 'Fatima Al-Zoubi',
  age: 52,
  sex: 'Female',
  bloodGroup: 'A+',
  diagnosisSummary: 'Colorectal adenomas, removed (no cancer)',
  stage: 'No cancer',
  status: 'Surveillance',

  allergies: [{ substance: 'Penicillin (amoxicillin)', type: 'Drug', reaction: 'Itchy rash', severity: 'Mild', date: '2026-03-03', source: 'Clinic note' }],
  precautions: [],

  findingStatus: [
    { visitId: 'visit-2', kind: 'polyp', segment: 'sigmoid', status: 'Removed', note: 'Hot snare, en bloc, clip on the stalk' },
    { visitId: 'visit-2', kind: 'polyp', segment: 'transverse', status: 'Removed', note: 'Cold snare, en bloc' },
    { visitId: 'visit-2', kind: 'polyp', segment: 'rectum', status: 'Removed', note: 'Cold snare, en bloc' },
  ],

  diagnosis: null,

  pathology: [
    { kind: 'polyp', label: 'Specimen A', date: '2026-03-31', source: 'Pathology report', procedure: 'Hot snare polypectomy (colonoscopy, 2026-03-24)', site: 'Sigmoid colon', size: '22 mm, stalked (0-Ip)', histology: 'Tubulovillous adenoma', dysplasia: 'Low-grade', completeness: 'Completely removed (stalk margin clear)', comment: 'No cancer seen.' },
    { kind: 'polyp', label: 'Specimen B', date: '2026-03-31', source: 'Pathology report', procedure: 'Cold snare polypectomy (colonoscopy, 2026-03-24)', site: 'Transverse colon', size: '6 mm, slightly raised (0-IIa)', histology: 'Tubular adenoma', dysplasia: 'Low-grade', completeness: 'Completely removed', comment: 'No cancer seen.' },
    { kind: 'polyp', label: 'Specimen C', date: '2026-03-31', source: 'Pathology report', procedure: 'Cold snare polypectomy (colonoscopy, 2026-03-24)', site: 'Rectum', size: '4 mm, slightly raised (0-IIa)', histology: 'Hyperplastic polyp', dysplasia: 'None', completeness: 'Completely removed', comment: 'No dysplasia.' },
  ],

  biomarkers: polypOnlyBiomarkers('No known family history of bowel cancer.'),

  medications: [
    { name: 'Levothyroxine', dose: '75 micrograms', route: 'Oral', frequency: 'Once daily before breakfast', purpose: 'Underactive thyroid', start: '2016-05-10', source: 'Family doctor medication list', group: 'Other' },
    { name: 'Vitamin D3 (colecalciferol)', dose: '1,000 units', route: 'Oral', frequency: 'Once daily', purpose: 'Low vitamin D', start: '2024-11-02', source: 'Family doctor medication list', group: 'Other' },
    { name: 'Bowel preparation (macrogol solution)', dose: '2 litres', route: 'Oral', frequency: 'Once, split dose', purpose: 'Bowel preparation for colonoscopy', start: '2026-03-23', source: 'Endoscopy instructions', group: 'Other', stopped: { date: '2026-03-24', reason: 'Single use before colonoscopy' } },
  ],

  labs: routineLabs('Female', ['2026-03-03', '2026-04-14'], { egfr: 94 }, {}, { cea: 'Not required: polyps only' }),

  imaging: [
    { date: '2026-03-24', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Whole colon to the cecum', findings: 'Good bowel preparation (Boston score 8). 22 mm stalked polyp in the sigmoid colon (32 cm), 6 mm flat raised polyp in the transverse colon, 4 mm pale polyp in the rectum (8 cm, 3 o\'clock). All removed. Small internal hemorrhoids.', impression: 'Three polyps removed. Await pathology.', visitId: 'visit-2' },
  ],

  history: {
    conditions: [
      { name: 'Underactive thyroid (hypothyroidism)', since: '2016', source: 'Family doctor record', note: 'Stable on treatment' },
      { name: 'Low vitamin D', since: '2024', source: 'Family doctor record' },
    ],
    surgeries: [{ name: 'Caesarean section', date: '2004-08-17', source: 'Family doctor record' }],
    stays: [],
    ecog: { value: 0, date: '2026-04-14', source: 'Clinic note' },
    asa: { value: 'ASA II', date: '2026-03-24', source: 'Sedation assessment' },
  },

  family: [{ relative: 'Father', condition: 'Type 2 diabetes', ageAtDiagnosis: 55, date: '2026-03-03', source: 'Clinic note' }],
  familyNote: 'Mother and siblings: none known.',

  lifestyle: {
    smoking: { status: 'Never', packYears: null, detail: 'Never smoked', date: '2026-03-03', source: 'Clinic note' },
    alcohol: { text: 'None', date: '2026-03-03', source: 'Clinic note' },
    activity: { text: 'Walks 30 minutes, 3 days a week', date: '2026-03-03', source: 'Clinic note' },
    diet: { text: 'Mixed diet, high in white bread and rice', date: '2026-03-03', source: 'Clinic note' },
    heightCm: { value: 162, date: '2026-03-03', source: 'Clinic note' },
    weights: [
      { date: '2026-03-03', kg: 76.4, source: 'Clinic note' },
      { date: '2026-04-14', kg: 75.8, source: 'Clinic note' },
    ],
  },

  symptoms: { date: '2026-04-14', source: 'Clinic note', items: symptomList({}) },
  vitals: { bloodPressure: '122/76', pulse: 72, temperature: 36.7, oxygen: 99, date: '2026-04-14', source: 'Clinic note' },
  exam: { text: 'Well. Abdomen soft and not tender.', date: '2026-04-14', source: 'Clinic note' },

  careTeam: [
    notInvolved('Colorectal surgeon'),
    notInvolved('Medical oncologist'),
    GASTROENTEROLOGIST,
    PATHOLOGIST,
    NURSE,
    { role: 'Family doctor', name: 'Dr. Reem Tawil', clinic: 'Sweileh Family Health Centre' },
  ],
  appointments: [
    { date: '2027-01-12', what: 'Thyroid blood test review', with: 'Dr. Reem Tawil, Sweileh Family Health Centre' },
    { date: '2029-03-01', what: 'Surveillance colonoscopy (March 2029, date to be set)', with: 'Dr. Hani Barakat, Endoscopy Unit' },
  ],
}
