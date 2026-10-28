import { useRef } from 'react'
import { PLANT_BY_ID, layerOf } from '../data/plants'
import { environment, mixColor, plantLook } from '../lib/season'
import type { PlacementSun, SunGrid } from '../lib/sun'
import type { Edge, Garden } from '../types'
import { TopPlant } from './PlantArt'
import { WALL_OPTIONS, edgeDirection } from './SitePanel'

interface Props {
  garden: Garden
  season: number
  snowy: boolean
  selectedId: string | null
  sunGrid: SunGrid | null
  sunByPlacement: Map<string, PlacementSun> | null
  onSelect: (id: string | null) => void
  onMove: (id: string, x: number, y: number) => void
  onDropPlant: (plantId: string, x: number, y: number) => void
}

// Dark blue-grey for deep shade through to warm yellow for 6 h+ of sun.
function sunColor(hours: number) {
  if (hours < 3) return mixColor('#1f2a44', '#6f7c96', hours / 3)
  if (hours < 6) return mixColor('#6f7c96', '#f2d34a', (hours - 3) / 3)
  return mixColor('#f2d34a', '#fff1a8', Math.min((hours - 6) / 4, 1))
}

const WALL_COLOR = (h: number) => (h >= 14 ? '#b9b2a6' : h >= 10 ? '#8a8478' : '#8a6e4e')
const wallLabel = (h: number) => WALL_OPTIONS.find((o) => o.h === h)?.label ?? `${h} ft`

export function PlanView({ garden, season, snowy, selectedId, sunGrid, sunByPlacement, onSelect, onMove, onDropPlant }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const { width: W, depth: D } = garden
  const env = environment(season, snowy)
  const fs = Math.max(W, D, 12) / 34
  const PAD = fs * 2.4

  const toFeet = (clientX: number, clientY: number) => {
    const svg = svgRef.current!
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    return { x: p.x, y: p.y }
  }
  const clamp = (x: number, y: number) => ({ x: Math.min(Math.max(x, 0), W), y: Math.min(Math.max(y, 0), D) })

  // Bulbs are planted through low plants, so draw them above those but under mid/tall canopies.
  const drawHeight = (id: string) => {
    const plant = PLANT_BY_ID[id]
    return plant.type === 'bulb' ? 6.1 : plant.heightFt
  }
  const sorted = [...garden.placements].sort((a, b) => drawHeight(a.plantId) - drawHeight(b.plantId))
  const gridLines = []
  for (let x = 1; x < W; x++) gridLines.push(<line key={`x${x}`} x1={x} y1={0} x2={x} y2={D} className={x % 5 ? 'grid' : 'grid major'} />)
  for (let y = 1; y < D; y++) gridLines.push(<line key={`y${y}`} x1={0} y1={y} x2={W} y2={y} className={y % 5 ? 'grid' : 'grid major'} />)

  return (
    <svg
      ref={svgRef}
      className="plan"
      viewBox={`${-PAD} ${-PAD} ${W + PAD * 2} ${D + PAD * 2}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={(e) => e.target === e.currentTarget && onSelect(null)}
      onPointerMove={(e) => {
        if (!drag.current) return
        const p = toFeet(e.clientX, e.clientY)
        const c = clamp(p.x - drag.current.dx, p.y - drag.current.dy)
        onMove(drag.current.id, c.x, c.y)
      }}
      onPointerUp={() => (drag.current = null)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/plant-id')
        if (!id) return
        const p = toFeet(e.clientX, e.clientY)
        const c = clamp(p.x, p.y)
        onDropPlant(id, c.x, c.y)
      }}
    >
      <rect x={-PAD} y={-PAD} width={W + PAD * 2} height={D + PAD * 2} fill={env.lawn} onPointerDown={() => onSelect(null)} />
      <rect x={0} y={0} width={W} height={D} fill={env.mulch} rx={0.3} onPointerDown={() => onSelect(null)} />
      <g pointerEvents="none">{gridLines}</g>
      <rect x={0} y={0} width={W} height={D} fill="none" className="bed-edge" rx={0.3} />
      {(Object.entries(garden.walls) as [Edge, number][]).map(([edge, h]) => {
        if (!h) return null
        const [x1, y1, x2, y2] = { back: [0, 0, W, 0], front: [0, D, W, D], left: [0, 0, 0, D], right: [W, 0, W, D] }[edge]
        return (
          <line key={edge} x1={x1} y1={y1} x2={x2} y2={y2} stroke={WALL_COLOR(h)} className="wall-line">
            <title>{wallLabel(h)}</title>
          </line>
        )
      })}
      <text x={W / 2} y={-fs * 0.8} fontSize={fs} className="plan-caption" textAnchor="middle">
        Back · {edgeDirection(garden.facing, 'back')} side · {W} ft{garden.walls.back ? ` · ${wallLabel(garden.walls.back)}` : ''}
      </text>
      <text x={W / 2} y={D + fs * 1.6} fontSize={fs} className="plan-caption" textAnchor="middle">
        Front · {edgeDirection(garden.facing, 'front')} side (where you stand){garden.walls.front ? ` · ${wallLabel(garden.walls.front)}` : ''}
      </text>
      <text x={-fs * 0.8} y={D / 2} fontSize={fs} className="plan-caption" textAnchor="middle" transform={`rotate(-90 ${-fs * 0.8} ${D / 2})`}>
        {edgeDirection(garden.facing, 'left')} side · {D} ft
      </text>
      <text x={W + fs * 0.8} y={D / 2} fontSize={fs} className="plan-caption" textAnchor="middle" transform={`rotate(90 ${W + fs * 0.8} ${D / 2})`}>
        {edgeDirection(garden.facing, 'right')} side
      </text>

      {sorted.map((pl) => {
        const plant = PLANT_BY_ID[pl.plantId]
        const R = plant.spreadFt / 2
        const selected = pl.id === selectedId
        return (
          <g
            key={pl.id}
            transform={`translate(${pl.x} ${pl.y})`}
            className="placed"
            onPointerDown={(e) => {
              e.stopPropagation()
              onSelect(pl.id)
              const p = toFeet(e.clientX, e.clientY)
              drag.current = { id: pl.id, dx: p.x - pl.x, dy: p.y - pl.y }
              svgRef.current!.setPointerCapture(e.pointerId)
            }}
          >
            <TopPlant
              plant={plant}
              seed={pl.id}
              look={plantLook(plant, season)}
              snow={env.snow}
              canopyOpacity={layerOf(plant) === 'tall' && !selected ? 0.72 : 1}
            />
            <circle r={Math.max(R, 0.5)} fill="transparent" />
            {selected && (
              <>
                <circle r={R} className="mature-ring" />
                <text y={R + fs * 1.2} fontSize={fs} textAnchor="middle" className="plan-label">
                  {plant.name}
                </text>
              </>
            )}
          </g>
        )
      })}

      {sunGrid && (
        <g pointerEvents="none" opacity={0.5}>
          {Array.from(sunGrid.hours, (h, i) => (
            <rect
              key={i}
              x={(i % sunGrid.cols) * sunGrid.cell}
              y={Math.floor(i / sunGrid.cols) * sunGrid.cell}
              width={sunGrid.cell + 0.02}
              height={sunGrid.cell + 0.02}
              fill={sunColor(h)}
            />
          ))}
        </g>
      )}
      {sunByPlacement &&
        garden.placements.map((pl) => {
          const info = sunByPlacement.get(pl.id)
          if (!info || info.fit === 'ok') return null
          const R = PLANT_BY_ID[pl.plantId].spreadFt / 2
          return (
            <g key={`warn${pl.id}`} transform={`translate(${pl.x + R * 0.6} ${pl.y - R * 0.6})`} pointerEvents="none">
              <circle r={fs * 0.55} fill="#e07a32" stroke="#fff" strokeWidth={fs * 0.08} />
              <text y={fs * 0.22} textAnchor="middle" fontSize={fs * 0.7} fontWeight={700} fill="#fff">
                !
              </text>
            </g>
          )
        })}
    </svg>
  )
}
