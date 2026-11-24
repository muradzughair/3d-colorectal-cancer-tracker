// A 3D close-up of one polyp on the colon. The camera starts right next to the polyp and the
// doctor can still rotate and zoom. The polyp is drawn with the same shape builder as the
// Inside view (its Paris type, colour and surface); the time slider only makes the same
// polyp bigger, and gives it a redder tint once it has become a tumor.
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createColonScene } from '../lib/colonScene'
import { estimatedPoint, loadColonModel, surfaceNormalAt, type ColonModel } from '../lib/colonModel'
import { findingPositions } from '../lib/pinPositions'
import { createLabels } from '../lib/labels'
import { useNamesVisible } from '../lib/namesSetting'
import { buildPolyp, createLesionKit, lesionSizeMm } from '../lib/lesionMesh'
import type { Finding } from '../types'

const MODEL_URL = `${import.meta.env.BASE_URL}models/colon.glb`

interface Props {
  findings: Finding[]
  selectedId: string | null // the selected polyp; if there is none, a sigmoid example is used
  radius: number // size of the growth in scene units
  color: string // '#2563eb' (still a polyp) or '#dc2626' (has become a tumor)
}

// When no polyp is selected: a small sessile polyp (Paris 0-Is) as an example.
const EXAMPLE: Finding = { id: 'closeup-example', kind: 'polyp', segment: 'sigmoid', size: { value: 6, unit: 'mm' }, source: 'manual', paris: '0-Is' }
const TUMOR_TINT = new THREE.Color('#ff8a80') // multiplies the natural colours: redder, darker

// A camera position near the polyp with a clear view of it. The colon folds over itself, so
// looking straight along the surface normal can end up behind another part of the colon.
// Try a few directions (and distances) and take the first one nothing is in front of.
function cameraSpot(model: ColonModel, point: THREE.Vector3, normal: THREE.Vector3): THREE.Vector3 {
  const front = new THREE.Vector3(0, 0, 1)
  const up = new THREE.Vector3(0, 1, 0)
  const directions = [
    normal.clone().addScaledVector(up, 0.5).normalize(), // slightly from above, so the growth looks 3D
    normal,
    normal.clone().add(front).normalize(),
    front,
    normal.clone().add(up).normalize(),
    normal.clone().sub(up).normalize(),
  ]
  const raycaster = new THREE.Raycaster()

  for (const distance of [0.6, 0.45, 0.3]) {
    for (const direction of directions) {
      const spot = point.clone().addScaledVector(direction, distance)
      raycaster.set(spot, point.clone().sub(spot).normalize())
      const hit = raycaster.intersectObjects(model.meshes, false)[0]
      if (hit && hit.distance > distance - 0.02) return spot // the polyp is the first thing hit
    }
  }
  return point.clone().addScaledVector(normal, 0.6)
}

export default function PolypCloseup({ findings, selectedId, radius, color }: Props) {
  const holder = useRef<HTMLDivElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const growth = useRef<THREE.Mesh | null>(null) // the polyp, built 1 unit wide
  const labelsRef = useRef<ReturnType<typeof createLabels> | null>(null)
  const showNames = useNamesVisible()
  const latest = useRef({ radius, color }) // the newest slider values, for when the model finishes loading
  latest.current = { radius, color }
  const [ready, setReady] = useState(false)

  // Build the 3D scene once: the colon, the growth and the camera next to the polyp.
  useEffect(() => {
    const view = createColonScene(holder.current!, { groundShadow: false })
    const kit = createLesionKit()
    let cancelled = false
    let disposeLabels = () => {}

    loadColonModel(MODEL_URL).then((model) => {
      if (cancelled) return
      view.scene.add(model.root)

      // Where is the polyp? The selected polyp's pin position, or the sigmoid colon.
      const selected = findings.find((f) => f.id === selectedId && f.kind === 'polyp')
      const point = selected ? findingPositions(model, findings)[selected.id] : estimatedPoint(model, 'sigmoid', 0)
      const normal = surfaceNormalAt(model, point)

      // The polyp, built 1 unit wide (so the slider can scale it), standing on the surface.
      // Its own material copy, so only this polyp gets the tumor tint.
      const finding = selected ?? EXAMPLE
      const mesh = buildPolyp(finding, 1 / lesionSizeMm(finding), kit)
      mesh.material = (mesh.material as THREE.MeshPhysicalMaterial).clone()
      mesh.position.copy(point)
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
      applySlider(mesh, latest.current.radius, latest.current.color)
      view.scene.add(mesh)
      growth.current = mesh

      // Start zoomed in on the polyp, looking at it from outside the colon.
      view.controls.target.copy(point)
      view.camera.position.copy(cameraSpot(model, point, normal))
      view.camera.near = 0.02
      view.camera.updateProjectionMatrix()
      view.controls.minDistance = 0.15
      view.controls.maxDistance = 6
      view.controls.update()

      // The colon part names, as on the other 3D views (only those in view are shown).
      const labels = createLabels(overlay.current!, model.anchors)
      labelsRef.current = labels
      disposeLabels = labels.dispose
      view.onFrame(() => labels.update(view.camera, holder.current!.clientWidth, holder.current!.clientHeight))
      setReady(true)
    })

    return () => {
      cancelled = true
      if (growth.current) {
        growth.current.geometry.dispose()
        ;(growth.current.material as THREE.Material).dispose()
      }
      growth.current = null
      kit.dispose()
      labelsRef.current = null
      disposeLabels()
      view.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- built once; the page is rebuilt when it is opened again
  }, [])

  // The "Names" toggle: show or hide the part names.
  useEffect(() => {
    labelsRef.current?.setVisible(showNames)
  }, [showNames, ready])

  // Whenever the slider moves, resize (the same shape, bigger) and tint the polyp.
  useEffect(() => {
    const mesh = growth.current
    if (!ready || !mesh) return
    applySlider(mesh, radius, color)
  }, [ready, radius, color])

  return (
    <div className="closeup">
      <div className="colon-canvas" ref={holder} />
      <div className="colon-overlay" ref={overlay} />
    </div>
  )
}

// Size from the slider (radius in scene units; the mesh is 1 unit wide), and a redder tint
// once the growth has become a tumor.
function applySlider(mesh: THREE.Mesh, radius: number, color: string) {
  mesh.scale.setScalar(radius * 2)
  const tumor = color.toLowerCase() === '#dc2626'
  ;(mesh.material as THREE.MeshPhysicalMaterial).color.copy(tumor ? TUMOR_TINT : new THREE.Color('#ffffff'))
}
