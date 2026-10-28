// Looks up each plant on iNaturalist and saves openly licensed photo links + credits
// to src/data/plantPhotos.json. Re-run (`npm run photos`) after adding plants.

import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PLANTS, type Plant } from '../src/data/plants'
import type { PlantPhotos } from '../src/data/photos'

// Run from the project root (npm run photos does this).
const OUT = resolve('src/data/plantPhotos.json')
const API = 'https://api.inaturalist.org/v1'
const MAX_PHOTOS = 5
const refresh = process.argv.includes('--refresh')

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// iNaturalist asks API clients to stay around one request per second.
async function get(path: string) {
  await sleep(1100)
  const res = await fetch(API + path, { headers: { 'User-Agent': 'garden-planner (personal project)' } })
  if (!res.ok) throw new Error(`${res.status} for ${path}`)
  return res.json()
}

// "Acer palmatum 'Bloodgood'" -> "Acer palmatum", "Forsythia × intermedia" stays as is.
export function speciesQuery(plant: Plant): string {
  if (plant.taxon) return plant.taxon
  const words = plant.latin
    .replace(/'[^']*'/g, '')
    .replace(/\([^)]*\)/g, '')
    .trim()
    .split(/\s+/)
  return words.slice(0, words[1] === '×' ? 3 : 2).join(' ')
}

interface Taxon {
  id: number
  name: string
  rank: string
  taxon_photos?: { photo: { medium_url: string; square_url: string; attribution: string; license_code: string | null } }[]
}

async function lookup(plant: Plant): Promise<PlantPhotos | null> {
  const q = speciesQuery(plant)
  const { results } = (await get(`/taxa?q=${encodeURIComponent(q)}&is_active=true&per_page=10`)) as { results: Taxon[] }
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ')
  const match = results.find((t) => norm(t.name) === norm(q)) ?? results.find((t) => t.rank === 'species' || t.rank === 'hybrid') ?? results[0]
  if (!match) return null

  const { results: full } = (await get(`/taxa/${match.id}`)) as { results: Taxon[] }
  const photos = (full[0]?.taxon_photos ?? [])
    .map((tp) => tp.photo)
    .filter((ph) => ph.license_code) // skip "all rights reserved"
    .slice(0, MAX_PHOTOS)
    .map((ph) => ({ medium: ph.medium_url, square: ph.square_url, attribution: ph.attribution, license: ph.license_code! }))
  if (!photos.length) return null

  return { taxonId: match.id, taxonName: match.name, exact: norm(match.name) === norm(q), photos }
}

const existing: Record<string, PlantPhotos> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {}
const out: Record<string, PlantPhotos> = {}

for (const plant of PLANTS) {
  if (!refresh && existing[plant.id]) {
    out[plant.id] = existing[plant.id]
    continue
  }
  try {
    const found = await lookup(plant)
    if (found) out[plant.id] = found
    console.log(`${found ? (found.exact ? 'ok  ' : 'NEAR') : 'MISS'}  ${plant.id.padEnd(24)} ${speciesQuery(plant)}  ->  ${found?.taxonName ?? '-'} (${found?.photos.length ?? 0} photos)`)
  } catch (err) {
    console.log(`ERR   ${plant.id}: ${(err as Error).message}`)
    if (existing[plant.id]) out[plant.id] = existing[plant.id]
  }
}

writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n')
console.log(`\nSaved photos for ${Object.keys(out).length} of ${PLANTS.length} plants.`)
