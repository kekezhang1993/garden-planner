import data from './plantPhotos.json'

export interface PlantPhoto {
  medium: string
  square: string
  attribution: string
  license: string
}

export interface PlantPhotos {
  taxonId: number
  taxonName: string
  exact: boolean // false when only a related species/genus was found
  photos: PlantPhoto[]
}

const PHOTOS = data as Record<string, PlantPhotos>

export const photosFor = (plantId: string): PlantPhotos | undefined => PHOTOS[plantId]

export const taxonUrl = (p: PlantPhotos) => `https://www.inaturalist.org/taxa/${p.taxonId}`
