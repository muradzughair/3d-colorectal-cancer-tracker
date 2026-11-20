// Links two 3D views: when the doctor rotates or zooms one, the other follows.
import type { ColonScene } from './colonScene'

export function linkViews(a: ColonScene, b: ColonScene): () => void {
  let busy = false // stops the two views from answering each other forever

  const follow = (from: ColonScene, to: ColonScene) => () => {
    if (busy) return
    busy = true
    to.camera.position.copy(from.camera.position)
    to.controls.update() // turns the camera to look at the centre, like the other one
    busy = false
  }

  const aToB = follow(a, b)
  const bToA = follow(b, a)
  a.controls.addEventListener('change', aToB)
  b.controls.addEventListener('change', bToA)
  aToB() // start with the same angle

  return () => {
    a.controls.removeEventListener('change', aToB)
    b.controls.removeEventListener('change', bToA)
  }
}
