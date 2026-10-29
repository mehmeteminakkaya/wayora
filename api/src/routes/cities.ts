import { Router } from 'express'
import { z } from 'zod'
import { CITY_CATALOG } from '../data/city-catalog.ts'
import type { Db } from '../lib/prisma.ts'
import { parseOrThrow } from '../middleware/error.ts'
import {
  searchCityCatalog,
  serializeExperience,
  staticCities,
  summarizeCity,
} from '../services/city-catalog.ts'

const searchQuerySchema = z.object({
  q: z.string().trim().max(80, 'Arama en fazla 80 karakter olabilir').default(''),
})

function staticCityDetail(slug: string) {
  return staticCities().find((city) => city.slug === slug) ?? null
}

export function cityRouter({ db }: { db: Db }) {
  const router = Router()

  router.get('/', async (_req, res) => {
    try {
      const cities = await db.city.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { experiences: true },
      })
      if (cities.length === 0) {
        return res.json({
          cities: staticCities().map(({ experiences: _experiences, ...summary }) => summary),
        })
      }
      return res.json({
        cities: cities.map((city) => summarizeCity(city, city.experiences)),
      })
    } catch {
      return res.json({
        cities: staticCities().map(({ experiences: _experiences, ...summary }) => summary),
      })
    }
  })

  // "/:slug" tanımından önce gelmeli; aksi halde Express "search" yolunu şehir slug'ı sanır.
  router.get('/search', async (req, res) => {
    const { q } = parseOrThrow(searchQuerySchema, req.query)
    res.json(await searchCityCatalog(db, q))
  })

  router.get('/:slug', async (req, res) => {
    const slug = String(req.params.slug)
    try {
      const city = await db.city.findUnique({
        where: { slug },
        include: {
          experiences: { orderBy: { sortOrder: 'asc' } },
        },
      })
      if (city) {
        return res.json({
          city: {
            ...summarizeCity(city, city.experiences),
            experiences: city.experiences.map(serializeExperience),
          },
        })
      }
      if (await db.city.count() > 0) {
        return res.status(404).json({
          error: { code: 'CITY_NOT_FOUND', message: 'Şehir bulunamadı' },
        })
      }
    } catch {
      // Aşağıdaki statik katalog cevabına düş.
    }

    const fallback = staticCityDetail(slug)
    if (!fallback) {
      return res.status(404).json({
        error: { code: 'CITY_NOT_FOUND', message: 'Şehir bulunamadı' },
      })
    }
    return res.json({ city: fallback })
  })

  router.get('/:slug/experiences', async (req, res) => {
    const slug = String(req.params.slug)
    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    try {
      const city = await db.city.findUnique({
        where: { slug },
        include: {
          experiences: {
            where: category ? { category } : undefined,
            orderBy: { sortOrder: 'asc' },
          },
        },
      })
      if (city) {
        return res.json({
          slug: city.slug,
          experiences: city.experiences.map(serializeExperience),
        })
      }
      if (await db.city.count() > 0) {
        return res.status(404).json({
          error: { code: 'CITY_NOT_FOUND', message: 'Şehir bulunamadı' },
        })
      }
    } catch {
      // Statik fallback.
    }

    const fallback = staticCityDetail(slug)
    if (!fallback) {
      return res.status(404).json({
        error: { code: 'CITY_NOT_FOUND', message: 'Şehir bulunamadı' },
      })
    }
    return res.json({
      slug: fallback.slug,
      experiences: category
        ? fallback.experiences.filter((experience) => experience.category === category)
        : fallback.experiences,
    })
  })

  // Katalog sürümünü ve kapsamını teşhis etmek için küçük bir meta endpoint'i.
  router.get('/_meta/count', async (_req, res) => {
    const staticCityCount = CITY_CATALOG.length
    const staticExperienceCount = CITY_CATALOG.reduce((sum, city) => sum + city.experiences.length, 0)
    try {
      const [cityCount, experienceCount] = await Promise.all([
        db.city.count(),
        db.cityExperience.count(),
      ])
      return res.json({ cities: cityCount, experiences: experienceCount, staticCityCount, staticExperienceCount })
    } catch {
      return res.json({ cities: 0, experiences: 0, staticCityCount, staticExperienceCount })
    }
  })

  return router
}
