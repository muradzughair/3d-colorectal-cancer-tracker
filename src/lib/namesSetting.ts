// The "Names" setting: show or hide the colon part names (and their leader lines) on the 3D
// views. One setting for all pages, remembered in the browser. Default: shown.
import { useSyncExternalStore } from 'react'

const KEY = 'colorectal-show-part-names'
const listeners = new Set<() => void>()

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

let current = read()

export function setNamesVisible(visible: boolean) {
  current = visible
  try {
    localStorage.setItem(KEY, visible ? 'on' : 'off')
  } catch {
    // Storage not allowed: the setting just isn't remembered.
  }
  listeners.forEach((l) => l())
}

// The current setting; the component re-renders when it changes.
export function useNamesVisible(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
  )
}
