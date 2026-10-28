import { layerOf, type Plant } from '../data/plants'
import { sideStructure, topStructure, type Leaf } from '../lib/geometry'
import { shade, type PlantLook } from '../lib/season'

interface ArtProps {
  plant: Plant
  seed: string
  look: PlantLook
  snow: number
}

// Fronds scale toward their base as they fill in or die back.
function Fronds({ leaves, grow, fill, colors }: { leaves: Leaf[]; grow: number; fill: number; colors: string[] }) {
  if (!leaves.length || fill < 0.01) return null
  return (
    <g transform={`scale(${grow})`} opacity={fill}>
      {leaves.map((l, i) => (
        <g key={`lf${i}`}>
          <path d={l.fill} fill={colors[i % colors.length]} />
          <path d={l.rib} stroke={colors[(i + 1) % colors.length]} strokeWidth={l.w} fill="none" strokeLinecap="round" opacity={0.8} />
        </g>
      ))}
    </g>
  )
}

// Side-on illustration in feet, base at (0, 0).
export function SidePlant({ plant, seed, look, snow }: ArtProps) {
  const s = sideStructure(plant, seed)
  const dens = look.density
  const fill = Math.min(1, dens * 1.5)
  const grow = 0.35 + 0.65 * dens
  const dark = shade(look.leaf, -0.28)
  const light = shade(look.leaf, 0.22)
  const nFlowers = Math.round(look.bloom * s.flowers.length)
  const nFruits = Math.round(look.fruit * s.fruits.length)
  const snowOnLeaves = snow * fill

  return (
    <g>
      {s.wood.map((w, i) => (
        <path key={`w${i}`} d={w.d} stroke={look.bark} strokeWidth={w.w} fill="none" strokeLinecap="round" />
      ))}

      {s.blades.map((b, i) => (
        <path key={`b${i}`} d={b.d} stroke={i % 3 ? look.leaf : dark} strokeWidth={b.w} fill="none" strokeLinecap="round" opacity={plant.shape === 'bulb' ? fill : Math.max(fill, 0.15)} />
      ))}

      <Fronds leaves={s.leaves} grow={grow} fill={fill} colors={[dark, look.leaf, light]} />

      {s.fronds.map((fr, i) => (
        <path key={`f${i}`} d={fr.d} stroke={i % 2 ? look.leaf : dark} strokeWidth={fr.w} fill="none" strokeLinecap="round" />
      ))}

      {fill > 0.01 && (
        <>
          <g opacity={fill}>
            {s.blobs.map((b, i) => (
              <circle key={`s${i}`} cx={b.x + b.r * 0.12} cy={b.y + b.r * 0.15} r={b.r * grow} fill={dark} />
            ))}
            {s.blobs.map((b, i) => (
              <circle key={`m${i}`} cx={b.x} cy={b.y} r={b.r * grow * 0.92} fill={look.leaf} />
            ))}
            {s.blobs.map((b, i) => (
              <circle key={`h${i}`} cx={b.x - b.r * 0.3} cy={b.y - b.r * 0.3} r={b.r * grow * 0.45} fill={light} opacity={0.45} />
            ))}
          </g>
          {s.strands.map((st, i) => (
            <path key={`st${i}`} d={st.d} stroke={i % 2 ? look.leaf : light} strokeWidth={st.w * grow} fill="none" strokeLinecap="round" opacity={fill} />
          ))}
          {snowOnLeaves > 0.02 &&
            s.blobs.map((b, i) => (
              <ellipse key={`sn${i}`} cx={b.x} cy={b.y - b.r * 0.55} rx={b.r * 0.75} ry={b.r * 0.3} fill="#ffffff" opacity={snowOnLeaves * 0.9} />
            ))}
        </>
      )}

      {s.fruits.slice(0, nFruits).map((d, i) => (
        <circle key={`fr${i}`} cx={d.x} cy={d.y} r={s.dotR * 0.7} fill={look.fruitColor} />
      ))}
      {s.flowers.slice(0, nFlowers).map((d, i) => (
        <circle key={`fl${i}`} cx={d.x} cy={d.y} r={s.dotR} fill={look.bloomColor} stroke={shade(look.bloomColor, -0.2)} strokeWidth={s.dotR * 0.2} />
      ))}
    </g>
  )
}

// Bird's-eye illustration in feet, centered at (0, 0).
export function TopPlant({ plant, seed, look, snow, canopyOpacity = 1 }: ArtProps & { canopyOpacity?: number }) {
  const t = topStructure(plant, seed)
  const R = plant.spreadFt / 2
  const fill = Math.min(1, look.density * 1.5)
  const grow = 0.4 + 0.6 * look.density
  const dark = shade(look.leaf, -0.28)
  const light = shade(look.leaf, 0.22)
  const nFlowers = Math.round(look.bloom * t.flowers.length)
  const nFruits = Math.round(look.fruit * t.fruits.length)
  const casts = layerOf(plant) === 'mid' || layerOf(plant) === 'tall'

  const dormant = plant.type === 'bulb' && fill < 0.05 && look.bloom < 0.05

  return (
    <g opacity={canopyOpacity}>
      {dormant && <circle r={R * 0.85} className="dormant-ring" />}
      <Fronds leaves={t.leaves} grow={grow} fill={fill} colors={[dark, look.leaf, light]} />
      {casts && <circle cx={R * 0.18} cy={R * 0.18} r={R * (0.5 + 0.45 * fill)} fill="#000" opacity={0.12} />}
      {t.wood.map((w, i) => (
        <path key={`w${i}`} d={w.d} stroke={look.bark} strokeWidth={w.w} fill="none" strokeLinecap="round" />
      ))}
      <g opacity={fill}>
        {t.blobs.map((b, i) => (
          <circle key={`s${i}`} cx={b.x + b.r * 0.1} cy={b.y + b.r * 0.12} r={b.r * grow} fill={dark} />
        ))}
        {t.blobs.map((b, i) => (
          <circle key={`m${i}`} cx={b.x} cy={b.y} r={b.r * grow * 0.9} fill={look.leaf} />
        ))}
        {t.blobs.map((b, i) => (
          <circle key={`h${i}`} cx={b.x - b.r * 0.25} cy={b.y - b.r * 0.25} r={b.r * grow * 0.4} fill={light} opacity={0.4} />
        ))}
        {snow > 0.02 && t.blobs.map((b, i) => <circle key={`sn${i}`} cx={b.x - b.r * 0.15} cy={b.y - b.r * 0.15} r={b.r * 0.55} fill="#fff" opacity={snow * 0.75} />)}
      </g>
      {t.fruits.slice(0, nFruits).map((d, i) => (
        <circle key={`fr${i}`} cx={d.x} cy={d.y} r={t.dotR * 0.7} fill={look.fruitColor} />
      ))}
      {t.flowers.slice(0, nFlowers).map((d, i) => (
        <circle key={`fl${i}`} cx={d.x} cy={d.y} r={t.dotR} fill={look.bloomColor} stroke={shade(look.bloomColor, -0.2)} strokeWidth={t.dotR * 0.2} />
      ))}
    </g>
  )
}
