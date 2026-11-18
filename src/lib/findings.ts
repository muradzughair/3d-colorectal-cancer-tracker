// Small helpers for showing findings: their names, pin numbers and sizes.
import type { Finding, Size } from '../types'

export interface FindingDisplay {
  name: string // e.g. "Polyp 2" or "Tumor"
  pinText: string // text inside the 3D pin ("2" for a polyp, "" for a single tumor)
}

// Polyps are numbered 1, 2, 3... in list order. A single tumor is just "Tumor";
// if there are several they are numbered too.
export function describeFindings(findings: Finding[]): Record<string, FindingDisplay> {
  const result: Record<string, FindingDisplay> = {}
  const tumorCount = findings.filter((f) => f.kind === 'tumor').length
  let polypNumber = 0
  let tumorNumber = 0
  for (const f of findings) {
    if (f.kind === 'polyp') {
      polypNumber++
      result[f.id] = { name: `Polyp ${polypNumber}`, pinText: String(polypNumber) }
    } else {
      tumorNumber++
      result[f.id] =
        tumorCount === 1
          ? { name: 'Tumor', pinText: '' }
          : { name: `Tumor ${tumorNumber}`, pinText: String(tumorNumber) }
    }
  }
  return result
}

export function formatSize(size: Size | null): string {
  return size ? `${size.value} ${size.unit}` : 'Not measured'
}

// Simple unique id for a new finding.
export function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}
