// Page 3: two 3D colons side by side, "Before treatment" and "After treatment (planned)".
// The two views are linked (rotate or zoom one, the other follows). The "after" view
// follows the treatment plan from the Patient page, finding by finding.
import { useEffect, useMemo, useState } from 'react'
import ColonViewer, { type PinMark } from '../components/ColonViewer'
import type { ColonScene } from '../lib/colonScene'
import { linkViews } from '../lib/linkViews'
import { planFor, type Plan } from '../lib/plan'
import type { SegmentId } from '../data/segments'
import type { Finding } from '../types'

interface Props {
  findings: Finding[]
  plan: Plan
}

const nothing = () => {} // this page only looks at findings: no selecting or marking here

export default function ComparePage({ findings, plan }: Props) {
  const [before, setBefore] = useState<ColonScene | null>(null)
  const [after, setAfter] = useState<ColonScene | null>(null)

  // Link the two views as soon as both exist.
  useEffect(() => (before && after ? linkViews(before, after) : undefined), [before, after])

  // What the plan does to the "after" view.
  const { marks, removedSegments } = useMemo(() => {
    const marks: Record<string, PinMark> = {}
    const removedSegments: SegmentId[] = []
    for (const f of findings) {
      const action = planFor(plan, f.id).action
      if (action === 'undecided') marks[f.id] = 'undecided' // unchanged, with a dashed ring
      if (action === 'remove-polyp') marks[f.id] = 'removed' // small grey removed mark
      if (action === 'surgery') {
        removedSegments.push(f.segment) // the whole segment is removed, and the tumor with it
        marks[f.id] = 'hidden'
      }
      // 'monitor' and 'oncology': the pin stays as it is
    }
    return { marks, removedSegments }
  }, [findings, plan])

  if (findings.length === 0) {
    return (
      <div className="page page-text">
        <h2 className="empty-title">Before / after treatment</h2>
        <p className="muted">
          There are no findings to compare yet. Add a picture or mark the colon on the <a href="#/colon">3D colon page</a>.
        </p>
      </div>
    )
  }

  return (
    <div className="page compare-page">
      <div className="compare-views">
        <div className="compare-view">
          <h2 className="view-title">Before treatment</h2>
          <ColonViewer findings={findings} selectedId={null} onSelect={nothing} markMode={null} onMark={nothing} onScene={setBefore} />
        </div>
        <div className="compare-view">
          <h2 className="view-title">After treatment (planned)</h2>
          <ColonViewer
            findings={findings}
            selectedId={null}
            onSelect={nothing}
            markMode={null}
            onMark={nothing}
            marks={marks}
            removedSegments={removedSegments}
            onScene={setAfter}
          />
        </div>
      </div>

      <div className="compare-foot">
        <ul className="legend">
          <li>
            <span className="swatch swatch-polyp" /> Polyp
          </li>
          <li>
            <span className="swatch swatch-tumor" /> Tumor
          </li>
          <li>
            <span className="swatch swatch-removed">×</span> Polyp removed
          </li>
          <li>
            <span className="swatch swatch-segment" /> Removed segment
          </li>
          <li>
            <span className="swatch swatch-undecided" /> Not decided
          </li>
        </ul>
        <p className="muted">
          Based on the treatment plan on the <a href="#/patient">Patient page</a>.
        </p>
      </div>
    </div>
  )
}
