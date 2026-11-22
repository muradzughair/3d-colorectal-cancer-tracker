// Compare the findings of two visits. The same finding on two dates is matched by its kind
// and segment (the 1st polyp in the sigmoid colon on one date with the 1st one on the other).
import type { SegmentId } from '../data/segments'
import type { Finding, FindingKind, Size } from '../types'

export interface ChangeRow {
  key: string
  kind: FindingKind
  label: string // "Polyp", or "Polyp #2" when a segment has more than one
  segment: SegmentId
  before?: Finding // on the first date (missing = not seen then)
  after?: Finding // on the second date
  change: string // "+2 mm", "−1.1 cm", "No change", "New", "Not seen", "Not measured"
}

// "polyp|sigmoid|0" for the first polyp in the sigmoid colon, and so on.
function keyed(findings: Finding[]): Map<string, Finding> {
  const count: Record<string, number> = {}
  const map = new Map<string, Finding>()
  for (const f of findings) {
    const base = `${f.kind}|${f.segment}`
    const index = count[base] ?? 0
    count[base] = index + 1
    map.set(`${base}|${index}`, f)
  }
  return map
}

// Size difference, for example "+2 mm" or "−1.1 cm".
function sizeChange(a: Size | null, b: Size | null): string {
  if (!a || !b || a.unit !== b.unit) return 'Not measured'
  const diff = Number((b.value - a.value).toFixed(1))
  if (diff === 0) return 'No change'
  return `${diff > 0 ? '+' : '−'}${Math.abs(diff)} ${a.unit}`
}

export function compareFindings(before: Finding[], after: Finding[]): ChangeRow[] {
  const a = keyed(before)
  const b = keyed(after)
  const keys = [...new Set([...a.keys(), ...b.keys()])]
  return keys.map((key) => {
    const [kind, segment, index] = key.split('|')
    const first = a.get(key)
    const second = b.get(key)
    return {
      key,
      kind: kind as FindingKind,
      segment: segment as SegmentId,
      label: `${kind === 'polyp' ? 'Polyp' : 'Tumor'}${index === '0' ? '' : ` #${Number(index) + 1}`}`,
      before: first,
      after: second,
      change: !first ? 'New' : !second ? 'Not seen' : sizeChange(first.size, second.size),
    }
  })
}
