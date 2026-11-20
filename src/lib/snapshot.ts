// A still picture of the 3D colon with the visit's findings as numbered pins, for the report.
// The colon is drawn once in a hidden 3D view, then the pins are painted on top of the image
// (on screen they are HTML elements, which a picture does not contain).
import * as THREE from 'three'
import { createColonScene } from './colonScene'
import { loadColonModel } from './colonModel'
import { findingPositions } from './pinPositions'
import { describeFindings } from './findings'
import type { Finding } from '../types'

const MODEL_URL = `${import.meta.env.BASE_URL}models/colon.glb`
const WIDTH = 900
const HEIGHT = 700

export async function colonSnapshot(findings: Finding[]): Promise<string> {
  // A hidden place to draw in (it must have a size, so it is placed off the screen).
  const holder = document.createElement('div')
  holder.style.cssText = `position: fixed; left: -${WIDTH * 2}px; top: 0; width: ${WIDTH}px; height: ${HEIGHT}px;`
  document.body.appendChild(holder)
  const view = createColonScene(holder)

  try {
    const model = await loadColonModel(MODEL_URL)
    view.scene.add(model.root)
    view.renderer.render(view.scene, view.camera)

    // Copy the 3D picture onto a plain canvas with a white background.
    const canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.drawImage(view.renderer.domElement, 0, 0, WIDTH, HEIGHT)

    // Paint a pin for every finding: blue numbered circle for a polyp, red for a tumor.
    const names = describeFindings(findings)
    const places = findingPositions(model, findings)
    const screen = new THREE.Vector3()
    for (const f of findings) {
      screen.copy(places[f.id]).project(view.camera)
      const x = (screen.x * 0.5 + 0.5) * WIDTH
      const y = (-screen.y * 0.5 + 0.5) * HEIGHT - 16 // the pin head sits just above its point
      ctx.beginPath()
      ctx.arc(x, y, 13, 0, Math.PI * 2)
      ctx.fillStyle = f.kind === 'polyp' ? '#2563eb' : '#dc2626'
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = '#ffffff'
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      const text = names[f.id].pinText
      if (text) {
        ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, x, y + 1)
      } else {
        ctx.beginPath() // a single tumor has no number: a small white dot, as on screen
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    return canvas.toDataURL('image/png')
  } finally {
    view.dispose()
    holder.remove()
  }
}
