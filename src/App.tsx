// The app shell: top bar, the current page and the footer.
// The patient record (src/data/record.ts) holds all the data. App only keeps what is on
// screen right now: the chosen visit, the selected finding and the marking mode.
import { useState } from 'react'
import TopBar from './components/TopBar'
import VisitsPage from './pages/VisitsPage'
import ColonPage from './pages/ColonPage'
import VideosPage from './pages/VideosPage'
import TimePage from './pages/TimePage'
import ComparePage from './pages/ComparePage'
import TreatmentPage from './pages/TreatmentPage'
import { sortedVisits, useRecord } from './data/record'
import { useRoute } from './lib/route'
import type { FindingKind } from './types'

export default function App() {
  const route = useRoute()
  const store = useRecord()
  const [chosenVisitId, setChosenVisitId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [markMode, setMarkMode] = useState<FindingKind | null>(null)

  const visits = store.record ? sortedVisits(store.record) : []
  // The chosen visit, or the newest one if none is chosen (or it was removed).
  const visit = visits.find((v) => v.id === chosenVisitId) ?? visits[visits.length - 1] ?? null

  const chooseVisit = (id: string) => {
    setChosenVisitId(id)
    setSelectedId(null) // a finding belongs to one visit
    setMarkMode(null)
  }

  // Click a finding (or its pin) to select it; click it again to unselect.
  const select = (id: string) => setSelectedId((current) => (current === id ? null : id))

  return (
    <div className="app">
      <TopBar route={route} visits={visits} visitId={visit?.id ?? null} onVisit={chooseVisit} />

      {!store.record ? (
        <div className="page page-text">
          <p className="muted">Preparing the demo patient…</p>
        </div>
      ) : (
        <>
          {/* Only the current page is built, so only one 3D view exists at a time. */}
          {route === 'visits' && <VisitsPage store={store} visits={visits} visit={visit} onVisit={chooseVisit} />}
          {route === 'colon' && visit && (
            <ColonPage
              key={visit.id}
              store={store}
              visit={visit}
              selectedId={selectedId}
              onSelect={select}
              onClearSelection={() => setSelectedId(null)}
              markMode={markMode}
              onMarkMode={setMarkMode}
            />
          )}
          {route === 'videos' && visit && <VideosPage key={visit.id} visit={visit} visits={visits} onVisit={chooseVisit} />}
          {route === 'time' && visit && <TimePage key={`${visit.id}-${selectedId}`} findings={visit.findings} selectedId={selectedId} />}
          {route === 'compare' && visit && <ComparePage visits={visits} visit={visit} onVisit={chooseVisit} />}
          {route === 'treatment' && <TreatmentPage store={store} />}
          {route !== 'visits' && route !== 'treatment' && !visit && (
            <div className="page page-text">
              <p className="muted">
                There are no visits yet. Add one on the <a href="#/visits">Patient & visits</a> page.
              </p>
            </div>
          )}
        </>
      )}

      <footer className="footer">
        3D colon model: Human Reference Atlas, Large Intestine (Female), CC-BY 4.0, via NIH 3D.
      </footer>
    </div>
  )
}
