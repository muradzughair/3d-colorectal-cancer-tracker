// 3D colon page: the colon of the chosen visit fills the page. Floating over it: the pictures
// button (top left), the Polyp / Tumor marking buttons (bottom centre) and, on the right edge,
// the findings list. The pictures panel slides in from the left when the doctor opens it.
import { useState } from 'react'
import ColonViewer from '../components/ColonViewer'
import FindingsList from '../components/FindingsList'
import ImagePanel from '../components/ImagePanel'
import type { RecordStore } from '../data/record'
import type { SegmentId } from '../data/segments'
import { newId } from '../lib/findings'
import type { Finding, FindingKind, Visit } from '../types'

interface Props {
  store: RecordStore
  visit: Visit
  selectedId: string | null
  onSelect: (id: string) => void
  onClearSelection: () => void
  markMode: FindingKind | null
  onMarkMode: (kind: FindingKind | null) => void
}

export default function ColonPage({ store, visit, selectedId, onSelect, onClearSelection, markMode, onMarkMode }: Props) {
  const [panelOpen, setPanelOpen] = useState(false)
  const findings = visit.findings
  const pictureCount = visit.pictures.length

  // The doctor clicked the 3D colon in marking mode: add the mark, select it, leave marking mode.
  const addManualMark = (kind: FindingKind, segment: SegmentId, position: [number, number, number]) => {
    const mark: Finding = { id: newId(), kind, segment, size: null, source: 'manual', position }
    store.addFinding(visit.id, mark)
    onSelect(mark.id)
    onMarkMode(null)
  }

  const remove = (id: string) => {
    store.removeFinding(visit.id, id)
    if (selectedId === id) onClearSelection()
  }

  return (
    <div className="page">
      <ColonViewer findings={findings} selectedId={selectedId} onSelect={onSelect} markMode={markMode} onMark={addManualMark} />

      <button className="button pictures-button" onClick={() => setPanelOpen(true)}>
        {pictureCount > 0 ? `Pictures (${pictureCount})` : 'Add picture'}
      </button>

      <div className="mark-bar">
        <span className="muted">Mark by hand</span>
        {(['polyp', 'tumor'] as const).map((kind) => (
          <button
            key={kind}
            className={`mark-button mark-button-${kind}${markMode === kind ? ' is-active' : ''}`}
            onClick={() => onMarkMode(markMode === kind ? null : kind)}
          >
            {kind === 'polyp' ? 'Polyp' : 'Tumor'}
          </button>
        ))}
      </div>

      <aside className="findings-column">
        <h2>
          Findings <span className="count">{findings.length}</span>
        </h2>
        <FindingsList findings={findings} selectedId={selectedId} onSelect={onSelect} onRemove={remove} />
      </aside>

      {/* The panel stays built (so it keeps its state) but is slid out of view and not usable when closed. */}
      <aside className={`pictures-panel${panelOpen ? ' is-open' : ''}`} inert={!panelOpen} aria-label="Medical pictures">
        <ImagePanel
          pictures={visit.pictures}
          onPicture={(picture) => store.savePicture(visit.id, picture)}
          onImageFindings={(name, list) => store.setPictureFindings(visit.id, name, list)}
          onClose={() => setPanelOpen(false)}
        />
      </aside>
    </div>
  )
}
