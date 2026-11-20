// 3D colon page: the colon of the chosen visit fills the page. Floating over it: the pictures
// and fly-through buttons (top left), the Polyp / Tumor marking buttons (bottom centre) and,
// on the right edge, the findings list. The pictures panel slides in from the left.
// Fly-through (demo): the camera flies inside the colon to the selected finding.
import { useState } from 'react'
import ColonViewer from '../components/ColonViewer'
import FindingsList from '../components/FindingsList'
import ImagePanel from '../components/ImagePanel'
import type { RecordStore } from '../data/record'
import type { SegmentId } from '../data/segments'
import { describeFindings, newId } from '../lib/findings'
import { getSegment } from '../data/segments'
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
  const [flyingId, setFlyingId] = useState<string | null>(null) // the finding the fly-through shows
  const findings = visit.findings
  const names = describeFindings(findings)
  const selected = findings.find((f) => f.id === selectedId) ?? null
  const flying = findings.find((f) => f.id === flyingId) ?? null
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
      <ColonViewer
        findings={findings}
        selectedId={selectedId}
        onSelect={flying ? () => {} : onSelect}
        markMode={flying ? null : markMode}
        onMark={addManualMark}
        flyTo={flying}
      />

      {/* During the fly-through only the inside view, the note and the way back are shown. */}
      {flying ? (
        <>
          <p className="fly-title">
            Inside view: <strong>{names[flying.id].name}</strong> · {getSegment(flying.segment).name}
          </p>
          <div className="fly-bar">
            <span className="fly-note">Demo fly-through, not built from real scan data.</span>
            <button className="button" onClick={() => setFlyingId(null)}>
              Back to outside view
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="top-buttons">
            <button className="button" onClick={() => setPanelOpen(true)}>
              Pictures ({pictureCount})
            </button>
            <button
              className="button button-light"
              disabled={!selected}
              title={selected ? undefined : 'Select a finding in the list first'}
              onClick={() => selected && setFlyingId(selected.id)}
            >
              {selected ? `Fly-through to ${names[selected.id].name}` : 'Fly-through'}
            </button>
          </div>

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
            <FindingsList
              findings={findings}
              selectedId={selectedId}
              onSelect={onSelect}
              onChange={(id, change) => store.updateFinding(visit.id, id, change)}
              onRemove={remove}
            />
          </aside>
        </>
      )}

      {/* The panel stays built (so it keeps its state) but is slid out of view and not usable when closed. */}
      <aside className={`pictures-panel${panelOpen ? ' is-open' : ''}`} inert={!panelOpen} aria-label="Medical pictures">
        <ImagePanel visit={visit} onClose={() => setPanelOpen(false)} />
      </aside>
    </div>
  )
}
