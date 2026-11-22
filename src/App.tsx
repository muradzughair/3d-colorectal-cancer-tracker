// The app shell: the patient list or the open patient, and the footer.
// The patient records (src/data/record.ts) hold the data the doctor can change; the patient
// profiles (src/data/patients) hold the read-only patient file.
import TopBar from './components/TopBar'
import PatientListPage from './pages/PatientListPage'
import PatientView from './PatientView'
import { getPatient } from './data/patients'
import { useRoute } from './lib/route'

export default function App() {
  const route = useRoute()
  const data = route.name === 'patient' ? getPatient(route.patientId) : undefined

  return (
    <div className="app">
      {route.name === 'patient' && data ? (
        // key: a different patient builds everything again, so nothing of the previous one stays.
        <PatientView key={data.profile.id} data={data} page={route.page} />
      ) : (
        <>
          <TopBar />
          <PatientListPage />
        </>
      )}

      <footer className="footer">
        3D colon model: Human Reference Atlas, Large Intestine (Female), CC-BY 4.0, via NIH 3D.
      </footer>
    </div>
  )
}
