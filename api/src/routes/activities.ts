import { Router } from 'express'
import { z } from 'zod'
import { parseBody } from '../lib/validation.ts'
import { currentUserId } from '../middleware/auth.ts'
import { HttpError } from '../middleware/error.ts'
import type { Store } from '../store/types.ts'

const CATEGORIES = ['SIGHTSEEING', 'MUSEUM', 'FOOD', 'NATURE', 'SHOPPING', 'NIGHTLIFE', 'TRANSPORT', 'OTHER'] as const

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: 'Saat SS:DD biçiminde olmalı (örn. 09:30)' })
  .nullish()
  .transform((t) => t || null)

const newActivitySchema = z
  .object({
    title: z
      .string({ error: 'Aktivite adı zorunlu' })
      .trim()
      .min(2, { error: 'Aktivite adı en az 2 karakter olmalı' })
      .max(100, { error: 'Aktivite adı en fazla 100 karakter olabilir' }),
    category: z.enum(CATEGORIES, { error: 'Geçersiz kategori' }).default('OTHER'),
    startTime: time,
    endTime: time,
    estimatedCost: z
      .number({ error: 'Tahmini maliyet sayı olmalı' })
      .int({ error: 'Tahmini maliyet tam sayı olmalı' })
      .min(0, { error: 'Tahmini maliyet negatif olamaz' })
      .max(10_000_000, { error: 'Tahmini maliyet çok büyük' })
      .nullish()
      .transform((c) => c ?? null),
    notes: z
      .string()
      .trim()
      .max(500, { error: 'Not en fazla 500 karakter olabilir' })
      .nullish()
      .transform((n) => n || null),
  })
  // 'HH:MM' metinleri sözlük sırasıyla karşılaştırılabilir
  .refine((a) => !a.startTime || !a.endTime || a.endTime > a.startTime, {
    path: ['endTime'],
    error: 'Bitiş saati başlangıçtan sonra olmalı',
  })

// requireAuth'tan sonra /api/trips/:tripId altına bağlanır (app.ts)
export function activitiesRouter(store: Store) {
  const router = Router({ mergeParams: true })

  router.post('/days/:dayId/activities', async (req, res) => {
    const { tripId, dayId } = req.params as { tripId: string; dayId: string }
    const input = parseBody(newActivitySchema, req.body)
    const activity = await store.trips.addActivity(currentUserId(res), tripId, dayId, input)
    if (!activity) throw new HttpError(404, 'DAY_NOT_FOUND', 'Gezi günü bulunamadı')
    res.status(201).json({ activity })
  })

  router.delete('/activities/:activityId', async (req, res) => {
    const { tripId, activityId } = req.params as { tripId: string; activityId: string }
    if (!(await store.trips.deleteActivity(currentUserId(res), tripId, activityId))) {
      throw new HttpError(404, 'ACTIVITY_NOT_FOUND', 'Aktivite bulunamadı')
    }
    res.status(204).end()
  })

  return router
}
