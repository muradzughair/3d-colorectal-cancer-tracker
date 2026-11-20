// Slim top bar: title, the 4 page tabs, the demo tag and the decision-support line.
import { DEMO_MODE } from '../detector'
import { ROUTES, type RouteId } from '../lib/route'

export default function TopBar({ route }: { route: RouteId }) {
  return (
    <header className="topbar">
      <h1>Colorectal Cancer Decision Support</h1>
      {DEMO_MODE && <span className="demo-tag">Demo mode</span>}

      <nav className="tabs" aria-label="Pages">
        {ROUTES.map((r) => (
          <a key={r.id} href={`#/${r.id}`} className={r.id === route ? 'is-active' : ''} aria-current={r.id === route ? 'page' : undefined}>
            {r.label}
          </a>
        ))}
      </nav>

      <p className="topbar-notice">Decision-support tool. The doctor makes the final decision.</p>
    </header>
  )
}
