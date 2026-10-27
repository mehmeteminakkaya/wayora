import { Router } from 'express'
import type { RequestHandler } from 'express'
import { z } from 'zod'
import type { Config } from '../config.ts'
import { findCandidates } from '../data/places.ts'
import { ACTIVITY_CATEGORIES } from '../domain.ts'
import { toNumber } from '../lib/serialize.ts'
import type { Db } from '../lib/prisma.ts'
import { serializeTrip } from '../lib/trip-serializer.ts'
import { requireAuth } from '../middleware/auth.ts'
import { HttpError, parseOrThrow } from '../middleware/error.ts'
import { dayCount, generateItinerary, type ItineraryPreferences } from '../services/itinerary.ts'

const tripInclude = {
  days: {
    orderBy: { dayIndex: 'asc' },
    include: {
      activities: {
        orderBy: { order: 'asc' },
        include: { place: true },
      },
    },
  },
} as const

const dateOnly = z.coerce.date()
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

const createTripSchema = z
  .object({
    title: z.string().trim().min(1, 'Başlık gerekli').max(120),
    destination: z.string().trim().min(2, 'Destinasyon gerekli').max(120),
    startDate: dateOnly,
    endDate: dateOnly,
    budget: z.coerce.number().positive().max(1_000_000).nullable().optional(),
    currency: z.string().trim().length(3).toUpperCase().default('EUR'),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.endDate < value.startDate) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'Bitiş tarihi başlangıçtan önce olamaz' })
      return
    }
    if (dayCount(value.startDate, value.endDate) > 21) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'Bir gezi en fazla 21 gün olabilir' })
    }
  })

const updateTripSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    budget: z.coerce.number().positive().max(1_000_000).nullable().optional(),
    currency: z.string().trim().length(3).toUpperCase().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Güncellenecek en az bir alan gerekli')

const createActivitySchema = z.object({
  title: z.string().trim().min(1, 'Aktivite başlığı gerekli').max(200),
  category: z.enum(ACTIVITY_CATEGORIES).default('other'),
  startTime: z.string().regex(timePattern, 'Saat SS:DD biçiminde olmalı').nullable().optional(),
  endTime: z.string().regex(timePattern, 'Saat SS:DD biçiminde olmalı').nullable().optional(),
  estimatedCost: z.coerce.number().min(0).max(100_000).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  placeId: z.string().uuid().nullable().optional(),
})

const updateActivitySchema = createActivitySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Güncellenecek en az bir alan gerekli')

function utcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

function buildDays(startDate: Date, endDate: Date) {
  const total = Math.min(21, dayCount(startDate, endDate))
  return Array.from({ length: total }, (_, index) => {
    const date = new Date(startDate)
    date.setUTCDate(date.getUTCDate() + index)
    return { dayIndex: index + 1, date }
  })
}

function serializeActivity(activity: {
  id: string
  tripDayId: string
  order: number
  title: string
  category: string
  startTime: string | null
  endTime: string | null
  estimatedCost: unknown
  placeId: string | null
  notes: string | null
}) {
  return {
    id: activity.id,
    tripDayId: activity.tripDayId,
    order: activity.order,
    title: activity.title,
    category: activity.category,
    startTime: activity.startTime,
    endTime: activity.endTime,
    estimatedCost: toNumber(activity.estimatedCost),
    placeId: activity.placeId,
    notes: activity.notes,
  }
}

export function tripRouter({
  db,
  config,
  generateLimiter,
}: {
  db: Db
  config: Config
  generateLimiter?: RequestHandler
}) {
  const router = Router()
  router.use(requireAuth({ secret: config.JWT_SECRET, cookieName: config.COOKIE_NAME }))

  router.get('/', async (req, res) => {
    const trips = await db.trip.findMany({
      where: { userId: req.userId! },
      include: tripInclude,
      orderBy: { startDate: 'asc' },
    })
    res.json({ trips: trips.map(serializeTrip) })
  })

  router.post('/', async (req, res) => {
    const input = parseOrThrow(createTripSchema, req.body)
    const startDate = utcDay(input.startDate)
    const endDate = utcDay(input.endDate)

    const trip = await db.trip.create({
      data: {
        userId: req.userId!,
        title: input.title,
        destination: input.destination,
        startDate,
        endDate,
        budget: input.budget ?? null,
        currency: input.currency,
        notes: input.notes ?? null,
        days: { create: buildDays(startDate, endDate) },
      },
      include: tripInclude,
    })

    res.status(201).json({ trip: serializeTrip(trip) })
  })

  router.get('/:id', async (req, res) => {
    const trip = await db.trip.findFirst({
      where: { id: String(req.params.id), userId: req.userId! },
      include: tripInclude,
    })
    if (!trip) throw new HttpError(404, 'NOT_FOUND', 'Gezi bulunamadı')
    res.json({ trip: serializeTrip(trip) })
  })

  router.patch('/:id', async (req, res) => {
    const input = parseOrThrow(updateTripSchema, req.body)
    const result = await db.trip.updateMany({
      where: { id: String(req.params.id), userId: req.userId! },
      data: input,
    })
    if (result.count === 0) throw new HttpError(404, 'NOT_FOUND', 'Gezi bulunamadı')

    const trip = await db.trip.findFirst({
      where: { id: String(req.params.id), userId: req.userId! },
      include: tripInclude,
    })
    res.json({ trip: serializeTrip(trip!) })
  })

  router.delete('/:id', async (req, res) => {
    const result = await db.trip.deleteMany({
      where: { id: String(req.params.id), userId: req.userId! },
    })
    if (result.count === 0) throw new HttpError(404, 'NOT_FOUND', 'Gezi bulunamadı')
    res.status(204).end()
  })

  router.post('/:id/generate', ...(generateLimiter ? [generateLimiter] : []), async (req, res) => {
    const trip = await db.trip.findFirst({
      where: { id: String(req.params.id), userId: req.userId! },
      include: { days: true },
    })
    if (!trip) throw new HttpError(404, 'NOT_FOUND', 'Gezi bulunamadı')

    const preference = await db.preference.findUnique({ where: { userId: req.userId! } })
    const preferences: ItineraryPreferences = {
      interests: preference?.interests ?? [],
      budgetLevel: preference?.budgetLevel ?? 'mid',
      travelStyle: preference?.travelStyle ?? 'balanced',
      pace: preference?.pace ?? 'moderate',
    }

    const candidates = findCandidates(trip.destination)
    await db.trip.update({ where: { id: trip.id }, data: { status: 'generating' } })

    try {
      const { plan, meta } = await generateItinerary(
        {
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          budget: toNumber(trip.budget),
          notes: trip.notes,
          preferences,
        },
        candidates,
        config,
      )

      const placeIds = new Set(
        plan.days
          .flatMap((day) => day.activities)
          .map((activity) => activity.googlePlaceId)
          .filter((value): value is string => value !== null),
      )

      const updated = await db.$transaction(async (tx) => {
        await tx.activity.deleteMany({ where: { tripDay: { tripId: trip.id } } })
        await tx.tripDay.deleteMany({
          where: { tripId: trip.id, dayIndex: { gt: plan.days.length } },
        })

        const placeIdByGoogleId = new Map<string, string>()
        for (const candidate of candidates) {
          if (!placeIds.has(candidate.googlePlaceId)) continue
          const place = await tx.place.upsert({
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
          placeIdByGoogleId.set(candidate.googlePlaceId, place.id)
        }

        for (const day of plan.days) {
          const dayRecord = await tx.tripDay.upsert({
            where: { tripId_dayIndex: { tripId: trip.id, dayIndex: day.dayIndex } },
            create: { tripId: trip.id, dayIndex: day.dayIndex, date: new Date(day.date) },
            update: { date: new Date(day.date) },
          })

          await tx.activity.createMany({
            data: day.activities.map((activity, index) => ({
              tripDayId: dayRecord.id,
              order: index,
              title: activity.title,
              category: activity.category,
              startTime: activity.startTime,
              endTime: activity.endTime,
              estimatedCost: activity.estimatedCost,
              placeId: activity.googlePlaceId
                ? (placeIdByGoogleId.get(activity.googlePlaceId) ?? null)
                : null,
            })),
          })
        }

        return tx.trip.update({
          where: { id: trip.id },
          data: { status: 'planned', tips: plan.tips },
          include: tripInclude,
        })
      })

      res.json({ trip: serializeTrip(updated), meta })
    } catch (error) {
      await db.trip.update({ where: { id: trip.id }, data: { status: 'failed' } })
      console.error('[generate] plan oluşturulamadı:', error)
      throw new HttpError(502, 'AI_FAILED', 'Gezi planı oluşturulamadı, lütfen tekrar deneyin')
    }
  })

  router.post('/:tripId/days/:dayId/activities', async (req, res) => {
    const input = parseOrThrow(createActivitySchema, req.body)
    const day = await db.tripDay.findFirst({
      where: {
        id: String(req.params.dayId),
        tripId: String(req.params.tripId),
        trip: { userId: req.userId! },
      },
    })
    if (!day) throw new HttpError(404, 'NOT_FOUND', 'Gün bulunamadı')

    const count = await db.activity.count({ where: { tripDayId: day.id } })
    const activity = await db.activity.create({
      data: {
        tripDayId: day.id,
        order: count,
        title: input.title,
        category: input.category,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        estimatedCost: input.estimatedCost ?? null,
        notes: input.notes ?? null,
        placeId: input.placeId ?? null,
      },
    })

    res.status(201).json({ activity: serializeActivity(activity) })
  })

  return router
}

export function activityRouter({ db, config }: { db: Db; config: Config }) {
  const router = Router()
  router.use(requireAuth({ secret: config.JWT_SECRET, cookieName: config.COOKIE_NAME }))

  router.patch('/:id', async (req, res) => {
    const input = parseOrThrow(updateActivitySchema, req.body)
    const existing = await db.activity.findFirst({
      where: { id: String(req.params.id), tripDay: { trip: { userId: req.userId! } } },
    })
    if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Aktivite bulunamadı')

    const activity = await db.activity.update({
      where: { id: existing.id },
      data: input,
    })
    res.json({ activity: serializeActivity(activity) })
  })

  router.delete('/:id', async (req, res) => {
    const result = await db.activity.deleteMany({
      where: { id: String(req.params.id), tripDay: { trip: { userId: req.userId! } } },
    })
    if (result.count === 0) throw new HttpError(404, 'NOT_FOUND', 'Aktivite bulunamadı')
    res.status(204).end()
  })

  return router
}
