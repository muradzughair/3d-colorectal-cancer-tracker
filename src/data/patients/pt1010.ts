// PT-1010 Huda Mahmoud, 76, female. Transverse colon cancer, waiting for surgery.
// Iron-deficiency anemia. Colonoscopy 2026-10-20: transverse colon adenocarcinoma, tattooed.
// CT 2026-10-28: cT3 N0 M0 (stage IIA). IV iron 2026-11-04. MDT 2026-11-05: laparoscopic
// extended right hemicolectomy, booked for 2026-12-10. Chronic kidney disease stage 3a.
import type { PatientProfile } from '../../profileTypes'
import type { TreatmentStep, Visit } from '../../types'
import { GASTROENTEROLOGIST, NURSE, PATHOLOGIST, SURGEON, notInvolved } from './careTeam'
import { notNeeded, routineLabs, step, symptomList } from './helpers'

const GI = 'Dr. Hani Barakat, gastroenterologist'
const SURG = 'Dr. Khaled Saleh, colorectal surgeon'

export const VISITS_1010: Visit[] = [
  {
    id: 'visit-1',
    date: '2026-10-20',
    title: 'Colonoscopy with biopsy',
    pictures: [],
    findings: [{ id: 'pt1010-v1-tumor', kind: 'tumor', segment: 'transverse', size: { value: 3.8, unit: 'cm' }, source: 'manual', distanceFromAnalVergeCm: 92, locationBasis: 'estimated', morphology: 'polypoid-fungating', lengthMm: 38, circumferentialExtentPct: 50, lumen: 'narrowed', stage: { clinical: 'cT3 cN0 M0' }, histology: { result: 'Adenocarcinoma, G2 (biopsy)', date: '2026-10-23' }, resection: { method: 'biopsy', complete: false, date: '2026-10-20' }, notes: 'Tattoo placed on both sides of the tumor. Scope passed to the cecum.' }],
  },
  { id: 'visit-2', date: '2026-11-10', title: 'Surgical clinic: plan for surgery', pictures: [], findings: [] },
]

export const STEPS_1010: TreatmentStep[] = [
  step('step-1', 'Diagnosis and staging', 'procedures', 'procedure', 'Colonoscopy with biopsy', 'done', '2026-10-20', [], { description: 'Colonoscopy for iron-deficiency anemia. Raised transverse colon tumor, about 38 mm, narrowing the colon. Biopsied and tattooed.', performedBy: GI, place: 'Endoscopy Unit', outcome: 'Adenocarcinoma, G2', visitId: 'visit-1', findingIds: ['pt1010-v1-tumor'], profileSection: 'pathology' }),
  step('step-2', 'Diagnosis and staging', 'imaging-tests', 'imaging', 'CT chest, abdomen, pelvis', 'done', '2026-10-28', ['step-1'], { description: 'Staging CT, with reduced contrast dose for her kidney function.', place: 'Radiology Department', outcome: 'Transverse colon tumor into the fat around the colon. No enlarged nodes. Liver and lungs clear (cT3 N0 M0).', profileSection: 'imaging' }),
  step('step-3', 'Diagnosis and staging', 'imaging-tests', 'lab', 'CEA and MMR stains', 'done', '2026-10-28', ['step-1'], { description: 'CEA blood test; MMR stains on the biopsy.', place: 'Lab and Pathology Department', outcome: 'CEA 3.8 ug/L (normal). MMR stains: result awaited.', profileSection: 'biomarkers' }),
  step('step-4', 'Preparing for surgery', 'medicine', 'medicine', 'IV iron infusion', 'done', '2026-11-04', ['step-1'], { description: 'Iron given into a vein to correct the anemia before surgery.', performedBy: 'Nurse Maha Daoud, colorectal nurse specialist', place: 'Day Treatment Unit', regimen: { drugs: 'Ferric carboxymaltose', dose: '1,000 mg', route: 'IV', schedule: 'Once' }, outcome: 'Hemoglobin 9.4 to 10.9 g/dL by 2026-11-24.', profileSection: 'medications' }),
  step('step-5', 'Preparing for surgery', 'reviews', 'review', 'MDT meeting', 'done', '2026-11-05', ['step-2', 'step-3'], { description: 'Multidisciplinary team meeting: plan for laparoscopic extended right hemicolectomy.', place: 'MDT meeting room' }),
  step('step-6', 'Preparing for surgery', 'reviews', 'review', 'Surgical clinic', 'done', '2026-11-10', ['step-5'], { description: 'Surgery explained and consent taken. Fitness for surgery to be checked.', performedBy: SURG, place: 'Colorectal Surgery Clinic', visitId: 'visit-2' }),
  step('step-7', 'Preparing for surgery', 'reviews', 'review', 'Pre-operative assessment', 'planned', '2026-11-26', ['step-6'], { description: 'Anaesthetic and nursing assessment, blood tests, heart tracing (ECG).', place: 'Pre-operative Assessment Clinic' }),
  step('step-8', 'Surgery', 'procedures', 'procedure', 'Extended right hemicolectomy', 'planned', '2026-12-10', ['step-7'], { description: 'Laparoscopic extended right hemicolectomy.', performedBy: SURG, place: 'Main Theatres', notes: 'Ramipril to be held the day before and the day of surgery (kidney protection).' }),
  step('step-9', 'Surgery', 'reviews', 'review', 'Results clinic', 'planned', '2027-01-05', ['step-8'], { description: 'Pathology results and next steps.', performedBy: SURG, place: 'Colorectal Surgery Clinic' }),
]

export const PROFILE_1010: PatientProfile = {
  id: 'PT-1010',
  name: 'Huda Mahmoud',
  age: 76,
  sex: 'Female',
  bloodGroup: 'B-',
  diagnosisSummary: 'Transverse colon adenocarcinoma',
  stage: 'cIIA',
  status: 'Awaiting surgery',

  allergies: [{ substance: 'Codeine', type: 'Drug', reaction: 'Severe vomiting and confusion', severity: 'Moderate', date: '2026-10-20', source: 'Clinic note' }],
  precautions: [
    { text: 'Kidney function reduced (eGFR about 50): check doses and contrast', date: '2026-10-28', source: 'Clinic note' },
    { text: 'Uses a walking stick: falls risk on the ward', date: '2026-11-10', source: 'Clinic note' },
  ],

  findingStatus: [{ visitId: 'visit-1', kind: 'tumor', segment: 'transverse', status: 'Biopsied', note: 'Present; biopsy: adenocarcinoma. Tattooed' }],

  diagnosis: {
    date: '2026-10-23',
    source: 'Pathology report',
    site: 'Transverse colon',
    segment: 'transverse',
    distanceFromAnalVergeCm: null,
    sidedness: 'Right colon',
    histology: 'Adenocarcinoma (not otherwise specified)',
    grade: 'G2 (moderately differentiated)',
    clinicalStage: { tnm: 'cT3 cN0 M0', group: 'IIA', date: '2026-10-28', source: 'CT report' },
    pathologicStage: null,
    pathologicStageNote: 'Surgery booked for 2026-12-10',
    tumorSize: [{ text: 'About 38 mm at colonoscopy', date: '2026-10-20', source: 'Colonoscopy report' }],
    symptoms: 'Tiredness and breathlessness on stairs; iron-deficiency anemia (hemoglobin 9.4 g/dL). No visible bleeding.',
    synchronousLesions: 'None',
  },

  pathology: [
    { kind: 'cancer', label: 'Specimen A', date: '2026-10-23', source: 'Pathology report', procedure: 'Endoscopic biopsy (colonoscopy, 2026-10-20)', site: 'Transverse colon', histology: 'Adenocarcinoma (not otherwise specified)', grade: 'G2 (moderately differentiated)', depth: 'Invasive carcinoma; depth not assessable on biopsy', lymphovascular: 'Not identified in the biopsy', perineural: 'Not identified in the biopsy', budding: 'Not assessable on biopsy', emvi: 'Not assessable on biopsy', margins: { proximal: 'Not applicable (biopsy)', distal: 'Not applicable (biopsy)', radial: 'Not applicable (biopsy)' }, nodes: 'Not applicable (biopsy)', deposits: 'Not applicable (biopsy)', regression: 'Not applicable (before treatment)', ptnm: 'Not applicable (biopsy)', comment: 'Four biopsy fragments. MMR stains requested.' },
  ],

  biomarkers: {
    mmr: { state: 'pending', note: 'Stains on the biopsy requested on 2026-10-23' },
    msi: { state: 'not-done', note: 'MMR stains used instead' },
    kras: notNeeded('No spread of the cancer'),
    nras: notNeeded('No spread of the cancer'),
    braf: notNeeded('No spread of the cancer'),
    her2: notNeeded('No spread of the cancer'),
    ntrk: notNeeded('No spread of the cancer'),
    dpyd: { state: 'not-done', note: 'Only needed if chemotherapy is planned' },
    germline: { state: 'not-done' },
    familyRisk: 'Sister had breast cancer at 70. No known bowel cancer in the family.',
  },

  medications: [
    { name: 'Ramipril', dose: '5 mg', route: 'Oral', frequency: 'Once daily', purpose: 'High blood pressure and kidney protection', start: '2015-03-22', source: 'Family doctor medication list', group: 'Heart and blood pressure', note: 'To be held the day before and the day of surgery.' },
    { name: 'Alendronic acid', dose: '70 mg', route: 'Oral', frequency: 'Once a week (Monday), before breakfast', purpose: 'Thin bones (osteoporosis)', start: '2022-06-06', source: 'Family doctor medication list', group: 'Other' },
    { name: 'Calcium and vitamin D3', dose: '1,000 mg / 800 units', route: 'Oral', frequency: 'Once daily', purpose: 'Bone health', start: '2022-06-06', source: 'Family doctor medication list', group: 'Other' },
    { name: 'Paracetamol', dose: '1 g', route: 'Oral', frequency: 'Up to 3 times a day when needed', purpose: 'Knee pain', start: '2023-01-10', source: 'Family doctor medication list', group: 'Supportive' },
    { name: 'Ferric carboxymaltose', dose: '1,000 mg', route: 'IV', frequency: 'Once', purpose: 'Iron-deficiency anemia before surgery', start: '2026-11-04', source: 'Day Treatment Unit record', group: 'Supportive', stopped: { date: '2026-11-04', reason: 'Single dose given' } },
  ],

  labs: routineLabs(
    'Female',
    ['2026-10-14', '2026-11-04', '2026-11-24'],
    { creat: 96, egfr: 50, urea: 8.1, alp: 98 },
    {
      hb: [['2026-10-14', 9.4], ['2026-11-04', 9.6], ['2026-11-24', 10.9]],
      ferritin: [['2026-10-14', 6], ['2026-11-24', 310]],
      cea: [['2026-10-28', 3.8]],
      inr: [['2026-11-24', 1.0]],
    },
  ),

  imaging: [
    { date: '2026-10-20', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Whole colon to the cecum', findings: 'Raised tumor in the mid transverse colon, about 38 mm, half of the circumference, narrowing the lumen; scope passed. Tattoo placed on both sides. Some diverticula in the sigmoid colon. No other polyps.', impression: 'Transverse colon tumor, biopsied.', visitId: 'visit-1' },
    { date: '2026-10-28', source: 'CT report', type: 'CT', region: 'Chest, abdomen and pelvis', findings: 'Thickened transverse colon wall with fat stranding. No enlarged lymph nodes. Liver and lungs clear. Small kidneys, in keeping with chronic kidney disease.', impression: 'cT3 N0 M0.' },
  ],

  history: {
    conditions: [
      { name: 'Chronic kidney disease, stage 3a', since: '2019', source: 'Family doctor record' },
      { name: 'High blood pressure', since: '2010', source: 'Family doctor record' },
      { name: 'Thin bones (osteoporosis)', since: '2022', source: 'Bone density scan report' },
      { name: 'Knee osteoarthritis', since: '2018', source: 'Family doctor record' },
    ],
    surgeries: [{ name: 'Gallbladder removal (laparoscopic cholecystectomy)', date: '2009-04-14', source: 'Family doctor record' }],
    stays: [],
    ecog: { value: 1, date: '2026-11-10', source: 'Clinic note' },
    asa: { value: 'ASA III', date: '2026-11-10', source: 'Clinic note' },
  },

  family: [{ relative: 'Sister', condition: 'Breast cancer', ageAtDiagnosis: 70, date: '2026-11-10', source: 'Clinic note' }],
  familyNote: 'Parents: no cancer known.',

  lifestyle: {
    smoking: { status: 'Never', packYears: null, detail: 'Never smoked', date: '2026-10-20', source: 'Clinic note' },
    alcohol: { text: 'None', date: '2026-10-20', source: 'Clinic note' },
    activity: { text: 'Walks indoors with a stick; lives with her daughter', date: '2026-11-10', source: 'Clinic note' },
    diet: { text: 'Small meals, eats less in the last 2 months', date: '2026-11-10', source: 'Clinic note' },
    heightCm: { value: 156, date: '2026-10-20', source: 'Clinic note' },
    weights: [
      { date: '2026-07-15', kg: 66.0, source: 'Family doctor record' },
      { date: '2026-10-20', kg: 63.2, source: 'Clinic note' },
      { date: '2026-11-10', kg: 62.8, source: 'Clinic note' },
    ],
  },

  symptoms: {
    date: '2026-11-10',
    source: 'Clinic note',
    items: symptomList({ Fatigue: ['Tired, breathless on stairs; a little better since the iron', '2026-08-01'], 'Weight loss': ['About 3 kg in 4 months', '2026-07-15'], 'Bowel habit': ['Constipation, every 2 to 3 days', '2026-09-01'] }),
  },
  vitals: { bloodPressure: '142/84', pulse: 84, temperature: 36.5, oxygen: 96, date: '2026-11-10', source: 'Clinic note' },
  exam: { text: 'Pale. Abdomen soft, no mass felt, not tender. Both knees stiff.', date: '2026-11-10', source: 'Clinic note' },

  careTeam: [
    SURGEON,
    notInvolved('Medical oncologist'),
    GASTROENTEROLOGIST,
    PATHOLOGIST,
    NURSE,
    { role: 'Family doctor', name: 'Dr. Mona Saleh', clinic: 'Abu Nseir Family Health Centre' },
  ],
  appointments: [
    { date: '2026-11-26', what: 'Pre-operative assessment', with: 'Pre-operative Assessment Clinic' },
    { date: '2026-12-10', what: 'Surgery: laparoscopic extended right hemicolectomy', with: 'Dr. Khaled Saleh, Main Theatres' },
    { date: '2027-01-05', what: 'Results clinic', with: 'Dr. Khaled Saleh, Colorectal Surgery Clinic' },
  ],
}
