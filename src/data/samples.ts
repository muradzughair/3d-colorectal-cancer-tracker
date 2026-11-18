// The sample pictures in public/samples. Replace the image files there with real ones
// (same file names), and update public/samples/results.json to match.
import type { ImageType } from '../types'

export interface Sample {
  file: string
  label: string // full name, shown under the picture and in the findings list
  short: string // short name under the small thumbnail
  type: ImageType
}

export const SAMPLES: Sample[] = [
  { file: 'colonoscopy-1.png', label: 'Colonoscopy sample 1', short: 'Sample 1', type: 'colonoscopy' },
  { file: 'colonoscopy-2.png', label: 'Colonoscopy sample 2', short: 'Sample 2', type: 'colonoscopy' },
  { file: 'ct-1.png', label: 'CT sample', short: 'CT sample', type: 'ct' },
]
