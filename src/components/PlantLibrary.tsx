import { useMemo, useState } from 'react'
import { LAYERS, PLANTS, PLANT_TYPES, layerOf, type Layer, type Plant, type PlantType, type Sun } from '../data/plants'
import { plantLook } from '../lib/season'
import { SidePlant } from './PlantArt'
import { PhotoThumb } from './PlantPhotos'

interface Props {
  zone: number
  season: number
  onAdd: (plantId: string) => void
  onShowDetails: (plantId: string) => void
}

export const fitsZone = (plant: Plant, zone: number) => zone >= plant.zones[0] && zone <= plant.zones[1]

export const TYPE_LABEL = Object.fromEntries(PLANT_TYPES.map((t) => [t.id, t.single])) as Record<PlantType, string>

export const SUN_LABEL: Record<Sun, string> = { full: '☀️ Full sun', part: '⛅ Part shade', shade: '☁️ Shade' }

export function PlantThumb({ plant, season, size = 60 }: { plant: Plant; season: number; size?: number }) {
  const H = plant.heightFt
  const m = Math.max(plant.spreadFt, H) * 1.12
  const y0 = -(H + (m - H) / 2)
  return (
    <svg className="thumb" width={size} height={size} viewBox={`${-m / 2} ${y0} ${m} ${m}`} aria-hidden>
      <SidePlant plant={plant} seed="thumb" look={plantLook(plant, season)} snow={0} />
    </svg>
  )
}

export function PlantLibrary({ zone, season, onAdd, onShowDetails }: Props) {
  const [layer, setLayer] = useState<Layer | 'all'>('all')
  const [types, setTypes] = useState<Set<PlantType>>(new Set())
  const [sun, setSun] = useState<Sun | 'any'>('any')
  const [query, setQuery] = useState('')
  const [zoneOnly, setZoneOnly] = useState(true)
  const [edibleOnly, setEdibleOnly] = useState(false)

  const plants = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PLANTS.filter(
      (pl) =>
        (layer === 'all' || layerOf(pl) === layer) &&
        (types.size === 0 || types.has(pl.type)) &&
        (sun === 'any' || pl.sun.includes(sun)) &&
        (!zoneOnly || fitsZone(pl, zone)) &&
        (!edibleOnly || pl.edible) &&
        (!q || pl.name.toLowerCase().includes(q) || pl.latin.toLowerCase().includes(q)),
    ).sort((a, b) => Number(fitsZone(b, zone)) - Number(fitsZone(a, zone)))
  }, [layer, types, sun, query, zoneOnly, edibleOnly, zone])

  const toggleType = (t: PlantType) =>
    setTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })

  return (
    <aside className="library">
      <div className="library-head">
        <h2>Plants</h2>
        <input className="search" placeholder="Search plants…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="tabs layers" role="tablist" aria-label="Height layer">
          <button role="tab" aria-selected={layer === 'all'} className={layer === 'all' ? 'tab active' : 'tab'} onClick={() => setLayer('all')}>
            All
          </button>
          {LAYERS.map((l) => (
            <button key={l.id} role="tab" aria-selected={layer === l.id} className={layer === l.id ? 'tab active' : 'tab'} onClick={() => setLayer(l.id)}>
              {l.label}
              <small>{l.hint}</small>
            </button>
          ))}
        </div>
        <div className="type-chips" aria-label="Plant type">
          {PLANT_TYPES.map((t) => {
            const count = PLANTS.filter((pl) => pl.type === t.id).length
            return (
              <button
                key={t.id}
                className={types.has(t.id) ? 'type-chip active' : 'type-chip'}
                aria-pressed={types.has(t.id)}
                disabled={count === 0}
                title={count === 0 ? 'No plants of this type yet' : undefined}
                onClick={() => toggleType(t.id)}
              >
                {t.label}
              </button>
            )
          })}
          {types.size > 0 && (
            <button className="link clear-types" onClick={() => setTypes(new Set())}>
              clear
            </button>
          )}
        </div>
        <div className="filters">
          <select value={sun} onChange={(e) => setSun(e.target.value as Sun | 'any')} aria-label="Sun exposure">
            <option value="any">Any light</option>
            <option value="full">{SUN_LABEL.full}</option>
            <option value="part">{SUN_LABEL.part}</option>
            <option value="shade">{SUN_LABEL.shade}</option>
          </select>
          <label className="check">
            <input type="checkbox" checked={zoneOnly} onChange={(e) => setZoneOnly(e.target.checked)} />
            Fits zone {zone}
          </label>
          <label className="check">
            <input type="checkbox" checked={edibleOnly} onChange={(e) => setEdibleOnly(e.target.checked)} />
            Edible
          </label>
        </div>
        <p className="muted small">
          {plants.length} plant{plants.length === 1 ? '' : 's'} · click for details · + or drag to add
        </p>
      </div>

      <ul className="plant-list">
        {plants.map((pl) => {
          const ok = fitsZone(pl, zone)
          return (
            <li key={pl.id}>
              <button
                className={ok ? 'plant-card' : 'plant-card unfit'}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plant-id', pl.id)
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                onClick={() => onShowDetails(pl.id)}
              >
                <PhotoThumb plant={pl} season={season} />
                <span className="plant-card-body">
                  <span className="plant-name">{pl.name}</span>
                  <span className="latin">{pl.latin}</span>
                  <span className="meta">
                    {pl.heightFt} ft tall · {pl.spreadFt} ft wide
                    {pl.evergreen ? ' · evergreen' : ''}
                  </span>
                  <span className="meta">
                    {TYPE_LABEL[pl.type]}
                    {pl.edible && <span className="ok"> · edible</span>}
                  </span>
                  <span className="meta">
                    {pl.sun.map((s) => SUN_LABEL[s].split(' ')[0]).join(' ')} · zones {pl.zones[0]}–{pl.zones[1]}
                    {!ok && <span className="warn"> · not hardy here</span>}
                  </span>
                </span>
              </button>
              <button className="icon-btn add card-add" onClick={() => onAdd(pl.id)} aria-label={`Add ${pl.name} to garden`} title="Add to garden">
                +
              </button>
            </li>
          )
        })}
        {plants.length === 0 && <li className="muted empty">No plants match these filters.</li>}
      </ul>
    </aside>
  )
}
