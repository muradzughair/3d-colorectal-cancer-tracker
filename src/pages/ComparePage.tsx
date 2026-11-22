// Before/after: two 3D colons side by side for any two visits, linked (rotate or zoom one,
// the other follows), and a table showing how the size of each finding changed.
// The right-hand date is the visit chosen in the top bar; the left one is chosen here.
// Lesions removed on an earlier visit show as faint crossed rings. Click a marker to open
// its detail card.
import { useEffect, useMemo, useState } from 'react'
import ColonViewer from '../components/ColonViewer'
import LesionCard from '../components/LesionCard'
import NamesToggle from '../components/NamesToggle'
import type { RecordStore } from '../data/record'
import { getSegment } from '../data/segments'
import type { ColonScene } from '../lib/colonScene'
import { compareFindings } from '../lib/compare'
import { formatDate } from '../lib/dates'
import { formatSize } from '../lib/findings'
import { removedBefore, type LesionCode } from '../lib/lesions'
import { linkViews } from '../lib/linkViews'
import type { GoTo } from '../PatientView'
import type { Visit } from '../types'

interface Props {
  store: RecordStore
  visits: Visit[] // oldest first
  visit: Visit // the visit chosen in the top bar (right-hand side)
  codes: Record<string, LesionCode>
  goTo: GoTo
  onVisit: (id: string) => void
}

const nothing = () => {} // no marking here

// One date picker for one side.
function DatePicker({ visits, value, onChange }: { visits: Visit[]; value: string; onChange: (id: string) => void }) {
  return (
    <select className="view-date" value={value} onChange={(e) => onChange(e.target.value)}>
      {visits.map((v, i) => (
        <option key={v.id} value={v.id}>
          {i + 1}. {formatDate(v.date)} · {v.title || 'Visit'}
        </option>
      ))}
    </select>
  )
}

export default function ComparePage({ store, visits, visit, codes, goTo, onVisit }: Props) {
  // Left side: starts with the visit before the chosen one (or after it, for the first visit).
  const position = visits.findIndex((v) => v.id === visit.id)
  const [leftId, setLeftId] = useState(visits[position > 0 ? position - 1 : position + 1]?.id ?? visit.id)
  const left = visits.find((v) => v.id === leftId) ?? visits[0]
  const [leftScene, setLeftScene] = useState<ColonScene | null>(null)
  const [rightScene, setRightScene] = useState<ColonScene | null>(null)
  const [card, setCard] = useState<string | null>(null)
  const [modelCm, setModelCm] = useState<Record<string, number>>({})

  // Removed lesions for each side (kept stable for the 3D views).
  const leftRemoved = useMemo(() => removedBefore(visits, left), [visits, left])
  const rightRemoved = useMemo(() => removedBefore(visits, visit), [visits, visit])
  const leftRemovedFindings = useMemo(() => leftRemoved.map((r) => r.finding), [leftRemoved])
  const rightRemovedFindings = useMemo(() => rightRemoved.map((r) => r.finding), [rightRemoved])
  const addCm = (cms: Record<string, number>) => setModelCm((m) => ({ ...m, ...cms }))

  // Link the two views as soon as both exist.
  useEffect(() => (leftScene && rightScene ? linkViews(leftScene, rightScene) : undefined), [leftScene, rightScene])

  // Esc closes the card.
  useEffect(() => {
    if (!card) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCard(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [card])

  // The card's lesion, wherever it comes from (either visit, or removed earlier).
  const all = visits.flatMap((v) => v.findings.map((f) => ({ finding: f, visit: v })))
  const open = all.find((x) => x.finding.id === card) ?? null
  const removedLater = !!open && open.visit.id !== left.id && open.visit.id !== visit.id

  const rows = compareFindings(left.findings, visit.findings)

  return (
    <div className="page compare-page">
      <div className="compare-views">
        <NamesToggle className="floating-names compare-names" />
        <div className="compare-view">
          <DatePicker visits={visits} value={left.id} onChange={setLeftId} />
          {/* key: a new date builds a new view, so the markers are placed for that visit */}
          <ColonViewer
            key={left.id}
            findings={left.findings}
            removed={leftRemovedFindings}
            codes={codes}
            selectedId={card}
            onSelect={setCard}
            markMode={null}
            onMark={nothing}
            onScene={setLeftScene}
            onModelCm={addCm}
          />
        </div>
        <div className="compare-view">
          <DatePicker visits={visits} value={visit.id} onChange={onVisit} />
          <ColonViewer
            key={visit.id}
            findings={visit.findings}
            removed={rightRemovedFindings}
            codes={codes}
            selectedId={card}
            onSelect={setCard}
            markMode={null}
            onMark={nothing}
            onScene={setRightScene}
            onModelCm={addCm}
          />
        </div>
      </div>

      <div className="compare-table">
        <h2>How the findings changed</h2>
        {rows.length === 0 ? (
          <p className="muted">Neither visit has findings.</p>
        ) : (
          <table className="doc-table">
            <thead>
              <tr>
                <th>Finding</th>
                <th>Segment</th>
                <th>{formatDate(left.date)}</th>
                <th>{formatDate(visit.date)}</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td>
                    <span className={`dot dot-${r.kind}`} />
                    {codes[(r.after ?? r.before)!.id]?.code} {r.kind === 'polyp' ? 'Polyp' : 'Tumor'}
                  </td>
                  <td>{getSegment(r.segment).name}</td>
                  <td>{r.before ? formatSize(r.before.size) : <span className="muted">Not seen</span>}</td>
                  <td>{r.after ? formatSize(r.after.size) : <span className="muted">Not seen</span>}</td>
                  <td className="change">{r.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted small-note">Findings are matched by kind and segment. Sizes are as recorded for each visit.</p>
      </div>

      <aside className={`side-panel side-panel-right${open ? ' is-open' : ''}`} inert={!open} aria-label="Lesion details">
        {open && (
          <LesionCard
            key={open.finding.id}
            finding={open.finding}
            visit={open.visit}
            code={codes[open.finding.id]?.code ?? '?'}
            modelCm={modelCm[open.finding.id] ?? null}
            removedLater={removedLater}
            canShowInside={open.visit.id === visit.id}
            onShowInside={() => goTo('colon', { visitId: open.visit.id, findingId: open.finding.id, inside: true })}
            onOpenPatientPage={() => goTo('profile', { section: 'diagnosis' })}
            onSave={(change) => store.updateFinding(open.visit.id, open.finding.id, change)}
            onDelete={() => {
              store.removeFinding(open.visit.id, open.finding.id)
              setCard(null)
            }}
            onClose={() => setCard(null)}
          />
        )}
      </aside>
    </div>
  )
}
