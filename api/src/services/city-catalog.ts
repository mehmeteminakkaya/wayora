import { CITY_CATALOG, catalogGooglePlaceId } from '../data/city-catalog.ts'
import type { CatalogCity } from '../data/city-catalog.ts'
import type { Db } from '../lib/prisma.ts'

type SeededExperience = {
  id: string
  slug: string
  googlePlaceId: string
  name: string
  category: string
  neighborhood: string | null
  address: string | null
  rating: number | null
  durationMinutes: number
  estimatedCost: unknown
  currency: string
  priceNote: string | null
  description: string
  tags: string[]
  openingHours: string | null
  bookingUrl: string | null
}

export type CitySummary = {
  slug: string
  name: string
  country: string
  summary: string
  bestSeason: string | null
  currency: string
  experienceCount: number
  averageCost: number
  averageDailyCost: number
  minCost: number
  tags: string[]
}

export type CityExperienceResponse = {
  id: string
  slug: string
  googlePlaceId: string
  name: string
  category: string
  neighborhood: string | null
  address: string | null
  rating: number | null
  durationMinutes: number
  estimatedCost: number
  currency: string
  priceNote: string | null
  description: string
  tags: string[]
  openingHours: string | null
  bookingUrl: string | null
  lat: number | null
  lng: number | null
}

export type CityExperienceSearchResult = CityExperienceResponse & {
  citySlug: string
  cityName: string
}

export type CitySearchResponse = {
  cities: CitySummary[]
  experiences: CityExperienceSearchResult[]
}

const CITY_SEARCH_LIMIT = 6
const EXPERIENCE_SEARCH_LIMIT = 8

const aliasesBySlug = new Map(CITY_CATALOG.map((city) => [city.slug, city.aliases]))

function numberValue(value: unknown): number {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'toNumber' in value) {
    return Number((value as { toNumber: () => number }).toNumber())
  }
  return Number(value ?? 0)
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function uniqueTags(experiences: Array<{ tags: string[] }>): string[] {
  return [...new Set(experiences.flatMap((experience) => experience.tags))].slice(0, 8)
}

export function summarizeCity(
  city: { slug: string; name: string; country: string; summary: string; bestSeason: string | null; currency: string },
  experiences: Array<{ estimatedCost: unknown; tags: string[] }>,
): CitySummary {
  const costs = experiences.map((experience) => numberValue(experience.estimatedCost))
  const averageCost = costs.length
    ? roundMoney(costs.reduce((sum, cost) => sum + cost, 0) / costs.length)
    : 0
  return {
    slug: city.slug,
    name: city.name,
    country: city.country,
    summary: city.summary,
    bestSeason: city.bestSeason,
    currency: city.currency,
    experienceCount: experiences.length,
    averageCost,
    // Günlük plan varsayımı: günde üç ana deneyim.
    averageDailyCost: roundMoney(averageCost * 3),
    minCost: costs.length ? Math.min(...costs) : 0,
    tags: uniqueTags(experiences),
  }
}

// Koordinatlar veritabanında değil, statik katalogda tutulur.
const CATALOG_COORDS = new Map<string, { lat: number; lng: number }>()
for (const city of CITY_CATALOG) {
  for (const experience of city.experiences) {
    if (experience.lat !== undefined && experience.lng !== undefined) {
      CATALOG_COORDS.set(catalogGooglePlaceId(city.slug, experience.slug), {
        lat: experience.lat,
        lng: experience.lng,
      })
    }
  }
}

export function serializeExperience(experience: SeededExperience): CityExperienceResponse {
  return {
    id: experience.id,
    slug: experience.slug,
    googlePlaceId: experience.googlePlaceId,
    name: experience.name,
    category: experience.category,
    neighborhood: experience.neighborhood,
    address: experience.address,
    rating: experience.rating,
    durationMinutes: experience.durationMinutes,
    estimatedCost: numberValue(experience.estimatedCost),
    currency: experience.currency,
    priceNote: experience.priceNote,
    description: experience.description,
    tags: experience.tags,
    openingHours: experience.openingHours,
    bookingUrl: experience.bookingUrl,
    lat: CATALOG_COORDS.get(experience.googlePlaceId)?.lat ?? null,
    lng: CATALOG_COORDS.get(experience.googlePlaceId)?.lng ?? null,
  }
}

function staticSummary(city: CatalogCity): CitySummary {
  return summarizeCity({ ...city, currency: 'EUR' }, city.experiences)
}

/**
 * Katalog verisini idempotent biçimde veritabanına yazar.
 * Sunucu açılışında çağrılır; aynı kayıtlar tekrar tekrar oluşmaz.
 */
export async function seedCityCatalog(db: Db): Promise<void> {
  let cityCount = 0
  let experienceCount = 0

  for (const [cityIndex, city] of CITY_CATALOG.entries()) {
    const cityRecord = await db.city.upsert({
      where: { slug: city.slug },
      create: {
        slug: city.slug,
        name: city.name,
        country: city.country,
        summary: city.summary,
        bestSeason: city.bestSeason,
        currency: 'EUR',
        sortOrder: cityIndex,
      },
      update: {
        name: city.name,
        country: city.country,
        summary: city.summary,
        bestSeason: city.bestSeason,
        currency: 'EUR',
        sortOrder: cityIndex,
      },
    })
    cityCount += 1

    for (const [experienceIndex, experience] of city.experiences.entries()) {
      const googlePlaceId = catalogGooglePlaceId(city.slug, experience.slug)
      await db.cityExperience.upsert({
        where: { googlePlaceId },
        create: {
          cityId: cityRecord.id,
          slug: experience.slug,
          googlePlaceId,
          name: experience.name,
          category: experience.category,
          neighborhood: experience.neighborhood,
          address: experience.address,
          rating: experience.rating,
          durationMinutes: experience.durationMinutes,
          estimatedCost: experience.estimatedCost,
          currency: experience.currency,
          priceNote: experience.priceNote,
          description: experience.description,
          tags: experience.tags,
          openingHours: experience.openingHours,
          bookingUrl: experience.bookingUrl,
          sortOrder: experienceIndex,
        },
        update: {
          cityId: cityRecord.id,
          name: experience.name,
          category: experience.category,
          neighborhood: experience.neighborhood,
          address: experience.address,
          rating: experience.rating,
          durationMinutes: experience.durationMinutes,
          estimatedCost: experience.estimatedCost,
          currency: experience.currency,
          priceNote: experience.priceNote,
          description: experience.description,
          tags: experience.tags,
          openingHours: experience.openingHours,
          bookingUrl: experience.bookingUrl,
          sortOrder: experienceIndex,
        },
      })
      experienceCount += 1
    }
  }

  console.info(`[city-catalog] ${cityCount} şehir, ${experienceCount} deneyim veritabanına hazır.`)
}

/**
 * Veritabanı henüz seed edilmemişse veya geçici olarak erişilemezse
 * API'nin boş dönmemesi için statik katalogdan aynı cevabı üretir.
 */
export function staticCities(): Array<CitySummary & { experiences: CityExperienceResponse[] }> {
  return CITY_CATALOG.map((city) => {
    const experiences = city.experiences.map((experience) => ({
      id: catalogGooglePlaceId(city.slug, experience.slug),
      slug: experience.slug,
      googlePlaceId: catalogGooglePlaceId(city.slug, experience.slug),
      name: experience.name,
      category: experience.category,
      neighborhood: experience.neighborhood,
      address: experience.address,
      rating: experience.rating,
      durationMinutes: experience.durationMinutes,
      estimatedCost: experience.estimatedCost,
      currency: experience.currency,
      priceNote: experience.priceNote,
      description: experience.description,
      tags: experience.tags,
      openingHours: experience.openingHours,
      bookingUrl: experience.bookingUrl,
      lat: experience.lat ?? null,
      lng: experience.lng ?? null,
    }))
    return { ...staticSummary(city), experiences }
  })
}

/** "Müze" ile "muze" aramalarını eşleştirmek için metni sadeleştirir. */
function foldSearchText(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
}

// 4: tam ad eşleşmesi, 3: adın başlangıcı, 2: ad içinde, 1: açıklama/etiket içinde.
function matchScore(needle: string, primary: string[], secondary: string[]): number {
  let score = 0
  for (const value of primary) {
    const folded = foldSearchText(value)
    if (folded === needle) return 4
    if (folded.startsWith(needle)) score = Math.max(score, 3)
    else if (folded.includes(needle)) score = Math.max(score, 2)
  }
  for (const value of secondary) {
    if (foldSearchText(value).includes(needle)) score = Math.max(score, 1)
  }
  return score
}

function searchCatalogEntries(
  cities: Array<CitySummary & { experiences: CityExperienceResponse[] }>,
  query: string,
): CitySearchResponse {
  const needle = foldSearchText(query.trim())
  if (!needle) return { cities: [], experiences: [] }

  const cityResults: Array<{ score: number; city: CitySummary }> = []
  const experienceResults: Array<{ score: number; experience: CityExperienceSearchResult }> = []

  for (const city of cities) {
    const aliases = aliasesBySlug.get(city.slug) ?? []
    const cityScore = matchScore(needle, [city.name, ...aliases], [city.country])
    if (cityScore > 0) {
      const { experiences: _experiences, ...summary } = city
      cityResults.push({ score: cityScore, city: summary })
    }

    for (const experience of city.experiences) {
      const score = matchScore(
        needle,
        [experience.name],
        [
          experience.description,
          experience.neighborhood ?? '',
          experience.category,
          ...experience.tags,
        ],
      )
      if (score > 0) {
        experienceResults.push({
          score,
          experience: { citySlug: city.slug, cityName: city.name, ...experience },
        })
      }
    }
  }

  cityResults.sort((a, b) => b.score - a.score || a.city.name.localeCompare(b.city.name, 'tr'))
  experienceResults.sort(
    (a, b) => b.score - a.score || a.experience.name.localeCompare(b.experience.name, 'tr'),
  )

  return {
    cities: cityResults.slice(0, CITY_SEARCH_LIMIT).map((result) => result.city),
    experiences: experienceResults
      .slice(0, EXPERIENCE_SEARCH_LIMIT)
      .map((result) => result.experience),
  }
}

export function searchStaticCities(query: string): CitySearchResponse {
  return searchCatalogEntries(staticCities(), query)
}

/**
 * Şehir ve deneyim araması. Katalog 10 şehir × 10 deneyimlik sabit bir küme olduğu için
 * eşleştirme Türkçe katlama ile bellekte yapılır. DB boş veya erişilemezse statik katalog kullanılır.
 */
export async function searchCityCatalog(db: Db, query: string): Promise<CitySearchResponse> {
  if (!query.trim()) return { cities: [], experiences: [] }

  try {
    const cities = await db.city.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { experiences: { orderBy: { sortOrder: 'asc' } } },
    })
    if (cities.length > 0) {
      return searchCatalogEntries(
        cities.map((city) => ({
          ...summarizeCity(city, city.experiences),
          experiences: city.experiences.map(serializeExperience),
        })),
        query,
      )
    }
  } catch {
    // Şehir tabloları yoksa/erişilemezse statik kataloğa düş.
  }

  return searchStaticCities(query)
}
