// The app shell: top bar, the current page and the footer.
// All shared data (findings, pictures, selection, marking mode) lives here, so every page sees the same data.
import { useState } from 'react'
import TopBar from './components/TopBar'
import ColonPage from './pages/ColonPage'
import TimePage from './pages/TimePage'
import ComparePage from './pages/ComparePage'
import PatientPage from './pages/PatientPage'
import { newId } from './lib/findings'
import { EMPTY_PLAN_ITEM, type Plan, type PlanItem } from './lib/plan'
import { useRoute } from './lib/route'
import type { SegmentId } from './data/segments'
import type { Finding, FindingKind, Patient, Picture } from './types'

// The fictional demo patient the page starts with.
const DEMO_PATIENT: Patient = {
  name: 'Layla Nasser',
  age: '58',
  sex: 'Female',
  fileNumber: 'DEMO-0001',
  visitDate: new Date().toISOString().slice(0, 10),
  history: 'Fictional example: change in bowel habits for 3 months. No earlier colonoscopy.',
  notes: '',
}

export default function App() {
  const route = useRoute()
  const [findings, setFindings] = useState<Finding[]>([])
  const [pictures, setPictures] = useState<Picture[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [markMode, setMarkMode] = useState<FindingKind | null>(null)
  const [patient, setPatient] = useState<Patient>(DEMO_PATIENT)
  const [plan, setPlan] = useState<Plan>({}) // the treatment plan, by finding id
  const [followUp, setFollowUp] = useState('') // follow-up date

  // Click a finding (or its pin) to select it; click it again to unselect.
  const select = (id: string) => setSelectedId((current) => (current === id ? null : id))

  const remove = (id: string) => {
    setFindings((list) => list.filter((f) => f.id !== id))
    setPlan(({ [id]: _removed, ...rest }) => rest) // its plan row goes too
    if (selectedId === id) setSelectedId(null)
  }

  // A picture was opened: add it to the list, or replace the one with the same name.
  const savePicture = (picture: Picture) =>
    setPictures((list) =>
      list.some((p) => p.name === picture.name)
        ? list.map((p) => (p.name === picture.name ? picture : p))
        : [...list, picture],
    )

  // A picture was analysed: replace its old findings with the new ones. Findings keep their old
  // id when they are replaced, so later data linked to them (the treatment plan) is not lost.
  const setImageFindings = (imageName: string, list: Finding[]) => {
    setFindings((current) => {
      const old = current.filter((f) => f.imageName === imageName)
      const merged = list.map((f, i) => (old[i]?.kind === f.kind ? { ...f, id: old[i].id } : f))
      return [...current.filter((f) => f.imageName !== imageName), ...merged]
    })
    setSelectedId(null)
  }

  // The doctor clicked the 3D colon in marking mode: add the mark, select it, leave marking mode.
  const addManualMark = (kind: FindingKind, segment: SegmentId, position: [number, number, number]) => {
    const mark: Finding = { id: newId(), kind, segment, size: null, source: 'manual', position }
    setFindings((current) => [...current, mark])
    setSelectedId(mark.id)
    setMarkMode(null)
  }

  // The doctor changed something in one plan row.
  const changePlan = (findingId: string, change: Partial<PlanItem>) =>
    setPlan((current) => ({ ...current, [findingId]: { ...(current[findingId] ?? EMPTY_PLAN_ITEM), ...change } }))

  // Choose Polyp or Tumor; choosing the same one again cancels.
  const toggleMarkMode = (kind: FindingKind) => setMarkMode((current) => (current === kind ? null : kind))

  return (
    <div className="app">
      <TopBar route={route} />

      {/* Only the current page is built, so only one 3D view exists at a time. */}
      {route === 'colon' && (
        <ColonPage
          findings={findings}
          selectedId={selectedId}
          onSelect={select}
          onRemove={remove}
          markMode={markMode}
          onToggleMark={toggleMarkMode}
          onMark={addManualMark}
          pictures={pictures}
          onPicture={savePicture}
          onImageFindings={setImageFindings}
        />
      )}
      {route === 'time' && <TimePage findings={findings} selectedId={selectedId} />}
      {route === 'compare' && <ComparePage findings={findings} plan={plan} />}
      {route === 'patient' && (
        <PatientPage
          patient={patient}
          onPatient={(change) => setPatient((current) => ({ ...current, ...change }))}
          findings={findings}
          plan={plan}
          onPlan={changePlan}
          followUp={followUp}
          onFollowUp={setFollowUp}
        />
      )}

      <footer className="footer">
        3D colon model: Human Reference Atlas, Large Intestine (Female), CC-BY 4.0, via NIH 3D.
      </footer>
    </div>
  )
}
