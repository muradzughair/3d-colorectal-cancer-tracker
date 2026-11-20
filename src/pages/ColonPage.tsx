// Page 1: the 3D colon fills the page. Floating over it: the pictures button (top left),
// the Polyp / Tumor marking buttons (bottom centre) and, on the right edge, the findings list.
// The pictures panel slides in from the left when the doctor opens it.
import { useState } from 'react'
import ColonViewer from '../components/ColonViewer'
import FindingsList from '../components/FindingsList'
import ImagePanel from '../components/ImagePanel'
import type { SegmentId } from '../data/segments'
import type { Finding, FindingKind, Picture } from '../types'

interface Props {
  findings: Finding[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  markMode: FindingKind | null
  onToggleMark: (kind: FindingKind) => void
  onMark: (kind: FindingKind, segment: SegmentId, position: [number, number, number]) => void
  pictures: Picture[]
  onPicture: (picture: Picture) => void
  onImageFindings: (imageName: string, findings: Finding[]) => void
}

export default function ColonPage(props: Props) {
  const { findings, markMode, pictures } = props
  const [panelOpen, setPanelOpen] = useState(false)
  const analysed = pictures.filter((p) => p.result).length // pictures the detector gave a result for

  return (
    <div className="page">
      <ColonViewer findings={findings} selectedId={props.selectedId} onSelect={props.onSelect} markMode={markMode} onMark={props.onMark} />

      <button className="button pictures-button" onClick={() => setPanelOpen(true)}>
        {analysed > 0 ? `Pictures (${analysed})` : 'Add picture'}
      </button>

      <div className="mark-bar">
        <span className="muted">Mark by hand</span>
        {(['polyp', 'tumor'] as const).map((kind) => (
          <button
            key={kind}
            className={`mark-button mark-button-${kind}${markMode === kind ? ' is-active' : ''}`}
            onClick={() => props.onToggleMark(kind)}
          >
            {kind === 'polyp' ? 'Polyp' : 'Tumor'}
          </button>
        ))}
      </div>

      <aside className="findings-column">
        <h2>
          Findings <span className="count">{findings.length}</span>
        </h2>
        <FindingsList findings={findings} selectedId={props.selectedId} onSelect={props.onSelect} onRemove={props.onRemove} />
      </aside>

      {/* The panel stays built (so it keeps its state) but is slid out of view and not usable when closed. */}
      <aside className={`pictures-panel${panelOpen ? ' is-open' : ''}`} inert={!panelOpen} aria-label="Medical pictures">
        <ImagePanel
          pictures={pictures}
          onPicture={props.onPicture}
          onImageFindings={props.onImageFindings}
          onClose={() => setPanelOpen(false)}
        />
      </aside>
    </div>
  )
}
