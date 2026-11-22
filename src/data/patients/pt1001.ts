// PT-1001 Layla Nasser, 58, female. The original demo patient: her 4 visits, pictures and
// treatment entries are in ../demoPatient.ts and are not changed. This profile matches them:
// a sigmoid cancer found at screening (2025-03), chemotherapy before surgery (6 cycles from
// 2025-09), sigmoid colectomy (2026-02-10), now in follow-up. A growing ascending colon polyp
// (6, 7, 8 mm) is booked for removal on 2026-12-01.
import type { PatientProfile } from '../../profileTypes'
import { GASTROENTEROLOGIST, NURSE, ONCOLOGIST, PATHOLOGIST, SURGEON } from './careTeam'
import { makeLabs } from './labTests'

export const PROFILE_1001: PatientProfile = {
  id: 'PT-1001',
  name: 'Layla Nasser',
  age: 58,
  sex: 'Female',
  bloodGroup: 'A+',
  diagnosisSummary: 'Sigmoid adenocarcinoma, resected',
  stage: 'ypIIA',
  status: 'Post-treatment follow-up',

  allergies: [
    { substance: 'Penicillin', type: 'Drug', reaction: 'Rash', severity: 'Moderate', date: '2025-03-11', source: 'Clinic note' },
  ],
  precautions: [],

  findingStatus: [
    { visitId: 'visit-1', kind: 'polyp', segment: 'ascending', status: 'Present' },
    { visitId: 'visit-1', kind: 'polyp', segment: 'sigmoid', status: 'Biopsied', note: 'Biopsy on 2025-03-25: adenocarcinoma' },
    { visitId: 'visit-2', kind: 'tumor', segment: 'sigmoid', status: 'Present' },
    { visitId: 'visit-3', kind: 'tumor', segment: 'sigmoid', status: 'Present', note: 'Smaller after chemotherapy' },
    { visitId: 'visit-3', kind: 'polyp', segment: 'ascending', status: 'Present' },
    { visitId: 'visit-4', kind: 'polyp', segment: 'ascending', status: 'Present', note: 'Polypectomy booked for 2026-12-01' },
  ],

  diagnosis: {
    date: '2025-03-28',
    source: 'Pathology report',
    site: 'Sigmoid colon',
    segment: 'sigmoid',
    distanceFromAnalVergeCm: 25,
    sidedness: 'Left colon',
    histology: 'Adenocarcinoma (not otherwise specified)',
    grade: 'G2 (moderately differentiated)',
    clinicalStage: { tnm: 'cT4a cN1a M0', group: 'IIIB', date: '2025-08-12', source: 'CT report' },
    pathologicStage: { tnm: 'ypT3 ypN0 (0 of 16) M0', group: 'IIA', date: '2026-02-17', source: 'Pathology report' },
    tumorSize: [
      { text: '34 mm on staging CT', date: '2025-08-12', source: 'CT report' },
      { text: '23 mm on CT after chemotherapy', date: '2026-01-13', source: 'CT report' },
      { text: '21 mm residual tumor in the resection specimen', date: '2026-02-17', source: 'Pathology report' },
    ],
    symptoms: 'None. Found at screening colonoscopy.',
    synchronousLesions: '6 mm polyp in the ascending colon',
  },

  pathology: [
    {
      kind: 'cancer',
      label: 'Specimen A',
      date: '2025-03-28',
      source: 'Pathology report',
      procedure: 'Endoscopic biopsy (flexible sigmoidoscopy, 2025-03-25)',
      site: 'Sigmoid colon',
      histology: 'Adenocarcinoma (not otherwise specified)',
      grade: 'G2 (moderately differentiated)',
      depth: 'Invasive carcinoma; depth not assessable on biopsy',
      lymphovascular: 'Not identified in the biopsy',
      perineural: 'Not identified in the biopsy',
      budding: 'Not assessable on biopsy',
      emvi: 'Not assessable on biopsy',
      margins: { proximal: 'Not applicable (biopsy)', distal: 'Not applicable (biopsy)', radial: 'Not applicable (biopsy)' },
      nodes: 'Not applicable (biopsy)',
      deposits: 'Not applicable (biopsy)',
      regression: 'Not applicable (before treatment)',
      ptnm: 'Not applicable (biopsy)',
      comment: 'Six biopsy fragments. MMR stains done (see Biomarkers).',
    },
    {
      kind: 'cancer',
      label: 'Specimen B',
      date: '2026-02-17',
      source: 'Pathology report',
      procedure: 'Laparoscopic sigmoid colectomy (2026-02-10)',
      site: 'Sigmoid colon',
      histology: 'Adenocarcinoma (not otherwise specified)',
      grade: 'G2 (moderately differentiated)',
      depth: 'Through the muscle layer into the fat around the colon (ypT3)',
      lymphovascular: 'Not identified',
      perineural: 'Not identified',
      budding: 'Low (Bd1)',
      emvi: 'Not identified',
      margins: { proximal: 'Clear (90 mm)', distal: 'Clear (50 mm)', radial: 'Clear (8 mm, mesenteric)' },
      nodes: '0 of 16 positive',
      deposits: 'Not identified',
      regression: 'Partial response (tumor regression score 2)',
      ptnm: 'ypT3 ypN0',
      comment: 'Complete removal (R0). Changes after chemotherapy present.',
    },
  ],

  biomarkers: {
    mmr: {
      state: 'done',
      stains: { mlh1: 'Intact', msh2: 'Intact', msh6: 'Intact', pms2: 'Intact' },
      result: 'pMMR (MMR proficient)',
      date: '2025-04-02',
      source: 'Pathology report',
    },
    msi: { state: 'not-done', note: 'MMR stains used instead' },
    kras: { state: 'not-required' },
    nras: { state: 'not-required' },
    braf: { state: 'not-required' },
    her2: { state: 'not-required' },
    ntrk: { state: 'not-required' },
    dpyd: { state: 'done', result: 'Normal (no variant found)', date: '2025-08-22', source: 'Lab' },
    germline: { state: 'not-done' },
    familyRisk: 'Mother had breast cancer at 62. No known bowel cancer in the family.',
  },

  medications: [
    { name: 'Levothyroxine', dose: '75 mcg', route: 'Oral', frequency: 'Once daily', purpose: 'Hypothyroidism', start: '2014-05-20', source: 'Family doctor medication list', group: 'Other' },
    { name: 'Duloxetine', dose: '30 mg', route: 'Oral', frequency: 'Once daily', purpose: 'Nerve pain and numbness after oxaliplatin', start: '2026-06-30', source: 'Oncology prescription', group: 'Supportive', note: 'Reviewed at each visit' },
    { name: 'Oxaliplatin (FOLFOX)', dose: '85 mg/m2', route: 'IV', frequency: 'Every 14 days', purpose: 'Chemotherapy before surgery', start: '2025-09-01', source: 'Oncology prescription', group: 'Cancer treatment', stopped: { date: '2025-11-10', reason: 'Planned 6 cycles completed' } },
    { name: 'Folinic acid (FOLFOX)', dose: '400 mg/m2', route: 'IV', frequency: 'Every 14 days', purpose: 'Chemotherapy before surgery', start: '2025-09-01', source: 'Oncology prescription', group: 'Cancer treatment', stopped: { date: '2025-11-10', reason: 'Planned 6 cycles completed' } },
    { name: 'Fluorouracil (FOLFOX)', dose: '400 mg/m2 bolus, then 2400 mg/m2 over 46 hours', route: 'IV', frequency: 'Every 14 days', purpose: 'Chemotherapy before surgery', start: '2025-09-01', source: 'Oncology prescription', group: 'Cancer treatment', stopped: { date: '2025-11-12', reason: 'Planned 6 cycles completed' } },
    { name: 'Ondansetron', dose: '8 mg', route: 'Oral', frequency: 'Twice daily, days 1 to 3 of each cycle', purpose: 'Anti-sickness during chemotherapy', start: '2025-09-01', source: 'Oncology prescription', group: 'Supportive', stopped: { date: '2025-11-13', reason: 'Chemotherapy finished' } },
    { name: 'Ferrous sulfate', dose: '200 mg', route: 'Oral', frequency: 'Once daily', purpose: 'Low iron', start: '2025-08-19', source: 'Clinic note', group: 'Other', stopped: { date: '2026-06-16', reason: 'Iron level back to normal' } },
    { name: 'Enoxaparin', dose: '40 mg', route: 'Subcutaneous', frequency: 'Once daily', purpose: 'Prevent blood clots after surgery', start: '2026-02-10', source: 'Discharge letter', group: 'Blood thinners and antiplatelets', stopped: { date: '2026-03-10', reason: 'Planned 28-day course after surgery completed' } },
  ],

  labs: makeLabs('Female', {
    hb: [['2025-08-14', 11.6], ['2025-11-24', 10.9], ['2026-02-03', 11.4], ['2026-06-16', 12.6]],
    wbc: [['2025-08-14', 6.8], ['2025-11-24', 3.6], ['2026-02-03', 6.2], ['2026-06-16', 6.5]],
    neut: [['2025-08-14', 4.1], ['2025-11-24', 1.6], ['2026-02-03', 3.9], ['2026-06-16', 3.8]],
    plt: [['2025-08-14', 312], ['2025-11-24', 138], ['2026-02-03', 245], ['2026-06-16', 268]],
    ferritin: [['2025-08-14', 12], ['2026-06-16', 64]],
    creat: [['2025-08-14', 68], ['2025-11-24', 71], ['2026-02-03', 74], ['2026-06-16', 70]],
    egfr: [['2025-08-14', 85], ['2025-11-24', 81], ['2026-02-03', 77], ['2026-06-16', 82]],
    urea: [['2025-08-14', 4.8], ['2025-11-24', 5.1], ['2026-02-03', 5.3], ['2026-06-16', 4.9]],
    na: [['2025-08-14', 139], ['2025-11-24', 137], ['2026-02-03', 140], ['2026-06-16', 139]],
    k: [['2025-08-14', 4.2], ['2025-11-24', 3.9], ['2026-02-03', 4.4], ['2026-06-16', 4.3]],
    ca: [['2025-08-14', 2.34], ['2025-11-24', 2.29], ['2026-02-03', 2.31], ['2026-06-16', 2.36]],
    alt: [['2025-08-14', 22], ['2025-11-24', 31], ['2026-06-16', 20]],
    ast: [['2025-08-14', 24], ['2025-11-24', 29], ['2026-06-16', 21]],
    alp: [['2025-08-14', 88], ['2025-11-24', 96], ['2026-06-16', 80]],
    bili: [['2025-08-14', 9], ['2025-11-24', 11], ['2026-06-16', 9]],
    albumin: [['2025-08-14', 39], ['2025-11-24', 36], ['2026-06-16', 41]],
    inr: [['2025-08-14', 1.0], ['2026-02-03', 1.0]],
    crp: [['2025-08-14', 6.8], ['2025-11-24', 3.2], ['2026-02-03', 4.1], ['2026-06-16', 1.9]],
    cea: [['2025-08-14', 9.8], ['2025-11-24', 4.1], ['2026-01-13', 3.2], ['2026-03-17', 2.4], ['2026-06-16', 2.1], ['2026-09-15', 2.3]],
    ca199: [['2025-08-14', 31], ['2026-06-16', 14]],
  }),

  imaging: [
    { date: '2025-03-11', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Whole colon to the cecum', findings: '6 mm sessile polyp in the ascending colon. 9 mm polypoid lesion in the sigmoid colon with an ulcerated surface.', impression: 'Sigmoid lesion suspicious for cancer. Biopsy arranged.', visitId: 'visit-1' },
    { date: '2025-03-25', source: 'Endoscopy report', type: 'Flexible sigmoidoscopy', region: 'Sigmoid colon', findings: 'Six biopsies taken from the sigmoid lesion. Lesion marked with tattoo ink.', impression: 'Biopsies sent to pathology.' },
    { date: '2025-08-12', source: 'CT report', type: 'CT chest, abdomen and pelvis', region: 'Chest, abdomen, pelvis', findings: '34 mm sigmoid mass growing through the bowel wall to the outer surface. Two enlarged nearby lymph nodes (8 and 10 mm). Liver and lungs clear.', impression: 'cT4a cN1a M0.', visitId: 'visit-2' },
    { date: '2025-08-28', source: 'Procedure note', type: 'Port insertion', region: 'Right upper chest', findings: 'Implanted port placed through the right internal jugular vein. Tip at the junction of the vena cava and the right atrium on X-ray.', impression: 'Port ready for use.' },
    { date: '2026-01-13', source: 'CT report', type: 'CT chest, abdomen and pelvis', region: 'Chest, abdomen, pelvis', findings: 'Sigmoid wall thickening now 23 mm. Lymph nodes smaller (under 6 mm). No distant spread.', impression: 'Partial response after chemotherapy.', visitId: 'visit-3' },
    { date: '2026-01-13', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Whole colon to the cecum', findings: 'Ascending colon polyp now 7 mm. Smaller ulcerated tumor in the sigmoid colon; the scope passed easily.', impression: 'Residual sigmoid tumor. Ascending polyp present.', visitId: 'visit-3' },
    { date: '2026-02-10', source: 'Operation note', type: 'Surgery', region: 'Sigmoid colon', findings: 'Laparoscopic sigmoid colectomy with joined bowel ends (anastomosis). No spread seen in the abdomen.', impression: 'Uncomplicated operation.' },
    { date: '2026-04-14', source: 'Procedure note', type: 'Port removal', region: 'Right upper chest', findings: 'Port removed. Wound closed.', impression: 'No complications.' },
    { date: '2026-06-16', source: 'Colonoscopy report', type: 'Colonoscopy', region: 'Whole colon to the cecum', findings: 'Healthy join at the surgery site, no recurrence. Ascending colon polyp now 8 mm. Bowel preparation poor in the right colon (Boston score 6).', impression: 'Polyp left for removal at a separate planned session with better preparation.', visitId: 'visit-4' },
  ],

  history: {
    conditions: [
      { name: 'Hypothyroidism', since: '2014', source: 'Family doctor record', note: 'Stable on levothyroxine' },
      { name: 'Osteoarthritis of both knees', since: '2019', source: 'Family doctor record' },
    ],
    surgeries: [
      { name: 'Laparoscopic gallbladder removal', date: '2012-05-14', source: 'Family doctor record' },
      { name: 'Port insertion', date: '2025-08-28', source: 'Procedure note' },
      { name: 'Laparoscopic sigmoid colectomy', date: '2026-02-10', source: 'Operation note' },
      { name: 'Port removal', date: '2026-04-14', source: 'Procedure note' },
    ],
    stays: [{ from: '2026-02-10', to: '2026-02-15', reason: 'Sigmoid colectomy', place: 'Surgical ward', source: 'Discharge letter' }],
    ecog: { value: 0, date: '2026-06-16', source: 'Clinic note' },
    asa: { value: 'ASA II', date: '2026-02-03', source: 'Pre-surgery assessment' },
  },

  family: [
    { relative: 'Mother', condition: 'Breast cancer', ageAtDiagnosis: 62, date: '2025-03-11', source: 'Clinic note' },
    { relative: 'Father', condition: 'High blood pressure', ageAtDiagnosis: 55, date: '2025-03-11', source: 'Clinic note' },
  ],
  familyNote: 'No known bowel cancer in the family.',

  lifestyle: {
    smoking: { status: 'Never', packYears: null, detail: 'Never smoked', date: '2025-03-11', source: 'Clinic note' },
    alcohol: { text: 'None', date: '2025-03-11', source: 'Clinic note' },
    activity: { text: 'Walks 30 minutes, 4 days a week', date: '2026-06-16', source: 'Clinic note' },
    diet: { text: 'Mixed diet; eats more vegetables and fibre since surgery', date: '2026-06-16', source: 'Clinic note' },
    heightCm: { value: 162, date: '2025-03-11', source: 'Clinic note' },
    weights: [
      { date: '2025-03-11', kg: 71.0, source: 'Clinic note' },
      { date: '2025-08-14', kg: 69.5, source: 'Clinic note' },
      { date: '2025-11-24', kg: 66.8, source: 'Clinic note' },
      { date: '2026-02-03', kg: 66.0, source: 'Pre-surgery assessment' },
      { date: '2026-06-16', kg: 67.4, source: 'Clinic note' },
    ],
  },

  symptoms: {
    date: '2026-06-16',
    source: 'Clinic note',
    items: [
      { name: 'Bowel habit', detail: 'Regular, 1 to 2 soft stools a day', since: null },
      { name: 'Bleeding', detail: 'None', since: null },
      { name: 'Pain', detail: 'None', since: null },
      { name: 'Weight loss', detail: 'None; weight stable since surgery', since: null },
      { name: 'Fatigue', detail: 'Mild, improving', since: '2025-09-15' },
      { name: 'Numbness', detail: 'Mild numbness in the fingertips (grade 1)', since: '2025-10-20' },
    ],
  },
  vitals: { bloodPressure: '126/78', pulse: 74, temperature: 36.7, oxygen: 98, date: '2026-06-16', source: 'Clinic note' },
  exam: {
    text: 'Abdomen soft and not tender; surgical scars healed. No masses, liver not enlarged. Rectal exam not done at this visit.',
    date: '2026-06-16',
    source: 'Clinic note',
  },

  careTeam: [
    SURGEON,
    ONCOLOGIST,
    GASTROENTEROLOGIST,
    PATHOLOGIST,
    NURSE,
    { role: 'Family doctor', name: 'Dr. Samir Aziz', clinic: 'Jabal Family Health Centre' },
  ],
  appointments: [
    { date: '2026-12-01', what: 'Removal of the ascending colon polyp (polypectomy)', with: 'Dr. Hani Barakat, Endoscopy Unit' },
    { date: '2026-12-15', what: 'Oncology review with CEA blood test', with: 'Dr. Rania Farouk, Oncology Day Unit' },
    { date: '2027-01-12', what: 'Follow-up CT chest, abdomen and pelvis', with: 'Radiology Department' },
  ],
}
