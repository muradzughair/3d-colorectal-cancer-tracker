// Small helpers shared by the patient files PT-1006 to PT-1015, so each file holds only what is
// special about that patient. All values are fictional.
import type { Biomarkers, Sex, Symptom, TestResult } from '../../profileTypes'
import type { Lane, StepKind, StepStatus, TreatmentStep } from '../../types'
import { makeLabs, type LabId } from './labTests'

export const NOT_REQUIRED = { state: 'not-required', note: 'No cancer' } as const

// Biomarkers for a patient with polyps only (no cancer).
export function polypOnlyBiomarkers(familyRisk: string): Biomarkers {
  return {
    mmr: NOT_REQUIRED,
    msi: NOT_REQUIRED,
    kras: NOT_REQUIRED,
    nras: NOT_REQUIRED,
    braf: NOT_REQUIRED,
    her2: NOT_REQUIRED,
    ntrk: NOT_REQUIRED,
    dpyd: NOT_REQUIRED,
    germline: { state: 'not-done' },
    familyRisk,
  }
}

// A test that is not needed for this patient, with the reason.
export function notNeeded(note: string): TestResult {
  return { state: 'not-required', note }
}

// One step of the treatment plan.
export function step(
  id: string,
  phase: string,
  lane: Lane,
  kind: StepKind,
  title: string,
  status: StepStatus,
  date: string,
  dependsOn: string[],
  more: Partial<TreatmentStep> = {},
): TreatmentStep {
  return { id, phase, lane, kind, title, status, date, dependsOn, ...more }
}

// Usual values of a healthy adult, used as the starting point of a patient's routine blood tests.
const NORMAL: Record<Sex, Partial<Record<LabId, number>>> = {
  Male: { hb: 14.6, wbc: 6.8, neut: 4.1, plt: 245, ferritin: 95, creat: 88, egfr: 86, urea: 5.4, na: 140, k: 4.3, ca: 2.36, alt: 24, ast: 22, alp: 76, bili: 10, albumin: 43, crp: 2.0 },
  Female: { hb: 13.4, wbc: 6.6, neut: 3.9, plt: 262, ferritin: 62, creat: 66, egfr: 92, urea: 4.9, na: 139, k: 4.2, ca: 2.34, alt: 20, ast: 21, alp: 72, bili: 9, albumin: 42, crp: 1.8 },
}

const DECIMALS: Partial<Record<LabId, number>> = { hb: 1, wbc: 1, neut: 1, urea: 1, k: 1, ca: 2, inr: 1, crp: 1, cea: 1, hba1c: 1 }

// A small fixed wobble (about +-2.5%) from the date and test name, so repeated tests do not
// show exactly the same number. Always the same for the same date and test.
function wobble(date: string, id: string): number {
  let h = 0
  for (const ch of date + id) h = (h * 31 + ch.charCodeAt(0)) % 1000
  return 1 + ((h / 1000) - 0.5) * 0.05
}

// Routine blood tests on the given dates: the normal values (or the patient's own usual values
// in "usual"), plus full series given in "series" for the tests that change (anemia, CEA ...).
export function routineLabs(
  sex: Sex,
  dates: string[],
  usual: Partial<Record<LabId, number>> = {},
  series: Partial<Record<LabId, [string, number][]>> = {},
  notDone: Partial<Record<LabId, string>> = {},
) {
  const base = { ...NORMAL[sex], ...usual }
  const values: Partial<Record<LabId, [string, number][]>> = {}
  for (const id of Object.keys(base) as LabId[]) {
    const d = DECIMALS[id] ?? 0
    values[id] = dates.map((date) => [date, Number((base[id]! * wobble(date, id)).toFixed(d))])
  }
  return makeLabs(sex, { ...values, ...series }, notDone)
}

// Symptoms at a visit. Not listed: "None". A symptom is [detail, since] (since = start date).
export function symptomList(given: Partial<Record<string, [string, string | null]>>): Symptom[] {
  return ['Bowel habit', 'Bleeding', 'Pain', 'Weight loss', 'Fatigue'].map((name) => {
    const [detail, since] = given[name] ?? [name === 'Bowel habit' ? 'Normal' : 'None', null]
    return { name, detail, since }
  }).concat(
    Object.entries(given)
      .filter(([name]) => !['Bowel habit', 'Bleeding', 'Pain', 'Weight loss', 'Fatigue'].includes(name))
      .map(([name, value]) => ({ name, detail: value![0], since: value![1] })),
  )
}
