// Small read-only helpers for showing a patient's data (patient list, Patient page, top bar).
// They only pick values from the data; the only automatic mark is the reference-range flag.
import type { PatientData } from '../data/patients'
import type { Appointment, LabTest, Medication, PatientProfile, PatientStatus } from '../profileTypes'
import { today } from './dates'

// The date of the newest visit in the demo data (the doctor cannot add visits).
export function lastVisitDate(data: PatientData): string {
  const dates = (data.demoVisits ?? data.visits ?? []).map((v) => v.date).sort()
  return dates[dates.length - 1] ?? ''
}

// The first appointment from today on, or null if none is booked.
export function nextAppointment(profile: PatientProfile): Appointment | null {
  const now = today()
  return profile.appointments.find((a) => a.date >= now) ?? null
}

// Blood thinners and antiplatelets the patient takes now (the group is stored in the data).
export function currentBloodThinners(profile: PatientProfile): Medication[] {
  return profile.medications.filter((m) => m.group === 'Blood thinners and antiplatelets' && !m.stopped)
}

// "H" above the reference range, "L" below it, otherwise null.
export function labFlag(test: LabTest, value: number): 'H' | 'L' | null {
  if (test.high !== null && value > test.high) return 'H'
  if (test.low !== null && value < test.low) return 'L'
  return null
}

// The reference range as text, e.g. "12.0-15.5", "< 5.0" or "> 60".
export function rangeText(test: LabTest): string {
  if (test.low !== null && test.high !== null) return `${test.low}-${test.high}`
  if (test.high !== null) return `< ${test.high}`
  if (test.low !== null) return `> ${test.low}`
  return 'Not available'
}

export function findLab(profile: PatientProfile, id: string): LabTest | undefined {
  return profile.labs.find((t) => t.id === id)
}

// Body mass index from height and the newest weight, rounded to 1 decimal.
export function bmi(profile: PatientProfile): number | null {
  const weight = profile.lifestyle.weights[profile.lifestyle.weights.length - 1]
  const meters = profile.lifestyle.heightCm.value / 100
  return weight && meters > 0 ? Math.round((weight.kg / (meters * meters)) * 10) / 10 : null
}

// CSS class for a status label (each status has its own calm colour, never red or blue).
export function statusClass(status: PatientStatus): string {
  return `status-label status-${status.toLowerCase().replace(/[^a-z]+/g, '-')}`
}

// A lab value with the same number of decimals as the test's other values ("1.0", not "1").
export function formatLabValue(test: LabTest, value: number): string {
  const decimals = Math.max(0, ...test.results.map((r) => (String(r.value).split('.')[1] ?? '').length))
  return value.toFixed(decimals)
}
