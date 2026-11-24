// PT-1007 Ahmad Khalaf, 61, male. Polyps only, surveillance.
// Positive FIT (2025-11). Colonoscopy 2025-12-09: 35 mm flat raised lesion (laterally spreading)
// in the ascending colon, tattooed and referred. EMR (piecemeal) 2026-01-20: tubulovillous
// adenoma with high-grade dysplasia, no cancer. Site check 2026-07-21: scar clear.
// On clopidogrel (coronary stent 2020): held 7 days before the EMR on cardiology advice.
import type { PatientProfile } from '../../profileTypes'
import type { TreatmentStep, Visit } from '../../types'
import { CARDIOLOGIST, GASTROENTEROLOGIST, NURSE, PATHOLOGIST, notInvolved } from './careTeam'
import { polypOnlyBiomarkers, routineLabs, step, symptomList } from './helpers'

const GI = 'Dr. Hani Barakat, gastroenterologist'
const LESION = { kind: 'polyp', segment: 'ascending', size: { value: 35, unit: 'mm' }, source: 'manual', distanceFromAnalVergeCm: 118, locationBasis: 'measured', paris: '0-IIa', opticalDiagnosis: { nice: 2, kudo: 'IV' } } as const

export const VISITS_1007: Visit[] = [
  {
    id: 'visit-1',
    date: '2025-12-09',
    title: 'Colonoscopy: large flat polyp found',
    pictures: [],
    findings: [{ ...LESION, id: 'pt1007-v1-polyp', resection: { method: 'none', date: '2025-12-09' }, notes: 'Granular laterally spreading lesion. Tattoo placed 3 cm beyond it. Referred for EMR; not biopsied.' }],
  },
  {
    id: 'visit-2',
    date: '2026-01-20',
    title: 'Endoscopic mucosal resection (EMR)',
    pictures: [],
    findings: [{ ...LESION, id: 'pt1007-v2-polyp', histology: { result: 'Tubulovillous adenoma', dysplasia: 'high-grade', date: '2026-01-27' }, resection: { method: 'EMR', extent: 'piecemeal', complete: true, date: '2026-01-20' }, notes: 'Removed in 5 pieces. Edges treated. 3 clips placed.' }],
  },
  { id: 'visit-3', date: '2026-07-21', title: 'Site check colonoscopy', pictures: [], findings: [] },
]

export const STEPS_1007: TreatmentStep[] = [
  step('step-1', 'Diagnosis', 'imaging-tests', 'lab', 'FIT stool test: positive', 'done', '2025-11-18', [], { description: 'Faecal immunochemical test (FIT) from the family doctor.', performedBy: 'Dr. Omar Shboul, family doctor', place: 'Marka Family Health Centre', outcome: 'Positive: 142 ug Hb/g (range below 10)', profileSection: 'labs' }),
  step('step-2', 'Diagnosis', 'procedures', 'procedure', 'Colonoscopy', 'done', '2025-12-09', ['step-1'], { description: 'Colonoscopy after the positive FIT. 35 mm granular flat raised lesion in the ascending colon. Tattoo placed. Not removed: referred for EMR.', performedBy: GI, place: 'Endoscopy Unit', visitId: 'visit-1', findingIds: ['pt1007-v1-polyp'], profileSection: 'imaging' }),
  step('step-3', 'Removal', 'medicine', 'medicine', 'Clopidogrel held 7 days', 'done', '2026-01-13', ['step-2'], { endDate: '2026-01-20', description: 'Clopidogrel held for 7 days before the EMR, agreed with cardiology (stent placed in 2020).', performedBy: GI, regimen: { drugs: 'Clopidogrel', dose: '75 mg', route: 'Oral', schedule: 'Once daily (held)' }, profileSection: 'medications' }),
  step('step-4', 'Removal', 'procedures', 'procedure', 'EMR of the ascending polyp', 'done', '2026-01-20', ['step-3'], { description: 'Endoscopic mucosal resection of the 35 mm lesion, in 5 pieces. Edges treated, defect closed with 3 clips.', performedBy: GI, place: 'Endoscopy Unit', outcome: 'Complete removal seen at the end of the procedure. No bleeding or perforation.', visitId: 'visit-2', findingIds: ['pt1007-v2-polyp'], profileSection: 'imaging' }),
  step('step-5', 'Removal', 'medicine', 'medicine', 'Clopidogrel restarted', 'done', '2026-01-22', ['step-4'], { description: 'Clopidogrel restarted 2 days after the EMR.', performedBy: GI, regimen: { drugs: 'Clopidogrel', dose: '75 mg', route: 'Oral', schedule: 'Once daily' }, profileSection: 'medications' }),
  step('step-6', 'Removal', 'imaging-tests', 'lab', 'Pathology result', 'done', '2026-01-27', ['step-4'], { description: 'Pathology of the EMR pieces.', performedBy: 'Dr. Lina Odeh, pathologist', place: 'Pathology Department', outcome: 'Tubulovillous adenoma with high-grade dysplasia. No invasive cancer. Piecemeal: margins not assessable.', visitId: 'visit-2', findingIds: ['pt1007-v2-polyp'], profileSection: 'pathology' }),
  step('step-7', 'Surveillance', 'procedures', 'procedure', 'Site check colonoscopy', 'done', '2026-07-21', ['step-6'], { description: 'Check of the EMR scar 6 months after piecemeal removal. Scar biopsied.', performedBy: GI, place: 'Endoscopy Unit', outcome: 'Flat white scar, no polyp left. Scar biopsies: normal lining.', visitId: 'visit-3', profileSection: 'imaging' }),
  step('step-8', 'Surveillance', 'procedures', 'procedure', 'Surveillance colonoscopy', 'planned', '2027-07-01', ['step-7'], { monthOnly: true, description: 'Surveillance colonoscopy 1 year after the site check.', performedBy: GI, place: 'Endoscopy Unit', notes: 'Clopidogrel to be held before the procedure only if polyps need removing; agree with cardiology.' }),
]

export const PROFILE_1007: PatientProfile = {
  id: 'PT-1007',
  name: 'Ahmad Khalaf',
  age: 61,
  sex: 'Male',
  bloodGroup: 'B+',
  diagnosisSummary: 'Large flat ascending colon adenoma, removed by EMR (no cancer)',
  stage: 'No cancer',
  status: 'Surveillance',

  allergies: [],
  precautions: [{ text: 'Coronary stent (2020): any stop of clopidogrel must be agreed with cardiology', date: '2025-12-09', source: 'Clinic note' }],

  findingStatus: [
    { visitId: 'visit-1', kind: 'polyp', segment: 'ascending', status: 'Present', note: 'Tattooed, referred for EMR' },
    { visitId: 'visit-2', kind: 'polyp', segment: 'ascending', status: 'Removed', note: 'EMR, piecemeal (5 pieces)' },
  ],

  diagnosis: null,

  pathology: [
    { kind: 'polyp', label: 'Specimen A', date: '2026-01-27', source: 'Pathology report', procedure: 'Endoscopic mucosal resection, piecemeal (2026-01-20)', site: 'Ascending colon', size: '35 mm in total (5 pieces), flat raised (0-IIa), granular', histology: 'Tubulovillous adenoma', dysplasia: 'High-grade', completeness: 'Piecemeal: margins not assessable; complete removal seen at endoscopy', comment: 'No invasive cancer in any piece.' },
    { kind: 'polyp', label: 'Specimen B', date: '2026-07-28', source: 'Pathology report', procedure: 'Scar biopsies (site check colonoscopy, 2026-07-21)', site: 'Ascending colon, EMR scar', size: '3 small biopsies', histology: 'Normal colonic lining with healed scar', dysplasia: 'None', completeness: 'Not applicable (biopsy)', comment: 'No adenoma left.' },
  ],

  biomarkers: polypOnlyBiomarkers('No known family history of bowel cancer.'),

  medications: [
    { name: 'Clopidogrel', dose: '75 mg', route: 'Oral', frequency: 'Once daily', purpose: 'Antiplatelet after coronary stent', start: '2020-09-15', source: 'Cardiology letter', group: 'Blood thinners and antiplatelets', note: 'Held 2026-01-13 to 2026-01-20 for the EMR, restarted 2026-01-22.' },
    { name: 'Metformin', dose: '1,000 mg', route: 'Oral', frequency: 'Twice daily with meals', purpose: 'Type 2 diabetes', start: '2017-04-03', source: 'Family doctor medication list', group: 'Diabetes' },
    { name: 'Rosuvastatin', dose: '20 mg', route: 'Oral', frequency: 'Once daily', purpose: 'High cholesterol and heart protection', start: '2020-09-15', source: 'Cardiology letter', group: 'Heart and blood pressure' },
    { name: 'Bisoprolol', dose: '2.5 mg', route: 'Oral', frequency: 'Once daily', purpose: 'Heart protection after coronary stent', start: '2020-09-15', source: 'Cardiology letter', group: 'Heart and blood pressure' },
  ],

  labs: routineLabs(
    'Male',
    ['2025-12-02', '2026-01-13', '2026-07-14'],
    { egfr: 78, creat: 94 },
    {
      hba1c: [['2025-12-02', 7.2], ['2026-07-14', 6.9]],
      inr: [['2026-01-13', 1.0]],
      fit: [['2025-11-18', 142]],
    },
    { cea: 'Not required: no cancer' },
  ),

  imaging: [
    { date: '2025-12-09', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Whole colon to the cecum', findings: 'Adequate bowel preparation (Boston score 7). 35 mm granular laterally spreading lesion in the ascending colon (about 118 cm), raised and flat (0-IIa), Kudo IV pit pattern. Tattoo placed 3 cm beyond it. No other polyps.', impression: 'Large flat polyp, suitable for EMR. Not biopsied.', visitId: 'visit-1' },
    { date: '2026-01-20', source: 'Endoscopy report', type: 'Endoscopic mucosal resection', region: 'Ascending colon', findings: 'Lifted well with injection. Removed in 5 pieces with a snare. Edges treated. Defect closed with 3 clips.', impression: 'Complete endoscopic removal. No complication.', visitId: 'visit-2' },
    { date: '2026-07-21', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Whole colon to the cecum', findings: 'Flat white EMR scar in the ascending colon with clips gone. No polyp left on close look. 3 scar biopsies. No new polyps.', impression: 'Clear site check.', visitId: 'visit-3' },
  ],

  history: {
    conditions: [
      { name: 'Coronary artery disease', since: '2020', source: 'Cardiology letter', note: 'One stent (2020), no chest pain since' },
      { name: 'Type 2 diabetes', since: '2017', source: 'Family doctor record' },
      { name: 'High cholesterol', since: '2017', source: 'Family doctor record' },
    ],
    surgeries: [{ name: 'Coronary stent (one, right coronary artery)', date: '2020-09-14', source: 'Cardiology letter' }],
    stays: [{ from: '2020-09-12', to: '2020-09-16', reason: 'Heart attack (NSTEMI), stent placed', place: 'Cardiology ward', source: 'Discharge letter' }],
    ecog: { value: 0, date: '2026-07-21', source: 'Clinic note' },
    asa: { value: 'ASA III', date: '2026-01-20', source: 'Sedation assessment' },
  },

  family: [{ relative: 'Mother', condition: 'Type 2 diabetes', ageAtDiagnosis: 60, date: '2025-12-09', source: 'Clinic note' }],
  familyNote: 'Father: died at 78 (stroke).',

  lifestyle: {
    smoking: { status: 'Former', packYears: 25, detail: 'Stopped in 2020 after the heart attack', date: '2025-12-09', source: 'Clinic note' },
    alcohol: { text: 'None', date: '2025-12-09', source: 'Clinic note' },
    activity: { text: 'Cardiac rehab exercises, walks 40 minutes most days', date: '2026-07-21', source: 'Clinic note' },
    diet: { text: 'Diabetic diet', date: '2025-12-09', source: 'Clinic note' },
    heightCm: { value: 171, date: '2025-12-09', source: 'Clinic note' },
    weights: [
      { date: '2025-12-09', kg: 88.5, source: 'Clinic note' },
      { date: '2026-01-20', kg: 88.0, source: 'Sedation assessment' },
      { date: '2026-07-21', kg: 85.9, source: 'Clinic note' },
    ],
  },

  symptoms: { date: '2026-07-21', source: 'Clinic note', items: symptomList({}) },
  vitals: { bloodPressure: '128/78', pulse: 62, temperature: 36.5, oxygen: 98, date: '2026-07-21', source: 'Sedation assessment' },
  exam: { text: 'Well. Heart sounds normal. Abdomen soft and not tender.', date: '2026-07-21', source: 'Clinic note' },

  careTeam: [
    notInvolved('Colorectal surgeon'),
    notInvolved('Medical oncologist'),
    GASTROENTEROLOGIST,
    PATHOLOGIST,
    NURSE,
    CARDIOLOGIST,
    { role: 'Family doctor', name: 'Dr. Omar Shboul', clinic: 'Marka Family Health Centre' },
  ],
  appointments: [
    { date: '2026-12-15', what: 'Diabetes review (HbA1c)', with: 'Dr. Omar Shboul, Marka Family Health Centre' },
    { date: '2027-02-23', what: 'Heart review', with: 'Dr. Fadi Rashed, Cardiology Clinic' },
    { date: '2027-07-01', what: 'Surveillance colonoscopy (July 2027, date to be set)', with: 'Dr. Hani Barakat, Endoscopy Unit' },
  ],
}
