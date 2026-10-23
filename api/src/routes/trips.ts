import { Router } from 'express'
import { z } from 'zod'
import { dayCount, isValidDay, tripDays } from '../lib/dates.ts'
import { parseBody } from '../lib/validation.ts'
import { currentUserId } from '../middleware/auth.ts'
import { HttpError } from '../middleware/error.ts'
import type { Store } from '../store/types.ts'

export const MAX_TRIP_DAYS = 30

const day = (label: string) =>
  z
    .string({ error: `${label} zorunlu` })
    .refine(isValidDay, { error: `${label} geçerli bir tarih olmalı` })

const newTripSchema = z
  .object({
    destination: z
      .string({ error: 'Destinasyon zorunlu' })
      .trim()
      .min(2, { error: 'Destinasyon en az 2 karakter olmalı' })
      .max(100, { error: 'Destinasyon en fazla 100 karakter olabilir' }),
    title: z.string().trim().max(100, { error: 'Başlık en fazla 100 karakter olabilir' }).optional(),
    startDate: day('Başlangıç tarihi'),
    endDate: day('Bitiş tarihi'),
    budget: z
      .number({ error: 'Bütçe sayı olmalı' })
      .int({ error: 'Bütçe tam sayı olmalı' })
      .positive({ error: 'Bütçe sıfırdan büyük olmalı' })
      .max(10_000_000, { error: 'Bütçe çok büyük' })
      .nullish()
      .transform((b) => b ?? null),
    currency: z.enum(['TRY', 'EUR', 'USD'], { error: 'Geçersiz para birimi' }).default('TRY'),
  })
  // Tarih kuralları ancak iki tarih de geçerliyse kontrol edilir
  .superRefine((t, ctx) => {
    if (!isValidDay(t.startDate) || !isValidDay(t.endDate)) return
    if (t.endDate < t.startDate) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'Bitiş tarihi başlangıçtan önce olamaz' })
    } else if (dayCount(t.startDate, t.endDate) > MAX_TRIP_DAYS) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: `Gezi en fazla ${MAX_TRIP_DAYS} gün olabilir` })
    }
  })
  .transform(({ title, ...t }) => ({ ...t, title: title || t.destination }))

export const tripNotFound = () => new HttpError(404, 'TRIP_NOT_FOUND', 'Gezi bulunamadı')

// requireAuth'tan sonra bağlanır (app.ts)
export function tripsRouter(store: Store) {
  const router = Router()

  router.post('/', async (req, res) => {
    const input = parseBody(newTripSchema, req.body)
    const trip = await store.trips.create(currentUserId(res), input, tripDays(input.startDate, input.endDate))
    res.status(201).json({ trip })
  })

  router.get('/:tripId', async (req, res) => {
    const trip = await store.trips.findForUser(currentUserId(res), req.params.tripId)
    if (!trip) throw tripNotFound()
    res.json({ trip })
  })

  return router
}
