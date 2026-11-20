// Makes a coarse surface finer and rounder, for the close-up Inside view.
// Each triangle is split into 4 smaller ones. The new corner in the middle of each edge is
// pushed out to follow the curve of the surface (the "Phong tessellation" method: it uses the
// direction of the surface at the two ends of the edge). Doing this twice turns flat panels
// into a smooth, round wall. Only the copy used for drawing changes, never the model file.
import * as THREE from 'three'

const ROUNDNESS = 0.75 // 0 = keep flat panels, 1 = fully rounded

export function subdivideSmooth(geometry: THREE.BufferGeometry, levels: number): THREE.BufferGeometry {
  let pos = Array.from(geometry.getAttribute('position').array as ArrayLike<number>)
  let nor = Array.from(geometry.getAttribute('normal').array as ArrayLike<number>)
  // Other values stored per corner (for example the distance along the colon): averaged.
  const extras = Object.keys(geometry.attributes).filter((name) => name !== 'position' && name !== 'normal')
  const extraData = extras.map((name) => ({
    name,
    size: geometry.getAttribute(name).itemSize,
    values: Array.from(geometry.getAttribute(name).array as ArrayLike<number>),
  }))
  let index = Array.from(geometry.index!.array as ArrayLike<number>)

  for (let level = 0; level < levels; level++) {
    const edges = new Map<string, number>() // each shared edge gets one middle point
    const nextIndex: number[] = []

    const middle = (a: number, b: number): number => {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`
      const known = edges.get(key)
      if (known !== undefined) return known
      const p0 = new THREE.Vector3(pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2])
      const p1 = new THREE.Vector3(pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2])
      const n0 = new THREE.Vector3(nor[a * 3], nor[a * 3 + 1], nor[a * 3 + 2])
      const n1 = new THREE.Vector3(nor[b * 3], nor[b * 3 + 1], nor[b * 3 + 2])
      const mid = p0.clone().add(p1).multiplyScalar(0.5)
      // Where the middle point would be on the surface's tangent plane at each end, averaged.
      const onPlane0 = mid.clone().addScaledVector(n0, -mid.clone().sub(p0).dot(n0))
      const onPlane1 = mid.clone().addScaledVector(n1, -mid.clone().sub(p1).dot(n1))
      const curved = onPlane0.add(onPlane1).multiplyScalar(0.5)
      const point = mid.multiplyScalar(1 - ROUNDNESS).addScaledVector(curved, ROUNDNESS)
      const normal = n0.add(n1).normalize()
      const id = pos.length / 3
      pos.push(point.x, point.y, point.z)
      nor.push(normal.x, normal.y, normal.z)
      for (const { size, values } of extraData) {
        for (let k = 0; k < size; k++) values.push((values[a * size + k] + values[b * size + k]) / 2)
      }
      edges.set(key, id)
      return id
    }

    for (let t = 0; t < index.length; t += 3) {
      const [a, b, c] = [index[t], index[t + 1], index[t + 2]]
      const ab = middle(a, b)
      const bc = middle(b, c)
      const ca = middle(c, a)
      nextIndex.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca)
    }
    index = nextIndex
  }

  const result = new THREE.BufferGeometry()
  result.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  for (const { name, size, values } of extraData) result.setAttribute(name, new THREE.Float32BufferAttribute(values, size))
  result.setIndex(index)
  result.computeVertexNormals()
  pos = nor = [] // free the working copies
  return result
}
