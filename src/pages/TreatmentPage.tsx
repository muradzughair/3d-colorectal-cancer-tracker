// Treatment and medicine record: dated steps written by the doctor, each marked Done,
// In progress or Planned, with a note. Shown in date order, so a new doctor can read what
// was done and what the previous doctor planned. The app never suggests a treatment.
import { useState } from 'react'
import type { RecordStore } from '../data/record'
import { today } from '../lib/dates'
import type { EntryStatus, TreatmentEntry } from '../types'

const STATUSES: { id: EntryStatus; label: string }[] = [
  { id: 'done', label: 'Done' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'planned', label: 'Planned' },
]

const EMPTY: Omit<TreatmentEntry, 'id'> = { date: today(), text: '', status: 'planned', note: '' }

export default function TreatmentPage({ store }: { store: RecordStore }) {
  const entries = [...store.record!.entries].sort((a, b) => a.date.localeCompare(b.date))
  const done = entries.filter((e) => e.status === 'done').length
  const [draft, setDraft] = useState(EMPTY)

  const add = () => {
    store.addEntry({ ...draft, text: draft.text.trim() })
    setDraft({ ...EMPTY, date: draft.date })
  }

  return (
    <div className="page page-text">
      <div className="doc">
        <section className="doc-section">
          <div className="doc-heading">
            <h2>Treatment and medicine record</h2>
            <span className="muted">Written by the doctor. The app does not suggest treatments or medicines.</span>
          </div>

          <div className="progress" aria-label={`${done} of ${entries.length} steps done`}>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: entries.length ? `${(done / entries.length) * 100}%` : 0 }} />
            </div>
            <span>
              <strong>
                {done} of {entries.length}
              </strong>{' '}
              steps done
            </span>
          </div>

          <table className="doc-table record-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Treatment or medicine</th>
                <th>Status</th>
                <th>Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className={`status-row status-${e.status}`}>
                  <td>
                    <input type="date" value={e.date} aria-label="Date" onChange={(ev) => store.updateEntry(e.id, { date: ev.target.value })} />
                  </td>
                  <td>
                    <input value={e.text} aria-label="Treatment or medicine" onChange={(ev) => store.updateEntry(e.id, { text: ev.target.value })} />
                  </td>
                  <td>
                    <select
                      className={`status-select status-${e.status}`}
                      value={e.status}
                      aria-label="Status"
                      onChange={(ev) => store.updateEntry(e.id, { status: ev.target.value as EntryStatus })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input value={e.note} placeholder="Note" aria-label="Note" onChange={(ev) => store.updateEntry(e.id, { note: ev.target.value })} />
                  </td>
                  <td>
                    <button className="remove-button" title="Remove this entry" aria-label="Remove this entry" onClick={() => store.removeEntry(e.id)}>
                      ×
                    </button>
                  </td>
                </tr>
              ))}

              {/* The last row adds a new entry. */}
              <tr className="new-entry">
                <td>
                  <input type="date" value={draft.date} aria-label="New entry date" onChange={(ev) => setDraft({ ...draft, date: ev.target.value })} />
                </td>
                <td>
                  <input
                    value={draft.text}
                    placeholder="New entry, e.g. Medicine started by the oncology team"
                    aria-label="New treatment or medicine"
                    onChange={(ev) => setDraft({ ...draft, text: ev.target.value })}
                  />
                </td>
                <td>
                  <select value={draft.status} aria-label="New entry status" onChange={(ev) => setDraft({ ...draft, status: ev.target.value as EntryStatus })}>
                    {STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input value={draft.note} placeholder="Note" aria-label="New entry note" onChange={(ev) => setDraft({ ...draft, note: ev.target.value })} />
                </td>
                <td>
                  <button className="button" disabled={!draft.text.trim() || !draft.date} onClick={add}>
                    Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
