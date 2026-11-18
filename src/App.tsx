// The whole page: header, the working area (pictures, 3D colon, findings, time slider) and footer.
// All findings are kept here, so every panel shows the same list.
import { useState } from 'react'
import Header from './components/Header'
import ColonViewer from './components/ColonViewer'
import FindingsList from './components/FindingsList'
import ImagePanel from './components/ImagePanel'
import TimeSlider from './components/TimeSlider'
import { newId } from './lib/findings'
import type { SegmentId } from './data/segments'
import type { Finding, FindingKind } from './types'

export default function App() {
  const [findings, setFindings] = useState<Finding[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [markMode, setMarkMode] = useState<FindingKind | null>(null)

  // Click a finding (or its pin) to select it; click it again to unselect.
  const select = (id: string) => setSelectedId((current) => (current === id ? null : id))

  const remove = (id: string) => {
    setFindings((list) => list.filter((f) => f.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  // A picture was analysed: replace its old findings with the new ones.
  const setImageFindings = (imageName: string, list: Finding[]) => {
    setFindings((current) => [...current.filter((f) => f.imageName !== imageName), ...list])
    setSelectedId(null)
  }

  // The doctor clicked the 3D colon in marking mode: add the mark, select it, leave marking mode.
  const addManualMark = (kind: FindingKind, segment: SegmentId, position: [number, number, number]) => {
    const mark: Finding = { id: newId(), kind, segment, size: null, source: 'manual', position }
    setFindings((current) => [...current, mark])
    setSelectedId(mark.id)
    setMarkMode(null)
  }

  // Choose Polyp or Tumor; choosing the same one again cancels.
  const toggleMarkMode = (kind: FindingKind) => setMarkMode((current) => (current === kind ? null : kind))

  return (
    <div className="app">
      <Header />

      <main className="workspace">
        <section className="panel images-panel">
          <div className="panel-head">
            <h2>Medical pictures</h2>
          </div>
          <ImagePanel findings={findings} onImageFindings={setImageFindings} />
        </section>

        <section className="panel viewer-panel">
          <div className="panel-head">
            <h2>3D colon map</h2>
            <div className="mark-tools">
              <span>Mark by hand</span>
              <button
                className={`mark-button mark-button-polyp${markMode === 'polyp' ? ' is-active' : ''}`}
                onClick={() => toggleMarkMode('polyp')}
              >
                Polyp
              </button>
              <button
                className={`mark-button mark-button-tumor${markMode === 'tumor' ? ' is-active' : ''}`}
                onClick={() => toggleMarkMode('tumor')}
              >
                Tumor
              </button>
            </div>
          </div>
          <ColonViewer
            findings={findings}
            selectedId={selectedId}
            onSelect={select}
            markMode={markMode}
            onMark={addManualMark}
          />
        </section>

        <section className="panel findings-panel">
          <div className="panel-head">
            <h2>Findings</h2>
            <span className="count">{findings.length}</span>
          </div>
          <FindingsList findings={findings} selectedId={selectedId} onSelect={select} onRemove={remove} />
        </section>

        <section className="panel slider-panel">
          <div className="panel-head">
            <h2>Time slider: what if the polyp is left in place?</h2>
          </div>
          <TimeSlider findings={findings} selectedId={selectedId} />
        </section>
      </main>

      <footer className="footer">
        3D colon model: Human Reference Atlas, Large Intestine (Female), CC-BY 4.0, via NIH 3D.
      </footer>
    </div>
  )
}

