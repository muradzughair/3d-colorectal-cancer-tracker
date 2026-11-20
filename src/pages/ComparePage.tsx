// Compare dates: two 3D colons side by side for any two visits, linked (rotate or zoom one,
// the other follows), and a table showing how the size of each finding changed.
// The right-hand date is the visit chosen in the top bar; the left one is chosen here.
import { useEffect, useState } from 'react'
import ColonViewer from '../components/ColonViewer'
import { getSegment } from '../data/segments'
import type { ColonScene } from '../lib/colonScene'
import { compareFindings } from '../lib/compare'
import { formatDate } from '../lib/dates'
import { formatSize } from '../lib/findings'
import { linkViews } from '../lib/linkViews'
import type { Visit } from '../types'

interface Props {
  visits: Visit[] // oldest first
  visit: Visit // the visit chosen in the top bar (right-hand side)
  onVisit: (id: string) => void
}

const nothing = () => {} // this page only looks at findings: no selecting or marking here

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

export default function ComparePage({ visits, visit, onVisit }: Props) {
  // Left side: starts with the visit before the chosen one (or after it, for the first visit).
  const position = visits.findIndex((v) => v.id === visit.id)
  const [leftId, setLeftId] = useState(visits[position > 0 ? position - 1 : position + 1]?.id ?? visit.id)
  const left = visits.find((v) => v.id === leftId) ?? visits[0]
  const [leftScene, setLeftScene] = useState<ColonScene | null>(null)
  const [rightScene, setRightScene] = useState<ColonScene | null>(null)

  // Link the two views as soon as both exist.
  useEffect(() => (leftScene && rightScene ? linkViews(leftScene, rightScene) : undefined), [leftScene, rightScene])

  const rows = compareFindings(left.findings, visit.findings)

  return (
    <div className="page compare-page">
      <div className="compare-views">
        <div className="compare-view">
          <DatePicker visits={visits} value={left.id} onChange={setLeftId} />
          {/* key: a new date builds a new view, so the pins are placed for that visit */}
          <ColonViewer key={left.id} findings={left.findings} selectedId={null} onSelect={nothing} markMode={null} onMark={nothing} onScene={setLeftScene} />
        </div>
        <div className="compare-view">
          <DatePicker visits={visits} value={visit.id} onChange={onVisit} />
          <ColonViewer key={visit.id} findings={visit.findings} selectedId={null} onSelect={nothing} markMode={null} onMark={nothing} onScene={setRightScene} />
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
                    {r.label}
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
    </div>
  )
}
