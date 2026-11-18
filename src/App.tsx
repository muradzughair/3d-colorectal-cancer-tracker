// The whole page: header, the working area (pictures, 3D colon, findings, time slider) and footer.
// All findings are kept here, so every panel shows the same list.
import { useState } from 'react'
import Header from './components/Header'
import ColonViewer from './components/ColonViewer'
import FindingsList from './components/FindingsList'
import type { Finding } from './types'

export default function App() {
  const [findings, setFindings] = useState<Finding[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Click a finding (or its pin) to select it; click it again to unselect.
  const select = (id: string) => setSelectedId((current) => (current === id ? null : id))

  const remove = (id: string) => {
    setFindings((list) => list.filter((f) => f.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <div className="app">
      <Header />

      <main className="workspace">
        <section className="panel viewer-panel">
          <div className="panel-head">
            <h2>3D colon map</h2>
          </div>
          <ColonViewer findings={findings} selectedId={selectedId} onSelect={select} />
        </section>

        <section className="panel findings-panel">
          <div className="panel-head">
            <h2>Findings</h2>
            <span className="count">{findings.length}</span>
          </div>
          <FindingsList findings={findings} selectedId={selectedId} onSelect={select} onRemove={remove} />
        </section>
      </main>

      <footer className="footer">
        3D colon model: Human Reference Atlas, Large Intestine (Female), CC-BY 4.0, via NIH 3D.
      </footer>
    </div>
  )
}

