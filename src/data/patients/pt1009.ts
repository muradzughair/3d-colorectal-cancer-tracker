// PT-1009 Ibrahim Nassar, 66, male. Sigmoid colon cancer, surgery done, chemotherapy now.
// Colonoscopy 2026-07-14: sigmoid adenocarcinoma. CT: cT3 N1 M0. Laparoscopic sigmoid
// colectomy 2026-08-25: pT2 pN1a (1 of 16) M0, stage IIIA, R0, pMMR. Adjuvant CAPOX for
// 3 months (4 cycles): cycles 1 to 3 given (2026-10-06, 10-27, 11-17), cycle 4 on 2026-12-08.
import type { PatientProfile } from '../../profileTypes'
import type { TreatmentStep, Visit } from '../../types'
import { GASTROENTEROLOGIST, NURSE, ONCOLOGIST, ONCOLOGY_NURSE, PATHOLOGIST, SURGEON } from './careTeam'
import { notNeeded, routineLabs, step, symptomList } from './helpers'

const GI = 'Dr. Hani Barakat, gastroenterologist'
const SURG = 'Dr. Khaled Saleh, colorectal surgeon'
const ONC = 'Dr. Rania Farouk, medical oncologist'
const TUMOR = { kind: 'tumor', segment: 'sigmoid', source: 'manual', morphology: 'polypoid-fungating', circumferentialExtentPct: 50, lumen: 'open' } as const

export const VISITS_1009: Visit[] = [
  {
    id: 'visit-1',
    date: '2026-07-14',
    title: 'Colonoscopy with biopsy',
    pictures: [],
    findings: [{ ...TUMOR, id: 'pt1009-v1-tumor', size: { value: 3.0, unit: 'cm' }, distanceFromAnalVergeCm: 28, locationBasis: 'measured', lengthMm: 30, stage: { clinical: 'cT3 cN1 M0' }, histology: { result: 'Adenocarcinoma, G2 (biopsy)', date: '2026-07-17' }, resection: { method: 'biopsy', complete: false, date: '2026-07-14' }, notes: 'Tattoo placed below the tumor.' }],
  },
  {
    id: 'visit-2',
    date: '2026-08-25',
    title: 'Surgery: laparoscopic sigmoid colectomy',
    pictures: [],
    findings: [{ ...TUMOR, id: 'pt1009-v2-tumor', size: { value: 2.8, unit: 'cm' }, distanceFromAnalVergeCm: 28, locationBasis: 'surgery-confirmed', lengthMm: 28, stage: { clinical: 'cT3 cN1 M0', pathologic: 'pT2 pN1a (1 of 16) M0' }, histology: { result: 'Adenocarcinoma, G2, margins clear (R0)', date: '2026-09-01' }, resection: { method: 'surgery', extent: 'en-bloc', complete: true, date: '2026-08-25' } }],
  },
  { id: 'visit-3', date: '2026-11-17', title: 'Chemotherapy cycle 3 review', pictures: [], findings: [] },
]

export const STEPS_1009: TreatmentStep[] = [
  step('step-1', 'Diagnosis and staging', 'procedures', 'procedure', 'Colonoscopy with biopsy', 'done', '2026-07-14', [], { description: 'Colonoscopy for rectal bleeding and looser stools. Raised sigmoid tumor at 28 cm, about 30 mm, biopsied and tattooed.', performedBy: GI, place: 'Endoscopy Unit', outcome: 'Adenocarcinoma, G2', visitId: 'visit-1', findingIds: ['pt1009-v1-tumor'], profileSection: 'pathology' }),
  step('step-2', 'Diagnosis and staging', 'imaging-tests', 'imaging', 'CT chest, abdomen, pelvis', 'done', '2026-07-21', ['step-1'], { description: 'Staging CT.', place: 'Radiology Department', outcome: 'Sigmoid tumor, one 9 mm lymph node next to it. No spread to the liver or lungs (cT3 N1 M0).', profileSection: 'imaging' }),
  step('step-3', 'Diagnosis and staging', 'imaging-tests', 'lab', 'CEA', 'done', '2026-07-21', ['step-1'], { description: 'CEA blood test at diagnosis.', place: 'Lab', outcome: '4.6 ug/L (range below 5.0)', profileSection: 'labs' }),
  step('step-4', 'Diagnosis and staging', 'reviews', 'review', 'MDT meeting', 'done', '2026-07-23', ['step-2', 'step-3'], { description: 'Multidisciplinary team meeting: plan for laparoscopic sigmoid colectomy.', place: 'MDT meeting room' }),
  step('step-5', 'Surgery', 'procedures', 'procedure', 'Sigmoid colectomy', 'done', '2026-08-25', ['step-4'], { description: 'Laparoscopic sigmoid colectomy with joining of the bowel ends (no stoma).', performedBy: SURG, place: 'Main Theatres', outcome: 'Uneventful. Home on day 5.', visitId: 'visit-2', findingIds: ['pt1009-v2-tumor'], profileSection: 'imaging' }),
  step('step-6', 'Surgery', 'imaging-tests', 'lab', 'Pathology result', 'done', '2026-09-01', ['step-5'], { description: 'Pathology of the resection, with MMR stains.', performedBy: 'Dr. Lina Odeh, pathologist', place: 'Pathology Department', outcome: 'pT2 pN1a (1 of 16), R0, pMMR. Stage IIIA.', visitId: 'visit-2', findingIds: ['pt1009-v2-tumor'], profileSection: 'pathology' }),
  step('step-7', 'Surgery', 'reviews', 'review', 'MDT meeting', 'done', '2026-09-03', ['step-6'], { description: 'Multidisciplinary team meeting after surgery. Decision recorded: chemotherapy after surgery (CAPOX, 3 months).', place: 'MDT meeting room' }),
  step('step-8', 'Chemotherapy', 'imaging-tests', 'lab', 'DPYD test', 'done', '2026-09-22', ['step-7'], { description: 'Blood test for DPYD gene changes before capecitabine.', place: 'Lab', outcome: 'Normal (no variant found)', profileSection: 'biomarkers' }),
  step('step-9', 'Chemotherapy', 'medicine', 'medicine', 'CAPOX chemotherapy', 'in-progress', '2026-10-06', ['step-8'], {
    endDate: '2026-12-29',
    description: 'Chemotherapy after surgery, 4 cycles of 21 days (3 months).',
    performedBy: ONC,
    place: 'Oncology Day Unit',
    regimen: { drugs: 'CAPOX: capecitabine and oxaliplatin', dose: 'Oxaliplatin 130 mg/m2 on day 1; capecitabine 1000 mg/m2 (2,000 mg) twice daily, days 1 to 14', route: 'IV (oxaliplatin) and oral (capecitabine)', schedule: 'Every 21 days' },
    cycles: [
      { n: 1, date: '2026-10-06', status: 'done', note: 'Full dose' },
      { n: 2, date: '2026-10-27', status: 'done', note: 'Full dose; mild nausea' },
      { n: 3, date: '2026-11-17', status: 'done', note: 'Full dose; cold-triggered tingling in the fingers' },
      { n: 4, date: '2026-12-08', status: 'planned' },
    ],
    sideEffects: [
      { name: 'Peripheral neuropathy', grade: 1 },
      { name: 'Nausea', grade: 1 },
    ],
    profileSection: 'medications',
  }),
  step('step-10', 'Chemotherapy', 'reviews', 'review', 'Cycle 3 review', 'done', '2026-11-17', ['step-9'], { description: 'Review before cycle 3: bloods fine, tingling grade 1. Cycle 3 given.', performedBy: ONC, place: 'Oncology Day Unit', visitId: 'visit-3' }),
  step('step-11', 'Follow-up', 'reviews', 'review', 'End of chemotherapy review', 'planned', '2027-01-12', ['step-9'], { description: 'Review after the last cycle.', performedBy: ONC, place: 'Oncology Day Unit' }),
  step('step-12', 'Follow-up', 'imaging-tests', 'imaging', 'Follow-up CT', 'planned', '2027-02-23', ['step-11'], { description: 'CT chest, abdomen and pelvis, 6 months after surgery.', place: 'Radiology Department' }),
  step('step-13', 'Follow-up', 'procedures', 'procedure', 'Colonoscopy at 1 year', 'planned', '2027-08-24', ['step-11'], { description: 'Colonoscopy 1 year after surgery.', performedBy: GI, place: 'Endoscopy Unit' }),
]

export const PROFILE_1009: PatientProfile = {
  id: 'PT-1009',
  name: 'Ibrahim Nassar',
  age: 66,
  sex: 'Male',
  bloodGroup: 'A-',
  diagnosisSummary: 'Sigmoid adenocarcinoma, resected, on chemotherapy',
  stage: 'pIIIA',
  status: 'Under treatment',

  allergies: [],
  precautions: [{ text: 'On oxaliplatin: avoid cold drinks and cold air on the days after each cycle', date: '2026-10-06', source: 'Oncology letter' }],

  findingStatus: [
    { visitId: 'visit-1', kind: 'tumor', segment: 'sigmoid', status: 'Biopsied', note: 'Present; biopsy: adenocarcinoma' },
    { visitId: 'visit-2', kind: 'tumor', segment: 'sigmoid', status: 'Removed', note: 'Sigmoid colectomy, R0' },
  ],

  diagnosis: {
    date: '2026-07-17',
    source: 'Pathology report',
    site: 'Sigmoid colon',
    segment: 'sigmoid',
    distanceFromAnalVergeCm: 28,
    sidedness: 'Left colon',
    histology: 'Adenocarcinoma (not otherwise specified)',
    grade: 'G2 (moderately differentiated)',
    clinicalStage: { tnm: 'cT3 cN1 M0', group: 'IIIB', date: '2026-07-21', source: 'CT report' },
    pathologicStage: { tnm: 'pT2 pN1a (1 of 16) M0', group: 'IIIA', date: '2026-09-01', source: 'Pathology report' },
    tumorSize: [
      { text: 'About 30 mm at colonoscopy', date: '2026-07-14', source: 'Colonoscopy report' },
      { text: '28 mm in the resection specimen', date: '2026-09-01', source: 'Pathology report' },
    ],
    symptoms: 'Dark red blood mixed with stools and looser stools for 2 months.',
    synchronousLesions: 'None',
  },

  pathology: [
    { kind: 'cancer', label: 'Specimen A', date: '2026-07-17', source: 'Pathology report', procedure: 'Endoscopic biopsy (colonoscopy, 2026-07-14)', site: 'Sigmoid colon, 28 cm', histology: 'Adenocarcinoma (not otherwise specified)', grade: 'G2 (moderately differentiated)', depth: 'Invasive carcinoma; depth not assessable on biopsy', lymphovascular: 'Not identified in the biopsy', perineural: 'Not identified in the biopsy', budding: 'Not assessable on biopsy', emvi: 'Not assessable on biopsy', margins: { proximal: 'Not applicable (biopsy)', distal: 'Not applicable (biopsy)', radial: 'Not applicable (biopsy)' }, nodes: 'Not applicable (biopsy)', deposits: 'Not applicable (biopsy)', regression: 'Not applicable (before treatment)', ptnm: 'Not applicable (biopsy)', comment: 'Three biopsy fragments.' },
    { kind: 'cancer', label: 'Specimen B', date: '2026-09-01', source: 'Pathology report', procedure: 'Laparoscopic sigmoid colectomy (2026-08-25)', site: 'Sigmoid colon', histology: 'Adenocarcinoma (not otherwise specified)', grade: 'G2 (moderately differentiated)', depth: 'Into the muscle layer, not through it (pT2)', lymphovascular: 'Present', perineural: 'Not identified', budding: 'Low (Bd1)', emvi: 'Not identified', margins: { proximal: 'Clear (85 mm)', distal: 'Clear (60 mm)', radial: 'Clear (12 mm, mesenteric)' }, nodes: '1 of 16 positive', deposits: 'Not identified', regression: 'Not applicable (no treatment before surgery)', ptnm: 'pT2 pN1a', comment: 'Complete removal (R0). MMR stains done (see Biomarkers).' },
  ],

  biomarkers: {
    mmr: { state: 'done', stains: { mlh1: 'Intact', msh2: 'Intact', msh6: 'Intact', pms2: 'Intact' }, result: 'pMMR (MMR proficient)', date: '2026-09-01', source: 'Pathology report' },
    msi: { state: 'not-done', note: 'MMR stains used instead' },
    kras: notNeeded('No spread of the cancer'),
    nras: notNeeded('No spread of the cancer'),
    braf: notNeeded('No spread of the cancer'),
    her2: notNeeded('No spread of the cancer'),
    ntrk: notNeeded('No spread of the cancer'),
    dpyd: { state: 'done', result: 'Normal (no variant found)', date: '2026-09-22', source: 'Lab' },
    germline: { state: 'not-done' },
    familyRisk: 'No known family history of bowel cancer.',
  },

  medications: [
    { name: 'Capecitabine (CAPOX)', dose: '1000 mg/m2 (2,000 mg)', route: 'Oral', frequency: 'Twice daily, days 1 to 14 of each 21-day cycle', purpose: 'Chemotherapy after surgery', start: '2026-10-06', source: 'Oncology prescription', group: 'Cancer treatment' },
    { name: 'Oxaliplatin (CAPOX)', dose: '130 mg/m2', route: 'IV', frequency: 'Day 1 of each 21-day cycle', purpose: 'Chemotherapy after surgery', start: '2026-10-06', source: 'Oncology prescription', group: 'Cancer treatment' },
    { name: 'Ondansetron', dose: '8 mg', route: 'Oral', frequency: 'Twice daily for 3 days after each oxaliplatin dose', purpose: 'Prevent nausea from chemotherapy', start: '2026-10-06', source: 'Oncology prescription', group: 'Supportive' },
    { name: 'Urea 10% cream', dose: 'Thin layer', route: 'On the skin (hands and feet)', frequency: 'Twice daily', purpose: 'Prevent hand-foot skin reaction from capecitabine', start: '2026-10-06', source: 'Oncology prescription', group: 'Supportive' },
    { name: 'Amlodipine', dose: '5 mg', route: 'Oral', frequency: 'Once daily', purpose: 'High blood pressure', start: '2018-02-14', source: 'Family doctor medication list', group: 'Heart and blood pressure' },
    { name: 'Allopurinol', dose: '100 mg', route: 'Oral', frequency: 'Once daily', purpose: 'Gout prevention', start: '2021-05-30', source: 'Family doctor medication list', group: 'Other' },
    { name: 'Enoxaparin', dose: '40 mg', route: 'Subcutaneous injection', frequency: 'Once daily', purpose: 'Prevention of blood clots after surgery', start: '2026-08-26', source: 'Discharge letter', group: 'Blood thinners and antiplatelets', stopped: { date: '2026-09-22', reason: '28-day course completed' } },
  ],

  labs: routineLabs(
    'Male',
    ['2026-07-14', '2026-08-18', '2026-10-05', '2026-10-26', '2026-11-16'],
    { egfr: 79, creat: 92 },
    {
      hb: [['2026-07-14', 13.1], ['2026-08-18', 13.0], ['2026-08-27', 11.9], ['2026-10-05', 12.8], ['2026-10-26', 12.5], ['2026-11-16', 12.2]],
      plt: [['2026-07-14', 268], ['2026-08-18', 255], ['2026-10-05', 241], ['2026-10-26', 176], ['2026-11-16', 142]],
      neut: [['2026-07-14', 4.6], ['2026-08-18', 4.4], ['2026-10-05', 4.0], ['2026-10-26', 2.6], ['2026-11-16', 2.1]],
      cea: [['2026-07-21', 4.6], ['2026-10-05', 2.3]],
      crp: [['2026-07-14', 3.1], ['2026-08-27', 62.0], ['2026-10-05', 2.4]],
    },
  ),

  imaging: [
    { date: '2026-07-14', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Whole colon to the cecum', findings: 'Raised tumor in the sigmoid colon at 28 cm, about 30 mm, half of the circumference. Scope passed. No other polyps.', impression: 'Sigmoid tumor, biopsied and tattooed.', visitId: 'visit-1' },
    { date: '2026-07-21', source: 'CT report', type: 'CT', region: 'Chest, abdomen and pelvis', findings: 'Sigmoid wall thickening with fat stranding. One 9 mm node in the sigmoid mesentery. Liver and lungs clear.', impression: 'cT3 N1 M0.' },
    { date: '2026-08-25', source: 'Operation note', type: 'Surgery', region: 'Sigmoid colon', findings: 'Laparoscopic sigmoid colectomy. Tattoo and tumor seen. No spread in the abdomen. Bowel ends joined.', impression: 'Tumor removed.', visitId: 'visit-2' },
  ],

  history: {
    conditions: [
      { name: 'High blood pressure', since: '2018', source: 'Family doctor record' },
      { name: 'Gout', since: '2021', source: 'Family doctor record', note: 'No attacks for 3 years' },
    ],
    surgeries: [{ name: 'Laparoscopic sigmoid colectomy', date: '2026-08-25', source: 'Operation note' }],
    stays: [{ from: '2026-08-25', to: '2026-08-30', reason: 'Sigmoid colectomy', place: 'Surgical ward', source: 'Discharge letter' }],
    ecog: { value: 1, date: '2026-11-17', source: 'Oncology clinic note' },
    asa: { value: 'ASA II', date: '2026-08-25', source: 'Anaesthetic record' },
  },

  family: [],
  familyNote: 'No known cancer in the family.',

  lifestyle: {
    smoking: { status: 'Current', packYears: 35, detail: 'Smokes 10 a day; referred to the stop-smoking clinic', date: '2026-11-17', source: 'Oncology clinic note' },
    alcohol: { text: 'None', date: '2026-07-14', source: 'Clinic note' },
    activity: { text: 'Retired; short walks', date: '2026-11-17', source: 'Oncology clinic note' },
    diet: { text: 'Mixed diet; smaller meals during chemotherapy', date: '2026-11-17', source: 'Oncology clinic note' },
    heightCm: { value: 178, date: '2026-07-14', source: 'Clinic note' },
    weights: [
      { date: '2026-07-14', kg: 86.0, source: 'Clinic note' },
      { date: '2026-08-30', kg: 82.4, source: 'Discharge letter' },
      { date: '2026-10-05', kg: 83.1, source: 'Oncology clinic note' },
      { date: '2026-11-16', kg: 81.9, source: 'Oncology clinic note' },
    ],
  },

  symptoms: {
    date: '2026-11-17',
    source: 'Oncology clinic note',
    items: symptomList({ Fatigue: ['Tired for a few days after each cycle', '2026-10-06'], Nausea: ['Mild, first 2 days after each cycle', '2026-10-06'], Tingling: ['Fingers, with cold, settles within a week', '2026-10-28'] }),
  },
  vitals: { bloodPressure: '132/80', pulse: 76, temperature: 36.7, oxygen: 97, date: '2026-11-17', source: 'Oncology Day Unit' },
  exam: { text: 'Well. Scars healed. Abdomen soft and not tender. No hand-foot skin changes.', date: '2026-11-17', source: 'Oncology clinic note' },

  careTeam: [
    SURGEON,
    ONCOLOGIST,
    GASTROENTEROLOGIST,
    PATHOLOGIST,
    NURSE,
    ONCOLOGY_NURSE,
    { role: 'Family doctor', name: 'Dr. Nabil Haddad', clinic: 'Zarqa Family Health Centre' },
  ],
  appointments: [
    { date: '2026-12-07', what: 'Blood tests before cycle 4', with: 'Lab, Oncology Day Unit' },
    { date: '2026-12-08', what: 'CAPOX cycle 4', with: 'Dr. Rania Farouk, Oncology Day Unit' },
    { date: '2027-01-12', what: 'End of chemotherapy review', with: 'Dr. Rania Farouk, Oncology Day Unit' },
    { date: '2027-02-23', what: 'Follow-up CT', with: 'Radiology Department' },
    { date: '2027-08-24', what: 'Colonoscopy, 1 year after surgery', with: 'Dr. Hani Barakat, Endoscopy Unit' },
  ],
}
