// 3D colon page (the main page): the colon of the chosen visit fills the page.
// A switch at the top chooses the view:
//   - Outside: the 3D colon with pins (rotate and zoom), and the Polyp / Tumor marking buttons.
//   - Inside: a simulated endoscopy along the colon (see InsideView).
// The Pictures button (top left) opens the visit's pictures; the findings list is on the right.
import { useState } from 'react'
import ColonViewer from '../components/ColonViewer'
import FindingsList from '../components/FindingsList'
import ImagePanel from '../components/ImagePanel'
import InsideView from '../components/InsideView'
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
  const [view, setView] = useState<'outside' | 'inside'>('outside')
  const findings = visit.findings

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

  const chooseView = (next: 'outside' | 'inside') => {
    setView(next)
    onMarkMode(null) // marking is only for the outside view
  }

  return (
    <div className="page">
      {view === 'outside' ? (
        <ColonViewer findings={findings} selectedId={selectedId} onSelect={onSelect} markMode={markMode} onMark={addManualMark} />
      ) : (
        <InsideView findings={findings} />
      )}

      <div className="top-buttons">
        <button className="button" onClick={() => setPanelOpen(true)}>
          Pictures ({visit.pictures.length})
        </button>
      </div>

      <div className="type-switch view-switch" role="group" aria-label="View">
        <button className={view === 'outside' ? 'is-active' : ''} onClick={() => chooseView('outside')}>
          Outside
        </button>
        <button className={view === 'inside' ? 'is-active' : ''} onClick={() => chooseView('inside')}>
          Inside
        </button>
      </div>

      {view === 'outside' && (
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
      )}

      <aside className="findings-column">
        <h2>
          Findings <span className="count">{findings.length}</span>
        </h2>
        <FindingsList
          findings={findings}
          selectedId={selectedId}
          onSelect={onSelect}
          onChange={(id, change) => store.updateFinding(visit.id, id, change)}
          onRemove={remove}
        />
      </aside>

      {/* The panel stays built (so it keeps its state) but is slid out of view and not usable when closed. */}
      <aside className={`pictures-panel${panelOpen ? ' is-open' : ''}`} inert={!panelOpen} aria-label="Pictures">
        <ImagePanel visit={visit} onClose={() => setPanelOpen(false)} />
      </aside>
    </div>
  )
}
