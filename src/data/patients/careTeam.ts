// The (fictional) hospital team shared by the demo patients. Each patient's file picks the
// members who look after them and adds their own family doctor.
import type { CareTeamMember } from '../../profileTypes'

export const SURGEON: CareTeamMember = { role: 'Colorectal surgeon', name: 'Dr. Khaled Saleh', clinic: 'Colorectal Surgery Clinic' }
export const ONCOLOGIST: CareTeamMember = { role: 'Medical oncologist', name: 'Dr. Rania Farouk', clinic: 'Oncology Day Unit' }
export const RADIATION_ONCOLOGIST: CareTeamMember = { role: 'Radiation oncologist', name: 'Dr. Tamer Hijazi', clinic: 'Radiotherapy Department' }
export const GASTROENTEROLOGIST: CareTeamMember = { role: 'Gastroenterologist', name: 'Dr. Hani Barakat', clinic: 'Endoscopy Unit' }
export const PATHOLOGIST: CareTeamMember = { role: 'Pathologist', name: 'Dr. Lina Odeh', clinic: 'Pathology Department' }
export const NURSE: CareTeamMember = { role: 'Colorectal nurse specialist', name: 'Nurse Maha Daoud', clinic: 'Colorectal Nurse Clinic' }
export const ONCOLOGY_NURSE: CareTeamMember = { role: 'Oncology nurse', name: 'Nurse Huda Kamal', clinic: 'Oncology Day Unit' }
export const CARDIOLOGIST: CareTeamMember = { role: 'Cardiologist', name: 'Dr. Fadi Rashed', clinic: 'Cardiology Clinic' }

// "Not involved" placeholder for a role that does not look after this patient.
export function notInvolved(role: string): CareTeamMember {
  return { role, name: 'Not involved', clinic: 'Not applicable' }
}
