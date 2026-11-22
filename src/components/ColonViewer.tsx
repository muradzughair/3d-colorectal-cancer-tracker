// The 3D colon: the model with segment labels and a marker (ring, leader line and label) for
// every finding, plus faint crossed rings for lesions removed on an earlier visit.
// The doctor can rotate (drag) and zoom (scroll). Hover a marker to highlight it, click it to
// open its detail card. In marking mode, a click on the colon places a manual mark; the
// segment comes from the part that was clicked.
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createColonScene, type ColonScene } from '../lib/colonScene'
import { loadColonModel, type ColonModel } from '../lib/colonModel'
import { createLabels } from '../lib/labels'
import { useNamesVisible } from '../lib/namesSetting'
import { createLesionMarkers } from '../lib/lesionMarkers'
import { cmAtPoint, findingPositions } from '../lib/pinPositions'
import { surfaceNormalAt } from '../lib/colonModel'
import { isMeasured, labelText, type LesionCode } from '../lib/lesions'
import type { SegmentId } from '../data/segments'
import type { Finding, FindingKind } from '../types'

const MODEL_URL = `${import.meta.env.BASE_URL}models/colon.glb`

interface Props {
  findings: Finding[]
  removed?: Finding[] // lesions removed on an earlier visit (shown as faint crossed rings)
  codes: Record<string, LesionCode> // P1 / T1 codes of the patient's lesions
  selectedId: string | null
  onSelect: (id: string) => void // a marker was clicked
  markMode: FindingKind | null // what a click on the colon adds (null = clicks do nothing)
  onMark: (kind: FindingKind, segment: SegmentId, position: [number, number, number]) => void
  onScene?: (scene: ColonScene | null) => void // gives the page the 3D scene (to link two views)
  onModelCm?: (cms: Record<string, number>) => void // cm worked out from the model, for findings without a distance
  rightInset?: number // pixels on the right covered by the findings list (labels stay clear of it)
}

export default function ColonViewer({ findings, removed = [], codes, selectedId, onSelect, markMode, onMark, onScene, onModelCm, rightInset = 0 }: Props) {
  const canvasHolder = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const view = useRef<ColonScene | null>(null)
  const model = useRef<ColonModel | null>(null)
  const markers = useRef<ReturnType<typeof createLesionMarkers> | null>(null)
  const labelsRef = useRef<ReturnType<typeof createLabels> | null>(null)
  const [loaded, setLoaded] = useState(false)
  const showNames = useNamesVisible()

  // Keep the latest click handler in a ref, so the 3D code (built once) always calls the current one.
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const markRef = useRef({ markMode, onMark })
  markRef.current = { markMode, onMark }
  const onSceneRef = useRef(onScene)
  onSceneRef.current = onScene
  const onModelCmRef = useRef(onModelCm)
  onModelCmRef.current = onModelCm
  const insetRef = useRef(rightInset)
  insetRef.current = rightInset

  // Build the 3D scene once when the component appears, and clean it up when it disappears.
  useEffect(() => {
    const scene = createColonScene(canvasHolder.current!)
    const markerLayer = createLesionMarkers(scene.scene, overlay.current!, (id) => onSelectRef.current(id))
    view.current = scene
    onSceneRef.current?.(scene)
    markers.current = markerLayer
    let disposeLabels = () => {}
    let cancelled = false

    loadColonModel(MODEL_URL).then((loadedModel) => {
      if (cancelled) return
      model.current = loadedModel
      scene.scene.add(loadedModel.root)
      const labels = createLabels(overlay.current!, loadedModel.anchors)
      labelsRef.current = labels
      disposeLabels = labels.dispose
      scene.onFrame(() => {
        const { clientWidth, clientHeight } = canvasHolder.current!
        labels.update(scene.camera, clientWidth, clientHeight)
        markerLayer.update(scene.camera, clientWidth, clientHeight, loadedModel.meshes, insetRef.current)
      })
      setLoaded(true)
    })

    // A click (not a drag to rotate) on a marker opens it; in marking mode, a click on the
    // colon adds a mark there. Moving the mouse over a ring highlights it.
    const canvas = scene.renderer.domElement
    let downX = 0
    let downY = 0
    const pointerAt = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    }
    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX
      downY = e.clientY
    }
    const onPointerMove = (e: PointerEvent) => {
      if (e.buttons) return // rotating
      const id = markerLayer.pick(pointerAt(e), scene.camera)
      markerLayer.setHover(id)
      canvas.style.cursor = id ? 'pointer' : ''
    }
    const onPointerUp = (e: PointerEvent) => {
      const { markMode, onMark } = markRef.current
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY)
      if (moved > 5) return
      const pointer = pointerAt(e)
      if (!markMode) {
        const id = markerLayer.pick(pointer, scene.camera)
        if (id) onSelectRef.current(id)
        return
      }
      if (!model.current) return
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(pointer, scene.camera)
      const hit = raycaster.intersectObjects(model.current.meshes, false)[0]
      if (hit) onMark(markMode, hit.object.userData.segment, hit.point.toArray())
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)

    return () => {
      cancelled = true
      onSceneRef.current?.(null)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      disposeLabels()
      markerLayer.dispose()
      scene.dispose()
    }
  }, [])

  // The "Names" toggle: show or hide the part names.
  useEffect(() => {
    labelsRef.current?.setVisible(showNames)
  }, [showNames, loaded])

  // Whenever the findings or the selection change, redraw the markers.
  useEffect(() => {
    const m = model.current
    if (!loaded || !m || !markers.current) return
    const places = { ...findingPositions(m, removed), ...findingPositions(m, findings) }
    const toMarker = (f: Finding, isRemoved: boolean) => {
      const position = places[f.id]
      const sizeMm = f.size ? (f.size.unit === 'cm' ? f.size.value * 10 : f.size.value) : f.kind === 'polyp' ? 6 : 30
      const modelCm = f.distanceFromAnalVergeCm === undefined ? cmAtPoint(m, position) : null
      return {
        id: f.id,
        kind: f.kind,
        label: labelText(f, codes[f.id]?.code ?? '?', modelCm) + (isRemoved ? ' - removed' : ''),
        position,
        normal: surfaceNormalAt(m, position),
        sizeMm,
        dashed: !isMeasured(f),
        removed: isRemoved,
        selected: f.id === selectedId,
      }
    }
    markers.current.set([...removed.map((f) => toMarker(f, true)), ...findings.map((f) => toMarker(f, false))])
    // Tell the page the approximate cm of findings without a recorded distance.
    const cms: Record<string, number> = {}
    for (const f of [...removed, ...findings]) if (f.distanceFromAnalVergeCm === undefined) cms[f.id] = cmAtPoint(m, places[f.id])
    onModelCmRef.current?.(cms)
  }, [findings, removed, codes, selectedId, loaded])

  return (
    <div className={`colon-viewer${markMode ? ' is-marking' : ''}`}>
      <div className="colon-canvas" ref={canvasHolder} />
      <div className="colon-overlay" ref={overlay} />
      {markMode && <div className="mark-hint">Click on the colon to place the {markMode}.</div>}
    </div>
  )
}
