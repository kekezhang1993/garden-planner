import { useEffect, useRef, useState } from 'react'
import { COMPASS, compassName } from '../lib/sun'
import type { Edge, Garden } from '../types'

export const WALL_OPTIONS = [
  { h: 0, label: 'Open' },
  { h: 4, label: 'Low fence (4 ft)' },
  { h: 6, label: 'Fence (6 ft)' },
  { h: 10, label: 'Hedge or wall (10 ft)' },
  { h: 14, label: 'House, 1 story (14 ft)' },
  { h: 24, label: 'House, 2 stories (24 ft)' },
]

const EDGES: { id: Edge; label: string; offset: number }[] = [
  { id: 'back', label: 'Back', offset: 0 },
  { id: 'left', label: 'Left', offset: -90 },
  { id: 'right', label: 'Right', offset: 90 },
  { id: 'front', label: 'Front', offset: 180 },
]

export const edgeDirection = (facing: number, edge: Edge) => compassName(facing + EDGES.find((e) => e.id === edge)!.offset)

interface Props {
  garden: Garden
  latitude: number
  onChange: (patch: Partial<Pick<Garden, 'facing' | 'walls'>>) => void
  onLatitude: (lat: number) => void
}

export function SitePanel({ garden, latitude, onChange, onLatitude }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <div className="site" ref={ref}>
      <button className={open ? 'active' : ''} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        🧭 Facing {compassName(garden.facing)}
      </button>
      {open && (
        <div className="site-pop" role="dialog" aria-label="Site settings">
          <label className="site-row">
            <span>
              Standing at the front, looking toward the back, you face
              <small>A backyard behind a north-facing house usually looks south.</small>
            </span>
            <select value={Math.round(garden.facing / 45) * 45 % 360} onChange={(e) => onChange({ facing: Number(e.target.value) })}>
              {COMPASS.map((c, i) => (
                <option key={c} value={i * 45}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="site-row">
            <span>
              Latitude
              <small>Filled in by the ZIP lookup. Negative for the southern hemisphere.</small>
            </span>
            <input
              type="number"
              min={-66}
              max={66}
              step={0.5}
              value={Math.round(latitude * 10) / 10}
              onChange={(e) => Number.isFinite(e.target.valueAsNumber) && onLatitude(Math.min(Math.max(e.target.valueAsNumber, -66), 66))}
            />
          </label>
          <h4>What's along each edge?</h4>
          <div className="site-walls">
            {EDGES.map((edge) => (
              <label key={edge.id}>
                <span>
                  {edge.label} <small>({edgeDirection(garden.facing, edge.id)} side)</small>
                </span>
                <select value={garden.walls[edge.id]} onChange={(e) => onChange({ walls: { ...garden.walls, [edge.id]: Number(e.target.value) } })}>
                  {WALL_OPTIONS.map((o) => (
                    <option key={o.h} value={o.h}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Small compass rose; north points where north really is relative to the drawing (up = toward the back).
export function CompassRose({ facing }: { facing: number }) {
  return (
    <svg className="compass" viewBox="-30 -30 60 60" aria-label={`Back of the garden faces ${compassName(facing)}`}>
      <circle r={27} fill="rgba(255,253,248,0.9)" stroke="var(--line)" />
      <g transform={`rotate(${-facing})`}>
        <path d="M0,-21 L6,0 L0,-4 L-6,0 Z" fill="#c0392b" />
        <path d="M0,21 L6,0 L0,4 L-6,0 Z" fill="#9a9a90" />
        {(['N', 'E', 'S', 'W'] as const).map((c, i) => {
          const a = (i * 90 * Math.PI) / 180
          return (
            <text key={c} x={Math.sin(a) * 15} y={-Math.cos(a) * 15 + 3} textAnchor="middle" fontSize={8} fontWeight={600} fill={c === 'N' ? '#c0392b' : 'var(--ink-2)'} transform={`rotate(${facing} ${Math.sin(a) * 15} ${-Math.cos(a) * 15})`}>
              {c}
            </text>
          )
        })}
      </g>
    </svg>
  )
}
