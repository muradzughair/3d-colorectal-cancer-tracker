// The 3D colon map: shows the model with segment labels. The doctor can rotate and zoom.
import { useEffect, useRef } from 'react'
import { createColonScene } from '../lib/colonScene'
import { loadColonModel } from '../lib/colonModel'
import { createLabels } from '../lib/labels'

const MODEL_URL = '/models/colon.glb'

export default function ColonViewer() {
  const canvasHolder = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLDivElement>(null)

  // Build the 3D scene once when the component appears, and clean it up when it disappears.
  useEffect(() => {
    const view = createColonScene(canvasHolder.current!)
    let disposeLabels = () => {}
    let cancelled = false

    loadColonModel(MODEL_URL).then((model) => {
      if (cancelled) return
      view.scene.add(model.root)
      const labels = createLabels(overlay.current!, model.anchors)
      disposeLabels = labels.dispose
      view.onFrame(() => {
        const { clientWidth, clientHeight } = canvasHolder.current!
        labels.update(view.camera, clientWidth, clientHeight)
      })
    })

    return () => {
      cancelled = true
      disposeLabels()
      view.dispose()
    }
  }, [])

  return (
    <div className="colon-viewer">
      <div className="colon-canvas" ref={canvasHolder} />
      <div className="colon-overlay" ref={overlay} />
    </div>
  )
}
