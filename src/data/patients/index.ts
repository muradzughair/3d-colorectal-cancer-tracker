// The five fictional demo patients. Each has a profile (the Patient page, read-only), the
// treatment plan (steps), and how their visits are built:
//   - demoVisits: pictures that go through the detector in demo mode (patient 1 only)
//   - visits: visits with findings written by hand and no pictures (the other four)
import type { PatientProfile } from '../../profileTypes'
import type { TreatmentStep, Visit } from '../../types'
import { DEMO_STEPS, DEMO_VISITS, type DemoVisit } from '../demoPatient'
import { PROFILE_1001 } from './pt1001'
import { PROFILE_1002, STEPS_1002, VISITS_1002 } from './pt1002'
import { PROFILE_1003, STEPS_1003, VISITS_1003 } from './pt1003'
import { PROFILE_1004, STEPS_1004, VISITS_1004 } from './pt1004'
import { PROFILE_1005, STEPS_1005, VISITS_1005 } from './pt1005'

export interface PatientData {
  profile: PatientProfile
  steps: TreatmentStep[]
  demoVisits?: DemoVisit[]
  visits?: Visit[]
}

export const PATIENTS: PatientData[] = [
  { profile: PROFILE_1001, steps: DEMO_STEPS, demoVisits: DEMO_VISITS },
  { profile: PROFILE_1002, steps: STEPS_1002, visits: VISITS_1002 },
  { profile: PROFILE_1003, steps: STEPS_1003, visits: VISITS_1003 },
  { profile: PROFILE_1004, steps: STEPS_1004, visits: VISITS_1004 },
  { profile: PROFILE_1005, steps: STEPS_1005, visits: VISITS_1005 },
]

// Look up a patient by id ("PT-1001"); undefined if there is none.
export function getPatient(id: string): PatientData | undefined {
  return PATIENTS.find((p) => p.profile.id === id)
}
