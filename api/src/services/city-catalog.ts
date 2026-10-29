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
}

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
    minCost: costs.length ? Math.min(...costs) : 0,
    tags: uniqueTags(experiences),
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
    }))
    return { ...staticSummary(city), experiences }
  })
}
