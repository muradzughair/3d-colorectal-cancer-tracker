// A 3D close-up of one polyp on the colon. The camera starts right next to the polyp and the
// doctor can still rotate and zoom. A small growth sits on the colon surface at that point;
// its size and colour come from the time slider (blue = polyp, red = tumor).
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createColonScene } from '../lib/colonScene'
import { estimatedPoint, loadColonModel, surfaceNormalAt, type ColonModel } from '../lib/colonModel'
import { findingPositions } from '../lib/pinPositions'
import type { Finding } from '../types'

const MODEL_URL = `${import.meta.env.BASE_URL}models/colon.glb`

interface Props {
  findings: Finding[]
  selectedId: string | null // the selected polyp; if there is none, a sigmoid example is used
  radius: number // size of the growth in scene units
  color: string // '#2563eb' (polyp) or '#dc2626' (tumor)
}

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
  const growth = useRef<THREE.Mesh | null>(null)
  const latest = useRef({ radius, color }) // the newest slider values, for when the model finishes loading
  latest.current = { radius, color }
  const [ready, setReady] = useState(false)

  // Build the 3D scene once: the colon, the growth and the camera next to the polyp.
  useEffect(() => {
    const view = createColonScene(holder.current!, { groundShadow: false })
    let cancelled = false

    loadColonModel(MODEL_URL).then((model) => {
      if (cancelled) return
      view.scene.add(model.root)

      // Where is the polyp? The selected polyp's pin position, or the sigmoid colon.
      const selected = findings.find((f) => f.id === selectedId && f.kind === 'polyp')
      const point = selected ? findingPositions(model, findings)[selected.id] : estimatedPoint(model, 'sigmoid', 0)
      const normal = surfaceNormalAt(model, point)

      // The growth: a flattened ball standing on the surface.
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 40, 28),
        new THREE.MeshPhysicalMaterial({ color: latest.current.color, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
      )
      mesh.position.copy(point)
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
      mesh.scale.set(latest.current.radius, latest.current.radius * 0.55, latest.current.radius)
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
      setReady(true)
    })

    return () => {
      cancelled = true
      growth.current = null
      view.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- built once; the page is rebuilt when it is opened again
  }, [])

  // Whenever the slider moves, resize and recolour the growth.
  useEffect(() => {
    const mesh = growth.current
    if (!ready || !mesh) return
    mesh.scale.set(radius, radius * 0.55, radius)
    ;(mesh.material as THREE.MeshPhysicalMaterial).color.set(color)
  }, [ready, radius, color])

  return (
    <div className="closeup">
      <div className="colon-canvas" ref={holder} />
    </div>
  )
}
