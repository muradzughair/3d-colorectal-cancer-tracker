// Report: a page for the radiologist about the chosen visit. It is filled in from the visit's
// findings and has a snapshot of the 3D colon. The radiologist edits the text, then prints it
// or saves it as a PDF (both use the browser's print window). The app writes no medical
// advice and no AI-written text: the findings text only lists the recorded findings.
import { useEffect, useRef, useState } from 'react'
import type { RecordStore } from '../data/record'
import { getSegment } from '../data/segments'
import { formatDate, today } from '../lib/dates'
import { describeFindings, formatSize } from '../lib/findings'
import { colonSnapshot } from '../lib/snapshot'
import type { Finding, Visit } from '../types'

// The starting findings text: one plain line per recorded finding.
function findingsText(findings: Finding[]): string {
  if (findings.length === 0) return 'No findings recorded for this visit.'
  const names = describeFindings(findings)
  return findings
    .map((f) => {
      const source = f.source === 'ai' ? (f.edited ? 'AI, edited by doctor' : 'AI') : 'marked by doctor'
      return `${names[f.id].name}: ${getSegment(f.segment).name}, ${formatSize(f.size).toLowerCase()} (${source}).`
    })
    .join('\n')
}

// A text box that grows with its text, so the whole text shows on screen and on paper.
function GrowingText({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const box = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value])
  return <textarea ref={box} rows={2} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
}

export default function ReportPage({ store, visit }: { store: RecordStore; visit: Visit }) {
  const { patient, reports } = store.record!
  const report = reports[visit.id] ?? { comments: '', radiologist: '' }
  const names = describeFindings(visit.findings)
  const [snapshot, setSnapshot] = useState<string | null>(null)

  // Draw the snapshot of the 3D colon with this visit's findings.
  useEffect(() => {
    let cancelled = false
    colonSnapshot(visit.findings).then((url) => !cancelled && setSnapshot(url))
    return () => {
      cancelled = true
    }
  }, [visit.findings])

  return (
    <div className="page page-text report-page">
      <div className="report-actions">
        <button className="button" onClick={() => window.print()}>
          Print
        </button>
        <button className="button button-light" onClick={() => window.print()}>
          Save as PDF
        </button>
        <span className="muted">To save a PDF, choose "Save as PDF" as the printer in the print window.</span>
      </div>

      <article className="report-sheet">
        <header className="report-head">
          <h2>Radiology report</h2>
          <span className="demo-tag">Demo patient (fictional)</span>
        </header>

        <dl className="report-facts">
          <div>
            <dt>Patient</dt>
            <dd>
              {patient.name} · {patient.age} · {patient.sex}
            </dd>
          </div>
          <div>
            <dt>File number</dt>
            <dd>{patient.fileNumber}</dd>
          </div>
          <div>
            <dt>Visit</dt>
            <dd>
              {formatDate(visit.date)} · {visit.title || 'Visit'}
            </dd>
          </div>
          <div>
            <dt>Images</dt>
            <dd>{visit.pictures.length ? visit.pictures.map((p) => p.name).join(', ') : 'None'}</dd>
          </div>
        </dl>

        <section className="report-section">
          <h3>Findings</h3>
          {visit.findings.length > 0 && (
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Finding</th>
                  <th>Segment</th>
                  <th>Size</th>
                  <th>Source</th>
                  <th>Position on the 3D colon</th>
                </tr>
              </thead>
              <tbody>
                {visit.findings.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <span className={`dot dot-${f.kind}`} />
                      {names[f.id].name}
                    </td>
                    <td>{getSegment(f.segment).name}</td>
                    <td>{formatSize(f.size)}</td>
                    <td>{f.source === 'ai' ? (f.edited ? 'AI, edited' : 'AI') : 'Manual'}</td>
                    <td>{f.position ? 'Exact' : 'Estimated'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <GrowingText value={report.findings ?? findingsText(visit.findings)} onChange={(text) => store.updateReport(visit.id, { findings: text })} />
        </section>

        <section className="report-section report-figure">
          <h3>3D colon</h3>
          {snapshot ? <img src={snapshot} alt="3D colon with the findings of this visit" /> : <p className="muted">Preparing the 3D snapshot…</p>}
          <p className="muted small-note">Reference colon model, not the patient's own anatomy. Positions taken from pictures are estimated.</p>
        </section>

        <section className="report-section">
          <h3>Radiologist's comments</h3>
          <GrowingText
            value={report.comments}
            placeholder="Written by the radiologist"
            onChange={(text) => store.updateReport(visit.id, { comments: text })}
          />
        </section>

        <div className="report-sign">
          <label className="field">
            <span>Radiologist</span>
            <input value={report.radiologist} placeholder="Name" onChange={(e) => store.updateReport(visit.id, { radiologist: e.target.value })} />
          </label>
          <div className="field">
            <span>Report date</span>
            <p>{formatDate(today())}</p>
          </div>
        </div>

        <footer className="report-foot">
          Decision-support tool. The doctor makes the final decision. Demo mode: fictional patient and pre-computed results.
          <br />
          3D colon model: Human Reference Atlas, Large Intestine (Female), CC-BY 4.0, via NIH 3D.
        </footer>
      </article>
    </div>
  )
}
