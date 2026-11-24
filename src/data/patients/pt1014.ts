// PT-1014 Noor Bataineh, 36, female. Polyp only, surveillance.
// Bright red rectal bleeding and iron-deficiency anemia. Colonoscopy 2026-09-08: grade II
// internal hemorrhoids (the cause of the bleeding) and a 15 mm flat sessile serrated lesion in
// the cecum, removed by cold EMR in pieces (no dysplasia). Site check booked for March 2027.
import type { PatientProfile } from '../../profileTypes'
import type { TreatmentStep, Visit } from '../../types'
import { GASTROENTEROLOGIST, NURSE, PATHOLOGIST, notInvolved } from './careTeam'
import { polypOnlyBiomarkers, routineLabs, step, symptomList } from './helpers'

const GI = 'Dr. Hani Barakat, gastroenterologist'

export const VISITS_1014: Visit[] = [
  { id: 'visit-1', date: '2026-08-25', title: 'Gastroenterology clinic: rectal bleeding', pictures: [], findings: [] },
  {
    id: 'visit-2',
    date: '2026-09-08',
    title: 'Colonoscopy with cold EMR',
    pictures: [],
    findings: [{ id: 'pt1014-v2-polyp', kind: 'polyp', segment: 'cecum', size: { value: 15, unit: 'mm' }, source: 'manual', distanceFromAnalVergeCm: 142, locationBasis: 'estimated', paris: '0-IIa', opticalDiagnosis: { nice: 1 }, histology: { result: 'Sessile serrated lesion', date: '2026-09-15' }, resection: { method: 'EMR', extent: 'piecemeal', complete: true, date: '2026-09-08' }, notes: 'Pale, flat, with a mucus cap, next to the appendix opening. Cold EMR in 3 pieces.' }],
  },
  { id: 'visit-3', date: '2026-11-10', title: 'Follow-up clinic', pictures: [], findings: [] },
]

export const STEPS_1014: TreatmentStep[] = [
  step('step-1', 'Diagnosis', 'reviews', 'review', 'Gastroenterology clinic', 'done', '2026-08-25', [], { description: 'Bright red blood on the paper and in the toilet for 4 months, and tiredness. Iron-deficiency anemia. Colonoscopy booked.', performedBy: GI, place: 'Endoscopy Unit clinic', visitId: 'visit-1' }),
  step('step-2', 'Diagnosis', 'medicine', 'medicine', 'Oral iron', 'in-progress', '2026-08-25', ['step-1'], { description: 'Iron tablets for 3 months, then recheck blood count and ferritin.', performedBy: GI, regimen: { drugs: 'Ferrous fumarate', dose: '210 mg', route: 'Oral', schedule: 'Once daily' }, profileSection: 'medications' }),
  step('step-3', 'Diagnosis', 'procedures', 'procedure', 'Colonoscopy, cold EMR', 'done', '2026-09-08', ['step-1'], { description: 'Colonoscopy to the end of the small bowel. 15 mm flat serrated lesion in the cecum removed by cold EMR in 3 pieces. Grade II internal hemorrhoids.', performedBy: GI, place: 'Endoscopy Unit', outcome: 'Complete removal seen. No bleeding.', visitId: 'visit-2', findingIds: ['pt1014-v2-polyp'], profileSection: 'imaging' }),
  step('step-4', 'Diagnosis', 'imaging-tests', 'lab', 'Pathology result', 'done', '2026-09-15', ['step-3'], { description: 'Pathology of the cecal lesion.', performedBy: 'Dr. Lina Odeh, pathologist', place: 'Pathology Department', outcome: 'Sessile serrated lesion without dysplasia.', visitId: 'visit-2', findingIds: ['pt1014-v2-polyp'], profileSection: 'pathology' }),
  step('step-5', 'Follow-up', 'reviews', 'review', 'Clinic review', 'done', '2026-11-10', ['step-4'], { description: 'Results discussed. Bleeding much less with fibre and stool softener. Hemoglobin rising.', performedBy: GI, place: 'Endoscopy Unit clinic', visitId: 'visit-3' }),
  step('step-6', 'Follow-up', 'procedures', 'procedure', 'Site check colonoscopy', 'planned', '2027-03-09', ['step-5'], { description: 'Check of the cecal EMR site, 6 months after removal in pieces.', performedBy: GI, place: 'Endoscopy Unit' }),
]

export const PROFILE_1014: PatientProfile = {
  id: 'PT-1014',
  name: 'Noor Bataineh',
  age: 36,
  sex: 'Female',
  bloodGroup: 'B+',
  diagnosisSummary: 'Sessile serrated lesion, removed (no cancer); hemorrhoids',
  stage: 'No cancer',
  status: 'Surveillance',

  allergies: [{ substance: 'Ibuprofen', type: 'Drug', reaction: 'Wheeze', severity: 'Moderate', date: '2026-08-25', source: 'Clinic note' }],
  precautions: [{ text: 'Asthma: avoid ibuprofen and other NSAIDs', date: '2026-08-25', source: 'Clinic note' }],

  findingStatus: [{ visitId: 'visit-2', kind: 'polyp', segment: 'cecum', status: 'Removed', note: 'Cold EMR, piecemeal (3 pieces)' }],

  diagnosis: null,

  pathology: [
    { kind: 'polyp', label: 'Specimen A', date: '2026-09-15', source: 'Pathology report', procedure: 'Cold EMR, piecemeal (colonoscopy, 2026-09-08)', site: 'Cecum', size: '15 mm in total (3 pieces), flat raised (0-IIa)', histology: 'Sessile serrated lesion', dysplasia: 'None', completeness: 'Piecemeal: margins not assessable; complete removal seen at endoscopy', comment: 'No dysplasia, no cancer.' },
  ],

  biomarkers: polypOnlyBiomarkers('No known family history of bowel cancer.'),

  medications: [
    { name: 'Ferrous fumarate', dose: '210 mg', route: 'Oral', frequency: 'Once daily', purpose: 'Iron-deficiency anemia', start: '2026-08-25', source: 'Clinic letter', group: 'Supportive', note: 'Planned for 3 months, then recheck.' },
    { name: 'Ispaghula husk (fibre)', dose: '3.5 g sachet', route: 'Oral', frequency: 'Twice daily', purpose: 'Soft stools (hemorrhoids)', start: '2026-09-08', source: 'Endoscopy letter', group: 'Supportive' },
    { name: 'Salbutamol inhaler', dose: '100 micrograms, 2 puffs', route: 'Inhaled', frequency: 'When needed', purpose: 'Asthma', start: '2012-01-20', source: 'Family doctor medication list', group: 'Other' },
    { name: 'Budesonide inhaler', dose: '200 micrograms, 1 puff', route: 'Inhaled', frequency: 'Twice daily', purpose: 'Asthma (prevention)', start: '2019-10-03', source: 'Family doctor medication list', group: 'Other' },
  ],

  labs: routineLabs(
    'Female',
    ['2026-08-25', '2026-11-10'],
    { egfr: 110, creat: 58 },
    {
      hb: [['2026-08-25', 10.8], ['2026-11-10', 12.3]],
      ferritin: [['2026-08-25', 6], ['2026-11-10', 26]],
    },
    { cea: 'Not required: no cancer' },
  ),

  imaging: [
    { date: '2026-09-08', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Whole colon and end of the small bowel', findings: 'Good bowel preparation (Boston score 8). 15 mm pale flat lesion with a mucus cap in the cecum, next to the appendix opening; removed by cold EMR in 3 pieces. Grade II internal hemorrhoids. Rest normal.', impression: 'Likely sessile serrated lesion, removed. Hemorrhoids explain the bleeding.', visitId: 'visit-2' },
  ],

  history: {
    conditions: [
      { name: 'Asthma', since: '2012', source: 'Family doctor record', note: 'Mild, well controlled' },
      { name: 'Internal hemorrhoids, grade II', since: '2026', source: 'Colonoscopy report' },
    ],
    surgeries: [],
    stays: [],
    ecog: { value: 0, date: '2026-11-10', source: 'Clinic note' },
    asa: { value: 'ASA II', date: '2026-09-08', source: 'Sedation assessment' },
  },

  family: [],
  familyNote: 'No known cancer in the family.',

  lifestyle: {
    smoking: { status: 'Never', packYears: null, detail: 'Never smoked', date: '2026-08-25', source: 'Clinic note' },
    alcohol: { text: 'None', date: '2026-08-25', source: 'Clinic note' },
    activity: { text: 'Office work; walks in the evening', date: '2026-08-25', source: 'Clinic note' },
    diet: { text: 'Low in fibre and water; now adding fibre', date: '2026-11-10', source: 'Clinic note' },
    heightCm: { value: 168, date: '2026-08-25', source: 'Clinic note' },
    weights: [
      { date: '2026-08-25', kg: 61.5, source: 'Clinic note' },
      { date: '2026-11-10', kg: 61.9, source: 'Clinic note' },
    ],
  },

  symptoms: {
    date: '2026-11-10',
    source: 'Clinic note',
    items: symptomList({ Bleeding: ['Occasional streak of bright red blood on the paper', '2026-04-20'], 'Bowel habit': ['Hard stools, better with fibre', '2026-04-01'], Fatigue: ['Less tired since iron', '2026-06-01'] }),
  },
  vitals: { bloodPressure: '110/70', pulse: 76, temperature: 36.6, oxygen: 99, date: '2026-11-10', source: 'Clinic note' },
  exam: { text: 'Well. Abdomen soft and not tender.', date: '2026-11-10', source: 'Clinic note' },

  careTeam: [
    notInvolved('Colorectal surgeon'),
    notInvolved('Medical oncologist'),
    GASTROENTEROLOGIST,
    PATHOLOGIST,
    NURSE,
    { role: 'Family doctor', name: 'Dr. Yasmin Rawashdeh', clinic: 'Irbid Family Health Centre' },
  ],
  appointments: [
    { date: '2026-11-25', what: 'Blood count and ferritin after 3 months of iron', with: 'Dr. Yasmin Rawashdeh, Irbid Family Health Centre' },
    { date: '2027-03-09', what: 'Site check colonoscopy', with: 'Dr. Hani Barakat, Endoscopy Unit' },
  ],
}
