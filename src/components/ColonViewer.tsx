// The 3D colon map: the model with segment labels and a pin for every finding.
// The doctor can rotate (drag) and zoom (scroll). In marking mode, a click on the colon
// places a manual mark; the segment comes from the part that was clicked.
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createColonScene, type ColonScene } from '../lib/colonScene'
import { estimatedPoint, loadColonModel, type ColonModel } from '../lib/colonModel'
import { createLabels } from '../lib/labels'
import { createPins } from '../lib/pins'
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
}

export default function ColonViewer({ findings, selectedId, onSelect, markMode, onMark }: Props) {
  const canvasHolder = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const view = useRef<ColonScene | null>(null)
  const model = useRef<ColonModel | null>(null)
  const pins = useRef<ReturnType<typeof createPins> | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Keep the latest click handler in a ref, so the 3D code (built once) always calls the current one.
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const markRef = useRef({ markMode, onMark })
  markRef.current = { markMode, onMark }

  // Build the 3D scene once when the component appears, and clean it up when it disappears.
  useEffect(() => {
    const scene = createColonScene(canvasHolder.current!)
    const pinLayer = createPins(overlay.current!, (id) => onSelectRef.current(id))
    view.current = scene
    pins.current = pinLayer
    let disposeLabels = () => {}
    let cancelled = false

    loadColonModel(MODEL_URL).then((loadedModel) => {
      if (cancelled) return
      model.current = loadedModel
      scene.scene.add(loadedModel.root)
      const labels = createLabels(overlay.current!, loadedModel.anchors)
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
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      disposeLabels()
      pinLayer.dispose()
      scene.dispose()
    }
  }, [])

  // Whenever the findings or the selection change, redraw the pins.
  useEffect(() => {
    if (!loaded || !model.current || !pins.current) return
    const names = describeFindings(findings)
    const countPerSegment: Partial<Record<SegmentId, number>> = {}

    const pinList = findings.map((f) => {
      let position: THREE.Vector3
      if (f.position) {
        position = new THREE.Vector3(...f.position) // manual mark: exact point
      } else {
        const index = countPerSegment[f.segment] ?? 0
        countPerSegment[f.segment] = index + 1
        position = estimatedPoint(model.current!, f.segment, index)
      }
      const where = f.position ? 'exact position' : 'estimated position'
      return {
        id: f.id,
        kind: f.kind,
        text: names[f.id].pinText,
        caption: `${names[f.id].name} · ${getSegment(f.segment).name} · ${where}`,
        position,
        selected: f.id === selectedId,
      }
    })
    pins.current.set(pinList)
  }, [findings, selectedId, loaded])

  return (
    <div className={`colon-viewer${markMode ? ' is-marking' : ''}`}>
      <div className="colon-canvas" ref={canvasHolder} />
      <div className="colon-overlay" ref={overlay} />
      {markMode && <div className="mark-hint">Click on the colon to place the {markMode}.</div>}
    </div>
  )
}
