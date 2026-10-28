import { useEffect, useRef } from 'react'
import { LAYERS, layerOf, type Plant } from '../data/plants'
import { SEASON_NAMES } from '../lib/season'
import { PlantThumb, SUN_LABEL, TYPE_LABEL, fitsZone } from './PlantLibrary'
import { PhotoGallery } from './PlantPhotos'

const LAYER_LABEL = Object.fromEntries(LAYERS.map((l) => [l.id, `${l.label} layer (${l.hint})`]))

// Rows for a <dl>, shared by the details popup and the selected-plant panel.
export function PlantFacts({ plant, zone }: { plant: Plant; zone: number }) {
  const ok = fitsZone(plant, zone)
  return (
    <>
      <dt>Type</dt>
      <dd>
        {TYPE_LABEL[plant.type]} · {plant.evergreen ? 'evergreen' : 'deciduous'}
        {plant.edible && <span className="ok"> · edible</span>}
      </dd>
      <dt>Layer</dt>
      <dd>{LAYER_LABEL[layerOf(plant)]}</dd>
      <dt>Mature size</dt>
      <dd>
        {plant.heightFt} ft tall × {plant.spreadFt} ft wide
      </dd>
      <dt>Hardiness</dt>
      <dd>
        Zones {plant.zones[0]}–{plant.zones[1]} {ok ? <span className="ok">✓ fits zone {zone}</span> : <span className="warn">✗ not hardy in zone {zone}</span>}
      </dd>
      <dt>Light</dt>
      <dd>{plant.sun.map((s) => SUN_LABEL[s]).join(', ')}</dd>
      <dt>Water</dt>
      <dd>{plant.water}</dd>
    </>
  )
}

interface ModalProps {
  plant: Plant
  zone: number
  onAdd: () => void
  onClose: () => void
}

export function PlantDetailsModal({ plant, zone, onAdd, onClose }: ModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => closeRef.current?.focus(), [plant.id])

  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="plant-modal-title">
        <header className="modal-head">
          <div>
            <h2 id="plant-modal-title">{plant.name}</h2>
            <p className="latin">{plant.latin}</p>
          </div>
          <button className="icon-btn add" onClick={onAdd} aria-label={`Add ${plant.name} to garden`} title="Add to garden">
            +
          </button>
          <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label="Close" title="Close">
            ×
          </button>
        </header>
        <div className="modal-body">
          <PhotoGallery key={plant.id} plant={plant} />
          <div>
            <dl className="facts">
              <PlantFacts plant={plant} zone={zone} />
            </dl>
            <p className="notes">{plant.notes}</p>
            <h3>Through the year</h3>
            <div className="year-strip">
              {SEASON_NAMES.map((name, i) => (
                <figure key={name}>
                  <PlantThumb plant={plant} season={i} size={72} />
                  <figcaption>{name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
