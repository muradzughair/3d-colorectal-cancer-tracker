// The fifteen fictional demo patients. Each has a profile (the Patient page, read-only), the
// treatment plan (steps), and how their visits are built:
//   - demoVisits: pictures that go through the detector in demo mode (patient 1 only)
//   - visits: visits with findings written by hand and no pictures (all the others)
import type { PatientProfile } from '../../profileTypes'
import type { TreatmentStep, Visit } from '../../types'
import { DEMO_STEPS, DEMO_VISITS, type DemoVisit } from '../demoPatient'
import { PROFILE_1001 } from './pt1001'
import { PROFILE_1002, STEPS_1002, VISITS_1002 } from './pt1002'
import { PROFILE_1003, STEPS_1003, VISITS_1003 } from './pt1003'
import { PROFILE_1004, STEPS_1004, VISITS_1004 } from './pt1004'
import { PROFILE_1005, STEPS_1005, VISITS_1005 } from './pt1005'
import { PROFILE_1006, STEPS_1006, VISITS_1006 } from './pt1006'
import { PROFILE_1007, STEPS_1007, VISITS_1007 } from './pt1007'
import { PROFILE_1008, STEPS_1008, VISITS_1008 } from './pt1008'
import { PROFILE_1009, STEPS_1009, VISITS_1009 } from './pt1009'
import { PROFILE_1010, STEPS_1010, VISITS_1010 } from './pt1010'
import { PROFILE_1011, STEPS_1011, VISITS_1011 } from './pt1011'
import { PROFILE_1012, STEPS_1012, VISITS_1012 } from './pt1012'
import { PROFILE_1013, STEPS_1013, VISITS_1013 } from './pt1013'
import { PROFILE_1014, STEPS_1014, VISITS_1014 } from './pt1014'
import { PROFILE_1015, STEPS_1015, VISITS_1015 } from './pt1015'

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
  { profile: PROFILE_1006, steps: STEPS_1006, visits: VISITS_1006 },
  { profile: PROFILE_1007, steps: STEPS_1007, visits: VISITS_1007 },
  { profile: PROFILE_1008, steps: STEPS_1008, visits: VISITS_1008 },
  { profile: PROFILE_1009, steps: STEPS_1009, visits: VISITS_1009 },
  { profile: PROFILE_1010, steps: STEPS_1010, visits: VISITS_1010 },
  { profile: PROFILE_1011, steps: STEPS_1011, visits: VISITS_1011 },
  { profile: PROFILE_1012, steps: STEPS_1012, visits: VISITS_1012 },
  { profile: PROFILE_1013, steps: STEPS_1013, visits: VISITS_1013 },
  { profile: PROFILE_1014, steps: STEPS_1014, visits: VISITS_1014 },
  { profile: PROFILE_1015, steps: STEPS_1015, visits: VISITS_1015 },
]

// Look up a patient by id ("PT-1001"); undefined if there is none.
export function getPatient(id: string): PatientData | undefined {
  return PATIENTS.find((p) => p.profile.id === id)
}
