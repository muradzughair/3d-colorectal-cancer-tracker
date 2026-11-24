// PT-1012 Rana Haddadin, 63, female. Newly diagnosed colon cancer at the hepatic flexure.
// Colonoscopy 2026-11-03: ring-shaped tumor narrowing the colon at the hepatic flexure; the
// scope could not pass. CT with CT colonography 2026-11-10: cT4a N1 M0 (IIIB), no other
// lesions in the colon beyond it. CEA raised. MMR stains awaited. MDT on 2026-11-26.
import type { PatientProfile } from '../../profileTypes'
import type { TreatmentStep, Visit } from '../../types'
import { GASTROENTEROLOGIST, NURSE, PATHOLOGIST, SURGEON, notInvolved } from './careTeam'
import { notNeeded, routineLabs, step, symptomList } from './helpers'

const GI = 'Dr. Hani Barakat, gastroenterologist'
const SURG = 'Dr. Khaled Saleh, colorectal surgeon'

export const VISITS_1012: Visit[] = [
  {
    id: 'visit-1',
    date: '2026-11-03',
    title: 'Colonoscopy with biopsy (incomplete)',
    pictures: [],
    findings: [{ id: 'pt1012-v1-tumor', kind: 'tumor', segment: 'hepatic', size: { value: 5.0, unit: 'cm' }, source: 'manual', distanceFromAnalVergeCm: 110, locationBasis: 'estimated', morphology: 'annular-stenosing', lengthMm: 50, circumferentialExtentPct: 100, lumen: 'narrowed', stage: { clinical: 'cT4a cN1 M0' }, histology: { result: 'Adenocarcinoma, G2 (biopsy)', date: '2026-11-06' }, resection: { method: 'biopsy', complete: false, date: '2026-11-03' }, notes: 'Scope could not pass the tumor. Tattoo placed below it.' }],
  },
  { id: 'visit-2', date: '2026-11-12', title: 'Clinic: results of colonoscopy and CT', pictures: [], findings: [] },
]

export const STEPS_1012: TreatmentStep[] = [
  step('step-1', 'Diagnosis and staging', 'procedures', 'procedure', 'Colonoscopy with biopsy', 'done', '2026-11-03', [], { description: 'Colonoscopy for weight loss, anemia and change in bowel habit. Ring-shaped tumor at the hepatic flexure, about 50 mm long; scope could not pass. Biopsied and tattooed.', performedBy: GI, place: 'Endoscopy Unit', outcome: 'Adenocarcinoma, G2', visitId: 'visit-1', findingIds: ['pt1012-v1-tumor'], profileSection: 'pathology' }),
  step('step-2', 'Diagnosis and staging', 'imaging-tests', 'imaging', 'CT and CT colonography', 'done', '2026-11-10', ['step-1'], { description: 'Staging CT of chest, abdomen and pelvis, with CT colonography to see the colon the scope could not reach.', place: 'Radiology Department', outcome: 'Tumor through the wall to the surface of the colon (cT4a), 2 nearby nodes (N1). No spread to the liver or lungs. No other lesion in the cecum or ascending colon.', profileSection: 'imaging' }),
  step('step-3', 'Diagnosis and staging', 'imaging-tests', 'lab', 'CEA', 'done', '2026-11-10', ['step-1'], { description: 'CEA blood test at diagnosis.', place: 'Lab', outcome: '9.6 ug/L (H, range below 5.0)', profileSection: 'labs' }),
  step('step-4', 'Diagnosis and staging', 'imaging-tests', 'lab', 'MMR stains', 'in-progress', '2026-11-06', ['step-1'], { description: 'MMR stains on the biopsy.', performedBy: 'Dr. Lina Odeh, pathologist', place: 'Pathology Department', outcome: 'Result awaited', profileSection: 'biomarkers' }),
  step('step-5', 'Diagnosis and staging', 'reviews', 'review', 'Results clinic', 'done', '2026-11-12', ['step-2', 'step-3'], { description: 'Colonoscopy and CT results explained to the patient and her son. Referred to the MDT.', performedBy: GI, place: 'Endoscopy Unit clinic', visitId: 'visit-2' }),
  step('step-6', 'Diagnosis and staging', 'reviews', 'review', 'MDT meeting', 'planned', '2026-11-26', ['step-4', 'step-5'], { description: 'Multidisciplinary team meeting to agree the treatment plan.', place: 'MDT meeting room' }),
  step('step-7', 'Treatment plan', 'reviews', 'review', 'Surgical clinic', 'planned', '2026-12-01', ['step-6'], { description: 'Discussion of the MDT plan with the patient.', performedBy: SURG, place: 'Colorectal Surgery Clinic' }),
]

export const PROFILE_1012: PatientProfile = {
  id: 'PT-1012',
  name: 'Rana Haddadin',
  age: 63,
  sex: 'Female',
  bloodGroup: 'A+',
  diagnosisSummary: 'Hepatic flexure adenocarcinoma, staging done',
  stage: 'cIIIB',
  status: 'Newly diagnosed',

  allergies: [{ substance: 'Sulfamethoxazole (co-trimoxazole)', type: 'Drug', reaction: 'Hives', severity: 'Moderate', date: '2026-11-03', source: 'Clinic note' }],
  precautions: [{ text: 'Narrowed colon: report vomiting, swollen belly or no stools or wind (risk of blockage)', date: '2026-11-12', source: 'Clinic note' }],

  findingStatus: [{ visitId: 'visit-1', kind: 'tumor', segment: 'hepatic', status: 'Biopsied', note: 'Present; biopsy: adenocarcinoma. Scope could not pass' }],

  diagnosis: {
    date: '2026-11-06',
    source: 'Pathology report',
    site: 'Hepatic flexure',
    segment: 'hepatic',
    distanceFromAnalVergeCm: null,
    sidedness: 'Right colon',
    histology: 'Adenocarcinoma (not otherwise specified)',
    grade: 'G2 (moderately differentiated)',
    clinicalStage: { tnm: 'cT4a cN1 M0', group: 'IIIB', date: '2026-11-10', source: 'CT report' },
    pathologicStage: null,
    pathologicStageNote: 'No surgery yet: treatment plan to be agreed at the MDT on 2026-11-26',
    tumorSize: [
      { text: 'About 50 mm long at colonoscopy (whole circumference)', date: '2026-11-03', source: 'Colonoscopy report' },
      { text: '52 mm long on CT', date: '2026-11-10', source: 'CT report' },
    ],
    symptoms: 'Weight loss of 6 kg in 3 months, tiredness, cramping right-sided belly pain after meals, and looser stools.',
    synchronousLesions: 'None seen (colon beyond the tumor checked by CT colonography)',
  },

  pathology: [
    { kind: 'cancer', label: 'Specimen A', date: '2026-11-06', source: 'Pathology report', procedure: 'Endoscopic biopsy (colonoscopy, 2026-11-03)', site: 'Hepatic flexure', histology: 'Adenocarcinoma (not otherwise specified)', grade: 'G2 (moderately differentiated)', depth: 'Invasive carcinoma; depth not assessable on biopsy', lymphovascular: 'Not identified in the biopsy', perineural: 'Not identified in the biopsy', budding: 'Not assessable on biopsy', emvi: 'Not assessable on biopsy', margins: { proximal: 'Not applicable (biopsy)', distal: 'Not applicable (biopsy)', radial: 'Not applicable (biopsy)' }, nodes: 'Not applicable (biopsy)', deposits: 'Not applicable (biopsy)', regression: 'Not applicable (before treatment)', ptnm: 'Not applicable (biopsy)', comment: 'Six biopsy fragments. MMR stains requested.' },
  ],

  biomarkers: {
    mmr: { state: 'pending', note: 'Stains on the biopsy requested on 2026-11-06' },
    msi: { state: 'not-done', note: 'MMR stains used instead' },
    kras: notNeeded('No spread of the cancer'),
    nras: notNeeded('No spread of the cancer'),
    braf: notNeeded('No spread of the cancer'),
    her2: notNeeded('No spread of the cancer'),
    ntrk: notNeeded('No spread of the cancer'),
    dpyd: { state: 'not-done', note: 'Only needed if chemotherapy is planned' },
    germline: { state: 'not-done' },
    familyRisk: 'Father had stomach cancer at 74. No known bowel cancer in the family.',
  },

  medications: [
    { name: 'Metformin', dose: '850 mg', route: 'Oral', frequency: 'Twice daily with meals', purpose: 'Type 2 diabetes', start: '2016-10-04', source: 'Family doctor medication list', group: 'Diabetes' },
    { name: 'Sitagliptin', dose: '100 mg', route: 'Oral', frequency: 'Once daily', purpose: 'Type 2 diabetes', start: '2021-02-17', source: 'Family doctor medication list', group: 'Diabetes' },
    { name: 'Losartan', dose: '50 mg', route: 'Oral', frequency: 'Once daily', purpose: 'High blood pressure', start: '2018-05-29', source: 'Family doctor medication list', group: 'Heart and blood pressure' },
    { name: 'Ferrous fumarate', dose: '210 mg', route: 'Oral', frequency: 'Once daily', purpose: 'Iron-deficiency anemia', start: '2026-11-12', source: 'Clinic letter', group: 'Supportive' },
    { name: 'Lactulose', dose: '10 mL', route: 'Oral', frequency: 'Twice daily when needed', purpose: 'Keep stools soft (narrowed colon)', start: '2026-11-12', source: 'Clinic letter', group: 'Supportive' },
  ],

  labs: routineLabs(
    'Female',
    ['2026-10-27', '2026-11-10'],
    { albumin: 34, alp: 104, crp: 14.5 },
    {
      hb: [['2026-10-27', 10.1], ['2026-11-10', 10.3]],
      ferritin: [['2026-10-27', 11]],
      cea: [['2026-11-10', 9.6]],
      ca199: [['2026-11-10', 41]],
      hba1c: [['2026-10-27', 7.8]],
    },
  ),

  imaging: [
    { date: '2026-11-03', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Rectum to hepatic flexure (incomplete)', findings: 'Ring-shaped tumor at the hepatic flexure, about 50 mm long, around the whole wall, narrowing the lumen; the scope could not pass. Tattoo placed below the tumor. Rest of the colon seen up to that point: no polyps.', impression: 'Hepatic flexure tumor, biopsied. Colonoscopy incomplete.', visitId: 'visit-1' },
    { date: '2026-11-10', source: 'CT report', type: 'CT and CT colonography', region: 'Chest, abdomen, pelvis and colon', findings: 'Ring-shaped tumor of the hepatic flexure, 52 mm long, reaching the outer surface of the colon (no organ involved). Two 8 to 10 mm nodes next to it. No spread to the liver, lungs or lining of the abdomen. CT colonography: no other lesion in the cecum and ascending colon.', impression: 'cT4a N1 M0.' },
  ],

  history: {
    conditions: [
      { name: 'Type 2 diabetes', since: '2016', source: 'Family doctor record' },
      { name: 'High blood pressure', since: '2018', source: 'Family doctor record' },
    ],
    surgeries: [{ name: 'Removal of the womb (abdominal hysterectomy) for fibroids', date: '2011-02-08', source: 'Family doctor record' }],
    stays: [],
    ecog: { value: 1, date: '2026-11-12', source: 'Clinic note' },
    asa: { value: 'ASA II', date: '2026-11-03', source: 'Sedation assessment' },
  },

  family: [{ relative: 'Father', condition: 'Stomach cancer', ageAtDiagnosis: 74, date: '2026-11-03', source: 'Clinic note' }],
  familyNote: 'Mother: type 2 diabetes. Two brothers: well.',

  lifestyle: {
    smoking: { status: 'Former', packYears: 15, detail: 'Stopped in 2010', date: '2026-11-03', source: 'Clinic note' },
    alcohol: { text: 'None', date: '2026-11-03', source: 'Clinic note' },
    activity: { text: 'Less active in the last months because of tiredness', date: '2026-11-12', source: 'Clinic note' },
    diet: { text: 'Small meals; eats less because of pain after eating', date: '2026-11-12', source: 'Clinic note' },
    heightCm: { value: 160, date: '2026-11-03', source: 'Clinic note' },
    weights: [
      { date: '2026-08-04', kg: 74.0, source: 'Family doctor record' },
      { date: '2026-11-03', kg: 68.5, source: 'Sedation assessment' },
      { date: '2026-11-12', kg: 68.0, source: 'Clinic note' },
    ],
  },

  symptoms: {
    date: '2026-11-12',
    source: 'Clinic note',
    items: symptomList({
      'Bowel habit': ['Looser stools, 3 a day', '2026-08-15'],
      Pain: ['Cramping right-sided belly pain after meals', '2026-09-01'],
      'Weight loss': ['About 6 kg in 3 months', '2026-08-04'],
      Fatigue: ['Tired most days', '2026-08-01'],
    }),
  },
  vitals: { bloodPressure: '138/86', pulse: 88, temperature: 36.8, oxygen: 98, date: '2026-11-12', source: 'Clinic note' },
  exam: { text: 'Pale. Abdomen soft, slightly tender on the right; possible mass felt in the right upper abdomen.', date: '2026-11-12', source: 'Clinic note' },

  careTeam: [
    SURGEON,
    notInvolved('Medical oncologist'),
    GASTROENTEROLOGIST,
    PATHOLOGIST,
    NURSE,
    { role: 'Family doctor', name: 'Dr. Hana Shdeifat', clinic: 'Fuheis Family Health Centre' },
  ],
  appointments: [
    { date: '2026-11-26', what: 'MDT meeting (patient not present)', with: 'Colorectal MDT' },
    { date: '2026-12-01', what: 'Surgical clinic: treatment plan', with: 'Dr. Khaled Saleh, Colorectal Surgery Clinic' },
  ],
}
