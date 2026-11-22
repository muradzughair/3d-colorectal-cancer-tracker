// The floating "Names" on/off button. It hides or shows only the colon part names and their
// leader lines (findings are not affected). Keyboard shortcut: N (ignored while typing).
import { useEffect } from 'react'
import { isTyping } from '../lib/insideControls'
import { setNamesVisible, useNamesVisible } from '../lib/namesSetting'

export default function NamesToggle({ className = '' }: { className?: string }) {
  const visible = useNamesVisible()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyN' || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return
      setNamesVisible(!visible)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible])

  return (
    <button
      className={`names-toggle${visible ? ' is-on' : ''} ${className}`}
      aria-pressed={visible}
      title="Show or hide the colon part names (N)"
      onClick={() => setNamesVisible(!visible)}
    >
      <span className="names-switch" aria-hidden="true" />
      Names {visible ? 'on' : 'off'}
    </button>
  )
}
