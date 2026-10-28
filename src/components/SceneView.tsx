import { useEffect, useId, useRef, useState } from 'react'
import { PLANT_BY_ID } from '../data/plants'
import { environment, plantLook, quadColor, winterness } from '../lib/season'
import type { Garden } from '../types'
import { SidePlant } from './PlantArt'

interface Props {
  garden: Garden
  season: number
  snowy: boolean
  viewHeight: number // 0 = eye level, 1 = bird's-eye
  photo: string | null
  selectedId?: string | null
  interactive?: boolean
  onSelect?: (id: string | null) => void
  onMove?: (id: string, x: number, y: number) => void
  onDropPlant?: (plantId: string, x: number, y: number) => void
}

const VW = 1000

// A simple pinhole camera standing in front of the bed, looking toward the back edge.
// viewHeight 0 = near eye level, 1 = high bird's-eye view. The front edge stays at the bottom of the
// view and the back edge moves up the screen as the camera rises, so the whole bed stays in frame.
function makeCamera(W: number, D: number, viewHeight: number, VH: number) {
  const d0 = Math.max(W * 0.85, 8)
  const f = (0.9 * VW * d0) / W
  const frontY = 0.97 * VH
  const backY = VH * (0.8 - 0.72 * viewHeight)
  const fh = (frontY - backY) / (1 / d0 - 1 / (d0 + D))
  const horizonY = frontY - fh / d0
  const h = fh / f
  const dist = (y: number) => D - y + d0
  const project = (x: number, y: number, z = 0) => {
    const dd = dist(y)
    return { sx: VW / 2 + (f * (x - W / 2)) / dd, sy: horizonY + (f * (h - z)) / dd, scale: f / dd }
  }
  const unproject = (sx: number, sy: number) => {
    const dd = (f * h) / Math.max(sy - horizonY, 1)
    return { x: W / 2 + ((sx - VW / 2) * dd) / f, y: D - (dd - d0) }
  }
  return { horizonY, project, unproject }
}

// Match the drawing's aspect ratio to its box so the scene fills it without letterboxing.
function useViewHeight(ref: React.RefObject<SVGSVGElement>) {
  const [vh, setVh] = useState(600)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setVh(Math.round(Math.min(Math.max((VW * height) / width, 380), 1200)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return vh
}

export function SceneView({ garden, season, snowy, viewHeight, photo, selectedId, interactive = true, onSelect, onMove, onDropPlant }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const uid = useId().replace(/:/g, '')
  const VH = useViewHeight(svgRef)
  const drag = useRef<{ id: string; ox: number; oy: number } | null>(null)
  const { width: W, depth: D } = garden
  const env = environment(season, snowy)
  const cam = makeCamera(W, D, viewHeight, VH)

  const toView = (clientX: number, clientY: number) => {
    const svg = svgRef.current!
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    return { x: p.x, y: p.y }
  }
  const toGround = (sx: number, sy: number) => {
    const g = cam.unproject(sx, sy)
    return { x: Math.min(Math.max(g.x, 0), W), y: Math.min(Math.max(g.y, 0), D) }
  }

  const corners = [cam.project(0, 0), cam.project(W, 0), cam.project(W, D), cam.project(0, D)]
  const bed = corners.map((c) => `${c.sx},${c.sy}`).join(' ')

  // Fences, walls or house sides along the back and side edges (the front is behind the viewer).
  const wallFill = (h: number) => (h >= 14 ? '#d8d1c4' : h >= 10 ? '#a39c90' : '#b89a72')
  const wallFaces = (
    [
      ['left', [0, 0], [0, D]],
      ['right', [W, 0], [W, D]],
      ['back', [0, 0], [W, 0]],
    ] as const
  ).flatMap(([edge, a, b]) => {
    const h = garden.walls[edge]
    if (!h) return []
    const pts = [cam.project(a[0], a[1], 0), cam.project(b[0], b[1], 0), cam.project(b[0], b[1], h), cam.project(a[0], a[1], h)]
    const posts = []
    if (h <= 6 && edge === 'back')
      for (let x = 0; x <= W; x += 4) {
        const p0 = cam.project(x, 0)
        const p1 = cam.project(x, 0, h + 0.3)
        posts.push(<line key={x} x1={p0.sx} y1={p0.sy} x2={p1.sx} y2={p1.sy} className="fence-post" />)
      }
    return [
      <g key={edge}>
        <polygon points={pts.map((p) => `${p.sx},${p.sy}`).join(' ')} fill={wallFill(h)} className="wall-face" />
        {posts}
      </g>,
    ]
  })

  const sorted = [...garden.placements].sort((a, b) => a.y - b.y)
  const photoTint = quadColor(['#fff6e0', '#fff4c8', '#ffb060', '#dbe8ff'], season)
  const photoTintAmount = 0.08 + 0.22 * Math.max(winterness(season), Math.max(0, 1 - Math.abs(season - 2)))

  return (
    <svg
      ref={svgRef}
      className={interactive ? 'scene' : 'scene compact'}
      viewBox={`0 0 ${VW} ${VH}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerMove={(e) => {
        if (!drag.current || !onMove) return
        const p = toView(e.clientX, e.clientY)
        const g = toGround(p.x - drag.current.ox, p.y - drag.current.oy)
        onMove(drag.current.id, g.x, g.y)
      }}
      onPointerUp={() => (drag.current = null)}
      onDragOver={(e) => interactive && e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/plant-id')
        if (!id || !onDropPlant) return
        const p = toView(e.clientX, e.clientY)
        const g = toGround(p.x, p.y)
        onDropPlant(id, g.x, g.y)
      }}
    >
      <defs>
        <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={env.sky[0]} />
          <stop offset="1" stopColor={env.sky[1]} />
        </linearGradient>
        <clipPath id={`clip${uid}`}>
          <rect width={VW} height={VH} />
        </clipPath>
      </defs>

      <g clipPath={`url(#clip${uid})`} onPointerDown={() => onSelect?.(null)}>
        {photo ? (
          <>
            <image href={photo} x={0} y={0} width={VW} height={VH} preserveAspectRatio="xMidYMid slice" />
            <rect width={VW} height={VH} fill={photoTint} opacity={photoTintAmount} style={{ mixBlendMode: 'multiply' }} />
            {env.snow > 0.05 && <rect y={cam.horizonY} width={VW} height={VH - cam.horizonY} fill="#fff" opacity={env.snow * 0.45} />}
            <polygon points={bed} fill={env.mulch} opacity={0.35} />
            <polygon points={bed} className="bed-outline" />
          </>
        ) : (
          <>
            {cam.horizonY > 0 && <rect width={VW} height={cam.horizonY + 1} fill={`url(#sky${uid})`} />}
            <rect y={cam.horizonY} width={VW} height={VH - cam.horizonY} fill={env.lawn} />
            {wallFaces}
            <polygon points={bed} fill={env.mulch} />
          </>
        )}
      </g>

      {sorted.map((pl) => {
        const plant = PLANT_BY_ID[pl.plantId]
        const pos = cam.project(pl.x, pl.y)
        const R = plant.spreadFt / 2
        const selected = pl.id === selectedId
        return (
          <g
            key={pl.id}
            transform={`translate(${pos.sx} ${pos.sy}) scale(${pos.scale})`}
            className={interactive ? 'placed' : undefined}
            onPointerDown={(e) => {
              if (!interactive) return
              e.stopPropagation()
              onSelect?.(pl.id)
              const p = toView(e.clientX, e.clientY)
              drag.current = { id: pl.id, ox: p.x - pos.sx, oy: p.y - pos.sy }
              svgRef.current!.setPointerCapture(e.pointerId)
            }}
          >
            <ellipse rx={R * 0.95} ry={R * 0.22} fill="#000" opacity={0.18} />
            {selected && <ellipse rx={R + 0.3} ry={(R + 0.3) * 0.25} className="scene-select" />}
            <SidePlant plant={plant} seed={pl.id} look={plantLook(plant, season)} snow={env.snow} />
          </g>
        )
      })}
    </svg>
  )
}
