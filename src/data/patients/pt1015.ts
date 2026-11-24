// PT-1015 Walid Shami, 80, male. Descending colon cancer, surgery done, in follow-up.
// Partial blockage. Colonoscopy 2025-05-13: ring-shaped descending colon tumor, scope could not
// pass. CT: cT4a N0 M0. Open left hemicolectomy 2025-06-03: pT4a pN0 (0 of 15), stage IIB, R0,
// pMMR. Chemotherapy after surgery offered; the patient declined (2025-07-01). CT 2025-12 and
// 2026-06 and colonoscopy 2026-06-16: no recurrence. Next CT 2026-12-08.
import type { PatientProfile } from '../../profileTypes'
import type { TreatmentStep, Visit } from '../../types'
import { GASTROENTEROLOGIST, NURSE, ONCOLOGIST, PATHOLOGIST, SURGEON } from './careTeam'
import { notNeeded, routineLabs, step, symptomList } from './helpers'

const GI = 'Dr. Hani Barakat, gastroenterologist'
const SURG = 'Dr. Khaled Saleh, colorectal surgeon'
const ONC = 'Dr. Rania Farouk, medical oncologist'
const TUMOR = { kind: 'tumor', segment: 'descending', source: 'manual', distanceFromAnalVergeCm: 52, morphology: 'annular-stenosing', circumferentialExtentPct: 100 } as const

export const VISITS_1015: Visit[] = [
  {
    id: 'visit-1',
    date: '2025-05-13',
    title: 'Colonoscopy with biopsy (incomplete)',
    pictures: [],
    findings: [{ ...TUMOR, id: 'pt1015-v1-tumor', size: { value: 4.5, unit: 'cm' }, locationBasis: 'estimated', lengthMm: 45, lumen: 'nearly-blocked', stage: { clinical: 'cT4a cN0 M0' }, histology: { result: 'Adenocarcinoma, G2 (biopsy)', date: '2025-05-16' }, resection: { method: 'biopsy', complete: false, date: '2025-05-13' }, notes: 'Scope could not pass. Tattoo placed below the tumor.' }],
  },
  {
    id: 'visit-2',
    date: '2025-06-03',
    title: 'Surgery: open left hemicolectomy',
    pictures: [],
    findings: [{ ...TUMOR, id: 'pt1015-v2-tumor', size: { value: 4.8, unit: 'cm' }, locationBasis: 'surgery-confirmed', lengthMm: 48, lumen: 'nearly-blocked', stage: { clinical: 'cT4a cN0 M0', pathologic: 'pT4a pN0 (0 of 15) M0' }, histology: { result: 'Adenocarcinoma, G2, margins clear (R0)', date: '2025-06-10' }, resection: { method: 'surgery', extent: 'en-bloc', complete: true, date: '2025-06-03' } }],
  },
  { id: 'visit-3', date: '2026-06-16', title: 'Colonoscopy, 1 year after surgery', pictures: [], findings: [] },
]

export const STEPS_1015: TreatmentStep[] = [
  step('step-1', 'Diagnosis and staging', 'procedures', 'procedure', 'Colonoscopy with biopsy', 'done', '2025-05-13', [], { description: 'Colonoscopy for constipation, swollen belly and weight loss. Ring-shaped descending colon tumor nearly blocking the colon; the scope could not pass. Biopsied and tattooed.', performedBy: GI, place: 'Endoscopy Unit', outcome: 'Adenocarcinoma, G2', visitId: 'visit-1', findingIds: ['pt1015-v1-tumor'], profileSection: 'pathology' }),
  step('step-2', 'Diagnosis and staging', 'imaging-tests', 'imaging', 'CT and CT colonography', 'done', '2025-05-15', ['step-1'], { description: 'Staging CT with CT colonography of the colon beyond the tumor.', place: 'Radiology Department', outcome: 'Tumor reaching the outer surface of the colon (cT4a). No enlarged nodes. No spread to the liver or lungs. No other lesion in the colon.', profileSection: 'imaging' }),
  step('step-3', 'Diagnosis and staging', 'reviews', 'review', 'MDT meeting', 'done', '2025-05-22', ['step-2'], { description: 'Multidisciplinary team meeting: plan for left hemicolectomy soon, because of the partial blockage.', place: 'MDT meeting room' }),
  step('step-4', 'Surgery', 'procedures', 'procedure', 'Left hemicolectomy (open)', 'done', '2025-06-03', ['step-3'], { description: 'Open left hemicolectomy with joining of the bowel ends (no stoma).', performedBy: SURG, place: 'Main Theatres', outcome: 'Chest infection after surgery, treated with antibiotics. Home on day 9.', visitId: 'visit-2', findingIds: ['pt1015-v2-tumor'], profileSection: 'imaging' }),
  step('step-5', 'Surgery', 'imaging-tests', 'lab', 'Pathology result', 'done', '2025-06-10', ['step-4'], { description: 'Pathology of the resection, with MMR stains.', performedBy: 'Dr. Lina Odeh, pathologist', place: 'Pathology Department', outcome: 'pT4a pN0 (0 of 15), R0, pMMR. Stage IIB. Lymphovascular invasion present.', visitId: 'visit-2', findingIds: ['pt1015-v2-tumor'], profileSection: 'pathology' }),
  step('step-6', 'Surgery', 'reviews', 'review', 'Oncology clinic', 'done', '2025-07-01', ['step-5'], { description: 'Chemotherapy after surgery offered and explained. The patient declined, after discussion with his family. Decision recorded. Follow-up with CT and CEA agreed.', performedBy: ONC, place: 'Oncology Day Unit' }),
  step('step-7', 'Follow-up', 'imaging-tests', 'imaging', 'Follow-up CT', 'in-progress', '2025-12-09', ['step-6'], {
    description: 'CT chest, abdomen and pelvis every 6 months for 3 years, with CEA.',
    place: 'Radiology Department',
    cycles: [
      { n: 1, date: '2025-12-09', status: 'done', note: 'Clear' },
      { n: 2, date: '2026-06-09', status: 'done', note: 'Clear' },
      { n: 3, date: '2026-12-08', status: 'planned' },
    ],
    profileSection: 'imaging',
  }),
  step('step-8', 'Follow-up', 'procedures', 'procedure', 'Colonoscopy at 1 year', 'done', '2026-06-16', ['step-6'], { description: 'Colonoscopy 1 year after surgery (the colon above the tumor had been seen only on CT).', performedBy: GI, place: 'Endoscopy Unit', outcome: 'Healthy join at about 45 cm. No polyps.', visitId: 'visit-3', profileSection: 'imaging' }),
  step('step-9', 'Follow-up', 'reviews', 'review', 'Clinic review', 'planned', '2026-12-15', ['step-7'], { description: 'Results of the December CT and CEA.', performedBy: SURG, place: 'Colorectal Surgery Clinic' }),
]

export const PROFILE_1015: PatientProfile = {
  id: 'PT-1015',
  name: 'Walid Shami',
  age: 80,
  sex: 'Male',
  bloodGroup: 'A+',
  diagnosisSummary: 'Descending colon adenocarcinoma, resected',
  stage: 'pIIB',
  status: 'Post-treatment follow-up',

  allergies: [],
  precautions: [{ text: 'Hard of hearing (hearing aid, left ear): speak clearly, face him; his son joins visits', date: '2025-05-13', source: 'Clinic note' }],

  findingStatus: [
    { visitId: 'visit-1', kind: 'tumor', segment: 'descending', status: 'Biopsied', note: 'Present; biopsy: adenocarcinoma. Scope could not pass' },
    { visitId: 'visit-2', kind: 'tumor', segment: 'descending', status: 'Removed', note: 'Left hemicolectomy, R0' },
  ],

  diagnosis: {
    date: '2025-05-16',
    source: 'Pathology report',
    site: 'Descending colon',
    segment: 'descending',
    distanceFromAnalVergeCm: 52,
    sidedness: 'Left colon',
    histology: 'Adenocarcinoma (not otherwise specified)',
    grade: 'G2 (moderately differentiated)',
    clinicalStage: { tnm: 'cT4a cN0 M0', group: 'IIB', date: '2025-05-15', source: 'CT report' },
    pathologicStage: { tnm: 'pT4a pN0 (0 of 15) M0', group: 'IIB', date: '2025-06-10', source: 'Pathology report' },
    tumorSize: [
      { text: 'About 45 mm long at colonoscopy (whole circumference)', date: '2025-05-13', source: 'Colonoscopy report' },
      { text: '48 mm in the resection specimen', date: '2025-06-10', source: 'Pathology report' },
    ],
    symptoms: 'Constipation getting worse, swollen belly and 5 kg weight loss over 2 months.',
    synchronousLesions: 'None (colon beyond the tumor checked by CT colonography, then by colonoscopy in 2026)',
  },

  pathology: [
    { kind: 'cancer', label: 'Specimen A', date: '2025-05-16', source: 'Pathology report', procedure: 'Endoscopic biopsy (colonoscopy, 2025-05-13)', site: 'Descending colon', histology: 'Adenocarcinoma (not otherwise specified)', grade: 'G2 (moderately differentiated)', depth: 'Invasive carcinoma; depth not assessable on biopsy', lymphovascular: 'Not identified in the biopsy', perineural: 'Not identified in the biopsy', budding: 'Not assessable on biopsy', emvi: 'Not assessable on biopsy', margins: { proximal: 'Not applicable (biopsy)', distal: 'Not applicable (biopsy)', radial: 'Not applicable (biopsy)' }, nodes: 'Not applicable (biopsy)', deposits: 'Not applicable (biopsy)', regression: 'Not applicable (before treatment)', ptnm: 'Not applicable (biopsy)', comment: 'Four biopsy fragments.' },
    { kind: 'cancer', label: 'Specimen B', date: '2025-06-10', source: 'Pathology report', procedure: 'Open left hemicolectomy (2025-06-03)', site: 'Descending colon', histology: 'Adenocarcinoma (not otherwise specified)', grade: 'G2 (moderately differentiated)', depth: 'Through the whole wall to the outer surface of the colon (pT4a)', lymphovascular: 'Present', perineural: 'Not identified', budding: 'Intermediate (Bd2)', emvi: 'Not identified', margins: { proximal: 'Clear (70 mm)', distal: 'Clear (80 mm)', radial: 'Clear (8 mm, retroperitoneal)' }, nodes: '0 of 15 positive', deposits: 'Not identified', regression: 'Not applicable (no treatment before surgery)', ptnm: 'pT4a pN0', comment: 'Complete removal (R0). MMR stains done (see Biomarkers).' },
  ],

  biomarkers: {
    mmr: { state: 'done', stains: { mlh1: 'Intact', msh2: 'Intact', msh6: 'Intact', pms2: 'Intact' }, result: 'pMMR (MMR proficient)', date: '2025-06-10', source: 'Pathology report' },
    msi: { state: 'not-done', note: 'MMR stains used instead' },
    kras: notNeeded('No spread of the cancer'),
    nras: notNeeded('No spread of the cancer'),
    braf: notNeeded('No spread of the cancer'),
    her2: notNeeded('No spread of the cancer'),
    ntrk: notNeeded('No spread of the cancer'),
    dpyd: { state: 'not-done', note: 'Chemotherapy declined' },
    germline: { state: 'not-done' },
    familyRisk: 'No known family history of bowel cancer.',
  },

  medications: [
    { name: 'Tiotropium inhaler', dose: '18 micrograms', route: 'Inhaled', frequency: 'Once daily', purpose: 'COPD', start: '2016-11-08', source: 'Family doctor medication list', group: 'Other' },
    { name: 'Salbutamol inhaler', dose: '100 micrograms, 2 puffs', route: 'Inhaled', frequency: 'When needed', purpose: 'COPD (breathlessness)', start: '2014-03-19', source: 'Family doctor medication list', group: 'Other' },
    { name: 'Tamsulosin', dose: '400 micrograms', route: 'Oral', frequency: 'Once daily at night', purpose: 'Enlarged prostate', start: '2019-08-27', source: 'Family doctor medication list', group: 'Other' },
    { name: 'Macrogol (laxative)', dose: '1 sachet', route: 'Oral', frequency: 'Once daily when needed', purpose: 'Constipation', start: '2025-06-12', source: 'Discharge letter', group: 'Supportive' },
    { name: 'Amoxicillin with clavulanic acid', dose: '625 mg', route: 'Oral', frequency: 'Three times a day', purpose: 'Chest infection after surgery', start: '2025-06-07', source: 'Discharge letter', group: 'Other', stopped: { date: '2025-06-14', reason: '7-day course completed' } },
  ],

  labs: routineLabs(
    'Male',
    ['2025-05-13', '2025-05-30', '2025-12-09', '2026-06-09'],
    { egfr: 64, creat: 104, urea: 7.2, hb: 13.1 },
    {
      hb: [['2025-05-13', 12.0], ['2025-05-30', 11.8], ['2025-06-06', 10.6], ['2025-12-09', 12.9], ['2026-06-09', 13.2]],
      crp: [['2025-05-13', 9.2], ['2025-06-06', 118.0], ['2025-12-09', 3.1], ['2026-06-09', 2.6]],
      cea: [['2025-05-15', 6.1], ['2025-12-09', 2.8], ['2026-06-09', 3.0]],
    },
  ),

  imaging: [
    { date: '2025-05-13', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Rectum to descending colon (incomplete)', findings: 'Ring-shaped tumor in the descending colon at about 52 cm, around the whole wall, nearly blocking the lumen; the scope could not pass. Tattoo placed below it. Sigmoid colon and rectum: some diverticula, no polyps.', impression: 'Descending colon tumor, biopsied. Colonoscopy incomplete.', visitId: 'visit-1' },
    { date: '2025-05-15', source: 'CT report', type: 'CT and CT colonography', region: 'Chest, abdomen, pelvis and colon', findings: 'Ring-shaped descending colon tumor, 46 mm long, reaching the outer surface of the colon. Colon above it slightly widened (partial blockage). No enlarged nodes. Liver and lungs clear; emphysema in both lungs. No other lesion in the colon.', impression: 'cT4a N0 M0 with partial blockage.' },
    { date: '2025-06-03', source: 'Operation note', type: 'Surgery', region: 'Left colon', findings: 'Open left hemicolectomy. Tumor in the descending colon, stuck to nothing around it. No spread seen in the abdomen.', impression: 'Tumor removed.', visitId: 'visit-2' },
    { date: '2025-12-09', source: 'CT report', type: 'CT', region: 'Chest, abdomen and pelvis', findings: 'Changes after left hemicolectomy. No masses, no enlarged nodes. Liver clear. Emphysema unchanged.', impression: 'No sign of recurrence.' },
    { date: '2026-06-09', source: 'CT report', type: 'CT', region: 'Chest, abdomen and pelvis', findings: 'No change. No masses, no enlarged nodes. Liver and lungs clear apart from emphysema.', impression: 'No sign of recurrence.' },
    { date: '2026-06-16', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Whole colon to the cecum', findings: 'Healthy join at about 45 cm. Diverticula in the sigmoid colon. No polyps.', impression: 'No recurrence. No polyps.', visitId: 'visit-3' },
  ],

  history: {
    conditions: [
      { name: 'COPD (chronic lung disease)', since: '2014', source: 'Family doctor record', note: 'Breathless after one flight of stairs' },
      { name: 'Enlarged prostate (benign)', since: '2019', source: 'Family doctor record' },
      { name: 'Hard of hearing', since: '2018', source: 'Family doctor record' },
    ],
    surgeries: [
      { name: 'Open left hemicolectomy', date: '2025-06-03', source: 'Operation note' },
      { name: 'Cataract surgery (both eyes)', date: '2021-02-16', source: 'Family doctor record' },
    ],
    stays: [
      { from: '2025-06-03', to: '2025-06-12', reason: 'Left hemicolectomy; chest infection after surgery', place: 'Surgical ward', source: 'Discharge letter' },
      { from: '2023-01-08', to: '2023-01-13', reason: 'COPD flare-up', place: 'Medical ward', source: 'Discharge letter' },
    ],
    ecog: { value: 1, date: '2026-06-16', source: 'Clinic note' },
    asa: { value: 'ASA III', date: '2026-06-16', source: 'Sedation assessment' },
  },

  family: [],
  familyNote: 'No known cancer in the family.',

  lifestyle: {
    smoking: { status: 'Former', packYears: 40, detail: 'Stopped in 2014', date: '2025-05-13', source: 'Clinic note' },
    alcohol: { text: 'None', date: '2025-05-13', source: 'Clinic note' },
    activity: { text: 'Walks to the mosque nearby; slow on stairs', date: '2026-06-16', source: 'Clinic note' },
    diet: { text: 'Good appetite; eats with the family', date: '2026-06-16', source: 'Clinic note' },
    heightCm: { value: 168, date: '2025-05-13', source: 'Clinic note' },
    weights: [
      { date: '2025-05-13', kg: 66.0, source: 'Clinic note' },
      { date: '2025-06-12', kg: 62.5, source: 'Discharge letter' },
      { date: '2025-12-09', kg: 65.4, source: 'Clinic note' },
      { date: '2026-06-16', kg: 67.1, source: 'Clinic note' },
    ],
  },

  symptoms: {
    date: '2026-06-16',
    source: 'Clinic note',
    items: symptomList({ 'Bowel habit': ['Once a day; uses a laxative some days', '2025-06-12'], Breathlessness: ['After one flight of stairs (COPD), unchanged', '2014-03-19'] }),
  },
  vitals: { bloodPressure: '138/76', pulse: 82, temperature: 36.4, oxygen: 94, date: '2026-06-16', source: 'Clinic note' },
  exam: { text: 'Well for his age. Scar healed, no hernia. Abdomen soft and not tender. Some wheeze on both sides of the chest.', date: '2026-06-16', source: 'Clinic note' },

  careTeam: [
    SURGEON,
    ONCOLOGIST,
    GASTROENTEROLOGIST,
    PATHOLOGIST,
    NURSE,
    { role: 'Family doctor', name: 'Dr. Adel Masri', clinic: 'Salt Family Health Centre' },
  ],
  appointments: [
    { date: '2026-12-08', what: 'Follow-up CT and CEA', with: 'Radiology Department' },
    { date: '2026-12-15', what: 'Clinic review', with: 'Dr. Khaled Saleh, Colorectal Surgery Clinic' },
    { date: '2027-01-20', what: 'COPD review', with: 'Dr. Adel Masri, Salt Family Health Centre' },
  ],
}
