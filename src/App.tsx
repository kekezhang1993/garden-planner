import { useCallback, useEffect, useMemo, useState } from 'react'
import { PLANT_BY_ID } from './data/plants'
import { isSnowy } from './data/zones'
import { SEASON_NAMES, seasonLabel } from './lib/season'
import { placementSun, sunGrid } from './lib/sun'
import type { Garden, Placement, ViewMode } from './types'
import { Inspector } from './components/Inspector'
import { PlantDetailsModal } from './components/PlantDetails'
import { PlanView } from './components/PlanView'
import { PlantLibrary } from './components/PlantLibrary'
import { RegionPicker } from './components/RegionPicker'
import { SceneView } from './components/SceneView'
import { SeasonDial } from './components/SeasonDial'
import { CompassRose, SitePanel } from './components/SitePanel'

const STORAGE_KEY = 'garden-planner:v1'
const PHOTO_KEY = 'garden-planner:photo'

interface Saved {
  zone: number
  zoneSource: string | null
  garden: Garden
  viewHeight: number
  latitude: number
}

const DEFAULTS: Saved = {
  zone: 7,
  zoneSource: null,
  garden: { name: 'My garden', width: 30, depth: 16, placements: [], facing: 180, walls: { back: 6, left: 0, right: 0, front: 0 } },
  viewHeight: 0.3,
  latitude: 40,
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const saved = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Saved>) }
    saved.garden = { ...DEFAULTS.garden, ...saved.garden }
    saved.garden.placements = saved.garden.placements.filter((p) => PLANT_BY_ID[p.plantId])
    return saved
  } catch {
    return DEFAULTS
  }
}

function loadPhoto(): string | null {
  try {
    return localStorage.getItem(PHOTO_KEY)
  } catch {
    return null
  }
}

const newId = () => Math.random().toString(36).slice(2, 10)

// Shrink uploaded photos so they fit comfortably in local storage.
function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(img.src)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function App() {
  const initial = useMemo(load, [])
  const [zone, setZone] = useState(initial.zone)
  const [zoneSource, setZoneSource] = useState(initial.zoneSource)
  const [garden, setGarden] = useState<Garden>(initial.garden)
  const [viewHeight, setViewHeight] = useState(initial.viewHeight)
  const [latitude, setLatitude] = useState(initial.latitude)
  const [showSun, setShowSun] = useState(false)
  const [photo, setPhoto] = useState<string | null>(loadPhoto)
  const [season, setSeason] = useState(1)
  const [view, setView] = useState<ViewMode>('plan')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailsId, setDetailsId] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ zone, zoneSource, garden, viewHeight, latitude } satisfies Saved))
    } catch {
      /* storage unavailable — the plan still works for this session */
    }
  }, [zone, zoneSource, garden, viewHeight, latitude])

  useEffect(() => {
    try {
      if (photo) localStorage.setItem(PHOTO_KEY, photo)
      else localStorage.removeItem(PHOTO_KEY)
    } catch {
      /* photo too large to persist; keep it in memory only */
    }
  }, [photo])

  const snowy = isSnowy(zone)
  const sunByPlacement = useMemo(() => placementSun(garden, latitude), [garden, latitude])
  const grid = useMemo(() => (showSun && view === 'plan' ? sunGrid(garden, latitude, season) : null), [showSun, view, garden, latitude, season])
  const selected = garden.placements.find((p) => p.id === selectedId) ?? null

  const updatePlacements = (fn: (ps: Placement[]) => Placement[]) => setGarden((g) => ({ ...g, placements: fn(g.placements) }))

  const addPlant = (plantId: string, x?: number, y?: number) => {
    const id = newId()
    updatePlacements((ps) => [
      ...ps,
      {
        id,
        plantId,
        x: x ?? garden.width / 2 + (Math.random() - 0.5) * garden.width * 0.3,
        y: y ?? garden.depth / 2 + (Math.random() - 0.5) * garden.depth * 0.3,
      },
    ])
    setSelectedId(id)
  }

  const movePlant = useCallback((id: string, x: number, y: number) => {
    setGarden((g) => ({ ...g, placements: g.placements.map((p) => (p.id === id ? { ...p, x, y } : p)) }))
  }, [])

  const removePlant = (id: string) => {
    updatePlacements((ps) => ps.filter((p) => p.id !== id))
    setSelectedId(null)
  }

  const duplicatePlant = (id: string) => {
    const src = garden.placements.find((p) => p.id === id)
    if (!src) return
    const spread = PLANT_BY_ID[src.plantId].spreadFt
    addPlant(src.plantId, Math.min(src.x + spread, garden.width), src.y)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (detailsId) {
        if (e.key === 'Escape') setDetailsId(null)
        return
      }
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        removePlant(selectedId)
      }
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const resize = (key: 'width' | 'depth', value: number) => {
    if (!Number.isFinite(value)) return
    const v = Math.min(Math.max(Math.round(value), 4), 200)
    setGarden((g) => ({
      ...g,
      [key]: v,
      placements: g.placements.map((p) => (key === 'width' ? { ...p, x: Math.min(p.x, v) } : { ...p, y: Math.min(p.y, v) })),
    }))
  }

  const sceneProps = { garden, snowy, viewHeight, photo }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            🌳
          </span>
          <input className="garden-name" value={garden.name} onChange={(e) => setGarden((g) => ({ ...g, name: e.target.value }))} aria-label="Garden name" />
        </div>
        <RegionPicker
          zone={zone}
          zoneSource={zoneSource}
          onChange={(z, src, lat) => {
            setZone(z)
            setZoneSource(src)
            if (lat !== undefined) setLatitude(lat)
          }}
        />
      </header>

      <PlantLibrary zone={zone} season={season} onAdd={(id) => addPlant(id)} onShowDetails={setDetailsId} />

      <main className="stage">
        <div className="toolbar">
          <div className="segmented" role="tablist">
            {(
              [
                ['plan', 'Plan'],
                ['scene', 'Garden view'],
                ['seasons', '4 seasons'],
              ] as const
            ).map(([id, label]) => (
              <button key={id} role="tab" aria-selected={view === id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>
                {label}
              </button>
            ))}
          </div>
          <SitePanel garden={garden} latitude={latitude} onChange={(patch) => setGarden((g) => ({ ...g, ...patch }))} onLatitude={setLatitude} />
          {view === 'plan' && (
            <button className={showSun ? 'sun-toggle active' : 'sun-toggle'} aria-pressed={showSun} onClick={() => setShowSun((s) => !s)}>
              ☀ Sun map
            </button>
          )}
          <span className="dim">
            Size
            <input type="number" min={4} max={200} value={garden.width} onChange={(e) => resize('width', e.target.valueAsNumber)} aria-label="Width in feet" title="Width (ft)" />
            ×
            <input type="number" min={4} max={200} value={garden.depth} onChange={(e) => resize('depth', e.target.valueAsNumber)} aria-label="Depth in feet" title="Depth (ft)" />
            ft
          </span>
          {view !== 'plan' && (
            <>
              <label className="dim">
                <span title="Raise the camera to see low plants hidden behind tall ones">View height</span>
                <small className="muted">eye level</small>
                <input type="range" min={0} max={1} step={0.01} value={viewHeight} onChange={(e) => setViewHeight(e.target.valueAsNumber)} aria-label="View height" />
                <small className="muted">bird's-eye</small>
              </label>
              <label className="button-like">
                {photo ? 'Change photo' : 'Use a photo of my yard'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) setPhoto(await readPhoto(file))
                    e.target.value = ''
                  }}
                />
              </label>
              {photo && (
                <button className="ghost" onClick={() => setPhoto(null)}>
                  Remove photo
                </button>
              )}
            </>
          )}
          <span className="spacer" />
          <button
            className="ghost"
            disabled={garden.placements.length === 0}
            onClick={() => {
              if (confirm('Remove every plant from this garden?')) {
                updatePlacements(() => [])
                setSelectedId(null)
              }
            }}
          >
            Clear all
          </button>
        </div>

        <div className={view === 'seasons' ? 'canvas seasons-grid' : 'canvas'}>
          {view === 'plan' && (
            <PlanView
              garden={garden}
              season={season}
              snowy={snowy}
              selectedId={selectedId}
              sunGrid={grid}
              sunByPlacement={showSun ? sunByPlacement : null}
              onSelect={setSelectedId}
              onMove={movePlant}
              onDropPlant={addPlant}
            />
          )}
          {view !== 'seasons' && <CompassRose facing={garden.facing} />}
          {view === 'scene' && (
            <SceneView {...sceneProps} season={season} selectedId={selectedId} onSelect={setSelectedId} onMove={movePlant} onDropPlant={addPlant} />
          )}
          {view === 'seasons' &&
            SEASON_NAMES.map((name, i) => (
              <figure key={name} className="season-tile">
                <SceneView {...sceneProps} season={i} interactive={false} />
                <figcaption>{name}</figcaption>
              </figure>
            ))}
        </div>
        {grid && (
          <div className="sun-legend">
            <span>Direct sun, {seasonLabel(season).toLowerCase()}:</span>
            <span className="sun-scale" aria-hidden />
            <span className="muted small">0 h · 3 h part shade · 6 h+ full sun</span>
            <span className="muted small">· ⚠ = wrong light for that plant (judged over the growing season)</span>
          </div>
        )}
        {view === 'scene' && photo && <p className="muted small hint">Slide “View height” until the far edge of the bed lines up with your photo.</p>}
      </main>

      <aside className="sidebar">
        <section>
          <h3>Season</h3>
          <SeasonDial value={season} onChange={setSeason} />
        </section>
        <Inspector garden={garden} selected={selected} zone={zone} season={season} sun={sunByPlacement} onRemove={removePlant} onDuplicate={duplicatePlant} onSelect={setSelectedId} />
      </aside>

      {detailsId && PLANT_BY_ID[detailsId] && (
        <PlantDetailsModal
          plant={PLANT_BY_ID[detailsId]}
          zone={zone}
          onAdd={() => {
            addPlant(detailsId)
            setDetailsId(null)
          }}
          onClose={() => setDetailsId(null)}
        />
      )}
    </div>
  )
}
