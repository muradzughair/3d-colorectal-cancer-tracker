// Small helpers for findings: sizes, new ids, and the findings the AI gives for a picture.
// (Lesion codes like P1 and T1 are in lesions.ts.)
import type { Finding, Picture, Size } from '../types'

export function formatSize(size: Size | null): string {
  return size ? `${size.value} ${size.unit}` : 'Not measured'
}

// Simple unique id for a new finding.
export function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

// The findings the AI reported for one picture. A colonoscopy picture only gives findings
// once the doctor has chosen its segment; a CT scan reports the tumor's segment itself.
// The ids come from the picture file ("v4-colonoscopy-ascending-polyp-1"), so they are the
// same every time the record is built and other data (the treatment plan) can link to them.
export function findingsFromPicture(picture: Picture): Finding[] {
  const result = picture.result
  if (!result) return []
  const base = picture.file.replace(/\.[a-z]+$/i, '')
  if (picture.type === 'ct') {
    const tumor = result.tumor
    return tumor
      ? [{ id: `${base}-tumor`, kind: 'tumor', segment: tumor.segment, size: tumor.size, source: 'ai', imageName: picture.name, locationBasis: 'estimated' }]
      : []
  }
  const segment = picture.segment
  if (!segment) return []
  return result.polyps.map((p, i) => ({
    id: `${base}-polyp-${i + 1}`,
    kind: 'polyp',
    segment,
    size: p.size,
    source: 'ai',
    imageName: picture.name,
    locationBasis: 'estimated', // AI positions are always estimated
  }))
}
