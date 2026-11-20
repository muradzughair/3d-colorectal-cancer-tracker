// Small helpers for showing findings: their names, pin numbers and sizes.
import type { Finding, Picture, Size } from '../types'

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

// The findings the AI reported for one picture. A colonoscopy picture only gives findings
// once the doctor has chosen its segment; a CT scan reports the tumor's segment itself.
export function findingsFromPicture(picture: Picture): Finding[] {
  const result = picture.result
  if (!result) return []
  if (picture.type === 'ct') {
    const tumor = result.tumor
    return tumor
      ? [{ id: newId(), kind: 'tumor', segment: tumor.segment, size: tumor.size, source: 'ai', imageName: picture.name }]
      : []
  }
  const segment = picture.segment
  if (!segment) return []
  return result.polyps.map((p) => ({ id: newId(), kind: 'polyp', segment, size: p.size, source: 'ai', imageName: picture.name }))
}
