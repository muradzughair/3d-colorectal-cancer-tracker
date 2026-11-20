// Very small hash router: the page is chosen by the part of the address after "#".
// Links like <a href="#/time"> change it, and the browser back button works for free.
import { useEffect, useState } from 'react'

export type RouteId = 'colon' | 'time' | 'compare' | 'patient'

// The four pages, in tab order.
export const ROUTES: { id: RouteId; label: string }[] = [
  { id: 'colon', label: '3D colon' },
  { id: 'time', label: 'Over time' },
  { id: 'compare', label: 'Before / after' },
  { id: 'patient', label: 'Patient & plan' },
]

function readRoute(): RouteId {
  const id = window.location.hash.replace('#/', '')
  return ROUTES.find((r) => r.id === id)?.id ?? 'colon' // unknown address: show the 3D colon
}

// Returns the current page and re-renders when the address changes.
export function useRoute(): RouteId {
  const [route, setRoute] = useState<RouteId>(readRoute)
  useEffect(() => {
    const onChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
