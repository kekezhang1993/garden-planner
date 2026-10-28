import { useEffect, useRef, useState } from 'react'
import { SEASON_NAMES, seasonLabel, wrap } from '../lib/season'

interface Props {
  value: number
  onChange: (t: number) => void
}

const SIZE = 200
const C = SIZE / 2
const RING = 72
const ARC_COLORS = ['#7cc35a', '#f0c540', '#e07a32', '#7aa6d8']
const ICONS = ['🌱', '☀️', '🍂', '❄️']

// t = 0 sits at 12 o'clock and the dial runs clockwise through the year.
const angleOf = (t: number) => (t * 90 - 90) * (Math.PI / 180)

function arcPath(t0: number, t1: number, r: number) {
  const a0 = angleOf(t0)
  const a1 = angleOf(t1)
  return `M${C + Math.cos(a0) * r},${C + Math.sin(a0) * r} A${r},${r} 0 0 1 ${C + Math.cos(a1) * r},${C + Math.sin(a1) * r}`
}

export function SeasonDial({ value, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState(false)
  const [playing, setPlaying] = useState(false)
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const step = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      onChange(wrap(valueRef.current + dt * 0.4))
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [playing, onChange])

  const setFromPointer = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * SIZE - C
    const y = ((e.clientY - rect.top) / rect.height) * SIZE - C
    const deg = (Math.atan2(y, x) * 180) / Math.PI
    onChange(wrap((deg + 90) / 90))
  }

  const knobA = angleOf(value)

  return (
    <div className="dial">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={dragging ? 'dragging' : ''}
        role="slider"
        aria-label="Season"
        aria-valuetext={seasonLabel(value)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(wrap(value + 0.1))
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(wrap(value - 0.1))
        }}
        onPointerDown={(e) => {
          setPlaying(false)
          setDragging(true)
          ;(e.target as Element).setPointerCapture(e.pointerId)
          setFromPointer(e)
        }}
        onPointerMove={(e) => dragging && setFromPointer(e)}
        onPointerUp={() => setDragging(false)}
      >
        <circle cx={C} cy={C} r={RING + 18} fill="var(--panel-2)" />
        {SEASON_NAMES.map((name, i) => (
          <g key={name}>
            <path d={arcPath(i - 0.5 + 0.03, i + 0.5 - 0.03, RING)} stroke={ARC_COLORS[i]} strokeWidth={16} fill="none" strokeLinecap="round" opacity={0.9} />
            <text
              x={C + Math.cos(angleOf(i)) * (RING + 0)}
              y={C + Math.sin(angleOf(i)) * (RING + 0) + 4.5}
              textAnchor="middle"
              fontSize={12}
            >
              {ICONS[i]}
            </text>
          </g>
        ))}
        <circle cx={C + Math.cos(knobA) * RING} cy={C + Math.sin(knobA) * RING} r={13} fill="#fff" stroke="var(--ink)" strokeWidth={3} className="knob" />
        <text x={C} y={C - 4} textAnchor="middle" fontSize={30}>
          {ICONS[Math.round(wrap(value)) % 4]}
        </text>
        <text x={C} y={C + 24} textAnchor="middle" className="dial-label">
          {seasonLabel(value)}
        </text>
      </svg>
      <div className="dial-buttons">
        {SEASON_NAMES.map((name, i) => (
          <button key={name} className={Math.round(wrap(value)) % 4 === i ? 'chip active' : 'chip'} onClick={() => { setPlaying(false); onChange(i) }}>
            {name}
          </button>
        ))}
        <button className="chip play" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
          {playing ? '❚❚ Pause' : '▶ Play year'}
        </button>
      </div>
    </div>
  )
}
