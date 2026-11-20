// The app shell: top bar, the current page and the footer.
// All shared data (findings, selection, marking mode) lives here, so every page sees the same data.
import { useState } from 'react'
import TopBar from './components/TopBar'
import ColonPage from './pages/ColonPage'
import TimePage from './pages/TimePage'
import ComparePage from './pages/ComparePage'
import PatientPage from './pages/PatientPage'
import { newId } from './lib/findings'
import { useRoute } from './lib/route'
import type { SegmentId } from './data/segments'
import type { Finding, FindingKind } from './types'

export default function App() {
  const route = useRoute()
  const [findings, setFindings] = useState<Finding[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [markMode, setMarkMode] = useState<FindingKind | null>(null)

  // Click a finding (or its pin) to select it; click it again to unselect.
  const select = (id: string) => setSelectedId((current) => (current === id ? null : id))

  // The doctor clicked the 3D colon in marking mode: add the mark, select it, leave marking mode.
  const addManualMark = (kind: FindingKind, segment: SegmentId, position: [number, number, number]) => {
    const mark: Finding = { id: newId(), kind, segment, size: null, source: 'manual', position }
    setFindings((current) => [...current, mark])
    setSelectedId(mark.id)
    setMarkMode(null)
  }

  return (
    <div className="app">
      <TopBar route={route} />

      {/* Only the current page is built, so only one 3D view exists at a time. */}
      {route === 'colon' && (
        <ColonPage findings={findings} selectedId={selectedId} onSelect={select} markMode={markMode} onMark={addManualMark} />
      )}
      {route === 'time' && <TimePage />}
      {route === 'compare' && <ComparePage />}
      {route === 'patient' && <PatientPage />}

      <footer className="footer">
        3D colon model: Human Reference Atlas, Large Intestine (Female), CC-BY 4.0, via NIH 3D.
      </footer>
    </div>
  )
}
