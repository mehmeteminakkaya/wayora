import { Router } from 'express'
import type { Config } from '../config.ts'
import { searchCatalog } from '../data/places.ts'
import type { Db } from '../lib/prisma.ts'
import { requireAuth } from '../middleware/auth.ts'
import { HttpError } from '../middleware/error.ts'

export function placeRouter({ db, config }: { db: Db; config: Config }) {
  const router = Router()
  router.use(requireAuth({ secret: config.JWT_SECRET, cookieName: config.COOKIE_NAME }))

  router.get('/search', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : ''
    const destination = typeof req.query.destination === 'string' ? req.query.destination : undefined
    const candidates = searchCatalog(query, destination)

    const places = []
    for (const candidate of candidates) {
      const place = await db.place.upsert({
        where: { googlePlaceId: candidate.googlePlaceId },
        create: {
          googlePlaceId: candidate.googlePlaceId,
          name: candidate.name,
          lat: candidate.lat,
          lng: candidate.lng,
          address: candidate.address,
          rating: candidate.rating,
          types: candidate.types,
        },
        update: {
          name: candidate.name,
          lat: candidate.lat,
          lng: candidate.lng,
          address: candidate.address,
          rating: candidate.rating,
          types: candidate.types,
        },
      })
      places.push({
        id: place.id,
        googlePlaceId: place.googlePlaceId,
        name: place.name,
        lat: place.lat,
        lng: place.lng,
        address: place.address,
        rating: place.rating,
        types: place.types,
        category: candidate.category,
        estimatedCost: candidate.estimatedCost,
      })
    }

    res.json({ places })
  })

  router.get('/:googlePlaceId', async (req, res) => {
    const googlePlaceId = decodeURIComponent(String(req.params.googlePlaceId))
    const place = await db.place.findUnique({ where: { googlePlaceId } })
    if (!place) throw new HttpError(404, 'NOT_FOUND', 'Yer bulunamadı')
    res.json({ place })
  })

  return router
}
