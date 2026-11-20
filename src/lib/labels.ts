// Small segment name labels next to the 3D colon, joined to the model by thin leader lines.
// Labels sit in two neat columns (left and right of the model) so they never cover it.
import * as THREE from 'three'
import { SEGMENTS, type Segment, type SegmentId } from '../data/segments'
import type { SurfacePoint } from './colonModel'

const ROW_GAP = 20 // minimum vertical space between two labels, in pixels
const SIDE_GAP = 34 // space between the model and the label columns, in pixels

interface Label {
  segment: Segment
  anchor: SurfacePoint
  element: HTMLDivElement
  line: SVGLineElement
  dot: SVGCircleElement
}

export function createLabels(overlay: HTMLElement, anchors: Record<SegmentId, SurfacePoint>) {
  // One SVG layer for all the lines, and one small text box per segment.
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.classList.add('label-lines')
  overlay.appendChild(svg)

  const labels: Label[] = SEGMENTS.filter((s) => anchors[s.id]).map((segment) => {
    const element = document.createElement('div')
    element.className = 'segment-label'
    element.textContent = segment.name
    overlay.appendChild(element)
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    dot.setAttribute('r', '2')
    svg.append(line, dot)
    return { segment, anchor: anchors[segment.id], element, line, dot }
  })

  const screen = new THREE.Vector3()
  const toCamera = new THREE.Vector3()

  // Called every frame: re-place the labels for the current camera angle.
  function update(camera: THREE.Camera, width: number, height: number) {
    // 1. Where is each anchor on screen, and does it face the camera?
    const placed = labels.map((label) => {
      screen.copy(label.anchor.position).project(camera)
      toCamera.copy(camera.position).sub(label.anchor.position).normalize()
      return {
        label,
        x: (screen.x * 0.5 + 0.5) * width,
        y: (-screen.y * 0.5 + 0.5) * height,
        facing: label.anchor.normal.dot(toCamera) > 0,
        labelY: 0,
      }
    })
    const centerX = (Math.min(...placed.map((p) => p.x)) + Math.max(...placed.map((p) => p.x))) / 2
    // Keep the label columns inside the view, even when zoomed in.
    const widest = Math.max(...labels.map((l) => l.element.offsetWidth)) + 12
    const leftEdge = Math.max(widest, Math.min(...placed.map((p) => p.x)) - SIDE_GAP)
    const rightEdge = Math.min(width - widest, Math.max(...placed.map((p) => p.x)) + SIDE_GAP)

    // 2. Split into a left and a right column, then spread each column so labels don't overlap.
    for (const side of ['left', 'right'] as const) {
      const column = placed
        .filter((p) => (side === 'left' ? p.x < centerX : p.x >= centerX))
        .sort((a, b) => a.y - b.y)
      let lastY = -Infinity
      for (const p of column) {
        p.labelY = Math.max(p.y, lastY + ROW_GAP)
        lastY = p.labelY
      }
      // If the column runs off the bottom, push it back up.
      const overflow = lastY - (height - 12)
      if (overflow > 0) column.forEach((p) => (p.labelY -= overflow))

      // 3. Move the label boxes and lines.
      for (const p of column) {
        const lineEndX = side === 'left' ? leftEdge : rightEdge
        const { element, line, dot } = p.label
        element.style.transform =
          side === 'left'
            ? `translate(${lineEndX - 4}px, ${p.labelY}px) translate(-100%, -50%)`
            : `translate(${lineEndX + 4}px, ${p.labelY}px) translate(0, -50%)`
        line.setAttribute('x1', String(p.x))
        line.setAttribute('y1', String(p.y))
        line.setAttribute('x2', String(lineEndX))
        line.setAttribute('y2', String(p.labelY))
        dot.setAttribute('cx', String(p.x))
        dot.setAttribute('cy', String(p.y))
        // Fade labels whose point is on the far side of the colon.
        const opacity = p.facing ? '1' : '0.35'
        element.style.opacity = opacity
        line.style.opacity = opacity
        dot.style.opacity = opacity
      }
    }
  }

  return {
    update,
    dispose: () => {
      svg.remove()
      labels.forEach((l) => l.element.remove())
    },
  }
}
