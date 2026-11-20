// The 3D colon map: the model with segment labels and a pin for every finding.
// The doctor can rotate (drag) and zoom (scroll). In marking mode, a click on the colon
// places a manual mark; the segment comes from the part that was clicked.
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createColonScene, type ColonScene } from '../lib/colonScene'
import { loadColonModel, setRemovedSegments, type ColonModel } from '../lib/colonModel'
import { createLabels } from '../lib/labels'
import { createPins } from '../lib/pins'
import { findingPositions } from '../lib/pinPositions'
import { describeFindings } from '../lib/findings'
import { getSegment, type SegmentId } from '../data/segments'
import type { Finding, FindingKind } from '../types'

const MODEL_URL = `${import.meta.env.BASE_URL}models/colon.glb`

interface Props {
  findings: Finding[]
  selectedId: string | null
  onSelect: (id: string) => void
  markMode: FindingKind | null // what a click on the colon adds (null = clicks do nothing)
  onMark: (kind: FindingKind, segment: SegmentId, position: [number, number, number]) => void
  // Only used on the Before / after page:
  marks?: Record<string, PinMark> // how the pin of a finding is shown (default: normal pin)
  removedSegments?: SegmentId[] // segments shown greyed out as "Removed segment"
  onScene?: (scene: ColonScene | null) => void // gives the page the 3D scene (to link two views)
}

// How a pin is drawn on the "after treatment" view.
export type PinMark = 'removed' | 'undecided' | 'hidden'

export default function ColonViewer({ findings, selectedId, onSelect, markMode, onMark, marks, removedSegments, onScene }: Props) {
  const canvasHolder = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const view = useRef<ColonScene | null>(null)
  const model = useRef<ColonModel | null>(null)
  const pins = useRef<ReturnType<typeof createPins> | null>(null)
  const labelLayer = useRef<ReturnType<typeof createLabels> | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Keep the latest click handler in a ref, so the 3D code (built once) always calls the current one.
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const markRef = useRef({ markMode, onMark })
  markRef.current = { markMode, onMark }
  const onSceneRef = useRef(onScene)
  onSceneRef.current = onScene

  // Build the 3D scene once when the component appears, and clean it up when it disappears.
  useEffect(() => {
    const scene = createColonScene(canvasHolder.current!)
    const pinLayer = createPins(overlay.current!, (id) => onSelectRef.current(id))
    view.current = scene
    onSceneRef.current?.(scene)
    pins.current = pinLayer
    let disposeLabels = () => {}
    let cancelled = false

    loadColonModel(MODEL_URL).then((loadedModel) => {
      if (cancelled) return
      model.current = loadedModel
      scene.scene.add(loadedModel.root)
      const labels = createLabels(overlay.current!, loadedModel.anchors)
      labelLayer.current = labels
      disposeLabels = labels.dispose
      scene.onFrame(() => {
        const { clientWidth, clientHeight } = canvasHolder.current!
        labels.update(scene.camera, clientWidth, clientHeight)
        pinLayer.update(scene.camera, clientWidth, clientHeight, loadedModel.meshes)
      })
      setLoaded(true)
    })

    // Manual marking: a click (not a drag to rotate) on the colon adds a mark there.
    const canvas = scene.renderer.domElement
    let downX = 0
    let downY = 0
    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX
      downY = e.clientY
    }
    const onPointerUp = (e: PointerEvent) => {
      const { markMode, onMark } = markRef.current
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY)
      if (!markMode || !model.current || moved > 5) return
      const rect = canvas.getBoundingClientRect()
      const pointer = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      )
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(pointer, scene.camera)
      const hit = raycaster.intersectObjects(model.current.meshes, false)[0]
      if (hit) onMark(markMode, hit.object.userData.segment, hit.point.toArray())
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)

    return () => {
      cancelled = true
      onSceneRef.current?.(null)
      labelLayer.current = null
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      disposeLabels()
      pinLayer.dispose()
      scene.dispose()
    }
  }, [])

  // Whenever the findings, the selection or the marks change, redraw the pins.
  const marksKey = JSON.stringify(marks ?? {})
  useEffect(() => {
    if (!loaded || !model.current || !pins.current) return
    const names = describeFindings(findings)
    const places = findingPositions(model.current, findings)

    const pinList = findings
      .filter((f) => marks?.[f.id] !== 'hidden')
      .map((f) => {
        const mark = marks?.[f.id] as 'removed' | 'undecided' | undefined
        const where = f.position ? 'exact position' : 'estimated position'
        const note = mark === 'removed' ? ' · removed' : mark === 'undecided' ? ' · not decided' : ''
        return {
          id: f.id,
          kind: f.kind,
          text: mark === 'removed' ? '×' : names[f.id].pinText,
          caption: `${names[f.id].name} · ${getSegment(f.segment).name} · ${where}${note}`,
          position: places[f.id],
          selected: f.id === selectedId,
          variant: mark,
        }
      })
    pins.current.set(pinList)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- marks is tracked through marksKey
  }, [findings, selectedId, loaded, marksKey])

  // Grey out the segments that surgery removes, and say so on their labels.
  const removedKey = (removedSegments ?? []).join(',')
  useEffect(() => {
    if (!loaded || !model.current) return
    const removed = removedKey ? (removedKey.split(',') as SegmentId[]) : []
    setRemovedSegments(model.current, removed)
    labelLayer.current?.setRemoved(removed)
  }, [loaded, removedKey])

  return (
    <div className={`colon-viewer${markMode ? ' is-marking' : ''}`}>
      <div className="colon-canvas" ref={canvasHolder} />
      <div className="colon-overlay" ref={overlay} />
      {markMode && <div className="mark-hint">Click on the colon to place the {markMode}.</div>}
    </div>
  )
}
