import { isWoody, type Plant } from '../data/plants'
import { rng } from './random'

// Plant skeletons in feet. Side view: origin at the base, y points down (so the plant grows into negative y).
// Top view: origin at the plant center.

export interface Blob {
  x: number
  y: number
  r: number
}
export interface Stroke {
  d: string
  w: number
}
// A filled leaf/frond outline plus its midrib.
export interface Leaf {
  fill: string
  rib: string
  w: number
}
export interface Dot {
  x: number
  y: number
}

export interface SideStructure {
  blobs: Blob[]
  wood: Stroke[]
  blades: Stroke[]
  fronds: Stroke[]
  strands: Stroke[]
  leaves: Leaf[]
  flowers: Dot[]
  fruits: Dot[]
  dotR: number
}

export interface TopStructure {
  blobs: Blob[]
  wood: Stroke[]
  leaves: Leaf[]
  flowers: Dot[]
  fruits: Dot[]
  dotR: number
}

const cache = new Map<string, SideStructure | TopStructure>()

function memo<T extends SideStructure | TopStructure>(key: string, make: () => T): T {
  let v = cache.get(key) as T | undefined
  if (!v) {
    v = make()
    cache.set(key, v)
  }
  return v
}

const f = (n: number) => n.toFixed(2)

interface Crown {
  cx: number
  cy: number
  rx: number
  ry: number
  trunkTop: number // height (positive feet) where branching starts; 0 = multi-stem from ground
}

function crownFor(plant: Plant): Crown {
  const H = plant.heightFt
  const R = plant.spreadFt / 2
  const isTree = plant.type === 'tree'
  switch (plant.shape) {
    case 'mat':
      return { cx: 0, cy: -H * 0.45, rx: R, ry: H * 0.55, trunkTop: 0 }
    case 'mound':
      return { cx: 0, cy: -H * 0.45, rx: R, ry: H * 0.55, trunkTop: 0 }
    case 'round':
      return isTree
        ? { cx: 0, cy: -H * 0.62, rx: R, ry: H * 0.37, trunkTop: H * 0.32 }
        : { cx: 0, cy: -H * 0.5, rx: R, ry: H * 0.5, trunkTop: 0 }
    case 'upright':
      return isTree
        ? { cx: 0, cy: -H * 0.6, rx: R * 0.9, ry: H * 0.4, trunkTop: H * 0.25 }
        : { cx: 0, cy: -H * 0.54, rx: R * 0.9, ry: H * 0.46, trunkTop: 0 }
    case 'vase':
      return { cx: 0, cy: -H * 0.64, rx: R, ry: H * 0.35, trunkTop: isTree ? H * 0.22 : 0 }
    case 'spreading':
      return { cx: 0, cy: -H * 0.64, rx: R, ry: H * 0.32, trunkTop: H * 0.38 }
    case 'columnar':
      return { cx: 0, cy: -H * 0.52, rx: R, ry: H * 0.48, trunkTop: H * 0.04 }
    case 'weeping':
      return { cx: 0, cy: -H * 0.72, rx: R * 0.8, ry: H * 0.25, trunkTop: H * 0.45 }
    default:
      return { cx: 0, cy: -H * 0.6, rx: R, ry: H * 0.4, trunkTop: H * 0.3 }
  }
}

type Pt = { x: number; y: number }

// Fern frond along a quadratic curve p0 -> p2, with a zig-zag edge to suggest leaflets.
function frond(p0: Pt, p1: Pt, p2: Pt, width: number): Leaf {
  const at = (t: number) => ({
    x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x,
    y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y,
  })
  const left: Pt[] = []
  const right: Pt[] = []
  const steps = 16
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const a = at(t - 0.01)
    const b = at(t + 0.01)
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
    const nx = -(b.y - a.y) / len
    const ny = (b.x - a.x) / len
    const w = width * Math.sin(Math.PI * t) ** 0.7 * (1 - 0.3 * t) * (i % 2 ? 1 : 0.55)
    const c = at(t)
    left.push({ x: c.x + nx * w, y: c.y + ny * w })
    right.push({ x: c.x - nx * w, y: c.y - ny * w })
  }
  const pts = [p0, ...left, p2, ...right.reverse()]
  return {
    fill: `M${pts.map((pt) => `${f(pt.x)},${f(pt.y)}`).join(' L')} Z`,
    rib: `M${f(p0.x)},${f(p0.y)} Q${f(p1.x)},${f(p1.y)} ${f(p2.x)},${f(p2.y)}`,
    w: width * 0.12,
  }
}

function pointInEllipse(rand: () => number, c: { cx: number; cy: number; rx: number; ry: number }, k = 1) {
  const a = rand() * Math.PI * 2
  const d = Math.sqrt(rand()) * k
  return { x: c.cx + Math.cos(a) * c.rx * d, y: c.cy + Math.sin(a) * c.ry * d }
}

function dotsInBlobs(rand: () => number, blobs: Blob[], n: number, topBias = 0.3): Dot[] {
  const out: Dot[] = []
  for (let i = 0; i < n && blobs.length; i++) {
    const b = blobs[Math.floor(rand() * blobs.length)]
    const a = rand() * Math.PI * 2
    const d = Math.sqrt(rand()) * b.r * 0.95
    out.push({ x: b.x + Math.cos(a) * d, y: b.y + Math.sin(a) * d - b.r * topBias * rand() })
  }
  return out
}

export function sideStructure(plant: Plant, seed: string): SideStructure {
  return memo(`side:${plant.id}:${seed}`, () => {
    const rand = rng(`${plant.id}:${seed}`)
    const H = plant.heightFt
    const R = plant.spreadFt / 2
    const s: SideStructure = { blobs: [], wood: [], blades: [], fronds: [], strands: [], leaves: [], flowers: [], fruits: [], dotR: 0 }
    s.dotR = Math.min(Math.max(Math.min(R, H) * 0.055, 0.05), 0.55)

    if (plant.shape === 'grass') {
      const n = 26
      for (let i = 0; i < n; i++) {
        const bx = (rand() - 0.5) * R * 0.5
        const lean = (rand() - 0.5) * 2
        const h = H * (0.6 + rand() * 0.4)
        const tx = bx + lean * R * 0.9
        const ty = -h
        s.blades.push({ d: `M${f(bx)},0 Q${f(bx + lean * R * 0.2)},${f(-h * 0.6)} ${f(tx)},${f(ty)}`, w: Math.max(R * 0.05, 0.03) })
        s.flowers.push({ x: tx, y: ty })
      }
      s.dotR = Math.max(R * 0.08, 0.06)
      return s
    }

    if (plant.shape === 'palm') {
      const top = H * 0.85
      const lean = (rand() - 0.5) * H * 0.06
      s.wood.push({ d: `M0,0 Q${f(lean * 2)},${f(-top / 2)} ${f(lean)},${f(-top)}`, w: Math.max(H * 0.035, 0.3) })
      const n = 16
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (i / (n - 1)) * Math.PI + (rand() - 0.5) * 0.2
        const len = R * (0.75 + rand() * 0.35)
        const ex = lean + Math.cos(a) * len
        const ey = -top + Math.sin(a) * len * 0.75 + len * 0.35
        const mx = lean + Math.cos(a) * len * 0.5
        const my = -top + Math.sin(a) * len * 0.6
        s.fronds.push({ d: `M${f(lean)},${f(-top)} Q${f(mx)},${f(my)} ${f(ex)},${f(ey)}`, w: R * 0.18 })
      }
      return s
    }

    if (plant.shape === 'fern') {
      const n = 13
      // Outer (lower) fronds first so the upright ones are drawn in front.
      const angles = Array.from({ length: n }, (_, i) => ((i / (n - 1)) * 2 - 1) * 1.15 + (rand() - 0.5) * 0.15).sort((p, q) => Math.abs(q) - Math.abs(p))
      for (const a of angles) {
        const L = H * (0.95 + rand() * 0.2) * (1 - Math.abs(a) * 0.15)
        const bx = (rand() - 0.5) * R * 0.15
        const tip = { x: bx + Math.sin(a) * R * 1.05, y: -L * (0.95 - 0.75 * Math.abs(Math.sin(a))) }
        const ctrl = { x: bx + Math.sin(a) * R * 0.35, y: -L * 1.05 }
        s.leaves.push(frond({ x: bx, y: 0 }, ctrl, tip, Math.max(R * 0.22, 0.15)))
      }
      return s
    }

    if (plant.shape === 'bulb') {
      const n = Math.min(Math.max(Math.round(plant.spreadFt * 5), 5), 12)
      const stemW = Math.max(H * 0.025, 0.02)
      for (let i = 0; i < n; i++) {
        const bx = (rand() * 2 - 1) * R * 0.8
        const h = H * (0.8 + rand() * 0.2)
        const lean = (rand() - 0.5) * H * 0.15
        for (const side of [-1, 1]) {
          const lx = bx + side * R * (0.2 + rand() * 0.2)
          s.blades.push({ d: `M${f(bx)},0 Q${f(bx + side * 0.02)},${f(-h * 0.4)} ${f(lx)},${f(-h * (0.35 + rand() * 0.2))}`, w: Math.max(H * 0.05, 0.04) })
        }
        s.blades.push({ d: `M${f(bx)},0 Q${f(bx)},${f(-h * 0.5)} ${f(bx + lean)},${f(-h)}`, w: stemW })
        s.flowers.push({ x: bx + lean, y: -h })
      }
      s.dotR = plant.bloom?.size ?? 0.1
      return s
    }

    if (plant.shape === 'conical') {
      const tiers = 9
      const trunkH = H * 0.06
      for (let t = 0; t < tiers; t++) {
        const k = t / (tiers - 1)
        const y = -trunkH - k * (H - trunkH) * 0.92
        const half = R * (1 - k) * 0.92 + R * 0.06
        const per = Math.max(1, Math.round(half / (R * 0.22)))
        for (let j = 0; j < per; j++) {
          const x = per === 1 ? 0 : -half + (2 * half * j) / (per - 1)
          const r = Math.max(R * 0.22 * (1 - k * 0.5), 0.2) * (0.85 + rand() * 0.3)
          s.blobs.push({ x: x * 0.85, y, r })
        }
      }
      s.wood.push({ d: `M0,0 L0,${f(-H * 0.9)}`, w: Math.max(R * 0.08, 0.15) })
      s.flowers = dotsInBlobs(rand, s.blobs, 26)
      s.fruits = dotsInBlobs(rand, s.blobs, 20, 0)
      return s
    }

    const c = crownFor(plant)
    const small = plant.shape === 'mat' || plant.shape === 'mound'
    const blobCount = small ? 14 : plant.shape === 'columnar' ? 18 : 22
    const base = Math.min(c.rx, c.ry) * (small ? 0.5 : 0.45)
    for (let i = 0; i < blobCount; i++) {
      const p = pointInEllipse(rand, c, 0.78)
      if (small) p.y = Math.min(p.y, -base * 0.6)
      s.blobs.push({ x: p.x, y: p.y, r: base * (0.75 + rand() * 0.5) })
    }
    s.blobs.sort((a, b) => b.y - a.y)

    if (!small) {
      const woodW = plant.type === 'tree' ? Math.max(R * 0.07 + H * 0.008, 0.25) : Math.max(R * 0.05, 0.06)
      const stems: { x: number; y: number }[] = []
      if (c.trunkTop > 0) {
        const tx = (rand() - 0.5) * R * 0.08
        s.wood.push({ d: `M0,0 Q${f(tx * 0.5)},${f(-c.trunkTop * 0.5)} ${f(tx)},${f(-c.trunkTop)}`, w: woodW })
        stems.push({ x: tx, y: -c.trunkTop })
      } else {
        for (let i = 0; i < 4; i++) stems.push({ x: (rand() - 0.5) * R * 0.3, y: 0 })
      }
      const branches = plant.type === 'tree' ? 8 : 9
      for (let i = 0; i < branches; i++) {
        const from = stems[i % stems.length]
        const to = pointInEllipse(rand, c, 0.85)
        if (plant.shape === 'vase' || plant.shape === 'upright') to.y = Math.min(to.y, c.cy)
        const cx = from.x + (to.x - from.x) * 0.25
        const cy = from.y + (to.y - from.y) * 0.75
        s.wood.push({ d: `M${f(from.x)},${f(from.y)} Q${f(cx)},${f(cy)} ${f(to.x)},${f(to.y)}`, w: woodW * 0.5 })
        for (let j = 0; j < 3; j++) {
          const a = -Math.PI / 2 + (rand() - 0.5) * 2.2
          const len = Math.min(c.rx, c.ry) * (0.25 + rand() * 0.3)
          s.wood.push({ d: `M${f(to.x)},${f(to.y)} l${f(Math.cos(a) * len)},${f(Math.sin(a) * len)}`, w: woodW * 0.22 })
        }
      }
    }

    if (plant.shape === 'weeping') {
      const n = 34
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (i / (n - 1)) * Math.PI
        const sx = c.cx + Math.cos(a) * c.rx * (0.4 + rand() * 0.6)
        const sy = c.cy + Math.sin(a) * c.ry * 0.6
        const ex = sx * (1.15 + rand() * 0.1)
        const ey = -H * (0.06 + rand() * 0.15)
        s.strands.push({ d: `M${f(sx)},${f(sy)} Q${f(ex)},${f((sy + ey) / 2)} ${f(ex)},${f(ey)}`, w: R * 0.12 })
      }
    }

    s.flowers = dotsInBlobs(rand, s.blobs, 40)
    s.fruits = dotsInBlobs(rand, s.blobs, 24, 0)
    return s
  })
}

export function topStructure(plant: Plant, seed: string): TopStructure {
  return memo(`top:${plant.id}:${seed}`, () => {
    const rand = rng(`top:${plant.id}:${seed}`)
    const R = plant.spreadFt / 2
    const t: TopStructure = { blobs: [], wood: [], leaves: [], flowers: [], fruits: [], dotR: plant.bloom?.size ?? Math.min(Math.max(R * 0.05, 0.05), 0.45) }
    if (plant.shape === 'fern') {
      const n = 11
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rand() * 0.4
        const L = R * (0.85 + rand() * 0.15)
        const dir = { x: Math.cos(a), y: Math.sin(a) }
        const curl = (rand() - 0.5) * L * 0.4
        t.leaves.push(frond({ x: 0, y: 0 }, { x: dir.x * L * 0.5 - dir.y * curl, y: dir.y * L * 0.5 + dir.x * curl }, { x: dir.x * L, y: dir.y * L }, R * 0.2))
      }
      return t
    }
    if (plant.shape === 'bulb') {
      const n = Math.min(Math.max(Math.round(plant.spreadFt * 5), 5), 12)
      for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2
        const d = Math.sqrt(rand()) * R * 0.8
        const pt = { x: Math.cos(a) * d, y: Math.sin(a) * d }
        t.blobs.push({ ...pt, r: R * 0.14 })
        t.flowers.push(pt)
      }
      return t
    }

    const n = plant.shape === 'grass' ? 7 : 11
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2
      const d = Math.sqrt(rand()) * R * 0.6
      t.blobs.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, r: R * (0.32 + rand() * 0.14) })
    }
    if (isWoody(plant) && plant.shape !== 'mat') {
      const w = Math.max(R * 0.04, 0.05)
      const arms = 7
      for (let i = 0; i < arms; i++) {
        const a = (i / arms) * Math.PI * 2 + rand() * 0.5
        const len = R * (0.7 + rand() * 0.25)
        const ex = Math.cos(a) * len
        const ey = Math.sin(a) * len
        t.wood.push({ d: `M0,0 Q${f(ex * 0.5 + (rand() - 0.5) * R * 0.2)},${f(ey * 0.5)} ${f(ex)},${f(ey)}`, w })
      }
    }
    t.flowers = dotsInBlobs(rand, t.blobs, 40, 0)
    t.fruits = dotsInBlobs(rand, t.blobs, 24, 0)
    return t
  })
}
