// Page 1: the 3D colon fills the page. (Findings column, marking buttons and the pictures
// panel are added in the next step.)
import ColonViewer from '../components/ColonViewer'
import type { SegmentId } from '../data/segments'
import type { Finding, FindingKind } from '../types'

interface Props {
  findings: Finding[]
  selectedId: string | null
  onSelect: (id: string) => void
  markMode: FindingKind | null
  onMark: (kind: FindingKind, segment: SegmentId, position: [number, number, number]) => void
}

export default function ColonPage(props: Props) {
  return (
    <div className="page">
      <ColonViewer {...props} />
    </div>
  )
}
