// 3D colon page (the main page): the colon of the chosen visit fills the page.
// A switch at the top chooses the view:
//   - Outside: the 3D colon with lesion markers (rotate and zoom), the Polyp / Tumor marking
//     buttons, and the flat colon map (bottom right, "Map" toggle).
//   - Inside: a simulated endoscopy with a free camera (see InsideView).
// Click a marker (or a mark on the map) to open the lesion's detail card on the right.
// The Pictures button (top left) opens the visit's pictures; the findings list is on the right.
import { useEffect, useMemo, useState } from 'react'
import ColonMap from '../components/ColonMap'
import ColonViewer from '../components/ColonViewer'
import FindingsList from '../components/FindingsList'
import ImagePanel from '../components/ImagePanel'
import InsideView from '../components/InsideView'
import LesionCard from '../components/LesionCard'
import NamesToggle from '../components/NamesToggle'
import type { RecordStore } from '../data/record'
import type { SegmentId } from '../data/segments'
import { middleCm } from '../lib/colonDistance'
import { newId } from '../lib/findings'
import { removedBefore, type LesionCode } from '../lib/lesions'
import type { GoTo } from '../PatientView'
import type { Finding, FindingKind, Visit } from '../types'

interface Props {
  store: RecordStore
  visit: Visit
  visits: Visit[] // all visits, oldest first (for lesions removed earlier)
  codes: Record<string, LesionCode>
  goTo: GoTo
  initialInside?: string | null // open in the Inside view at this finding ("Show inside" from another page)
  selectedId: string | null
  onSelect: (id: string) => void
  onClearSelection: () => void
  markMode: FindingKind | null
  onMarkMode: (kind: FindingKind | null) => void
}

export default function ColonPage({ store, visit, visits, codes, goTo, initialInside, selectedId, onSelect, onClearSelection, markMode, onMarkMode }: Props) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [view, setView] = useState<'outside' | 'inside'>(initialInside ? 'inside' : 'outside')
  const [insideFocus, setInsideFocus] = useState<string | null>(initialInside ?? null)
  const [cardId, setCardId] = useState<string | null>(null)
  const [mapOpen, setMapOpen] = useState(true)
  const [modelCm, setModelCm] = useState<Record<string, number>>({})
  const findings = visit.findings
  const removed = useMemo(() => removedBefore(visits, visit), [visits, visit])
  const removedFindings = useMemo(() => removed.map((r) => r.finding), [removed]) // kept stable for the 3D view

  // The card's lesion: a finding of this visit, or one removed on an earlier visit.
  const card =
    (cardId && findings.find((f) => f.id === cardId) && { finding: findings.find((f) => f.id === cardId)!, visit, removedLater: false }) ||
    (cardId && removed.find((r) => r.finding.id === cardId) && { ...removed.find((r) => r.finding.id === cardId)!, removedLater: true }) ||
    null

  // Esc closes the card.
  useEffect(() => {
    if (!cardId) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCardId(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cardId])

  // A marker was clicked: select the lesion and open its card.
  const openLesion = (id: string) => {
    if (findings.some((f) => f.id === id) && selectedId !== id) onSelect(id)
    setCardId(id)
  }

  // The doctor clicked the 3D colon in marking mode: add the mark, select it, leave marking mode.
  const addManualMark = (kind: FindingKind, segment: SegmentId, position: [number, number, number]) => {
    const mark: Finding = { id: newId(), kind, segment, size: null, source: 'manual', position, locationBasis: 'estimated' }
    store.addFinding(visit.id, mark)
    onSelect(mark.id)
    onMarkMode(null)
  }

  const remove = (id: string) => {
    store.removeFinding(visit.id, id)
    if (selectedId === id) onClearSelection()
    if (cardId === id) setCardId(null)
  }

  const chooseView = (next: 'outside' | 'inside') => {
    setView(next)
    setCardId(null)
    onMarkMode(null) // marking is only for the outside view
    if (next === 'outside') setInsideFocus(null)
  }

  // Marks on the flat map: cm recorded, else worked out from the model, else the part's middle.
  const cmOf = (f: Finding) => f.distanceFromAnalVergeCm ?? modelCm[f.id] ?? middleCm(f.segment)
  const mapLesions = [
    ...removed.map(({ finding: f }) => ({ id: f.id, code: codes[f.id]?.code ?? '?', kind: f.kind, cm: cmOf(f), removed: true })),
    ...findings.map((f) => ({ id: f.id, code: codes[f.id]?.code ?? '?', kind: f.kind, cm: cmOf(f) })),
  ]

  return (
    <div className="page">
      {view === 'outside' ? (
        <ColonViewer
          findings={findings}
          removed={removedFindings}
          codes={codes}
          selectedId={selectedId}
          onSelect={openLesion}
          markMode={markMode}
          onMark={addManualMark}
          onModelCm={setModelCm}
          rightInset={270}
        />
      ) : (
        <InsideView findings={findings} codes={codes} focusId={insideFocus} />
      )}

      <div className="top-buttons">
        <button className="button" onClick={() => setPanelOpen(true)}>
          Pictures ({visit.pictures.length})
        </button>
        {view === 'outside' && <NamesToggle />}
        {view === 'outside' && (
          <button className={`names-toggle${mapOpen ? ' is-on' : ''}`} aria-pressed={mapOpen} onClick={() => setMapOpen(!mapOpen)} title="Show or hide the colon map">
            <span className="names-switch" aria-hidden="true" />
            Map {mapOpen ? 'on' : 'off'}
          </button>
        )}
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

      {view === 'outside' && mapOpen && (
        <div className="map-float">
          <ColonMap lesions={mapLesions} onOpen={openLesion} />
        </div>
      )}

      <aside className={`findings-column${view === 'outside' && mapOpen ? ' with-map' : ''}`}>
        <h2>
          Findings <span className="count">{findings.length}</span>
        </h2>
        <FindingsList
          findings={findings}
          codes={codes}
          modelCm={modelCm}
          selectedId={selectedId}
          onSelect={onSelect}
          onOpenCard={setCardId}
          onChange={(id, change) => store.updateFinding(visit.id, id, change)}
          onRemove={remove}
        />
      </aside>

      {/* The panel stays built (so it keeps its state) but is slid out of view and not usable when closed. */}
      <aside className={`pictures-panel${panelOpen ? ' is-open' : ''}`} inert={!panelOpen} aria-label="Pictures">
        <ImagePanel visit={visit} onClose={() => setPanelOpen(false)} />
      </aside>

      <aside className={`side-panel side-panel-right${card ? ' is-open' : ''}`} inert={!card} aria-label="Lesion details">
        {card && (
          <LesionCard
            key={card.finding.id}
            finding={card.finding}
            visit={card.visit}
            code={codes[card.finding.id]?.code ?? '?'}
            modelCm={modelCm[card.finding.id] ?? null}
            removedLater={card.removedLater}
            canShowInside={!card.removedLater}
            onShowInside={() => {
              setCardId(null)
              setInsideFocus(card.finding.id)
              setView('inside')
            }}
            onOpenPatientPage={() => goTo('profile', { section: 'diagnosis' })}
            onSave={(change) => store.updateFinding(card.visit.id, card.finding.id, change)}
            onDelete={() => {
              store.removeFinding(card.visit.id, card.finding.id)
              if (selectedId === card.finding.id) onClearSelection()
              setCardId(null)
            }}
            onClose={() => setCardId(null)}
          />
        )}
      </aside>
    </div>
  )
}
