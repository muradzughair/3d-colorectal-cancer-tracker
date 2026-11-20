// Inside view of the 3D colon page: a simulated endoscopy through the reference colon model.
// Controls: Play/Pause, a position slider (start to end), "Go to finding", and the keyboard
// arrows (up/right = forward, down/left = back). A small label appears next to a finding when
// the camera is close to it.
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import * as THREE from 'three'
import { createInsideScene, type InsideScene } from '../lib/insideScene'
import { describeFindings, formatSize } from '../lib/findings'
import type { Finding } from '../types'

const SPEED = 0.09 // travel speed when playing, in scene units per second (about 1 minute end to end)
const ARROW_STEP = 0.12 // how far one arrow key press moves, in scene units
const LABEL_DISTANCE = 0.6 // labels show when the camera is closer than this

export default function InsideView({ findings }: { findings: Finding[] }) {
  const holder = useRef<HTMLDivElement>(null)
  const labels = useRef<Record<string, HTMLDivElement | null>>({})
  const sceneRef = useRef<InsideScene | null>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0) // 0 = start of the colon, 1 = end

  // Values the animation loop reads (refs, so the loop always sees the latest ones).
  const state = useRef({ progress: 0, playing: false, target: null as number | null })
  state.current.playing = playing
  const names = describeFindings(findings)

  // Build the inside scene once.
  useEffect(() => {
    let cancelled = false
    let built: InsideScene | null = null
    createInsideScene(holder.current!, findings).then((inside) => {
      if (cancelled) return inside.dispose()
      built = inside
      sceneRef.current = inside
      let last = performance.now()
      const screen = new THREE.Vector3()
      inside.onFrame(() => {
        const now = performance.now()
        const dt = Math.min(0.1, (now - last) / 1000)
        last = now
        const s = state.current
        // Move: smoothly towards a chosen finding, or forward while playing.
        if (s.target !== null) {
          s.progress += (s.target - s.progress) * Math.min(1, dt * 3)
          if (Math.abs(s.target - s.progress) < 0.0005) s.target = null
        } else if (s.playing) {
          s.progress = Math.min(1, s.progress + (SPEED * dt) / inside.length)
          if (s.progress >= 1) setPlaying(false)
        }
        inside.setProgress(s.progress)
        setProgress(s.progress)

        // Labels: only for findings close to the camera, in front of it and not behind the wall.
        const { clientWidth: w, clientHeight: h } = holder.current!
        for (const f of inside.findings) {
          const label = labels.current[f.id]
          if (!label) continue
          screen.copy(f.point).project(inside.camera)
          const near = inside.camera.position.distanceTo(f.point) < LABEL_DISTANCE
          const show = near && screen.z < 1 && Math.abs(screen.x) < 1 && Math.abs(screen.y) < 1 && inside.isVisible(f.point)
          label.style.display = show ? 'block' : 'none'
          if (show) label.style.transform = `translate(${(screen.x * 0.5 + 0.5) * w}px, ${(-screen.y * 0.5 + 0.5) * h}px)`
        }
      })
      setReady(true)
    })
    return () => {
      cancelled = true
      built?.dispose()
      sceneRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- built once; the page rebuilds it for another visit
  }, [])

  // Move by a distance along the colon (arrow keys).
  const step = (distance: number) => {
    const inside = sceneRef.current
    if (!inside) return
    state.current.target = null
    inside.setFocus(null)
    state.current.progress = Math.min(1, Math.max(0, state.current.progress + distance / inside.length))
  }

  // Keyboard arrows move forward and back (but not while typing in a field or using the slider).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') step(ARROW_STEP)
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') step(-ARROW_STEP)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // "Go to finding": glide to just before the finding and stop there.
  const goTo = (id: string) => {
    const inside = sceneRef.current
    const f = inside?.findings.find((x) => x.id === id)
    if (!inside || !f) return
    setPlaying(false)
    state.current.target = f.at // a spot on the path from which the finding can be seen
    inside.setFocus(f.point)
  }

  // Any other movement looks ahead along the colon again.
  const lookAhead = () => sceneRef.current?.setFocus(null)

  return (
    <div className="inside-view">
      <div className="inside-canvas" ref={holder} />
      <div className="inside-vignette" />

      {/* Finding labels, placed by the animation loop. */}
      {findings.map((f) => (
        <div
          key={f.id}
          ref={(el) => {
            labels.current[f.id] = el
          }}
          className={`inside-label inside-label-${f.kind}`}
          style={{ display: 'none' }}
        >
          {names[f.id].name} · {formatSize(f.size)}
        </div>
      ))}

      {!ready && <p className="inside-loading">Preparing the inside view…</p>}

      <div className="inside-controls">
        <button
          className="button"
          onClick={() => {
            lookAhead()
            setPlaying(!playing)
          }}
          disabled={!ready}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <span className="inside-end">Start</span>
        <input
          className="range inside-slider"
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          aria-label="Position in the colon"
          disabled={!ready}
          style={{ '--fill': `${progress * 100}%` } as CSSProperties}
          onChange={(e) => {
            lookAhead()
            state.current.target = null
            state.current.progress = Number(e.target.value) / 1000
          }}
        />
        <span className="inside-end">End</span>
        <select value="" onChange={(e) => goTo(e.target.value)} disabled={!ready || findings.length === 0} aria-label="Go to finding">
          <option value="">{findings.length ? 'Go to finding…' : 'No findings'}</option>
          {findings.map((f) => (
            <option key={f.id} value={f.id}>
              {names[f.id].name} · {formatSize(f.size)}
            </option>
          ))}
        </select>
      </div>

      <p className="inside-note">Simulation based on a reference model. Not a real video and not from patient scan data.</p>
    </div>
  )
}
