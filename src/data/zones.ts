// USDA plant hardiness zones, defined by average annual extreme minimum temperature.

export interface Zone {
  zone: number
  minF: number
  maxF: number
}

export const ZONES: Zone[] = Array.from({ length: 13 }, (_, i) => ({
  zone: i + 1,
  minF: -60 + i * 10,
  maxF: -50 + i * 10,
}))

const toC = (f: number) => Math.round(((f - 32) * 5) / 9)

export function zoneLabel(z: Zone): string {
  return `Zone ${z.zone}  ·  ${z.minF}°F to ${z.maxF}°F  (${toC(z.minF)}°C to ${toC(z.maxF)}°C)`
}

// Zones cold enough that winter usually means lasting snow cover.
export const isSnowy = (zone: number) => zone <= 6

export interface ZipLookup {
  zone: number
  label: string
  latitude: number | null
}

// phzmapi.org serves the USDA 2023 zone map as static JSON per ZIP code.
export async function lookupZip(zip: string): Promise<ZipLookup> {
  const res = await fetch(`https://phzmapi.org/${encodeURIComponent(zip)}.json`)
  if (!res.ok) throw new Error('ZIP code not found')
  const data = (await res.json()) as { zone?: string; coordinates?: { lat?: string } }
  const zone = parseInt(data.zone ?? '', 10)
  if (!Number.isFinite(zone)) throw new Error('No zone for that ZIP code')
  const lat = parseFloat(data.coordinates?.lat ?? '')
  return { zone, label: data.zone!, latitude: Number.isFinite(lat) ? lat : null }
}
