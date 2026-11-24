// PT-1011 Kareem Abu-Hamdan, 51, male. Low rectal cancer, "watch and wait" after a complete
// clinical response. MRI 2025-12-16: cT3b N1 M0 (IIIB), 5 cm from the anal verge. Total
// neoadjuvant therapy: chemoradiotherapy 50.4 Gy in 28 fractions with capecitabine
// (2026-01-12 to 2026-02-20), then CAPOX 4 cycles (2026-03-16 to 2026-06-08). MRI and
// endoscopy 2026-06-30 and 2026-07-07: complete clinical response. MDT 2026-07-09: watch and
// wait, chosen with the patient. Check 2026-10-06: still clear.
import type { PatientProfile } from '../../profileTypes'
import type { TreatmentStep, Visit } from '../../types'
import { GASTROENTEROLOGIST, NURSE, ONCOLOGIST, ONCOLOGY_NURSE, PATHOLOGIST, RADIATION_ONCOLOGIST, SURGEON } from './careTeam'
import { notNeeded, routineLabs, step, symptomList } from './helpers'

const GI = 'Dr. Hani Barakat, gastroenterologist'
const SURG = 'Dr. Khaled Saleh, colorectal surgeon'
const ONC = 'Dr. Rania Farouk, medical oncologist'

export const VISITS_1011: Visit[] = [
  {
    id: 'visit-1',
    date: '2025-12-09',
    title: 'Colonoscopy with biopsy',
    pictures: [],
    findings: [{ id: 'pt1011-v1-tumor', kind: 'tumor', segment: 'rectum', size: { value: 3.2, unit: 'cm' }, source: 'manual', distanceFromAnalVergeCm: 5, locationBasis: 'measured', clockPosition: 6, morphology: 'ulcerated', lengthMm: 32, circumferentialExtentPct: 50, lumen: 'open', stage: { clinical: 'cT3b cN1 M0' }, histology: { result: 'Adenocarcinoma, G2 (biopsy)', date: '2025-12-12' }, resection: { method: 'biopsy', complete: false, date: '2025-12-09' }, notes: 'Lower edge 5 cm from the anal verge, on the back wall.' }],
  },
  { id: 'visit-2', date: '2026-07-07', title: 'Response check: flexible sigmoidoscopy', pictures: [], findings: [] },
  { id: 'visit-3', date: '2026-10-06', title: 'Watch and wait check: sigmoidoscopy and MRI', pictures: [], findings: [] },
]

export const STEPS_1011: TreatmentStep[] = [
  step('step-1', 'Diagnosis and staging', 'procedures', 'procedure', 'Colonoscopy with biopsy', 'done', '2025-12-09', [], { description: 'Colonoscopy for rectal bleeding. Ulcerated low rectal tumor, lower edge 5 cm from the anal verge, biopsied.', performedBy: GI, place: 'Endoscopy Unit', outcome: 'Adenocarcinoma, G2', visitId: 'visit-1', findingIds: ['pt1011-v1-tumor'], profileSection: 'pathology' }),
  step('step-2', 'Diagnosis and staging', 'imaging-tests', 'imaging', 'Pelvic MRI', 'done', '2025-12-16', ['step-1'], { description: 'Rectal MRI for local staging.', place: 'Radiology Department', outcome: 'cT3b N1 (2 nodes), MRF clear (4 mm), EMVI negative.', profileSection: 'imaging' }),
  step('step-3', 'Diagnosis and staging', 'imaging-tests', 'imaging', 'CT chest, abdomen, pelvis', 'done', '2025-12-17', ['step-1'], { description: 'Staging CT.', place: 'Radiology Department', outcome: 'No spread to the liver or lungs (M0).', profileSection: 'imaging' }),
  step('step-4', 'Diagnosis and staging', 'reviews', 'review', 'MDT meeting', 'done', '2025-12-18', ['step-2', 'step-3'], { description: 'Multidisciplinary team meeting. Decision recorded: total neoadjuvant therapy (chemoradiotherapy, then CAPOX), then restaging.', place: 'MDT meeting room' }),
  step('step-5', 'Before treatment', 'reviews', 'review', 'Fertility: sperm banking', 'done', '2026-01-05', ['step-4'], { description: 'Sperm stored before pelvic radiotherapy, at the patient\'s wish.', place: 'Fertility Clinic' }),
  step('step-6', 'Treatment', 'procedures', 'radiotherapy', 'Chemoradiotherapy', 'done', '2026-01-12', ['step-5'], { endDate: '2026-02-20', description: 'Long-course radiotherapy to the pelvis with capecitabine tablets on radiotherapy days.', performedBy: 'Dr. Tamer Hijazi, radiation oncologist', place: 'Radiotherapy Department', radiotherapy: { totalGy: 50.4, fractions: 28 }, regimen: { drugs: 'Capecitabine', dose: '825 mg/m2 (1,650 mg)', route: 'Oral', schedule: 'Twice daily on radiotherapy days' }, outcome: 'All 28 fractions given.', sideEffects: [{ name: 'Diarrhoea', grade: 2 }, { name: 'Radiation proctitis', grade: 1 }, { name: 'Skin soreness', grade: 1 }], profileSection: 'medications' }),
  step('step-7', 'Treatment', 'medicine', 'medicine', 'CAPOX chemotherapy', 'done', '2026-03-16', ['step-6'], {
    endDate: '2026-06-08',
    description: 'Consolidation chemotherapy after chemoradiotherapy, 4 cycles of 21 days.',
    performedBy: ONC,
    place: 'Oncology Day Unit',
    regimen: { drugs: 'CAPOX: capecitabine and oxaliplatin', dose: 'Oxaliplatin 130 mg/m2 on day 1; capecitabine 1000 mg/m2 (2,000 mg) twice daily, days 1 to 14', route: 'IV (oxaliplatin) and oral (capecitabine)', schedule: 'Every 21 days' },
    cycles: [
      { n: 1, date: '2026-03-16', status: 'done', note: 'Full dose' },
      { n: 2, date: '2026-04-06', status: 'done', note: 'Full dose' },
      { n: 3, date: '2026-04-27', status: 'done', note: 'Full dose; tingling with cold' },
      { n: 4, date: '2026-05-18', status: 'done', note: 'Oxaliplatin reduced to 100 mg/m2 for tingling' },
    ],
    outcome: 'All 4 cycles completed',
    sideEffects: [{ name: 'Peripheral neuropathy', grade: 1 }],
    profileSection: 'medications',
  }),
  step('step-8', 'Restaging', 'imaging-tests', 'imaging', 'Restaging MRI', 'done', '2026-06-30', ['step-7'], { description: 'Rectal MRI after all treatment.', place: 'Radiology Department', outcome: 'Thin dark scar only; no tumor signal on diffusion; nodes gone (mrTRG 1).', profileSection: 'imaging' }),
  step('step-9', 'Restaging', 'procedures', 'procedure', 'Flexible sigmoidoscopy', 'done', '2026-07-07', ['step-8'], { description: 'Endoscopic look at the tumor site.', performedBy: GI, place: 'Endoscopy Unit', outcome: 'Flat white scar with small blood vessels. No ulcer, no lump. Scar biopsies: no cancer.', visitId: 'visit-2', profileSection: 'imaging' }),
  step('step-10', 'Restaging', 'reviews', 'review', 'MDT meeting', 'done', '2026-07-09', ['step-9'], { description: 'Multidisciplinary team meeting: complete clinical response. Options (surgery or watch and wait) discussed with the patient; he chose watch and wait. Decision recorded.', performedBy: SURG, place: 'MDT meeting room' }),
  step('step-11', 'Watch and wait', 'procedures', 'procedure', 'Check: sigmoidoscopy and MRI', 'done', '2026-10-06', ['step-10'], {
    description: 'Watch and wait checks every 3 months in the first year: sigmoidoscopy and rectal MRI.',
    performedBy: GI,
    place: 'Endoscopy Unit and Radiology Department',
    cycles: [
      { n: 1, date: '2026-10-06', status: 'done', note: 'Still clear' },
      { n: 2, date: '2027-01-12', status: 'planned' },
      { n: 3, date: '2027-04-13', status: 'planned' },
    ],
    outcome: 'Scar unchanged; MRI clear',
    visitId: 'visit-3',
    profileSection: 'imaging',
  }),
  step('step-12', 'Watch and wait', 'imaging-tests', 'imaging', 'CT chest, abdomen, pelvis', 'planned', '2027-01-05', ['step-10'], { description: 'Yearly CT for the first years.', place: 'Radiology Department' }),
]

export const PROFILE_1011: PatientProfile = {
  id: 'PT-1011',
  name: 'Kareem Abu-Hamdan',
  age: 51,
  sex: 'Male',
  bloodGroup: 'AB+',
  diagnosisSummary: 'Low rectal adenocarcinoma, complete clinical response (watch and wait)',
  stage: 'cIIIB',
  status: 'Post-treatment follow-up',

  allergies: [],
  precautions: [{ text: 'Watch and wait: any new rectal bleeding or change must be reported and seen within 2 weeks', date: '2026-07-09', source: 'MDT outcome' }],

  findingStatus: [{ visitId: 'visit-1', kind: 'tumor', segment: 'rectum', status: 'Biopsied', note: 'Present; biopsy: adenocarcinoma. Not seen after treatment (complete clinical response)' }],

  diagnosis: {
    date: '2025-12-12',
    source: 'Pathology report',
    site: 'Lower rectum',
    segment: 'rectum',
    distanceFromAnalVergeCm: 5,
    sidedness: 'Rectum',
    histology: 'Adenocarcinoma (not otherwise specified)',
    grade: 'G2 (moderately differentiated)',
    clinicalStage: { tnm: 'cT3b cN1 M0', group: 'IIIB', date: '2025-12-16', source: 'MRI report' },
    pathologicStage: null,
    pathologicStageNote: 'No surgery: watch and wait after a complete clinical response',
    tumorSize: [
      { text: 'About 32 mm at colonoscopy', date: '2025-12-09', source: 'Colonoscopy report' },
      { text: '30 mm long on MRI', date: '2025-12-16', source: 'MRI report' },
      { text: 'No tumor seen, scar only', date: '2026-07-07', source: 'Sigmoidoscopy report' },
    ],
    symptoms: 'Bright red blood with stools and a feeling of not emptying the bowel for 3 months.',
    synchronousLesions: 'None',
  },

  pathology: [
    { kind: 'cancer', label: 'Specimen A', date: '2025-12-12', source: 'Pathology report', procedure: 'Endoscopic biopsy (colonoscopy, 2025-12-09)', site: 'Lower rectum, 5 cm', histology: 'Adenocarcinoma (not otherwise specified)', grade: 'G2 (moderately differentiated)', depth: 'Invasive carcinoma; depth not assessable on biopsy', lymphovascular: 'Not identified in the biopsy', perineural: 'Not identified in the biopsy', budding: 'Not assessable on biopsy', emvi: 'Not assessable on biopsy', margins: { proximal: 'Not applicable (biopsy)', distal: 'Not applicable (biopsy)', radial: 'Not applicable (biopsy)' }, nodes: 'Not applicable (biopsy)', deposits: 'Not applicable (biopsy)', regression: 'Not applicable (before treatment)', ptnm: 'Not applicable (biopsy)', comment: 'Five biopsy fragments. MMR stains done (see Biomarkers).' },
    { kind: 'cancer', label: 'Specimen B', date: '2026-07-10', source: 'Pathology report', procedure: 'Scar biopsies (flexible sigmoidoscopy, 2026-07-07)', site: 'Lower rectum, tumor site', histology: 'Scarring and inflammation; no cancer cells', grade: 'Not applicable', depth: 'Not applicable', lymphovascular: 'Not applicable', perineural: 'Not applicable', budding: 'Not applicable', emvi: 'Not applicable', margins: { proximal: 'Not applicable (biopsy)', distal: 'Not applicable (biopsy)', radial: 'Not applicable (biopsy)' }, nodes: 'Not applicable (biopsy)', deposits: 'Not applicable (biopsy)', regression: 'No cancer left in the biopsies', ptnm: 'Not applicable (biopsy)', comment: 'A negative biopsy does not by itself rule out cancer deeper in the wall.' },
  ],

  biomarkers: {
    mmr: { state: 'done', stains: { mlh1: 'Intact', msh2: 'Intact', msh6: 'Intact', pms2: 'Intact' }, result: 'pMMR (MMR proficient)', date: '2025-12-15', source: 'Pathology report' },
    msi: { state: 'not-done', note: 'MMR stains used instead' },
    kras: notNeeded('No spread of the cancer'),
    nras: notNeeded('No spread of the cancer'),
    braf: notNeeded('No spread of the cancer'),
    her2: notNeeded('No spread of the cancer'),
    ntrk: notNeeded('No spread of the cancer'),
    dpyd: { state: 'done', result: 'Normal (no variant found)', date: '2025-12-30', source: 'Lab' },
    germline: { state: 'not-done', note: 'Not offered: MMR proficient, no family history' },
    familyRisk: 'No known family history of bowel cancer.',
  },

  medications: [
    { name: 'Loperamide', dose: '2 mg', route: 'Oral', frequency: 'When needed, up to 4 times a day', purpose: 'Loose stools after radiotherapy', start: '2026-02-02', source: 'Radiotherapy letter', group: 'Supportive' },
    { name: 'Omeprazole', dose: '20 mg', route: 'Oral', frequency: 'Once daily', purpose: 'Heartburn', start: '2023-09-11', source: 'Family doctor medication list', group: 'Other' },
    { name: 'Capecitabine (with radiotherapy)', dose: '825 mg/m2 (1,650 mg)', route: 'Oral', frequency: 'Twice daily on radiotherapy days', purpose: 'Chemotherapy with radiotherapy', start: '2026-01-12', source: 'Oncology prescription', group: 'Cancer treatment', stopped: { date: '2026-02-20', reason: 'Radiotherapy course completed' } },
    { name: 'Capecitabine (CAPOX)', dose: '1000 mg/m2 (2,000 mg)', route: 'Oral', frequency: 'Twice daily, days 1 to 14 of each 21-day cycle', purpose: 'Chemotherapy after chemoradiotherapy', start: '2026-03-16', source: 'Oncology prescription', group: 'Cancer treatment', stopped: { date: '2026-05-31', reason: '4 planned cycles completed (course ended 2026-06-08)' } },
    { name: 'Oxaliplatin (CAPOX)', dose: '130 mg/m2 (cycle 4: 100 mg/m2)', route: 'IV', frequency: 'Day 1 of each 21-day cycle', purpose: 'Chemotherapy after chemoradiotherapy', start: '2026-03-16', source: 'Oncology prescription', group: 'Cancer treatment', stopped: { date: '2026-05-18', reason: '4 planned cycles completed (course ended 2026-06-08)' } },
  ],

  labs: routineLabs(
    'Male',
    ['2025-12-09', '2026-01-26', '2026-03-13', '2026-05-15', '2026-07-07', '2026-10-06'],
    { egfr: 92, creat: 84 },
    {
      hb: [['2025-12-09', 13.2], ['2026-01-26', 12.6], ['2026-03-13', 12.4], ['2026-05-15', 12.1], ['2026-07-07', 13.3], ['2026-10-06', 14.2]],
      plt: [['2025-12-09', 284], ['2026-01-26', 198], ['2026-03-13', 221], ['2026-05-15', 138], ['2026-07-07', 214], ['2026-10-06', 236]],
      wbc: [['2025-12-09', 7.4], ['2026-01-26', 4.1], ['2026-03-13', 5.2], ['2026-05-15', 3.8], ['2026-07-07', 5.9], ['2026-10-06', 6.5]],
      cea: [['2025-12-17', 6.8], ['2026-03-13', 3.4], ['2026-07-07', 1.9], ['2026-10-06', 1.7]],
    },
  ),

  imaging: [
    { date: '2025-12-09', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Whole colon to the cecum', findings: 'Ulcerated tumor on the back wall of the lower rectum, lower edge 5 cm from the anal verge, about 32 mm, half of the circumference. No other polyps.', impression: 'Low rectal tumor, biopsied.', visitId: 'visit-1' },
    { date: '2025-12-16', source: 'MRI report', type: 'MRI', region: 'Pelvis (rectum)', findings: 'Low rectal tumor, 30 mm long, spreading 3 mm beyond the muscle wall (T3b). Two suspicious nodes in the mesorectum. Mesorectal fascia clear (4 mm). No venous invasion (EMVI negative). Anal sphincter not involved.', impression: 'cT3b N1, MRF clear.' },
    { date: '2025-12-17', source: 'CT report', type: 'CT', region: 'Chest, abdomen and pelvis', findings: 'Liver and lungs clear. No enlarged nodes outside the pelvis.', impression: 'M0.' },
    { date: '2026-06-30', source: 'MRI report', type: 'MRI', region: 'Pelvis (rectum)', findings: 'Thin, dark (fibrous) scar at the tumor site. No tumor signal on diffusion images. Mesorectal nodes no longer seen.', impression: 'Complete response on MRI (mrTRG 1).' },
    { date: '2026-07-07', source: 'Sigmoidoscopy report', type: 'Flexible sigmoidoscopy', region: 'Rectum and sigmoid colon', findings: 'Flat white scar with small blood vessels at 5 cm on the back wall. No ulcer, no nodule, smooth on close look. Scar biopsied.', impression: 'Complete clinical response.', visitId: 'visit-2' },
    { date: '2026-10-06', source: 'Sigmoidoscopy and MRI reports', type: 'Flexible sigmoidoscopy and MRI', region: 'Rectum', findings: 'Scar unchanged at sigmoidoscopy. MRI: thin dark scar, no new tumor signal, no nodes.', impression: 'Sustained complete clinical response.', visitId: 'visit-3' },
  ],

  history: {
    conditions: [{ name: 'Heartburn (reflux)', since: '2023', source: 'Family doctor record' }],
    surgeries: [{ name: 'Knee arthroscopy (right)', date: '2012-11-08', source: 'Patient report' }],
    stays: [],
    ecog: { value: 0, date: '2026-10-06', source: 'Clinic note' },
    asa: { value: 'ASA I', date: '2026-07-07', source: 'Sedation assessment' },
  },

  family: [],
  familyNote: 'No known cancer in the family.',

  lifestyle: {
    smoking: { status: 'Never', packYears: null, detail: 'Never smoked', date: '2025-12-09', source: 'Clinic note' },
    alcohol: { text: 'None', date: '2025-12-09', source: 'Clinic note' },
    activity: { text: 'Back at work as an engineer; gym twice a week', date: '2026-10-06', source: 'Clinic note' },
    diet: { text: 'Mixed diet; avoids very spicy food (looser stools)', date: '2026-10-06', source: 'Clinic note' },
    heightCm: { value: 180, date: '2025-12-09', source: 'Clinic note' },
    weights: [
      { date: '2025-12-09', kg: 81.0, source: 'Clinic note' },
      { date: '2026-02-20', kg: 77.6, source: 'Radiotherapy record' },
      { date: '2026-06-08', kg: 78.4, source: 'Oncology clinic note' },
      { date: '2026-10-06', kg: 80.2, source: 'Clinic note' },
    ],
  },

  symptoms: {
    date: '2026-10-06',
    source: 'Clinic note',
    items: symptomList({ 'Bowel habit': ['3 to 4 a day, some urgency (since radiotherapy)', '2026-01-26'], Tingling: ['Mild, toes only', '2026-04-27'] }),
  },
  vitals: { bloodPressure: '124/78', pulse: 68, temperature: 36.6, oxygen: 99, date: '2026-10-06', source: 'Clinic note' },
  exam: { text: 'Well. Rectal exam: smooth scar on the back wall, no lump felt.', date: '2026-10-06', source: 'Clinic note' },

  careTeam: [
    SURGEON,
    ONCOLOGIST,
    RADIATION_ONCOLOGIST,
    GASTROENTEROLOGIST,
    PATHOLOGIST,
    NURSE,
    ONCOLOGY_NURSE,
    { role: 'Family doctor', name: 'Dr. Laith Obeidat', clinic: 'Khalda Family Health Centre' },
  ],
  appointments: [
    { date: '2027-01-05', what: 'Yearly CT chest, abdomen and pelvis', with: 'Radiology Department' },
    { date: '2027-01-12', what: 'Watch and wait check: sigmoidoscopy and MRI', with: 'Dr. Hani Barakat, Endoscopy Unit' },
    { date: '2027-01-19', what: 'Results clinic', with: 'Dr. Khaled Saleh, Colorectal Surgery Clinic' },
  ],
}
