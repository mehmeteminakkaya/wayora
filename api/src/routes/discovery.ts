import { Router } from 'express'
import { z } from 'zod'
import type { Config } from '../config.ts'
import { requireAuth } from '../middleware/auth.ts'
import { HttpError, parseOrThrow } from '../middleware/error.ts'
import {
  resolveAirportCode,
  searchDuffelFlights,
  type FlightSearchResult,
} from '../services/duffel.ts'
import {
  searchTicketmasterEvents,
  type EventOffer,
} from '../services/ticketmaster.ts'

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-MM-DD biçiminde olmalı')

const eventsQuerySchema = z
  .object({
    city: z.string().trim().min(2, 'Şehir adı en az 2 karakter olmalı').max(80),
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: 'Başlangıç tarihi bitiş tarihinden sonra olamaz',
    path: ['endDate'],
  })
  .refine(
    (value) =>
      Date.parse(`${value.endDate}T00:00:00Z`) - Date.parse(`${value.startDate}T00:00:00Z`) <=
      90 * 24 * 60 * 60 * 1000,
    { message: 'Etkinlik aralığı en fazla 90 gün olabilir', path: ['endDate'] },
  )

const flightsQuerySchema = z.object({
  origin: z.string().trim().min(2).max(80),
  destination: z.string().trim().min(2).max(80),
  departureDate: dateSchema,
  returnDate: dateSchema.optional(),
  adults: z.coerce.number().int().min(1).max(9).default(1),
  cabin: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
})

export function discoveryRouter({ config }: { config: Config }) {
  const router = Router()

  router.get('/status', (_req, res) => {
    res.json({
      providers: {
        ticketmaster: config.TICKETMASTER_API_KEY ? 'configured' : 'missing',
        duffel: config.DUFFEL_ACCESS_TOKEN ? 'configured' : 'missing',
      },
    })
  })

  // Etkinlik keşfi herkese açıktır. API anahtarı yalnızca sunucuda kalır.
  router.get('/events', async (req, res) => {
    const query = parseOrThrow(eventsQuerySchema, req.query)
    if (!config.TICKETMASTER_API_KEY) {
      throw new HttpError(
        503,
        'TICKETMASTER_NOT_CONFIGURED',
        'Canlı etkinlikler için TICKETMASTER_API_KEY tanımlanmalı.',
      )
    }

    const events: EventOffer[] = await searchTicketmasterEvents({
      apiKey: config.TICKETMASTER_API_KEY,
      city: query.city,
      startDate: query.startDate,
      endDate: query.endDate,
      timeoutMs: config.DISCOVERY_TIMEOUT_MS,
    })
    res.json({ events, provider: 'ticketmaster' })
  })

  // Uçuş araması kullanıcıya bağlı ve dış maliyeti olan bir işlemdir.
  router.get(
    '/flights',
    requireAuth({ secret: config.JWT_SECRET, cookieName: config.COOKIE_NAME }),
    async (req, res) => {
      const query = parseOrThrow(flightsQuerySchema, req.query)
      if (!config.DUFFEL_ACCESS_TOKEN) {
        throw new HttpError(
          503,
          'DUFFEL_NOT_CONFIGURED',
          'Canlı uçuş aramaları için DUFFEL_ACCESS_TOKEN tanımlanmalı.',
        )
      }

      const origin = resolveAirportCode(query.origin)
      const destination = resolveAirportCode(query.destination)
      if (!origin || !destination) {
        throw new HttpError(
          400,
          'AIRPORT_NOT_FOUND',
          'Kalkış ve varış için şehir adı veya 3 harfli havalimanı kodu kullan.',
        )
      }
      if (origin === destination) {
        throw new HttpError(400, 'SAME_AIRPORT', 'Kalkış ve varış aynı olamaz.')
      }
      if (query.returnDate && query.returnDate < query.departureDate) {
        throw new HttpError(400, 'INVALID_DATE_RANGE', 'Dönüş tarihi gidişten önce olamaz.')
      }

      const result: FlightSearchResult = await searchDuffelFlights({
        token: config.DUFFEL_ACCESS_TOKEN,
        origin,
        destination,
        departureDate: query.departureDate,
        returnDate: query.returnDate,
        adults: query.adults,
        cabin: query.cabin,
        timeoutMs: config.DISCOVERY_TIMEOUT_MS,
      })
      res.json({
        ...result,
        provider: 'duffel',
        origin,
        destination,
        disclaimer:
          result.mode === 'test'
            ? 'Duffel test modu: fiyatlar gerçek değildir, rezervasyon oluşturulmaz.'
            : 'Fiyatlar sağlayıcıda rezervasyon anında değişebilir.',
      })
    },
  )

  return router
}
