// Lesion codes and text, the same on every page: P1, P2 ... for polyps and T1, T2 ... for
// tumors, numbered per patient in order of distance from the anal verge. The same lesion on
// different visits (matched by kind and segment, as on the Before/after page) keeps its code.
import { getSegment, type SegmentId } from '../data/segments'
import { cmText, middleCm } from './colonDistance'
import { formatSize } from './findings'
import type { Finding, FindingKind, ParisType, ResectionMethod, TumorMorphology, Visit } from '../types'

export interface LesionCode {
  code: string // "P1" or "T1"
  key: string // the lesion across visits: "polyp|sigmoid|0"
}

// "polyp|sigmoid|0" for the first polyp in the sigmoid colon of a visit, and so on.
export function lesionKeys(findings: Finding[]): Record<string, string> {
  const count: Record<string, number> = {}
  const keys: Record<string, string> = {}
  for (const f of findings) {
    const base = `${f.kind}|${f.segment}`
    keys[f.id] = `${base}|${count[base] ?? 0}`
    count[base] = (count[base] ?? 0) + 1
  }
  return keys
}

// Codes for every finding of every visit of one patient (by finding id).
export function lesionCodes(visits: Visit[]): Record<string, LesionCode> {
  // Each lesion's distance: the first recorded distance, else the middle of its part.
  const lesions = new Map<string, { kind: FindingKind; cm: number; hasCm: boolean }>()
  for (const visit of visits) {
    const keys = lesionKeys(visit.findings)
    for (const f of visit.findings) {
      const known = lesions.get(keys[f.id])
      if (!known) lesions.set(keys[f.id], { kind: f.kind, cm: f.distanceFromAnalVergeCm ?? middleCm(f.segment), hasCm: f.distanceFromAnalVergeCm !== undefined })
      else if (!known.hasCm && f.distanceFromAnalVergeCm !== undefined) Object.assign(known, { cm: f.distanceFromAnalVergeCm, hasCm: true })
    }
  }
  const codeOf = new Map<string, string>()
  for (const kind of ['polyp', 'tumor'] as const) {
    ;[...lesions.entries()]
      .filter(([, l]) => l.kind === kind)
      .sort((a, b) => a[1].cm - b[1].cm)
      .forEach(([key], i) => codeOf.set(key, `${kind === 'polyp' ? 'P' : 'T'}${i + 1}`))
  }
  const result: Record<string, LesionCode> = {}
  for (const visit of visits) {
    const keys = lesionKeys(visit.findings)
    for (const f of visit.findings) result[f.id] = { code: codeOf.get(keys[f.id]) ?? '?', key: keys[f.id] }
  }
  return result
}

// "P1 Polyp" or "T1 Tumor".
export function lesionName(f: Finding, codes: Record<string, LesionCode>): string {
  return `${codes[f.id]?.code ?? '?'} ${f.kind === 'polyp' ? 'Polyp' : 'Tumor'}`
}

// Lesions removed on an earlier visit that are not seen any more on this visit. They are
// shown as faint grey crossed rings on the visits after the removal.
export function removedBefore(visits: Visit[], visit: Visit): { finding: Finding; visit: Visit }[] {
  const present = new Set(Object.values(lesionKeys(visit.findings)))
  const result = new Map<string, { finding: Finding; visit: Visit }>()
  for (const earlier of visits) {
    if (earlier.date >= visit.date) continue
    const keys = lesionKeys(earlier.findings)
    for (const f of earlier.findings) {
      const r = f.resection
      const removed = r && r.complete && r.method !== 'biopsy' && r.method !== 'none' && r.date < visit.date
      if (removed && !present.has(keys[f.id])) result.set(keys[f.id], { finding: f, visit: earlier })
    }
  }
  return [...result.values()]
}

// The size in mm (tumors are stored in cm).
export function sizeMmText(f: Finding): string {
  if (!f.size) return 'size not measured'
  return f.size.unit === 'cm' ? `${Math.round(f.size.value * 10)} mm` : formatSize(f.size)
}

// Short part names for labels.
const SHORT_PART: Partial<Record<SegmentId, string>> = {
  ascending: 'Ascending',
  transverse: 'Transverse',
  descending: 'Descending',
  sigmoid: 'Sigmoid',
  hepatic: 'Hepatic flexure',
  splenic: 'Splenic flexure',
}

export function isMeasured(f: Finding): boolean {
  return f.locationBasis === 'measured' || f.locationBasis === 'surgery-confirmed'
}

// The one-line label: "P1 - Polyp - 8 mm - Sigmoid - ~30 cm". cm is the finding's own
// distance, or the distance worked out from its place on the model (always approximate).
export function labelText(f: Finding, code: string, modelCm: number | null): string {
  const cm = f.distanceFromAnalVergeCm ?? modelCm
  const parts = [code, f.kind === 'polyp' ? 'Polyp' : 'Tumor', sizeMmText(f), SHORT_PART[f.segment] ?? getSegment(f.segment).name]
  if (cm !== null && cm !== undefined) parts.push(cmText(cm, f.distanceFromAnalVergeCm !== undefined && isMeasured(f), true))
  return parts.join(' - ')
}

export const BASIS_LABELS = { estimated: 'Estimated', measured: 'Measured', 'surgery-confirmed': 'Confirmed at surgery' } as const

// Paris classification, with a short plain description of each type.
export const PARIS: { id: ParisType; name: string; description: string }[] = [
  { id: '0-Ip', name: 'Pedunculated', description: 'A rounded head on a narrow stalk.' },
  { id: '0-Isp', name: 'Subpedunculated', description: 'A head on a short, wide stalk.' },
  { id: '0-Is', name: 'Sessile', description: 'Broad base, rises more than 2.5 mm, no stalk.' },
  { id: '0-IIa', name: 'Slightly elevated', description: 'Flat plateau, less than 2.5 mm high.' },
  { id: '0-IIb', name: 'Flat', description: 'Almost no relief; seen as a change in colour or surface.' },
  { id: '0-IIc', name: 'Slightly depressed', description: 'A shallow dip, usually with a slightly raised edge.' },
  { id: '0-IIa+IIc', name: 'Elevated with central depression', description: 'A low plateau with a dip in the middle.' },
  { id: '0-III', name: 'Excavated', description: 'An ulcer crater.' },
]

export const MORPHOLOGY: { id: TumorMorphology; name: string }[] = [
  { id: 'polypoid-fungating', name: 'Polypoid (fungating)' },
  { id: 'ulcerated', name: 'Ulcerated' },
  { id: 'annular-stenosing', name: 'Annular (ring-shaped, narrowing)' },
  { id: 'flat-infiltrating', name: 'Flat (infiltrating)' },
]

export const RESECTION_METHODS: { id: ResectionMethod; name: string }[] = [
  { id: 'snare', name: 'Snare polypectomy' },
  { id: 'EMR', name: 'Endoscopic mucosal resection (EMR)' },
  { id: 'ESD', name: 'Endoscopic submucosal dissection (ESD)' },
  { id: 'biopsy', name: 'Biopsy only' },
  { id: 'surgery', name: 'Surgery' },
  { id: 'none', name: 'Not removed' },
]

export const LUMEN_LABELS = { open: 'Open', narrowed: 'Narrowed', 'nearly-blocked': 'Nearly blocked' } as const
