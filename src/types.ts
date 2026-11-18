// Shared data shapes used across the app.
import type { SegmentId } from './data/segments'

export type FindingKind = 'polyp' | 'tumor'
export type ImageType = 'colonoscopy' | 'ct'

// Size as the AI reports it: polyps in mm, tumors in cm.
export interface Size {
  value: number
  unit: 'mm' | 'cm'
}

// One polyp or tumor shown in the findings list and on the 3D colon.
export interface Finding {
  id: string
  kind: FindingKind
  segment: SegmentId
  size: Size | null // null = not measured (manual marks)
  source: 'ai' | 'manual'
  imageName?: string // which picture an AI finding came from
  // Exact 3D point for manual marks. AI findings have none: their pin is placed at an
  // estimated spot in the segment.
  position?: [number, number, number]
}

// ---------- What the detector returns (see src/detector.ts) ----------

// Box around a polyp, in pixels of the original image.
export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface DetectedPolyp {
  box: Box
  size: Size
}

export interface DetectedTumor {
  outline: [number, number][] // polygon points in pixels of the original image
  size: Size
  segment: SegmentId // a CT scan shows where the tumor is
}

export interface DetectionResult {
  polyps: DetectedPolyp[]
  tumor: DetectedTumor | null
}
