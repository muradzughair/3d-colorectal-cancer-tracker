// The treatment plan. The doctor chooses an action for every finding; the AI never suggests one.
import type { FindingKind } from '../types'

export type PlanAction = 'remove-polyp' | 'monitor' | 'surgery' | 'oncology' | 'undecided'

// The actions the doctor can choose from, for each kind of finding.
export const PLAN_ACTIONS: Record<FindingKind, { id: PlanAction; label: string }[]> = {
  polyp: [
    { id: 'remove-polyp', label: 'Remove (polypectomy)' },
    { id: 'monitor', label: 'Monitor' },
    { id: 'undecided', label: 'Not decided' },
  ],
  tumor: [
    { id: 'surgery', label: 'Surgery (remove segment)' },
    { id: 'oncology', label: 'Referred to oncology' },
    { id: 'undecided', label: 'Not decided' },
  ],
}

// One row of the plan (one finding).
export interface PlanItem {
  action: PlanAction
  date: string // planned date, e.g. "2026-12-01" (empty = none)
  notes: string
}

export const EMPTY_PLAN_ITEM: PlanItem = { action: 'undecided', date: '', notes: '' }

// The plan is stored by finding id. A finding without an entry is "Not decided".
export type Plan = Record<string, PlanItem>

export function planFor(plan: Plan, findingId: string): PlanItem {
  return plan[findingId] ?? EMPTY_PLAN_ITEM
}
