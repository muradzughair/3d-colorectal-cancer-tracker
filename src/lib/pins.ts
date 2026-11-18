// Finding pins on the 3D colon: blue numbered pins for polyps, red pins for tumors.
// Pins are small HTML elements placed over the 3D view, so they stay crisp at any zoom.
import * as THREE from 'three'
import type { FindingKind } from '../types'

export interface PinData {
  id: string
  kind: FindingKind
  text: string // number inside the pin
  caption: string // shown next to the selected pin, e.g. "Polyp 1 · Cecum · estimated position"
  position: THREE.Vector3
  selected: boolean
}

export function createPins(overlay: HTMLElement, onClick: (id: string) => void) {
  let pins: { data: PinData; element: HTMLDivElement }[] = []
  const raycaster = new THREE.Raycaster()
  const screen = new THREE.Vector3()
  const direction = new THREE.Vector3()

  // Replace all pins with a new list.
  function set(list: PinData[]) {
    pins.forEach((p) => p.element.remove())
    pins = list.map((data) => {
      const element = document.createElement('div')
      element.className = `pin pin-${data.kind}${data.selected ? ' is-selected' : ''}`
      element.title = data.caption
      element.innerHTML = `<span class="pin-head">${data.text}</span>`
      if (data.selected) {
        const caption = document.createElement('span')
        caption.className = 'pin-caption'
        caption.textContent = data.caption
        element.appendChild(caption)
      }
      element.addEventListener('click', () => onClick(data.id))
      overlay.appendChild(element)
      return { data, element }
    })
  }

  // Called every frame: move each pin to its point on screen and fade it if the
  // colon is in front of it.
  function update(camera: THREE.Camera, width: number, height: number, meshes: THREE.Object3D[]) {
    for (const { data, element } of pins) {
      screen.copy(data.position).project(camera)
      const x = (screen.x * 0.5 + 0.5) * width
      const y = (-screen.y * 0.5 + 0.5) * height
      element.style.transform = `translate(${x}px, ${y}px)`

      // Is something between the camera and the pin's point?
      direction.copy(data.position).sub(camera.position)
      const distance = direction.length()
      raycaster.set(camera.position, direction.normalize())
      const hit = raycaster.intersectObjects(meshes, false)[0]
      const hidden = hit !== undefined && hit.distance < distance - 0.03
      element.classList.toggle('is-behind', hidden)
    }
  }

  return { set, update, dispose: () => pins.forEach((p) => p.element.remove()) }
}
