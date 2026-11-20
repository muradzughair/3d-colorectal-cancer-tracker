// Top bar. First line: title, demo tag and the decision-support line.
// Second line: the page tabs and the visit selector (the chosen visit is used on every page).
import { DEMO_MODE } from '../detector'
import { formatDate } from '../lib/dates'
import { ROUTES, type RouteId } from '../lib/route'
import type { Visit } from '../types'

interface Props {
  route: RouteId
  visits: Visit[] // oldest first
  visitId: string | null
  onVisit: (id: string) => void
}

export default function TopBar({ route, visits, visitId, onVisit }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-line">
        <h1>Colorectal Care Record</h1>
        {DEMO_MODE && <span className="demo-tag">Demo mode</span>}
        <p className="topbar-notice">Decision-support tool. The doctor makes the final decision.</p>
      </div>

      <div className="topbar-line">
        <nav className="tabs" aria-label="Pages">
          {ROUTES.map((r) => (
            <a key={r.id} href={`#/${r.id}`} className={r.id === route ? 'is-active' : ''} aria-current={r.id === route ? 'page' : undefined}>
              {r.label}
            </a>
          ))}
        </nav>

        {visits.length > 0 && (
          <label className="visit-select">
            <span>Visit</span>
            <select value={visitId ?? ''} onChange={(e) => onVisit(e.target.value)}>
              {visits.map((v, i) => (
                <option key={v.id} value={v.id}>
                  {i + 1}. {formatDate(v.date)} · {v.title || 'Visit'}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </header>
  )
}
