// Plant library. Seasonal arrays are always [spring, summer, autumn, winter].

export type Quad<T> = [T, T, T, T]

// What kind of plant it is. Height layers are worked out from heightFt (see layerOf).
export type PlantType = 'tree' | 'shrub' | 'perennial' | 'annual' | 'groundcover' | 'vine' | 'grass' | 'fern' | 'bulb'
export type Layer = 'ground' | 'low' | 'mid' | 'tall'
export type Sun = 'full' | 'part' | 'shade'
export type Shape =
  | 'mat'
  | 'grass'
  | 'mound'
  | 'round'
  | 'upright'
  | 'vase'
  | 'spreading'
  | 'conical'
  | 'columnar'
  | 'weeping'
  | 'palm'
  | 'fern'
  | 'bulb'

export interface Plant {
  id: string
  name: string
  latin: string
  taxon?: string // iNaturalist name to use for photos when it differs from the species in `latin`
  type: PlantType
  edible?: boolean
  shape: Shape
  heightFt: number
  spreadFt: number
  zones: [number, number]
  sun: Sun[]
  water: 'low' | 'medium' | 'high'
  evergreen: boolean
  leaf: Quad<string>
  density: Quad<number>
  bloom?: { color: string; amount: Quad<number>; size?: number } // size: flower radius in ft
  fruit?: { color: string; amount: Quad<number> }
  bark?: string
  notes: string
}

export const LAYERS: { id: Layer; label: string; hint: string }[] = [
  { id: 'ground', label: 'Ground', hint: 'under 2 ft' },
  { id: 'low', label: 'Low', hint: '2–6 ft' },
  { id: 'mid', label: 'Mid', hint: '6–15 ft' },
  { id: 'tall', label: 'Tall', hint: '15 ft +' },
]

export function layerOf(plant: Plant): Layer {
  const h = plant.heightFt
  return h < 2 ? 'ground' : h <= 6 ? 'low' : h < 15 ? 'mid' : 'tall'
}

export const PLANT_TYPES: { id: PlantType; label: string; single: string }[] = [
  { id: 'tree', label: 'Trees', single: 'Tree' },
  { id: 'shrub', label: 'Shrubs', single: 'Shrub' },
  { id: 'perennial', label: 'Perennials', single: 'Perennial' },
  { id: 'annual', label: 'Annuals', single: 'Annual' },
  { id: 'groundcover', label: 'Groundcovers', single: 'Groundcover' },
  { id: 'vine', label: 'Vines', single: 'Vine' },
  { id: 'grass', label: 'Grasses', single: 'Grass' },
  { id: 'fern', label: 'Ferns', single: 'Fern' },
  { id: 'bulb', label: 'Bulbs', single: 'Bulb' },
]

// Woody plants keep a visible branch structure when bare.
export const isWoody = (plant: Plant) => plant.type === 'tree' || plant.type === 'shrub'

// Deciduous foliage: leaves fill in through spring, color in autumn, bare in winter.
const dec = (
  spring: string,
  summer: string,
  autumn: string,
  density: Quad<number> = [0.75, 1, 0.75, 0],
) => ({ evergreen: false, leaf: [spring, summer, autumn, autumn] as Quad<string>, density })

const ever = (color: string, winter = color, springTint = color) => ({
  evergreen: true,
  leaf: [springTint, color, color, winter] as Quad<string>,
  density: [1, 1, 1, 0.95] as Quad<number>,
})

const bloom = (color: string, amount: Quad<number>, size?: number) => ({ bloom: { color, amount, size } })
const fruit = (color: string, amount: Quad<number>) => ({ fruit: { color, amount } })

type Base = Omit<Plant, 'leaf' | 'density' | 'evergreen'>

const p = (base: Base, foliage: ReturnType<typeof dec>, extra: Partial<Plant> = {}): Plant => ({
  ...base,
  ...foliage,
  ...extra,
})

export const PLANTS: Plant[] = [
  // ---------- Ground cover ----------
  p(
    { id: 'creeping-thyme', name: 'Creeping Thyme', latin: 'Thymus serpyllum', type: 'groundcover', edible: true, shape: 'mat', heightFt: 0.3, spreadFt: 1.5, zones: [4, 9], sun: ['full'], water: 'low', notes: 'Fragrant, walkable between stepping stones. Bees love it.' },
    { ...ever('#6f9152', '#6d7a5a', '#7fa05a') },
    bloom('#b46ccc', [0.2, 1, 0.1, 0]),
  ),
  p(
    { id: 'creeping-phlox', name: 'Creeping Phlox', latin: 'Phlox subulata', type: 'groundcover', shape: 'mat', heightFt: 0.5, spreadFt: 2, zones: [3, 9], sun: ['full', 'part'], water: 'low', notes: 'A carpet of pink in spring; great on slopes and walls.' },
    ever('#5f8a43', '#6b7d50'),
    bloom('#e57fbd', [1, 0.1, 0, 0]),
  ),
  p(
    { id: 'sweet-woodruff', name: 'Sweet Woodruff', latin: 'Galium odoratum', type: 'groundcover', shape: 'mat', heightFt: 0.7, spreadFt: 1.5, zones: [4, 8], sun: ['part', 'shade'], water: 'medium', notes: 'Starry white flowers for dry shade under trees.' },
    dec('#8cc45a', '#4f8f3a', '#7e8f45', [0.8, 1, 0.6, 0.1]),
    bloom('#ffffff', [1, 0.1, 0, 0]),
  ),
  p(
    { id: 'ajuga', name: "Bugleweed 'Bronze Beauty'", latin: 'Ajuga reptans', type: 'groundcover', shape: 'mat', heightFt: 0.5, spreadFt: 2, zones: [3, 9], sun: ['part', 'shade'], water: 'medium', notes: 'Bronze-purple leaves with blue flower spikes.' },
    ever('#6b4e4a', '#5e4440', '#7a5a50'),
    bloom('#5b6cd6', [1, 0.15, 0, 0]),
  ),
  p(
    { id: 'pachysandra', name: 'Japanese Spurge', latin: 'Pachysandra terminalis', type: 'groundcover', shape: 'mat', heightFt: 0.7, spreadFt: 2, zones: [4, 8], sun: ['part', 'shade'], water: 'medium', notes: 'Dependable evergreen carpet for deep shade.' },
    ever('#2f6a35', '#2c5a32'),
    bloom('#f4f1e1', [0.7, 0, 0, 0]),
  ),
  p(
    { id: 'lambs-ear', name: "Lamb's Ear", latin: 'Stachys byzantina', type: 'perennial', shape: 'mound', heightFt: 1, spreadFt: 2, zones: [4, 8], sun: ['full'], water: 'low', notes: 'Soft silver leaves that kids love to touch.' },
    dec('#b7c4b1', '#bccabb', '#a9b4a2', [0.8, 1, 0.9, 0.4]),
    bloom('#b98ad0', [0, 0.6, 0.1, 0]),
  ),
  p(
    { id: 'creeping-jenny', name: 'Golden Creeping Jenny', latin: "Lysimachia nummularia 'Aurea'", type: 'groundcover', shape: 'mat', heightFt: 0.25, spreadFt: 2, zones: [3, 8], sun: ['full', 'part'], water: 'high', notes: 'Bright chartreuse; spreads fast in moist soil.' },
    dec('#d4e04f', '#c3d443', '#b6b347', [0.8, 1, 0.8, 0.3]),
    bloom('#f2cf2a', [0, 0.5, 0, 0]),
  ),
  p(
    { id: 'hosta', name: "Hosta 'Francee'", latin: 'Hosta fortunei', taxon: 'Hosta', type: 'perennial', shape: 'mound', heightFt: 1.8, spreadFt: 3, zones: [3, 9], sun: ['part', 'shade'], water: 'medium', notes: 'Bold white-edged leaves; the classic shade plant.' },
    dec('#7aa95a', '#3f7a3a', '#c4b24a', [0.5, 1, 0.6, 0]),
    bloom('#c7b3e8', [0, 0.7, 0.1, 0]),
  ),
  p(
    { id: 'blue-fescue', name: 'Blue Fescue', latin: 'Festuca glauca', type: 'grass', shape: 'grass', heightFt: 1, spreadFt: 1, zones: [4, 8], sun: ['full'], water: 'low', notes: 'Tidy steel-blue tufts; good for edging.' },
    ever('#8fb0c0', '#93a8a8', '#9cbcc4'),
  ),
  p(
    { id: 'wild-strawberry', name: 'Wild Strawberry', latin: 'Fragaria virginiana', type: 'groundcover', edible: true, shape: 'mat', heightFt: 0.5, spreadFt: 1.5, zones: [4, 8], sun: ['full', 'part'], water: 'medium', notes: 'Native ground cover with tiny edible berries.' },
    dec('#7cb84e', '#4e8a3a', '#b0442f', [0.8, 1, 0.8, 0.3]),
    { ...bloom('#ffffff', [1, 0.1, 0, 0]), ...fruit('#d6283a', [0.1, 1, 0, 0]) },
  ),
  p(
    { id: 'bearberry', name: 'Bearberry (Kinnikinnick)', latin: 'Arctostaphylos uva-ursi', type: 'groundcover', shape: 'mat', heightFt: 0.5, spreadFt: 4, zones: [2, 6], sun: ['full', 'part'], water: 'low', notes: 'Tough cold-climate evergreen with red winter berries.' },
    ever('#3b6b38', '#6d4a3a'),
    { ...bloom('#f6d6dc', [0.8, 0, 0, 0]), ...fruit('#d02a2a', [0.2, 0.3, 1, 0.8]) },
  ),
  p(
    { id: 'ice-plant', name: 'Hardy Ice Plant', latin: 'Delosperma cooperi', type: 'groundcover', shape: 'mat', heightFt: 0.25, spreadFt: 2, zones: [6, 10], sun: ['full'], water: 'low', notes: 'Succulent mat with neon magenta daisies; loves heat.' },
    ever('#6d9a5c', '#7a7f5a'),
    bloom('#e0349a', [0.3, 1, 0.5, 0]),
  ),
  p(
    { id: 'liriope', name: 'Lilyturf', latin: 'Liriope muscari', type: 'groundcover', shape: 'grass', heightFt: 1.2, spreadFt: 1.5, zones: [6, 10], sun: ['part', 'shade'], water: 'medium', notes: 'Grassy evergreen edging with purple late-summer spikes.' },
    ever('#2f5e2e', '#4a5e36'),
    { ...bloom('#7a5bc4', [0, 0.6, 0.8, 0]), ...fruit('#1d1d2e', [0, 0, 0.3, 0.5]) },
  ),
  p(
    { id: 'mondo-grass', name: 'Mondo Grass', latin: 'Ophiopogon japonicus', type: 'groundcover', shape: 'grass', heightFt: 0.6, spreadFt: 1, zones: [7, 10], sun: ['part', 'shade'], water: 'medium', notes: 'Fine, dark grassy carpet for mild climates.' },
    ever('#24502a'),
  ),

  // ---------- Shrubs (2–6 ft) ----------
  p(
    { id: 'lavender', name: "Lavender 'Hidcote'", latin: 'Lavandula angustifolia', type: 'perennial', edible: true, shape: 'mound', heightFt: 1.8, spreadFt: 2, zones: [5, 9], sun: ['full'], water: 'low', notes: 'Fragrant purple spikes; needs sharp drainage.' },
    ever('#8fa38a', '#8a978a', '#93a88c'),
    bloom('#7b5fb8', [0.1, 1, 0.2, 0]),
  ),
  p(
    { id: 'boxwood', name: "Boxwood 'Green Velvet'", latin: 'Buxus', type: 'shrub', shape: 'round', heightFt: 3, spreadFt: 3, zones: [5, 8], sun: ['full', 'part'], water: 'medium', notes: 'Formal evergreen ball; great for hedges and structure.' },
    ever('#2f6a35', '#3f6236', '#5c8f3e'),
  ),
  p(
    { id: 'bigleaf-hydrangea', name: 'Bigleaf Hydrangea', latin: 'Hydrangea macrophylla', type: 'shrub', shape: 'round', heightFt: 4, spreadFt: 4, zones: [6, 9], sun: ['part'], water: 'high', notes: 'Huge mophead blooms; blue in acidic soil, pink in alkaline.' },
    dec('#86b85a', '#3f7a3a', '#9a8a4a'),
    bloom('#7d9be0', [0, 1, 0.5, 0.1]),
  ),
  p(
    { id: 'spirea', name: "Spirea 'Goldflame'", latin: 'Spiraea japonica', type: 'shrub', shape: 'mound', heightFt: 3, spreadFt: 3, zones: [4, 8], sun: ['full'], water: 'medium', notes: 'Leaves open orange-red, turn gold-green, then copper.' },
    dec('#e07a3a', '#a8b840', '#c4602e'),
    bloom('#e47ab0', [0, 1, 0.1, 0]),
  ),
  p(
    { id: 'azalea', name: 'Evergreen Azalea', latin: 'Rhododendron (Kurume hybrids)', type: 'shrub', shape: 'round', heightFt: 4, spreadFt: 4, zones: [6, 9], sun: ['part'], water: 'medium', notes: 'Covered in flowers in spring; likes acidic soil.' },
    ever('#3d6b35', '#5b4a35'),
    bloom('#e0347a', [1, 0.1, 0, 0]),
  ),
  p(
    { id: 'knockout-rose', name: "Rose 'Knock Out'", latin: 'Rosa', type: 'shrub', shape: 'round', heightFt: 4, spreadFt: 4, zones: [5, 11], sun: ['full'], water: 'medium', notes: 'Disease-resistant and blooms from late spring to frost.' },
    dec('#7a5a3a', '#3a6a35', '#5a6a35', [0.6, 1, 0.8, 0]),
    { ...bloom('#e02a55', [0.5, 1, 0.7, 0]), ...fruit('#d0502a', [0, 0, 0.3, 0.6]), bark: '#5a6a3a' },
  ),
  p(
    { id: 'blueberry', name: 'Highbush Blueberry', latin: 'Vaccinium corymbosum', type: 'shrub', edible: true, shape: 'round', heightFt: 5, spreadFt: 5, zones: [4, 8], sun: ['full', 'part'], water: 'medium', notes: 'Edible berries in summer and fiery red fall color.' },
    dec('#8cb85a', '#3f7a45', '#c0322b'),
    { ...bloom('#fbf4ec', [1, 0, 0, 0]), ...fruit('#3a4ea0', [0, 1, 0, 0]), bark: '#8a3a2a' },
  ),
  p(
    { id: 'russian-sage', name: 'Russian Sage', latin: 'Salvia yangii', type: 'perennial', shape: 'upright', heightFt: 3.5, spreadFt: 3, zones: [4, 9], sun: ['full'], water: 'low', notes: 'Airy silver stems with a haze of lavender-blue.' },
    dec('#9fb59a', '#a9bcb0', '#a4a894', [0.6, 1, 0.8, 0.2]),
    { ...bloom('#8a8ae0', [0, 1, 0.6, 0]), bark: '#b8bcb4' },
  ),
  p(
    { id: 'fothergilla', name: 'Dwarf Fothergilla', latin: 'Fothergilla gardenii', type: 'shrub', shape: 'round', heightFt: 3, spreadFt: 3, zones: [5, 8], sun: ['full', 'part'], water: 'medium', notes: 'Honey-scented bottlebrush flowers; spectacular fall color.' },
    dec('#8ab55a', '#3f6e45', '#e0702a'),
    bloom('#fbf8ee', [1, 0, 0, 0]),
  ),
  p(
    { id: 'winterberry', name: "Winterberry 'Red Sprite'", latin: 'Ilex verticillata', type: 'shrub', shape: 'round', heightFt: 4, spreadFt: 4, zones: [3, 9], sun: ['full', 'part'], water: 'high', notes: 'Bare stems loaded with red berries all winter (needs a male pollinator nearby).' },
    dec('#8ab55a', '#2f6a35', '#8a7a3a'),
    { ...fruit('#e0201f', [0, 0.2, 1, 1]), bark: '#4a3a32' },
  ),
  p(
    { id: 'feather-reed-grass', name: "Feather Reed Grass 'Karl Foerster'", latin: 'Calamagrostis × acutiflora', type: 'grass', shape: 'grass', heightFt: 5, spreadFt: 2, zones: [4, 9], sun: ['full'], water: 'medium', notes: 'Vertical plumes that stand tall through winter.' },
    dec('#8ac05a', '#5f8f3a', '#c8a85a', [0.6, 1, 1, 0.85]),
    { leaf: ['#8ac05a', '#5f8f3a', '#c8a85a', '#c9b07a'], ...bloom('#d8c08a', [0, 0.8, 0.9, 0.7]) },
  ),
  p(
    { id: 'rosemary', name: 'Rosemary', latin: 'Salvia rosmarinus', type: 'shrub', edible: true, shape: 'upright', heightFt: 4, spreadFt: 4, zones: [8, 11], sun: ['full'], water: 'low', notes: 'Evergreen culinary herb; blue flowers in winter and spring.' },
    ever('#4f6e55', '#4f6e55'),
    bloom('#8aa0e0', [0.7, 0.1, 0.2, 0.6]),
  ),
  p(
    { id: 'mugo-pine', name: 'Dwarf Mugo Pine', latin: 'Pinus mugo var. pumilio', type: 'shrub', shape: 'round', heightFt: 4, spreadFt: 6, zones: [2, 7], sun: ['full'], water: 'low', notes: 'Very cold-hardy evergreen mound.' },
    ever('#2c5a32', '#2c5032', '#6a9a4a'),
  ),

  // ---------- Tall shrubs (6–15 ft) ----------
  p(
    { id: 'lilac', name: 'Common Lilac', latin: 'Syringa vulgaris', type: 'shrub', shape: 'upright', heightFt: 10, spreadFt: 8, zones: [3, 7], sun: ['full'], water: 'medium', notes: 'Old-fashioned fragrance in late spring; loves cold winters.' },
    dec('#86b45a', '#3f6e40', '#6e7a40'),
    bloom('#b48ad6', [1, 0, 0, 0]),
  ),
  p(
    { id: 'forsythia', name: 'Forsythia', latin: 'Forsythia × intermedia', type: 'shrub', shape: 'vase', heightFt: 8, spreadFt: 8, zones: [5, 8], sun: ['full'], water: 'medium', notes: 'Bare branches burst into yellow at the very start of spring.' },
    dec('#a8c85a', '#4f8a3a', '#8a6a3a', [0.35, 1, 0.7, 0]),
    bloom('#f5d020', [1, 0, 0, 0.1]),
  ),
  p(
    { id: 'limelight-hydrangea', name: "Panicle Hydrangea 'Limelight'", latin: 'Hydrangea paniculata', type: 'shrub', shape: 'round', heightFt: 7, spreadFt: 7, zones: [3, 8], sun: ['full', 'part'], water: 'medium', notes: 'Lime-white cones in summer that age to pink in fall.' },
    dec('#8ab85a', '#3f7a3a', '#9a8a4a'),
    { bloom: { color: '#e8f0c8', amount: [0, 1, 0.9, 0.3] } },
  ),
  p(
    { id: 'doublefile-viburnum', name: 'Doublefile Viburnum', latin: 'Viburnum plicatum f. tomentosum', type: 'shrub', shape: 'spreading', heightFt: 9, spreadFt: 10, zones: [5, 8], sun: ['full', 'part'], water: 'medium', notes: 'Layered branches lined with white lacecaps; burgundy fall color.' },
    dec('#8ab85a', '#3a6e3a', '#7a2a3a'),
    { ...bloom('#ffffff', [1, 0, 0, 0]), ...fruit('#d02a2a', [0, 0.8, 0.2, 0]) },
  ),
  p(
    { id: 'arborvitae', name: "Arborvitae 'Emerald Green'", latin: "Thuja occidentalis 'Smaragd'", type: 'shrub', shape: 'columnar', heightFt: 12, spreadFt: 3.5, zones: [3, 7], sun: ['full', 'part'], water: 'medium', notes: 'Narrow evergreen column — the go-to privacy screen.' },
    ever('#2f6a35', '#4a6a3a', '#3f7a3a'),
  ),
  p(
    { id: 'smokebush', name: "Smoke Bush 'Royal Purple'", latin: 'Cotinus coggygria', type: 'shrub', shape: 'round', heightFt: 12, spreadFt: 10, zones: [5, 8], sun: ['full'], water: 'low', notes: 'Deep purple leaves and pink smoky plumes in summer.' },
    dec('#7a3a4e', '#5b2a3e', '#d0502a'),
    bloom('#e0b0c0', [0, 1, 0.3, 0]),
  ),
  p(
    { id: 'witch-hazel', name: "Witch Hazel 'Arnold Promise'", latin: 'Hamamelis × intermedia', type: 'shrub', shape: 'vase', heightFt: 15, spreadFt: 12, zones: [5, 8], sun: ['full', 'part'], water: 'medium', notes: 'Spidery yellow flowers on bare branches in late winter.' },
    dec('#8ab85a', '#3f6e40', '#e0b02a'),
    bloom('#f2c72a', [0.3, 0, 0, 0.9]),
  ),
  p(
    { id: 'camellia', name: 'Camellia', latin: 'Camellia japonica', type: 'shrub', shape: 'upright', heightFt: 10, spreadFt: 6, zones: [7, 9], sun: ['part'], water: 'medium', notes: 'Glossy evergreen with rose-like flowers in winter.' },
    ever('#24502a'),
    bloom('#d8284a', [0.6, 0, 0.1, 0.9]),
  ),
  p(
    { id: 'oleander', name: 'Oleander', latin: 'Nerium oleander', type: 'shrub', shape: 'round', heightFt: 10, spreadFt: 8, zones: [8, 10], sun: ['full'], water: 'low', notes: 'Heat- and drought-proof bloomer. All parts are toxic.' },
    ever('#3f6a3a'),
    bloom('#f08ab0', [0.4, 1, 0.6, 0]),
  ),
  p(
    { id: 'red-twig-dogwood', name: 'Red Twig Dogwood', latin: 'Cornus sericea', type: 'shrub', shape: 'upright', heightFt: 8, spreadFt: 9, zones: [3, 8], sun: ['full', 'part'], water: 'high', notes: 'Bright red stems glow against winter snow.' },
    dec('#8ab85a', '#3f7a40', '#8a2a4a'),
    { ...bloom('#f4f1e1', [0.6, 0.3, 0, 0]), ...fruit('#e8eef2', [0, 0.8, 0.4, 0]), bark: '#c0302a' },
  ),
  p(
    { id: 'rhododendron', name: 'Catawba Rhododendron', latin: 'Rhododendron catawbiense', type: 'shrub', shape: 'round', heightFt: 8, spreadFt: 8, zones: [4, 8], sun: ['part', 'shade'], water: 'medium', notes: 'Big evergreen leaves and trusses of lavender flowers.' },
    ever('#2f5e32', '#3a5432'),
    bloom('#a070c8', [1, 0.1, 0, 0]),
  ),

  // ---------- Trees ----------
  p(
    { id: 'japanese-maple', name: "Japanese Maple 'Bloodgood'", latin: 'Acer palmatum', type: 'tree', shape: 'spreading', heightFt: 18, spreadFt: 18, zones: [5, 8], sun: ['part', 'full'], water: 'medium', notes: 'Burgundy lace all summer, brilliant crimson in fall.' },
    dec('#8a2a35', '#6a1e2a', '#d0242e'),
    { bark: '#4a3a3a' },
  ),
  p(
    { id: 'redbud', name: 'Eastern Redbud', latin: 'Cercis canadensis', type: 'tree', shape: 'spreading', heightFt: 25, spreadFt: 30, zones: [4, 9], sun: ['full', 'part'], water: 'medium', notes: 'Magenta blossoms cover bare branches in early spring.' },
    dec('#8ab85a', '#4a8040', '#e0b830', [0.35, 1, 0.75, 0]),
    { ...bloom('#d0559e', [1, 0, 0, 0]), bark: '#3a3030' },
  ),
  p(
    { id: 'dogwood', name: 'Flowering Dogwood', latin: 'Cornus florida', type: 'tree', shape: 'spreading', heightFt: 25, spreadFt: 25, zones: [5, 9], sun: ['part'], water: 'medium', notes: 'White spring bracts, red fall leaves and berries.' },
    dec('#8ab85a', '#3f7a40', '#b02a3a'),
    { ...bloom('#fbf8f0', [1, 0, 0, 0]), ...fruit('#e0202a', [0, 0.2, 1, 0.2]), bark: '#5a4a42' },
  ),
  p(
    { id: 'saucer-magnolia', name: 'Saucer Magnolia', latin: 'Magnolia × soulangeana', type: 'tree', shape: 'round', heightFt: 25, spreadFt: 25, zones: [4, 9], sun: ['full', 'part'], water: 'medium', notes: 'Giant pink-and-white goblets before the leaves appear.' },
    dec('#8ab85a', '#3f7a3a', '#a08a4a', [0.3, 1, 0.7, 0]),
    { ...bloom('#f0b8d0', [1, 0, 0, 0.05]), bark: '#8a8a8a' },
  ),
  p(
    { id: 'southern-magnolia', name: 'Southern Magnolia', latin: 'Magnolia grandiflora', type: 'tree', shape: 'conical', heightFt: 60, spreadFt: 35, zones: [6, 10], sun: ['full', 'part'], water: 'medium', notes: 'Glossy evergreen giant with dinner-plate white flowers.' },
    ever('#24502a'),
    { ...bloom('#fdfbf2', [0.2, 1, 0.1, 0]), bark: '#6a6a60' },
  ),
  p(
    { id: 'sugar-maple', name: 'Sugar Maple', latin: 'Acer saccharum', type: 'tree', shape: 'round', heightFt: 65, spreadFt: 45, zones: [3, 8], sun: ['full', 'part'], water: 'medium', notes: 'Big shade tree famous for blazing orange fall color.' },
    dec('#9ac45a', '#3f7a3a', '#f07a1a'),
    { bark: '#5a4a40' },
  ),
  p(
    { id: 'serviceberry', name: "Serviceberry 'Autumn Brilliance'", latin: 'Amelanchier × grandiflora', type: 'tree', edible: true, shape: 'vase', heightFt: 20, spreadFt: 15, zones: [3, 8], sun: ['full', 'part'], water: 'medium', notes: 'Four-season tree: white flowers, edible berries, red fall color, silver bark.' },
    dec('#8ab060', '#3f7a40', '#e0502a', [0.45, 1, 0.8, 0]),
    { ...bloom('#ffffff', [1, 0, 0, 0]), ...fruit('#4a2a5a', [0, 1, 0, 0]), bark: '#9a9a96' },
  ),
  p(
    { id: 'crape-myrtle', name: 'Crape Myrtle', latin: 'Lagerstroemia indica', type: 'tree', shape: 'vase', heightFt: 20, spreadFt: 15, zones: [7, 10], sun: ['full'], water: 'low', notes: 'Months of summer flowers and smooth, peeling tan bark.' },
    dec('#a87a4a', '#3f7a3a', '#e0702a', [0.6, 1, 0.8, 0]),
    { ...bloom('#e83a7a', [0, 1, 0.4, 0]), bark: '#b89a7a' },
  ),
  p(
    { id: 'paper-birch', name: 'Paper Birch', latin: 'Betula papyrifera', type: 'tree', shape: 'upright', heightFt: 50, spreadFt: 30, zones: [2, 7], sun: ['full'], water: 'medium', notes: 'Chalk-white bark that shines in winter.' },
    dec('#a8cc60', '#4f8a3a', '#f0c830'),
    { bark: '#ece9e1' },
  ),
  p(
    { id: 'blue-spruce', name: 'Colorado Blue Spruce', latin: 'Picea pungens', type: 'tree', shape: 'conical', heightFt: 50, spreadFt: 20, zones: [2, 7], sun: ['full'], water: 'medium', notes: 'Silvery-blue evergreen pyramid for cold climates.' },
    ever('#7d9bb3', '#7a96aa', '#8fb0c4'),
    { bark: '#5a4a40' },
  ),
  p(
    { id: 'weeping-willow', name: 'Weeping Willow', latin: 'Salix babylonica', type: 'tree', shape: 'weeping', heightFt: 40, spreadFt: 40, zones: [6, 8], sun: ['full'], water: 'high', notes: 'Graceful curtains of foliage; best near water and far from pipes.' },
    dec('#c8dc6a', '#7aa84a', '#d8c84a', [0.7, 1, 0.8, 0]),
    { bark: '#8a7a3a' },
  ),
  p(
    { id: 'kwanzan-cherry', name: "Flowering Cherry 'Kwanzan'", latin: 'Prunus serrulata', type: 'tree', shape: 'vase', heightFt: 25, spreadFt: 25, zones: [5, 9], sun: ['full'], water: 'medium', notes: 'Clouds of double pink blossoms in spring.' },
    dec('#a86a4a', '#3f7a3a', '#d8702a', [0.4, 1, 0.8, 0]),
    { ...bloom('#f5a8c8', [1, 0, 0, 0]), bark: '#6a3a32' },
  ),
  p(
    { id: 'ginkgo', name: 'Ginkgo', latin: 'Ginkgo biloba', type: 'tree', shape: 'upright', heightFt: 50, spreadFt: 30, zones: [3, 8], sun: ['full'], water: 'medium', notes: 'Fan-shaped leaves turn pure gold all at once in fall.' },
    dec('#9ac45a', '#4f8a3a', '#f2c230'),
    { bark: '#6a5a4a' },
  ),
  p(
    { id: 'crabapple', name: "Crabapple 'Prairifire'", latin: 'Malus', type: 'tree', shape: 'round', heightFt: 20, spreadFt: 20, zones: [4, 8], sun: ['full'], water: 'medium', notes: 'Red-pink blossoms, purple-tinged leaves, and winter fruit for birds.' },
    dec('#7a3a3a', '#4a5a35', '#a0502a'),
    { ...bloom('#e0306a', [1, 0, 0, 0]), ...fruit('#a01a2a', [0, 0.4, 1, 0.8]), bark: '#4a3a32' },
  ),
  p(
    { id: 'olive', name: 'Olive', latin: 'Olea europaea', type: 'tree', edible: true, shape: 'round', heightFt: 20, spreadFt: 20, zones: [8, 11], sun: ['full'], water: 'low', notes: 'Silvery evergreen with gnarled trunk; Mediterranean classic.' },
    ever('#8a9a7a'),
    { ...fruit('#3a3a2a', [0, 0.3, 1, 0.4]), bark: '#7a7468' },
  ),
  p(
    { id: 'live-oak', name: 'Southern Live Oak', latin: 'Quercus virginiana', type: 'tree', shape: 'spreading', heightFt: 50, spreadFt: 70, zones: [8, 11], sun: ['full'], water: 'medium', notes: 'Massive, wide evergreen canopy for warm climates.' },
    ever('#3a5a32', '#3a5a32', '#6a8a42'),
    { bark: '#4a4440' },
  ),
  p(
    { id: 'italian-cypress', name: 'Italian Cypress', latin: 'Cupressus sempervirens', type: 'tree', shape: 'columnar', heightFt: 40, spreadFt: 5, zones: [7, 10], sun: ['full'], water: 'low', notes: 'Pencil-thin evergreen exclamation point.' },
    ever('#2c4a2e'),
  ),
  p(
    { id: 'windmill-palm', name: 'Windmill Palm', latin: 'Trachycarpus fortunei', type: 'tree', shape: 'palm', heightFt: 20, spreadFt: 8, zones: [7, 11], sun: ['full', 'part'], water: 'medium', notes: 'One of the most cold-tolerant palms.' },
    ever('#3f6a3a', '#4a6a3a'),
    { bark: '#5a4a3a' },
  ),
  // ---------- Perennials ----------
  p(
    { id: 'new-england-aster', name: 'New England Aster', latin: 'Symphyotrichum novae-angliae', type: 'perennial', shape: 'upright', heightFt: 4, spreadFt: 3, zones: [3, 8], sun: ['full', 'part'], water: 'medium', notes: 'Native. Clouds of purple daisies in fall that feed late bees and migrating monarchs.' },
    dec('#7aa04a', '#4f7a3a', '#7a7a3a', [0.4, 1, 0.8, 0]),
    bloom('#8a4ad0', [0, 0.2, 1, 0]),
  ),
  p(
    { id: 'aromatic-aster', name: "Aromatic Aster 'October Skies'", latin: "Symphyotrichum oblongifolium 'October Skies'", type: 'perennial', shape: 'mound', heightFt: 2, spreadFt: 2.5, zones: [3, 8], sun: ['full'], water: 'low', notes: 'Compact native aster smothered in sky-blue flowers in fall; tough in dry soil.' },
    dec('#7aa04a', '#5a7f45', '#7a7a3a', [0.4, 1, 0.85, 0]),
    bloom('#6a7ae0', [0, 0.1, 1, 0]),
  ),
  p(
    { id: 'coneflower', name: 'Purple Coneflower', latin: 'Echinacea purpurea', type: 'perennial', shape: 'upright', heightFt: 3, spreadFt: 2, zones: [3, 9], sun: ['full', 'part'], water: 'low', notes: 'Native, drought-tough summer bloomer; leave the seedheads for goldfinches.' },
    dec('#7aa04a', '#4f7a3a', '#6a6a3a', [0.4, 1, 0.6, 0.1]),
    { ...bloom('#d0609a', [0, 1, 0.4, 0]), ...fruit('#3a2a1a', [0, 0.2, 0.6, 0.5]) },
  ),
  p(
    { id: 'black-eyed-susan', name: "Black-eyed Susan 'Goldsturm'", latin: "Rudbeckia fulgida 'Goldsturm'", type: 'perennial', shape: 'mound', heightFt: 2.5, spreadFt: 2, zones: [3, 9], sun: ['full', 'part'], water: 'medium', notes: 'Golden daisies with dark centers from midsummer into fall.' },
    dec('#7aa04a', '#3f6e35', '#5a5a30', [0.4, 1, 0.7, 0.1]),
    { ...bloom('#f2b81a', [0, 1, 0.6, 0]), ...fruit('#2a1a10', [0, 0, 0.5, 0.5]) },
  ),
  p(
    { id: 'peony', name: 'Garden Peony', latin: 'Paeonia lactiflora', type: 'perennial', shape: 'mound', heightFt: 3, spreadFt: 3, zones: [3, 8], sun: ['full'], water: 'medium', notes: 'Huge fragrant late-spring blooms; plants can live for decades.' },
    dec('#8a5a4a', '#3f6e3a', '#a05a3a', [0.6, 1, 0.7, 0]),
    bloom('#f0a0b8', [0.9, 0.1, 0, 0]),
  ),
  p(
    { id: 'daylily', name: "Daylily 'Stella de Oro'", latin: "Hemerocallis 'Stella de Oro'", type: 'perennial', shape: 'grass', heightFt: 1.5, spreadFt: 2, zones: [3, 10], sun: ['full', 'part'], water: 'medium', notes: 'Reblooming golden trumpets all summer; nearly indestructible.' },
    dec('#7ab04a', '#4f8a3a', '#9a9a4a', [0.6, 1, 0.6, 0.05]),
    bloom('#f5c518', [0.3, 1, 0.5, 0]),
  ),
  p(
    { id: 'garden-phlox', name: 'Garden Phlox', latin: 'Phlox paniculata', type: 'perennial', shape: 'upright', heightFt: 3.5, spreadFt: 2.5, zones: [4, 8], sun: ['full', 'part'], water: 'medium', notes: 'Fragrant summer flower heads loved by butterflies.' },
    dec('#7aa04a', '#3f6e3a', '#6a6a3a', [0.4, 1, 0.6, 0]),
    bloom('#e070c0', [0, 1, 0.4, 0]),
  ),
  p(
    { id: 'autumn-joy-sedum', name: "Sedum 'Autumn Joy'", latin: "Hylotelephium 'Herbstfreude'", taxon: 'Hylotelephium spectabile', type: 'perennial', shape: 'mound', heightFt: 2, spreadFt: 2, zones: [3, 9], sun: ['full'], water: 'low', notes: 'Succulent leaves; flower heads go from green to pink to rust and stand through winter.' },
    dec('#8ab08a', '#7aa07a', '#8a7a5a', [0.6, 1, 0.8, 0.3]),
    bloom('#c0506a', [0, 0.5, 1, 0.4]),
  ),
  p(
    { id: 'catmint', name: "Catmint 'Walker's Low'", latin: 'Nepeta × faassenii', type: 'perennial', shape: 'mound', heightFt: 2.5, spreadFt: 3, zones: [4, 8], sun: ['full'], water: 'low', notes: 'Billowing lavender-blue flowers for months; deer and rabbits avoid it.' },
    dec('#9ab09a', '#8aa08a', '#8a9a7a', [0.6, 1, 0.7, 0]),
    bloom('#8a90e0', [0.6, 1, 0.6, 0]),
  ),
  p(
    { id: 'may-night-salvia', name: "Salvia 'May Night'", latin: 'Salvia nemorosa', type: 'perennial', shape: 'upright', heightFt: 1.5, spreadFt: 1.5, zones: [4, 8], sun: ['full'], water: 'low', notes: 'Deep violet spikes in late spring; cut back for a second flush.' },
    dec('#6a904a', '#4f7a3a', '#6a6a3a', [0.6, 1, 0.6, 0]),
    bloom('#5a3ab0', [0.7, 1, 0.3, 0]),
  ),
  p(
    { id: 'bee-balm', name: 'Bee Balm', latin: 'Monarda didyma', type: 'perennial', edible: true, shape: 'upright', heightFt: 3, spreadFt: 3, zones: [4, 9], sun: ['full', 'part'], water: 'medium', notes: 'Shaggy red flowers for hummingbirds; leaves make a minty tea.' },
    dec('#7aa04a', '#3f6e3a', '#6a5a3a', [0.4, 1, 0.5, 0]),
    bloom('#d02a3a', [0, 1, 0.2, 0]),
  ),
  p(
    { id: 'shasta-daisy', name: 'Shasta Daisy', latin: 'Leucanthemum × superbum', type: 'perennial', shape: 'mound', heightFt: 2.5, spreadFt: 2, zones: [5, 9], sun: ['full'], water: 'medium', notes: 'Classic white daisies through summer; great for cutting.' },
    dec('#6a9a4a', '#3f7a3a', '#5a6a3a', [0.6, 1, 0.6, 0.2]),
    bloom('#ffffff', [0.2, 1, 0.3, 0]),
  ),
  p(
    { id: 'astilbe', name: 'Astilbe', latin: 'Astilbe × arendsii', taxon: 'Astilbe', type: 'perennial', shape: 'mound', heightFt: 2, spreadFt: 2, zones: [4, 8], sun: ['part', 'shade'], water: 'high', notes: 'Feathery pink plumes that brighten moist shade in early summer.' },
    dec('#7a5a4a', '#3f6e3a', '#7a5a3a', [0.6, 1, 0.6, 0]),
    bloom('#e890b0', [0.2, 1, 0.2, 0]),
  ),
  p(
    { id: 'coral-bells', name: "Coral Bells 'Palace Purple'", latin: "Heuchera micrantha 'Palace Purple'", type: 'perennial', shape: 'mound', heightFt: 1.5, spreadFt: 1.5, zones: [4, 9], sun: ['part', 'shade'], water: 'medium', notes: 'Grown for its ruffled purple leaves, which last most of the year.' },
    ever('#6a3a4a', '#5a3a40', '#7a4a52'),
    bloom('#f4e8e8', [0.4, 0.6, 0, 0]),
  ),
  p(
    { id: 'bleeding-heart', name: 'Bleeding Heart', latin: 'Lamprocapnos spectabilis', type: 'perennial', shape: 'mound', heightFt: 2.5, spreadFt: 2.5, zones: [3, 9], sun: ['part', 'shade'], water: 'medium', notes: 'Arching stems of heart-shaped pink flowers in spring; goes dormant by midsummer.' },
    dec('#8ab06a', '#7a9a5a', '#8a8a5a', [0.9, 0.3, 0, 0]),
    bloom('#e05a8a', [1, 0.1, 0, 0]),
  ),

  // ---------- Ferns ----------
  p(
    { id: 'ostrich-fern', name: 'Ostrich Fern', latin: 'Matteuccia struthiopteris', type: 'fern', edible: true, shape: 'fern', heightFt: 4, spreadFt: 3, zones: [2, 7], sun: ['part', 'shade'], water: 'high', notes: 'Tall feathery vases; spring fiddleheads are edible only when properly cooked.' },
    dec('#a4d060', '#4f8a3a', '#b89a4a', [0.6, 1, 0.6, 0]),
  ),
  p(
    { id: 'christmas-fern', name: 'Christmas Fern', latin: 'Polystichum acrostichoides', type: 'fern', shape: 'fern', heightFt: 1.5, spreadFt: 2, zones: [3, 9], sun: ['part', 'shade'], water: 'medium', notes: 'Leathery evergreen fronds that stay green through winter.' },
    ever('#2f5e32', '#3a5a32', '#5a8a3e'),
  ),
  p(
    { id: 'painted-fern', name: "Japanese Painted Fern", latin: "Athyrium niponicum 'Pictum'", type: 'fern', shape: 'fern', heightFt: 1.5, spreadFt: 2, zones: [4, 8], sun: ['part', 'shade'], water: 'medium', notes: 'Silvery fronds with burgundy stems; lights up dark corners.' },
    dec('#b0a8b8', '#a8b0a8', '#9a9a7a', [0.7, 1, 0.6, 0]),
  ),
  p(
    { id: 'lady-fern', name: 'Lady Fern', latin: 'Athyrium filix-femina', type: 'fern', shape: 'fern', heightFt: 2.5, spreadFt: 2.5, zones: [4, 8], sun: ['part', 'shade'], water: 'medium', notes: 'Lacy, bright green, and easy in moist shade.' },
    dec('#a8d468', '#6aa448', '#b8a050', [0.6, 1, 0.6, 0]),
  ),
  p(
    { id: 'autumn-fern', name: 'Autumn Fern', latin: 'Dryopteris erythrosora', type: 'fern', shape: 'fern', heightFt: 2, spreadFt: 2, zones: [5, 9], sun: ['part', 'shade'], water: 'medium', notes: 'New fronds open coppery red, then turn glossy green.' },
    { evergreen: true, leaf: ['#c0602a', '#3f6e3a', '#5a6a3a', '#4a5a3a'] as Quad<string>, density: [0.9, 1, 1, 0.8] as Quad<number> },
  ),
  p(
    { id: 'maidenhair-fern', name: 'Northern Maidenhair Fern', latin: 'Adiantum pedatum', type: 'fern', shape: 'fern', heightFt: 1.5, spreadFt: 1.5, zones: [3, 8], sun: ['shade', 'part'], water: 'medium', notes: 'Delicate fan-shaped fronds on wiry black stems.' },
    dec('#a8d070', '#5a9a4a', '#c8b060', [0.6, 1, 0.6, 0]),
  ),
  p(
    { id: 'cinnamon-fern', name: 'Cinnamon Fern', latin: 'Osmundastrum cinnamomeum', type: 'fern', shape: 'fern', heightFt: 3.5, spreadFt: 3, zones: [3, 9], sun: ['part', 'shade'], water: 'high', notes: 'Cinnamon-colored fertile fronds in spring; golden in fall. Loves wet soil.' },
    dec('#9ac860', '#4f8a3a', '#d8a838', [0.7, 1, 0.8, 0]),
  ),
  p(
    { id: 'sword-fern', name: 'Western Sword Fern', latin: 'Polystichum munitum', type: 'fern', shape: 'fern', heightFt: 3, spreadFt: 3, zones: [5, 9], sun: ['part', 'shade'], water: 'medium', notes: 'Bold evergreen fern of Pacific Northwest forests.' },
    ever('#2c5a30', '#2f5530', '#5a8a3a'),
  ),

  // ---------- Bulbs (one placement = a drift of bulbs) ----------
  p(
    { id: 'snowdrop', name: 'Snowdrop', latin: 'Galanthus nivalis', type: 'bulb', shape: 'bulb', heightFt: 0.5, spreadFt: 1.5, zones: [3, 7], sun: ['full', 'part'], water: 'medium', notes: 'Nodding white bells in late winter, often through snow.' },
    dec('#6a9a5a', '#7a9a5a', '#7a9a5a', [0.5, 0, 0, 0.4]),
    bloom('#ffffff', [0.4, 0, 0, 0.8], 0.06),
  ),
  p(
    { id: 'crocus', name: 'Crocus', latin: 'Crocus vernus', type: 'bulb', shape: 'bulb', heightFt: 0.4, spreadFt: 1.5, zones: [3, 8], sun: ['full', 'part'], water: 'medium', notes: 'Among the first spring flowers; great naturalized in lawns.' },
    dec('#5a8a4a', '#6a8a4a', '#6a8a4a', [0.7, 0, 0, 0.2]),
    bloom('#8a5ad0', [0.8, 0, 0, 0.4], 0.08),
  ),
  p(
    { id: 'daffodil', name: 'Daffodil', latin: 'Narcissus (hybrids)', taxon: 'Narcissus', type: 'bulb', shape: 'bulb', heightFt: 1.5, spreadFt: 1.5, zones: [3, 8], sun: ['full', 'part'], water: 'medium', notes: 'Cheerful yellow trumpets; deer and squirrels leave them alone.' },
    dec('#5f9a4a', '#8a9a4a', '#8a8a4a', [1, 0.3, 0, 0.1]),
    bloom('#f5d020', [1, 0, 0, 0.1], 0.13),
  ),
  p(
    { id: 'tulip', name: 'Tulip', latin: 'Tulipa (Darwin hybrids)', taxon: 'Tulipa', type: 'bulb', shape: 'bulb', heightFt: 2, spreadFt: 1.5, zones: [3, 8], sun: ['full'], water: 'medium', notes: 'Classic spring cups. In warm zones they are usually replanted each fall.' },
    dec('#6a9a6a', '#8a9a5a', '#8a8a5a', [1, 0.2, 0, 0]),
    bloom('#e0303a', [1, 0, 0, 0], 0.14),
  ),
  p(
    { id: 'grape-hyacinth', name: 'Grape Hyacinth', latin: 'Muscari armeniacum', type: 'bulb', shape: 'bulb', heightFt: 0.6, spreadFt: 1, zones: [4, 8], sun: ['full', 'part'], water: 'medium', notes: 'Little cobalt spikes; lovely as a river under tulips.' },
    dec('#5a8a4a', '#7a8a4a', '#6a8a4a', [1, 0.1, 0.4, 0.2]),
    bloom('#4a5ad0', [1, 0, 0, 0], 0.07),
  ),
  p(
    { id: 'allium', name: "Allium 'Globemaster'", latin: "Allium 'Globemaster'", taxon: 'Allium giganteum', type: 'bulb', shape: 'bulb', heightFt: 3, spreadFt: 1.5, zones: [5, 8], sun: ['full'], water: 'low', notes: 'Purple globes the size of softballs float above other plants.' },
    dec('#6a9a5a', '#8a9a5a', '#8a8a5a', [0.9, 0.4, 0, 0]),
    bloom('#9a70d8', [0.7, 0.6, 0, 0], 0.3),
  ),
  p(
    { id: 'asiatic-lily', name: 'Asiatic Lily', latin: 'Lilium (Asiatic hybrids)', taxon: 'Lilium', type: 'bulb', shape: 'bulb', heightFt: 3, spreadFt: 1.5, zones: [3, 9], sun: ['full', 'part'], water: 'medium', notes: 'Upward-facing summer blooms. Toxic to cats.' },
    dec('#6aa04a', '#4f8a3a', '#9a8a4a', [0.5, 1, 0.3, 0]),
    bloom('#f08a2a', [0, 1, 0, 0], 0.18),
  ),
  p(
    { id: 'dahlia', name: 'Dahlia', latin: 'Dahlia (hybrids)', taxon: 'Dahlia', type: 'bulb', shape: 'bulb', heightFt: 4, spreadFt: 2, zones: [8, 11], sun: ['full'], water: 'medium', notes: 'Summer-to-frost blooms. In zones below 8, dig the tubers up and store them for winter.' },
    dec('#6aa04a', '#3f7a3a', '#5a6a3a', [0.2, 1, 0.8, 0]),
    bloom('#d0306a', [0, 1, 0.8, 0], 0.25),
  ),
  p(
    { id: 'autumn-crocus', name: 'Autumn Crocus', latin: 'Colchicum autumnale', type: 'bulb', shape: 'bulb', heightFt: 0.5, spreadFt: 1, zones: [4, 9], sun: ['full', 'part'], water: 'medium', notes: 'Leaves in spring, then bare pink flowers pop up in fall. All parts are toxic.' },
    dec('#6a9a4a', '#8a9a4a', '#6a8a4a', [1, 0, 0, 0]),
    bloom('#d890d0', [0, 0, 1, 0], 0.1),
  ),
]

export const PLANT_BY_ID: Record<string, Plant> = Object.fromEntries(PLANTS.map((pl) => [pl.id, pl]))
