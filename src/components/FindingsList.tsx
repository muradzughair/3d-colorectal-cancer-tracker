// The findings as a slim plain list. Click a finding to select it (and highlight its pin).
import { getSegment } from '../data/segments'
import { describeFindings, formatSize } from '../lib/findings'
import type { Finding } from '../types'

interface Props {
  findings: Finding[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
}

export default function FindingsList({ findings, selectedId, onSelect, onRemove }: Props) {
  const names = describeFindings(findings)

  if (findings.length === 0) {
    return <p className="empty-note">No findings yet. Add a picture, or mark a polyp or tumor on the 3D colon.</p>
  }

  return (
    <ul className="findings-list">
      {findings.map((f) => (
        <li
          key={f.id}
          className={`finding finding-${f.kind}${f.id === selectedId ? ' is-selected' : ''}`}
          onClick={() => onSelect(f.id)}
        >
          <span className={`finding-badge badge-${f.kind}`}>{names[f.id].pinText}</span>
          <div className="finding-body">
            <div className="finding-top">
              <strong>{names[f.id].name}</strong>
              <span className={`source-tag source-${f.source}`}>{f.source === 'ai' ? 'AI' : 'Manual'}</span>
            </div>
            <div className="finding-meta">
              {getSegment(f.segment).name} · {formatSize(f.size)}
            </div>
            <div className="finding-position">{f.position ? 'Exact position' : 'Estimated position'}</div>
          </div>
          {f.source === 'manual' && (
            <button
              className="remove-button"
              title="Remove this mark"
              aria-label="Remove this mark"
              onClick={(event) => {
                event.stopPropagation() // don't also select the finding
                onRemove(f.id)
              }}
            >
              ×
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
