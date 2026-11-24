// Realistic polyps and tumors, built from the finding data (not one generic bump). Used by the
// Inside view and the polyp close-up on the Over time page.
//   - Polyps follow the Paris classification: 0-Ip (head on a narrow stalk), 0-Isp (short wide
//     stalk), 0-Is (dome, broad base), 0-IIa (low plateau), 0-IIb (flat, colour only), 0-IIc
//     (shallow saucer with a raised rim), 0-IIa+IIc (plateau with a central dip), 0-III (ulcer
//     crater). No Paris type (old AI findings): 0-Is.
//   - Tumors: polypoid-fungating, ulcerated (rolled rim around a crater), annular-stenosing
//     (napkin-ring narrowing of the lumen) and flat-infiltrating, sized from the length along the
//     colon and the share of the wall they cover.
// Sizes are real millimetres (MM = one mm in scene units). Any noise is seeded from the finding
// id, so the same finding always gets the same shape. Colours are natural tissue colours (the
// blue / red rule is for markers and labels); the wet look comes from a clear coat.
import * as THREE from 'three'
import type { Finding, ParisType, TumorMorphology } from '../types'

// ---------- Seeded noise ----------

// A number from a text (the finding id), for seeding.
function seedOf(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967296
}

// Smooth value noise in 3D (0..1), shifted by the seed.
function makeNoise(seed: number) {
  const s = seed * 1000
  const hash = (x: number, y: number, z: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + s) * 43758.5453
    return n - Math.floor(n)
  }
  const fade = (t: number) => t * t * (3 - 2 * t)
  const noise = (x: number, y: number, z: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const zi = Math.floor(z)
    const xf = fade(x - xi)
    const yf = fade(y - yi)
    const zf = fade(z - zi)
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz)
    return lerp(
      lerp(lerp(c(0, 0, 0), c(1, 0, 0), xf), lerp(c(0, 1, 0), c(1, 1, 0), xf), yf),
      lerp(lerp(c(0, 0, 1), c(1, 0, 1), xf), lerp(c(0, 1, 1), c(1, 1, 1), xf), yf),
      zf,
    )
  }
  // Two scales together (big lobes and small nodules), -0.5..0.5.
  return (x: number, y: number, z: number) => 0.65 * noise(x, y, z) + 0.35 * noise(x * 2.7, y * 2.7, z * 2.7) - 0.5
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// ---------- Colours ----------

const MUCOSA = new THREE.Color('#c85754') // close to the lining around it
const POLYP = new THREE.Color('#d8645f') // a little redder and pinker
const FIBRIN = new THREE.Color('#e3d3a6') // pale yellow-white ulcer base
const BLOOD = new THREE.Color('#5e0e12') // small dark red bleeding points
const TUMOR = new THREE.Color('#9a2228') // dark, friable red
const TUMOR_LIGHT = new THREE.Color('#d24a42')

// Polyp colour, with the doctor's NICE type as a visual hint only.
function polypColor(f: Finding): { color: THREE.Color; pattern: number } {
  const nice = f.opticalDiagnosis?.nice
  if (nice === 1) return { color: POLYP.clone().lerp(new THREE.Color('#e7a39b'), 0.45), pattern: 0.4 } // paler, less contrast
  if (nice === 2) return { color: POLYP.clone().lerp(new THREE.Color('#9a5a40'), 0.3), pattern: 1.2 } // browner, vessels
  if (nice === 3) return { color: POLYP.clone().lerp(new THREE.Color('#5c1f22'), 0.45), pattern: 0 } // darker, pattern lost
  return { color: POLYP.clone(), pattern: 1 }
}

// ---------- Shared materials and the fine surface pattern ----------

// A small tiling height map made in code (no image files): many little rounded bumps, like
// the granular, lobulated surface of an adenoma. Used as a bump map (light only, no geometry).
function granularBumpMap(): THREE.DataTexture {
  const size = 128
  const data = new Uint8Array(size * size * 4)
  const noise = makeNoise(0.37)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Periodic coordinates, so the texture tiles without seams.
      const a = (x / size) * Math.PI * 2
      const b = (y / size) * Math.PI * 2
      const h = noise(Math.cos(a) * 3, Math.sin(a) * 3, Math.cos(b) * 3 + Math.sin(b) * 3) + 0.5 * noise(Math.cos(a) * 9, Math.sin(b) * 9, Math.sin(a + b) * 9)
      const value = Math.min(255, Math.max(0, (h + 0.75) * 170))
      data.set([value, value, value, 255], (y * size + x) * 4)
    }
  }
  const texture = new THREE.DataTexture(data, size, size)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(3, 3)
  texture.needsUpdate = true
  return texture
}

// One set of materials per 3D scene (reused by every lesion in it); dispose when leaving.
export function createLesionKit() {
  const bumpMap = granularBumpMap()
  const materials = new Map<string, THREE.MeshPhysicalMaterial>()

  // Wet tissue: clear coat for the soft highlight of the headlight, sheen for a slight warm
  // glow at grazing angles (so it does not look like plastic).
  const material = (key: string, pattern: number, roughness: number) => {
    let m = materials.get(key)
    if (!m) {
      m = new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        sheen: 0.6,
        sheenColor: new THREE.Color('#ff9d8a'),
        sheenRoughness: 0.45,
        bumpMap: pattern > 0 ? bumpMap : null,
        bumpScale: 0.6 * pattern,
        side: THREE.DoubleSide,
      })
      materials.set(key, m)
    }
    return m
  }

  return {
    polypMaterial: (pattern: number) => material(`polyp-${pattern}`, pattern, 0.34),
    tumorMaterial: () => {
      const m = material('tumor', 1.3, 0.5)
      m.transparent = true // only the faded outer edge is see-through
      return m
    },
    dispose: () => {
      materials.forEach((m) => m.dispose())
      bumpMap.dispose()
    },
  }
}

export type LesionKit = ReturnType<typeof createLesionKit>

// ---------- Polyps ----------

// The size in mm (unknown: 6 mm for a polyp, 30 mm for a tumor).
export function lesionSizeMm(f: Finding): number {
  if (!f.size) return f.kind === 'polyp' ? 6 : 30
  return f.size.unit === 'cm' ? f.size.value * 10 : f.size.value
}

// Height (mm) of a flat Paris type at normalized radius r (0 = centre, 1 = edge), and how
// much of the pale ulcer colour shows there.
// Depressed types are lifted so their lowest point stays just above the wall (the wall cannot
// be cut open), so the dip is seen against the raised rim around it.
const LIFT: Partial<Record<ParisType, number>> = { '0-IIc': 0.85, '0-IIa+IIc': 0.55, '0-III': 2.0 }

function flatProfile(paris: ParisType, r: number, R: number): { h: number; fibrin: number; red: number } {
  const p = rawProfile(paris, r, R)
  return { ...p, h: p.h + (LIFT[paris] ?? 0) * smoothstep(1.05, 0.8, r) }
}

function rawProfile(paris: ParisType, r: number, R: number): { h: number; fibrin: number; red: number } {
  const rim = (at: number, width: number) => Math.exp(-(((r - at) / width) ** 2))
  switch (paris) {
    case '0-IIa': // low plateau, under 2.5 mm, soft edge
      return { h: Math.min(2, 0.3 * R + 0.8) * smoothstep(1.02, 0.72, r), fibrin: 0, red: 0.3 }
    case '0-IIb': // almost no relief: only colour and pattern
      return { h: 0.25 * smoothstep(1, 0.6, r), fibrin: 0, red: 0.55 }
    case '0-IIc': // shallow saucer with a slightly raised rim, redder
      return { h: -0.7 * smoothstep(0.75, 0, r) + 0.5 * rim(0.85, 0.18), fibrin: 0, red: 0.8 }
    case '0-IIa+IIc': // plateau with a central depression
      return { h: 1.7 * smoothstep(1.02, 0.75, r) - 2.1 * smoothstep(0.5, 0.1, r), fibrin: 0, red: 0.6 }
    case '0-III': // ulcer crater: pale fibrin base, red rim
      return { h: 1.6 * rim(0.82, 0.2) - 1.8 * smoothstep(0.65, 0.1, r), fibrin: smoothstep(0.6, 0.25, r), red: 1 }
    default: {
      // 0-Is: a dome with a broad base, more than 2.5 mm high, edges blending into the wall
      const H = Math.max(2.8, 0.8 * R)
      return { h: H * Math.pow(Math.max(0, 1 - r * r), 0.75), fibrin: 0, red: 0.5 }
    }
  }
}

// A disc on the wall (local frame: y = into the lumen), shaped by a radial profile.
function discGeometry(f: Finding, MM: number, noise: (x: number, y: number, z: number) => number, color: THREE.Color): THREE.BufferGeometry {
  const paris = f.paris ?? '0-Is'
  const sizeMm = lesionSizeMm(f)
  const R = sizeMm / 2
  const rings = 26
  const segments = 56
  const positions: number[] = []
  const colors: number[] = []
  const uvs: number[] = []
  const c = new THREE.Color()
  for (let i = 0; i <= rings; i++) {
    const r = (i / rings) * 1.4 // past 1: a skirt that blends into the wall
    for (let j = 0; j <= segments; j++) {
      const a = (j / segments) * Math.PI * 2
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      const wobble = 1 + 0.08 * noise(ca * 1.5, sa * 1.5, 0.3) // slightly irregular outline
      const p = flatProfile(paris, r / wobble, R)
      const lobes = paris === '0-Is' ? 1 + 0.16 * noise(ca * r * 2.2, sa * r * 2.2, 1.7) : 1 + 0.08 * noise(ca * r * 4, sa * r * 4, 2.3)
      const inside = smoothstep(1.35, 0.95, r)
      const h = r > 1 ? -0.25 * smoothstep(1, 1.4, r) : p.h * lobes // the skirt dips just under the wall
      positions.push(ca * r * R * wobble * MM, h * inside * MM, sa * r * R * wobble * MM)
      uvs.push(ca * r * 0.8 + 0.5, sa * r * 0.8 + 0.5)
      // Lesion colour in the middle, the lining colour at the edge; ulcer base where shown.
      c.copy(MUCOSA).lerp(color, inside * (0.7 + 0.3 * p.red))
      if (paris === '0-III') c.lerp(new THREE.Color('#b0272c'), 0.35 * inside) // stronger red tint
      c.lerp(FIBRIN, p.fibrin)
      colors.push(c.r, c.g, c.b)
    }
  }
  const index: number[] = []
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j
      const b = a + segments + 1
      index.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

// A pedunculated (0-Ip) or subpedunculated (0-Isp) polyp: a lobulated head on a stalk.
// The stalk has the colour of normal lining; the head is redder.
function stalkedGeometry(f: Finding, MM: number, noise: (x: number, y: number, z: number) => number, color: THREE.Color): THREE.BufferGeometry {
  const sizeMm = lesionSizeMm(f)
  const R = sizeMm / 2
  const sub = f.paris === '0-Isp'
  // Stalk length grows with size (short and thick for small polyps); 0-Isp: short and wide.
  const stalkLength = sub ? 0.22 * sizeMm : Math.min(14, sizeMm * (0.35 + 0.025 * sizeMm))
  const stalkRadius = sub ? 0.36 * sizeMm : Math.max(0.9, 0.17 * sizeMm)

  // The stalk as a lathe: wide at the base (blending into the wall), narrow up to the head.
  const profile: THREE.Vector2[] = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    const flare = 1 + 1.6 * Math.pow(1 - t, 3)
    profile.push(new THREE.Vector2(stalkRadius * flare * MM, (t * stalkLength - 0.2) * MM))
  }
  const stalk = new THREE.LatheGeometry(profile, 28)

  // The head: a slightly flattened ball with lobes, wider than the stalk.
  const head = new THREE.SphereGeometry(R * MM, 48, 32) // has proper texture coordinates
  head.deleteAttribute('normal')
  const v = new THREE.Vector3()
  const p = head.getAttribute('position')
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize()
    const lobes = 1 + 0.2 * noise(v.x * 2.2, v.y * 2.2, v.z * 2.2) + 0.06 * noise(v.x * 7, v.y * 7, v.z * 7)
    p.setXYZ(i, v.x * R * MM * lobes, v.y * R * MM * lobes * 0.85 + (stalkLength + R * 0.75) * MM, v.z * R * MM * lobes)
  }

  const paint = (g: THREE.BufferGeometry, from: THREE.Color, to: THREE.Color, topY: number) => {
    const pos = g.getAttribute('position')
    const colors = new Float32Array(pos.count * 3)
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      c.copy(from).lerp(to, smoothstep(0, topY, pos.getY(i)))
      colors.set([c.r, c.g, c.b], i * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  }
  paint(stalk, MUCOSA, MUCOSA.clone().lerp(color, 0.25), stalkLength * MM)
  paint(head, color.clone().lerp(MUCOSA, 0.2), color.clone().lerp(new THREE.Color('#e0726a'), 0.3), (stalkLength + 2 * R) * MM)

  const parts = [stalk, head].map((g) => {
    const flat = g.index ? g.toNonIndexed() : g
    flat.deleteAttribute('normal')
    if (!flat.getAttribute('uv')) flat.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(flat.getAttribute('position').count * 2), 2))
    return flat
  })
  const merged = mergeSimple(parts)
  merged.computeVertexNormals()
  stalk.dispose()
  head.dispose()
  return merged
}

// Join geometries that have the same attributes (position, color, uv).
function mergeSimple(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const names = ['position', 'color', 'uv']
  const out = new THREE.BufferGeometry()
  for (const name of names) {
    const size = parts[0].getAttribute(name).itemSize
    const total = parts.reduce((n, g) => n + g.getAttribute(name).count, 0)
    const array = new Float32Array(total * size)
    let offset = 0
    for (const g of parts) {
      const a = g.getAttribute(name).array as Float32Array
      array.set(a, offset)
      offset += a.length
    }
    out.setAttribute(name, new THREE.BufferAttribute(array, size))
  }
  return out
}

// A polyp as a mesh in its own frame: y points into the lumen, the base sits at y = 0.
export function buildPolyp(f: Finding, MM: number, kit: LesionKit): THREE.Mesh {
  const noise = makeNoise(seedOf(f.id))
  const { color, pattern } = polypColor(f)
  const stalked = f.paris === '0-Ip' || f.paris === '0-Isp'
  const geometry = stalked ? stalkedGeometry(f, MM, noise, color) : discGeometry(f, MM, noise, color)
  return new THREE.Mesh(geometry, kit.polypMaterial(pattern))
}

// ---------- Tumors ----------

// The share of the wall a tumor covers when it is not recorded.
const DEFAULT_EXTENT: Record<TumorMorphology, number> = {
  'polypoid-fungating': 35,
  ulcerated: 50,
  'annular-stenosing': 100,
  'flat-infiltrating': 30,
}

export interface TumorFrame {
  // The tumor is built around the colon's (curved) centerline. z: distance along the colon
  // from the tumor's middle; angle: around the wall, 0 = towards the middle of the tumor.
  wallDistance: (angle: number, z: number) => number // centerline to wall in that direction (smoothed)
  edgeDistance?: (angle: number, z: number) => number // the same, exact (used at the outer edge)
  point: (angle: number, z: number, radius: number, out: THREE.Vector3) => THREE.Vector3 // a point in the scene
  lumenRadius: number // typical distance from the centerline to the wall here (scene units)
}

// A tumor as a mesh (already in scene coordinates). Heights are in mm into the lumen.
export function buildTumor(f: Finding, MM: number, kit: LesionKit, frame: TumorFrame): THREE.Mesh {
  const noise = makeNoise(seedOf(f.id))
  const morphology = f.morphology ?? 'polypoid-fungating'
  const lengthMm = f.lengthMm ?? lesionSizeMm(f)
  const extent = (f.circumferentialExtentPct ?? DEFAULT_EXTENT[morphology]) / 100
  const full = extent >= 0.999
  const lumenMm = frame.lumenRadius / MM
  const halfAngle = full ? Math.PI : extent * Math.PI
  const halfLength = (lengthMm / 2) * MM
  // How far the lumen is narrowed (annular): remaining share of the normal radius.
  const left = f.lumen === 'nearly-blocked' ? 0.14 : f.lumen === 'narrowed' ? 0.5 : 0.75

  const aSteps = full ? 96 : Math.max(32, Math.round(64 * extent))
  // A ring-shaped tumor has steep faces across the lumen, so it needs many more rows.
  const zSteps = morphology === 'annular-stenosing' ? 120 : 44
  const marginA = full ? 0 : 0.25 // radians of blending past the edge
  const marginZ = 7 * MM
  const positions: number[] = []
  const colors: number[] = []
  const uvs: number[] = []
  const c = new THREE.Color()
  const at = new THREE.Vector3()

  for (let i = 0; i <= zSteps; i++) {
    const z = -halfLength - marginZ + (i / zSteps) * (2 * halfLength + 2 * marginZ)
    const v = z / halfLength // -1..1 over the tumor, beyond in the margin
    for (let j = 0; j <= aSteps; j++) {
      const angle = full ? (j / aSteps) * Math.PI * 2 : -halfAngle - marginA + (j / aSteps) * (2 * halfAngle + 2 * marginA)
      const u = full ? 0 : angle / halfAngle // -1..1 around the wall
      const ca = Math.cos(angle)
      const sa = Math.sin(angle)
      // Noise on a ring (periodic around the wall) and along the colon.
      const n1 = noise(ca * 2.2, sa * 2.2, v * 1.6)
      const n2 = noise(ca * 7, sa * 7, v * 5)
      // 1 inside the tumor, falling smoothly to 0 at the edge (an irregular edge).
      const edgeZ =
        morphology === 'annular-stenosing'
          ? smoothstep(1.22 + 0.1 * n1, 0.6, Math.abs(v)) // wider, heaped shoulders
          : smoothstep(1.18 + 0.12 * n1, 0.82, Math.abs(v))
      const edgeA = full ? 1 : smoothstep(1.15 + 0.12 * n1, 0.8, Math.abs(u))
      const inside = edgeZ * edgeA
      const r = full ? Math.abs(v) : Math.min(1.6, Math.hypot(u, v))

      let h = 0 // mm into the lumen
      let ulcer = 0 // 0..1: pale fibrin and debris
      let openingMm = -1 // annular only: the remaining distance from the centerline
      switch (morphology) {
        case 'polypoid-fungating': {
          // A bulky, heaped, lobulated mass with a partly ulcerated top.
          const H = Math.min(0.5 * lumenMm, 0.38 * lengthMm)
          const lobes = 0.5 * n1 + 0.4 * n2 + 0.25 * noise(ca * 16, sa * 16, v * 11)
          h = H * Math.pow(Math.max(0, 1 - r * r), 0.55) * (1 + lobes)
          ulcer = smoothstep(0.6, 0.2, r) * smoothstep(0.0, 0.18, n2 + 0.5 * n1 + 0.08)
          break
        }
        case 'ulcerated': {
          // A raised, rolled rim around a central crater with an uneven floor.
          const rim = 5.5 * Math.exp(-(((r - 0.78) / 0.17) ** 2)) * (1 + 0.3 * n1)
          const crater = -1.6 * smoothstep(0.62, 0.15, r) + 0.8 * n2 * smoothstep(0.6, 0.2, r)
          h = rim + crater + 2.3 * smoothstep(1.0, 0.7, r) // lifted: the crater floor stays above the wall
          ulcer = smoothstep(0.62, 0.35, r)
          break
        }
        case 'annular-stenosing': {
          // A ring around the wall, narrowing the lumen like a napkin ring ("apple core"):
          // rounded, heaped shoulders, the narrowest point just inside them, and a slightly
          // wider, ulcerated middle. Built as the remaining opening, not as a height.
          const av = Math.abs(v)
          const open = left * lumenMm * (1 + 0.22 * n1) * (0.85 + 0.3 * smoothstep(0.55, 0.05, av))
          openingMm = open + 1.2 * n2
          h = 1 // only marks "inside"; the radius comes from openingMm
          ulcer = smoothstep(0.45, 0.1, av) * smoothstep(-0.05, 0.12, n1)
          break
        }
        case 'flat-infiltrating': {
          // A flat, thickened area with nodules and ulceration, little protrusion.
          h = 2.4 * (1 + 0.7 * n2) * smoothstep(1.1, 0.75, r)
          ulcer = smoothstep(0.1, 0.25, n1) * smoothstep(0.7, 0.3, r)
          break
        }
      }
      h *= inside

      let wall = frame.wallDistance(angle, z)
      // Near the outer edge follow the exact wall, so the tumor grows out of it.
      if (frame.edgeDistance && inside < 0.4) {
        wall = THREE.MathUtils.lerp(frame.edgeDistance(angle, z), wall, smoothstep(0.05, 0.4, inside))
      }
      // At the outer edge the surface starts a little behind the wall, so no edge shows.
      const base = wall + THREE.MathUtils.lerp(2.5, -1.1, smoothstep(0, 0.2, inside)) * MM
      let radius = Math.max(0.12 * frame.lumenRadius, base - h * MM)
      if (openingMm > 0) {
        // Rounded shoulders: ease from the wall to the opening.
        const t = Math.pow(inside, 0.6)
        radius = THREE.MathUtils.lerp(base, Math.min(base, openingMm * MM), t)
        // Nodules and beads on the shoulders (strongest halfway down the face).
        const nod = noise(ca * 4, sa * 4, v * 5) + 0.6 * noise(ca * 10, sa * 10, v * 12)
        radius -= nod * 6 * MM * Math.sin(Math.PI * Math.min(1, t))
      }
      frame.point(angle, z, radius, at)
      positions.push(at.x, at.y, at.z)
      // Distance along the surface (mm), so texture and colour also vary across the steep
      // faces of a ring-shaped tumor instead of stretching into streaks.
      const depthMm = Math.max(0, (wall - radius) / MM)
      const sMm = v * (lengthMm / 2) + Math.sign(v) * depthMm
      uvs.push(angle * 2 * (radius / frame.lumenRadius), sMm / 12)
      const n3 = noise(ca * 6, sa * 6, sMm / 7)

      // Natural tumor colours: lining at the edge, dark friable red on the mass, pale fibrin
      // in the ulcer, and a few small dark bleeding points.
      const n4 = noise(ca * 14, sa * 14, sMm / 3.5)
      c.copy(MUCOSA).lerp(TUMOR_LIGHT, inside).lerp(TUMOR, inside * (0.35 + 0.65 * smoothstep(-0.3, 0.25, n3 + 0.35 * n4)))
      if (openingMm > 0) ulcer = Math.max(ulcer, smoothstep(0.06, 0.24, n3 - 0.3 * n4) * smoothstep(0.3, 0.7, inside) * 0.85)
      c.lerp(FIBRIN, ulcer * 0.85 * inside)
      const spot = noise(ca * 19, sa * 19, sMm / 2.5)
      if (spot > 0.36 && inside > 0.5) c.lerp(BLOOD, smoothstep(0.36, 0.45, spot))
      // The outer edge fades out, so the tumor blends into the lining around it.
      colors.push(c.r, c.g, c.b, smoothstep(0.02, 0.3, inside))
    }
  }

  const index: number[] = []
  for (let i = 0; i < zSteps; i++) {
    for (let j = 0; j < aSteps; j++) {
      const a = i * (aSteps + 1) + j
      const b = a + aSteps + 1
      index.push(a, a + 1, b, b, a + 1, b + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  const mesh = new THREE.Mesh(g, kit.tumorMaterial())
  return mesh
}
