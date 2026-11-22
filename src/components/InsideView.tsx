// Inside view of the 3D colon page: a simulated endoscopy through the reference colon model,
// with a free camera (see src/lib/insideControls.ts): drag to look, W A S D to move, Q / E down
// and up, the mouse wheel for small steps. The camera cannot leave the inside of the colon.
// Also: "Go to finding", "Re-center", the colon part the camera is in, a mini-map, and a small
// label next to a finding when the camera is close to it.
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import InsideMiniMap, { type MapPoint } from './InsideMiniMap'
import { getSegment } from '../data/segments'
import { CENTERLINE } from '../data/centerline'
import { createInsideControls, type InsideControls } from '../lib/insideControls'
import { createInsideScene, type InsideScene } from '../lib/insideScene'
import { formatSize } from '../lib/findings'
import { cmAtIndex, cmText } from '../lib/colonDistance'
import { lesionName, type LesionCode } from '../lib/lesions'
import type { Finding } from '../types'

const LABEL_DISTANCE = 0.6 // labels show when the camera is closer than this
const HINT_TIME = 6000 // the movement hint fades after this many milliseconds

interface Props {
  findings: Finding[]
  codes: Record<string, LesionCode>
  focusId?: string | null // go to this finding as soon as the view is ready ("Show inside")
}

export default function InsideView({ findings, codes, focusId }: Props) {
  const holder = useRef<HTMLDivElement>(null)
  const labels = useRef<Record<string, HTMLDivElement | null>>({})
  const partText = useRef<HTMLSpanElement>(null)
  const sceneRef = useRef<InsideScene | null>(null)
  const controlsRef = useRef<InsideControls | null>(null)
  const setMapCamera = useRef<(position: MapPoint, heading: MapPoint) => void>(() => {})
  const [ready, setReady] = useState(false)
  const [hint, setHint] = useState(true)
  const [map, setMap] = useState<{ line: MapPoint[]; marks: { id: string; kind: Finding['kind']; point: MapPoint }[] } | null>(null)

  // Show the movement hint, then let it fade.
  const hintTimer = useRef(0)
  const showHint = useCallback(() => {
    setHint(true)
    window.clearTimeout(hintTimer.current)
    hintTimer.current = window.setTimeout(() => setHint(false), HINT_TIME)
  }, [])

  // Build the inside scene and the free camera once.
  useEffect(() => {
    let cancelled = false
    let built: InsideScene | null = null
    let controls: InsideControls | null = null
    showHint()
    createInsideScene(holder.current!, findings).then((inside) => {
      if (cancelled) return inside.dispose()
      built = inside
      sceneRef.current = inside
      controls = createInsideControls(inside.camera, inside.canvas, inside.tube, showHint)
      controlsRef.current = controls
      const camera = inside.camera
      const screen = new THREE.Vector3()
      const heading = new THREE.Vector3()
      const mapPosition = { x: 0, y: 0 }
      const mapHeading = { x: 0, y: 0 }
      let lastText = ''
      const last = inside.tube.points.length - 1

      inside.onFrame((dt) => {
        controls!.update(dt)

        // The colon part the camera is in and the approximate cm (changed only when it changes).
        const k = controls!.index()
        const cm = cmAtIndex((k / last) * (CENTERLINE.length - 1))
        const text = `${getSegment(inside.tube.segmentAt(k)).name} · ${cmText(cm, false)} from the anal verge`
        if (text !== lastText && partText.current) {
          lastText = text
          partText.current.textContent = text
        }

        // The camera on the mini-map (front view: x to the right, y up).
        camera.getWorldDirection(heading)
        mapPosition.x = camera.position.x
        mapPosition.y = camera.position.y
        mapHeading.x = heading.x
        mapHeading.y = heading.y
        setMapCamera.current(mapPosition, mapHeading)

        // Labels: only for findings close to the camera, in front of it and not behind the wall.
        const { clientWidth: w, clientHeight: h } = holder.current!
        for (const f of inside.findings) {
          const label = labels.current[f.id]
          if (!label) continue
          screen.copy(f.point).project(camera)
          const near = camera.position.distanceTo(f.point) < LABEL_DISTANCE
          const show = near && screen.z < 1 && Math.abs(screen.x) < 1 && Math.abs(screen.y) < 1 && inside.isVisible(f.point)
          label.style.display = show ? 'block' : 'none'
          if (show) label.style.transform = `translate(${(screen.x * 0.5 + 0.5) * w}px, ${(-screen.y * 0.5 + 0.5) * h}px)`
        }
      })

      setMap({
        line: inside.tube.points.filter((_, i) => i % 4 === 0).map((p) => ({ x: p.x, y: p.y })),
        marks: inside.findings.map((f) => ({ id: f.id, kind: findings.find((x) => x.id === f.id)!.kind, point: { x: f.point.x, y: f.point.y } })),
      })
      setReady(true)
      // Opened with "Show inside": glide to that lesion.
      const focus = inside.findings.find((f) => f.id === focusId)
      if (focus) controls.goTo(focus.viewFrom, focus.point)
    })
    return () => {
      cancelled = true
      window.clearTimeout(hintTimer.current)
      controls?.dispose()
      built?.dispose()
      sceneRef.current = null
      controlsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- built once; the page rebuilds it for another visit
  }, [])

  // "Go to finding": glide to about 5 cm in front of the finding, looking at it.
  const goToFinding = (id: string) => {
    const f = sceneRef.current?.findings.find((x) => x.id === id)
    if (f) controlsRef.current?.goTo(f.viewFrom, f.point)
  }

  const registerMap = useCallback((setCamera: (position: MapPoint, heading: MapPoint) => void) => {
    setMapCamera.current = setCamera
  }, [])

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
          {lesionName(f, codes)} · {formatSize(f.size)}
        </div>
      ))}

      {!ready && <p className="inside-loading">Preparing the inside view…</p>}

      {map && (
        <div className="inside-map">
          {/* Map points are every 4th centerline point, so the picked index is scaled back. */}
          <InsideMiniMap line={map.line} marks={map.marks} register={registerMap} onPick={(i) => controlsRef.current?.moveToIndex(Math.min(i * 4, (sceneRef.current?.tube.points.length ?? 1) - 1))} />
        </div>
      )}

      <div className="inside-controls">
        <span className="inside-position">
          <span className="muted">Now in</span> <strong ref={partText}>…</strong>
        </span>
        <button className="button button-light" onClick={() => controlsRef.current?.recenter()} disabled={!ready} title="Back to the middle of the colon, looking along it">
          Re-center
        </button>
        <select value="" onChange={(e) => goToFinding(e.target.value)} disabled={!ready || findings.length === 0} aria-label="Go to finding">
          <option value="">{findings.length ? 'Go to finding…' : 'No findings'}</option>
          {findings.map((f) => (
            <option key={f.id} value={f.id}>
              {lesionName(f, codes)} · {formatSize(f.size)}
            </option>
          ))}
        </select>
      </div>

      <p className={`inside-hint${hint ? ' is-visible' : ''}`}>W A S D move, drag to look, Q / E up and down, wheel forward. Press ? to show this again.</p>
      <p className="inside-note">Simulation based on a reference model. Not a real video and not from patient scan data.</p>
    </div>
  )
}
