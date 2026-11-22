// Very small hash router: the page is chosen by the part of the address after "#".
//   #/patients                     the patient list (the landing page)
//   #/patients/PT-1001/colon       a page of one patient (colon, time, compare, treatment, profile)
// Links like <a href="#/patients"> change it, and the browser back button works for free.
import { useEffect, useState } from 'react'

export type PageId = 'colon' | 'time' | 'compare' | 'treatment' | 'profile'

// The pages of an open patient, in tab order.
export const PAGES: { id: PageId; label: string }[] = [
  { id: 'colon', label: '3D colon' },
  { id: 'time', label: 'Over time' },
  { id: 'compare', label: 'Before/after' },
  { id: 'treatment', label: 'Treatment' },
  { id: 'profile', label: 'Patient' },
]

export type Route = { name: 'patients' } | { name: 'patient'; patientId: string; page: PageId }

function readRoute(): Route {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/')
  if (parts[0] === 'patients' && parts[1]) {
    const page = PAGES.find((p) => p.id === parts[2])?.id ?? 'colon' // unknown page: the 3D colon
    return { name: 'patient', patientId: decodeURIComponent(parts[1]), page }
  }
  return { name: 'patients' } // "#/", an empty address or an old link: the patient list
}

// The address of a page of one patient.
export function patientHref(patientId: string, page: PageId): string {
  return `#/patients/${encodeURIComponent(patientId)}/${page}`
}

// Returns the current route and re-renders when the address changes.
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(readRoute)
  useEffect(() => {
    // "#/" and an empty address show the list: write that into the address bar too.
    if (readRoute().name === 'patients' && window.location.hash !== '#/patients') {
      window.history.replaceState(null, '', '#/patients')
    }
    const onChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
