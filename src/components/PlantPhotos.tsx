import { useState } from 'react'
import type { Plant } from '../data/plants'
import { photosFor, taxonUrl } from '../data/photos'
import { PlantThumb } from './PlantLibrary'

// Square photo for the plant list; falls back to the drawing if there's no photo or it fails to load.
export function PhotoThumb({ plant, season, size = 60 }: { plant: Plant; season: number; size?: number }) {
  const [failed, setFailed] = useState(false)
  const photo = photosFor(plant.id)?.photos[0]
  if (!photo || failed) return <PlantThumb plant={plant} season={season} size={size} />
  return (
    <img
      className="photo-thumb"
      src={photo.square}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  )
}

const licenseLabel = (code: string) => (code === 'pd' ? 'Public domain' : code.toUpperCase().replace(/^CC-/, 'CC '))

// Creative Commons deed for the license, so the credit links to its terms.
const licenseUrl = (code: string) =>
  code === 'cc0'
    ? 'https://creativecommons.org/publicdomain/zero/1.0/'
    : code === 'pd'
      ? 'https://creativecommons.org/publicdomain/mark/1.0/'
      : `https://creativecommons.org/licenses/${code.replace(/^cc-/, '')}/4.0/`

// The original photo's page on iNaturalist, from its image URL (.../photos/<id>/medium.jpg).
const photoPage = (url: string) => {
  const id = url.match(/\/photos\/(\d+)\//)?.[1]
  return id ? `https://www.inaturalist.org/photos/${id}` : null
}

export function PhotoGallery({ plant }: { plant: Plant }) {
  const info = photosFor(plant.id)
  const [index, setIndex] = useState(0)
  if (!info) return null
  const photo = info.photos[Math.min(index, info.photos.length - 1)]
  const cultivar = plant.latin.match(/'([^']+)'/)?.[1] ?? plant.name.match(/'([^']+)'/)?.[1]

  return (
    <figure className="gallery">
      <img key={photo.medium} src={photo.medium} alt={`${plant.name} photo`} className="gallery-main" />
      {info.photos.length > 1 && (
        <div className="gallery-strip">
          {info.photos.map((ph, i) => (
            <button key={ph.square} className={i === index ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`Photo ${i + 1}`}>
              <img src={ph.square} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <figcaption>
        {!info.exact && <span className="warn">Shows {info.taxonName}, a close relative. </span>}
        {info.exact && cultivar && <span>Shows the species; '{cultivar}' may differ in color or size. </span>}
        <span className="credit">
          {photoPage(photo.medium) ? (
            <a href={photoPage(photo.medium)!} target="_blank" rel="noreferrer">
              Photo
            </a>
          ) : (
            'Photo'
          )}{' '}
          {photo.attribution.replace(/, uploaded by .*$/, '')} ·{' '}
          <a href={licenseUrl(photo.license)} target="_blank" rel="noreferrer">
            {licenseLabel(photo.license)}
          </a>{' '}
          · via{' '}
          <a href={taxonUrl(info)} target="_blank" rel="noreferrer">
            iNaturalist
          </a>
        </span>
      </figcaption>
    </figure>
  )
}
