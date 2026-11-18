// The 3D colon map: the model with segment labels and a pin for every finding.
// The doctor can rotate (drag) and zoom (scroll).
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createColonScene, type ColonScene } from '../lib/colonScene'
import { estimatedPoint, loadColonModel, type ColonModel } from '../lib/colonModel'
import { createLabels } from '../lib/labels'
import { createPins } from '../lib/pins'
import { describeFindings } from '../lib/findings'
import { getSegment, type SegmentId } from '../data/segments'
import type { Finding } from '../types'

const MODEL_URL = '/models/colon.glb'

interface Props {
  findings: Finding[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function ColonViewer({ findings, selectedId, onSelect }: Props) {
  const canvasHolder = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const view = useRef<ColonScene | null>(null)
  const model = useRef<ColonModel | null>(null)
  const pins = useRef<ReturnType<typeof createPins> | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Keep the latest click handler in a ref, so the 3D code (built once) always calls the current one.
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

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

    return () => {
      cancelled = true
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
        position = estimatedPoint(model.current!, f.segment, index).position
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
    <div className="colon-viewer">
      <div className="colon-canvas" ref={canvasHolder} />
      <div className="colon-overlay" ref={overlay} />
    </div>
  )
}
