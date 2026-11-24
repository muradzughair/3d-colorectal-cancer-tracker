// PT-1013 Sami Qudah, 57, male. Early cancer inside a polyp (malignant polyp), removed by
// colonoscopy, no surgery needed. Screening colonoscopy 2026-04-07: 20 mm semi-stalked sigmoid
// polyp removed en bloc (pT1 adenocarcinoma, low-risk features, margin clear 2 mm) and a 5 mm
// descending colon adenoma. CT: no spread. MDT 2026-04-23: endoscopic follow-up.
// Site check 2026-07-14: clear.
import type { PatientProfile } from '../../profileTypes'
import type { TreatmentStep, Visit } from '../../types'
import { GASTROENTEROLOGIST, NURSE, PATHOLOGIST, SURGEON, notInvolved } from './careTeam'
import { notNeeded, routineLabs, step, symptomList } from './helpers'

const GI = 'Dr. Hani Barakat, gastroenterologist'

export const VISITS_1013: Visit[] = [
  {
    id: 'visit-1',
    date: '2026-04-07',
    title: 'Screening colonoscopy with polypectomy',
    pictures: [],
    findings: [
      { id: 'pt1013-v1-polyp-sig', kind: 'polyp', segment: 'sigmoid', size: { value: 20, unit: 'mm' }, source: 'manual', distanceFromAnalVergeCm: 25, locationBasis: 'measured', paris: '0-Isp', opticalDiagnosis: { nice: 2, kudo: 'Vi' }, histology: { result: 'Adenocarcinoma in a tubulovillous adenoma, pT1 (early cancer)', dysplasia: 'high-grade', date: '2026-04-14' }, resection: { method: 'snare', extent: 'en-bloc', complete: true, date: '2026-04-07' }, notes: 'Lifted with injection before removal. Tattoo placed next to the site.' },
      { id: 'pt1013-v1-polyp-des', kind: 'polyp', segment: 'descending', size: { value: 5, unit: 'mm' }, source: 'manual', distanceFromAnalVergeCm: 55, locationBasis: 'estimated', paris: '0-IIa', opticalDiagnosis: { nice: 2 }, histology: { result: 'Tubular adenoma', dysplasia: 'low-grade', date: '2026-04-14' }, resection: { method: 'snare', extent: 'en-bloc', complete: true, date: '2026-04-07' }, notes: 'Cold snare.' },
    ],
  },
  { id: 'visit-2', date: '2026-07-14', title: 'Site check colonoscopy', pictures: [], findings: [] },
]

export const STEPS_1013: TreatmentStep[] = [
  step('step-1', 'Diagnosis', 'procedures', 'procedure', 'Screening colonoscopy', 'done', '2026-04-07', [], { description: 'Screening colonoscopy. 20 mm semi-stalked sigmoid polyp lifted and removed whole with a snare; tattoo placed. 5 mm descending colon polyp removed with a cold snare.', performedBy: GI, place: 'Endoscopy Unit', outcome: 'Both polyps removed en bloc.', visitId: 'visit-1', findingIds: ['pt1013-v1-polyp-sig', 'pt1013-v1-polyp-des'], profileSection: 'imaging' }),
  step('step-2', 'Diagnosis', 'imaging-tests', 'lab', 'Pathology result', 'done', '2026-04-14', ['step-1'], { description: 'Pathology of both polyps.', performedBy: 'Dr. Lina Odeh, pathologist', place: 'Pathology Department', outcome: 'Sigmoid polyp: early cancer (pT1, 1.2 mm deep into the submucosa, G2, no lymphovascular invasion, budding low, margin clear 2 mm). Descending polyp: tubular adenoma.', visitId: 'visit-1', findingIds: ['pt1013-v1-polyp-sig', 'pt1013-v1-polyp-des'], profileSection: 'pathology' }),
  step('step-3', 'Diagnosis', 'imaging-tests', 'imaging', 'CT chest, abdomen, pelvis', 'done', '2026-04-21', ['step-2'], { description: 'Staging CT after the early cancer result.', place: 'Radiology Department', outcome: 'No enlarged nodes. No spread to the liver or lungs.', profileSection: 'imaging' }),
  step('step-4', 'Diagnosis', 'reviews', 'review', 'MDT meeting', 'done', '2026-04-23', ['step-3'], { description: 'Multidisciplinary team meeting: low-risk early cancer, completely removed. Surgery and endoscopic follow-up discussed with the patient; he chose endoscopic follow-up. Decision recorded.', place: 'MDT meeting room' }),
  step('step-5', 'Follow-up', 'procedures', 'procedure', 'Site check colonoscopy', 'done', '2026-07-14', ['step-4'], { description: 'Check of the polypectomy site 3 months after removal, with biopsies.', performedBy: GI, place: 'Endoscopy Unit', outcome: 'Flat scar next to the tattoo, no polyp left. Scar biopsies: no cancer, no adenoma.', visitId: 'visit-2', profileSection: 'imaging' }),
  step('step-6', 'Follow-up', 'imaging-tests', 'lab', 'CEA', 'done', '2026-10-13', ['step-4'], { description: 'CEA blood test, every 6 months.', place: 'Lab', outcome: '2.2 ug/L (normal)', cycles: [{ n: 1, date: '2026-04-21', status: 'done', note: '2.4' }, { n: 2, date: '2026-10-13', status: 'done', note: '2.2' }, { n: 3, date: '2027-04-13', status: 'planned' }], profileSection: 'labs' }),
  step('step-7', 'Follow-up', 'procedures', 'procedure', 'Colonoscopy at 1 year', 'planned', '2027-04-06', ['step-5'], { description: 'Colonoscopy 1 year after the removal.', performedBy: GI, place: 'Endoscopy Unit' }),
]

export const PROFILE_1013: PatientProfile = {
  id: 'PT-1013',
  name: 'Sami Qudah',
  age: 57,
  sex: 'Male',
  bloodGroup: 'O+',
  diagnosisSummary: 'Early cancer in a sigmoid polyp (pT1), removed by colonoscopy',
  stage: 'pT1 (I)',
  status: 'Surveillance',

  allergies: [],
  precautions: [],

  findingStatus: [
    { visitId: 'visit-1', kind: 'polyp', segment: 'sigmoid', status: 'Removed', note: 'Snare polypectomy, en bloc; early cancer (pT1)' },
    { visitId: 'visit-1', kind: 'polyp', segment: 'descending', status: 'Removed', note: 'Cold snare, en bloc' },
  ],

  diagnosis: {
    date: '2026-04-14',
    source: 'Pathology report',
    site: 'Sigmoid colon (in a polyp)',
    segment: 'sigmoid',
    distanceFromAnalVergeCm: 25,
    sidedness: 'Left colon',
    histology: 'Adenocarcinoma arising in a tubulovillous adenoma',
    grade: 'G2 (moderately differentiated)',
    clinicalStage: { tnm: 'pT1 cN0 M0', group: 'I', date: '2026-04-21', source: 'CT report' },
    pathologicStage: null,
    pathologicStageNote: 'Removed by colonoscopy only: lymph nodes not removed, so no full pathologic stage',
    tumorSize: [{ text: 'Polyp 20 mm; cancer 6 mm wide, 1.2 mm deep into the submucosa', date: '2026-04-14', source: 'Pathology report' }],
    symptoms: 'None (found at screening).',
    synchronousLesions: '5 mm tubular adenoma, descending colon (removed)',
  },

  pathology: [
    { kind: 'cancer', label: 'Specimen A', date: '2026-04-14', source: 'Pathology report', procedure: 'Snare polypectomy, en bloc (colonoscopy, 2026-04-07)', site: 'Sigmoid colon, 25 cm', histology: 'Adenocarcinoma arising in a tubulovillous adenoma', grade: 'G2 (moderately differentiated)', depth: 'Into the submucosa, 1.2 mm deep (pT1)', lymphovascular: 'Not identified', perineural: 'Not identified', budding: 'Low (Bd1)', emvi: 'Not applicable (polyp)', margins: { proximal: 'Not applicable (polyp)', distal: 'Not applicable (polyp)', radial: 'Deep margin clear (2 mm)' }, nodes: 'Not applicable (polypectomy)', deposits: 'Not applicable (polypectomy)', regression: 'Not applicable (no treatment before)', ptnm: 'pT1 (polypectomy)', comment: 'Removed in one piece. No high-risk features found.' },
    { kind: 'polyp', label: 'Specimen B', date: '2026-04-14', source: 'Pathology report', procedure: 'Cold snare polypectomy (colonoscopy, 2026-04-07)', site: 'Descending colon', size: '5 mm, slightly raised (0-IIa)', histology: 'Tubular adenoma', dysplasia: 'Low-grade', completeness: 'Completely removed', comment: 'No cancer seen.' },
  ],

  biomarkers: {
    mmr: { state: 'done', stains: { mlh1: 'Intact', msh2: 'Intact', msh6: 'Intact', pms2: 'Intact' }, result: 'pMMR (MMR proficient)', date: '2026-04-16', source: 'Pathology report' },
    msi: { state: 'not-done', note: 'MMR stains used instead' },
    kras: notNeeded('Early cancer, completely removed'),
    nras: notNeeded('Early cancer, completely removed'),
    braf: notNeeded('Early cancer, completely removed'),
    her2: notNeeded('Early cancer, completely removed'),
    ntrk: notNeeded('Early cancer, completely removed'),
    dpyd: notNeeded('No chemotherapy'),
    germline: { state: 'not-done' },
    familyRisk: 'No known family history of bowel cancer.',
  },

  medications: [
    { name: 'Tamsulosin', dose: '400 micrograms', route: 'Oral', frequency: 'Once daily at night', purpose: 'Enlarged prostate (weak urine flow)', start: '2023-03-15', source: 'Family doctor medication list', group: 'Other' },
    { name: 'Bowel preparation (macrogol solution)', dose: '2 litres', route: 'Oral', frequency: 'Once, split dose', purpose: 'Bowel preparation for colonoscopy', start: '2026-07-13', source: 'Endoscopy instructions', group: 'Other', stopped: { date: '2026-07-14', reason: 'Single use before colonoscopy' } },
  ],

  labs: routineLabs(
    'Male',
    ['2026-04-21', '2026-10-13'],
    {},
    { cea: [['2026-04-21', 2.4], ['2026-10-13', 2.2]] },
  ),

  imaging: [
    { date: '2026-04-07', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Whole colon to the cecum', findings: 'Good bowel preparation (Boston score 9). 20 mm semi-stalked polyp in the sigmoid colon at 25 cm with an area of irregular surface pattern; lifted well and removed whole with a snare; tattoo placed next to it. 5 mm flat raised polyp in the descending colon removed with a cold snare.', impression: 'Two polyps removed. Sigmoid polyp may contain early cancer: await pathology.', visitId: 'visit-1' },
    { date: '2026-04-21', source: 'CT report', type: 'CT', region: 'Chest, abdomen and pelvis', findings: 'No enlarged lymph nodes near the sigmoid colon. Liver and lungs clear. Prostate slightly enlarged.', impression: 'No spread.' },
    { date: '2026-07-14', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Whole colon to the cecum', findings: 'Flat white scar next to the tattoo at 25 cm. No polyp left on close look. Scar biopsied. No new polyps.', impression: 'Clear site check.', visitId: 'visit-2' },
  ],

  history: {
    conditions: [{ name: 'Enlarged prostate (benign)', since: '2023', source: 'Family doctor record' }],
    surgeries: [],
    stays: [],
    ecog: { value: 0, date: '2026-07-14', source: 'Clinic note' },
    asa: { value: 'ASA I', date: '2026-07-14', source: 'Sedation assessment' },
  },

  family: [{ relative: 'Mother', condition: 'High blood pressure', ageAtDiagnosis: 60, date: '2026-04-07', source: 'Clinic note' }],
  familyNote: 'No known cancer in the family.',

  lifestyle: {
    smoking: { status: 'Current', packYears: 30, detail: 'Smokes 15 a day; advised to stop', date: '2026-07-14', source: 'Clinic note' },
    alcohol: { text: 'None', date: '2026-04-07', source: 'Clinic note' },
    activity: { text: 'Shop owner, on his feet most of the day', date: '2026-04-07', source: 'Clinic note' },
    diet: { text: 'High in red meat, low in vegetables', date: '2026-04-07', source: 'Clinic note' },
    heightCm: { value: 174, date: '2026-04-07', source: 'Clinic note' },
    weights: [
      { date: '2026-04-07', kg: 92.0, source: 'Sedation assessment' },
      { date: '2026-07-14', kg: 91.3, source: 'Sedation assessment' },
    ],
  },

  symptoms: { date: '2026-07-14', source: 'Clinic note', items: symptomList({}) },
  vitals: { bloodPressure: '136/84', pulse: 74, temperature: 36.6, oxygen: 97, date: '2026-07-14', source: 'Sedation assessment' },
  exam: { text: 'Well. Abdomen soft and not tender.', date: '2026-07-14', source: 'Clinic note' },

  careTeam: [
    SURGEON,
    notInvolved('Medical oncologist'),
    GASTROENTEROLOGIST,
    PATHOLOGIST,
    NURSE,
    { role: 'Family doctor', name: 'Dr. Ola Hamdan', clinic: 'Madaba Family Health Centre' },
  ],
  appointments: [
    { date: '2027-04-06', what: 'Colonoscopy, 1 year after removal', with: 'Dr. Hani Barakat, Endoscopy Unit' },
    { date: '2027-04-13', what: 'CEA blood test', with: 'Lab' },
  ],
}
