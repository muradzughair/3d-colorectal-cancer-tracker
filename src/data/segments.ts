// Colon segments: friendly names, colours, and which model part belongs to which segment.

export type SegmentId =
  | 'cecum'
  | 'ascending'
  | 'hepatic'
  | 'transverse'
  | 'splenic'
  | 'descending'
  | 'sigmoid'
  | 'rectum'
  | 'appendix'

export interface Segment {
  id: SegmentId
  name: string // name shown to the doctor
  color: string // tissue colour on the 3D model (very slightly different per segment)
  part: string // main part name inside colon.glb
}

// Listed in anatomical order (from the start of the colon to the end).
export const SEGMENTS: Segment[] = [
  { id: 'cecum', name: 'Cecum', color: '#e39894', part: 'VH_F_caecum' },
  { id: 'appendix', name: 'Appendix', color: '#ecb0aa', part: 'VH_F_vermiform_appendix' },
  { id: 'ascending', name: 'Ascending colon', color: '#e49b97', part: 'VH_F_ascending_colon' },
  { id: 'hepatic', name: 'Hepatic flexure', color: '#e59e99', part: 'VH_F_hepatic_flexure_of_colon' },
  { id: 'transverse', name: 'Transverse colon', color: '#e49a97', part: 'VH_F_transverse_colon' },
  { id: 'splenic', name: 'Splenic flexure', color: '#e29794', part: 'VH_F_splenic_flexure_of_colon' },
  { id: 'descending', name: 'Descending colon', color: '#e09391', part: 'VH_F_descending_colon' },
  { id: 'sigmoid', name: 'Sigmoid colon', color: '#dc8c8c', part: 'VH_F_sigmoid_colon' },
  { id: 'rectum', name: 'Rectum', color: '#cf777c', part: 'VH_F_rectum' },
]

// Every part name in the model mapped to its segment.
// The ileocecal valve is treated as part of the cecum.
export const PART_TO_SEGMENT: Record<string, SegmentId> = {
  VH_F_caecum: 'cecum',
  VH_F_ileocecal_valve: 'cecum',
  VH_F_vermiform_appendix: 'appendix',
  VH_F_ascending_colon: 'ascending',
  VH_F_hepatic_flexure_of_colon: 'hepatic',
  VH_F_transverse_colon: 'transverse',
  VH_F_splenic_flexure_of_colon: 'splenic',
  VH_F_descending_colon: 'descending',
  VH_F_sigmoid_colon: 'sigmoid',
  VH_F_rectum: 'rectum',
}

// Look up a segment by its id.
export function getSegment(id: SegmentId): Segment {
  return SEGMENTS.find((s) => s.id === id)!
}
