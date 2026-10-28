import { PLANT_BY_ID, type Plant } from '../data/plants'
import type { Garden } from '../types'
import { quadNum, wrap } from './season'

// Approximate direct-sun hours across the bed from the sun's path, edge walls and placed plants.
// Garden coordinates: x to the right, y toward the front (where you stand), in feet.

const RAD = Math.PI / 180
const STEP_H = 0.5

export interface SunSample {
  x: number // horizontal unit vector pointing toward the sun
  y: number
  tan: number // tangent of the sun's altitude
}

// Season dial t (0 = mid-spring) to day of year, flipped for the southern hemisphere.
const dayOfYear = (season: number, lat: number) => (110 + wrap(season) * 91.25 + (lat < 0 ? 182 : 0)) % 365

export function sunSamples(lat: number, season: number, facing: number): SunSample[] {
  const decl = 23.44 * RAD * Math.sin((2 * Math.PI * (284 + dayOfYear(season, lat))) / 365)
  const phi = lat * RAD
  const out: SunSample[] = []
  for (let hr = 4 + STEP_H / 2; hr < 21; hr += STEP_H) {
    const H = (hr - 12) * 15 * RAD
    const sinAlt = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(H)
    if (sinAlt <= 0.03) continue
    const azFromSouth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(decl) * Math.cos(phi))
    const rel = azFromSouth + Math.PI - facing * RAD // bearing relative to "toward the back"
    out.push({ x: Math.sin(rel), y: -Math.cos(rel), tan: Math.tan(Math.asin(sinAlt)) })
  }
  return out
}

interface Obstacle {
  id: string
  x: number
  y: number
  r: number
  zBottom: number
  zTop: number
  block: number // how much light the canopy stops (bare branches let most through)
}

// Plants under 1.5 ft only shade the soil they cover, so they're not counted as obstacles.
function obstacles(garden: Garden, season: number): Obstacle[] {
  return garden.placements.flatMap((p) => {
    const plant = PLANT_BY_ID[p.plantId]
    if (plant.heightFt < 1.5) return []
    const density = quadNum(plant.density, season)
    return [
      {
        id: p.id,
        x: p.x,
        y: p.y,
        r: plant.spreadFt / 2,
        zBottom: plant.type === 'tree' ? plant.heightFt * 0.3 : 0,
        zTop: plant.heightFt,
        block: plant.evergreen ? 0.9 : 0.2 + 0.7 * density,
      },
    ]
  })
}

function shadeAt(px: number, py: number, z0: number, s: SunSample, garden: Garden, obs: Obstacle[], skipId?: string): number {
  const { width: W, depth: D, walls } = garden
  // Walls run along each whole edge.
  const hit = (dist: number, h: number) => h > 0 && z0 + dist * s.tan < h
  if (s.y < 0 && hit(py / -s.y, walls.back)) return 1
  if (s.y > 0 && hit((D - py) / s.y, walls.front)) return 1
  if (s.x < 0 && hit(px / -s.x, walls.left)) return 1
  if (s.x > 0 && hit((W - px) / s.x, walls.right)) return 1

  let shade = 0
  for (const o of obs) {
    if (o.id === skipId || o.block <= shade) continue
    const cx = o.x - px
    const cy = o.y - py
    const along = cx * s.x + cy * s.y
    const perp2 = cx * cx + cy * cy - along * along
    if (perp2 >= o.r * o.r) continue
    const half = Math.sqrt(o.r * o.r - perp2)
    const t2 = along + half
    if (t2 <= 0) continue
    const t1 = Math.max(along - half, 0)
    const z1 = z0 + t1 * s.tan
    const z2 = z0 + t2 * s.tan
    if (z2 >= o.zBottom && z1 <= o.zTop) shade = o.block
  }
  return shade
}

function hoursAt(px: number, py: number, z0: number, samples: SunSample[], garden: Garden, obs: Obstacle[], skipId?: string) {
  let h = 0
  for (const s of samples) h += (1 - shadeAt(px, py, z0, s, garden, obs, skipId)) * STEP_H
  return h
}

export interface SunGrid {
  cell: number
  cols: number
  rows: number
  hours: Float32Array
}

export function sunGrid(garden: Garden, lat: number, season: number): SunGrid {
  const cell = Math.max(garden.width, garden.depth) / 40
  const cols = Math.ceil(garden.width / cell)
  const rows = Math.ceil(garden.depth / cell)
  const samples = sunSamples(lat, season, garden.facing)
  const obs = obstacles(garden, season)
  const hours = new Float32Array(cols * rows)
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = Math.min((c + 0.5) * cell, garden.width)
      const y = Math.min((r + 0.5) * cell, garden.depth)
      hours[r * cols + c] = hoursAt(x, y, 0.5, samples, garden, obs)
    }
  return { cell, cols, rows, hours }
}

export type SunFit = 'ok' | 'too-much' | 'too-little'

export interface PlacementSun {
  hours: number
  fit: SunFit
}

// Light needs are judged over the growing season (between mid-spring and mid-summer).
export const GROWING_SEASON = 0.5

export function sunFit(plant: Plant, hours: number): SunFit {
  const min = plant.sun.includes('shade') ? 0 : plant.sun.includes('part') ? 2.5 : 5.5
  const max = plant.sun.includes('full') ? 24 : plant.sun.includes('part') ? 7 : 3.5
  return hours < min ? 'too-little' : hours > max ? 'too-much' : 'ok'
}

export function placementSun(garden: Garden, lat: number): Map<string, PlacementSun> {
  const samples = sunSamples(lat, GROWING_SEASON, garden.facing)
  const obs = obstacles(garden, GROWING_SEASON)
  const out = new Map<string, PlacementSun>()
  for (const p of garden.placements) {
    const plant = PLANT_BY_ID[p.plantId]
    // Measure where most of the foliage is, not at soil level.
    const hours = hoursAt(p.x, p.y, plant.heightFt * 0.5, samples, garden, obs, p.id)
    out.set(p.id, { hours, fit: sunFit(plant, hours) })
  }
  return out
}

export const sunClass = (hours: number) => (hours >= 6 ? 'full sun' : hours >= 3 ? 'part shade' : 'shade')

export const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const
export const compassName = (bearing: number) => COMPASS[Math.round((((bearing % 360) + 360) % 360) / 45) % 8]
