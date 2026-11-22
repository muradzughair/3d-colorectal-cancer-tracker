// Lesion markers on the outside 3D colon (replaces the old pins):
//   1. a thin flat ring lying on the wall (blue polyp, red tumor), sized from the lesion size
//      but never smaller than a clearly visible minimum. Solid = position measured or confirmed
//      at surgery, dashed = estimated. A removed lesion is a faint grey ring with a line through it.
//   2. a thin leader line from the ring to a small one-line label ("P1 - Polyp - 8 mm - ...").
//      Labels are pushed apart vertically so they never overlap.
// Hover highlights a marker and its label; a click on either reports the lesion.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { MM } from './insideScene'
import type { FindingKind } from '../types'

export interface MarkerData {
  id: string
  kind: FindingKind
  label: string
  position: THREE.Vector3 // on the outer wall
  normal: THREE.Vector3 // outward
  sizeMm: number
  dashed: boolean // estimated position
  removed: boolean
  selected: boolean
}

const MIN_RADIUS = 0.032 // smallest ring on screen (scene units)
const COLORS = { polyp: 0x2563eb, tumor: 0xdc2626, removed: 0x8a94a3 }
const LABEL_GAP = 6 // pixels between labels
const OFFSET_X = 46 // how far a label sits beside its ring, in pixels

// A ring in the XY plane (facing +Z): solid, dashed (12 arcs), or crossed (removed).
function ringGeometry(radius: number, dashed: boolean, crossed: boolean): THREE.BufferGeometry {
  const width = Math.max(radius * 0.18, 0.006)
  const inner = radius - width / 2
  const outer = radius + width / 2
  const parts: THREE.BufferGeometry[] = []
  if (dashed) {
    const arcs = 12
    for (let i = 0; i < arcs; i++) parts.push(new THREE.RingGeometry(inner, outer, 6, 1, (i / arcs) * Math.PI * 2, (Math.PI * 2 * 0.6) / arcs))
  } else {
    parts.push(new THREE.RingGeometry(inner, outer, 48))
  }
  if (crossed) {
    const bar = new THREE.PlaneGeometry(outer * 2.3, width)
    bar.rotateZ(Math.PI / 4)
    parts.push(bar)
  }
  const merged = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)))
  parts.forEach((g) => g.dispose())
  return merged
}

interface Marker {
  side: number // -1: label on the left of the ring, 1: on the right
  data: MarkerData
  mesh: THREE.Mesh
  label: HTMLDivElement
  line: SVGLineElement
  x: number
  y: number
  labelX: number
  labelY: number
}

export function createLesionMarkers(scene: THREE.Scene, overlay: HTMLElement, onClick: (id: string) => void) {
  const group = new THREE.Group()
  scene.add(group)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.classList.add('lesion-lines')
  overlay.appendChild(svg)
  let markers: Marker[] = []
  let hovered: string | null = null

  const screen = new THREE.Vector3()
  const toPoint = new THREE.Vector3()
  const raycaster = new THREE.Raycaster()
  const zAxis = new THREE.Vector3(0, 0, 1)

  const clear = () => {
    for (const m of markers) {
      group.remove(m.mesh)
      m.mesh.geometry.dispose()
      ;(m.mesh.material as THREE.Material).dispose()
      m.label.remove()
      m.line.remove()
    }
    markers = []
  }

  const highlight = () => {
    for (const m of markers) {
      const on = m.data.id === hovered || m.data.selected
      const material = m.mesh.material as THREE.MeshBasicMaterial
      material.opacity = m.data.removed ? (on ? 0.8 : 0.5) : on ? 1 : 0.85
      m.mesh.scale.setScalar(m.data.id === hovered ? 1.2 : 1)
      m.label.classList.toggle('is-hover', m.data.id === hovered)
      m.label.classList.toggle('is-selected', m.data.selected)
      m.line.classList.toggle('is-hover', on)
    }
  }

  // Replace all markers with a new list.
  function set(list: MarkerData[]) {
    clear()
    markers = list.map((data) => {
      const radius = Math.max(MIN_RADIUS, (data.sizeMm / 2) * MM)
      const mesh = new THREE.Mesh(
        ringGeometry(radius, data.dashed, data.removed),
        new THREE.MeshBasicMaterial({
          color: data.removed ? COLORS.removed : COLORS[data.kind],
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        }),
      )
      mesh.position.copy(data.position).addScaledVector(data.normal, 0.004) // just off the wall
      mesh.quaternion.setFromUnitVectors(zAxis, data.normal)
      mesh.userData.lesionId = data.id
      group.add(mesh)

      const label = document.createElement('div')
      label.className = `lesion-label lesion-label-${data.removed ? 'removed' : data.kind}`
      label.textContent = data.label
      label.addEventListener('click', () => onClick(data.id))
      label.addEventListener('mouseenter', () => setHover(data.id))
      label.addEventListener('mouseleave', () => setHover(null))
      overlay.appendChild(label)
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.classList.add(`lesion-line-${data.removed ? 'removed' : data.kind}`)
      svg.appendChild(line)
      return { side: 1, data, mesh, label, line, x: 0, y: 0, labelX: 0, labelY: 0 }
    })
    highlight()
  }

  function setHover(id: string | null) {
    if (id === hovered) return
    hovered = id
    highlight()
  }

  // Called every frame: place the labels beside their rings, keep them apart, draw the lines.
  // rightInset: pixels on the right that are covered by something else (the findings list).
  function update(camera: THREE.Camera, width: number, height: number, meshes: THREE.Object3D[], rightInset = 0) {
    const usable = width - rightInset
    for (const m of markers) {
      screen.copy(m.mesh.position).project(camera)
      m.x = (screen.x * 0.5 + 0.5) * width
      m.y = (-screen.y * 0.5 + 0.5) * height
      // Is the colon in front of the ring? Then fade the label.
      toPoint.copy(m.mesh.position).sub(camera.position)
      const distance = toPoint.length()
      raycaster.set(camera.position, toPoint.normalize())
      const hit = raycaster.intersectObjects(meshes, false)[0]
      m.label.classList.toggle('is-behind', hit !== undefined && hit.distance < distance - 0.03)
    }

    // The colon part names (their boxes) are kept clear too.
    const box = overlay.getBoundingClientRect()
    const obstacles = [...overlay.querySelectorAll<HTMLElement>('.segment-label')]
      .filter((el) => el.style.display !== 'none' && el.offsetParent !== null)
      .map((el) => {
        const r = el.getBoundingClientRect()
        return { left: r.left - box.left, right: r.right - box.left, top: r.top - box.top, bottom: r.bottom - box.top }
      })

    // Labels go to the outer side of their ring (left half: to the left), then each side is
    // spread out so no two labels overlap and no label covers a part name.
    // Each label goes to the outer side of its ring, unless it does not fit there.
    for (const m of markers) {
      const w = m.label.offsetWidth
      m.side = m.x < usable / 2 ? -1 : 1
      if (m.side > 0 && m.x + OFFSET_X + w > usable - 4) m.side = -1
      else if (m.side < 0 && m.x - OFFSET_X - w < 4) m.side = 1
    }
    for (const side of [-1, 1]) {
      const column = markers.filter((m) => m.side === side).sort((a, b) => a.y - b.y)
      let lastBottom = -Infinity
      for (const m of column) {
        const h = m.label.offsetHeight || 20
        const w = m.label.offsetWidth
        m.labelX = side < 0 ? Math.max(4, m.x - OFFSET_X - w) : Math.min(usable - w - 4, m.x + OFFSET_X)
        m.labelY = Math.max(m.y - h / 2, lastBottom + LABEL_GAP)
        for (let tries = 0; tries < 12; tries++) {
          const blocking = obstacles.find((o) => o.left < m.labelX + w && m.labelX < o.right && o.top < m.labelY + h && m.labelY < o.bottom)
          if (!blocking) break
          m.labelY = blocking.bottom + 3
        }
        lastBottom = m.labelY + h
      }
      // If the column runs off the bottom, push it back up.
      const overflow = lastBottom - (height - 8)
      if (overflow > 0) column.forEach((m) => (m.labelY -= overflow))
      for (const m of column) {
        const w = m.label.offsetWidth
        m.label.style.transform = `translate(${m.labelX}px, ${m.labelY}px)`
        const h = m.label.offsetHeight || 20
        m.line.setAttribute('x1', m.x.toFixed(1))
        m.line.setAttribute('y1', m.y.toFixed(1))
        m.line.setAttribute('x2', (side < 0 ? m.labelX + w : m.labelX).toFixed(1))
        m.line.setAttribute('y2', (m.labelY + h / 2).toFixed(1))
      }
    }
  }

  // The lesion under the mouse (rings only), or null.
  function pick(pointer: THREE.Vector2, camera: THREE.Camera): string | null {
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects(group.children, false)[0]
    return hit ? (hit.object.userData.lesionId as string) : null
  }

  return {
    set,
    update,
    pick,
    setHover,
    dispose: () => {
      clear()
      scene.remove(group)
      svg.remove()
    },
  }
}
