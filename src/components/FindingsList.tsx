// The findings as a slim plain list. Click a finding to select it (and highlight its pin).
// The selected finding opens two fields so the doctor can correct its size and segment.
import { SEGMENTS, getSegment, type SegmentId } from '../data/segments'
import { describeFindings, formatSize } from '../lib/findings'
import type { Finding } from '../types'

interface Props {
  findings: Finding[]
  selectedId: string | null
  onSelect: (id: string) => void
  onChange: (id: string, change: Partial<Finding>) => void
  onRemove: (id: string) => void
}

export default function FindingsList({ findings, selectedId, onSelect, onChange, onRemove }: Props) {
  const names = describeFindings(findings)

  if (findings.length === 0) {
    return <p className="empty-note">No findings for this visit. Mark a polyp or tumor on the 3D colon.</p>
  }

  // The doctor changed a value. An AI finding is then marked "edited".
  const change = (f: Finding, values: Partial<Finding>) => onChange(f.id, { ...values, edited: f.source === 'ai' ? true : undefined })

  // A manual mark sits exactly where the doctor clicked. If its segment is changed, that
  // point is no longer right, so the pin moves to an estimated spot in the new segment.
  const changeSegment = (f: Finding, segment: SegmentId) =>
    change(f, f.position ? { segment, position: undefined } : { segment })

  // Polyps are measured in mm, tumors in cm. An empty field means "not measured".
  const changeSize = (f: Finding, text: string) => {
    const value = Number(text)
    change(f, { size: text === '' || !(value > 0) ? null : { value, unit: f.kind === 'polyp' ? 'mm' : 'cm' } })
  }

  return (
    <ul className="findings-list">
      {findings.map((f) => {
        const selected = f.id === selectedId
        return (
          <li key={f.id} className={`finding finding-${f.kind}${selected ? ' is-selected' : ''}`} onClick={() => onSelect(f.id)}>
            <span className={`finding-badge badge-${f.kind}`}>{names[f.id].pinText}</span>
            <div className="finding-body">
              <div className="finding-top">
                <strong>{names[f.id].name}</strong>
                <span className={`source-tag source-${f.source}`}>
                  {f.source === 'ai' ? (f.edited ? 'AI, edited' : 'AI') : 'Manual'}
                </span>
              </div>
              <div className="finding-meta">
                {getSegment(f.segment).name} · {formatSize(f.size)}
              </div>
              <div className="finding-position">{f.position ? 'Exact position' : 'Estimated position'}</div>

              {selected && (
                <div className="finding-edit" onClick={(e) => e.stopPropagation()}>
                  <label>
                    <span>Size ({f.kind === 'polyp' ? 'mm' : 'cm'})</span>
                    <input
                      type="number"
                      min={0}
                      step={f.kind === 'polyp' ? 1 : 0.1}
                      value={f.size?.value ?? ''}
                      placeholder="Not measured"
                      onChange={(e) => changeSize(f, e.target.value)}
                    />
                  </label>
                  <label>
                    <span>Segment</span>
                    <select value={f.segment} onChange={(e) => changeSegment(f, e.target.value as SegmentId)}>
                      {SEGMENTS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
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
        )
      })}
    </ul>
  )
}
