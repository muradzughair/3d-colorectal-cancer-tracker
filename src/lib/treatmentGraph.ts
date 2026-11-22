// Layout of the treatment plan graph: where each phase column, step node, link line and the
// "Today" marker go. Time runs left to right: phases are ordered by their first date, and
// inside a phase the steps are ordered by date. Lanes are the rows (Procedures, Medicine,
// Imaging and tests, Reviews). Steps on the same date in different lanes share a column, so
// parallel steps (for example radiotherapy and capecitabine) sit at the same position.
import type { Lane, StepStatus, TreatmentStep } from '../types'

export const LANES: { id: Lane; label: string }[] = [
  { id: 'procedures', label: 'Procedures' },
  { id: 'medicine', label: 'Medicine' },
  { id: 'imaging-tests', label: 'Imaging and tests' },
  { id: 'reviews', label: 'Reviews' },
]

export const STATUS_LABELS: Record<StepStatus, string> = {
  done: 'Done',
  'in-progress': 'In progress',
  planned: 'Planned',
}

// Sizes in pixels (before any zoom).
export const NODE_W = 236
const NODE_H = 58
const DOTS_H = 18 // extra height for the row of cycle dots
const COL_GAP = 30
const COL_W = NODE_W + COL_GAP
export const LANE_H = 100
export const HEAD_H = 54 // phase headers and the Today label above the lanes
const FOOT_H = 56 // free space under the lanes, so the floating Add step button covers no node
const PHASE_PAD = 14 // space inside a phase, left and right of its nodes
const PHASE_GAP = 18 // space between two phases
const EDGE_PAD = 24 // space at the left and right end of the graph

export interface PlacedNode {
  step: TreatmentStep
  x: number
  y: number
  w: number
  h: number
}

export interface PlacedPhase {
  name: string
  x: number
  width: number
}

export interface PlacedEdge {
  key: string
  from: string
  to: string
  path: string // SVG path of the smooth curved line
}

export interface GraphLayout {
  width: number
  height: number
  phases: PlacedPhase[]
  nodes: PlacedNode[]
  edges: PlacedEdge[]
  todayX: number
}

const laneIndex = (lane: Lane) => Math.max(0, LANES.findIndex((l) => l.id === lane))
const time = (date: string) => new Date(`${date}T00:00:00`).getTime()

// The phases in time order (by the earliest step date in each phase).
export function phaseOrder(steps: TreatmentStep[]): string[] {
  const first = new Map<string, string>()
  for (const s of steps) if (!first.has(s.phase) || s.date < first.get(s.phase)!) first.set(s.phase, s.date)
  return [...first.keys()].sort((a, b) => first.get(a)!.localeCompare(first.get(b)!))
}

export function layoutGraph(steps: TreatmentStep[], today: string): GraphLayout {
  const nodes: PlacedNode[] = []
  const phases: PlacedPhase[] = []
  const columns: { x: number; date: string }[] = [] // every column, in left-to-right order
  let x = EDGE_PAD

  for (const name of phaseOrder(steps)) {
    const inPhase = steps
      .filter((s) => s.phase === name)
      .sort((a, b) => a.date.localeCompare(b.date) || laneIndex(a.lane) - laneIndex(b.lane) || a.title.localeCompare(b.title))

    // Put each step in the current column, or start a new column when its lane is already
    // taken there, it follows a step in that column, or today falls between the two dates
    // (so the Today line can always pass between past and future steps).
    const cols: { lanes: Set<Lane>; ids: Set<string>; steps: TreatmentStep[] }[] = []
    for (const step of inPhase) {
      const last = cols[cols.length - 1]
      const acrossToday = last && last.steps[0].date <= today && step.date > today
      if (!last || acrossToday || last.lanes.has(step.lane) || step.dependsOn.some((d) => last.ids.has(d))) {
        cols.push({ lanes: new Set([step.lane]), ids: new Set([step.id]), steps: [step] })
      } else {
        last.lanes.add(step.lane)
        last.ids.add(step.id)
        last.steps.push(step)
      }
    }

    const phaseX = x
    cols.forEach((col, i) => {
      const colX = phaseX + PHASE_PAD + i * COL_W
      columns.push({ x: colX, date: col.steps[0].date })
      for (const step of col.steps) {
        const h = NODE_H + (step.cycles?.length ? DOTS_H : 0)
        nodes.push({ step, x: colX, y: HEAD_H + laneIndex(step.lane) * LANE_H + (LANE_H - h) / 2, w: NODE_W, h })
      }
    })
    const width = PHASE_PAD * 2 + Math.max(1, cols.length) * COL_W - COL_GAP
    phases.push({ name, x: phaseX, width })
    x += width + PHASE_GAP
  }

  // Link lines: from the right side of a step to the left side of the step that follows it.
  const byId = new Map(nodes.map((n) => [n.step.id, n]))
  const edges: PlacedEdge[] = []
  for (const node of nodes) {
    for (const dep of node.step.dependsOn) {
      const from = byId.get(dep)
      if (!from) continue
      const x1 = from.x + from.w
      const y1 = from.y + from.h / 2
      const x2 = node.x
      const y2 = node.y + node.h / 2
      // A gentle S-curve; if the next step is not to the right (unusual data), loop around.
      const bend = x2 > x1 ? Math.max(24, (x2 - x1) / 2) : 60
      edges.push({
        key: `${dep}-${node.step.id}`,
        from: dep,
        to: node.step.id,
        path: `M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`,
      })
    }
  }

  // The "Today" line: between the last column dated up to today and the first one after it.
  const t = time(today)
  let todayX: number
  const next = columns.findIndex((c) => time(c.date) > t)
  if (columns.length === 0) todayX = EDGE_PAD
  else if (next === 0) todayX = columns[0].x - COL_GAP / 2
  else if (next === -1) todayX = columns[columns.length - 1].x + NODE_W + COL_GAP / 2
  else {
    const a = columns[next - 1]
    const b = columns[next]
    const f = Math.min(1, Math.max(0, (t - time(a.date)) / (time(b.date) - time(a.date) || 1)))
    // Keep the line in the gap between the two columns, so it never crosses a node's text.
    const left = a.x + NODE_W + 6
    const right = b.x - 6
    todayX = right > left ? left + f * (right - left) : (a.x + NODE_W + b.x) / 2
  }

  const width = Math.max(x - PHASE_GAP + EDGE_PAD, todayX + 60)
  return { width, height: HEAD_H + LANES.length * LANE_H + FOOT_H, phases, nodes, edges, todayX }
}

// "12 Feb 2026", "Feb 2027" for a month-only date, or "14 Sep 2026 to 23 Oct 2026".
export function stepDateText(step: TreatmentStep, format: (d: string) => string): string {
  const start = step.monthOnly
    ? new Date(`${step.date}T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : format(step.date)
  return step.endDate ? `${start} to ${format(step.endDate)}` : start
}

// "Cycle 10 of 12" for a treatment, "3 of 4 done" for a repeated test.
export function cycleText(step: TreatmentStep): string {
  const cycles = step.cycles ?? []
  const done = cycles.filter((c) => c.status === 'done').length
  return step.kind === 'lab' || step.kind === 'imaging' ? `${done} of ${cycles.length} done` : `Cycle ${done} of ${cycles.length}`
}
