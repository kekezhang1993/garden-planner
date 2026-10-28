export interface Placement {
  id: string
  plantId: string
  // Feet from the left edge (x) and from the back edge (y) of the garden area.
  x: number
  y: number
}

export type Edge = 'back' | 'left' | 'right' | 'front'

export interface Garden {
  name: string
  width: number
  depth: number
  placements: Placement[]
  // Compass bearing (degrees, 0 = north) you face when standing at the front edge looking toward the back.
  facing: number
  // Height in feet of a fence, wall or house along each edge (0 = open).
  walls: Record<Edge, number>
}

export type ViewMode = 'plan' | 'scene' | 'seasons'
