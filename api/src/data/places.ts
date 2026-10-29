import type { ActivityCategory } from '../domain.ts'
import {
  CITY_CATALOG,
  catalogGooglePlaceId,
  findCatalogCity,
  normalizeCity,
} from './city-catalog.ts'

// AI anahtarı olmadan da çalışan yerleşik şehir kataloğu.
// Katalog artık 10 şehir ve her şehirde 10 deneyim içeriyor; API tarafında ayrıca
// CityExperience tablosuna seed edilir. Google Places geldiğinde bu kaynak offline fallback olur.
export type PlaceCandidate = {
  googlePlaceId: string
  name: string
  city: string
  lat: number
  lng: number
  address: string
  rating: number
  types: string[]
  category: ActivityCategory
  estimatedCost: number
  durationHours: number
  neighborhood: string
  description: string
  tags: string[]
  currency: string
  bookingUrl: string | null
}

const PLACES: PlaceCandidate[] = CITY_CATALOG.flatMap((city) =>
  city.experiences.map((experience) => ({
    googlePlaceId: catalogGooglePlaceId(city.slug, experience.slug),
    name: experience.name,
    city: city.slug,
    lat: 0,
    lng: 0,
    address: experience.address,
    rating: experience.rating,
    types: [experience.category, ...experience.tags],
    category: experience.category,
    estimatedCost: experience.estimatedCost,
    durationHours: experience.durationMinutes / 60,
    neighborhood: experience.neighborhood,
    description: experience.description,
    tags: experience.tags,
    currency: experience.currency,
    bookingUrl: experience.bookingUrl,
  })),
)

export function findCandidates(destination: string): PlaceCandidate[] {
  const city = findCatalogCity(destination)
  if (!city) return []
  return PLACES.filter((place) => place.city === city.slug)
}

export function searchCatalog(query: string, destination?: string): PlaceCandidate[] {
  const needle = normalizeCity(query)
  const pool = destination ? findCandidates(destination) : PLACES
  if (!needle) return pool.slice(0, 12)
  return pool
    .filter((place) =>
      normalizeCity(`${place.name} ${place.address} ${place.city} ${place.tags.join(' ')}`).includes(
        needle,
      ),
    )
    .slice(0, 20)
}

export function cityLabel(destination: string): string {
  const city = findCatalogCity(destination)
  return city?.name ?? destination
}

export function allPlaceCandidates(): PlaceCandidate[] {
  return PLACES
}
