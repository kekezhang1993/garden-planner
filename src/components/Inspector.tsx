import { LAYERS, PLANT_BY_ID, layerOf } from '../data/plants'
import { sunClass, type PlacementSun } from '../lib/sun'
import type { Garden, Placement } from '../types'
import { PlantFacts } from './PlantDetails'
import { PlantThumb, fitsZone } from './PlantLibrary'
import { PhotoGallery } from './PlantPhotos'

interface Props {
  garden: Garden
  selected: Placement | null
  zone: number
  season: number
  sun: Map<string, PlacementSun>
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
  onSelect: (id: string) => void
}

const SUN_ADVICE = { 'too-much': 'too much sun for this plant', 'too-little': 'not enough sun for this plant', ok: 'a good match' }

const hoursText = (h: number) => `~${Math.round(h * 2) / 2} h`

export function Inspector({ garden, selected, zone, season, sun, onRemove, onDuplicate, onSelect }: Props) {
  if (selected) {
    const plant = PLANT_BY_ID[selected.plantId]
    return (
      <section className="inspector">
        <div className="inspector-head">
          <PlantThumb plant={plant} season={season} size={72} />
          <div>
            <h3>{plant.name}</h3>
            <p className="latin">{plant.latin}</p>
          </div>
        </div>
        <div className="row inspector-actions">
          <button onClick={() => onDuplicate(selected.id)}>Duplicate</button>
          <button className="danger" onClick={() => onRemove(selected.id)}>
            Remove
          </button>
        </div>
        <PhotoGallery key={plant.id} plant={plant} />
        <dl>
          <PlantFacts plant={plant} zone={zone} />
          {sun.get(selected.id) && (
            <>
              <dt>Sun here</dt>
              <dd className="sun-row">
                {hoursText(sun.get(selected.id)!.hours)} direct sun ({sunClass(sun.get(selected.id)!.hours)}) —{' '}
                <span className={sun.get(selected.id)!.fit === 'ok' ? 'ok' : 'bad'}>{SUN_ADVICE[sun.get(selected.id)!.fit]}</span>
              </dd>
            </>
          )}
          <dt>Position</dt>
          <dd>
            {selected.x.toFixed(1)} ft from left, {(garden.depth - selected.y).toFixed(1)} ft from front
          </dd>
        </dl>
        <p className="notes">{plant.notes}</p>
      </section>
    )
  }

  const counts = LAYERS.map((l) => ({ ...l, n: garden.placements.filter((p) => layerOf(PLANT_BY_ID[p.plantId]) === l.id).length }))
  const unfit = garden.placements.filter((p) => !fitsZone(PLANT_BY_ID[p.plantId], zone))
  const wrongSun = garden.placements.filter((p) => sun.get(p.id) && sun.get(p.id)!.fit !== 'ok')

  return (
    <section className="inspector">
      <h3>In this garden</h3>
      {garden.placements.length === 0 ? (
        <p className="muted">Nothing planted yet. Drag plants from the list, or click one to drop it in the middle.</p>
      ) : (
        <ul className="counts">
          {counts.map((c) => (
            <li key={c.id}>
              <span>
                {c.label} <span className="muted small">{c.hint}</span>
              </span>
              <strong>{c.n}</strong>
            </li>
          ))}
        </ul>
      )}
      {unfit.length > 0 && (
        <div className="unfit-box">
          <strong>Not hardy in zone {zone}:</strong>
          {unfit.map((p) => (
            <button key={p.id} className="link" onClick={() => onSelect(p.id)}>
              {PLANT_BY_ID[p.plantId].name}
            </button>
          ))}
        </div>
      )}
      {wrongSun.length > 0 && (
        <div className="unfit-box">
          <strong>Wrong amount of sun:</strong>
          {wrongSun.map((p) => {
            const info = sun.get(p.id)!
            return (
              <button key={p.id} className="link" onClick={() => onSelect(p.id)}>
                {PLANT_BY_ID[p.plantId].name} — {info.fit === 'too-much' ? 'too sunny' : 'too shady'} ({hoursText(info.hours)})
              </button>
            )
          })}
        </div>
      )}
      <p className="muted small">Tip: select a plant to see details. Press Delete to remove it.</p>
    </section>
  )
}
