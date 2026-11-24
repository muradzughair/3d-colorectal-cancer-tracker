// PT-1008 Mariam Saadeh, 44, female. Lynch syndrome, colon cancer treated with surgery only.
// Colonoscopy 2026-02-17: cecal cancer. CT: cT3 N0 M0. Laparoscopic right hemicolectomy
// 2026-03-17: pT3 pN0 (0 of 24), stage IIA, R0. MMR deficient (MLH1 and PMS2 lost), MSI-high,
// MLH1 promoter not methylated; germline test 2026-04-14: MLH1 pathogenic variant (Lynch
// syndrome). MDT: follow-up without chemotherapy. Yearly colonoscopy.
import type { PatientProfile } from '../../profileTypes'
import type { TreatmentStep, Visit } from '../../types'
import { GASTROENTEROLOGIST, NURSE, ONCOLOGIST, PATHOLOGIST, SURGEON } from './careTeam'
import { routineLabs, step, symptomList } from './helpers'

const GI = 'Dr. Hani Barakat, gastroenterologist'
const SURG = 'Dr. Khaled Saleh, colorectal surgeon'
const TUMOR = { kind: 'tumor', segment: 'cecum', source: 'manual', distanceFromAnalVergeCm: 140, morphology: 'ulcerated', circumferentialExtentPct: 50, lumen: 'open' } as const

export const VISITS_1008: Visit[] = [
  {
    id: 'visit-1',
    date: '2026-02-17',
    title: 'Colonoscopy with biopsy',
    pictures: [],
    findings: [{ ...TUMOR, id: 'pt1008-v1-tumor', size: { value: 4.0, unit: 'cm' }, locationBasis: 'estimated', lengthMm: 40, stage: { clinical: 'cT3 cN0 M0' }, histology: { result: 'Adenocarcinoma, G3 (biopsy)', date: '2026-02-20' }, resection: { method: 'biopsy', complete: false, date: '2026-02-17' } }],
  },
  {
    id: 'visit-2',
    date: '2026-03-17',
    title: 'Surgery: laparoscopic right hemicolectomy',
    pictures: [],
    findings: [{ ...TUMOR, id: 'pt1008-v2-tumor', size: { value: 4.3, unit: 'cm' }, locationBasis: 'surgery-confirmed', lengthMm: 43, stage: { clinical: 'cT3 cN0 M0', pathologic: 'pT3 pN0 (0 of 24) M0' }, histology: { result: 'Adenocarcinoma, G3, medullary features, margins clear (R0)', date: '2026-03-24' }, resection: { method: 'surgery', extent: 'en-bloc', complete: true, date: '2026-03-17' } }],
  },
  { id: 'visit-3', date: '2026-09-15', title: '6-month follow-up: CT and clinic', pictures: [], findings: [] },
]

export const STEPS_1008: TreatmentStep[] = [
  step('step-1', 'Diagnosis and staging', 'procedures', 'procedure', 'Colonoscopy with biopsy', 'done', '2026-02-17', [], { description: 'Colonoscopy for iron-deficiency anemia and right-sided abdominal pain. Ulcerated cecal tumor, about 40 mm, biopsied.', performedBy: GI, place: 'Endoscopy Unit', outcome: 'Adenocarcinoma, G3', visitId: 'visit-1', findingIds: ['pt1008-v1-tumor'], profileSection: 'pathology' }),
  step('step-2', 'Diagnosis and staging', 'imaging-tests', 'imaging', 'CT chest, abdomen, pelvis', 'done', '2026-02-24', ['step-1'], { description: 'Staging CT.', place: 'Radiology Department', outcome: 'Cecal tumor growing into the fat around the colon. No enlarged lymph nodes. No spread to the liver or lungs (cT3 N0 M0).', profileSection: 'imaging' }),
  step('step-3', 'Diagnosis and staging', 'reviews', 'review', 'MDT meeting', 'done', '2026-02-26', ['step-2'], { description: 'Multidisciplinary team meeting: plan for laparoscopic right hemicolectomy.', place: 'MDT meeting room' }),
  step('step-4', 'Treatment', 'procedures', 'procedure', 'Right hemicolectomy', 'done', '2026-03-17', ['step-3'], { description: 'Laparoscopic right hemicolectomy.', performedBy: SURG, place: 'Main Theatres', outcome: 'Uneventful. Home on day 4.', visitId: 'visit-2', findingIds: ['pt1008-v2-tumor'], profileSection: 'imaging' }),
  step('step-5', 'Treatment', 'imaging-tests', 'lab', 'Pathology and MMR stains', 'done', '2026-03-24', ['step-4'], { description: 'Pathology of the resection, with MMR stains.', performedBy: 'Dr. Lina Odeh, pathologist', place: 'Pathology Department', outcome: 'pT3 pN0 (0 of 24), R0. MLH1 and PMS2 lost (dMMR). MLH1 promoter not methylated.', visitId: 'visit-2', findingIds: ['pt1008-v2-tumor'], profileSection: 'pathology' }),
  step('step-6', 'Treatment', 'reviews', 'review', 'MDT meeting', 'done', '2026-03-26', ['step-5'], { description: 'Multidisciplinary team meeting after surgery. Decision recorded: follow-up without chemotherapy. Genetic testing for Lynch syndrome requested.', place: 'MDT meeting room' }),
  step('step-7', 'Treatment', 'imaging-tests', 'lab', 'Germline genetic test', 'done', '2026-04-14', ['step-6'], { description: 'Blood test for inherited mismatch repair gene changes, after genetic counselling.', performedBy: 'Dr. Dana Kurdi, clinical geneticist', place: 'Genetics Clinic', outcome: 'MLH1 pathogenic variant found: Lynch syndrome.', profileSection: 'biomarkers' }),
  step('step-8', 'Follow-up', 'imaging-tests', 'imaging', 'Follow-up CT', 'done', '2026-09-08', ['step-6'], { description: 'CT chest, abdomen and pelvis, 6 months after surgery.', place: 'Radiology Department', outcome: 'No sign of the cancer coming back.', profileSection: 'imaging' }),
  step('step-9', 'Follow-up', 'reviews', 'review', 'Clinic review', 'done', '2026-09-15', ['step-8'], { description: 'CT and CEA discussed. Well. Referred to gynecology to discuss Lynch syndrome risks.', performedBy: SURG, place: 'Colorectal Surgery Clinic', visitId: 'visit-3' }),
  step('step-10', 'Follow-up', 'reviews', 'review', 'Gynecology consultation', 'planned', '2026-12-02', ['step-9'], { description: 'Discussion of womb and ovary cancer risk in Lynch syndrome.', performedBy: 'Dr. Salma Jaber, gynecologist', place: 'Gynecology Clinic' }),
  step('step-11', 'Follow-up', 'procedures', 'procedure', 'Yearly colonoscopy', 'planned', '2027-03-16', ['step-9'], { description: 'Colonoscopy 1 year after surgery, then yearly or every 2 years (Lynch syndrome).', performedBy: GI, place: 'Endoscopy Unit' }),
]

export const PROFILE_1008: PatientProfile = {
  id: 'PT-1008',
  name: 'Mariam Saadeh',
  age: 44,
  sex: 'Female',
  bloodGroup: 'O-',
  diagnosisSummary: 'Cecal adenocarcinoma, resected (Lynch syndrome)',
  stage: 'pIIA',
  status: 'Post-treatment follow-up',

  allergies: [],
  precautions: [{ text: 'Lynch syndrome (MLH1): first-degree relatives offered genetic testing', date: '2026-04-14', source: 'Genetics letter' }],

  findingStatus: [
    { visitId: 'visit-1', kind: 'tumor', segment: 'cecum', status: 'Biopsied', note: 'Present; biopsy: adenocarcinoma' },
    { visitId: 'visit-2', kind: 'tumor', segment: 'cecum', status: 'Removed', note: 'Right hemicolectomy, R0' },
  ],

  diagnosis: {
    date: '2026-02-20',
    source: 'Pathology report',
    site: 'Cecum',
    segment: 'cecum',
    distanceFromAnalVergeCm: null,
    sidedness: 'Right colon',
    histology: 'Adenocarcinoma with medullary features',
    grade: 'G3 (poorly differentiated)',
    clinicalStage: { tnm: 'cT3 cN0 M0', group: 'IIA', date: '2026-02-24', source: 'CT report' },
    pathologicStage: { tnm: 'pT3 pN0 (0 of 24) M0', group: 'IIA', date: '2026-03-24', source: 'Pathology report' },
    tumorSize: [
      { text: 'About 40 mm at colonoscopy', date: '2026-02-17', source: 'Colonoscopy report' },
      { text: '43 mm in the resection specimen', date: '2026-03-24', source: 'Pathology report' },
    ],
    symptoms: 'Tiredness, iron-deficiency anemia (hemoglobin 10.2 g/dL) and dull right-sided abdominal pain for 3 months.',
    synchronousLesions: 'None',
  },

  pathology: [
    { kind: 'cancer', label: 'Specimen A', date: '2026-02-20', source: 'Pathology report', procedure: 'Endoscopic biopsy (colonoscopy, 2026-02-17)', site: 'Cecum', histology: 'Adenocarcinoma', grade: 'G3 (poorly differentiated)', depth: 'Invasive carcinoma; depth not assessable on biopsy', lymphovascular: 'Not identified in the biopsy', perineural: 'Not identified in the biopsy', budding: 'Not assessable on biopsy', emvi: 'Not assessable on biopsy', margins: { proximal: 'Not applicable (biopsy)', distal: 'Not applicable (biopsy)', radial: 'Not applicable (biopsy)' }, nodes: 'Not applicable (biopsy)', deposits: 'Not applicable (biopsy)', regression: 'Not applicable (before treatment)', ptnm: 'Not applicable (biopsy)', comment: 'Many lymphocytes within the tumor.' },
    { kind: 'cancer', label: 'Specimen B', date: '2026-03-24', source: 'Pathology report', procedure: 'Laparoscopic right hemicolectomy (2026-03-17)', site: 'Cecum', histology: 'Adenocarcinoma with medullary features', grade: 'G3 (poorly differentiated)', depth: 'Through the muscle layer into the fat around the colon (pT3)', lymphovascular: 'Not identified', perineural: 'Not identified', budding: 'Low (Bd1)', emvi: 'Not identified', margins: { proximal: 'Clear (95 mm, small bowel end)', distal: 'Clear (110 mm)', radial: 'Clear (18 mm, mesenteric)' }, nodes: '0 of 24 positive', deposits: 'Not identified', regression: 'Not applicable (no treatment before surgery)', ptnm: 'pT3 pN0', comment: 'Complete removal (R0). MMR stains done (see Biomarkers).' },
  ],

  biomarkers: {
    mmr: { state: 'done', stains: { mlh1: 'Lost', msh2: 'Intact', msh6: 'Intact', pms2: 'Lost' }, result: 'dMMR (MMR deficient)', date: '2026-03-24', source: 'Pathology report', note: 'MLH1 promoter methylation: not methylated' },
    msi: { state: 'done', result: 'MSI-high', date: '2026-03-31', source: 'Molecular lab report' },
    kras: { state: 'not-required', note: 'No spread of the cancer' },
    nras: { state: 'not-required', note: 'No spread of the cancer' },
    braf: { state: 'done', result: 'No BRAF V600E change', date: '2026-03-31', source: 'Molecular lab report', note: 'Done as part of the Lynch syndrome check' },
    her2: { state: 'not-required', note: 'No spread of the cancer' },
    ntrk: { state: 'not-required', note: 'No spread of the cancer' },
    dpyd: { state: 'not-required', note: 'No chemotherapy' },
    germline: { state: 'done', result: 'MLH1 pathogenic variant (Lynch syndrome)', date: '2026-04-14', source: 'Genetics report' },
    familyRisk: 'Mother had womb (endometrial) cancer at 48; maternal uncle had colorectal cancer at 45.',
  },

  medications: [
    { name: 'Vitamin D3 (colecalciferol)', dose: '1,000 units', route: 'Oral', frequency: 'Once daily', purpose: 'Low vitamin D', start: '2026-04-20', source: 'Clinic letter', group: 'Other' },
    { name: 'Ferrous sulfate', dose: '200 mg', route: 'Oral', frequency: 'Once daily', purpose: 'Iron-deficiency anemia', start: '2026-02-20', source: 'Clinic letter', group: 'Supportive', stopped: { date: '2026-06-20', reason: 'Iron levels back to normal' } },
    { name: 'Enoxaparin', dose: '40 mg', route: 'Subcutaneous injection', frequency: 'Once daily', purpose: 'Prevention of blood clots after surgery', start: '2026-03-18', source: 'Discharge letter', group: 'Blood thinners and antiplatelets', stopped: { date: '2026-04-14', reason: '28-day course completed' } },
  ],

  labs: routineLabs(
    'Female',
    ['2026-02-17', '2026-03-10', '2026-03-20', '2026-09-08'],
    {},
    {
      hb: [['2026-02-17', 10.2], ['2026-03-10', 10.9], ['2026-03-20', 10.4], ['2026-06-16', 12.6], ['2026-09-08', 13.1]],
      ferritin: [['2026-02-17', 7], ['2026-06-16', 48], ['2026-09-08', 56]],
      crp: [['2026-02-17', 6.4], ['2026-03-20', 38.0], ['2026-09-08', 1.5]],
      cea: [['2026-02-17', 2.1], ['2026-09-08', 1.6]],
    },
  ),

  imaging: [
    { date: '2026-02-17', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Whole colon to the cecum', findings: 'Ulcerated tumor in the cecum, about 40 mm, half of the circumference, the lumen open. Appendix opening not seen. No other polyps.', impression: 'Cecal tumor, biopsied.', visitId: 'visit-1' },
    { date: '2026-02-24', source: 'CT report', type: 'CT', region: 'Chest, abdomen and pelvis', findings: 'Thickened cecal wall with fat stranding. No enlarged lymph nodes. Liver and lungs clear.', impression: 'cT3 N0 M0.' },
    { date: '2026-03-17', source: 'Operation note', type: 'Surgery', region: 'Right colon', findings: 'Laparoscopic right hemicolectomy. Tumor in the cecum, no spread seen in the abdomen.', impression: 'Tumor removed.', visitId: 'visit-2' },
    { date: '2026-09-08', source: 'CT report', type: 'CT', region: 'Chest, abdomen and pelvis', findings: 'Changes after right hemicolectomy. No masses, no enlarged nodes. Liver and lungs clear.', impression: 'No sign of recurrence.', visitId: 'visit-3' },
  ],

  history: {
    conditions: [{ name: 'Lynch syndrome (MLH1)', since: '2026', source: 'Genetics report' }],
    surgeries: [
      { name: 'Laparoscopic right hemicolectomy', date: '2026-03-17', source: 'Operation note' },
      { name: 'Appendix removal (appendicectomy)', date: '1998-07-03', source: 'Patient report' },
    ],
    stays: [{ from: '2026-03-17', to: '2026-03-21', reason: 'Right hemicolectomy', place: 'Surgical ward', source: 'Discharge letter' }],
    ecog: { value: 0, date: '2026-09-15', source: 'Clinic note' },
    asa: { value: 'ASA I', date: '2026-03-17', source: 'Anaesthetic record' },
  },

  family: [
    { relative: 'Mother', condition: 'Womb (endometrial) cancer', ageAtDiagnosis: 48, date: '2026-02-17', source: 'Clinic note' },
    { relative: 'Maternal uncle', condition: 'Colorectal cancer', ageAtDiagnosis: 45, date: '2026-02-17', source: 'Clinic note' },
  ],
  familyNote: 'Brother (41) and sister (38) offered genetic testing.',

  lifestyle: {
    smoking: { status: 'Never', packYears: null, detail: 'Never smoked', date: '2026-02-17', source: 'Clinic note' },
    alcohol: { text: 'None', date: '2026-02-17', source: 'Clinic note' },
    activity: { text: 'Works as a teacher; walks daily', date: '2026-09-15', source: 'Clinic note' },
    diet: { text: 'Mixed diet', date: '2026-02-17', source: 'Clinic note' },
    heightCm: { value: 165, date: '2026-02-17', source: 'Clinic note' },
    weights: [
      { date: '2026-02-17', kg: 63.0, source: 'Clinic note' },
      { date: '2026-03-21', kg: 60.8, source: 'Discharge letter' },
      { date: '2026-09-15', kg: 63.4, source: 'Clinic note' },
    ],
  },

  symptoms: { date: '2026-09-15', source: 'Clinic note', items: symptomList({ 'Bowel habit': ['Slightly looser stools since surgery, 2 a day', '2026-03-17'] }) },
  vitals: { bloodPressure: '116/72', pulse: 70, temperature: 36.6, oxygen: 99, date: '2026-09-15', source: 'Clinic note' },
  exam: { text: 'Well. Laparoscopy scars healed. Abdomen soft and not tender.', date: '2026-09-15', source: 'Clinic note' },

  careTeam: [
    SURGEON,
    ONCOLOGIST,
    GASTROENTEROLOGIST,
    PATHOLOGIST,
    NURSE,
    { role: 'Clinical geneticist', name: 'Dr. Dana Kurdi', clinic: 'Genetics Clinic' },
    { role: 'Gynecologist', name: 'Dr. Salma Jaber', clinic: 'Gynecology Clinic' },
    { role: 'Family doctor', name: 'Dr. Ziad Malkawi', clinic: 'Tla\'a Al-Ali Family Health Centre' },
  ],
  appointments: [
    { date: '2026-12-02', what: 'Gynecology consultation (Lynch syndrome)', with: 'Dr. Salma Jaber, Gynecology Clinic' },
    { date: '2027-03-09', what: 'Follow-up CT and CEA', with: 'Radiology Department' },
    { date: '2027-03-16', what: 'Yearly colonoscopy', with: 'Dr. Hani Barakat, Endoscopy Unit' },
  ],
}
