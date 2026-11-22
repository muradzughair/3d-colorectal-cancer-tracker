// Sets up the 3D view: renderer, camera, lights, soft ground shadow and mouse controls.
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export interface ColonScene {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  onFrame: (callback: () => void) => () => void // run something every frame; returns a stop function
  dispose: () => void
}

// options.groundShadow = false removes the soft shadow under the colon (used by the close-up).
export function createColonScene(container: HTMLElement, options: { groundShadow?: boolean } = {}): ColonScene {
  // Renderer with anti-aliasing and a sensible pixel ratio (sharp but not too heavy).
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0) // transparent: the CSS gradient behind shows through
  renderer.toneMapping = THREE.NeutralToneMapping
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()

  // Soft, even "studio" lighting from all directions.
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.4

  // Key light: the main light, from the upper front right.
  const key = new THREE.DirectionalLight(0xffffff, 2.4)
  key.position.set(3, 4, 2.5)
  scene.add(key)

  // Rim light: from behind, gives a gentle bright edge that separates the colon from the background.
  const rim = new THREE.DirectionalLight(0xfff1ee, 1.6)
  rim.position.set(-3, 2, -4)
  scene.add(rim)

  // Soft fill from above and below, and a gentle front fill so the folds are not too dark.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9c6c2, 0.35))
  const fill = new THREE.DirectionalLight(0xfff6f3, 0.55)
  fill.position.set(-2.5, 0.5, 4)
  scene.add(fill)

  // Soft shadow on the "floor" just under the colon.
  if (options.groundShadow !== false) scene.add(createGroundShadow())

  // Camera: front-facing, slightly from above.
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  camera.position.set(0, 0.3, 4.9)

  // Mouse controls: drag to rotate, scroll to zoom.
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0, 0)
  controls.enableDamping = true
  controls.enablePan = false
  controls.minDistance = 2.2
  controls.maxDistance = 10
  controls.update()

  // Keep the canvas the same size as its container.
  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container
    if (w === 0 || h === 0) return
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(container)
  resize()

  // Draw every frame.
  const callbacks: (() => void)[] = []
  renderer.setAnimationLoop(() => {
    controls.update()
    renderer.render(scene, camera)
    ;[...callbacks].forEach((cb) => cb()) // a copy: a callback may stop itself
  })

  return {
    scene,
    camera,
    renderer,
    controls,
    onFrame: (cb) => {
      callbacks.push(cb)
      return () => {
        const i = callbacks.indexOf(cb)
        if (i >= 0) callbacks.splice(i, 1) // stopping twice does nothing
      }
    },
    dispose: () => {
      renderer.setAnimationLoop(null)
      observer.disconnect()
      controls.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

// A flat plane with a soft dark blur in the middle, placed under the model.
function createGroundShadow(): THREE.Mesh {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(60, 40, 45, 0.22)')
  gradient.addColorStop(1, 'rgba(60, 40, 45, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 1.1),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }),
  )
  plane.rotation.x = -Math.PI / 2
  plane.position.y = -1.04
  return plane
}
