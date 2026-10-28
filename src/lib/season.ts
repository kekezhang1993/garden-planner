import type { Plant, Quad } from '../data/plants'

// Season position t is a continuous value in [0, 4):
// 0 = mid-spring, 1 = mid-summer, 2 = mid-autumn, 3 = mid-winter, wrapping back to spring.

export const SEASON_NAMES = ['Spring', 'Summer', 'Autumn', 'Winter'] as const

export const wrap = (t: number) => ((t % 4) + 4) % 4

function blend(t: number): [number, number, number] {
  const w = wrap(t)
  const i = Math.floor(w)
  return [i, (i + 1) % 4, w - i]
}

export function quadNum(q: Quad<number>, t: number): number {
  const [a, b, f] = blend(t)
  return q[a] * (1 - f) + q[b] * f
}

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))

export function mixColor(c1: string, c2: string, f: number): string {
  const a = hex(c1)
  const b = hex(c2)
  const m = a.map((v, i) => Math.round(v * (1 - f) + b[i] * f))
  return `#${m.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function quadColor(q: Quad<string>, t: number): string {
  const [a, b, f] = blend(t)
  return mixColor(q[a], q[b], f)
}

export const shade = (c: string, f: number) => (f < 0 ? mixColor(c, '#000000', -f) : mixColor(c, '#ffffff', f))

export function seasonLabel(t: number): string {
  const w = wrap(t)
  const nearest = Math.round(w) % 4
  const off = w - Math.round(w)
  const prefix = off < -0.2 ? 'Early ' : off > 0.2 ? 'Late ' : 'Mid-'
  return prefix + SEASON_NAMES[nearest].toLowerCase()
}

// How "winter-like" the moment is (1 at mid-winter, 0 from mid-autumn/mid-spring outward).
export const winterness = (t: number) => quadNum([0, 0, 0, 1], t)

export interface PlantLook {
  leaf: string
  density: number
  bloom: number
  bloomColor: string
  fruit: number
  fruitColor: string
  bark: string
}

export function plantLook(plant: Plant, t: number): PlantLook {
  return {
    leaf: quadColor(plant.leaf, t),
    density: quadNum(plant.density, t),
    bloom: plant.bloom ? quadNum(plant.bloom.amount, t) : 0,
    bloomColor: plant.bloom?.color ?? '#ffffff',
    fruit: plant.fruit ? quadNum(plant.fruit.amount, t) : 0,
    fruitColor: plant.fruit?.color ?? '#ff0000',
    bark: plant.bark ?? '#5a4636',
  }
}

export interface Environment {
  sky: [string, string]
  lawn: string
  mulch: string
  snow: number
}

export function environment(t: number, snowy: boolean): Environment {
  const snow = snowy ? winterness(t) : 0
  const lawn = quadColor(['#8cbf55', '#6fa043', '#a3a052', snowy ? '#a8a57a' : '#8f9a5a'], t)
  return {
    sky: [
      quadColor(['#9fd0f0', '#7cc0f0', '#b8c8d8', '#c8d4e0'], t),
      quadColor(['#e8f4fb', '#e6f3fb', '#f0e8dc', '#eef0f2'], t),
    ],
    lawn: mixColor(lawn, '#f4f7fa', snow * 0.9),
    mulch: mixColor('#6b4f3a', '#eef2f6', snow * 0.85),
    snow,
  }
}
