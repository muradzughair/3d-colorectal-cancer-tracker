// The whole page: header, the working area (pictures, 3D colon, findings, time slider) and footer.
import Header from './components/Header'
import ColonViewer from './components/ColonViewer'

export default function App() {
  return (
    <div className="app">
      <Header />

      <main className="workspace">
        <section className="panel viewer-panel">
          <div className="panel-head">
            <h2>3D colon map</h2>
          </div>
          <ColonViewer />
        </section>
      </main>

      <footer className="footer">
        3D colon model: Human Reference Atlas, Large Intestine (Female), CC-BY 4.0, via NIH 3D.
      </footer>
    </div>
  )
}
