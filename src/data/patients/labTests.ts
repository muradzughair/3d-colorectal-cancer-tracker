// The lab tests used in the demo, with fictional typical adult reference ranges, and a helper
// that turns a patient's dated values into LabTest records (with the range for their sex).
import type { LabGroup, LabTest, Sex } from '../../profileTypes'

interface LabDefinition {
  name: string
  group: LabGroup
  unit: string
  low: number | null
  high: number | null
  female?: [number | null, number | null] // a different range for women
}

// In the order they are shown on the Patient page.
export const LAB_DEFINITIONS = {
  hb: { name: 'Hemoglobin', group: 'Blood count', unit: 'g/dL', low: 13.5, high: 17.5, female: [12.0, 15.5] },
  wbc: { name: 'White cells', group: 'Blood count', unit: 'x10^9/L', low: 4.0, high: 11.0 },
  neut: { name: 'Neutrophils', group: 'Blood count', unit: 'x10^9/L', low: 1.8, high: 7.5 },
  plt: { name: 'Platelets', group: 'Blood count', unit: 'x10^9/L', low: 150, high: 400 },
  ferritin: { name: 'Ferritin', group: 'Iron', unit: 'ug/L', low: 30, high: 400, female: [15, 150] },
  creat: { name: 'Creatinine', group: 'Kidney and electrolytes', unit: 'umol/L', low: 60, high: 110, female: [45, 90] },
  egfr: { name: 'eGFR', group: 'Kidney and electrolytes', unit: 'mL/min/1.73m2', low: 60, high: null },
  urea: { name: 'Urea', group: 'Kidney and electrolytes', unit: 'mmol/L', low: 2.5, high: 7.8 },
  na: { name: 'Sodium', group: 'Kidney and electrolytes', unit: 'mmol/L', low: 135, high: 145 },
  k: { name: 'Potassium', group: 'Kidney and electrolytes', unit: 'mmol/L', low: 3.5, high: 5.1 },
  ca: { name: 'Calcium (adjusted)', group: 'Kidney and electrolytes', unit: 'mmol/L', low: 2.2, high: 2.6 },
  alt: { name: 'ALT', group: 'Liver', unit: 'U/L', low: 7, high: 40 },
  ast: { name: 'AST', group: 'Liver', unit: 'U/L', low: 10, high: 40 },
  alp: { name: 'ALP', group: 'Liver', unit: 'U/L', low: 30, high: 130 },
  bili: { name: 'Bilirubin', group: 'Liver', unit: 'umol/L', low: 3, high: 21 },
  albumin: { name: 'Albumin', group: 'Liver', unit: 'g/L', low: 35, high: 50 },
  inr: { name: 'INR', group: 'Clotting', unit: '', low: 0.8, high: 1.2 },
  crp: { name: 'CRP', group: 'Inflammation', unit: 'mg/L', low: null, high: 5 },
  cea: { name: 'CEA', group: 'Tumor markers', unit: 'ug/L', low: null, high: 5.0 },
  ca199: { name: 'CA 19-9', group: 'Tumor markers', unit: 'U/mL', low: null, high: 37 },
  hba1c: { name: 'HbA1c', group: 'Diabetes', unit: '%', low: 4.0, high: 5.6 },
  fit: { name: 'FIT (stool test)', group: 'Stool test', unit: 'ug Hb/g', low: null, high: 10 },
} satisfies Record<string, LabDefinition>

export type LabId = keyof typeof LAB_DEFINITIONS

// Dated values for one test: [date, value] pairs, oldest first.
type Values = [string, number][]

// Build the patient's lab tests. Tests without values are left out, unless a "not done" note
// is given for them (then they are shown as not done with the note).
export function makeLabs(
  sex: Sex,
  values: Partial<Record<LabId, Values>>,
  notDone: Partial<Record<LabId, string>> = {},
): LabTest[] {
  const tests: LabTest[] = []
  for (const id of Object.keys(LAB_DEFINITIONS) as LabId[]) {
    const def: LabDefinition = LAB_DEFINITIONS[id]
    const given = values[id]
    if (!given && !notDone[id]) continue
    const [low, high] = sex === 'Female' && def.female ? def.female : [def.low, def.high]
    tests.push({
      id,
      name: def.name,
      group: def.group,
      unit: def.unit,
      low,
      high,
      results: (given ?? []).map(([date, value]) => ({ date, value, source: 'Lab' })),
      note: notDone[id],
    })
  }
  return tests
}
